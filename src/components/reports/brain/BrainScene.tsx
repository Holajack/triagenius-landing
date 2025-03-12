
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { BrainRegion } from './BrainRegion';

interface BrainSceneProps {
  activeRegion: string | null;
  setActiveRegion: (region: string | null) => void;
  zoomLevel: number;
  rotation: number;
}

export const BrainScene = ({ activeRegion, setActiveRegion, zoomLevel, rotation }: BrainSceneProps) => {
  const brainRegions = [
    {
      id: "frontal",
      name: "Frontal Lobe",
      position: [0, 1, 0],
      color: "#D946EF",
      activity: 0.85
    },
    {
      id: "temporal",
      name: "Temporal Lobe",
      position: [-1.2, 0, 0],
      color: "#FEF7CD",
      activity: 0.6
    },
    {
      id: "parietal",
      name: "Parietal Lobe",
      position: [0, 0.5, -1],
      color: "#F2FCE2",
      activity: 0.75
    },
    {
      id: "occipital",
      name: "Occipital Lobe",
      position: [0, -0.5, -1],
      color: "#D6BCFA",
      activity: 0.4
    },
    {
      id: "cerebellum",
      name: "Cerebellum",
      position: [0, -1.2, 0],
      color: "#8B5CF6",
      activity: 0.5
    },
    {
      id: "brainstem",
      name: "Brain Stem",
      position: [0, -1.8, 0],
      color: "#0EA5E9",
      activity: 0.55
    }
  ];

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}
      style={{ background: 'transparent' }}
    >
      <Environment preset="studio" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} />

      <group 
        rotation-y={rotation * (Math.PI / 180)}
        scale={[zoomLevel, zoomLevel, zoomLevel]}
      >
        {brainRegions.map((region) => (
          <BrainRegion
            key={region.id}
            position={region.position}
            color={region.color}
            name={region.name}
            activity={region.activity}
            isActive={activeRegion === region.name}
            onClick={() => setActiveRegion(region.name === activeRegion ? null : region.name)}
          />
        ))}
      </group>

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={10}
      />
    </Canvas>
  );
};
