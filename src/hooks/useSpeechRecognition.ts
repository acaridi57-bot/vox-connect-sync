import { useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { shouldFlipDirection } from '@/lib/speech/langDetect';
import { translateText } from '@/lib/speech/demoTranslations';
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
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) { console.warn('SpeechRecognition not available'); return; }

      shouldAutoRestartRef.current = true;
      const recognition = new SR();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      const syncLang = () => { recognition.lang = useAppStore.getState().sourceLangCode; };

      recognition.onstart = () => { isRecognizingRef.current = true; };

      recognition.onresult = (event: any) => {
        if (isSpeakingRef.current) return;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result?.isFinal) continue;
          const transcript = result[0]?.transcript?.trim?.() ?? '';
          if (!transcript) continue;
          const now = Date.now();
          const prev = lastFinalRef.current;
          if (prev && prev.text.toLowerCase() === transcript.toLowerCase() && now - prev.at < 1500) continue;
          lastFinalRef.current = { text: transcript, at: now };

          const { sourceLangCode: src, targetLangCode: tgt } = useAppStore.getState();
          const flip = shouldFlipDirection(transcript, src, tgt);
          const actualSource = flip ? tgt : src;
          const actualTarget = flip ? src : tgt;

          setStatus('processing');
          pausedForTtsRef.current = true;
          isSpeakingRef.current = true;
          try { recognition.stop(); } catch {}
          onPauseMic();

          // Show original text immediately while translating
          const msgId = Date.now().toString() + Math.random().toString(36).slice(2);
          addMessage({
            id: msgId,
            text: transcript,
            translatedText: '⏳',
            sourceLang: actualSource.slice(0, 2).toUpperCase(),
            targetLang: actualTarget.slice(0, 2).toUpperCase(),
            timestamp: Date.now(),
          });

          translateText(transcript, actualSource, actualTarget).then((translated) => {
            console.log(`[VT] "${transcript}" → "${translated}"`);
            // Update message with real translation
            useAppStore.getState().updateMessageTranslation(msgId, translated);
            setStatus('speaking');
            speakTextWithSettings(translated, actualTarget, () => {
              isSpeakingRef.current = false;
              pausedForTtsRef.current = false;
              if (!shouldAutoRestartRef.current) { setStatus('idle'); return; }
              setStatus('listening');
              onResumeMic();
              syncLang();
              window.setTimeout(() => {
                if (!recognitionRef.current || !shouldAutoRestartRef.current || pausedForTtsRef.current || isRecognizingRef.current) return;
                try { recognition.start(); } catch {}
              }, 120);
            });
          });
          break;
        }
      };

      recognition.onerror = (event: any) => {
        if (event?.error !== 'no-speech' && event?.error !== 'aborted') console.error('SR error:', event?.error);
        if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
          shouldAutoRestartRef.current = false; setStatus('idle');
        }
      };

      recognition.onend = () => {
        isRecognizingRef.current = false;
        if (!shouldAutoRestartRef.current || pausedForTtsRef.current) return;
        syncLang();
        try { recognition.start(); } catch {}
      };

      syncLang();
      try { recognition.start(); } catch {}
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
      try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setStatus('idle');
  }, [setStatus]);

  return { startRecognition, stopRecognition };
}
