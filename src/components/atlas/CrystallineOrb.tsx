// Crystalline Energy Orb - Advanced 3D visualization for Atlas
// Matching reference: Brilliant white core, blue tendrils, amber rings, glass crystal shell

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

// Brilliant Plasma Core - The bright white/warm center
function PlasmaCore({ volume, isActive }: { volume: number; isActive: boolean }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const innerGlowRef = useRef<THREE.Mesh>(null);
  const midGlowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(time * 3) * 0.1;
    const volumeBoost = 1 + volume * 0.5;
    
    if (coreRef.current) {
      coreRef.current.scale.setScalar(pulse * volumeBoost * 0.4);
    }
    if (innerGlowRef.current) {
      innerGlowRef.current.scale.setScalar(pulse * volumeBoost * 0.7);
    }
    if (midGlowRef.current) {
      const midPulse = 1 + Math.sin(time * 2) * 0.15;
      midGlowRef.current.scale.setScalar(midPulse * volumeBoost * 1.0);
    }
    if (outerGlowRef.current) {
      const outerPulse = 1 + Math.sin(time * 1.5) * 0.1;
      outerGlowRef.current.scale.setScalar(outerPulse * volumeBoost * 1.4);
    }
  });

  const baseIntensity = isActive ? 1 : 0.4;

  return (
    <group>
      {/* Outermost warm glow */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ffaa44"
          transparent
          opacity={0.15 * baseIntensity}
          depthWrite={false}
        />
      </mesh>
      
      {/* Mid glow - warm white */}
      <mesh ref={midGlowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#fff5e6"
          transparent
          opacity={0.4 * baseIntensity}
          depthWrite={false}
        />
      </mesh>
      
      {/* Inner glow - bright white */}
      <mesh ref={innerGlowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.7 * baseIntensity}
          depthWrite={false}
        />
      </mesh>
      
      {/* Core - pure white */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Primary light source */}
      <pointLight 
        color="#fff8e8" 
        intensity={isActive ? 4 + volume * 3 : 1.5} 
        distance={8} 
        decay={2} 
      />
    </group>
  );
}

// Electric Blue Tendrils - Energy arcs from core
function EnergyTendrils({ volume, isActive }: { volume: number; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  const tendrilCount = 16;
  const tendrils = useMemo(() => {
    return Array.from({ length: tendrilCount }, (_, i) => ({
      id: i,
      theta: (i / tendrilCount) * Math.PI * 2,
      phi: (Math.random() - 0.5) * Math.PI * 0.8,
      length: 0.6 + Math.random() * 0.4,
      speed: 0.5 + Math.random() * 0.5,
      segments: 15 + Math.floor(Math.random() * 10),
    }));
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  if (!isActive) return null;

  return (
    <group ref={groupRef}>
      {tendrils.map((tendril) => (
        <TendrilArc key={tendril.id} tendril={tendril} volume={volume} />
      ))}
    </group>
  );
}

function TendrilArc({ tendril, volume }: { 
  tendril: { theta: number; phi: number; length: number; speed: number; segments: number }; 
  volume: number 
}) {
  const lineRef = useRef<THREE.Line>(null!);
  
  useFrame((state) => {
    if (lineRef.current) {
      const time = state.clock.elapsedTime;
      const positions = lineRef.current.geometry.attributes.position;
      const baseLength = tendril.length * (1 + volume * 0.6);
      
      for (let i = 0; i < tendril.segments; i++) {
        const t = i / (tendril.segments - 1);
        const r = 0.4 + t * baseLength * 1.5;
        
        // Add electrical jitter
        const jitterX = Math.sin(time * 10 + i * 0.5) * 0.05 * t;
        const jitterY = Math.cos(time * 12 + i * 0.7) * 0.05 * t;
        const jitterZ = Math.sin(time * 8 + i * 0.3) * 0.05 * t;
        
        const x = r * Math.sin(tendril.theta) * Math.cos(tendril.phi) + jitterX;
        const y = r * Math.sin(tendril.phi) + jitterY;
        const z = r * Math.cos(tendril.theta) * Math.cos(tendril.phi) + jitterZ;
        
        positions.setXYZ(i, x, y, z);
      }
      positions.needsUpdate = true;
    }
  });

  const geometry = useMemo(() => {
    const points = [];
    for (let i = 0; i < tendril.segments; i++) {
      points.push(new THREE.Vector3(0, 0, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [tendril.segments]);

  const material = useMemo(() => new THREE.LineBasicMaterial({ 
    color: '#60d5ff', 
    transparent: true, 
    opacity: 0.6 + volume * 0.4
  }), [volume]);

  return (
    <primitive 
      object={new THREE.Line(geometry, material)} 
      ref={lineRef} 
    />
  );
}

// Amber/Orange Orbital Rings
function OrbitalRings({ volume, isActive }: { volume: number; isActive: boolean }) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = Math.PI / 2 + Math.sin(time * 0.5) * 0.3;
      ring1Ref.current.rotation.z = time * 0.4;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = Math.PI / 3 + Math.cos(time * 0.4) * 0.4;
      ring2Ref.current.rotation.z = -time * 0.35;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = Math.PI / 4;
      ring3Ref.current.rotation.y = time * 0.25;
    }
  });

  const ringOpacity = isActive ? 0.7 + volume * 0.3 : 0.3;

  return (
    <group>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.0, 0.02, 16, 80]} />
        <meshBasicMaterial color="#ff9f43" transparent opacity={ringOpacity} />
      </mesh>
      
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.2, 0.015, 16, 80]} />
        <meshBasicMaterial color="#ffb366" transparent opacity={ringOpacity * 0.8} />
      </mesh>
      
      <mesh ref={ring3Ref}>
        <torusGeometry args={[1.4, 0.01, 16, 80]} />
        <meshBasicMaterial color="#60d5ff" transparent opacity={ringOpacity * 0.6} />
      </mesh>
    </group>
  );
}

