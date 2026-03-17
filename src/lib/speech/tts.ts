import { useAppStore } from '@/store/useAppStore';

const ENDPOINT = 'https://speaklive-tts-backend-production.up.railway.app/api/tts';

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

// Browser fallback — used only if OpenAI is unavailable
function speakWithBrowser(text: string, lang: string, onEnd?: () => void) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  const { speechRate, speechPitch, volume } = useAppStore.getState();
  stopCurrentAudio();
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = typeof speechRate === 'number' ? speechRate : 0.9;
  u.pitch = typeof speechPitch === 'number' ? speechPitch : 0.8;
  u.volume = typeof volume === 'number' ? clamp(volume / 100, 0, 1) : 1;
  // Try Alice first, then any voice for the language
  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((v) => v.name === 'Alice') ??
    voices.find((v) => v.lang?.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase())) ??
    voices[0];
  if (voice) u.voice = voice;
  let done = false;
  const finish = () => { if (done) return; done = true; onEnd?.(); };
  const t = window.setTimeout(finish, 15000);
  u.onend = () => { clearTimeout(t); finish(); };
  u.onerror = () => { clearTimeout(t); finish(); };
  window.speechSynthesis.speak(u);
}

// OpenAI voice instruction per language
function getInstructions(lang: string, gender: 'female' | 'male'): string {
  const langCode = lang.slice(0, 2).toLowerCase();
  const tone = gender === 'female'
    ? 'warm, clear, natural female voice'
    : 'warm, clear, natural male voice';
  const map: Record<string, string> = {
    it: `Speak Italian with a ${tone}. Natural Italian pronunciation. Professional tone.`,
    en: `Speak English with a ${tone}. Clear pronunciation. Professional tone.`,
    es: `Speak Spanish with a ${tone}. Clear Spanish pronunciation. Professional tone.`,
    fr: `Speak French with a ${tone}. Clear French pronunciation. Professional tone.`,
    de: `Speak German with a ${tone}. Clear German pronunciation. Professional tone.`,
    zh: `Speak Mandarin Chinese with a ${tone}. Clear pronunciation. Professional tone.`,
    sq: `Speak Albanian with a ${tone}. Clear pronunciation. Professional tone.`,
  };
  return map[langCode] ?? `Speak with a ${tone}. Professional tone.`;
}

export async function speakTextWithSettings(text: string, lang: string, onEnd?: () => void) {
  const clean = text?.trim();
  if (!clean) { onEnd?.(); return; }

  const { volume, speechRate, userGender } = useAppStore.getState();
  const voice = userGender === 'male' ? 'cedar' : 'marin';

  try {
    stopCurrentAudio();
    window.speechSynthesis?.cancel();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        text: clean.slice(0, 4096),
        lang,
        voice,
        speed: typeof speechRate === 'number' ? speechRate : 1,
        instructions: getInstructions(lang, userGender),
      }),
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`TTS ${response.status}`);

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    audio.src = url;
    audio.volume = typeof volume === 'number' ? clamp(volume / 100, 0, 1) : 1;
    currentAudio = audio;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      onEnd?.();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      console.warn('[VT] OpenAI failed → browser fallback');
      speakWithBrowser(clean, lang, onEnd);
    };

    await audio.play();
    console.log(`[VT TTS] OpenAI "${voice}" lang=${lang}`);

  } catch (err) {
    console.warn('[VT] OpenAI unavailable → browser fallback:', err);
    speakWithBrowser(clean, lang, onEnd);
  }
}

export function stopSpeaking() {
  stopCurrentAudio();
  window.speechSynthesis?.cancel();
}
