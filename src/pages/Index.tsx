import { useCallback, useState } from "react";
import { Settings, Trash2, MicOff, Mic, LogOut } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useMicrophone } from "@/hooks/useMicrophone";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

import {
  LanguageSelector,
  ListeningIndicator,
  SettingsModal,
  ConversationView,
  VoxLogo,
} from "@/components/vox/VoxUnified";

export default function Index() {
  const status = useAppStore((s) => s.status);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const clearMessages = useAppStore((s) => s.clearMessages);
  const [isMuted, setIsMuted] = useState(false);

  const { startMic, stopMic, pauseMic, resumeMic } = useMicrophone();
  const { startRecognition, stopRecognition } = useSpeechRecognition();

  const handleToggle = useCallback(() => {
    window.speechSynthesis?.cancel();
    stopRecognition();
    stopMic();

    if (useAppStore.getState().status !== "idle") {
      useAppStore.getState().setStatus("idle");
    }

    startMic();
    startRecognition(pauseMic, resumeMic);
  }, [startMic, stopMic, startRecognition, stopRecognition, pauseMic, resumeMic]);

  const handleClear = useCallback(() => {
    const ok = window.confirm("Vuoi cancellare tutta la cronologia della conversazione?");
    if (!ok) return;
    clearMessages();
  }, [clearMessages]);

  const handleMuteToggle = useCallback(() => {
    if (isMuted) {
      resumeMic();
      setIsMuted(false);
    } else {
      pauseMic();
      setIsMuted(true);
    }
  }, [isMuted, pauseMic, resumeMic]);

  const handleLogout = useCallback(() => {
    window.speechSynthesis?.cancel();
    stopRecognition();
    stopMic();
    clearMessages();
    useAppStore.getState().setStatus("idle");
    window.location.reload();
  }, [stopRecognition, stopMic, clearMessages]);

  return (
    <div className="flex flex-col h-[100dvh] bg-[hsl(var(--background))] overflow-hidden">
      {/* HEADER */}
      <header className="px-5 pt-12 pb-3 flex items-center justify-between safe-top z-10">
        <div className="flex items-center gap-3">
          <VoxLogo />
          <h1 className="text-xl font-bold tracking-tight text-foreground">VoxTranslate</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="p-2.5 rounded-full bg-white/80 border border-[hsl(var(--border))] transition-colors active:bg-[hsl(var(--muted))]"
            aria-label="Cancella cronologia"
            title="Cancella cronologia"
          >
            <Trash2 size={20} className="text-[hsl(var(--muted-foreground))]" />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2.5 rounded-full bg-white/80 border border-primary/40 active:bg-primary/10 transition"
            aria-label="Impostazioni"
          >
            <Settings size={20} className="text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
      </header>

      {/* LANGUAGE SELECTOR */}
      <div className="px-5 py-2">
        <LanguageSelector />
      </div>

      {/* CONVERSATION */}
      <ConversationView />

      {/* MICROPHONE */}
      <div className="px-8 pt-4 pb-8 safe-bottom flex flex-col items-center">
        <ListeningIndicator onToggle={handleToggle} />
      </div>

      {/* SETTINGS MODAL */}
      <SettingsModal />
    </div>
  );
}
