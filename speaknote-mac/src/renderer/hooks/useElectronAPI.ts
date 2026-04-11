import type { AppSettings, AppVoiceContext, HistoryEntry, VoiceResult } from "../../shared/types";

interface SpeakNoteAPI {
  onToggleRecording: (callback: () => void) => void;
  onWindowShown: (callback: () => void) => void;
  processVoice: (rawText: string, context: string) => Promise<VoiceResult>;
  copyToClipboard: (text: string) => Promise<void>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<void>;
  getHistory: () => Promise<HistoryEntry[]>;
  addHistory: (entry: HistoryEntry) => Promise<void>;
  clearHistory: () => Promise<void>;
}

declare global {
  interface Window {
    speaknoteAPI: SpeakNoteAPI;
  }
}

export function useElectronAPI(): SpeakNoteAPI {
  return window.speaknoteAPI;
}