// Crystal Shell - Glass-like faceted exterior with visible edges
function CrystalShell({ volume, isActive }: { volume: number; isActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
    if (edgesRef.current) {
      edgesRef.current.rotation.y = meshRef.current?.rotation.y || 0;
      edgesRef.current.rotation.x = meshRef.current?.rotation.x || 0;
    }
  });

  const geometry = useMemo(() => new THREE.DodecahedronGeometry(2, 0), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  return (
    <group>
      {/* Glass material */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.1}
          roughness={0.05}
          transmission={0.95}
          thickness={0.5}
          envMapIntensity={1.5}
          clearcoat={1}
          clearcoatRoughness={0.05}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Visible crystal edges */}
      <lineSegments ref={edgesRef} geometry={edgesGeometry}>
        <lineBasicMaterial 
          color={isActive ? "#88ccff" : "#667788"} 
          transparent 
          opacity={isActive ? 0.5 + volume * 0.3 : 0.25}
        />
      </lineSegments>
    </group>
  );
}

// Sparkle Particles
function SparkleParticles({ volume, isActive }: { volume: number; isActive: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const count = 400;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.5 + Math.random() * 1.8;
      
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
        color={isActive ? '#ffffff' : '#aabbcc'}
        size={isActive ? 0.03 + volume * 0.02 : 0.02}
        transparent
        opacity={isActive ? 0.8 : 0.4}
        sizeAttenuation
        depthWrite={false}
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
      {/* Ambient light for crystal reflections */}
      <ambientLight intensity={0.3} />
      
      {/* Key lights */}
      <pointLight position={[3, 3, 3]} intensity={0.4} color="#88ccff" />
      <pointLight position={[-3, -3, -3]} intensity={0.3} color="#ffaa66" />
      
      {/* Render order: core first (brightest), then effects, shell last */}
      <PlasmaCore volume={volume} isActive={isActive} />
      <EnergyTendrils volume={volume} isActive={isActive} />
      <OrbitalRings volume={volume} isActive={isActive} />
      <SparkleParticles volume={volume} isActive={isActive} />
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
        camera={{ position: [0, 0, 4.5], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
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
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-center bg-background/60 px-3 py-1.5 rounded-full backdrop-blur-sm border border-border/30">
            Tap to Activate
          </span>
        </div>
      )}
      
      {isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-mono text-primary uppercase tracking-widest animate-pulse text-center bg-background/60 px-3 py-1.5 rounded-full backdrop-blur-sm border border-primary/30">
            Connecting...
          </span>
        </div>
      )}
    </div>
  );
}
