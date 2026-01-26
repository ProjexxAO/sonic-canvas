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
  const outerGlowRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(time * 2) * 0.15 * (1 + volume * 0.5);
    
    if (coreRef.current) {
      coreRef.current.scale.setScalar(0.3 * pulse);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(0.55 * pulse);
    }
    if (outerGlowRef.current) {
      outerGlowRef.current.scale.setScalar(0.85 * pulse);
    }
  });

  const intensity = isActive ? 1 : 0.6;

  return (
    <group>
      {/* Outer magenta atmospheric glow */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ff44aa"
          transparent
          opacity={0.25 * intensity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Mid cyan glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#44ffee"
          transparent
          opacity={0.5 * intensity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Inner warm core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ffdd88"
          transparent
          opacity={1 * intensity}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Multi-colored point lights */}
      <pointLight 
        color="#ff66cc" 
        intensity={isActive ? 3 + volume * 2 : 1.5} 
        distance={4} 
        decay={2} 
      />
      <pointLight 
        color="#44ddff" 
        intensity={isActive ? 2 + volume * 1.5 : 1} 
        distance={5} 
        decay={2} 
      />
      <pointLight 
        color="#ffaa44" 
        intensity={isActive ? 2 + volume * 1.5 : 1} 
        distance={5} 
        decay={2} 
      />
    </group>
  );
}

// Individual torus knot ribbon - ALWAYS VISIBLE
function TorusKnotRibbon({
  color,
  scale,
  tubeRadius,
  p,
  q,
  rotationSpeedX,
  rotationSpeedY,
  phaseOffset,
  volume,
  isActive
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
  isActive: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      const speed = isActive ? 1 : 0.3;
      meshRef.current.rotation.x = time * rotationSpeedX * speed + phaseOffset;
      meshRef.current.rotation.y = time * rotationSpeedY * speed + phaseOffset * 0.7;
      meshRef.current.rotation.z = Math.sin(time * 0.5 * speed + phaseOffset) * 0.3;
      
      const volumeScale = 1 + volume * 0.15;
      meshRef.current.scale.setScalar(scale * volumeScale);
    }
  });
  // Increased opacity for more vibrant colors
  const opacity = isActive ? 0.95 + volume * 0.05 : 0.7;

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[0.6, tubeRadius, 128, 16, p, q]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Intertwining energy ribbons system - ALWAYS VISIBLE
function EnergyRibbons({ volume, isActive }: { volume: number; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create multiple ribbon paths - scaled down to fit inside smaller shell
  const ribbonConfigs = useMemo(() => [
    // Cyan ribbons
    { color: '#00ffff', scale: 0.22, tubeRadius: 0.012, p: 2, q: 3, rotX: 0.1, rotY: 0.15, phase: 0 },
    { color: '#40e0d0', scale: 0.20, tubeRadius: 0.010, p: 3, q: 2, rotX: -0.12, rotY: 0.1, phase: Math.PI / 3 },
    { color: '#00ced1', scale: 0.24, tubeRadius: 0.009, p: 2, q: 5, rotX: 0.08, rotY: -0.13, phase: Math.PI * 2 / 3 },
    // Magenta/Pink ribbons
    { color: '#ff00ff', scale: 0.21, tubeRadius: 0.011, p: 3, q: 4, rotX: -0.09, rotY: 0.14, phase: Math.PI / 4 },
    { color: '#da70d6', scale: 0.19, tubeRadius: 0.010, p: 2, q: 3, rotX: 0.11, rotY: -0.08, phase: Math.PI / 2 },
    // Gold/Amber ribbons  
    { color: '#ffd700', scale: 0.20, tubeRadius: 0.011, p: 3, q: 5, rotX: -0.07, rotY: 0.12, phase: Math.PI * 5 / 6 },
    { color: '#ffaa00', scale: 0.23, tubeRadius: 0.009, p: 2, q: 3, rotX: 0.13, rotY: -0.11, phase: Math.PI },
  ], []);

  useFrame((state) => {
    if (groupRef.current) {
      const speed = isActive ? 0.003 : 0.001;
      groupRef.current.rotation.y += speed;
    }
  });

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
          isActive={isActive}
        />
      ))}
    </group>
  );
}

