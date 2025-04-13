
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
import { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

const MAX_RETRY_ATTEMPTS = 3;

const Chat = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [initialScrollComplete, setInitialScrollComplete] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [channelStatus, setChannelStatus] = useState<string | null>(null);
  
  const { isKeyboardVisible, keyboardHeight } = useKeyboardVisibility({
    onKeyboardShow: () => {
      inputRef.current?.focus();
      setTimeout(() => scrollToBottom('auto'), 300);
    },
    onKeyboardHide: () => {
      setTimeout(() => scrollToBottom('auto'), 300);
    },
    debounceTime: 150
  });
  
  const isContactTyping = id && isUserTyping(id);
  const isMobile = useIsMobile();

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ 
        behavior: behavior, 
        block: 'start'
      });
    }
  }, []);

  const fetchConversationMessages = useCallback(async () => {
    if (!id || !user?.id) return;
    
    try {
      setIsRetrying(true);
      console.log("Fetching conversation messages for user ID:", id);
      const conversationMessages = await getConversation(id);
      
      if (!conversationMessages || conversationMessages.length === 0) {
        console.log("No messages found or empty response");
      } else {
        console.log(`Retrieved ${conversationMessages.length} messages`);
      }
      
      setCurrentMessages(conversationMessages);
      setMessageError(null);
      setHasLoadedMessages(true);
      setRetryCount(0);
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
      
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        const nextRetry = retryCount + 1;
        setRetryCount(nextRetry);
        
        const delay = Math.min(1000 * Math.pow(2, nextRetry), 8000);
        console.log(`Retry attempt ${nextRetry}/${MAX_RETRY_ATTEMPTS} in ${delay}ms`);
        
        setTimeout(() => {
          if (id && user?.id) fetchConversationMessages();
        }, delay);
      } else {
        toast.error("Could not load messages. Please try again.");
        setMessageError("Failed to load conversation messages. Please check your connection.");
      }
    } finally {
      setIsRetrying(false);
    }
  }, [id, user?.id, getConversation, retryCount]);

  useEffect(() => {
    fetchConversationMessages();
  }, [fetchConversationMessages]);

  useEffect(() => {
    if (hasLoadedMessages && currentMessages.length > 0) {
      const timeoutId = setTimeout(() => {
        scrollToBottom();
        setInitialScrollComplete(true);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [hasLoadedMessages, currentMessages.length, scrollToBottom]);

  useEffect(() => {
    if (initialScrollComplete && currentMessages.length > 0) {
      scrollToBottom('smooth');
    }
  }, [initialScrollComplete, currentMessages.length, scrollToBottom]);

  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });
    
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
        if (status === 'SUBSCRIBED') {
          channel.track({
            userId: user.id,
            online_at: new Date().toISOString(),
          });
        } else if (status !== 'SUBSCRIBED' && status !== 'TIMED_OUT') {
          console.error('Failed to subscribe to online users channel:', status);
        }
      });
      
    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!id || !user?.id) return;
    
    const channelName = `private-messages-${id}-${user.id}`;
    
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: {
          self: false
        }
      }
    });
    
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
        setChannelStatus(status);
        
        if (status !== REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          console.error('Failed to subscribe to private messages channel:', status);
          
          if (
            status === REALTIME_SUBSCRIBE_STATES.CLOSED || 
            status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
            status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT
          ) {
            setTimeout(() => {
              console.log('Attempting to reconnect to message channel');
              const reconnectionChannel = supabase.channel(channelName);
              reconnectionChannel
                .on('postgres_changes', {
                  event: 'INSERT',
                  schema: 'public',
                  table: 'messages',
                  filter: `recipient_id=eq.${user.id}`
                }, payload => {
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
                .subscribe((newStatus) => {
                  setChannelStatus(newStatus);
                  console.log(`Channel reconnection status: ${newStatus}`);
                });
            }, 2000);
          }
        }
      });
    
    return () => {
      channel.unsubscribe();
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
        setTimeout(() => scrollToBottom('smooth'), 100);
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
    setRetryCount(0);
    if (contactError) {
      fetchProfile();
    }
    
    if (messageError) {
      fetchConversationMessages();
    }
  };
  
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
      className="flex flex-col h-[100vh] bg-background overflow-hidden"
      style={{
        height: `calc(var(--vh, 1vh) * 100)`, 
        maxHeight: `calc(var(--vh, 1vh) * 100)`
      }}
    >
      <header className="border-b p-3 flex items-center justify-between bg-card z-30 shadow-sm shrink-0">
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
        
        {channelStatus && channelStatus !== REALTIME_SUBSCRIBE_STATES.SUBSCRIBED && (
          <div className="text-xs text-yellow-500 flex items-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse"></div>
            Reconnecting...
          </div>
        )}
      </header>
      
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea 
          className="h-full pb-safe" 
          ref={messagesContainerRef}
        >
          {currentMessages.length > 0 && (
            <div className="flex-grow pt-4" />
          )}
          
          <div className="p-4 space-y-4">
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
                    disabled={isRetrying}
                  >
                    {isRetrying ? (
                      <>
                        <div className="animate-spin h-3 w-3 mr-2 border-2 border-primary border-t-transparent rounded-full"></div>
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-2" /> Retry
                      </>
                    )}
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
                    disabled={isRetrying}
                  >
                    {isRetrying ? (
                      <>
                        <div className="animate-spin h-3 w-3 mr-2 border-2 border-primary border-t-transparent rounded-full"></div>
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-2" /> Retry
                      </>
                    )}
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
                      <Avatar className="h-8 w-8 mr-2 mt-1 shrink-0">
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
                      <p className="text-sm break-words">{message.content}</p>
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
                      <Avatar className="h-8 w-8 ml-2 mt-1 shrink-0">
                        <AvatarImage src={user?.avatarUrl || ""} />
                        <AvatarFallback>{(user?.username || "?")[0]}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center text-muted-foreground py-20">
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
            
            <div className="pb-16" />
            <div ref={messageEndRef} className="h-1" />
          </div>
        </ScrollArea>
      </div>
      
      <div 
        className={cn(
          "p-2 bg-card border-t z-30",
          isKeyboardVisible && isMobile ? "animate-slide-up" : ""
        )}
        style={{
          position: isKeyboardVisible && isMobile ? 'fixed' : 'sticky',
          bottom: isKeyboardVisible && isMobile ? `${keyboardHeight}px` : 0,
          left: 0,
          right: 0,
          paddingBottom: `calc(0.5rem + env(safe-area-inset-bottom, 0.5rem))`,
        }}
      >
        <div className="flex items-center gap-2 bg-background rounded-full border px-2">
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
            className="rounded-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
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
            {isSending ? (
              <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
