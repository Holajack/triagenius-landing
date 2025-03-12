
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  ContactShadows,
  BakeShadows,
} from '@react-three/drei';
import { PathwayPoint } from './PathwayPoint';
import * as THREE from 'three';

interface LearningPathSceneProps {
  activeSubject: string | null;
  setActiveSubject: (subject: string | null) => void;
  zoomLevel: number;
  rotation: number;
}

export const LearningPathScene = ({ activeSubject, setActiveSubject, zoomLevel, rotation }: LearningPathSceneProps) => {
  // Define learning subjects and their positions on the pathway
  const learningSubjects = [
    {
      id: "mathematics",
      name: "Mathematics",
      position: [0, 0.7, -1.5] as [number, number, number],
      scale: [1.0, 1.1, 1.0] as [number, number, number],
      color: "#D946EF",
      progress: 0.65,
      difficulty: 0.8
    },
    {
      id: "physics",
      name: "Physics",
      position: [1.5, 1.2, 0] as [number, number, number],
      scale: [1.0, 1.2, 1.0] as [number, number, number],
      color: "#8B5CF6",
      progress: 0.45,
      difficulty: 0.9
    },
    {
      id: "computer_science",
      name: "Computer Science",
      position: [3.0, 1.8, 0.8] as [number, number, number],
      scale: [1.1, 1.4, 1.0] as [number, number, number],
      color: "#2DD4BF",
      progress: 0.7,
      difficulty: 0.75
    },
    {
      id: "literature",
      name: "Literature",
      position: [-1.5, 0.5, -0.8] as [number, number, number],
      scale: [1.0, 0.8, 1.0] as [number, number, number],
      color: "#F59E0B",
      progress: 0.85,
      difficulty: 0.5
    },
    {
      id: "history",
      name: "History",
      position: [-3.0, 0.9, 0.5] as [number, number, number],
      scale: [1.0, 1.0, 1.0] as [number, number, number],
      color: "#EF4444",
      progress: 0.6,
      difficulty: 0.6
    },
    {
      id: "biology",
      name: "Biology",
      position: [2.2, 0.6, -1.2] as [number, number, number],
      scale: [1.0, 0.9, 1.0] as [number, number, number],
      color: "#10B981",
      progress: 0.5,
      difficulty: 0.7
    },
    {
      id: "language",
      name: "Languages",
      position: [-2.0, 0.4, -1.8] as [number, number, number],
      scale: [1.0, 0.7, 1.0] as [number, number, number],
      color: "#3B82F6",
      progress: 0.55,
      difficulty: 0.65
    }
  ];

  // Define pathway connections between subjects
  const pathConnections = [
    { from: "mathematics", to: "physics" },
    { from: "physics", to: "computer_science" },
    { from: "mathematics", to: "computer_science" },
    { from: "literature", to: "history" },
    { from: "literature", to: "language" },
    { from: "history", to: "language" },
    { from: "biology", to: "physics" },
    { from: "mathematics", to: "biology" }
  ];

  const createMountainousPathTerrain = () => {
    // Extract subject positions for path planning
    const subjectPositions = learningSubjects.map(subject => ({
      x: subject.position[0],
      z: subject.position[2],
      id: subject.id
    }));
    
    return (
      <>
        {/* Mountainous terrain base with topographic style */}
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[15, 15, 128, 128]} />
          <meshStandardMaterial
            color="#4B6455" // Forest green base color matching reference image
            roughness={0.9}
            metalness={0.1}
            wireframe={false}
            onBeforeCompile={(shader) => {
              // Add height variation for mountainous terrain
              shader.uniforms.uTime = { value: 0 };
              
              shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `
                #include <common>
                
                // Simplex 3D Noise function
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                
                float snoise(vec3 v) {
                  const vec2 C = vec2(1.0/6.0, 1.0/3.0) ;
                  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                  
                  vec3 i  = floor(v + dot(v, C.yyy) );
                  vec3 x0 = v - i + dot(i, C.xxx) ;
                  
                  vec3 g = step(x0.yzx, x0.xyz);
                  vec3 l = 1.0 - g;
                  vec3 i1 = min( g.xyz, l.zxy );
                  vec3 i2 = max( g.xyz, l.zxy );
                  
                  vec3 x1 = x0 - i1 + C.xxx;
                  vec3 x2 = x0 - i2 + C.yyy;
                  vec3 x3 = x0 - D.yyy;
                  
                  i = mod289(i);
                  vec4 p = permute( permute( permute(
                             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                           
                  float n_ = 0.142857142857;
                  vec3  ns = n_ * D.wyz - D.xzx;
                  
                  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                  
                  vec4 x_ = floor(j * ns.z);
                  vec4 y_ = floor(j - 7.0 * x_ );
                  
                  vec4 x = x_ *ns.x + ns.yyyy;
                  vec4 y = y_ *ns.x + ns.yyyy;
                  vec4 h = 1.0 - abs(x) - abs(y);
                  
                  vec4 b0 = vec4( x.xy, y.xy );
                  vec4 b1 = vec4( x.zw, y.zw );
                  
                  vec4 s0 = floor(b0)*2.0 + 1.0;
                  vec4 s1 = floor(b1)*2.0 + 1.0;
                  vec4 sh = -step(h, vec4(0.0));
                  
                  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                  
                  vec3 p0 = vec3(a0.xy,h.x);
                  vec3 p1 = vec3(a0.zw,h.y);
                  vec3 p2 = vec3(a1.xy,h.z);
                  vec3 p3 = vec3(a1.zw,h.w);
                  
                  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                  p0 *= norm.x;
                  p1 *= norm.y;
                  p2 *= norm.z;
                  p3 *= norm.w;
                  
                  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                  m = m * m;
                  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                                dot(p2,x2), dot(p3,x3) ) );
                }
                
                uniform float uTime;
                varying vec3 vPosition;
                varying vec2 vUv;
                varying float vElevation;
                `
              );
              
              shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                vPosition = position;
                vUv = uv;
                
                // Create a single pathway system instead of multiple mountains
                float frequency = 0.2;
                float amplitude = 0.7;
                
                // Path system with a main trail and branches
                float valleyWidth = 0.18;
                
                // Base terrain with noise - create a rolling landscape
                float noise1 = snoise(vec3(position.x * frequency, position.z * frequency, 0.0)) * amplitude;
                float noise2 = snoise(vec3(position.x * frequency * 2.0, position.z * frequency * 2.0, 0.0)) * amplitude * 0.5;
                float baseNoise = noise1 + noise2;
                
                // Create topographic contour effect
                float contourLines = sin(position.y * 50.0 + baseNoise * 20.0);
                float contourPattern = smoothstep(0.0, 0.1, abs(contourLines));
                
                // Create main path - a winding trail through the landscape
                float mainPath = sin(position.x * 0.5) * 1.5;
                float pathDistance = abs(position.z - mainPath);
                float onPath = smoothstep(valleyWidth, valleyWidth * 2.0, pathDistance);
                
                // Additional branch paths
                float branchPath1 = abs(position.x - 1.5) + abs(position.z - 0.8);
                float branchPath2 = abs(position.x + 2.0) + abs(position.z + 1.0);
                float branchPath3 = abs(position.x - 0.5) * 0.8 + abs(position.z + 2.0) * 1.2;
                
                float onBranchPath = min(
                  min(
                    smoothstep(0.0, valleyWidth * 1.5, branchPath1),
                    smoothstep(0.0, valleyWidth * 1.5, branchPath2)
                  ),
                  smoothstep(0.0, valleyWidth * 1.5, branchPath3)
                );
                
                // Combine paths
                float allPaths = min(onPath, onBranchPath);
                
                // Create specific peaks at subject locations
                float peakHeight = 0.0;
                
                // Mathematics peak
                float mathDist = distance(vec2(position.x, position.z), vec2(0.0, -1.5));
                peakHeight = max(peakHeight, 0.8 * exp(-mathDist * 1.2));
                
                // Physics peak
                float physicsDist = distance(vec2(position.x, position.z), vec2(1.5, 0.0));
                peakHeight = max(peakHeight, 1.2 * exp(-physicsDist * 1.2));
                
                // Computer Science peak (highest)
                float csDist = distance(vec2(position.x, position.z), vec2(3.0, 0.8));
                peakHeight = max(peakHeight, 1.8 * exp(-csDist * 1.2));
                
                // Literature hill
                float litDist = distance(vec2(position.x, position.z), vec2(-1.5, -0.8));
                peakHeight = max(peakHeight, 0.5 * exp(-litDist * 1.2));
                
                // History hill
                float histDist = distance(vec2(position.x, position.z), vec2(-3.0, 0.5));
                peakHeight = max(peakHeight, 0.9 * exp(-histDist * 1.2));
                
                // Biology hill
                float bioDist = distance(vec2(position.x, position.z), vec2(2.2, -1.2));
                peakHeight = max(peakHeight, 0.6 * exp(-bioDist * 1.2));
                
                // Language hill
                float langDist = distance(vec2(position.x, position.z), vec2(-2.0, -1.8));
                peakHeight = max(peakHeight, 0.4 * exp(-langDist * 1.2));
                
                // Topographic pattern - creates the contour line effect
                float topoLines = sin(baseNoise * 40.0) * 0.5 + 0.5;
                float topoPattern = step(0.8, topoLines) * 0.03;
                
                // Combine terrain elements
                float elevation = baseNoise * 0.5 + peakHeight - 0.3 * (1.0 - allPaths);
                vElevation = elevation;
                
                // Add topographic detail
                elevation += topoPattern;
                
                // Apply elevation with path system
                transformed.y += elevation;
                
                // Add elevation falloff at edges
                float distanceFromCenter = length(position.xz);
                float edgeFalloff = 1.0 - smoothstep(4.0, 7.0, distanceFromCenter);
                transformed.y *= edgeFalloff;
                `
              );
              
              // Add fragment shader modifications for topographic coloration
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `
                #include <common>
                varying vec3 vPosition;
                varying vec2 vUv;
                varying float vElevation;
                uniform float uTime;
                `
              );
              
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <output_fragment>',
                `
                #include <output_fragment>
                
                // Create topographic map coloration like the reference image
                float elevationColor = vElevation * 3.0;
                
                // Height-based coloration similar to reference
                vec3 lowlandColor = vec3(0.3, 0.45, 0.3);     // Dark green
                vec3 midlandColor = vec3(0.45, 0.52, 0.4);    // Mid green
                vec3 highlandColor = vec3(0.6, 0.63, 0.58);   // Light green-gray
                vec3 peakColor = vec3(0.8, 0.8, 0.8);         // White-gray for peaks
                
                // Topographic lines
                float lineWidth = 0.05;
                float contourLines = mod(vElevation * 8.0, 1.0);
                float linePattern = smoothstep(0.0, lineWidth, contourLines) * smoothstep(lineWidth * 2.0, lineWidth, contourLines);
                
                // Create color based on elevation
                vec3 terrainColor = mix(
                  lowlandColor,
                  midlandColor,
                  smoothstep(0.0, 0.3, elevationColor)
                );
                
                terrainColor = mix(
                  terrainColor,
                  highlandColor,
                  smoothstep(0.3, 0.7, elevationColor)
                );
                
                terrainColor = mix(
                  terrainColor,
                  peakColor,
                  smoothstep(0.7, 1.0, elevationColor)
                );
                
                // Add subtle contour lines
                terrainColor = mix(terrainColor, vec3(0.2, 0.2, 0.2), linePattern * 0.3);
                
                // Path highlight - lighter color for paths
                float pathHighlight = (1.0 - min(
                  min(
                    abs(sin(vPosition.x * 0.5) * 1.5 - vPosition.z),
                    abs(vPosition.x - 1.5) + abs(vPosition.z - 0.8)
                  ),
                  min(
                    abs(vPosition.x + 2.0) + abs(vPosition.z + 1.0),
                    abs(vPosition.x - 0.5) * 0.8 + abs(vPosition.z + 2.0) * 1.2
                  )
                ));
                
                pathHighlight = smoothstep(0.9, 1.0, pathHighlight) * 0.15;
                terrainColor += vec3(pathHighlight);
                
                gl_FragColor.rgb = terrainColor;
                `
              );
              
              // Setup animation loop with proper type checking
              const clock = new THREE.Clock();
              
              // Use requestAnimationFrame callback to update uniforms
              const animate = () => {
                shader.uniforms.uTime.value = clock.getElapsedTime();
                requestAnimationFrame(animate);
              };
              
              // Start the animation
              animate();
            }}
          />
        </mesh>

        {/* Water/streams along paths */}
        <mesh position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[15, 15, 32, 32]} />
          <meshStandardMaterial
            color="#33C3F0"
            roughness={0.1}
            metalness={0.3}
            transparent={true}
            opacity={0.7}
            onBeforeCompile={(shader) => {
              shader.uniforms.uTime = { value: 0 };
              
              shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `
                #include <common>
                uniform float uTime;
                varying vec2 vUv;
                
                // Same noise function from above
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                
                float snoise(vec3 v) {
                  // ... noise function implementation
                  return 0.0; // simplified return for brevity
                }
                `
              );
              
              shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                vUv = uv;
                
                // Define the path network for streams
                float mainPath = sin(position.x * 0.5) * 1.5;
                float pathDistance = abs(position.z - mainPath);
                
                float branchPath1 = abs(position.x - 1.5) + abs(position.z - 0.8);
                float branchPath2 = abs(position.x + 2.0) + abs(position.z + 1.0);
                float branchPath3 = abs(position.x - 0.5) * 0.8 + abs(position.z + 2.0) * 1.2;
                
                float pathWidth = 0.14;
                float isOnPath = 0.0;
                
                // Check if on any path
                if (pathDistance < pathWidth || branchPath1 < pathWidth || 
                    branchPath2 < pathWidth || branchPath3 < pathWidth) {
                  isOnPath = 1.0;
                  
                  // Add gentle water waves
                  float waveHeight = 0.05;
                  float waveSpeed = 0.5;
                  float waveFreq = 3.0;
                  
                  transformed.y += sin(position.x * waveFreq + uTime * waveSpeed) * 
                                   cos(position.z * waveFreq + uTime * waveSpeed) * 
                                   waveHeight;
                } else {
                  // Hide water where there's no path
                  transformed.y = -10.0;
                }
                `
              );
              
              // Update time for animation
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `
                #include <common>
                uniform float uTime;
                varying vec2 vUv;
                `
              );
              
              // Add specular highlights to water
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <output_fragment>',
                `
                #include <output_fragment>
                
                // Add gentle ripples to water
                float rippleIntensity = 0.1;
                float rippleSpeed = 0.5;
                float ripple = sin(vUv.x * 20.0 + uTime * rippleSpeed) * 
                               sin(vUv.y * 20.0 + uTime * rippleSpeed) * 
                               rippleIntensity;
                               
                gl_FragColor.rgb += vec3(ripple);
                `
              );
              
              // Add animation using requestAnimationFrame instead of onBeforeRender
              const clock = new THREE.Clock();
              
              const animate = () => {
                shader.uniforms.uTime.value = clock.getElapsedTime();
                requestAnimationFrame(animate);
              };
              
              // Start the animation
              animate();
            }}
          />
        </mesh>

        {/* Sky background */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[12, 32, 32]} />
          <meshBasicMaterial color="#D3E4FD" side={THREE.BackSide} />
        </mesh>

        {/* Add some clouds for atmosphere */}
        {[...Array(15)].map((_, i) => {
          const scale = 0.3 + Math.random() * 0.5;
          const x = (Math.random() - 0.5) * 12;
          const y = 3 + Math.random() * 3;
          const z = (Math.random() - 0.5) * 12;
          const position: [number, number, number] = [x, y, z];
          
          return (
            <mesh key={`cloud-${i}`} position={position} scale={[scale, scale * 0.6, scale]}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshBasicMaterial color="white" transparent opacity={0.8} />
            </mesh>
          );
        })}

        {/* Trees along the paths */}
        {[...Array(60)].map((_, i) => {
          const height = 0.2 + Math.random() * 0.3;
          const x = (Math.random() - 0.5) * 12;
          const z = (Math.random() - 0.5) * 12;
          
          // Position trees along paths
          const onPath = (idx: number) => {
            const pathNoise = Math.sin(idx * 0.5) * 0.3;
            const mainPath = Math.sin(idx * 0.2) * 1.5;
            
            return {
              x: idx * 0.2 - 3,
              z: mainPath + pathNoise
            };
          };
          
          let treeX = x;
          let treeZ = z;
          
          // Position some trees along paths
          if (i < 35) {
            const pathPos = onPath(i);
            treeX = pathPos.x + (Math.random() - 0.5) * 0.8;
            treeZ = pathPos.z + (Math.random() - 0.5) * 0.8;
          }
          
          // Calculate y based on terrain height (simplified approximation)
          const centerDist = Math.sqrt(treeX * treeX + treeZ * treeZ);
          const y = -0.3 + Math.sin(treeX * 0.5) * Math.cos(treeZ * 0.5) * 0.2 - Math.min(0.2, centerDist * 0.02);
          const position: [number, number, number] = [treeX, y, treeZ];
          
          // Skip trees in water
          const mainPath = Math.sin(treeX * 0.5) * 1.5;
          const pathDistance = Math.abs(treeZ - mainPath);
          const branchPath1 = Math.abs(treeX - 1.5) + Math.abs(treeZ - 0.8);
          const branchPath2 = Math.abs(treeX + 2.0) + Math.abs(treeZ + 1.0);
          const pathWidth = 0.15;
          const isOnPath = pathDistance < pathWidth || branchPath1 < pathWidth || branchPath2 < pathWidth;
          
          if (isOnPath || centerDist > 6) return null;
          
          // Vary tree colors and sizes based on region/position
          const treeSizeVariation = 0.7 + (Math.random() * 0.6);
          const isPathTree = i < 35;
          
          // Tree color variation
          const colorVariants = ["#435D43", "#3F4E3F", "#5A7D5A", "#2F3C2F"];
          const colorIndex = Math.floor(Math.random() * colorVariants.length);
          
          return (
            <group key={`tree-${i}`} position={position} scale={treeSizeVariation}>
              {/* Tree trunk */}
              <mesh position={[0, height/2, 0]} scale={[0.05, height, 0.05]}>
                <cylinderGeometry />
                <meshStandardMaterial color={isPathTree ? "#614E3D" : "#403E43"} />
              </mesh>
              {/* Tree top */}
              <mesh position={[0, height + 0.15, 0]} scale={[0.2, 0.3, 0.2]}>
                <coneGeometry />
                <meshStandardMaterial color={colorVariants[colorIndex]} />
              </mesh>
            </group>
          );
        })}
        
        {/* Path indicators - stones/markers along the connecting paths */}
        {pathConnections.map((connection, idx) => {
          // Find connected subjects
          const fromSubject = subjectPositions.find(s => s.id === connection.from);
          const toSubject = subjectPositions.find(s => s.id === connection.to);
          
          if (!fromSubject || !toSubject) return null;
          
          // Create path markers
          return [...Array(5)].map((_, i) => {
            // Interpolate position along path
            const t = (i + 1) / 6; // Fraction of the path
            const x = fromSubject.x + (toSubject.x - fromSubject.x) * t;
            const z = fromSubject.z + (toSubject.z - fromSubject.z) * t;
            
            // Add some random variation
            const jitterX = (Math.random() - 0.5) * 0.2;
            const jitterZ = (Math.random() - 0.5) * 0.2;
            
            // Y position follows terrain
            const pathHeight = -0.2 + Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.2;
            
            return (
              <mesh 
                key={`path-${idx}-${i}`} 
                position={[x + jitterX, pathHeight, z + jitterZ]}
                rotation={[Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5]}
              >
                <boxGeometry args={[0.1, 0.05, 0.1]} />
                <meshStandardMaterial color="#D5D8DC" roughness={0.9} />
              </mesh>
            );
          });
        }).flat()}
      </>
    );
  };

  return (
    <Canvas
      gl={{ 
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: false,
      }}
      dpr={[1, 1.5]} // Reduced DPR for better performance
      frameloop="demand"
      shadows={false} // Disable shadows for performance
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={['#f0f0f0']} />
      
      <Environment preset="sunset" background={false} />
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1} 
      />
      <hemisphereLight intensity={0.3} groundColor="#403E43" />

      <group 
        rotation-y={rotation * (Math.PI / 180)}
        scale={[zoomLevel, zoomLevel, zoomLevel]}
      >
        {/* Render the terrain and environment */}
        {createMountainousPathTerrain()}

        {/* Render learning subject points along the path */}
        {learningSubjects.map((subject) => (
          <PathwayPoint
            key={subject.id}
            position={subject.position}
            scale={subject.scale}
            color={subject.color}
            name={subject.name}
            progress={subject.progress}
            difficulty={subject.difficulty}
            isActive={activeSubject === subject.name}
            onClick={() => setActiveSubject(subject.name === activeSubject ? null : subject.name)}
          />
        ))}
      </group>

      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.4}
        scale={10}
        blur={1.5}
        far={4}
      />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={10}
        autoRotate={!activeSubject}
        autoRotateSpeed={0.5}
        enableDamping={true}
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minPolarAngle={0.1}
      />
      
      <BakeShadows />
    </Canvas>
  );
};
