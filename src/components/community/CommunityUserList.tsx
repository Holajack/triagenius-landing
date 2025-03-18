import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, UserCheck, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface CommunityUserListProps {
  searchQuery?: string;
  filters?: string[];
}

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  university?: string | null;
  state?: string | null;
  show_university?: boolean;
  show_state?: boolean;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: string;
}

const CommunityUserList = ({ searchQuery = "", filters = [] }: CommunityUserListProps) => {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [pendingFriendIds, setPendingFriendIds] = useState<string[]>([]);
  const [acceptedFriendIds, setAcceptedFriendIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    console.log("Applying filters:", filters);
  }, [filters]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, university, state, show_university, show_state')
          .neq('id', user.id);
        
        if (error) {
          console.error('Error fetching users:', error);
          return;
        }
        
        setAllUsers(profiles || []);
        setFilteredUsers(profiles || []);
        
      } catch (error) {
        console.error('Error in fetchAllUsers:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllUsers();
  }, [user]);
  
  useEffect(() => {
    const fetchFriendRequests = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('get_friend_requests', {
          body: { userId: user.id }
        });
        
        if (error) {
          console.error('Error fetching friend requests:', error);
          return;
        }
        
        if (data && data.friendRequests) {
          setFriendRequests(data.friendRequests);
          
          const pending = data.friendRequests
            .filter((req: FriendRequest) => req.status === 'pending')
            .map((req: FriendRequest) => 
              req.sender_id === user.id ? req.recipient_id : req.sender_id
            );
          
          const accepted = data.friendRequests
            .filter((req: FriendRequest) => req.status === 'accepted')
            .map((req: FriendRequest) => 
              req.sender_id === user.id ? req.recipient_id : req.sender_id
            );
          
          setPendingFriendIds(pending);
          setAcceptedFriendIds(accepted);
        }
      } catch (error) {
        console.error('Error in fetchFriendRequests:', error);
      }
    };
    
    fetchFriendRequests();
  }, [user]);
  
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(allUsers);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = allUsers.filter(profile => 
      profile.username?.toLowerCase().includes(term) ||
      profile.university?.toLowerCase().includes(term) ||
      profile.state?.toLowerCase().includes(term)
    );
    
    setFilteredUsers(filtered);
  }, [searchTerm, allUsers]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const isFriendRequestPending = (userId: string) => {
    return pendingFriendIds.includes(userId);
  };
  
  const isFriend = (userId: string) => {
    return acceptedFriendIds.includes(userId);
  };
  
  const getFriendRequest = (userId: string): FriendRequest | undefined => {
    return friendRequests.find(req => 
      (req.sender_id === user?.id && req.recipient_id === userId) ||
      (req.sender_id === userId && req.recipient_id === user?.id)
    );
  };
  
  const sendFriendRequest = async (recipientId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('create_friend_request', {
        body: { 
          senderId: user.id,
          recipientId
        }
      });
      
      if (error) {
        console.error('Error sending friend request:', error);
        toast.error("Failed to send friend request");
        return;
      }
      
      if (data && data.friendRequest) {
        setFriendRequests([...friendRequests, data.friendRequest]);
        setPendingFriendIds([...pendingFriendIds, recipientId]);
        toast.success("Friend request sent!");
      }
    } catch (error) {
      console.error('Error in sendFriendRequest:', error);
      toast.error("Failed to send friend request");
    }
  };
  
  const acceptFriendRequest = async (requestId: string, senderId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('update_friend_request', {
        body: { 
          requestId,
          status: 'accepted'
        }
      });
      
      if (error) {
        console.error('Error accepting friend request:', error);
        toast.error("Failed to accept friend request");
        return;
      }
      
      if (data && data.friendRequest) {
        setFriendRequests(
          friendRequests.map(req => req.id === requestId ? data.friendRequest : req)
        );
        setPendingFriendIds(pendingFriendIds.filter(id => id !== senderId));
        setAcceptedFriendIds([...acceptedFriendIds, senderId]);
        toast.success("Friend request accepted!");
      }
    } catch (error) {
      console.error('Error in acceptFriendRequest:', error);
      toast.error("Failed to accept friend request");
    }
  };
  
  const renderUserList = (users: Profile[], emptyMessage: string) => {
    if (users.length === 0) {
      return (
        <div className="py-8 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No users found</h3>
          <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }
    
    return (
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {users.map((profile) => {
            const isPending = isFriendRequestPending(profile.id);
            const isAlreadyFriend = isFriend(profile.id);
            const friendRequest = getFriendRequest(profile.id);
            const isReceivedRequest = friendRequest && friendRequest.sender_id === profile.id;
            
            return (
              <div 
                key={profile.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatar_url || ""} />
                    <AvatarFallback>
                      {profile.username?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{profile.username || "Anonymous"}</p>
                    <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                      {profile.show_university && profile.university && (
                        <span>{profile.university}</span>
                      )}
                      {profile.show_state && profile.state && (
                        <span>{profile.state}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  {isAlreadyFriend ? (
                    <Button variant="ghost" size="sm" disabled>
                      <UserCheck className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Friend</span>
                    </Button>
                  ) : isPending ? (
                    isReceivedRequest ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => acceptFriendRequest(friendRequest.id, profile.id)}
                      >
                        Accept
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" disabled>
                        Pending
                      </Button>
                    )
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => sendFriendRequest(profile.id)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Add</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    );
  };
  
  return (
    <Card className="col-span-1 h-full">
      <CardHeader>
        <CardTitle>People</CardTitle>
        <CardDescription>Find and connect with other users</CardDescription>
        
        {!searchQuery && (
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 w-full grid grid-cols-3">
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border">
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-3 bg-muted rounded w-32"></div>
                    </div>
                    <div className="h-8 w-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              renderUserList(
                filteredUsers, 
                "Try adjusting your search or check back later for new users to connect with."
              )
            )}
          </TabsContent>
          
          <TabsContent value="pending">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border">
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-3 bg-muted rounded w-32"></div>
                    </div>
                    <div className="h-8 w-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              renderUserList(
                filteredUsers.filter(user => pendingFriendIds.includes(user.id)),
                "No pending friend requests."
              )
            )}
          </TabsContent>
          
          <TabsContent value="friends">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border">
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-3 bg-muted rounded w-32"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              renderUserList(
                filteredUsers.filter(user => acceptedFriendIds.includes(user.id)),
                "You haven't connected with any users yet. Add friends to see them here."
              )
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CommunityUserList;
