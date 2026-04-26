import type { AppSettings, AppVoiceContext, ChatMessage, ChatResult, HistoryEntry, TranscribeResult, VoiceResult } from "../../shared/types";

interface SpeakNoteAPI {
  onToggleRecording: (callback: () => void) => void;
  onStartRecording: (callback: () => void) => void;
  onStopRecording: (callback: () => void) => void;
  onWindowShown: (callback: () => void) => void;
  onCancelRecording: (callback: () => void) => void;
  processVoice: (rawText: string, context: string) => Promise<VoiceResult>;
  sendChatMessage: (message: string, history: ChatMessage[]) => Promise<ChatResult>;
  transcribeAudio: (audioBuffer: ArrayBuffer, mimeType: string) => Promise<TranscribeResult>;
  copyToClipboard: (text: string) => Promise<void>;
  pasteToPreviousApp: () => Promise<void>;
  sendToLine: (text: string) => Promise<void>;
  sendToMail: (text: string) => Promise<void>;
  saveToNotes: (text: string) => Promise<void>;
  setRecordingState: (state: "idle" | "recording" | "processing") => Promise<void>;
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
