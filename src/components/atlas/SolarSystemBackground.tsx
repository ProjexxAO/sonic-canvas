// Solar System Background - Shared component for all hub types
// Displays orbiting planets around the central Atlas orb

import React from 'react';

interface SolarSystemBackgroundProps {
  theme: 'dark' | 'light' | string;
}

export function SolarSystemBackground({ theme }: SolarSystemBackgroundProps) {
  if (theme !== 'dark') return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Orbit rings - visual guides */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {/* Orbit paths */}
        {[120, 160, 200, 260, 320, 380, 440].map((size, i) => (
          <div
            key={`orbit-${size}`}
            className="absolute rounded-full border"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              borderColor: `hsl(var(--border) / ${0.08 - i * 0.008})`,
            }}
          />
        ))}
      </div>

      {/* Mercury - First planet, closest to sun */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '120px',
        height: '120px',
        marginTop: '-60px',
        marginLeft: '-60px',
        animation: 'orbit-rotation 8.8s linear infinite',
        pointerEvents: 'none',
      }}>
        <div style={{ position: 'absolute', top: '0', left: '50%', marginLeft: '-3px', marginTop: '-3px' }}>
          <svg width="6" height="6" viewBox="0 0 12 12" style={{ filter: 'drop-shadow(0 0 2px hsl(30 20% 60% / 0.4))' }}>
            <defs>
              <radialGradient id="mercurySurface" cx="35%" cy="35%" r="60%">
                <stop offset="0%" stopColor="hsl(30 15% 65%)" />
                <stop offset="100%" stopColor="hsl(30 10% 40%)" />
              </radialGradient>
            </defs>
            <circle cx="6" cy="6" r="5" fill="url(#mercurySurface)" />
            <circle cx="4" cy="3" r="1" fill="hsl(30 10% 30%)" opacity="0.3" />
          </svg>
        </div>
      </div>
      
      {/* Venus - Second planet */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '160px',
        height: '160px',
        marginTop: '-80px',
        marginLeft: '-80px',
        animation: 'orbit-rotation 22.5s linear infinite',
        pointerEvents: 'none',
      }}>
        <div style={{ position: 'absolute', top: '0', left: '50%', marginLeft: '-4px', marginTop: '-4px' }}>
          <svg width="8" height="8" viewBox="0 0 16 16" style={{ filter: 'drop-shadow(0 0 3px hsl(45 60% 70% / 0.4))' }}>
            <defs>
              <radialGradient id="venusSurface" cx="35%" cy="35%" r="60%">
                <stop offset="0%" stopColor="hsl(45 50% 75%)" />
                <stop offset="100%" stopColor="hsl(40 40% 55%)" />
              </radialGradient>
            </defs>
            <circle cx="8" cy="8" r="7" fill="url(#venusSurface)" />
            <ellipse cx="8" cy="6" rx="4" ry="2" fill="hsl(50 40% 80%)" opacity="0.4" />
          </svg>
        </div>
      </div>
      
      {/* Earth - Third planet */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '200px',
        height: '200px',
        marginTop: '-100px',
        marginLeft: '-100px',
        animation: 'orbit-rotation 36.5s linear infinite',
        pointerEvents: 'none',
      }}>
        <div style={{ position: 'absolute', top: '0', left: '50%', marginLeft: '-5px', marginTop: '-5px' }}>
          <svg width="10" height="10" viewBox="0 0 20 20" style={{ filter: 'drop-shadow(0 0 3px hsl(200 70% 55% / 0.5))' }}>
            <defs>
              <radialGradient id="earthSurface" cx="35%" cy="35%" r="60%">
                <stop offset="0%" stopColor="hsl(200 65% 55%)" />
                <stop offset="100%" stopColor="hsl(210 60% 35%)" />
              </radialGradient>
            </defs>
            <circle cx="10" cy="10" r="9" fill="url(#earthSurface)" />
            <ellipse cx="12" cy="7" rx="3" ry="2" fill="hsl(120 30% 45%)" opacity="0.6" />
            <ellipse cx="7" cy="12" rx="4" ry="2" fill="hsl(120 25% 40%)" opacity="0.5" />
            <ellipse cx="10" cy="3" rx="5" ry="1.5" fill="white" opacity="0.4" />
          </svg>
        </div>
        {/* Moon orbiting Earth */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '50%',
          marginLeft: '-10px',
          marginTop: '-10px',
          width: '30px',
          height: '30px',
          animation: 'moon-around-earth 8s linear infinite',
        }}>
          <svg width="4" height="4" viewBox="0 0 8 8" style={{ filter: 'drop-shadow(0 0 1px hsl(0 0% 80% / 0.4))' }}>
            <circle cx="4" cy="4" r="3" fill="hsl(40 5% 75%)" />
          </svg>
        </div>
      </div>
      
      {/* Mars - Fourth planet */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '260px',
        height: '260px',
        marginTop: '-130px',
        marginLeft: '-130px',
        animation: 'orbit-rotation 68.7s linear infinite',
        pointerEvents: 'none',
      }}>
        <div style={{ position: 'absolute', top: '0', left: '50%', marginLeft: '-4px', marginTop: '-4px' }}>
          <svg width="8" height="8" viewBox="0 0 16 16" style={{ filter: 'drop-shadow(0 0 3px hsl(15 70% 50% / 0.5))' }}>
            <defs>
              <radialGradient id="marsSurface" cx="35%" cy="35%" r="60%">
                <stop offset="0%" stopColor="hsl(15 60% 55%)" />
                <stop offset="100%" stopColor="hsl(10 50% 35%)" />
              </radialGradient>
            </defs>
            <circle cx="8" cy="8" r="7" fill="url(#marsSurface)" />
            <ellipse cx="8" cy="3" rx="3" ry="1" fill="hsl(0 0% 90%)" opacity="0.5" />
          </svg>
        </div>
      </div>
      
      {/* Jupiter - Fifth planet, largest */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '320px',
        height: '320px',
        marginTop: '-160px',
        marginLeft: '-160px',
        animation: 'orbit-rotation 433s linear infinite',
        pointerEvents: 'none',
      }}>
        <div style={{ position: 'absolute', top: '0', left: '50%', marginLeft: '-10px', marginTop: '-10px' }}>
          <svg width="20" height="20" viewBox="0 0 40 40" style={{ filter: 'drop-shadow(0 0 5px hsl(30 50% 60% / 0.5))' }}>
            <defs>
              <linearGradient id="jupiterBands" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(35 45% 70%)" />
                <stop offset="25%" stopColor="hsl(25 50% 55%)" />
                <stop offset="50%" stopColor="hsl(40 40% 75%)" />
                <stop offset="75%" stopColor="hsl(30 55% 50%)" />
                <stop offset="100%" stopColor="hsl(35 45% 70%)" />
              </linearGradient>
            </defs>
            <circle cx="20" cy="20" r="18" fill="url(#jupiterBands)" />
            <ellipse cx="14" cy="22" rx="4" ry="2" fill="hsl(10 60% 50%)" opacity="0.6" />
          </svg>
        </div>
      </div>
      
      {/* Saturn - Sixth planet, with rings */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '380px',
        height: '380px',
        marginTop: '-190px',
        marginLeft: '-190px',
        animation: 'orbit-rotation 1075s linear infinite',
        pointerEvents: 'none',
      }}>
        <div style={{ position: 'absolute', top: '0', left: '50%', marginLeft: '-16px', marginTop: '-10px' }}>
          <svg width="32" height="20" viewBox="0 0 64 40" style={{ filter: 'drop-shadow(0 0 5px hsl(45 50% 70% / 0.5))' }}>
            <defs>
              <linearGradient id="saturnBands" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(45 40% 75%)" />
                <stop offset="50%" stopColor="hsl(40 45% 65%)" />
                <stop offset="100%" stopColor="hsl(45 40% 60%)" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="20" rx="30" ry="6" fill="none" stroke="hsl(45 30% 70%)" strokeWidth="2" opacity="0.4" />
            <ellipse cx="32" cy="20" rx="24" ry="5" fill="none" stroke="hsl(50 35% 75%)" strokeWidth="3" opacity="0.5" />
            <ellipse cx="32" cy="20" rx="14" ry="12" fill="url(#saturnBands)" />
            <path d="M 46 20 A 30 6 0 0 1 18 20" fill="none" stroke="hsl(45 30% 70%)" strokeWidth="2" opacity="0.5" />
          </svg>
        </div>
      </div>
      
      {/* Uranus - Seventh planet */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '440px',
        height: '440px',
        marginTop: '-220px',
        marginLeft: '-220px',
        animation: 'orbit-rotation 3066s linear infinite',
        pointerEvents: 'none',
      }}>
        <div style={{ position: 'absolute', top: '0', left: '50%', marginLeft: '-5px', marginTop: '-5px' }}>
          <svg width="10" height="10" viewBox="0 0 20 20" style={{ filter: 'drop-shadow(0 0 4px hsl(180 50% 70% / 0.5))' }}>
            <defs>
              <radialGradient id="uranusSurface" cx="35%" cy="35%" r="60%">
                <stop offset="0%" stopColor="hsl(180 45% 75%)" />
                <stop offset="100%" stopColor="hsl(185 50% 55%)" />
              </radialGradient>
            </defs>
            <circle cx="10" cy="10" r="9" fill="url(#uranusSurface)" />
          </svg>
        </div>
      </div>
    </div>
  );
}
