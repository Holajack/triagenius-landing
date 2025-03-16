import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Download, Compass, Map, User, ChevronsUp } from 'lucide-react';
import { generateHeight, getTerrainColor } from './shaders/terrainUtils';
import { useIsMobile } from '@/hooks/use-mobile';

const createTerrainGeometry = (width: number, height: number, resolution: number) => {
  const geometry = new THREE.PlaneGeometry(width, height, resolution, resolution);
  geometry.rotateX(-Math.PI / 2); // Rotate to be horizontal
  
  // Apply height displacement
  const vertices = geometry.attributes.position.array;
  
  // Generate terrain with multiple frequency noise for more realism
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 2];
    
    // Multi-octave noise for more realistic terrain
    const height = 
      generateHeight(x * 0.05, z * 0.05, 1.0) * 6.0 + // Base mountains
      generateHeight(x * 0.15, z * 0.15, 0.8) * 2.0 + // Medium details
      generateHeight(x * 0.4, z * 0.4, 0.2) * 0.5;    // Small details
    
    vertices[i + 1] = height;
  }
  
  geometry.computeVertexNormals();
  return geometry;
};

const simplex2 = (x: number, y: number): number => {
  return Math.sin(x) * Math.cos(y) + 
         Math.sin(x * 2) * Math.cos(y * 3) * 0.5 + 
         Math.sin(x * 4) * Math.cos(y * 7) * 0.25;
};

