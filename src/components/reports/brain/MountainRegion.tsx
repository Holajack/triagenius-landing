import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import * as THREE from 'three';

interface MountainRegionProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color: string;
  name: string;
  activity: number;
  altitude: number;
  isActive: boolean;
  geometry?: string;
  onClick: () => void;
}

export const MountainRegion = ({
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  color,
  name,
  activity,
  altitude,
  isActive,
  geometry = 'medium_peak',
  onClick
}: MountainRegionProps) => {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle pulse effect for active regions
      const pulseIntensity = 0.02 * activity;
      const baseScale = isActive ? 1.05 : 1;
      const pulseScale = baseScale + Math.sin(state.clock.elapsedTime * 1.5) * pulseIntensity;
      
      // Apply pulse to y-scale for height variation, keep x and z the same
      meshRef.current.scale.set(
        scale[0], 
        scale[1] * pulseScale,
        scale[2]
      );
    }
  });

  // Create mountain geometry based on the specified type
  const mountainGeometry = useMemo(() => {
    let baseGeometry;
    
    const highDetail = 64; // Higher polygon count for detailed mountains
    
    switch(geometry) {
      case 'highest_peak':
        // Central dominant peak
        baseGeometry = new THREE.ConeGeometry(1, 2, highDetail);
        // Make it more dramatic with some deformation
        const highestVerts = baseGeometry.getAttribute('position');
        for (let i = 0; i < highestVerts.count; i++) {
          const vertex = new THREE.Vector3().fromBufferAttribute(highestVerts, i);
          // Add some ridge-like features
          vertex.y += 0.2 * Math.sin(vertex.x * 5) * Math.sin(vertex.z * 5);
          highestVerts.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        break;
        
      case 'sharp_peak':
        // Sharp pointed mountain
        baseGeometry = new THREE.ConeGeometry(1, 1.8, highDetail);
        break;
        
      case 'large_peak':
        // Broader mountain with a peak
        baseGeometry = new THREE.ConeGeometry(1, 1.5, highDetail);
        // Widen the base
        const largeVerts = baseGeometry.getAttribute('position');
        for (let i = 0; i < largeVerts.count; i++) {
          const vertex = new THREE.Vector3().fromBufferAttribute(largeVerts, i);
          if (vertex.y < 0.2) {
            // Expand base
            const factor = 1.2 * (1 - vertex.y / 0.2);
            vertex.x *= 1 + factor * 0.2;
            vertex.z *= 1 + factor * 0.2;
          }
          largeVerts.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        break;
        
      case 'medium_peak':
        // Standard mountain
        baseGeometry = new THREE.ConeGeometry(1, 1.2, highDetail);
        break;
        
      case 'rolling_hill':
        // Gentle rounded hill
        baseGeometry = new THREE.SphereGeometry(1, highDetail, highDetail);
        // Flatten and adjust to make hill-like
        const hillVerts = baseGeometry.getAttribute('position');
        for (let i = 0; i < hillVerts.count; i++) {
          const vertex = new THREE.Vector3().fromBufferAttribute(hillVerts, i);
          if (vertex.y < 0) {
            // Cut off bottom half
            vertex.y = -0.1;
          } else {
            // Compress height
            vertex.y *= 0.7;
          }
          hillVerts.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        break;
        
      case 'plateau':
        // Flat-topped mountain
        baseGeometry = new THREE.CylinderGeometry(0.5, 1, 1.2, highDetail);
        // Add some irregularity
        const plateauVerts = baseGeometry.getAttribute('position');
        for (let i = 0; i < plateauVerts.count; i++) {
          const vertex = new THREE.Vector3().fromBufferAttribute(plateauVerts, i);
          // Add some noise to the sides
          if (vertex.y !== 0.6 && vertex.y !== -0.6) { // Not the top or bottom faces
            const noise = Math.sin(vertex.x * 4) * Math.sin(vertex.z * 4) * 0.1;
            vertex.x += noise;
            vertex.z += noise;
          }
          plateauVerts.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        break;
        
      case 'gentle_slope':
        // Long gradual incline
        baseGeometry = new THREE.ConeGeometry(1, 0.8, highDetail);
        // Stretch and smooth
        const slopeVerts = baseGeometry.getAttribute('position');
        for (let i = 0; i < slopeVerts.count; i++) {
          const vertex = new THREE.Vector3().fromBufferAttribute(slopeVerts, i);
          // Stretch in one direction for an elongated shape
          vertex.x *= 1.5;
          // Smooth the top
          if (vertex.y > 0.4) {
            vertex.y = 0.4 + (vertex.y - 0.4) * 0.5;
          }
          slopeVerts.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        break;
        
      case 'rocky_terrain':
        // Jagged rocky mountain
        baseGeometry = new THREE.ConeGeometry(1, 1.1, highDetail);
        // Add rocky features
        const rockyVerts = baseGeometry.getAttribute('position');
        for (let i = 0; i < rockyVerts.count; i++) {
          const vertex = new THREE.Vector3().fromBufferAttribute(rockyVerts, i);
          // Add jagged noise
          vertex.x += (Math.random() - 0.5) * 0.2;
          vertex.y += (Math.random() - 0.5) * 0.2;
          vertex.z += (Math.random() - 0.5) * 0.2;
          rockyVerts.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        break;
        
      case 'smooth_hill':
        // Very gentle smooth hill
        baseGeometry = new THREE.SphereGeometry(1, highDetail, highDetail);
        // Flatten significantly
        const smoothVerts = baseGeometry.getAttribute('position');
        for (let i = 0; i < smoothVerts.count; i++) {
          const vertex = new THREE.Vector3().fromBufferAttribute(smoothVerts, i);
          if (vertex.y < 0) {
            // Cut off bottom half and flatten
            vertex.y = -0.1;
          } else {
            // Compress height significantly
            vertex.y *= 0.4;
          }
          smoothVerts.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        break;
        
      default:
        baseGeometry = new THREE.ConeGeometry(1, 1, highDetail);
    }
    
    // Add random terrain details
    const positions = baseGeometry.getAttribute('position');
    const count = positions.count;
    
    // Add subtle terrain variation
    for (let i = 0; i < count; i++) {
      const vertex = new THREE.Vector3().fromBufferAttribute(positions, i);
      
      // Skip vertices at the very top to keep peak shape
      if (vertex.y > 0.9 * altitude) continue;
      
      // Add terrain details based on geometry type
      let noiseScale = 0.05;
      if (geometry === 'rocky_terrain') noiseScale = 0.1;
      if (geometry === 'smooth_hill') noiseScale = 0.02;
      
      // Create a noise pattern
      const noise = Math.sin(vertex.x * 10) * Math.sin(vertex.z * 10) * noiseScale;
      vertex.x += noise;
      vertex.z += noise;
      
      // If not at the peak, add some y variation too
      if (vertex.y < 0.8 * altitude) {
        vertex.y += noise * 0.5;
      }
      
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    baseGeometry.computeVertexNormals();
    return baseGeometry;
  }, [geometry, altitude]);

  // Create enhanced materials for mountains
  const mountainMaterial = useMemo(() => {
    // Base color with slight variation based on activity
    const baseColor = new THREE.Color(color);
    const shadedColor = baseColor.clone().multiplyScalar(0.8);
    
    // Create more realistic mountain material
    return new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true, // Creates a more angular, mountainous look
      // Highlight active mountains
      emissive: isActive ? baseColor : new THREE.Color('#000'),
      emissiveIntensity: isActive ? 0.2 : 0,
      // Use vertex colors for height-based coloring
      vertexColors: true,
      onBeforeCompile: (shader) => {
        // Add snow caps to peaks
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <common>',
          `
          #include <common>
          varying vec3 vPosition;
          `
        );
        
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <output_fragment>',
          `
          #include <output_fragment>
          
          // Add snow to peaks based on height and normal
          float snowThreshold = 0.6;
          float snowBlend = 0.1;
          float snowFactor = smoothstep(snowThreshold - snowBlend, snowThreshold + snowBlend, vNormal.y);
          
          // Blend with snow color
          vec3 snowColor = vec3(1.0, 1.0, 1.0);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, snowColor, snowFactor * 0.7);
          `
        );
      }
    });
  }, [color, isActive, activity]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={onClick}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'default'}
      geometry={mountainGeometry}
      material={mountainMaterial}
      castShadow
      receiveShadow
    >
      {/* Hover indicator for active region */}
      {isActive && (
        <mesh position={[0, altitude * 1.1, 0]} scale={0.2}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      )}
      
      {/* Region label for identification */}
      <group position={[0, altitude * 0.8, 0]} scale={0.2}>
        <mesh visible={false}>
          <boxGeometry args={[1, 0.2, 0.1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
    </mesh>
  );
};
