// Atlas Sonic OS - Waveform Display Component

import { useEffect, useRef } from 'react';

interface WaveformDisplayProps {
  audioData: Uint8Array;
  color?: string;
  height?: number;
}

export default function WaveformDisplay({ 
  audioData, 
  color = 'hsl(168, 100%, 50%)',
  height = 60 
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const canvasHeight = canvas.height;

    // Clear
    ctx.fillStyle = 'transparent';
    ctx.clearRect(0, 0, width, canvasHeight);

    // Draw waveform
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    const sliceWidth = width / audioData.length;
    let x = 0;

    for (let i = 0; i < audioData.length; i++) {
      const v = audioData[i] / 255;
      const y = (v * canvasHeight) / 2 + canvasHeight / 4;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    // Add glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.stroke();
  }, [audioData, color]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={height}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
}
