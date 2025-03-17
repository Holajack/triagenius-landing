
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree, useFrame } from '@react-three/fiber';

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
  isNightMode: boolean;
}

// Utility function to generate terrain height
const generateHeight = (x: number, y: number, scale: number = 1): number => {
  return scale * (
    Math.sin(x * 0.5) * Math.cos(y * 0.5) + 
    Math.sin(x * 1.0) * Math.cos(y * 1.5) * 0.5 + 
    Math.sin(x * 2.0) * Math.cos(y * 3.0) * 0.25 + 
    Math.sin(x * 4.0) * Math.cos(y * 6.0) * 0.125
  );
};

function TerrainMesh({ textureUrl, terrainData, isNightMode }: TerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, scene } = useThree();
  const texture = useRef<THREE.Texture | null>(null);

  // Set initial camera position
  useEffect(() => {
    if (camera) {
      camera.position.set(0, 30, 50);
      camera.lookAt(0, 0, 0);
    }
  }, [camera]);

  // Create terrain geometry
  useEffect(() => {
    if (!meshRef.current) return;

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(textureUrl, (loadedTexture) => {
      loadedTexture.wrapS = loadedTexture.wrapT = THREE.RepeatWrapping;
      loadedTexture.repeat.set(1, 1);
      loadedTexture.anisotropy = 16;
      texture.current = loadedTexture;
      
      if (meshRef.current) {
        (meshRef.current.material as THREE.MeshStandardMaterial).map = loadedTexture;
        (meshRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
      }
    });

    // Create geometry with specified parameters
    const geometry = new THREE.PlaneGeometry(
      terrainData.groundParams.width,
      terrainData.groundParams.height,
      Math.min(400, terrainData.groundParams.subdivisionsX),
      Math.min(462, terrainData.groundParams.subdivisionsY)
    );

    // Apply elevation data
    const { array } = geometry.attributes.position;
    const elevationExaggeration = 3;
    const maxAltitude = terrainData.modelCoordinatesAltitudeBounds.max;
    
    for (let i = 0; i < array.length; i += 3) {
      const x = array[i];
      const z = array[i + 2];
      
      // Normalize coordinates for pattern generation
      const nx = (x / terrainData.groundParams.width) * 10 + 5;
      const nz = (z / terrainData.groundParams.height) * 10 + 5;
      
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
      
      // Calculate combined height
      let height = (baseNoise + detailNoise + microDetail) * maxAltitude * 0.8;
      height += mountainRidgeFactor * maxAltitude * 0.5;
      height += snowCapEffect * maxAltitude * 0.3;
      
      // Apply elevation exaggeration
      height *= elevationExaggeration;
      
      // Update vertex position
      array[i + 1] = height;
    }

    // Calculate normals for better lighting
    geometry.computeVertexNormals();
    
    // Apply geometry to mesh
    meshRef.current.geometry = geometry;
  }, [textureUrl, terrainData]);

  // Update lighting based on night mode
  useEffect(() => {
    if (!scene) return;
    
    // Find lights in the scene
    scene.traverse((object) => {
      if (object instanceof THREE.DirectionalLight) {
        object.intensity = isNightMode ? 0.3 : 1.0;
      }
      if (object instanceof THREE.AmbientLight) {
        object.intensity = isNightMode ? 0.2 : 0.7;
        object.color.set(isNightMode ? 0x001133 : 0x404040);
      }
      if (object instanceof THREE.HemisphereLight) {
        object.intensity = isNightMode ? 0.3 : 0.7;
      }
    });
  }, [isNightMode, scene]);

  return (
    <mesh 
      ref={meshRef} 
      rotation={[-Math.PI / 2, 0, 0]} 
      receiveShadow 
      castShadow
    >
      <planeGeometry args={[1, 1, 1, 1]} /> {/* Placeholder, replaced in effect */}
      <meshStandardMaterial 
        color={0xffffff}
        roughness={0.7}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Dust particles component
function DustParticles({ isNightMode }: { isNightMode: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  useEffect(() => {
    if (!pointsRef.current) return;
    
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 40 + 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    
    pointsRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  }, []);
  
  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0005;
    }
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial 
        color={isNightMode ? 0x335588 : 0xaaaaaa} 
        size={0.1} 
        transparent 
        opacity={isNightMode ? 0.7 : 0.5}
      />
    </points>
  );
}

const Terrain3D: React.FC<TerrainProps> = ({ textureUrl, terrainData, isNightMode }) => {
  return (
    <div className="w-full h-full" style={{ minHeight: '400px' }}>
      <Canvas 
        shadows 
        camera={{ position: [0, 30, 50], fov: 45 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(isNightMode ? '#001425' : '#e6f0ff'), 1);
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        {/* Background color based on night mode */}
        <color attach="background" args={[isNightMode ? '#001425' : '#e6f0ff']} />
        <fog attach="fog" args={[isNightMode ? '#001425' : '#e6f0ff', 80, 150]} />
        
        {/* Enhanced lighting setup */}
        <ambientLight intensity={isNightMode ? 0.2 : 0.7} color={isNightMode ? '#001133' : '#404040'} />
        <directionalLight 
          position={[10, 10, 10]}
          intensity={isNightMode ? 0.3 : 1.0} 
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
          intensity={isNightMode ? 0.2 : 0.8}
          color={isNightMode ? '#001133' : '#bbe1ff'}
        />
        <hemisphereLight 
          args={[isNightMode ? '#001133' : '#ffffff', isNightMode ? '#000033' : '#77aaff', isNightMode ? 0.3 : 0.7]} 
          position={[0, 50, 0]} 
        />
        
        <React.Suspense fallback={null}>
          <TerrainMesh textureUrl={textureUrl} terrainData={terrainData} isNightMode={isNightMode} />
          <DustParticles isNightMode={isNightMode} />
        </React.Suspense>
        
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={15}
          maxDistance={100}
          dampingFactor={0.05}
          enableDamping={true}
        />
      </Canvas>
    </div>
  );
};

export default Terrain3D;
