
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

// Continent shape function (distance from center)
float continent(vec2 p, vec2 center, float size, float feather) {
  float dist = length(p - center) / size;
  return 1.0 - smoothstep(1.0 - feather, 1.0, dist);
}

// Create a trail between two points with varying width
float brainRegionTrail(vec2 pos, vec2 start, vec2 end, float width, int regionIndex) {
  // Create a vector from start to end
  vec2 path = end - start;
  float pathLength = length(path);
  vec2 pathDir = path / pathLength;
  
  // Find the closest point on the path line segment to pos
  vec2 posToStart = pos - start;
  float projection = dot(posToStart, pathDir);
  projection = clamp(projection, 0.0, pathLength);
  
  // Get the closest point on the path
  vec2 closestPoint = start + pathDir * projection;
  
  // Calculate distance from pos to the path
  float dist = length(pos - closestPoint);
  
  // Create trail effect with glowing edges
  float trailIntensity = smoothstep(width, width * 0.5, dist);
  
  // Add pulsing effect
  float pulse = sin(time * 0.5 + float(regionIndex) * 1.5) * 0.5 + 0.5;
  trailIntensity *= mix(0.7, 1.0, pulse);
  
  return trailIntensity;
}

// Define colors for brain regions
vec3 getBrainRegionColor(int regionIndex) {
  if (regionIndex == 0) return vec3(0.92, 0.22, 0.29); // Prefrontal - Red (#ea384c)
  if (regionIndex == 1) return vec3(0.12, 0.68, 0.85); // Hippocampus - Blue (#1EAEDB)
  if (regionIndex == 2) return vec3(0.29, 0.76, 0.34); // Amygdala - Green (#4AC157)
  if (regionIndex == 3) return vec3(0.99, 0.77, 0.21); // Cerebellum - Yellow (#FDC536)
  if (regionIndex == 4) return vec3(0.85, 0.27, 0.94); // Parietal - Magenta (#D946EF)
  return vec3(1.0, 1.0, 1.0); // Default white
}
`;
