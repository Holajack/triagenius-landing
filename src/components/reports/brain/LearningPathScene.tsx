
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  ContactShadows,
  BakeShadows,
  Sky,
  useGLTF
} from '@react-three/drei';
import * as THREE from 'three';

interface LearningPathSceneProps {
  activeSubject: string | null;
  setActiveSubject: (subject: string | null) => void;
  zoomLevel: number;
  rotation: number;
}

export const LearningPathScene = ({ activeSubject, setActiveSubject, zoomLevel, rotation }: LearningPathSceneProps) => {
  const createMountainousTerrain = () => {
    return (
      <>
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[30, 30, 64, 64]} />
          <meshStandardMaterial
            color="#4a8505"
            roughness={0.9}
            metalness={0.1}
            wireframe={false}
            onBeforeCompile={(shader) => {
              shader.uniforms.time = { value: 0 };
              
              shader.vertexShader = `
                uniform float time;
                varying float vElevation;
                ${shader.vertexShader}
              `;
              
              shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                
                // Base terrain remains flat but with slight variations
                float amplitude = 2.0;
                float frequency = 0.15;
                
                // Create gentle hills and valleys
                float noise1 = sin(position.x * frequency) * cos(position.z * frequency) * amplitude;
                float noise2 = sin(position.x * frequency * 2.0) * cos(position.z * frequency * 2.0) * amplitude * 0.3;
                
                // Edge water features
                float edgeWater = smoothstep(14.0, 15.0, abs(position.x)) + smoothstep(14.0, 15.0, abs(position.z));
                float waterDepth = -1.0;
                
                // Combine features
                float elevation = noise1 + noise2;
                elevation = mix(elevation, waterDepth, edgeWater);
                
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
                ${shader.fragmentShader}
              `;
              
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                `
                #include <color_fragment>
                
                // Normalized elevation for coloring
                float normalizedElevation = (vElevation + 2.0) / 4.0;
                
                // Color palette
                vec3 baseGreen = vec3(0.29, 0.52, 0.03);  // Base terrain green
                vec3 waterColor = vec3(0.1, 0.4, 0.8);    // Deep blue water
                vec3 shoreColor = vec3(0.76, 0.7, 0.5);   // Sandy shore
                vec3 rockColor = vec3(0.5, 0.5, 0.5);     // Gray rocks
                vec3 snowColor = vec3(0.95, 0.95, 0.95);  // Snow caps
                
                // Color blending
                vec3 terrainColor = baseGreen;  // Start with base green
                
                // Add water at the edges and low points
                if (normalizedElevation < 0.2) {
                    float t = smoothstep(0.0, 0.2, normalizedElevation);
                    terrainColor = mix(waterColor, shoreColor, t);
                } else if (normalizedElevation > 0.8) {
                    float t = smoothstep(0.8, 1.0, normalizedElevation);
                    terrainColor = mix(baseGreen, rockColor, t);
                    t = smoothstep(0.9, 1.0, normalizedElevation);
                    terrainColor = mix(terrainColor, snowColor, t);
                }
                
                diffuseColor.rgb = terrainColor;
                `
              );
              
              const animate = () => {
                shader.uniforms.time.value += 0.001;
                requestAnimationFrame(animate);
              };
              animate();
            }}
          />
        </mesh>

        {/* Add environmental objects */}
        <group>
          {/* Water planes at edges */}
          <mesh position={[0, -1.5, 15]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[32, 4]} />
            <meshStandardMaterial color="#2196f3" transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, -1.5, -15]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[32, 4]} />
            <meshStandardMaterial color="#2196f3" transparent opacity={0.8} />
          </mesh>
          <mesh position={[15, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4, 32]} />
            <meshStandardMaterial color="#2196f3" transparent opacity={0.8} />
          </mesh>
          <mesh position={[-15, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4, 32]} />
            <meshStandardMaterial color="#2196f3" transparent opacity={0.8} />
          </mesh>

          {/* Trees */}
          {Array.from({ length: 20 }).map((_, i) => (
            <group key={i} position={[
              Math.random() * 20 - 10,
              0,
              Math.random() * 20 - 10
            ]}>
              <mesh position={[0, 1, 0]}>
                <coneGeometry args={[0.5, 1.5, 8]} />
                <meshStandardMaterial color="#2d5a27" />
              </mesh>
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 1]} />
                <meshStandardMaterial color="#3e2723" />
              </mesh>
            </group>
          ))}

          {/* Rocks */}
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh 
              key={`rock-${i}`}
              position={[
                Math.random() * 24 - 12,
                0,
                Math.random() * 24 - 12
              ]}
              rotation={[
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
              ]}
            >
              <octahedronGeometry args={[0.3 + Math.random() * 0.3]} />
              <meshStandardMaterial color="#757575" roughness={0.9} />
            </mesh>
          ))}
        </group>

        <Sky
          distance={450000}
          sunPosition={[5, 3, 8]}
          inclination={0.5}
          azimuth={0.25}
        />
      </>
    );
  };

  return (
    <Canvas
      gl={{ 
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 5, 10], fov: 50 }}
      frameloop="demand"
      shadows={false}
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={['#f8f9fa']} />
      
      <Environment preset="sunset" background={false} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />

      <group 
        rotation-y={rotation * (Math.PI / 180)}
        scale={[zoomLevel, zoomLevel, zoomLevel]}
      >
        {createMountainousTerrain()}
      </group>

      <ContactShadows
        position={[0, -0.5, 0]}
        opacity={0.3}
        scale={10}
        blur={1.5}
        far={4}
      />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={20}
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
