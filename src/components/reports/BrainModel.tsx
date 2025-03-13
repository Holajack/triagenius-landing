
import { useState, useEffect } from 'react';
import { MountainTerrainScene } from './brain/MountainTerrainScene';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BrainModelProps {
  activeSubject: string | null;
  setActiveSubject: (subject: string | null) => void;
  zoomLevel: number;
  rotation: number;
}

const BrainModel = ({ 
  activeSubject, 
  setActiveSubject, 
  zoomLevel = 1, 
  rotation = 0 
}: BrainModelProps) => {
  const isMobile = useIsMobile();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [biomeType, setBiomeType] = useState<'mountains' | 'desert' | 'forest' | 'mixed'>('mountains');

  useEffect(() => {
    // Mark the component as loaded after a short delay to ensure proper initialization
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    console.log("MountainTerrain component initialized", { zoomLevel, rotation, biomeType });
    
    return () => {
      clearTimeout(timer);
      console.log("MountainTerrain component unmounted");
    };
  }, [zoomLevel, rotation, biomeType]);

  // Handle errors during rendering
  const handleError = (error: Error) => {
    console.error("Error in MountainTerrain:", error);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-100 text-red-500 p-4 rounded-md">
        <p>Error rendering visualization. Please try refreshing the page.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
          <p className="text-gray-500">Loading terrain visualization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden rounded-md">
      {/* Add terrain style selector */}
      <div className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-md shadow-md">
        <Select
          value={biomeType}
          onValueChange={(value) => setBiomeType(value as any)}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Terrain Style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mountains">Mountains</SelectItem>
            <SelectItem value="desert">Desert</SelectItem>
            <SelectItem value="forest">Forest</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Display vertex count info */}
      <div className="absolute bottom-2 left-2 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-md shadow-md text-xs">
        {isMobile ? "~30k vertices (mobile)" : "~90k vertices (desktop)"}
      </div>
      
      <MountainTerrainScene 
        zoomLevel={zoomLevel}
        rotation={rotation}
        biomeType={biomeType}
      />
    </div>
  );
};

export default BrainModel;
