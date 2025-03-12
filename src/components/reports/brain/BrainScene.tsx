
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  PerspectiveCamera, 
  ContactShadows, 
  BakeShadows,
  useHelper,
  useGLTF
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
  // Define anatomically positioned brain regions
  const brainRegions = [
    {
      id: "frontal",
      name: "Frontal Lobe",
      position: [0, 0.7, 0.8] as [number, number, number],
      scale: [1.2, 1.1, 1.1] as [number, number, number],
      rotation: [0.2, 0, 0] as [number, number, number],
      color: "#D946EF", // Pinkish-red color
      activity: 0.85,
      geometry: "frontal"
    },
    {
      id: "temporal",
      name: "Temporal Lobe",
      position: [-1.0, -0.1, 0.3] as [number, number, number],
      scale: [1.0, 0.8, 0.9] as [number, number, number],
      rotation: [0, 0.2, 0] as [number, number, number],
      color: "#FEF7CD", // Yellow-green color
      activity: 0.6,
      geometry: "temporal"
    },
    {
      id: "parietal",
      name: "Parietal Lobe",
      position: [0, 0.5, -0.7] as [number, number, number],
      scale: [1.0, 0.9, 1.0] as [number, number, number],
      rotation: [-0.3, 0, 0] as [number, number, number],
      color: "#F2FCE2", // Green color
      activity: 0.75,
      geometry: "parietal"
    },
    {
      id: "occipital",
      name: "Occipital Lobe",
      position: [0, -0.2, -1.1] as [number, number, number],
      scale: [0.9, 0.8, 0.9] as [number, number, number],
      rotation: [-0.4, 0, 0] as [number, number, number],
      color: "#D6BCFA", // Light purple color
      activity: 0.4,
      geometry: "occipital"
    },
    {
      id: "cerebellum",
      name: "Cerebellum",
      position: [0, -0.8, -0.5] as [number, number, number],
      scale: [1.2, 0.7, 1.0] as [number, number, number],
      rotation: [0.3, 0, 0] as [number, number, number],
      color: "#8B5CF6", // Deep purple color
      activity: 0.5,
      geometry: "cerebellum"
    },
    {
      id: "brainstem",
      name: "Brain Stem",
      position: [0, -1.5, 0] as [number, number, number],
      scale: [0.7, 0.7, 0.7] as [number, number, number],
      rotation: [0.1, 0, 0] as [number, number, number],
      color: "#0EA5E9", // Blue color
      activity: 0.55,
      geometry: "brainstem"
    }
  ];

  // Add additional anatomically accurate regions for a more complete brain model
  const additionalRegions = [
    {
      id: "temporal_right",
      name: "Temporal Lobe",
      position: [1.0, -0.1, 0.3] as [number, number, number],
      scale: [1.0, 0.8, 0.9] as [number, number, number],
      rotation: [0, -0.2, 0] as [number, number, number],
      color: "#FEF7CD", // Same as left temporal
      activity: 0.6,
      geometry: "temporal"
    },
    {
      id: "frontal_right",
      name: "Frontal Lobe",
      position: [0.7, 0.7, 0.6] as [number, number, number],
      scale: [0.9, 1.0, 0.9] as [number, number, number],
      rotation: [0.2, 0, 0] as [number, number, number],
      color: "#D946EF", // Same as left frontal
      activity: 0.8,
      geometry: "frontal"
    },
    {
      id: "parietal_right",
      name: "Parietal Lobe",
      position: [0.7, 0.5, -0.7] as [number, number, number],
      scale: [0.9, 0.9, 0.9] as [number, number, number],
      rotation: [-0.3, 0, 0] as [number, number, number],
      color: "#F2FCE2", // Same as left parietal
      activity: 0.7,
      geometry: "parietal"
    },
    {
      id: "thalamus",
      name: "Thalamus",
      position: [0, 0, 0] as [number, number, number],
      scale: [0.5, 0.5, 0.5] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      color: "#FDE1D3", // Soft peach
      activity: 0.9,
      geometry: "sphere"
    },
    {
      id: "hippocampus_left",
      name: "Hippocampus",
      position: [-0.5, -0.3, 0] as [number, number, number],
      scale: [0.4, 0.3, 0.7] as [number, number, number],
      rotation: [0, 0.5, 0] as [number, number, number],
      color: "#E5DEFF", // Soft purple
      activity: 0.75,
      geometry: "sphere"
    },
    {
      id: "hippocampus_right",
      name: "Hippocampus",
      position: [0.5, -0.3, 0] as [number, number, number],
      scale: [0.4, 0.3, 0.7] as [number, number, number],
      rotation: [0, -0.5, 0] as [number, number, number],
      color: "#E5DEFF", // Soft purple
      activity: 0.75,
      geometry: "sphere"
    }
  ];

  // Combine all regions
  const allBrainRegions = [...brainRegions, ...additionalRegions];

  // Setup enhanced lighting system
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);

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
        ref={directionalLightRef}
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
          <sphereGeometry args={[1, 32, 32]} />
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

        {/* Corpus callosum - connection between hemispheres */}
        <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 1.6, 16]} />
          <meshPhysicalMaterial
            color="#FDE1D3"
            roughness={0.7}
            clearcoat={0.2}
            clearcoatRoughness={0.2}
          />
        </mesh>

        {/* Brain regions */}
        {allBrainRegions.map((region) => (
          <BrainRegion
            key={region.id}
            position={region.position}
            rotation={region.rotation}
            scale={region.scale}
            color={region.color}
            name={region.name}
            activity={region.activity}
            isActive={activeRegion === region.name}
            geometry={region.geometry}
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
