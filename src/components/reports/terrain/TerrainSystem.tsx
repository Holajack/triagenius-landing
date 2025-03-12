
import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { createVertexShader } from './shaders/vertexShader';
import { fragmentShader } from './shaders/fragmentShader';

interface TerrainSystemProps {
  resolution?: number;
  size?: number;
  heightMultiplier?: number;
}

export const TerrainSystem = ({
  resolution = 128,
  size = 30,
  heightMultiplier = 5
}: TerrainSystemProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const terrainMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
    },
    vertexShader: createVertexShader(heightMultiplier),
    fragmentShader,
    wireframe: false
  });

  useFrame((state) => {
    if (meshRef.current) {
      terrainMaterial.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -2, 0]} 
      receiveShadow
    >
      <planeGeometry args={[size, size, resolution - 1, resolution - 1]} />
      <primitive object={terrainMaterial} attach="material" />
    </mesh>
  );
};
