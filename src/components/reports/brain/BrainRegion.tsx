
import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import * as THREE from 'three';

interface BrainRegionProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color: string;
  name: string;
  activity: number;
  isActive: boolean;
  onClick: () => void;
}

export const BrainRegion = ({
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  color,
  name,
  activity,
  isActive,
  onClick
}: BrainRegionProps) => {
  const [hovered, setHovered] = useState(false);
  
  // Create ref using useRef instead of useState
  const meshRef = useRef<Mesh>(null);
  
  // Pulse animation based on activity level
  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02 * activity;
      meshRef.current.scale.setScalar(isActive || hovered ? scale : 1);
    }
  });

  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: 0.5,
    metalness: 0.1,
    transmission: 0.2,
    thickness: 0.5,
    clearcoat: 0.3,
    clearcoatRoughness: 0.25,
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};
