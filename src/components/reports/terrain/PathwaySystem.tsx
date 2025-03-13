
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line, Html, PointMaterial } from '@react-three/drei';

interface PathPoint {
  position: [number, number, number];
  type: 'basecamp' | 'prefrontal' | 'hippocampus' | 'amygdala' | 'cerebellum' | 'parietal';
  label: string;
}

interface PathwaySystemProps {
  paths: PathPoint[];
  onPathClick?: (point: PathPoint) => void;
}

export const PathwaySystem = ({ paths, onPathClick }: PathwaySystemProps) => {
  const [hoveredPoint, setHoveredPoint] = useState<PathPoint | null>(null);
  const pathRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points[]>([]);
  
  useEffect(() => {
    console.log("PathwaySystem initialized with paths:", paths);
  }, [paths]);
  
  // Create curved pathway between points
  const createPathGeometry = (points: PathPoint[]) => {
    // Create a path from the central hub to each point
    const centralHub = points[0]; // Basecamp is the first point
    
    return points.slice(1).map((point, index) => {
      const start = new THREE.Vector3(...centralHub.position);
      const end = new THREE.Vector3(...point.position);
      
      // Create a slightly curved path
      const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      midPoint.y += 1.5; // Lift the midpoint up to create an arc
      
      const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
      return { curve: curve.getPoints(20), type: point.type };
    });
  };
  
  const pathCurves = createPathGeometry(paths);
  
  // Color map for different point types
  const getPointColor = (type: PathPoint['type']) => {
    switch (type) {
      case 'basecamp': return '#FFFFFF';
      case 'prefrontal': return '#ea384c';
      case 'hippocampus': return '#1EAEDB';
      case 'amygdala': return '#4AC157';
      case 'cerebellum': return '#FDC536';
      case 'parietal': return '#D946EF';
      default: return '#FFFFFF';
    }
  };

  // Pulse animation for points
  useFrame((state) => {
    if (pathRef.current) {
      paths.forEach((point, index) => {
        const child = pathRef.current?.children[index];
        if (child && child.type === 'Mesh') {
          if (point.type === 'basecamp') {
            // Pulse animation for basecamp
            child.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
          } else {
            // Pulse animation for brain regions
            const pulseSpeed = index * 0.2 + 1;
            const pulseMagnitude = 0.08 + index * 0.01;
            child.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * pulseSpeed) * pulseMagnitude);
          }
        }
      });
      
      // Add subtle movement to the path markers
      pointsRef.current.forEach((points, i) => {
        if (points && points.material) {
          const material = points.material as THREE.PointsMaterial;
          material.size = 0.3 + Math.sin(state.clock.elapsedTime * 0.8 + i) * 0.1;
          if (points.position) {
            points.position.y = Math.sin(state.clock.elapsedTime * 0.5 + i * 0.5) * 0.05;
          }
        }
      });
    }
  });

  return (
    <group ref={pathRef}>
      {/* Render curve paths from center to each brain region */}
      {pathCurves.map(({ curve, type }, i) => (
        <group key={`path-${i}`}>
          <Line
            points={curve}
            color={getPointColor(type)}
            lineWidth={4}
            transparent
            opacity={0.8}
          />
          
          {/* Add floating particles along the path */}
          <points ref={(el) => {
            if (el) pointsRef.current[i] = el;
          }}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={curve.length}
                array={new Float32Array(curve.flatMap(v => [v.x, v.y, v.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <pointsMaterial
              color={getPointColor(type)}
              size={0.3}
              sizeAttenuation
              transparent
              opacity={0.7}
            />
          </points>
        </group>
      ))}
      
      {/* Render brain region markers */}
      {paths.map((point, index) => (
        <group key={index} position={point.position}>
          <mesh
            onPointerOver={() => setHoveredPoint(point)}
            onPointerOut={() => setHoveredPoint(null)}
            onClick={() => {
              console.log('Clicked on brain region:', point.type);
              onPathClick?.(point);
            }}
          >
            <sphereGeometry args={[0.4, 16, 16]} />
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
            distance={3}
            intensity={1.5}
            color={getPointColor(point.type)}
          />
          
          {/* Create a pulsing ring around each point */}
          {point.type !== 'basecamp' && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.5, 0.6, 32]} />
              <meshBasicMaterial 
                color={getPointColor(point.type)} 
                transparent
                opacity={0.6}
              />
            </mesh>
          )}
          
          {/* Labels for points when hovered */}
          {hoveredPoint === point && (
            <Html
              position={[0, 1, 0]}
              center
              style={{
                background: 'rgba(0,0,0,0.7)',
                padding: '8px 12px',
                borderRadius: '4px',
                color: 'white',
                fontSize: '14px',
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <div style={{ 
                borderLeft: `3px solid ${getPointColor(point.type)}`,
                paddingLeft: '6px'
              }}>
                {point.label}
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
};
