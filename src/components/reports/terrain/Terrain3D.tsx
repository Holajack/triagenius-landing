
import React, { useRef, useEffect } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface TerrainProps {
  textureUrl: string;
  terrainData: {
    bounds: {
      ne: [number, number];
      sw: [number, number];
    };
    resolution: {
      elevation: {
        tileSize: number;
        zoom: number;
      };
      texture: {
        tileSize: number;
        zoom: number;
      };
    };
    altitudeBoundsinMeters: {
      max: number;
      min: number;
      base: number;
    };
    modelCoordinatesAltitudeBounds: {
      max: number;
      min: number;
      base: number;
    };
    elevationCanvas: {
      width: number;
      height: number;
    };
    groundParams: {
      width: number;
      height: number;
      subdivisionsX: number;
      subdivisionsY: number;
    };
  };
}

function TerrainMesh({ textureUrl, terrainData }: TerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, textureUrl);
  const { camera } = useThree();
  
  // Set initial camera position on mount
  useEffect(() => {
    if (camera) {
      camera.position.set(0, 30, 50);
      camera.lookAt(0, 0, 0);
    }
  }, [camera]);

  // Create terrain geometry with more subdivisions for better detail
  const geometry = new THREE.PlaneGeometry(
    terrainData.groundParams.width,
    terrainData.groundParams.height,
    terrainData.groundParams.subdivisionsX / 4, // Reduce for better performance
    terrainData.groundParams.subdivisionsY / 4  // Reduce for better performance
  );

  // Enhanced terrain generation algorithm
  const { array } = geometry.attributes.position;
  const maxHeight = terrainData.modelCoordinatesAltitudeBounds.max * 1.5; // Increase height for better visibility
  
  // Generate more realistic mountain terrain
  for (let i = 0; i < array.length; i += 3) {
    const x = array[i];
    const z = array[i + 2];
    
    // Distance from center with adjusted scale
    const distance = Math.sqrt(x * x + z * z);
    const centerFactor = Math.max(0, 1 - distance / 35);
    
    // Multiple noise functions at different frequencies for more natural terrain
    const noise1 = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.6;
    const noise2 = Math.sin(x * 0.9) * Math.cos(z * 0.9) * 0.3;
    const noise3 = Math.sin(x * 1.6) * Math.cos(z * 1.6) * 0.15;
    const combinedNoise = noise1 + noise2 + noise3;
    
    // Mountain ridge along center
    const mountainRidge = Math.exp(-Math.pow(x / 15, 2)) * maxHeight * 0.9;
    
    // Combined elevation with ridge and noise features
    array[i + 1] = (centerFactor * maxHeight * 0.7) + 
                  (combinedNoise * maxHeight * 0.5) + 
                  mountainRidge * (0.7 + Math.random() * 0.3);
  }

  // Apply texture and material settings
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  
  return (
    <mesh 
      ref={meshRef} 
      rotation={[-Math.PI / 2, 0, 0]} 
      receiveShadow 
      castShadow
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial 
        map={texture}
        displacementScale={5}
        roughness={0.8}
        metalness={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

const Terrain3D: React.FC<TerrainProps> = ({ textureUrl, terrainData }) => {
  return (
    <div className="w-full h-full" style={{ minHeight: '400px' }}>
      <Canvas 
        shadows 
        camera={{ position: [0, 30, 50], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#e0e0e0'), 1); // Light background
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        {/* Light background color instead of dark */}
        <color attach="background" args={['#e0e0e0']} />
        <fog attach="fog" args={['#e0e0e0', 60, 120]} />
        
        {/* Improved lighting setup */}
        <ambientLight intensity={0.8} />
        <directionalLight 
          position={[10, 30, 10]} 
          intensity={1.8} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        <directionalLight
          position={[-10, 20, -10]}
          intensity={1.2}
          color="#b3e0ff"
        />
        <hemisphereLight 
          args={['#ffffff', '#8888ff', 0.7]} 
          position={[0, 50, 0]} 
        />
        
        <React.Suspense fallback={null}>
          <TerrainMesh textureUrl={textureUrl} terrainData={terrainData} />
          <Environment preset="sunset" />
        </React.Suspense>
        
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={10}
          maxDistance={80}
        />
      </Canvas>
    </div>
  );
};

export default Terrain3D;
