import { X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';

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

            <div className="space-y-6">
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
                  <div className={`w-5 h-5 rounded-full bg-foreground transition-transform mx-1 ${fastMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-border">
                <span className="text-sm font-medium text-foreground">Noise Reduction</span>
                <button
                  onClick={() => setNoiseReduction(!noiseReduction)}
                  className={`w-12 h-7 rounded-full transition-colors ${noiseReduction ? 'bg-secondary' : 'bg-muted'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-foreground transition-transform mx-1 ${noiseReduction ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
