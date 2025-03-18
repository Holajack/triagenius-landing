
import { useState, useEffect } from "react";
import { StudyEnvironment } from "@/types/onboarding";

interface HikingTrailProps {
  environment?: StudyEnvironment;
  milestone: number;
  isCelebrating?: boolean;
  progress?: number;
}

export const HikingTrail = ({
  environment = 'office',
  milestone = 0,
  isCelebrating = false,
  progress = 0
}: HikingTrailProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const skyImages = [
    '/lovable-uploads/3e1d695a-83eb-4783-8669-0703955b486e.png', // Light pink sky
    '/lovable-uploads/0c0d059c-d5c6-42ac-95d2-b54ed30f20b5.png', // Darker pink sky
    '/lovable-uploads/f4de38f8-ff33-4a3a-849a-05ed81d519b3.png', // Striped sky
    '/lovable-uploads/e2d48e42-621f-4f30-a6d2-78ee6fc91178.png', // Light blue treeline
    '/lovable-uploads/a3b0edbd-c392-47ba-8598-b721b1788753.png', // Medium blue treeline
    '/lovable-uploads/8914d40b-be7b-440f-a2dd-39bab07a0019.png', // Dark trees
    '/lovable-uploads/fdaa538c-a0f7-4608-988c-8d92f3a3ca61.png', // Sparse treeline
    '/lovable-uploads/2ea03d16-85e9-4053-a853-187da28dd63b.png', // Lighter blue horizon
    '/lovable-uploads/0c197baa-bc72-4f53-b5d0-4137c634b91f.png', // Pink gradient
    '/lovable-uploads/d2960f6f-feaf-478a-8519-cdcf8186198b.png'  // Composite sunset scene
  ];
  
  useEffect(() => {
    // Change image every 5 seconds to create the sunrise/sunset effect
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % skyImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Milestone indicator dots along the bottom
  const renderMilestoneIndicators = () => {
    return (
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
          <div 
            key={checkpointIndex}
            className="absolute top-0"
            style={{ 
              left: `${10 + checkpointIndex * 25}%`,
              opacity: checkpointIndex <= milestone ? 1 : 0.3,
            }}
          >
            <div className="h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-none bg-white border-2 border-[#2f855a]"></div>
          </div>
        ))}
        
        {/* Finish flag */}
        <div 
          className="absolute top-0 left-[85%] -translate-x-1/2 -translate-y-1/2"
          style={{ 
            opacity: milestone >= 3 ? 1 : 0.3,
          }}
        >
          <div className="relative w-6 h-12">
            <div className="absolute bottom-0 w-1 h-8 bg-[#7d5a33] rounded-none"></div>
            <div className="absolute top-0 left-1 w-4 h-3 bg-[#e53e3e] rounded-none"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full relative overflow-hidden rounded-lg border">
      {/* Sky image background */}
      <div className="absolute inset-0">
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
      
      {/* Draw the milestone indicators */}
      {renderMilestoneIndicators()}
      
      {/* Hiker position indicator */}
      <div 
        className="absolute bottom-[15%] left-[20%] w-4 h-8 bg-white"
        style={{
          left: `${20 + (milestone * 20) + (progress / 5)}%`,
          display: isCelebrating ? 'none' : 'block'
        }}
      ></div>
      
      {/* Celebration indicator */}
      {isCelebrating && (
        <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-lg text-black font-bold">
          {milestone === 0 ? "First milestone!" : 
           milestone === 1 ? "Halfway there!" :
           milestone === 2 ? "Almost done!" :
           "Summit reached!"}
        </div>
      )}
    </div>
  );
};
