import React, { useRef, useEffect, useState } from "react";
import acaridiLogo from "@/assets/acaridi-logo.png";
import { Mic, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";

export const VoxLogo = () => (
  <img src={acaridiLogo} alt="ACaridi Digital App" className="h-10 w-auto" />
);

const LANGS = [
  { code: "it-IT", label: "Italiano", flag: "🇮🇹" },
  { code: "en-US", label: "English", flag: "🇬🇧" },
  { code: "es-ES", label: "Español", flag: "🇪🇸" },
  { code: "fr-FR", label: "Français", flag: "🇫🇷" },
  { code: "de-DE", label: "Deutsch", flag: "🇩🇪" },
  { code: "zh-CN", label: "中文", flag: "🇨🇳" },
  { code: "sq-AL", label: "Shqip", flag: "🇦🇱" },
];

const APP_LANGS = ["it", "en", "es", "fr", "de", "zh", "sq"];

function filterVoices(all: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const filtered = all.filter((v) => {
    const name = v.name.toLowerCase();
    const isGoogle = name.includes("google");
    const isAlice = name.toLowerCase() === "alice";
    return isGoogle || isAlice;
  });
  filtered.sort((a, b) => {
    const aAlice = a.name.toLowerCase() === "alice" ? -1 : 0;
    const bAlice = b.name.toLowerCase() === "alice" ? -1 : 0;
    if (aAlice !== bAlice) return aAlice - bAlice;
    return a.lang.localeCompare(b.lang);
  });
  return filtered.length > 0 ? filtered : all;
}

function bestVoiceForLang(voices: SpeechSynthesisVoice[], langCode: string, gender: "female" | "male"): SpeechSynthesisVoice | undefined {
  const prefix = langCode.slice(0, 2).toLowerCase();
  const FEMALE: Record<string, string[]> = {
    it: ["alice", "google italiano"],
    en: ["google us english", "google uk english female"],
    es: ["google español"],
    fr: ["google français"],
    de: ["google deutsch"],
    zh: ["google 普通话"],
    sq: ["google shqip"],
  };
  const MALE: Record<string, string[]> = {
    it: ["google italiano"],
    en: ["google uk english male", "google us english"],
    es: ["google español"],
    fr: ["google français"],
    de: ["google deutsch"],
    zh: ["google 普通话"],
    sq: ["google shqip"],
  };
  const preferred = gender === "female" ? (FEMALE[prefix] ?? []) : (MALE[prefix] ?? []);
  for (const p of preferred) {
    const v = voices.find((v) => v.name.toLowerCase().includes(p));
    if (v) return v;
  }
  return voices.find((v) => v.lang?.toLowerCase().startsWith(prefix));
}

export function LanguageSelector() {
  const source = useAppStore((s) => s.sourceLangCode);
  const target = useAppStore((s) => s.targetLangCode);
  const setSource = useAppStore((s) => s.setSourceLangCode);
  const setTarget = useAppStore((s) => s.setTargetLangCode);
  const swap = useAppStore((s) => s.swapLanguages);
  return (
    <div className="flex items-center gap-3 w-full">
      <Select value={source} onValueChange={setSource}>
        <SelectTrigger className="flex-1 h-12 rounded-2xl bg-card border border-border text-foreground font-semibold text-base">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGS.map((l) => <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <button onClick={swap} className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shrink-0">→</button>
      <Select value={target} onValueChange={setTarget}>
        <SelectTrigger className="flex-1 h-12 rounded-2xl bg-card border border-border text-foreground font-semibold text-base">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGS.map((l) => <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ListeningIndicator({ onToggle }: { onToggle: () => void }) {
  const status = useAppStore((s) => s.status);
  const audioLevel = useAppStore((s) => s.audioLevel);
  const isListening = status === "listening";
  const isProcessing = status === "processing";
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <AnimatePresence>
          {isListening && (
            <>
              <motion.div key="ring1" initial={{ scale: 1, opacity: 0.3 }} animate={{ scale: [1, 1.6], opacity: [0.3, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }} className="absolute inset-0 rounded-full bg-primary" />
              <motion.div key="ring2" initial={{ scale: 1, opacity: 0.2 }} animate={{ scale: [1, 1.4], opacity: [0.2, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut", delay: 0.3 }} className="absolute inset-0 rounded-full bg-primary" />
            </>
          )}
        </AnimatePresence>
        {isListening && audioLevel > 0.1 && (
          <motion.div animate={{ scale: 1 + audioLevel * 0.3, opacity: audioLevel * 0.5 }} transition={{ duration: 0.1 }} className="absolute inset-[-8px] rounded-full bg-primary/30 blur-md" />
        )}
        <motion.button whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.05 }} onClick={onToggle} className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center bg-primary shadow-lg transition-all duration-200">
          {isProcessing ? <Loader2 size={40} className="text-primary-foreground animate-spin" /> : <Mic size={50} className="text-primary-foreground" strokeWidth={2} />}
        </motion.button>
      </div>
      <p className="mt-5 text-base text-muted-foreground max-w-xs text-center leading-relaxed">
        {status === "idle" && "Speak naturally — Speak & Translate Live listens and translates"}
        {status === "listening" && "Listening..."}
        {status === "processing" && "Translating..."}
        {status === "speaking" && "Speaking..."}
      </p>
    </div>
  );
}

export function SettingsModal() {
  const isOpen = useAppStore((s) => s.isSettingsOpen);
  const setOpen = useAppStore((s) => s.setSettingsOpen);
  const sensitivity = useAppStore((s) => s.sensitivity);
  const setSensitivity = useAppStore((s) => s.setSensitivity);
  const volume = useAppStore((s) => s.volume);
  const setVolume = useAppStore((s) => s.setVolume);
  const voiceName = useAppStore((s) => s.voiceName);
  const setVoiceName = useAppStore((s) => s.setVoiceName);
  const speechRate = useAppStore((s) => s.speechRate);
  const setSpeechRate = useAppStore((s) => s.setSpeechRate);
  const speechPitch = useAppStore((s) => s.speechPitch);
  const setSpeechPitch = useAppStore((s) => s.setSpeechPitch);
  const targetLangCode = useAppStore((s) => s.targetLangCode);
  const userGender = useAppStore((s) => s.userGender);
  const setUserGender = useAppStore((s) => s.setUserGender);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    let retries = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const applyVoices = (all: SpeechSynthesisVoice[]) => {
      setVoices(filterVoices(all));
      setVoicesLoading(false);
    };

    const load = () => {
      const all = window.speechSynthesis.getVoices() || [];
      if (all.length > 0) {
        applyVoices(all);
      } else if (retries < 6) {
        // Retry fino a ~1.8s prima di dichiarare sconfitta
        retries++;
        retryTimer = setTimeout(load, 300);
      } else {
        setVoicesLoading(false);
      }
    };

    // onvoiceschanged è l'evento affidabile: interrompe i retry se si attiva prima
    window.speechSynthesis.onvoiceschanged = () => {
      if (retryTimer) clearTimeout(retryTimer);
      applyVoices(window.speechSynthesis.getVoices() || []);
    };

    load();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  useEffect(() => {
    if (!voices.length) return;
    const best = bestVoiceForLang(voices, targetLangCode, userGender);
    if (best) setVoiceName(best.name);
  }, [targetLangCode, userGender, voices, setVoiceName]);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl border-border bg-card max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl font-bold">Impostazioni</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          {/* GENDER */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Voce utente</label>
            <div className="flex gap-3">
              <button onClick={() => setUserGender("female")} className={`flex-1 h-11 rounded-2xl border text-sm font-semibold transition-colors ${userGender === "female" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"}`}>👩 Femminile</button>
              <button onClick={() => setUserGender("male")} className={`flex-1 h-11 rounded-2xl border text-sm font-semibold transition-colors ${userGender === "male" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"}`}>👨 Maschile</button>
            </div>
          </div>
          {/* SENSITIVITY */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Sensibilità Microfono</label>
              <span className="text-sm text-muted-foreground">{sensitivity}%</span>
            </div>
            <Slider value={[sensitivity]} onValueChange={(v) => setSensitivity(v[0])} max={100} step={1} />
          </div>
          {/* VOLUME */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Volume Riproduzione</label>
              <span className="text-sm text-muted-foreground">{volume}%</span>
            </div>
            <Slider value={[volume]} onValueChange={(v) => setVolume(v[0])} max={100} step={1} />
          </div>
          {/* VOICE */}
          <div className="space-y-4 border-t border-border pt-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Sintesi Vocale</h3>
              <p className="text-sm text-muted-foreground">Scegli la voce e regola le impostazioni</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                className="flex-1 h-11 rounded-2xl bg-card border border-border text-foreground px-3 text-sm"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
              >
                {voices.length === 0 && (
                  <option value="">
                    {voicesLoading ? 'Caricamento voci...' : 'Nessuna voce disponibile'}
                  </option>
                )}
                {voices.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
              </select>
              <button
                className="h-11 px-4 rounded-2xl bg-primary text-primary-foreground font-medium text-sm"
                onClick={() => {
                  const u = new SpeechSynthesisUtterance("Prova voce");
                  u.voice = speechSynthesis.getVoices().find((v) => v.name === voiceName) || null;
                  u.rate = speechRate; u.pitch = speechPitch;
                  speechSynthesis.speak(u);
                }}
              >Prova</button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Velocità — {speechRate.toFixed(2)}×</label>
              <Slider value={[speechRate]} onValueChange={(v) => setSpeechRate(v[0])} min={0.5} max={1.5} step={0.01} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Tono — {speechPitch.toFixed(2)}</label>
              <Slider value={[speechPitch]} onValueChange={(v) => setSpeechPitch(v[0])} min={0.5} max={1.5} step={0.01} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ConversationView() {
  const messages = useAppStore((s) => s.messages);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <p className="text-lg font-medium text-muted-foreground">Tap the microphone to start translating</p>
          <p className="text-sm text-muted-foreground mt-2 opacity-60">Speak naturally — Speak & Translate Live will detect and translate in real-time</p>
        </div>
      )}
      <AnimatePresence initial={false}>
        {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
      </AnimatePresence>
    </div>
  );
}

function MessageBubble({ msg }: { msg: { id: string; text: string; translatedText: string; sourceLang: string; targetLang: string } }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-1">
      <div className="bg-card border border-border rounded-2xl px-4 py-3 max-w-[85%] shadow-sm">
        <p className="text-foreground text-sm">{msg.text}</p>
        {msg.translatedText && <p className="text-primary text-sm font-medium mt-1">{msg.translatedText}</p>}
      </div>
    </motion.div>
  );
}
