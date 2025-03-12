
import { Canvas, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment,
  ContactShadows,
  Sky,
  useHelper,
  PerspectiveCamera
} from '@react-three/drei';
import { TerrainSystem } from '../terrain/TerrainSystem';
import { PathwaySystem } from '../terrain/PathwaySystem';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

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
  // Path points to match the mountain peaks defined in the vertex shader
  const pathPoints = [
    { position: [0, 0, 0] as [number, number, number], type: 'basecamp' as const },
    { position: [-10, 4, 8] as [number, number, number], type: 'milestone' as const },
    { position: [12, 5, 6] as [number, number, number], type: 'checkpoint' as const },
    { position: [8, 4, -10] as [number, number, number], type: 'milestone' as const },
    { position: [-5, 4, -12] as [number, number, number], type: 'checkpoint' as const },
    { position: [-12, 4, -3] as [number, number, number], type: 'milestone' as const },
    { position: [5, 5, 12] as [number, number, number], type: 'checkpoint' as const },
  ];

  return (
    <Canvas
      gl={{ 
        antialias: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 15, 25], fov: 45 }}
      shadows
    >
      <color attach="background" args={['#f0f4f8']} />
      <fog attach="fog" args={['#e0f7fa', 35, 45]} />
      
      {/* Improved lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[5, 15, 5]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
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
      </group>

      <Sky
        distance={450000}
        sunPosition={[10, 5, 5]}
        inclination={0.5}
        azimuth={0.25}
        rayleigh={0.5}
        turbidity={8}
      />

      <ContactShadows
        position={[0, -0.5, 0]}
        opacity={0.4}
        scale={30}
        blur={2}
        far={10}
      />

      <OrbitControls
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
