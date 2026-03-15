export async function translateText(text: string, sourceCode: string, targetCode: string): Promise<string> {
  const s = sourceCode.slice(0, 2).toLowerCase();
  const t = targetCode.slice(0, 2).toLowerCase();
  if (s === t) return text;

  const fix: Record<string, string> = { zh: 'zh-CN' };
  const sA = fix[s] ?? s;
  const tA = fix[t] ?? t;
  const isChinese = s === 'zh' || t === 'zh';

  if (isChinese) {
    try {
      const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sA}&tl=${tA}&dt=t&q=${encodeURIComponent(text)}`);
      if (r.ok) {
        const d = await r.json();
        const o: string = (d?.[0] ?? []).map((c: any[]) => c?.[0] ?? '').join('');
        if (o && o.toLowerCase() !== text.toLowerCase()) return o;
      }
    } catch {}
    return text;
  }

  try {
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sA}|${tA}`);
    if (r.ok) {
      const d = await r.json();
      if (d?.responseStatus === 200 && d?.responseData?.translatedText) {
        const o = d.responseData.translatedText as string;
        if (o && o.toLowerCase() !== text.toLowerCase()) return o;
      }
    }
  } catch {}

  try {
    const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sA}&tl=${tA}&dt=t&q=${encodeURIComponent(text)}`);
    if (r.ok) {
      const d = await r.json();
      const o: string = (d?.[0] ?? []).map((c: any[]) => c?.[0] ?? '').join('');
      if (o && o.toLowerCase() !== text.toLowerCase()) return o;
    }
  } catch {}

  return text;
}

export function simpleTranslate(t: string, _s: string, _g: string): string { return t; }
