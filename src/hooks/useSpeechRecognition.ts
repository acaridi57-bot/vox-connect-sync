import { useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';

// Simple translation dictionary for demo
const TRANSLATIONS: Record<string, Record<string, string>> = {
  'it-en': {
    'buongiorno': 'good morning',
    'buonasera': 'good evening',
    'ciao': 'hello',
    'ciao come stai': 'hello how are you',
    'come stai': 'how are you',
    'dove si trova l\'hotel': 'where is the hotel',
    'quanto costa': 'how much does it cost',
    'grazie': 'thank you',
    'per favore': 'please',
    'mi scusi': 'excuse me',
    'non capisco': 'I don\'t understand',
    'parla inglese': 'do you speak english',
    'vorrei prenotare': 'I would like to book',
    'il conto per favore': 'the check please',
    'dov\'è il bagno': 'where is the bathroom',
  },
  'en-it': {
    'good morning': 'buongiorno',
    'good evening': 'buonasera',
    'hello': 'ciao',
    'hello how are you': 'ciao come stai',
    'how are you': 'come stai',
    'where is the hotel': 'dove si trova l\'hotel',
    'how much does it cost': 'quanto costa',
    'thank you': 'grazie',
    'please': 'per favore',
    'excuse me': 'mi scusi',
    'I don\'t understand': 'non capisco',
    'do you speak italian': 'parla italiano',
    'I would like to book': 'vorrei prenotare',
    'the check please': 'il conto per favore',
    'where is the bathroom': 'dov\'è il bagno',
  },
  'it-es': {
    'buongiorno': 'buenos días',
    'buonasera': 'buenas tardes',
    'ciao': 'hola',
    'ciao come stai': 'hola cómo estás',
    'come stai': 'cómo estás',
    'grazie': 'gracias',
    'per favore': 'por favor',
    'quanto costa': 'cuánto cuesta',
    'dove si trova l\'hotel': 'dónde está el hotel',
  },
  'es-it': {
    'buenos días': 'buongiorno',
    'buenas tardes': 'buonasera',
    'hola': 'ciao',
    'hola cómo estás': 'ciao come stai',
    'cómo estás': 'come stai',
    'gracias': 'grazie',
    'por favor': 'per favore',
    'cuánto cuesta': 'quanto costa',
    'dónde está el hotel': 'dove si trova l\'hotel',
  },
  'it-fr': {
    'buongiorno': 'bonjour',
    'ciao': 'salut',
    'ciao come stai': 'salut comment vas-tu',
    'come stai': 'comment vas-tu',
    'grazie': 'merci',
    'per favore': 's\'il vous plaît',
  },
  'fr-it': {
    'bonjour': 'buongiorno',
    'salut': 'ciao',
    'comment vas-tu': 'come stai',
    'merci': 'grazie',
    's\'il vous plaît': 'per favore',
  },
  'it-de': {
    'buongiorno': 'guten Morgen',
    'ciao': 'hallo',
    'ciao come stai': 'hallo wie geht es dir',
    'come stai': 'wie geht es dir',
    'grazie': 'danke',
    'per favore': 'bitte',
  },
  'de-it': {
    'guten morgen': 'buongiorno',
    'hallo': 'ciao',
    'wie geht es dir': 'come stai',
    'danke': 'grazie',
    'bitte': 'per favore',
  },
  'it-zh': {
    'buongiorno': '早上好',
    'ciao': '你好',
    'ciao come stai': '你好你好吗',
    'come stai': '你好吗',
    'grazie': '谢谢',
  },
  'zh-it': {
    '早上好': 'buongiorno',
    '你好': 'ciao',
    '你好吗': 'come stai',
    '谢谢': 'grazie',
  },
};

const LANG_PATTERNS: Record<string, RegExp> = {
  'it': /\b(il|la|lo|le|gli|un|una|uno|di|da|in|con|su|per|che|non|è|sono|hai|ho|vorrei|dove|quanto|come|buon|ciao|grazie|favore|scusi|stai|buongiorno)\b/i,
  'es': /\b(el|la|los|las|un|una|de|en|con|por|que|no|es|son|tiene|hola|gracias|por favor|donde|cuanto|cómo|estás|buenos|días)\b/i,
  'fr': /\b(le|la|les|un|une|de|du|en|dans|avec|pour|que|ne|est|sont|bonjour|merci|où|combien|comment|salut)\b/i,
  'de': /\b(der|die|das|ein|eine|von|in|mit|für|dass|nicht|ist|sind|hat|hallo|danke|bitte|wo|wie|guten)\b/i,
  'zh': /[\u4e00-\u9fff]/,
  'en': /\b(the|a|an|is|are|was|were|have|has|do|does|not|and|or|but|in|on|at|to|for|of|with|hello|thank|please|where|how|you|what|good|morning)\b/i,
};

function detectSpokenLanguage(text: string): string | null {
  let bestMatch: string | null = null;
  let bestScore = 0;
  for (const [code, pattern] of Object.entries(LANG_PATTERNS)) {
    const matches = text.match(new RegExp(pattern, 'gi'));
    const score = matches ? matches.length : 0;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = code;
    }
  }
  return bestMatch;
}

