
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  PerspectiveCamera, 
  ContactShadows, 
  BakeShadows,
  useHelper
} from '@react-three/drei';
import { BrainRegion } from './BrainRegion';
import { useRef } from 'react';
import * as THREE from 'three';

interface BrainSceneProps {
  activeRegion: string | null;
  setActiveRegion: (region: string | null) => void;
  zoomLevel: number;
  rotation: number;
}

export const BrainScene = ({ activeRegion, setActiveRegion, zoomLevel, rotation }: BrainSceneProps) => {
  // Define brain regions with anatomically-inspired positions and shapes
  const brainRegions = [
    {
      id: "frontal",
      name: "Frontal Lobe",
      position: [0, 0.7, 0.8] as [number, number, number],
      scale: [1.2, 1.1, 1.1] as [number, number, number],
      rotation: [0.2, 0, 0] as [number, number, number],
      color: "#D946EF",
      activity: 0.85,
      geometry: "frontal"
    },
    {
      id: "temporal",
      name: "Temporal Lobe",
      position: [-1.0, -0.1, 0.3] as [number, number, number],
      scale: [1.0, 0.8, 0.9] as [number, number, number],
      rotation: [0, 0.2, 0] as [number, number, number],
      color: "#FEF7CD",
      activity: 0.6,
      geometry: "temporal"
    },
    {
      id: "parietal",
      name: "Parietal Lobe",
      position: [0, 0.5, -0.7] as [number, number, number],
      scale: [1.0, 0.9, 1.0] as [number, number, number],
      rotation: [-0.3, 0, 0] as [number, number, number],
      color: "#F2FCE2",
      activity: 0.75,
      geometry: "parietal"
    },
    {
      id: "occipital",
      name: "Occipital Lobe",
      position: [0, -0.2, -1.1] as [number, number, number],
      scale: [0.9, 0.8, 0.9] as [number, number, number],
      rotation: [-0.4, 0, 0] as [number, number, number],
      color: "#D6BCFA", 
      activity: 0.4,
      geometry: "occipital"
    },
    {
      id: "cerebellum",
      name: "Cerebellum",
      position: [0, -0.8, -0.5] as [number, number, number],
      scale: [1.2, 0.7, 1.0] as [number, number, number],
      rotation: [0.3, 0, 0] as [number, number, number],
      color: "#8B5CF6",
      activity: 0.5,
      geometry: "cerebellum"
    },
    {
      id: "brainstem",
      name: "Brain Stem",
      position: [0, -1.5, 0] as [number, number, number],
      scale: [0.7, 0.7, 0.7] as [number, number, number],
      rotation: [0.1, 0, 0] as [number, number, number],
      color: "#0EA5E9",
      activity: 0.55,
      geometry: "brainstem"
    }
  ];

  // Setup lighting
  const spotLightRef = useRef<THREE.SpotLight>(null);

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      style={{ background: 'transparent' }}
      shadows
    >
      {/* Enhanced environment and lighting for PBR materials */}
      <Environment preset="studio" background={false} />
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <spotLight
        ref={spotLightRef}
        position={[-5, 5, 5]}
        angle={0.3}
        penumbra={0.8}
        intensity={1.5}
        castShadow
      />
      <hemisphereLight intensity={0.3} groundColor="#ff0000" />

      {/* Main brain group with rotation and zoom */}
      <group 
        rotation-y={rotation * (Math.PI / 180)}
        scale={[zoomLevel, zoomLevel, zoomLevel]}
      >
        {/* Transparent outer brain shell to give sense of unity */}
        <mesh position={[0, 0, 0]} scale={[1.5, 1.3, 1.4]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transparent={true}
            opacity={0.05}
            roughness={0.3}
            transmission={0.9}
            thickness={0.5}
            envMapIntensity={0.2}
          />
        </mesh>

        {/* Brain regions */}
        {brainRegions.map((region) => (
          <BrainRegion
            key={region.id}
            position={region.position}
            rotation={region.rotation}
            scale={region.scale}
            color={region.color}
            name={region.name}
            activity={region.activity}
            isActive={activeRegion === region.name}
            geometry={region.id as string}
            onClick={() => setActiveRegion(region.name === activeRegion ? null : region.name)}
          />
        ))}
      </group>

      {/* Ground shadow for depth perception */}
      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.4}
        scale={10}
        blur={1.5}
        far={4}
      />

      {/* Controls for interactive rotation/zoom */}
      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={10}
        autoRotate={!activeRegion}
        autoRotateSpeed={0.5}
        enableDamping={true}
        dampingFactor={0.05}
      />
      
      {/* Optimize shadows */}
      <BakeShadows />
    </Canvas>
  );
};
