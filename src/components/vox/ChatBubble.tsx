import { motion } from 'framer-motion';
import type { Message } from '@/store/useAppStore';

type Props = { message: Message };

export function ChatBubble({ message }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      className="space-y-3"
    >
      {/* Original */}
      <div className="bg-[hsl(var(--card))] rounded-2xl p-5 max-w-[500px] mx-auto"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      >
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">{message.sourceLang}</p>
        <p className="text-lg font-medium text-[hsl(var(--foreground))]">{message.text}</p>
      </div>

      {/* Translation */}
      <div className="bg-[hsl(var(--card))] rounded-2xl p-5 max-w-[500px] mx-auto"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      >
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">{message.targetLang}</p>
        <p className="text-lg font-medium text-[hsl(var(--foreground))]">{message.translatedText}</p>
      </div>
    </motion.div>
  );
}
