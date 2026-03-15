import { useAppStore } from '@/store/useAppStore';

function pickVoice(voiceName: string | undefined, lang: string): SpeechSynthesisVoice | undefined {
  if (!window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices?.length) return undefined;

  const langPrefix = lang.slice(0, 2).toLowerCase();

  // Force Chinese voice
  if (langPrefix === 'zh') {
    const zh = voices.find((v) => v.name.includes('普通话') || v.lang === 'zh-CN');
    if (zh) return zh;
  }

  if (voiceName) {
    const v = voices.find((x) => x.name === voiceName);
    if (v) return v;
  }

  return voices.find((v) => v.lang?.toLowerCase().startsWith(langPrefix));
}

export function speakTextWithSettings(text: string, lang: string, onEnd?: () => void) {
  if (!window.speechSynthesis) {
    onEnd?.();
    return;
  }

  const { voiceName, speechRate, speechPitch, volume } = useAppStore.getState();

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = typeof speechRate === 'number' ? speechRate : 1;
  utterance.pitch = typeof speechPitch === 'number' ? speechPitch : 1;
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
