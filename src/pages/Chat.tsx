
import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, Smile, AlertTriangle, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from "date-fns";
import { getDisplayName, getInitials } from "@/hooks/use-display-name";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardVisibility } from "@/hooks/use-keyboard-visibility";
import { ScrollArea } from "@/components/ui/scroll-area";

const Chat = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [contact, setContact] = useState<any | null>(null);
  const [contactLoading, setContactLoading] = useState(true);
  const [contactError, setContactError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const { user } = useUser();
  const { 
    getConversation, 
    sendMessage, 
    markAsRead, 
    setTypingStatus, 
    isUserTyping
  } = useRealtimeMessages();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const isMobile = useIsMobile();
  
  const { isKeyboardVisible, keyboardHeight } = useKeyboardVisibility({
    onKeyboardShow: () => {
      if (autoScrollEnabled) {
        setTimeout(() => {
          messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    },
    onKeyboardHide: () => {
      if (autoScrollEnabled) {
        setTimeout(() => {
          messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  });
  
  const isContactTyping = id && isUserTyping(id);

  const fetchConversationMessages = useCallback(async () => {
    if (!id || !user?.id) return;
    
    try {
      const conversationMessages = await getConversation(id);
      setCurrentMessages(conversationMessages);
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
      toast.error("Could not load messages. Please try again.");
      setMessageError("Failed to load conversation messages");
    }
  }, [id, user?.id, getConversation]);

  useEffect(() => {
    fetchConversationMessages();
  }, [fetchConversationMessages]);

  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase.channel('online-users');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        
        Object.keys(state).forEach(presenceKey => {
          const presences = state[presenceKey] as any[];
          presences.forEach(presence => {
            if (presence.userId && presence.userId !== user.id) {
              online.add(presence.userId);
            }
          });
        });
        
        setOnlineUsers(online);
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.error('Failed to subscribe to online users channel:', status);
        }
      });
      
    channel.track({
      userId: user.id,
      online_at: new Date().toISOString(),
    });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!id || !user?.id) return;
    
    const channel = supabase.channel(`private-messages-${id}-${user.id}`);
    
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${user.id}`
      }, payload => {
        console.log('New message received:', payload);
        
        if (payload.new.sender_id === id) {
          setCurrentMessages(prev => {
            if (prev.some(msg => msg.id === payload.new.id)) {
              return prev;
            }
            
            const updated = [...prev, payload.new];
            return updated.sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
          
          markAsRead(payload.new.id);
        }
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.error('Failed to subscribe to private messages channel:', status);
        }
      });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user?.id, markAsRead]);

  useEffect(() => {
    if (!id || !user?.id) return;
    
    currentMessages.forEach(msg => {
      if (msg.sender_id === id && !msg.is_read) {
        markAsRead(msg.id);
      }
    });
  }, [id, currentMessages, user?.id, markAsRead]);

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    
    setContactLoading(true);
    setContactError(null);
    
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, display_name_preference, avatar_url')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching contact profile:', error);
        
        if (error.code === 'PGRST116') {
          setContactError("User profile not found. They may have deleted their account.");
        } else if (error.code === 'PGRST301') {
          setContactError("You don't have permission to view this profile.");
        } else {
          setContactError("Could not load contact information. Please try again later.");
        }
        
        setContactLoading(false);
        return;
      }
      
      const isOnline = onlineUsers.has(id);
      setContact({
        id: profileData.id,
        username: profileData.username || `User-${id.substring(0, 4)}`,
        full_name: profileData.full_name,
        display_name_preference: profileData.display_name_preference,
        avatar_url: profileData.avatar_url,
        online: isOnline,
        status: isOnline ? "Online" : "Offline"
      });
      
      setContactLoading(false);
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      setContactError("An unexpected error occurred. Please try again later.");
      setContactLoading(false);
    }
  }, [id, onlineUsers]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    if (autoScrollEnabled && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  useEffect(() => {
    if (isContactTyping || currentMessages.length > 0) {
      scrollToBottom();
    }
  }, [currentMessages, isContactTyping]);
  
  // Monitor scroll position to detect if user has scrolled up
  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    
    const scrollElement = scrollAreaRef.current;
    const viewportHeight = scrollElement.clientHeight;
    const scrollHeight = scrollElement.scrollHeight;
    const scrollTop = scrollElement.scrollTop;
    
    // Consider "scrolled to bottom" if within 20px of the bottom
    const isScrolledToBottom = Math.abs(scrollHeight - viewportHeight - scrollTop) < 20;
    
    setAutoScrollEnabled(isScrolledToBottom);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!id) return;
    
    setTypingStatus(id, true);
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    const timeout = setTimeout(() => {
      if (id) {
        setTypingStatus(id, false);
      }
    }, 3000);
    
    setTypingTimeout(timeout);
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id || !user?.id || isSending) return;
    
    try {
      setIsSending(true);
      setMessageError(null);
      const sent = await sendMessage(id, newMessage);
      
      if (sent) {
        setNewMessage("");
        
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }
        setTypingStatus(id, false);
        
        const newMsg = {
          ...sent,
          sender_id: user.id,
          recipient_id: id,
          content: newMessage,
          is_read: false,
          created_at: new Date().toISOString()
        };
        
        setCurrentMessages(prev => [...prev, newMsg].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ));
        
        inputRef.current?.focus();
        setAutoScrollEnabled(true);
        
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else {
        console.error('Failed to send message');
        toast.error("Failed to send message. Please try again.");
        setMessageError("Message could not be sent. Check your connection and try again.");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message. Please try again.");
      setMessageError("Error sending message. Please try again later.");
    } finally {
      setIsSending(false);
    }
  };
  
  const handleRetryLoad = () => {
    if (contactError) {
      fetchProfile();
    }
    
    if (messageError) {
      fetchConversationMessages();
    }
  };
  
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
  
  if ((!id) || (!user?.id)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-lg font-medium">{!id ? "No user selected" : "You need to be logged in"}</p>
          <p className="mt-2 text-muted-foreground">
            {!id ? "Please select a conversation." : "Please log in to view and send messages."}
          </p>
          <Button 
            className="mt-4" 
            onClick={() => navigate('/community')}
          >
            Go to Community
          </Button>
        </div>
      </div>
    );
  }

  if (contactLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }
  
  const contactDisplayName = contact ? getDisplayName({
    username: contact.username || '',
    full_name: contact.full_name || '',
    display_name_preference: contact.display_name_preference
  }) : "Unknown User";
  
  const contactInitials = contact ? getInitials(contactDisplayName) : "?";
  
  return (
    <div 
      className="flex flex-col bg-background" 
      style={{ 
        height: isMobile ? 'calc(var(--vh, 1vh) * 100)' : '100vh',
        maxHeight: isMobile ? 'calc(var(--vh, 1vh) * 100)' : '100vh',
        overflow: 'hidden'
      }}
    >
      {/* Fixed header that stays at the top */}
      <div className="border-b p-3 flex items-center justify-between bg-card z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/community')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar>
                <AvatarImage src={contact?.avatar_url || ""} alt={contactDisplayName} />
                <AvatarFallback>{contactInitials}</AvatarFallback>
              </Avatar>
              {contact?.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            
            <div>
              <h2 className="font-medium text-sm">{contactDisplayName}</h2>
              <p className="text-xs text-muted-foreground">
                {isContactTyping ? "typing..." : contact?.status || "Offline"}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scrollable message area */}
      <ScrollArea 
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
        ref={scrollAreaRef}
      >
        <div 
          className="p-4 space-y-4"
          style={{ 
            paddingBottom: isKeyboardVisible && isMobile ? `${Math.max(80, keyboardHeight/2)}px` : '80px'
          }}
        >
          {contactError && (
            <Alert variant="default" className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
              <AlertTitle>Contact Information Issue</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <p>{contactError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="self-start mt-2" 
                  onClick={handleRetryLoad}
                >
                  <RefreshCw className="h-3 w-3 mr-2" /> Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {messageError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Message Error</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <p>{messageError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="self-start mt-2 bg-background text-foreground hover:bg-muted" 
                  onClick={handleRetryLoad}
                >
                  <RefreshCw className="h-3 w-3 mr-2" /> Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {currentMessages.length > 0 ? (
            currentMessages.map((message) => {
              const isUnread = !message.is_read;
              const isCurrentUserSender = message.sender_id === user?.id;
              const messageTime = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });
              
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isCurrentUserSender ? 'justify-end' : 'justify-start'}`}
                >
                  {!isCurrentUserSender && (
                    <Avatar className="h-8 w-8 mr-2 mt-1">
                      <AvatarImage src={contact?.avatar_url || ""} alt={contactDisplayName} />
                      <AvatarFallback>{contactInitials}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div 
                    className={`max-w-[75%] p-3 rounded-lg ${
                      isCurrentUserSender 
                        ? 'bg-primary text-primary-foreground' 
                        : isUnread ? 'bg-muted/80' : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                      isCurrentUserSender ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      <span>{messageTime}</span>
                      {isCurrentUserSender && (
                        <span>{message.is_read ? '✓✓' : '✓'}</span>
                      )}
                    </div>
                  </div>
                  
                  {isCurrentUserSender && (
                    <Avatar className="h-8 w-8 ml-2 mt-1">
                      <AvatarImage src={user?.avatarUrl || ""} />
                      <AvatarFallback>{(user?.username || "?")[0]}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
              <p>No messages yet</p>
              <p className="text-sm mt-2">Send a message to start the conversation</p>
            </div>
          )}
          
          {isContactTyping && (
            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "100ms" }}></div>
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "200ms" }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messageEndRef} />
        </div>
      </ScrollArea>
      
      {/* Input area that stays fixed at the bottom */}
      <div className={cn(
        "border-t p-3 bg-card sticky bottom-0 z-20",
        isKeyboardVisible && isMobile ? "shadow-lg" : ""
      )}
      style={{
        position: "sticky",
        bottom: isKeyboardVisible && isMobile ? `${keyboardHeight}px` : 0,
        width: '100%'
      }}
      >
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full shrink-0"
            onClick={() => toast.info("File sharing coming soon")}
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>
          
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            className="rounded-full"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            onClick={() => {
              if (isMobile && inputRef.current) {
                inputRef.current.focus();
                setAutoScrollEnabled(true);
                setTimeout(() => {
                  scrollToBottom();
                }, 100);
              }
            }}
          />
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full shrink-0"
            onClick={() => toast.info("Emoji picker coming soon")}
          >
            <Smile className="h-5 w-5 text-muted-foreground" />
          </Button>
          
          <Button 
            className="rounded-full h-10 w-10 p-0 shrink-0"
            disabled={!newMessage.trim() || isSending}
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
