
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface BrainModelProps {
  activeRegion: string | null;
  setActiveRegion: (region: string | null) => void;
  zoomLevel: number;
  rotation: number;
}

const BrainModel = ({ activeRegion, setActiveRegion, zoomLevel, rotation }: BrainModelProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    // Simulate loading the 3D model
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const brainRegions = [
    { 
      id: "frontal", 
      name: "Frontal Lobe", 
      position: { top: "25%", left: "30%" }, 
      activity: 0.85,
      shape: "w-[30%] h-[28%] rounded-t-[100px]",
      customStyle: { top: "15%", left: "35%" } 
    },
    { 
      id: "temporal", 
      name: "Temporal Lobe", 
      position: { top: "55%", left: "25%" }, 
      activity: 0.6,
      shape: "w-[25%] h-[22%] rounded-full",
      customStyle: { top: "53%", left: "22%" } 
    },
    { 
      id: "parietal", 
      name: "Parietal Lobe", 
      position: { top: "35%", left: "60%" }, 
      activity: 0.75,
      shape: "w-[25%] h-[22%] rounded-full",
      customStyle: { top: "27%", left: "65%" } 
    },
    { 
      id: "occipital", 
      name: "Occipital Lobe", 
      position: { top: "60%", left: "70%" }, 
      activity: 0.4,
      shape: "w-[20%] h-[22%] rounded-full",
      customStyle: { top: "52%", left: "72%" } 
    },
    { 
      id: "cerebellum", 
      name: "Cerebellum", 
      position: { top: "75%", left: "50%" }, 
      activity: 0.5,
      shape: "w-[28%] h-[15%] rounded-b-[100px]",
      customStyle: { top: "78%", left: "50%" } 
    },
    { 
      id: "brainstem", 
      name: "Brain Stem", 
      position: { top: "80%", left: "50%" }, 
      activity: 0.55,
      shape: "w-[10%] h-[18%] rounded-b-full",
      customStyle: { top: "88%", left: "50%" } 
    },
  ];

  // Get activity level color
  const getActivityColor = (activity: number) => {
    if (activity > 0.8) return "rgba(239, 68, 68, 0.8)"; // red-500
    if (activity > 0.6) return "rgba(249, 115, 22, 0.8)"; // orange-500
    if (activity > 0.4) return "rgba(234, 179, 8, 0.8)"; // yellow-500
    if (activity > 0.2) return "rgba(34, 197, 94, 0.8)"; // green-500
    return "rgba(59, 130, 246, 0.8)"; // blue-500
  };

  const getActivityColorClass = (activity: number) => {
    if (activity > 0.8) return "bg-red-500";
    if (activity > 0.6) return "bg-orange-500";
    if (activity > 0.4) return "bg-yellow-500";
    if (activity > 0.2) return "bg-green-500";
    return "bg-blue-500";
  };

  const getRegionHighlight = (regionName: string) => {
    return activeRegion === regionName ? 
      "ring-4 ring-primary ring-offset-2 z-10 brightness-110" : 
      "opacity-80 hover:opacity-100 hover:brightness-110 transition-all";
  };

  const baseBrainColor = theme === 'dark' ? 
    "from-gray-700 to-gray-900 shadow-inner border border-gray-600" : 
    "from-gray-200 to-gray-300 shadow-inner border border-gray-300";

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
          {/* Main brain outline - more anatomical shape */}
          <div className={`absolute w-[80%] h-[80%] top-[10%] left-[10%] bg-gradient-to-br ${baseBrainColor} rounded-[45%_45%_35%_35%] overflow-hidden`}>
            {/* Brain texture/details - more anatomical texture for gyri and sulci */}
            <div className="absolute inset-0 z-0">
              {/* Gyri and sulci pattern - overlapping curved lines to create brain texture */}
              <div className="absolute w-full h-full opacity-40">
                <div className="absolute w-[95%] h-[2px] bg-gray-400 top-[20%] left-[2%] rounded-full"></div>
                <div className="absolute w-[90%] h-[2px] bg-gray-400 top-[23%] left-[5%] rounded-full"></div>
                <div className="absolute w-[85%] h-[2px] bg-gray-400 top-[26%] left-[8%] rounded-full"></div>
                <div className="absolute w-[85%] h-[2px] bg-gray-400 top-[30%] left-[7%] rounded-full"></div>
                <div className="absolute w-[88%] h-[2px] bg-gray-400 top-[34%] left-[6%] rounded-full"></div>
                <div className="absolute w-[90%] h-[2px] bg-gray-400 top-[38%] left-[5%] rounded-full"></div>
                <div className="absolute w-[92%] h-[2px] bg-gray-400 top-[42%] left-[4%] rounded-full"></div>
                <div className="absolute w-[90%] h-[2px] bg-gray-400 top-[46%] left-[5%] rounded-full"></div>
                <div className="absolute w-[85%] h-[2px] bg-gray-400 top-[50%] left-[8%] rounded-full"></div>
                <div className="absolute w-[80%] h-[2px] bg-gray-400 top-[54%] left-[10%] rounded-full"></div>
                <div className="absolute w-[85%] h-[2px] bg-gray-400 top-[58%] left-[8%] rounded-full"></div>
                <div className="absolute w-[88%] h-[2px] bg-gray-400 top-[62%] left-[6%] rounded-full"></div>
                <div className="absolute w-[90%] h-[2px] bg-gray-400 top-[66%] left-[5%] rounded-full"></div>
                <div className="absolute w-[92%] h-[2px] bg-gray-400 top-[70%] left-[4%] rounded-full"></div>
                <div className="absolute w-[1px] h-[80%] bg-gray-400 top-[10%] left-[50%] rounded-full"></div>
              </div>
            </div>
            
            {/* Cerebellum detail */}
            <div className="absolute w-[28%] h-[15%] bottom-[5%] left-[36%] bg-gradient-to-b from-gray-400/30 to-gray-500/30 rounded-b-[60px]">
              <div className="absolute w-full h-[1px] bg-gray-500/50 top-[25%]"></div>
              <div className="absolute w-full h-[1px] bg-gray-500/50 top-[50%]"></div>
              <div className="absolute w-full h-[1px] bg-gray-500/50 top-[75%]"></div>
            </div>
            
            {/* Brain stem */}
            <div className="absolute w-[8%] h-[15%] bottom-[-10%] left-[46%] bg-gradient-to-b from-gray-400/50 to-gray-500/50 rounded-b-full"></div>
            
            {/* Interactive brain regions with more anatomical shapes */}
            {brainRegions.map((region) => (
              <div
                key={region.id}
                className={`absolute ${region.shape} cursor-pointer transition-all duration-300 ${getRegionHighlight(region.name)}`}
                style={{ 
                  top: region.customStyle.top, 
                  left: region.customStyle.left,
                  background: getActivityColor(region.activity)
                }}
                onClick={() => setActiveRegion(region.name === activeRegion ? null : region.name)}
                aria-label={`${region.name} - Activity level: ${Math.round(region.activity * 100)}%`}
              >
                <span className="sr-only">{region.name}</span>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className={`absolute bottom-4 left-4 ${theme === 'dark' ? 'bg-gray-800/70' : 'bg-background/70'} backdrop-blur-sm p-2 rounded-md flex items-center gap-2 text-xs`}>
            <span>Activity Level:</span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div> Low
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div> Medium
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div> Moderate
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div> High
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div> Very High
            </span>
          </div>

          {/* Add labels for the brain regions */}
          {brainRegions.map((region) => (
            <div 
              key={`label-${region.id}`}
              className={`absolute text-xs font-medium px-1.5 py-0.5 ${theme === 'dark' ? 'bg-gray-800/70 text-gray-100' : 'bg-white/70 text-gray-800'} 
                rounded pointer-events-none transform -translate-x-1/2 transition-opacity duration-300 
                ${activeRegion === region.name || !activeRegion ? 'opacity-100' : 'opacity-0'}`}
              style={{
                top: `calc(${region.customStyle.top} - 20px)`,
                left: region.customStyle.left,
              }}
            >
              {region.name}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default BrainModel;
