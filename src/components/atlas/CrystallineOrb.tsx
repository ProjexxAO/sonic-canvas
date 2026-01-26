// Crystalline Energy Orb - Advanced 3D visualization for Atlas
// Features: Faceted crystal shell, plasma core, energy tendrils

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

// Crystal Shell - Faceted dodecahedron outer layer
function CrystalShell({ volume, isActive }: { volume: number; isActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <dodecahedronGeometry args={[2.2, 0]} />
      <meshPhysicalMaterial
        color="#1a1a2e"
        metalness={0.1}
        roughness={0.05}
        transmission={0.85}
        thickness={0.5}
        envMapIntensity={1}
        clearcoat={1}
        clearcoatRoughness={0.1}
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Inner crystal facets
function InnerFacets({ volume }: { volume: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y -= 0.003;
      meshRef.current.rotation.z += 0.002;
      const scale = 1 + volume * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.6, 0]} />
      <meshPhysicalMaterial
        color="#0d0d1a"
        metalness={0.2}
        roughness={0.1}
        transmission={0.7}
        thickness={0.3}
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Plasma Core - Glowing center
function PlasmaCore({ volume, isActive }: { volume: number; isActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
      const volumeScale = 1 + volume * 0.3;
      meshRef.current.scale.setScalar(pulse * volumeScale);
    }
    if (glowRef.current) {
      const glowPulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      glowRef.current.scale.setScalar(glowPulse * (1 + volume * 0.2));
    }
  });

  const coreColor = isActive ? '#fffaf0' : '#e8e0d5';
  const glowIntensity = isActive ? 2 + volume * 3 : 0.8;

  return (
    <group>
      {/* Core glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial
          color={coreColor}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Bright center */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Point light for illumination */}
      <pointLight color={coreColor} intensity={glowIntensity} distance={5} />
    </group>
  );
}

// Energy Tendrils - Electric arcs from core
function EnergyTendrils({ volume, isActive }: { volume: number; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  const tendrilData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      theta: (i / 12) * Math.PI * 2,
      phi: (Math.random() - 0.5) * Math.PI,
      speed: 0.5 + Math.random() * 0.5,
      length: 0.8 + Math.random() * 0.4,
    }));
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  if (!isActive) return null;

  return (
    <group ref={groupRef}>
      {tendrilData.map((tendril) => (
        <TendrilLine 
          key={tendril.id} 
          tendril={tendril} 
          volume={volume}
        />
      ))}
    </group>
  );
}

function TendrilLine({ tendril, volume }: { tendril: { theta: number; phi: number; speed: number; length: number }; volume: number }) {
  const lineRef = useRef<THREE.Line>(null!);
  
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 20;
    const baseLength = tendril.length * (1 + volume * 0.5);
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const r = 0.5 + t * baseLength;
      const wobble = Math.sin(t * Math.PI * 4) * 0.1 * (1 - t);
      const x = r * Math.sin(tendril.theta + wobble) * Math.cos(tendril.phi);
      const y = r * Math.sin(tendril.phi + wobble);
      const z = r * Math.cos(tendril.theta + wobble) * Math.cos(tendril.phi);
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, [tendril, volume]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  useFrame((state) => {
    if (lineRef.current) {
      lineRef.current.rotation.x = Math.sin(state.clock.elapsedTime * tendril.speed) * 0.2;
    }
  });

  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#60d5ff', transparent: true, opacity: 0.7 + volume * 0.3 }))} ref={lineRef} />
  );
}

// Orbital Rings - Amber energy rings
function OrbitalRings({ volume, isActive }: { volume: number; isActive: boolean }) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = Math.sin(time * 0.5) * 0.3 + 0.5;
      ring1Ref.current.rotation.z = time * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = Math.cos(time * 0.4) * 0.4 - 0.3;
      ring2Ref.current.rotation.z = -time * 0.25;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = time * 0.2;
      ring3Ref.current.rotation.x = Math.sin(time * 0.3) * 0.2;
    }
  });

  const ringOpacity = isActive ? 0.6 + volume * 0.4 : 0.2;

  return (
    <group>
      {/* Primary amber ring */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.3, 0.015, 16, 100]} />
        <meshBasicMaterial color="#ff9f43" transparent opacity={ringOpacity} />
      </mesh>
      
      {/* Secondary ring */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.5, 0.01, 16, 100]} />
        <meshBasicMaterial color="#ffc048" transparent opacity={ringOpacity * 0.7} />
      </mesh>
      
      {/* Tertiary cyan ring */}
      <mesh ref={ring3Ref}>
        <torusGeometry args={[1.7, 0.008, 16, 100]} />
        <meshBasicMaterial color="#60d5ff" transparent opacity={ringOpacity * 0.5} />
      </mesh>
    </group>
  );
}

// Particle Field - Ambient energy particles
function ParticleField({ volume, isActive }: { volume: number; isActive: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1 + Math.random() * 1.2;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    
    return positions;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(particles, 3));
    return geo;
  }, [particles]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={isActive ? '#60d5ff' : '#4a5568'}
        size={0.02}
        transparent
        opacity={isActive ? 0.6 + volume * 0.4 : 0.3}
        sizeAttenuation
      />
    </points>
  );
}

// Main 3D Scene
function OrbScene({ isConnected, isSpeaking, inputVolume, outputVolume }: { isConnected: boolean; isSpeaking: boolean; inputVolume: number; outputVolume: number }) {
  const volume = isSpeaking ? outputVolume : inputVolume;
  const isActive = isConnected;

  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[5, 5, 5]} intensity={0.3} color="#60d5ff" />
      <pointLight position={[-5, -5, -5]} intensity={0.2} color="#ff9f43" />
      
      <CrystalShell volume={volume} isActive={isActive} />
      <InnerFacets volume={volume} />
      <PlasmaCore volume={volume} isActive={isActive} />
      <EnergyTendrils volume={volume} isActive={isActive} />
      <OrbitalRings volume={volume} isActive={isActive} />
      <ParticleField volume={volume} isActive={isActive} />
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
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <OrbScene 
          isConnected={isConnected}
          isSpeaking={isSpeaking}
          inputVolume={inputVolume}
          outputVolume={outputVolume}
        />
      </Canvas>
      
      {/* Overlay text for inactive state */}
      {!isConnected && !isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-center bg-background/50 px-3 py-1 rounded-full backdrop-blur-sm">
            Tap to Activate
          </span>
        </div>
      )}
      
      {isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-mono text-primary uppercase tracking-widest animate-pulse text-center bg-background/50 px-3 py-1 rounded-full backdrop-blur-sm">
            Connecting...
          </span>
        </div>
      )}
    </div>
  );
}
