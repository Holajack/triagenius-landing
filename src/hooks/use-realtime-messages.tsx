
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './use-user';
import { toast } from 'sonner';
import { sendNotification } from '@/components/pwa/ServiceWorker';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

interface TypingState {
  [userId: string]: {
    isTyping: boolean;
    timeout: NodeJS.Timeout | null;
  };
}

export function useRealtimeMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useUser();
  const messagesChannelRef = useRef<any>(null);
  const typingStatesRef = useRef<TypingState>({});
  const [typingUsers, setTypingUsers] = useState<{[userId: string]: boolean}>({});
  
  // Load initial messages
  useEffect(() => {
    if (!user?.id) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        // Enable realtime for messages table using our edge function
        try {
          await supabase.functions.invoke('enable_realtime_for_table', {
            body: { table_name: 'messages' }
          });
          console.log('Realtime enabled for messages table');
        } catch (err) {
          console.error('Failed to enable realtime:', err);
        }
        
        // First, fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (messagesError) throw messagesError;
        
        // Then, for each message, fetch the sender profile
        const messagesWithSenders: Message[] = [];
        
        for (const msg of messagesData || []) {
          // Fetch sender profile
          const { data: senderData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', msg.sender_id)
            .maybeSingle();
            
          messagesWithSenders.push({
            ...msg,
            sender: senderData || undefined
          } as Message);
        }
        
        setMessages(messagesWithSenders);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user?.id]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    // Create and subscribe to messages channel
    const setupMessagesChannel = () => {
      // Clean up existing channel if it exists
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
      }
      
      // Make sure the messages table has REPLICA IDENTITY set using our edge function
      try {
        supabase.functions.invoke('enable_realtime_for_table', {
          body: { table_name: 'messages' }
        }).then(() => {
          console.log('Realtime enabled for messages table');
        }).catch(err => {
          console.error('Failed to enable realtime:', err);
        });
      } catch (err) {
        console.error('Failed to invoke function:', err);
      }
      
      messagesChannelRef.current = supabase
        .channel('messages-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${user.id}`,
          },
          async (payload) => {
            console.log('New message received:', payload);
            
            // Fetch the sender details
            const { data: senderData } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .eq('id', payload.new.sender_id)
              .maybeSingle();

            const newMessage = {
              ...payload.new,
              sender: senderData || undefined,
            } as Message;
            
            setMessages((prev) => [newMessage, ...prev]);
            
            // Show notification for new message
            if (Notification.permission === 'granted' && payload.new.recipient_id === user.id) {
              sendNotification(
                `New message from ${senderData?.username || 'Someone'}`, 
                {
                  body: payload.new.content,
                  data: { url: `/community/chat/${payload.new.sender_id}` }
                }
              );
            }
            
            toast.success(`New message from ${senderData?.username || 'Someone'}`);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            console.log('Message updated:', payload);
            
            setMessages((prev) =>
              prev.map((msg) => (msg.id === payload.new.id ? { ...msg, ...payload.new } : msg))
            );
          }
        )
        .subscribe((status) => {
          console.log(`Messages channel status: ${status}`);
          
          if (status !== 'SUBSCRIBED') {
            console.warn('Messages channel subscription failed, retrying in 3s...');
            setTimeout(() => {
              if (user?.id) {
                setupMessagesChannel();
              }
            }, 3000);
          }
        });
    };
    
    // Set up presence channel for typing indicators
    const typingChannel = supabase.channel('typing-indicators');
    
    typingChannel
      .on('presence', { event: 'sync' }, () => {
        const newTypingStates: {[userId: string]: boolean} = {};
        const state = typingChannel.presenceState();
        
        Object.keys(state).forEach(presenceKey => {
          const presences = state[presenceKey] as any[];
          presences.forEach(presence => {
            if (presence.isTyping && presence.userId !== user.id) {
              newTypingStates[presence.userId] = true;
            }
          });
        });
        
        setTypingUsers(newTypingStates);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined typing:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left typing:', key, leftPresences);
      })
      .subscribe();
    
    // Initialize messages channel
    setupMessagesChannel();

    return () => {
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
      }
      supabase.removeChannel(typingChannel);
    };
  }, [user?.id]);

  // Function to send a message
  const sendMessage = async (recipientId: string, content: string) => {
    if (!user?.id) {
      toast.error('You need to be logged in to send messages');
      return null;
    }

    try {
      // First check if users are friends
      const { data: friendData, error: friendError } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${recipientId}),and(user_id.eq.${recipientId},friend_id.eq.${user.id})`)
        .maybeSingle();
      
      let areFriends = !!friendData;

      // If not directly in the friends table, check accepted friend requests
      if (!areFriends) {
        const { data: requestData, error: requestError } = await supabase
          .from('friend_requests')
          .select('*')
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
          .eq('status', 'accepted')
          .maybeSingle();
          
        areFriends = !!requestData;
      }

      if (!areFriends) {
        toast.error('You need to be friends with this user to send messages');
        return null;
      }

      // Send the message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Add sender info to the message before adding it to state
      const newMessage = {
        ...data,
        sender: {
          id: user.id,
          username: user.username || '',
          avatar_url: user.avatarUrl,
        },
      } as Message;

      setMessages((prev) => [newMessage, ...prev]);
      
      // Clear typing indicator after sending a message
      setTypingStatus(recipientId, false);
      
      return data;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message. Please try again.');
      return null;
    }
  };

  // Function to set typing status
  const setTypingStatus = (recipientId: string, isTyping: boolean) => {
    if (!user?.id) return;
    
    const typingChannel = supabase.channel('typing-indicators');
    
    if (isTyping) {
      // Set typing indicator
      typingChannel.track({
        userId: user.id,
        recipientId,
        isTyping: true,
        timestamp: new Date().toISOString()
      });
      
      // Auto-clear typing after 3 seconds of inactivity
      if (typingStatesRef.current[recipientId]?.timeout) {
        clearTimeout(typingStatesRef.current[recipientId].timeout!);
      }
      
      typingStatesRef.current[recipientId] = {
        isTyping: true,
        timeout: setTimeout(() => {
          setTypingStatus(recipientId, false);
        }, 3000)
      };
    } else {
      // Clear typing indicator
      typingChannel.track({
        userId: user.id,
        recipientId,
        isTyping: false,
        timestamp: new Date().toISOString()
      });
      
      // Clear timeout
      if (typingStatesRef.current[recipientId]?.timeout) {
        clearTimeout(typingStatesRef.current[recipientId].timeout!);
        typingStatesRef.current[recipientId].timeout = null;
      }
      
      typingStatesRef.current[recipientId] = {
        isTyping: false,
        timeout: null
      };
    }
  };

  // Function to mark a message as read
  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('recipient_id', user?.id);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, is_read: true } : msg))
      );
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  // Get conversation messages between two users
  const getConversation = (otherUserId: string) => {
    return messages.filter(
      (msg) =>
        (msg.sender_id === user?.id && msg.recipient_id === otherUserId) ||
        (msg.sender_id === otherUserId && msg.recipient_id === user?.id)
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  // Check if a user is currently typing
  const isUserTyping = (userId: string) => {
    return !!typingUsers[userId];
  };

  // Get unique conversations (grouped by the other participant)
  const getConversations = () => {
    if (!user?.id) return [];

    const userIds = new Set<string>();
    const conversations: { userId: string; lastMessage: Message }[] = [];

    messages.forEach((msg) => {
      const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      
      if (!userIds.has(otherId)) {
        userIds.add(otherId);
        
        // Find last message with this user
        const lastMessage = messages
          .filter(m => 
            (m.sender_id === user.id && m.recipient_id === otherId) || 
            (m.sender_id === otherId && m.recipient_id === user.id)
          )
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        if (lastMessage) {
          conversations.push({
            userId: otherId,
            lastMessage,
          });
        }
      }
    });

    return conversations;
  };

  // Get unread count
  const getUnreadCount = (fromUserId?: string) => {
    if (!user?.id) return 0;

    const query = messages.filter(
      (msg) => msg.recipient_id === user.id && !msg.is_read
    );

    if (fromUserId) {
      return query.filter((msg) => msg.sender_id === fromUserId).length;
    }

    return query.length;
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    getConversation,
    getConversations,
    getUnreadCount,
    setTypingStatus,
    isUserTyping,
  };
}
