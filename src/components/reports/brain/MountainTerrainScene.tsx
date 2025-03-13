
import { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MountainTerrain } from '../terrain/MountainTerrain';
import * as THREE from 'three';

interface MountainTerrainSceneProps {
  zoomLevel: number;
  rotation: number;
}

// Camera controller for managing zoom and rotation
const CameraController = ({ zoomLevel, rotation }: { zoomLevel: number; rotation: number }) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  
  useEffect(() => {
    if (controlsRef.current) {
      // Apply zoom level
      camera.position.z = 20 / zoomLevel;
      camera.position.y = 15 / zoomLevel;
      
      // Apply rotation
      const radians = (rotation * Math.PI) / 180;
      camera.position.x = Math.sin(radians) * (20 / zoomLevel);
      camera.position.z = Math.cos(radians) * (20 / zoomLevel);
      
      controlsRef.current.update();
    }
  }, [zoomLevel, rotation, camera]);
  
  return <OrbitControls ref={controlsRef} args={[camera, gl.domElement]} />;
};

// Lighting setup for the scene
const SceneLighting = () => {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  
  useFrame(() => {
    if (directionalLightRef.current) {
      // Slowly rotate the light for dynamic shadows
      const light = directionalLightRef.current;
      light.position.x = Math.sin(Date.now() * 0.0001) * 10;
      light.position.z = Math.cos(Date.now() * 0.0001) * 10;
    }
  });
  
  return (
    <>
      {/* Ambient light for general illumination */}
      <ambientLight intensity={0.5} />
      
      {/* Directional light for shadows and highlights */}
      <directionalLight
        ref={directionalLightRef}
        intensity={1.2}
        position={[10, 10, 10]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* Hemisphere light for sky/ground color variation */}
      <hemisphereLight 
        args={[0x8cc7de, 0x5e6b70, 0.5]}
        position={[0, 50, 0]} 
      />
    </>
  );
};

export const MountainTerrainScene = ({ zoomLevel, rotation }: MountainTerrainSceneProps) => {
  return (
    <Canvas
      shadows
      camera={{ position: [15, 15, 15], fov: 45 }}
      dpr={[1, 2]} // Responsive pixel ratio
      gl={{ antialias: true }}
      style={{ background: '#e0e8f5' }} // Set background explicitly
    >
      <fog attach="fog" args={['#e0e8f5', 30, 100]} />
      <color attach="background" args={['#e0e8f5']} />
      
      <CameraController zoomLevel={zoomLevel} rotation={rotation} />
      <SceneLighting />
      
      {/* High-resolution mountain terrain */}
      <MountainTerrain 
        size={100} 
        resolution={300} 
        heightMultiplier={20} 
        biomeType="mountains" 
      />
    </Canvas>
  );
};
