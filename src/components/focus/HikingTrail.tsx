import { motion, useAnimation } from "framer-motion";
import { StudyEnvironment } from "@/types/onboarding";
import { useState, useEffect, useRef } from "react";

interface HikingTrailProps {
  environment?: StudyEnvironment;
  milestone: number;
  isCelebrating?: boolean;
  progress?: number; // Progress value (0-100) representing time progress within a segment
}

// Pixel Art Hiker Component with detailed animations (20% smaller)
const AnimatedPerson = ({ 
  className = "", 
  isWalking = true, 
  facingRight = true, 
  isGoingUphill = false,
  terrain = 'flat',
  walkingSpeed = 1
}: { 
  className?: string; 
  isWalking?: boolean;
  facingRight?: boolean;
  isGoingUphill?: boolean;
  terrain?: 'flat' | 'uphill' | 'downhill' | 'rocky';
  walkingSpeed?: number; 
}) => {
  const [frame, setFrame] = useState(0);
  const totalFrames = 8; // 8 frames for smooth pixel art animation
  
  // Adjust animation speed based on terrain and walking speed
  const getFrameInterval = () => {
    let baseInterval = 125; // Base interval (ms) ~8 FPS for pixel art style
    
    // Adjust based on terrain
    switch(terrain) {
      case 'uphill':
        baseInterval *= 1.3; // Slower on uphill
        break;
      case 'downhill':
        baseInterval *= 0.85; // Faster on downhill
        break;
      case 'rocky':
        baseInterval *= 1.2; // Slightly slower on rocky terrain
        break;
      default:
        break;
    }
    
    // Apply user-defined walking speed modifier
    return baseInterval / walkingSpeed;
  };
  
  // Animate through frames for smooth walking with terrain-appropriate timing
  useEffect(() => {
    if (!isWalking) return;
    
    const frameInterval = setInterval(() => {
      setFrame(prev => (prev + 1) % totalFrames);
    }, getFrameInterval());
    
    return () => clearInterval(frameInterval);
  }, [isWalking, terrain, walkingSpeed]);

  // Calculate frame-based offsets for animation with improved terrain response
  const getFrameOffset = (part: 'leg' | 'arm' | 'stick' | 'backpack' | 'body') => {
    const phase = frame / totalFrames;
    const terrainMultiplier = terrain === 'rocky' ? 1.3 : 1.0; // More exaggerated movements on rocky terrain
    
    switch(part) {
      case 'leg':
        return Math.sin(phase * Math.PI * 2) * 2 * terrainMultiplier;
      case 'arm':
        return Math.sin(phase * Math.PI * 2) * 1.5 * terrainMultiplier;
      case 'stick':
        return Math.sin(phase * Math.PI * 2 + Math.PI/4) * 1 * terrainMultiplier;
      case 'backpack':
        return Math.sin(phase * Math.PI * 2) * 0.5;
      case 'body':
        // Body has subtle up/down motion while walking
        return Math.sin(phase * Math.PI * 4) * 0.3; // Doubled frequency for more natural bounce
      default:
        return 0;
    }
  };
  
  // Breathing animation for idle stance
  const breathingOffset = isWalking ? 0 : Math.sin(Date.now() / 1000) * 0.3;
  
  // Calculate terrain angle offset
  const getTerrainAngle = () => {
    switch(terrain) {
      case 'uphill':
        return 10;
      case 'downhill':
        return -8;
      default:
        return 0;
    }
  };
  
  const terrainAngle = getTerrainAngle();

  // Enhanced step effect that varies by terrain
  const getStepStyle = () => {
    if (!isWalking) return {};
    
    // Different step styles for different terrains
    const stepHeight = terrain === 'rocky' ? 
      getFrameOffset('body') * 1.5 : // More pronounced steps on rocky terrain
      getFrameOffset('body');
    
    return { transform: `translateY(${stepHeight}px)` };
  };

  return (
    <div 
      className={`relative ${className} ${facingRight ? '' : 'scale-x-[-1]'} scale-[0.8]`}
      style={{ 
        transform: terrainAngle !== 0 ? `rotate(${terrainAngle}deg)` : undefined,
        ...getStepStyle()
      }}
    >
      {/* Head - smaller and closer to body */}
      <div className="w-3 h-3 rounded-full bg-[#e8b89b] absolute left-1/2 -translate-x-1/2 -top-7">
        {/* Face details - pixel art style */}
        <div className="absolute w-1.5 h-0.5 bg-[#d37c59] bottom-1 left-1/2 -translate-x-1/2 rounded-none"></div>
        <div className="absolute w-0.5 h-0.5 bg-[#362617] bottom-2 left-1 rounded-none"></div>
        
        {/* Blinking effect */}
        {frame % 8 === 0 && (
          <div className="absolute w-0.5 h-0.1 bg-[#362617] bottom-2 left-1 rounded-none"></div>
        )}
      </div>

      {/* Neck - shorter to bring head closer to body */}
      <div className="w-1.5 h-1 bg-[#d8a991] absolute left-1/2 -translate-x-1/2 -top-4.5 rounded-none"></div>
      
      {/* Body - Slim pixel art proportions with hiking shirt */}
      <div 
        className="w-4 h-5 bg-[#d3a05d] absolute left-1/2 -translate-x-1/2 -top-3.5 rounded-none"
        style={{ transform: `translateY(${breathingOffset + getFrameOffset('body')}px)` }}
      >
        {/* Shirt details */}
        <div className="w-4 h-3 bg-[#a17a45] absolute top-2 left-0 rounded-none"></div>
      </div>
      
      {/* Detailed Backpack with rolled sleeping bag */}
      <div 
        className="w-3.5 h-6 bg-[#4a6d3b] absolute -left-1.5 -top-3.5 rounded-none"
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
        className="w-1.5 h-4 bg-[#d3a05d] absolute -left-0.5 -top-1.5 origin-top"
        style={{ transform: `rotate(${15 + getFrameOffset('arm') * 10}deg)` }}
      >
        {/* Arm details */}
        <div className="w-1.5 h-2 bg-[#a17a45] absolute bottom-0 left-0 rounded-none"></div>
      </div>
      
      {/* Right arm with hiking stick - animated together */}
      <div 
        className="w-1.5 h-4 bg-[#d3a05d] absolute -right-0.5 -top-1.5 origin-top"
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
        className="w-2 h-7 bg-[#5d81b0] absolute left-0 top-1.5 origin-top"
        style={{ transform: `rotate(${getFrameOffset('leg') * 15}deg)` }}
      >
        {/* Pants details */}
        <div className="w-2 h-3 bg-[#4b6a91] absolute bottom-0 left-0 rounded-none"></div>
        
        {/* Boot that lifts with each step */}
        <div className="w-2.5 h-1.5 bg-[#403E43] absolute bottom-0 left-0 -translate-x-0.25 rounded-none"></div>
      </div>
      
      <div 
        className="w-2 h-7 bg-[#5d81b0] absolute right-0 top-1.5 origin-top"
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
          
          {/* Add more pronounced dust clouds for rocky terrain */}
          {terrain === 'rocky' && (
            [...Array(2)].map((_, i) => (
              <motion.div 
                key={`rocky-${i}`}
                className="absolute w-1.5 h-1.5 bg-[#e5e2dd] rounded-full opacity-50"
                style={{ 
                  left: `-${(i+1) * 4 + frame}px`, 
                  bottom: `${i % 2 === 0 ? -1 : 1}px` 
                }}
                animate={{
                  opacity: [0.5, 0],
                  y: [0, -4],
                  x: [0, -6]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.8,
                  delay: i * 0.3
                }}
              />
            ))
          )}
        </>
      )}
    </div>
  );
};

