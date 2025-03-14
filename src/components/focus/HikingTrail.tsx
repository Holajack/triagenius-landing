
import { motion } from "framer-motion";
import { StudyEnvironment } from "@/types/onboarding";
import { Navigation, Flag, Mountain, Trees } from "lucide-react";
import { useState, useEffect } from "react";

interface HikingTrailProps {
  environment?: StudyEnvironment;
  milestone: number;
  isCelebrating?: boolean;
}

// 2D Animated Hiker Component with refined appearance
const AnimatedPerson = ({ className = "", isWalking = true, facingRight = true }: { 
  className?: string; 
  isWalking?: boolean;
  facingRight?: boolean;
}) => {
  return (
    <div className={`relative ${className} ${facingRight ? '' : 'scale-x-[-1]'}`}>
      {/* Head - slightly smaller for thinner appearance */}
      <div className="w-4 h-5 rounded-t-full bg-[#e8b89b] absolute left-1/2 -translate-x-1/2 -top-10">
        {/* Hair */}
        <div className="absolute w-4 h-1.5 bg-[#3a3a3a] top-0 left-0 rounded-t-full"></div>
        {/* Face details */}
        <div className="absolute w-2.5 h-0.8 bg-[#d37c59] bottom-1 left-1/2 -translate-x-1/2 rounded-sm"></div>
      </div>

      {/* Neck - new detail connecting head and body */}
      <div className="w-1.5 h-2 bg-[#e8b89b] absolute left-1/2 -translate-x-1/2 -top-5.5 rounded-md"></div>
      
      {/* Body - Thinner proportions */}
      <div className="w-4 h-5 bg-[#d3a05d] absolute left-1/2 -translate-x-1/2 -top-4 rounded-sm"></div>
      
      {/* Backpack - more detailed with straps and compartments */}
      <div className="w-3.5 h-5 bg-[#5f8d4e] absolute left-1/2 -translate-x-4 -top-4 rounded-md"></div>
      {/* Backpack top pocket */}
      <div className="w-2.5 h-1.5 bg-[#4a6d3b] absolute left-1/2 -translate-x-3.8 -top-4 rounded-t-md"></div>
      {/* Backpack bottom pocket */}
      <div className="w-2.5 h-1.5 bg-[#4a6d3b] absolute left-1/2 -translate-x-3.8 -top-1.5 rounded-b-md"></div>
      {/* Backpack straps */}
      <div className="w-0.8 h-3 bg-[#6b4219] absolute left-1/2 -translate-x-1 -top-3 rounded-sm"></div>
      <div className="w-0.8 h-3 bg-[#6b4219] absolute left-1/2 -translate-x-2.5 -top-3 rounded-sm"></div>
      
      {/* Arms - thinner with enhanced movement */}
      <motion.div 
        className="w-1.5 h-4.5 bg-[#d3a05d] absolute -left-1 -top-2 origin-top rounded-full"
        animate={isWalking ? { 
          rotate: [-25, 25, -25]  // Greater range of motion
        } : {}}
        transition={{ 
          repeat: Infinity, 
          duration: 1.2,
          ease: "linear"
        }}
      ></motion.div>
      
      {/* Right arm with hiking stick */}
      <motion.div className="relative">
        <motion.div 
          className="w-1.5 h-4.5 bg-[#d3a05d] absolute -right-1 -top-2 origin-top rounded-full"
          animate={isWalking ? { 
            rotate: [25, -25, 25]  // Coordinated with left arm but opposite
          } : {}}
          transition={{ 
            repeat: Infinity, 
            duration: 1.2,
            ease: "linear"
          }}
        >
          {/* Hiking stick attached to the hand/arm */}
          <div className="w-1 h-10 bg-[#8E9196] absolute right-0 top-4 origin-top rounded-full"></div>
          <div className="w-2 h-1 bg-[#765c48] absolute right-0 top-4 -translate-x-0.5 rounded-full"></div> {/* Handle */}
        </motion.div>
      </motion.div>
      
      {/* Legs - longer and thinner */}
      <motion.div 
        className="w-1.5 h-6 bg-[#5d81b0] absolute left-0.5 top-1 origin-top rounded-full"
        animate={isWalking ? { 
          rotate: [25, -25, 25]  // Enhanced range for more pronounced walking
        } : {}}
        transition={{ 
          repeat: Infinity, 
          duration: 1.2,
          ease: "linear"
        }}
      ></motion.div>
      
      <motion.div 
        className="w-1.5 h-6 bg-[#5d81b0] absolute right-0.5 top-1 origin-top rounded-full"
        animate={isWalking ? { 
          rotate: [-25, 25, -25]  // Coordinated with left leg but opposite
        } : {}}
        transition={{ 
          repeat: Infinity, 
          duration: 1.2,
          ease: "linear"
        }}
      ></motion.div>
      
      {/* Shoes */}
      <motion.div 
        className="w-2 h-1.2 bg-[#36342e] absolute left-0 top-7 origin-top rounded-sm"
        animate={isWalking ? { 
          rotate: [25, -25, 25]  // Match leg movement
        } : {}}
        transition={{ 
          repeat: Infinity, 
          duration: 1.2,
          ease: "linear"
        }}
      ></motion.div>
      
      <motion.div 
        className="w-2 h-1.2 bg-[#36342e] absolute right-0 top-7 origin-top rounded-sm"
        animate={isWalking ? { 
          rotate: [-25, 25, -25]  // Match leg movement
        } : {}}
        transition={{ 
          repeat: Infinity, 
          duration: 1.2,
          ease: "linear"
        }}
      ></motion.div>
    </div>
  );
};

export const HikingTrail = ({ 
  environment = 'office', 
  milestone = 0,
  isCelebrating = false
}: HikingTrailProps) => {
  const [animate, setAnimate] = useState(false);
  const [isWalking, setIsWalking] = useState(true);
  
  useEffect(() => {
    if (isCelebrating) {
      setAnimate(true);
      setIsWalking(false);
      const timer = setTimeout(() => {
        setAnimate(false);
        setIsWalking(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isCelebrating]);
  
  const getMilestonePosition = (mile: number) => {
    switch (mile) {
      case 0: return "25%"; // Adjusted from 15% to 25% to make character more forward on the trail
      case 1: return "50%";
      case 2: return "75%";
      case 3: return "95%";
      default: return "25%"; // Default position is now also 25%
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
            <path d="M0,3 L15,6 L30,2 L45,8 L60,4 L75,9 L90,5 L100,7 L100,20 Z" fill="#1d4ed8" />
          </svg>
        </div>
        
        {/* Teal Hills */}
        <div className="absolute bottom-[30%] left-0 right-0 h-[25%]">
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-full w-full">
            <path d="M0,8 L20,5 L40,10 L60,6 L80,11 L100,7 L100,20 Z" fill="#0d9488" />
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
      
      {/* Hiker Character - positioned with improved visibility from the start */}
      <motion.div
        className="absolute bottom-[18%]"
        initial={{ x: "25%" }} // Changed initial position to 25% to position character more forward
        animate={{ 
          x: getMilestonePosition(milestone),
          y: animate ? -10 : 0
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
          <AnimatedPerson isWalking={isWalking} facingRight={true} />
          
          {isCelebrating && (
            <motion.div 
              className="absolute -top-8 -left-6 right-0"
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
