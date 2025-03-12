
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
        {/* Mountainous terrain */}
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[30, 30, 128, 128]} />
          <meshStandardMaterial
            roughness={0.9}
            metalness={0.1}
            wireframe={false}
            onBeforeCompile={(shader) => {
              shader.uniforms.time = { value: 0 };
              
              // Add time and color uniforms
              shader.vertexShader = `
                uniform float time;
                varying float vElevation;
                ${shader.vertexShader}
              `;
              
              // Pass the elevation to the fragment shader
              shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                
                // Mountain generation
                float amplitude = 2.0;
                float frequency = 0.2;
                
                // Primary mountains
                float noise1 = sin(position.x * frequency) * cos(position.z * frequency) * amplitude;
                
                // Secondary ridges
                float noise2 = sin(position.x * frequency * 2.0 + 0.5) * sin(position.z * frequency * 2.0) * amplitude * 0.5;
                
                // Tertiary details
                float noise3 = sin(position.x * frequency * 4.0) * sin(position.z * frequency * 4.0) * amplitude * 0.25;
                
                // Add different frequencies of noise for more natural look
                float mountainHeight = noise1 + noise2 + noise3;
                
                // Create some flat areas occasionally
                float flatteningFactor = smoothstep(0.4, 0.6, sin(position.x * 0.05) * sin(position.z * 0.05) + 0.5);
                mountainHeight *= flatteningFactor;
                
                // Valleys
                float valleyFactor = smoothstep(0.0, 0.3, abs(sin(position.x * 0.1) * sin(position.z * 0.1)));
                mountainHeight *= valleyFactor;
                
                // Apply height
                transformed.y += mountainHeight;
                
                // Calculate normal based on the terrain height for proper lighting
                objectNormal = normalize(vec3(
                  noise1 - sin((position.x + 0.01) * frequency) * cos(position.z * frequency) * amplitude,
                  1.0,
                  noise1 - sin(position.x * frequency) * cos((position.z + 0.01) * frequency) * amplitude
                ));
                
                // Pass elevation to fragment shader
                vElevation = mountainHeight;
                `
              );
              
              // Add varying to fragment shader
              shader.fragmentShader = `
                varying float vElevation;
                ${shader.fragmentShader}
              `;
              
              // Add color calculation based on elevation
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                `
                #include <color_fragment>
                
                // Color the terrain based on elevation
                float normalizedElevation = (vElevation + 2.0) / 4.0; // Normalize to 0-1 range
                
                // Base colors
                vec3 lowColor = vec3(0.53, 0.81, 0.92);    // Light blue (#87CEEB) for water/valleys
                vec3 midColor = vec3(0.33, 0.55, 0.0);     // Forest green (#547700) for mid elevations
                vec3 highColor = vec3(0.63, 0.63, 0.63);   // Light gray (#A1A1A1) for peaks
                vec3 peakColor = vec3(0.99, 0.99, 0.99);   // White (#FFFFFF) for snow caps
                
                // Blend colors based on elevation
                vec3 terrainColor;
                if (normalizedElevation < 0.3) {
                  // Blend from low to mid
                  float t = normalizedElevation / 0.3;
                  terrainColor = mix(lowColor, midColor, t);
                } else if (normalizedElevation < 0.75) {
                  // Blend from mid to high
                  float t = (normalizedElevation - 0.3) / 0.45;
                  terrainColor = mix(midColor, highColor, t);
                } else {
                  // Blend from high to peak
                  float t = (normalizedElevation - 0.75) / 0.25;
                  terrainColor = mix(highColor, peakColor, t);
                }
                
                // Apply the color
                diffuseColor.rgb = terrainColor;
                `
              );
              
              // Keep track of the time for animation
              const animate = () => {
                shader.uniforms.time.value += 0.001;
                requestAnimationFrame(animate);
              };
              
              // Start animation
              animate();
            }}
          />
        </mesh>

        {/* Sky with mountains */}
        <Sky
          distance={450000}
          sunPosition={[0, 1, 0]}
          inclination={0.6}
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
