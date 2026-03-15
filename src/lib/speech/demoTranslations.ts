/**
 * translateText — tries multiple free translation APIs in order.
 * 1. MyMemory (free, CORS-enabled)
 * 2. Lingva (Google Translate proxy, CORS-enabled)
 * 3. Returns original text as last resort
 */
export async function translateText(
  text: string,
  sourceCode: string,
  targetCode: string,
): Promise<string> {
  const src = sourceCode.slice(0, 2).toLowerCase();
  const tgt = targetCode.slice(0, 2).toLowerCase();
  if (src === tgt) return text;

  // --- 1. MyMemory ---
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${tgt}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data?.responseStatus === 200 && data?.responseData?.translatedText) {
        const t = data.responseData.translatedText as string;
        if (t && t.toLowerCase() !== text.toLowerCase()) {
          console.log(`[VT] MyMemory: "${text}" → "${t}"`);
          return t;
        }
      }
    }
  } catch { /* try next */ }

  // --- 2. Lingva (Google Translate proxy) ---
  try {
    const url = `https://lingva.ml/api/v1/${src}/${tgt}/${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const t = data?.translation as string;
      if (t && t.toLowerCase() !== text.toLowerCase()) {
        console.log(`[VT] Lingva: "${text}" → "${t}"`);
        return t;
      }
    }
  } catch { /* try next */ }

  console.warn(`[VT] All APIs failed for: "${text}"`);
  return text;
}

export function simpleTranslate(text: string, _src: string, _tgt: string): string {
  return text;
}
