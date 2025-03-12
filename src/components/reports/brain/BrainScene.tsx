
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  PerspectiveCamera, 
  ContactShadows, 
  BakeShadows,
  useHelper,
} from '@react-three/drei';
import { MountainRegion } from './MountainRegion';
import { useRef } from 'react';
import * as THREE from 'three';

interface BrainSceneProps {
  activeRegion: string | null;
  setActiveRegion: (region: string | null) => void;
  zoomLevel: number;
  rotation: number;
}

export const BrainScene = ({ activeRegion, setActiveRegion, zoomLevel, rotation }: BrainSceneProps) => {
  const cognitiveRegions = [
    {
      id: "memory_retention",
      name: "Memory Retention",
      position: [-0.8, 0.7, 0.8] as [number, number, number],
      scale: [1.2, 1.1, 1.1] as [number, number, number],
      rotation: [0.2, 0, -0.1] as [number, number, number],
      color: "#D946EF",
      activity: 0.85,
      altitude: 1.2,
      geometry: "large_peak"
    },
    {
      id: "critical_thinking",
      name: "Critical Thinking",
      position: [0.8, 0.9, 0.3] as [number, number, number],
      scale: [1.0, 1.4, 0.9] as [number, number, number],
      rotation: [0, 0.2, 0] as [number, number, number],
      color: "#FEF7CD",
      activity: 0.7,
      altitude: 1.4,
      geometry: "sharp_peak"
    },
    {
      id: "problem_solving",
      name: "Problem Solving",
      position: [-0.5, 0.5, -0.7] as [number, number, number],
      scale: [1.0, 0.9, 1.0] as [number, number, number],
      rotation: [-0.3, 0, -0.1] as [number, number, number],
      color: "#F2FCE2",
      activity: 0.75,
      altitude: 0.9,
      geometry: "medium_peak"
    },
    {
      id: "creative_thinking",
      name: "Creativity",
      position: [0.3, 0.6, -1.1] as [number, number, number],
      scale: [0.9, 1.2, 0.9] as [number, number, number],
      rotation: [-0.4, 0, -0.1] as [number, number, number],
      color: "#D6BCFA",
      activity: 0.65,
      altitude: 1.2,
      geometry: "rolling_hill"
    },
    {
      id: "analytical_processing",
      name: "Analytical Processing",
      position: [0.5, 0.7, 0.8] as [number, number, number],
      scale: [1.2, 1.1, 1.1] as [number, number, number],
      rotation: [0.2, 0, 0.1] as [number, number, number],
      color: "#D946EF",
      activity: 0.85,
      altitude: 1.1,
      geometry: "plateau"
    },
    {
      id: "language_processing",
      name: "Language Processing",
      position: [-0.9, 0.4, 0.3] as [number, number, number],
      scale: [1.0, 0.8, 0.9] as [number, number, number],
      rotation: [0, -0.2, 0] as [number, number, number],
      color: "#FEF7CD",
      activity: 0.6,
      altitude: 0.8,
      geometry: "gentle_slope"
    },
    {
      id: "spatial_awareness",
      name: "Spatial Awareness",
      position: [0.5, 0.5, -0.7] as [number, number, number],
      scale: [1.0, 0.9, 1.0] as [number, number, number],
      rotation: [-0.3, 0, 0.1] as [number, number, number],
      color: "#F2FCE2",
      activity: 0.75,
      altitude: 0.9,
      geometry: "rocky_terrain"
    },
    {
      id: "visual_processing",
      name: "Visual Processing",
      position: [-0.3, 0.2, -1.1] as [number, number, number],
      scale: [0.9, 0.8, 0.9] as [number, number, number],
      rotation: [-0.4, 0, 0.1] as [number, number, number],
      color: "#D6BCFA",
      activity: 0.5,
      altitude: 0.8,
      geometry: "smooth_hill"
    },
    {
      id: "focus_concentration",
      name: "Focus & Concentration",
      position: [0, 1.0, -0.2] as [number, number, number],
      scale: [1.2, 1.5, 1.0] as [number, number, number],
      rotation: [0.3, 0, 0] as [number, number, number],
      color: "#8B5CF6",
      activity: 0.9,
      altitude: 1.5,
      geometry: "highest_peak"
    },
  ];

  const spotLightRef = useRef<THREE.SpotLight>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);

  const createTerrainBase = () => {
    return (
      <>
        {/* Base terrain */}
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 10, 64, 64]} />
          <meshPhysicalMaterial
            color="#8E9196"
            roughness={0.8}
            metalness={0.1}
            displacementScale={0.4}
            displacementBias={-0.2}
            onBeforeCompile={(shader) => {
              shader.uniforms.time = { value: 0 };
              shader.vertexShader = `
                uniform float time;
                ${shader.vertexShader}
              `.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                
                float frequency = 0.2;
                float amplitude = 0.4;
                
                // Base terrain
                transformed.y += sin(transformed.x * frequency * 2.0) * cos(transformed.z * frequency * 2.0) * amplitude * 0.5;
                
                // Add some variation
                transformed.y += sin(transformed.x * frequency * 4.0 + 1.5) * sin(transformed.z * frequency * 3.0 + 0.5) * amplitude * 0.25;
                transformed.y += cos(transformed.x * frequency * 3.0 + 2.0) * sin(transformed.z * frequency * 5.0 + 1.0) * amplitude * 0.125;
                
                // Flatten some areas 
                transformed.y *= 1.0 - smoothstep(0.0, 0.4, length(vec2(transformed.x, transformed.z) * 0.2));
                `
              );
            }}
          />
        </mesh>

        {/* Water surface */}
        <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[12, 12]} />
          <meshPhysicalMaterial
            color="#33C3F0"
            roughness={0.1}
            metalness={0.1}
            transmission={0.6}
            thickness={0.5}
            ior={1.4}
            transparent={true}
            opacity={0.6}
          />
        </mesh>

        {/* Sky dome */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[8, 32, 32]} />
          <meshBasicMaterial color="#D3E4FD" side={THREE.BackSide} />
        </mesh>

        {/* Clouds */}
        {[...Array(12)].map((_, i) => {
          const scale = 0.3 + Math.random() * 0.5;
          const x = (Math.random() - 0.5) * 8;
          const y = 2 + Math.random() * 2;
          const z = (Math.random() - 0.5) * 8;
          const position: [number, number, number] = [x, y, z];
          
          return (
            <mesh key={`cloud-${i}`} position={position} scale={[scale, scale * 0.6, scale]}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshBasicMaterial color="white" transparent opacity={0.8} />
            </mesh>
          );
        })}

        {/* Trees and vegetation scattered around */}
        {[...Array(30)].map((_, i) => {
          const height = 0.2 + Math.random() * 0.3;
          const x = (Math.random() - 0.5) * 8;
          const z = (Math.random() - 0.5) * 8;
          // Calculate y based on terrain height (simplified approximation)
          const y = -0.3 + Math.sin(x * 0.2 * 2.0) * Math.cos(z * 0.2 * 2.0) * 0.4 * 0.5;
          const position: [number, number, number] = [x, y, z];
          
          // Skip trees in water
          if (y < -0.35) return null;
          
          return (
            <group key={`tree-${i}`} position={position}>
              {/* Tree trunk */}
              <mesh position={[0, height/2, 0]} scale={[0.05, height, 0.05]}>
                <cylinderGeometry />
                <meshStandardMaterial color="#403E43" />
              </mesh>
              {/* Tree top */}
              <mesh position={[0, height + 0.15, 0]} scale={[0.2, 0.3, 0.2]}>
                <coneGeometry />
                <meshStandardMaterial color={Math.random() > 0.5 ? "#F2FCE2" : "#D6EFBF"} />
              </mesh>
            </group>
          );
        })}
      </>
    );
  };

  return (
    <Canvas
      camera={{ position: [0, 2, 5], fov: 60 }}
      style={{ background: 'transparent' }}
      shadows
    >
      <Environment preset="sunset" background={false} />
      <ambientLight intensity={0.5} />
      <directionalLight 
        ref={directionalLightRef}
        position={[5, 5, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <spotLight
        ref={spotLightRef}
        position={[-5, 5, 5]}
        angle={0.3}
        penumbra={0.8}
        intensity={1.5}
        castShadow
      />
      <hemisphereLight intensity={0.3} groundColor="#403E43" />

      <group 
        rotation-y={rotation * (Math.PI / 180)}
        scale={[zoomLevel, zoomLevel, zoomLevel]}
      >
        {/* Base terrain and environment */}
        {createTerrainBase()}

        {/* Cognitive regions as mountains */}
        {cognitiveRegions.map((region) => (
          <MountainRegion
            key={region.id}
            position={region.position}
            rotation={region.rotation}
            scale={region.scale}
            color={region.color}
            name={region.name}
            activity={region.activity}
            altitude={region.altitude}
            isActive={activeRegion === region.name}
            geometry={region.geometry}
            onClick={() => setActiveRegion(region.name === activeRegion ? null : region.name)}
          />
        ))}

        {/* Cognitive pathways connecting regions - neural networks */}
        {cognitiveRegions.map((startRegion, i) => 
          cognitiveRegions.slice(i + 1).map((endRegion, j) => {
            // Only connect some regions to avoid over-cluttering
            if (Math.random() > 0.6) return null;
            
            const midPointHeight = Math.max(startRegion.altitude, endRegion.altitude) * 0.4;
            
            // Create control points for curved path
            const startPoint = new THREE.Vector3(...startRegion.position);
            const endPoint = new THREE.Vector3(...endRegion.position);
            const midPoint = new THREE.Vector3(
              (startPoint.x + endPoint.x) / 2,
              -0.3 + midPointHeight,
              (startPoint.z + endPoint.z) / 2
            );
            
            const curve = new THREE.QuadraticBezierCurve3(
              startPoint,
              midPoint,
              endPoint
            );
            
            const points = curve.getPoints(20);
            
            return (
              <line key={`connection-${startRegion.id}-${endRegion.id}`}>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
                    count={points.length}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial 
                  color={new THREE.Color(startRegion.color).lerp(new THREE.Color(endRegion.color), 0.5)} 
                  linewidth={1}
                  transparent
                  opacity={0.5}
                />
              </line>
            );
          })
        )}

        {/* Study session indicators - particles rising from active regions */}
        {cognitiveRegions.filter(r => r.activity > 0.5).map((region) => {
          // Create particles based on activity level
          const particleCount = Math.floor(region.activity * 10);
          
          return [...Array(particleCount)].map((_, i) => {
            // Calculate random position near the region peak
            const jitter = 0.2;
            const xPos = region.position[0] + (Math.random() - 0.5) * jitter;
            const zPos = region.position[2] + (Math.random() - 0.5) * jitter;
            const yOffset = (i % 3) * 0.1; // Stagger heights
            const yPos = region.position[1] + region.altitude * 0.8 + yOffset;
            const position: [number, number, number] = [xPos, yPos, zPos];
            
            return (
              <mesh key={`particle-${region.id}-${i}`} position={position} scale={[0.05, 0.05, 0.05]}>
                <sphereGeometry args={[1, 8, 8]} />
                <meshBasicMaterial color={region.color} transparent opacity={0.7} />
              </mesh>
            );
          });
        })}
      </group>

      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.4}
        scale={10}
        blur={1.5}
        far={4}
      />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={10}
        autoRotate={!activeRegion}
        autoRotateSpeed={0.5}
        enableDamping={true}
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2 - 0.1} // Limit rotation to prevent seeing "under" the terrain
        minPolarAngle={0.1} // Limit rotation to prevent seeing "over" the scene too much
      />
      
      <BakeShadows />
    </Canvas>
  );
};
