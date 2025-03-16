
import React, { useState } from 'react';
import TerrainVisualization from './TerrainVisualization';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { PathwaySystem } from './PathwaySystem';
import { Map, Mountain } from 'lucide-react';

const TerrainMapping = () => {
  const isMobile = useIsMobile();
  const [showPathwaySystem, setShowPathwaySystem] = useState(false);
  
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
        <PathwaySystem />
      ) : (
        <TerrainVisualization />
      )}
    </div>
  );
};

export default TerrainMapping;
