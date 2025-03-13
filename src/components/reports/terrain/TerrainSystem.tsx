
import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';

interface TerrainSystemProps {
  size?: number;
  resolution?: number;
  heightMultiplier?: number;
}

export const TerrainSystem = ({
  size = 100,
  resolution = 100,
  heightMultiplier = 10
}: TerrainSystemProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create geometry with Perlin noise
  const geometry = useMemo(() => {
    console.log("Creating terrain geometry with size:", size, "resolution:", resolution);
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);
    
    try {
      // Create SimplexNoise instance
      const noise = new SimplexNoise();
      
      // Apply Perlin noise to vertices
      const vertices = geo.attributes.position.array;
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        // Apply noise-based height
        vertices[i + 1] = noise.noise(x / 10, z / 10) * heightMultiplier;
      }
      
      // Update normals for proper lighting
      geo.computeVertexNormals();
      console.log("Terrain geometry created successfully");
    } catch (error) {
      console.error("Error creating terrain geometry:", error);
    }
    
    return geo;
  }, [size, resolution, heightMultiplier]);
  
  // Create material with green color
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({ 
      color: 0x88cc88,
      wireframe: false,
      flatShading: true
    });
  }, []);
  
  useEffect(() => {
    if (meshRef.current) {
      console.log("TerrainSystem mounted, mesh created");
    }
  }, []);
  
  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -2, 0]} 
      receiveShadow
    />
  );
};
