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

  useEffect(() => {
    // Check for browser support
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);

    if (!SpeechRecognitionAPI || !enabled) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = Array.from({ length: event.results.length }, (_, i) => event.results[i]);
      const transcript = results
        .map(result => result[0].transcript)
        .join(' ')
        .toLowerCase();

      console.log('[WakeWord] Heard:', transcript);

      if (transcript.includes(wakeWord.toLowerCase())) {
        console.log('[WakeWord] Wake word detected!');
        onWakeWordDetected();
        // Stop listening after activation
        recognition.stop();
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still enabled
      if (enabled && isListening) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start();
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
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      recognition.stop();
    };
  }, [wakeWord, onWakeWordDetected, enabled]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current || isListening) return;

    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognitionRef.current.start();
      setIsListening(true);
      console.log('[WakeWord] Started listening for:', wakeWord);
    } catch (error) {
      console.error('[WakeWord] Failed to start:', error);
    }
  }, [isListening, wakeWord]);

  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    recognitionRef.current?.stop();
    setIsListening(false);
    console.log('[WakeWord] Stopped listening');
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening
  };
}
