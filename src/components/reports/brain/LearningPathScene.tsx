
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment,
  ContactShadows,
  Sky,
} from '@react-three/drei';
import { TerrainSystem } from '../terrain/TerrainSystem';
import { PathwaySystem } from '../terrain/PathwaySystem';

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
      camera={{ position: [0, 10, 20], fov: 45 }}
      shadows
    >
      <color attach="background" args={['#f8f9fa']} />
      <fog attach="fog" args={['#e0f7fa', 30, 40]} />
      
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={1.2} 
        castShadow 
      />
      <directionalLight 
        position={[-5, 8, -5]} 
        intensity={0.4}
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
        opacity={0.3}
        scale={20}
        blur={1.5}
        far={5}
      />

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={25}
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
