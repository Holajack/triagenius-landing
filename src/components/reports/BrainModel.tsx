
import { Suspense } from 'react';
import { LearningPathScene } from './brain/LearningPathScene';
import ErrorBoundary from '../ErrorBoundary';

interface LearningPathModelProps {
  activeSubject: string | null;
  setActiveSubject: (subject: string | null) => void;
  zoomLevel: number;
  rotation: number;
}

const LearningPathModel = ({ activeSubject, setActiveSubject, zoomLevel, rotation }: LearningPathModelProps) => {
  return (
    <div className="w-full h-full relative">
      <ErrorBoundary fallback={<div className="flex items-center justify-center h-full">Error loading 3D visualization</div>}>
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading 3D visualization...</div>}>
          <LearningPathScene 
            activeSubject={activeSubject}
            setActiveSubject={setActiveSubject}
            zoomLevel={zoomLevel}
            rotation={rotation}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default LearningPathModel;
