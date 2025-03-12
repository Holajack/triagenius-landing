
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface PathPoint {
  position: [number, number, number];
  type: 'checkpoint' | 'milestone' | 'basecamp';
}

interface PathwaySystemProps {
  paths: PathPoint[];
  onPathClick?: (point: PathPoint) => void;
}

export const PathwaySystem = ({ paths, onPathClick }: PathwaySystemProps) => {
  const pathRef = useRef<THREE.Line>(null);

  // Create curved pathway between points
  const createPathGeometry = (points: PathPoint[]) => {
    const curve = new THREE.CatmullRomCurve3(
      points.map(p => new THREE.Vector3(...p.position))
    );
    
    return new THREE.BufferGeometry().setFromPoints(
      curve.getPoints(50)
    );
  };

  return (
    <group>
      {/* Render pathway lines */}
      <line ref={pathRef}>
        <bufferGeometry attach="geometry" {...createPathGeometry(paths)} />
        <lineBasicMaterial attach="material" color="#FFD700" linewidth={3} />
      </line>
      
      {/* Render checkpoints */}
      {paths.map((point, index) => (
        <mesh
          key={index}
          position={new THREE.Vector3(...point.position)}
          onClick={() => onPathClick?.(point)}
        >
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshStandardMaterial
            color={point.type === 'basecamp' ? '#FF4444' : '#4444FF'}
            emissive={point.type === 'milestone' ? '#FFFF00' : '#000000'}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
};

