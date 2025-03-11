
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mockMessages = [
  {
    id: 1,
    sender: "Sarah Johnson",
    avatar: "/placeholder.svg",
    message: "Hey! Want to join our study session?",
    time: "2m ago",
    unread: true,
  },
  {
    id: 2,
    sender: "Study Group",
    avatar: "/placeholder.svg",
    message: "Great progress everyone!",
    time: "1h ago",
    unread: false,
  }
];

export const MessageInbox = () => {
  return (
    <div className="space-y-4">
      {mockMessages.map((message) => (
        <Card 
          key={message.id} 
          className={`p-4 ${message.unread ? 'bg-muted/50' : ''}`}
        >
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={message.avatar} alt={message.sender} />
              <AvatarFallback>{message.sender[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{message.sender}</h3>
                <span className="text-xs text-muted-foreground">{message.time}</span>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {message.message}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
