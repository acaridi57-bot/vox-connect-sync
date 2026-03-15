import { ArrowLeftRight } from 'lucide-react';
import { useAppStore, LANGUAGES } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LanguageSelector() {
  const sourceLangCode = useAppStore((s) => s.sourceLangCode);
  const targetLangCode = useAppStore((s) => s.targetLangCode);
  const setSourceLangCode = useAppStore((s) => s.setSourceLangCode);
  const setTargetLangCode = useAppStore((s) => s.setTargetLangCode);
  const swapLanguages = useAppStore((s) => s.swapLanguages);

  return (
    <div className="flex items-center gap-3 w-full">
      <Select value={sourceLangCode} onValueChange={setSourceLangCode}>
        <SelectTrigger className="flex-1 h-12 rounded-2xl bg-white border border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-semibold text-base">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={swapLanguages}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[hsl(var(--vox-primary))] text-white shrink-0"
      >
        <ArrowLeftRight size={16} />
      </motion.button>

      <Select value={targetLangCode} onValueChange={setTargetLangCode}>
        <SelectTrigger className="flex-1 h-12 rounded-2xl bg-white border border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-semibold text-base">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
