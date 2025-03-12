
import { Suspense } from 'react';
import { BrainScene } from './brain/BrainScene';
import ErrorBoundary from '../ErrorBoundary';

interface BrainModelProps {
  activeRegion: string | null;
  setActiveRegion: (region: string | null) => void;
  zoomLevel: number;
  rotation: number;
}

const BrainModel = ({ activeRegion, setActiveRegion, zoomLevel, rotation }: BrainModelProps) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ErrorBoundary fallback={<div className="flex items-center justify-center h-full">Error loading 3D visualization</div>}>
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading 3D visualization...</div>}>
          <BrainScene 
            activeRegion={activeRegion}
            setActiveRegion={setActiveRegion}
            zoomLevel={zoomLevel}
            rotation={rotation}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default BrainModel;
