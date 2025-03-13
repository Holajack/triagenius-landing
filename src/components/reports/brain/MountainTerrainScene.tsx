
import { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Sky } from '@react-three/drei';
import { MountainTerrain } from '../terrain/MountainTerrain';
import * as THREE from 'three';

interface MountainTerrainSceneProps {
  zoomLevel: number;
  rotation: number;
  biomeType?: 'mountains' | 'desert' | 'forest' | 'mixed';
}

// Camera controller for managing zoom and rotation
const CameraController = ({ zoomLevel, rotation }: { zoomLevel: number; rotation: number }) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  
  useEffect(() => {
    if (controlsRef.current) {
      // Position camera to better view the terrain - aligned with reference images
      camera.position.set(
        Math.sin(rotation * Math.PI / 180) * (30 / zoomLevel),
        20 / zoomLevel,  // Higher to see more of the terrain
        Math.cos(rotation * Math.PI / 180) * (30 / zoomLevel)
      );
      
      // Look at center point slightly above terrain for better perspective
      camera.lookAt(0, 2, 0);
      
      controlsRef.current.update();
    }
  }, [zoomLevel, rotation, camera]);
  
  return (
    <OrbitControls 
      ref={controlsRef} 
      args={[camera, gl.domElement]} 
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={10}
      maxDistance={100}
      minPolarAngle={Math.PI * 0.1} // Limit how low camera can go
      maxPolarAngle={Math.PI * 0.45} // Limit how high camera can go
    />
  );
};

// Enhanced lighting for dramatic mountain shadows like in the reference images
const SceneLighting = () => {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  
  useFrame(({ clock }) => {
    if (directionalLightRef.current) {
      // Slowly rotate the light for dynamic shadows similar to reference images
      const time = clock.getElapsedTime() * 0.05;
      directionalLightRef.current.position.x = Math.sin(time) * 15;
      directionalLightRef.current.position.z = Math.cos(time) * 15;
    }
  });
  
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.7} color="#f5f5f5" />
      
      {/* Main directional light casting shadows like in reference images */}
      <directionalLight
        ref={directionalLightRef}
        intensity={2.5}
        position={[15, 25, 10]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        color="#fff9e8" // Warm light like in references
      />
      
      {/* Secondary fill light for detailed illumination */}
      <directionalLight 
        intensity={0.8} 
        position={[-15, 15, -10]} 
        color="#cce0ff" // Cool light for contrast
      />
      
      {/* Hemisphere light for more natural color balance */}
      <hemisphereLight 
        args={[0x8cb0c9, 0x583e31, 0.8]} // Sky color, ground color, intensity
        position={[0, 50, 0]} 
      />
    </>
  );
};

export const MountainTerrainScene = ({ 
  zoomLevel, 
  rotation, 
  biomeType = 'mountains' 
}: MountainTerrainSceneProps) => {
  console.log("Rendering MountainTerrainScene with", { zoomLevel, rotation, biomeType });
  
  return (
    <Canvas
      shadows
      dpr={[1, 2]} // Responsive pixel ratio
      camera={{ position: [0, 20, 20], fov: 60 }}
      gl={{ 
        antialias: true,
        alpha: false,
        logarithmicDepthBuffer: true, // Better depth perception
      }}
      style={{ 
        background: '#e0e8f5',
        height: '100%',
        width: '100%',
        display: 'block',
        position: 'absolute',
        top: 0,
        left: 0
      }}
    >
      {/* Sky and environment */}
      <Sky
        distance={450000}
        sunPosition={[15, 20, 10]}
        inclination={0.5}
        azimuth={0.25}
        turbidity={10}
        rayleigh={2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      
      {/* Scene fog like in the distance of the reference images */}
      <fog attach="fog" args={['#e0e8f5', 60, 120]} />
      <color attach="background" args={['#e0e8f5']} />
      
      <CameraController zoomLevel={zoomLevel} rotation={rotation} />
      <SceneLighting />
      
      {/* The terrain mesh - with increased size for better detail */}
      <MountainTerrain 
        size={80} 
        resolution={120} // ~90,000 vertices for desktop
        heightMultiplier={15} 
        biomeType={biomeType}
        textureQuality="high"
      />
    </Canvas>
  );
};
