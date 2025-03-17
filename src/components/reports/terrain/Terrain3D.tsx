
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
      camera.position.set(0, 15, 35);
      camera.lookAt(0, 0, 0);
    }
  }, [camera]);

  // Create terrain geometry
  const geometry = new THREE.PlaneGeometry(
    terrainData.groundParams.width,
    terrainData.groundParams.height,
    terrainData.groundParams.subdivisionsX,
    terrainData.groundParams.subdivisionsY
  );

  // Simulate elevation - would ideally use actual elevation data
  const { array } = geometry.attributes.position;
  const maxHeight = terrainData.modelCoordinatesAltitudeBounds.max;
  
  // Terrain generation function using the terrainUtils
  for (let i = 0; i < array.length; i += 3) {
    const x = array[i];
    const z = array[i + 2];
    
    // Distance from center
    const distance = Math.sqrt(x * x + z * z);
    const centerFactor = Math.max(0, 1 - distance / 25);
    
    // Random noise for more natural appearance
    const noise = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.5 + 
                  Math.sin(x * 1.0) * Math.cos(z * 1.0) * 0.25;
    
    // Elevation
    array[i + 1] = (centerFactor * maxHeight * 0.7) + (noise * maxHeight * 0.3);
  }

  // Apply texture and material settings
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial 
        map={texture}
        displacementScale={2}
        roughness={0.8}
        metalness={0.1}
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
        camera={{ position: [0, 15, 35], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#000000'), 0);
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 30, 80]} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
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
          maxDistance={50}
        />
      </Canvas>
    </div>
  );
};

export default Terrain3D;
