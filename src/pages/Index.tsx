import { useCallback, useState, useEffect } from "react";
import { Settings, Trash2, MicOff, Mic, LogOut } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useMicrophone } from "@/hooks/useMicrophone";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { stopSpeaking } from "@/lib/speech/tts";
import { LanguageSelector, ListeningIndicator, SettingsModal, ConversationView, VoxLogo } from "@/components/vox/VoxUnified";

export default function Index() {
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const clearMessages = useAppStore((s) => s.clearMessages);
  const status = useAppStore((s) => s.status);
  const [isMuted, setIsMuted] = useState(false);
  const [isActive, setIsActive] = useState(false); // mic on/off state

  const { startMic, stopMic, pauseMic, resumeMic } = useMicrophone();
  const { startRecognition, stopRecognition } = useSpeechRecognition();

  const stopAll = useCallback(() => {
    stopSpeaking();
    stopRecognition();
    stopMic();
    useAppStore.getState().setStatus("idle");
    setIsActive(false);
    setIsMuted(false);
  }, [stopRecognition, stopMic]);

  const startAll = useCallback(() => {
    stopSpeaking();
    stopRecognition();
    stopMic();
    useAppStore.getState().setStatus("idle");
    startMic();
    startRecognition(pauseMic, resumeMic);
    setIsActive(true);
  }, [startMic, stopMic, startRecognition, stopRecognition, pauseMic, resumeMic]);

  // ── Toggle mic on/off ──────────────────────────────────────────────
  const handleToggle = useCallback(() => {
    if (isActive) {
      stopAll();
    } else {
      startAll();
    }
  }, [isActive, startAll, stopAll]);

  // ── Stop mic when app goes to background / tab hidden ──────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAll();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [stopAll]);

  // ── Stop mic when component unmounts ──────────────────────────────
  useEffect(() => {
    return () => { stopAll(); };
  }, []);

  const handleClear = useCallback(() => {
    if (window.confirm("Vuoi cancellare tutta la cronologia?")) clearMessages();
  }, [clearMessages]);

  const handleMuteToggle = useCallback(() => {
    if (isMuted) { resumeMic(); setIsMuted(false); }
    else { pauseMic(); setIsMuted(true); }
  }, [isMuted, pauseMic, resumeMic]);

  const handleLogout = useCallback(() => {
    stopAll();
    clearMessages();
    window.location.reload();
  }, [stopAll, clearMessages]);

  return (
    <div className="flex flex-col h-[100dvh] bg-[hsl(var(--background))] overflow-hidden">
      <header className="px-5 pt-12 pb-3 flex items-center justify-between safe-top z-10">
        <div className="flex items-center gap-3">
          <VoxLogo />
          <div className="flex flex-col leading-tight">
            <span style={{fontStyle:'italic', fontFamily:'Georgia, serif', color:'#1C6B3B', fontSize:'20px', fontWeight:'400'}}>ACaridi</span>
            <span style={{fontFamily:'var(--font-sans)', color:'#1C6B3B', fontSize:'9px', letterSpacing:'0.25em', opacity:'0.7'}}>DIGITAL APP</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMuteToggle}
            disabled={!isActive}
            className={`p-2.5 rounded-full border transition-colors ${
              isMuted ? "bg-destructive/10 border-destructive/40" :
              isActive ? "bg-white/80 border-[hsl(var(--border))]" :
              "bg-white/30 border-[hsl(var(--border))] opacity-40 cursor-not-allowed"
            }`}
          >
            {isMuted ? <MicOff size={20} className="text-destructive" /> : <Mic size={20} className="text-[hsl(var(--muted-foreground))]" />}
          </button>
          <button onClick={handleClear} className="p-2.5 rounded-full bg-white/80 border border-[hsl(var(--border))] transition-colors">
            <Trash2 size={20} className="text-[hsl(var(--muted-foreground))]" />
          </button>
          <button onClick={() => setSettingsOpen(true)} className="p-2.5 rounded-full bg-white/80 border border-primary/40 active:bg-primary/10 transition">
            <Settings size={20} className="text-[hsl(var(--muted-foreground))]" />
          </button>
          <button onClick={handleLogout} className="p-2.5 rounded-full bg-white/80 border border-destructive/40 active:bg-destructive/10 transition">
            <LogOut size={20} className="text-destructive" />
          </button>
        </div>
      </header>
      <div className="px-5 py-2"><LanguageSelector /></div>
      <ConversationView />
      <div className="px-8 pt-4 pb-8 safe-bottom flex flex-col items-center">
        <ListeningIndicator onToggle={handleToggle} isActive={isActive} />
      </div>
      <SettingsModal />
    </div>
  );
}
