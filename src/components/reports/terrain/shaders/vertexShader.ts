
import { noiseUtils } from './terrainUtils';

export const createVertexShader = (heightMultiplier: number) => `
uniform float time;
varying vec2 vUv;
varying float vElevation;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vPathColors[5];
varying float vPathIntensities[5];

${noiseUtils}

void main() {
  vUv = uv;
  vNormal = normal;
  vec3 pos = position;
  
  // Base terrain with fractal noise
  float baseElevation = fbm(pos.xy * 0.5) * ${heightMultiplier}.0;
  
  // Create a more expansive continent shape
  float continentShape = continent(pos.xy, vec2(0.0, 0.0), 25.0, 0.1);
  continentShape = pow(continentShape, 0.9); // Make continent wider with smoother edges
  
  // Add subtle animation to water
  float waterMovement = sin(pos.x * 0.2 + time * 0.5) * cos(pos.y * 0.2 + time * 0.3) * 0.1;
  
  // Blend continental highlands with base terrain
  float elevation = mix(baseElevation * 0.5, baseElevation * 1.8, continentShape);
  
  // Define 5 mountains for the 5 brain regions
  vec2 mountain1 = vec2(-10.0, 8.0);   // Prefrontal Cortex (Red)
  vec2 mountain2 = vec2(12.0, 6.0);    // Hippocampus (Blue)
  vec2 mountain3 = vec2(8.0, -10.0);   // Amygdala (Green)
  vec2 mountain4 = vec2(-12.0, -3.0);  // Cerebellum (Yellow)
  vec2 mountain5 = vec2(-5.0, -12.0);  // Parietal Lobe (Magenta)
  
  // Central hub - basecamp
  vec2 centralHub = vec2(0.0, 0.0);
  
  // Define mountain peaks with more varied heights
  float peak1 = smoothstep(5.0, 0.5, length(pos.xy - mountain1)) * ${heightMultiplier}.0 * 1.7;
  float peak2 = smoothstep(4.5, 0.5, length(pos.xy - mountain2)) * ${heightMultiplier}.0 * 1.8;
  float peak3 = smoothstep(4.0, 0.5, length(pos.xy - mountain3)) * ${heightMultiplier}.0 * 1.6;
  float peak4 = smoothstep(4.0, 0.5, length(pos.xy - mountain4)) * ${heightMultiplier}.0 * 1.7;
  float peak5 = smoothstep(4.0, 0.5, length(pos.xy - mountain5)) * ${heightMultiplier}.0 * 1.5;
  
  // Central hub with a plateau
  float hubElevation = smoothstep(3.0, 0.5, length(pos.xy - centralHub)) * ${heightMultiplier}.0 * 0.8;
  
  // Add ridge details to mountains with noise
  float ridgeNoise = fbm(pos.xy * 1.5 + vec2(time * 0.01)) * 0.5;
  peak1 += ridgeNoise * 0.5;
  peak2 += ridgeNoise * 0.6;
  peak3 += ridgeNoise * 0.4;
  peak4 += ridgeNoise * 0.5;
  peak5 += ridgeNoise * 0.5;
  
  // Combine mountain peaks with the continent
  elevation = max(elevation, peak1 * continentShape);
  elevation = max(elevation, peak2 * continentShape);
  elevation = max(elevation, peak3 * continentShape);
  elevation = max(elevation, peak4 * continentShape);
  elevation = max(elevation, peak5 * continentShape);
  elevation = max(elevation, hubElevation * continentShape);
  
  // Define trails from central hub to each brain region mountain
  float pathWidth1 = 1.8 + sin(time * 0.5) * 0.2;
  float pathWidth2 = 2.0 + sin(time * 0.4 + 1.0) * 0.2;
  float pathWidth3 = 1.7 + sin(time * 0.6 + 2.0) * 0.2;
  float pathWidth4 = 1.9 + sin(time * 0.3 + 3.0) * 0.2;
  float pathWidth5 = 2.1 + sin(time * 0.7 + 4.0) * 0.2;
  
  // Calculate trail intensities for each brain region
  float pathIntensity1 = brainRegionTrail(pos.xy, centralHub, mountain1, pathWidth1, 0); // Prefrontal Cortex
  float pathIntensity2 = brainRegionTrail(pos.xy, centralHub, mountain2, pathWidth2, 1); // Hippocampus
  float pathIntensity3 = brainRegionTrail(pos.xy, centralHub, mountain3, pathWidth3, 2); // Amygdala
  float pathIntensity4 = brainRegionTrail(pos.xy, centralHub, mountain4, pathWidth4, 3); // Cerebellum
  float pathIntensity5 = brainRegionTrail(pos.xy, centralHub, mountain5, pathWidth5, 4); // Parietal Lobe
  
  // Store path colors and intensities for use in fragment shader
  vPathColors[0] = getBrainRegionColor(0); // Prefrontal Cortex (Red)
  vPathColors[1] = getBrainRegionColor(1); // Hippocampus (Blue)
  vPathColors[2] = getBrainRegionColor(2); // Amygdala (Green)
  vPathColors[3] = getBrainRegionColor(3); // Cerebellum (Yellow)
  vPathColors[4] = getBrainRegionColor(4); // Parietal Lobe (Magenta)
  
  vPathIntensities[0] = pathIntensity1;
  vPathIntensities[1] = pathIntensity2;
  vPathIntensities[2] = pathIntensity3;
  vPathIntensities[3] = pathIntensity4;
  vPathIntensities[4] = pathIntensity5;
  
  // Combine all path intensities
  float pathMask = max(max(max(max(pathIntensity1, pathIntensity2), pathIntensity3), pathIntensity4), pathIntensity5);
  
  // Better path integration with terrain - create natural routes through mountains
  if (elevation > 0.8) {
    // Smoothly carve paths through elevated terrain
    float pathHeight = mix(min(elevation, 1.5), elevation, 1.0 - pathMask);
    float pathDepth = mix(elevation, pathHeight, 0.7);
    elevation = mix(elevation, pathDepth, pathMask * 0.9);
  }
  
  // Add additional small terrain details for realism
  float detailNoise = fbm(pos.xy * 3.0) * 0.3;
  elevation += detailNoise * (1.0 - pathMask * 0.8); // Less noise on paths
  
  // Water around the continent with gentle waves
  if (continentShape < 0.4 && elevation < 1.0) {
    elevation = mix(elevation, -0.8 + waterMovement, 0.9);
  }
  
  pos.z += elevation;
  vElevation = elevation;
  vPosition = pos;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;
