
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Download, Compass, Map, User, ChevronsUp, Flag, Award, Camera } from 'lucide-react';
import { generateHeight, getTerrainColor } from './shaders/terrainUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

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

const createHikingPaths = (scene: THREE.Scene, terrain: THREE.Mesh) => {
  // Get terrain vertices for path height mapping
  const terrainGeometry = terrain.geometry;
  const terrainPositions = terrainGeometry.attributes.position.array;
  
  // Define several hiking paths
  const pathsData = [
    {
      name: "Main Trail",
      color: 0xd2b48c, // Sandy trail color
      width: 0.3,
      points: [
        new THREE.Vector3(-20, 0, -20),
        new THREE.Vector3(-15, 0, -10),
        new THREE.Vector3(-8, 0, -5),
        new THREE.Vector3(-3, 0, 0),
        new THREE.Vector3(5, 0, 5),
        new THREE.Vector3(10, 0, 12),
        new THREE.Vector3(15, 0, 15),
      ]
    },
    {
      name: "Ridge Trail",
      color: 0xc19a6b, // Lighter trail color
      width: 0.25,
      points: [
        new THREE.Vector3(-10, 0, 15),
        new THREE.Vector3(-5, 0, 10),
        new THREE.Vector3(0, 0, 8),
        new THREE.Vector3(5, 0, 5),
        new THREE.Vector3(10, 0, 0),
        new THREE.Vector3(15, 0, -5),
      ]
    },
    {
      name: "Valley Path",
      color: 0xbdb76b, // Dark khaki
      width: 0.2,
      points: [
        new THREE.Vector3(-15, 0, 10),
        new THREE.Vector3(-10, 0, 5),
        new THREE.Vector3(-5, 0, 0),
        new THREE.Vector3(0, 0, -5),
        new THREE.Vector3(5, 0, -10),
        new THREE.Vector3(12, 0, -15),
      ]
    },
    // New path for achievement visualization
    {
      name: "Summit Path",
      color: 0xe6bc8f, // Light sandy color
      width: 0.35,
      points: [
        new THREE.Vector3(-5, 0, -15),
        new THREE.Vector3(0, 0, -10),
        new THREE.Vector3(5, 0, -5),
        new THREE.Vector3(8, 0, 0),
        new THREE.Vector3(10, 0, 5),
        new THREE.Vector3(15, 0, 10),
        new THREE.Vector3(18, 0, 15),
      ]
    }
  ];

  // Helper function to find terrain height at a given x,z position
  const getTerrainHeight = (x: number, z: number): number => {
    // Convert world coords to terrain local space
    const localX = x + 25; // Assuming terrain is 50x50 centered at origin
    const localZ = z + 25;
    
    // Convert to 0-1 range
    const normalizedX = localX / 50;
    const normalizedZ = localZ / 50;
    
    // Get terrain resolution
    const width = Math.sqrt(terrainPositions.length / 3) - 1;
    
    // Calculate grid indices
    const xIndex = Math.floor(normalizedX * width);
    const zIndex = Math.floor(normalizedZ * width);
    
    // Bounds checking
    if (xIndex < 0 || xIndex >= width || zIndex < 0 || zIndex >= width) {
      return 0;
    }
    
    // Get vertex index
    const index = (zIndex * (width + 1) + xIndex) * 3 + 1; // +1 for y component
    
    return terrainPositions[index];
  };

  // Create all paths
  pathsData.forEach((pathData, pathIndex) => {
    // Map path points to terrain height
    pathData.points.forEach(point => {
      point.y = getTerrainHeight(point.x, point.z) + 0.2; // Slightly above terrain
    });
    
    // Create smooth curves for the paths
    const curve = new THREE.CatmullRomCurve3(pathData.points);
    const points = curve.getPoints(50);
    
    // Create tube geometry along the curve
    const tubeGeometry = new THREE.TubeGeometry(
      curve,
      64,      // Path segments
      pathData.width, // Tube radius
      8,       // Tube segments
      false    // Closed path?
    );
    
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: pathData.color,
      roughness: 0.8,
      metalness: 0.1,
    });
    
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.castShadow = true;
    tube.receiveShadow = true;
    scene.add(tube);
    
    // Add milestone markers or rest stops at intervals
    const milestoneColors = [0x8B4513, 0x6B8E23, 0x4682B4]; // Brown, Olive Green, Steel Blue
    
    for (let i = 0; i < points.length; i += 10) {
      const point = points[i];
      
      if (i % 30 === 0) {
        // Create milestone marker (larger post with colored top)
        const postGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.0, 6);
        const postMaterial = new THREE.MeshStandardMaterial({
          color: 0x8B4513, // Brown for post
          roughness: 0.9
        });
        
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(point.x, point.y + 0.5, point.z);
        scene.add(post);
        
        // Add colored top to the milestone
        const topGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const topMaterial = new THREE.MeshStandardMaterial({
          color: milestoneColors[i % milestoneColors.length],
          roughness: 0.7,
          metalness: 0.3
        });
        
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.set(0, 0.6, 0);
        post.add(top);
        
        // Add small sign with name
        const signGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.05);
        const signMaterial = new THREE.MeshStandardMaterial({
          color: 0xd2b48c,
          roughness: 0.8
        });
        
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0.4, 0.2, 0);
        sign.rotation.y = Math.PI / 2;
        post.add(sign);
      } else {
        // Create a smaller trail marker
        const markerGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 6);
        const markerMaterial = new THREE.MeshStandardMaterial({
          color: 0x8B4513, // Brown color for wooden post
          roughness: 0.9
        });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(point.x, point.y + 0.4, point.z);
        scene.add(marker);
      }
    }
  });
  
  // Add landmark features (mountain peak, rest stops, water features)
  
  // Mountain cabin at a scenic viewpoint
  const cabinPosition = new THREE.Vector3(12, 0, 12);
  cabinPosition.y = getTerrainHeight(cabinPosition.x, cabinPosition.z) + 0.5;
  
  const cabin = new THREE.Group();
  
  // Cabin base
  const cabinBase = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 })
  );
  cabinBase.position.y = 0.5;
  cabin.add(cabinBase);
  
  // Cabin roof
  const cabinRoof = new THREE.Mesh(
    new THREE.ConeGeometry(1.2, 0.8, 4),
    new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.7 })
  );
  cabinRoof.position.y = 1.4;
  cabinRoof.rotation.y = Math.PI / 4;
  cabin.add(cabinRoof);
  
  cabin.position.copy(cabinPosition);
  scene.add(cabin);
  
  // Mountain peak with flag (achievement marker)
  const peakPosition = new THREE.Vector3(-10, 0, -10);
  peakPosition.y = getTerrainHeight(peakPosition.x, peakPosition.z) + 0.5;
  
  const flagPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 2, 8),
    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 })
  );
  flagPole.position.copy(peakPosition);
  flagPole.position.y += 1;
  scene.add(flagPole);
  
  // Flag
  const flagGeometry = new THREE.PlaneGeometry(0.6, 0.4);
  const flagMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff3333,
    side: THREE.DoubleSide
  });
  const flag = new THREE.Mesh(flagGeometry, flagMaterial);
  flag.position.y = 1.7;
  flag.position.x = 0.3;
  flag.rotation.y = Math.PI / 2;
  flagPole.add(flag);
  
  // Water feature (small lake)
  const lakePosition = new THREE.Vector3(5, 0, -15);
  const lakeHeight = getTerrainHeight(lakePosition.x, lakePosition.z) + 0.1;
  
  const lakeGeometry = new THREE.CircleGeometry(3, 32);
  const lakeMaterial = new THREE.MeshStandardMaterial({
    color: 0x4682B4,
    roughness: 0.2,
    metalness: 0.8,
    transparent: true,
    opacity: 0.8
  });
  
  const lake = new THREE.Mesh(lakeGeometry, lakeMaterial);
  lake.position.set(lakePosition.x, lakeHeight, lakePosition.z);
  lake.rotation.x = -Math.PI / 2;
  scene.add(lake);
  
  // Add small pebbles around the lake
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 3 + Math.random() * 0.5;
    const pebbleX = lakePosition.x + Math.cos(angle) * radius;
    const pebbleZ = lakePosition.z + Math.sin(angle) * radius;
    const pebbleHeight = getTerrainHeight(pebbleX, pebbleZ) + 0.1;
    
    const pebbleGeometry = new THREE.SphereGeometry(0.1 + Math.random() * 0.15, 8, 8);
    const pebbleMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9
    });
    
    const pebble = new THREE.Mesh(pebbleGeometry, pebbleMaterial);
    pebble.position.set(pebbleX, pebbleHeight, pebbleZ);
    pebble.scale.y = 0.5; // Flatten pebbles
    scene.add(pebble);
  }
  
  // Trees along the path
  const treePositions = [
    new THREE.Vector3(-18, 0, -18),
    new THREE.Vector3(-12, 0, -8),
    new THREE.Vector3(-5, 0, -3),
    new THREE.Vector3(8, 0, 8),
    new THREE.Vector3(14, 0, 14),
    new THREE.Vector3(-8, 0, 12),
    new THREE.Vector3(2, 0, -12),
    new THREE.Vector3(10, 0, -8),
    new THREE.Vector3(-15, 0, 5),
    new THREE.Vector3(15, 0, -12)
  ];
  
  treePositions.forEach(position => {
    position.y = getTerrainHeight(position.x, position.z);
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.9
    });
    
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.copy(position);
    trunk.position.y += 0.75;
    scene.add(trunk);
    
    // Tree foliage
    const foliageGeometry = new THREE.ConeGeometry(1.2, 2, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({
      color: 0x228B22,
      roughness: 0.8
    });
    
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 1.5;
    trunk.add(foliage);
  });
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
  const [cameraMode, setCameraMode] = useState<'free' | 'path'>('free');
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const terrainRef = useRef<THREE.Mesh | null>(null);
  const pathPositionRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const isMobile = useIsMobile();
  const [showAchievementPopup, setShowAchievementPopup] = useState(false);
  const [peakName, setPeakName] = useState('');

  useEffect(() => {
    // Show achievement popup randomly after 3-8 seconds as a demo
    const timeout = setTimeout(() => {
      setShowAchievementPopup(true);
    }, Math.random() * 5000 + 3000);

    return () => clearTimeout(timeout);
  }, []);

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
    
    // Add hiking paths after terrain is created
    createHikingPaths(scene, terrain);
    
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
    
    // Add point lights for night mode (moonlight)
    if (isNight) {
      const moonLight = new THREE.PointLight(0x8888ff, 0.8, 30);
      moonLight.position.set(5, 15, 5);
      scene.add(moonLight);
      
      // Add some small lights along the paths to simulate lanterns
      const lanternPositions = [
        [-15, 2, -10],
        [-5, 2, -2],
        [5, 2, 5],
        [12, 2, 12],
        [-8, 2, 12],
        [5, 2, -10]
      ];
      
      lanternPositions.forEach(([x, y, z]) => {
        const lanternLight = new THREE.PointLight(0xffaa44, 0.6, 8);
        lanternLight.position.set(x, y, z);
        scene.add(lanternLight);
      });
    }
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
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      
      // If in path camera mode, follow the path
      if (cameraMode === 'path' && viewMode === 'firstPerson') {
        // Get a curve representation of the first path
        const path = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-20, 3, -20),
          new THREE.Vector3(-15, 3, -10),
          new THREE.Vector3(-8, 3, -5),
          new THREE.Vector3(-3, 3, 0),
          new THREE.Vector3(5, 3, 5),
          new THREE.Vector3(10, 3, 12),
          new THREE.Vector3(15, 3, 15),
        ]);
        
        // Update path position
        pathPositionRef.current += 0.001;
        if (pathPositionRef.current > 1) pathPositionRef.current = 0;
        
        // Get point on path and camera direction
        const pointOnPath = path.getPointAt(pathPositionRef.current);
        const tangent = path.getTangentAt(pathPositionRef.current);
        
        // Position camera at point and look in tangent direction
        camera.position.copy(pointOnPath);
        const lookAtPoint = new THREE.Vector3();
        lookAtPoint.copy(pointOnPath).add(tangent);
        camera.lookAt(lookAtPoint);
      }
      
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
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

    // Reset path position when view mode changes
    pathPositionRef.current = 0;

    switch (viewMode) {
      case 'orbit':
        camera.position.set(0, 12, 20);
        controls.enableRotate = true;
        controls.maxPolarAngle = Math.PI / 2 - 0.1;
        controls.minPolarAngle = 0;
        setCameraMode('free'); // Reset camera mode
        break;
      case 'firstPerson':
        camera.position.set(0, 3, 0);
        controls.enableRotate = true;
        controls.maxPolarAngle = Math.PI;
        controls.minPolarAngle = 0;
        break;
      case 'top':
        camera.position.set(0, 30, 0);
        camera.lookAt(0, 0, 0);
        controls.enableRotate = false;
        setCameraMode('free'); // Reset camera mode
        break;
    }

    controls.update();
  }, [viewMode]);

  const handleExport = (format: 'glb' | 'fbx' | 'usdz') => {
    console.log(`Exporting in ${format} format...`);
    toast.success(`3D terrain exported in ${format.toUpperCase()} format!`);
  };

  const handlePeakNaming = () => {
    if (peakName.trim()) {
      setShowAchievementPopup(false);
      toast.success(`Congratulations! You've named your peak: ${peakName}`, {
        duration: 5000,
      });
    }
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
          {viewMode === 'firstPerson' && (
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={() => setCameraMode(cameraMode === 'free' ? 'path' : 'free')}
              className={`${cameraMode === 'path' ? 'bg-primary text-primary-foreground' : ''} ${isMobile ? 'px-2 py-1 text-xs' : ''}`}
            >
              <Camera className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
              {isMobile ? '' : (cameraMode === 'path' ? 'Manual Control' : 'Follow Path')}
            </Button>
          )}
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
        
        {/* Achievement popup */}
        {showAchievementPopup && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background/95 p-4 rounded-lg shadow-lg max-w-[280px] md:max-w-[320px] border-2 border-primary animate-fade-in z-10">
            <div className="flex flex-col items-center">
              <Award className="h-12 w-12 text-yellow-500 mb-2" />
              <h3 className="text-lg font-bold text-center">Achievement Unlocked!</h3>
              <p className="text-center mb-2">You've reached a mountain peak after 3 hours of focus!</p>
              <p className="text-center text-sm text-muted-foreground mb-4">Name your peak to mark your achievement</p>
              
              <input 
                type="text" 
                value={peakName} 
                onChange={(e) => setPeakName(e.target.value)}
                placeholder="Enter peak name..." 
                className="w-full p-2 mb-3 rounded border"
                maxLength={20}
              />
              
              <div className="flex space-x-2 w-full">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowAchievementPopup(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handlePeakNaming}
                  disabled={!peakName.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
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
