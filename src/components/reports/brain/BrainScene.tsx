
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  ContactShadows,
  BakeShadows,
} from '@react-three/drei';
import { MountainRegion } from './MountainRegion';
import * as THREE from 'three';

interface BrainSceneProps {
  activeRegion: string | null;
  setActiveRegion: (region: string | null) => void;
  zoomLevel: number;
  rotation: number;
}

export const BrainScene = ({ activeRegion, setActiveRegion, zoomLevel, rotation }: BrainSceneProps) => {
  const cognitiveRegions = [
    {
      id: "memory_retention",
      name: "Memory Retention",
      position: [-3.0, 0.7, 1.2] as [number, number, number], // More separated
      scale: [1.2, 1.1, 1.1] as [number, number, number],
      rotation: [0.2, 0, -0.1] as [number, number, number],
      color: "#D946EF",
      activity: 0.85,
      altitude: 1.2,
      geometry: "large_peak"
    },
    {
      id: "critical_thinking",
      name: "Critical Thinking",
      position: [2.5, 0.9, 1.8] as [number, number, number], // More separated
      scale: [1.0, 1.4, 0.9] as [number, number, number],
      rotation: [0, 0.2, 0] as [number, number, number],
      color: "#FEF7CD",
      activity: 0.7,
      altitude: 1.4,
      geometry: "sharp_peak"
    },
    {
      id: "problem_solving",
      name: "Problem Solving",
      position: [-1.2, 0.5, -2.3] as [number, number, number], // More separated
      scale: [1.0, 0.9, 1.0] as [number, number, number],
      rotation: [-0.3, 0, -0.1] as [number, number, number],
      color: "#F2FCE2",
      activity: 0.75,
      altitude: 0.9,
      geometry: "medium_peak"
    },
    {
      id: "creative_thinking",
      name: "Creativity",
      position: [1.5, 0.6, -2.5] as [number, number, number], // More separated
      scale: [0.9, 1.2, 0.9] as [number, number, number],
      rotation: [-0.4, 0, -0.1] as [number, number, number],
      color: "#D6BCFA",
      activity: 0.65,
      altitude: 1.2,
      geometry: "rolling_hill"
    },
    {
      id: "analytical_processing",
      name: "Analytical Processing",
      position: [2.2, 0.7, 0.2] as [number, number, number], // More separated
      scale: [1.2, 1.1, 1.1] as [number, number, number],
      rotation: [0.2, 0, 0.1] as [number, number, number],
      color: "#D946EF",
      activity: 0.85,
      altitude: 1.1,
      geometry: "plateau"
    },
    {
      id: "language_processing",
      name: "Language Processing",
      position: [-2.2, 0.4, 0.0] as [number, number, number], // More separated
      scale: [1.0, 0.8, 0.9] as [number, number, number],
      rotation: [0, -0.2, 0] as [number, number, number],
      color: "#FEF7CD",
      activity: 0.6,
      altitude: 0.8,
      geometry: "gentle_slope"
    },
    {
      id: "spatial_awareness",
      name: "Spatial Awareness",
      position: [0.8, 0.5, -1.2] as [number, number, number], // More separated
      scale: [1.0, 0.9, 1.0] as [number, number, number],
      rotation: [-0.3, 0, 0.1] as [number, number, number],
      color: "#F2FCE2",
      activity: 0.75,
      altitude: 0.9,
      geometry: "rocky_terrain"
    },
    {
      id: "visual_processing",
      name: "Visual Processing",
      position: [-1.0, 0.2, -0.8] as [number, number, number], // More separated
      scale: [0.9, 0.8, 0.9] as [number, number, number],
      rotation: [-0.4, 0, 0.1] as [number, number, number],
      color: "#D6BCFA",
      activity: 0.5,
      altitude: 0.8,
      geometry: "smooth_hill"
    },
    {
      id: "focus_concentration",
      name: "Focus & Concentration",
      position: [0, 1.0, 0.0] as [number, number, number],
      scale: [1.2, 1.5, 1.0] as [number, number, number],
      rotation: [0.3, 0, 0] as [number, number, number],
      color: "#8B5CF6",
      activity: 0.9,
      altitude: 1.5,
      geometry: "highest_peak"
    },
  ];

  const createTerrainBase = () => {
    // Calculate mountain positions for path planning
    const mountainPositions = cognitiveRegions.map(region => ({
      x: region.position[0],
      z: region.position[2],
      id: region.id
    }));
    
    // Define path connections between mountains
    const pathConnections = [
      { from: "focus_concentration", to: "critical_thinking" },
      { from: "focus_concentration", to: "memory_retention" },
      { from: "focus_concentration", to: "problem_solving" },
      { from: "focus_concentration", to: "creative_thinking" },
      { from: "critical_thinking", to: "analytical_processing" },
      { from: "memory_retention", to: "language_processing" },
      { from: "problem_solving", to: "spatial_awareness" },
      { from: "creative_thinking", to: "visual_processing" },
      { from: "analytical_processing", to: "visual_processing" },
      { from: "language_processing", to: "spatial_awareness" }
    ];
    
    return (
      <>
        {/* Base terrain - with topographic-style mountain paths */}
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
                
                // Create a mountainous terrain with valleys and ridges
                float frequency = 0.2;
                float amplitude = 0.7;
                
                // Create valleys connecting the cognitive regions
                float valleyDepth = 0.3;
                float valleyWidth = 0.18;
                
                // Base terrain with noise - more separated mountains
                float noise1 = snoise(vec3(position.x * frequency, position.z * frequency, 0.0)) * amplitude;
                float noise2 = snoise(vec3(position.x * frequency * 2.0, position.z * frequency * 2.0, 0.0)) * amplitude * 0.5;
                float noise = noise1 + noise2;
                
                // Create topographic contour effect
                float contourLines = sin(position.y * 50.0 + noise * 20.0);
                float contourPattern = smoothstep(0.0, 0.1, abs(contourLines));
                
                // Central mountain for 'focus_concentration'
                float centerDistance = distance(vec2(position.x, position.z), vec2(0.0, 0.0));
                float centralPeak = 1.5 * exp(-centerDistance * 0.8); // Steeper falloff
                
                // Create a more defined river/valley system with tributaries
                float riverDepth = 0.3;
                float riverWidth = 0.15;
                
                // Main paths - bright blue in reference image
                float riverPath1 = abs(position.x * 0.7 + position.z * 0.3);
                float riverPath2 = abs(-position.x * 0.5 + position.z * 0.5); 
                float riverPath3 = abs(position.x * 0.2 - position.z * 0.8);
                float riverPath4 = abs(position.x * 0.5 + position.z * 0.8);
                float riverPath5 = abs(-position.x * 0.8 + position.z * 0.5);
                
                float riverChannel = min(
                  min(min(
                    smoothstep(0.0, riverWidth, riverPath1),
                    smoothstep(0.0, riverWidth, riverPath2)),
                    min(
                      smoothstep(0.0, riverWidth, riverPath3),
                      smoothstep(0.0, riverWidth, riverPath4)
                    )
                  ),
                  smoothstep(0.0, riverWidth, riverPath5)
                );
                
                // Secondary paths
                float secondaryPath1 = abs(sin(position.x * 2.0) * 0.5 - position.z * 0.5);
                float secondaryPath2 = abs(cos(position.z * 2.0) * 0.5 - position.x * 0.3);
                
                float secondaryChannel = min(
                  smoothstep(0.0, riverWidth * 0.7, secondaryPath1),
                  smoothstep(0.0, riverWidth * 0.7, secondaryPath2)
                );
                
                // Combined paths
                float allPaths = min(riverChannel, secondaryChannel);
                
                // Topographic pattern - creates the contour line effect seen in the reference
                float topoLines = sin(noise * 40.0) * 0.5 + 0.5;
                float topoPattern = step(0.8, topoLines) * 0.03;
                
                // Create elevation variation similar to reference image
                float elevation = noise * 0.8 + centralPeak - riverDepth * (1.0 - allPaths);
                vElevation = elevation;
                
                // Add topographic detail
                elevation += topoPattern;
                
                // Apply elevation with valley paths
                transformed.y += elevation;
                
                // Add elevation variation to create rolling mountainous terrain
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
              
              // Modify the fragment shader to create topographic map coloration
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <output_fragment>',
                `
                #include <output_fragment>
                
                // Create topographic map coloration
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
                
                // Path coloration - subtle lighter green for paths
                float pathHighlight = (1.0 - min(
                  min(
                    abs(sin(vPosition.x * 0.7 + vPosition.z * 0.3) * 5.0),
                    abs(sin(-vPosition.x * 0.5 + vPosition.z * 0.5) * 5.0)
                  ),
                  min(
                    abs(sin(vPosition.x * 0.2 - vPosition.z * 0.8) * 5.0),
                    abs(sin(vPosition.x * 0.8 + vPosition.z * 0.2) * 5.0)
                  )
                ));
                
                pathHighlight = smoothstep(0.9, 1.0, pathHighlight) * 0.15;
                terrainColor += vec3(pathHighlight);
                
                gl_FragColor.rgb = terrainColor;
                `
              );
              
              // Setup animation update
              const originalOnBeforeRender = shader.onBeforeRender;
              shader.onBeforeRender = function(renderer, scene, camera) {
                if (originalOnBeforeRender) {
                  originalOnBeforeRender(renderer, scene, camera);
                }
                shader.uniforms.uTime.value = performance.now() / 1000;
              };
            }}
          />
        </mesh>

        {/* Water along paths and in valleys */}
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
                `
              );
              
              shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                vUv = uv;
                
                // Make water appear only in valleys and paths
                // Define river paths - make them match the reference image blue paths
                float riverPath1 = abs(position.x * 0.7 + position.z * 0.3);
                float riverPath2 = abs(-position.x * 0.5 + position.z * 0.5);
                float riverPath3 = abs(position.x * 0.2 - position.z * 0.8);
                float riverPath4 = abs(position.x * 0.5 + position.z * 0.8);
                float riverPath5 = abs(-position.x * 0.8 + position.z * 0.5);
                
                float riverWidth = 0.14;
                float isRiver = 0.0;
                
                if (riverPath1 < riverWidth || riverPath2 < riverWidth || riverPath3 < riverWidth || 
                    riverPath4 < riverWidth || riverPath5 < riverWidth) {
                  isRiver = 1.0;
                  
                  // Add gentle water waves
                  float waveHeight = 0.05;
                  float waveSpeed = 0.5;
                  float waveFreq = 3.0;
                  
                  transformed.y += sin(position.x * waveFreq + uTime * waveSpeed) * 
                                  cos(position.z * waveFreq + uTime * waveSpeed) * 
                                  waveHeight;
                } else {
                  // Hide water where there's no river
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
              
              // Add animation update in render loop
              const clock = new THREE.Clock();
              
              const originalOnBeforeRender = shader.onBeforeRender || function() {};
              shader.onBeforeRender = function(renderer, scene, camera) {
                originalOnBeforeRender(renderer, scene, camera);
                shader.uniforms.uTime.value = clock.getElapsedTime();
              };
            }}
          />
        </mesh>

        {/* Sky dome */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[12, 32, 32]} />
          <meshBasicMaterial color="#D3E4FD" side={THREE.BackSide} />
        </mesh>

        {/* Clouds */}
        {[...Array(20)].map((_, i) => {
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

        {/* Trees and vegetation along paths and valleys */}
        {[...Array(80)].map((_, i) => {
          const height = 0.2 + Math.random() * 0.3;
          const x = (Math.random() - 0.5) * 12;
          const z = (Math.random() - 0.5) * 12;
          
          // Position trees along paths
          const onPath = (idx: number) => {
            const pathNoise = Math.sin(idx * 0.5) * 0.3;
            const paths = [
              { x: -0.5 + pathNoise, z: idx * 0.2 - 3 },
              { x: 0.5 + pathNoise, z: idx * 0.2 - 3 },
              { x: idx * 0.2 - 3, z: 0.5 + pathNoise },
              { x: idx * 0.2 - 3, z: -0.5 + pathNoise },
            ];
            return paths[i % 4];
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
          
          // Skip trees in water or very high elevations
          const riverPath1 = Math.abs(treeX * 0.7 + treeZ * 0.3);
          const riverPath2 = Math.abs(-treeX * 0.5 + treeZ * 0.5);
          const riverPath3 = Math.abs(treeX * 0.2 - treeZ * 0.8);
          const riverWidth = 0.15;
          const isRiver = riverPath1 < riverWidth || riverPath2 < riverWidth || riverPath3 < riverWidth;
          
          if (isRiver || centerDist > 6) return null;
          
          // Vary tree colors and sizes based on region/position
          const treeSizeVariation = 0.7 + (Math.random() * 0.6);
          const isPathTree = i < 35;
          
          // Tree color variation - using more muted greens to match reference
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
        
        {/* Path indicators - small stones/markers along the connecting paths */}
        {pathConnections.map((connection, idx) => {
          // Find connected mountains
          const fromMountain = mountainPositions.find(m => m.id === connection.from);
          const toMountain = mountainPositions.find(m => m.id === connection.to);
          
          if (!fromMountain || !toMountain) return null;
          
          // Create path markers along the connection
          return [...Array(5)].map((_, i) => {
            // Interpolate position along path
            const t = (i + 1) / 6; // Fraction of the path (avoiding start/end)
            const x = fromMountain.x + (toMountain.x - fromMountain.x) * t;
            const z = fromMountain.z + (toMountain.z - fromMountain.z) * t;
            
            // Add some random variation to make path natural
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
        {/* Base terrain and environment */}
        {createTerrainBase()}

        {/* Cognitive regions as mountains */}
        {cognitiveRegions.map((region) => (
          <MountainRegion
            key={region.id}
            position={region.position}
            rotation={region.rotation}
            scale={region.scale}
            color={region.color}
            name={region.name}
            activity={region.activity}
            altitude={region.altitude}
            isActive={activeRegion === region.name}
            geometry={region.geometry}
            onClick={() => setActiveRegion(region.name === activeRegion ? null : region.name)}
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
        autoRotate={!activeRegion}
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
