
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface TerrainProps {
  textureUrl: string;
  terrainData: any;
  isNightMode: boolean;
}

const Terrain3D: React.FC<TerrainProps> = ({ textureUrl, terrainData, isNightMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Setup
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isNightMode ? 0x001425 : 0xe6f0ff);
    scene.fog = new THREE.Fog(isNightMode ? 0x001425 : 0xe6f0ff, 80, 150);
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 30, 50);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Add OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 15;
    controls.maxDistance = 100;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(
      isNightMode ? 0x001133 : 0x404040, 
      isNightMode ? 0.2 : 0.7
    );
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(
      0xffffff, 
      isNightMode ? 0.3 : 1.0
    );
    sunLight.position.set(10, 10, 10);
    sunLight.castShadow = true;
    scene.add(sunLight);
    
    // Load texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(textureUrl, (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      
      // Create a simple plane geometry for the terrain
      const geometry = new THREE.PlaneGeometry(
        terrainData.groundParams.width,
        terrainData.groundParams.height,
        200,
        200
      );
      
      // Generate height data
      const vertices = geometry.attributes.position;
      for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i);
        const z = vertices.getZ(i);
        
        // Simple height function
        const nx = x / terrainData.groundParams.width * 10;
        const nz = z / terrainData.groundParams.height * 10;
        
        const height = Math.sin(nx) * Math.cos(nz) * 5 + 
                       Math.sin(nx * 2) * Math.cos(nz * 2) * 2.5 + 
                       Math.sin(nx * 4) * Math.cos(nz * 4) * 1.25;
                       
        vertices.setY(i, height);
      }
      
      // Compute normals for lighting
      geometry.computeVertexNormals();
      
      // Create material
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.2,
      });
      
      // Create mesh
      const terrain = new THREE.Mesh(geometry, material);
      terrain.rotation.x = -Math.PI / 2;
      terrain.receiveShadow = true;
      terrain.castShadow = true;
      scene.add(terrain);
      
      // Add simple dust particles
      const dustGeo = new THREE.BufferGeometry();
      const dustCount = 100;
      const dustPositions = new Float32Array(dustCount * 3);
      
      for (let i = 0; i < dustCount; i++) {
        dustPositions[i * 3] = (Math.random() - 0.5) * 60;
        dustPositions[i * 3 + 1] = Math.random() * 20;
        dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      }
      
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
      
      const dustMat = new THREE.PointsMaterial({
        color: isNightMode ? 0x335588 : 0xaaaaaa,
        size: 0.1,
        transparent: true,
        opacity: isNightMode ? 0.7 : 0.5,
      });
      
      const dust = new THREE.Points(dustGeo, dustMat);
      scene.add(dust);
    });
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      // Clean up three.js resources
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
  }, [textureUrl, terrainData, isNightMode]);
  
  return (
    <div ref={containerRef} className="w-full h-full" style={{ minHeight: '400px' }} />
  );
};

export default Terrain3D;
