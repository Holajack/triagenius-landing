
import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, UserCheck, Search, Users, Loader2, UserX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { FriendRequest } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";

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
  has_profile?: boolean;
  email?: string | null;
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
  const [loadingNoProfiles, setLoadingNoProfiles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usersWithoutProfiles, setUsersWithoutProfiles] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const isMobile = useIsMobile();

  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  const fetchAllUsers = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching users for user ID:", user.id);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, university, state, show_university, show_state')
        .neq('id', user.id);
      
      if (error) {
        console.error('Error fetching users:', error);
        setError(`Failed to load users: ${error.message}`);
        toast.error("Failed to load users");
        return;
      }
      
      console.log("Fetched profiles:", profiles?.length || 0);
      
      // Add has_profile flag to profiles
      const profilesWithFlag = profiles?.map(profile => ({
        ...profile,
        has_profile: true
      })) || [];
      
      setAllUsers(profilesWithFlag);
      setFilteredUsers(profilesWithFlag);
    } catch (error: any) {
      console.error('Error in fetchAllUsers:', error);
      setError(`Unexpected error: ${error.message}`);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  const fetchUsersWithoutProfiles = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoadingNoProfiles(true);
      
      console.log("Fetching users without profiles");
      
      const { data, error } = await supabase.functions.invoke('get_users_without_profiles');
      
      if (error) {
        console.error('Error fetching users without profiles:', error);
        return;
      }
      
      if (data && data.users) {
        console.log("Fetched users without profiles:", data.users.length);
        setUsersWithoutProfiles(data.users as Profile[]);
      }
    } catch (error: any) {
      console.error('Error in fetchUsersWithoutProfiles:', error);
    } finally {
      setLoadingNoProfiles(false);
    }
  }, [user]);
  
  useEffect(() => {
    if (!user?.id) return;
    
    fetchAllUsers();
    fetchUsersWithoutProfiles();
    
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log("Profile changed:", payload);
          
          if (payload.eventType === 'INSERT') {
            if (payload.new.id !== user.id) {
              setAllUsers(prev => {
                if (!prev.some(profile => profile.id === payload.new.id)) {
                  const newProfile = { ...payload.new, has_profile: true } as Profile;
                  return [...prev, newProfile];
                }
                return prev;
              });
              
              // Remove from users without profiles if they just created a profile
              setUsersWithoutProfiles(prev => 
                prev.filter(u => u.id !== payload.new.id)
              );
            }
          } else if (payload.eventType === 'UPDATE') {
            setAllUsers(prev => 
              prev.map(profile => 
                profile.id === payload.new.id ? { ...profile, ...payload.new, has_profile: true } : profile
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setAllUsers(prev => prev.filter(profile => profile.id !== payload.old.id));
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(profilesChannel);
    };
  }, [user?.id, fetchAllUsers, fetchUsersWithoutProfiles]);
  
  const fetchFriendRequests = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log("Fetching friend requests for user ID:", user.id);
      
      const { data, error } = await supabase.functions.invoke('get_friend_requests', {
        body: { userId: user.id }
      });
      
      if (error) {
        console.error('Error fetching friend requests:', error);
        return;
      }
      
      if (data && data.friendRequests) {
        console.log("Fetched friend requests:", data.friendRequests.length);
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
    } catch (error: any) {
      console.error('Error in fetchFriendRequests:', error);
    }
  }, [user]);
  
  useEffect(() => {
    if (!user?.id) return;
    
    fetchFriendRequests();

    const friendRequestsChannel = supabase
      .channel('friend-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
          filter: `sender_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Friend request changed for sender:", payload);
          fetchFriendRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Friend request changed for recipient:", payload);
          fetchFriendRequests();
        }
      )
      .subscribe((status) => {
        console.log("Friend requests channel status:", status);
      });

    return () => {
      supabase.removeChannel(friendRequestsChannel);
    };
  }, [user?.id, fetchFriendRequests]);
  
  // This effect controls the filtered users based on active tab and search term
  useEffect(() => {
    // Determine which user list to filter based on active tab
    let usersToFilter: Profile[] = [];
    
    if (activeTab === "all") {
      usersToFilter = [...allUsers]; 
    } else if (activeTab === "pending") {
      usersToFilter = allUsers.filter(user => pendingFriendIds.includes(user.id));
    } else if (activeTab === "friends") {
      usersToFilter = allUsers.filter(user => acceptedFriendIds.includes(user.id));
    } else if (activeTab === "no-profiles") {
      usersToFilter = [...usersWithoutProfiles];
    }
    
    // Apply search filtering if there's a search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      usersToFilter = usersToFilter.filter(profile => 
        (profile.username?.toLowerCase().includes(term)) ||
        (profile.email?.toLowerCase().includes(term)) ||
        (profile.university?.toLowerCase().includes(term)) ||
        (profile.state?.toLowerCase().includes(term))
      );
    }
    
    setFilteredUsers(usersToFilter);
  }, [searchTerm, allUsers, usersWithoutProfiles, activeTab, pendingFriendIds, acceptedFriendIds]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
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
    if (!user) {
      toast.error("You must be logged in to send friend requests");
      return;
    }
    
    try {
      console.log("Sending friend request to:", recipientId);
      
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
    } catch (error: any) {
      console.error('Error in sendFriendRequest:', error);
      toast.error("Failed to send friend request");
    }
  };
  
  const acceptFriendRequest = async (requestId: string, senderId: string) => {
    if (!user) {
      toast.error("You must be logged in to accept friend requests");
      return;
    }
    
    try {
      console.log("Accepting friend request:", requestId);
      
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
    } catch (error: any) {
      console.error('Error in acceptFriendRequest:', error);
      toast.error("Failed to accept friend request");
    }
  };

  const rejectFriendRequest = async (requestId: string, senderId: string) => {
    if (!user) {
      toast.error("You must be logged in to reject friend requests");
      return;
    }
    
    try {
      console.log("Rejecting friend request:", requestId);
      
      const { data, error } = await supabase.functions.invoke('update_friend_request', {
        body: { 
          requestId,
          status: 'rejected'
        }
      });
      
      if (error) {
        console.error('Error rejecting friend request:', error);
        toast.error("Failed to reject friend request");
        return;
      }
      
      if (data && data.friendRequest) {
        setFriendRequests(
          friendRequests.map(req => req.id === requestId ? data.friendRequest : req)
        );
        setPendingFriendIds(pendingFriendIds.filter(id => id !== senderId));
        toast.success("Friend request rejected");
      }
    } catch (error: any) {
      console.error('Error in rejectFriendRequest:', error);
      toast.error("Failed to reject friend request");
    }
  };
  
  const renderUserList = (users: Profile[], emptyMessage: string) => {
    if (error) {
      return (
        <div className="py-8 text-center">
          <div className="text-red-500 mb-2">Error: {error}</div>
          <Button onClick={fetchAllUsers} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      );
    }
    
    const isLoading = activeTab === "no-profiles" ? loadingNoProfiles : loading;
    
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      );
    }
    
    if (users.length === 0) {
      return (
        <div className="py-8 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No users found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchTerm ? "Try a different search term or check your spelling." : emptyMessage}
          </p>
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
            const hasProfile = profile.has_profile !== false; // If undefined or true, treat as having a profile
            
            return (
              <div 
                key={profile.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatar_url || ""} />
                    <AvatarFallback>
                      {hasProfile 
                        ? (profile.username?.charAt(0)?.toUpperCase() || "U") 
                        : profile.email?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{
                      hasProfile
                        ? (profile.username || "Anonymous")
                        : (profile.email || "No Email")
                    }</p>
                    <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                      {hasProfile ? (
                        <>
                          {profile.show_university && profile.university && (
                            <span>{profile.university}</span>
                          )}
                          {profile.show_state && profile.state && (
                            <span>{profile.state}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-orange-500">No profile created yet</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {isAlreadyFriend ? (
                    <Button variant="ghost" size="sm" disabled>
                      <UserCheck className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Friend</span>
                    </Button>
                  ) : isPending ? (
                    isReceivedRequest ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => acceptFriendRequest(friendRequest.id, profile.id)}
                        >
                          Accept
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => rejectFriendRequest(friendRequest.id, profile.id)}
                        >
                          Reject
                        </Button>
                      </>
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
              aria-label="Search users"
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4 w-full grid grid-cols-4">
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="no-profiles">No Profiles</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {renderUserList(
              filteredUsers, 
              "No other users have registered yet. Be the first to invite others!"
            )}
          </TabsContent>
          
          <TabsContent value="no-profiles">
            {renderUserList(
              usersWithoutProfiles,
              "All registered users have created profiles."
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
