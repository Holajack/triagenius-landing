
import { noiseUtils } from './terrainUtils';

export const createVertexShader = (heightMultiplier: number) => `
uniform float time;
varying vec2 vUv;
varying float vElevation;

${noiseUtils}

void main() {
  vUv = uv;
  vec3 pos = position;
  
  // Base terrain with fractal noise
  float baseElevation = fbm(pos.xy * 0.5) * ${heightMultiplier}.0;
  
  // Create a primary continent shape
  float continentShape = continent(pos.xy, vec2(0.0, 0.0), 15.0, 0.1);
  continentShape = pow(continentShape, 1.2);
  
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
  
  if (plateau1 > 0.6 || plateau2 > 0.6) {
    elevation = max(elevation, max(plateau1, plateau2) * ${heightMultiplier}.0 * 0.7);
  }
  
  if (landBridge1 > 0.3 || landBridge2 > 0.3) {
    float bridgeHeight = max(landBridge1, landBridge2) * ${heightMultiplier}.0 * 0.6;
    elevation = max(elevation, mix(elevation, bridgeHeight, 0.7));
  }
  
  // Define hiking paths
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
  
  if (elevation < 2.0) {
    elevation = mix(elevation, min(elevation, 0.5), pathMask);
  }
  
  // Water bodies
  float waterMask = 0.0;
  vec2 lakeCenter1 = vec2(-8.0, 5.0);
  float lakeDist1 = length(pos.xy - lakeCenter1);
  waterMask = max(waterMask, smoothstep(3.5, 3.0, lakeDist1));
  
  vec2 lakeCenter2 = vec2(7.0, -5.0);
  float lakeDist2 = length(pos.xy - lakeCenter2);
  waterMask = max(waterMask, smoothstep(2.8, 2.5, lakeDist2));
  
  vec2 riverStart = lakeCenter1;
  vec2 riverEnd = lakeCenter2;
  float riverPath = path(pos.xy, riverStart, riverEnd, 1.0);
  waterMask = max(waterMask, riverPath * 0.7);
  
  if (waterMask > 0.0 && elevation < 1.0) {
    elevation = mix(elevation, -0.5, waterMask);
  }
  
  pos.z += elevation;
  vElevation = elevation;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;
