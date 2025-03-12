
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
  
  // Create heightmap-based terrain with enhanced colors
  const terrainMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
    },
    vertexShader: `
      uniform float time;
      varying vec2 vUv;
      varying float vElevation;
      
      vec2 hash2(vec2 p) {
        return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        
        vec2 u = f * f * (3.0 - 2.0 * f);
        
        float a = dot(hash2(i), f);
        float b = dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
        float c = dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
        float d = dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
        
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }
      
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        for(int i = 0; i < 6; i++) {
          value += amplitude * noise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        
        return value;
      }
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        
        float elevation = fbm(pos.xy * 0.5) * ${heightMultiplier}.0;
        pos.z += elevation;
        
        vElevation = elevation;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vElevation;
      
      void main() {
        // Define more elevation thresholds for a more detailed terrain
        float snowLevel = 3.5;
        float highRockLevel = 2.8;
        float rockLevel = 2.0;
        float lowRockLevel = 1.5;
        float grassLevel = 1.0;
        float sandLevel = 0.5;
        float waterLevel = 0.2;
        
        // Define more colors for a richer landscape
        vec3 snowColor = vec3(0.95, 0.95, 0.97);
        vec3 highRockColor = vec3(0.6, 0.6, 0.65);
        vec3 rockColor = vec3(0.5, 0.5, 0.55);
        vec3 lowRockColor = vec3(0.45, 0.43, 0.4);
        vec3 grassColor = vec3(0.2, 0.6, 0.3);
        vec3 darkGrassColor = vec3(0.15, 0.45, 0.2);
        vec3 sandColor = vec3(0.76, 0.7, 0.5);
        vec3 waterColor = vec3(0.1, 0.3, 0.8);
        vec3 deepWaterColor = vec3(0.05, 0.15, 0.4);
        
        // Add slight variations based on UV coordinates for texture
        float uvVariation = noise2D(vUv * 30.0) * 0.05;
        
        // Blend colors based on elevation with more gradual transitions
        vec3 terrainColor;
        
        if (vElevation > snowLevel) {
          // Snow caps
          terrainColor = snowColor;
        } else if (vElevation > highRockLevel) {
          // Transition from high rock to snow
          float blend = smoothstep(highRockLevel, snowLevel, vElevation);
          terrainColor = mix(highRockColor, snowColor, blend);
        } else if (vElevation > rockLevel) {
          // Transition from rock to high rock
          float blend = smoothstep(rockLevel, highRockLevel, vElevation);
          terrainColor = mix(rockColor, highRockColor, blend);
        } else if (vElevation > lowRockLevel) {
          // Transition from low rock to rock
          float blend = smoothstep(lowRockLevel, rockLevel, vElevation);
          terrainColor = mix(lowRockColor, rockColor, blend);
        } else if (vElevation > grassLevel) {
          // Transition from grass to low rock
          float blend = smoothstep(grassLevel, lowRockLevel, vElevation);
          terrainColor = mix(grassColor, lowRockColor, blend);
        } else if (vElevation > sandLevel) {
          // Transition from sand to grass
          float blend = smoothstep(sandLevel, grassLevel, vElevation);
          terrainColor = mix(sandColor, darkGrassColor, blend);
          // Add some variation to grass based on noise
          if (blend > 0.5) {
            float grassNoise = noise2D(vUv * 50.0);
            terrainColor = mix(darkGrassColor, grassColor, grassNoise);
          }
        } else if (vElevation > waterLevel) {
          // Transition from water to sand
          float blend = smoothstep(waterLevel, sandLevel, vElevation);
          terrainColor = mix(waterColor, sandColor, blend);
        } else {
          // Transition from deep water to water
          float blend = smoothstep(-0.2, waterLevel, vElevation);
          terrainColor = mix(deepWaterColor, waterColor, blend);
        }
        
        // Add subtle atmospheric effect
        float fog = smoothstep(0.0, 1.0, length(vUv - 0.5) * 1.5);
        vec3 fogColor = vec3(0.8, 0.85, 0.9);
        terrainColor = mix(terrainColor, fogColor, fog * 0.2);
        
        gl_FragColor = vec4(terrainColor, 1.0);
      }
      
      // Simple 2D noise function for texture variation
      float noise2D(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
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
    <mesh 
      ref={meshRef} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -2, 0]} 
      receiveShadow
    >
      <planeGeometry args={[size, size, resolution - 1, resolution - 1]} />
      <primitive object={terrainMaterial} attach="material" />
    </mesh>
  );
};
