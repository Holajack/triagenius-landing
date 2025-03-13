
import { useMemo } from 'react';
import * as THREE from 'three';

interface BrainTrailProps {
  brainRegions: { type: string, position: [number, number, number], label: string }[];
}

export const BrainTrails = ({ brainRegions }: BrainTrailProps) => {
  // Define colors for each brain region type
  const getRegionColor = (type: string): number => {
    switch (type) {
      case 'prefrontal': return 0xea384c; // Red
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
      const segmentCount = 8; // Fewer segments for simpler trails
      
      // Create simple curved trail
      for (let i = 0; i <= segmentCount; i++) {
        // Interpolate between start and end points
        const t = i / segmentCount;
        const x = startPoint.x + (endPoint.x - startPoint.x) * t;
        const z = startPoint.z + (endPoint.z - startPoint.z) * t;
        
        // Create a slight arc in the trail
        const y = Math.sin(t * Math.PI) * 0.5;
        
        points.push(new THREE.Vector3(x, y, z));
      }
      
      // Create smooth curve from points
      const curve = new THREE.CatmullRomCurve3(points);
      
      // Create tube along curve
      const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.15, 8, false);
      const tubeMaterial = new THREE.MeshBasicMaterial({ 
        color: getRegionColor(region.type),
        transparent: true,
        opacity: 0.9
      });
      
      return (
        <mesh key={index} geometry={tubeGeometry} material={tubeMaterial} />
      );
    });
  }, [brainRegions]);

  return <>{trails}</>;
};
