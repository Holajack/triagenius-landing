
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
        
        // Define natural mountain colors
        vec3 snowColor = vec3(0.95, 0.95, 0.97);
        vec3 highRockColor = vec3(0.55, 0.52, 0.5);
        vec3 midRockColor = vec3(0.6, 0.57, 0.53);
        vec3 lowRockColor = vec3(0.7, 0.65, 0.6);
        vec3 grassColor = vec3(0.4, 0.55, 0.3);
        vec3 sandColor = vec3(0.76, 0.7, 0.5);
        vec3 waterColor = vec3(0.3, 0.4, 0.5); // Reduced blue for water
        
        // Add some variation based on UV coordinates for subtle texture
        float noiseVal = fract(sin(vUv.x * 100.0 + vUv.y * 100.0) * 10000.0) * 0.05;
        
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
        } else {
          // Water level (with less blue tint)
          terrainColor = waterColor;
        }
        
        // Add subtle noise variation to break up flat colors
        terrainColor += vec3(noiseVal);
        
        // Add atmospheric fog effect - objects farther away fade slightly
        float fog = 1.0 - smoothstep(0.0, 1.0, distance(vUv, vec2(0.5)));
        terrainColor = mix(terrainColor, vec3(0.8, 0.8, 0.8), (1.0 - fog) * 0.15);
        
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
