
import { motion } from "framer-motion";
import { StudyEnvironment } from "@/types/onboarding";
import { Navigation, Flag, Mountain, Trees } from "lucide-react";
import { useState, useEffect } from "react";

interface HikingTrailProps {
  environment?: StudyEnvironment;
  milestone: number;
  isCelebrating?: boolean;
}

// 3D Person Icon Component
const Person3DIcon = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Head */}
      <div className="w-6 h-6 rounded-full bg-blue-500 absolute left-1/2 -translate-x-1/2 -top-6 shadow-md" style={{ 
        background: "linear-gradient(135deg, #33C3F0 10%, #0FA0CE 90%)" 
      }}></div>
      
      {/* Body */}
      <div className="w-10 h-5 rounded-tl-full rounded-tr-full bg-blue-600 absolute left-1/2 -translate-x-1/2 -top-3" style={{ 
        background: "linear-gradient(to bottom, #33C3F0 0%, #1EAEDB 100%)",
        transformOrigin: "top",
        transform: "perspective(40px) rotateX(5deg)"
      }}></div>
    </div>
  );
};

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
  
  const getMilestonePosition = (mile: number) => {
    switch (mile) {
      case 0: return "25%"; 
      case 1: return "50%";
      case 2: return "75%";
      case 3: return "95%";
      default: return "10%";
    }
  };
  
  return (
    <div className="w-full h-full relative overflow-hidden rounded-lg border">
      {/* Sky Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 to-sky-100"></div>
      
      {/* Mountains and Hills Background */}
      <div className="absolute inset-0">
        {/* Dark Blue Mountains */}
        <div className="absolute bottom-[55%] left-0 right-0 h-[30%]">
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-full w-full">
            <path d="M0,0 L10,5 L20,0 L30,7 L40,3 L50,8 L60,2 L70,5 L80,0 L90,6 L100,0 L100,20 L0,20 Z" fill="#1e3a8a" />
          </svg>
        </div>
        
        {/* Medium Blue Hills */}
        <div className="absolute bottom-[40%] left-0 right-0 h-[25%]">
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-full w-full">
            <path d="M0,3 L15,6 L30,2 L45,8 L60,4 L75,9 L90,5 L100,7 L100,20 L0,20 Z" fill="#1d4ed8" />
          </svg>
        </div>
        
        {/* Teal Hills */}
        <div className="absolute bottom-[30%] left-0 right-0 h-[25%]">
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-full w-full">
            <path d="M0,8 L20,5 L40,10 L60,6 L80,11 L100,7 L100,20 L0,20 Z" fill="#0d9488" />
          </svg>
        </div>
      </div>
      
      {/* Green Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-b from-green-400 to-green-500">
        {/* Dotted Pattern */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute w-1 h-1 bg-white rounded-full"
                 style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }} />
          ))}
        </div>
      </div>
      
      {/* Trail Path */}
      <div className="absolute bottom-[15%] left-0 right-0 h-[5%]">
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="h-full w-full">
          <path 
            d="M0,5 Q15,2 25,5 T50,5 T75,5 T100,5" 
            stroke="white" 
            strokeWidth="1.5"
            strokeDasharray="2,2"
            fill="none" 
          />
        </svg>
        
        {/* Milestone Markers */}
        <div className="absolute top-0 left-[25%] -translate-x-1/2 -translate-y-1/2">
          <div className="h-4 w-4 rounded-full bg-white border-2 border-green-600"></div>
        </div>
        
        <div className="absolute top-0 left-[50%] -translate-x-1/2 -translate-y-1/2">
          <div className="h-4 w-4 rounded-full bg-white border-2 border-green-600"></div>
        </div>
        
        <div className="absolute top-0 left-[75%] -translate-x-1/2 -translate-y-1/2">
          <div className="h-4 w-4 rounded-full bg-white border-2 border-green-600"></div>
        </div>
        
        <div className="absolute top-0 left-[95%] -translate-x-1/2 -translate-y-1/2">
          <div className="h-4 w-4 rounded-full bg-white border-2 border-red-600"></div>
        </div>
      </div>
      
      {/* Trees */}
      {/* First section trees */}
      <div className="absolute bottom-[15%] left-[15%]">
        <Trees className="h-8 w-8 text-green-700" />
      </div>
      <div className="absolute bottom-[17%] left-[30%]">
        <Trees className="h-6 w-6 text-green-600" />
      </div>
      
      {/* Middle section trees */}
      <div className="absolute bottom-[16%] left-[40%]">
        <Trees className="h-7 w-7 text-emerald-700" />
      </div>
      <div className="absolute bottom-[18%] left-[60%]">
        <Trees className="h-8 w-8 text-emerald-600" />
      </div>
      
      {/* Final section trees */}
      <div className="absolute bottom-[16%] left-[85%]">
        <div className="relative">
          <Trees className="h-7 w-7 text-yellow-500" />
        </div>
      </div>
      <div className="absolute bottom-[13%] right-[10%]">
        <Mountain className="h-10 w-10 text-gray-600" />
      </div>
      
      {/* Goal Flag */}
      <div className="absolute bottom-[19%] left-[95%]">
        <Flag className="h-6 w-6 text-red-500" />
      </div>
      
      {/* Hiker Character */}
      <motion.div
        className="absolute bottom-[19%]"
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
          <Person3DIcon />
          
          {isCelebrating && (
            <motion.div 
              className="absolute -top-8 -left-8 right-0"
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
      
      {/* Environmental Elements based on milestone progress */}
      {milestone >= 1 && (
        <motion.div 
          className="absolute bottom-[15%] left-[35%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <Trees className="h-8 w-8 text-green-500" />
          </div>
        </motion.div>
      )}
      
      {milestone >= 2 && (
        <motion.div 
          className="absolute bottom-[16%] left-[65%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <Trees className="h-9 w-9 text-teal-600" />
          </div>
        </motion.div>
      )}
      
      {milestone >= 3 && (
        <motion.div 
          className="absolute bottom-[20%] right-[15%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <Mountain className="h-12 w-12 text-gray-700" />
          </div>
        </motion.div>
      )}
    </div>
  );
};
