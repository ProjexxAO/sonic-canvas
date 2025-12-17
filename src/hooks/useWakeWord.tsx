import { useState, useEffect, useCallback, useRef } from 'react';

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

interface UseWakeWordOptions {
  wakeWord?: string;
  onWakeWordDetected: () => void;
  enabled?: boolean;
}

export function useWakeWord({
  wakeWord = 'atlas',
  onWakeWordDetected,
  enabled = true
}: UseWakeWordOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout>();
  const isListeningRef = useRef(false);
  const cooldownRef = useRef(false);
  const onWakeWordDetectedRef = useRef(onWakeWordDetected);

  // Keep callback ref updated without re-running effect
  useEffect(() => {
    onWakeWordDetectedRef.current = onWakeWordDetected;
  }, [onWakeWordDetected]);

  // Keep isListening ref in sync
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);

    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Don't process during cooldown
      if (cooldownRef.current) return;

      const results = Array.from({ length: event.results.length }, (_, i) => event.results[i]);
      const transcript = results
        .map(result => result[0].transcript)
        .join(' ')
        .toLowerCase();

      console.log('[WakeWord] Heard:', transcript);

      if (transcript.includes(wakeWord.toLowerCase())) {
        console.log('[WakeWord] Wake word detected!');
        
        // Set cooldown to prevent rapid re-activation
        cooldownRef.current = true;
        setTimeout(() => {
          cooldownRef.current = false;
        }, 3000);
        
        // Stop listening and trigger callback
        recognition.stop();
        setIsListening(false);
        isListeningRef.current = false;
        onWakeWordDetectedRef.current();
      }
    };

    recognition.onend = () => {
      // Only auto-restart if actively listening and no cooldown
      if (isListeningRef.current && !cooldownRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            if (isListeningRef.current) {
              recognition.start();
            }
          } catch (e) {
            console.log('[WakeWord] Could not restart:', e);
          }
        }, 100);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log('[WakeWord] Error:', event.error);
      if (event.error === 'not-allowed') {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      try {
        recognition.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
    };
  }, [wakeWord]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current || isListeningRef.current) return;

    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognitionRef.current.start();
      isListeningRef.current = true;
      setIsListening(true);
      console.log('[WakeWord] Started listening for:', wakeWord);
    } catch (error) {
      console.error('[WakeWord] Failed to start:', error);
    }
  }, [wakeWord]);

  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    isListeningRef.current = false;
    setIsListening(false);
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      // Ignore errors when stopping
    }
    console.log('[WakeWord] Stopped listening');
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening
  };
}
