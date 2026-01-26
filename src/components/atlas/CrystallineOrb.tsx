// Crystalline Energy Orb - Advanced 3D visualization for Atlas
// Reference: Brilliant white core with intense bloom, blue tendrils, amber rings, glass crystal

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

// Brilliant Plasma Core - VERY bright with multiple bloom layers
function PlasmaCore({ volume, isActive }: { volume: number; isActive: boolean }) {
  const layers = useRef<THREE.Mesh[]>([]);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const volumeBoost = 1 + volume * 0.4;
    
    layers.current.forEach((mesh, i) => {
      if (mesh) {
        const layerPulse = 1 + Math.sin(time * (3 - i * 0.3)) * (0.08 + i * 0.02);
        const baseScale = [0.25, 0.45, 0.7, 1.0, 1.4, 1.8][i] || 1;
        mesh.scale.setScalar(layerPulse * volumeBoost * baseScale);
      }
    });
  });

  const baseIntensity = isActive ? 1 : 0.3;
  
  // Layer configs: [size, color, opacity]
  const glowLayers = [
    { color: '#ffffff', opacity: 1.0 },      // Pure white core
    { color: '#fffef8', opacity: 0.95 },     // Near white
    { color: '#fff8e0', opacity: 0.8 },      // Warm white
    { color: '#ffe4aa', opacity: 0.5 },      // Golden glow
    { color: '#ffcc66', opacity: 0.25 },     // Amber outer
    { color: '#ff9944', opacity: 0.12 },     // Warm atmosphere
  ];

  return (
    <group>
      {glowLayers.map((layer, i) => (
        <mesh 
          key={i} 
          ref={(el) => { if (el) layers.current[i] = el; }}
        >
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color={layer.color}
            transparent
            opacity={layer.opacity * baseIntensity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      
      {/* Intense point lights */}
      <pointLight 
        color="#ffffff" 
        intensity={isActive ? 6 + volume * 4 : 2} 
        distance={10} 
        decay={2} 
      />
      <pointLight 
        color="#ffaa44" 
        intensity={isActive ? 3 + volume * 2 : 1} 
        distance={8} 
        decay={2} 
      />
    </group>
  );
}

// Electric Blue Tendrils - More chaotic, branching energy arcs
function EnergyTendrils({ volume, isActive }: { volume: number; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.Line[]>([]);
  
  const tendrilCount = 24;
  const segmentsPerTendril = 20;
  
  const tendrils = useMemo(() => {
    return Array.from({ length: tendrilCount }, (_, i) => ({
      theta: (i / tendrilCount) * Math.PI * 2 + Math.random() * 0.3,
      phi: (Math.random() - 0.5) * Math.PI * 0.9,
      length: 0.8 + Math.random() * 0.6,
      speed: 8 + Math.random() * 4,
      phaseOffset: Math.random() * Math.PI * 2,
    }));
  }, []);

  const geometries = useMemo(() => {
    return tendrils.map(() => {
      const points = Array.from({ length: segmentsPerTendril }, () => new THREE.Vector3(0, 0, 0));
      return new THREE.BufferGeometry().setFromPoints(points);
    });
  }, [tendrils]);

  useFrame((state) => {
    if (!isActive) return;
    
    const time = state.clock.elapsedTime;
    
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
    
    linesRef.current.forEach((line, idx) => {
      if (!line) return;
      
      const tendril = tendrils[idx];
      const positions = line.geometry.attributes.position;
      const baseLength = tendril.length * (1 + volume * 0.5);
      
      for (let i = 0; i < segmentsPerTendril; i++) {
        const t = i / (segmentsPerTendril - 1);
        const r = 0.35 + t * baseLength * 1.8;
        
        // Chaotic electrical jitter - increases toward the end
        const jitter = t * t * 0.15;
        const jitterX = Math.sin(time * tendril.speed + i * 0.8 + tendril.phaseOffset) * jitter;
        const jitterY = Math.cos(time * (tendril.speed + 2) + i * 0.6) * jitter;
        const jitterZ = Math.sin(time * (tendril.speed - 1) + i * 1.1) * jitter;
        
        // Branch deviation
        const branchWobble = Math.sin(t * Math.PI * 2 + time * 2) * 0.1 * t;
        
        const x = r * Math.sin(tendril.theta + branchWobble) * Math.cos(tendril.phi) + jitterX;
        const y = r * Math.sin(tendril.phi + branchWobble * 0.5) + jitterY;
        const z = r * Math.cos(tendril.theta + branchWobble) * Math.cos(tendril.phi) + jitterZ;
        
        positions.setXYZ(i, x, y, z);
      }
      positions.needsUpdate = true;
    });
  });

  if (!isActive) return null;

  return (
    <group ref={groupRef}>
      {geometries.map((geometry, i) => (
        <primitive
          key={i}
          ref={(el: THREE.Line) => { if (el) linesRef.current[i] = el; }}
          object={new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({
              color: '#60d5ff',
              transparent: true,
              opacity: 0.7 + volume * 0.3,
              blending: THREE.AdditiveBlending,
            })
          )}
        />
      ))}
    </group>
  );
}

// Amber/Orange Orbital Rings - More visible, glowing
function OrbitalRings({ volume, isActive }: { volume: number; isActive: boolean }) {
  const ringsRef = useRef<THREE.Mesh[]>([]);
  
  const ringConfigs = [
    { radius: 0.9, tube: 0.025, color: '#ff9f43', rotSpeed: 0.5, tiltX: Math.PI / 2 },
    { radius: 1.1, tube: 0.02, color: '#ffb366', rotSpeed: -0.4, tiltX: Math.PI / 3 },
    { radius: 1.3, tube: 0.018, color: '#ffcc88', rotSpeed: 0.35, tiltX: Math.PI / 4 },
    { radius: 1.0, tube: 0.015, color: '#60d5ff', rotSpeed: -0.3, tiltX: Math.PI / 2.5 },
  ];
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    ringsRef.current.forEach((ring, i) => {
      if (ring) {
        const config = ringConfigs[i];
        ring.rotation.x = config.tiltX + Math.sin(time * 0.3 + i) * 0.2;
        ring.rotation.z = time * config.rotSpeed;
      }
    });
  });

  const ringOpacity = isActive ? 0.8 + volume * 0.2 : 0.3;

  return (
    <group>
      {ringConfigs.map((config, i) => (
        <mesh 
          key={i} 
          ref={(el) => { if (el) ringsRef.current[i] = el; }}
        >
          <torusGeometry args={[config.radius, config.tube, 16, 100]} />
          <meshBasicMaterial 
            color={config.color} 
            transparent 
            opacity={ringOpacity * (1 - i * 0.15)}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

// Crystal Shell - More transparent with visible reflective edges
function CrystalShell({ volume, isActive }: { volume: number; isActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  
  useFrame((state) => {
    const rotation = state.clock.elapsedTime * 0.15;
    if (meshRef.current) {
      meshRef.current.rotation.y = rotation;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.08;
    }
    if (edgesRef.current) {
      edgesRef.current.rotation.y = rotation;
      edgesRef.current.rotation.x = meshRef.current?.rotation.x || 0;
    }
  });

  const geometry = useMemo(() => new THREE.DodecahedronGeometry(2.2, 0), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  return (
    <group>
      {/* Ultra-transparent glass */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshPhysicalMaterial
          color="#aaccff"
          metalness={0.0}
          roughness={0.02}
          transmission={0.98}
          thickness={0.2}
          envMapIntensity={0.5}
          clearcoat={1}
          clearcoatRoughness={0.02}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Glowing crystal edges */}
      <lineSegments ref={edgesRef} geometry={edgesGeometry}>
        <lineBasicMaterial 
          color={isActive ? "#aaddff" : "#778899"} 
          transparent 
          opacity={isActive ? 0.6 + volume * 0.3 : 0.2}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

// Dense Sparkle Particles
function SparkleParticles({ volume, isActive }: { volume: number; isActive: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const [positions, sizes] = useMemo(() => {
    const count = 600;
    const pos = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.4 + Math.random() * 2.0;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      
      siz[i] = 0.5 + Math.random() * 1.5;
    }
    
    return [pos, siz];
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0008;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.08;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [positions, sizes]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={isActive ? '#ffffff' : '#aabbcc'}
        size={isActive ? 0.035 + volume * 0.015 : 0.02}
        transparent
        opacity={isActive ? 0.9 : 0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Inner energy field - swirling particles near core
function InnerEnergyField({ volume, isActive }: { volume: number; isActive: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const count = 200;
    const pos = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.3 + Math.random() * 0.5;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.01;
      pointsRef.current.rotation.x += 0.005;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  if (!isActive) return null;

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#ffffee"
        size={0.05 + volume * 0.03}
        transparent
        opacity={0.8}
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
      {/* Minimal ambient - let the core light everything */}
      <ambientLight intensity={0.1} />
      
      {/* Render order: bright core first, effects, then shell last */}
      <PlasmaCore volume={volume} isActive={isActive} />
      <InnerEnergyField volume={volume} isActive={isActive} />
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
        gl={{ 
          alpha: true, 
          antialias: true, 
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
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
