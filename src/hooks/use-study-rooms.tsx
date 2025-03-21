
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

  // Helper function to check if we're in preview/sandbox mode
  const isPreviewMode = () => {
    return !user || user.id.toString().startsWith('sample-');
  };

  // Generate a sample room for preview mode
  const generateSampleRoom = (roomData: Partial<CreateRoomData>): StudyRoom => {
    const randomId = `sample-${Math.random().toString(36).substring(2, 10)}`;
    return {
      id: randomId,
      name: roomData.name || 'Sample Study Room',
      description: roomData.description || roomData.topic || 'This is a sample room for preview mode',
      topic: roomData.topic || 'General Study',
      creator_id: user?.id || 'sample-user',
      is_active: true,
      is_private: false,
      schedule: roomData.schedule || null,
      duration: roomData.duration || null,
      subjects: roomData.subjects || [],
      max_participants: roomData.max_participants || 10,
      current_participants: 1,
      room_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator: {
        id: user?.id || 'sample-user',
        username: user?.username || 'Sample User',
        avatar_url: null
      },
      participant_count: 1,
      participants: [{
        id: randomId,
        user_id: user?.id || 'sample-user',
        room_id: randomId,
        joined_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        user: {
          id: user?.id || 'sample-user',
          username: user?.username || 'Sample User',
          avatar_url: null
        }
      }]
    };
  };

  // Load initial study rooms
  useEffect(() => {
    const fetchStudyRooms = async () => {
      try {
        setLoading(true);
        
        // Check if we're in preview mode
        if (isPreviewMode()) {
          console.log('Preview mode detected, generating sample study rooms');
          // Generate sample rooms for preview mode
          const sampleRooms: StudyRoom[] = [
            generateSampleRoom({
              name: 'Biology Study Group',
              topic: 'Cell Biology',
              subjects: ['Biology', 'Science']
            }),
            generateSampleRoom({
              name: 'Math Problem Solving',
              topic: 'Calculus 2',
              subjects: ['Math', 'Calculus']
            })
          ];
          setRooms(sampleRooms);
          setLoading(false);
          return;
        }
        
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
            // Add subjects as an empty array since the database doesn't have this field yet
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

    // Only set up real-time subscriptions if not in preview mode
    if (!isPreviewMode()) {
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
    }
  }, [user?.id]);

  // Create a new study room
  const createRoom = async (data: CreateRoomData) => {
    if (!user?.id) {
      toast.error('You need to be logged in to create a study room');
      return null;
    }
    
    try {
      // Check if we're in preview mode
      if (isPreviewMode()) {
        console.log('Preview mode detected, creating sample study room');
        const sampleRoom = generateSampleRoom(data);
        
        // Add the new room to the rooms state
        setRooms(prevRooms => [sampleRoom, ...prevRooms]);
        
        toast.success('Study room created successfully!');
        return sampleRoom;
      }
      
      // Convert subjects array to string if needed
      const subjectsData = Array.isArray(data.subjects) ? data.subjects : [];
      
      // Generate a random room code (6 alphanumeric characters)
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Prepare the data for insertion
      const roomData = {
        name: data.name,
        description: data.description || data.topic, // Use topic as fallback for description
        creator_id: user.id,
        is_active: true,
        is_private: false,
        schedule: data.schedule || null,
        duration: data.duration || null,
        subjects: subjectsData,
        max_participants: data.max_participants || 10,
        current_participants: 1, // Creator joins automatically
        room_code: roomCode
      };
      
      console.log('Creating room with data:', roomData);
      
      const { data: createdRoom, error } = await supabase
        .from('study_rooms')
        .insert(roomData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating room:', error);
        throw error;
      }
      
      if (!createdRoom) {
        throw new Error('Failed to create room: No data returned');
      }

      // Join the room automatically as creator
      await joinRoom(createdRoom.id);

      toast.success('Study room created successfully!');
      return createdRoom;
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
      // Check if we're in preview mode
      if (isPreviewMode()) {
        console.log('Preview mode detected, joining sample study room');
        
        // Update the room in state to show this user has joined
        setRooms(prevRooms => 
          prevRooms.map(room => {
            if (room.id === roomId) {
              const isAlreadyParticipant = room.participants?.some(p => p.user_id === user.id);
              
              if (!isAlreadyParticipant) {
                const newParticipant = {
                  id: `sample-${Math.random().toString(36).substring(2, 10)}`,
                  user_id: user.id,
                  room_id: roomId,
                  joined_at: new Date().toISOString(),
                  last_active_at: new Date().toISOString(),
                  user: {
                    id: user.id,
                    username: user.username || 'Current User',
                    avatar_url: user.avatarUrl
                  }
                };
                
                return {
                  ...room,
                  participant_count: (room.participant_count || 0) + 1,
                  participants: [...(room.participants || []), newParticipant]
                };
              }
            }
            return room;
          })
        );
        
        toast.success('Joined study room!');
        return true;
      }
      
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
      // Check if we're in preview mode
      if (isPreviewMode()) {
        console.log('Preview mode detected, leaving sample study room');
        
        // Update the room in state to show this user has left
        setRooms(prevRooms => 
          prevRooms.map(room => {
            if (room.id === roomId) {
              return {
                ...room,
                participant_count: Math.max(0, (room.participant_count || 0) - 1),
                participants: (room.participants || []).filter(p => p.user_id !== user.id)
              };
            }
            return room;
          })
        );
        
        toast.success('Left study room');
        return true;
      }
      
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
