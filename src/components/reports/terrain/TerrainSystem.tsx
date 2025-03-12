
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
