
import { Bot, Brain, MessageCircle, Network, Sparkle, Target, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";

const Nora = () => {
  const navigate = useNavigate();

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
      icon: <Sparkle className="h-8 w-8 text-amber-500" />,
      title: "Creative Insights",
      description: "Receive unique perspectives and solutions to overcome learning obstacles."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Nora - Coming Soon" 
        subtitle="Your AI companion for focus and connection"
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
            Nora is being designed to help you connect, focus, and achieve your goals.
            Whether you're studying, working, or building relationships, Nora will be there
            to provide smart assistance tailored to your needs.
          </motion.p>
        </div>
        
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
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-6">
            Nora is currently in development. Stay tuned for updates and be the first to experience
            the future of AI-assisted learning and connection.
          </p>
          
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
