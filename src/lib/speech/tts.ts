import { useAppStore } from '@/store/useAppStore';

const ROBOTIC = ['compact','espeak','festival','flite','mbrola','pico','svox',
  'microsoft david','microsoft mark','microsoft zira','microsoft hazel',
  'microsoft susan','microsoft george'];

const NATURAL = ['neural','natural','enhanced','premium','wavenet','studio','google','siri'];

const FEMALE_PREF: Record<string, string[]> = {
  it: ['alice','google italiano','federica','paola'],
  en: ['samantha','google us english','karen','victoria','google uk english female'],
  es: ['paulina','google español','monica'],
  fr: ['amelie','google français'],
  de: ['anna','google deutsch'],
  zh: ['google 普通话','普通话','ting-ting','mei-jia'],
  sq: ['google shqip','google albanian'],
};

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  if (!window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices?.length) return undefined;
  const lp = lang.slice(0, 2).toLowerCase();

  const pref = FEMALE_PREF[lp] ?? [];
  for (const p of pref) {
    const v = voices.find((v) => v.name.toLowerCase().includes(p));
    if (v) return v;
  }

  const scored = voices
    .map((v) => {
      const n = v.name.toLowerCase();
      if (ROBOTIC.some((r) => n.includes(r))) return { v, s: -1 };
      let s = 0;
      if (v.lang?.toLowerCase().startsWith(lp)) s += 10;
      if (NATURAL.some((k) => n.includes(k))) s += 5;
      return { v, s };
    })
    .filter(({ s }) => s >= 0)
    .sort((a, b) => b.s - a.s);

  return scored[0]?.v;
}

export function speakTextWithSettings(text: string, lang: string, onEnd?: () => void) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  const { speechRate, speechPitch, volume } = useAppStore.getState();
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = typeof speechRate === 'number' ? speechRate : 1;
  u.pitch = typeof speechPitch === 'number' ? speechPitch : 1;
  u.volume = typeof volume === 'number' ? Math.min(Math.max(volume / 100, 0), 1) : 1;
  const voice = pickVoice(lang);
  if (voice) { u.voice = voice; console.log(`[VT TTS] "${voice.name}" (${lang})`); }
  let done = false;
  const finish = () => { if (done) return; done = true; onEnd?.(); };
  const t = window.setTimeout(finish, 15000);
  u.onend = () => { clearTimeout(t); finish(); };
  u.onerror = () => { clearTimeout(t); finish(); };
  window.speechSynthesis.speak(u);
}
