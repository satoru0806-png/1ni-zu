import React, { useState, useEffect } from "react";
import type { HistoryEntry } from "../../shared/types";
import { useElectronAPI } from "../hooks/useElectronAPI";

type Props = {
  onClose: () => void;
};

export function HistoryList({ onClose }: Props) {
  const api = useElectronAPI();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.getHistory().then(setHistory);
  }, [api]);

  const handleClear = async () => {
    await api.clearHistory();
    setHistory([]);
  };

  const handleCopy = async (text: string) => {
    await api.copyToClipboard(text);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const contextLabel: Record<string, string> = {
    free_text: "フリー",
    daytime_memo: "メモ",
    morning_mit: "タスク",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-800">履歴</h2>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              全削除
            </button>
          )}
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
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-300">履歴はありません</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() =>
                  setExpanded(expanded === entry.id ? null : entry.id)
                }
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">
                    {formatTime(entry.timestamp)}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {contextLabel[entry.context] || entry.context}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">
                  {entry.cleaned}
                </p>

                {expanded === entry.id && (
                  <div className="mt-2 space-y-2">
                    {entry.tasks && entry.tasks.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {entry.tasks.map((t, i) => (
                          <div key={i}>&#9679; {t}</div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(entry.cleaned);
                      }}
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      コピー
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
