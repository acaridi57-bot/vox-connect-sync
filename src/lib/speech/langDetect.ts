type ShortLang = 'it' | 'en' | 'es' | 'fr' | 'de' | 'zh';

// Intentionally uses more distinctive tokens to reduce false positives between IT/DE/EN.
const LANG_PATTERNS: Record<ShortLang, RegExp> = {
  it: /(buongiorno|buonasera|ciao|grazie|per favore|scusi|conto|bagno|vorrei|dov(e|'è)|quanto|come stai)/gi,
  es: /(hola|gracias|por favor|buenos d[ií]as|buenas tardes|d[oó]nde|cu[aá]nto|c[oó]mo est[aá]s)/gi,
  fr: /(bonjour|salut|merci|s'il vous pla[iî]t|o[uù]|combien|comment vas-tu)/gi,
  de: /(guten|hallo|danke|bitte|wie geht|wo ist|ich|nicht)/gi,
  en: /(hello|thank you|please|good morning|good evening|where is|how much|how are you|excuse me)/gi,
  zh: /[\u4e00-\u9fff]/g,
};

function scoreFor(text: string, short: ShortLang): number {
  const pattern = LANG_PATTERNS[short];
  if (!pattern) return 0;
  const matches = text.match(pattern);
  return matches?.length ?? 0;
}

/**
 * Decide whether to flip translation direction (user likely spoke the target language).
 * We only compare the two selected languages to avoid mis-detection across all languages.
 */
export function shouldFlipDirection(text: string, sourceLangCode: string, targetLangCode: string): boolean {
  const src = sourceLangCode.slice(0, 2) as ShortLang;
  const tgt = targetLangCode.slice(0, 2) as ShortLang;
  if (src === tgt) return false;

  const srcScore = scoreFor(text, src);
  const tgtScore = scoreFor(text, tgt);

  // Flip only when target evidence is meaningfully stronger.
  if (tgtScore === 0) return false;
  if (srcScore === 0 && tgtScore > 0) return true;
  return tgtScore >= srcScore + 2;
}
