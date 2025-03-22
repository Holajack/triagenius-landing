
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Loader2 } from "lucide-react";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { getDisplayName } from "@/hooks/use-display-name";

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
  const { getConversations, loading, isUserTyping } = useRealtimeMessages();
  const { user } = useUser();
  const [conversationsWithUsers, setConversationsWithUsers] = useState<ConversationWithUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  // Request notification permission on component mount
  useEffect(() => {
    const requestNotificationPermission = async () => {
      if ('Notification' in window && Notification.permission !== 'granted') {
        try {
          const permission = await Notification.requestPermission();
          console.log('Notification permission:', permission);
        } catch (error) {
          console.error('Error requesting notification permission:', error);
        }
      }
    };
    
    requestNotificationPermission();
  }, []);
  
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
      .subscribe();
      
    // Track current user's presence
    channel.track({
      userId: user.id,
      online_at: new Date().toISOString(),
    });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
  
  // Load user details for conversations
  useEffect(() => {
    const loadConversationUsers = async () => {
      const conversations = getConversations();
      if (conversations.length === 0) {
        setLoadingUsers(false);
        return;
      }
      
      try {
        setLoadingUsers(true);
        const conversationsWithUserDetails: ConversationWithUser[] = [];
        
        for (const convo of conversations) {
          // Get user profile
          const { data: otherUser } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', convo.userId)
            .single();
          
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
        }
        
        setConversationsWithUsers(conversationsWithUserDetails);
      } catch (error) {
        console.error('Error loading conversation users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    loadConversationUsers();
    
    // Set up an interval to refresh the conversation list
    const intervalId = setInterval(() => {
      loadConversationUsers();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [getConversations, isUserTyping]);
  
  // Handle click on conversation
  const handleConversationClick = (userId: string) => {
    if (onMessageClick) {
      onMessageClick(userId);
    } else {
      navigate(`/community/chat/${userId}`);
    }
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
  
  if (loading || loadingUsers) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p>Loading conversations...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {filteredConversations.map((conversation) => {
        const { lastMessage } = conversation;
        const isUnread = lastMessage.recipient_id === user?.id && !lastMessage.is_read;
        const messageTime = formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true });
        const isOnline = onlineUsers.has(conversation.userId);
        const displayName = getDisplayName({
          username: conversation.username,
          full_name: conversation.full_name || '',
          display_name_preference: conversation.display_name_preference
        });
        
        return (
          <Card 
            key={conversation.userId} 
            className={`p-4 ${isUnread ? 'bg-muted/50' : ''} cursor-pointer hover:bg-muted/30 transition-colors`}
            onClick={() => handleConversationClick(conversation.userId)}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar>
                  <AvatarImage src={conversation.avatarUrl || ""} alt={displayName} />
                  <AvatarFallback>{displayName[0]}</AvatarFallback>
                </Avatar>
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium ${isUnread ? 'font-semibold' : ''}`}>
                      {displayName}
                    </h3>
                    {isOnline && (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-200">
                        Online
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {messageTime}
                  </span>
                </div>
                <p className={`text-sm truncate ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {conversation.isTyping ? (
                    <span className="italic text-primary">typing...</span>
                  ) : (
                    <>
                      {lastMessage.sender_id === user?.id ? 'You: ' : ''}{lastMessage.content}
                    </>
                  )}
                </p>
                
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
          <p className="text-muted-foreground">No messages yet</p>
          <p className="text-sm mt-2">Start chatting with community members from the People tab</p>
        </div>
      )}
    </div>
  );
};
