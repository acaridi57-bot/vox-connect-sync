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

function pickBrowserVoice(voiceName: string, lang: string): SpeechSynthesisVoice | undefined {
  if (!window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices?.length) return undefined;
  // Exact match by name
  const exact = voices.find((v) => v.name === voiceName);
  if (exact) return exact;
  // Fallback: Alice
  const alice = voices.find((v) => v.name.toLowerCase().includes('alice'));
  if (alice) return alice;
  // Fallback: match language
  const langPrefix = lang.slice(0, 2).toLowerCase();
  return voices.find((v) => v.lang?.toLowerCase().startsWith(langPrefix)) ?? voices[0];
}

function speakWithBrowser(text: string, lang: string, onEnd?: () => void) {
  if (!window.speechSynthesis) { onEnd?.(); return; }

  const { speechRate, speechPitch, volume, voiceName } = useAppStore.getState();

  stopCurrentAudio();
  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = typeof speechRate === 'number' ? speechRate : 0.9;
  u.pitch = typeof speechPitch === 'number' ? speechPitch : 0.8;
  u.volume = typeof volume === 'number' ? clamp(volume / 100, 0, 1) : 1;

  const voice = pickBrowserVoice(voiceName, lang);
  if (voice) {
    u.voice = voice;
    console.log(`[VT TTS browser] "${voice.name}" lang=${lang}`);
  }

  let done = false;
  const finish = () => { if (done) return; done = true; onEnd?.(); };
  const t = window.setTimeout(finish, 15000);
  u.onend = () => { clearTimeout(t); finish(); };
  u.onerror = (e) => {
    console.warn('[VT TTS browser error]', e);
    clearTimeout(t);
    finish();
  };
  window.speechSynthesis.speak(u);
}

export async function speakTextWithSettings(text: string, lang: string, onEnd?: () => void) {
  const clean = text?.trim();
  if (!clean) { onEnd?.(); return; }

  const { volume, speechRate, userGender } = useAppStore.getState();
  const openaiVoice = userGender === 'male' ? 'cedar' : 'marin';

  try {
    stopCurrentAudio();
    window.speechSynthesis?.cancel();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        text: clean.slice(0, 4096),
        lang,
        voice: openaiVoice,
        speed: typeof speechRate === 'number' ? speechRate : 1,
      }),
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`TTS ${response.status}`);

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // iOS Safari fix: create audio element inline
    const audio = new Audio();
    audio.src = url;
    audio.volume = typeof volume === 'number' ? clamp(volume / 100, 0, 1) : 1;
    currentAudio = audio;

    await audio.play();

    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      onEnd?.();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      console.warn('[VT] OpenAI failed → browser');
      speakWithBrowser(clean, lang, onEnd);
    };

  } catch (err) {
    console.warn('[VT] OpenAI unavailable → browser:', err);
    speakWithBrowser(clean, lang, onEnd);
  }
}

export function stopSpeaking() {
  stopCurrentAudio();
  window.speechSynthesis?.cancel();
}
