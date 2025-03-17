import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { smoothNoise, getTerrainColor } from './shaders/terrainUtils';

interface TerrainProps {
  textureUrl: string;
  terrainData: any;
  isNightMode: boolean;
}

const Terrain3D: React.FC<TerrainProps> = ({ textureUrl, terrainData, isNightMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let controls: OrbitControls | null = null;
    let animationFrameId: number | null = null;
    
    const init = () => {
      if (!containerRef.current) return;
      
      // Clean up any existing canvas elements
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      
      // Setup
      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      // Create scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(isNightMode ? 0x001425 : 0xe6f0ff);
      scene.fog = new THREE.Fog(
        isNightMode ? 0x001425 : 0xe6f0ff,
        30,
        100
      );
      
      // Create camera
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 25, 35);
      camera.lookAt(0, 0, 0);
      
      // Create renderer
      renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);
      
      // Add OrbitControls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 10;
      controls.maxDistance = 80;
      controls.maxPolarAngle = Math.PI / 2.2;
      
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
      directionalLight.position.set(50, 100, 50);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      directionalLight.shadow.camera.near = 10;
      directionalLight.shadow.camera.far = 200;
      directionalLight.shadow.camera.left = -50;
      directionalLight.shadow.camera.right = 50;
      directionalLight.shadow.camera.top = 50;
      directionalLight.shadow.camera.bottom = -50;
      scene.add(directionalLight);
      
      // Add a hemisphere light for better ambient illumination
      const hemisphereLight = new THREE.HemisphereLight(
        isNightMode ? 0x002244 : 0xaaccff,
        isNightMode ? 0x000000 : 0x554433,
        isNightMode ? 0.2 : 0.4
      );
      scene.add(hemisphereLight);
      
      // Create the terrain
      createTerrain(scene);
      
      // Add skybox
      createSkybox(scene);
      
      // Add particles
      createParticles(scene);

      // Animation loop
      const animate = () => {
        if (!scene || !camera || !renderer || !controls) return;
        
        controls.update();
        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(animate);
      };
      
      animate();
    };
    
    const createTerrain = (scene: THREE.Scene) => {
      // Create terrain geometry
      const size = 50;
      const resolution = 128;
      const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);
      
      // Setup height map
      const positions = geometry.attributes.position as THREE.BufferAttribute;
      const colors = new Float32Array(positions.count * 3);
      const colorAttr = new THREE.BufferAttribute(colors, 3);
      
      for (let i = 0; i < positions.count; i++) {
        // Get x and z coordinates
        const x = positions.getX(i);
        const z = positions.getZ(i);
        
        // Generate height
        let height = 0;
        
        // Use smooth noise for better terrain
        height = smoothNoise(x * 0.04, z * 0.04, 3.0);
        
        // Apply height to vertex
        positions.setY(i, height);
        
        // Calculate slope (can use 0 as default if normals not available)
        const slope = 0.0; // Default slope when we don't have normals calculated yet
        
        // Apply color based on height and slope
        const [r, g, b] = getTerrainColor(height + 1.5, slope, isNightMode);
        colorAttr.setXYZ(i, r, g, b);
      }
      
      // Add colors to geometry
      geometry.setAttribute('color', colorAttr);
      
      // Update normals for proper lighting
      geometry.computeVertexNormals();
      
      // Create material
      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.8,
        metalness: 0.1,
        flatShading: false,
      });
      
      // Create and add mesh
      const terrain = new THREE.Mesh(geometry, material);
      terrain.rotation.x = -Math.PI / 2;
      terrain.position.y = -5;
      terrain.receiveShadow = true;
      terrain.castShadow = true;
      scene.add(terrain);
      
      // Optionally load texture
      if (textureUrl) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
          textureUrl,
          (texture) => {
            // Apply loaded texture
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            material.map = texture;
            material.map.colorSpace = THREE.SRGBColorSpace;
            material.needsUpdate = true;
            
            // Use texture blending with vertex colors
            material.vertexColors = true;
          },
          undefined,
          (error) => console.error('Error loading texture:', error)
        );
      }
    };
    
    const createSkybox = (scene: THREE.Scene) => {
      const skyColor = isNightMode ? 
        new THREE.Color(0x000019) : 
        new THREE.Color(0x88ccff);
      
      const skyGeo = new THREE.SphereGeometry(80, 32, 32);
      const skyMat = new THREE.MeshBasicMaterial({
        color: skyColor,
        side: THREE.BackSide,
        fog: false,
      });
      const sky = new THREE.Mesh(skyGeo, skyMat);
      scene.add(sky);
    };
    
    const createParticles = (scene: THREE.Scene) => {
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
        sizeAttenuation: true,
      });
      
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);
      
      // Add animation to particles in render loop if desired
      return particles;
    };
    
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    // Initialize the scene
    init();
    
    // Add event listeners
    window.addEventListener('resize', handleResize);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      
      if (scene) {
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
      }
      
      if (renderer) {
        renderer.dispose();
        if (containerRef.current?.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement);
        }
      }
    };
  }, [textureUrl, isNightMode, terrainData]);
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative" 
      style={{ minHeight: '400px' }}
      aria-label="3D terrain visualization"
    >
      {/* Error fallback */}
      <noscript>
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-800">
          3D visualization requires JavaScript to be enabled.
        </div>
      </noscript>
    </div>
  );
};

export default Terrain3D;
