
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Loader2 } from "lucide-react";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface MessageInboxProps {
  searchQuery?: string;
  onMessageClick?: (messageId: string) => void;
}

export const MessageInbox = ({ searchQuery = "", onMessageClick }: MessageInboxProps) => {
  const { getConversations, loading } = useRealtimeMessages();
  const { user } = useUser();
  
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
  
  const conversations = getConversations();
  
  // Filter conversations based on search query
  const filteredConversations = conversations.filter(convo => {
    if (!searchQuery) return true;
    
    // We need to fetch user details for each conversation
    const otherUserId = convo.userId;
    // Can check message content
    const messageContent = convo.lastMessage.content.toLowerCase();
    
    return messageContent.includes(searchQuery.toLowerCase());
  });
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p>Loading conversations...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {filteredConversations.map(async (conversation) => {
        // Get user profile
        const { data: otherUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', conversation.userId)
          .single();
        
        const { lastMessage } = conversation;
        const isUnread = lastMessage.recipient_id === user?.id && !lastMessage.is_read;
        const messageTime = formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true });
        
        return (
          <Card 
            key={conversation.userId} 
            className={`p-4 ${isUnread ? 'bg-muted/50' : ''} cursor-pointer hover:bg-muted/30 transition-colors`}
            onClick={() => onMessageClick && onMessageClick(conversation.userId)}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar>
                  <AvatarImage src={otherUser?.avatar_url || ""} alt={otherUser?.username || "User"} />
                  <AvatarFallback>{otherUser?.username?.[0] || "U"}</AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium ${isUnread ? 'font-semibold' : ''}`}>
                      {otherUser?.username || `User-${conversation.userId.substring(0, 4)}`}
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {messageTime}
                  </span>
                </div>
                <p className={`text-sm truncate ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {lastMessage.sender_id === user?.id ? 'You: ' : ''}{lastMessage.content}
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
