
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { StudyEnvironment } from "@/types/onboarding";

// Define the images for different environments
const ENVIRONMENT_IMAGES = {
  "office": [
    "/lovable-uploads/954b64c4-2ca7-43ef-87d2-5b7a25cf61db.png",
    "/lovable-uploads/c65de9cc-6853-4e0d-9db5-1157424b0c69.png",
    "/lovable-uploads/31c1bea5-4c63-40e8-985e-b9e73b9661a6.png",
  ],
  "park": [
    "/lovable-uploads/7bb40918-2b00-40e3-9960-17aefb9277e2.png",
    "/lovable-uploads/6a0d2794-efc7-49c2-874d-ed3674e3d5a5.png",
    "/lovable-uploads/72c4c352-a88b-4a82-8278-899758c0a8bd.png",
  ],
  "library": [
    "/lovable-uploads/dc55bca4-237f-4191-9ddd-0ce1d95f4460.png",
    "/lovable-uploads/4e06eb3d-3530-4a2d-9d97-aae47948f315.png",
    "/lovable-uploads/c4f8c798-1747-4fa9-a22b-8f35e3b23b71.png",
  ],
  "home": [
    "/lovable-uploads/9f2387fc-b2f0-4851-bda4-373add7d7a92.png",
    "/lovable-uploads/954b64c4-2ca7-43ef-87d2-5b7a25cf61db.png",
    "/lovable-uploads/c65de9cc-6853-4e0d-9db5-1157424b0c69.png",
  ],
  "coffee-shop": [
    "/lovable-uploads/31c1bea5-4c63-40e8-985e-b9e73b9661a6.png",
    "/lovable-uploads/7bb40918-2b00-40e3-9960-17aefb9277e2.png",
    "/lovable-uploads/6a0d2794-efc7-49c2-874d-ed3674e3d5a5.png",
  ],
  // Default fallback
  "default": [
    "/lovable-uploads/72c4c352-a88b-4a82-8278-899758c0a8bd.png",
    "/lovable-uploads/dc55bca4-237f-4191-9ddd-0ce1d95f4460.png",
    "/lovable-uploads/4e06eb3d-3530-4a2d-9d97-aae47948f315.png",
  ]
};

interface SimpleLandscapeAnimationProps {
  environment: StudyEnvironment | string;
  milestone?: number;
  isCelebrating?: boolean;
  progress?: number;
}

export const SimpleLandscapeAnimation: React.FC<SimpleLandscapeAnimationProps> = ({
  environment = "office",
  milestone = 0,
  isCelebrating = false,
  progress = 0
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Get the appropriate images for this environment
  const getEnvironmentImages = () => {
    try {
      const envType = environment as keyof typeof ENVIRONMENT_IMAGES;
      return ENVIRONMENT_IMAGES[envType] || ENVIRONMENT_IMAGES.default;
    } catch (error) {
      console.error("Error getting environment images:", error);
      return ENVIRONMENT_IMAGES.default;
    }
  };
  
  const images = getEnvironmentImages();
  
  // Effect to cycle through images for animation
  useEffect(() => {
    // Safety check to ensure component is mounted
    let isMounted = true;
    
    const interval = setInterval(() => {
      if (isMounted && images && images.length > 0) {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
      }
    }, 3000); // Change image every 3 seconds
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [images.length]);
  
  // Calculate milestone indicator positions
  const getMilestonePosition = (index: number) => {
    return `${10 + index * 25}%`;
  };
  
  // Calculate progress indicator position
  const getProgressPosition = () => {
    const basePosition = 10 + (milestone || 0) * 25;
    const progressOffset = ((progress || 0) / 100) * 25;
    return `${basePosition + progressOffset}%`;
  };

  // Safely render component with error handling
  try {
    return (
      <div className="relative w-full h-full overflow-hidden rounded-lg">
        {/* Background Animation */}
        {images && images.length > 0 && (
          <motion.div 
            className="absolute inset-0 w-full h-full"
            animate={{ opacity: 1 }}
            initial={{ opacity: 0.8 }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
          >
            <img 
              src={images[currentImageIndex]} 
              alt="Landscape" 
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error("Image failed to load:", e);
                e.currentTarget.src = "/placeholder.svg"; // Fallback to placeholder
              }}
            />
          </motion.div>
        )}
        
        {/* Overlay for milestone indicators */}
        <div className="absolute bottom-4 left-0 right-0 h-1 bg-white/20">
          {/* Milestone markers */}
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i}
              className={`absolute w-3 h-3 rounded-full -top-1 transform -translate-x-1/2 ${
                i <= (milestone || 0) ? 'bg-primary' : 'bg-white/40'
              }`}
              style={{ left: getMilestonePosition(i) }}
            />
          ))}
          
          {/* Progress indicator */}
          <motion.div 
            className="absolute h-1 bg-primary rounded-r-full"
            style={{ 
              width: getProgressPosition(), 
              left: 0 
            }}
          />
          
          {/* Character indicator */}
          <motion.div 
            className="absolute w-4 h-4 -top-1.5 bg-primary rounded-full border-2 border-white"
            style={{ left: getProgressPosition() }}
            animate={isCelebrating ? { 
              y: [0, -5, 0],
              scale: [1, 1.2, 1]
            } : {}}
            transition={isCelebrating ? { 
              duration: 0.5, 
              repeat: 3, 
              repeatType: "reverse" 
            } : {}}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error rendering SimpleLandscapeAnimation:", error);
    // Return a minimal fallback to prevent white screen
    return (
      <div className="relative w-full h-full overflow-hidden rounded-lg bg-gray-100">
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-gray-500">Landscape view unavailable</p>
        </div>
      </div>
    );
  }
};
