
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { BrainScene } from "./brain/BrainScene";

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

  const getRegionDescription = (regionName: string | null) => {
    switch (regionName) {
      case "Frontal Lobe":
        return "Critical thinking & executive functions. Active during planning and decision-making tasks.";
      case "Temporal Lobe":
        return "Memory formation and language processing. Crucial for learning and communication.";
      case "Parietal Lobe":
        return "Sensory integration and spatial awareness. Important for mathematics and navigation.";
      case "Occipital Lobe":
        return "Visual processing center. Essential for reading and visual learning.";
      case "Cerebellum":
        return "Motor learning and balance. Helps in skill acquisition and muscle memory.";
      case "Brain Stem":
        return "Basic life functions. Controls alertness and concentration.";
      default:
        return "";
    }
  };

  return (
    <div className="w-full h-full relative">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="h-[400px] relative">
            <BrainScene
              activeRegion={activeRegion}
              setActiveRegion={setActiveRegion}
              zoomLevel={zoomLevel}
              rotation={rotation}
            />
          </div>

          {/* Info overlay when region is selected */}
          {activeRegion && (
            <div className={`absolute bottom-0 left-0 right-0 ${
              theme === 'dark' ? 'bg-gray-800/90' : 'bg-background/90'
            } backdrop-blur-sm p-3 border-t`}>
              <h4 className="font-medium">{activeRegion}</h4>
              <p className="text-xs text-muted-foreground">
                {getRegionDescription(activeRegion)}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BrainModel;
