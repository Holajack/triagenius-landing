import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import AnimatedIcon from "@/components/AnimatedIcon";
import FocusButton from "@/components/FocusButton";
import HowItWorks from "@/components/HowItWorks";
import { ArrowDown, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    const checkAuth = async () => {
      const {
        data
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    checkAuth();

    const {
      data: authListener
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => {
      clearTimeout(timer);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const handleStartFocusing = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/auth', {
        state: {
          mode: 'signup',
          source: 'start-focusing'
        }
      });
    }
  };

  const handleLogin = async () => {
    if (isAuthenticated) {
      try {
        const {
          error
        } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }

        toast.success('Successfully logged out');

        navigate('/', {
          replace: true
        });
      } catch (error) {
        console.error('Error logging out:', error);
        toast.error('Failed to log out. Please try again.');
      }
    } else {
      navigate('/auth', {
        state: {
          mode: 'login'
        }
      });
    }
  };

  return <div className={`flex flex-col min-h-screen ${theme === 'light' ? 'bg-gradient-to-b from-white to-purple-50/30' : 'bg-gradient-to-b from-gray-900 to-gray-800'}`}>
      <Navbar />
      
      <main className="flex-grow flex flex-col">
        <section className="container mx-auto px-4 pt-28 pb-16 md:pt-32 md:pb-24 flex flex-col items-center justify-center text-center">
          <motion.div className="max-w-2xl mx-auto" variants={containerVariants} initial="hidden" animate={isLoaded ? "visible" : "hidden"}>
            <motion.div variants={itemVariants} className={`inline-flex items-center px-3 py-1 mb-6 text-sm rounded-full ${theme === 'light' ? 'bg-purple-100/80 text-triage-forestGreen' : 'bg-purple-900/50 text-triage-forestGreen'}`}>
              <Clock className="w-4 h-4 mr-1" />
              <span>Your productivity journey starts here</span>
            </motion.div>
            
            <motion.h1 
              variants={itemVariants} 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight text-triage-purple dark:text-triage-purple"
            >
              Master Your Focus & Productivity
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-triage-forestGreen mb-8 max-w-xl mx-auto dark:text-triage-forestGreen">
              Boost concentration, track progress, and level up through gamified work sessions.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12">
              <FocusButton label={isAuthenticated ? "Continue Session" : "Start Focusing"} icon="play" className="w-full md:w-auto" onClick={handleStartFocusing} />
              
              <FocusButton label={isAuthenticated ? "Logout" : "Log In"} isPrimary={false} className="w-full md:w-auto" onClick={handleLogin} />
            </motion.div>
            
            <motion.div variants={itemVariants} className="flex justify-center">
              <HowItWorks />
            </motion.div>
          </motion.div>
          
          <motion.div className="mt-12 md:mt-16 relative" initial={{
          opacity: 0,
          scale: 0.9
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          delay: 0.6,
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1]
        }}>
            <AnimatedIcon className="animate-float" />
            <motion.div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2" initial={{
            opacity: 0,
            y: -10
          }} animate={{
            opacity: 0.7,
            y: 0
          }} transition={{
            delay: 1.2,
            duration: 0.6,
            ease: "easeOut"
          }}>
              <ArrowDown className={`w-5 h-5 ${theme === 'light' ? 'text-triage-forestGreen' : 'text-triage-forestGreen'}`} />
            </motion.div>
          </motion.div>
        </section>
        
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            delay: 0.8,
            duration: 0.6
          }}>
              {[{
              title: "Focus Sessions",
              description: "Set customizable timers for deep work and concentration.",
              delay: 0
            }, {
              title: "Progress Tracking",
              description: "Visualize your productivity trends and achievements.",
              delay: 0.1
            }, {
              title: "Reward System",
              description: "Unlock achievements as you build consistent focus habits.",
              delay: 0.2
            }].map((feature, index) => <motion.div key={index} className={`${theme === 'light' ? 'glass rounded-2xl p-6 subtle-shadow border border-white/80 hover:border-purple-100' : 'bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/80 hover:border-purple-800'} transition-all duration-300`} initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true,
              margin: "-100px"
            }} transition={{
              delay: feature.delay + 0.3,
              duration: 0.5
            }}>
                  <h3 className={`text-xl font-semibold mb-2 text-triage-forestGreen`}>
                    {feature.title}
                  </h3>
                  <p className={`text-triage-forestGreen`}>
                    {feature.description}
                  </p>
                </motion.div>)}
            </motion.div>
          </div>
        </section>
      </main>
      
      <footer className="container mx-auto px-4 py-8 text-center text-sm text-triage-forestGreen">
        <p>© {new Date().getFullYear()} The Triage System. All rights reserved.</p>
      </footer>
    </div>;
};

export default Index;
