import React, { useEffect, useRef } from "react";
import type { ChatMessage } from "../../shared/types";
import { MicButton } from "./MicButton";

type Props = {
  messages: ChatMessage[];
  status: string;
  listening: boolean;
  processing: boolean;
  onMicClick: () => void;
  onClear: () => void;
  onClose: () => void;
};

export function ChatView({
  messages,
  status,
  listening,
  processing,
  onMicClick,
  onClear,
  onClose,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, processing]);

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div
        className="h-8 flex items-center justify-between px-3 flex-shrink-0 border-b border-gray-100"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <span className="text-xs font-semibold text-indigo-500">💬 会話モード</span>
        <div
          className="flex items-center gap-2"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <button
            onClick={onClear}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            title="履歴をクリア"
          >
            クリア
          </button>
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            title="閉じる"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Bubbles */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">
            マイクをタップして話しかけてください
          </p>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {processing && (
          <Bubble role="assistant" content="…" muted />
        )}
      </div>

      {/* Status + mic */}
      <div className="flex flex-col items-center gap-2 px-4 pb-4 flex-shrink-0">
        {status && (
          <p className="text-xs text-gray-400">{status}</p>
        )}
        <MicButton
          listening={listening}
          processing={processing}
          onClick={onMicClick}
        />
      </div>
    </div>
  );
}

function Bubble({
  role,
  content,
  muted = false,
}: {
  role: ChatMessage["role"];
  content: string;
  muted?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
          isUser
            ? "bg-blue-500 text-white"
            : muted
              ? "bg-gray-50 text-gray-400 italic"
              : "bg-gray-100 text-gray-900"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
