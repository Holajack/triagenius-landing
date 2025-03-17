
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface TerrainProps {
  textureUrl: string;
  terrainData: {
    bounds: {
      ne: [number, number];
      sw: [number, number];
    };
    resolution: {
      elevation: {
        tileSize: number;
        zoom: number;
      };
      texture: {
        tileSize: number;
        zoom: number;
      };
    };
    altitudeBoundsinMeters: {
      max: number;
      min: number;
      base: number;
    };
    modelCoordinatesAltitudeBounds: {
      max: number;
      min: number;
      base: number;
    };
    elevationCanvas: {
      width: number;
      height: number;
    };
    groundParams: {
      width: number;
      height: number;
      subdivisionsX: number;
      subdivisionsY: number;
    };
  };
  isNightMode: boolean;
}

// Utility function to generate terrain height
const generateHeight = (x: number, y: number, scale: number = 1): number => {
  return scale * (
    Math.sin(x * 0.5) * Math.cos(y * 0.5) + 
    Math.sin(x * 1.0) * Math.cos(y * 1.5) * 0.5 + 
    Math.sin(x * 2.0) * Math.cos(y * 3.0) * 0.25 + 
    Math.sin(x * 4.0) * Math.cos(y * 6.0) * 0.125
  );
};

const Terrain3D: React.FC<TerrainProps> = ({ textureUrl, terrainData, isNightMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const terrainRef = useRef<THREE.Mesh | null>(null);
  const dustRef = useRef<THREE.Points | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const frameIdRef = useRef<number | null>(null);

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Setup scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      45, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(0, 30, 50);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(isNightMode ? 0x001425 : 0xe6f0ff, 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Setup OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 15;
    controls.maxDistance = 100;
    controlsRef.current = controls;

    // Add lighting
    // Ambient light
    const ambientLight = new THREE.AmbientLight(
      isNightMode ? 0x001133 : 0x404040, 
      isNightMode ? 0.2 : 0.7
    );
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // Sun light (Directional light)
    const sunLight = new THREE.DirectionalLight(
      0xffffff, 
      isNightMode ? 0.3 : 1.0
    );
    sunLight.position.set(10, 10, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Additional directional light
    const backLight = new THREE.DirectionalLight(
      isNightMode ? 0x001133 : 0xbbe1ff, 
      isNightMode ? 0.2 : 0.8
    );
    backLight.position.set(-30, 50, -30);
    scene.add(backLight);

    // Add fog
    scene.fog = new THREE.Fog(
      isNightMode ? 0x001425 : 0xe6f0ff, 
      80, 
      150
    );

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(textureUrl, (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
      texture.anisotropy = 16;
      
      // Create terrain geometry
      const geometry = new THREE.PlaneGeometry(
        terrainData.groundParams.width,
        terrainData.groundParams.height,
        Math.min(400, terrainData.groundParams.subdivisionsX),
        Math.min(462, terrainData.groundParams.subdivisionsY)
      );

      // Apply elevation data
      const { array } = geometry.attributes.position;
      const elevationExaggeration = 3;
      const maxAltitude = terrainData.modelCoordinatesAltitudeBounds.max;
      
      for (let i = 0; i < array.length; i += 3) {
        const x = array[i];
        const z = array[i + 2];
        
        // Normalize coordinates for pattern generation
        const nx = (x / terrainData.groundParams.width) * 10 + 5;
        const nz = (z / terrainData.groundParams.height) * 10 + 5;
        
        // Multi-layered noise for realistic terrain
        const baseNoise = generateHeight(nx, nz, 1.0);
        const detailNoise = generateHeight(nx * 2, nz * 2, 0.5) * 0.5;
        const microDetail = generateHeight(nx * 4, nz * 4, 0.25) * 0.25;
        
        // Central mountain ridge effect
        const distanceFromCenter = Math.sqrt(x * x + z * z) / 
                                  Math.max(terrainData.groundParams.width, terrainData.groundParams.height);
        const mountainRidgeFactor = Math.exp(-Math.pow(distanceFromCenter * 2, 2)) * 1.5;
        
        // Snow-capped peaks for higher elevations
        const snowCapEffect = baseNoise > 0.7 ? (baseNoise - 0.7) * 1.5 : 0;
        
        // Calculate combined height
        let height = (baseNoise + detailNoise + microDetail) * maxAltitude * 0.8;
        height += mountainRidgeFactor * maxAltitude * 0.5;
        height += snowCapEffect * maxAltitude * 0.3;
        
        // Apply elevation exaggeration
        height *= elevationExaggeration;
        
        // Update vertex position
        array[i + 1] = height;
      }

      // Calculate normals for better lighting
      geometry.computeVertexNormals();
      
      // Create material
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      
      // Create mesh
      const terrainMesh = new THREE.Mesh(geometry, material);
      terrainMesh.rotation.x = -Math.PI / 2;
      terrainMesh.receiveShadow = true;
      terrainMesh.castShadow = true;
      scene.add(terrainMesh);
      terrainRef.current = terrainMesh;
    });

    // Add dust particles
    const dustGeometry = new THREE.BufferGeometry();
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 40 + 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const dustMaterial = new THREE.PointsMaterial({
      color: isNightMode ? 0x335588 : 0xaaaaaa,
      size: 0.1,
      transparent: true,
      opacity: isNightMode ? 0.7 : 0.5,
    });
    
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);
    dustRef.current = dust;

    // Animation loop
    const animate = () => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (dustRef.current) {
        dustRef.current.rotation.y += 0.0005;
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      frameIdRef.current = requestAnimationFrame(animate);
    };
    
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      rendererRef.current.setSize(width, height);
      
      if (cameraRef.current) {
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Clean up the scene
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) {
              object.geometry.dispose();
            }
            
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((material) => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
      }
      
      rendererRef.current?.dispose();
      dustRef.current?.geometry.dispose();
      (dustRef.current?.material as THREE.Material)?.dispose();
    };
  }, [textureUrl, terrainData]);

  // Update scene based on night mode changes
  useEffect(() => {
    if (!sceneRef.current) return;

    // Update renderer clear color
    if (rendererRef.current) {
      rendererRef.current.setClearColor(isNightMode ? 0x001425 : 0xe6f0ff, 1);
    }

    // Update lights
    if (sunLightRef.current) {
      sunLightRef.current.intensity = isNightMode ? 0.3 : 1.0;
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = isNightMode ? 0.2 : 0.7;
      ambientLightRef.current.color.set(isNightMode ? 0x001133 : 0x404040);
    }

    // Update fog
    if (sceneRef.current.fog) {
      (sceneRef.current.fog as THREE.Fog).color.set(isNightMode ? 0x001425 : 0xe6f0ff);
    }

    // Update dust particles
    if (dustRef.current) {
      (dustRef.current.material as THREE.PointsMaterial).color.set(isNightMode ? 0x335588 : 0xaaaaaa);
      (dustRef.current.material as THREE.PointsMaterial).opacity = isNightMode ? 0.7 : 0.5;
    }
  }, [isNightMode]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full" 
      style={{ minHeight: '400px' }}
    />
  );
};

export default Terrain3D;
