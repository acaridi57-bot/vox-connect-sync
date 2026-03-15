import { useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function useMicrophone() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const setAudioLevel = useAppStore((s) => s.setAudioLevel);
  const sensitivity = useAppStore((s) => s.sensitivity);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const monitor = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        const normalized = Math.min(avg / 128, 1);
        setAudioLevel(normalized);
        rafRef.current = requestAnimationFrame(monitor);
      };
      monitor();
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  }, [setAudioLevel]);

  const stopMic = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close();
    streamRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  }, [setAudioLevel]);

  const pauseMic = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = false));
  }, []);

  const resumeMic = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = true));
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioContextRef.current?.close();
    };
  }, []);

  const getThreshold = useCallback(() => {
    return (100 - sensitivity) / 100 * 0.3 + 0.05;
  }, [sensitivity]);

  return { startMic, stopMic, pauseMic, resumeMic, getThreshold };
}
