
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './use-user';
import { toast } from 'sonner';
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  conversation_id?: string;
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
  const typingStatesRef = useRef<TypingState>({});
  const [typingUsers, setTypingUsers] = useState<{[userId: string]: boolean}>({});
  
  // Debug log for hook initialization
  console.log("useRealtimeMessages hook initialized", { 
    userPresent: !!user?.id, 
    messagesCount: messages.length 
  });
  
  // Load initial messages
  useEffect(() => {
    if (!user?.id) {
      console.log("No user ID available, skipping message load");
      return;
    }

    const fetchMessages = async () => {
      try {
        console.log("Fetching initial messages");
        setLoading(true);
        
        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          throw messagesError;
        }
        
        console.log(`Loaded ${messagesData?.length || 0} messages`);
        setMessages(messagesData || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
        toast.error('Could not load messages. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user?.id]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user?.id) {
      console.log("No user ID available, skipping realtime subscription");
      return;
    }

    console.log("Setting up realtime message subscription");
    
    // Subscribe to new messages where user is recipient
    const messagesChannel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          setMessages((prev) => [payload.new as Message, ...prev]);
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
        console.log("Messages channel status:", status);
        if (status !== REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          console.error('Failed to subscribe to messages channel:', status);
        }
      });
    
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
      .subscribe((status) => {
        console.log("Typing indicators channel status:", status);
        if (status !== REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          console.error('Failed to subscribe to typing channel:', status);
        }
      });

    return () => {
      console.log("Cleaning up realtime subscriptions");
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [user?.id]);

  // Function to send a message - simplified to not rely on conversation_id
  const sendMessage = async (recipientId: string, content: string) => {
    if (!user?.id) {
      console.error("Cannot send message: User not logged in");
      toast.error('You need to be logged in to send messages');
      return null;
    }

    if (!content.trim()) {
      console.error("Cannot send message: Empty content");
      toast.error('Message cannot be empty');
      return null;
    }

    try {
      console.log(`Sending message to user: ${recipientId}`);
      // Send the message without relying on conversation_id
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        
        if (error.code === '42501') {
          toast.error('Permission denied. Please check if you are logged in.');
        } else if (error.message.includes('foreign key constraint')) {
          toast.error('Invalid recipient. Please try again with a valid user.');
        } else {
          toast.error('Failed to send message. Please try again.');
        }
        
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Error sending message:', err);
      return null;
    }
  };

  // Function to set typing status
  const setTypingStatus = (recipientId: string, isTyping: boolean) => {
    if (!user?.id) return;
    
    const typingChannel = supabase.channel('typing-indicators');
    
    try {
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
      }
    } catch (err) {
      console.error('Error setting typing status:', err);
    }
  };

  // Function to mark a message as read
  const markAsRead = async (messageId: string) => {
    if (!user?.id) return;
    
    try {
      console.log(`Marking message as read: ${messageId}`);
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('recipient_id', user?.id);

      if (error) {
        console.error('Error marking message as read:', error);
        throw error;
      }

      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, is_read: true } : msg))
      );
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  // Get conversation messages between two users
  const getConversation = async (otherUserId: string) => {
    if (!user?.id) {
      console.log("Cannot get conversation: No user ID available");
      return [];
    }
    
    try {
      console.log(`Getting conversation with user: ${otherUserId}`);
      // Simple filter to get messages between two users
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching conversation:', error);
        toast.error('Failed to load conversation');
        return [];
      }
      
      console.log(`Loaded ${data?.length || 0} messages for conversation`);
      return data || [];
    } catch (err) {
      console.error('Error in getConversation:', err);
      toast.error('Failed to load conversation');
      return [];
    }
  };

  // Check if a user is currently typing
  const isUserTyping = (userId: string) => {
    return !!typingUsers[userId];
  };

  // Get unique conversations (grouped by the other participant)
  const getConversations = () => {
    if (!user?.id) {
      console.log("Cannot get conversations: No user ID available");
      return [];
    }

    console.log(`Getting unique conversations from ${messages.length} messages`);
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

    console.log(`Found ${conversations.length} unique conversations`);
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
    isUserTyping
  };
}
