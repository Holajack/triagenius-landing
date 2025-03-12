
export const noiseUtils = `
// Improved hash function for better noise distribution
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

// Perlin noise implementation
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  
  // Improved smoothing with cubic Hermite curve
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  float a = dot(hash2(i), f);
  float b = dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Fractal Brownian Motion for natural terrain
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  float lacunarity = 2.0;  // Frequency multiplier between octaves
  float gain = 0.5;        // Amplitude multiplier between octaves
  
  for(int i = 0; i < 6; i++) {
    value += amplitude * noise(p * frequency);
    amplitude *= gain;
    frequency *= lacunarity;
  }
  
  return value;
}

// Enhanced path function with variable width and natural curves
float path(vec2 p, vec2 a, vec2 b, float width) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  vec2 point = a + ba * t;
  
  // Calculate distance to path line
  float dist = length(p - point);
  
  // Add small variations to path width based on position
  float widthVar = width * (1.0 + 0.2 * noise(point * 0.5));
  
  // Softer path edges with improved smoothstep
  return smoothstep(widthVar, widthVar * 0.6, dist);
}

// Improved continent function with more natural edges
float continent(vec2 p, vec2 center, float radius, float noiseScale) {
  // Base distance from center
  float dist = length(p - center) / radius;
  
  // Create main continent shape with soft edge falloff
  float edge = 1.0 - smoothstep(0.0, 0.9, dist);
  
  // Add more complex edge details with multiple noise scales
  float noise1 = fbm(p * noiseScale) * 0.5 + 0.5;
  float noise2 = fbm(p * noiseScale * 2.0 + vec2(42.3)) * 0.25 + 0.5;
  
  // Blend noise components for more interesting coastlines
  float combinedNoise = mix(noise1, noise2, 0.5);
  
  // Create coastal features with noise
  float coastalDetail = smoothstep(0.4, 0.6, combinedNoise);
  
  // Combine main shape with coastal features
  return edge * mix(coastalDetail, 1.0, 0.7);
}

// Ridge noise function for mountain ridges
float ridgedNoise(vec2 p) {
  return (1.0 - abs(noise(p) * 2.0 - 1.0));
}

// Ridge FBM for mountain ranges
float ridgeFbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  
  for(int i = 0; i < 4; i++) {
    sum += amp * ridgedNoise(p * freq);
    amp *= 0.5;
    freq *= 2.0;
  }
  
  return sum;
}
`;
