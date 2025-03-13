
import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Create our own SimplexNoise implementation since the Three.js examples one is causing issues
class SimplexNoise {
  private perm: number[] = [];
  
  constructor(seed = Math.random()) {
    this.seed(seed);
  }
  
  private seed(seed: number): void {
    const permutation: number[] = [];
    for (let i = 0; i < 256; i++) {
      permutation.push(i);
    }
    
    // Shuffle array
    const random = this.mulberry32(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
    }
    
    // Extend to 512 elements
    for (let i = 0; i < 512; i++) {
      this.perm[i] = permutation[i & 255];
    }
  }
  
  private mulberry32(seed: number): () => number {
    return () => {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  
  // Gradient function adapted from common implementations
  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const grad = 1 + (h & 7); // Gradient value from 1-8
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  
  // 2D Simplex noise
  public noise(xin: number, yin: number): number {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;
    
    // Skew input space
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    
    // Unskewed grid cell origin
    const X0 = i - t;
    const Y0 = j - t;
    
    // Relative coords
    const x0 = xin - X0;
    const y0 = yin - Y0;
    
    // Determine which simplex we're in
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    
    // Offsets for other corners
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    
    // Hash coordinates
    const ii = i & 255;
    const jj = j & 255;
    
    // Calculate noise contributions
    const n0 = this.getCornerNoise(x0, y0, ii, jj);
    const n1 = this.getCornerNoise(x1, y1, ii + i1, jj + j1);
    const n2 = this.getCornerNoise(x2, y2, ii + 1, jj + 1);
    
    // Add and scale to [-1, 1]
    return 70 * (n0 + n1 + n2);
  }
  
  private getCornerNoise(x: number, y: number, ii: number, jj: number): number {
    const t = 0.5 - x * x - y * y;
    if (t < 0) return 0;
    
    const gi = this.perm[ii + this.perm[jj]] % 12;
    return t * t * t * t * this.grad(gi, x, y);
  }
}

interface TerrainSystemProps {
  size?: number;
  resolution?: number;
  heightMultiplier?: number;
  roughness?: number;
  biomeType?: 'mountains' | 'desert' | 'forest' | 'mixed';
}

export const TerrainSystem = ({
  size = 100,
  resolution = 150, // Increased resolution for more vertices
  heightMultiplier = 15, // Higher mountains
  roughness = 0.6,
  biomeType = 'mountains'
}: TerrainSystemProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Generate different noise scales for terrain features
  const geometry = useMemo(() => {
    console.log("Creating terrain geometry", { size, resolution, heightMultiplier, biomeType });
    
    // Use higher resolution to approach the vertex count goal (resolution×resolution gives vertex count)
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);
    
    try {
      // Create SimplexNoise instance
      const noise = new SimplexNoise();
      const noise2 = new SimplexNoise(42); // Secondary noise with different seed
      const noise3 = new SimplexNoise(123); // Tertiary noise for small details
      
      // Apply multiple noise layers for more realistic terrain
      const vertices = geo.attributes.position.array;
      
      // Constants for different terrain features
      const MOUNTAIN_SCALE = 25;
      const HILL_SCALE = 10;
      const DETAIL_SCALE = 5;
      const MICRO_DETAIL_SCALE = 2;
      
      // Biome specific modifiers
      let peakHeight = 1.0;
      let rockiness = 1.0;
      let smoothness = 1.0;
      
      switch(biomeType) {
        case 'mountains':
          peakHeight = 1.2;
          rockiness = 1.4;
          smoothness = 0.7;
          break;
        case 'desert':
          peakHeight = 0.7;
          rockiness = 0.5;
          smoothness = 1.2;
          break;
        case 'forest':
          peakHeight = 0.9;
          rockiness = 0.8;
          smoothness = 1.1;
          break;
        case 'mixed':
        default:
          // Default values
          break;
      }
      
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        
        // Create multiple layers of noise for more natural terrain
        
        // Large mountain features
        const mountainNoise = noise.noise(x / MOUNTAIN_SCALE, z / MOUNTAIN_SCALE) * peakHeight;
        
        // Medium hills and valleys
        const hillNoise = noise2.noise(x / HILL_SCALE, z / HILL_SCALE) * 0.3 * rockiness;
        
        // Small terrain details
        const detailNoise = noise3.noise(x / DETAIL_SCALE, z / DETAIL_SCALE) * 0.1;
        
        // Micro details (rocks, small bumps)
        const microNoise = noise.noise(x / MICRO_DETAIL_SCALE, z / MICRO_DETAIL_SCALE) * 0.05;
        
        // Ridge formations for mountain ranges
        const ridge = Math.abs(mountainNoise) * 1.5;
        
        // Plateau formations
        const plateau = Math.pow(Math.max(0, mountainNoise * 2), 3) * 0.3;
        
        // Combine all noise layers with different weights
        const combinedNoise = (
          mountainNoise * 0.6 + 
          hillNoise * 0.25 + 
          detailNoise * 0.1 +
          microNoise * 0.05 + 
          ridge * rockiness * 0.2 + 
          plateau * 0.1
        ) / smoothness;
        
        // Apply height with terrain type variations
        vertices[i + 1] = combinedNoise * heightMultiplier;
        
        // Add additional features based on biome type
        if (biomeType === 'mountains') {
          // Make higher areas more jagged for mountains
          if (vertices[i + 1] > heightMultiplier * 0.6) {
            vertices[i + 1] += (noise2.noise(x, z) * 2) * (vertices[i + 1] / heightMultiplier);
          }
        } else if (biomeType === 'desert') {
          // Desert dunes - smoother undulations
          if (vertices[i + 1] < heightMultiplier * 0.4) {
            vertices[i + 1] += Math.sin(x / 5) * Math.cos(z / 7) * 0.5;
          }
        }
      }
      
      // Update normals for proper lighting
      geo.computeVertexNormals();
      console.log("Terrain geometry created successfully");
    } catch (error) {
      console.error("Error creating terrain geometry:", error);
    }
    
    return geo;
  }, [size, resolution, heightMultiplier, roughness, biomeType]);
  
  // Create biome-specific material
  const material = useMemo(() => {
    let color;
    
    switch(biomeType) {
      case 'mountains':
        color = new THREE.Color(0x8c9484); // Gray-green for mountains
        break;
      case 'desert':
        color = new THREE.Color(0xd2b48c); // Tan for desert
        break;
      case 'forest':
        color = new THREE.Color(0x4c7a3d); // Dark green for forest
        break;
      case 'mixed':
      default:
        color = new THREE.Color(0x95a186); // Mixed terrain color
        break;
    }
    
    return new THREE.MeshStandardMaterial({ 
      color,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true
    });
  }, [biomeType]);
  
  // Visualize the vertices count
  useEffect(() => {
    if (meshRef.current) {
      const vertexCount = resolution * resolution;
      console.log(`TerrainSystem mounted with vertex count: ${vertexCount}`);
    }
  }, [resolution]);
  
  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -2, 0]} 
      receiveShadow
    />
  );
};

