
import { MessageSquare, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StudyRoomMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  avatar: string;
}

interface StudyRoomChatProps {
  messages: StudyRoomMessage[];
  onSendMessage: () => void;
  message: string;
  setMessage: (message: string) => void;
}

export const StudyRoomChat = ({ 
  messages, 
  onSendMessage, 
  message, 
  setMessage 
}: StudyRoomChatProps) => {
  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border rounded-lg">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={msg.avatar} />
                <AvatarFallback>{msg.sender[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{msg.sender}</span>
                  <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                </div>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <Input 
          placeholder="Type a message..." 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSendMessage();
            }
          }}
        />
        <Button onClick={onSendMessage} disabled={!message.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
