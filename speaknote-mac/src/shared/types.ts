export type AppVoiceContext = "free_text" | "daytime_memo" | "morning_mit";

export type VoiceResult = {
  cleaned: string;
  raw?: string;
  tasks?: string[];
  error?: string;
};

export type HistoryEntry = {
  id: string;
  raw: string;
  cleaned: string;
  tasks?: string[];
  context: AppVoiceContext;
  timestamp: number;
};

export type DictionaryEntry = {
  from: string; // 読み (誤認識されやすい音)
  to: string;   // 表記 (正しい人名・固有名詞)
};

export type AppSettings = {
  apiKey: string;
  openaiApiKey: string;
  shortcut: string;
  autoCopy: boolean;
  autoPaste: boolean;
  transcribePrompt: string;
  dictionary: DictionaryEntry[];
  vadEnabled: boolean;
  vadSilenceMs: number;
  aiEnabled: boolean;
  autoLearnEnabled: boolean;
};

export type TranscribeResult = {
  text: string;
  error?: string;
};

// Web Speech API types for Electron/Chromium
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export type { SpeechRecognition, SpeechRecognitionEvent };
