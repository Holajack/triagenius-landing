
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/hooks/use-user';

export interface RoomMember {
  id: string;
  user_id: string;
  room_id: string;
  joined_at: string;
  user?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface StudyRoomMemberProps {
  roomId: string;
}

export const StudyRoomMember = ({ roomId }: StudyRoomMemberProps) => {
  const { user } = useUser();
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!roomId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('study_room_participants')
          .select(`
            *,
            user:user_id(id, username, avatar_url)
          `)
          .eq('room_id', roomId);

        if (error) {
          throw error;
        }

        const formattedMembers = (data || []).map(member => ({
          id: member.id,
          user_id: member.user_id,
          room_id: member.room_id,
          joined_at: member.joined_at,
          user: member.user ? {
            id: member.user.id,
            display_name: member.user.username,
            avatar_url: member.user.avatar_url
          } : undefined
        }));

        setMembers(formattedMembers);
      } catch (error) {
        console.error('Error fetching room members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();

    // Subscribe to changes
    const channel = supabase
      .channel(`room_members_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_room_participants',
          filter: `room_id=eq.${roomId}`,
        },
        fetchMembers
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Members</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {members.length === 0 ? (
              <div className="text-center py-2 text-sm text-muted-foreground">
                No members in this room yet
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"
                >
                  <Avatar className="h-8 w-8">
                    {member.user?.avatar_url ? (
                      <AvatarImage src={member.user.avatar_url} />
                    ) : (
                      <AvatarFallback>
                        {member.user?.display_name?.[0] || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {member.user_id === user?.id
                        ? 'You'
                        : member.user?.display_name || 'Anonymous'}
                    </p>
                  </div>
                  {member.user_id === user?.id && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyRoomMember;
