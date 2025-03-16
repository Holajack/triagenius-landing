
import React, { useState, useMemo } from 'react';
import TerrainVisualization from './TerrainVisualization';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { PathwaySystem } from './PathwaySystem';
import { Map, Mountain } from 'lucide-react';

// Define the path points for the brain regions
const pathPoints = [
  { 
    position: [0, 0, 0], 
    type: 'basecamp', 
    label: 'Learning Basecamp' 
  },
  { 
    position: [3, 1, 2], 
    type: 'prefrontal', 
    label: 'Critical Thinking Zone' 
  },
  { 
    position: [-2, 0.5, 3], 
    type: 'hippocampus', 
    label: 'Memory Formation Trail' 
  },
  { 
    position: [0, 2, -3], 
    type: 'amygdala', 
    label: 'Emotional Regulation Peak' 
  },
  { 
    position: [2.5, 0, -2], 
    type: 'cerebellum', 
    label: 'Skill Building Pathway' 
  },
  { 
    position: [-3, 1, -1.5], 
    type: 'parietal', 
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
        <TerrainVisualization />
      )}
    </div>
  );
};

export default TerrainMapping;
