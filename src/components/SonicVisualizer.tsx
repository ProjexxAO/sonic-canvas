// Atlas Sonic OS - 3D Visualizer Component

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { SonicAgent } from '@/lib/agentTypes';

interface SonicCoreProps {
  agent: SonicAgent | null;
  audioData: Uint8Array;
}

function SonicCore({ agent, audioData }: SonicCoreProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  const avgFrequency = useMemo(() => {
    if (!audioData.length) return 0;
    return audioData.reduce((a, b) => a + b, 0) / audioData.length / 255;
  }, [audioData]);

  const color = agent?.sonicDNA.color || '#00ffd5';
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.008;
      const scale = 1 + avgFrequency * 0.5;
      meshRef.current.scale.setScalar(scale);
    }
    if (glowRef.current) {
      glowRef.current.rotation.y -= 0.003;
      const glowScale = 1.5 + avgFrequency * 0.3;
      glowRef.current.scale.setScalar(glowScale);
    }
  });

  const getGeometry = () => {
    const waveform = agent?.sonicDNA.waveform || 'sine';
    switch (waveform) {
      case 'square': return <boxGeometry args={[1.5, 1.5, 1.5]} />;
      case 'sawtooth': return <coneGeometry args={[1, 2, 8]} />;
      case 'triangle': return <tetrahedronGeometry args={[1.2]} />;
      default: return <icosahedronGeometry args={[1, 1]} />;
    }
  };

  return (
    <group>
      {/* Core geometry */}
      <mesh ref={meshRef}>
        {getGeometry()}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5 + avgFrequency}
          wireframe
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Inner glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1 + avgFrequency * 0.2}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2, 0.02, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      
      {/* Second ring */}
      <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[2.5, 0.01, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

interface OrbitalAgentProps {
  agent: SonicAgent;
  index: number;
  total: number;
  onClick: () => void;
  isSelected: boolean;
}

function OrbitalAgent({ agent, index, total, onClick, isSelected }: OrbitalAgentProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const angle = (index / total) * Math.PI * 2;
  const radius = 4 + (index % 3);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      const speed = 0.2 + agent.metrics.efficiency * 0.001;
      meshRef.current.position.x = Math.cos(angle + time * speed) * radius;
      meshRef.current.position.z = Math.sin(angle + time * speed) * radius;
      meshRef.current.position.y = Math.sin(time * 0.5 + index) * 0.5;
      meshRef.current.rotation.x += 0.02;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} onClick={onClick}>
      <octahedronGeometry args={[0.2]} />
      <meshStandardMaterial
        color={agent.sonicDNA.color}
        emissive={agent.sonicDNA.color}
        emissiveIntensity={isSelected ? 1 : 0.3}
      />
    </mesh>
  );
}

function GridPlane() {
  return (
    <gridHelper
      args={[30, 30, '#00ffd5', '#00ffd520']}
      position={[0, -3, 0]}
    />
  );
}

interface SonicVisualizerProps {
  selectedAgent: SonicAgent | null;
  agents: SonicAgent[];
  onSelectAgent: (agent: SonicAgent) => void;
  audioData: Uint8Array;
}

export default function SonicVisualizer({ 
  selectedAgent, 
  agents, 
  onSelectAgent,
  audioData 
}: SonicVisualizerProps) {
  return (
    <div className="w-full h-full relative">
      {/* HUD overlay */}
      <div className="absolute top-4 left-4 z-10 font-mono text-xs text-primary/70">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span>VISUALIZER ACTIVE</span>
        </div>
        {selectedAgent && (
          <div className="mt-2 text-muted-foreground">
            FOCUS: {selectedAgent.designation}
          </div>
        )}
      </div>
      
      {/* Status indicators */}
      <div className="absolute top-4 right-4 z-10 font-mono text-xs text-right">
        <div className="text-primary">NODES: {agents.length}</div>
        <div className="text-muted-foreground">GRID: ONLINE</div>
      </div>
      
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 2, 8], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ffd5" />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#9945ff" />
        
        <SonicCore agent={selectedAgent} audioData={audioData} />
        
        {agents.map((agent, i) => (
          <OrbitalAgent
            key={agent.id}
            agent={agent}
            index={i}
            total={agents.length}
            onClick={() => onSelectAgent(agent)}
            isSelected={selectedAgent?.id === agent.id}
          />
        ))}
        
        <GridPlane />
        <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={5}
          maxDistance={15}
          autoRotate
          autoRotateSpeed={0.3}
        />
      </Canvas>
      
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none scanlines opacity-30" />
    </div>
  );
}
