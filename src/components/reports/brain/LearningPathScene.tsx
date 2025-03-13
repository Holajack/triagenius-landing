
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { BrainTrails } from './BrainTrails';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface LearningPathSceneProps {
  activeSubject: string | null;
  setActiveSubject: (subject: string | null) => void;
  zoomLevel: number;
  rotation: number;
}

// Brain region data - simplified positions to match the image
const pathPoints = [
  { position: [0, 0, 0] as [number, number, number], type: 'basecamp' as const, label: 'Learning Center' },
  { position: [-5, 0, 4] as [number, number, number], type: 'prefrontal' as const, label: 'Planning & Decision-Making' },
  { position: [6, 0, 3] as [number, number, number], type: 'hippocampus' as const, label: 'Memory Formation' },
  { position: [4, 0, -5] as [number, number, number], type: 'amygdala' as const, label: 'Emotional Learning' },
  { position: [-6, 0, -1.5] as [number, number, number], type: 'cerebellum' as const, label: 'Skill Mastery' },
  { position: [-3, 0, -6] as [number, number, number], type: 'parietal' as const, label: 'Problem Solving' },
];

// Camera controller component
const CameraController = ({ 
  activeSubject, 
  zoomLevel 
}: { 
  activeSubject: string | null;
  zoomLevel: number;
}) => {
  const { camera } = useThree();
  const cameraRef = useRef(camera);
  
  useEffect(() => {
    // Set initial camera position - higher up and looking down
    cameraRef.current.position.set(0, 15, 0);
    cameraRef.current.lookAt(0, 0, 0);
    console.log("Camera initialized:", cameraRef.current.position);
  }, []);
  
  useEffect(() => {
    if (activeSubject) {
      // Find the selected brain region
      const selectedPoint = pathPoints.find(p => p.type === activeSubject);
      
      if (selectedPoint) {
        // Move camera to focus on the selected region
        const targetPosition = new THREE.Vector3(
          selectedPoint.position[0] * 1.2,
          10,
          selectedPoint.position[2] * 1.2
        );
        
        // Animate camera movement
        const animateCamera = () => {
          cameraRef.current.position.lerp(targetPosition, 0.05);
          cameraRef.current.lookAt(
            selectedPoint.position[0],
            0,
            selectedPoint.position[2]
          );
          
          if (cameraRef.current.position.distanceTo(targetPosition) > 0.1) {
            requestAnimationFrame(animateCamera);
          }
        };
        
        animateCamera();
      }
    }
  }, [activeSubject]);
  
  return null;
};

// Region labels component
const RegionLabels = ({ 
  regions, 
  activeSubject 
}: { 
  regions: typeof pathPoints,
  activeSubject: string | null
}) => {
  return (
    <>
      {regions.map((region, index) => (
        region.type !== 'basecamp' && (
          <group 
            key={index} 
            position={[region.position[0], 1.2, region.position[2]]}
            visible={!activeSubject || activeSubject === region.type}
          >
            <Text
              color={getPointTypeColor(region.type)}
              fontSize={0.4}
              maxWidth={4}
              textAlign="center"
              anchorY="bottom"
            >
              {getBrainRegionShortName(region.type)}
            </Text>
          </group>
        )
      ))}
    </>
  );
};

export const LearningPathScene = ({ 
  activeSubject, 
  setActiveSubject, 
  zoomLevel, 
  rotation 
}: LearningPathSceneProps) => {
  console.log("LearningPathScene rendering with props:", { activeSubject, zoomLevel, rotation });
  
  return (
    <Canvas
      gl={{ 
        antialias: true,
        powerPreference: 'high-performance',
      }}
      style={{ width: '100%', height: '100%' }}
      camera={{ position: [0, 15, 0], fov: 50 }}
    >
      <color attach="background" args={['#f0f4f8']} />
      
      <CameraController activeSubject={activeSubject} zoomLevel={zoomLevel} />
      
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
      
      {/* Scene content */}
      <group 
        rotation-y={rotation * (Math.PI / 180)}
        scale={[zoomLevel, zoomLevel, zoomLevel]}
      >
        {/* Flat circular base */}
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[12, 32]} />
          <meshStandardMaterial color="#e9eef6" />
        </mesh>
        
        <BrainTrails brainRegions={pathPoints} />
        
        <RegionLabels 
          regions={pathPoints} 
          activeSubject={activeSubject} 
        />
        
        {/* Interactive region markers */}
        {pathPoints.map((point, index) => (
          point.type !== 'basecamp' && (
            <mesh 
              key={index}
              position={[point.position[0], 0.3, point.position[2]]}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Clicked region:', point.type);
                setActiveSubject(point.type);
              }}
            >
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial 
                color={getPointTypeColor(point.type)} 
                emissive={getPointTypeColor(point.type)}
                emissiveIntensity={0.3}
              />
            </mesh>
          )
        ))}
        
        {/* Learning center (basecamp) - gray box like in image */}
        <mesh
          position={[0, 0.3, 0]}
          onClick={() => setActiveSubject(null)}
        >
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#9ca3af" />
        </mesh>
      </group>

      <OrbitControls
        enabled={!activeSubject}
        enablePan={false}
        minDistance={5}
        maxDistance={25}
        autoRotate={!activeSubject}
        autoRotateSpeed={0.5}
        enableDamping={true}
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2.5}
        minPolarAngle={0.1}
      />
    </Canvas>
  );
};

// Helper functions
function getPointTypeColor(type: string): string {
  switch (type) {
    case 'prefrontal': return '#ea384c'; // Red
    case 'hippocampus': return '#1EAEDB'; // Blue
    case 'amygdala': return '#4AC157';  // Green
    case 'cerebellum': return '#FDC536'; // Yellow
    case 'parietal': return '#D946EF';  // Magenta
    default: return '#FFFFFF';
  }
}

function getBrainRegionShortName(type: string): string {
  switch (type) {
    case 'prefrontal': return 'Planning';
    case 'hippocampus': return 'Memory';
    case 'amygdala': return 'Emotions';
    case 'cerebellum': return 'Skills';
    case 'parietal': return 'Problem Solving';
    default: return '';
  }
}
