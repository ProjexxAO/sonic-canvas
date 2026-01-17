import { useState, useEffect, useRef, useCallback } from "react";
import { PorcupineWorker, BuiltInKeyword } from "@picovoice/porcupine-web";
import { supabase } from "@/integrations/supabase/client";

export type WakeWordStatus = "idle" | "loading" | "listening" | "detected" | "error";

// Map friendly names to BuiltInKeyword enum values
const WAKE_WORD_MAP: Record<string, BuiltInKeyword> = {
  alexa: BuiltInKeyword.Alexa,
  americano: BuiltInKeyword.Americano,
  blueberry: BuiltInKeyword.Blueberry,
  bumblebee: BuiltInKeyword.Bumblebee,
  computer: BuiltInKeyword.Computer,
  grapefruit: BuiltInKeyword.Grapefruit,
  grasshopper: BuiltInKeyword.Grasshopper,
  "hey google": BuiltInKeyword.HeyGoogle,
  "hey siri": BuiltInKeyword.HeySiri,
  jarvis: BuiltInKeyword.Jarvis,
  "ok google": BuiltInKeyword.OkayGoogle,
  picovoice: BuiltInKeyword.Picovoice,
  porcupine: BuiltInKeyword.Porcupine,
  terminator: BuiltInKeyword.Terminator,
};

export type WakeWordName = keyof typeof WAKE_WORD_MAP;

interface UseWakeWordDetectionOptions {
  enabled?: boolean;
  onWakeWordDetected?: () => void;
  wakeWord?: WakeWordName;
  sensitivity?: number;
}

// Porcupine model hosted on Picovoice CDN
const PORCUPINE_MODEL_URL = "https://cdn.picovoice.ai/porcupine/porcupine_params.pv";

export function useWakeWordDetection(options: UseWakeWordDetectionOptions = {}) {
  const { 
    enabled = true, 
    onWakeWordDetected,
    wakeWord = "jarvis",
    sensitivity = 0.7
  } = options;

  const [status, setStatus] = useState<WakeWordStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  
  const porcupineRef = useRef<PorcupineWorker | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isCleaningUpRef = useRef(false);
  
  // Use ref for callback to avoid re-creating Porcupine on callback changes
  const onWakeWordDetectedRef = useRef(onWakeWordDetected);
  onWakeWordDetectedRef.current = onWakeWordDetected;

  const cleanup = useCallback(async () => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;

    try {
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (porcupineRef.current) {
        porcupineRef.current.terminate();
        porcupineRef.current = null;
      }
    } catch (e) {
      console.warn("[WakeWord] Cleanup error:", e);
    } finally {
      isCleaningUpRef.current = false;
      setStatus("idle");
    }
  }, []);

  const startListening = useCallback(async () => {
    if (porcupineRef.current || status === "listening" || status === "loading") {
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      // Fetch access key from edge function
      const { data, error: fetchError } = await supabase.functions.invoke("picovoice-access-key");
      
      if (fetchError || !data?.accessKey) {
        throw new Error(fetchError?.message || "Failed to get Picovoice access key");
      }

      const builtInKeyword = WAKE_WORD_MAP[wakeWord] || BuiltInKeyword.Jarvis;

      // Initialize Porcupine with the built-in wake word
      // PorcupineWorker.create(accessKey, keywords, detectionCallback, model, options?)
      const porcupine = await PorcupineWorker.create(
        data.accessKey,
        [{ builtin: builtInKeyword, sensitivity }],
        (detection) => {
          console.log("[WakeWord] Detected:", detection.label);
          setStatus("detected");
          onWakeWordDetectedRef.current?.();
          // Reset to listening after detection
          setTimeout(() => setStatus("listening"), 1000);
        },
        { publicPath: PORCUPINE_MODEL_URL }
      );

      porcupineRef.current = porcupine;

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // Create audio context at 16kHz for Porcupine
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // Use ScriptProcessor (deprecated but widely supported)
      // Frame size of 512 samples at 16kHz = 32ms chunks
      const processor = audioContext.createScriptProcessor(512, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (!porcupineRef.current) return;
        
        const inputBuffer = event.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 for Porcupine
        const pcm = new Int16Array(inputBuffer.length);
        for (let i = 0; i < inputBuffer.length; i++) {
          pcm[i] = Math.max(-32768, Math.min(32767, Math.round(inputBuffer[i] * 32767)));
        }
        porcupineRef.current.process(pcm);
      };

      source.connect(processor);
      // Connect to destination to keep the audio pipeline active (no sound output)
      processor.connect(audioContext.destination);

      setStatus("listening");
      console.log(`[WakeWord] Listening for "${builtInKeyword}"...`);
    } catch (err) {
      console.error("[WakeWord] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to start wake word detection");
      setStatus("error");
      cleanup();
    }
  }, [status, wakeWord, sensitivity, cleanup]);

  const stopListening = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Auto-start when enabled changes
  useEffect(() => {
    if (enabled) {
      startListening();
    } else {
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [enabled]);

  return {
    status,
    error,
    startListening,
    stopListening,
    isListening: status === "listening",
    isDetected: status === "detected",
  };
}
