
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './use-user';
import { toast } from 'sonner';

interface RoomMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export function useRoomMessages(roomId: string) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useUser();

  // Load initial messages
  useEffect(() => {
    if (!roomId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('room_messages')
          .select(`
            *,
            sender:sender_id(id, username, avatar_url)
          `)
          .eq('room_id', roomId)
          .order('created_at');

        if (error) throw error;

        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching room messages:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch room messages'));
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`room_${roomId}_messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log('New room message received:', payload);
          
          // Fetch the sender details
          const { data: senderData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();

          const newMessage = {
            ...payload.new,
            sender: senderData || undefined,
          } as RoomMessage;
          
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Function to send a message
  const sendMessage = async (content: string) => {
    if (!user?.id || !roomId) {
      toast.error('Unable to send message');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('room_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          content,
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

  return {
    messages,
    loading,
    error,
    sendMessage,
  };
}
