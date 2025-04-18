import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, UserCheck, Users, Loader2, UserX, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { FriendRequest } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { getDisplayName } from "@/hooks/use-display-name";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { cn } from "@/lib/utils";

interface CommunityUserListProps {
  searchQuery?: string;
  filters?: string[];
  tabView?: "all" | "friends" | "pending"; // Tab view is strictly typed
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

interface AuthUser {
  id: string;
  email: string | null;
  username: string | null;
  created_at: string;
  full_name: string | null;
  display_name_preference?: string;
  last_sign_in_at: string | null;
}

const CommunityUserList = ({ searchQuery = "", filters = [], tabView = "all" }: CommunityUserListProps) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState<AuthUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AuthUser[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [pendingFriendIds, setPendingFriendIds] = useState<string[]>([]);
  const [acceptedFriendIds, setAcceptedFriendIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "friends" | "pending">(tabView);
  const isMobile = useIsMobile();
  const { state } = useOnboarding();

  const getEnvBorderColor = () => {
    if (!state || !state.environment) return "";
    
    switch (state.environment) {
      case 'office': return "hover:border-blue-400 border-blue-200";
      case 'park': return "hover:border-green-600 border-green-200";
      case 'home': return "hover:border-orange-400 border-orange-200";
      case 'coffee-shop': return "hover:border-amber-700 border-amber-300/30";
      case 'library': return "hover:border-gray-400 border-gray-200";
      default: return "hover:border-purple-400 border-purple-200";
    }
  };

  const getEnvBackground = () => {
    if (!state || !state.environment) return "";
    
    switch (state.environment) {
      case 'office': return "bg-gradient-to-br from-blue-100/80 to-white";
      case 'park': return "bg-gradient-to-br from-green-100/80 to-white";
      case 'home': return "bg-gradient-to-br from-orange-100/80 to-white";
      case 'coffee-shop': return "bg-gradient-to-br from-amber-800/10 to-amber-700/5";
      case 'library': return "bg-gradient-to-br from-gray-100/80 to-white";
      default: return "bg-gradient-to-br from-purple-100/80 to-white";
    }
  };

  useEffect(() => {
    setActiveTab(tabView as "all" | "friends" | "pending");
  }, [tabView]);

  const fetchAllAuthUsers = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching all auth users");
      
      const { data, error } = await supabase.functions.invoke('get_all_auth_users');
      
      if (error) {
        console.error('Error fetching auth users:', error);
        setError(`Failed to load users: ${error.message}`);
        toast.error("Failed to load users");
        return;
      }
      
      if (data && data.users) {
        console.log("Fetched auth users:", data.users.length);
        setAllUsers(data.users);
        setFilteredUsers(data.users);
      }
    } catch (error: any) {
      console.error('Error in fetchAllAuthUsers:', error);
      setError(`Unexpected error: ${error.message}`);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
    if (!user?.id) return;
    
    fetchAllAuthUsers();
    
    const usersChannel = supabase
      .channel('auth-users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'auth',
          table: 'users'
        },
        (payload) => {
          console.log("Auth user changed:", payload);
          fetchAllAuthUsers();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(usersChannel);
    };
  }, [user?.id, fetchAllAuthUsers]);
  
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
  
  useEffect(() => {
    if (allUsers.length === 0) return;
    
    let usersToFilter = [...allUsers];
    
    if (activeTab === "pending") {
      usersToFilter = allUsers.filter(authUser => pendingFriendIds.includes(authUser.id));
    } else if (activeTab === "friends") {
      usersToFilter = allUsers.filter(authUser => acceptedFriendIds.includes(authUser.id));
    }
    
    if (searchQuery.trim() !== '') {
      const term = searchQuery.toLowerCase();
      usersToFilter = usersToFilter.filter(authUser => 
        (authUser.username?.toLowerCase().includes(term)) ||
        (authUser.email?.toLowerCase().includes(term)) ||
        (authUser.full_name?.toLowerCase().includes(term))
      );
    }
    
    setFilteredUsers(usersToFilter);
  }, [searchQuery, allUsers, activeTab, pendingFriendIds, acceptedFriendIds]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as "all" | "friends" | "pending");
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

  const startMessaging = (userId: string) => {
    navigate(`/community/chat/${userId}`);
  };

  const renderUserList = (users: AuthUser[], emptyMessage: string) => {
    if (error) {
      return (
        <div className="py-8 text-center">
          <div className="text-red-500 mb-2">Error: {error}</div>
          <Button onClick={fetchAllAuthUsers} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      );
    }
    
    if (loading) {
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
            {searchQuery ? "Try a different search term or check your spelling." : emptyMessage}
          </p>
        </div>
      );
    }
    
    return (
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {users.map((authUser) => {
            const isPending = isFriendRequestPending(authUser.id);
            const isAlreadyFriend = isFriend(authUser.id);
            const friendRequest = getFriendRequest(authUser.id);
            const isReceivedRequest = friendRequest && friendRequest.sender_id === authUser.id;
            const isCurrentUser = authUser.id === user?.id;
            const displayName = getDisplayName({
              username: authUser.username || '',
              full_name: authUser.full_name || '',
              display_name_preference: authUser.display_name_preference as 'username' | 'full_name' | null || null
            });
            
            if (isCurrentUser) {
              return null;
            }
            
            return (
              <div 
                key={authUser.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors duration-300",
                  getEnvBorderColor(),
                  getEnvBackground()
                )}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={""} />
                    <AvatarFallback>
                      {displayName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center">
                      {displayName}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Joined {new Date(authUser.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                {!isCurrentUser && (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => startMessaging(authUser.id)}
                      className="flex items-center gap-1"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Message</span>
                    </Button>
                    
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
                            onClick={() => acceptFriendRequest(friendRequest.id, authUser.id)}
                          >
                            Accept
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => rejectFriendRequest(friendRequest.id, authUser.id)}
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
                        onClick={() => sendFriendRequest(authUser.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Add</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    );
  };
  
  if (tabView === "friends") {
    return renderUserList(
      filteredUsers.filter(user => acceptedFriendIds.includes(user.id)),
      "You haven't connected with any users yet. Add friends to see them here."
    );
  }
  
  if (tabView === "pending") {
    return renderUserList(
      filteredUsers.filter(user => pendingFriendIds.includes(user.id)),
      "No pending friend requests."
    );
  }
  
  if (tabView === "all") {
    return renderUserList(
      filteredUsers,
      "No other users have registered yet. Be the first to invite others!"
    );
  }
  
  return (
    <Card className="col-span-1 h-full">
      <CardHeader>
        <CardTitle>People</CardTitle>
        <CardDescription>Find and connect with other users</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4 w-full grid grid-cols-3">
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {renderUserList(
              filteredUsers, 
              "No other users have registered yet. Be the first to invite others!"
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
