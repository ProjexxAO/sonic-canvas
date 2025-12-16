// Atlas Sonic OS - Status Bar Component

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cpu, Clock, Activity, Radio } from 'lucide-react';

interface StatusBarProps {
  agentCount: number;
  isConnected: boolean;
}

export default function StatusBar({ agentCount, isConnected }: StatusBarProps) {
  const [time, setTime] = useState(new Date());
  const [cpuUsage, setCpuUsage] = useState(23);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
      setCpuUsage(20 + Math.random() * 30);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-8 bg-card/80 border-t border-border flex items-center justify-between px-4 text-xs font-mono">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi size={12} className="text-success" />
          ) : (
            <WifiOff size={12} className="text-destructive" />
          )}
          <span className={isConnected ? 'text-success' : 'text-destructive'}>
            {isConnected ? 'GRID ONLINE' : 'OFFLINE'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <Radio size={12} />
          <span>{agentCount} NODES</span>
        </div>
      </div>

      {/* Center */}
      <div className="flex items-center gap-1 text-primary">
        <Activity size={12} />
        <span className="text-glow-cyan">ATLAS SONIC OS</span>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Cpu size={12} />
          <span>{cpuUsage.toFixed(0)}%</span>
        </div>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock size={12} />
          <span>{time.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
