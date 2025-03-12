import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import * as THREE from 'three';

interface PathwayPointProps {
  position: [number, number, number];
  scale?: [number, number, number];
  color: string;
  name: string;
  progress: number;
  difficulty: number;
  isActive: boolean;
  onClick: () => void;
}

export const PathwayPoint = ({
  position,
  scale = [1, 1, 1],
  color,
  name,
  progress,
  difficulty,
  isActive,
  onClick
}: PathwayPointProps) => {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle pulse effect for active regions
      const pulseIntensity = 0.04 * progress;
      const baseScale = isActive ? 1.05 : 1;
      const pulseScale = baseScale + Math.sin(state.clock.elapsedTime * 1.5) * pulseIntensity;
      
      // Apply pulse to y-scale for height variation
      meshRef.current.scale.set(
        scale[0], 
        scale[1] * pulseScale,
        scale[2]
      );
    }
  });

  // Create pathway point geometry
  const pointGeometry = useMemo(() => {
    // Base shape depends on difficulty
    let baseGeometry;
    
    if (difficulty > 0.8) {
      // Hard subjects get steeper peaks
      baseGeometry = new THREE.ConeGeometry(1, 1.8, 24);
    } else if (difficulty > 0.6) {
      // Medium subjects get moderate peaks
      baseGeometry = new THREE.ConeGeometry(1, 1.2, 24);
    } else {
      // Easy subjects get gentle hills
      const sphereGeo = new THREE.SphereGeometry(1, 24, 24);
      
      // Flatten the sphere to make a hill
      const positions = sphereGeo.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        const vertex = new THREE.Vector3().fromBufferAttribute(positions, i);
        if (vertex.y < 0) {
          // Cut off bottom half
          vertex.y = -0.1;
        } else {
          // Compress height
          vertex.y *= 0.7;
        }
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
      
      baseGeometry = sphereGeo;
    }
    
    // Add terrain details based on progress
    const positions = baseGeometry.getAttribute('position');
    const count = positions.count;
    
    // Progress affects the smoothness/completeness of the shape
    const noiseScale = (1 - progress) * 0.15; // More progress = less noise/disruption
    
    // Add subtle terrain variation
    for (let i = 0; i < count; i++) {
      const vertex = new THREE.Vector3().fromBufferAttribute(positions, i);
      
      // Skip vertices at the very top to keep peak shape
      if (vertex.y > 0.8) continue;
      
      // Create a noise pattern
      const noise = Math.sin(vertex.x * 10) * Math.sin(vertex.z * 10) * noiseScale;
      vertex.x += noise;
      vertex.z += noise;
      
      // If not at the peak, add some y variation too
      if (vertex.y < 0.7) {
        vertex.y += noise * 0.5;
      }
      
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    baseGeometry.computeVertexNormals();
    return baseGeometry;
  }, [difficulty, progress]);

  // Create materials with progress indicators
  const pointMaterial = useMemo(() => {
    // Base color
    const baseColor = new THREE.Color(color);
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true,
      // Highlight active subjects
      emissive: isActive ? baseColor : new THREE.Color('#000'),
      emissiveIntensity: isActive ? 0.2 : 0,
      // Progress affects the brightness
      vertexColors: false,
    });
    
    // Apply custom shader function for progress visualization
    material.onBeforeCompile = (shader) => {
      // Add progress indicator (like a snow cap proportional to progress)
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
        
        // Add progress indicator at the top
        float progressThreshold = ${1 - progress};
        float progressBlend = 0.1;
        float progressFactor = smoothstep(progressThreshold - progressBlend, progressThreshold + progressBlend, vNormal.y);
        
        // Blend with progress color (golden for high progress)
        vec3 progressColor = vec3(1.0, 0.9, 0.4);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, progressColor, progressFactor * 0.7);
        `
      );
    };
    
    return material;
  }, [color, isActive, progress]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={scale}
      onClick={onClick}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'default'}
      geometry={pointGeometry}
      material={pointMaterial}
      castShadow
      receiveShadow
    >
      {/* Hover indicator for active subject */}
      {isActive && (
        <mesh position={[0, 1.5, 0]} scale={0.2}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      )}
      
      {/* Subject label */}
      <group position={[0, 1.2, 0]} scale={0.2}>
        <mesh visible={false}>
          <boxGeometry args={[1, 0.2, 0.1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
    </mesh>
  );
};
