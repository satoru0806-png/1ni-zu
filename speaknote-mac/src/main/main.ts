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
} from "electron";
import path from "node:path";
import { processVoice } from "./anthropic";
import {
  getSettings,
  saveSettings,
  getHistory,
  addHistory,
  clearHistory,
} from "./store";
import type { AppVoiceContext, HistoryEntry } from "../shared/types";

import { uIOhook, UiohookKey } from "uiohook-napi";
import fs from "node:fs";

const LOG_FILE = "/tmp/speaknote-debug.log";
function debugLog(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
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
    show: true,
    frame: true,
    resizable: true,
    skipTaskbar: false,
    transparent: false,
    titleBarStyle: "hiddenInset",
    vibrancy: "under-window",
    visualEffectState: "active",
    title: "SpeakNote",
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
    const { x, y } = getWindowPosition();
    mainWindow.setPosition(x, y, false);
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("window-shown");
  }
}

function triggerRecording(): void {
  if (!mainWindow) return;
  if (!mainWindow.isVisible()) {
    toggleWindow();
  }
  mainWindow.webContents.send("toggle-recording");
}

function createTray(): void {
  const icon = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAAhElEQVQ4T2NkoBNgpJO5DKMGk+xpxqGfFP4zMHxhYGD4z8DI+B8oxsjAyMDA8J+R8T8jE+N/BoYvDIz/vzAx/v/CyMhwhYGB4QIeN1xgZGS8QMhgRgYGCwYGBgsGBob/hNxwgZGR0YJQUiDGYEIGE0oKxBhMahokJOHRpEByUhgdDQAAFg8mBc/bS3IAAAAAElFTkSuQmCC"
  );
  icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip("SpeakNote - 右Command長押しで録音");

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
        label: "右Command長押しで録音開始",
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

function setupKeyboardHook(): void {
  // Right Command key detection via uiohook-napi
  const RIGHT_META = UiohookKey.MetaRight;
  let rightMetaDown = false;
  let rightMetaUsedAsCombo = false;

  debugLog(`RIGHT_META keycode: ${RIGHT_META}`);

  uIOhook.on("keydown", (e) => {
    debugLog(`keydown: ${e.keycode}`);
    if (e.keycode === RIGHT_META) {
      rightMetaDown = true;
      rightMetaUsedAsCombo = false;
    } else if (rightMetaDown) {
      rightMetaUsedAsCombo = true;
    }
  });

  uIOhook.on("keyup", (e) => {
    debugLog(`keyup: ${e.keycode}`);
    if (e.keycode === RIGHT_META) {
      if (rightMetaDown && !rightMetaUsedAsCombo) {
        debugLog("triggerRecording!");
        triggerRecording();
      }
      rightMetaDown = false;
      rightMetaUsedAsCombo = false;
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
      return processVoice(rawText, context, settings.apiKey);
    }
  );

  ipcMain.handle("copy-to-clipboard", (_event, text: string) => {
    clipboard.writeText(text);
  });

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
    (_webContents, permission, callback) => {
      if (permission === "media") {
        callback(true);
      } else {
        callback(true);
      }
    }
  );

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
