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

  const createConnectingTissue = () => {
    return (
      <>
        {/* Base cerebral cortex outer layer with improved sulci and gyri texture */}
        <mesh position={[0, 0, 0]} scale={[1.7, 1.5, 1.6]}>
          <sphereGeometry args={[1, 128, 128]} />
          <meshPhysicalMaterial
            color="#FCE7DF"
            transparent={true}
            opacity={0.3}
            roughness={0.4}
            transmission={0.85}
            thickness={0.3}
            envMapIntensity={0.3}
          />
        </mesh>

        {/* Dense gyri and sulci pattern over the entire surface for realistic wrinkles */}
        <mesh position={[0, 0, 0]} scale={[1.65, 1.45, 1.55]}>
          <sphereGeometry args={[1, 192, 192]} />
          <meshPhysicalMaterial
            color="#F9D5C8"
            transparent={true}
            opacity={0.3}
            roughness={0.7}
            transmission={0.8}
            thickness={0.3}
            envMapIntensity={0.4}
            wireframe={false}
            flatShading={true}
          />
        </mesh>
        
        {/* Meninges layer - thin protective covering */}
        <mesh position={[0, 0, 0]} scale={[1.72, 1.52, 1.62]}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshPhysicalMaterial
            color="#FCE7DF"
            transparent={true}
            opacity={0.15}
            roughness={0.3}
            transmission={0.95}
            thickness={0.1}
            envMapIntensity={0.2}
          />
        </mesh>

        {/* NEW: Frontal and temporal connecting tissue - fills gap between regions */}
        <mesh position={[-0.5, 0.3, 0.5]} scale={[0.6, 0.6, 0.6]}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshPhysicalMaterial
            color="#F5DDD5"
            roughness={0.6}
            metalness={0.1}
            transmission={0.3}
            thickness={0.8}
            clearcoat={0.2}
            transparent={true}
            opacity={0.85}
          />
        </mesh>

        <mesh position={[0.5, 0.3, 0.5]} scale={[0.6, 0.6, 0.6]}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshPhysicalMaterial
            color="#F5DDD5"
            roughness={0.6}
            metalness={0.1}
            transmission={0.3}
            thickness={0.8}
            clearcoat={0.2}
            transparent={true}
            opacity={0.85}
          />
        </mesh>

        {/* NEW: Parietal and occipital connecting tissue */}
        <mesh position={[-0.4, 0.15, -0.9]} scale={[0.6, 0.6, 0.6]}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshPhysicalMaterial
            color="#F0EAED"
            roughness={0.6}
            metalness={0.1}
            transmission={0.3}
            thickness={0.8}
            clearcoat={0.2}
            transparent={true}
            opacity={0.85}
          />
        </mesh>

        <mesh position={[0.4, 0.15, -0.9]} scale={[0.6, 0.6, 0.6]}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshPhysicalMaterial
            color="#F0EAED"
            roughness={0.6}
            metalness={0.1}
            transmission={0.3}
            thickness={0.8}
            clearcoat={0.2}
            transparent={true}
            opacity={0.85}
          />
        </mesh>

        {/* Corpus callosum - main hemispheric bridge with more visual presence */}
        <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1.3, 0.35, 0.9]}>
          <capsuleGeometry args={[0.25, 1.6, 36, 36]} />
          <meshPhysicalMaterial
            color="#FDE1D3"
            roughness={0.7}
            metalness={0.1}
            transmission={0.2}
            thickness={1.0}
            clearcoat={0.3}
            clearcoatRoughness={0.25}
          />
        </mesh>

        {/* Enhanced anterior commissure - front connection */}
        <mesh position={[0, 0.4, 0.3]} rotation={[0.2, 0, Math.PI / 2]} scale={[0.9, 0.2, 0.7]}>
          <capsuleGeometry args={[0.15, 1.8, 32, 32]} />
          <meshPhysicalMaterial
            color="#F7D5CA"
            roughness={0.7}
            metalness={0.1}
            transmission={0.15}
            thickness={1.0}
            clearcoat={0.3}
          />
        </mesh>

        {/* Enhanced posterior commissure - rear connection */}
        <mesh position={[0, 0.1, -0.3]} rotation={[-0.1, 0, Math.PI / 2]} scale={[0.8, 0.2, 0.7]}>
          <capsuleGeometry args={[0.15, 1.7, 32, 32]} />
          <meshPhysicalMaterial
            color="#F9DCD2"
            roughness={0.7}
            metalness={0.1}
            transmission={0.15}
            thickness={1.0}
            clearcoat={0.3}
          />
        </mesh>

        {/* Longitudinal fissure - central division between hemispheres */}
        <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.05, 1.5, 1.4]}>
          <planeGeometry args={[1, 1, 1, 1]} />
          <meshPhysicalMaterial
            color="#FCE7DF"
            roughness={0.7}
            metalness={0.1}
            transmission={0.2}
            thickness={0.5}
            clearcoat={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* NEW: Frontal-temporal connecting tissue (left & right) */}
        <mesh position={[-0.85, 0.3, 0.55]} scale={[0.7, 0.7, 0.7]}>
          <sphereGeometry args={[0.7, 48, 48]} />
          <meshPhysicalMaterial
            color="#EFDCE5"
            roughness={0.7}
            metalness={0.1}
            transmission={0.2}
            thickness={0.9}
            clearcoat={0.3}
            transparent={true}
            opacity={0.9}
          />
        </mesh>

        <mesh position={[0.85, 0.3, 0.55]} scale={[0.7, 0.7, 0.7]}>
          <sphereGeometry args={[0.7, 48, 48]} />
          <meshPhysicalMaterial
            color="#EFDCE5"
            roughness={0.7}
            metalness={0.1}
            transmission={0.2}
            thickness={0.9}
            clearcoat={0.3}
            transparent={true}
            opacity={0.9}
          />
        </mesh>

        {/* Enhanced frontal lobe connecting tissue */}
        <mesh position={[0, 0.7, 0.8]} scale={[1.8, 0.85, 0.85]}>
          <sphereGeometry args={[0.7, 64, 64]} />
          <meshPhysicalMaterial
            color="#E5D7F0"
            roughness={0.7}
            metalness={0.1}
            transmission={0.2}
            thickness={1.0}
            clearcoat={0.3}
            transparent={true}
            opacity={0.8}
          />
        </mesh>

        {/* Enhanced parietal lobe connecting tissue */}
        <mesh position={[0, 0.5, -0.7]} scale={[1.8, 0.85, 0.85]}>
          <sphereGeometry args={[0.7, 64, 64]} />
          <meshPhysicalMaterial
            color="#F2FCE2"
            roughness={0.7}
            metalness={0.1}
            transmission={0.2}
            thickness={1.0}
            clearcoat={0.3}
            transparent={true}
            opacity={0.8}
          />
        </mesh>

        {/* Enhanced temporal lobe connecting tissue */}
        <mesh position={[0, -0.1, 0.3]} scale={[1.8, 0.75, 0.85]}>
          <sphereGeometry args={[0.7, 64, 64]} />
          <meshPhysicalMaterial
            color="#FEEED0"
            roughness={0.7}
            metalness={0.1}
            transmission={0.2}
            thickness={1.0}
            clearcoat={0.3}
            transparent={true}
            opacity={0.8}
          />
        </mesh>

        {/* Enhanced occipital lobe connecting tissue */}
        <mesh position={[0, -0.2, -1.1]} scale={[1.8, 0.85, 0.85]}>
          <sphereGeometry args={[0.7, 64, 64]} />
          <meshPhysicalMaterial
            color="#DECFF9"
            roughness={0.7}
            metalness={0.1}
            transmission={0.2}
            thickness={1.0}
            clearcoat={0.3}
            transparent={true}
            opacity={0.8}
          />
        </mesh>

        {/* NEW: Additional bridging tissues to fill gaps */}
        <mesh position={[-0.8, 0.2, -0.2]} scale={[0.65, 0.7, 0.7]}>
          <sphereGeometry args={[0.7, 48, 48]} />
          <meshPhysicalMaterial
            color="#F4E8E1"
            roughness={0.7}
            metalness={0.1}
            transmission={0.25}
            thickness={0.8}
            clearcoat={0.3}
            transparent={true}
            opacity={0.85}
          />
        </mesh>

        <mesh position={[0.8, 0.2, -0.2]} scale={[0.65, 0.7, 0.7]}>
          <sphereGeometry args={[0.7, 48, 48]} />
          <meshPhysicalMaterial
            color="#F4E8E1"
            roughness={0.7}
            metalness={0.1}
            transmission={0.25}
            thickness={0.8}
            clearcoat={0.3}
            transparent={true}
            opacity={0.85}
          />
        </mesh>

        {/* Comprehensive white matter core */}
        <mesh position={[0, 0, 0]} scale={[1.2, 1.0, 1.3]}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshPhysicalMaterial
            color="#FFF8F5"
            transparent={true}
            opacity={0.3}
            roughness={0.4}
            transmission={0.8}
            thickness={0.3}
            envMapIntensity={0.3}
          />
        </mesh>

        {/* Enhanced thalamus with more detail */}
        <mesh position={[0, 0, 0]} scale={[0.85, 0.75, 0.85]}>
          <sphereGeometry args={[0.7, 48, 48]} />
          <meshPhysicalMaterial
            color="#FFDFCE"
            roughness={0.6}
            metalness={0.1}
            transmission={0.2}
            thickness={0.8}
            clearcoat={0.3}
            transparent={true}
            opacity={0.8}
          />
        </mesh>

        {/* Left and right thalamic structures */}
        <mesh position={[-0.3, 0, 0]} scale={[0.45, 0.4, 0.45]}>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshPhysicalMaterial
            color="#FFE8DB"
            roughness={0.6}
            metalness={0.1}
            transmission={0.2}
            thickness={0.8}
            clearcoat={0.3}
            transparent={true}
            opacity={0.8}
          />
        </mesh>

        <mesh position={[0.3, 0, 0]} scale={[0.45, 0.4, 0.45]}>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshPhysicalMaterial
            color="#FFE8DB"
            roughness={0.6}
            metalness={0.1}
            transmission={0.2}
            thickness={0.8}
            clearcoat={0.3}
            transparent={true}
            opacity={0.8}
          />
        </mesh>

        {/* NEW: Temporal-cerebellar connecting tissue */}
        <mesh position={[-0.6, -0.5, -0.1]} scale={[0.6, 0.6, 0.6]}>
          <sphereGeometry args={[0.7, 40, 40]} />
          <meshPhysicalMaterial
            color="#F5E4DB"
            roughness={0.6}
            metalness={0.1}
            transmission={0.2}
            thickness={0.7}
            clearcoat={0.3}
            transparent={true}
            opacity={0.85}
          />
        </mesh>

        <mesh position={[0.6, -0.5, -0.1]} scale={[0.6, 0.6, 0.6]}>
          <sphereGeometry args={[0.7, 40, 40]} />
          <meshPhysicalMaterial
            color="#F5E4DB"
            roughness={0.6}
            metalness={0.1}
            transmission={0.2}
            thickness={0.7}
            clearcoat={0.3}
            transparent={true}
            opacity={0.85}
          />
        </mesh>

        {/* Additional enhanced connections between cerebellum and brainstem */}
        <mesh position={[0, -1.15, -0.25]} rotation={[0.3, 0, 0]} scale={[0.9, 0.7, 0.7]}>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshPhysicalMaterial
            color="#A794F7"
            roughness={0.6}
            metalness={0.1}
            transmission={0.2}
            thickness={0.8}
            clearcoat={0.2}
          />
        </mesh>

        {/* Enhanced cerebellar peduncles (connections to cerebellum) */}
        <mesh position={[0, -0.9, -0.4]} rotation={[0.3, 0, 0]} scale={[1.1, 0.6, 0.7]}>
          <sphereGeometry args={[0.65, 32, 32]} />
          <meshPhysicalMaterial
            color="#B19DF7"
            roughness={0.6}
            metalness={0.1}
            transmission={0.2}
            thickness={0.8}
            clearcoat={0.2}
          />
        </mesh>

        {/* NEW: Cerebellar-occipital connecting tissue */}
        <mesh position={[0, -0.5, -0.8]} scale={[1.0, 0.7, 0.7]}>
          <sphereGeometry args={[0.7, 48, 48]} />
          <meshPhysicalMaterial
            color="#D5C9F1"
            roughness={0.6}
            metalness={0.1}
            transmission={0.2}
            thickness={0.7}
            clearcoat={0.3}
            transparent={true}
            opacity={0.9}
          />
        </mesh>

        {/* Left and right temporal-hippocampal connections */}
        <mesh position={[-0.85, -0.2, 0.15]} rotation={[0, 0.2, 0]} scale={[0.7, 0.6, 0.7]}>
          <sphereGeometry args={[0.55, 32, 32]} />
          <meshPhysicalMaterial
            color="#FEF0E4"
            roughness={0.6}
            metalness={0.1}
            transmission={0.2}
            thickness={0.8}
            clearcoat={0.2}
            transparent={true}
            opacity={0.9}
          />
        </mesh>

        <mesh position={[0.85, -0.2, 0.15]} rotation={[0, -0.2, 0]} scale={[0.7, 0.6, 0.7]}>
          <sphereGeometry args={[0.55, 32, 32]} />
          <meshPhysicalMaterial
            color="#FEF0E4"
            roughness={0.6}
            metalness={0.1}
            transmission={0.2}
            thickness={0.8}
            clearcoat={0.2}
            transparent={true}
            opacity={0.9}
          />
        </mesh>

        {/* Frontal-parietal connection network */}
        <mesh position={[-0.5, 0.6, 0.1]} rotation={[0, 0, -0.1]} scale={[0.7, 0.6, 0.7]}>
          <sphereGeometry args={[0.65, 32, 32]} />
          <meshPhysicalMaterial
            color="#EAE0F5"
            roughness={0.6}
            metalness={0.1}
            transmission={0.2}
            thickness={0.8}
            clearcoat={0.2}
            transparent={true}
            opacity={0.9}
          />
        </mesh>

        <mesh position={[0.5, 0.6, 0.1]} rotation={[0, 0, 0.1]} scale={[0.7, 0.6, 0.7]}>
          <sphereGeometry args={[0.65, 32, 32]} />
          <meshPhysicalMaterial
            color="#EAE0F5"
            roughness={0.6}
            metalness={0.1}
            transmission={0.2}
            thickness={0.8}
            clearcoat={0.2}
            transparent={true}
            opacity={0.9}
          />
        </mesh>

        {/* Temporal-occipital connection network */}
        <mesh position={[-0.8, -0.2, -0.4]} scale={[0.7, 0.6, 0.7]}>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshPhysicalMaterial
            color="#E8E8F7"
            roughness={0.6}
            metalness={0.1}
            transmission={0.2}
            thickness={0.8}
            clearcoat={0.2}
            transparent={true}
            opacity={0.9}
          />
        </mesh>

        <mesh position={[0.8, -0.2, -0.4]} scale={[0.7, 0.6, 0.7]}>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshPhysicalMaterial
            color="#E8E8F7"
            roughness={0.6}
            metalness={0.1}
            transmission={0.2}
            thickness={0.8}
            clearcoat={0.2}
            transparent={true}
            opacity={0.9}
          />
        </mesh>

        {/* Additional cerebellum-occipital connections */}
        <mesh position={[0, -0.6, -0.8]} scale={[1.0, 0.6, 0.7]}>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshPhysicalMaterial
            color="#C0B2F9"
            roughness={0.6}
            metalness={0.1}
            transmission={0.2}
            thickness={0.8}
            clearcoat={0.2}
            transparent={true}
            opacity={0.9}
          />
        </mesh>

        {/* Additional left-right connecting tissue - frontal */}
        <mesh position={[0, 0.7, 0.5]} scale={[1.7, 0.7, 0.7]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshPhysicalMaterial
            color="#EAD8EC"
            roughness={0.6}
            metalness={0.1}
            transmission={0.15}
            thickness={0.8}
            clearcoat={0.2}
            transparent={true}
            opacity={0.8}
          />
        </mesh>

        {/* Additional left-right connecting tissue - parietal */}
        <mesh position={[0, 0.5, -0.3]} scale={[1.7, 0.7, 0.7]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshPhysicalMaterial
            color="#EAF6DD"
            roughness={0.6}
            metalness={0.1}
            transmission={0.15}
            thickness={0.8}
            clearcoat={0.2}
            transparent={true}
            opacity={0.8}
          />
        </mesh>

        {/* Additional left-right connecting tissue - temporal */}
        <mesh position={[0, -0.1, 0.0]} scale={[1.7, 0.6, 0.7]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshPhysicalMaterial
            color="#FEF4E0"
            roughness={0.6}
            metalness={0.1}
            transmission={0.15}
            thickness={0.8}
            clearcoat={0.2}
            transparent={true}
            opacity={0.8}
          />
        </mesh>

        {/* Additional left-right connecting tissue - occipital */}
        <mesh position={[0, -0.2, -0.7]} scale={[1.7, 0.6, 0.7]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshPhysicalMaterial
            color="#E4DCF9"
            roughness={0.6}
            metalness={0.1}
            transmission={0.15}
            thickness={0.8}
            clearcoat={0.2}
            transparent={true}
            opacity={0.8}
          />
        </mesh>

        {/* Sulci network - creating folds across the surface */}
        {[-0.8, 0, 0.8].map((x, i) => (
          <mesh key={`sulci-x-${i}`} position={[x, 0.5, 0]} rotation={[0, 0, x > 0 ? -0.5 : 0.5]} scale={[0.05, 0.8, 1.5]}>
            <planeGeometry args={[1, 1, 1, 1]} />
            <meshPhysicalMaterial
              color="#F9E0D5"
              transparent={true}
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}

        {[-0.6, 0.6].map((z, i) => (
          <mesh key={`sulci-z-${i}`} position={[0, 0.5, z]} rotation={[0.5, 0, 0]} scale={[1.5, 0.05, 0.8]}>
            <planeGeometry args={[1, 1, 1, 1]} />
            <meshPhysicalMaterial
              color="#F9E0D5"
              transparent={true}
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}

        {/* Ventricles - fluid-filled cavities */}
        <mesh position={[0, 0.2, 0]} scale={[0.4, 0.2, 0.35]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshPhysicalMaterial
            color="#E0F0FF"
            roughness={0.2}
            metalness={0.1}
            transmission={0.6}
            ior={1.4}
            thickness={1.0}
            transparent={true}
            opacity={0.5}
          />
        </mesh>

        {/* Lateral ventricles */}
        <mesh position={[-0.3, 0.2, 0]} scale={[0.2, 0.15, 0.3]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshPhysicalMaterial
            color="#E0F0FF"
            roughness={0.2}
            metalness={0.1}
            transmission={0.6}
            ior={1.4}
            thickness={1.0}
            transparent={true}
            opacity={0.5}
          />
        </mesh>

        <mesh position={[0.3, 0.2, 0]} scale={[0.2, 0.15, 0.3]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshPhysicalMaterial
            color="#E0F0FF"
            roughness={0.2}
            metalness={0.1}
            transmission={0.6}
            ior={1.4}
            thickness={1.0}
            transparent={true}
            opacity={0.5}
          />
        </mesh>

        {/* NEW: Gap-filling connective tissue between all regions */}
        {[
          // Frontal to parietal connections
          { pos: [-0.5, 0.6, 0], scale: [0.6, 0.5, 0.6], color: "#EADFF1" },
          { pos: [0.5, 0.6, 0], scale: [0.6, 0.5, 0.6], color: "#EADFF1" },
          
          // Parietal to occipital connections
          { pos: [-0.4, 0.15, -0.9], scale: [0.55, 0.45, 0.6], color: "#E4DCF9" },
          { pos: [0.4, 0.15, -0.9], scale: [0.55, 0.45, 0.6], color: "#E4DCF9" },
          
          // Temporal to frontal connections
          { pos: [-0.9, 0.3, 0.55], scale: [0.55, 0.5, 0.55], color: "#F9DDD0" },
          { pos: [0.9, 0.3, 0.55], scale: [0.55, 0.5, 0.55], color: "#F9DDD0" },
          
          // Temporal to occipital connections
          { pos: [-0.75, -0.15, -0.4], scale: [0.6, 0.5, 0.6], color: "#E6E2F5" },
          { pos: [0.75, -0.15, -0.4], scale: [0.6, 0.5, 0.6], color: "#E6E2F5" },
          
          // Cerebellum connections
          { pos: [-0.5, -0.65, -0.45], scale: [0.6, 0.5, 0.5], color: "#CABCF9" },
          { pos: [0.5, -0.65, -0.45], scale: [0.6, 0.5, 0.5], color: "#CABCF9" },
          
          // Additional gap fillers
          { pos: [0, 0.4, 0.5], scale: [0.8, 0.4, 0.5], color: "#EFDCE8" },
          { pos: [0, 0.3, -0.5], scale: [0.8, 0.4, 0.5], color: "#E9F3DC" },
          { pos: [0, -0.4, -0.3], scale: [0.8, 0.4, 0.5], color: "#D8C4F5" },
          { pos: [0, 0, 0.5], scale: [0.7, 0.4, 0.5], color: "#FCE9DE" },
        ].map((item, i) => (
          <mesh key={`filler-${i}`} position={item.pos} scale={item.scale}>
            <sphereGeometry args={[0.7, 32, 32]} />
            <meshPhysicalMaterial
              color={item.color}
              roughness={0.6}
              metalness={0.1}
              transmission={0.2}
              thickness={0.7}
              clearcoat={0.25}
              transparent={true}
              opacity={0.85}
            />
          </mesh>
        ))}

        {/* Additional neural network connections */}
        {[...Array(20)].map((_, i) => {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const radius = 1.3 + Math.random() * 0.3;
          
          const position: [number, number, number] = [
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
          ];
          
          return (
            <mesh key={`neural-net-${i}`} position={position} scale={[0.1, 0.1, 0.1]}>
              <sphereGeometry args={[0.5, 12, 12]} />
              <meshPhysicalMaterial
                color="#FFE8DB"
                roughness={0.6}
                metalness={0.1}
                transmission={0.4}
                thickness={0.5}
                transparent={true}
                opacity={0.3}
              />
            </mesh>
          );
        })}
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

        {/* Brain regions - these will remain interactive and visible */}
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
        maxPolarAngle={Math.PI - 0.2} // Limit rotation to prevent seeing "under" the brain
        minPolarAngle={0.2} // Limit rotation to prevent seeing "over" the brain too much
      />
      
      <BakeShadows />
    </Canvas>
  );
};
