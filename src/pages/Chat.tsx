import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, Smile, MoreVertical, Phone, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface ChatMessage {
  id: number;
  content: string;
  sender: "user" | "other";
  timestamp: string;
  read: boolean;
  delivered: boolean;
}

interface ChatContact {
  id: number;
  name: string;
  avatar: string;
  online: boolean;
  status: string;
  typing?: boolean;
  lastActive?: string;
}

const getMockContact = (id: string): ChatContact => {
  const contacts: Record<string, ChatContact> = {
    "1": {
      id: 1,
      name: "Sarah Johnson",
      avatar: "/placeholder.svg",
      online: true,
      status: "Available",
      typing: false
    },
    "2": {
      id: 2,
      name: "Study Group",
      avatar: "/placeholder.svg",
      online: true,
      status: "5 members",
      typing: true
    },
    "3": {
      id: 3,
      name: "Michael Chen",
      avatar: "/placeholder.svg",
      online: false,
      status: "Last active 30m ago",
      lastActive: "30m ago"
    }
  };
  
  return contacts[id] || {
    id: parseInt(id),
    name: "Unknown Contact",
    avatar: "/placeholder.svg",
    online: false,
    status: "Unavailable"
  };
};

const getMockMessages = (contactId: string): ChatMessage[] => {
  if (contactId === "1") {
    return [
      {
        id: 1,
        content: "Hey! Want to join our study session?",
        sender: "other",
        timestamp: "2:30 PM",
        read: true,
        delivered: true
      },
      {
        id: 2,
        content: "Sure! When is it happening?",
        sender: "user",
        timestamp: "2:32 PM",
        read: true,
        delivered: true
      },
      {
        id: 3,
        content: "We're starting at 4 PM today. It's a focus session for the upcoming exam.",
        sender: "other",
        timestamp: "2:33 PM",
        read: true,
        delivered: true
      },
      {
        id: 4,
        content: "Sounds good. I'll be there!",
        sender: "user",
        timestamp: "2:35 PM",
        read: true,
        delivered: true
      },
      {
        id: 5,
        content: "Great! We'll be in Study Room 3. See you then!",
        sender: "other",
        timestamp: "2:36 PM",
        read: true,
        delivered: true
      },
    ];
  } else if (contactId === "2") {
    return [
      {
        id: 1,
        content: "Welcome everyone to our study group!",
        sender: "other",
        timestamp: "Yesterday",
        read: true,
        delivered: true
      },
      {
        id: 2,
        content: "I've shared the materials for our next session.",
        sender: "other",
        timestamp: "Yesterday",
        read: true,
        delivered: true
      },
      {
        id: 3,
        content: "Thanks for sharing. I've reviewed them already.",
        sender: "user",
        timestamp: "Yesterday",
        read: true,
        delivered: true
      },
      {
        id: 4,
        content: "Great progress everyone! Let's meet again tomorrow.",
        sender: "other",
        timestamp: "1h ago",
        read: true,
        delivered: true
      }
    ];
  } else {
    return [
      {
        id: 1,
        content: "Hi there! How's your studying going?",
        sender: "other",
        timestamp: "3h ago",
        read: true,
        delivered: true
      },
      {
        id: 2,
        content: "I just finished the chapter 5 exercises, need help with anything?",
        sender: "other",
        timestamp: "3h ago",
        read: true,
        delivered: true
      },
      {
        id: 3,
        content: "It's going well, thanks! I might need some help with the database section.",
        sender: "user",
        timestamp: "2h ago",
        read: true,
        delivered: true
      },
      {
        id: 4,
        content: "Sure, I can help with that. Want to set up a quick call later?",
        sender: "other",
        timestamp: "2h ago",
        read: true,
        delivered: true
      }
    ];
  }
};

const Chat = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [contact, setContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  useEffect(() => {
    if (id) {
      setContact(getMockContact(id));
      setMessages(getMockMessages(id));
    }
  }, [id]);
  
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !id) return;
    
    const newMsg: ChatMessage = {
      id: messages.length + 1,
      content: newMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      delivered: true
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage("");
    
    setTimeout(() => {
      if (contact?.typing) {
        const reply: ChatMessage = {
          id: messages.length + 2,
          content: "Thanks for your message! I'll get back to you soon.",
          sender: "other",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: true,
          delivered: true
        };
        
        setMessages(prev => [...prev, reply]);
      }
    }, 3000);
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
                <AvatarImage src={contact.avatar} alt={contact.name} />
                <AvatarFallback>{contact.name[0]}</AvatarFallback>
              </Avatar>
              {contact.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            
            <div>
              <h2 className="font-medium text-sm">{contact.name}</h2>
              <p className="text-xs text-muted-foreground">
                {contact.typing ? "typing..." : contact.status}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8"
            onClick={() => toast("Feature coming soon", {
              description: "Audio calls will be available in a future update."
            })}>
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8"
            onClick={() => toast("Feature coming soon", {
              description: "Video calls will be available in a future update."
            })}>
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender === 'other' && (
              <Avatar className="h-8 w-8 mr-2 mt-1">
                <AvatarImage src={contact.avatar} alt={contact.name} />
                <AvatarFallback>{contact.name[0]}</AvatarFallback>
              </Avatar>
            )}
            
            <div 
              className={`max-w-[75%] p-3 rounded-lg ${
                message.sender === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
              }`}>
                <span>{message.timestamp}</span>
                {message.sender === 'user' && (
                  <span>{message.read ? '✓✓' : '✓'}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>
      
      <div className="border-t p-3 bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full"
            onClick={() => toast("Feature coming soon", {
              description: "File attachments will be available in a future update."
            })}>
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
          
          <Button variant="ghost" size="icon" className="rounded-full"
            onClick={() => toast("Feature coming soon", {
              description: "Emoji picker will be available in a future update."
            })}>
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

