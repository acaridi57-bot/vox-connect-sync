import { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  ChevronDown,
  Mic,
  Send,
  Settings,
  Share2,
  Trash2,
} from "lucide-react";

type Language = {
  code: string;
  label: string;
  flag: string;
};

const languages: Language[] = [
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
];

function App() {
  const [fromLang, setFromLang] = useState<Language>(languages[0]);
  const [toLang, setToLang] = useState<Language>(languages[1]);
  const [text, setText] = useState("");

  const canSwap = useMemo(
    () => fromLang.code !== toLang.code,
    [fromLang.code, toLang.code]
  );

  const swapLanguages = () => {
    if (!canSwap) return;
    setFromLang(toLang);
    setToLang(fromLang);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FBF8_0%,#F1F7F3_52%,#EAF3ED_100%)] text-[#243428]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-6 pt-4 sm:max-w-lg">
        {/* HEADER */}
        <header className="mb-4 rounded-[24px] border border-[#D7E3DA] bg-white/55 px-4 py-4 shadow-[0_8px_24px_rgba(22,42,28,0.08)] backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 pr-1">
              <div className="leading-none text-[#1C6B3B]">
                <div
                  className="select-none text-[34px] italic tracking-[-0.03em] sm:text-[38px]"
                  style={{
                    fontFamily:
                      '"Brush Script MT","Segoe Script","Apple Chancery","Snell Roundhand",cursive',
                  }}
                >
                  ACaridi
                </div>

                <div className="mt-1 pl-[6px] text-[10px] font-medium uppercase tracking-[0.34em] text-[#2E4B38]">
                  Digital App
                </div>

                <div
                  className="mt-1 pl-[6px] text-[16px] italic text-[#1C6B3B]"
                  style={{
                    fontFamily:
                      '"Times New Roman",Georgia,"Palatino Linotype",serif',
                  }}
                >
                  Since 2026
                </div>
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-4 gap-2">
              <TopActionButton ariaLabel="Voice">
                <Mic className="h-4.5 w-4.5" />
              </TopActionButton>

              <TopActionButton ariaLabel="Delete">
                <Trash2 className="h-4.5 w-4.5" />
              </TopActionButton>

              <TopActionButton ariaLabel="Settings">
                <Settings className="h-4.5 w-4.5" />
              </TopActionButton>

              <TopActionButton ariaLabel="Share">
                <Share2 className="h-4.5 w-4.5" />
              </TopActionButton>
            </div>
          </div>

          <div className="mt-3">
            <h1 className="truncate text-[18px] font-semibold tracking-[-0.02em] text-[#243428] sm:text-[20px]">
              Speak &amp; Translate Live
            </h1>
          </div>
        </header>

        {/* LANGUAGE SELECTORS */}
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

        {/* MAIN CONTENT */}
        <main className="flex flex-1 flex-col">
          <section className="flex flex-1 items-center justify-center rounded-[28px] border border-[#D7E3DA] bg-white/35 px-6 py-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
            <div className="max-w-xs">
              <h2 className="text-[20px] font-semibold leading-snug text-[#2A4A35]">
                Tap the microphone to start translating
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#61736A]">
                Speak naturally — Speak &amp; Translate Live will detect and
                translate in real-time
              </p>
            </div>
          </section>

          {/* INPUT */}
          <section className="mt-5 border-t border-[#D7E3DA] pt-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-[18px] border border-[#D7E3DA] bg-white/90 shadow-[0_8px_24px_rgba(22,42,28,0.08)]">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={1}
                  placeholder="Scrivi un testo da tradurre..."
                  className="min-h-[52px] w-full resize-none bg-transparent px-4 py-3 text-[16px] text-[#243428] outline-none placeholder:text-[#7C8B82]"
                />
              </div>

              <button
                type="button"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#1C6B3B] bg-[#1C6B3B] text-white shadow-[0_4px_10px_rgba(28,107,59,0.16)] transition hover:bg-[#165330] active:scale-[0.98]"
                aria-label="Send text"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 px-1 text-[13px] text-[#6E7E75]">
              Enter per inviare · Shift+Enter per a capo
            </p>

            {/* MAIN CTA */}
            <div className="mt-6 flex flex-col items-center justify-center">
              <button
                type="button"
                className="flex h-28 w-28 items-center justify-center rounded-full border border-[#1C6B3B] bg-[#1C6B3B] text-white shadow-[0_14px_32px_rgba(28,107,59,0.22)] transition hover:bg-[#165330] active:scale-[0.98]"
                aria-label="Start voice translation"
              >
                <Mic className="h-12 w-12" strokeWidth={1.8} />
              </button>

              <p className="mt-4 max-w-[300px] text-center text-[15px] leading-relaxed text-[#4E6358]">
                Speak naturally — Speak &amp; Translate Live listens and
                translates
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function TopActionButton({
  children,
  ariaLabel,
}: {
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
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
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
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
