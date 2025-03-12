
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  ContactShadows,
  BakeShadows,
  Sky,
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
          <planeGeometry args={[30, 30, 128, 128]} />
          <meshStandardMaterial
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
                
                // Terrain generation parameters
                float amplitude = 4.0; // Increased amplitude for more dramatic terrain
                float frequency = 0.2; // Adjusted frequency
                
                // Primary mountains (large features)
                float noise1 = sin(position.x * frequency) * cos(position.z * frequency) * amplitude;
                
                // Secondary ridges (medium features)
                float noise2 = sin(position.x * frequency * 3.0) * cos(position.z * frequency * 2.0) * amplitude * 0.4;
                
                // Fine details
                float noise3 = sin(position.x * frequency * 5.0) * cos(position.z * frequency * 5.0) * amplitude * 0.2;
                
                // Combine different noise layers
                float mountainHeight = noise1 + noise2 + noise3;
                
                // Create plateaus
                float plateauFactor = smoothstep(0.3, 0.7, sin(position.x * 0.1) * sin(position.z * 0.1));
                mountainHeight *= mix(1.0, 0.5, plateauFactor);
                
                // Create valleys
                float valleyDepth = smoothstep(-0.5, 0.5, sin(position.x * 0.05) + cos(position.z * 0.05));
                mountainHeight *= mix(0.2, 1.0, valleyDepth);
                
                // Apply height
                transformed.y += mountainHeight;
                
                // Calculate normal based on the terrain height
                objectNormal = normalize(vec3(
                  noise1 - sin((position.x + 0.01) * frequency) * cos(position.z * frequency) * amplitude,
                  1.0,
                  noise1 - sin(position.x * frequency) * cos((position.z + 0.01) * frequency) * amplitude
                ));
                
                vElevation = mountainHeight;
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
                
                // Calculate normalized elevation value for color mapping
                float normalizedElevation = (vElevation + 4.0) / 8.0; // Adjusted range for better color distribution
                
                // Enhanced color palette with more defined transitions
                vec3 waterColor = vec3(0.1, 0.4, 0.8);      // Deeper blue for water
                vec3 shoreColor = vec3(0.76, 0.7, 0.5);     // Sandy shore
                vec3 grassColor = vec3(0.3, 0.5, 0.2);      // Dark grass
                vec3 forestColor = vec3(0.2, 0.35, 0.1);    // Forest green
                vec3 rockColor = vec3(0.5, 0.5, 0.5);       // Gray rock
                vec3 snowColor = vec3(0.95, 0.95, 0.95);    // Snow white
                
                // More defined color mapping with smoother transitions
                vec3 terrainColor;
                if (normalizedElevation < 0.2) {
                    float t = normalizedElevation / 0.2;
                    terrainColor = mix(waterColor, shoreColor, smoothstep(0.0, 1.0, t));
                } else if (normalizedElevation < 0.4) {
                    float t = (normalizedElevation - 0.2) / 0.2;
                    terrainColor = mix(shoreColor, grassColor, smoothstep(0.0, 1.0, t));
                } else if (normalizedElevation < 0.6) {
                    float t = (normalizedElevation - 0.4) / 0.2;
                    terrainColor = mix(grassColor, forestColor, smoothstep(0.0, 1.0, t));
                } else if (normalizedElevation < 0.8) {
                    float t = (normalizedElevation - 0.6) / 0.2;
                    terrainColor = mix(forestColor, rockColor, smoothstep(0.0, 1.0, t));
                } else {
                    float t = (normalizedElevation - 0.8) / 0.2;
                    terrainColor = mix(rockColor, snowColor, smoothstep(0.0, 1.0, t));
                }
                
                // Apply the terrain color, completely replacing the default color
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

        <Sky
          distance={450000}
          sunPosition={[5, 3, 8]} // Adjusted sun position for better lighting
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
