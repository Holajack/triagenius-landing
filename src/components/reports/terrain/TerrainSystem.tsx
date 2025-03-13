
import { useRef, useEffect } from 'react';
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
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  
  // Create shader material
  useEffect(() => {
    materialRef.current = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: createVertexShader(heightMultiplier),
      fragmentShader,
      lights: true,
      wireframe: false,
      side: THREE.DoubleSide,
      defines: {
        USE_NORMALMAP: ''
      }
    });
    
    // Add normalized normals for better lighting
    if (meshRef.current && meshRef.current.geometry) {
      meshRef.current.geometry.computeVertexNormals();
    }
  }, [heightMultiplier]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -2, 0]} 
      receiveShadow
      castShadow
    >
      <planeGeometry args={[size, size, resolution - 1, resolution - 1]} />
      {materialRef.current && <primitive object={materialRef.current} attach="material" />}
    </mesh>
  );
};
