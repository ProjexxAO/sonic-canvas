// Atlas Sonic OS - Boot Screen Component

import { useState, useEffect } from 'react';
import { audioEngine } from '@/lib/audioEngine';
import { Hexagon, Radio } from 'lucide-react';

interface BootScreenProps {
  onComplete: () => void;
}

export default function BootScreen({ onComplete }: BootScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  const bootSteps = [
    'INITIALIZING CORE SYSTEMS...',
    'LOADING SONIC PROCESSOR...',
    'CALIBRATING FREQUENCY MATRIX...',
    'ESTABLISHING GRID CONNECTION...',
    'ACTIVATING NEURAL INTERFACE...',
    'BOOT SEQUENCE COMPLETE'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const step = Math.floor((progress / 100) * (bootSteps.length - 1));
    if (step !== currentStep) {
      setCurrentStep(step);
    }
  }, [progress, currentStep, bootSteps.length]);

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      {/* Background grid */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      
      {/* Scanlines */}
      <div className="absolute inset-0 scanlines opacity-20" />
      
      {/* Content */}
      <div className="relative text-center">
        {/* Logo */}
        <div className="mb-8 relative inline-block">
          <Hexagon 
            size={80} 
            className="text-primary animate-pulse"
            style={{ 
              filter: 'drop-shadow(0 0 20px hsl(168, 100%, 50%))'
            }}
          />
          <Radio 
            size={30} 
            className="absolute inset-0 m-auto text-primary-foreground" 
          />
          
          {/* Orbital ring */}
          <div 
            className="absolute inset-0 border-2 border-primary/30 rounded-full animate-rotate-slow"
            style={{ 
              width: '120px', 
              height: '120px',
              top: '-20px',
              left: '-20px'
            }}
          />
        </div>

        {/* Title */}
        <h1 className="font-orbitron text-3xl mb-2">
          <span className="text-primary text-glow-cyan">ATLAS</span>
          <span className="text-muted-foreground mx-2">:</span>
          <span className="text-secondary text-glow-amber">SONIC OS</span>
        </h1>
        <p className="text-muted-foreground text-sm tracking-[0.3em] mb-8">
          SOUND OVER CODE
        </p>

        {/* Progress bar */}
        <div className="w-80 mx-auto mb-4">
          <div className="h-1 bg-muted rounded overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-100"
              style={{ 
                width: `${progress}%`,
                boxShadow: '0 0 10px hsl(168, 100%, 50%)'
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground font-mono">
            <span>0%</span>
            <span>{progress}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Boot step */}
        <div className="h-6">
          <p className="text-xs font-mono text-primary animate-pulse">
            {bootSteps[currentStep]}
          </p>
        </div>

        {/* Version info */}
        <div className="mt-8 text-[10px] text-muted-foreground/50 font-mono">
          v1.0.0 BUILD 2024.12.16
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-primary/50" />
      <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-primary/50" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-primary/50" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-primary/50" />
    </div>
  );
}
