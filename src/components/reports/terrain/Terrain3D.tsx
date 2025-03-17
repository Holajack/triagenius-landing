
import React, { useRef, useEffect } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
// Removed pathPoints import since we're removing the waypoints for now

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
      camera.position.set(0, 20, 40);
      camera.lookAt(0, 0, 0);
    }
  }, [camera]);

  // Create terrain geometry with more subdivisions for better detail
  const geometry = new THREE.PlaneGeometry(
    terrainData.groundParams.width,
    terrainData.groundParams.height,
    terrainData.groundParams.subdivisionsX,
    terrainData.groundParams.subdivisionsY
  );

  // Enhanced terrain generation algorithm
  const { array } = geometry.attributes.position;
  const maxHeight = terrainData.modelCoordinatesAltitudeBounds.max;
  
  // Generate more realistic mountain terrain
  for (let i = 0; i < array.length; i += 3) {
    const x = array[i];
    const z = array[i + 2];
    
    // Distance from center with adjusted scale
    const distance = Math.sqrt(x * x + z * z);
    const centerFactor = Math.max(0, 1 - distance / 35);
    
    // Multiple noise functions at different frequencies for more natural terrain
    const noise1 = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.5;
    const noise2 = Math.sin(x * 0.7) * Math.cos(z * 0.7) * 0.25;
    const noise3 = Math.sin(x * 1.4) * Math.cos(z * 1.4) * 0.125;
    const combinedNoise = noise1 + noise2 + noise3;
    
    // Mountain range along center with realistic peaks
    const mountainRidge = Math.exp(-Math.pow(x / 10, 2)) * maxHeight * 0.8;
    
    // Combined elevation with ridge and noise features
    array[i + 1] = (centerFactor * maxHeight * 0.6) + 
                  (combinedNoise * maxHeight * 0.4) + 
                  mountainRidge * (0.5 + Math.random() * 0.5);
  }

  // Apply texture and material settings
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial 
        map={texture}
        displacementScale={3}
        roughness={0.9}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Removed Waypoints component since we're not showing it for now

const Terrain3D: React.FC<TerrainProps> = ({ textureUrl, terrainData }) => {
  return (
    <div className="w-full h-full" style={{ minHeight: '400px' }}>
      <Canvas 
        shadows 
        camera={{ position: [0, 20, 40], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#000000'), 0);
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <color attach="background" args={['#111']} />
        <fog attach="fog" args={['#111', 40, 100]} />
        
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 25, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048} 
        />
        <directionalLight
          position={[-10, 15, -10]}
          intensity={0.8}
          color="#b3e0ff"
        />
        
        <React.Suspense fallback={null}>
          <TerrainMesh textureUrl={textureUrl} terrainData={terrainData} />
          {/* Removed Waypoints component here */}
        </React.Suspense>
        
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={60}
        />
      </Canvas>
    </div>
  );
};

export default Terrain3D;
