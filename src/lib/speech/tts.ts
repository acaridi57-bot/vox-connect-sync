import { useAppStore } from '@/store/useAppStore';

const ROBOTIC = ['compact','espeak','festival','flite','mbrola','pico','svox','loquendo',
  'microsoft david','microsoft mark','microsoft zira','microsoft hazel',
  'microsoft susan','microsoft george'];

const NATURAL_BOOST = ['neural','natural','enhanced','premium','wavenet','studio','google','siri'];

// Known female voice name fragments per language
const FEMALE: Record<string, string[]> = {
  it: ['alice','google italiano','federica','paola','flo (italiano'],
  en: ['samantha','google us english','karen','victoria','google uk english female','kathy'],
  es: ['paulina','monica','google español','flo (spagnolo'],
  fr: ['amelie','amélie','marie','google français','flo (francese'],
  de: ['anna','google deutsch','flo (tedesco'],
  zh: ['google 普通话','普通话','ting-ting','mei-jia','li-mu','yu-shu'],
  sq: ['google shqip'],
};

// Known male voice name fragments per language
const MALE: Record<string, string[]> = {
  it: ['luca','eddy (italiano','google italiano'],
  en: ['google uk english male','daniel','arthur','ralph','google us english'],
  es: ['jorge','google español'],
  fr: ['thomas','jacques','google français'],
  de: ['yannick','google deutsch','martin'],
  zh: ['google 普通话','普通话'],
  sq: ['google shqip'],
};

function pickVoice(lang: string, gender: 'female' | 'male'): SpeechSynthesisVoice | undefined {
  if (!window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices?.length) return undefined;

  const lp = lang.slice(0, 2).toLowerCase();
  const preferred = gender === 'female' ? (FEMALE[lp] ?? []) : (MALE[lp] ?? []);

  // 1. Exact preferred name match
  for (const p of preferred) {
    const v = voices.find((v) => v.name.toLowerCase().includes(p));
    if (v) return v;
  }

  // 2. Score all voices for this language
  const scored = voices
    .map((v) => {
      const n = v.name.toLowerCase();
      if (ROBOTIC.some((r) => n.includes(r))) return { v, s: -1 };
      let s = 0;
      if (v.lang?.toLowerCase().startsWith(lp)) s += 10;
      if (NATURAL_BOOST.some((k) => n.includes(k))) s += 5;
      return { v, s };
    })
    .filter(({ s }) => s >= 0)
    .sort((a, b) => b.s - a.s);

  return scored[0]?.v;
}

export function speakTextWithSettings(text: string, lang: string, onEnd?: () => void) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  const { speechRate, speechPitch, volume, userGender } = useAppStore.getState();
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = typeof speechRate === 'number' ? speechRate : 1;
  u.pitch = typeof speechPitch === 'number' ? speechPitch : 1;
  u.volume = typeof volume === 'number' ? Math.min(Math.max(volume / 100, 0), 1) : 1;
  const voice = pickVoice(lang, userGender);
  if (voice) { u.voice = voice; console.log(`[VT TTS] "${voice.name}" (${userGender}: ${lang})`); }
  let done = false;
  const finish = () => { if (done) return; done = true; onEnd?.(); };
  const t = window.setTimeout(finish, 15000);
  u.onend = () => { clearTimeout(t); finish(); };
  u.onerror = () => { clearTimeout(t); finish(); };
  window.speechSynthesis.speak(u);
}
