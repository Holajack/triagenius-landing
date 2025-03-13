
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
      // Apply zoom level - closer initial position
      camera.position.z = 15 / zoomLevel;
      camera.position.y = 10 / zoomLevel;
      
      // Apply rotation
      const radians = (rotation * Math.PI) / 180;
      camera.position.x = Math.sin(radians) * (15 / zoomLevel);
      camera.position.z = Math.cos(radians) * (15 / zoomLevel);
      
      // Look at the center of the scene
      camera.lookAt(0, 0, 0);
      
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
      {/* Ambient light for general illumination - brighter */}
      <ambientLight intensity={0.8} />
      
      {/* Directional light for shadows and highlights - brighter */}
      <directionalLight
        ref={directionalLightRef}
        intensity={1.5}
        position={[10, 15, 10]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* Hemisphere light for sky/ground color variation */}
      <hemisphereLight 
        args={[0x8cc7de, 0x5e6b70, 0.7]}
        position={[0, 50, 0]} 
      />
    </>
  );
};

export const MountainTerrainScene = ({ zoomLevel, rotation }: MountainTerrainSceneProps) => {
  console.log("Rendering MountainTerrainScene with", { zoomLevel, rotation });
  
  return (
    <Canvas
      shadows
      camera={{ position: [10, 10, 10], fov: 60 }}
      dpr={[1, 2]} // Responsive pixel ratio
      gl={{ antialias: true }}
      style={{ 
        background: '#e0e8f5',
        height: '100%',
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0
      }}
    >
      <fog attach="fog" args={['#e0e8f5', 50, 150]} />
      <color attach="background" args={['#e0e8f5']} />
      
      <CameraController zoomLevel={zoomLevel} rotation={rotation} />
      <SceneLighting />
      
      {/* High-resolution mountain terrain with debug helpers */}
      <axesHelper args={[5]} /> {/* XYZ axes to help with orientation */}
      <gridHelper args={[100, 100]} rotation={[0, 0, 0]} position={[0, -0.1, 0]} /> {/* Grid helper */}
      
      <MountainTerrain 
        size={80} 
        resolution={200} 
        heightMultiplier={15} 
        biomeType="mountains" 
      />
    </Canvas>
  );
};
