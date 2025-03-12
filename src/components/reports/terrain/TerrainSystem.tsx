
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
  
  // Create heightmap-based terrain with earth-toned colors
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
        // Define elevation thresholds for different terrain types
        float snowLevel = 3.5;
        float highRockLevel = 2.8;
        float midRockLevel = 2.0;
        float lowRockLevel = 1.2;
        float grassLevel = 0.6;
        float sandLevel = 0.2;
        float waterLevel = 0.0;
        
        // Define natural mountain colors with reduced blue tints
        vec3 snowColor = vec3(0.95, 0.95, 0.97);
        vec3 highRockColor = vec3(0.55, 0.52, 0.5);
        vec3 midRockColor = vec3(0.62, 0.58, 0.54);
        vec3 lowRockColor = vec3(0.72, 0.67, 0.62);
        vec3 grassColor = vec3(0.45, 0.57, 0.32);
        vec3 sandColor = vec3(0.78, 0.73, 0.53);
        vec3 mudColor = vec3(0.52, 0.46, 0.35);
        vec3 waterColor = vec3(0.42, 0.47, 0.55); // Even less blue, more gray-green
        
        // Add some variation based on UV coordinates for subtle texture
        float noiseVal = fract(sin(vUv.x * 100.0 + vUv.y * 100.0) * 10000.0) * 0.05;
        
        // Additional variation for horizontal banding
        float bandNoise = sin(vElevation * 8.0) * 0.02;
        
        // Blend colors based on elevation with smooth transitions
        vec3 terrainColor;
        
        if (vElevation > snowLevel) {
          // Snow caps
          terrainColor = snowColor;
        } else if (vElevation > highRockLevel) {
          // Transition to high rocks
          float blend = (vElevation - highRockLevel) / (snowLevel - highRockLevel);
          terrainColor = mix(highRockColor, snowColor, blend);
        } else if (vElevation > midRockLevel) {
          // Mid-level rocks
          float blend = (vElevation - midRockLevel) / (highRockLevel - midRockLevel);
          terrainColor = mix(midRockColor, highRockColor, blend);
        } else if (vElevation > lowRockLevel) {
          // Lower rocks
          float blend = (vElevation - lowRockLevel) / (midRockLevel - lowRockLevel);
          terrainColor = mix(lowRockColor, midRockColor, blend);
        } else if (vElevation > grassLevel) {
          // Grassy areas
          float blend = (vElevation - grassLevel) / (lowRockLevel - grassLevel);
          terrainColor = mix(grassColor, lowRockColor, blend);
        } else if (vElevation > sandLevel) {
          // Sandy areas
          float blend = (vElevation - sandLevel) / (grassLevel - sandLevel);
          terrainColor = mix(sandColor, grassColor, blend);
        } else if (vElevation > waterLevel) {
          // Muddy areas near water
          float blend = (vElevation - waterLevel) / (sandLevel - waterLevel);
          terrainColor = mix(mudColor, sandColor, blend);
        } else {
          // Water level (with much less blue tint)
          terrainColor = waterColor;
        }
        
        // Add subtle noise variation to break up flat colors
        terrainColor += vec3(noiseVal + bandNoise);
        
        // Enhance contrast slightly to make colors more visible
        terrainColor = terrainColor * 1.1;
        
        // Add atmospheric fog effect - objects farther away fade slightly to a warm tint
        float fog = 1.0 - smoothstep(0.0, 1.0, distance(vUv, vec2(0.5)));
        terrainColor = mix(terrainColor, vec3(0.85, 0.82, 0.78), (1.0 - fog) * 0.15);
        
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
