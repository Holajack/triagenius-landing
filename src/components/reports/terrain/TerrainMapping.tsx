
import React from 'react';
import TerrainVisualization from './TerrainVisualization';
import TerrainControls from './TerrainControls';

const TerrainMapping = () => {
  // For responsiveness, we'll use a different layout for smaller screens
  return (
    <div className="h-full">
      <TerrainVisualization />
    </div>
  );
};

export default TerrainMapping;
