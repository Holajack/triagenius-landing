
import { BrainScene } from './brain/BrainScene';

interface BrainModelProps {
  activeRegion: string | null;
  setActiveRegion: (region: string | null) => void;
  zoomLevel: number;
  rotation: number;
}

const BrainModel = ({ activeRegion, setActiveRegion, zoomLevel, rotation }: BrainModelProps) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <BrainScene 
        activeRegion={activeRegion}
        setActiveRegion={setActiveRegion}
        zoomLevel={zoomLevel}
        rotation={rotation}
      />
    </div>
  );
};

export default BrainModel;
