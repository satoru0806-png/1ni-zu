import {
  app,
  BrowserWindow,
  Tray,
  globalShortcut,
  ipcMain,
  clipboard,
  nativeImage,
  Menu,
  systemPreferences,
  session,
  shell,
} from "electron";
import path from "node:path";
import { processVoice } from "./anthropic";
import { sendChatMessage } from "./anthropic-chat";
import { transcribeAudio } from "./whisper";
import {
  getSettings,
  saveSettings,
  getHistory,
  addHistory,
  clearHistory,
} from "./store";
import type { AppVoiceContext, ChatMessage, HistoryEntry } from "../shared/types";

import { uIOhook, UiohookKey } from "uiohook-napi";
import fs from "node:fs";
import os from "node:os";
import pathMod from "node:path";
import {
  IS_MAC,
  captureFrontmostApp as platformCaptureFrontmost,
  pasteToApp,
  saveToNotes as platformSaveToNotes,
} from "./platform";

let previousApp: string | null = null;

function captureFrontmostApp(): void {
  const name = platformCaptureFrontmost();
  if (name) {
    previousApp = name;
    debugLog(`captured frontmost: ${name}`);
  } else {
    debugLog(`captureFrontmostApp skipped/failed`);
  }
}

async function pasteToPreviousApp(): Promise<void> {
  if (!previousApp) {
    debugLog("pasteToPreviousApp: no previous app");
    return;
  }
  const target = previousApp;
  if (mainWindow?.isVisible()) mainWindow.hide();
  await new Promise((r) => setTimeout(r, 120));
  try {
    await pasteToApp(target);
    debugLog(`pasted to ${target}`);
  } catch (err) {
    debugLog(`pasteToPreviousApp failed: ${err}`);
  }
}

const LOG_FILE = pathMod.join(os.tmpdir(), "speaknote-debug.log");
function debugLog(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(LOG_FILE, line);
  } catch {
    // ignore
  }
}

// Vite dev server URL (injected by Electron Forge)
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;


function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 400,
    height: 520,
    show: false,
    frame: true,
    resizable: true,
    skipTaskbar: false,
    transparent: false,
    title: "SpeakNote",
    ...(IS_MAC
      ? {
          titleBarStyle: "hiddenInset" as const,
          vibrancy: "under-window" as const,
          visualEffectState: "active" as const,
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const loadWindow = async () => {
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      // Retry loading dev server URL with delay
      for (let i = 0; i < 30; i++) {
        try {
          await win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    } else {
      win.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
      );
    }
  };
  loadWindow();

  return win;
}

function getWindowPosition(): { x: number; y: number } {
  if (!tray || !mainWindow) return { x: 0, y: 0 };

  const trayBounds = tray.getBounds();
  const windowBounds = mainWindow.getBounds();

  const x = Math.round(
    trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2
  );
  const y = Math.round(trayBounds.y + trayBounds.height + 4);

  return { x, y };
}

function toggleWindow(): void {
  if (!mainWindow) return;

  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    captureFrontmostApp();
    const { x, y } = getWindowPosition();
    mainWindow.setPosition(x, y, false);
    mainWindow.showInactive();
    mainWindow.webContents.send("window-shown");
  }
}

let trayAnimTimer: NodeJS.Timeout | null = null;

function setTrayState(state: "idle" | "recording" | "processing"): void {
  if (!tray) return;
  if (trayAnimTimer) {
    clearInterval(trayAnimTimer);
    trayAnimTimer = null;
  }
  if (state === "idle") {
    tray.setTitle("");
  } else if (state === "recording") {
    let on = true;
    tray.setTitle("●");
    trayAnimTimer = setInterval(() => {
      on = !on;
      tray?.setTitle(on ? "●" : "○");
    }, 500);
  } else if (state === "processing") {
    const frames = ["⋯", "·⋯", "··⋯"];
    let i = 0;
    tray.setTitle(frames[0]);
    trayAnimTimer = setInterval(() => {
      i = (i + 1) % frames.length;
      tray?.setTitle(frames[i]);
    }, 300);
  }
}

function triggerRecording(): void {
  if (!mainWindow) return;
  captureFrontmostApp();
  if (!mainWindow.isVisible()) {
    toggleWindow();
  }
  mainWindow.webContents.send("toggle-recording");
}

function requestStartRecording(): void {
  if (!mainWindow) return;
  captureFrontmostApp();
  if (!mainWindow.isVisible()) {
    toggleWindow();
  }
  mainWindow.webContents.send("start-recording");
}

function requestStopRecording(): void {
  if (!mainWindow) return;
  mainWindow.webContents.send("stop-recording");
}

function createTray(): void {
  const icon = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAAhElEQVQ4T2NkoBNgpJO5DKMGk+xpxqGfFP4zMHxhYGD4z8DI+B8oxsjAyMDA8J+R8T8jE+N/BoYvDIz/vzAx/v/CyMhwhYGB4QIeN1xgZGS8QMhgRgYGCwYGBgsGBob/hNxwgZGR0YJQUiDGYEIGE0oKxBhMahokJOHRpEByUhgdDQAAFg8mBc/bS3IAAAAAElFTkSuQmCC"
  );
  if (IS_MAC) icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip(
    IS_MAC
      ? "SpeakNote - 右Command を押している間 録音"
      : "SpeakNote - 右Ctrl を押している間 録音"
  );

  tray.on("click", () => {
    toggleWindow();
  });

  tray.on("right-click", () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "SpeakNote を開く",
        click: () => toggleWindow(),
      },
      { type: "separator" },
      {
        label: IS_MAC
          ? "右Command を押している間 録音"
          : "右Ctrl を押している間 録音",
        enabled: false,
      },
      { type: "separator" },
      {
        label: "終了",
        click: () => app.quit(),
      },
    ]);
    tray?.popUpContextMenu(contextMenu);
  });
}

