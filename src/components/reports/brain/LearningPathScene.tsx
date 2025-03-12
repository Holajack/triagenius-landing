
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  ContactShadows,
  BakeShadows,
  Sky,
  useGLTF,
  useTexture
} from '@react-three/drei';
import * as THREE from 'three';
import { useRef, useEffect, useMemo } from 'react';

interface LearningPathSceneProps {
  activeSubject: string | null;
  setActiveSubject: (subject: string | null) => void;
  zoomLevel: number;
  rotation: number;
}

export const LearningPathScene = ({ activeSubject, setActiveSubject, zoomLevel, rotation }: LearningPathSceneProps) => {
  const TerrainImage = () => {
    // Reference for geometry manipulation
    const meshRef = useRef<THREE.Mesh>(null);

    // Create a heightmap-based terrain
    const createMountainousTerrain = () => {
      return (
        <>
          <mesh 
            ref={meshRef}
            position={[0, -2, 0]} 
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[30, 30, 128, 128]} />
            <meshStandardMaterial
              color="#5d4037"
              roughness={0.9}
              metalness={0.2}
              wireframe={false}
              onBeforeCompile={(shader) => {
                shader.uniforms.time = { value: 0 };
                shader.uniforms.terrainTexture = { value: null };
                
                shader.vertexShader = `
                  uniform float time;
                  varying float vElevation;
                  varying vec2 vUv;
                  ${shader.vertexShader}
                `;
                
                shader.vertexShader = shader.vertexShader.replace(
                  '#include <begin_vertex>',
                  `
                  #include <begin_vertex>
                  vUv = uv;
                  
                  // Create dramatic mountains and valleys
                  float amplitude = 5.0;  // Increased for higher mountains
                  float frequency = 0.2;
                  
                  // Main mountain range along the z-axis
                  float mainRidge = sin(position.x * 0.15) * cos(position.z * 0.1) * 5.0;
                  
                  // Secondary ridges and valleys
                  float noise1 = sin(position.x * frequency) * cos(position.z * frequency) * amplitude;
                  float noise2 = sin(position.x * frequency * 2.0 + 1.3) * cos(position.z * frequency * 2.0) * amplitude * 0.4;
                  float noise3 = sin(position.x * frequency * 4.0 + 2.7) * cos(position.z * frequency * 3.0) * amplitude * 0.2;
                  
                  // Plateau areas
                  float plateau = 
                    smoothstep(0.3, 0.32, sin(position.x * 0.1) * sin(position.z * 0.1)) * 
                    smoothstep(0.3, 0.32, cos(position.x * 0.1) * cos(position.z * 0.1)) * 2.0;
                  
                  // Create central mountain peaks
                  float centralPeak = 0.0;
                  float distFromCenter = length(position.xz) / 15.0;
                  if (distFromCenter < 0.5) {
                    centralPeak = (0.5 - distFromCenter) * 10.0 * (0.5 + 0.5 * sin(position.x * 0.5) * sin(position.z * 0.5));
                  }
                  
                  // Combine features
                  float elevation = mainRidge + noise1 + noise2 + noise3 + plateau + centralPeak;
                  
                  // Apply water level at lower parts
                  float waterLevel = -1.5;
                  float edgeWater = smoothstep(13.0, 15.0, abs(position.x)) + smoothstep(13.0, 15.0, abs(position.z));
                  elevation = mix(elevation, waterLevel, edgeWater);
                  
                  // Snow only on higher elevations
                  float snowLevel = 4.0;  // Set level where snow begins
                  
                  transformed.y += elevation;
                  vElevation = elevation;
                  
                  // Update normal for lighting
                  objectNormal = normalize(vec3(
                    noise1 - sin((position.x + 0.01) * frequency) * cos(position.z * frequency) * amplitude,
                    1.0,
                    noise1 - sin(position.x * frequency) * cos((position.z + 0.01) * frequency) * amplitude
                  ));
                  `
                );
                
                shader.fragmentShader = `
                  varying float vElevation;
                  varying vec2 vUv;
                  uniform sampler2D terrainTexture;
                  ${shader.fragmentShader}
                `;
                
                shader.fragmentShader = shader.fragmentShader.replace(
                  '#include <color_fragment>',
                  `
                  #include <color_fragment>
                  
                  // Enhanced color palette for realistic terrain
                  vec3 deepWater = vec3(0.05, 0.1, 0.2);
                  vec3 shallowWater = vec3(0.1, 0.3, 0.4);
                  vec3 beach = vec3(0.76, 0.7, 0.5);
                  vec3 lowGrass = vec3(0.18, 0.3, 0.05);
                  vec3 forest = vec3(0.05, 0.15, 0.02);
                  vec3 rock = vec3(0.4, 0.3, 0.25);
                  vec3 snowCap = vec3(0.9, 0.9, 0.95);
                  
                  // Normalize elevation between 0 and 1 for color mapping
                  float normalizedElevation = (vElevation + 2.0) / 8.0;  // Adjusted scale for larger range
                  normalizedElevation = clamp(normalizedElevation, 0.0, 1.0);
                  
                  // Noise for texture variation
                  float noisePattern = fract(sin(vUv.x * 100.0 + vUv.y * 40.0) * 5000.0);
                  float noisePattern2 = fract(sin(vUv.x * 50.0 + vUv.y * 60.0) * 1000.0);
                  
                  // Color based on elevation with sharper transitions
                  vec3 terrainColor;
                  
                  // Deep water
                  if (normalizedElevation < 0.1) {
                    terrainColor = deepWater;
                  }
                  // Shallow water
                  else if (normalizedElevation < 0.2) {
                    float t = (normalizedElevation - 0.1) / 0.1;
                    terrainColor = mix(deepWater, shallowWater, t);
                  }
                  // Beach/shore
                  else if (normalizedElevation < 0.25) {
                    float t = (normalizedElevation - 0.2) / 0.05;
                    terrainColor = mix(shallowWater, beach, t);
                  }
                  // Low grass
                  else if (normalizedElevation < 0.4) {
                    float t = (normalizedElevation - 0.25) / 0.15;
                    terrainColor = mix(beach, lowGrass, t);
                    // Add some variation to grass
                    terrainColor *= (0.9 + 0.2 * noisePattern);
                  }
                  // Forest
                  else if (normalizedElevation < 0.6) {
                    float t = (normalizedElevation - 0.4) / 0.2;
                    terrainColor = mix(lowGrass, forest, t);
                    // Add some variation to forest
                    terrainColor *= (0.8 + 0.4 * noisePattern2);
                  }
                  // Rock
                  else if (normalizedElevation < 0.85) {
                    float t = (normalizedElevation - 0.6) / 0.25;
                    terrainColor = mix(forest, rock, t);
                    // Add some variation to rock
                    terrainColor *= (0.9 + 0.2 * noisePattern);
                  }
                  // Snow caps
                  else {
                    float t = (normalizedElevation - 0.85) / 0.15;
                    terrainColor = mix(rock, snowCap, t);
                  }
                  
                  diffuseColor.rgb = terrainColor;
                  `
                );
                
                const animate = () => {
                  shader.uniforms.time.value += 0.01;
                  requestAnimationFrame(animate);
                };
                animate();
              }}
            />
          </mesh>

          {/* Add environmental features */}
          <group>
            {/* Deep water planes around the edges */}
            <mesh position={[0, -3.5, 15]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[40, 10]} />
              <meshStandardMaterial color="#05192d" transparent opacity={0.9} />
            </mesh>
            <mesh position={[0, -3.5, -15]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[40, 10]} />
              <meshStandardMaterial color="#05192d" transparent opacity={0.9} />
            </mesh>
            <mesh position={[15, -3.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[10, 40]} />
              <meshStandardMaterial color="#05192d" transparent opacity={0.9} />
            </mesh>
            <mesh position={[-15, -3.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[10, 40]} />
              <meshStandardMaterial color="#05192d" transparent opacity={0.9} />
            </mesh>

            {/* Trees - create more realistic tree clusters */}
            {generateTrees()}

            {/* Rocks - larger and more realistic rocks with varied sizes */}
            {generateRocks()}

            {/* Snow patches on peaks */}
            {generateSnowPatches()}
          </group>
        </>
      );
    };
    
    return createMountainousTerrain();
  };

  // Helper function to generate tree clusters
  const generateTrees = () => {
    const treePositions = [
      // Forest area 1 - dense cluster 
      ...Array.from({ length: 12 }).map(() => [
        -8 + Math.random() * 5,
        0,
        -6 + Math.random() * 5
      ]),
      // Forest area 2 - scattered trees
      ...Array.from({ length: 8 }).map(() => [
        5 + Math.random() * 7,
        0,
        -2 + Math.random() * 8
      ]),
      // Forest area 3 - hillside trees
      ...Array.from({ length: 10 }).map(() => [
        -4 + Math.random() * 12,
        0,
        3 + Math.random() * 6
      ])
    ];

    return treePositions.map((pos, i) => {
      const treeHeight = 0.7 + Math.random() * 0.7;
      const treeType = Math.random() > 0.7;
      
      return (
        <group key={`tree-${i}`} position={[pos[0], pos[1], pos[2]]}>
          {/* Tree trunk */}
          <mesh position={[0, treeHeight/2, 0]}>
            <cylinderGeometry args={[0.1, 0.15, treeHeight, 8]} />
            <meshStandardMaterial color="#3e2723" roughness={0.9} />
          </mesh>
          
          {/* Tree foliage - either conical (pine) or round (deciduous) */}
          {treeType ? (
            // Pine tree
            <group position={[0, treeHeight, 0]}>
              <mesh position={[0, 0.4, 0]}>
                <coneGeometry args={[0.6, 1.2, 8]} />
                <meshStandardMaterial color="#1b5e20" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.9, 0]}>
                <coneGeometry args={[0.4, 0.8, 8]} />
                <meshStandardMaterial color="#2e7d32" roughness={0.8} />
              </mesh>
            </group>
          ) : (
            // Deciduous tree
            <mesh position={[0, treeHeight + 0.5, 0]}>
              <sphereGeometry args={[0.6, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
              <meshStandardMaterial color="#388e3c" roughness={0.8} />
            </mesh>
          )}
        </group>
      );
    });
  };

  // Helper function to generate realistic rocks
  const generateRocks = () => {
    const rockPositions = [
      // Rocky area 1 - mountain top
      ...Array.from({ length: 5 }).map(() => [
        -2 + Math.random() * 4,
        3 + Math.random() * 2,
        -1 + Math.random() * 3
      ]),
      // Rocky area 2 - hillside
      ...Array.from({ length: 8 }).map(() => [
        -10 + Math.random() * 8,
        1 + Math.random() * 1.5,
        -8 + Math.random() * 6
      ]),
      // Rocky area 3 - scattered
      ...Array.from({ length: 10 }).map(() => [
        -12 + Math.random() * 24,
        0.5 + Math.random() * 0.5,
        -12 + Math.random() * 24
      ])
    ];

    return rockPositions.map((pos, i) => {
      const rockSize = 0.2 + Math.random() * 0.5;
      const rockType = Math.floor(Math.random() * 3);
      
      return (
        <mesh 
          key={`rock-${i}`}
          position={[pos[0], pos[1], pos[2]]}
          rotation={[
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          ]}
          castShadow
        >
          {rockType === 0 ? (
            <dodecahedronGeometry args={[rockSize, 1]} />
          ) : rockType === 1 ? (
            <octahedronGeometry args={[rockSize, 1]} />
          ) : (
            <boxGeometry args={[rockSize, rockSize*0.8, rockSize*1.2]} />
          )}
          <meshStandardMaterial 
            color={Math.random() > 0.5 ? "#616161" : "#424242"} 
            roughness={0.9} 
            metalness={0.1}
          />
        </mesh>
      );
    });
  };

  // Helper function to generate snow patches on peaks
  const generateSnowPatches = () => {
    const snowPositions = [
      // Snow on central mountain peak
      ...Array.from({ length: 6 }).map(() => [
        -1 + Math.random() * 2,
        4 + Math.random() * 1.5,
        -1 + Math.random() * 2
      ]),
      // Snow on secondary peaks
      ...Array.from({ length: 4 }).map(() => [
        -8 + Math.random() * 3,
        3 + Math.random() * 1,
        -6 + Math.random() * 3
      ])
    ];

    return snowPositions.map((pos, i) => (
      <mesh 
        key={`snow-${i}`}
        position={[pos[0], pos[1], pos[2]]}
        rotation={[-Math.PI / 2 + Math.random() * 0.2, 0, Math.random() * Math.PI]}
      >
        <circleGeometry args={[0.3 + Math.random() * 0.5, 8]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.3} metalness={0.1} />
      </mesh>
    ));
  };

  return (
    <Canvas
      gl={{ 
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 8, 15], fov: 45 }}
      frameloop="demand"
      shadows
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={['#f8f9fa']} />
      
      <fog attach="fog" args={['#e0f7fa', 30, 40]} />
      
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={1024}
      />
      <directionalLight 
        position={[-5, 8, -5]} 
        intensity={0.4} 
        castShadow={false}
      />

      <group 
        rotation-y={rotation * (Math.PI / 180)}
        scale={[zoomLevel, zoomLevel, zoomLevel]}
      >
        <TerrainImage />
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
      
      <BakeShadows />
    </Canvas>
  );
};
