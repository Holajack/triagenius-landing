
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';

interface PathPoint {
  position: [number, number, number];
  type: 'checkpoint' | 'milestone' | 'basecamp';
}

interface PathwaySystemProps {
  paths: PathPoint[];
  onPathClick?: (point: PathPoint) => void;
}

export const PathwaySystem = ({ paths, onPathClick }: PathwaySystemProps) => {
  const [hoveredPoint, setHoveredPoint] = useState<PathPoint | null>(null);
  const pathRef = useRef<THREE.Group>(null);
  
  // Generate path between points
  const linePoints = paths.flatMap(p => [...p.position]);
  
  // Create curved pathway between points
  const createPathGeometry = (points: PathPoint[], closed = false) => {
    // Create a path from the central hub to each point
    const centralHub = points[0]; // Basecamp is the first point
    
    return points.slice(1).map((point, index) => {
      const start = new THREE.Vector3(...centralHub.position);
      const end = new THREE.Vector3(...point.position);
      
      // Create a slightly curved path
      const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      midPoint.y += 1.5; // Lift the midpoint up to create an arc
      
      const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
      return curve.getPoints(20);
    });
  };
  
  const pathCurves = createPathGeometry(paths);
  
  // Color map for different point types
  const getPointColor = (type: PathPoint['type']) => {
    switch (type) {
      case 'basecamp': return '#FF4500';
      case 'milestone': return '#FFD700';
      case 'checkpoint': return '#4169E1';
      default: return '#FFFFFF';
    }
  };
  
  const getPointLabel = (type: PathPoint['type']) => {
    switch (type) {
      case 'basecamp': return 'Base Camp';
      case 'milestone': return 'Milestone';
      case 'checkpoint': return 'Checkpoint';
      default: return '';
    }
  };
  
  // Pulse animation for points
  useFrame((state) => {
    if (pathRef.current) {
      pathRef.current.children.forEach((child, index) => {
        if (child.type === 'Mesh') {
          const pointType = paths[index]?.type;
          if (pointType === 'basecamp') {
            // Pulse animation for basecamp
            child.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
          }
        }
      });
    }
  });

  return (
    <group ref={pathRef}>
      {/* Render curve paths from center to each point */}
      {pathCurves.map((points, i) => (
        <Line
          key={`path-${i}`}
          points={points}
          color={getPointColor(paths[i+1].type)}
          lineWidth={4}
          transparent
          opacity={0.8}
        />
      ))}
      
      {/* Render checkpoints */}
      {paths.map((point, index) => (
        <group key={index} position={point.position}>
          <mesh
            onPointerOver={() => setHoveredPoint(point)}
            onPointerOut={() => setHoveredPoint(null)}
            onClick={() => onPathClick?.(point)}
          >
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial
              color={getPointColor(point.type)}
              emissive={getPointColor(point.type)}
              emissiveIntensity={0.6}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
          
          {/* Add glowing effects for points */}
          <pointLight
            distance={2}
            intensity={3}
            color={getPointColor(point.type)}
          />
          
          {/* Labels for points when hovered */}
          {hoveredPoint === point && (
            <Html
              position={[0, 1, 0]}
              center
              style={{
                background: 'rgba(0,0,0,0.7)',
                padding: '6px 10px',
                borderRadius: '4px',
                color: 'white',
                fontSize: '14px',
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              {getPointLabel(point.type)}
            </Html>
          )}
        </group>
      ))}
    </group>
  );
};
