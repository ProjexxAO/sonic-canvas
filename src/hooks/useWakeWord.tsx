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
  const enabledRef = useRef(enabled);
  const isListeningRef = useRef(false);
  const cooldownRef = useRef(false);
  const onWakeWordDetectedRef = useRef(onWakeWordDetected);

  // Keep refs updated
  useEffect(() => {
    onWakeWordDetectedRef.current = onWakeWordDetected;
  }, [onWakeWordDetected]);

  useEffect(() => {
    enabledRef.current = enabled;
    // If disabled, force stop
    if (!enabled) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // ignore
      }
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, [enabled]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    const safeRestart = (delayMs: number) => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = setTimeout(() => {
        if (!enabledRef.current || !isListeningRef.current || cooldownRef.current) return;
        try {
          recognition.start();
        } catch (e) {
          // ignore
        }
      }, delayMs);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!enabledRef.current) return;
      if (cooldownRef.current) return;

      const results = Array.from({ length: event.results.length }, (_, i) => event.results[i]);
      const transcript = results
        .map(result => result[0].transcript)
        .join(' ')
        .toLowerCase();

      console.log('[WakeWord] Heard:', transcript);

      if (transcript.includes(wakeWord.toLowerCase())) {
        console.log('[WakeWord] Wake word detected!');

        cooldownRef.current = true;
        setTimeout(() => {
          cooldownRef.current = false;
        }, 3000);

        try {
          recognition.stop();
        } catch (e) {
          // ignore
        }
        isListeningRef.current = false;
        setIsListening(false);

        onWakeWordDetectedRef.current();
      }
    };

    recognition.onend = () => {
      if (!enabledRef.current) return;
      if (isListeningRef.current && !cooldownRef.current) {
        safeRestart(150);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Chrome's SpeechRecognition is cloud-backed; "network" is common on flaky connections
      console.log('[WakeWord] Error:', event.error);

      if (!enabledRef.current) return;

      if (event.error === 'not-allowed') {
        isListeningRef.current = false;
        setIsListening(false);
        return;
      }

      if (event.error === 'network') {
        // Try to recover automatically while still enabled
        safeRestart(1000);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      try {
        recognition.stop();
      } catch (e) {
        // ignore
      }
    };
  }, [wakeWord]);

  const startListening = useCallback(async () => {
    if (!enabledRef.current) {
      console.log('[WakeWord] startListening ignored (disabled)');
      return;
    }
    if (!recognitionRef.current || isListeningRef.current) return;

    try {
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
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    isListeningRef.current = false;
    setIsListening(false);
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      // ignore
    }
    console.log('[WakeWord] Stopped listening');
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
  };
}
