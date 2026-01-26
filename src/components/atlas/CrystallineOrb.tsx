// Crystalline Energy Orb - Advanced 3D visualization for Atlas
// Reference: Glass dodecahedron with intertwining cyan/magenta/gold energy tubes

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CrystallineOrbProps {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  inputVolume: number;
  outputVolume: number;
  onClick?: () => void;
}

// Warm golden core at the center
function GoldenCore({ volume, isActive }: { volume: number; isActive: boolean }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(time * 2) * 0.1 * (1 + volume * 0.5);
    
    if (coreRef.current) {
      coreRef.current.scale.setScalar(0.25 * pulse);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(0.5 * pulse);
    }
  });

  const coreIntensity = isActive ? 1 : 0.4;

  return (
    <group>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ffaa44"
          transparent
          opacity={0.3 * coreIntensity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Inner core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ffe4aa"
          transparent
          opacity={0.9 * coreIntensity}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight 
        color="#ffcc66" 
        intensity={isActive ? 3 + volume * 2 : 1} 
        distance={5} 
        decay={2} 
      />
    </group>
  );
}

// Thick tubular energy ribbon
function EnergyTube({ 
  color, 
  radius, 
  tubeRadius,
  segments,
  rotationAxis,
  rotationSpeed,
  phaseOffset,
  volume,
  isActive 
}: { 
  color: string;
  radius: number;
  tubeRadius: number;
  segments: number;
  rotationAxis: THREE.Vector3;
  rotationSpeed: number;
  phaseOffset: number;
  volume: number;
  isActive: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      meshRef.current.rotation.x = rotationAxis.x * time * rotationSpeed + phaseOffset;
      meshRef.current.rotation.y = rotationAxis.y * time * rotationSpeed + phaseOffset;
      meshRef.current.rotation.z = rotationAxis.z * time * rotationSpeed + phaseOffset;
      
      const scale = radius * (1 + volume * 0.1);
      meshRef.current.scale.setScalar(scale);
    }
  });

  if (!isActive) return null;

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[0.5, tubeRadius, 64, 8, 2, 3]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Intertwining energy ribbons system
function EnergyRibbons({ volume, isActive }: { volume: number; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create multiple ribbon paths
  const ribbonConfigs = useMemo(() => [
    // Cyan ribbons
    { color: '#00ffff', scale: 0.9, tubeRadius: 0.025, p: 2, q: 3, rotX: 0.1, rotY: 0.15, phase: 0 },
    { color: '#40e0d0', scale: 0.85, tubeRadius: 0.02, p: 3, q: 2, rotX: -0.12, rotY: 0.1, phase: Math.PI / 3 },
    { color: '#00ced1', scale: 0.95, tubeRadius: 0.018, p: 2, q: 5, rotX: 0.08, rotY: -0.13, phase: Math.PI * 2 / 3 },
    // Magenta/Pink ribbons
    { color: '#ff00ff', scale: 0.88, tubeRadius: 0.022, p: 3, q: 4, rotX: -0.09, rotY: 0.14, phase: Math.PI / 4 },
    { color: '#da70d6', scale: 0.82, tubeRadius: 0.02, p: 2, q: 3, rotX: 0.11, rotY: -0.08, phase: Math.PI / 2 },
    // Gold/Amber ribbons
    { color: '#ffd700', scale: 0.86, tubeRadius: 0.024, p: 3, q: 5, rotX: -0.07, rotY: 0.12, phase: Math.PI * 5 / 6 },
    { color: '#ffaa00', scale: 0.92, tubeRadius: 0.019, p: 2, q: 3, rotX: 0.13, rotY: -0.11, phase: Math.PI },
  ], []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });

  if (!isActive) return null;

  return (
    <group ref={groupRef}>
      {ribbonConfigs.map((config, i) => (
        <TorusKnotRibbon
          key={i}
          color={config.color}
          scale={config.scale}
          tubeRadius={config.tubeRadius}
          p={config.p}
          q={config.q}
          rotationSpeedX={config.rotX}
          rotationSpeedY={config.rotY}
          phaseOffset={config.phase}
          volume={volume}
        />
      ))}
    </group>
  );
}

