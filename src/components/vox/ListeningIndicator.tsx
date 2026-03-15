import { Mic, Volume2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

type Props = {
  onToggle: () => void;
};

export function ListeningIndicator({ onToggle }: Props) {
  const status = useAppStore((s) => s.status);
  const audioLevel = useAppStore((s) => s.audioLevel);
  const isActive = status !== 'idle';
  const isListening = status === 'listening';
  const isSpeaking = status === 'speaking';
  const isProcessing = status === 'processing';

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Pulse rings */}
        <AnimatePresence>
          {isListening && (
            <>
              <motion.div
                key="ring1"
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full bg-secondary"
              />
              <motion.div
                key="ring2"
                initial={{ scale: 1, opacity: 0.3 }}
                animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut', delay: 0.3 }}
                className="absolute inset-0 rounded-full bg-secondary"
              />
            </>
          )}
        </AnimatePresence>

        {/* Audio level glow */}
        {isListening && audioLevel > 0.1 && (
          <motion.div
            animate={{ scale: 1 + audioLevel * 0.3, opacity: audioLevel * 0.6 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-[-8px] rounded-full bg-secondary/30 blur-md"
          />
        )}

        {/* Main button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onToggle}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
            isActive
              ? isSpeaking
                ? 'bg-secondary vox-glow-active'
                : 'bg-foreground vox-glow'
              : 'vox-gradient vox-glow'
          }`}
        >
          {isProcessing ? (
            <Loader2 size={32} className="text-background animate-spin" />
          ) : isSpeaking ? (
            <Volume2 size={32} className="text-background" />
          ) : (
            <Mic size={32} className={isActive ? 'text-background' : 'text-foreground'} />
          )}
        </motion.button>
      </div>

      <p className="mt-4 text-sm font-medium text-muted-foreground uppercase tracking-[0.2em]">
        {status === 'idle' && 'Tap to Speak'}
        {status === 'listening' && 'Listening...'}
        {status === 'processing' && 'Translating...'}
        {status === 'speaking' && 'Speaking...'}
      </p>
    </div>
  );
}
