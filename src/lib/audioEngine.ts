// Atlas Sonic OS - Audio Engine
// Procedural audio synthesis using Web Audio API

export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface SonicSignature {
  waveform: WaveformType;
  frequency: number;
  color: string;
  modulation: number;
  density: number;
}

class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.analyser = this.context.createAnalyser();
    
    this.masterGain.gain.value = 0.3;
    this.analyser.fftSize = 256;
    
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.context.destination);
    
    this.isInitialized = true;
  }

  getAnalyserData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(128);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  playTone(frequency: number, duration: number = 0.2, type: WaveformType = 'sine'): void {
    if (!this.context || !this.masterGain) {
      this.initialize().then(() => this.playTone(frequency, duration, type));
      return;
    }

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = type;
    osc.frequency.value = frequency;
    
    gain.gain.setValueAtTime(0.3, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.context.currentTime + duration);
    
    this.activeOscillators.push(osc);
    osc.onended = () => {
      const idx = this.activeOscillators.indexOf(osc);
      if (idx > -1) this.activeOscillators.splice(idx, 1);
    };
  }

  // UI interaction sounds
  playClick(): void {
    this.playTone(800, 0.05, 'square');
  }

  playHover(): void {
    this.playTone(1200, 0.03, 'sine');
  }

  playSuccess(): void {
    this.playTone(523.25, 0.1, 'sine');
    setTimeout(() => this.playTone(659.25, 0.1, 'sine'), 100);
    setTimeout(() => this.playTone(783.99, 0.15, 'sine'), 200);
  }

  playError(): void {
    this.playTone(200, 0.3, 'sawtooth');
    setTimeout(() => this.playTone(150, 0.3, 'sawtooth'), 150);
  }

  playAlert(): void {
    this.playTone(880, 0.1, 'square');
    setTimeout(() => this.playTone(660, 0.1, 'square'), 150);
    setTimeout(() => this.playTone(880, 0.1, 'square'), 300);
  }

  playSynthesize(): void {
    const notes = [261.63, 329.63, 392, 523.25];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'triangle'), i * 80);
    });
  }

  playMerge(): void {
    this.playTone(200, 0.5, 'sawtooth');
    setTimeout(() => {
      this.playTone(400, 0.4, 'triangle');
      this.playTone(600, 0.4, 'sine');
    }, 200);
  }

  playBoot(): void {
    const sequence = [
      { freq: 100, dur: 0.1, delay: 0 },
      { freq: 150, dur: 0.1, delay: 100 },
      { freq: 200, dur: 0.1, delay: 200 },
      { freq: 300, dur: 0.1, delay: 300 },
      { freq: 400, dur: 0.2, delay: 400 },
      { freq: 600, dur: 0.3, delay: 500 },
    ];
    
    sequence.forEach(({ freq, dur, delay }) => {
      setTimeout(() => this.playTone(freq, dur, 'triangle'), delay);
    });
  }

  // Continuous drone for ambient
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;

  startDrone(signature: SonicSignature): void {
    if (!this.context || !this.masterGain) return;
    
    this.stopDrone();
    
    this.droneOsc = this.context.createOscillator();
    this.droneGain = this.context.createGain();
    
    this.droneOsc.type = signature.waveform;
    this.droneOsc.frequency.value = signature.frequency * 0.5;
    this.droneGain.gain.value = 0.05;
    
    // Add modulation
    const lfo = this.context.createOscillator();
    const lfoGain = this.context.createGain();
    lfo.frequency.value = signature.modulation * 0.1;
    lfoGain.gain.value = signature.frequency * 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(this.droneOsc.frequency);
    lfo.start();
    
    this.droneOsc.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);
    this.droneOsc.start();
  }

  stopDrone(): void {
    if (this.droneOsc) {
      this.droneOsc.stop();
      this.droneOsc = null;
    }
    if (this.droneGain) {
      this.droneGain = null;
    }
  }

  dispose(): void {
    this.stopDrone();
    this.activeOscillators.forEach(osc => osc.stop());
    this.activeOscillators = [];
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    this.isInitialized = false;
  }
}

export const audioEngine = new AudioEngine();
