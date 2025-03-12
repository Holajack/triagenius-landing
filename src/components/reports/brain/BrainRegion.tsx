
import { useState, useRef, useMemo } from 'react';
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
  geometry?: string;
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
  geometry = 'sphere',
  onClick
}: BrainRegionProps) => {
  const [hovered, setHovered] = useState(false);
  
  // Create ref using useRef instead of useState
  const meshRef = useRef<Mesh>(null);
  
  // Pulse animation based on activity level
  useFrame((state) => {
    if (meshRef.current) {
      // Calculate pulse scale based on activity level
      const pulseIntensity = 0.02 * activity;
      const baseScale = isActive || hovered ? 1.05 : 1;
      const pulseScale = baseScale + Math.sin(state.clock.elapsedTime * 2) * pulseIntensity;
      
      // Apply different scale factors for different regions to maintain brain shape
      if (Array.isArray(scale)) {
        meshRef.current.scale.set(
          scale[0] * pulseScale,
          scale[1] * pulseScale,
          scale[2] * pulseScale
        );
      } else {
        meshRef.current.scale.setScalar(pulseScale);
      }
      
      // Add subtle rotation for active regions to enhance visual interest
      if (isActive) {
        meshRef.current.rotation.y += 0.001;
      }
    }
  });

  // Create PBR material with physically realistic properties
  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color),
      roughness: 0.6,             // Slightly rough like biological tissue
      metalness: 0.0,             // Non-metallic
      transmission: 0.1,          // Slight subsurface scattering effect
      thickness: 1.0,             // For transmission
      clearcoat: 0.5,             // Light waxy/moist coating
      clearcoatRoughness: 0.2,    // Slightly uneven coating
      envMapIntensity: 0.8,       // Responsive to environment lighting
      sheenColor: new THREE.Color(color).multiplyScalar(0.8),
      sheen: 0.1,                 // Subtle silky sheen
    });
  }, [color]);

  // Define distortion for the geometry to simulate gyri and sulci
  const distortGeometry = (geometry: THREE.BufferGeometry) => {
    const positionAttr = geometry.getAttribute('position');
    const vertex = new THREE.Vector3();
    const normal = new THREE.Vector3();
    
    // Clone the position attribute to avoid modifying the original
    const newPositions = new Float32Array(positionAttr.array.length);
    for (let i = 0; i < positionAttr.count; i++) {
      vertex.fromBufferAttribute(positionAttr, i);
      
      // Calculate distortion based on simplex noise approximation
      const distortionAmount = 0.12;
      const noiseScale = 3.0;
      const noise = Math.sin(vertex.x * noiseScale) * 
                   Math.cos(vertex.y * noiseScale) * 
                   Math.sin(vertex.z * noiseScale);
      
      // Apply distortion along normal direction
      normal.copy(vertex).normalize();
      vertex.add(normal.multiplyScalar(noise * distortionAmount));
      
      // Store the new position
      newPositions[i * 3] = vertex.x;
      newPositions[i * 3 + 1] = vertex.y;
      newPositions[i * 3 + 2] = vertex.z;
    }
    
    // Update geometry with distorted positions
    geometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    geometry.computeVertexNormals(); // Recalculate normals for proper lighting
    
    return geometry;
  };

  // Create geometry based on the region type
  const brainGeometry = useMemo(() => {
    let geo;
    
    switch(geometry) {
      case 'frontal':
        // Frontal lobe - elongated and wider
        geo = new THREE.SphereGeometry(1, 32, 32);
        geo.scale(1.2, 1, 1);
        geo.translate(0, 0.2, 0);
        break;
      case 'temporal':
        // Temporal lobe - slightly flattened with a hook-like shape
        geo = new THREE.SphereGeometry(0.8, 32, 32);
        geo.scale(1.2, 0.8, 0.9);
        break;
      case 'parietal':
        // Parietal lobe - rounded and slightly elevated
        geo = new THREE.SphereGeometry(0.9, 32, 32);
        geo.scale(1, 1.1, 1);
        break;
      case 'occipital':
        // Occipital lobe - slightly pointed
        geo = new THREE.SphereGeometry(0.8, 32, 32);
        geo.scale(1, 1, 1.1);
        break;
      case 'cerebellum':
        // Cerebellum - distinctive ridged shape
        geo = new THREE.SphereGeometry(0.9, 32, 32);
        geo.scale(1.2, 0.7, 1);
        break;
      case 'brainstem':
        // Brain stem - elongated cylindrical shape
        geo = new THREE.CylinderGeometry(0.4, 0.3, 1.2, 16);
        geo.rotateX(Math.PI / 2);
        break;
      default:
        // Default spherical shape
        geo = new THREE.SphereGeometry(1, 32, 32);
    }
    
    // Apply distortion to create gyri and sulci
    return distortGeometry(geo);
  }, [geometry]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      geometry={brainGeometry}
    >
      <primitive object={material} attach="material" />
    </mesh>
  );
};
