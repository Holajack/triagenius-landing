
import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Loader2, AlertTriangle, RefreshCw, MessageSquare, User } from "lucide-react";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { getDisplayName } from "@/hooks/use-display-name";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface MessageInboxProps {
  searchQuery?: string;
  onMessageClick?: (messageId: string) => void;
}

interface ConversationWithUser {
  userId: string;
  lastMessage: any;
  username: string;
  full_name: string | null;
  display_name_preference: 'username' | 'full_name' | null;
  avatarUrl: string | null;
  isTyping?: boolean;
}

export const MessageInbox = ({ searchQuery = "", onMessageClick }: MessageInboxProps) => {
  const navigate = useNavigate();
  const { getConversations, loading, isUserTyping, error: messagesError } = useRealtimeMessages();
  const { user } = useUser();
  const [conversationsWithUsers, setConversationsWithUsers] = useState<ConversationWithUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  // Set up presence channel for online status
  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase.channel('online-users');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        
        Object.keys(state).forEach(presenceKey => {
          const presences = state[presenceKey] as any[];
          presences.forEach(presence => {
            if (presence.userId && presence.userId !== user.id) {
              online.add(presence.userId);
            }
          });
        });
        
        setOnlineUsers(online);
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.error('Failed to subscribe to online users channel:', status);
          setError("Failed to connect to the realtime service. Some features may not work properly.");
        }
      });
      
    // Track current user's presence
    channel.track({
      userId: user.id,
      online_at: new Date().toISOString(),
    }).then((status) => {
      if (status !== 'ok') {
        console.error('Failed to track user presence:', status);
      }
    }).catch(err => {
      console.error('Error tracking presence:', err);
    });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
  
  // Load user details for conversations
  const loadConversationUsers = useCallback(async () => {
    if (!user?.id) {
      setLoadingUsers(false);
      return;
    }
    
    const conversations = getConversations();
    if (conversations.length === 0) {
      setLoadingUsers(false);
      return;
    }
    
    try {
      setLoadingUsers(true);
      setError(null);
      const conversationsWithUserDetails: ConversationWithUser[] = [];
      
      for (const convo of conversations) {
        try {
          // Get user profile
          const { data: otherUser, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', convo.userId)
            .single();
          
          if (profileError) {
            console.error('Error fetching user profile:', profileError);
            // Continue with partial data
            conversationsWithUserDetails.push({
              userId: convo.userId,
              lastMessage: convo.lastMessage,
              username: `User-${convo.userId.substring(0, 4)}`,
              full_name: null,
              display_name_preference: null,
              avatarUrl: null,
              isTyping: isUserTyping(convo.userId)
            });
            continue;
          }
          
          if (otherUser) {
            conversationsWithUserDetails.push({
              userId: convo.userId,
              lastMessage: convo.lastMessage,
              username: otherUser.username || `User-${convo.userId.substring(0, 4)}`,
              full_name: otherUser.full_name,
              display_name_preference: otherUser.display_name_preference as 'username' | 'full_name' | null,
              avatarUrl: otherUser.avatar_url,
              isTyping: isUserTyping(convo.userId)
            });
          }
        } catch (userError) {
          console.error('Error processing user:', userError);
          // Add with minimal info
          conversationsWithUserDetails.push({
            userId: convo.userId,
            lastMessage: convo.lastMessage,
            username: `User-${convo.userId.substring(0, 4)}`,
            full_name: null,
            display_name_preference: null,
            avatarUrl: null,
            isTyping: isUserTyping(convo.userId)
          });
        }
      }
      
      setConversationsWithUsers(conversationsWithUserDetails);
    } catch (error: any) {
      console.error('Error loading conversation users:', error);
      setError('Failed to load complete conversation data. Some information may be missing.');
    } finally {
      setLoadingUsers(false);
    }
  }, [getConversations, isUserTyping, user?.id]);

  useEffect(() => {
    loadConversationUsers();
    
    // Set up an interval to refresh the conversation list
    const intervalId = setInterval(() => {
      loadConversationUsers();
    }, 10000); // Reduced from 5s to 10s to lower database load
    
    return () => clearInterval(intervalId);
  }, [loadConversationUsers]);
  
  // Handle click on conversation
  const handleConversationClick = (userId: string) => {
    if (!user?.id) {
      navigate('/auth');
      return;
    }
    
    if (onMessageClick) {
      onMessageClick(userId);
    } else {
      navigate(`/community/chat/${userId}`);
    }
  };
  
  // Handle retry loading
  const handleRetryLoad = () => {
    loadConversationUsers();
  };
  
  // Filter conversations based on search query
  const filteredConversations = conversationsWithUsers.filter(convo => {
    if (!searchQuery) return true;
    
    const displayName = getDisplayName({
      username: convo.username,
      full_name: convo.full_name || '',
      display_name_preference: convo.display_name_preference
    });
    const messageContent = convo.lastMessage.content.toLowerCase();
    
    return displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           messageContent.includes(searchQuery.toLowerCase());
  });
  
  if (!user?.id) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-lg font-medium">Authentication Required</p>
        <p className="text-muted-foreground mt-2">You need to be logged in to view messages</p>
        <Button className="mt-4" onClick={() => navigate('/auth')}>Log In</Button>
      </div>
    );
  }
  
  if (loading || loadingUsers) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p>Loading conversations...</p>
      </div>
    );
  }
  
  if (messagesError || error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Messages</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>{messagesError?.message || error || "There was an error loading your messages."}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="self-start mt-2"
            onClick={handleRetryLoad}
          >
            <RefreshCw className="h-3 w-3 mr-2" /> Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-3">
      {filteredConversations.map((conversation) => {
        const { lastMessage } = conversation;
        const isUnread = lastMessage.recipient_id === user?.id && !lastMessage.is_read;
        const messageTime = formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: false });
        const isOnline = onlineUsers.has(conversation.userId);
        const displayName = getDisplayName({
          username: conversation.username,
          full_name: conversation.full_name || '',
          display_name_preference: conversation.display_name_preference
        });
        
        return (
          <Card 
            key={conversation.userId} 
            className={`p-3 ${isUnread ? 'bg-muted/50' : ''} cursor-pointer hover:bg-muted/30 transition-colors`}
            onClick={() => handleConversationClick(conversation.userId)}
          >
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conversation.avatarUrl || ""} alt={displayName} />
                  <AvatarFallback>{displayName[0]}</AvatarFallback>
                </Avatar>
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium text-sm ${isUnread ? 'font-semibold' : ''}`}>
                      {displayName}
                    </h3>
                    {isOnline && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-green-500/10 text-green-600 border-green-200">
                        Online
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {messageTime}
                  </span>
                </div>
                
                <div className="flex gap-1 items-center mt-0.5">
                  {lastMessage.sender_id === user?.id ? (
                    <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <MessageSquare className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  )}
                  
                  <p className={`text-xs truncate ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {conversation.isTyping ? (
                      <span className="italic text-primary text-xs">typing...</span>
                    ) : (
                      <>
                        {lastMessage.sender_id === user?.id ? 'You: ' : ''}{lastMessage.content}
                      </>
                    )}
                  </p>
                </div>
                
                <div className="mt-1 flex items-center justify-end gap-1">
                  {lastMessage.sender_id === user?.id && (
                    <span className="text-xs text-muted-foreground">
                      {lastMessage.is_read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
      
      {filteredConversations.length === 0 && (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No messages yet</p>
          <p className="text-sm mt-2">Start chatting with community members from the People tab</p>
        </div>
      )}
    </div>
  );
};
