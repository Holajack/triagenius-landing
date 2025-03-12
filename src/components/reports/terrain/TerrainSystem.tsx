
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

      // Function to create paths between points
      float path(vec2 p, vec2 a, vec2 b, float width) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        vec2 point = a + ba * t;
        float dist = length(p - point);
        return smoothstep(width, width * 0.7, dist);
      }
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        
        float elevation = fbm(pos.xy * 0.5) * ${heightMultiplier}.0;
        
        // Define hiking paths as coordinate pairs
        vec2 pathStart1 = vec2(-10.0, -10.0);
        vec2 pathEnd1 = vec2(0.0, 0.0);
        
        vec2 pathStart2 = vec2(10.0, -8.0);
        vec2 pathEnd2 = vec2(5.0, 5.0);
        
        vec2 pathStart3 = vec2(-5.0, 10.0);
        vec2 pathEnd3 = vec2(0.0, 0.0);
        
        // Create paths
        float pathMask1 = path(pos.xy, pathStart1, pathEnd1, 0.8);
        float pathMask2 = path(pos.xy, pathStart2, pathEnd2, 0.8);
        float pathMask3 = path(pos.xy, pathStart3, pathEnd3, 0.8);
        
        // Combine paths
        float pathMask = max(max(pathMask1, pathMask2), pathMask3);
        
        // Slightly flatten the paths by reducing elevation where paths exist
        // Only flatten if the elevation is below certain threshold to preserve mountains
        if (elevation < 2.0) {
          elevation = mix(elevation, min(elevation, 0.5), pathMask);
        }
        
        // Create water bodies (depressions)
        float waterMask = 0.0;
        
        // Circular lake
        vec2 lakeCenter1 = vec2(-8.0, 5.0);
        float lakeDist1 = length(pos.xy - lakeCenter1);
        waterMask = max(waterMask, smoothstep(3.5, 3.0, lakeDist1));
        
        // Another lake
        vec2 lakeCenter2 = vec2(7.0, -5.0);
        float lakeDist2 = length(pos.xy - lakeCenter2);
        waterMask = max(waterMask, smoothstep(2.8, 2.5, lakeDist2));
        
        // Lower elevation for water bodies
        if (waterMask > 0.0 && elevation < 1.0) {
          elevation = mix(elevation, -0.5, waterMask);
        }
        
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
        float deepWaterLevel = -0.3;
        
        // Define natural mountain colors with brown tones instead of blue
        vec3 snowColor = vec3(0.95, 0.95, 0.97);
        vec3 highRockColor = vec3(0.55, 0.52, 0.5);
        vec3 midRockColor = vec3(0.62, 0.58, 0.54);
        vec3 lowRockColor = vec3(0.72, 0.67, 0.62);
        vec3 grassColor = vec3(0.45, 0.57, 0.32);
        vec3 sandColor = vec3(0.78, 0.73, 0.53);
        vec3 mudColor = vec3(0.6, 0.5, 0.4);
        vec3 pathColor = vec3(0.82, 0.70, 0.55); // Light brown path color
        vec3 waterColor = vec3(0.42, 0.37, 0.35); // Dark brown water
        vec3 deepWaterColor = vec3(0.32, 0.28, 0.26); // Deeper brown water
        
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
          
          // Check if we're on a path (where elevation has been artificially lowered)
          // Use path detection based on the exact elevation values the path creates
          if (vElevation < 0.55 && vElevation > 0.45) {
            // Add path coloring - we blend in the path color
            terrainColor = mix(terrainColor, pathColor, 0.7);
          }
        } else if (vElevation > deepWaterLevel) {
          // Shallow water
          float blend = (vElevation - deepWaterLevel) / (waterLevel - deepWaterLevel);
          terrainColor = mix(deepWaterColor, waterColor, blend);
        } else {
          // Deep water
          terrainColor = deepWaterColor;
        }
        
        // Add subtle noise variation to break up flat colors
        terrainColor += vec3(noiseVal + bandNoise);
        
        // Enhance contrast slightly to make colors more visible
        terrainColor = terrainColor * 1.1;
        
        // Add atmospheric fog effect - objects farther away fade to warm brown tint
        float fog = 1.0 - smoothstep(0.0, 1.0, distance(vUv, vec2(0.5)));
        terrainColor = mix(terrainColor, vec3(0.85, 0.75, 0.65), (1.0 - fog) * 0.15);
        
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
