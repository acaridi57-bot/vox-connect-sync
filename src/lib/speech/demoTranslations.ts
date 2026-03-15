export async function translateText(text: string, sourceCode: string, targetCode: string): Promise<string> {
  const s = sourceCode.slice(0, 2).toLowerCase();
  const t = targetCode.slice(0, 2).toLowerCase();
  if (s === t) return text;

  // Google Translate uses zh-CN / zh-TW, not plain "zh"
  const fix: Record<string, string> = { zh: 'zh-CN' };
  const sA = fix[s] ?? s;
  const tA = fix[t] ?? t;

  const isChinese = s === 'zh' || t === 'zh';

  // ── For Chinese: ONLY use Google Translate ──────────────────────────────
  if (isChinese) {
    try {
      const r = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sA}&tl=${tA}&dt=t&q=${encodeURIComponent(text)}`
      );
      if (r.ok) {
        const d = await r.json();
        const o: string = (d?.[0] ?? []).map((c: any[]) => c?.[0] ?? '').join('');
        if (o && o.toLowerCase() !== text.toLowerCase()) {
          console.log(`[VT] Google ZH: "${text}" → "${o}"`);
          return o;
        }
      }
    } catch {}
    return text;
  }

  // ── For all other languages: try MyMemory first, Google as fallback ──────
  try {
    const r = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sA}|${tA}`
    );
    if (r.ok) {
      const d = await r.json();
      if (d?.responseStatus === 200 && d?.responseData?.translatedText) {
        const o = d.responseData.translatedText as string;
        if (o && o.toLowerCase() !== text.toLowerCase()) {
          console.log(`[VT] MyMemory: "${text}" → "${o}"`);
          return o;
        }
      }
    }
  } catch {}

  try {
    const r = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sA}&tl=${tA}&dt=t&q=${encodeURIComponent(text)}`
    );
    if (r.ok) {
      const d = await r.json();
      const o: string = (d?.[0] ?? []).map((c: any[]) => c?.[0] ?? '').join('');
      if (o && o.toLowerCase() !== text.toLowerCase()) {
        console.log(`[VT] Google: "${text}" → "${o}"`);
        return o;
      }
    }
  } catch {}

  return text;
}

export function simpleTranslate(t: string, _s: string, _g: string): string { return t; }
