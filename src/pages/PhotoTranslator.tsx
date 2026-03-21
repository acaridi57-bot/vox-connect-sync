import { useState, useCallback, useRef } from "react";
import { ArrowLeft, Camera, Upload, Languages, Copy, Volume2 } from "lucide-react";
import { createWorker } from "tesseract.js";
import { useNavigate } from "react-router-dom";
import { useAppStore, LANGUAGES } from "@/store/useAppStore";
import { translateText } from "@/lib/speech/demoTranslations";
import { speakTextWithSettings } from "@/lib/speech/tts";

export default function PhotoTranslator() {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const sourceLangCode = useAppStore((s) => s.sourceLangCode);
  const targetLangCode = useAppStore((s) => s.targetLangCode);
  const setSourceLangCode = useAppStore((s) => s.setSourceLangCode);
  const setTargetLangCode = useAppStore((s) => s.setTargetLangCode);

  const handleImageSelect = useCallback(async (file: File) => {
    setError("");
    setTranslatedText("");
    setExtractedText("");
    
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setIsProcessing(true);

    try {
      // OCR with Tesseract.js
      const langMap: Record<string, string> = {
        "it-IT": "ita", "en-US": "eng", "es-ES": "spa",
        "fr-FR": "fra", "de-DE": "deu", "zh-CN": "chi_sim", "sq-AL": "sqi",
      };
      const ocrLang = langMap[sourceLangCode] || "eng";

      const worker = await createWorker(ocrLang, 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      const { data: { text: ocrText } } = await worker.recognize(url);
      await worker.terminate();

      const cleanText = ocrText.trim();
      if (!cleanText) {
        setError("Nessun testo rilevato nell'immagine. Prova con un'immagine più nitida.");
        setIsProcessing(false);
        return;
      }

      setExtractedText(cleanText);
      const translated = await translateText(cleanText.slice(0, 2000), sourceLangCode, targetLangCode);
      setTranslatedText(translated);
    } catch {
      setError("Errore durante l'elaborazione dell'immagine. Riprova.");
    } finally {
      setIsProcessing(false);
    }
  }, [sourceLangCode, targetLangCode]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
  }, [handleImageSelect]);

  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    alert("Testo copiato!");
  }, []);

  const handleSpeak = useCallback((text: string) => {
    speakTextWithSettings(text, targetLangCode, () => {});
  }, [targetLangCode]);

  const handleRetranslate = useCallback(async () => {
    if (!extractedText) return;
    setIsProcessing(true);
    setError("");
    try {
      const translated = await translateText(extractedText, sourceLangCode, targetLangCode);
      setTranslatedText(translated);
    } catch {
      setError("Errore durante la traduzione.");
    } finally {
      setIsProcessing(false);
    }
  }, [extractedText, sourceLangCode, targetLangCode]);

  return (
    <div className="min-h-screen bg-transparent text-[#243428]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-6 pt-4 sm:max-w-lg">
        {/* Header */}
        <header className="mb-4 rounded-[24px] border border-[#D7E3DA] bg-white/55 px-4 py-4 shadow-[0_8px_24px_rgba(22,42,28,0.08)] backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D7E3DA] bg-white text-[#1C6B3B] transition hover:bg-[#F4F8F5]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Camera className="h-6 w-6 text-[#1C6B3B]" />
              <h1 className="text-[22px] font-semibold text-[#1C6B3B]">Traduttore Foto</h1>
            </div>
          </div>
        </header>

        {/* Language selector */}
        <section className="mb-4">
          <div className="flex items-center gap-3">
            <select
              value={sourceLangCode}
              onChange={(e) => setSourceLangCode(e.target.value)}
              className="flex-1 h-12 rounded-[18px] border border-[#D7E3DA] bg-white/90 px-4 text-[15px] font-medium text-[#243428] outline-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
            <Languages className="h-5 w-5 text-[#1C6B3B] shrink-0" />
            <select
              value={targetLangCode}
              onChange={(e) => setTargetLangCode(e.target.value)}
              className="flex-1 h-12 rounded-[18px] border border-[#D7E3DA] bg-white/90 px-4 text-[15px] font-medium text-[#243428] outline-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Upload area */}
        {!imageUrl ? (
          <section className="flex-1 flex flex-col items-center justify-center gap-6 rounded-[28px] border-2 border-dashed border-[#D7E3DA] bg-white/35 p-8">
            <div className="text-center">
              <Camera className="mx-auto h-16 w-16 text-[#1C6B3B]/40 mb-4" />
              <p className="text-[18px] font-semibold text-[#2A4A35]">Scatta o carica una foto</p>
              <p className="mt-2 text-[14px] text-[#61736A]">Il testo verrà estratto e tradotto automaticamente</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-2 rounded-full border border-[#1C6B3B] bg-[#1C6B3B] px-6 py-3 text-[15px] font-medium text-white shadow-[0_4px_10px_rgba(28,107,59,0.16)] transition hover:bg-[#165330]"
              >
                <Camera className="h-5 w-5" />
                Scatta
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-full border-2 border-[#1C6B3B] bg-white px-6 py-3 text-[15px] font-medium text-[#1C6B3B] transition hover:bg-[#F4F8F5]"
              >
                <Upload className="h-5 w-5" />
                Carica
              </button>
            </div>

            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </section>
        ) : (
          <section className="flex-1 flex flex-col gap-4">
            {/* Image preview */}
            <div className="rounded-[20px] border border-[#D7E3DA] bg-white/80 p-3 shadow-[0_8px_24px_rgba(22,42,28,0.08)]">
              <img src={imageUrl} alt="Foto caricata" className="w-full rounded-[16px] object-contain max-h-[200px]" />
            </div>

            {isProcessing && (
              <div className="flex flex-col items-center justify-center gap-2 py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1C6B3B] border-t-transparent" />
                <span className="text-[15px] text-[#61736A]">
                  {ocrProgress > 0 ? `Riconoscimento testo... ${ocrProgress}%` : "Caricamento OCR..."}
                </span>
                {ocrProgress > 0 && (
                  <div className="w-48 h-2 rounded-full bg-[#D7E3DA] overflow-hidden">
                    <div className="h-full rounded-full bg-[#1C6B3B] transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-center text-[13px] text-red-600">{error}</p>}

            {extractedText && (
              <div className="rounded-[20px] border border-[#D7E3DA] bg-white/80 p-4 shadow-[0_8px_24px_rgba(22,42,28,0.08)]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#61736A]">Testo estratto</p>
                  <button onClick={() => handleCopy(extractedText)} className="p-1.5 rounded-full hover:bg-[#F4F8F5]">
                    <Copy className="h-4 w-4 text-[#1C6B3B]" />
                  </button>
                </div>
                <p className="text-[15px] leading-relaxed text-[#243428]">{extractedText}</p>
              </div>
            )}

            {translatedText && (
              <div className="rounded-[20px] border border-[#D7E3DA] bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_8px_24px_rgba(22,42,28,0.08)]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#61736A]">Traduzione</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleSpeak(translatedText)} className="p-1.5 rounded-full hover:bg-[#F4F8F5]">
                      <Volume2 className="h-4 w-4 text-[#1C6B3B]" />
                    </button>
                    <button onClick={() => handleCopy(translatedText)} className="p-1.5 rounded-full hover:bg-[#F4F8F5]">
                      <Copy className="h-4 w-4 text-[#1C6B3B]" />
                    </button>
                  </div>
                </div>
                <p className="text-[17px] font-medium leading-relaxed text-[#243428]">{translatedText}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => { setImageUrl(null); setExtractedText(""); setTranslatedText(""); setError(""); }}
                className="flex-1 rounded-full border-2 border-[#1C6B3B] bg-white py-3 text-[15px] font-medium text-[#1C6B3B] transition hover:bg-[#F4F8F5]"
              >
                Nuova foto
              </button>
              {extractedText && (
                <button
                  onClick={handleRetranslate}
                  disabled={isProcessing}
                  className="flex-1 rounded-full border border-[#1C6B3B] bg-[#1C6B3B] py-3 text-[15px] font-medium text-white transition hover:bg-[#165330] disabled:opacity-50"
                >
                  Ritraduci
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
