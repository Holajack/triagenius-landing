
import { useState, useRef, useEffect } from "react";
import { Bot, Brain, MessageCircle, Network, Sparkles, Target, Users, Send, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { useUser } from "@/hooks/use-user";
import { useSubscription } from "@/hooks/use-subscription";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Nora = () => {
  // Assistant configuration
  const ASSISTANT_NAME = "Nora";
  
  const navigate = useNavigate();
  const { user } = useUser();
  const { tier } = useSubscription();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm Nora, your AI companion for focus and connection. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([
    "How can I improve my focus?",
    "What are some good study techniques?",
    "Can you help me set productivity goals?"
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const maxRetries = 3;

  const features = [
    {
      icon: <Brain className="h-8 w-8 text-indigo-500" />,
      title: "AI-Powered Companion",
      description: "Meet Nora, your intelligent assistant that learns your habits and preferences."
    },
    {
      icon: <Target className="h-8 w-8 text-orange-500" />,
      title: "Enhanced Focus",
      description: "Stay on track with personalized focus sessions and reminders tailored to your workflow."
    },
    {
      icon: <Users className="h-8 w-8 text-green-500" />,
      title: "Community Connection",
      description: "Strengthen your connections with fellow students and professionals."
    },
    {
      icon: <Network className="h-8 w-8 text-blue-500" />,
      title: "Smart Networking",
      description: "Discover like-minded individuals for collaboration and growth opportunities."
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-purple-500" />,
      title: "Intuitive Communication",
      description: "Natural conversations that help you express your goals and challenges."
    },
    {
      icon: <Sparkles className="h-8 w-8 text-amber-500" />,
      title: "Creative Insights",
      description: "Receive unique perspectives and solutions to overcome learning obstacles."
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Test the connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const testResponse = await supabase.functions.invoke('nora-assistant', {
          body: {
            message: "test connection",
            userId: user?.id,
            assistantName: ASSISTANT_NAME
          }
        });
        
        console.log("Nora connection test result:", testResponse);
        
        if (testResponse.error) {
          console.error("Nora connection test error:", testResponse.error);
          setErrorDetails(testResponse.error);
          setConnectionError(true);
        }
      } catch (error) {
        console.error("Error testing Nora connection:", error);
      }
    };
    
    if (user?.id) {
      testConnection();
    }
  }, [user?.id]);

  const retryConnection = () => {
    setConnectionError(false);
    setErrorDetails(null);
    setRetryCount(0);
    // If there's a user message as the last message, retry with that
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content);
    }
  };

  const handleSendMessage = async (messageToSend?: string) => {
    const messageText = messageToSend || input;
    if (!messageText.trim()) return;
    
    const newMessage = { role: "user" as const, content: messageText };
    setMessages(prev => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);
    setConnectionError(false);
    setErrorDetails(null);

    try {
      console.log("Sending message to Nora:", { messageLength: messageText.length, userId: user?.id });
      
      const { data, error } = await supabase.functions.invoke('nora-assistant', {
        body: {
          message: messageText,
          userId: user?.id,
          assistantName: ASSISTANT_NAME
        }
      });

      if (error) {
        console.error('Error calling Nora assistant (network):', error);
        setConnectionError(true);
        setErrorDetails(`Network error: ${error.message}`);
        setRetryCount(prev => prev + 1);
        toast.error('Unable to connect to Nora');
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: "I'm having trouble connecting right now. Please try again later."
        }]);
        return;
      }

      if (data.error) {
        console.error('Error from Nora assistant:', data.error);
        setConnectionError(true);
        setErrorDetails(`API error: ${data.error}`);
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.response || "I encountered an issue processing your request."
        }]);
        
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
      } else {
        // Reset retry count on successful response
        setRetryCount(0);
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.response 
        }]);
        
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }
      }
    } catch (error) {
      console.error('Error in Nora chat:', error);
      setConnectionError(true);
      setErrorDetails(`Exception: ${error instanceof Error ? error.message : String(error)}`);
      setRetryCount(prev => prev + 1);
      toast.error('Failed to communicate with Nora');
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm having trouble connecting right now. Please try again later."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const renderChat = () => (
    <div className="flex flex-col h-[600px] max-h-[70vh] bg-background border rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, i) => (
          <div 
            key={i} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {connectionError && (
          <Alert variant="destructive" className="mx-auto max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col">
              <div className="mb-2">Connection to Nora is currently unavailable.</div>
              {errorDetails && (
                <div className="text-xs opacity-75 mb-2">Error: {errorDetails}</div>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="self-start" 
                onClick={retryConnection}
                disabled={retryCount >= maxRetries}
              >
                <RefreshCw className="h-3 w-3 mr-1" /> 
                {retryCount >= maxRetries ? "Try again later" : "Retry Connection"}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {suggestions.length > 0 && (
        <div className="px-4 py-2 border-t flex gap-2 overflow-x-auto">
          {suggestions.map((suggestion, i) => (
            <Button 
              key={i} 
              variant="outline" 
              size="sm" 
              className="whitespace-nowrap text-xs"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}
      
      <div className="border-t p-3 flex gap-2">
        <Input
          placeholder="Ask Nora something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
          disabled={isLoading || (connectionError && retryCount >= maxRetries)}
          className="flex-1"
        />
        <Button 
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || isLoading || (connectionError && retryCount >= maxRetries)}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Nora - AI Assistant" 
        subtitle="Your companion for focus and connection"
      />
      
      <div className="container px-4 py-8 max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Bot className="h-24 w-24 text-primary mx-auto" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-bold tracking-tight mb-4"
          >
            Meet Nora, Your Personal AI Companion
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl"
          >
            Nora is designed to help you connect, focus, and achieve your goals.
            Whether you're studying, working, or building relationships, Nora is here
            to provide smart assistance tailored to your needs.
          </motion.p>
        </div>
        
        {/* Chat UI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          {renderChat()}
        </motion.div>
        
        {/* Features section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="mb-4 p-3 rounded-full bg-primary/10">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Navigation buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="px-8"
              onClick={() => navigate("/dashboard")}
            >
              Return to Dashboard
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8"
              onClick={() => navigate("/community")}
            >
              Explore Community
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Nora;
