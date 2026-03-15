/**
 * translateText — real translation via MyMemory API (free, no API key required).
 * Falls back to the original text if the API is unreachable or returns an error.
 *
 * API docs: https://mymemory.translated.net/doc/spec.php
 */
export async function translateText(
  text: string,
  sourceCode: string,
  targetCode: string,
): Promise<string> {
  const srcShort = sourceCode.slice(0, 2).toLowerCase();
  const tgtShort = targetCode.slice(0, 2).toLowerCase();

  // Nothing to translate if same language.
  if (srcShort === tgtShort) return text;

  try {
    const url =
      `https://api.mymemory.translated.net/get` +
      `?q=${encodeURIComponent(text)}` +
      `&langpair=${srcShort}|${tgtShort}`;

    const res = await fetch(url);
    if (!res.ok) return text;

    const data = await res.json();

    // MyMemory returns responseStatus 200 on success.
    if (data?.responseStatus === 200 && data?.responseData?.translatedText) {
      return data.responseData.translatedText as string;
    }

    return text;
  } catch {
    return text;
  }
}

// ── Kept for compatibility — not used anymore ──
export function simpleTranslate(text: string, _src: string, _tgt: string): string {
  return text;
}
