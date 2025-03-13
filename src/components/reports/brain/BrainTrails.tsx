
import { useMemo } from 'react';
import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';

interface BrainTrailProps {
  brainRegions: { type: string, position: [number, number, number], label: string }[];
}

export const BrainTrails = ({ brainRegions }: BrainTrailProps) => {
  const noise = useMemo(() => new SimplexNoise(), []);
  
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
      const segmentCount = 10;
      
      for (let i = 0; i <= segmentCount; i++) {
        // Interpolate between start and end points
        const t = i / segmentCount;
        const x = startPoint.x + (endPoint.x - startPoint.x) * t;
        const z = startPoint.z + (endPoint.z - startPoint.z) * t;
        
        // Add some randomness to make the path look natural
        const offsetX = i > 0 && i < segmentCount ? (noise.noise(t, index) * 2) : 0;
        const offsetZ = i > 0 && i < segmentCount ? (noise.noise(t + 100, index) * 2) : 0;
        
        // Calculate height based on noise and add a small arc
        const baseHeight = noise.noise(x / 10, z / 10) * 5;
        const arcHeight = Math.sin(t * Math.PI) * 5; // Arc up and then down
        
        points.push(new THREE.Vector3(
          x + offsetX, 
          baseHeight + arcHeight + 1, // Add 1 to keep above terrain
          z + offsetZ
        ));
      }
      
      // Create smooth curve from points
      const curve = new THREE.CatmullRomCurve3(points);
      
      // Create tube along curve
      const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.3, 8, false);
      const tubeMaterial = new THREE.MeshBasicMaterial({ 
        color: getRegionColor(region.type),
        transparent: true,
        opacity: 0.8
      });
      
      return (
        <mesh key={index} geometry={tubeGeometry} material={tubeMaterial}>
          {/* Add sphere markers at key points */}
          <mesh position={points[0].toArray()}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color={0xFFFFFF} />
          </mesh>
          <mesh position={points[points.length - 1].toArray()}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color={getRegionColor(region.type)} />
          </mesh>
        </mesh>
      );
    });
  }, [brainRegions, noise]);

  return <>{trails}</>;
};
