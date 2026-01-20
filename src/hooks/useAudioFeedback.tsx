import { useCallback, useRef, useEffect } from 'react';
import { useAccessibilitySettings } from './useAccessibilitySettings';

type SoundType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'notification' 
  | 'click' 
  | 'complete' 
  | 'levelUp'
  | 'achievement'
  | 'message';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
  pattern?: number[];
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  success: { frequency: 523.25, duration: 150, type: 'sine', volume: 0.3, pattern: [523.25, 659.25, 783.99] },
  error: { frequency: 200, duration: 200, type: 'sawtooth', volume: 0.2, pattern: [300, 200] },
  warning: { frequency: 440, duration: 100, type: 'triangle', volume: 0.25, pattern: [440, 440] },
  notification: { frequency: 800, duration: 80, type: 'sine', volume: 0.2, pattern: [800, 1000] },
  click: { frequency: 1000, duration: 30, type: 'sine', volume: 0.1 },
  complete: { frequency: 587.33, duration: 120, type: 'sine', volume: 0.3, pattern: [587.33, 783.99, 987.77] },
  levelUp: { frequency: 392, duration: 150, type: 'sine', volume: 0.35, pattern: [392, 523.25, 659.25, 783.99] },
  achievement: { frequency: 659.25, duration: 100, type: 'sine', volume: 0.3, pattern: [659.25, 783.99, 987.77, 1318.51] },
  message: { frequency: 600, duration: 60, type: 'sine', volume: 0.15, pattern: [600, 800] },
};

export function useAudioFeedback(userId: string | undefined) {
  const { settings } = useAccessibilitySettings(userId);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    // Initialize on any user interaction
    const events = ['click', 'keydown', 'touchstart'];
    events.forEach((event) => {
      document.addEventListener(event, initAudio, { once: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, initAudio);
      });
    };
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType, volume: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    const adjustedVolume = volume * settings.audio_volume;
    gainNode.gain.setValueAtTime(adjustedVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  }, [settings.audio_volume]);

  const playSound = useCallback((soundType: SoundType) => {
    if (!settings.audio_feedback_enabled) return;
    if (settings.audio_volume === 0) return;

    const config = SOUND_CONFIGS[soundType];
    if (!config) return;

    if (config.pattern && config.pattern.length > 1) {
      // Play a sequence of tones
      config.pattern.forEach((freq, index) => {
        setTimeout(() => {
          playTone(freq, config.duration, config.type, config.volume);
        }, index * (config.duration + 50));
      });
    } else {
      playTone(config.frequency, config.duration, config.type, config.volume);
    }
  }, [settings.audio_feedback_enabled, settings.audio_volume, playTone]);

  const playSuccess = useCallback(() => playSound('success'), [playSound]);
  const playError = useCallback(() => playSound('error'), [playSound]);
  const playWarning = useCallback(() => playSound('warning'), [playSound]);
  const playNotification = useCallback(() => playSound('notification'), [playSound]);
  const playClick = useCallback(() => playSound('click'), [playSound]);
  const playComplete = useCallback(() => playSound('complete'), [playSound]);
  const playLevelUp = useCallback(() => playSound('levelUp'), [playSound]);
  const playAchievement = useCallback(() => playSound('achievement'), [playSound]);
  const playMessage = useCallback(() => playSound('message'), [playSound]);

  return {
    playSound,
    playSuccess,
    playError,
    playWarning,
    playNotification,
    playClick,
    playComplete,
    playLevelUp,
    playAchievement,
    playMessage,
    isEnabled: settings.audio_feedback_enabled,
    volume: settings.audio_volume,
  };
}
