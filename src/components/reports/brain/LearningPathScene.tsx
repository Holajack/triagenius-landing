
import { Canvas, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment,
  Sky,
  PerspectiveCamera,
  Text
} from '@react-three/drei';
import { TerrainSystem } from '../terrain/TerrainSystem';
import { BrainTrails } from './BrainTrails';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface LearningPathSceneProps {
  activeSubject: string | null;
  setActiveSubject: (subject: string | null) => void;
  zoomLevel: number;
  rotation: number;
}

// Brain region data
const pathPoints = [
  { position: [0, 0, 0] as [number, number, number], type: 'basecamp' as const, label: 'Learning Center' },
  { position: [-10, 4, 8] as [number, number, number], type: 'prefrontal' as const, label: 'Prefrontal Cortex: Planning & Decision-Making' },
  { position: [12, 5, 6] as [number, number, number], type: 'hippocampus' as const, label: 'Hippocampus: Memory Formation' },
  { position: [8, 4, -10] as [number, number, number], type: 'amygdala' as const, label: 'Amygdala: Emotional Learning' },
  { position: [-12, 4, -3] as [number, number, number], type: 'cerebellum' as const, label: 'Cerebellum: Skill Mastery' },
  { position: [-5, 4, -12] as [number, number, number], type: 'parietal' as const, label: 'Parietal Lobe: Problem Solving' },
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
    // Set initial camera position
    cameraRef.current.position.set(0, 20, 50);
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
          selectedPoint.position[0] * 1.5,
          selectedPoint.position[1] + 15,
          selectedPoint.position[2] * 1.5
        );
        
        // Animate camera movement
        const animateCamera = () => {
          cameraRef.current.position.lerp(targetPosition, 0.05);
          cameraRef.current.lookAt(
            selectedPoint.position[0],
            selectedPoint.position[1],
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
            position={[region.position[0], region.position[1] + 3, region.position[2]]}
            visible={!activeSubject || activeSubject === region.type}
          >
            <Text
              color={getPointTypeColor(region.type)}
              fontSize={1.2}
              maxWidth={10}
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
        stencil: false,
        depth: true,
      }}
      style={{ width: '100%', height: '100%' }}
      dpr={[1, 1.5]}
      shadows
    >
      <color attach="background" args={['#071025']} />
      <fog attach="fog" args={['#071025', 80, 100]} />
      
      <CameraController activeSubject={activeSubject} zoomLevel={zoomLevel} />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1} 
        castShadow 
      />
      <hemisphereLight 
        args={['#87CEEB', '#8A2BE2', 0.5]} 
      />

      {/* Scene content */}
      <group 
        rotation-y={rotation * (Math.PI / 180)}
        scale={[zoomLevel, zoomLevel, zoomLevel]}
      >
        <TerrainSystem 
          size={100}
          resolution={100}
          heightMultiplier={10}
        />
        
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
              position={[point.position[0], point.position[1] + 1, point.position[2]]}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Clicked region:', point.type);
                setActiveSubject(point.type);
              }}
            >
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial 
                color={getPointTypeColor(point.type)} 
                emissive={getPointTypeColor(point.type)}
                emissiveIntensity={0.5}
              />
            </mesh>
          )
        ))}
        
        {/* Learning center (basecamp) */}
        <mesh
          position={[0, 1, 0]}
          onClick={() => setActiveSubject(null)}
        >
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
      </group>

      <Sky
        distance={450000}
        sunPosition={[10, 5, 5]}
        inclination={0.5}
        azimuth={0.25}
      />

      <OrbitControls
        enabled={!activeSubject}
        enablePan={false}
        minDistance={10}
        maxDistance={70}
        autoRotate={!activeSubject}
        autoRotateSpeed={0.5}
        enableDamping={true}
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minPolarAngle={0.1}
      />
    </Canvas>
  );
};

// Helper functions
function getPointTypeColor(type: string): string {
  switch (type) {
    case 'prefrontal': return '#ea384c';
    case 'hippocampus': return '#1EAEDB';
    case 'amygdala': return '#4AC157';
    case 'cerebellum': return '#FDC536';
    case 'parietal': return '#D946EF';
    default: return '#FFFFFF';
  }
}

function getBrainRegionShortName(type: string): string {
  switch (type) {
    case 'prefrontal': return 'Prefrontal Cortex';
    case 'hippocampus': return 'Hippocampus';
    case 'amygdala': return 'Amygdala';
    case 'cerebellum': return 'Cerebellum';
    case 'parietal': return 'Parietal Lobe';
    default: return '';
  }
}
