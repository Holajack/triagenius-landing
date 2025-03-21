
import { useState, useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRoomMessages } from "@/hooks/use-room-messages";

interface StudyRoomMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  avatar: string;
  senderId?: string;
}

interface StudyRoomChatProps {
  roomId: string;
}

export const StudyRoomChat = ({ roomId }: StudyRoomChatProps) => {
  const { messages: roomMessages, sendMessage, loading } = useRoomMessages(roomId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [roomMessages]);
  
  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    try {
      await sendMessage(content);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border rounded-lg">
        {roomMessages.length > 0 ? (
          <>
            {roomMessages.map((msg) => (
              <div key={msg.id} className="flex gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={msg.sender?.avatar_url || ""} />
                  <AvatarFallback>{(msg.sender?.username || "?")[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{msg.sender?.username || "Unknown User"}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : loading ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-muted mb-2"></div>
              <div className="h-4 w-32 bg-muted rounded mb-2"></div>
              <div className="h-3 w-24 bg-muted rounded"></div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
            <p>No messages yet</p>
            <p className="text-sm mt-2">Start the conversation!</p>
          </div>
        )}
      </div>
      
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

// Separate the message input for cleaner code
const MessageInput = ({ onSendMessage }: { onSendMessage: (content: string) => Promise<void> }) => {
  const [inputMessage, setInputMessage] = useState("");
  
  const handleSend = () => {
    if (!inputMessage.trim()) return;
    onSendMessage(inputMessage);
    setInputMessage("");
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="flex gap-2">
      <Input 
        placeholder="Type a message..." 
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Button onClick={handleSend} disabled={!inputMessage.trim()}>
        <MessageSquare className="h-4 w-4" />
      </Button>
    </div>
  );
};
