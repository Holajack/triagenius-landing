
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
  
  // Create a single primary continent shape
  float continentShape = continent(pos.xy, vec2(0.0, 0.0), 20.0, 0.1);
  continentShape = pow(continentShape, 1.1);
  
  // Blend continental highlands with base terrain
  float elevation = mix(baseElevation * 0.5, baseElevation * 1.8, continentShape);
  
  // Create mountain peaks at specific locations
  vec2 mountain1 = vec2(-10.0, 8.0);
  vec2 mountain2 = vec2(12.0, 6.0);
  vec2 mountain3 = vec2(8.0, -10.0);
  vec2 mountain4 = vec2(-5.0, -12.0);
  vec2 mountain5 = vec2(-12.0, -3.0);
  vec2 mountain6 = vec2(5.0, 12.0);
  
  // Define mountain peaks
  float peak1 = smoothstep(5.0, 0.5, length(pos.xy - mountain1)) * ${heightMultiplier}.0 * 1.5;
  float peak2 = smoothstep(4.5, 0.5, length(pos.xy - mountain2)) * ${heightMultiplier}.0 * 1.6;
  float peak3 = smoothstep(4.0, 0.5, length(pos.xy - mountain3)) * ${heightMultiplier}.0 * 1.4;
  float peak4 = smoothstep(4.0, 0.5, length(pos.xy - mountain4)) * ${heightMultiplier}.0 * 1.3;
  float peak5 = smoothstep(4.0, 0.5, length(pos.xy - mountain5)) * ${heightMultiplier}.0 * 1.5;
  float peak6 = smoothstep(3.5, 0.5, length(pos.xy - mountain6)) * ${heightMultiplier}.0 * 1.7;
  
  // Central hub
  vec2 centralHub = vec2(0.0, 0.0);
  float hubElevation = smoothstep(3.0, 0.5, length(pos.xy - centralHub)) * ${heightMultiplier}.0 * 0.8;
  
  // Combine mountain peaks with the continent
  elevation = max(elevation, peak1 * continentShape);
  elevation = max(elevation, peak2 * continentShape);
  elevation = max(elevation, peak3 * continentShape);
  elevation = max(elevation, peak4 * continentShape);
  elevation = max(elevation, peak5 * continentShape);
  elevation = max(elevation, peak6 * continentShape);
  elevation = max(elevation, hubElevation * continentShape);
  
  // Define 6 paths from central hub to each mountain
  float pathWidth = 1.5;
  float pathMask1 = path(pos.xy, centralHub, mountain1, pathWidth);
  float pathMask2 = path(pos.xy, centralHub, mountain2, pathWidth);
  float pathMask3 = path(pos.xy, centralHub, mountain3, pathWidth);
  float pathMask4 = path(pos.xy, centralHub, mountain4, pathWidth);
  float pathMask5 = path(pos.xy, centralHub, mountain5, pathWidth);
  float pathMask6 = path(pos.xy, centralHub, mountain6, pathWidth);
  
  // Combine all path masks
  float pathMask = max(max(max(max(max(pathMask1, pathMask2), pathMask3), pathMask4), pathMask5), pathMask6);
  
  // Slightly flatten paths for better visibility
  if (elevation > 0.5 && elevation < 4.0) {
    float pathFlatness = mix(elevation, min(elevation, 1.0), pathMask * 0.7);
    elevation = mix(elevation, pathFlatness, pathMask * 0.5);
  }
  
  // Water around the continent
  if (continentShape < 0.4 && elevation < 1.0) {
    elevation = mix(elevation, -0.5, 0.8);
  }
  
  pos.z += elevation;
  vElevation = elevation;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;
