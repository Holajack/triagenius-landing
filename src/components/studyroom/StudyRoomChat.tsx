
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SendHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { useIsMobile } from '@/hooks/use-mobile';
import { useKeyboardVisibility } from '@/hooks/use-keyboard-visibility';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { isKeyboardVisible, keyboardHeight } = useKeyboardVisibility({
    debounceTime: 150,
    onKeyboardShow: () => {
      if (autoScrollEnabled) {
        // Add a small delay to let the layout adjust
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    },
    onKeyboardHide: () => {
      // Also scroll when keyboard hides to maintain context
      if (autoScrollEnabled) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  });

  // Scroll to bottom when messages change or when needed
  const scrollToBottom = () => {
    if (autoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Update viewport height on resize and orientation change
  useEffect(() => {
    const setInitialHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setInitialHeight();
    window.addEventListener('resize', setInitialHeight);
    window.addEventListener('orientationchange', setInitialHeight);
    
    return () => {
      window.removeEventListener('resize', setInitialHeight);
      window.removeEventListener('orientationchange', setInitialHeight);
    };
  }, []);

  // Monitor scroll position to detect if user has scrolled up
  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    
    const scrollElement = scrollAreaRef.current;
    const viewportHeight = scrollElement.clientHeight;
    const scrollHeight = scrollElement.scrollHeight;
    const scrollTop = scrollElement.scrollTop;
    
    // Consider "scrolled to bottom" if within 20px of the bottom
    const isScrolledToBottom = Math.abs(scrollHeight - viewportHeight - scrollTop) < 50;
    
    setAutoScrollEnabled(isScrolledToBottom);
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card 
      className={cn(
        "flex flex-col overflow-hidden",
        isMobile ? "h-[calc(var(--vh,1vh)*100-80px)]" : "h-[70vh] md:mr-4"
      )}
    >
      <CardContent className="flex flex-col h-full p-0">
        <div className="p-3 border-b shrink-0">
          <h3 className="font-medium">Chat</h3>
        </div>

        {/* Scrollable message area */}
        <ScrollArea 
          className="flex-1 h-[calc(100%-120px)]"
          onScroll={handleScroll}
          ref={scrollAreaRef}
        >
          <div className="p-4 space-y-4">
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
            {/* Space at the bottom to prevent messages being hidden under input */}
            <div className="h-16" />
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Fixed input area */}
        <div 
          className={cn(
            "p-3 border-t bg-card shrink-0",
            isKeyboardVisible && isMobile ? "animate-slide-up" : ""
          )}
          style={{
            position: isKeyboardVisible && isMobile ? 'fixed' : 'relative',
            bottom: isKeyboardVisible && isMobile ? `${keyboardHeight}px` : 'auto',
            left: 0,
            right: 0,
            width: '100%',
            paddingBottom: `calc(0.5rem + var(--sat-bottom, 0.5rem))`,
            zIndex: 10
          }}
        >
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => {
                setIsInputFocused(true);
                if (autoScrollEnabled) {
                  setTimeout(() => {
                    scrollToBottom();
                  }, 100);
                }
              }}
              onBlur={() => setIsInputFocused(false)}
              className="min-h-[60px] resize-none"
              style={{
                height: isKeyboardVisible && isMobile ? '50px' : '60px'
              }}
            />
            <Button
              onClick={onSendMessage}
              disabled={!message.trim()}
              className="self-end shrink-0"
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
