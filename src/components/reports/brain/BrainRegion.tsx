import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import * as THREE from 'three';

interface BrainRegionProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color: string;
  name: string;
  activity: number;
  isActive: boolean;
  geometry?: string;
  onClick: () => void;
}

export const BrainRegion = ({
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  color,
  name,
  activity,
  isActive,
  geometry = 'sphere',
  onClick
}: BrainRegionProps) => {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Calculate pulse scale based on activity level
      const pulseIntensity = 0.02 * activity;
      const baseScale = isActive ? 1.05 : 1;
      const pulseScale = baseScale + Math.sin(state.clock.elapsedTime * 2) * pulseIntensity;
      
      meshRef.current.scale.setScalar(pulseScale);
    }
  });

  // Enhanced distortion algorithm for realistic brain folds
  const createDistortedGeometry = (baseGeometry: THREE.BufferGeometry) => {
    const positionAttr = baseGeometry.getAttribute('position');
    const vertexCount = positionAttr.count;
    const newPositions = new Float32Array(positionAttr.array.length);
    const vertex = new THREE.Vector3();
    const normal = new THREE.Vector3();

    // Region-specific fold patterns
    const getFoldPattern = (regionType: string, vertex: THREE.Vector3) => {
      const baseFreq = regionType === 'frontal' ? 6.0 : 
                      regionType === 'temporal' ? 5.0 :
                      regionType === 'parietal' ? 4.5 :
                      regionType === 'occipital' ? 5.5 :
                      regionType === 'cerebellum' ? 7.0 : 4.0;

      const primary = Math.sin(vertex.x * baseFreq) * 
                     Math.cos(vertex.y * baseFreq * 1.3) * 
                     Math.sin(vertex.z * baseFreq * 0.8);

      const secondary = Math.cos(vertex.x * baseFreq * 1.5 + 1.5) * 
                       Math.sin(vertex.y * baseFreq * 0.9 + 0.8) * 
                       Math.cos(vertex.z * baseFreq * 1.2 + 0.5);

      const tertiary = Math.sin(vertex.x * baseFreq * 0.7 + 2.1) * 
                      Math.sin(vertex.y * baseFreq * 1.1 + 1.3) * 
                      Math.cos(vertex.z * baseFreq * 1.4 + 0.9);

      // Combine patterns with varying weights
      return {
        primary: primary * 0.5,
        secondary: secondary * 0.3,
        tertiary: tertiary * 0.2
      };
    };

    for (let i = 0; i < vertexCount; i++) {
      vertex.fromBufferAttribute(positionAttr, i);
      
      // Get region-specific fold pattern
      const folds = getFoldPattern(geometry, vertex);
      const totalFoldIntensity = folds.primary + folds.secondary + folds.tertiary;
      
      // Calculate distortion intensity based on region and position
      const distortionIntensity = geometry === 'cerebellum' ? 0.2 : 
                                 geometry === 'brainstem' ? 0.1 : 0.15;
      
      // Apply anatomically-inspired distortion
      normal.copy(vertex).normalize();
      vertex.add(normal.multiplyScalar(totalFoldIntensity * distortionIntensity));
      
      // Store the distorted position
      newPositions[i * 3] = vertex.x;
      newPositions[i * 3 + 1] = vertex.y;
      newPositions[i * 3 + 2] = vertex.z;
    }

    // Create and return the distorted geometry
    const distortedGeometry = baseGeometry.clone();
    distortedGeometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    distortedGeometry.computeVertexNormals();
    return distortedGeometry;
  };

  // Create anatomically-inspired geometry with higher polygon counts
  const brainGeometry = useMemo(() => {
    let baseGeometry;
    
    const highPolyCount = geometry === 'cerebellum' ? 96 : 64; // Increased polygon count
    
    switch(geometry) {
      case 'frontal':
        baseGeometry = new THREE.SphereGeometry(1, highPolyCount, highPolyCount);
        baseGeometry.scale(1.2, 1.1, 1.1);
        break;
      case 'temporal':
        baseGeometry = new THREE.SphereGeometry(0.8, highPolyCount, highPolyCount);
        baseGeometry.scale(1.2, 0.8, 0.9);
        // Apply temporal lobe specific deformation
        const tempVerts = baseGeometry.getAttribute('position');
        for (let i = 0; i < tempVerts.count; i++) {
          const vertex = new THREE.Vector3().fromBufferAttribute(tempVerts, i);
          if (vertex.y < 0 && vertex.x < 0) {
            vertex.z += Math.pow(Math.abs(vertex.y), 1.5) * 0.3;
            tempVerts.setXYZ(i, vertex.x, vertex.y, vertex.z);
          }
        }
        break;
      case 'parietal':
        baseGeometry = new THREE.SphereGeometry(0.9, highPolyCount, highPolyCount);
        baseGeometry.scale(1.1, 1.1, 1);
        break;
      case 'occipital':
        baseGeometry = new THREE.SphereGeometry(0.8, highPolyCount, highPolyCount);
        // Create more pronounced curvature at the back
        const occVerts = baseGeometry.getAttribute('position');
        for (let i = 0; i < occVerts.count; i++) {
          const vertex = new THREE.Vector3().fromBufferAttribute(occVerts, i);
          if (vertex.z < -0.5) {
            vertex.z *= 1.2;
            vertex.y *= 0.9;
            occVerts.setXYZ(i, vertex.x, vertex.y, vertex.z);
          }
        }
        break;
      case 'cerebellum':
        baseGeometry = new THREE.SphereGeometry(0.9, highPolyCount, highPolyCount);
        baseGeometry.scale(1.2, 0.7, 1);
        break;
      case 'hippocampus':
        // Create curved hippocampus shape
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0.2, 0.1, 0.1),
          new THREE.Vector3(0.4, 0.1, 0),
          new THREE.Vector3(0.5, 0, -0.2),
        ]);
        baseGeometry = new THREE.TubeGeometry(curve, highPolyCount, 0.15, 16, false);
        break;
      default:
        baseGeometry = new THREE.SphereGeometry(1, highPolyCount, highPolyCount);
    }
    
    return createDistortedGeometry(baseGeometry);
  }, [geometry]);

  // Enhanced PBR material properties for tissue-like appearance
  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color),
      roughness: 0.7,
      metalness: 0.0,
      transmission: 0.15,
      thickness: 1.0,
      clearcoat: 0.3,
      clearcoatRoughness: 0.25,
      envMapIntensity: 1.0,
      sheenColor: new THREE.Color(color).multiplyScalar(0.8),
      sheen: 0.15,
      ior: 1.4,
      specularIntensity: 0.4,
      specularColor: new THREE.Color(0xffffff),
      attenuationColor: new THREE.Color(color).multiplyScalar(0.9),
      attenuationDistance: 0.5
    });
  }, [color]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={onClick}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'default'}
      geometry={brainGeometry}
      castShadow
      receiveShadow
    >
      <primitive object={material} attach="material" />
    </mesh>
  );
};
