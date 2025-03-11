
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Clock } from "lucide-react";

interface Message {
  id: number;
  sender: string;
  avatar: string;
  message: string;
  time: string;
  unread: boolean;
  isGroup: boolean;
  participants?: number;
  typing?: boolean;
  delivered?: boolean;
  read?: boolean;
}

const mockMessages: Message[] = [
  {
    id: 1,
    sender: "Sarah Johnson",
    avatar: "/placeholder.svg",
    message: "Hey! Want to join our study session?",
    time: "2m ago",
    unread: true,
    isGroup: false,
    typing: false,
    delivered: true,
    read: false,
  },
  {
    id: 2,
    sender: "Study Group",
    avatar: "/placeholder.svg",
    message: "Great progress everyone!",
    time: "1h ago",
    unread: false,
    isGroup: true,
    participants: 5,
    typing: true,
    delivered: true,
    read: true,
  },
  {
    id: 3,
    sender: "Michael Chen",
    avatar: "/placeholder.svg",
    message: "I just finished the chapter 5 exercises, need help with anything?",
    time: "3h ago",
    unread: false,
    isGroup: false,
    typing: false,
    delivered: true,
    read: true,
  },
  {
    id: 4,
    sender: "Design Workshop",
    avatar: "/placeholder.svg",
    message: "Emily: I've attached some mockups for everyone to review",
    time: "Yesterday",
    unread: false,
    isGroup: true,
    participants: 4,
    typing: false,
    delivered: true,
    read: true,
  },
  {
    id: 5,
    sender: "Jessica Park",
    avatar: "/placeholder.svg",
    message: "Thanks for sharing your notes from today's meeting!",
    time: "Yesterday",
    unread: false,
    isGroup: false,
    typing: false,
    delivered: true,
    read: true,
  },
];

interface MessageInboxProps {
  searchQuery?: string;
  onMessageClick?: (messageId: number) => void;
}

export const MessageInbox = ({ searchQuery = "", onMessageClick }: MessageInboxProps) => {
  const filteredMessages = mockMessages.filter(message => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      message.sender.toLowerCase().includes(searchLower) ||
      message.message.toLowerCase().includes(searchLower)
    );
  });
  
  return (
    <div className="space-y-4">
      {filteredMessages.map((message) => (
        <Card 
          key={message.id} 
          className={`p-4 ${message.unread ? 'bg-muted/50' : ''} cursor-pointer hover:bg-muted/30 transition-colors`}
          onClick={() => onMessageClick && onMessageClick(message.id)}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar>
                <AvatarImage src={message.avatar} alt={message.sender} />
                <AvatarFallback>{message.sender[0]}</AvatarFallback>
              </Avatar>
              {message.isGroup && (
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                  <Users className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium ${message.unread ? 'font-semibold' : ''}`}>
                    {message.sender}
                  </h3>
                  {message.isGroup && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {message.participants}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {message.typing && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      typing...
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {message.time}
                  </span>
                </div>
              </div>
              <p className={`text-sm truncate ${message.unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                {message.message}
              </p>
              
              <div className="mt-1 flex items-center justify-end gap-1">
                {message.delivered && (
                  <span className="text-xs text-muted-foreground">
                    {message.read ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
      
      {filteredMessages.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No messages match your search</p>
        </div>
      )}
    </div>
  );
};
