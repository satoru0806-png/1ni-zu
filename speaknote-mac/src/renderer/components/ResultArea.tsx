import React, { useState } from "react";
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

  const handleCopy = async () => {
    if (!result?.cleaned) return;
    await api.copyToClipboard(result.cleaned);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Show interim text while listening
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
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
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

      {/* Cleaned text */}
      <p className="text-sm text-gray-800 leading-relaxed pr-8 whitespace-pre-wrap select-text">
        {result.cleaned}
      </p>

      {/* Tasks */}
      {result.tasks && result.tasks.length > 0 && (
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
