import { useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { shouldFlipDirection } from '@/lib/speech/langDetect';
import { speakTextWithSettings } from '@/lib/speech/tts';

// ── Inline translation — no external module needed ──────────────────────────
async function doTranslate(text: string, src: string, tgt: string): Promise<string> {
  const s = src.slice(0, 2).toLowerCase();
  const t = tgt.slice(0, 2).toLowerCase();
  if (s === t) return text;

  // 1. MyMemory — free, CORS-enabled
  try {
    const r = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${s}|${t}`
    );
    if (r.ok) {
      const d = await r.json();
      if (d?.responseStatus === 200 && d?.responseData?.translatedText) {
        const out = d.responseData.translatedText as string;
        if (out && out.toLowerCase() !== text.toLowerCase()) return out;
      }
    }
  } catch { /* try next */ }

  // 2. Google Translate (unofficial gtx client — no key needed)
  try {
    const r = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${s}&tl=${t}&dt=t&q=${encodeURIComponent(text)}`
    );
    if (r.ok) {
      const d = await r.json();
      const out: string = (d?.[0] ?? []).map((c: any[]) => c?.[0] ?? '').join('');
      if (out && out.toLowerCase() !== text.toLowerCase()) return out;
    }
  } catch { /* try next */ }

  // 3. Lingva (Google proxy, open source)
  try {
    const r = await fetch(
      `https://lingva.ml/api/v1/${s}/${t}/${encodeURIComponent(text)}`
    );
    if (r.ok) {
      const d = await r.json();
      const out = d?.translation as string;
      if (out && out.toLowerCase() !== text.toLowerCase()) return out;
    }
  } catch { /* give up */ }

  console.warn('[VoxTranslate] All APIs failed for:', text);
  return text;
}

// ── Public helper so Index.tsx can test translation ──────────────────────────
export async function testTranslation(): Promise<string> {
  return doTranslate('Ciao come stai', 'it', 'en');
}

// ── Hook ─────────────────────────────────────────────────────────────────────
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

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      const syncLang = () => {
        const { sourceLangCode } = useAppStore.getState();
        recognition.lang = sourceLangCode;
      };

      recognition.onstart = () => { isRecognizingRef.current = true; };

      recognition.onresult = (event: any) => {
        if (isSpeakingRef.current) return;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result?.isFinal) continue;

          const transcript = result[0]?.transcript?.trim?.() ?? '';
          if (!transcript) continue;

          // De-dupe
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

          // ★★★ ASYNC call to real translation ★★★
          doTranslate(transcript, actualSource, actualTarget).then((translated) => {
            console.log(`[VoxTranslate] "${transcript}" → "${translated}"`);

            addMessage({
              id: Date.now().toString() + Math.random().toString(36).slice(2),
              text: transcript,
              translatedText: translated,
              sourceLang: actualSource.slice(0, 2).toUpperCase(),
              targetLang: actualTarget.slice(0, 2).toUpperCase(),
              timestamp: Date.now(),
            });

            setStatus('speaking');

            speakTextWithSettings(translated, actualTarget, () => {
              isSpeakingRef.current = false;
              pausedForTtsRef.current = false;

              if (!shouldAutoRestartRef.current) { setStatus('idle'); return; }

              setStatus('listening');
              onResumeMic();

              syncLang();
              window.setTimeout(() => {
                if (!recognitionRef.current) return;
                if (!shouldAutoRestartRef.current) return;
                if (pausedForTtsRef.current) return;
                if (isRecognizingRef.current) return;
                try { recognition.start(); } catch {}
              }, 120);
            });
          });

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
