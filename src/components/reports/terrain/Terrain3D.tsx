
import React, { useRef, useEffect } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { pathPoints } from './TerrainMapping';

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
      camera.position.set(0, 8, 30);
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
  
  // Simple elevation function that creates mountains in the middle
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

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
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

// Waypoint markers for learning paths
function Waypoints() {
  return (
    <>
      {pathPoints.map((point, index) => (
        <group key={index} position={[point.position[0] * 5, point.position[1] * 3 + 2, point.position[2] * 5]}>
          <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="#ff9900" emissive="#ff6600" emissiveIntensity={0.5} />
          </mesh>
          <Text
            position={[0, 1.2, 0]}
            fontSize={0.7}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            {point.label}
          </Text>
        </group>
      ))}
    </>
  );
}

const Terrain3D: React.FC<TerrainProps> = ({ textureUrl, terrainData }) => {
  return (
    <div className="w-full h-full" style={{ minHeight: '400px' }}>
      <Canvas shadows>
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        <TerrainMesh textureUrl={textureUrl} terrainData={terrainData} />
        <Waypoints />
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={40}
        />
      </Canvas>
    </div>
  );
};

export default Terrain3D;
