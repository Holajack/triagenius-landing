import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Orbit, User, Layout } from 'lucide-react';
import { generateHeight, getTerrainColor } from './shaders/terrainUtils';
import { useIsMobile } from '@/hooks/use-mobile';

const createTerrainGeometry = (width: number, height: number, resolution: number) => {
  const geometry = new THREE.PlaneGeometry(width, height, resolution, resolution);
  geometry.rotateX(-Math.PI / 2);
  
  const vertices = geometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 2];
    
    const heightValue =
      generateHeight(x * 0.02, z * 0.02, 1.0) * 10.0 +
      generateHeight(x * 0.1, z * 0.1, 0.8) * 4.0 +
      generateHeight(x * 0.5, z * 0.5, 0.3) * 2.0;
    
    vertices[i + 1] = heightValue;
  }
  
  geometry.computeVertexNormals();
  return geometry;
};

const createWaterPlane = (scene: THREE.Scene, width: number, height: number) => {
  const waterGeometry = new THREE.PlaneGeometry(width, height, 10, 10);
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x4682B4,
    transparent: true,
    opacity: 0.7,
    roughness: 0.3,
    metalness: 0.6,
  });
  
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.y = -3.5; // Set below zero to match low elevation areas
  
  scene.add(water);
};

const createHikingPaths = (scene: THREE.Scene, terrain: THREE.Mesh) => {
  const paths = [
    { name: "Scenic Trail", color: 0xd2b48c, width: 0.4, points: [
      new THREE.Vector3(-30, 0, -30),
      new THREE.Vector3(-20, 0, -15),
      new THREE.Vector3(-10, 0, -5),
      new THREE.Vector3(0, 0, 10),
      new THREE.Vector3(10, 0, 15),
      new THREE.Vector3(20, 0, 20)
    ]},
    { name: "Mountain Ridge", color: 0xc19a6b, width: 0.3, points: [
      new THREE.Vector3(-25, 0, 20),
      new THREE.Vector3(-15, 0, 10),
      new THREE.Vector3(-5, 0, 5),
      new THREE.Vector3(5, 0, 0),
      new THREE.Vector3(15, 0, -10)
    ]}
  ];
  
  paths.forEach(path => {
    const curve = new THREE.CatmullRomCurve3(path.points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, path.width, 8, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({ color: path.color, roughness: 0.8 });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    scene.add(tube);
  });
};

const updateLighting = (scene: THREE.Scene, isNight: boolean) => {
  scene.children = scene.children.filter(child => !(child instanceof THREE.Light));
  
  const ambientLight = new THREE.AmbientLight(
    isNight ? 0x333366 : 0x777777,
    isNight ? 0.3 : 0.5
  );
  scene.add(ambientLight);
  
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
  scene.add(directionalLight);
  
  const hemisphereLight = new THREE.HemisphereLight(
    isNight ? 0x000033 : 0x0077ff,
    isNight ? 0x000000 : 0x775533,
    isNight ? 0.2 : 0.5
  );
  scene.add(hemisphereLight);
  
  if (isNight) {
    const moonLight = new THREE.PointLight(0x8888ff, 0.8, 30);
    moonLight.position.set(5, 15, 5);
    scene.add(moonLight);
  }
};

type ViewMode = 'orbit' | 'first-person' | 'top';

const TerrainVisualization = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNightMode, setIsNightMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('orbit');
  const isMobile = useIsMobile();
  const sceneRef = useRef<THREE.Scene | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [theme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(isNightMode ? 0x0a0a20 : 0x87ceeb);

    updateLighting(scene, isNightMode);
    
    const width = 70;
    const height = 80;
    const resolution = isMobile ? 250 : 400;
    
    const terrainGeometry = createTerrainGeometry(width, height, resolution);
    const terrainMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1,
    });
    
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.receiveShadow = true;
    terrain.castShadow = true;
    scene.add(terrain);
    
    createWaterPlane(scene, width, height);
    createHikingPaths(scene, terrain);

    const camera = new THREE.PerspectiveCamera(
      isMobile ? 90 : 75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      2000
    );
    cameraRef.current = camera;
    camera.position.set(0, 50, 90);
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: !isMobile,
      powerPreference: "high-performance"
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(isMobile ? 1 : window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.minDistance = 15;
    controls.maxDistance = 180;
    
    if (isMobile) {
      controls.rotateSpeed = 0.7;
      controls.zoomSpeed = 0.7;
    }
    
    const handleResize = () => {
      if (!containerRef.current) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);
    
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
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
  }, [isNightMode, isMobile, viewMode]);

  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    
    switch (viewMode) {
      case 'orbit':
        camera.position.set(0, 50, 90);
        controls.enableDamping = true;
        controls.enabled = true;
        break;
      case 'first-person':
        camera.position.set(0, 10, 0);
        controls.enableDamping = true;
        controls.enabled = true;
        break;
      case 'top':
        camera.position.set(0, 120, 0);
        camera.lookAt(0, 0, 0);
        controls.enableDamping = false;
        controls.enabled = false;
        break;
    }
    
    camera.updateProjectionMatrix();
  }, [viewMode]);

  useEffect(() => {
    if (sceneRef.current) {
      updateLighting(sceneRef.current, isNightMode);
      sceneRef.current.background = new THREE.Color(isNightMode ? 0x0a0a20 : 0x87ceeb);
      sceneRef.current.fog = new THREE.FogExp2(isNightMode ? 0x0a0a20 : 0xd7e5f7, 0.001);
    }
  }, [isNightMode]);

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
        <Button
          variant="default"
          size={isMobile ? "sm" : "default"}
          onClick={() => setViewMode('orbit')}
          className={`${viewMode === 'orbit' ? 'bg-primary' : 'bg-secondary'}`}
        >
          <Orbit className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
          {isMobile ? '' : 'Orbit'}
        </Button>
        
        <Button
          variant="default"
          size={isMobile ? "sm" : "default"}
          onClick={() => setViewMode('first-person')}
          className={`${viewMode === 'first-person' ? 'bg-primary' : 'bg-secondary'}`}
        >
          <User className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
          {isMobile ? '' : 'First Person'}
        </Button>
        
        <Button
          variant="default"
          size={isMobile ? "sm" : "default"}
          onClick={() => setViewMode('top')}
          className={`${viewMode === 'top' ? 'bg-primary' : 'bg-secondary'}`}
        >
          <Layout className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
          {isMobile ? '' : 'Top View'}
        </Button>
        
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          onClick={() => setIsNightMode(!isNightMode)}
        >
          {isNightMode ? 
            <Sun className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} /> : 
            <Moon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
          }
          {isMobile ? '' : (isNightMode ? 'Day Mode' : 'Night Mode')}
        </Button>
      </div>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
};

export default TerrainVisualization;
