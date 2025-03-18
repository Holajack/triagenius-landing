
import { useState, useEffect, useRef } from 'react';
import { supabase, handleSupabaseError } from '@/integrations/supabase/client';
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
  const channelRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Function to fetch sender profile
  const fetchSenderProfile = async (senderId: string) => {
    try {
      const { data: senderData, error: senderError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', senderId)
        .single();
        
      if (senderError) throw senderError;
      
      return senderData;
    } catch (err) {
      console.error('Error fetching sender profile:', err);
      return null;
    }
  };

  // Load initial messages
  useEffect(() => {
    if (!roomId) return;
    
    let isMounted = true;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First, fetch messages for this room
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at');

        if (messagesError) throw messagesError;
        
        if (!isMounted) return;
        
        // Then, for each message, fetch the sender profile
        const messagesWithSenders: RoomMessage[] = [];
        
        for (const msg of messagesData || []) {
          // Fetch sender profile
          const senderData = await fetchSenderProfile(msg.sender_id);
            
          if (isMounted) {
            messagesWithSenders.push({
              ...msg,
              sender: senderData || undefined
            } as RoomMessage);
          }
        }
        
        if (isMounted) {
          setMessages(messagesWithSenders);
        }
      } catch (err) {
        console.error('Error fetching room messages:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch room messages'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMessages();
    
    // Set up subscription with reconnection logic
    const setupSubscription = () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      
      channelRef.current = supabase
        .channel(`room_${roomId}_messages`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `room_id=eq.${roomId}`,
          },
          async (payload) => {
            console.log('New room message received:', payload);
            
            if (!isMounted) return;
            
            // Reset retry count on successful message
            retryCountRef.current = 0;
            
            // Fetch the sender details
            const senderData = await fetchSenderProfile(payload.new.sender_id);

            if (!isMounted) return;

            const newMessage = {
              ...payload.new,
              sender: senderData || undefined,
            } as RoomMessage;
            
            setMessages((prev) => [...prev, newMessage]);
          }
        )
        .subscribe((status) => {
          if (status !== 'SUBSCRIBED' && isMounted) {
            console.warn(`Channel subscription status: ${status}`);
            
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current += 1;
              setTimeout(() => {
                if (isMounted) {
                  console.log(`Retrying subscription (attempt ${retryCountRef.current})...`);
                  setupSubscription();
                }
              }, 2000 * retryCountRef.current); // Exponential backoff
            } else if (isMounted) {
              toast.error('Could not connect to message service. Please refresh the page.');
            }
          }
        });
    };
    
    setupSubscription();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId]);

  // Function to send a message
  const sendMessage = async (content: string) => {
    if (!user?.id || !roomId) {
      toast.error('Unable to send message');
      return null;
    }

    try {
      setError(null);
      const { data, error } = await supabase
        .from('messages')
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
      setError(err instanceof Error ? err : new Error('Failed to send message'));
      return null;
    }
  };

  // Function to clear any errors
  const clearError = () => setError(null);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearError,
  };
}
