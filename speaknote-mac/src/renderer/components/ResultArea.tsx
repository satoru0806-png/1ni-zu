import React, { useState, useEffect } from "react";
import type { VoiceResult } from "../../shared/types";
import { useElectronAPI } from "../hooks/useElectronAPI";

type Props = {
  result: VoiceResult | null;
  interim: string;
  listening: boolean;
};

export function ResultArea({ result, interim, listening }: Props) {
  const api = useElectronAPI();
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // 新しい結果が来たら整形版表示にリセット
  useEffect(() => {
    setShowRaw(false);
  }, [result]);

  const canToggle =
    !!result?.raw && !!result?.cleaned && result.raw !== result.cleaned;
  const displayText = showRaw ? result?.raw ?? "" : result?.cleaned ?? "";

  const handleCopy = async () => {
    if (!displayText) return;
    await api.copyToClipboard(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLine = async () => {
    if (!displayText) return;
    await api.sendToLine(displayText);
  };

  const handleMail = async () => {
    if (!displayText) return;
    await api.sendToMail(displayText);
  };

  const handleNotes = async () => {
    if (!displayText) return;
    try {
      await api.saveToNotes(displayText);
    } catch {
      // 失敗時は親側でハンドルされない (静かに失敗)
    }
  };

  if (listening && interim) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 min-h-[120px]">
        <p className="text-sm text-gray-400 italic">{interim}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 min-h-[120px] flex items-center justify-center">
        <p className="text-sm text-gray-300">
          音声入力の結果がここに表示されます
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 min-h-[120px] relative">
      {/* Top-right buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {canToggle && (
          <button
            onClick={() => setShowRaw((v) => !v)}
            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
              showRaw
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
            }`}
            title={showRaw ? "整形後を表示" : "元の文章を表示"}
          >
            {showRaw ? "整形後" : "元に戻す"}
          </button>
        )}
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
          title="コピー"
        >
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
          )}
        </button>
      </div>

      {/* Text body */}
      <p
        className={`text-sm leading-relaxed pr-20 whitespace-pre-wrap select-text ${
          showRaw ? "text-gray-500" : "text-gray-800"
        }`}
      >
        {displayText}
      </p>

      {/* Send-to action row */}
      <div className="mt-3 flex items-center gap-1.5">
        <button
          onClick={handleLine}
          className="flex-1 px-2 py-1.5 text-xs font-medium rounded-md bg-[#06C755] text-white hover:opacity-90 transition-opacity"
          title="LINEで送る"
        >
          LINE
        </button>
        <button
          onClick={handleMail}
          className="flex-1 px-2 py-1.5 text-xs font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          title="メールで送る"
        >
          メール
        </button>
        <button
          onClick={handleNotes}
          className="flex-1 px-2 py-1.5 text-xs font-medium rounded-md bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
          title="メモに保存"
        >
          メモ
        </button>
      </div>

      {/* Tasks */}
      {!showRaw && result.tasks && result.tasks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-400 mb-1.5 font-medium">抽出タスク</p>
          <ul className="space-y-1">
            {result.tasks.map((task, i) => (
              <li
                key={i}
                className="text-sm text-gray-700 flex items-start gap-2"
              >
                <span className="text-blue-500 mt-0.5">&#9679;</span>
                {task}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
