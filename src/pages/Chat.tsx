
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, Smile, MoreVertical, Phone, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { requestMediaPermissions, sendNotification } from "@/components/pwa/ServiceWorker";

interface ChatProfile {
  id: string;
  username: string | null;
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
  const [newMessage, setNewMessage] = useState("");
  const { user } = useUser();
  const { getConversation, sendMessage, markAsRead } = useRealtimeMessages();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  // Get conversation messages
  const messages = id ? getConversation(id) : [];
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        setContact({
          id: data.id,
          username: data.username || `User-${data.id.substring(0, 4)}`,
          avatar_url: data.avatar_url,
          online: false, // Will be updated by presence channel
          status: "Offline"
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        toast.error('Could not load contact information');
      }
    };
    
    fetchProfile();
    
    // Subscribe to user presence
    const channel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        
        Object.values(state).forEach(presence => {
          const presences = presence as Array<{user_id: string}>;
          presences.forEach(p => {
            if (p.user_id) online.add(p.user_id);
          });
        });
        
        setOnlineUsers(online);
        
        // Update contact's online status
        if (contact) {
          setContact(prev => {
            if (!prev) return prev;
            const isOnline = online.has(prev.id);
            return {
              ...prev,
              online: isOnline,
              status: isOnline ? "Online" : `Last seen ${formatDistanceToNow(new Date(), { addSuffix: true })}`,
            };
          });
        }
      })
      .subscribe();
    
    // Track user's own presence when they view the chat
    if (user?.id) {
      channel.track({
        user_id: user.id,
        online_at: new Date().toISOString()
      });
    }
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user?.id]);
  
  // Mark unread messages as read
  useEffect(() => {
    if (!id || !user?.id) return;
    
    // Mark messages from this contact as read
    messages.forEach(msg => {
      if (msg.sender_id === id && !msg.is_read) {
        markAsRead(msg.id);
      }
    });
  }, [id, messages, user?.id, markAsRead]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id || !user?.id) return;
    
    const sent = await sendMessage(id, newMessage);
    if (sent) {
      setNewMessage("");
    }
  };
  
  const handleAudioCall = async () => {
    try {
      // Request media permissions before starting a call
      const permissions = await requestMediaPermissions();
      
      if (permissions.audio) {
        // In a real app, you would initiate a call here
        toast("Starting audio call...", {
          description: "Audio calling feature is being implemented."
        });
        
        // Simulate a call notification to the other user
        // In a real app, this would be done through a server
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
  
  const handleVideoCall = async () => {
    try {
      // Request media permissions before starting a video call
      const permissions = await requestMediaPermissions();
      
      if (permissions.video && permissions.audio) {
        // In a real app, you would initiate a call here
        toast("Starting video call...", {
          description: "Video calling feature is being implemented."
        });
        
        // Simulate a call notification to the other user
        // In a real app, this would be done through a server
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
  
  if (!contact || !id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Chat not found</p>
      </div>
    );
  }
  
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
                <AvatarImage src={contact.avatar_url || ""} alt={contact.username || ""} />
                <AvatarFallback>{contact.username?.[0] || "U"}</AvatarFallback>
              </Avatar>
              {contact.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            
            <div>
              <h2 className="font-medium text-sm">{contact.username}</h2>
              <p className="text-xs text-muted-foreground">
                {contact.typing ? "typing..." : contact.status}
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
        {messages.length > 0 ? (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender_id !== user?.id && (
                <Avatar className="h-8 w-8 mr-2 mt-1">
                  <AvatarImage src={contact.avatar_url || ""} alt={contact.username || ""} />
                  <AvatarFallback>{contact.username?.[0] || "U"}</AvatarFallback>
                </Avatar>
              )}
              
              <div 
                className={`max-w-[75%] p-3 rounded-lg ${
                  message.sender_id === user?.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                  message.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>
                  <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
                  {message.sender_id === user?.id && (
                    <span>{message.is_read ? '✓✓' : '✓'}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p>No messages yet</p>
            <p className="text-sm mt-2">Send a message to start the conversation</p>
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
            onChange={(e) => setNewMessage(e.target.value)}
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
            disabled={!newMessage.trim()}
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
