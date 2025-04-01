
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './use-user';
import { toast } from 'sonner';

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
  
  // Load initial messages
  useEffect(() => {
    if (!user?.id) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (messagesError) throw messagesError;
        
        setMessages(messagesData || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user?.id]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user?.id) return;

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
      .subscribe();
    
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
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [user?.id]);

  // Function to send a message - simplified to not rely on conversation_id
  const sendMessage = async (recipientId: string, content: string) => {
    if (!user?.id) {
      toast.error('You need to be logged in to send messages');
      return null;
    }

    try {
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

      if (error) throw error;
      
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
  const getConversation = async (otherUserId: string) => {
    if (!user?.id) return [];
    
    // Simple filter to get messages between two users
    return messages
      .filter(msg => 
        (msg.sender_id === user.id && msg.recipient_id === otherUserId) ||
        (msg.sender_id === otherUserId && msg.recipient_id === user.id)
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
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
    isUserTyping
  };
}