const TerrainVisualization = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNightMode, setIsNightMode] = useState(false);
  const [viewMode, setViewMode] = useState<'orbit' | 'firstPerson' | 'top'>('orbit');
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const terrainRef = useRef<THREE.Mesh | null>(null);
  const isMobile = useIsMobile();

  const createTerrain = (scene: THREE.Scene) => {
    // Adjust resolution based on device capability
    const width = 50;
    const height = 50;
    const resolution = isMobile ? 150 : 250; // Lower resolution for mobile
    
    const geometry = createTerrainGeometry(width, height, resolution);
    
    // Create custom material for colored terrain
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    // Add vertex colors to represent different terrain types
    const colors = [];
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal.array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1]; // height
      
      // Calculate slope from normal (y component closer to 1 means flatter)
      const nx = normals[i];
      const ny = normals[i + 1];
      const nz = normals[i + 2];
      const slope = 1 - ny; // 0 is flat, 1 is vertical
      
      // Get terrain color based on height and slope
      const [r, g, b] = getTerrainColor(y, slope);
      colors.push(r, g, b);
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const terrain = new THREE.Mesh(geometry, material);
    terrain.receiveShadow = true;
    terrain.castShadow = true;
    terrainRef.current = terrain;
    
    scene.add(terrain);
    
    // Add a grid helper for scale reference
    const gridHelper = new THREE.GridHelper(50, 50);
    gridHelper.position.y = -0.1; // Just below the terrain
    scene.add(gridHelper);
  };

  const updateLighting = (scene: THREE.Scene, isNight: boolean) => {
    // Remove existing lights
    scene.children = scene.children.filter(child => !(child instanceof THREE.Light));
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(
      isNight ? 0x333366 : 0x777777,
      isNight ? 0.3 : 0.5
    );
    scene.add(ambientLight);
    
    // Add directional light (sun/moon)
    const directionalLight = new THREE.DirectionalLight(
      isNight ? 0xaabbff : 0xffffbb,
      isNight ? 0.5 : 1.0
    );
    
    directionalLight.position.set(
      isNight ? -10 : 10,
      isNight ? 10 : 20,
      isNight ? -10 : 10
    );
    
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    
    const shadowSize = 20;
    directionalLight.shadow.camera.left = -shadowSize;
    directionalLight.shadow.camera.right = shadowSize;
    directionalLight.shadow.camera.top = shadowSize;
    directionalLight.shadow.camera.bottom = -shadowSize;
    
    scene.add(directionalLight);
    
    // Add hemisphere light for more natural lighting
    const hemisphereLight = new THREE.HemisphereLight(
      isNight ? 0x000033 : 0x0077ff,
      isNight ? 0x000000 : 0x775533,
      isNight ? 0.2 : 0.5
    );
    scene.add(hemisphereLight);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(isNightMode ? 0x0a0a20 : 0x87ceeb);

    // Camera setup - adjust FOV for mobile
    const camera = new THREE.PerspectiveCamera(
      isMobile ? 85 : 75, // Wider FOV on mobile for better visibility
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    
    // Adjust initial position for mobile
    if (isMobile) {
      camera.position.set(0, 15, 25); // Higher and further back on mobile
    } else {
      camera.position.set(0, 12, 20);
    }

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: !isMobile, // Disable antialiasing on mobile for performance
      powerPreference: "high-performance"
    });
    rendererRef.current = renderer;
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(isMobile ? 1 : window.devicePixelRatio); // Lower pixel ratio for mobile
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Controls setup - adjust for mobile
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.minDistance = isMobile ? 10 : 5; // Prevent zooming in too close on mobile
    controls.maxDistance = 50;
    
    // Enable touch rotation for mobile
    if (isMobile) {
      controls.rotateSpeed = 0.7; // Slower rotation on mobile for better control
      controls.zoomSpeed = 0.7; // Slower zoom on mobile
    }

    // Lighting setup
    updateLighting(scene, isNightMode);

    // Terrain creation
    createTerrain(scene);

    // Fog for atmosphere
    scene.fog = new THREE.FogExp2(isNightMode ? 0x0a0a20 : 0xd7e5f7, 0.002);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, [isNightMode, isMobile]);

  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current || !terrainRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;

    switch (viewMode) {
      case 'orbit':
        camera.position.set(0, 12, 20);
        controls.enableRotate = true;
        controls.maxPolarAngle = Math.PI / 2 - 0.1;
        break;
      case 'firstPerson':
        camera.position.set(0, 3, 0);
        controls.enableRotate = true;
        controls.maxPolarAngle = Math.PI;
        break;
      case 'top':
        camera.position.set(0, 30, 0);
        camera.lookAt(0, 0, 0);
        controls.enableRotate = false;
        break;
    }

    controls.update();
  }, [viewMode]);

  const handleExport = (format: 'glb' | 'fbx' | 'usdz') => {
    console.log(`Exporting in ${format} format...`);
    alert(`Export in ${format.toUpperCase()} format coming soon!`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap justify-between items-center mb-4 px-2 gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={() => setViewMode('orbit')}
            className={`${viewMode === 'orbit' ? 'bg-primary text-primary-foreground' : ''} ${isMobile ? 'px-2 py-1 text-xs' : ''}`}
          >
            <Compass className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} /> 
            {isMobile ? '' : 'Orbit'}
          </Button>
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={() => setViewMode('firstPerson')}
            className={`${viewMode === 'firstPerson' ? 'bg-primary text-primary-foreground' : ''} ${isMobile ? 'px-2 py-1 text-xs' : ''}`}
          >
            <User className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} /> 
            {isMobile ? '' : 'First Person'}
          </Button>
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={() => setViewMode('top')}
            className={`${viewMode === 'top' ? 'bg-primary text-primary-foreground' : ''} ${isMobile ? 'px-2 py-1 text-xs' : ''}`}
          >
            <Map className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} /> 
            {isMobile ? '' : 'Top View'}
          </Button>
        </div>
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          onClick={() => setIsNightMode(!isNightMode)}
          className={isMobile ? 'px-2 py-1 text-xs' : ''}
        >
          {isNightMode ? 
            <Sun className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} /> : 
            <Moon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
          }
          {isMobile ? '' : (isNightMode ? 'Day Mode' : 'Night Mode')}
        </Button>
      </div>
      
      <div className="flex-grow relative bg-black rounded-md overflow-hidden border" ref={containerRef}>
        {/* Three.js canvas will be appended here */}
      </div>
      
      {!isMobile && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <span className="flex items-center">
              <ChevronsUp className="h-4 w-4 mr-1" />
              Elevation: 1,250 - 3,400 m
            </span>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => handleExport('glb')}>
              <Download className="h-4 w-4 mr-1" /> GLB
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('fbx')}>
              <Download className="h-4 w-4 mr-1" /> FBX
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('usdz')}>
              <Download className="h-4 w-4 mr-1" /> USDZ
            </Button>
          </div>
        </div>
      )}
      
      {isMobile && (
        <div className="mt-2 flex justify-center">
          <div className="flex space-x-1">
            <Button size="sm" variant="outline" className="px-2 py-1 text-xs" onClick={() => handleExport('glb')}>
              <Download className="h-3 w-3 mr-1" /> GLB
            </Button>
            <Button size="sm" variant="outline" className="px-2 py-1 text-xs" onClick={() => handleExport('fbx')}>
              <Download className="h-3 w-3 mr-1" /> FBX
            </Button>
            <Button size="sm" variant="outline" className="px-2 py-1 text-xs" onClick={() => handleExport('usdz')}>
              <Download className="h-3 w-3 mr-1" /> USDZ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TerrainVisualization;
