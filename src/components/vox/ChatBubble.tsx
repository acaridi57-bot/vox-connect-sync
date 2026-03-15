import { motion } from 'framer-motion';
import type { Message } from '@/store/useAppStore';

type Props = { message: Message };

export function ChatBubble({ message }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      className="space-y-2"
    >
      {/* Original */}
      <div className="flex justify-end">
        <div className="max-w-[85%] px-4 py-3 rounded-[20px] rounded-tr-md bg-vox-bubble-user shadow-[var(--vox-shadow-bubble)]">
          <p className="text-[17px] leading-relaxed text-foreground">{message.text}</p>
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1 block">
            {message.sourceLang}
          </span>
        </div>
      </div>

      {/* Translation */}
      <div className="flex justify-start">
        <div className="max-w-[85%] px-4 py-3 rounded-[20px] rounded-tl-md bg-vox-primary/15 border border-primary/10">
          <p className="text-[17px] leading-relaxed text-foreground">{message.translatedText}</p>
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1 block">
            {message.targetLang}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
