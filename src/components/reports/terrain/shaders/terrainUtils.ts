
// Utility functions for terrain shader
export const noiseUtils = `
// Noise generator functions
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Simple 2D noise
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  
  // Cubic Hermite curve
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  // Sample the four corners
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  
  // Bilinear interpolation
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Fractal Brownian Motion (FBM)
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  // Add 5 octaves of noise
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  return value;
}

// Terrain height calculation using multiple FBM layers
float terrainHeight(vec2 p) {
  // Large features
  float mountains = fbm(p * 0.3) * 0.5;
  
  // Medium features
  float hills = fbm(p * 0.7) * 0.25;
  
  // Small features
  float rocks = fbm(p * 2.0) * 0.125;
  
  // Combine all features
  return mountains + hills + rocks;
}

// PBR material utility functions
vec3 calculateNormal(vec2 p, float height, float epsilon) {
  // Sample heights at neighboring points
  float hL = terrainHeight(p - vec2(epsilon, 0.0));
  float hR = terrainHeight(p + vec2(epsilon, 0.0));
  float hD = terrainHeight(p - vec2(0.0, epsilon));
  float hU = terrainHeight(p + vec2(0.0, epsilon));
  
  // Calculate the normal using central differences
  vec3 normal = normalize(vec3(
    hL - hR,
    2.0 * epsilon,
    hD - hU
  ));
  
  return normal;
}

// Environment mapping
vec3 getSkyColor(vec3 rayDir, vec3 sunDir) {
  // Sky gradient
  float sunDot = max(0.0, dot(rayDir, sunDir));
  float skyY = max(0.0, rayDir.y);
  
  // Sky colors
  vec3 zenithColor = vec3(0.3, 0.5, 0.9);  // Blue at top
  vec3 horizonColor = vec3(0.7, 0.75, 0.8); // Lighter at horizon
  vec3 sunColor = vec3(1.0, 0.9, 0.7);      // Yellowish sun
  
  // Mix sky gradient
  vec3 skyColor = mix(horizonColor, zenithColor, pow(skyY, 0.5));
  
  // Add sun
  float sun = pow(sunDot, 64.0);
  skyColor = mix(skyColor, sunColor, sun);
  
  // Add atmosphere when looking towards the horizon
  float atmosphere = 1.0 - pow(skyY, 0.5);
  skyColor = mix(skyColor, horizonColor * 0.8, atmosphere * 0.5);
  
  return skyColor;
}

// Dust particle generation
vec3 generateDustParticle(vec2 uv, float time) {
  vec2 p = uv * 10.0;
  float noise = fbm(p + time * 0.1);
  
  // Only show particles above a threshold
  float threshold = 0.75;
  float particle = smoothstep(threshold, threshold + 0.1, noise);
  
  // Color and opacity
  vec3 dustColor = vec3(0.8, 0.7, 0.5);
  return dustColor * particle * 0.2;
}

// Procedural sand texture
vec3 sandTexture(vec2 p) {
  // Base sand color
  vec3 sandColor = vec3(0.76, 0.70, 0.50);
  
  // Add small noise for sand grains
  float grainNoise = fbm(p * 20.0) * 0.1;
  
  // Add medium noise for small dunes
  float smallDunes = fbm(p * 5.0) * 0.2;
  
  // Combine effects
  vec3 finalColor = sandColor;
  finalColor *= 1.0 - grainNoise * 0.5;
  finalColor *= 1.0 - smallDunes * 0.2;
  
  return finalColor;
}

// Rock texture
vec3 rockTexture(vec2 p, vec3 normal) {
  // Base rock color
  vec3 rockColor = vec3(0.5, 0.45, 0.40);
  
  // Add noise for rock texture
  float rockNoise = fbm(p * 10.0) * 0.2;
  
  // Darken crevices based on normal
  float crevice = 1.0 - pow(max(0.0, normal.y), 2.0);
  
  // Combine effects
  vec3 finalColor = rockColor;
  finalColor *= 1.0 - rockNoise * 0.5;
  finalColor *= 1.0 - crevice * 0.3;
  
  return finalColor;
}

// Blend between rock and sand based on slope
vec3 terrainColor(vec2 p, vec3 normal, float height) {
  // Calculate slope (dot product with up vector)
  float slope = 1.0 - normal.y; // 0 = flat, 1 = vertical
  
  // Get base textures
  vec3 sand = sandTexture(p);
  vec3 rock = rockTexture(p, normal);
  
  // Blend based on slope (more rock on steep slopes)
  float rockThreshold = 0.3; // Slope threshold for rock
  float rockBlend = smoothstep(rockThreshold - 0.1, rockThreshold + 0.1, slope);
  
  // Also add more rock at higher elevations
  float heightFactor = smoothstep(0.2, 0.5, height);
  rockBlend = max(rockBlend, heightFactor);
  
  // Return blended color
  return mix(sand, rock, rockBlend);
}
`;
