
import { motion } from "framer-motion";
import { StudyEnvironment } from "@/types/onboarding";
import { User, Navigation, Flag, Mountain, Trees } from "lucide-react";
import { useState, useEffect } from "react";

interface HikingTrailProps {
  environment?: StudyEnvironment;
  milestone: number;
  isCelebrating?: boolean;
}

export const HikingTrail = ({ 
  environment = 'office', 
  milestone = 0,
  isCelebrating = false
}: HikingTrailProps) => {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    if (isCelebrating) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isCelebrating]);
  
  const getTrailColor = () => {
    switch (environment) {
      case 'office': return "from-blue-100 to-indigo-100";
      case 'park': return "from-green-100 to-emerald-100";
      case 'home': return "from-orange-100 to-amber-100";
      case 'coffee-shop': return "from-amber-100 to-yellow-100";
      case 'library': return "from-gray-100 to-slate-100";
      default: return "from-purple-100 to-indigo-100";
    }
  };
  
  const getMilestonePosition = (mile: number) => {
    switch (mile) {
      case 0: return "25%"; 
      case 1: return "50%";
      case 2: return "75%";
      case 3: return "95%";
      default: return "10%";
    }
  };
  
  const getBackgroundImage = () => {
    switch (milestone) {
      case 0:
        return "url(\"data:image/svg+xml,%3Csvg width='100' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,10 Q25,5 50,10 T100,10' stroke='%23e5e7eb' fill='transparent' stroke-width='1'/%3E%3C/svg%3E\")";
      case 1:
        return "url(\"data:image/svg+xml,%3Csvg width='100' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,10 Q25,15 50,10 T100,10' stroke='%23e5e7eb' fill='transparent' stroke-width='1'/%3E%3C/svg%3E\")";
      case 2: 
        return "url(\"data:image/svg+xml,%3Csvg width='100' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,10 Q30,5 60,15 T100,10' stroke='%23e5e7eb' fill='transparent' stroke-width='1'/%3E%3C/svg%3E\")";
      case 3:
        return "url(\"data:image/svg+xml,%3Csvg width='100' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,15 Q30,10 60,5 T100,10' stroke='%23e5e7eb' fill='transparent' stroke-width='1'/%3E%3C/svg%3E\")";
      default:
        return "url(\"data:image/svg+xml,%3Csvg width='100' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,10 Q25,5 50,10 T100,10' stroke='%23e5e7eb' fill='transparent' stroke-width='1'/%3E%3C/svg%3E\")";
    }
  };

  return (
    <div className={`w-full h-full bg-gradient-to-r ${getTrailColor()} relative overflow-hidden rounded-lg border`}>
      <div className="absolute inset-0 bg-repeat-x" style={{ backgroundImage: getBackgroundImage() }}></div>
      
      {/* Milestone Markers */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
        <div className="w-full h-1 bg-foreground/10 relative">
          {/* First Checkpoint */}
          <div className="absolute top-1/2 -translate-y-1/2 left-[25%]">
            <div className="h-4 w-4 rounded-full bg-amber-200 border border-amber-300 -mt-1.5"></div>
            <Trees className="h-6 w-6 text-green-600 absolute -top-8 left-1/2 -translate-x-1/2" />
          </div>
          
          {/* Second Checkpoint */}
          <div className="absolute top-1/2 -translate-y-1/2 left-[50%]">
            <div className="h-4 w-4 rounded-full bg-amber-200 border border-amber-300 -mt-1.5"></div>
            <Trees className="h-6 w-6 text-green-700 absolute -top-8 left-1/2 -translate-x-1/2" />
          </div>
          
          {/* Third Checkpoint */}
          <div className="absolute top-1/2 -translate-y-1/2 left-[75%]">
            <div className="h-4 w-4 rounded-full bg-amber-200 border border-amber-300 -mt-1.5"></div>
            <Mountain className="h-6 w-6 text-gray-600 absolute -top-8 left-1/2 -translate-x-1/2" />
          </div>
          
          {/* Final Goal */}
          <div className="absolute top-1/2 -translate-y-1/2 left-[95%]">
            <div className="h-4 w-4 rounded-full bg-red-400 border border-red-500 -mt-1.5"></div>
            <Flag className="h-6 w-6 text-red-500 absolute -top-8 left-1/2 -translate-x-1/2" />
          </div>
          
          {/* Hiker Character */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2"
            initial={{ x: "10%" }}
            animate={{ 
              x: getMilestonePosition(milestone),
              y: animate ? -15 : 0
            }}
            transition={{ 
              x: { duration: 1, ease: "easeInOut" },
              y: animate ? { 
                duration: 0.5, 
                repeat: 3, 
                repeatType: "reverse", 
                ease: "easeInOut" 
              } : {}
            }}
          >
            <div className="relative">
              <User className="h-8 w-8 text-primary transform -translate-y-4 -translate-x-1/2" />
              {isCelebrating && (
                <motion.div 
                  className="absolute -top-4 -left-4 right-0"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <div className="text-xs font-semibold text-primary bg-white rounded-full px-2 py-1 shadow-sm">
                    Yay!
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Environmental Elements based on milestone */}
      {milestone >= 1 && (
        <motion.div 
          className="absolute bottom-1 left-[20%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Trees className="h-5 w-5 text-green-600" />
        </motion.div>
      )}
      
      {milestone >= 2 && (
        <motion.div 
          className="absolute bottom-1 left-[45%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Trees className="h-6 w-6 text-green-700" />
        </motion.div>
      )}
      
      {milestone >= 3 && (
        <motion.div 
          className="absolute bottom-2 right-[15%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Mountain className="h-7 w-7 text-gray-600" />
        </motion.div>
      )}
    </div>
  );
};