function simpleTranslate(text: string, sourceCode: string, targetCode: string): string {
  const srcShort = sourceCode.slice(0, 2);
  const tgtShort = targetCode.slice(0, 2);
  const key = `${srcShort}-${tgtShort}`;
  const dict = TRANSLATIONS[key];
  if (dict) {
    const lower = text.toLowerCase().trim();
    if (dict[lower]) return dict[lower];
  }
  return `[${tgtShort.toUpperCase()}] ${text}`;
}

export function useSpeechRecognition() {
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);
  const addMessage = useAppStore((s) => s.addMessage);
  const setStatus = useAppStore((s) => s.setStatus);

  const startRecognition = useCallback((
    onPauseMic: () => void,
    onResumeMic: () => void,
  ) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition not available');
      return;
    }

    // Read current language from store
    const { sourceLangCode } = useAppStore.getState();

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = sourceLangCode;

    recognition.onresult = (event: any) => {
      // Ignore results while TTS is playing
      if (isSpeakingRef.current) return;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.trim();
          if (!transcript) continue;

          // Read CURRENT language selection from store (not stale closure)
          const { sourceLangCode: src, targetLangCode: tgt } = useAppStore.getState();

          setStatus('processing');

          const srcShort = src.slice(0, 2);
          const tgtShort = tgt.slice(0, 2);
          const detected = detectSpokenLanguage(transcript);

          let actualSource = src;
          let actualTarget = tgt;

          if (detected === tgtShort) {
            actualSource = tgt;
            actualTarget = src;
          }

          const translated = simpleTranslate(transcript, actualSource, actualTarget);

          addMessage({
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            text: transcript,
            translatedText: translated,
            sourceLang: actualSource.slice(0, 2).toUpperCase(),
            targetLang: actualTarget.slice(0, 2).toUpperCase(),
            timestamp: Date.now(),
          });

          // Anti-feedback: pause mic + ignore results during TTS
          isSpeakingRef.current = true;
          onPauseMic();
          setStatus('speaking');

          speakText(translated, actualTarget, () => {
            isSpeakingRef.current = false;
            setStatus('listening');
            onResumeMic();
          });
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current) {
        // Update language to current selection when restarting
        const { sourceLangCode: currentSrc } = useAppStore.getState();
        recognition.lang = currentSrc;
        try { recognition.start(); } catch {}
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setStatus('listening');
  }, [addMessage, setStatus]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    isSpeakingRef.current = false;
    setStatus('idle');
  }, [setStatus]);

  return { startRecognition, stopRecognition };
}

function speakText(text: string, lang: string, onEnd?: () => void) {
  if (!window.speechSynthesis) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 1;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}
