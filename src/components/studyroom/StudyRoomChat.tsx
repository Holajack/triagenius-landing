
import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRoomMessages } from "@/hooks/use-room-messages";
import { useUser } from "@/hooks/use-user";

interface StudyRoomChatProps {
  roomId: string;
}

export const StudyRoomChat = ({ roomId }: StudyRoomChatProps) => {
  const { messages: roomMessages, sendMessage, loading } = useRoomMessages(roomId);
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputMessage, setInputMessage] = useState("");
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [roomMessages]);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    try {
      await sendMessage(inputMessage);
      setInputMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Card className="flex flex-col h-[65vh]">
      <div className="p-3 border-b flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="font-medium">Room Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-muted mb-2"></div>
              <div className="h-4 w-32 bg-muted rounded mb-2"></div>
              <div className="h-3 w-24 bg-muted rounded"></div>
            </div>
          </div>
        ) : roomMessages.length > 0 ? (
          <>
            {roomMessages.map((msg) => {
              const isCurrentUser = msg.sender?.id === user?.id;
              
              return (
                <div key={msg.id} className={`flex gap-2 ${isCurrentUser ? 'justify-end' : ''}`}>
                  {!isCurrentUser && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={msg.sender?.avatar_url || ""} />
                      <AvatarFallback>{(msg.sender?.username || "?")[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`flex flex-col max-w-[80%] ${isCurrentUser ? 'items-end' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(msg.created_at)}
                      </span>
                      <span className="font-medium text-sm">
                        {isCurrentUser ? 'You' : msg.sender?.username || "Unknown User"}
                      </span>
                    </div>
                    
                    <div className={`px-3 py-2 rounded-lg mt-1 ${
                      isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <p className="text-sm break-words">{msg.content}</p>
                    </div>
                  </div>
                  
                  {isCurrentUser && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={user?.avatarUrl || ""} />
                      <AvatarFallback>{(user?.username || "?")[0]}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
            <p>No messages yet</p>
            <p className="text-sm mt-2">Start the conversation!</p>
          </div>
        )}
      </div>
      
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input 
            placeholder="Type a message..." 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!inputMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
