// Crystalline Energy Orb - Advanced 3D visualization for Atlas
// Reference: Glass dodecahedron with intertwining cyan/magenta/gold energy tubes

import { useRef, useMemo, useEffect, useState } from 'react';
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

// Hook to detect dark/light theme
function useTheme() {
  const [isDark, setIsDark] = useState(true);
  
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);
  
  return isDark;
}

// Multiple colorful orbital rings that pulse and breathe
function OrbitalRings({ volume, isActive, isSpeaking, isDark }: { volume: number; isActive: boolean; isSpeaking: boolean; isDark: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRefs = useRef<THREE.Mesh[]>([]);
  
  // Define multiple ring configurations with different colors and orientations
  const ringConfigs = useMemo(() => [
    // Horizontal rings
    { color: '#ff00ff', radius: 0.65, width: 0.03, rotX: Math.PI / 2, rotY: 0, speed: 0.5 },
    { color: '#00ffff', radius: 0.75, width: 0.025, rotX: Math.PI / 2, rotY: 0, speed: -0.3 },
    { color: '#ffaa00', radius: 0.85, width: 0.02, rotX: Math.PI / 2, rotY: 0, speed: 0.4 },
    // Tilted rings
    { color: '#ff66cc', radius: 0.7, width: 0.025, rotX: Math.PI / 3, rotY: Math.PI / 4, speed: 0.6 },
    { color: '#66ffcc', radius: 0.8, width: 0.02, rotX: Math.PI / 2.5, rotY: -Math.PI / 3, speed: -0.5 },
    { color: '#ffcc66', radius: 0.9, width: 0.018, rotX: Math.PI / 4, rotY: Math.PI / 6, speed: 0.35 },
    // Vertical rings
    { color: '#cc66ff', radius: 0.72, width: 0.022, rotX: 0, rotY: Math.PI / 2, speed: -0.4 },
    { color: '#66ccff', radius: 0.82, width: 0.018, rotX: Math.PI / 6, rotY: 0, speed: 0.45 },
  ], []);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    ringRefs.current.forEach((ring, i) => {
      if (ring) {
        const config = ringConfigs[i];
        // Subtle breathing effect - same for both states
        const breathe = 1 + Math.sin(time * 1.5 + i * 0.5) * 0.05;
        // Voice reactivity only when speaking
        const voiceBoost = isSpeaking ? 1 + volume * 0.2 : 1;
        ring.scale.setScalar(breathe * voiceBoost);
        
        // Rotate rings - same speed for both states
        ring.rotation.z += config.speed * 0.008;
        
        // Pulsing opacity - voice reactive when speaking
        const material = ring.material as THREE.MeshBasicMaterial;
        const baseOpacity = isDark ? 0.5 : 0.75;
        const pulse = 0.15 * Math.sin(time * 2 + i);
        const voiceOpacity = isSpeaking ? volume * 0.4 : 0;
        material.opacity = baseOpacity + pulse + voiceOpacity;
      }
    });
    
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      {ringConfigs.map((config, i) => (
        <mesh 
          key={i} 
          ref={(el) => { if (el) ringRefs.current[i] = el; }}
          rotation={[config.rotX, config.rotY, 0]}
        >
          <torusGeometry args={[config.radius, config.width, 16, 100]} />
          <meshBasicMaterial
            color={config.color}
            transparent
            opacity={isDark ? 0.5 : 0.75}
            blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// Expanding sound wave rings - only visible when speaking
function SoundWaves({ volume, isActive, isSpeaking, isDark }: { volume: number; isActive: boolean; isSpeaking: boolean; isDark: boolean }) {
  const wavesRef = useRef<THREE.Mesh[]>([]);
  const waveCount = 6;
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    wavesRef.current.forEach((wave, i) => {
      if (wave) {
        // Staggered expansion
        const phase = (time * 1.5 + i * 0.5) % 3;
        const expandProgress = phase / 3;
        
        // Scale from center outward
        const baseScale = 0.3 + expandProgress * 1.0;
        const volumeBoost = isSpeaking ? volume * 0.5 : 0;
        wave.scale.setScalar(baseScale + volumeBoost);
        
        // Only visible when speaking
        const material = wave.material as THREE.MeshBasicMaterial;
        const fadeOut = Math.max(0, 1 - expandProgress * 1.2);
        material.opacity = isSpeaking ? fadeOut * (isDark ? 0.4 : 0.6) * (0.5 + volume) : 0;
      }
    });
  });

  const waveColors = ['#ff00ff', '#00ffff', '#ffaa00', '#ff66cc', '#66ffcc', '#cc66ff'];

  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {Array.from({ length: waveCount }).map((_, i) => (
        <mesh 
          key={i} 
          ref={(el) => { if (el) wavesRef.current[i] = el; }}
        >
          <ringGeometry args={[0.48, 0.52, 64]} />
          <meshBasicMaterial
            color={waveColors[i % waveColors.length]}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// Living, breathing plasma core - same appearance, voice reactive when speaking
function LivingCore({ volume, isActive, isSpeaking, isDark }: { volume: number; isActive: boolean; isSpeaking: boolean; isDark: boolean }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const innerGlowRef = useRef<THREE.Mesh>(null);
  const midGlowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const plasmaRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Organic breathing pattern - same for both states
    const breathe1 = Math.sin(time * 1.2) * 0.08;
    const breathe2 = Math.sin(time * 2.3) * 0.04;
    const basePulse = 1 + breathe1 + breathe2;
    
    // Voice reactivity only when speaking
    const voiceReaction = isSpeaking ? volume * 0.6 : 0;
    const pulse = basePulse + voiceReaction;
    
    if (coreRef.current) {
      coreRef.current.scale.setScalar(0.25 * pulse);
      coreRef.current.rotation.y = time * 0.2;
    }
    if (innerGlowRef.current) {
      innerGlowRef.current.scale.setScalar(0.35 * pulse);
      innerGlowRef.current.rotation.y = -time * 0.15;
    }
    if (midGlowRef.current) {
      midGlowRef.current.scale.setScalar(0.5 * pulse);
    }
    if (outerGlowRef.current) {
      outerGlowRef.current.scale.setScalar(0.7 * pulse);
    }
    if (plasmaRef.current) {
      plasmaRef.current.scale.setScalar(0.42 * pulse);
      plasmaRef.current.rotation.x = time * 0.3;
      plasmaRef.current.rotation.z = time * 0.2;
    }
  });

  // Light mode needs higher opacity and different blending
  const speakingBoost = isSpeaking ? 1 + volume * 0.5 : 1;
  const baseMultiplier = isDark ? 1 : 1.8;

  return (
    <group>
      {/* Outermost atmospheric glow - deep magenta */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color={isDark ? "#ff00aa" : "#cc0088"}
          transparent
          opacity={(isDark ? 0.2 : 0.5) * speakingBoost * baseMultiplier}
          depthWrite={false}
          blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
        />
      </mesh>
      
      {/* Mid glow - electric cyan */}
      <mesh ref={midGlowRef}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color={isDark ? "#00ffff" : "#00cccc"}
          transparent
          opacity={(isDark ? 0.35 : 0.6) * speakingBoost * baseMultiplier}
          depthWrite={false}
          blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
        />
      </mesh>
      
      {/* Plasma swirl layer */}
      <mesh ref={plasmaRef}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial
          color={isDark ? "#ff66ff" : "#cc44cc"}
          transparent
          opacity={(isDark ? 0.4 : 0.7) * speakingBoost * baseMultiplier}
          depthWrite={false}
          blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
          wireframe
        />
      </mesh>
      
      {/* Inner glow - hot orange/gold */}
      <mesh ref={innerGlowRef}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color={isDark ? "#ffaa00" : "#ff8800"}
          transparent
          opacity={(isDark ? 0.6 : 0.85) * speakingBoost * baseMultiplier}
          depthWrite={false}
          blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
        />
      </mesh>
      
      {/* Hot white core center */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.95}
          blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
        />
      </mesh>
      
      {/* Dynamic lighting - intensifies when speaking */}
      <pointLight 
        color="#ff00ff" 
        intensity={isSpeaking ? 4 + volume * 5 : (isDark ? 3 : 5)} 
        distance={8} 
        decay={2} 
      />
      <pointLight 
        color="#00ffff" 
        intensity={isSpeaking ? 3 + volume * 4 : (isDark ? 2.5 : 4)} 
        distance={9} 
        decay={2} 
      />
      <pointLight 
        color="#ffaa00" 
        intensity={isSpeaking ? 2.5 + volume * 3 : (isDark ? 2 : 3.5)} 
        distance={7} 
        decay={2} 
      />
    </group>
  );
}

// Energy particles orbiting the core - voice reactive
function EnergyParticles({ volume, isActive, isSpeaking, isDark }: { volume: number; isActive: boolean; isSpeaking: boolean; isDark: boolean }) {
  const particlesRef = useRef<THREE.Points>(null);
  
  const { positions, colors } = useMemo(() => {
    const count = 400;
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    
    const colorPalette = [
      [1, 0, 1],      // magenta
      [0, 1, 1],      // cyan
      [1, 0.7, 0],    // orange
      [1, 0.4, 0.8],  // pink
      [0.4, 1, 0.8],  // mint
      [0.8, 0.4, 1],  // purple
    ];
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.3 + Math.random() * 0.35;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      cols[i * 3] = color[0];
      cols[i * 3 + 1] = color[1];
      cols[i * 3 + 2] = color[2];
    }
    
    return { positions: pos, colors: cols };
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.004;
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
      
      // Voice reactive scale
      const voiceScale = isSpeaking ? 1 + volume * 0.25 : 1;
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
      particlesRef.current.scale.setScalar(breathe * voiceScale);
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        size={isDark ? 0.018 : 0.022}
        transparent
        opacity={isSpeaking ? (isDark ? 0.8 : 0.95) + volume * 0.2 : (isDark ? 0.6 : 0.85)}
        vertexColors
        sizeAttenuation
        depthWrite={false}
        blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </points>
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
  volume,
  isSpeaking,
  isDark
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
  isSpeaking: boolean;
  isDark: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      meshRef.current.rotation.x = time * rotationSpeedX * 0.5 + phaseOffset;
      meshRef.current.rotation.y = time * rotationSpeedY * 0.5 + phaseOffset * 0.7;
      meshRef.current.rotation.z = Math.sin(time * 0.3 + phaseOffset) * 0.3;
      
      // Voice reactive scale
      const volumeScale = isSpeaking ? 1 + volume * 0.2 : 1;
      meshRef.current.scale.setScalar(scale * volumeScale);
    }
  });
  
  // Voice reactive opacity - boosted for light mode
  const opacity = isSpeaking ? (isDark ? 0.7 : 0.85) + volume * 0.2 : (isDark ? 0.6 : 0.8);

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[0.6, tubeRadius, 128, 16, p, q]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </mesh>
  );
}

// Intertwining energy ribbons system
function EnergyRibbons({ volume, isSpeaking, isDark }: { volume: number; isSpeaking: boolean; isDark: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  const ribbonConfigs = useMemo(() => [
    { color: '#00ffff', scale: 0.22, tubeRadius: 0.012, p: 2, q: 3, rotX: 0.1, rotY: 0.15, phase: 0 },
    { color: '#40e0d0', scale: 0.20, tubeRadius: 0.010, p: 3, q: 2, rotX: -0.12, rotY: 0.1, phase: Math.PI / 3 },
    { color: '#00ced1', scale: 0.24, tubeRadius: 0.009, p: 2, q: 5, rotX: 0.08, rotY: -0.13, phase: Math.PI * 2 / 3 },
    { color: '#ff00ff', scale: 0.21, tubeRadius: 0.011, p: 3, q: 4, rotX: -0.09, rotY: 0.14, phase: Math.PI / 4 },
    { color: '#da70d6', scale: 0.19, tubeRadius: 0.010, p: 2, q: 3, rotX: 0.11, rotY: -0.08, phase: Math.PI / 2 },
    { color: '#ffd700', scale: 0.20, tubeRadius: 0.011, p: 3, q: 5, rotX: -0.07, rotY: 0.12, phase: Math.PI * 5 / 6 },
    { color: '#ffaa00', scale: 0.23, tubeRadius: 0.009, p: 2, q: 3, rotX: 0.13, rotY: -0.11, phase: Math.PI },
  ], []);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
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
          isSpeaking={isSpeaking}
          isDark={isDark}
        />
      ))}
    </group>
  );
}

