// Simple translation dictionary for demo purposes.
// NOTE: This is not production-grade translation — replace with a real API when needed.

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  'it-en': {
    'buongiorno': 'good morning',
    'buonasera': 'good evening',
    'ciao': 'hello',
    'ciao come stai': 'hello how are you',
    'come stai': 'how are you',
    "dove si trova l'hotel": 'where is the hotel',
    'quanto costa': 'how much does it cost',
    'grazie': 'thank you',
    'per favore': 'please',
    'mi scusi': 'excuse me',
    'non capisco': "I don't understand",
    'parla inglese': 'do you speak english',
    'vorrei prenotare': 'I would like to book',
    'il conto per favore': 'the check please',
    "dov'è il bagno": 'where is the bathroom',
  },
  'en-it': {
    'good morning': 'buongiorno',
    'good evening': 'buonasera',
    'hello': 'ciao',
    'hello how are you': 'ciao come stai',
    'how are you': 'come stai',
    'where is the hotel': "dove si trova l'hotel",
    'how much does it cost': 'quanto costa',
    'thank you': 'grazie',
    'please': 'per favore',
    'excuse me': 'mi scusi',
    "I don't understand": 'non capisco',
    'do you speak italian': 'parla italiano',
    'I would like to book': 'vorrei prenotare',
    'the check please': 'il conto per favore',
    'where is the bathroom': "dov'è il bagno",
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
    "dove si trova l'hotel": 'dónde está el hotel',
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
    'dónde está el hotel': "dove si trova l'hotel",
  },
  'it-fr': {
    'buongiorno': 'bonjour',
    'ciao': 'salut',
    'ciao come stai': 'salut comment vas-tu',
    'come stai': 'comment vas-tu',
    'grazie': 'merci',
    'per favore': "s'il vous plaît",
  },
  'fr-it': {
    'bonjour': 'buongiorno',
    'salut': 'ciao',
    'comment vas-tu': 'come stai',
    'merci': 'grazie',
    "s'il vous plaît": 'per favore',
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

export function simpleTranslate(text: string, sourceCode: string, targetCode: string): string {
  const srcShort = sourceCode.slice(0, 2);
  const tgtShort = targetCode.slice(0, 2);
  const key = `${srcShort}-${tgtShort}`;
  const dict = TRANSLATIONS[key];
  if (dict) {
    const lower = text.toLowerCase().trim();
    if (dict[lower]) return dict[lower];
  }
  return text;
}
