
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './use-user';
import { toast } from 'sonner';

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

  const isPreviewMode = () => {
    return !user || user.id.toString().startsWith('sample-');
  };

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

  useEffect(() => {
    const fetchStudyRooms = async () => {
      try {
        setLoading(true);
        
        if (isPreviewMode()) {
          console.log('Preview mode detected, generating sample study rooms');
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

        const processedRooms = data?.map(room => {
          return {
            ...room,
            topic: room.description || 'General Study',
            is_active: true,
            subjects: [],
            participant_count: room.participants?.length || 0,
            schedule: null,
            duration: null
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

    if (!isPreviewMode()) {
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
              fetchStudyRooms();
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

  const createRoom = async (data: CreateRoomData) => {
    if (!user?.id) {
      toast.error('You need to be logged in to create a study room');
      return null;
    }
    
    try {
      if (isPreviewMode()) {
        console.log('Preview mode detected, creating sample study room');
        const sampleRoom = generateSampleRoom(data);
        
        setRooms(prevRooms => [sampleRoom, ...prevRooms]);
        
        toast.success('Study room created successfully!');
        return sampleRoom;
      }
      
      if (!data.name.trim()) {
        throw new Error('Room name is required');
      }
      
      if (!data.topic.trim()) {
        throw new Error('Room topic is required');
      }
      
      const subjectsData = Array.isArray(data.subjects) ? data.subjects : [];
      
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Use only the columns that exist in the study_rooms table
      const roomData = {
        name: data.name.trim(),
        description: data.description?.trim() || data.topic.trim(),
        creator_id: user.id,
        is_private: false,
        max_participants: data.max_participants || 10,
        room_code: roomCode
      };
      
      console.log('Creating room with data:', roomData);
      
      const { data: createdRoom, error: roomError } = await supabase
        .from('study_rooms')
        .insert(roomData)
        .select()
        .single();

      if (roomError) {
        console.error('Supabase error creating room:', roomError);
        throw roomError;
      }
      
      if (!createdRoom) {
        throw new Error('Failed to create room: No data returned');
      }

      console.log('Room created successfully:', createdRoom);
      toast.success('Study room created successfully!');
      
      const joinSuccess = await joinRoomInternal(createdRoom.id, user.id);
      
      if (!joinSuccess) {
        console.warn('Created room but failed to join automatically as creator');
      }

      return createdRoom;
    } catch (err: any) {
      console.error('Error creating study room:', err);
      
      let errorMessage = 'Failed to create study room';
      if (err?.message) {
        if (err.message.includes('duplicate key')) {
          errorMessage = 'A study room with this name already exists';
        } else if (err.message.includes('violates foreign key constraint')) {
          errorMessage = 'Invalid user account';
        } else {
          errorMessage = err.message;
        }
      } else if (err?.code) {
        errorMessage = `Database error (${err.code})`;
      }
      
      toast.error(errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
      return null;
    }
  };

  const joinRoomInternal = async (roomId: string, userId: string) => {
    try {
      console.log(`Attempting to join room ${roomId} for user ${userId}`);
      
      const { data: existingParticipant, error: checkError } = await supabase
        .from('study_room_participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing participant:', checkError);
        return false;
      }

      if (existingParticipant) {
        const { error: updateError } = await supabase
          .from('study_room_participants')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', existingParticipant.id);

        if (updateError) {
          console.error('Error updating participant timestamp:', updateError);
          return false;
        }
        
        return true;
      }

      const { error: joinError } = await supabase
        .from('study_room_participants')
        .insert({
          room_id: roomId,
          user_id: userId,
          joined_at: new Date().toISOString(),
          last_active_at: new Date().toISOString()
        });

      if (joinError) {
        console.error('Error joining room:', joinError);
        return false;
      }

      try {
        // Call the new edge function to increment participant count
        const session = await supabase.auth.getSession();
        const accessToken = session.data.session?.access_token;
        
        if (!accessToken) {
          console.error('No access token available');
          return false;
        }
        
        const response = await fetch(
          `${window.location.origin}/.netlify/functions/increment_room_participants`, 
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ room_id: roomId })
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error calling increment_room_participants:', errorData);
          return false;
        }
      } catch (error) {
        console.error('Error calling increment_room_participants:', error);
        // Don't fail the whole join process if just the counter fails
      }

      return true;
    } catch (err) {
      console.error('Error in joinRoomInternal:', err);
      return false;
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!user?.id) {
      toast.error('You need to be logged in to join a study room');
      return false;
    }

    try {
      if (isPreviewMode()) {
        console.log('Preview mode detected, joining sample study room');
        
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
      
      const success = await joinRoomInternal(roomId, user.id);
      
      if (success) {
        toast.success('Joined study room!');
      } else {
        toast.error('Failed to join study room');
      }
      
      return success;
    } catch (err) {
      console.error('Error joining study room:', err);
      toast.error('Failed to join study room. Please try again.');
      return false;
    }
  };

  const leaveRoom = async (roomId: string) => {
    if (!user?.id) return false;

    try {
      if (isPreviewMode()) {
        console.log('Preview mode detected, leaving sample study room');
        
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

      try {
        // Call edge function to decrement participant count
        const session = await supabase.auth.getSession();
        const accessToken = session.data.session?.access_token;
        
        if (accessToken) {
          await fetch(
            `${window.location.origin}/.netlify/functions/decrement_room_participants`, 
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ room_id: roomId })
            }
          );
        }
      } catch (error) {
        console.error('Error calling decrement_room_participants:', error);
        // Don't fail the leave process if just the counter fails
      }

      toast.success('Left study room');
      return true;
    } catch (err) {
      console.error('Error leaving study room:', err);
      toast.error('Failed to leave the study room');
      return false;
    }
  };

  const getRoomById = (roomId: string) => {
    return rooms.find(room => room.id === roomId) || null;
  };

  const getUserRooms = () => {
    if (!user?.id) return [];
    return rooms.filter(room => room.creator_id === user.id);
  };

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
