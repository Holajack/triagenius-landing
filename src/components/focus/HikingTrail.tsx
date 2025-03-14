import { motion } from "framer-motion";
import { StudyEnvironment } from "@/types/onboarding";
import { Navigation, Flag, Mountain, Trees } from "lucide-react";
import { useState, useEffect } from "react";

interface HikingTrailProps {
  environment?: StudyEnvironment;
  milestone: number;
  isCelebrating?: boolean;
}

// Pixel Art Hiker Component with detailed animations
const AnimatedPerson = ({ className = "", isWalking = true, facingRight = true }: { 
  className?: string; 
  isWalking?: boolean;
  facingRight?: boolean;
}) => {
  const [frame, setFrame] = useState(0);
  const totalFrames = 8; // 8 frames for smooth pixel art animation
  
  // Animate through frames for smooth walking
  useEffect(() => {
    if (!isWalking) return;
    
    const frameInterval = setInterval(() => {
      setFrame(prev => (prev + 1) % totalFrames);
    }, 125); // ~8 FPS for pixel art style
    
    return () => clearInterval(frameInterval);
  }, [isWalking]);

  // Calculate frame-based offsets for animation
  const getFrameOffset = (part: 'leg' | 'arm' | 'stick' | 'backpack') => {
    const phase = frame / totalFrames;
    
    switch(part) {
      case 'leg':
        return Math.sin(phase * Math.PI * 2) * 2;
      case 'arm':
        return Math.sin(phase * Math.PI * 2) * 1.5;
      case 'stick':
        return Math.sin(phase * Math.PI * 2 + Math.PI/4) * 1;
      case 'backpack':
        return Math.sin(phase * Math.PI * 2) * 0.5;
      default:
        return 0;
    }
  };
  
  // Breathing animation for idle stance
  const breathingOffset = isWalking ? 0 : Math.sin(Date.now() / 1000) * 0.3;

  return (
    <div className={`relative ${className} ${facingRight ? '' : 'scale-x-[-1]'}`} style={{ height: '48px' }}>
      {/* Explorer's Hat with subtle shading - Positioned higher to be visible */}
      <div className="w-5 h-2 bg-[#f1f0fb] absolute left-1/2 -translate-x-1/2 top-1 rounded-sm">
        {/* Hat brim */}
        <div className="absolute w-6 h-0.5 bg-[#d8d7e3] bottom-0 left-1/2 -translate-x-1/2 rounded-sm"></div>
        {/* Hat shading */}
        <div className="absolute w-4 h-1 bg-[#e5e4ec] top-0.5 left-1/2 -translate-x-1/2 rounded-t-sm"></div>
      </div>
      
      {/* Head - Positioned below hat to be visible */}
      <div className="w-4 h-4.5 rounded-full bg-[#e8b89b] absolute left-1/2 -translate-x-1/2 top-3">
        {/* Face details - pixel art style */}
        <div className="absolute w-2 h-0.5 bg-[#d37c59] bottom-1.5 left-1/2 -translate-x-1/2 rounded-none"></div>
        <div className="absolute w-1 h-1 bg-[#362617] bottom-2.5 left-1 rounded-none"></div>
      </div>

      {/* Neck - connecting head and body */}
      <div className="w-2 h-1.5 bg-[#d8a991] absolute left-1/2 -translate-x-1/2 top-7.5 rounded-none"></div>
      
      {/* Body - Slim pixel art proportions with hiking shirt */}
      <div 
        className="w-4 h-5 bg-[#d3a05d] absolute left-1/2 -translate-x-1/2 top-9 rounded-none"
        style={{ transform: `translateY(${breathingOffset}px)` }}
      >
        {/* Shirt details */}
        <div className="w-4 h-3 bg-[#a17a45] absolute top-2 left-0 rounded-none"></div>
      </div>
      
      {/* Detailed Backpack with rolled sleeping bag */}
      <div 
        className="w-3.5 h-6 bg-[#4a6d3b] absolute -left-1.5 top-9 rounded-none"
        style={{ transform: `translateY(${getFrameOffset('backpack')}px)` }}
      >
        {/* Backpack straps - pixel art style */}
        <div className="w-1 h-3 bg-[#3e5c32] absolute right-0 top-0"></div>
        <div className="w-1 h-3 bg-[#3e5c32] absolute right-1.5 top-0"></div>
        
        {/* Rolled sleeping bag on top */}
        <div className="w-3 h-1.5 bg-[#6b4219] absolute top-0 left-0 rounded-none"></div>
        <div className="w-3 h-0.5 bg-[#59371a] absolute top-1 left-0 rounded-none"></div>
        
        {/* Backpack pockets and details */}
        <div className="w-2.5 h-1 bg-[#3e5c32] absolute left-0.5 top-3 rounded-none"></div>
        <div className="w-2.5 h-1 bg-[#3e5c32] absolute left-0.5 bottom-1 rounded-none"></div>
      </div>
      
      {/* Arms with pixel art styling and frame-based animation */}
      <div 
        className="w-1.5 h-4 bg-[#d3a05d] absolute -left-0.5 top-11 origin-top"
        style={{ transform: `rotate(${15 + getFrameOffset('arm') * 10}deg)` }}
      >
        {/* Arm details */}
        <div className="w-1.5 h-2 bg-[#a17a45] absolute bottom-0 left-0 rounded-none"></div>
      </div>
      
      {/* Right arm with hiking stick - animated together */}
      <div 
        className="w-1.5 h-4 bg-[#d3a05d] absolute -right-0.5 top-11 origin-top"
        style={{ transform: `rotate(${-15 - getFrameOffset('arm') * 10}deg)` }}
      >
        {/* Arm details */}
        <div className="w-1.5 h-2 bg-[#a17a45] absolute bottom-0 left-0 rounded-none"></div>
        
        {/* Hiking stick attached to hand */}
        <div className="relative">
          <div 
            className="w-1 h-9 bg-[#8E9196] absolute left-0 top-3 origin-top"
            style={{ transform: `rotate(${getFrameOffset('stick') * 5}deg)` }}
          ></div>
          
          {/* Hiking stick handle detail */}
          <div className="w-2 h-1 bg-[#765c48] absolute left-0 top-3 -translate-x-0.5 rounded-none"></div>
        </div>
      </div>
      
      {/* Legs with pixel art styling and alternating animation */}
      <div 
        className="w-2 h-7 bg-[#5d81b0] absolute left-0 top-14 origin-top"
        style={{ transform: `rotate(${getFrameOffset('leg') * 15}deg)` }}
      >
        {/* Pants details */}
        <div className="w-2 h-3 bg-[#4b6a91] absolute bottom-0 left-0 rounded-none"></div>
        
        {/* Boot that lifts with each step */}
        <div className="w-2.5 h-1.5 bg-[#403E43] absolute bottom-0 left-0 -translate-x-0.25 rounded-none"></div>
      </div>
      
      <div 
        className="w-2 h-7 bg-[#5d81b0] absolute right-0 top-14 origin-top"
        style={{ transform: `rotate(${-getFrameOffset('leg') * 15}deg)` }}
      >
        {/* Pants details */}
        <div className="w-2 h-3 bg-[#4b6a91] absolute bottom-0 left-0 rounded-none"></div>
        
        {/* Boot that lifts with each step */}
        <div className="w-2.5 h-1.5 bg-[#403E43] absolute bottom-0 left-0 -translate-x-0.25 rounded-none"></div>
      </div>
      
      {/* Environmental interaction - Dust particles when walking */}
      {isWalking && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div 
              key={i}
              className="absolute w-1 h-1 bg-[#fec6a1] rounded-full opacity-40"
              style={{ 
                left: `-${(i+1) * 3 + frame}px`, 
                bottom: `${i % 2 === 0 ? 0 : 2}px` 
              }}
              animate={{
                opacity: [0.4, 0],
                y: [0, -3],
                x: [0, -5]
              }}
              transition={{
                repeat: Infinity,
                duration: 1,
                delay: i * 0.2
              }}
            />
          ))}
        </>
      )}
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
  const [showCheckMap, setShowCheckMap] = useState(false);
  const [showDrink, setShowDrink] = useState(false);
  
  // Handle milestone celebrations
  useEffect(() => {
    if (isCelebrating) {
      setAnimate(true);
      setIsWalking(false);
      
      // Randomly choose between milestone animations
      const randomAnim = Math.random() > 0.5;
      setShowCheckMap(randomAnim);
      setShowDrink(!randomAnim);
      
      const timer = setTimeout(() => {
        setAnimate(false);
        setIsWalking(true);
        setShowCheckMap(false);
        setShowDrink(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isCelebrating]);
  
  const getMilestonePosition = (mile: number) => {
    switch (mile) {
      case 0: return "25%";
      case 1: return "50%";
      case 2: return "75%";
      case 3: return "95%";
      default: return "25%";
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
      
      {/* Hiker Character - with improved pixel art visuals */}
      <motion.div
        className="absolute bottom-[18%]"
        initial={{ x: "25%" }}
        animate={{ 
          x: getMilestonePosition(milestone),
          y: animate ? -3 : 0
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
        <div className="relative" style={{ transform: 'scale(1.5)' }}>
          <AnimatedPerson isWalking={isWalking} facingRight={true} />
          
          {/* Milestone check map animation */}
          {showCheckMap && (
            <motion.div 
              className="absolute -top-10 left-4"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <div className="w-8 h-6 bg-[#f1f0fb] rounded-sm border border-[#d0cfc9] p-0.5">
                <div className="w-full h-full bg-[#e5e4de] rounded-sm">
                  <div className="w-5 h-0.5 bg-[#a1a09c] rounded-full mx-auto mt-1"></div>
                  <div className="w-4 h-0.5 bg-[#a1a09c] rounded-full mx-auto mt-1"></div>
                  <div className="w-5 h-0.5 bg-[#a1a09c] rounded-full mx-auto mt-1"></div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Milestone drink water animation */}
          {showDrink && (
            <motion.div 
              className="absolute -top-9 left-2"
              initial={{ opacity: 0, rotate: -45 }}
              animate={{ opacity: 1, rotate: 45 }}
              exit={{ opacity: 0, rotate: -45 }}
            >
              <div className="w-2 h-4 bg-[#add8e6] rounded-sm border border-[#5d81b0]">
                <div className="w-1 h-1 bg-[#5d81b0] rounded-full mx-auto mt-2"></div>
              </div>
            </motion.div>
          )}
          
          {/* Celebration speech bubble */}
          {isCelebrating && !showCheckMap && !showDrink && (
            <motion.div 
              className="absolute -top-8 -left-6 right-0"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <div className="text-xs font-pixel bg-white rounded-sm px-2 py-1 shadow-sm border border-gray-200">
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
