
// Utility functions for terrain shader operations

/**
 * Generates a height value using a modified simplex noise algorithm
 * @param x - X coordinate
 * @param y - Y coordinate 
 * @param scale - Scale factor for the noise
 * @returns A height value between -1 and 1
 */
export const generateHeight = (x: number, y: number, scale: number = 1): number => {
  // Simplified noise function for better performance
  return scale * (
    Math.sin(x) * Math.cos(y) + 
    Math.sin(x * 2.0) * Math.cos(y * 2.0) * 0.5
  );
};

/**
 * Linear interpolation between two values
 * @param a - First value
 * @param b - Second value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 */
export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

/**
 * Maps a value from one range to another
 * @param value - The value to map
 * @param inMin - Input range minimum
 * @param inMax - Input range maximum
 * @param outMin - Output range minimum
 * @param outMax - Output range maximum
 * @returns Mapped value
 */
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

/**
 * Generates a terrain color based on height and slope
 * @param height - The terrain height
 * @param slope - The terrain slope (0-1, where 0 is flat and 1 is vertical)
 * @param isNight - Whether to use night colors
 * @returns RGB color array [r, g, b]
 */
export const getTerrainColor = (height: number, slope: number, isNight: boolean): [number, number, number] => {
  if (isNight) {
    // Night mode colors
    if (height > 3.0) return [0.6, 0.6, 0.7]; // Snow peaks
    if (height > 2.0) return [0.3, 0.3, 0.4]; // High mountains
    if (height > 1.0) return [0.2, 0.2, 0.3]; // Hills
    return [0.1, 0.1, 0.2]; // Lowlands
  } else {
    // Day mode colors
    if (height > 3.0) return [0.95, 0.95, 0.97]; // Snow peaks
    if (height > 2.0) return [0.5, 0.4, 0.35]; // Rocky mountains
    if (height > 1.0) return [0.45, 0.55, 0.3]; // Highland areas
    
    // Use slope to determine lowland color variations
    if (slope > 0.5) {
      return [0.35, 0.45, 0.25]; // Steep lowlands (rocky areas)
    }
    return [0.25, 0.6, 0.3]; // Flat grasslands
  }
};

/**
 * Clamp a value between min and max
 * @param value - The value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Generate a smooth noise value based on coordinates
 * This is a simplified implementation for demo purposes
 */
export const smoothNoise = (x: number, y: number, scale: number = 1): number => {
  // Fractal Brownian Motion approach with multiple octaves
  let noise = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  
  // Use 4 octaves for more natural-looking terrain
  for (let i = 0; i < 4; i++) {
    noise += amplitude * generateHeight(x * frequency, y * frequency, scale);
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  
  // Normalize to -1 to 1 range
  return noise / maxValue;
};
