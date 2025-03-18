
import { useState, useEffect } from 'react';
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

export function useRealtimeMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useUser();

  // Load initial messages
  useEffect(() => {
    if (!user?.id) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        
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
            .single();
            
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

  // Subscribe to new messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('messages_changes')
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
            .single();

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Function to send a message
  const sendMessage = async (recipientId: string, content: string) => {
    if (!user?.id) {
      toast.error('You need to be logged in to send messages');
      return null;
    }

    try {
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
      return data;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message. Please try again.');
      return null;
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
  };
}
