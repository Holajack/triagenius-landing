
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import AnimatedIcon from "@/components/AnimatedIcon";
import FocusButton from "@/components/FocusButton";
import HowItWorks from "@/components/HowItWorks";
import * as ServiceWorker from "@/components/ServiceWorker";
import { ArrowRight, ArrowDown, Clock } from "lucide-react";
import { OnboardingDialog } from "@/components/onboarding/OnboardingDialog";

const Index = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Register service worker for offline functionality
    ServiceWorker.register();
    
    // Set loaded state after a short delay to trigger animations
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      ServiceWorker.unregister();
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const handleStartFocusing = () => {
    setShowOnboarding(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-purple-50/30">
      <Navbar />
      
      {/* Onboarding Dialog */}
      <OnboardingDialog 
        open={showOnboarding} 
        onOpenChange={setShowOnboarding} 
      />
      
      <main className="flex-grow flex flex-col">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-28 pb-16 md:pt-32 md:pb-24 flex flex-col items-center justify-center text-center">
          <motion.div
            className="max-w-2xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
          >
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center px-3 py-1 mb-6 text-sm rounded-full bg-purple-100/80 text-triage-purple"
            >
              <Clock className="w-4 h-4 mr-1" />
              <span>Your productivity journey starts here</span>
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-gray-900 tracking-tight"
            >
              Master Your Focus <span className="text-transparent bg-clip-text bg-gradient-to-r from-triage-indigo to-triage-purple">&amp; Productivity</span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl mx-auto"
            >
              Boost concentration, track progress, and level up through gamified work sessions.
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12"
            >
              <FocusButton 
                label="Start Focusing" 
                icon="play" 
                className="w-full md:w-auto"
                onClick={handleStartFocusing}
              />
              
              <FocusButton 
                label="Log In" 
                icon="target" 
                isPrimary={false} 
                className="w-full md:w-auto"
                onClick={() => console.log("Log in")}
              />
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="flex justify-center"
            >
              <HowItWorks />
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="mt-12 md:mt-16 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatedIcon className="animate-float" />
            <motion.div
              className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 0.7, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6, ease: "easeOut" }}
            >
              <ArrowDown className="w-5 h-5 text-gray-400" />
            </motion.div>
          </motion.div>
        </section>
        
        {/* Features Preview Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              {[
                { 
                  title: "Focus Sessions", 
                  description: "Set customizable timers for deep work and concentration.",
                  delay: 0
                },
                { 
                  title: "Progress Tracking", 
                  description: "Visualize your productivity trends and achievements.",
                  delay: 0.1
                },
                { 
                  title: "Reward System", 
                  description: "Unlock achievements as you build consistent focus habits.",
                  delay: 0.2
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="glass rounded-2xl p-6 subtle-shadow border border-white/80 hover:border-purple-100 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: feature.delay + 0.3, duration: 0.5 }}
                >
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} The Triage System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
