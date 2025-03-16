
import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { PathwaySystem } from './PathwaySystem';
import { Map, Mountain, ExternalLink } from 'lucide-react';

// Define the path points for the brain regions
const pathPoints = [
  { 
    position: [0, 0, 0] as [number, number, number], 
    type: 'basecamp' as const, 
    label: 'Learning Basecamp' 
  },
  { 
    position: [3, 1, 2] as [number, number, number], 
    type: 'prefrontal' as const, 
    label: 'Critical Thinking Zone' 
  },
  { 
    position: [-2, 0.5, 3] as [number, number, number], 
    type: 'hippocampus' as const, 
    label: 'Memory Formation Trail' 
  },
  { 
    position: [0, 2, -3] as [number, number, number], 
    type: 'amygdala' as const, 
    label: 'Emotional Regulation Peak' 
  },
  { 
    position: [2.5, 0, -2] as [number, number, number], 
    type: 'cerebellum' as const, 
    label: 'Skill Building Pathway' 
  },
  { 
    position: [-3, 1, -1.5] as [number, number, number], 
    type: 'parietal' as const, 
    label: 'Problem Solving Ridge' 
  }
];

const TerrainMapping = () => {
  const isMobile = useIsMobile();
  const [showPathwaySystem, setShowPathwaySystem] = useState(false);
  const modelViewerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // This effect handles dynamically inserting the model-viewer script
    if (!showPathwaySystem && modelViewerRef.current) {
      const scriptModule = document.createElement('script');
      scriptModule.type = 'module';
      scriptModule.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.js';
      
      const scriptNoModule = document.createElement('script');
      scriptNoModule.noModule = true;
      scriptNoModule.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer-legacy.js';
      
      document.head.appendChild(scriptModule);
      document.head.appendChild(scriptNoModule);
      
      return () => {
        document.head.removeChild(scriptModule);
        document.head.removeChild(scriptNoModule);
      };
    }
  }, [showPathwaySystem]);
  
  // Handler for when a path point is clicked
  const handlePathClick = (point: any) => {
    console.log('Path clicked:', point.label);
    // You can add more functionality here like showing details about the path
  };
  
  return (
    <div className={`h-full ${isMobile ? 'px-1' : 'px-4'}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <Mountain className="mr-2 h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Learning Terrain</h3>
        </div>
        
        {!isMobile && (
          <div className="text-sm text-muted-foreground">
            Visualize your learning path through cognitive terrain
          </div>
        )}
        
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          onClick={() => setShowPathwaySystem(!showPathwaySystem)}
          className={isMobile ? 'px-2 py-1 text-xs' : ''}
        >
          <Map className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
          {isMobile ? '' : (showPathwaySystem ? 'Hide Pathways' : 'Show Pathways')}
        </Button>
      </div>
      
      {showPathwaySystem ? (
        <PathwaySystem 
          paths={pathPoints} 
          onPathClick={handlePathClick}
        />
      ) : (
        <div ref={modelViewerRef} className="relative w-full h-full min-h-[400px] border rounded-md p-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-background/80 backdrop-blur-sm">
            <h4 className="text-base font-medium">3D Learning Terrain</h4>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              <span>Full Screen</span>
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </div>
          
          <div 
            className="w-full h-full" 
            dangerouslySetInnerHTML={{ 
              __html: `
                <style>
                  model-viewer {
                    width: 100%;
                    height: 100%;
                    background-color: #455A64;
                  }
                </style>
                <model-viewer 
                  src="maps3d-2025-03-16_16-43-43.glb" 
                  alt="3D Learning Terrain Model" 
                  auto-rotate 
                  camera-controls 
                  background-color="#455A64"
                >
                </model-viewer>
              `
            }}
          />
          
          <div className="absolute bottom-0 left-0 right-0 p-2 text-xs text-center text-muted-foreground bg-background/80 backdrop-blur-sm">
            Interactive 3D Learning Terrain Map
          </div>
        </div>
      )}
    </div>
  );
};

export default TerrainMapping;
