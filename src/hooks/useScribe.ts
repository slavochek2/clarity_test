'use client';

import { useState, useRef, useCallback } from 'react';

interface UseScribeReturn {
  isRecording: boolean;
  transcript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearTranscript: () => void;
  setTranscript: (value: string) => void;
}

export function useScribe(): UseScribeReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);

    try {
      // 1. Get token from our API
      const tokenRes = await fetch('/api/scribe-token');
      if (!tokenRes.ok) {
        const err = await tokenRes.json();
        throw new Error(err.message || 'Failed to get token');
      }
      const { token } = await tokenRes.json();

      // 2. Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 3. Set up audio processing
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // 4. Connect to ElevenLabs Scribe WebSocket
      const ws = new WebSocket(
        `wss://api.elevenlabs.io/v1/scribe/realtime?model_id=scribe_v1&language_code=en&token=${token}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        setIsRecording(true);
        source.connect(processor);
        processor.connect(audioContext.destination);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'transcript' && data.text) {
          // Append new transcribed text
          setTranscript((prev) => {
            const newText = data.text.trim();
            if (!newText) return prev;
            return prev ? `${prev} ${newText}` : newText;
          });
        }
      };

      ws.onerror = () => {
        setError('WebSocket connection error');
        stopRecording();
      };

      ws.onclose = () => {
        setIsRecording(false);
      };

      // 5. Send audio chunks to WebSocket
      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          // Convert Float32 to Int16
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          ws.send(pcm16.buffer);
        }
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop audio processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop microphone
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setIsRecording(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isRecording,
    transcript,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
    setTranscript,
  };
}
