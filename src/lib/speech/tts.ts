import { useAppStore } from '@/store/useAppStore';

// ── Keywords that indicate a natural/neural/human voice ──────────────────────
const NATURAL_KEYWORDS = [
  'neural', 'natural', 'enhanced', 'premium', 'wavenet',
  'studio', 'journey', 'news', 'polyglot', 'eloquence',
  'google', 'siri', // Google & Siri voices are always high quality
];

// ── Keywords that indicate a robotic/low-quality voice — skip these ──────────
const ROBOTIC_KEYWORDS = [
  'compact', 'espeak', 'festival', 'flite', 'mbrola',
  'pico', 'svox', 'loquendo', 'eloqui', 'vocalizer',
  'microsoft david', 'microsoft mark', 'microsoft zira', // old MS voices
  'microsoft hazel', 'microsoft susan', 'microsoft george',
];

// ── Preferred female voice names per language ────────────────────────────────
const FEMALE_PREFERRED: Record<string, string[]> = {
  it: ['Alice', 'Google italiano', 'Federica', 'Paola', 'Elsa'],
  en: ['Samantha', 'Google US English', 'Karen', 'Moira', 'Victoria', 'Tessa', 'Google UK English Female'],
  es: ['Paulina', 'Google español', 'Monica', 'Google español de Estados Unidos'],
  fr: ['Amelie', 'Google français', 'Thomas'],
  de: ['Anna', 'Google Deutsch', 'Petra'],
  zh: ['Google 普通话（中国大陆）', 'Google 中文（普通话）', 'Ting-Ting', 'Mei-Jia'],
  sq: ['Google shqip', 'Google Albanian'],
};

function scoreVoice(voice: SpeechSynthesisVoice, langPrefix: string): number {
  const name = voice.name.toLowerCase();

  // Immediately discard robotic voices
  if (ROBOTIC_KEYWORDS.some((k) => name.includes(k.toLowerCase()))) return -1;

  let score = 0;

  // Prefer voices matching the language
  if (voice.lang?.toLowerCase().startsWith(langPrefix)) score += 10;

  // Prefer natural/neural voices
  if (NATURAL_KEYWORDS.some((k) => name.includes(k))) score += 5;

  // Prefer female voices (common female name fragments)
  const femaleFragments = ['alice', 'samantha', 'karen', 'victoria', 'amelie', 'anna',
    'paola', 'federica', 'monica', 'paulina', 'ting', 'mei', 'female', 'donna', 'femme'];
  if (femaleFragments.some((f) => name.includes(f))) score += 3;

  return score;
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  if (!window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices?.length) return undefined;

  const langPrefix = lang.slice(0, 2).toLowerCase();

  // 1. Try explicit preferred list for this language first
  const preferred = FEMALE_PREFERRED[langPrefix] ?? [];
  for (const pref of preferred) {
    const v = voices.find((v) => v.name.toLowerCase().includes(pref.toLowerCase()));
    if (v) return v;
  }

  // 2. Score all voices and pick best
  const candidates = voices
    .map((v) => ({ v, score: scoreVoice(v, langPrefix) }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.v;
}

export function speakTextWithSettings(text: string, lang: string, onEnd?: () => void) {
  if (!window.speechSynthesis) { onEnd?.(); return; }

  const { speechRate, speechPitch, volume } = useAppStore.getState();

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = typeof speechRate === 'number' ? speechRate : 1;
  utterance.pitch = typeof speechPitch === 'number' ? speechPitch : 1;
  utterance.volume = typeof volume === 'number' ? Math.min(Math.max(volume / 100, 0), 1) : 1;

  const voice = pickVoice(lang);
  if (voice) {
    utterance.voice = voice;
    console.log(`[VT TTS] Using voice: "${voice.name}" for lang: ${lang}`);
  }

  let doneCalled = false;
  const done = () => { if (doneCalled) return; doneCalled = true; onEnd?.(); };
  const failSafe = window.setTimeout(done, 15000);
  utterance.onend = () => { window.clearTimeout(failSafe); done(); };
  utterance.onerror = () => { window.clearTimeout(failSafe); done(); };

  window.speechSynthesis.speak(utterance);
}
