import { create } from 'zustand';

export type LanguagePair = {
  langA: string;
  langB: string;
  labelA: string;
  labelB: string;
};

export type Message = {
  id: string;
  text: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
};

export type AppStatus = 'idle' | 'listening' | 'processing' | 'speaking';

export const LANGUAGE_PAIRS: LanguagePair[] = [
  { langA: 'it-IT', langB: 'en-US', labelA: 'Italiano', labelB: 'English' },
  { langA: 'it-IT', langB: 'es-ES', labelA: 'Italiano', labelB: 'Español' },
  { langA: 'it-IT', langB: 'fr-FR', labelA: 'Italiano', labelB: 'Français' },
  { langA: 'it-IT', langB: 'de-DE', labelA: 'Italiano', labelB: 'Deutsch' },
  { langA: 'it-IT', langB: 'zh-CN', labelA: 'Italiano', labelB: '中文' },
];

type AppState = {
  status: AppStatus;
  selectedPairIndex: number;
  messages: Message[];
  audioLevel: number;
  isSettingsOpen: boolean;
  sensitivity: number;
  volume: number;
  fastMode: boolean;
  noiseReduction: boolean;

  setStatus: (s: AppStatus) => void;
  setSelectedPairIndex: (i: number) => void;
  addMessage: (m: Message) => void;
  setAudioLevel: (l: number) => void;
  setSettingsOpen: (o: boolean) => void;
  setSensitivity: (s: number) => void;
  setVolume: (v: number) => void;
  setFastMode: (f: boolean) => void;
  setNoiseReduction: (n: boolean) => void;
  getSelectedPair: () => LanguagePair;
};

export const useAppStore = create<AppState>((set, get) => ({
  status: 'idle',
  selectedPairIndex: 0,
  messages: [],
  audioLevel: 0,
  isSettingsOpen: false,
  sensitivity: 50,
  volume: 80,
  fastMode: false,
  noiseReduction: true,

  setStatus: (s) => set({ status: s }),
  setSelectedPairIndex: (i) => set({ selectedPairIndex: i }),
  addMessage: (m) => set((state) => ({ messages: [...state.messages, m] })),
  setAudioLevel: (l) => set({ audioLevel: l }),
  setSettingsOpen: (o) => set({ isSettingsOpen: o }),
  setSensitivity: (s) => set({ sensitivity: s }),
  setVolume: (v) => set({ volume: v }),
  setFastMode: (f) => set({ fastMode: f }),
  setNoiseReduction: (n) => set({ noiseReduction: n }),
  getSelectedPair: () => LANGUAGE_PAIRS[get().selectedPairIndex],
}));