export const HikingTrail = ({ 
  environment = 'office', 
  milestone = 0,
  isCelebrating = false,
  progress = 0 // Progress value (0-100) representing time progress within a segment
}: HikingTrailProps) => {
  const [animate, setAnimate] = useState(false);
  const [isWalking, setIsWalking] = useState(true);
  const [showCheckMap, setShowCheckMap] = useState(false);
  const [showDrink, setShowDrink] = useState(false);
  const [backgroundPosition, setBackgroundPosition] = useState(0);
  const [terrain, setTerrain] = useState<'flat' | 'uphill' | 'downhill' | 'rocky'>('flat');
  const [envEffects, setEnvEffects] = useState<{ birds: boolean; wind: boolean }>({ birds: false, wind: false });
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'day' | 'evening'>('day');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const terrainTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const effectsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollControlsRef = useRef({ x: 0 });
  const groundControls = useAnimation();
  
  const skyImages = [
    '/lovable-uploads/4b5c18b4-0735-42fb-b3c0-033caff6e88b.png', // Light pink sky
    '/lovable-uploads/1c6c89de-51e8-4d13-bf84-ad97b1297a92.png', // Darker pink sky
    '/lovable-uploads/c57503b9-b4ef-4530-a43c-932b0809fecd.png', // Striped sky
    '/lovable-uploads/cc8585e2-6399-4d70-af84-084bd8403137.png', // Light blue treeline
    '/lovable-uploads/63fcb28c-d6f3-4fe7-b074-b75451fb19cd.png', // Medium blue treeline
    '/lovable-uploads/dee86c2b-7eda-49e2-a2a6-cf9a1b76a30a.png', // Dark trees
    '/lovable-uploads/80286acf-39b7-49d4-80ee-6f3616992af3.png', // Sparse treeline
    '/lovable-uploads/f478ce15-05c0-4bd7-91c6-fcd793fb026c.png', // Lighter blue horizon
    '/lovable-uploads/97fbd021-a6ae-461c-9e58-b0d8a49b30a1.png', // Pink gradient
    '/lovable-uploads/ec63c78e-1d9d-4ec9-afad-fdffb1d880c0.png'  // Composite sunset scene
  ];
  
  useEffect(() => {
    const startContinuousScrolling = async () => {
      while (true) {
        await groundControls.start({
          x: [0, -100], // Scroll from 0% to -100%
          transition: {
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 12, // Controls speed of scrolling (lower = faster)
              ease: "linear"
            }
          }
        });
      }
    };
    
    startContinuousScrolling();
    
    return () => {
      groundControls.stop();
    };
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % skyImages.length);
    }, 5000); // Change image every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
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
  
  useEffect(() => {
    if (milestone === 0) {
      setTimeOfDay('morning');
    } else if (milestone === 1 || milestone === 2) {
      setTimeOfDay('day');
    } else {
      setTimeOfDay('evening');
    }
  }, [milestone]);
  
  useEffect(() => {
    if (terrainTimeoutRef.current) {
      clearTimeout(terrainTimeoutRef.current);
    }
    
    const randomTerrain = () => {
      const terrainType = Math.random();
      if (terrainType > 0.7) {
        setTerrain('uphill');
      } else if (terrainType > 0.5) {
        setTerrain('flat');
      } else if (terrainType > 0.3) {
        setTerrain('downhill');
      } else {
        setTerrain('rocky'); // Rocky terrain type
      }
      
      // Schedule next terrain change
      terrainTimeoutRef.current = setTimeout(randomTerrain, 10000 + Math.random() * 20000); // 10-30 seconds
    };
    
    randomTerrain();
    
    return () => {
      if (terrainTimeoutRef.current) {
        clearTimeout(terrainTimeoutRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    if (effectsTimeoutRef.current) {
      clearTimeout(effectsTimeoutRef.current);
    }
    
    const randomEffects = () => {
      // Occasional environmental effects
      setEnvEffects({
        birds: Math.random() > 0.7,
        wind: Math.random() > 0.6
      });
      
      // Schedule next effect change
      effectsTimeoutRef.current = setTimeout(randomEffects, 5000 + Math.random() * 15000); // 5-20 seconds
    };
    
    randomEffects();
    
    return () => {
      if (effectsTimeoutRef.current) {
        clearTimeout(effectsTimeoutRef.current);
      }
    };
  }, []);
  
  const isCheckpointVisible = (checkpointIndex: number) => {
    if (checkpointIndex === milestone) {
      return true;
    }
    
    if (checkpointIndex === milestone + 1) {
      return progress > 75;
    }
    
    if (checkpointIndex < milestone) {
      return true;
    }
    
    return false;
  };
  
  const getCheckpointOpacity = (checkpointIndex: number) => {
    if (checkpointIndex === milestone + 1) {
      return Math.max(0, (progress - 75) / 25);
    }
    
    return isCheckpointVisible(checkpointIndex) ? 1 : 0;
  };
  
  const getProgressPosition = () => {
    return "20%";
  };

  return (
    <div className="w-full h-full relative overflow-hidden rounded-lg border">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000">
          {skyImages.map((src, index) => (
            <img
              key={index}
              src={src}
              alt={`Sky background ${index + 1}`}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
              style={{ 
                opacity: currentImageIndex === index ? 1 : 0,
                zIndex: currentImageIndex === index ? 1 : 0
              }}
            />
          ))}
        </div>
      </div>
      
      <motion.div 
        className="absolute inset-0"
        animate={groundControls}
        initial={{ x: 0 }}
      >
        <div className="absolute bottom-[45%] left-0 w-[300%] h-[25%]">
          <svg viewBox="0 0 300 20" preserveAspectRatio="none" className="h-full w-full">
            <path d="M0,0 L5,2 L10,0 L15,3 L20,0 L25,4 L30,1 L35,5 L40,2 L45,6 L50,3 L55,5 L60,2 L65,4 L70,0 L75,3 L80,1 L85,4 L90,2 L95,3 L100,0 L105,2 L110,0 L115,3 L120,0 L125,4 L130,1 L135,5 L140,2 L145,6 L150,3 L155,5 L160,2 L165,4 L170,0 L175,3 L180,1 L185,4 L190,2 L195,3 L200,0 L205,2 L210,0 L215,3 L220,0 L225,4 L230,1 L235,5 L240,2 L245,6 L250,3 L255,5 L260,2 L265,4 L270,0 L275,3 L280,1 L285,4 L290,2 L295,3 L300,0 L300,20 L0,20 Z" fill="#4a5fd0" />
          </svg>
        </div>
        
        <div className="absolute bottom-[35%] left-0 w-[300%] h-[20%]">
          <svg viewBox="0 0 300 20" preserveAspectRatio="none" className="h-full w-full">
            <path d="M0,3 L8,1 L16,5 L24,2 L32,6 L40,3 L48,7 L56,4 L64,6 L72,3 L80,5 L88,2 L96,4 L104,3 L112,1 L120,5 L128,2 L136,6 L144,3 L152,7 L160,4 L168,6 L176,3 L184,5 L192,2 L200,3 L208,1 L216,5 L224,2 L232,6 L240,3 L248,7 L256,4 L264,6 L272,3 L280,5 L288,2 L296,4 L300,3 L300,20 L0,20 Z" fill="#5870d6" />
          </svg>
        </div>
        
        <div className="absolute bottom-[25%] left-0 w-[300%] h-[15%]">
          <svg viewBox="0 0 300 20" preserveAspectRatio="none" className="h-full w-full">
            <path d="M0,8 L12,4 L24,9 L36,5 L48,10 L60,6 L72,9 L84,5 L96,8 L108,6 L120,8 L132,4 L144,9 L156,5 L168,10 L180,6 L192,9 L204,7 L216,4 L228,9 L240,5 L252,10 L264,6 L276,9 L288,5 L300,8 L300,20 L0,20 Z" fill="#38a169" />
          </svg>
        </div>
        
        <div className="absolute bottom-0 left-0 w-[300%] h-[25%] bg-[#4ade80]">
          <div className="absolute inset-0 opacity-10" 
              style={{ 
                backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', 
                backgroundSize: '8px 8px' 
              }}>
          </div>
          
          {envEffects.wind && (
            <div className="absolute inset-0">
              {[...Array(10)].map((_, i) => (
                <motion.div 
                  key={i}
                  className="absolute h-8 w-1 bg-white opacity-10"
                  style={{ 
                    top: `${20 + Math.random() * 60}%`, 
                    left: `${Math.random() * 100}%`,
                    rotate: `${75 + Math.random() * 15}deg`
                  }}
                  animate={{ 
                    x: [0, 100], 
                    opacity: [0, 0.1, 0]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1 + Math.random() * 2,
                    delay: Math.random() * 2,
                    ease: "linear" 
                  }}
                />
              ))}
            </div>
          )}
        </div>
        
        {envEffects.birds && (
          <div className="absolute top-[10%] left-0 w-full">
            {[...Array(3)].map((_, i) => (
              <motion.div 
                key={i}
                className="absolute"
                style={{ 
                  top: `${Math.random() * 20}%`, 
                  left: `${Math.random() * 20}%`
                }}
                animate={{ 
                  x: [0, 100, 200, 300, 400], 
                  y: [0, 10, -10, 20, 0] 
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 20 + Math.random() * 10,
                  delay: Math.random() * 5,
                  ease: "linear" 
                }}
              >
                <svg width="20" height="10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <motion.path 
                    d="M1,5 Q5,1 10,5 T19,5" 
                    stroke="black" 
                    strokeWidth="1.5"
                    fill="none"
                    animate={{ 
                      d: [
                        "M1,5 Q5,1 10,5 T19,5", 
                        "M1,5 Q5,8 10,5 T19,5",
                        "M1,5 Q5,1 10,5 T19,5"
                      ]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1.5,
                      ease: "easeInOut" 
                    }}
                  />
                </svg>
              </motion.div>
            ))}
          </div>
        )}
        
        <div className="absolute bottom-[25%] left-[5%]">
          <div className="w-10 h-12 relative">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-4 bg-[#7d5a33] rounded-none"></div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-6 bg-[#2f855a] rounded-none"></div>
            <div className="absolute bottom-7 left-1/2 -translate-x-1/2 w-6 h-5 bg-[#2f855a] rounded-none"></div>
          </div>
        </div>
        
        <div className="absolute bottom-[25%] left-[20%]">
          <div className="w-8 h-10 relative">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-3 bg-[#7d5a33] rounded-none"></div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-5 bg-[#2f855a] rounded-none"></div>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#2f855a] rounded-none"></div>
          </div>
        </div>
        
        <div className="absolute bottom-[25%] left-[45%]">
          <div className="w-12 h-14 relative">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-5 bg-[#7d5a33] rounded-none"></div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-7 bg-[#38a169] rounded-none"></div>
            <div className="absolute bottom-9 left-1/2 -translate-x-1/2 w-8 h-6 bg-[#38a169] rounded-none"></div>
          </div>
        </div>
        
        <div className="absolute bottom-[25%] left-[60%]">
          <div className="w-10 h-12 relative">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-4 bg-[#7d5a33] rounded-none"></div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-6 bg-[#2f855a] rounded-none"></div>
            <div className="absolute bottom-7 left-1/2 -translate-x-1/2 w-6 h-5 bg-[#2f855a] rounded-none"></div>
          </div>
        </div>
        
        <div className="absolute bottom-[25%] left-[85%]">
          <div className="w-10 h-12 relative">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-4 bg-[#7d5a33] rounded-none"></div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-6 bg-[#f6ad55] rounded-none"></div>
            <div className="absolute bottom-7 left-1/2 -translate-x-1/2 w-6 h-5 bg-[#f6ad55] rounded-none"></div>
          </div>
        </div>
        
        <div className="absolute bottom-[25%] left-[95%]">
          <div className="w-14 h-16 relative">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-6 bg-[#7d5a33] rounded-none"></div>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-12 h-8 bg-[#ed8936] rounded-none"></div>
            <div className="absolute bottom-11 left-1/2 -translate-x-1/2 w-10 h-6 bg-[#ed8936] rounded-none"></div>
          </div>
        </div>
        
        <div className="absolute bottom-[25%] left-[120%]">
          <div className="w-8 h-10 relative">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-3 bg-[#7d5a33] rounded-none"></div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-5 bg-[#48bb78] rounded-none"></div>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#48bb78] rounded-none"></div>
          </div>
        </div>
        
        <div className="absolute bottom-[25%] left-[135%]">
          <div className="w-12 h-14 relative">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-5 bg-[#7d5a33] rounded-none"></div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-7 bg-[#2c7a7b] rounded-none"></div>
            <div className="absolute bottom-9 left-1/2 -translate-x-1/2 w-8 h-6 bg-[#2c7a7b] rounded-none"></div>
          </div>
        </div>
        
        <div className="absolute bottom-[28%] right-[50%]">
          <div className="w-16 h-20 relative">
            <div className="absolute bottom-0 left-0 w-16 h-12 bg-[#718096] rounded-none"></div>
            <div className="absolute bottom-8 left-3 w-10 h-12 bg-[#4a5568] rounded-none"></div>
            <div className="absolute top-0 left-6 w-4 h-4 bg-white rounded-none"></div>
          </div>
        </div>
      </motion.div>
      
      <div className="absolute bottom-[12.5%] left-0 right-0 h-[2.5%]">
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="h-full w-full">
          <path 
            d="M0,5 Q25,3 50,5 T100,5" 
            stroke="white" 
            strokeWidth="1.5"
            strokeDasharray="3,3"
            fill="none" 
          />
        </svg>
        
        {[0, 1, 2, 3].map((checkpointIndex) => (
          <motion.div 
            key={checkpointIndex}
            className="absolute top-0"
            style={{ 
              left: `${10 + checkpointIndex * 25}%`,
              opacity: getCheckpointOpacity(checkpointIndex),
              visibility: isCheckpointVisible(checkpointIndex) ? 'visible' : 'hidden'
            }}
            animate={{
              y: isCheckpointVisible(checkpointIndex) ? 0 : 10,
              scale: isCheckpointVisible(checkpointIndex) ? 1 : 0.5,
            }}
            transition={{
              duration: 0.5,
              ease: "easeOut"
            }}
          >
            <div className="h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-none bg-white border-2 border-[#2f855a]"></div>
          </motion.div>
        ))}
        
        <motion.div 
          className="absolute top-0 left-[85%] -translate-x-1/2 -translate-y-1/2"
          style={{ 
            opacity: getCheckpointOpacity(3),
            visibility: isCheckpointVisible(3) ? 'visible' : 'hidden'
          }}
          animate={{
            y: isCheckpointVisible(3) ? 0 : 10,
            scale: isCheckpointVisible(3) ? 1 : 0.5,
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut"
          }}
        >
          <div className="relative w-6 h-12">
            <div className="absolute bottom-0 w-1 h-8 bg-[#7d5a33] rounded-none"></div>
            <div className="absolute top-0 left-1 w-4 h-3 bg-[#e53e3e] rounded-none"></div>
          </div>
        </motion.div>
      </div>
      
      <motion.div
        className="absolute bottom-[15%]"
        style={{ left: getProgressPosition() }}
        animate={{ 
          y: animate ? -5 : 0
        }}
        transition={{ 
          y: animate ? { 
            duration: 0.5, 
            repeat: 3, 
            repeatType: "reverse", 
            ease: "easeInOut" 
          } : {}
        }}
      >
        <div className="relative">
          <AnimatedPerson 
            isWalking={isWalking} 
            facingRight={true}
            isGoingUphill={terrain === 'uphill'} 
            terrain={terrain}
            walkingSpeed={getWalkingSpeed()}
          />
          
          {showCheckMap && (
            <motion.div 
              className="absolute -top-10 left-4"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <div className="w-8 h-6 bg-[#f1f0eb] rounded-none border border-[#d0cfc9] p-0.5">
                <div className="w-full h-full bg-[#e5e4de] rounded-none">
                  <div className="w-5 h-0.5 bg-[#a1a09c] rounded-none mx-auto mt-1"></div>
                  <div className="w-4 h-0.5 bg-[#a1a09c] rounded-none mx-auto mt-1"></div>
                  <div className="w-5 h-0.5 bg-[#a1a09c] rounded-none mx-auto mt-1"></div>
                </div>
              </div>
            </motion.div>
          )}
          
          {showDrink && (
            <motion.div 
              className="absolute -top-9 left-2"
              initial={{ opacity: 0, rotate: -45 }}
              animate={{ opacity: 1, rotate: 45 }}
              exit={{ opacity: 0, rotate: -45 }}
            >
              <div className="w-2 h-4 bg-[#add8e6] rounded-none border border-[#5d81b0]">
                <div className="w-1 h-1 bg-[#5d81b0] rounded-none mx-auto mt-2"></div>
              </div>
            </motion.div>
          )}
          
          {isCelebrating && !showCheckMap && !showDrink && (
            <motion.div 
              className="absolute -top-8 -left-6 right-0"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <div className="text-xs font-pixel bg-white rounded-none px-2 py-1 shadow-sm border border-gray-200">
                {milestone === 0 ? "First milestone!" : 
                 milestone === 1 ? "Halfway there!" :
                 milestone === 2 ? "Almost done!" :
                 "Summit reached!"}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      {milestone >= 1 && (
        <motion.div 
          className="absolute bottom-[15%] left-[30%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-8 h-10 relative">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-3 bg-[#7d5a33] rounded-none"></div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-5 bg-[#48bb78] rounded-none"></div>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#48bb78] rounded-none"></div>
          </div>
        </motion.div>
      )}
      
      {milestone >= 2 && (
        <motion.div 
          className="absolute bottom-[15%] left-[55%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-10 h-12 relative">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-4 bg-[#7d5a33] rounded-none"></div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-6 bg-[#2c7a7b] rounded-none"></div>
            <div className="absolute bottom-7 left-1/2 -translate-x-1/2 w-6 h-5 bg-[#2c7a7b] rounded-none"></div>
          </div>
        </motion.div>
      )}
      
      {milestone >= 3 && (
        <motion.div 
          className="absolute bottom-[18%] right-[18%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-20 relative">
            <div className="absolute bottom-0 left-0 w-16 h-12 bg-[#718096] rounded-none"></div>
            <div className="absolute bottom-8 left-3 w-10 h-12 bg-[#4a5568] rounded-none"></div>
            <div className="absolute top-0 left-6 w-4 h-4 bg-white rounded-none"></div>
          </div>
        </motion.div>
      )}
      
      {(isCelebrating || terrain !== 'flat') && (
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          animate={{ 
            x: terrain === 'uphill' ? [-1, 1, -1] : 
               terrain === 'rocky' ? [-2, 1, -1.5, 0.5, -1] :
               isCelebrating ? [-2, 2, -2, 2, 0] : 
               [-1, 0, -1],
            y: terrain === 'uphill' ? [-1, 1, -1] : 
               terrain === 'rocky' ? [-1.5, 1, -0.5, 0.8, -0.2] :
               isCelebrating ? [-2, 2, -1, 1, 0] : 
               [-0.5, 0.5, -0.5]
          }}
          transition={{ 
            repeat: terrain !== 'flat' ? Infinity : 1,
            duration: terrain === 'rocky' ? 0.3 : 
                      terrain === 'uphill' ? 0.5 : 0.3,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  );
};
