import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SendHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { useIsMobile } from '@/hooks/use-mobile';

export interface RoomMessage {
  id: string;
  user_id: string;
  room_id: string;
  content: string;
  created_at: string;
  user?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface StudyRoomChatProps {
  messages: RoomMessage[];
  isLoading: boolean;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  onSendMessage: () => Promise<void>;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const StudyRoomChat = ({
  messages,
  isLoading,
  message,
  setMessage,
  onSendMessage,
  onKeyDown
}: StudyRoomChatProps) => {
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Detect keyboard visibility on mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const detectKeyboard = () => {
      if (!window.visualViewport) return;
      
      // On iOS, the viewport height changes when the keyboard appears
      const isKeyboardOpen = window.visualViewport.height < window.innerHeight * 0.8;
      
      setIsKeyboardVisible(isKeyboardOpen);
      
      if (chatContainerRef.current && isKeyboardOpen) {
        // Calculate keyboard height as the difference between window inner height and visual viewport height
        const keyboardHeight = window.innerHeight - window.visualViewport.height;
        
        // Add padding to ensure content isn't hidden behind keyboard
        chatContainerRef.current.style.paddingBottom = `${keyboardHeight + 20}px`;
        
        // Scroll the messages container to keep the input in view
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else if (chatContainerRef.current) {
        chatContainerRef.current.style.paddingBottom = '';
      }
    };
    
    // Listen for visualViewport changes (modern browsers)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', detectKeyboard);
      window.visualViewport.addEventListener('scroll', detectKeyboard);
    }
    
    // Also listen for window resize as a fallback
    window.addEventListener('resize', detectKeyboard);
    
    // Initial check
    detectKeyboard();
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', detectKeyboard);
        window.visualViewport.removeEventListener('scroll', detectKeyboard);
      }
      window.removeEventListener('resize', detectKeyboard);
    };
  }, [isMobile]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Additional effect to keep input visible when keyboard is shown
  useEffect(() => {
    if (isKeyboardVisible && isMobile && textareaRef.current) {
      // Short timeout to let the keyboard fully appear
      setTimeout(() => {
        textareaRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [isKeyboardVisible, isMobile]);

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card 
      className={cn(
        "flex flex-col h-[500px] md:h-[70vh] mb-4 md:mb-0 md:mr-4",
        isKeyboardVisible && isMobile && "h-[85vh]"
      )}
      ref={chatContainerRef}
    >
      <CardContent className="flex flex-col h-full p-0">
        <div className="p-3 border-b">
          <h3 className="font-medium">Chat</h3>
        </div>

        <div className={cn(
          "flex-grow overflow-y-auto p-4 space-y-4",
          isKeyboardVisible && isMobile && "pb-20"
        )}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = msg.user_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-2',
                    isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <Avatar className="h-8 w-8">
                    {msg.user?.avatar_url ? (
                      <AvatarImage src={msg.user.avatar_url} />
                    ) : (
                      <AvatarFallback>
                        {msg.user?.display_name?.[0] || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div
                    className={cn(
                      'max-w-[70%] rounded-lg px-3 py-2 text-sm',
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <div className="flex justify-between gap-4 mb-1">
                      <span className="font-medium">
                        {isCurrentUser
                          ? 'You'
                          : msg.user?.display_name || 'Anonymous'}
                      </span>
                      <span className="text-xs opacity-70">
                        {formatTimestamp(msg.created_at)}
                      </span>
                    </div>
                    <p className="whitespace-pre-line break-words">{msg.content}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={cn(
          "p-3 border-t mt-auto",
          isKeyboardVisible && isMobile && "sticky bottom-0 bg-card z-10 shadow-md"
        )}>
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={onKeyDown}
              className={cn(
                "min-h-[80px]",
                isKeyboardVisible && isMobile && "min-h-[60px]"
              )}
              onFocus={() => {
                // Scroll to bottom when input is focused
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 300);
              }}
            />
            <Button
              onClick={onSendMessage}
              disabled={!message.trim()}
              className="self-end"
            >
              <SendHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudyRoomChat;
