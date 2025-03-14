
// Utility functions for terrain shader operations

/**
 * Generates a height value using a modified simplex noise algorithm
 * @param x - X coordinate
 * @param y - Y coordinate 
 * @param scale - Scale factor for the noise
 * @returns A height value between -1 and 1
 */
export const generateHeight = (x: number, y: number, scale: number = 1): number => {
  // Simplified version for demonstration
  return (Math.sin(x * scale) * Math.cos(y * scale) + 
         Math.sin(x * scale * 2) * Math.cos(y * scale * 3) * 0.5) * 0.5;
};

/**
 * Calculates a normal vector for a height map at the given position
 * @param heightMap - 2D array of height values
 * @param x - X index in the height map
 * @param y - Y index in the height map
 * @returns A normalized vector {x, y, z}
 */
export const calculateNormal = (
  heightMap: number[][], 
  x: number, 
  y: number
): { x: number; y: number; z: number } => {
  const width = heightMap[0].length;
  const height = heightMap.length;
  
  // Get neighboring heights, handling edges
  const left = x > 0 ? heightMap[y][x-1] : heightMap[y][x];
  const right = x < width - 1 ? heightMap[y][x+1] : heightMap[y][x];
  const top = y > 0 ? heightMap[y-1][x] : heightMap[y][x];
  const bottom = y < height - 1 ? heightMap[y+1][x] : heightMap[y][x];
  
  // Calculate normal using central differences
  const nx = left - right;
  const ny = 2.0; // Fixed Y component for normalization
  const nz = top - bottom;
  
  // Normalize the vector
  const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
  return {
    x: nx / length,
    y: ny / length,
    z: nz / length
  };
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
 * Bilinear interpolation for a 2D height map
 * @param heightMap - 2D array of height values
 * @param x - Normalized X coordinate (0-1)
 * @param y - Normalized Y coordinate (0-1)
 * @returns Interpolated height value
 */
export const bilinearSample = (heightMap: number[][], x: number, y: number): number => {
  const width = heightMap[0].length;
  const height = heightMap.length;
  
  // Convert to heightmap coordinates
  const gx = x * (width - 1);
  const gy = y * (height - 1);
  
  // Calculate grid cell indices
  const gxi = Math.floor(gx);
  const gyi = Math.floor(gy);
  
  // Calculate fractional parts
  const gxf = gx - gxi;
  const gyf = gy - gyi;
  
  // Handle edge cases
  const gxi1 = Math.min(gxi + 1, width - 1);
  const gyi1 = Math.min(gyi + 1, height - 1);
  
  // Get the four corner values
  const v00 = heightMap[gyi][gxi];
  const v10 = heightMap[gyi][gxi1];
  const v01 = heightMap[gyi1][gxi];
  const v11 = heightMap[gyi1][gxi1];
  
  // Interpolate first horizontally, then vertically
  const vt0 = lerp(v00, v10, gxf);
  const vt1 = lerp(v01, v11, gxf);
  
  return lerp(vt0, vt1, gyf);
};