// Glowing vertex points on the crystal
function VertexGlowPoints({ isSpeaking, volume, isDark }: { isSpeaking: boolean; volume: number; isDark: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  const positions = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(0.5, 0);
    const posArray = geo.attributes.position.array as Float32Array;
    
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
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  const colors = ['#00ffff', '#ff44cc', '#44ff88', '#ffaa44'];
  const size = isSpeaking ? 0.03 + volume * 0.015 : (isDark ? 0.028 : 0.035);
  const opacity = isSpeaking ? (isDark ? 0.7 : 0.9) + volume * 0.3 : (isDark ? 0.6 : 0.85);
  
  return (
    <group ref={groupRef}>
      {Array.from({ length: Math.floor(positions.length / 3) }).map((_, i) => (
        <mesh key={i} position={[positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]]}>
          <sphereGeometry args={[size, 8, 8]} />
          <meshBasicMaterial
            color={colors[i % colors.length]}
            transparent
            opacity={opacity}
            blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

// Crystal lens flares at key points
function CrystalFlares({ isSpeaking, volume, isDark }: { isSpeaking: boolean; volume: number; isDark: boolean }) {
  const flaresRef = useRef<THREE.Group>(null);
  
  const flarePositions = useMemo(() => [
    new THREE.Vector3(0.45, 0.2, 0.12),
    new THREE.Vector3(-0.38, 0.3, -0.2),
    new THREE.Vector3(0.12, -0.4, 0.25),
    new THREE.Vector3(-0.2, 0.12, 0.42),
  ], []);

  useFrame((state) => {
    if (flaresRef.current) {
      flaresRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  const opacity = isSpeaking ? (isDark ? 0.5 : 0.7) + volume * 0.3 : (isDark ? 0.45 : 0.65);
  const size = isSpeaking ? 0.08 + volume * 0.03 : (isDark ? 0.07 : 0.09);
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
              blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <pointLight color={flareColors[i]} intensity={isSpeaking ? 0.6 + volume * 0.3 : (isDark ? 0.5 : 0.8)} distance={2} decay={2} />
        </group>
      ))}
    </group>
  );
}

// Glass crystal shell
function CrystalShell({ volume, isSpeaking, isDark }: { volume: number; isSpeaking: boolean; isDark: boolean }) {
  const shellRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const innerEdgesRef = useRef<THREE.LineSegments>(null);
  
  useFrame((state) => {
    const rotation = state.clock.elapsedTime * 0.04;
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

  const geometry = useMemo(() => new THREE.DodecahedronGeometry(0.5, 0), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  const edgeOpacity = isSpeaking ? (isDark ? 0.6 : 0.8) + volume * 0.3 : (isDark ? 0.5 : 0.7);
  const innerEdgeOpacity = isSpeaking ? (isDark ? 0.3 : 0.5) + volume * 0.15 : (isDark ? 0.25 : 0.4);

  return (
    <group>
      <mesh ref={shellRef} geometry={geometry}>
        <meshPhysicalMaterial
          color={isDark ? "#88ccff" : "#6699cc"}
          metalness={0.1}
          roughness={0.0}
          transmission={isDark ? 0.95 : 0.8}
          thickness={0.5}
          envMapIntensity={1}
          clearcoat={1}
          clearcoatRoughness={0}
          ior={2.4}
          transparent
          opacity={isDark ? 0.12 : 0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      <lineSegments ref={edgesRef} geometry={edgesGeometry}>
        <lineBasicMaterial 
          color={isDark ? "#88bbcc" : "#4488aa"} 
          transparent 
          opacity={edgeOpacity}
          blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
        />
      </lineSegments>
      
      <lineSegments ref={innerEdgesRef} geometry={edgesGeometry} scale={0.97}>
        <lineBasicMaterial 
          color={isDark ? "#ffffff" : "#aaddff"} 
          transparent 
          opacity={innerEdgeOpacity}
          blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
        />
      </lineSegments>
    </group>
  );
}

// Ambient particle dust
function AmbientDust({ volume, isSpeaking, isDark }: { volume: number; isSpeaking: boolean; isDark: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  
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
        color={isDark ? "#ccddee" : "#8899aa"}
        size={isSpeaking ? (isDark ? 0.01 : 0.014) + volume * 0.006 : (isDark ? 0.009 : 0.012)}
        transparent
        opacity={isSpeaking ? (isDark ? 0.6 : 0.8) + volume * 0.3 : (isDark ? 0.55 : 0.75)}
        sizeAttenuation
        depthWrite={false}
        blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </points>
  );
}

// Main 3D Scene
function OrbScene({ isConnected, isSpeaking, inputVolume, outputVolume, isDark }: { 
  isConnected: boolean; 
  isSpeaking: boolean; 
  inputVolume: number; 
  outputVolume: number;
  isDark: boolean;
}) {
  const volume = isSpeaking ? outputVolume : inputVolume;

  return (
    <>
      {/* Ambient lighting - brighter in light mode */}
      <ambientLight intensity={isDark ? 0.3 : 0.6} />
      
      {/* Orbital rings */}
      <OrbitalRings volume={volume} isActive={isConnected} isSpeaking={isSpeaking} isDark={isDark} />
      
      {/* Sound wave rings - only visible when speaking */}
      <SoundWaves volume={volume} isActive={isConnected} isSpeaking={isSpeaking} isDark={isDark} />
      
      {/* Living plasma core */}
      <LivingCore volume={volume} isActive={isConnected} isSpeaking={isSpeaking} isDark={isDark} />
      
      {/* Orbiting energy particles */}
      <EnergyParticles volume={volume} isActive={isConnected} isSpeaking={isSpeaking} isDark={isDark} />
      
      {/* Energy ribbon system */}
      <EnergyRibbons volume={volume} isSpeaking={isSpeaking} isDark={isDark} />
      
      {/* Glowing vertex points */}
      <VertexGlowPoints isSpeaking={isSpeaking} volume={volume} isDark={isDark} />
      
      {/* Lens flare effects */}
      <CrystalFlares isSpeaking={isSpeaking} volume={volume} isDark={isDark} />
      
      {/* Ambient particles */}
      <AmbientDust volume={volume} isSpeaking={isSpeaking} isDark={isDark} />
      
      {/* Crystal shell - outermost layer */}
      <CrystalShell volume={volume} isSpeaking={isSpeaking} isDark={isDark} />
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
  const isDark = useTheme();
  
  return (
    <div 
      className="relative w-full h-full cursor-pointer"
      onClick={onClick}
    >
      {/* Cosmic portal backdrop for light mode - keeps additive blending working */}
      {!isDark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Outer glow ring */}
          <div 
            className="absolute rounded-full"
            style={{
              width: '55%',
              height: '55%',
              background: 'radial-gradient(circle, transparent 40%, rgba(147, 51, 234, 0.12) 60%, rgba(139, 92, 246, 0.08) 80%, transparent 100%)',
            }}
          />
          {/* Inner cosmic window - softer purple/indigo tones */}
          <div 
            className="rounded-full"
            style={{
              width: '45%',
              height: '45%',
              background: 'radial-gradient(circle, rgba(88, 28, 135, 0.85) 0%, rgba(109, 40, 217, 0.7) 35%, rgba(139, 92, 246, 0.5) 60%, rgba(167, 139, 250, 0.25) 80%, transparent 100%)',
              boxShadow: '0 0 30px 10px rgba(139, 92, 246, 0.2), 0 0 50px 20px rgba(167, 139, 250, 0.1)',
            }}
          />
        </div>
      )}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ 
          alpha: true, 
          antialias: true, 
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isDark ? 1.4 : 1.6,
        }}
      >
        <OrbScene 
          isConnected={isConnected}
          isSpeaking={isSpeaking}
          inputVolume={inputVolume}
          outputVolume={outputVolume}
          isDark={true}
        />
      </Canvas>
    </div>
  );
}
