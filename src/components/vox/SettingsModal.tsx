import { useEffect, useMemo, useState } from 'react';
import { X, Play } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

export function SettingsModal() {
  const isOpen = useAppStore((s) => s.isSettingsOpen);
  const setOpen = useAppStore((s) => s.setSettingsOpen);
  const sensitivity = useAppStore((s) => s.sensitivity);
  const setSensitivity = useAppStore((s) => s.setSensitivity);
  const volume = useAppStore((s) => s.volume);
  const setVolume = useAppStore((s) => s.setVolume);
  const fastMode = useAppStore((s) => s.fastMode);
  const setFastMode = useAppStore((s) => s.setFastMode);
  const noiseReduction = useAppStore((s) => s.noiseReduction);
  const setNoiseReduction = useAppStore((s) => s.setNoiseReduction);

  // Voice setup
  const voiceName = useAppStore((s) => s.voiceName);
  const setVoiceName = useAppStore((s) => s.setVoiceName);
  const speechRate = useAppStore((s) => s.speechRate);
  const setSpeechRate = useAppStore((s) => s.setSpeechRate);
  const speechPitch = useAppStore((s) => s.speechPitch);
  const setSpeechPitch = useAppStore((s) => s.setSpeechPitch);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const load = () => {
      const list = window.speechSynthesis.getVoices() || [];
      setVoices(list);
      if (!voiceName && list.length) setVoiceName(list[0].name);
    };

    load();
    window.speechSynthesis.onvoiceschanged = load;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [voiceName, setVoiceName]);

  const voiceOptions = useMemo(() => {
    // Keep it simple: show all voices; browsers vary a lot.
    return voices.map((v) => ({ name: v.name, label: `${v.name}${v.lang ? ` (${v.lang})` : ''}` }));
  }, [voices]);

  const handleTestVoice = () => {
    if (!window.speechSynthesis) return;

    const { targetLangCode } = useAppStore.getState();
    const u = new SpeechSynthesisUtterance('Ciao! Questa è una prova.');
    u.lang = targetLangCode;
    u.rate = speechRate;
    u.pitch = speechPitch;
    u.volume = Math.min(Math.max(volume / 100, 0), 1);

    const v = window.speechSynthesis.getVoices().find((x) => x.name === voiceName);
    if (v) u.voice = v;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 safe-bottom"
          >
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight text-foreground">Settings</h2>
              <button onClick={() => setOpen(false)} className="p-2 rounded-full bg-muted">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Voice setup */}
              <section className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Sintesi Vocale</h3>
                  <p className="text-sm text-muted-foreground">Scegli la voce e regola le impostazioni di lettura</p>
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">Voce</label>
                    <Select value={voiceName} onValueChange={setVoiceName}>
                      <SelectTrigger className="h-11 rounded-2xl">
                        <SelectValue placeholder={voiceOptions.length ? 'Seleziona una voce' : 'Nessuna voce'} />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceOptions.map((v) => (
                          <SelectItem key={v.name} value={v.name}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestVoice}
                    className="h-11 px-4 rounded-2xl bg-muted text-foreground border border-border flex items-center gap-2"
                  >
                    <Play size={16} />
                    Prova
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">Velocità</label>
                    <span className="text-sm text-muted-foreground">{speechRate.toFixed(2)}×</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-12">Lento</span>
                    <Slider
                      value={[speechRate]}
                      min={0.7}
                      max={1.2}
                      step={0.05}
                      onValueChange={(v) => setSpeechRate(v[0] ?? 1)}
                    />
                    <span className="text-xs text-muted-foreground w-12 text-right">Veloce</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">Tono</label>
                    <span className="text-sm text-muted-foreground">{speechPitch.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-12">Basso</span>
                    <Slider
                      value={[speechPitch]}
                      min={0.5}
                      max={1.5}
                      step={0.05}
                      onValueChange={(v) => setSpeechPitch(v[0] ?? 1)}
                    />
                    <span className="text-xs text-muted-foreground w-12 text-right">Alto</span>
                  </div>
                </div>
              </section>

              {/* Sensitivity */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Microphone Sensitivity — {sensitivity}%
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  className="w-full accent-primary h-2 rounded-full appearance-none bg-muted cursor-pointer"
                />
              </div>

              {/* Volume */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Speaker Volume — {volume}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-secondary h-2 rounded-full appearance-none bg-muted cursor-pointer"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between py-3 border-t border-border">
                <span className="text-sm font-medium text-foreground">Fast Mode</span>
                <button
                  onClick={() => setFastMode(!fastMode)}
                  className={`w-12 h-7 rounded-full transition-colors ${fastMode ? 'bg-secondary' : 'bg-muted'}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-foreground transition-transform mx-1 ${fastMode ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-border">
                <span className="text-sm font-medium text-foreground">Noise Reduction</span>
                <button
                  onClick={() => setNoiseReduction(!noiseReduction)}
                  className={`w-12 h-7 rounded-full transition-colors ${noiseReduction ? 'bg-secondary' : 'bg-muted'}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-foreground transition-transform mx-1 ${noiseReduction ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
