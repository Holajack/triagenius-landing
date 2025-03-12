
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
      position: [0, 0.2, -1.5] as [number, number, number],
      scale: [1.0, 1.1, 1.0] as [number, number, number],
      color: "#D946EF",
      progress: 0.65,
      difficulty: 0.8
    },
    {
      id: "physics",
      name: "Physics",
      position: [1.5, 0.3, 0] as [number, number, number],
      scale: [1.0, 1.2, 1.0] as [number, number, number],
      color: "#8B5CF6",
      progress: 0.45,
      difficulty: 0.9
    },
    {
      id: "computer_science",
      name: "Computer Science",
      position: [3.0, 0.4, 0.8] as [number, number, number],
      scale: [1.1, 1.4, 1.0] as [number, number, number],
      color: "#2DD4BF",
      progress: 0.7,
      difficulty: 0.75
    },
    {
      id: "literature",
      name: "Literature",
      position: [-1.5, 0.2, -0.8] as [number, number, number],
      scale: [1.0, 0.8, 1.0] as [number, number, number],
      color: "#F59E0B",
      progress: 0.85,
      difficulty: 0.5
    },
    {
      id: "history",
      name: "History",
      position: [-3.0, 0.3, 0.5] as [number, number, number],
      scale: [1.0, 1.0, 1.0] as [number, number, number],
      color: "#EF4444",
      progress: 0.6,
      difficulty: 0.6
    },
    {
      id: "biology",
      name: "Biology",
      position: [2.2, 0.2, -1.2] as [number, number, number],
      scale: [1.0, 0.9, 1.0] as [number, number, number],
      color: "#10B981",
      progress: 0.5,
      difficulty: 0.7
    },
    {
      id: "language",
      name: "Languages",
      position: [-2.0, 0.1, -1.8] as [number, number, number],
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

  const createPathTerrain = () => {
    const subjectPositions = learningSubjects.map(subject => ({
      x: subject.position[0],
      z: subject.position[2],
      id: subject.id
    }));
    
    return (
      <>
        {/* Flat ground with subtle texture */}
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[15, 15]} />
          <meshStandardMaterial
            color="#f0f0f0"
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>

        {/* Path connections */}
        {pathConnections.map((connection, idx) => {
          const fromSubject = subjectPositions.find(s => s.id === connection.from);
          const toSubject = subjectPositions.find(s => s.id === connection.to);
          
          if (!fromSubject || !toSubject) return null;
          
          // Create path markers
          return [...Array(5)].map((_, i) => {
            const t = (i + 1) / 6;
            const x = fromSubject.x + (toSubject.x - fromSubject.x) * t;
            const z = fromSubject.z + (toSubject.z - fromSubject.z) * t;
            
            const jitterX = (Math.random() - 0.5) * 0.1;
            const jitterZ = (Math.random() - 0.5) * 0.1;
            
            return (
              <mesh 
                key={`path-${idx}-${i}`} 
                position={[x + jitterX, -0.4, z + jitterZ]}
                rotation={[0, Math.random() * Math.PI, 0]}
              >
                <boxGeometry args={[0.1, 0.02, 0.1]} />
                <meshStandardMaterial color="#e0e0e0" roughness={0.9} />
              </mesh>
            );
          });
        }).flat()}

        {/* Background sky */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[12, 32, 32]} />
          <meshBasicMaterial color="#f8f9fa" side={THREE.BackSide} />
        </mesh>
      </>
    );
  };

  return (
    <Canvas
      gl={{ 
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 1.5]}
      frameloop="demand"
      shadows={false}
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={['#f8f9fa']} />
      
      <Environment preset="sunset" background={false} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />

      <group 
        rotation-y={rotation * (Math.PI / 180)}
        scale={[zoomLevel, zoomLevel, zoomLevel]}
      >
        {createPathTerrain()}

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
        position={[0, -0.5, 0]}
        opacity={0.3}
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
