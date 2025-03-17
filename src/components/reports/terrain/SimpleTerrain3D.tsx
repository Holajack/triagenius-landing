import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { smoothNoise, getTerrainColor } from './shaders/terrainUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface SimpleTerrainProps {
  isNightMode: boolean;
  onNightModeToggle: () => void;
}

const SimpleTerrain3D: React.FC<SimpleTerrainProps> = ({ 
  isNightMode, 
  onNightModeToggle 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isNightMode ? 0x001425 : 0xe6f0ff);
    scene.fog = new THREE.Fog(
      isNightMode ? 0x001425 : 0xe6f0ff,
      30,
      100
    );
    
    const camera = new THREE.PerspectiveCamera(
      75, 
      width / height, 
      0.1, 
      1000
    );
    camera.position.set(0, 20, 30);
    camera.lookAt(0, 0, 0);
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: !isMobile,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 80;
    controls.maxPolarAngle = Math.PI / 2.2;
    
    const ambientLight = new THREE.AmbientLight(
      isNightMode ? 0x334466 : 0xffffff, 
      isNightMode ? 0.3 : 0.6
    );
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(
      0xffffff, 
      isNightMode ? 0.5 : 1.0
    );
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    const hemisphereLight = new THREE.HemisphereLight(
      isNightMode ? 0x002244 : 0xaaccff,
      isNightMode ? 0x000000 : 0x554433,
      isNightMode ? 0.2 : 0.4
    );
    scene.add(hemisphereLight);
    
    const createTerrain = () => {
      const size = 50;
      const resolution = isMobile ? 64 : 128;
      
      const geometry = new THREE.PlaneGeometry(
        size, 
        size, 
        resolution, 
        resolution
      );
      
      const positions = geometry.attributes.position as THREE.BufferAttribute;
      const colors = new Float32Array(positions.count * 3);
      const colorAttr = new THREE.BufferAttribute(colors, 3);
      
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        
        const height = smoothNoise(x * 0.04, z * 0.04, 3.0);
        positions.setY(i, height);
        
        const slope = 0.0;
        const [r, g, b] = getTerrainColor(height + 1.5, slope, isNightMode);
        colorAttr.setXYZ(i, r, g, b);
      }
      
      geometry.setAttribute('color', colorAttr);
      geometry.computeVertexNormals();
      
      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.8,
        metalness: 0.1,
        flatShading: false,
      });
      
      const terrain = new THREE.Mesh(geometry, material);
      terrain.rotation.x = -Math.PI / 2;
      terrain.position.y = -5;
      terrain.receiveShadow = true;
      terrain.castShadow = true;
      scene.add(terrain);
      
      return terrain;
    };
    
    const terrain = createTerrain();
    
    const createParticles = () => {
      const particlesCount = isNightMode ? 800 : 200;
      const particlesGeometry = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particlesCount * 3);
      
      for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        particlePositions[i3] = (Math.random() - 0.5) * 60;
        particlePositions[i3 + 1] = Math.random() * 40;
        particlePositions[i3 + 2] = (Math.random() - 0.5) * 60;
      }
      
      particlesGeometry.setAttribute('position', 
        new THREE.BufferAttribute(particlePositions, 3)
      );
      
      const particlesMaterial = new THREE.PointsMaterial({
        color: isNightMode ? 0xffffff : 0xcccccc,
        size: isNightMode ? 0.2 : 0.1,
        transparent: true,
        opacity: isNightMode ? 0.8 : 0.4,
        sizeAttenuation: true,
      });
      
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);
      
      return particles;
    };
    
    const particles = createParticles();
    
    const addLandmarks = () => {
      const terrainSize = 50;
      
      const getHeightAt = (x: number, z: number) => {
        const normalizedX = (x + terrainSize/2) / terrainSize;
        const normalizedZ = (z + terrainSize/2) / terrainSize;
        
        if (normalizedX < 0 || normalizedX > 1 || normalizedZ < 0 || normalizedZ > 1) {
          return 0;
        }
        
        return smoothNoise(x * 0.04, z * 0.04, 3.0);
      };
      
      const peakX = 10;
      const peakZ = -5;
      const peakHeight = getHeightAt(peakX, peakZ);
      
      const peakGeometry = new THREE.ConeGeometry(2, 4, 6);
      const peakMaterial = new THREE.MeshStandardMaterial({
        color: isNightMode ? 0x9999aa : 0xb08060,
        roughness: 0.8
      });
      
      const peak = new THREE.Mesh(peakGeometry, peakMaterial);
      peak.position.set(peakX, peakHeight + 2, peakZ);
      scene.add(peak);
      
      const flagPoleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
      const flagPoleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x888888,
        metalness: 0.6 
      });
      
      const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
      flagPole.position.set(0, 2, 0);
      peak.add(flagPole);
      
      const flagGeometry = new THREE.PlaneGeometry(1.5, 1);
      const flagMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff3333,
        side: THREE.DoubleSide 
      });
      
      const flag = new THREE.Mesh(flagGeometry, flagMaterial);
      flag.position.set(0.8, 1, 0);
      flag.rotation.y = Math.PI / 2;
      flagPole.add(flag);
      
      const treePositions = [
        [5, 10],
        [-8, -5],
        [0, 15],
        [-12, 8],
        [15, -12]
      ];
      
      treePositions.forEach(([tx, tz]) => {
        const treeHeight = getHeightAt(tx, tz);
        
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 3, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
          color: 0x8B4513
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(tx, treeHeight + 1.5, tz);
        scene.add(trunk);
        
        const topGeometry = new THREE.ConeGeometry(2, 4, 8);
        const topMaterial = new THREE.MeshStandardMaterial({
          color: isNightMode ? 0x225544 : 0x225522,
          roughness: 0.8
        });
        
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.set(0, 2.5, 0);
        trunk.add(top);
      });
      
      const pathPoints = [
        new THREE.Vector3(-15, 0, -15),
        new THREE.Vector3(-10, 0, -5),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(10, 0, 5),
        new THREE.Vector3(15, 0, 15)
      ];
      
      pathPoints.forEach(point => {
        point.y = getHeightAt(point.x, point.z) + 0.1;
      });
      
      const curve = new THREE.CatmullRomCurve3(pathPoints);
      const tubeGeometry = new THREE.TubeGeometry(
        curve, 
        64, 
        0.3, 
        8, 
        false
      );
      
      const tubeMaterial = new THREE.MeshStandardMaterial({
        color: 0xd2b48c,
        roughness: 0.9
      });
      
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      scene.add(tube);
    };
    
    addLandmarks();
    
    const createSkybox = () => {
      const skyColor = isNightMode ? 
        new THREE.Color(0x001425) : 
        new THREE.Color(0x87ceeb);
      
      const skyGeo = new THREE.SphereGeometry(100, 32, 32);
      const skyMat = new THREE.MeshBasicMaterial({
        color: skyColor,
        side: THREE.BackSide,
        fog: false,
      });
      
      const sky = new THREE.Mesh(skyGeo, skyMat);
      scene.add(sky);
    };
    
    createSkybox();
    
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      controls.update();
      
      if (particles) {
        particles.rotation.y += 0.0003;
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    setIsInitialized(true);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      
      if (renderer && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      
      renderer.dispose();
    };
  }, [isNightMode, isMobile]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-medium">
          3D Terrain Explorer
        </h3>
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          onClick={onNightModeToggle}
          className={isMobile ? 'px-2 py-1 text-xs' : ''}
        >
          {isNightMode ? 
            <Sun className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} /> : 
            <Moon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
          }
          {isMobile ? '' : (isNightMode ? 'Day Mode' : 'Night Mode')}
        </Button>
      </div>
      
      <div 
        ref={containerRef} 
        className="flex-grow relative rounded-md overflow-hidden border"
        style={{ minHeight: '300px' }}
        aria-label="3D terrain visualization"
      >
        {!isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <p>Initializing terrain...</p>
          </div>
        )}
      </div>
      
      <div className="mt-2 text-xs text-center text-muted-foreground">
        Drag to rotate | Scroll to zoom | Pinch to zoom on mobile
      </div>
    </div>
  );
};

export default SimpleTerrain3D;
