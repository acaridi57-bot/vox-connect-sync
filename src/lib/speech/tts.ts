import { useAppStore } from '@/store/useAppStore';

const OPENAI_VOICES = ['marin','cedar','onyx','ash','alloy','echo','fable','nova','shimmer'];
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

function pickBrowserVoice(voiceName: string): SpeechSynthesisVoice | undefined {
  if (!window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices?.length) return undefined;
  // Exact match
  const exact = voices.find((v) => v.name === voiceName);
  if (exact) return exact;
  // Fallback: Alice
  return voices.find((v) => v.name.toLowerCase().includes('alice')) ?? voices[0];
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

  // Use selected voice if it's a browser voice, otherwise Alice
  const browserVoiceName = OPENAI_VOICES.includes(voiceName) ? 'Alice' : voiceName;
  const voice = pickBrowserVoice(browserVoiceName);
  if (voice) {
    u.voice = voice;
    console.log(`[VT TTS browser] "${voice.name}"`);
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

  const { volume, speechRate, voiceName, userGender } = useAppStore.getState();

  // Determine which OpenAI voice to use
  const openaiVoice = OPENAI_VOICES.includes(voiceName)
    ? voiceName  // Use exactly what user selected (marin or cedar)
    : userGender === 'male' ? 'cedar' : 'marin'; // Default by gender

  console.log(`[VT TTS] Using voice: "${openaiVoice}" for lang: ${lang}`);

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

    if (!response.ok) throw new Error(`TTS error ${response.status}`);

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    audio.volume = typeof volume === 'number' ? clamp(volume / 100, 0, 1) : 1;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      onEnd?.();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      console.warn('[VT TTS] OpenAI failed → browser fallback');
      speakWithBrowser(clean, lang, onEnd);
    };

    await audio.play();
  } catch (err) {
    console.warn('[VT TTS] OpenAI unavailable → browser fallback:', err);
    speakWithBrowser(clean, lang, onEnd);
  }
}

export function stopSpeaking() {
  stopCurrentAudio();
  window.speechSynthesis?.cancel();
}
