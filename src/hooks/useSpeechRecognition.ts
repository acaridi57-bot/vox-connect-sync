import { useRef, useCallback } from 'react';
import { useAppStore, type LanguagePair } from '@/store/useAppStore';

// Simple translation dictionary for demo (Web Speech API handles recognition)
const TRANSLATIONS: Record<string, Record<string, string>> = {
  'it-en': {
    'buongiorno': 'good morning',
    'buonasera': 'good evening',
    'ciao': 'hello',
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
};

function simpleTranslate(text: string, sourceLang: string, targetLang: string): string {
  const key = `${sourceLang.slice(0, 2)}-${targetLang.slice(0, 2)}`;
  const dict = TRANSLATIONS[key];
  if (dict) {
    const lower = text.toLowerCase().trim();
    if (dict[lower]) return dict[lower];
  }
  // Fallback: return with a marker
  return `[${targetLang.slice(0, 2).toUpperCase()}] ${text}`;
}

export function useSpeechRecognition() {
  const recognitionRef = useRef<any>(null);
  const addMessage = useAppStore((s) => s.addMessage);
  const setStatus = useAppStore((s) => s.setStatus);

  const startRecognition = useCallback((pair: LanguagePair, onSpeechEnd?: () => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition not available');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = pair.langA; // Start with langA, will also detect langB

    // Try to enable multi-language
    try {
      recognition.lang = pair.langA;
    } catch {}

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.trim();
          if (!transcript) continue;

          setStatus('processing');

          // Simple language detection: check if it matches langA patterns
          const isLangA = detectLanguage(transcript, pair);
          const sourceLang = isLangA ? pair.langA : pair.langB;
          const targetLang = isLangA ? pair.langB : pair.langA;
          const translated = simpleTranslate(transcript, sourceLang, targetLang);

          addMessage({
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            text: transcript,
            translatedText: translated,
            sourceLang: sourceLang.slice(0, 2).toUpperCase(),
            targetLang: targetLang.slice(0, 2).toUpperCase(),
            timestamp: Date.now(),
          });

          // TTS
          speakText(translated, targetLang, () => {
            setStatus('listening');
            onSpeechEnd?.();
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
      // Auto-restart if still in listening mode
      if (recognitionRef.current) {
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
    setStatus('idle');
  }, [setStatus]);

  return { startRecognition, stopRecognition };
}

function detectLanguage(text: string, pair: LanguagePair): boolean {
  // Simple heuristic: Italian detection by common patterns
  const langACode = pair.langA.slice(0, 2);
  if (langACode === 'it') {
    const italianPatterns = /\b(il|la|lo|le|gli|un|una|uno|di|da|in|con|su|per|che|non|è|sono|hai|ho|vorrei|dove|quanto|come|buon|ciao|grazie|favore|scusi)\b/i;
    return italianPatterns.test(text);
  }
  // Default: assume langA
  return true;
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
