import React, { useState, useEffect, useCallback } from "react";
import { MicButton } from "./components/MicButton";
import { ResultArea } from "./components/ResultArea";
import { Settings } from "./components/Settings";
import { HistoryList } from "./components/HistoryList";
import { ModeSelector } from "./components/ModeSelector";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useElectronAPI } from "./hooks/useElectronAPI";
import type { AppSettings, AppVoiceContext, VoiceResult } from "../shared/types";

type View = "main" | "settings" | "history";

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-4 left-4 right-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 shadow-lg animate-slide-up cursor-pointer"
      onClick={onDismiss}
    >
      {message}
    </div>
  );
}

export function App() {
  const api = useElectronAPI();
  const [view, setView] = useState<View>("main");
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [autoCopy, setAutoCopy] = useState(true);
  const [mode, setMode] = useState<AppVoiceContext>("free_text");
  const [hasApiKey, setHasApiKey] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings().then((s) => {
      setAutoCopy(s.autoCopy);
      setHasApiKey(!!s.apiKey);
    });
  }, [api]);

  const handleResult = useCallback((r: VoiceResult) => {
    setResult(r);
    if (r.error) {
      setToast(r.error);
    }
  }, []);

  const handleError = useCallback((message: string) => {
    setToast(message);
  }, []);

  const { listening, processing, interim, toggle } = useSpeechRecognition({
    context: mode,
    autoCopy,
    onResult: handleResult,
    onError: handleError,
  });

  const handleSettingsChange = (settings: AppSettings) => {
    setAutoCopy(settings.autoCopy);
    setHasApiKey(!!settings.apiKey);
  };

  if (view === "settings") {
    return (
      <div className="h-screen bg-white">
        <Settings
          onClose={() => setView("main")}
          onSettingsChange={handleSettingsChange}
        />
      </div>
    );
  }

  if (view === "history") {
    return (
      <div className="h-screen bg-white">
        <HistoryList onClose={() => setView("main")} />
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Drag region + toolbar */}
      <div
        className="h-8 flex items-center justify-between px-3 flex-shrink-0"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <span className="text-xs font-semibold text-gray-400">SpeakNote</span>
        <div
          className="flex items-center gap-2"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <button
            onClick={() => setView("history")}
            className="text-gray-300 hover:text-gray-500 transition-colors"
            title="履歴"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </button>
          <button
            onClick={() => setView("settings")}
            className="text-gray-300 hover:text-gray-500 transition-colors"
            title="設定"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mode selector */}
      <div className="px-4 pb-2 flex-shrink-0">
        <ModeSelector value={mode} onChange={setMode} />
      </div>

      {/* API key info */}
      {!hasApiKey && !listening && !processing && !result && (
        <div className="mx-4 mb-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <p className="text-xs text-blue-700">
            ダイレクトモード：音声がそのままコピーされます。
            <button
              onClick={() => setView("settings")}
              className="ml-1 underline font-medium hover:text-blue-900"
            >
              AI整形を有効にする
            </button>
          </p>
        </div>
      )}

      {/* Big mic button */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        {!result && !listening && !processing && (
          <p className="text-sm text-gray-300 mb-2">押して話す</p>
        )}
        <MicButton
          listening={listening}
          processing={processing}
          onClick={toggle}
        />
      </div>

      {/* Result area */}
      {(result || interim || listening) && (
        <div className="px-4 pb-4 overflow-y-auto max-h-[200px]">
          <ResultArea result={result} interim={interim} listening={listening} />
        </div>
      )}

      {/* Toast notification */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
