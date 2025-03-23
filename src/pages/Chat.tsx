
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, Smile, MoreVertical, Phone, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { supabase, handleSupabaseError } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { requestMediaPermissions, sendNotification } from "@/components/pwa/ServiceWorker";
import { getDisplayName, getInitials } from "@/hooks/use-display-name";

interface ChatProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  display_name_preference: 'username' | 'full_name' | null;
  avatar_url: string | null;
  online?: boolean;
  status?: string;
  typing?: boolean;
  lastActive?: string;
}

const Chat = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [contact, setContact] = useState<ChatProfile | null>(null);
  const [contactLoading, setContactLoading] = useState(true);
  const [contactError, setContactError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isFriend, setIsFriend] = useState<boolean | null>(null);
  const [isCheckingFriend, setIsCheckingFriend] = useState(true);
  const { user } = useUser();
  const { getConversation, sendMessage, markAsRead, setTypingStatus, isUserTyping } = useRealtimeMessages();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  const messages = id ? getConversation(id) : [];
  const isContactTyping = id && isUserTyping(id);

  // Check if the user is a friend
  useEffect(() => {
    const checkFriendStatus = async () => {
      if (!id || !user?.id) return;
      
      setIsCheckingFriend(true);
      
      try {
        // Check friends table
        const { data: friendData, error: friendError } = await supabase
          .from('friends')
          .select('*')
          .or(`and(user_id.eq.${user.id},friend_id.eq.${id}),and(user_id.eq.${id},friend_id.eq.${user.id})`)
          .maybeSingle();
          
        if (friendError) {
          console.error('Error checking friend status:', friendError);
          setIsFriend(false);
        } else {
          setIsFriend(!!friendData);
        }
      } catch (error) {
        console.error('Error checking friend status:', error);
        setIsFriend(false);
      } finally {
        setIsCheckingFriend(false);
      }
    };
    
    checkFriendStatus();
  }, [id, user?.id]);
  
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
            if (presence.userId) {
              online.add(presence.userId);
            }
          });
        });
        
        setOnlineUsers(online);
        
        if (contact && id) {
          setContact(prev => {
            if (!prev) return prev;
            const isOnline = online.has(prev.id);
            return {
              ...prev,
              online: isOnline,
              status: isOnline ? "Online" : prev.status
            };
          });
        }
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
  }, [user?.id, contact, id]);
  
  // Fetch contact profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      
      try {
        setContactLoading(true);
        setContactError(null);
        
        // Check if this user exists in auth.users (via profiles table)
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, display_name_preference, avatar_url')
          .eq('id', id)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching profile:', error);
          throw handleSupabaseError(error, 'Could not load contact information');
        }
        
        // Create a fallback profile if no data is found
        let contactData: ChatProfile;
        
        if (!data) {
          console.log('No profile found, creating fallback for ID:', id);
          contactData = {
            id,
            username: `User-${id.substring(0, 4)}`,
            full_name: null,
            display_name_preference: null,
            avatar_url: null,
            status: 'Unknown'
          };
        } else {
          const isOnline = onlineUsers.has(id);
          contactData = {
            id: data.id,
            username: data.username || `User-${data.id.substring(0, 4)}`,
            full_name: data.full_name,
            display_name_preference: data.display_name_preference as 'username' | 'full_name' | null,
            avatar_url: data.avatar_url,
            online: isOnline,
            status: isOnline ? "Online" : "Offline",
            typing: isUserTyping(id)
          };
        }
        
        setContact(contactData);
        setContactError(null);
      } catch (err) {
        console.error('Error in fetchProfile:', err);
        
        // Create fallback profile even if there's an error
        setContact({
          id,
          username: `User-${id.substring(0, 4)}`,
          full_name: null,
          display_name_preference: null,
          avatar_url: null,
          status: 'Unknown'
        });
        
        // Still show the error
        setContactError(err instanceof Error ? err.message : 'Could not load contact information');
      } finally {
        setContactLoading(false);
      }
    };
    
    fetchProfile();
  }, [id, onlineUsers, isUserTyping]);
  
  // Mark messages as read
  useEffect(() => {
    if (!id || !user?.id) return;
    
    messages.forEach(msg => {
      if (msg.sender_id === id && !msg.is_read) {
        markAsRead(msg.id);
      }
    });
  }, [id, messages, user?.id, markAsRead]);
  
  // Auto-scroll to latest message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
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
  
  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id || !user?.id) return;
    
    // Don't allow sending if not friends and friend-only messaging is enabled
    if (isFriend === false) {
      toast.error("You need to be friends with this user to send a message");
      
      // Show friend request option
      toast("Send a friend request?", {
        action: {
          label: "Send Request",
          onClick: handleSendFriendRequest
        },
        duration: 5000
      });
      return;
    }
    
    const sent = await sendMessage(id, newMessage);
    if (sent) {
      setNewMessage("");
      
      // Clear typing indicator
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      setTypingStatus(id, false);
    }
  };
  
  // Send friend request
  const handleSendFriendRequest = async () => {
    if (!id || !user?.id) return;
    
    try {
      // Check if a request already exists
      const { data: existingRequest } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${id}),and(sender_id.eq.${id},recipient_id.eq.${user.id})`)
        .maybeSingle();
        
      if (existingRequest) {
        if (existingRequest.sender_id === user.id) {
          toast.info("You've already sent a friend request to this user");
        } else {
          toast.info("This user has already sent you a friend request");
        }
        return;
      }
      
      // Send friend request
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          recipient_id: id,
          status: 'pending'
        });
        
      if (error) throw error;
      
      toast.success("Friend request sent!");
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error("Failed to send friend request");
    }
  };
  
  // Handle audio call
  const handleAudioCall = async () => {
    try {
      const permissions = await requestMediaPermissions();
      
      if (permissions.audio) {
        toast("Starting audio call...", {
          description: "Audio calling feature is being implemented."
        });
        
        sendNotification(
          `Incoming call from ${user?.username || "Someone"}`,
          {
            body: "Tap to answer",
            data: { url: `/community/chat/${user?.id}` }
          }
        );
      } else {
        toast.error("Microphone access is required for audio calls");
      }
    } catch (error) {
      console.error('Error starting audio call:', error);
      toast.error("Could not start audio call");
    }
  };
  
  // Handle video call
  const handleVideoCall = async () => {
    try {
      const permissions = await requestMediaPermissions();
      
      if (permissions.video && permissions.audio) {
        toast("Starting video call...", {
          description: "Video calling feature is being implemented."
        });
        
        sendNotification(
          `Incoming video call from ${user?.username || "Someone"}`,
          {
            body: "Tap to answer",
            data: { url: `/community/chat/${user?.id}` }
          }
        );
      } else {
        toast.error("Camera and microphone access is required for video calls");
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      toast.error("Could not start video call");
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
          <p>Loading contact information...</p>
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
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-8 w-8"
            onClick={handleAudioCall}
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-8 w-8"
            onClick={handleVideoCall}
          >
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Friend restriction notice */}
        {isFriend === false && !isCheckingFriend && (
          <div className="bg-muted p-3 rounded-lg text-center">
            <p className="text-sm mb-2">You need to be friends to message this user</p>
            <Button size="sm" onClick={handleSendFriendRequest}>
              Send Friend Request
            </Button>
          </div>
        )}
        
        {contactError && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center">
            <p className="text-sm text-red-500 dark:text-red-400">{contactError}</p>
            <p className="text-xs text-muted-foreground mt-1">Using limited profile information</p>
          </div>
        )}
        
        {messages.length > 0 ? (
          messages.map((message) => {
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
            disabled={!newMessage.trim() || isFriend === false}
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
