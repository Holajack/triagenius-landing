
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './use-user';
import { toast } from 'sonner';

// Update the StudyRoom interface to match the actual data structure from Supabase
interface StudyRoom {
  id: string;
  name: string;
  description: string | null;
  topic: string;  // This is derived from description if needed
  creator_id: string;
  is_active: boolean;
  is_private: boolean | null;
  schedule: string | null;
  duration: string | null;
  subjects: string[];
  max_participants: number;
  current_participants: number | null;
  room_code: string | null;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  participant_count?: number;
  participants?: Array<{
    id: string;
    user_id: string;
    room_id: string;
    joined_at: string;
    last_active_at: string;
    user: {
      id: string;
      username: string;
      avatar_url: string | null;
    };
  }>;
}

interface CreateRoomData {
  name: string;
  description?: string;
  topic: string;
  schedule?: string;
  duration?: string;
  subjects: string[];
  max_participants?: number;
}

export function useStudyRooms() {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useUser();

  // Load initial study rooms
  useEffect(() => {
    const fetchStudyRooms = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('study_rooms')
          .select(`
            *,
            creator:creator_id(id, username, avatar_url),
            participants:study_room_participants(
              id,
              user_id,
              room_id,
              joined_at,
              last_active_at,
              user:user_id(id, username, avatar_url)
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Process the data to match our StudyRoom interface
        const processedRooms = data?.map(room => {
          // Map the fields from the database to our interface
          return {
            ...room,
            // Use description as topic if we don't have a dedicated topic field
            topic: room.description || 'General Study',
            // Default for fields that might be missing in the database
            is_active: true,
            subjects: [],
            participant_count: room.participants?.length || 0
          } as StudyRoom;
        }) || [];

        setRooms(processedRooms);
      } catch (err) {
        console.error('Error fetching study rooms:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch study rooms'));
      } finally {
        setLoading(false);
      }
    };

    fetchStudyRooms();

    // Subscribe to changes in study rooms
    const roomsChannel = supabase
      .channel('study_rooms_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_rooms',
        },
        (payload) => {
          console.log('Study room change:', payload);
          
          if (payload.eventType === 'INSERT') {
            fetchStudyRooms(); // Refetch all rooms to include relations
          } else if (payload.eventType === 'UPDATE') {
            setRooms(prev => 
              prev.map(room => 
                room.id === payload.new.id ? { ...room, ...payload.new } : room
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setRooms(prev => prev.filter(room => room.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to changes in room participants
    const participantsChannel = supabase
      .channel('room_participants_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_room_participants',
        },
        () => {
          // Refetch to get accurate counts
          fetchStudyRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, []);

  // Create a new study room
  const createRoom = async (data: CreateRoomData) => {
    if (!user?.id) {
      toast.error('You need to be logged in to create a study room');
      return null;
    }

    try {
      const { data: roomData, error } = await supabase
        .from('study_rooms')
        .insert({
          name: data.name,
          description: data.description || null,
          creator_id: user.id,
          max_participants: data.max_participants || 10,
          // Set any other fields that are in the database schema
        })
        .select()
        .single();

      if (error) throw error;

      // Join the room automatically as creator
      await joinRoom(roomData.id);

      toast.success('Study room created successfully!');
      return roomData;
    } catch (err) {
      console.error('Error creating study room:', err);
      toast.error('Failed to create study room. Please try again.');
      return null;
    }
  };

  // Join a study room
  const joinRoom = async (roomId: string) => {
    if (!user?.id) {
      toast.error('You need to be logged in to join a study room');
      return false;
    }

    try {
      // Check if already joined
      const { data: existingParticipant } = await supabase
        .from('study_room_participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingParticipant) {
        // Update last active time
        const { error: updateError } = await supabase
          .from('study_room_participants')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', existingParticipant.id);

        if (updateError) throw updateError;
        return true;
      }

      // Join the room
      const { error } = await supabase
        .from('study_room_participants')
        .insert({
          room_id: roomId,
          user_id: user.id,
        });

      if (error) throw error;

      toast.success('Joined study room!');
      return true;
    } catch (err) {
      console.error('Error joining study room:', err);
      toast.error('Failed to join study room. Please try again.');
      return false;
    }
  };

  // Leave a study room
  const leaveRoom = async (roomId: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('study_room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Left study room');
      return true;
    } catch (err) {
      console.error('Error leaving study room:', err);
      toast.error('Failed to leave the study room');
      return false;
    }
  };

  // Get room by ID
  const getRoomById = (roomId: string) => {
    return rooms.find(room => room.id === roomId) || null;
  };

  // Get rooms created by user
  const getUserRooms = () => {
    if (!user?.id) return [];
    return rooms.filter(room => room.creator_id === user.id);
  };

  // Get rooms the user has joined
  const getJoinedRooms = () => {
    if (!user?.id) return [];
    return rooms.filter(room => 
      room.participants?.some(p => p.user_id === user.id)
    );
  };

  return {
    rooms,
    loading,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    getRoomById,
    getUserRooms,
    getJoinedRooms,
  };
}
