import Store from "electron-store";
import type { AppSettings, HistoryEntry } from "../shared/types";

type StoreSchema = {
  settings: AppSettings;
  history: HistoryEntry[];
};

const store = new Store<StoreSchema>({
  defaults: {
    settings: {
      apiKey: "",
      openaiApiKey: "",
      shortcut: "CommandOrControl+Shift+S",
      autoCopy: true,
      autoPaste: true,
      transcribePrompt: "",
      dictionary: [],
      vadEnabled: false,
      vadSilenceMs: 1500,
      aiEnabled: true,
      autoLearnEnabled: true,
    },
    history: [],
  },
}) as any as {
  get<K extends keyof StoreSchema>(key: K): StoreSchema[K];
  set<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void;
};

export function getSettings(): AppSettings {
  return store.get("settings");
}

export function saveSettings(partial: Partial<AppSettings>): void {
  const current = store.get("settings");
  store.set("settings", { ...current, ...partial });
}

export function getHistory(): HistoryEntry[] {
  return store.get("history");
}

export function addHistory(entry: HistoryEntry): void {
  const history = store.get("history");
  history.unshift(entry);
  // Keep only last 50 entries
  if (history.length > 50) {
    history.length = 50;
  }
  store.set("history", history);
}

export function clearHistory(): void {
  store.set("history", []);
}
