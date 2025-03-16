
import React from 'react';
import TerrainVisualization from './TerrainVisualization';
import TerrainControls from './TerrainControls';
import { useIsMobile } from '@/hooks/use-mobile';

const TerrainMapping = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`h-full ${isMobile ? 'px-1' : 'px-4'}`}>
      <TerrainVisualization />
    </div>
  );
};

export default TerrainMapping;
