
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generateHeight } from './shaders/terrainUtils';

interface TerrainProps {
  textureUrl: string;
  terrainData: any;
  isNightMode: boolean;
}

const Terrain3D: React.FC<TerrainProps> = ({ textureUrl, terrainData, isNightMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clean up any existing canvas
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    
    // Setup
    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isNightMode ? 0x001425 : 0xe6f0ff);
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 20, 40);
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    
    // Add OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 80;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(
      isNightMode ? 0x334466 : 0xffffff, 
      isNightMode ? 0.3 : 0.6
    );
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(
      0xffffff, 
      isNightMode ? 0.5 : 1.0
    );
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);
    
    // Simple terrain mesh (use plain geometry with direct manipulation)
    const size = 50;
    const segments = 128;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    
    // Generate heights
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) / 5;
      const z = positions.getZ(i) / 5;
      
      // Simple height function using multiple frequencies
      let y = 0;
      y += generateHeight(x * 0.1, z * 0.1, 3.0);
      y += generateHeight(x * 0.2, z * 0.2, 1.5);
      y += generateHeight(x * 0.4, z * 0.4, 0.75);
      
      // Apply height to the vertex
      positions.setY(i, y);
    }
    
    // Update geometry
    geometry.computeVertexNormals();
    
    // Load texture for the terrain
    const textureLoader = new THREE.TextureLoader();
    const terrainMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.8,
      metalness: 0.2,
      color: isNightMode ? 0x445566 : 0xa5c8a5,
    });
    
    // Apply texture if loading succeeds
    textureLoader.load(
      textureUrl,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        terrainMaterial.map = texture;
        terrainMaterial.needsUpdate = true;
      },
      undefined,
      (error) => {
        console.error('Error loading texture:', error);
      }
    );
    
    // Create terrain mesh
    const terrain = new THREE.Mesh(geometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -5;
    scene.add(terrain);
    
    // Add skybox
    const skyColor = isNightMode ? 
      [0x000011, 0x001133, 0x000019] : 
      [0x88aaff, 0xaaccff, 0xddeeff];
    
    const skyGeo = new THREE.SphereGeometry(80, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({
      color: skyColor[0],
      side: THREE.BackSide,
      fog: false,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);
    
    // Add particles (stars or dust)
    const particlesCount = isNightMode ? 1000 : 200;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.5) * 60;
      particlePositions[i3 + 1] = Math.random() * 40;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 60;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      color: isNightMode ? 0xffffff : 0xcccccc,
      size: isNightMode ? 0.2 : 0.1,
      transparent: true,
      opacity: isNightMode ? 0.8 : 0.4,
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      
      // Slowly rotate particles
      particles.rotation.y += 0.0003;
      
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
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Dispose of Three.js resources
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          } else if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          }
        }
      });
      
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      geometry.dispose();
      terrainMaterial.dispose();
      renderer.dispose();
      
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [textureUrl, isNightMode]);
  
  return <div ref={containerRef} className="w-full h-full" style={{ minHeight: '400px' }} />;
};

export default Terrain3D;
