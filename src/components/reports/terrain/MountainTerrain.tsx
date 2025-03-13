
import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useIsMobile } from '@/hooks/use-mobile';
import { TextureLoader } from 'three';

// Custom SimplexNoise implementation
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
  
  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const grad = 1 + (h & 7); // Gradient value from 1-8
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
}

interface MountainTerrainProps {
  size?: number;
  resolution?: number;
  heightMultiplier?: number;
  biomeType?: 'mountains' | 'desert' | 'forest' | 'mixed';
  textureQuality?: 'high' | 'medium' | 'low';
}

export const MountainTerrain = ({
  size = 100,
  resolution = 120,
  heightMultiplier = 15,
  biomeType = 'mountains',
  textureQuality = 'high'
}: MountainTerrainProps) => {
  const isMobile = useIsMobile();
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Adjust resolution based on device to optimize performance
  const adjustedResolution = isMobile ? Math.floor(resolution / 2) : resolution; // Lower for mobile (30k vs 90k vertices)
  
  // Generate terrain geometry with appropriate resolution
  const geometry = useMemo(() => {
    const vertexCount = adjustedResolution * adjustedResolution;
    console.log(`Creating mountain terrain geometry with ${vertexCount} vertices, mobile: ${isMobile}`);
    
    // Create a plane geometry with high vertex count
    const geo = new THREE.PlaneGeometry(size, size, adjustedResolution - 1, adjustedResolution - 1);
    
    try {
      // Create noise generators with different seeds
      const noise1 = new SimplexNoise(42);
      const noise2 = new SimplexNoise(123);
      const noise3 = new SimplexNoise(789);
      
      // Apply multiple noise layers for realistic terrain
      const vertices = geo.attributes.position.array;
      
      // Constants for different terrain features
      const MOUNTAIN_SCALE = 40;
      const RIDGE_SCALE = 25;
      const HILL_SCALE = 15;
      const DETAIL_SCALE = 8;
      const MICRO_DETAIL_SCALE = 2;
      
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
          break;
      }
      
      // Color array for vertex coloring based on height/features
      const colors = new Float32Array(vertices.length);
      
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
        const detailNoise = 0.1 * noise1.noise(x / DETAIL_SCALE, z / DETAIL_SCALE);
        
        // Micro details for rock formations
        const microNoise = 0.05 * noise2.noise(x / MICRO_DETAIL_SCALE, z / MICRO_DETAIL_SCALE);
        
        // Combine all noise layers
        const combinedNoise = (
          mountainNoise * 0.5 + 
          ridgeNoise * 0.25 + 
          hillNoise * 0.15 + 
          detailNoise * 0.1 +
          microNoise * 0.05
        );
        
        // Apply elevation
        vertices[i + 1] = combinedNoise * heightMultiplier;
        
        // Add biome-specific features
        if (biomeType === 'mountains') {
          // Make higher areas more jagged
          if (vertices[i + 1] > heightMultiplier * 0.6) {
            vertices[i + 1] += noise2.noise(x * 0.2, z * 0.2) * (vertices[i + 1] / heightMultiplier) * 2;
          }
          
          // Create deeper valleys
          if (vertices[i + 1] < heightMultiplier * 0.3) {
            vertices[i + 1] -= noise3.noise(x * 0.3, z * 0.3) * 0.5;
          }
        }
        
        // Generate vertex colors based on height for visual appeal
        const normalizedHeight = (vertices[i + 1] / heightMultiplier);
        const colorIndex = i / 3 * 3;
        
        if (normalizedHeight > 0.8) {
          // Snow caps - white
          colors[colorIndex] = 0.95; // R
          colors[colorIndex + 1] = 0.95; // G
          colors[colorIndex + 2] = 0.98; // B
        } else if (normalizedHeight > 0.6) {
          // Rocky peaks - gray with hints of brown
          colors[colorIndex] = 0.7;
          colors[colorIndex + 1] = 0.65;
          colors[colorIndex + 2] = 0.65;
        } else if (normalizedHeight > 0.4) {
          // Mid-level terrain - brown
          colors[colorIndex] = 0.55;
          colors[colorIndex + 1] = 0.45;
          colors[colorIndex + 2] = 0.40;
        } else if (normalizedHeight > 0.2) {
          // Lower slopes - darker brown
          colors[colorIndex] = 0.45;
          colors[colorIndex + 1] = 0.38;
          colors[colorIndex + 2] = 0.35;
        } else {
          // Valley floors - darkest brown
          colors[colorIndex] = 0.35;
          colors[colorIndex + 1] = 0.30;
          colors[colorIndex + 2] = 0.28;
        }
      }
      
      // Add vertex colors to the geometry
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      // Update normals for proper lighting
      geo.computeVertexNormals();
      console.log("Mountain terrain created successfully");
    } catch (error) {
      console.error("Error creating mountain terrain:", error);
    }
    
    return geo;
  }, [size, adjustedResolution, heightMultiplier, biomeType, isMobile]);
  
  // Create optimized material for better performance and visibility
  const material = useMemo(() => {
    // Select color based on biome type
    let baseColor;
    
    switch(biomeType) {
      case 'mountains':
        baseColor = new THREE.Color(0x8c9484);
        break;
      case 'desert':
        baseColor = new THREE.Color(0xd2b48c);
        break;
      case 'forest':
        baseColor = new THREE.Color(0x4c7a3d);
        break;
      case 'mixed':
      default:
        baseColor = new THREE.Color(0x95a186);
        break;
    }
    
    // Using MeshStandardMaterial for better visual quality
    return new THREE.MeshStandardMaterial({ 
      color: baseColor,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true,
      side: THREE.DoubleSide,
      vertexColors: true // Use the vertex colors we defined
    });
  }, [biomeType, textureQuality]);
  
  // Add subtle animation to the terrain
  useFrame((state) => {
    if (meshRef.current) {
      // Very subtle movement to make it feel more alive
      const time = state.clock.getElapsedTime();
      
      // Almost imperceptible gentle breathing motion
      meshRef.current.position.y = Math.sin(time * 0.1) * 0.05;
    }
  });
  
  // Log vertex count when mounted
  useEffect(() => {
    if (meshRef.current) {
      const vertexCount = adjustedResolution * adjustedResolution;
      console.log(`MountainTerrain mounted with ${vertexCount} vertices (mobile: ${isMobile})`);
    }
    
    return () => {
      console.log("MountainTerrain unmounting");
    };
  }, [adjustedResolution, isMobile]);
  
  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -5, 0]} // Position lower to be more visible
      receiveShadow
      castShadow
    />
  );
};