// Individual torus knot ribbon
function TorusKnotRibbon({
  color,
  scale,
  tubeRadius,
  p,
  q,
  rotationSpeedX,
  rotationSpeedY,
  phaseOffset,
  volume
}: {
  color: string;
  scale: number;
  tubeRadius: number;
  p: number;
  q: number;
  rotationSpeedX: number;
  rotationSpeedY: number;
  phaseOffset: number;
  volume: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      meshRef.current.rotation.x = time * rotationSpeedX + phaseOffset;
      meshRef.current.rotation.y = time * rotationSpeedY + phaseOffset * 0.7;
      meshRef.current.rotation.z = Math.sin(time * 0.5 + phaseOffset) * 0.3;
      
      const volumeScale = 1 + volume * 0.15;
      meshRef.current.scale.setScalar(scale * volumeScale);
    }
  });

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[0.6, tubeRadius, 128, 16, p, q]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.75 + volume * 0.25}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Glowing vertex points on the crystal
function VertexGlowPoints({ isActive }: { isActive: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Dodecahedron vertices
  const positions = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(1.95, 0);
    const posArray = geo.attributes.position.array as Float32Array;
    
    // Get unique vertices
    const vertices: number[] = [];
    const seen = new Set<string>();
    
    for (let i = 0; i < posArray.length; i += 3) {
      const key = `${posArray[i].toFixed(2)},${posArray[i+1].toFixed(2)},${posArray[i+2].toFixed(2)}`;
      if (!seen.has(key)) {
        seen.add(key);
        vertices.push(posArray[i], posArray[i+1], posArray[i+2]);
      }
    }
    
    return new Float32Array(vertices);
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#00ffff"
        size={isActive ? 0.15 : 0.08}
        transparent
        opacity={isActive ? 0.9 : 0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Crystal lens flares at key points
function CrystalFlares({ isActive }: { isActive: boolean }) {
  const flaresRef = useRef<THREE.Group>(null);
  
  const flarePositions = useMemo(() => [
    new THREE.Vector3(1.8, 0.8, 0.5),
    new THREE.Vector3(-1.5, 1.2, -0.8),
    new THREE.Vector3(0.5, -1.6, 1.0),
    new THREE.Vector3(-0.8, 0.5, 1.7),
  ], []);

  useFrame((state) => {
    if (flaresRef.current) {
      flaresRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  if (!isActive) return null;

  return (
    <group ref={flaresRef}>
      {flarePositions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <planeGeometry args={[0.3, 0.3]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.6}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <pointLight color="#ffffff" intensity={0.5} distance={2} decay={2} />
        </group>
      ))}
    </group>
  );
}

// Glass crystal shell with refractive edges
function CrystalShell({ volume, isActive }: { volume: number; isActive: boolean }) {
  const shellRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  
  useFrame((state) => {
    const rotation = state.clock.elapsedTime * 0.08;
    if (shellRef.current) {
      shellRef.current.rotation.y = rotation;
      shellRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.1;
    }
    if (edgesRef.current) {
      edgesRef.current.rotation.y = rotation;
      edgesRef.current.rotation.x = shellRef.current?.rotation.x || 0;
    }
  });

  const geometry = useMemo(() => new THREE.DodecahedronGeometry(2, 0), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  return (
    <group>
      {/* Main glass shell */}
      <mesh ref={shellRef} geometry={geometry}>
        <meshPhysicalMaterial
          color="#88ccff"
          metalness={0.1}
          roughness={0.0}
          transmission={0.95}
          thickness={0.5}
          envMapIntensity={1}
          clearcoat={1}
          clearcoatRoughness={0}
          ior={2.4}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Bright glowing edges */}
      <lineSegments ref={edgesRef} geometry={edgesGeometry}>
        <lineBasicMaterial 
          color={isActive ? "#aaeeff" : "#668899"} 
          transparent 
          opacity={isActive ? 0.7 + volume * 0.3 : 0.25}
          linewidth={2}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      
      {/* Inner edge glow for thickness effect */}
      <lineSegments geometry={edgesGeometry} scale={0.98}>
        <lineBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={isActive ? 0.3 : 0.1}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

// Ambient particle dust
function AmbientDust({ volume, isActive }: { volume: number; isActive: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const count = 300;
    const pos = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.5 + Math.random() * 1.8;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={isActive ? '#ffffff' : '#aabbcc'}
        size={isActive ? 0.02 + volume * 0.01 : 0.015}
        transparent
        opacity={isActive ? 0.7 : 0.3}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Main 3D Scene
function OrbScene({ isConnected, isSpeaking, inputVolume, outputVolume }: { 
  isConnected: boolean; 
  isSpeaking: boolean; 
  inputVolume: number; 
  outputVolume: number 
}) {
  const volume = isSpeaking ? outputVolume : inputVolume;
  const isActive = isConnected;

  return (
    <>
      {/* Subtle ambient */}
      <ambientLight intensity={0.15} />
      
      {/* Core lighting */}
      <GoldenCore volume={volume} isActive={isActive} />
      
      {/* Energy ribbon system */}
      <EnergyRibbons volume={volume} isActive={isActive} />
      
      {/* Glowing points at crystal vertices */}
      <VertexGlowPoints isActive={isActive} />
      
      {/* Lens flare effects */}
      <CrystalFlares isActive={isActive} />
      
      {/* Ambient particles */}
      <AmbientDust volume={volume} isActive={isActive} />
      
      {/* Crystal shell - rendered last */}
      <CrystalShell volume={volume} isActive={isActive} />
    </>
  );
}

export function CrystallineOrb({ 
  isConnected, 
  isConnecting,
  isSpeaking, 
  inputVolume, 
  outputVolume,
  onClick 
}: CrystallineOrbProps) {
  return (
    <div 
      className="relative w-full h-full cursor-pointer"
      onClick={onClick}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ 
          alpha: true, 
          antialias: true, 
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.3,
        }}
      >
        <OrbScene 
          isConnected={isConnected}
          isSpeaking={isSpeaking}
          inputVolume={inputVolume}
          outputVolume={outputVolume}
        />
      </Canvas>
      
      {/* Overlay text */}
      {!isConnected && !isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-center bg-background/70 px-3 py-1.5 rounded-full backdrop-blur-sm border border-border/40">
            Tap to Activate
          </span>
        </div>
      )}
      
      {isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-mono text-primary uppercase tracking-widest animate-pulse text-center bg-background/70 px-3 py-1.5 rounded-full backdrop-blur-sm border border-primary/40">
            Connecting...
          </span>
        </div>
      )}
    </div>
  );
}
