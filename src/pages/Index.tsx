import { useCallback } from 'react';
import { Settings } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { LanguageSelector } from '@/components/vox/LanguageSelector';
import { ConversationView } from '@/components/vox/ConversationView';
import { ListeningIndicator } from '@/components/vox/ListeningIndicator';
import { SettingsModal } from '@/components/vox/SettingsModal';
import logo from '@/assets/logo.png';

export default function Index() {
  const status = useAppStore((s) => s.status);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const { startMic, stopMic, pauseMic, resumeMic } = useMicrophone();
  const { startRecognition, stopRecognition } = useSpeechRecognition();

  const handleToggle = useCallback(() => {
    if (status === 'idle') {
      startMic();
      startRecognition(pauseMic, resumeMic);
    } else {
      stopMic();
      stopRecognition();
      window.speechSynthesis?.cancel();
    }
  }, [status, startMic, stopMic, startRecognition, stopRecognition, pauseMic, resumeMic]);

  return (
    <div className="flex flex-col h-[100dvh] bg-[hsl(var(--background))] overflow-hidden">
      {/* Header */}
      <header className="px-5 pt-12 pb-3 flex items-center justify-between safe-top z-10">
        <div className="flex items-center gap-3">
          <img src={logo} alt="VoxTranslate" className="w-9 h-9 rounded-xl" />
          <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">VoxTranslate</h1>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2.5 rounded-full bg-white/80 border border-[hsl(var(--border))] transition-colors active:bg-[hsl(var(--muted))]"
        >
          <Settings size={20} className="text-[hsl(var(--muted-foreground))]" />
        </button>
      </header>

      {/* Language Selector */}
      <div className="px-5 py-2">
        <LanguageSelector />
      </div>

      {/* Conversation */}
      <ConversationView />

      {/* Controls */}
      <div className="px-8 pt-4 pb-8 safe-bottom flex flex-col items-center">
        <ListeningIndicator onToggle={handleToggle} />
      </div>

      {/* Settings */}
      <SettingsModal />
    </div>
  );
}
