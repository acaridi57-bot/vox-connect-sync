import { useAppStore } from '@/store/useAppStore';

function pickVoice(voiceName: string | undefined, lang: string): SpeechSynthesisVoice | undefined {
  if (!window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices?.length) return undefined;

  const langPrefix = lang.slice(0, 2).toLowerCase();

  // Force best available natural Chinese voice (female first, then male fallback)
  if (langPrefix === 'zh') {
    const zhVoices = voices.filter((v) => v.lang?.toLowerCase().startsWith('zh'));

    const femalePatterns = [
      /google\s*普通话（中国大陆）/i,
      /xiaoxiao/i,
      /tingting/i,
      /lili/i,
      /huihui/i,
      /xiaoyi/i,
    ];

    for (const p of femalePatterns) {
      const v = zhVoices.find((x) => p.test(x.name));
      if (v) return v;
    }

    // Male but natural fallback if female is unavailable
    const malePatterns = [/yunyang/i, /yunxi/i, /kangkang/i, /male/i];
    for (const p of malePatterns) {
      const v = zhVoices.find((x) => p.test(x.name));
      if (v) return v;
    }

    const naturalZh = zhVoices.find((v) => /natural|neural|google/i.test(v.name));
    if (naturalZh) return naturalZh;

    const zhVoice = zhVoices[0];
    if (zhVoice) return zhVoice;
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
    onEnd?.();
    return;
  }

  const { voiceName, speechRate, speechPitch, volume } = useAppStore.getState();

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
    console.log(`[TTS] Using voice: "${voice.name}" (${voice.lang}) for lang="${lang}"`);
  } else {
    console.warn(`[TTS] No voice found for lang="${lang}"`);
  }

  let doneCalled = false;
  const done = () => {
    if (doneCalled) return;
    doneCalled = true;
    onEnd?.();
  };

  // Fail-safe so UI never stays “stuck” if the browser doesn't fire onend.
  const failSafe = window.setTimeout(done, 15000);

  utterance.onend = () => {
    window.clearTimeout(failSafe);
    done();
  };
  utterance.onerror = () => {
    window.clearTimeout(failSafe);
    done();
  };

  window.speechSynthesis.speak(utterance);
}
