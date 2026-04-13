import React, { useState, useEffect } from "react";
import type { AppSettings } from "../../shared/types";
import { useElectronAPI } from "../hooks/useElectronAPI";

type Props = {
  onClose: () => void;
  onSettingsChange: (settings: AppSettings) => void;
};

export function Settings({ onClose, onSettingsChange }: Props) {
  const api = useElectronAPI();
  const [settings, setSettings] = useState<AppSettings>({
    apiKey: "",
    openaiApiKey: "",
    shortcut: "CommandOrControl+Shift+S",
    autoCopy: true,
    autoPaste: true,
    transcribePrompt: "",
    dictionary: [],
  });
  const [saved, setSaved] = useState(false);
  const [dictFrom, setDictFrom] = useState("");
  const [dictTo, setDictTo] = useState("");

  useEffect(() => {
    api.getSettings().then((s) =>
      setSettings({ ...s, dictionary: s.dictionary ?? [] })
    );
  }, [api]);

  const addDictEntry = () => {
    const from = dictFrom.trim();
    const to = dictTo.trim();
    if (!from || !to) return;
    if (settings.dictionary.some((d) => d.from === from)) return;
    setSettings({
      ...settings,
      dictionary: [...settings.dictionary, { from, to }],
    });
    setDictFrom("");
    setDictTo("");
  };

  const removeDictEntry = (from: string) => {
    setSettings({
      ...settings,
      dictionary: settings.dictionary.filter((d) => d.from !== from),
    });
  };

  const handleSave = async () => {
    await api.saveSettings(settings);
    onSettingsChange(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-800">設定</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
        {/* OpenAI API Key (required for transcription) */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            OpenAI API Key <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={settings.openaiApiKey}
            onChange={(e) =>
              setSettings({ ...settings, openaiApiKey: e.target.value })
            }
            placeholder="sk-..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-400">
            Whisper API による音声→テキスト変換に使用(必須)
          </p>
        </div>

        {/* Anthropic API Key (optional, for AI cleanup) */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Anthropic API Key
          </label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) =>
              setSettings({ ...settings, apiKey: e.target.value })
            }
            placeholder="sk-ant-..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-400">
            Claude Haiku による整形に使用(任意)
          </p>
        </div>

        {/* Transcribe prompt (vocab bias) */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            語彙ヒント
          </label>
          <textarea
            value={settings.transcribePrompt}
            onChange={(e) =>
              setSettings({ ...settings, transcribePrompt: e.target.value })
            }
            placeholder="固有名詞や専門用語をカンマ区切りで(例: NI-ZU, Claude, Electron, 夢ナビ)"
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <p className="mt-1 text-xs text-gray-400">
            転写時のヒントとして Whisper に渡されます(誤認識が減ります)
          </p>
        </div>

        {/* Shortcut */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            グローバルショートカット
          </label>
          <input
            type="text"
            value={settings.shortcut}
            onChange={(e) =>
              setSettings({ ...settings, shortcut: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-400">
            例: CommandOrControl+Shift+S
          </p>
        </div>

        {/* Auto Copy */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">自動コピー</p>
            <p className="text-xs text-gray-400">
              整形後にクリップボードへ自動コピー
            </p>
          </div>
          <button
            onClick={() =>
              setSettings({ ...settings, autoCopy: !settings.autoCopy })
            }
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings.autoCopy ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.autoCopy ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>

        {/* Dictionary */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            辞書 (人名・固有名詞)
          </label>
          <div className="flex gap-1.5 mb-2">
            <input
              type="text"
              value={dictFrom}
              onChange={(e) => setDictFrom(e.target.value)}
              placeholder="読み (例: たなか)"
              className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              value={dictTo}
              onChange={(e) => setDictTo(e.target.value)}
              placeholder="表記 (例: 田中)"
              className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") addDictEntry();
              }}
            />
            <button
              onClick={addDictEntry}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg"
            >
              追加
            </button>
          </div>
          {settings.dictionary.length > 0 && (
            <div className="border border-gray-200 rounded-lg max-h-32 overflow-y-auto">
              {settings.dictionary.map((d) => (
                <div
                  key={d.from}
                  className="flex items-center justify-between px-2 py-1 text-xs border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-gray-600">
                    <span className="text-gray-400">{d.from}</span>
                    <span className="mx-1.5">→</span>
                    <span>{d.to}</span>
                  </span>
                  <button
                    onClick={() => removeDictEntry(d.from)}
                    className="text-red-400 hover:text-red-600 px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Whisper のヒント + AI整形時の優先候補として使用されます
          </p>
        </div>

        {/* Auto Paste */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">自動ペースト</p>
            <p className="text-xs text-gray-400">
              直前のアプリへ Cmd+V を自動送信(要アクセシビリティ権限)
            </p>
          </div>
          <button
            onClick={() =>
              setSettings({ ...settings, autoPaste: !settings.autoPaste })
            }
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings.autoPaste ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.autoPaste ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save button */}
      <div className="px-4 py-3 border-t border-gray-200">
        <button
          onClick={handleSave}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
            saved
              ? "bg-green-500 text-white"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {saved ? "保存しました" : "保存"}
        </button>
      </div>
    </div>
  );
}
