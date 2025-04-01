
import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, Smile } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from "date-fns";
import { getDisplayName, getInitials } from "@/hooks/use-display-name";

const Chat = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [contact, setContact] = useState<any | null>(null);
  const [contactLoading, setContactLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const { user } = useUser();
  const { 
    getConversation, 
    sendMessage, 
    markAsRead, 
    setTypingStatus, 
    isUserTyping
  } = useRealtimeMessages();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  const isContactTyping = id && isUserTyping(id);

  // Function to fetch messages for the current conversation
  const fetchConversationMessages = useCallback(async () => {
    if (!id || !user?.id) return;
    
    try {
      const conversationMessages = await getConversation(id);
      setCurrentMessages(conversationMessages);
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
      toast.error("Could not load messages. Please try again.");
    }
  }, [id, user?.id, getConversation]);

  // Initialize the messages for this conversation
  useEffect(() => {
    fetchConversationMessages();
  }, [fetchConversationMessages]);

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
  
  // Subscribe to real-time message updates
  useEffect(() => {
    if (!id || !user?.id) return;
    
    const channel = supabase.channel(`private-messages-${id}-${user.id}`);
    
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${user.id}`
      }, payload => {
        console.log('New message received:', payload);
        
        // Only add if it's from the current chat
        if (payload.new.sender_id === id) {
          setCurrentMessages(prev => {
            // Avoid duplicates
            if (prev.some(msg => msg.id === payload.new.id)) {
              return prev;
            }
            
            // Add and sort by created_at
            const updated = [...prev, payload.new];
            return updated.sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
          
          // Mark as read since we're actively viewing this conversation
          markAsRead(payload.new.id);
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user?.id, markAsRead]);

  // Mark messages as read when viewed
  useEffect(() => {
    if (!id || !user?.id) return;
    
    currentMessages.forEach(msg => {
      if (msg.sender_id === id && !msg.is_read) {
        markAsRead(msg.id);
      }
    });
  }, [id, currentMessages, user?.id, markAsRead]);

  // Fetch contact profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      
      try {
        setContactLoading(true);
        
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, display_name_preference, avatar_url')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching contact profile:', error);
          toast.error("Could not load contact information");
          setContactLoading(false);
          return;
        }
        
        // If we found a profile, use it
        const isOnline = onlineUsers.has(id);
        setContact({
          id: profileData.id,
          username: profileData.username || `User-${id.substring(0, 4)}`,
          full_name: profileData.full_name,
          display_name_preference: profileData.display_name_preference,
          avatar_url: profileData.avatar_url,
          online: isOnline,
          status: isOnline ? "Online" : "Offline"
        });
      } catch (err) {
        console.error('Error in fetchProfile:', err);
        // Create fallback profile
        setContact({
          id,
          username: `User-${id.substring(0, 4)}`,
          status: 'Unknown'
        });
      } finally {
        setContactLoading(false);
      }
    };
    
    fetchProfile();
  }, [id, onlineUsers]);
  
  // Auto-scroll to latest message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, isContactTyping]);
  
  // Handle typing status
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!id) return;
    
    // Send typing indicator
    setTypingStatus(id, true);
    
    // Clear previous timeout if it exists
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set a timeout to clear the typing status
    const timeout = setTimeout(() => {
      if (id) {
        setTypingStatus(id, false);
      }
    }, 3000);
    
    setTypingTimeout(timeout);
  };
  
  // Send message - simplified
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id || !user?.id || isSending) return;
    
    try {
      setIsSending(true);
      const sent = await sendMessage(id, newMessage);
      
      if (sent) {
        setNewMessage("");
        
        // Clear typing indicator
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }
        setTypingStatus(id, false);
        
        // Add message to the local state
        const newMsg = {
          ...sent,
          sender_id: user.id,
          recipient_id: id,
          content: newMessage,
          is_read: false,
          created_at: new Date().toISOString()
        };
        
        setCurrentMessages(prev => [...prev, newMsg].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ));
      } else {
        console.error('Failed to send message');
        toast.error("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle user not found case
  if ((!id)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>No user selected. Please select a conversation.</p>
      </div>
    );
  }

  // Show loading state while contact info is being fetched
  if (contactLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }
  
  // Get display name based on preference
  const contactDisplayName = contact ? getDisplayName({
    username: contact.username || '',
    full_name: contact.full_name || '',
    display_name_preference: contact.display_name_preference
  }) : "Unknown User";
  
  const contactInitials = contact ? getInitials(contactDisplayName) : "?";
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="border-b p-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/community')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar>
                <AvatarImage src={contact?.avatar_url || ""} alt={contactDisplayName} />
                <AvatarFallback>{contactInitials}</AvatarFallback>
              </Avatar>
              {contact?.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            
            <div>
              <h2 className="font-medium text-sm">{contactDisplayName}</h2>
              <p className="text-xs text-muted-foreground">
                {isContactTyping ? "typing..." : contact?.status || "Offline"}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {currentMessages.length > 0 ? (
          currentMessages.map((message) => {
            const isUnread = !message.is_read;
            const isCurrentUserSender = message.sender_id === user?.id;
            const messageTime = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });
            
            return (
              <div 
                key={message.id} 
                className={`flex ${isCurrentUserSender ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUserSender && (
                  <Avatar className="h-8 w-8 mr-2 mt-1">
                    <AvatarImage src={contact?.avatar_url || ""} alt={contactDisplayName} />
                    <AvatarFallback>{contactInitials}</AvatarFallback>
                  </Avatar>
                )}
                
                <div 
                  className={`max-w-[75%] p-3 rounded-lg ${
                    isCurrentUserSender 
                      ? 'bg-primary text-primary-foreground' 
                      : isUnread ? 'bg-muted/80' : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                    isCurrentUserSender ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    <span>{messageTime}</span>
                    {isCurrentUserSender && (
                      <span>{message.is_read ? '✓✓' : '✓'}</span>
                    )}
                  </div>
                </div>
                
                {isCurrentUserSender && (
                  <Avatar className="h-8 w-8 ml-2 mt-1">
                    <AvatarImage src={user?.avatarUrl || ""} />
                    <AvatarFallback>{(user?.username || "?")[0]}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p>No messages yet</p>
            <p className="text-sm mt-2">Send a message to start the conversation</p>
          </div>
        )}
        {isContactTyping && (
          <div className="flex justify-start">
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "100ms" }}></div>
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "200ms" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>
      
      <div className="border-t p-3 bg-card">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => toast.info("File sharing coming soon")}
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>
          
          <Input
            placeholder="Type a message..."
            className="rounded-full"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => toast.info("Emoji picker coming soon")}
          >
            <Smile className="h-5 w-5 text-muted-foreground" />
          </Button>
          
          <Button 
            className="rounded-full h-10 w-10 p-0"
            disabled={!newMessage.trim() || isSending}
            onClick={handleSendMessage}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
