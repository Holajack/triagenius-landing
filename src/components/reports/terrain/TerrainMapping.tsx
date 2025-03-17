
import React, { useState, useEffect } from 'react';
import TerrainVisualization from './TerrainVisualization';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { PathwaySystem } from './PathwaySystem';
import { Map, Mountain, Award, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from "sonner";

const learningPaths = [
  {
    position: [0, 0, 0] as [number, number, number],
    type: 'basecamp' as const,
    label: 'Start of Learning Journey'
  },
  {
    position: [5, 2, 3] as [number, number, number],
    type: 'prefrontal' as const,
    label: 'Critical Thinking'
  },
  {
    position: [-4, 1, 4] as [number, number, number],
    type: 'hippocampus' as const,
    label: 'Memory Formation'
  },
  {
    position: [3, 1, -5] as [number, number, number],
    type: 'amygdala' as const,
    label: 'Emotional Learning'
  },
  {
    position: [-5, 1, -3] as [number, number, number],
    type: 'cerebellum' as const,
    label: 'Skill Automation'
  },
  {
    position: [6, 2, 0] as [number, number, number],
    type: 'parietal' as const,
    label: 'Knowledge Integration'
  }
];

const TerrainMapping = () => {
  const isMobile = useIsMobile();
  const [showPathwaySystem, setShowPathwaySystem] = useState(false);
  const [showAchievement, setShowAchievement] = useState(true);
  
  useEffect(() => {
    if (showAchievement) {
      const timer = setTimeout(() => {
        setShowAchievement(false);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [showAchievement]);
  
  const handlePathClick = (point: { label: string; type: string }) => {
    toast(`Achievement Unlocked: ${point.type}`, {
      description: `You've discovered: ${point.label}`,
      duration: 5000,
    });
    console.log(`Clicked on: ${point.label}`);
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
      
      {showAchievement && (
        <Alert className="mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-triage-purple/20 animate-fade-in">
          <Award className="h-4 w-4 text-primary" />
          <AlertTitle className="flex items-center justify-between">
            <span>Cognitive Milestone Reached</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0" 
              onClick={() => setShowAchievement(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertTitle>
          <AlertDescription>
            You've unlocked new neural pathways. Explore the terrain to discover your learning pattern.
          </AlertDescription>
        </Alert>
      )}
      
      {showPathwaySystem ? (
        <PathwaySystem 
          paths={learningPaths}
          onPathClick={handlePathClick}
        />
      ) : (
        <TerrainVisualization />
      )}
    </div>
  );
};

export default TerrainMapping;
