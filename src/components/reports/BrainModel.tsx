
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
    // Simulate loading the brain image
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const brainRegions = [
    { id: "frontal", name: "Frontal Lobe", position: { top: "25%", left: "20%" }, activity: 0.85, color: "rgba(255, 0, 128, 0.7)" },
    { id: "temporal", name: "Temporal Lobe", position: { top: "55%", left: "35%" }, activity: 0.6, color: "rgba(0, 255, 128, 0.7)" },
    { id: "parietal", name: "Parietal Lobe", position: { top: "30%", left: "55%" }, activity: 0.75, color: "rgba(128, 0, 255, 0.7)" },
    { id: "occipital", name: "Occipital Lobe", position: { top: "50%", left: "75%" }, activity: 0.4, color: "rgba(255, 128, 0, 0.7)" },
    { id: "cerebellum", name: "Cerebellum", position: { top: "75%", left: "60%" }, activity: 0.5, color: "rgba(0, 128, 255, 0.7)" },
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
          {/* 2D Brain image using the uploaded colorful brain */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full">
              <img 
                src="/lovable-uploads/bb0c6272-e8d5-4d18-b0c6-0e4495de221c.png" 
                alt="Colorful brain visualization" 
                className="object-contain w-full h-full max-h-[350px] mx-auto"
              />
              
              {/* Interactive brain regions - positioned over the image */}
              {brainRegions.map((region) => (
                <div
                  key={region.id}
                  className="absolute"
                  style={{ 
                    top: region.position.top, 
                    left: region.position.left,
                  }}
                >
                  <button
                    className={`w-8 h-8 rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center
                      ${activeRegion === region.name ? "ring-4 ring-primary ring-offset-2 z-10" : ""}
                      shadow-lg backdrop-blur-sm`}
                    style={{ 
                      backgroundColor: region.color,
                      boxShadow: "0 0 10px rgba(0,0,0,0.2)"
                    }}
                    onClick={() => setActiveRegion(region.name === activeRegion ? null : region.name)}
                    aria-label={`${region.name} - Activity level: ${Math.round(region.activity * 100)}%`}
                  >
                    <span className="sr-only">{region.name}</span>
                  </button>
                  
                  {activeRegion === region.name && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {region.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Legend for the visualization */}
          <div className="absolute bottom-4 left-4 bg-background/70 backdrop-blur-sm p-2 rounded-md flex flex-wrap items-center gap-2 text-xs">
            <span>Brain Regions:</span>
            {brainRegions.map((region) => (
              <span key={region.id} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: region.color }}></div>
                {region.name}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BrainModel;
