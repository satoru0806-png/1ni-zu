import React from "react";
import type { AppVoiceContext } from "../../shared/types";

type Props = {
  value: AppVoiceContext;
  onChange: (mode: AppVoiceContext) => void;
};

const modes: { value: AppVoiceContext; label: string }[] = [
  { value: "free_text", label: "フリー" },
  { value: "daytime_memo", label: "メモ" },
  { value: "morning_mit", label: "タスク抽出" },
];

export function ModeSelector({ value, onChange }: Props) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => onChange(mode.value)}
          className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
            value === mode.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
