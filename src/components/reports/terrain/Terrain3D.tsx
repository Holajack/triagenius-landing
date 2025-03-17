
import React, { useRef, useEffect } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { generateHeight } from './shaders/terrainUtils';

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
  
  // Set initial camera position for better view of the terrain
  useEffect(() => {
    if (camera) {
      camera.position.set(0, 30, 50);
      camera.lookAt(0, 0, 0);
    }
  }, [camera]);

  // Create detailed terrain geometry with controlled subdivisions for performance
  const geometry = new THREE.PlaneGeometry(
    terrainData.groundParams.width,
    terrainData.groundParams.height,
    Math.min(150, terrainData.groundParams.subdivisionsX), // Limit subdivisions for performance
    Math.min(150, terrainData.groundParams.subdivisionsY)  // Limit subdivisions for performance
  );

  // Apply elevation data using the parameters provided
  const { array } = geometry.attributes.position;
  const elevationExaggeration = 3; // From the specifications
  const maxAltitude = terrainData.modelCoordinatesAltitudeBounds.max;
  
  // Generate terrain with elevation data
  for (let i = 0; i < array.length; i += 3) {
    const x = array[i];
    const z = array[i + 2];
    
    // Normalize coordinates for pattern generation
    const nx = (x / terrainData.groundParams.width) * 10 + 5; // Offset to center
    const nz = (z / terrainData.groundParams.height) * 10 + 5; // Offset to center
    
    // Multi-layered noise for realistic terrain
    const baseNoise = generateHeight(nx, nz, 1.0);
    const detailNoise = generateHeight(nx * 2, nz * 2, 0.5) * 0.5;
    const microDetail = generateHeight(nx * 4, nz * 4, 0.25) * 0.25;
    
    // Central mountain ridge effect
    const distanceFromCenter = Math.sqrt(x * x + z * z) / 
                              Math.max(terrainData.groundParams.width, terrainData.groundParams.height);
    const mountainRidgeFactor = Math.exp(-Math.pow(distanceFromCenter * 2, 2)) * 1.5;
    
    // Snow-capped peaks for higher elevations
    const snowCapEffect = baseNoise > 0.7 ? (baseNoise - 0.7) * 1.5 : 0;
    
    // Calculate combined height with all factors
    let height = (baseNoise + detailNoise + microDetail) * maxAltitude * 0.8;
    height += mountainRidgeFactor * maxAltitude * 0.5;
    height += snowCapEffect * maxAltitude * 0.3;
    
    // Apply elevation exaggeration
    height *= elevationExaggeration;
    
    // Update vertex position
    array[i + 1] = height;
  }

  // Calculate smooth normals for better lighting
  geometry.computeVertexNormals();

  // Optimize texture settings
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.anisotropy = 16; // Improve texture sharpness
  
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
        displacementScale={0} // We're manually displacing vertices
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
        camera={{ position: [0, 30, 50], fov: 45 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#e6f0ff'), 1); // Light blue-tinted background
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        {/* Light background color */}
        <color attach="background" args={['#e6f0ff']} />
        <fog attach="fog" args={['#e6f0ff', 80, 150]} />
        
        {/* Enhanced lighting setup for Rocky Mountains */}
        <ambientLight intensity={0.7} />
        <directionalLight 
          position={[50, 100, 50]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        <directionalLight
          position={[-30, 50, -30]}
          intensity={0.8}
          color="#bbe1ff"
        />
        <hemisphereLight 
          args={['#ffffff', '#77aaff', 0.7]} 
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
          maxPolarAngle={Math.PI / 2.1}
          minDistance={15}
          maxDistance={100}
        />
      </Canvas>
    </div>
  );
};

export default Terrain3D;
