/**
 * translateText — Google Translate unofficial API (no key, works from browser).
 * Falls back to original text on any error.
 */
export async function translateText(
  text: string,
  sourceCode: string,
  targetCode: string,
): Promise<string> {
  const src = sourceCode.slice(0, 2).toLowerCase();
  const tgt = targetCode.slice(0, 2).toLowerCase();

  if (src === tgt) return text;

  try {
    const url =
      `https://translate.googleapis.com/translate_a/single` +
      `?client=gtx&sl=${src}&tl=${tgt}&dt=t&q=${encodeURIComponent(text)}`;

    const res = await fetch(url);
    if (!res.ok) {
      console.error('[VoxTranslate] fetch error:', res.status, res.statusText);
      return text;
    }

    const data = await res.json();
    // Response is a nested array: [[["translated","original",...],...],...]
    const translated: string = data?.[0]
      ?.map((chunk: any[]) => chunk?.[0] ?? '')
      .join('') ?? '';

    console.log(`[VoxTranslate] "${text}" → "${translated}" (${src}→${tgt})`);
    return translated || text;
  } catch (err) {
    console.error('[VoxTranslate] translation error:', err);
    return text;
  }
}

// Legacy — kept for type-compat only
export function simpleTranslate(text: string, _src: string, _tgt: string): string {
  return text;
}
