
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  PerspectiveCamera, 
  ContactShadows, 
  BakeShadows,
  useHelper,
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
  const brainRegions = [
    {
      id: "frontal_left",
      name: "Frontal Lobe",
      position: [-0.5, 0.7, 0.8] as [number, number, number],
      scale: [1.2, 1.1, 1.1] as [number, number, number],
      rotation: [0.2, 0, -0.1] as [number, number, number],
      color: "#D946EF",
      activity: 0.85,
      geometry: "frontal"
    },
    {
      id: "temporal_left",
      name: "Temporal Lobe",
      position: [-1.2, -0.1, 0.3] as [number, number, number],
      scale: [1.0, 0.8, 0.9] as [number, number, number],
      rotation: [0, 0.2, 0] as [number, number, number],
      color: "#FEF7CD",
      activity: 0.6,
      geometry: "temporal"
    },
    {
      id: "parietal_left",
      name: "Parietal Lobe",
      position: [-0.5, 0.5, -0.7] as [number, number, number],
      scale: [1.0, 0.9, 1.0] as [number, number, number],
      rotation: [-0.3, 0, -0.1] as [number, number, number],
      color: "#F2FCE2",
      activity: 0.75,
      geometry: "parietal"
    },
    {
      id: "occipital_left",
      name: "Occipital Lobe",
      position: [-0.3, -0.2, -1.1] as [number, number, number],
      scale: [0.9, 0.8, 0.9] as [number, number, number],
      rotation: [-0.4, 0, -0.1] as [number, number, number],
      color: "#D6BCFA",
      activity: 0.4,
      geometry: "occipital"
    },
    {
      id: "frontal_right",
      name: "Frontal Lobe",
      position: [0.5, 0.7, 0.8] as [number, number, number],
      scale: [1.2, 1.1, 1.1] as [number, number, number],
      rotation: [0.2, 0, 0.1] as [number, number, number],
      color: "#D946EF",
      activity: 0.85,
      geometry: "frontal"
    },
    {
      id: "temporal_right",
      name: "Temporal Lobe",
      position: [1.2, -0.1, 0.3] as [number, number, number],
      scale: [1.0, 0.8, 0.9] as [number, number, number],
      rotation: [0, -0.2, 0] as [number, number, number],
      color: "#FEF7CD",
      activity: 0.6,
      geometry: "temporal"
    },
    {
      id: "parietal_right",
      name: "Parietal Lobe",
      position: [0.5, 0.5, -0.7] as [number, number, number],
      scale: [1.0, 0.9, 1.0] as [number, number, number],
      rotation: [-0.3, 0, 0.1] as [number, number, number],
      color: "#F2FCE2",
      activity: 0.75,
      geometry: "parietal"
    },
    {
      id: "occipital_right",
      name: "Occipital Lobe",
      position: [0.3, -0.2, -1.1] as [number, number, number],
      scale: [0.9, 0.8, 0.9] as [number, number, number],
      rotation: [-0.4, 0, 0.1] as [number, number, number],
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
    },
    {
      id: "hippocampus_left",
      name: "Hippocampus",
      position: [-0.5, -0.3, 0] as [number, number, number],
      scale: [0.4, 0.3, 0.7] as [number, number, number],
      rotation: [0, 0.5, 0] as [number, number, number],
      color: "#E5DEFF",
      activity: 0.75,
      geometry: "hippocampus"
    },
    {
      id: "hippocampus_right",
      name: "Hippocampus",
      position: [0.5, -0.3, 0] as [number, number, number],
      scale: [0.4, 0.3, 0.7] as [number, number, number],
      rotation: [0, -0.5, 0] as [number, number, number],
      color: "#E5DEFF",
      activity: 0.75,
      geometry: "hippocampus"
    }
  ];

  const spotLightRef = useRef<THREE.SpotLight>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);

  // Create connecting tissue geometry
  const createConnectingTissue = () => {
    return (
      <>
        {/* Cerebral cortex outer layer - more detailed with subtle variations */}
        <mesh position={[0, 0, 0]} scale={[1.7, 1.5, 1.6]}>
          <sphereGeometry args={[1, 80, 80]} />
          <meshPhysicalMaterial
            color="#FCE7DF"
            transparent={true}
            opacity={0.08}
            roughness={0.4}
            transmission={0.95}
            thickness={0.3}
            envMapIntensity={0.3}
          />
        </mesh>

        {/* Corpus callosum connecting the hemispheres - thicker and more defined */}
        <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1.1, 1.1, 1.1]}>
          <cylinderGeometry args={[0.2, 0.2, 1.6, 36]} />
          <meshPhysicalMaterial
            color="#FDE1D3"
            roughness={0.7}
            metalness={0.1}
            transmission={0.1}
            thickness={1.0}
            clearcoat={0.3}
            clearcoatRoughness={0.25}
          />
        </mesh>

        {/* Enhanced inter-hemispheric connections */}
        <mesh position={[0, 0.3, 0]} rotation={[0.2, 0, Math.PI / 2]} scale={[0.9, 0.9, 0.9]}>
          <cylinderGeometry args={[0.15, 0.15, 1.8, 32]} />
          <meshPhysicalMaterial
            color="#F7D5CA"
            roughness={0.7}
            metalness={0.1}
            transmission={0.1}
            thickness={1.0}
            clearcoat={0.3}
          />
        </mesh>

        {/* Additional bridge between hemispheres - lower */}
        <mesh position={[0, -0.2, 0]} rotation={[-0.1, 0, Math.PI / 2]} scale={[0.8, 0.8, 0.8]}>
          <cylinderGeometry args={[0.18, 0.18, 1.7, 32]} />
          <meshPhysicalMaterial
            color="#F9DCD2"
            roughness={0.7}
            metalness={0.1}
            transmission={0.1}
            thickness={1.0}
            clearcoat={0.3}
          />
        </mesh>

        {/* Connecting tissue between frontal lobes - larger */}
        <mesh position={[0, 0.7, 0.8]} scale={[0.7, 0.5, 0.6]}>
          <sphereGeometry args={[1, 36, 36]} />
          <meshPhysicalMaterial
            color="#E5D7F0"
            roughness={0.7}
            metalness={0.1}
            transmission={0.1}
            thickness={1.0}
            clearcoat={0.3}
          />
        </mesh>

        {/* Connecting tissue between parietal lobes - larger */}
        <mesh position={[0, 0.5, -0.7]} scale={[0.7, 0.5, 0.6]}>
          <sphereGeometry args={[1, 36, 36]} />
          <meshPhysicalMaterial
            color="#F2FCE2"
            roughness={0.7}
            metalness={0.1}
            transmission={0.1}
            thickness={1.0}
            clearcoat={0.3}
          />
        </mesh>

        {/* Connecting tissue between temporal lobes - larger */}
        <mesh position={[0, -0.1, 0.3]} scale={[0.7, 0.5, 0.6]}>
          <sphereGeometry args={[1, 36, 36]} />
          <meshPhysicalMaterial
            color="#FEEED0"
            roughness={0.7}
            metalness={0.1}
            transmission={0.1}
            thickness={1.0}
            clearcoat={0.3}
          />
        </mesh>

        {/* Connecting tissue between occipital lobes - larger */}
        <mesh position={[0, -0.2, -1.1]} scale={[0.7, 0.5, 0.6]}>
          <sphereGeometry args={[1, 36, 36]} />
          <meshPhysicalMaterial
            color="#DECFF9"
            roughness={0.7}
            metalness={0.1}
            transmission={0.1}
            thickness={1.0}
            clearcoat={0.3}
          />
        </mesh>

        {/* Central white matter - more visible */}
        <mesh position={[0, 0, 0]} scale={[1.1, 1.0, 1.2]}>
          <sphereGeometry args={[1, 56, 56]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transparent={true}
            opacity={0.15}
            roughness={0.4}
            transmission={0.9}
            thickness={0.3}
            envMapIntensity={0.3}
          />
        </mesh>

        {/* Thalamus - more detailed */}
        <mesh position={[0, 0, 0]} scale={[0.8, 0.7, 0.8]}>
          <sphereGeometry args={[0.7, 36, 36]} />
          <meshPhysicalMaterial
            color="#FDE1D3"
            roughness={0.6}
            metalness={0.1}
            transmission={0.2}
            thickness={0.8}
            clearcoat={0.3}
            transparent={true}
            opacity={0.6}
          />
        </mesh>

        {/* Additional connecting tissues for a more complete look */}
        {/* Frontal to temporal connection - left */}
        <mesh position={[-0.85, 0.3, 0.55]} rotation={[0, 0.3, 0.6]} scale={[0.6, 0.3, 0.5]}>
          <sphereGeometry args={[0.5, 24, 24]} />
          <meshPhysicalMaterial
            color="#F5DCF3"
            roughness={0.6}
            metalness={0.1}
            transmission={0.15}
            thickness={0.8}
            clearcoat={0.2}
          />
        </mesh>

        {/* Frontal to temporal connection - right */}
        <mesh position={[0.85, 0.3, 0.55]} rotation={[0, -0.3, -0.6]} scale={[0.6, 0.3, 0.5]}>
          <sphereGeometry args={[0.5, 24, 24]} />
          <meshPhysicalMaterial
            color="#F5DCF3"
            roughness={0.6}
            metalness={0.1}
            transmission={0.15}
            thickness={0.8}
            clearcoat={0.2}
          />
        </mesh>

        {/* Parietal to occipital connection - left */}
        <mesh position={[-0.4, 0.15, -0.9]} rotation={[-0.3, 0, -0.1]} scale={[0.5, 0.4, 0.5]}>
          <sphereGeometry args={[0.5, 24, 24]} />
          <meshPhysicalMaterial
            color="#E1DEF9"
            roughness={0.6}
            metalness={0.1}
            transmission={0.15}
            thickness={0.8}
            clearcoat={0.2}
          />
        </mesh>

        {/* Parietal to occipital connection - right */}
        <mesh position={[0.4, 0.15, -0.9]} rotation={[-0.3, 0, 0.1]} scale={[0.5, 0.4, 0.5]}>
          <sphereGeometry args={[0.5, 24, 24]} />
          <meshPhysicalMaterial
            color="#E1DEF9"
            roughness={0.6}
            metalness={0.1}
            transmission={0.15}
            thickness={0.8}
            clearcoat={0.2}
          />
        </mesh>

        {/* Cerebellum to brain stem connection */}
        <mesh position={[0, -1.15, -0.25]} rotation={[0.3, 0, 0]} scale={[0.6, 0.4, 0.4]}>
          <sphereGeometry args={[0.6, 24, 24]} />
          <meshPhysicalMaterial
            color="#A794F7"
            roughness={0.6}
            metalness={0.1}
            transmission={0.15}
            thickness={0.8}
            clearcoat={0.2}
          />
        </mesh>

        {/* Temporal to hippocampus - left */}
        <mesh position={[-0.85, -0.2, 0.15]} rotation={[0, 0.2, 0]} scale={[0.4, 0.3, 0.4]}>
          <sphereGeometry args={[0.5, 20, 20]} />
          <meshPhysicalMaterial
            color="#FEF0E4"
            roughness={0.6}
            metalness={0.1}
            transmission={0.15}
            thickness={0.8}
            clearcoat={0.2}
          />
        </mesh>

        {/* Temporal to hippocampus - right */}
        <mesh position={[0.85, -0.2, 0.15]} rotation={[0, -0.2, 0]} scale={[0.4, 0.3, 0.4]}>
          <sphereGeometry args={[0.5, 20, 20]} />
          <meshPhysicalMaterial
            color="#FEF0E4"
            roughness={0.6}
            metalness={0.1}
            transmission={0.15}
            thickness={0.8}
            clearcoat={0.2}
          />
        </mesh>
      </>
    );
  };

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      style={{ background: 'transparent' }}
      shadows
    >
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

      <group 
        rotation-y={rotation * (Math.PI / 180)}
        scale={[zoomLevel, zoomLevel, zoomLevel]}
      >
        {/* Base brain structure - render first for proper layering */}
        {createConnectingTissue()}

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
            geometry={region.geometry}
            onClick={() => setActiveRegion(region.name === activeRegion ? null : region.name)}
          />
        ))}
      </group>

      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.4}
        scale={10}
        blur={1.5}
        far={4}
      />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={10}
        autoRotate={!activeRegion}
        autoRotateSpeed={0.5}
        enableDamping={true}
        dampingFactor={0.05}
      />
      
      <BakeShadows />
    </Canvas>
  );
};
