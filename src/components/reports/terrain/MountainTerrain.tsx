
import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Create a custom SimplexNoise implementation
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
    
    // Shuffle array with the Mulberry32 algorithm
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
  
  // Gradient function
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
    
    // Add and scale
    return 70 * (n0 + n1 + n2);
  }
  
  private getCornerNoise(x: number, y: number, ii: number, jj: number): number {
    const t = 0.5 - x * x - y * y;
    if (t < 0) return 0;
    
    const gi = this.perm[ii + this.perm[jj]] % 12;
    return t * t * t * t * this.grad(gi, x, y);
  }
}

interface MountainTerrainProps {
  size?: number;
  resolution?: number;
  heightMultiplier?: number;
  biomeType?: 'mountains' | 'desert' | 'forest' | 'mixed';
}

export const MountainTerrain = ({
  size = 100,
  resolution = 200, // Reduce slightly from 300 for better performance
  heightMultiplier = 15,
  biomeType = 'mountains'
}: MountainTerrainProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Generate terrain geometry with high resolution
  const geometry = useMemo(() => {
    console.log("Creating high-resolution mountain terrain geometry", { 
      size, resolution, vertexCount: resolution * resolution 
    });
    
    // Create a plane geometry with high vertex count
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);
    
    try {
      // Create noise generators with different seeds
      const noise1 = new SimplexNoise(42);
      const noise2 = new SimplexNoise(123);
      const noise3 = new SimplexNoise(789);
      const noise4 = new SimplexNoise(456);
      
      // Apply multiple noise layers for realistic terrain
      const vertices = geo.attributes.position.array;
      
      // Constants for different terrain features
      const MOUNTAIN_SCALE = 40;
      const RIDGE_SCALE = 25;
      const HILL_SCALE = 15;
      const DETAIL_SCALE = 8;
      const MICRO_DETAIL_SCALE = 3;
      
      // Biome-specific modifiers
      let peakHeight = 1.0;
      let roughness = 1.0;
      let ridgeIntensity = 1.0;
      
      switch(biomeType) {
        case 'mountains':
          peakHeight = 1.2;
          roughness = 1.1;
          ridgeIntensity = 1.3;
          break;
        case 'desert':
          peakHeight = 0.7;
          roughness = 0.6;
          ridgeIntensity = 0.4;
          break;
        case 'forest':
          peakHeight = 0.85;
          roughness = 0.75;
          ridgeIntensity = 0.7;
          break;
        case 'mixed':
        default:
          // Default values
          break;
      }
      
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        
        // Create complex mountainous terrain with multiple noise layers
        
        // Large mountain features
        const mountainNoise = noise1.noise(x / MOUNTAIN_SCALE, z / MOUNTAIN_SCALE) * peakHeight;
        
        // Ridge formations for mountain ranges
        const nx = x / RIDGE_SCALE;
        const nz = z / RIDGE_SCALE;
        const ridgeNoise = ridgeIntensity * Math.pow(1 - Math.abs(noise2.noise(nx, nz)), 2);
        
        // Medium hills and valleys
        const hillNoise = 0.3 * noise3.noise(x / HILL_SCALE, z / HILL_SCALE) * roughness;
        
        // Small terrain details
        const detailNoise = 0.1 * noise4.noise(x / DETAIL_SCALE, z / DETAIL_SCALE);
        
        // Micro details (rocks, small bumps)
        const microNoise = 0.05 * noise1.noise(x / MICRO_DETAIL_SCALE, z / MICRO_DETAIL_SCALE);
        
        // Combine all noise layers
        const combinedNoise = (
          mountainNoise * 0.5 + 
          ridgeNoise * 0.25 + 
          hillNoise * 0.15 + 
          detailNoise * 0.07 +
          microNoise * 0.03
        );
        
        // Apply elevation
        vertices[i + 1] = combinedNoise * heightMultiplier;
        
        // Add biome-specific features
        if (biomeType === 'mountains') {
          // Make higher areas more jagged
          if (vertices[i + 1] > heightMultiplier * 0.6) {
            vertices[i + 1] += noise2.noise(x * 0.2, z * 0.2) * (vertices[i + 1] / heightMultiplier) * 2;
          }
          
          // Create sharp ridges along mountain tops
          if (vertices[i + 1] > heightMultiplier * 0.7) {
            const ridgeValue = Math.abs(noise3.noise(x * 0.1, z * 0.1));
            if (ridgeValue > 0.7) {
              vertices[i + 1] += ridgeValue * 2;
            }
          }
        } else if (biomeType === 'desert') {
          // Desert dunes - smoother undulations
          if (vertices[i + 1] < heightMultiplier * 0.4) {
            vertices[i + 1] += Math.sin(x / 8) * Math.cos(z / 10) * 0.8;
          }
        } else if (biomeType === 'forest') {
          // Forest terrain - more small variations
          vertices[i + 1] += noise4.noise(x * 0.4, z * 0.4) * 0.8;
        }
      }
      
      // Update normals for proper lighting
      geo.computeVertexNormals();
      console.log("High-resolution mountain terrain created successfully");
    } catch (error) {
      console.error("Error creating mountain terrain:", error);
    }
    
    return geo;
  }, [size, resolution, heightMultiplier, biomeType]);
  
  // Create biome-specific material with enhanced features
  const material = useMemo(() => {
    let baseColor;
    
    switch(biomeType) {
      case 'mountains':
        baseColor = new THREE.Color(0x8c9484); // Gray-green for mountains
        break;
      case 'desert':
        baseColor = new THREE.Color(0xd2b48c); // Tan for desert
        break;
      case 'forest':
        baseColor = new THREE.Color(0x4c7a3d); // Dark green for forest
        break;
      case 'mixed':
      default:
        baseColor = new THREE.Color(0x95a186); // Mixed terrain color
        break;
    }
    
    return new THREE.MeshPhongMaterial({ 
      color: baseColor,
      flatShading: true,
      shininess: 5,
      vertexColors: false,
      side: THREE.DoubleSide // Make sure terrain is visible from both sides
    });
  }, [biomeType]);
  
  // Log vertex count when mounted
  useEffect(() => {
    if (meshRef.current && meshRef.current.geometry) {
      const vertexCount = resolution * resolution;
      console.log(`MountainTerrain mounted with ~${vertexCount.toLocaleString()} vertices`);
    }
  }, [resolution]);
  
  // Add subtle animation to simulate atmospheric effects
  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Very subtle movement to simulate atmospheric distortion
      const time = clock.getElapsedTime() * 0.05;
      meshRef.current.rotation.z = Math.sin(time) * 0.001;
    }
  });
  
  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -1, 0]} // Slightly below the center to align with grid
      receiveShadow
      castShadow
      visible={true}
    />
  );
};
