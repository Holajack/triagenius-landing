
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment,
  ContactShadows,
  Sky,
  PerspectiveCamera,
  Float,
  Text
} from '@react-three/drei';
import { TerrainSystem } from '../terrain/TerrainSystem';
import { PathwaySystem } from '../terrain/PathwaySystem';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { easing } from 'maath';

interface LearningPathSceneProps {
  activeSubject: string | null;
  setActiveSubject: (subject: string | null) => void;
  zoomLevel: number;
  rotation: number;
}

export const LearningPathScene = ({ 
  activeSubject, 
  setActiveSubject, 
  zoomLevel, 
  rotation 
}: LearningPathSceneProps) => {
  console.log("LearningPathScene rendering with props:", { activeSubject, zoomLevel, rotation });
  
  // Path points corresponding to brain regions
  const pathPoints = [
    { position: [0, 0, 0] as [number, number, number], type: 'basecamp' as const, label: 'Learning Center' },
    { position: [-10, 4, 8] as [number, number, number], type: 'prefrontal' as const, label: 'Prefrontal Cortex: Planning & Decision-Making' },
    { position: [12, 5, 6] as [number, number, number], type: 'hippocampus' as const, label: 'Hippocampus: Memory Formation' },
    { position: [8, 4, -10] as [number, number, number], type: 'amygdala' as const, label: 'Amygdala: Emotional Learning' },
    { position: [-12, 4, -3] as [number, number, number], type: 'cerebellum' as const, label: 'Cerebellum: Skill Mastery' },
    { position: [-5, 4, -12] as [number, number, number], type: 'parietal' as const, label: 'Parietal Lobe: Problem Solving' },
  ];

  // Camera control for focusing on specific regions
  const CameraController = () => {
    const { camera } = useThree();
    const targetPosition = useRef(new THREE.Vector3(0, 15, 25));
    
    useEffect(() => {
      // Set initial camera position
      camera.position.set(0, 15, 25);
      camera.lookAt(0, 0, 0);
      console.log("Camera initialized:", camera.position);
    }, [camera]);
    
    useFrame((state, delta) => {
      if (activeSubject) {
        // Find the selected brain region
        const selectedPoint = pathPoints.find(p => p.type === activeSubject);
        
        if (selectedPoint) {
          // Create target position slightly offset from the selected point
          const targetPos = new THREE.Vector3(
            selectedPoint.position[0] * 0.7,
            selectedPoint.position[1] + 5,
            selectedPoint.position[2] * 0.7
          );
          
          // Smoothly transition to focus on the selected point
          targetPosition.current.lerp(targetPos, 0.05);
          easing.damp3(camera.position, targetPosition.current, 0.25, delta);
          
          // Make camera look at the selected point
          const lookAtPos = new THREE.Vector3(...selectedPoint.position);
          camera.lookAt(lookAtPos);
        }
      } else {
        // Return to default orbit position when no subject is selected
        const defaultPos = new THREE.Vector3(0, 15, 25);
        targetPosition.current.lerp(defaultPos, 0.05);
        easing.damp3(camera.position, targetPosition.current, 0.25, delta);
      }
    });
    
    return null;
  };

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
      camera={{ position: [0, 15, 25], fov: 45 }}
      shadows
    >
      <color attach="background" args={['#071025']} />
      <fog attach="fog" args={['#071025', 35, 45]} />
      
      <CameraController />
      
      {/* Enhanced lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[5, 15, 5]} 
        intensity={1.2} 
        castShadow 
      />
      <directionalLight 
        position={[-5, 10, -5]} 
        intensity={0.6}
      />
      <hemisphereLight 
        args={['#8eb4ff', '#b97a7a', 0.5]} 
      />

      <group 
        rotation-y={rotation * (Math.PI / 180)}
        scale={[zoomLevel, zoomLevel, zoomLevel]}
      >
        <TerrainSystem 
          resolution={128}
          size={30}
          heightMultiplier={5}
        />
        <PathwaySystem 
          paths={pathPoints}
          onPathClick={(point) => {
            console.log('Clicked pathway point:', point);
            setActiveSubject(point.type);
          }}
        />
        
        {/* Floating region labels */}
        {pathPoints.slice(1).map((point, index) => (
          <Float 
            key={index}
            position={[point.position[0], point.position[1] + 2, point.position[2]]}
            speed={2} 
            rotationIntensity={0.2} 
            floatIntensity={0.5}
            visible={!activeSubject || activeSubject === point.type}
          >
            <Text
              color={getPointTypeColor(point.type)}
              fontSize={0.5}
              maxWidth={4}
              textAlign="center"
              anchorY="bottom"
            >
              {getBrainRegionShortName(point.type)}
            </Text>
          </Float>
        ))}
      </group>

      <Sky
        distance={450000}
        sunPosition={[10, 5, 5]}
        inclination={0.5}
        azimuth={0.25}
      />

      <ContactShadows
        position={[0, -0.5, 0]}
        opacity={0.4}
        scale={30}
        blur={2}
        far={10}
      />

      <OrbitControls
        enabled={!activeSubject}
        enablePan={false}
        minDistance={10}
        maxDistance={35}
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
