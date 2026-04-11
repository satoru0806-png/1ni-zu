import React from "react";

type Props = {
  listening: boolean;
  processing: boolean;
  onClick: () => void;
};

export function MicButton({ listening, processing, onClick }: Props) {
  if (processing) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center animate-pulse">
          <svg
            className="w-8 h-8 text-purple-500 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <span className="text-sm text-purple-500 animate-pulse font-medium">
          AI整形中...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        className={`w-20 h-20 rounded-full transition-all duration-200 flex items-center justify-center ${
          listening
            ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30 scale-110"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:scale-105 active:scale-95"
        }`}
        title={listening ? "停止 (Cmd+Shift+S)" : "録音開始 (Cmd+Shift+S)"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      </button>
      <span className="text-xs text-gray-400">
        {listening ? "話してください..." : "タップで録音"}
      </span>
    </div>
  );
}
