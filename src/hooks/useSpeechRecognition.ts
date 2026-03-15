import { useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { shouldFlipDirection } from '@/lib/speech/langDetect';
import { speakTextWithSettings } from '@/lib/speech/tts';

// ── Inline translation — no external module needed ──────────────────────────
async function doTranslate(text: string, src: string, tgt: string): Promise<string> {
  const input = text.trim();
  if (!input) return text;

  const s = src.slice(0, 2).toLowerCase();
  const t = tgt.slice(0, 2).toLowerCase();
  if (s === t) return input;

  // Fix Chinese code for APIs
  const apiCode: Record<string, string> = { zh: 'zh-CN' };
  const sApi = apiCode[s] ?? s;
  const tApi = apiCode[t] ?? t;

  const normalize = (v: string) =>
    v
      .toLowerCase()
      .replace(/[\s.,!?;:'"“”‘’()\[\]{}\-_\/\\|]+/g, '');

  const isDifferent = (out: string) => {
    const cleanOut = normalize(out);
    const cleanInput = normalize(input);
    return Boolean(cleanOut) && cleanOut !== cleanInput;
  };

  const tryMyMemory = async (): Promise<string | null> => {
    try {
      const r = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=${sApi}|${tApi}`
      );
      if (!r.ok) return null;
      const d = await r.json();
      const out = d?.responseData?.translatedText as string | undefined;
      if (d?.responseStatus === 200 && out && isDifferent(out)) return out;
    } catch {}
    return null;
  };

  const tryGoogle = async (sourceLang: string): Promise<string | null> => {
    try {
      const r = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${tApi}&dt=t&q=${encodeURIComponent(input)}`
      );
      if (!r.ok) return null;
      const d = await r.json();
      const out: string = (d?.[0] ?? []).map((c: any[]) => c?.[0] ?? '').join('');
      if (out && isDifferent(out)) return out;
    } catch {}
    return null;
  };

  // For Chinese output, prioritize Google first (more natural/consistent than MyMemory).
  if (tApi === 'zh-CN') {
    const gFirst = await tryGoogle(sApi);
    if (gFirst) return gFirst;
  }

  const mm = await tryMyMemory();
  if (mm) return mm;

  const g = await tryGoogle(sApi);
  if (g) return g;

  const gAuto = await tryGoogle('auto');
  if (gAuto) return gAuto;

  return input;
}

// ── Public helper so Index.tsx can test translation ──────────────────────────
export async function testTranslation(): Promise<string> {
  const { sourceLangCode, targetLangCode } = useAppStore.getState();
  const result = await doTranslate('Ciao come stai', sourceLangCode, targetLangCode);
  const zhTest = await doTranslate('你好吗', 'zh', 'it');
  return `IT→${targetLangCode.slice(0,2).toUpperCase()}: "${result}" | ZH→IT: "${zhTest}"`;
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
