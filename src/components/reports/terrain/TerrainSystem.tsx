
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
    if (!meshRef.current) return;
    
    // Create the shader material with proper uniforms
    materialRef.current = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: createVertexShader(heightMultiplier),
      fragmentShader,
      lights: true,
      wireframe: false,
      side: THREE.DoubleSide,
    });
    
    // Apply material directly to the mesh
    if (meshRef.current) {
      meshRef.current.material = materialRef.current;
      
      // Add normalized normals for better lighting
      meshRef.current.geometry.computeVertexNormals();
    }
    
    // Debug log to check if material is created
    console.log("Terrain material created:", materialRef.current);
  }, [heightMultiplier]);

  // Animate the terrain by updating time uniform
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
    </mesh>
  );
};
