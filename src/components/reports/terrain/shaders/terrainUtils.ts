
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
 * Generates a terrain color based on height
 * @param height - The terrain height
 * @param isNight - Whether to use night colors
 * @returns RGB color array [r, g, b]
 */
export const getTerrainColor = (height: number, isNight: boolean): [number, number, number] => {
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
    return [0.25, 0.6, 0.3]; // Grasslands
  }
};
