import React, { useRef, useEffect, useState } from "react";
import { Mic, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";

/* -------------------------------------------------------
   LOGO SVG VERDE (inline)
------------------------------------------------------- */
export const VoxLogo = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="10" fill="hsl(var(--vox-green))" />
    <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="Inter, sans-serif">
      VT
    </text>
  </svg>
);

/* -------------------------------------------------------
   LANGS con bandierine
------------------------------------------------------- */
const LANGS = [
  { code: "it-IT", label: "Italiano", flag: "🇮🇹" },
  { code: "en-US", label: "English", flag: "🇬🇧" },
  { code: "es-ES", label: "Español", flag: "🇪🇸" },
  { code: "fr-FR", label: "Français", flag: "🇫🇷" },
  { code: "de-DE", label: "Deutsch", flag: "🇩🇪" },
  { code: "zh-CN", label: "中文", flag: "🇨🇳" },
  { code: "sq-AL", label: "Shqip", flag: "🇦🇱" },
];

/* -------------------------------------------------------
   1️⃣  LANGUAGE SELECTOR
------------------------------------------------------- */
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
          {LANGS.map((l) => (
            <SelectItem key={l.code} value={l.code}>
              {l.flag} {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        onClick={swap}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shrink-0"
      >
        →
      </button>

      <Select value={target} onValueChange={setTarget}>
        <SelectTrigger className="flex-1 h-12 rounded-2xl bg-card border border-border text-foreground font-semibold text-base">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGS.map((l) => (
            <SelectItem key={l.code} value={l.code}>
              {l.flag} {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* -------------------------------------------------------
   2️⃣  LISTENING INDICATOR
------------------------------------------------------- */
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
              <motion.div
                key="ring1"
                initial={{ scale: 1, opacity: 0.3 }}
                animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-primary"
              />
              <motion.div
                key="ring2"
                initial={{ scale: 1, opacity: 0.2 }}
                animate={{ scale: [1, 1.4], opacity: [0.2, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut", delay: 0.3 }}
                className="absolute inset-0 rounded-full bg-primary"
              />
            </>
          )}
        </AnimatePresence>

        {isListening && audioLevel > 0.1 && (
          <motion.div
            animate={{ scale: 1 + audioLevel * 0.3, opacity: audioLevel * 0.5 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-[-8px] rounded-full bg-primary/30 blur-md"
          />
        )}

        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          onClick={onToggle}
          className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center bg-primary shadow-lg transition-all duration-200"
        >
          {isProcessing ? (
            <Loader2 size={40} className="text-primary-foreground animate-spin" />
          ) : (
            <Mic size={50} className="text-primary-foreground" strokeWidth={2} />
          )}
        </motion.button>
      </div>

      <p className="mt-5 text-base text-muted-foreground max-w-xs text-center leading-relaxed">
        {status === "idle" && "Speak naturally — VoxTranslate listens and translates automatically"}
        {status === "listening" && "Listening..."}
        {status === "processing" && "Translating..."}
        {status === "speaking" && "Speaking..."}
      </p>
    </div>
  );
}

/* -------------------------------------------------------
   3️⃣  SETTINGS MODAL — tema verde + Sintesi Vocale
------------------------------------------------------- */
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

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => {
      const all = window.speechSynthesis.getVoices() || [];

      // Only keep voices for the 7 app languages
      const APP_LANGS = ['it', 'en', 'es', 'fr', 'de', 'zh', 'sq'];

      // Robotic/low-quality voice names to exclude
      const ROBOTIC = [
        'compact','espeak','festival','flite','mbrola','pico','svox',
        'microsoft david','microsoft mark','microsoft zira','microsoft hazel',
        'microsoft susan','microsoft george','loquendo',
        // Mac novelty/joke voices
        'aaron','albert','alva','bahh','boing','bollicine','brutte notizie',
        'buone notizie','campane','carmit','damayanti','daria','eddy',
        'flo','fred','giullare','gordon','grandma','grandpa','kanya',
        'lekha','luciana','luisa','magnus','moira','montse','nora',
        'organ','paolo','reed','rishi','sandy','serena','superstar',
        'tessa','thomas','tingting','whisper','wobble','xander','yelda',
        'yuna','zuzana','arthur','bahh','bubbles','cellos','daniel',
        'ellen','fiona','junior','kyoko','lee','meijia','milena',
        'noora','oliver','otoya','satu','sinji','sin-ji','tünde',
        'amelie','amelie','amira','anna (de','anna (en',
      ];

      const filtered = all.filter((v) => {
        const lang = v.lang?.toLowerCase().slice(0, 2) ?? '';
        const name = v.name.toLowerCase();
        // Must be one of our 7 languages
        if (!APP_LANGS.includes(lang)) return false;
        // Must not be robotic/novelty
        if (ROBOTIC.some((r) => name.includes(r))) return false;
        return true;
      });

      // Sort: Google voices first, then by language
      filtered.sort((a, b) => {
        const aG = a.name.toLowerCase().includes('google') ? 0 : 1;
        const bG = b.name.toLowerCase().includes('google') ? 0 : 1;
        if (aG !== bG) return aG - bG;
        return a.lang.localeCompare(b.lang);
      });

      setVoices(filtered);
      if (filtered.length) setVoiceName(filtered[0].name);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [voiceName, setVoiceName]);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl border-border bg-card max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl font-bold">Impostazioni</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* MICROPHONE SENSITIVITY */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Sensibilità Microfono</label>
              <span className="text-sm text-muted-foreground">{sensitivity}%</span>
            </div>
            <Slider
              value={[sensitivity]}
              onValueChange={(v) => setSensitivity(v[0])}
              max={100}
              step={1}
            />
          </div>

          {/* SPEAKER VOLUME */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Volume Riproduzione</label>
              <span className="text-sm text-muted-foreground">{volume}%</span>
            </div>
            <Slider
              value={[volume]}
              onValueChange={(v) => setVolume(v[0])}
              max={100}
              step={1}
            />
          </div>

          {/* VOICE SYNTHESIS */}
          <div className="space-y-4 border-t border-border pt-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Sintesi Vocale</h3>
              <p className="text-sm text-muted-foreground">Scegli la voce e regola le impostazioni di lettura</p>
            </div>

            {/* VOICE SELECT */}
            <div className="flex items-center gap-3">
              <select
                className="flex-1 h-11 rounded-2xl bg-card border border-border text-foreground px-3 text-sm"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
              >
                {voices.length === 0 && <option value="">Nessuna voce disponibile</option>}
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
              <button
                className="h-11 px-4 rounded-2xl bg-primary text-primary-foreground font-medium text-sm"
                onClick={() => {
                  const u = new SpeechSynthesisUtterance("Prova voce");
                  u.voice = speechSynthesis.getVoices().find((v) => v.name === voiceName) || null;
                  u.rate = speechRate;
                  u.pitch = speechPitch;
                  speechSynthesis.speak(u);
                }}
              >
                Prova
              </button>
            </div>

            {/* SPEED */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Velocità — {speechRate.toFixed(2)}×</label>
              </div>
              <Slider
                value={[speechRate]}
                onValueChange={(v) => setSpeechRate(v[0])}
                min={0.5}
                max={1.5}
                step={0.01}
              />
            </div>

            {/* TONE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Tono — {speechPitch.toFixed(2)}</label>
              </div>
              <Slider
                value={[speechPitch]}
                onValueChange={(v) => setSpeechPitch(v[0])}
                min={0.5}
                max={1.5}
                step={0.01}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------
   4️⃣  CONVERSATION VIEW — stile WhatsApp/Telegram
   (mostra originale + traduzione)
------------------------------------------------------- */
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
          <p className="text-sm text-muted-foreground mt-2 opacity-60">
            Speak naturally — VoxTranslate will detect the language and translate in real-time
          </p>
        </div>
      )}
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function MessageBubble({ msg }: { msg: { id: string; text: string; translatedText: string; sourceLang: string; targetLang: string } }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-1"
    >
      <div className="bg-card border border-border rounded-2xl px-4 py-3 max-w-[85%] shadow-sm">
        <p className="text-foreground text-sm">{msg.text}</p>
        {msg.translatedText && (
          <p className="text-primary text-sm font-medium mt-1">{msg.translatedText}</p>
        )}
      </div>
    </motion.div>
  );
}