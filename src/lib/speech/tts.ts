import { useAppStore } from '@/store/useAppStore';

function pickVoice(voiceName: string | undefined, lang: string): SpeechSynthesisVoice | undefined {
  if (!window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices?.length) return undefined;

  const langPrefix = lang.slice(0, 2).toLowerCase();

  // Force female voice for Chinese
  if (langPrefix === 'zh') {
    // Prefer known female Chinese voices
    const femaleNames = [
      'Google 普通话（中国大陆）',
      'Tingting',
      'Lili',
      'Microsoft Xiaoxiao Online (Natural)',
      'Microsoft Huihui',
    ];
    for (const name of femaleNames) {
      const v = voices.find((x) => x.name === name);
      if (v) return v;
    }
    // Fallback: any zh-CN voice
    const zhVoice = voices.find((v) =>
      v.lang === 'zh-CN' || v.lang?.startsWith('zh')
    );
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
  if (voice) utterance.voice = voice;

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
