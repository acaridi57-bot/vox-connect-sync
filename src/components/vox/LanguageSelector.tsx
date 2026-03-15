import { ArrowLeftRight } from 'lucide-react';
import { useAppStore, LANGUAGE_PAIRS } from '@/store/useAppStore';
import { motion } from 'framer-motion';

export function LanguageSelector() {
  const selectedPairIndex = useAppStore((s) => s.selectedPairIndex);
  const setSelectedPairIndex = useAppStore((s) => s.setSelectedPairIndex);
  const pair = LANGUAGE_PAIRS[selectedPairIndex];

  const cycleNext = () => {
    setSelectedPairIndex((selectedPairIndex + 1) % LANGUAGE_PAIRS.length);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={cycleNext}
      className="w-full py-3.5 px-5 rounded-2xl bg-muted/50 border border-border flex items-center justify-between gap-3 transition-colors active:bg-muted"
    >
      <span className="font-semibold text-foreground tracking-tight text-base">
        {pair.labelA}
      </span>
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-vox-secondary/20">
        <ArrowLeftRight size={14} className="text-secondary" />
      </div>
      <span className="font-semibold text-foreground tracking-tight text-base">
        {pair.labelB}
      </span>
    </motion.button>
  );
}