let recordingState: "idle" | "recording" | "processing" = "idle";

function setupKeyboardHook(): void {
  // 録音トリガキー: macOS は右Cmd、Windows は右Ctrl (右Winは Start メニュー競合のため不可)
  // 押している間だけ録音 (push-to-talk)。keydown で開始、keyup で停止。
  const TRIGGER_KEY = IS_MAC ? UiohookKey.MetaRight : UiohookKey.CtrlRight;
  const ESC = UiohookKey.Escape;
  let triggerDown = false;

  debugLog(`TRIGGER keycode: ${TRIGGER_KEY}`);

  uIOhook.on("keydown", (e) => {
    debugLog(`keydown: ${e.keycode}`);
    if (e.keycode === TRIGGER_KEY) {
      // OS のキーリピートで keydown が連続発火しても 1 回だけ start を送る
      if (!triggerDown) {
        triggerDown = true;
        debugLog("requestStartRecording!");
        requestStartRecording();
      }
    }
    if (e.keycode === ESC && recordingState === "recording") {
      debugLog("cancel-recording!");
      mainWindow?.webContents.send("cancel-recording");
    }
  });

  uIOhook.on("keyup", (e) => {
    debugLog(`keyup: ${e.keycode}`);
    if (e.keycode === TRIGGER_KEY && triggerDown) {
      triggerDown = false;
      debugLog("requestStopRecording!");
      requestStopRecording();
    }
  });

  try {
    uIOhook.start();
    debugLog("uiohook started successfully");
  } catch (err) {
    debugLog(`uiohook failed: ${err}`);
    // Fallback to Cmd+Shift+S
    const settings = getSettings();
    const shortcut = settings.shortcut || "CommandOrControl+Shift+S";
    globalShortcut.register(shortcut, () => {
      triggerRecording();
    });
  }
}

function setupIPC(): void {
  ipcMain.handle(
    "process-voice",
    async (_event, rawText: string, context: AppVoiceContext) => {
      const settings = getSettings();
      // AI 整形 OFF のときは raw をそのまま返す (Web/Windows 版と同じ挙動)
      if (settings.aiEnabled === false) {
        return { cleaned: rawText, raw: rawText };
      }
      return processVoice(
        rawText,
        context,
        settings.apiKey,
        settings.dictionary ?? []
      );
    }
  );

  ipcMain.handle(
    "send-chat-message",
    async (_event, message: string, history: ChatMessage[]) => {
      const settings = getSettings();
      return sendChatMessage(message, history ?? [], settings.apiKey);
    }
  );

  ipcMain.handle(
    "transcribe-audio",
    async (_event, audioBuffer: ArrayBuffer, mimeType: string) => {
      const settings = getSettings();
      return transcribeAudio(
        audioBuffer,
        mimeType,
        settings.openaiApiKey,
        settings.transcribePrompt,
        settings.dictionary ?? []
      );
    }
  );

  ipcMain.handle("copy-to-clipboard", (_event, text: string) => {
    clipboard.writeText(text);
  });

  ipcMain.handle("paste-to-previous-app", async () => {
    await pasteToPreviousApp();
  });

  ipcMain.handle("send-to-line", async (_event, text: string) => {
    if (!text) return;
    await shell.openExternal(
      `https://line.me/R/msg/text/?${encodeURIComponent(text)}`
    );
  });

  ipcMain.handle("send-to-mail", async (_event, text: string) => {
    if (!text) return;
    await shell.openExternal(`mailto:?body=${encodeURIComponent(text)}`);
  });

  ipcMain.handle("save-to-notes", async (_event, text: string) => {
    if (!text) return;
    try {
      await platformSaveToNotes(text);
    } catch (err) {
      debugLog(`save-to-notes failed: ${err}`);
      throw err;
    }
  });

  ipcMain.handle(
    "set-recording-state",
    (_event, state: "idle" | "recording" | "processing") => {
      recordingState = state;
      setTrayState(state);
    }
  );

  ipcMain.handle("get-settings", () => {
    return getSettings();
  });

  ipcMain.handle("save-settings", (_event, partial) => {
    saveSettings(partial);
  });

  ipcMain.handle("get-history", () => {
    return getHistory();
  });

  ipcMain.handle("add-history", (_event, entry: HistoryEntry) => {
    addHistory(entry);
  });

  ipcMain.handle("clear-history", () => {
    clearHistory();
  });
}

debugLog("app starting...");

app.on("ready", async () => {
  debugLog("app ready fired");
  // Request microphone permission on macOS
  if (process.platform === "darwin") {
    const micStatus = systemPreferences.getMediaAccessStatus("microphone");
    if (micStatus !== "granted") {
      await systemPreferences.askForMediaAccess("microphone");
    }
  }

  // Allow renderer to use microphone
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => {
      callback(true);
    }
  );
  session.defaultSession.setPermissionCheckHandler(() => true);

  mainWindow = createWindow();
  createTray();
  setupIPC();
  setupKeyboardHook();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  try {
    uIOhook.stop();
  } catch {
    // ignore
  }
});

app.on("window-all-closed", () => {
  // Do not quit on macOS - menu bar app stays alive
});
