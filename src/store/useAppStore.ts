import { create } from 'zustand';

export type Language = { code: string; label: string; };
export type UserGender = 'female' | 'male';

export const LANGUAGES: Language[] = [
  { code: 'it-IT', label: 'Italiano' },
  { code: 'en-US', label: 'English' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'zh-CN', label: '中文' },
  { code: 'sq-AL', label: 'Shqip' },
];

export type Message = {
  id: string;
  text: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
};

export type AppStatus = 'idle' | 'listening' | 'processing' | 'speaking';

type AppState = {
  status: AppStatus;
  sourceLangCode: string;
  targetLangCode: string;
  messages: Message[];
  audioLevel: number;
  isSettingsOpen: boolean;
  sensitivity: number;
  volume: number;
  fastMode: boolean;
  noiseReduction: boolean;
  voiceName: string;
  speechRate: number;
  speechPitch: number;
  userGender: UserGender;
  clearMessages: () => void;
  setStatus: (s: AppStatus) => void;
  setSourceLangCode: (code: string) => void;
  setTargetLangCode: (code: string) => void;
  swapLanguages: () => void;
  addMessage: (m: Message) => void;
  setAudioLevel: (l: number) => void;
  setSettingsOpen: (o: boolean) => void;
  setSensitivity: (s: number) => void;
  setVolume: (v: number) => void;
  setFastMode: (f: boolean) => void;
  setNoiseReduction: (n: boolean) => void;
  setVoiceName: (v: string) => void;
  setSpeechRate: (r: number) => void;
  setSpeechPitch: (p: number) => void;
  setUserGender: (g: UserGender) => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  status: 'idle',
  sourceLangCode: 'it-IT',
  targetLangCode: 'en-US',
  messages: [],
  audioLevel: 0,
  isSettingsOpen: false,
  sensitivity: 50,
  volume: 80,
  fastMode: false,
  noiseReduction: true,
  voiceName: 'Alice',
  speechRate: 0.9,
  speechPitch: 0.8,
  userGender: 'female',
  clearMessages: () => set({ messages: [] }),
  setStatus: (s) => set({ status: s }),
  setSourceLangCode: (code) => set({ sourceLangCode: code }),
  setTargetLangCode: (code) => set({ targetLangCode: code }),
  swapLanguages: () => {
    const { sourceLangCode, targetLangCode } = get();
    set({ sourceLangCode: targetLangCode, targetLangCode: sourceLangCode });
  },
  addMessage: (m) => set((state) => ({ messages: [...state.messages, m] })),
  setAudioLevel: (l) => set({ audioLevel: l }),
  setSettingsOpen: (o) => set({ isSettingsOpen: o }),
  setSensitivity: (s) => set({ sensitivity: s }),
  setVolume: (v) => set({ volume: v }),
  setFastMode: (f) => set({ fastMode: f }),
  setNoiseReduction: (n) => set({ noiseReduction: n }),
  setVoiceName: (v) => set({ voiceName: v }),
  setSpeechRate: (r) => set({ speechRate: r }),
  setSpeechPitch: (p) => set({ speechPitch: p }),
  setUserGender: (g) => set({ userGender: g }),
}));
