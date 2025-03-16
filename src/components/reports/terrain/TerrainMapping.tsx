
import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { PathwaySystem } from './PathwaySystem';
import { Map, Mountain, ExternalLink, Globe } from 'lucide-react';
import Terrain3D from './Terrain3D';

// Define the path points for the brain regions
export const pathPoints = [
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

// Terrain data for Colorado Rocky Mountains
const terrainData = {
  "bounds": {
    "ne": [
      -105.11492,
      40.54043
    ],
    "sw": [
      -106.21862,
      39.56597
    ]
  },
  "resolution": {
    "elevation": {
      "tileSize": 256,
      "zoom": 9
    },
    "texture": {
      "tileSize": 512,
      "zoom": 12
    }
  },
  "altitudeBoundsinMeters": {
    "max": 4309,
    "min": 544,
    "base": -1713
  },
  "modelCoordinatesAltitudeBounds": {
    "max": 8.339242935180664,
    "min": 0,
    "base": -5
  },
  "elevationCanvas": {
    "width": 402,
    "height": 464
  },
  "groundParams": {
    "width": 69.46004319654428,
    "height": 80.17278617710582,
    "subdivisionsX": 401,
    "subdivisionsY": 463
  }
};

const TerrainMapping = () => {
  const isMobile = useIsMobile();
  const [showPathwaySystem, setShowPathwaySystem] = useState(false);
  const [showTerrainView, setShowTerrainView] = useState(false);
  
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
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={() => {
              setShowPathwaySystem(!showPathwaySystem);
              setShowTerrainView(false);
            }}
            className={isMobile ? 'px-2 py-1 text-xs' : ''}
          >
            <Map className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
            {isMobile ? '' : (showPathwaySystem ? 'Hide Pathways' : 'Show Pathways')}
          </Button>
          
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={() => {
              setShowTerrainView(!showTerrainView);
              setShowPathwaySystem(false);
            }}
            className={isMobile ? 'px-2 py-1 text-xs' : ''}
          >
            <Globe className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
            {isMobile ? '' : (showTerrainView ? 'Hide 3D Terrain' : 'Show 3D Terrain')}
          </Button>
        </div>
      </div>
      
      {showPathwaySystem ? (
        <PathwaySystem 
          paths={pathPoints} 
          onPathClick={handlePathClick}
        />
      ) : showTerrainView ? (
        <div className="relative w-full h-full min-h-[400px] border rounded-md p-4 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-background/80 backdrop-blur-sm">
            <h4 className="text-base font-medium">3D Terrain Map - Colorado Rockies</h4>
            <div className="text-primary text-sm">
              <span>Interactive 3D View</span>
            </div>
          </div>
          
          <div className="w-full h-full pt-12 pb-8">
            <Terrain3D 
              textureUrl="/lovable-uploads/7d1d245b-23a7-4cff-9ad4-c2ea099f286a.png" 
              terrainData={terrainData} 
            />
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-2 text-xs text-center text-muted-foreground bg-background/80 backdrop-blur-sm">
            Colorado Rocky Mountains terrain - drag to rotate, scroll to zoom
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full min-h-[400px] border rounded-md p-4 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-background/80 backdrop-blur-sm">
            <h4 className="text-base font-medium">Sentinel-2 Terrain Map</h4>
            <a 
              href="https://s2maps.eu" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 text-sm flex items-center"
            >
              <span>View Full Map</span>
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
          
          <div className="w-full h-full pt-12">
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="mb-4 p-4 bg-background/90 rounded-md border">
                <a 
                  href="https://s2maps.eu" 
                  className="text-primary hover:underline"
                >
                  Sentinel-2 cloudless (2016)
                </a> by <a 
                  href="https://eox.at" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  EOX IT
                </a>
                <div className="text-xs text-muted-foreground mt-1">
                  DCT terms: https://purl.org/dc/terms/ | CC: http://creativecommons.org/ns#
                </div>
              </div>
              
              <iframe 
                src="https://s2maps.eu" 
                title="Sentinel-2 cloudless (2016) by EOX IT" 
                className="w-full h-full border-0"
                style={{ minHeight: '300px' }}
              ></iframe>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-2 text-xs text-center text-muted-foreground bg-background/80 backdrop-blur-sm">
            Satellite imagery of Earth's terrain - Sentinel-2 cloudless (2016)
          </div>
        </div>
      )}
    </div>
  );
};

export default TerrainMapping;
