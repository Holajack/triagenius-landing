
import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRoomMessages } from "@/hooks/use-room-messages";
import { formatDistanceToNow } from "date-fns";

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
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<StudyRoomMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Convert room messages to display format
  useEffect(() => {
    if (!roomMessages.length) return;
    
    const formattedMessages = roomMessages.map(msg => ({
      id: msg.id,
      sender: msg.sender?.username || "Unknown User",
      content: msg.content,
      timestamp: formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }),
      avatar: msg.sender?.avatar_url || "",
      senderId: msg.sender_id
    }));
    
    setMessages(formattedMessages);
  }, [roomMessages]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      const sent = await sendMessage(message);
      if (sent) {
        setMessage("");
      }
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
  
  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border rounded-lg">
        {messages.length > 0 ? (
          <>
            {messages.map((msg) => (
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
      
      <div className="flex gap-2">
        <Input 
          placeholder="Type a message..." 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={handleSendMessage} disabled={!message.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
