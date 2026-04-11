import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("speaknoteAPI", {
  // Main -> Renderer events
  onToggleRecording: (callback: () => void) => {
    ipcRenderer.removeAllListeners("toggle-recording");
    ipcRenderer.on("toggle-recording", () => callback());
  },
  onWindowShown: (callback: () => void) => {
    ipcRenderer.removeAllListeners("window-shown");
    ipcRenderer.on("window-shown", () => callback());
  },

  // Renderer -> Main calls
  processVoice: (rawText: string, context: string) =>
    ipcRenderer.invoke("process-voice", rawText, context),
  copyToClipboard: (text: string) =>
    ipcRenderer.invoke("copy-to-clipboard", text),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings: Record<string, unknown>) =>
    ipcRenderer.invoke("save-settings", settings),
  getHistory: () => ipcRenderer.invoke("get-history"),
  addHistory: (entry: Record<string, unknown>) =>
    ipcRenderer.invoke("add-history", entry),
  clearHistory: () => ipcRenderer.invoke("clear-history"),
});
