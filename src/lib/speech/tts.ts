import { useAppStore } from '@/store/useAppStore';

const ROBOTIC = [
  'compact','espeak','festival','flite','mbrola','pico','svox','loquendo',
  'microsoft david','microsoft mark','microsoft zira','microsoft hazel',
  'microsoft susan','microsoft george',
];

const NATURAL_BOOST = ['neural','natural','enhanced','premium','wavenet','studio','google','siri'];

const FEMALE: Record<string, string[]> = {
  it: ['alice','google italiano','federica','paola'],
  en: ['samantha','google us english','karen','victoria','google uk english female'],
  es: ['paulina','monica','google español'],
  fr: ['amelie','amélie','marie','google français'],
  de: ['anna','google deutsch'],
  zh: ['google 普通话','普通话','ting-ting','mei-jia','li-mu','yu-shu'],
  sq: ['google shqip'],
};

const MALE: Record<string, string[]> = {
  it: ['luca','eddy (italiano','google italiano'],
  en: ['google uk english male','daniel','arthur','ralph','google us english'],
  es: ['jorge','google español'],
  fr: ['thomas','jacques','google français'],
  de: ['yannick','google deutsch','martin'],
  zh: ['google 普通话','普通话'],
  sq: ['google shqip'],
};

let currentAudio: HTMLAudioElement | null = null;

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

function pickVoiceByName(voiceName?: string): SpeechSynthesisVoice | undefined {
  if (!window.speechSynthesis || !voiceName) return undefined;
  return window.speechSynthesis.getVoices().find((v) => v.name === voiceName);
}

function pickVoice(lang: string, gender: 'female' | 'male', voiceName?: string): SpeechSynthesisVoice | undefined {
  if (!window.speechSynthesis) return undefined;

  // Always respect user's manual selection first
  const selected = pickVoiceByName(voiceName);
  if (selected) return selected;

  const voices = window.speechSynthesis.getVoices();
  if (!voices?.length) return undefined;

  const lp = lang.slice(0, 2).toLowerCase();
  const preferred = gender === 'female' ? (FEMALE[lp] ?? []) : (MALE[lp] ?? []);

  for (const p of preferred) {
    const v = voices.find((v) => v.name.toLowerCase().includes(p));
    if (v) return v;
  }

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

function speakWithBrowser(text: string, lang: string, onEnd?: () => void) {
  if (!window.speechSynthesis) { onEnd?.(); return; }

  const { speechRate, speechPitch, volume, userGender, voiceName } = useAppStore.getState();

  stopCurrentAudio();
  window.speechSynthesis.cancel();
  
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = typeof speechRate === 'number' ? speechRate : 1;
  u.pitch = typeof speechPitch === 'number' ? speechPitch : 1;
  u.volume = typeof volume === 'number' ? clamp(volume / 100, 0, 1) : 1;

  const voice = pickVoice(lang, userGender, voiceName);
  if (voice) {
    u.voice = voice;
    console.log(`[VT TTS browser] "${voice.name}" (${userGender}: ${lang})`);
  }

  let done = false;
  const finish = () => { if (done) return; done = true; onEnd?.(); };
  const t = window.setTimeout(finish, 15000);
  u.onend = () => { clearTimeout(t); finish(); };
  u.onerror = () => { clearTimeout(t); finish(); };
  window.speechSynthesis.speak(u);
}

export async function speakTextWithSettings(text: string, lang: string, onEnd?: () => void) {
  const clean = text?.trim();
  if (!clean) { onEnd?.(); return; }

  // Fast path: always use device/browser TTS for instant playback.
  speakWithBrowser(clean, lang, onEnd);
}

export function stopSpeaking() {
  stopCurrentAudio();
  window.speechSynthesis?.cancel();
}