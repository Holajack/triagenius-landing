
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import AnimatedIcon from "@/components/AnimatedIcon";
import FocusButton from "@/components/FocusButton";
import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isPwa = window.matchMedia('(display-mode: standalone)').matches || 
               (window.navigator as any).standalone === true;
  
  useEffect(() => {
    // Set loaded state after a short delay to trigger animations
    const timer = setTimeout(() => {
      setIsLoaded(true);
      setIsLoading(false);
    }, 100);
    
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setIsAuthenticated(!!data.session);
        setIsLoading(false);
        
        // If authenticated and in PWA mode, go straight to dashboard
        if (!!data.session && isPwa) {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
      }
    );
    
    return () => {
      clearTimeout(timer);
      authListener.subscription.unsubscribe();
    };
  }, [navigate, isPwa]);

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

  return (
    <div className={`flex flex-col min-h-screen ${theme === 'light' ? 'bg-gradient-to-b from-white to-purple-50/30' : 'bg-gradient-to-b from-gray-900 to-gray-800'}`}>
      <Navbar />
      
      <main className="flex-grow flex flex-col justify-center">
        {/* Hero Section - Simplified for mobile/PWA */}
        <section className="container mx-auto px-4 pt-16 pb-12 md:pt-32 md:pb-24 flex flex-col items-center justify-center text-center">
          <motion.div
            className="max-w-2xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
          >
            <motion.div 
              variants={itemVariants}
              className={`inline-flex items-center px-3 py-1 mb-4 text-sm rounded-full ${
                theme === 'light' ? 'bg-purple-100/80 text-triage-purple' : 'bg-purple-900/50 text-purple-200'
              }`}
            >
              <Clock className="w-4 h-4 mr-1" />
              <span>Your productivity journey starts here</span>
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 text-gray-900 tracking-tight dark:text-gray-100"
            >
              Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-triage-indigo to-triage-purple">Focus</span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-lg text-gray-600 mb-8 max-w-xl mx-auto dark:text-gray-300"
            >
              Boost concentration, track progress, and level up through gamified work sessions.
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-col md:flex-row items-center justify-center gap-3 mb-6"
            >
              {isLoading ? (
                <div className="w-full h-14 bg-gray-200 animate-pulse rounded-xl"></div>
              ) : (
                <FocusButton 
                  label={isAuthenticated ? "Continue Session" : "Start Focusing"} 
                  icon="play" 
                  className="w-full"
                  navigateTo={isAuthenticated ? "/dashboard" : "/auth"}
                  onClick={() => {
                    if (isPwa) {
                      localStorage.removeItem('pwaNavigationIntent');
                      console.log('Navigating to auth from Index');
                    }
                  }}
                />
              )}
              
              {isLoading ? (
                <div className="w-full h-14 bg-gray-200 animate-pulse rounded-xl"></div>
              ) : (
                <FocusButton 
                  label={isAuthenticated ? "Logout" : "Log In"} 
                  isPrimary={false} 
                  icon="login"
                  className="w-full"
                  navigateTo={"/auth"}
                  onClick={() => {
                    if (isPwa) {
                      localStorage.removeItem('pwaNavigationIntent');
                      console.log('Navigating to auth from Index');
                    }
                  }}
                />
              )}
            </motion.div>
          </motion.div>
          
          {!isPwa && (
            <motion.div 
              className="mt-8 md:mt-16 relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <AnimatedIcon className="animate-float" />
            </motion.div>
          )}
        </section>
        
        {/* Features section only shown on larger displays or non-PWA */}
        {!isPwa && (
          <section className="container mx-auto px-4 py-8 md:py-24">
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
                    className={`${
                      theme === 'light' 
                        ? 'glass rounded-2xl p-6 subtle-shadow border border-white/80 hover:border-purple-100' 
                        : 'bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/80 hover:border-purple-800'
                    } transition-all duration-300`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: feature.delay + 0.3, duration: 0.5 }}
                  >
                    <h3 className={`text-xl font-semibold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                      {feature.title}
                    </h3>
                    <p className={`${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        )}
      </main>
      
      {/* Footer - simplified for PWA */}
      {!isPwa && (
        <footer className="container mx-auto px-4 py-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} The Triage System. All rights reserved.</p>
        </footer>
      )}
    </div>
  );
};

export default Index;