// Glowing vertex points on the crystal - ALWAYS VISIBLE
function VertexGlowPoints({ isActive }: { isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Dodecahedron vertices - smaller to match core size
  const positions = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(0.5, 0);
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
    if (groupRef.current) {
      const speed = isActive ? 0.05 : 0.02;
      groupRef.current.rotation.y = state.clock.elapsedTime * speed;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  // Colorful vertex points
  const colors = ['#00ffff', '#ff44cc', '#44ff88', '#ffaa44'];
  
  return (
    <group ref={groupRef}>
      {Array.from({ length: Math.floor(positions.length / 3) }).map((_, i) => (
        <mesh key={i} position={[positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]]}>
          <sphereGeometry args={[isActive ? 0.04 : 0.025, 8, 8]} />
          <meshBasicMaterial
            color={colors[i % colors.length]}
            transparent
            opacity={isActive ? 0.95 : 0.6}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

// Crystal lens flares at key points - ALWAYS VISIBLE
function CrystalFlares({ isActive }: { isActive: boolean }) {
  const flaresRef = useRef<THREE.Group>(null);
  
  // Smaller flare positions to match core size
  const flarePositions = useMemo(() => [
    new THREE.Vector3(0.45, 0.2, 0.12),
    new THREE.Vector3(-0.38, 0.3, -0.2),
    new THREE.Vector3(0.12, -0.4, 0.25),
    new THREE.Vector3(-0.2, 0.12, 0.42),
  ], []);

  useFrame((state) => {
    if (flaresRef.current) {
      const speed = isActive ? 0.03 : 0.01;
      flaresRef.current.rotation.y = state.clock.elapsedTime * speed;
    }
  });

  const opacity = isActive ? 0.7 : 0.4;
  const size = isActive ? 0.1 : 0.07;

  // Colorful flares
  const flareColors = ['#ff66cc', '#66ffee', '#ffcc44', '#cc66ff'];
  
  return (
    <group ref={flaresRef}>
      {flarePositions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <planeGeometry args={[size, size]} />
            <meshBasicMaterial
              color={flareColors[i]}
              transparent
              opacity={opacity}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <pointLight color={flareColors[i]} intensity={isActive ? 0.8 : 0.4} distance={2} decay={2} />
        </group>
      ))}
    </group>
  );
}

// Glass crystal shell with refractive edges - ALWAYS VISIBLE
function CrystalShell({ volume, isActive }: { volume: number; isActive: boolean }) {
  const shellRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const innerEdgesRef = useRef<THREE.LineSegments>(null);
  
  useFrame((state) => {
    const speed = isActive ? 0.08 : 0.03;
    const rotation = state.clock.elapsedTime * speed;
    const tilt = Math.sin(state.clock.elapsedTime * 0.15) * 0.1;
    
    if (shellRef.current) {
      shellRef.current.rotation.y = rotation;
      shellRef.current.rotation.x = tilt;
    }
    if (edgesRef.current) {
      edgesRef.current.rotation.y = rotation;
      edgesRef.current.rotation.x = tilt;
    }
    if (innerEdgesRef.current) {
      innerEdgesRef.current.rotation.y = rotation;
      innerEdgesRef.current.rotation.x = tilt;
    }
  });

  // Dodecahedron sized to match core (core is ~0.3-0.55 radius)
  const geometry = useMemo(() => new THREE.DodecahedronGeometry(0.5, 0), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  const edgeOpacity = isActive ? 0.8 + volume * 0.2 : 0.5;
  const innerEdgeOpacity = isActive ? 0.4 : 0.2;

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
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Bright glowing edges */}
      <lineSegments ref={edgesRef} geometry={edgesGeometry}>
        <lineBasicMaterial 
          color={isActive ? "#aaeeff" : "#6699aa"} 
          transparent 
          opacity={edgeOpacity}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      
      {/* Inner edge glow for thickness effect */}
      <lineSegments ref={innerEdgesRef} geometry={edgesGeometry} scale={0.97}>
        <lineBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={innerEdgeOpacity}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

// Ambient particle dust - ALWAYS VISIBLE
function AmbientDust({ volume, isActive }: { volume: number; isActive: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Particles scaled to fit around smaller orb
  const positions = useMemo(() => {
    const count = 300;
    const pos = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.15 + Math.random() * 0.5;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      const speed = isActive ? 0.002 : 0.0008;
      pointsRef.current.rotation.y += speed;
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
        size={isActive ? 0.012 + volume * 0.005 : 0.008}
        transparent
        opacity={isActive ? 0.8 : 0.5}
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
      <ambientLight intensity={0.2} />
      
      {/* Core lighting - always visible */}
      <GoldenCore volume={volume} isActive={isActive} />
      
      {/* Energy ribbon system - always visible */}
      <EnergyRibbons volume={volume} isActive={isActive} />
      
      {/* Glowing points at crystal vertices - always visible */}
      <VertexGlowPoints isActive={isActive} />
      
      {/* Lens flare effects - always visible */}
      <CrystalFlares isActive={isActive} />
      
      {/* Ambient particles - always visible */}
      <AmbientDust volume={volume} isActive={isActive} />
      
      {/* Crystal shell - rendered last, always visible */}
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
          toneMappingExposure: 1.4,
        }}
      >
        <OrbScene 
          isConnected={isConnected}
          isSpeaking={isSpeaking}
          inputVolume={inputVolume}
          outputVolume={outputVolume}
        />
      </Canvas>
    </div>
  );
}
