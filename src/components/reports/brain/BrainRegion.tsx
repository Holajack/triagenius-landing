
import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import * as THREE from 'three';
import { useTexture, MeshDistortMaterial } from '@react-three/drei';

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

  // Create advanced PBR material with physically realistic properties
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
  const createDistortedGeometry = (baseGeometry: THREE.BufferGeometry) => {
    const positionAttr = baseGeometry.getAttribute('position');
    const vertex = new THREE.Vector3();
    const normal = new THREE.Vector3();
    
    // Clone the position attribute to avoid modifying the original
    const newPositions = new Float32Array(positionAttr.array.length);
    
    // Copy original positions first
    for (let i = 0; i < positionAttr.count; i++) {
      vertex.fromBufferAttribute(positionAttr, i);
      
      // Store the original position
      newPositions[i * 3] = vertex.x;
      newPositions[i * 3 + 1] = vertex.y;
      newPositions[i * 3 + 2] = vertex.z;
    }
    
    // Apply distortion to create gyri (ridges) and sulci (grooves)
    for (let i = 0; i < positionAttr.count; i++) {
      vertex.set(
        newPositions[i * 3], 
        newPositions[i * 3 + 1], 
        newPositions[i * 3 + 2]
      );
      
      // Calculate distortion based on 3D simplex noise approximation
      const distortionAmount = 0.15; // Deeper grooves for more realism
      const noiseScale = 4.0;  // Higher frequency noise for finer details
      
      // Simulate complex noise patterns using trigonometric functions
      // This creates wave patterns at different frequencies to mimic brain folds
      const noise1 = Math.sin(vertex.x * noiseScale) * 
                    Math.cos(vertex.y * noiseScale * 1.3) * 
                    Math.sin(vertex.z * noiseScale * 0.8);
                    
      const noise2 = Math.cos(vertex.x * noiseScale * 1.5) * 
                    Math.sin(vertex.y * noiseScale * 0.9) * 
                    Math.cos(vertex.z * noiseScale * 1.2);
                    
      const noise3 = Math.sin(vertex.x * noiseScale * 0.7) * 
                    Math.sin(vertex.y * noiseScale * 1.1) * 
                    Math.cos(vertex.z * noiseScale * 1.4);
      
      // Combine noise patterns at different scales for organic feel
      const combinedNoise = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2);
      
      // Apply more distortion to specific brain regions
      let regionMultiplier = 1.0;
      switch(geometry) {
        case 'frontal':
          regionMultiplier = 1.2; // More prominent folds in frontal lobe
          break;
        case 'cerebellum':
          regionMultiplier = 1.4; // Very defined ridges in cerebellum
          break;
        default:
          regionMultiplier = 1.0;
      }
      
      // Apply distortion along normal direction
      normal.copy(vertex).normalize();
      vertex.add(normal.multiplyScalar(combinedNoise * distortionAmount * regionMultiplier));
      
      // Store the new position
      newPositions[i * 3] = vertex.x;
      newPositions[i * 3 + 1] = vertex.y;
      newPositions[i * 3 + 2] = vertex.z;
    }
    
    // Update geometry with distorted positions
    const distortedGeometry = baseGeometry.clone();
    distortedGeometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    distortedGeometry.computeVertexNormals(); // Recalculate normals for proper lighting
    
    return distortedGeometry;
  };

  // Create anatomically-inspired geometry based on the region type
  const brainGeometry = useMemo(() => {
    let baseGeometry;
    
    switch(geometry) {
      case 'frontal':
        // Frontal lobe - elongated and wider at top
        baseGeometry = new THREE.SphereGeometry(1, 48, 48);
        baseGeometry.scale(1.2, 1, 1);
        baseGeometry.translate(0, 0.2, 0);
        break;
      case 'temporal':
        // Temporal lobe - slightly flattened with a hook-like shape
        baseGeometry = new THREE.SphereGeometry(0.8, 48, 48);
        baseGeometry.scale(1.2, 0.8, 0.9);
        // Create hook-like curve for temporal lobe
        const posAttr = baseGeometry.getAttribute('position');
        const tempVec = new THREE.Vector3();
        for (let i = 0; i < posAttr.count; i++) {
          tempVec.fromBufferAttribute(posAttr, i);
          if (tempVec.y < 0 && tempVec.x < 0) {
            // Curve the bottom part forward
            tempVec.z += 0.2 * Math.abs(tempVec.y);
            posAttr.setXYZ(i, tempVec.x, tempVec.y, tempVec.z);
          }
        }
        break;
      case 'parietal':
        // Parietal lobe - rounded and slightly elevated
        baseGeometry = new THREE.SphereGeometry(0.9, 48, 48);
        baseGeometry.scale(1, 1.1, 1);
        break;
      case 'occipital':
        // Occipital lobe - slightly pointed
        baseGeometry = new THREE.SphereGeometry(0.8, 48, 48);
        baseGeometry.scale(1, 1, 1.1);
        // Make it slightly more pointed at the back
        const occPosAttr = baseGeometry.getAttribute('position');
        const occVec = new THREE.Vector3();
        for (let i = 0; i < occPosAttr.count; i++) {
          occVec.fromBufferAttribute(occPosAttr, i);
          if (occVec.z < -0.5) {
            // Stretch points at the back
            occVec.z *= 1.1;
            occPosAttr.setXYZ(i, occVec.x, occVec.y, occVec.z);
          }
        }
        break;
      case 'cerebellum':
        // Cerebellum - distinctive ridged shape
        baseGeometry = new THREE.SphereGeometry(0.9, 48, 48);
        baseGeometry.scale(1.2, 0.7, 1);
        break;
      case 'brainstem':
        // Brain stem - elongated cylindrical shape
        baseGeometry = new THREE.CylinderGeometry(0.4, 0.3, 1.2, 24);
        baseGeometry.rotateX(Math.PI / 2);
        break;
      default:
        // Default spherical shape with higher polygon count
        baseGeometry = new THREE.SphereGeometry(1, 48, 48);
    }
    
    // Apply distortion to create gyri and sulci
    return createDistortedGeometry(baseGeometry);
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
      castShadow
      receiveShadow
    >
      <primitive object={material} attach="material" />
    </mesh>
  );
};
