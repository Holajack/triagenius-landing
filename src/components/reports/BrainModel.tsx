
import { useState, useEffect } from "react";

interface BrainModelProps {
  activeRegion: string | null;
  setActiveRegion: (region: string | null) => void;
  zoomLevel: number;
  rotation: number;
}

const BrainModel = ({ activeRegion, setActiveRegion, zoomLevel, rotation }: BrainModelProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading the 3D model
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const brainRegions = [
    { id: "frontal", name: "Frontal Lobe", position: { top: "25%", left: "30%" }, activity: 0.85 },
    { id: "temporal", name: "Temporal Lobe", position: { top: "55%", left: "25%" }, activity: 0.6 },
    { id: "parietal", name: "Parietal Lobe", position: { top: "35%", left: "60%" }, activity: 0.75 },
    { id: "occipital", name: "Occipital Lobe", position: { top: "60%", left: "70%" }, activity: 0.4 },
    { id: "cerebellum", name: "Cerebellum", position: { top: "75%", left: "50%" }, activity: 0.5 },
  ];

  // Get activity level color
  const getActivityColor = (activity: number) => {
    if (activity > 0.8) return "bg-red-500";
    if (activity > 0.6) return "bg-orange-500";
    if (activity > 0.4) return "bg-yellow-500";
    if (activity > 0.2) return "bg-green-500";
    return "bg-blue-500";
  };

  return (
    <div 
      className="w-full h-full relative"
      style={{ 
        transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
        transformOrigin: "center center",
        transition: "transform 0.3s ease"
      }}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Placeholder for 3D brain - In a real implementation, this would use Three.js or a similar library */}
          <div className="absolute w-[70%] h-[70%] top-[15%] left-[15%] rounded-[50%] bg-gradient-to-br from-gray-200 to-gray-300 shadow-inner">
            {/* Brain texture/details */}
            <div className="absolute w-[90%] h-[80%] top-[10%] left-[5%] rounded-[50%] opacity-30">
              <div className="absolute w-[60%] h-[30%] top-[20%] left-[20%] rounded-full bg-gray-400 rotate-45"></div>
              <div className="absolute w-[40%] h-[20%] top-[40%] left-[30%] rounded-full bg-gray-400 -rotate-12"></div>
              <div className="absolute w-[55%] h-[25%] top-[60%] left-[25%] rounded-full bg-gray-400 rotate-12"></div>
            </div>
            
            {/* Interactive brain regions */}
            {brainRegions.map((region) => (
              <button
                key={region.id}
                className={`absolute w-6 h-6 rounded-full cursor-pointer transition-all duration-300 ${
                  activeRegion === region.name 
                    ? "ring-4 ring-primary ring-offset-2 z-10" 
                    : ""
                } ${getActivityColor(region.activity)}`}
                style={{ 
                  top: region.position.top, 
                  left: region.position.left,
                }}
                onClick={() => setActiveRegion(region.name === activeRegion ? null : region.name)}
                aria-label={`${region.name} - Activity level: ${Math.round(region.activity * 100)}%`}
              >
                <span className="sr-only">{region.name}</span>
              </button>
            ))}
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-background/70 backdrop-blur-sm p-2 rounded-md flex items-center gap-2 text-xs">
            <span>Activity Level:</span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div> Low
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div> Medium
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div> High
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div> Very High
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default BrainModel;
