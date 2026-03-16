import React, { useRef, useEffect, useState } from "react";
import { Mic, Loader2, ChevronRight, Check, ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";
import { getStrings, detectSystemLang, APP_LANGUAGES, type AppLang } from "@/lib/i18n";

export const VoxLogo = () => null;

const LANGS = [
  { code: "it-IT", label: "Italiano", flag: "🇮🇹" },
  { code: "en-US", label: "English", flag: "🇬🇧" },
  { code: "es-ES", label: "Español", flag: "🇪🇸" },
  { code: "fr-FR", label: "Français", flag: "🇫🇷" },
  { code: "de-DE", label: "Deutsch", flag: "🇩🇪" },
  { code: "zh-CN", label: "中文", flag: "🇨🇳" },
  { code: "sq-AL", label: "Shqip", flag: "🇦🇱" },
];

const APP_LANGS_LIST = ["it", "en", "es", "fr", "de", "zh", "sq"];
const ROBOTIC = [
  "compact","espeak","festival","flite","mbrola","pico","svox","loquendo",
  "microsoft david","microsoft mark","microsoft zira","microsoft hazel","microsoft susan","microsoft george",
  "aaron","albert","alva","bahh","boing","bollicine","brutte notizie","buone notizie","campane",
  "carmit","damayanti","daria","flo","fred","giullare","gordon","grandma","grandpa",
  "kanya","lekha","luciana","luisa","magnus","moira","montse","nora","organ","paolo","reed",
  "rishi","sandy","serena","superstar","tessa","whisper","wobble","xander","yelda",
  "yuna","zuzana","bubbles","cellos","ellen","fiona","junior","kyoko","lee",
  "meijia","milena","noora","oliver","otoya","satu","sinji","sin-ji","amira",
  "rocko","shelley","sussurro","tremolio","trinoid","violoncelli","zarvox","kathy","nicky",
  "martha","helena",
];

const FEMALE_VOICES: Record<string, string[]> = {
  it: ["alice","google italiano","federica","paola"],
  en: ["samantha","google us english","karen","victoria","google uk english female"],
  es: ["paulina","monica","google español de estados unidos","google español"],
  fr: ["amelie","amélie","marie","google français"],
  de: ["anna","google deutsch"],
  zh: ["google 普通话","普通话","ting-ting","mei-jia","li-mu","yu-shu"],
  sq: ["google shqip"],
};

const MALE_VOICES: Record<string, string[]> = {
  it: ["luca","eddy (italiano","google italiano"],
  en: ["google uk english male","google us english","daniel","arthur","ralph"],
  es: ["jorge","google español"],
  fr: ["thomas","google français"],
  de: ["yannick","google deutsch"],
  zh: ["google 普通话","普通话"],
  sq: ["google shqip"],
};

function filterVoices(all: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const filtered = all.filter((v) => {
    const lang = v.lang?.toLowerCase().slice(0, 2) ?? "";
    const name = v.name.toLowerCase();
    if (!APP_LANGS_LIST.includes(lang)) return false;
    if (ROBOTIC.some((r) => name.includes(r))) return false;
    return true;
  });
  filtered.sort((a, b) => {
    const aG = a.name.toLowerCase().includes("google") ? 0 : 1;
    const bG = b.name.toLowerCase().includes("google") ? 0 : 1;
    if (aG !== bG) return aG - bG;
    return a.lang.localeCompare(b.lang);
  });
  return filtered;
}

function bestVoiceForLang(voices: SpeechSynthesisVoice[], langCode: string, gender: "female" | "male"): SpeechSynthesisVoice | undefined {
  const prefix = langCode.slice(0, 2).toLowerCase();
  const preferred = gender === "female" ? (FEMALE_VOICES[prefix] ?? []) : (MALE_VOICES[prefix] ?? []);
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
        <SelectTrigger className="flex-1 h-12 rounded-2xl bg-card border border-border text-foreground font-semibold text-base"><SelectValue /></SelectTrigger>
        <SelectContent>{LANGS.map((l) => <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>)}</SelectContent>
      </Select>
      <button onClick={swap} className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shrink-0">→</button>
      <Select value={target} onValueChange={setTarget}>
        <SelectTrigger className="flex-1 h-12 rounded-2xl bg-card border border-border text-foreground font-semibold text-base"><SelectValue /></SelectTrigger>
        <SelectContent>{LANGS.map((l) => <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

export function ListeningIndicator({ onToggle, isActive }: { onToggle: () => void; isActive?: boolean }) {
  const status = useAppStore((s) => s.status);
  const audioLevel = useAppStore((s) => s.audioLevel);
  const appLang = useAppStore((s) => s.appLang);
  const t = getStrings(appLang);
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
        <motion.button whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.05 }} onClick={onToggle}
          className={`relative w-[120px] h-[120px] rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${isActive ? "bg-primary" : "bg-muted border-2 border-primary"}`}>
          {isProcessing ? <Loader2 size={40} className="text-primary-foreground animate-spin" /> : <Mic size={50} className={isActive ? "text-primary-foreground" : "text-primary"} strokeWidth={2} />}
        </motion.button>
      </div>
      <p className="mt-5 text-base text-muted-foreground max-w-xs text-center leading-relaxed">
        {!isActive && t.tapToStart}
        {isActive && status === "idle" && "Ready..."}
        {status === "listening" && t.listening}
        {status === "processing" && t.translating}
        {status === "speaking" && t.speaking}
      </p>
    </div>
  );
}

// ── Language Settings Screen ──────────────────────────────────────────────────
function LanguageSettingsScreen({ onBack }: { onBack: () => void }) {
  const appLang = useAppStore((s) => s.appLang);
  const setAppLang = useAppStore((s) => s.setAppLang);
  const t = getStrings(appLang);
  const [useSystem, setUseSystem] = useState(false);

  const handleSystem = () => {
    setUseSystem(true);
    setAppLang(detectSystemLang());
  };

  const handleSelect = (code: AppLang) => {
    setUseSystem(false);
    setAppLang(code);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4 border-b border-border">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h2 className="text-lg font-semibold text-foreground">{t.languageSettings}</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-4 mt-4 bg-card rounded-2xl border border-border overflow-hidden">
          {/* Follow system */}
          <button onClick={handleSystem} className="w-full flex items-center justify-between px-4 py-4 border-b border-border hover:bg-muted/50 transition-colors">
            <span className="text-base font-medium text-foreground">{t.followSystem}</span>
            {useSystem && <Check size={20} className="text-primary" />}
          </button>
          {/* Language list */}
          {APP_LANGUAGES.map((lang, idx) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-4 hover:bg-muted/50 transition-colors ${idx < APP_LANGUAGES.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="flex flex-col items-start">
                <span className="text-base font-medium text-foreground">{lang.nativeLabel}</span>
                {lang.nativeLabel !== lang.label && (
                  <span className="text-sm text-muted-foreground">{lang.label}</span>
                )}
              </div>
              {!useSystem && appLang === lang.code && <Check size={20} className="text-primary" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Settings Modal ─────────────────────────────────────────────────────────────
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
  const appLang = useAppStore((s) => s.appLang);

  const t = getStrings(appLang);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showLangSettings, setShowLangSettings] = useState(false);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => { setVoices(filterVoices(window.speechSynthesis.getVoices() || [])); };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  useEffect(() => {
    if (!voices.length) return;
    const best = bestVoiceForLang(voices, targetLangCode, userGender);
    if (best) setVoiceName(best.name);
  }, [targetLangCode, userGender, voices, setVoiceName]);

  // Reset lang screen when modal closes
  useEffect(() => { if (!isOpen) setShowLangSettings(false); }, [isOpen]);

  const currentLang = APP_LANGUAGES.find((l) => l.code === appLang);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl border-border bg-card max-h-[85vh] overflow-hidden p-0">
        {showLangSettings ? (
          <LanguageSettingsScreen onBack={() => setShowLangSettings(false)} />
        ) : (
          <div className="overflow-y-auto max-h-[85vh]">
            <DialogHeader className="px-6 pt-6 pb-0">
              <DialogTitle className="text-foreground text-xl font-bold">{t.settingsTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 px-6 pt-4 pb-6">

              {/* LANGUAGE SETTINGS ROW */}
              <button
                onClick={() => setShowLangSettings(true)}
                className="w-full flex items-center justify-between h-12 rounded-2xl bg-muted/50 border border-border px-4 hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium text-foreground">{t.languageSettings}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{currentLang?.flag} {currentLang?.nativeLabel}</span>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              </button>

              {/* GENDER */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">{t.voiceUser}</label>
                <div className="flex gap-3">
                  <button onClick={() => setUserGender("female")} className={`flex-1 h-11 rounded-2xl border text-sm font-semibold transition-colors ${userGender === "female" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"}`}>{t.female}</button>
                  <button onClick={() => setUserGender("male")} className={`flex-1 h-11 rounded-2xl border text-sm font-semibold transition-colors ${userGender === "male" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"}`}>{t.male}</button>
                </div>
              </div>

              {/* SENSITIVITY */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">{t.micSensitivity}</label>
                  <span className="text-sm text-muted-foreground">{sensitivity}%</span>
                </div>
                <Slider value={[sensitivity]} onValueChange={(v) => setSensitivity(v[0])} max={100} step={1} />
              </div>

              {/* VOLUME */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">{t.volume}</label>
                  <span className="text-sm text-muted-foreground">{volume}%</span>
                </div>
                <Slider value={[volume]} onValueChange={(v) => setVolume(v[0])} max={100} step={1} />
              </div>

              {/* VOICE */}
              <div className="space-y-4 border-t border-border pt-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{t.voiceSynthesis}</h3>
                  <p className="text-sm text-muted-foreground">{t.chooseVoice}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select className="flex-1 h-11 rounded-2xl bg-card border border-border text-foreground px-3 text-sm" value={voiceName} onChange={(e) => setVoiceName(e.target.value)}>
                    {voices.length === 0 && <option value="">No voices available</option>}
                    {voices.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
                  </select>
                  <button className="h-11 px-4 rounded-2xl bg-primary text-primary-foreground font-medium text-sm"
                    onClick={() => { const u = new SpeechSynthesisUtterance(t.test); u.voice = speechSynthesis.getVoices().find((v) => v.name === voiceName) || null; u.rate = speechRate; u.pitch = speechPitch; speechSynthesis.speak(u); }}>
                    {t.test}
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t.speed} — {speechRate.toFixed(2)}×</label>
                  <Slider value={[speechRate]} onValueChange={(v) => setSpeechRate(v[0])} min={0.5} max={1.5} step={0.01} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t.pitch} — {speechPitch.toFixed(2)}</label>
                  <Slider value={[speechPitch]} onValueChange={(v) => setSpeechPitch(v[0])} min={0.5} max={1.5} step={0.01} />
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ConversationView() {
  const messages = useAppStore((s) => s.messages);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <p className="text-lg font-medium text-muted-foreground">Tap the microphone to start translating</p>
          <p className="text-sm text-muted-foreground mt-2 opacity-60">Speak naturally — Speak & Translate Live will detect the language and translate in real-time</p>
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
