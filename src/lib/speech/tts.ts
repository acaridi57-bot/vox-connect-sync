import { useAppStore } from '@/store/useAppStore';

function pickVoice(voiceName: string | undefined, lang: string): SpeechSynthesisVoice | undefined {
  if (!window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices?.length) return undefined;

  const langPrefix = lang.slice(0, 2).toLowerCase();

  // Force Google Mandarin (Mainland China) voice for Chinese
  if (langPrefix === 'zh') {
    const zhVoices = voices.filter((v) => v.lang?.toLowerCase().startsWith('zh'));

    // Priority: Google 普通话（中国大陆） — female Google Mandarin voice
    const googleZh = zhVoices.find((v) => /google.*普通话/i.test(v.name));
    if (googleZh) return googleZh;

    // Fallback: any Google zh voice
    const anyGoogleZh = zhVoices.find((v) => /google/i.test(v.name));
    if (anyGoogleZh) return anyGoogleZh;

    // Last resort: first zh voice available
    if (zhVoices.length) return zhVoices[0];
  }

  // Use user-selected voice if set
  if (voiceName) {
    const v = voices.find((x) => x.name === voiceName);
    if (v) return v;
  }

  // Fallback: match by language prefix
  return voices.find((v) => v.lang?.toLowerCase().startsWith(langPrefix));
}

export function speakTextWithSettings(text: string, lang: string, onEnd?: () => void) {
  if (!window.speechSynthesis) {
    console.warn('[TTS] speechSynthesis not available');
    onEnd?.();
    return;
  }

  const { voiceName, speechRate, speechPitch, volume } = useAppStore.getState();

  console.log(`[TTS] Speaking: "${text.slice(0, 60)}" lang=${lang} vol=${volume} rate=${speechRate} pitch=${speechPitch}`);

  window.speechSynthesis.cancel();

  const isChinese = lang.slice(0, 2).toLowerCase() === 'zh';

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = isChinese ? 0.9 : (typeof speechRate === 'number' ? speechRate : 1);
  utterance.pitch = isChinese ? 0.99 : (typeof speechPitch === 'number' ? speechPitch : 1);
  utterance.volume = typeof volume === 'number' ? Math.min(Math.max(volume / 100, 0), 1) : 1;

  const voice = pickVoice(voiceName, lang);
  if (voice) {
    utterance.voice = voice;
    console.log(`[TTS] Voice: "${voice.name}" (${voice.lang})`);
  } else {
    console.warn(`[TTS] No voice found for lang="${lang}", using browser default`);
  }

  let doneCalled = false;
  const done = () => {
    if (doneCalled) return;
    doneCalled = true;
    onEnd?.();
  };

  const failSafe = window.setTimeout(done, 15000);

  utterance.onend = () => {
    console.log('[TTS] onend fired');
    window.clearTimeout(failSafe);
    done();
  };

  utterance.onerror = (e) => {
    console.error('[TTS] onerror:', e);
    window.clearTimeout(failSafe);
    done();
  };

  // Chrome bug workaround: voices may not be loaded on first call
  const allVoices = window.speechSynthesis.getVoices();
  if (!allVoices.length) {
    console.log('[TTS] Voices not loaded yet, waiting for voiceschanged...');
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      const v2 = pickVoice(voiceName, lang);
      if (v2) {
        utterance.voice = v2;
        console.log(`[TTS] Late voice loaded: "${v2.name}"`);
      }
      window.speechSynthesis.speak(utterance);
    };
    return;
  }

  window.speechSynthesis.speak(utterance);
}
