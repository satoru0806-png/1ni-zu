import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("speaknoteAPI", {
  // Main -> Renderer events
  onToggleRecording: (callback: () => void) => {
    ipcRenderer.removeAllListeners("toggle-recording");
    ipcRenderer.on("toggle-recording", () => callback());
  },
  onStartRecording: (callback: () => void) => {
    ipcRenderer.removeAllListeners("start-recording");
    ipcRenderer.on("start-recording", () => callback());
  },
  onStopRecording: (callback: () => void) => {
    ipcRenderer.removeAllListeners("stop-recording");
    ipcRenderer.on("stop-recording", () => callback());
  },
  onWindowShown: (callback: () => void) => {
    ipcRenderer.removeAllListeners("window-shown");
    ipcRenderer.on("window-shown", () => callback());
  },
  onCancelRecording: (callback: () => void) => {
    ipcRenderer.removeAllListeners("cancel-recording");
    ipcRenderer.on("cancel-recording", () => callback());
  },

  // Renderer -> Main calls
  processVoice: (rawText: string, context: string) =>
    ipcRenderer.invoke("process-voice", rawText, context),
  transcribeAudio: (audioBuffer: ArrayBuffer, mimeType: string) =>
    ipcRenderer.invoke("transcribe-audio", audioBuffer, mimeType),
  copyToClipboard: (text: string) =>
    ipcRenderer.invoke("copy-to-clipboard", text),
  pasteToPreviousApp: () => ipcRenderer.invoke("paste-to-previous-app"),
  sendToLine: (text: string) => ipcRenderer.invoke("send-to-line", text),
  sendToMail: (text: string) => ipcRenderer.invoke("send-to-mail", text),
  saveToNotes: (text: string) => ipcRenderer.invoke("save-to-notes", text),
  setRecordingState: (state: "idle" | "recording" | "processing") =>
    ipcRenderer.invoke("set-recording-state", state),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings: Record<string, unknown>) =>
    ipcRenderer.invoke("save-settings", settings),
  getHistory: () => ipcRenderer.invoke("get-history"),
  addHistory: (entry: Record<string, unknown>) =>
    ipcRenderer.invoke("add-history", entry),
  clearHistory: () => ipcRenderer.invoke("clear-history"),
});
