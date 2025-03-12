
import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface TerrainSystemProps {
  resolution?: number;
  size?: number;
  heightMultiplier?: number;
}

export const TerrainSystem = ({
  resolution = 128,
  size = 30,
  heightMultiplier = 5
}: TerrainSystemProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create heightmap-based terrain with colors
  const terrainMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
    },
    vertexShader: `
      uniform float time;
      varying vec2 vUv;
      varying float vElevation;
      
      float getElevation(vec2 position) {
        // Create dramatic mountains and valleys
        float amplitude = ${heightMultiplier}.0;
        float frequency = 0.2;
        
        // Main mountain ranges
        float mainRidge = sin(position.x * 0.15) * cos(position.z * 0.1) * 5.0;
        
        // Add complexity with multiple noise layers
        float noise1 = sin(position.x * frequency) * cos(position.z * frequency) * amplitude;
        float noise2 = sin(position.x * frequency * 2.0 + 1.3) * cos(position.z * frequency * 2.0) * amplitude * 0.4;
        float noise3 = sin(position.x * frequency * 4.0 + 2.7) * cos(position.z * frequency * 3.0) * amplitude * 0.2;
        
        // Create plateau areas
        float plateau = smoothstep(0.3, 0.32, sin(position.x * 0.1) * sin(position.z * 0.1)) * 2.0;
        
        // Combine all elevation components
        return mainRidge + noise1 + noise2 + noise3 + plateau;
      }
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        
        // Calculate elevation
        float elevation = getElevation(pos.xz);
        pos.y += elevation;
        
        vElevation = elevation;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vElevation;
      
      void main() {
        // Define elevation thresholds
        float snowLevel = 3.0;
        float rockLevel = 1.5;
        float grassLevel = 0.5;
        
        // Define colors directly
        vec3 snowColor = vec3(0.95, 0.95, 0.97);
        vec3 rockColor = vec3(0.5, 0.5, 0.55);
        vec3 grassColor = vec3(0.2, 0.6, 0.3);
        vec3 waterColor = vec3(0.1, 0.3, 0.8);
        
        // Blend colors based on elevation
        vec3 terrainColor;
        
        if (vElevation > snowLevel) {
          terrainColor = snowColor;
        } else if (vElevation > rockLevel) {
          float blend = (vElevation - rockLevel) / (snowLevel - rockLevel);
          terrainColor = mix(rockColor, snowColor, blend);
        } else if (vElevation > grassLevel) {
          float blend = (vElevation - grassLevel) / (rockLevel - grassLevel);
          terrainColor = mix(grassColor, rockColor, blend);
        } else {
          terrainColor = waterColor;
        }
        
        gl_FragColor = vec4(terrainColor, 1.0);
      }
    `,
    wireframe: false
  });

  useFrame((state) => {
    if (meshRef.current) {
      terrainMaterial.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size, resolution, resolution]} />
      <primitive object={terrainMaterial} attach="material" />
    </mesh>
  );
};
