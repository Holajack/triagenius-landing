
import { useMemo } from 'react';
import * as THREE from 'three';

// Create our own noise function since the SimplexNoise import is problematic
const noise = (x: number, y: number, seed = 1) => {
  const dot2 = (i: number, x: number, y: number) => {
    const u = i & 2;
    const v = i & 1;
    return (u ? -x : x) + (v ? -y : y);
  };
  
  const permute = (i: number) => {
    return ((i * 34) + 1) * i % 289;
  };
  
  let n0, n1, n2;
  const s = (x + y) * 0.366025404;
  const ix = Math.floor(x + s);
  const iy = Math.floor(y + s);
  const t = (ix + iy) * 0.211324865 + seed;
  const x0 = x + s - ix;
  const y0 = y + s - iy;
  
  let i1, j1;
  if (x0 > y0) { i1 = 1; j1 = 0; }
  else { i1 = 0; j1 = 1; }
  
  const x1 = x0 - i1 + 0.211324865;
  const y1 = y0 - j1 + 0.211324865;
  const x2 = x0 - 1.0 + 2.0 * 0.211324865;
  const y2 = y0 - 1.0 + 2.0 * 0.211324865;
  
  const i = ix % 289;
  const j = iy % 289;
  
  let p0 = permute((i + 0 + permute(j + 0)) % 289);
  let p1 = permute((i + i1 + permute(j + j1)) % 289);
  let p2 = permute((i + 1 + permute(j + 1)) % 289);
  
  const t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 < 0) n0 = 0.0;
  else {
    n0 = t0 * t0 * t0 * t0 * dot2(p0 % 7, x0, y0);
  }
  
  const t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 < 0) n1 = 0.0;
  else {
    n1 = t1 * t1 * t1 * t1 * dot2(p1 % 7, x1, y1);
  }
  
  const t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 < 0) n2 = 0.0;
  else {
    n2 = t2 * t2 * t2 * t2 * dot2(p2 % 7, x2, y2);
  }
  
  // Range: -1 to 1
  return 40.0 * (n0 + n1 + n2);
};

interface BrainTrailProps {
  brainRegions: { type: string, position: [number, number, number], label: string }[];
}

export const BrainTrails = ({ brainRegions }: BrainTrailProps) => {
  // Define colors for each brain region type
  const getRegionColor = (type: string): number => {
    switch (type) {
      case 'prefrontal': return 0xff0000; // Red
      case 'hippocampus': return 0x1EAEDB; // Blue
      case 'amygdala': return 0x4AC157; // Green
      case 'cerebellum': return 0xFDC536; // Yellow
      case 'parietal': return 0xD946EF; // Magenta
      default: return 0xFFFFFF; // White
    }
  };

  // Create trail for each brain region
  const trails = useMemo(() => {
    console.log("Creating brain region trails for:", brainRegions);
    return brainRegions.filter(region => region.type !== 'basecamp').map((region, index) => {
      // Starting point (basecamp)
      const startPoint = new THREE.Vector3(0, 0, 0);
      
      // End point (brain region location)
      const endPoint = new THREE.Vector3(...region.position);
      
      // Generate curve points between start and end
      const points = [];
      const segmentCount = 15; // More segments for smoother trails
      
      // Determine trail style based on region type
      let trailHeight = 5;
      let trailVariation = 2;
      let trailThickness = 0.3;
      
      switch (region.type) {
        case 'prefrontal': // Decision making - more direct path
          trailHeight = 6;
          trailVariation = 1.5;
          trailThickness = 0.4;
          break;
        case 'hippocampus': // Memory - winding path
          trailHeight = 5;
          trailVariation = 3;
          trailThickness = 0.35;
          break;
        case 'amygdala': // Emotional - erratic path
          trailHeight = 4;
          trailVariation = 4;
          trailThickness = 0.3;
          break;
        case 'cerebellum': // Motor skills - smooth path
          trailHeight = 7;
          trailVariation = 1;
          trailThickness = 0.45;
          break;
        case 'parietal': // Problem solving - complex path
          trailHeight = 5.5;
          trailVariation = 2.5;
          trailThickness = 0.35;
          break;
      }
      
      for (let i = 0; i <= segmentCount; i++) {
        // Interpolate between start and end points
        const t = i / segmentCount;
        const x = startPoint.x + (endPoint.x - startPoint.x) * t;
        const z = startPoint.z + (endPoint.z - startPoint.z) * t;
        
        // Add randomness based on region type
        const offsetX = i > 0 && i < segmentCount ? (noise(t, index, 100) * trailVariation) : 0;
        const offsetZ = i > 0 && i < segmentCount ? (noise(t + 100, index, 200) * trailVariation) : 0;
        
        // Calculate height based on noise and add an arc
        const baseHeight = noise(x / 10, z / 10, 300) * 2;
        
        // Different arc patterns based on region type
        let arcHeight;
        if (region.type === 'prefrontal') {
          // Linear with slight bump at end
          arcHeight = Math.pow(t, 0.8) * trailHeight;
        } else if (region.type === 'hippocampus') {
          // Winding pattern
          arcHeight = Math.sin(t * Math.PI * 1.5) * trailHeight;
        } else if (region.type === 'amygdala') {
          // Erratic with multiple peaks
          arcHeight = (Math.sin(t * Math.PI * 2) + Math.sin(t * Math.PI * 3.5) * 0.5) * trailHeight;
        } else if (region.type === 'cerebellum') {
          // Smooth arc
          arcHeight = Math.sin(t * Math.PI) * trailHeight;
        } else {
          // Default arc
          arcHeight = Math.sin(t * Math.PI) * trailHeight;
        }
        
        points.push(new THREE.Vector3(
          x + offsetX, 
          baseHeight + arcHeight + 1, // Add 1 to keep above terrain
          z + offsetZ
        ));
      }
      
      // Create smooth curve from points
      const curve = new THREE.CatmullRomCurve3(points);
      
      // Add variation to tube radius based on region
      const radiusSegments = 8;
      const tubeRadius = trailThickness;
      
      // Create tube along curve
      const tubeGeometry = new THREE.TubeGeometry(curve, 30, tubeRadius, radiusSegments, false);
      const tubeMaterial = new THREE.MeshBasicMaterial({ 
        color: getRegionColor(region.type),
        transparent: true,
        opacity: 0.8
      });
      
      // For each trail, add markers at key intervals
      const markers = [];
      const markerCount = 5;
      
      for (let i = 1; i < markerCount; i++) {
        const t = i / markerCount;
        const pointOnCurve = curve.getPoint(t);
        
        // Add custom marker based on region type
        const markerSize = 0.3 + (0.2 * i / markerCount); // Gradually larger markers
        
        markers.push(
          <mesh key={`marker-${index}-${i}`} position={pointOnCurve.toArray()}>
            <sphereGeometry args={[markerSize, 8, 8]} />
            <meshBasicMaterial color={getRegionColor(region.type)} transparent opacity={0.7} />
          </mesh>
        );
      }
      
      return (
        <group key={index}>
          <mesh geometry={tubeGeometry} material={tubeMaterial} />
          
          {/* Starting point marker */}
          <mesh position={points[0].toArray()}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color={0xFFFFFF} />
          </mesh>
          
          {/* End point marker */}
          <mesh position={points[points.length - 1].toArray()}>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshBasicMaterial color={getRegionColor(region.type)} />
          </mesh>
          
          {/* Path markers */}
          {markers}
        </group>
      );
    });
  }, [brainRegions]);

  return <>{trails}</>;
};

