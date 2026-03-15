import { useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { shouldFlipDirection } from '@/lib/speech/langDetect';
import { simpleTranslate } from '@/lib/speech/demoTranslations';
import { speakTextWithSettings } from '@/lib/speech/tts';

export function useSpeechRecognition() {
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);
  const pausedForTtsRef = useRef(false);
  const shouldAutoRestartRef = useRef(false);
  const isRecognizingRef = useRef(false);
  const lastFinalRef = useRef<{ text: string; at: number } | null>(null);

  const addMessage = useAppStore((s) => s.addMessage);
  const setStatus = useAppStore((s) => s.setStatus);

  const startRecognition = useCallback(
    (onPauseMic: () => void, onResumeMic: () => void) => {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn('SpeechRecognition not available');
        return;
      }

      shouldAutoRestartRef.current = true;

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Faster “phrase finalization” in many browsers: run one-shot recognition and auto-restart.
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      const syncLang = () => {
        const { sourceLangCode } = useAppStore.getState();
        recognition.lang = sourceLangCode;
      };

      recognition.onstart = () => {
        isRecognizingRef.current = true;
      };

      recognition.onresult = (event: any) => {
        if (isSpeakingRef.current) return;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result?.isFinal) continue;

          const transcript = result[0]?.transcript?.trim?.() ?? '';
          if (!transcript) continue;

          // De-dupe: prevents rapid duplicates after restarts.
          const now = Date.now();
          const prev = lastFinalRef.current;
          if (
            prev &&
            prev.text.toLowerCase() === transcript.toLowerCase() &&
            now - prev.at < 1500
          ) {
            continue;
          }
          lastFinalRef.current = { text: transcript, at: now };

          const { sourceLangCode: src, targetLangCode: tgt } = useAppStore.getState();
          const flip = shouldFlipDirection(transcript, src, tgt);
          const actualSource = flip ? tgt : src;
          const actualTarget = flip ? src : tgt;

          setStatus('processing');

          const translated = simpleTranslate(transcript, actualSource, actualTarget);

          addMessage({
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            text: transcript,
            translatedText: translated,
            sourceLang: actualSource.slice(0, 2).toUpperCase(),
            targetLang: actualTarget.slice(0, 2).toUpperCase(),
            timestamp: Date.now(),
          });

          // Anti-feedback: stop recognition + pause mic during TTS.
          pausedForTtsRef.current = true;
          isSpeakingRef.current = true;
          try {
            recognition.stop();
          } catch {}
          onPauseMic();

          setStatus('speaking');

          speakTextWithSettings(translated, actualTarget, () => {
            isSpeakingRef.current = false;
            pausedForTtsRef.current = false;

            if (!shouldAutoRestartRef.current) {
              setStatus('idle');
              return;
            }

            setStatus('listening');
            onResumeMic();

            // Restart quickly after speech ends.
            syncLang();
            window.setTimeout(() => {
              if (!recognitionRef.current) return;
              if (!shouldAutoRestartRef.current) return;
              if (pausedForTtsRef.current) return;
              if (isRecognizingRef.current) return;
              try {
                recognition.start();
              } catch {}
            }, 120);
          });

          // Process one final at a time.
          break;
        }
      };

      recognition.onerror = (event: any) => {
        if (event?.error !== 'no-speech' && event?.error !== 'aborted') {
          console.error('Speech recognition error:', event?.error);
        }
        if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
          shouldAutoRestartRef.current = false;
          setStatus('idle');
        }
      };

      recognition.onend = () => {
        isRecognizingRef.current = false;
        if (!shouldAutoRestartRef.current) return;
        if (pausedForTtsRef.current) return;

        // Auto-restart for continuous listening.
        syncLang();
        try {
          recognition.start();
        } catch {}
      };

      syncLang();
      try {
        recognition.start();
      } catch {}
      setStatus('listening');
    },
    [addMessage, setStatus],
  );

  const stopRecognition = useCallback(() => {
    shouldAutoRestartRef.current = false;
    pausedForTtsRef.current = false;
    isSpeakingRef.current = false;
    isRecognizingRef.current = false;
    lastFinalRef.current = null;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    setStatus('idle');
  }, [setStatus]);

  return { startRecognition, stopRecognition };
}
