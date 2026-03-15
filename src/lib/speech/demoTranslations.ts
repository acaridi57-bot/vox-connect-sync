/**
 * translateText — uses Claude API (Anthropic) for translation.
 * No CORS issues, works on Lovable, no extra API key needed.
 */
export async function translateText(
  text: string,
  sourceCode: string,
  targetCode: string,
): Promise<string> {
  const src = sourceCode.slice(0, 2).toLowerCase();
  const tgt = targetCode.slice(0, 2).toLowerCase();

  if (src === tgt) return text;

  const langNames: Record<string, string> = {
    it: 'Italian', en: 'English', es: 'Spanish',
    fr: 'French',  de: 'German',  zh: 'Chinese',
  };

  const srcName = langNames[src] ?? src;
  const tgtName = langNames[tgt] ?? tgt;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system:
          `You are a translator. Translate the user's text from ${srcName} to ${tgtName}. ` +
          `Reply with ONLY the translated text, no explanations, no quotes, no extra words.`,
        messages: [{ role: 'user', content: text }],
      }),
    });

    if (!response.ok) {
      console.error('[VoxTranslate] API error:', response.status);
      return text;
    }

    const data = await response.json();
    const translated: string = data?.content?.[0]?.text?.trim() ?? '';
    console.log(`[VoxTranslate] "${text}" → "${translated}" (${src}→${tgt})`);
    return translated || text;
  } catch (err) {
    console.error('[VoxTranslate] error:', err);
    return text;
  }
}

// Legacy — kept for type-compat only
export function simpleTranslate(text: string, _src: string, _tgt: string): string {
  return text;
}
