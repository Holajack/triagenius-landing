import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, CheckCircle, Trophy, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";

interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  stats?: {
    total_focus_time?: number;
    total_sessions?: number;
    level?: number;
  }
  online?: boolean;
}

interface CommunityUserListProps {
  searchQuery?: string;
  filters?: string[];
}

export const CommunityUserList = ({ searchQuery = "", filters = [] }: CommunityUserListProps) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getUnreadCount } = useRealtimeMessages();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
          
        if (profilesError) throw profilesError;
        
        const { data: stats, error: statsError } = await supabase
          .from('leaderboard_stats')
          .select('user_id, total_focus_time, total_sessions, level');
          
        if (statsError) throw statsError;
        
        const statsMap = new Map();
        stats?.forEach(stat => {
          statsMap.set(stat.user_id, {
            total_focus_time: stat.total_focus_time || 0,
            total_sessions: stat.total_sessions || 0,
            level: stat.level || 1
          });
        });
        
        const usersWithStats = profiles?.map(profile => ({
          id: profile.id,
          username: profile.username || `User-${profile.id.substring(0, 4)}`,
          avatar_url: profile.avatar_url,
          stats: statsMap.get(profile.id) || {
            total_focus_time: 0,
            total_sessions: 0,
            level: 1
          },
          online: false
        })) || [];
        
        setUsers(usersWithStats);
      } catch (err) {
        console.error('Error fetching users:', err);
        toast.error('Could not load community members');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
    
    const channel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        
        Object.values(state).forEach(presence => {
          const presences = presence as Array<{[key: string]: any}>;
          presences.forEach(p => {
            if (p.user_id) online.add(p.user_id);
            if (p.presence_ref) {
              const match = p.presence_ref.match(/user_id=([^&]+)/);
              if (match && match[1]) online.add(match[1]);
            }
          });
        });
        
        setOnlineUsers(online);
        
        setUsers(currentUsers => 
          currentUsers.map(u => ({
            ...u,
            online: online.has(u.id)
          }))
        );
      })
      .subscribe();
      
    if (user?.id) {
      channel.track({
        user_id: user.id,
        online_at: new Date().toISOString()
      });
    }
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchLower) || false;
    
    if (searchQuery && !matchesSearch) return false;
    
    if (filters.length > 0) {
      if (filters.includes("Online Now") && !user.online) return false;
      if (filters.includes("Top Performers") && (user.stats?.level || 0) < 3) return false;
    }
    
    return true;
  });
  
  const handleMessageUser = (userId: string) => {
    navigate(`/community/chat/${userId}`);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading community members...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {filteredUsers.map((profile) => (
        <Card key={profile.id} className="p-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar>
                <AvatarImage src={profile.avatar_url || ""} alt={profile.username || ""} />
                <AvatarFallback>{profile.username?.[0] || "U"}</AvatarFallback>
              </Avatar>
              {profile.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{profile.username}</h3>
                  {(profile.stats?.level || 0) >= 3 && (
                    <Trophy className="h-4 w-4 text-yellow-500" aria-label="Top Performer" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{profile.online ? 'Online now' : 'Offline'}</span>
              </div>
              
              <p className="text-sm text-muted-foreground">Level {profile.stats?.level || 1}</p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" aria-label="Focus time" />
                  {Math.round((profile.stats?.total_focus_time || 0) / 60)}h
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {profile.stats?.total_sessions || 0} sessions
                </Badge>
                <Badge variant={profile.online ? "default" : "outline"}>
                  {profile.online ? "Active" : "Away"}
                </Badge>
              </div>
              
              <div className="mt-3 flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    toast.info("Profile view is coming soon");
                  }}
                >
                  View Profile
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleMessageUser(profile.id)}
                  disabled={profile.id === user?.id}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Message
                  {getUnreadCount(profile.id) > 0 && (
                    <Badge variant="destructive" className="ml-1 text-[10px] h-4 w-4 px-0 rounded-full flex items-center justify-center">
                      {getUnreadCount(profile.id)}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
      
      {filteredUsers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No users match your search or filters</p>
        </div>
      )}
    </div>
  );
};
