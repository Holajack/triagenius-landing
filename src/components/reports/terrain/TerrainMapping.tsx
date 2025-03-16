
import React, { useState, useMemo } from 'react';
import TerrainVisualization from './TerrainVisualization';
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
        <div className="relative w-full h-full min-h-[400px] border rounded-md p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-base font-medium">Satlas Learning Visualization</h4>
            <a 
              href="https://satlas.allen.ai/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-primary hover:underline text-sm"
            >
              <span>Open in Satlas</span>
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <iframe
              src="https://satlas.allen.ai/"
              title="Satlas Allen Institute for AI"
              className="w-full h-full border-0 rounded"
              allowFullScreen
            ></iframe>
          </div>
          
          <div className="mt-2 text-xs text-muted-foreground">
            Powered by Satlas Allen Institute for AI
          </div>
        </div>
      )}
    </div>
  );
};

export default TerrainMapping;
