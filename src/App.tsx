import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEventHandler,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import {
  ArrowRightLeft,
  ChevronDown,
  Mic,
  Send,
  Settings,
  Share2,
  Trash2,
  Volume2,
} from "lucide-react";
import { translateText } from "@/lib/speech/demoTranslations";
import { useAppStore } from "@/store/useAppStore";
import { SettingsModal } from "@/components/vox/VoxUnified";

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

type Language = {
  code: string;
  label: string;
  flag: string;
  speechCode: string;
};

type Status = "idle" | "listening" | "translating" | "speaking" | "error";

type ConversationItem = {
  id: string;
  source: string;
  translated: string;
  from: string;
  to: string;
};

const SESSION_STORAGE_KEY = "acaridi_translate_session_id";

const languages: Language[] = [
  { code: "it", label: "Italiano", flag: "🇮🇹", speechCode: "it-IT" },
  { code: "en", label: "English", flag: "🇬🇧", speechCode: "en-GB" },
  { code: "es", label: "Español", flag: "🇪🇸", speechCode: "es-ES" },
  { code: "fr", label: "Français", flag: "🇫🇷", speechCode: "fr-FR" },
  { code: "de", label: "Deutsch", flag: "🇩🇪", speechCode: "de-DE" },
  { code: "pt", label: "Português", flag: "🇵🇹", speechCode: "pt-PT" },
  { code: "ru", label: "Русский", flag: "🇷🇺", speechCode: "ru-RU" },
  { code: "ar", label: "العربية", flag: "🇸🇦", speechCode: "ar-SA" },
  { code: "zh", label: "中文", flag: "🇨🇳", speechCode: "zh-CN" },
  { code: "ja", label: "日本語", flag: "🇯🇵", speechCode: "ja-JP" },
  { code: "ko", label: "한국어", flag: "🇰🇷", speechCode: "ko-KR" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳", speechCode: "hi-IN" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱", speechCode: "nl-NL" },
  { code: "pl", label: "Polski", flag: "🇵🇱", speechCode: "pl-PL" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷", speechCode: "tr-TR" },
];

const createId = () => {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

function App() {
  const [fromLang, setFromLang] = useState<Language>(languages[0]);
  const [toLang, setToLang] = useState<Language>(languages[1]);
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorText, setErrorText] = useState("");
  const [autoSpeak] = useState(true);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [sessionId, setSessionId] = useState("");

  const recognitionRef = useRef<any>(null);

  const canSwap = useMemo(
    () => fromLang.code !== toLang.code,
    [fromLang.code, toLang.code]
  );

  const recognitionSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // niente
    } finally {
      recognitionRef.current = null;
      setStatus((prev) => (prev === "listening" ? "idle" : prev));
    }
  }, []);

  const getStatusLabel = useCallback(() => {
    switch (status) {
      case "listening":
        return "Listening...";
      case "translating":
        return "Translating...";
      case "speaking":
        return "Speaking...";
      case "error":
        return "Error";
      default:
        return "Ready";
    }
  }, [status]);

  const speakText = useCallback(
    (content: string) => {
      if (
        !content ||
        typeof window === "undefined" ||
        !("speechSynthesis" in window)
      ) {
        setStatus("idle");
        return;
      }

      stopSpeaking();

      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = toLang.speechCode;

      const voices = window.speechSynthesis.getVoices();
      const exactVoice =
        voices.find((voice) => voice.lang === toLang.speechCode) ||
        voices.find((voice) => voice.lang.startsWith(toLang.code));

      if (exactVoice) {
        utterance.voice = exactVoice;
      }

      utterance.onstart = () => setStatus("speaking");
      utterance.onend = () => setStatus("idle");
      utterance.onerror = () => setStatus("idle");

      window.speechSynthesis.speak(utterance);
    },
    [stopSpeaking, toLang.code, toLang.speechCode]
  );

  const loadConversation = useCallback(async (_sid: string) => {
    // Conversation history is kept in local state only
  }, []);

  const handleTranslate = useCallback(
    async (rawText?: string) => {
      const cleanText = (rawText ?? text).trim();
      if (!cleanText) return;

      setErrorText("");
      setStatus("translating");

      try {
        const translated = await translateText(cleanText, fromLang.code, toLang.code);

        if (!translated || translated === cleanText) {
          throw new Error("No translation returned");
        }

        setText(cleanText);
        setTranslatedText(translated);

        setConversation((prev) => [
          ...prev,
          {
            id: createId(),
            source: cleanText,
            translated,
            from: fromLang.label,
            to: toLang.label,
          },
        ]);

        if (autoSpeak) {
          speakText(translated);
        } else {
          setStatus("idle");
        }
      } catch (error) {
        console.error(error);
        setStatus("error");
        setErrorText(
          "Traduzione non riuscita. Riprova tra qualche secondo."
        );
      }
    },
    [
      autoSpeak,
      fromLang.code,
      fromLang.label,
      speakText,
      text,
      toLang.code,
      toLang.label,
    ]
  );

  const swapLanguages = useCallback(() => {
    if (!canSwap) return;
    setFromLang(toLang);
    setToLang(fromLang);
  }, [canSwap, fromLang, toLang]);

  const startListening = useCallback(() => {
    if (!recognitionSupported || typeof window === "undefined") {
      setStatus("error");
      setErrorText("Speech Recognition non supportato in questo browser.");
      return;
    }

    stopSpeaking();
    setErrorText("");

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setStatus("error");
      setErrorText("Speech Recognition non disponibile.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;

    recognition.lang = fromLang.speechCode;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStatus("listening");
    };

    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript?.trim?.() || "";
      if (!transcript) {
        setStatus("idle");
        return;
      }

      setText(transcript);
      void handleTranslate(transcript);
    };

    recognition.onerror = () => {
      setStatus("error");
      setErrorText("Errore durante il riconoscimento vocale.");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setStatus((prev) =>
        prev === "listening" ? "idle" : prev === "error" ? "error" : prev
      );
    };

    recognition.start();
  }, [fromLang.speechCode, handleTranslate, recognitionSupported, stopSpeaking]);

  const handleMicClick = useCallback(() => {
    console.log('[DEBUG] handleMicClick called, status:', status);
    if (status === "listening") {
      stopListening();
      return;
    }
    startListening();
  }, [startListening, status, stopListening]);

  const handleSend = useCallback(async () => {
    await handleTranslate(text);
  }, [handleTranslate, text]);

  const handleDelete = useCallback(async () => {
    stopListening();
    stopSpeaking();
    setText("");
    setTranslatedText("");
    setConversation([]);
    setErrorText("");
    setShowSettings(false);
    setStatus("idle");

    const newSessionId = createId();
    setSessionId(newSessionId);

    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
    }
  }, [stopListening, stopSpeaking]);

  const handleShare = useCallback(async () => {
    const content = translatedText
      ? `Originale: ${text}\nTraduzione: ${translatedText}`
      : text || "Speak & Translate Live";

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Speak & Translate Live",
          text: content,
          url: window.location.href,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
        alert("Testo copiato negli appunti");
        return;
      }

      alert(content);
    } catch (error) {
      console.error(error);
    }
  }, [text, translatedText]);

  const handleReplayVoice = useCallback(() => {
    if (!translatedText) return;
    speakText(translatedText);
  }, [speakText, translatedText]);

  const onTextareaKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored =
      localStorage.getItem(SESSION_STORAGE_KEY)?.trim() || createId();

    localStorage.setItem(SESSION_STORAGE_KEY, stored);
    setSessionId(stored);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    void loadConversation(sessionId);
  }, [loadConversation, sessionId]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const preloadVoices = () => {
      window.speechSynthesis.getVoices();
    };

    preloadVoices();
    window.speechSynthesis.onvoiceschanged = preloadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;

      if (meta && e.key.toLowerCase() === "m") {
        e.preventDefault();
        handleMicClick();
      }

      if (meta && e.key.toLowerCase() === "l") {
        e.preventDefault();
        swapLanguages();
      }

      if (meta && e.key === "Enter") {
        e.preventDefault();
        void handleSend();
      }

      if (e.key === "Escape") {
        e.preventDefault();
        void handleDelete();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleDelete, handleMicClick, handleSend, swapLanguages]);

  return (
    <div className="min-h-screen bg-transparent text-[#243428]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-6 pt-4 sm:max-w-lg">
        <header className="mb-4 rounded-[24px] border border-[#D7E3DA] bg-white/55 px-4 py-4 shadow-[0_8px_24px_rgba(22,42,28,0.08)] backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="w-[132px] shrink-0">
              <div className="flex flex-col items-center text-[#1C6B3B]">
                <div
                  className="select-none text-[30px] leading-none italic tracking-[-0.03em]"
                  style={{
                    fontFamily:
                      '"Brush Script MT","Segoe Script","Apple Chancery","Snell Roundhand",cursive',
                    fontWeight: 400,
                  }}
                >
                  ACaridi
                </div>

                <div className="mt-1 text-center text-[9px] font-medium uppercase tracking-[0.34em] text-[#2E4B38]">
                  Digital App
                </div>

                <div
                  className="mt-1 text-center text-[14px] italic leading-none text-[#1C6B3B]"
                  style={{
                    fontFamily:
                      '"Times New Roman",Georgia,"Palatino Linotype",serif',
                    fontWeight: 400,
                  }}
                >
                  Since 2026
                </div>
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-4 gap-2">
              <TopActionButton ariaLabel="Voice" onClick={handleMicClick}>
                <Mic className="h-[18px] w-[18px]" />
              </TopActionButton>

              <TopActionButton ariaLabel="Delete" onClick={() => void handleDelete()}>
                <Trash2 className="h-[18px] w-[18px]" />
              </TopActionButton>

              <TopActionButton
                ariaLabel="Settings"
                onClick={() => {
                  useAppStore.getState().setSettingsOpen(true);
                }}
              >
                <Settings className="h-[18px] w-[18px]" />
              </TopActionButton>

              <TopActionButton ariaLabel="Share" onClick={() => void handleShare()}>
                <Share2 className="h-[18px] w-[18px]" />
              </TopActionButton>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.03em] text-[#1C6B3B] sm:text-[32px]">
              Speak &amp; Translate Live
            </h1>
          </div>

        </header>

        <section className="mb-5">
          <div className="flex items-center gap-3">
            <LanguageCard
              value={fromLang}
              onChange={(e) => {
                const selected = languages.find(
                  (lang) => lang.code === e.target.value
                );
                if (selected) setFromLang(selected);
              }}
            />

            <button
              type="button"
              onClick={swapLanguages}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#1C6B3B] bg-[#1C6B3B] text-white shadow-[0_4px_10px_rgba(28,107,59,0.16)] transition hover:bg-[#165330] active:scale-[0.98]"
              aria-label="Swap languages"
            >
              <ArrowRightLeft className="h-5 w-5" />
            </button>

            <LanguageCard
              value={toLang}
              onChange={(e) => {
                const selected = languages.find(
                  (lang) => lang.code === e.target.value
                );
                if (selected) setToLang(selected);
              }}
            />
          </div>
        </section>

        <main className="flex flex-1 flex-col">
          <section className="flex flex-1 flex-col justify-between rounded-[28px] border border-[#D7E3DA] bg-white/35 px-6 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
            <div>
              <div className="mb-4 flex items-center justify-center">
                <span
                  className={`rounded-full px-3 py-1 text-[12px] font-medium ${
                    status === "error"
                      ? "bg-red-100 text-red-700"
                      : "bg-[rgba(28,107,59,0.10)] text-[#1C6B3B]"
                  }`}
                >
                  {getStatusLabel()}
                </span>
              </div>

              {!translatedText ? (
                <div className="mx-auto max-w-xs">
                  <h2 className="text-[20px] font-semibold leading-snug text-[#2A4A35]">
                    Tap the microphone to start translating
                  </h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-[#61736A]">
                    Speak naturally — Speak &amp; Translate Live will detect and
                    translate in real-time
                  </p>
                </div>
              ) : (
                <div className="mx-auto max-w-sm text-left">
                  <div className="rounded-[20px] border border-[#D7E3DA] bg-white/80 p-4 shadow-[0_8px_24px_rgba(22,42,28,0.08)]">
                    <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#61736A]">
                      {fromLang.label}
                    </p>
                    <p className="text-[15px] leading-relaxed text-[#243428]">
                      {text}
                    </p>
                  </div>

                  <div className="mt-3 rounded-[20px] border border-[#D7E3DA] bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_8px_24px_rgba(22,42,28,0.08)]">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#61736A]">
                        {toLang.label}
                      </p>

                      <button
                        type="button"
                        onClick={handleReplayVoice}
                        className="flex items-center gap-1 rounded-full border border-[#D7E3DA] bg-white px-2 py-1 text-[12px] text-[#1C6B3B]"
                        aria-label="Play translated audio"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        Listen
                      </button>
                    </div>

                    <p className="text-[17px] font-medium leading-relaxed text-[#243428]">
                      {translatedText}
                    </p>
                  </div>
                </div>
              )}

              {errorText && (
                <p className="mx-auto mt-4 max-w-sm text-[13px] text-red-600">
                  {errorText}
                </p>
              )}
            </div>

            {conversation.length > 0 && (
              <div className="mt-5 text-left">
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#61736A]">
                  Recent history
                </p>

                <div className="space-y-2">
                  {conversation.slice(-3).reverse().map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[16px] border border-[#D7E3DA] bg-white/70 p-3"
                    >
                      <p className="text-[12px] text-[#61736A]">
                        {item.from || fromLang.label} → {item.to || toLang.label}
                      </p>
                      <p className="mt-1 text-[13px] text-[#243428]">
                        {item.source}
                      </p>
                      <p className="mt-1 text-[14px] font-medium text-[#1C6B3B]">
                        {item.translated}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="mt-5 border-t border-[#D7E3DA] pt-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-[18px] border border-[#D7E3DA] bg-white/90 shadow-[0_8px_24px_rgba(22,42,28,0.08)]">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={onTextareaKeyDown}
                  rows={1}
                  placeholder="Scrivi un testo da tradurre..."
                  className="min-h-[52px] w-full resize-none bg-transparent px-4 py-3 text-[16px] text-[#243428] outline-none placeholder:text-[#7C8B82]"
                />
              </div>

              <button
                type="button"
                onClick={() => void handleSend()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#1C6B3B] bg-[#1C6B3B] text-white shadow-[0_4px_10px_rgba(28,107,59,0.16)] transition hover:bg-[#165330] active:scale-[0.98]"
                aria-label="Send text"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 px-1 text-[13px] text-[#6E7E75]">
              Enter per inviare · Ctrl/Cmd+Enter invia · Shift+Enter va a capo
            </p>

            <div className="mt-6 flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={handleMicClick}
                className="flex h-28 w-28 items-center justify-center rounded-full border border-[#1C6B3B] bg-[#1C6B3B] text-white shadow-[0_14px_32px_rgba(28,107,59,0.22)] transition hover:bg-[#165330] active:scale-[0.98]"
                aria-label="Start voice translation"
              >
                <Mic className="h-12 w-12" strokeWidth={1.8} />
              </button>

              <p className="mt-4 max-w-[300px] text-center text-[15px] leading-relaxed text-[#4E6358]">
                Speak naturally — Speak &amp; Translate Live listens and
                translates
              </p>

              {!recognitionSupported && (
                <p className="mt-2 text-center text-[12px] text-red-600">
                  Questo browser non supporta il riconoscimento vocale nativo.
                </p>
              )}
            </div>
          </section>
        </main>
      </div>
      <SettingsModal />
    </div>
  );
}

function TopActionButton({
  children,
  ariaLabel,
  onClick,
}: {
  children: ReactNode;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#1C6B3B] bg-[#1C6B3B] text-white shadow-[0_4px_10px_rgba(28,107,59,0.16)] transition hover:bg-[#165330] active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

function LanguageCard({
  value,
  onChange,
}: {
  value: Language;
  onChange: ChangeEventHandler<HTMLSelectElement>;
}) {
  return (
    <label className="relative block flex-1">
      <div className="pointer-events-none flex h-14 items-center rounded-[18px] border border-[#D7E3DA] bg-[rgba(255,255,255,0.88)] px-4 pr-10 text-[#243428] shadow-[0_8px_24px_rgba(22,42,28,0.08)]">
        <span className="mr-2 text-[22px]">{value.flag}</span>
        <span className="truncate text-[17px] font-medium">{value.label}</span>
        <ChevronDown className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1C6B3B]" />
      </div>

      <select
        value={value.code}
        onChange={onChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default App;
