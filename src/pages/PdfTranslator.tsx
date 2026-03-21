import { useState, useCallback, useRef } from "react";
import { ArrowLeft, FileText, Upload, Languages, Copy, Volume2, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore, LANGUAGES } from "@/store/useAppStore";
import { translateText } from "@/lib/speech/demoTranslations";
import { speakTextWithSettings } from "@/lib/speech/tts";

export default function PdfTranslator() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sourceLangCode = useAppStore((s) => s.sourceLangCode);
  const targetLangCode = useAppStore((s) => s.targetLangCode);
  const setSourceLangCode = useAppStore((s) => s.setSourceLangCode);
  const setTargetLangCode = useAppStore((s) => s.setTargetLangCode);

  const handleFileSelect = useCallback(async (file: File) => {
    setError("");
    setTranslatedText("");
    setExtractedText("");
    setFileName(file.name);
    setIsProcessing(true);

    try {
      // Read text from the PDF file
      // In production, use pdf.js or a server-side PDF parser
      // For demo, we read as text or simulate extraction
      const text = await file.text().catch(() => "");
      
      let extracted: string;
      if (text && text.length > 20 && !text.includes("\u0000")) {
        // Use actual file text content (works for text-based files)
        extracted = text.slice(0, 2000);
      } else {
        // Simulated PDF text extraction for binary PDFs
        await new Promise((r) => setTimeout(r, 2000));
        const demoPdfTexts = [
          "Contratto di locazione: Il presente contratto regola i rapporti tra il locatore e il conduttore per l'immobile sito in Via Roma 42, Milano. La durata del contratto è di 4 anni con rinnovo automatico.",
          "Terms and Conditions: By using this service, you agree to comply with all applicable laws and regulations. The company reserves the right to modify these terms at any time.",
          "Informe de ventas del tercer trimestre 2025. Las ventas totales aumentaron un 15% respecto al trimestre anterior, alcanzando los 2.5 millones de euros.",
          "Rapport annuel: Les résultats financiers de l'exercice 2025 montrent une croissance significative du chiffre d'affaires, atteignant 10 millions d'euros.",
        ];
        extracted = demoPdfTexts[Math.floor(Math.random() * demoPdfTexts.length)];
      }

      setExtractedText(extracted);
      const translated = await translateText(extracted.slice(0, 500), sourceLangCode, targetLangCode);
      setTranslatedText(translated);
    } catch {
      setError("Errore durante l'elaborazione del PDF. Riprova.");
    } finally {
      setIsProcessing(false);
    }
  }, [sourceLangCode, targetLangCode]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

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
      const translated = await translateText(extractedText.slice(0, 500), sourceLangCode, targetLangCode);
      setTranslatedText(translated);
    } catch {
      setError("Errore durante la traduzione.");
    } finally {
      setIsProcessing(false);
    }
  }, [extractedText, sourceLangCode, targetLangCode]);

  const handleDownloadTranslation = useCallback(() => {
    if (!translatedText) return;
    const blob = new Blob([translatedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traduzione_${fileName || "documento"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [translatedText, fileName]);

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
              <FileText className="h-6 w-6 text-[#1C6B3B]" />
              <h1 className="text-[22px] font-semibold text-[#1C6B3B]">Traduttore PDF</h1>
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
        {!fileName ? (
          <section className="flex-1 flex flex-col items-center justify-center gap-6 rounded-[28px] border-2 border-dashed border-[#D7E3DA] bg-white/35 p-8">
            <div className="text-center">
              <FileText className="mx-auto h-16 w-16 text-[#1C6B3B]/40 mb-4" />
              <p className="text-[18px] font-semibold text-[#2A4A35]">Carica un file PDF</p>
              <p className="mt-2 text-[14px] text-[#61736A]">Il testo verrà estratto e tradotto automaticamente</p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-full border border-[#1C6B3B] bg-[#1C6B3B] px-8 py-3 text-[15px] font-medium text-white shadow-[0_4px_10px_rgba(28,107,59,0.16)] transition hover:bg-[#165330]"
            >
              <Upload className="h-5 w-5" />
              Seleziona PDF
            </button>

            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx" className="hidden" onChange={handleFileChange} />
          </section>
        ) : (
          <section className="flex-1 flex flex-col gap-4">
            {/* File info */}
            <div className="flex items-center gap-3 rounded-[20px] border border-[#D7E3DA] bg-white/80 p-4 shadow-[0_8px_24px_rgba(22,42,28,0.08)]">
              <FileText className="h-8 w-8 text-[#1C6B3B] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-[#243428] truncate">{fileName}</p>
                <p className="text-[12px] text-[#61736A]">File caricato</p>
              </div>
            </div>

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1C6B3B] border-t-transparent" />
                <span className="text-[15px] text-[#61736A]">Elaborazione in corso...</span>
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
                <p className="text-[14px] leading-relaxed text-[#243428] max-h-[150px] overflow-y-auto">{extractedText}</p>
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
                    <button onClick={handleDownloadTranslation} className="p-1.5 rounded-full hover:bg-[#F4F8F5]">
                      <Download className="h-4 w-4 text-[#1C6B3B]" />
                    </button>
                  </div>
                </div>
                <p className="text-[16px] font-medium leading-relaxed text-[#243428] max-h-[200px] overflow-y-auto">{translatedText}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => { setFileName(""); setExtractedText(""); setTranslatedText(""); setError(""); }}
                className="flex-1 rounded-full border-2 border-[#1C6B3B] bg-white py-3 text-[15px] font-medium text-[#1C6B3B] transition hover:bg-[#F4F8F5]"
              >
                Nuovo file
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
