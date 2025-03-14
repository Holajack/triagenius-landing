
import React from 'react';
import TerrainVisualization from './TerrainVisualization';
import TerrainControls from './TerrainControls';

const TerrainMapping = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <div className="bg-card border rounded-lg shadow-sm h-[600px] overflow-hidden">
          <TerrainVisualization />
        </div>
      </div>
      <div className="md:col-span-1">
        <TerrainControls />
      </div>
    </div>
  );
};

export default TerrainMapping;
