
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

      float path(vec2 p, vec2 a, vec2 b, float width) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        vec2 point = a + ba * t;
        float dist = length(p - point);
        return smoothstep(width, width * 0.7, dist);
      }
      
      // Function to create a continent-like shape
      float continent(vec2 p, vec2 center, float radius, float noiseScale) {
        float dist = length(p - center) / radius;
        float edge = 1.0 - smoothstep(0.0, 1.0, dist);
        float noise = fbm(p * noiseScale) * 0.5 + 0.5;
        return edge * noise;
      }
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        
        // Base terrain with fractal noise
        float baseElevation = fbm(pos.xy * 0.5) * ${heightMultiplier}.0;
        
        // Create a primary continent shape
        float continentShape = continent(pos.xy, vec2(0.0, 0.0), 15.0, 0.1);
        continentShape = pow(continentShape, 1.2); // Sharpen edges a bit
        
        // Blend continental highlands with base terrain
        float elevation = mix(baseElevation * 0.5, baseElevation * 1.5, continentShape);
        
        // Create secondary plateau regions
        float plateau1 = continent(pos.xy, vec2(-5.0, 4.0), 5.0, 0.2);
        float plateau2 = continent(pos.xy, vec2(6.0, -3.0), 4.0, 0.2);
        
        // Connect the plateaus with land bridges
        vec2 bridge1Start = vec2(-3.0, 2.0);
        vec2 bridge1End = vec2(3.0, -1.0);
        float landBridge1 = path(pos.xy, bridge1Start, bridge1End, 2.5);
        
        vec2 bridge2Start = vec2(-6.0, -2.0);
        vec2 bridge2End = vec2(1.0, -5.0);
        float landBridge2 = path(pos.xy, bridge2Start, bridge2End, 2.2);
        
        // Add some highlands in plateau areas
        if (plateau1 > 0.6 || plateau2 > 0.6) {
          elevation = max(elevation, max(plateau1, plateau2) * ${heightMultiplier}.0 * 0.7);
        }
        
        // Ensure land bridges connect raised areas
        if (landBridge1 > 0.3 || landBridge2 > 0.3) {
          float bridgeHeight = max(landBridge1, landBridge2) * ${heightMultiplier}.0 * 0.6;
          elevation = max(elevation, mix(elevation, bridgeHeight, 0.7));
        }
        
        // Define hiking paths through the terrain
        vec2 pathStart1 = vec2(-10.0, -10.0);
        vec2 pathEnd1 = vec2(0.0, 0.0);
        
        vec2 pathStart2 = vec2(10.0, -8.0);
        vec2 pathEnd2 = vec2(5.0, 5.0);
        
        vec2 pathStart3 = vec2(-5.0, 10.0);
        vec2 pathEnd3 = vec2(0.0, 0.0);
        
        float pathMask1 = path(pos.xy, pathStart1, pathEnd1, 0.8);
        float pathMask2 = path(pos.xy, pathStart2, pathEnd2, 0.8);
        float pathMask3 = path(pos.xy, pathStart3, pathEnd3, 0.8);
        
        float pathMask = max(max(pathMask1, pathMask2), pathMask3);
        
        // Smooth out paths in lowlands but not in highlands
        if (elevation < 2.0) {
          elevation = mix(elevation, min(elevation, 0.5), pathMask);
        }
        
        // Create water bodies in the lowlands
        float waterMask = 0.0;
        
        vec2 lakeCenter1 = vec2(-8.0, 5.0);
        float lakeDist1 = length(pos.xy - lakeCenter1);
        waterMask = max(waterMask, smoothstep(3.5, 3.0, lakeDist1));
        
        vec2 lakeCenter2 = vec2(7.0, -5.0);
        float lakeDist2 = length(pos.xy - lakeCenter2);
        waterMask = max(waterMask, smoothstep(2.8, 2.5, lakeDist2));
        
        // Add a connecting river between the lakes
        vec2 riverStart = lakeCenter1;
        vec2 riverEnd = lakeCenter2;
        float riverPath = path(pos.xy, riverStart, riverEnd, 1.0);
        waterMask = max(waterMask, riverPath * 0.7);
        
        // Make water areas deeper
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
        float snowLevel = 3.5;
        float highRockLevel = 2.8;
        float midRockLevel = 2.0;
        float lowRockLevel = 1.2;
        float grassLevel = 0.6;
        float sandLevel = 0.2;
        float waterLevel = 0.0;
        float deepWaterLevel = -0.3;
        
        vec3 snowColor = vec3(0.95, 0.95, 0.97);
        vec3 highRockColor = vec3(0.55, 0.52, 0.5);
        vec3 midRockColor = vec3(0.62, 0.58, 0.54);
        vec3 lowRockColor = vec3(0.72, 0.67, 0.62);
        vec3 grassColor = vec3(0.45, 0.57, 0.32);
        vec3 sandColor = vec3(0.78, 0.73, 0.53);
        vec3 mudColor = vec3(0.6, 0.5, 0.4);
        vec3 pathColor = vec3(0.82, 0.70, 0.55);
        vec3 waterColor = vec3(0.2, 0.4, 0.8);
        vec3 deepWaterColor = vec3(0.1, 0.2, 0.6);
        
        float noiseVal = fract(sin(vUv.x * 100.0 + vUv.y * 100.0) * 10000.0) * 0.05;
        float bandNoise = sin(vElevation * 8.0) * 0.02;
        
        vec3 terrainColor;
        
        if (vElevation > snowLevel) {
          terrainColor = snowColor;
        } else if (vElevation > highRockLevel) {
          float blend = (vElevation - highRockLevel) / (snowLevel - highRockLevel);
          terrainColor = mix(highRockColor, snowColor, blend);
        } else if (vElevation > midRockLevel) {
          float blend = (vElevation - midRockLevel) / (highRockLevel - midRockLevel);
          terrainColor = mix(midRockColor, highRockColor, blend);
        } else if (vElevation > lowRockLevel) {
          float blend = (vElevation - lowRockLevel) / (midRockLevel - lowRockLevel);
          terrainColor = mix(lowRockColor, midRockColor, blend);
        } else if (vElevation > grassLevel) {
          float blend = (vElevation - grassLevel) / (lowRockLevel - grassLevel);
          terrainColor = mix(grassColor, lowRockColor, blend);
        } else if (vElevation > sandLevel) {
          float blend = (vElevation - sandLevel) / (grassLevel - sandLevel);
          terrainColor = mix(sandColor, grassColor, blend);
        } else if (vElevation > waterLevel) {
          float blend = (vElevation - waterLevel) / (sandLevel - waterLevel);
          terrainColor = mix(mudColor, sandColor, blend);
          
          // Make paths more visible in the lowlands
          if (vElevation < 0.55 && vElevation > 0.45) {
            terrainColor = mix(terrainColor, pathColor, 0.7);
          }
        } else if (vElevation > deepWaterLevel) {
          float blend = (vElevation - deepWaterLevel) / (waterLevel - deepWaterLevel);
          terrainColor = mix(deepWaterColor, waterColor, blend);
        } else {
          terrainColor = deepWaterColor;
        }
        
        terrainColor += vec3(noiseVal + bandNoise);
        
        terrainColor = terrainColor * 1.1;
        
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
