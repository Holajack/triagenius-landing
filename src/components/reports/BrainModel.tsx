
import { useState, useEffect } from 'react';
import { MountainTerrainScene } from './brain/MountainTerrainScene';

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
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Mark the component as loaded
    setIsLoaded(true);
    
    console.log("MountainTerrain component initialized", { zoomLevel, rotation });
    
    return () => {
      console.log("MountainTerrain component unmounted");
    };
  }, [zoomLevel, rotation]);

  // Handle errors during rendering
  const handleError = (error: Error) => {
    console.error("Error in MountainTerrain:", error);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 text-red-500 p-4 rounded-md">
        <p>Error rendering visualization. Please try refreshing the page.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100">
        <p className="text-gray-500">Loading visualization...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <MountainTerrainScene 
        zoomLevel={zoomLevel}
        rotation={rotation}
      />
    </div>
  );
};

export default BrainModel;
