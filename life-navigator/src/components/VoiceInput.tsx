"use client";
import { useState, useRef } from "react";

const CORRECTIONS: Record<string, string> = {
  "てゆうか": "というか",
  "ゆう": "いう",
  "ずつ": "ずつ",
  "づつ": "ずつ",
  "いがい": "以外",
  "ふいんき": "雰囲気",
  "おこなって": "行って",
};

function autoCorrect(text: string): string {
  let result = text;
  for (const [wrong, right] of Object.entries(CORRECTIONS)) {
    result = result.replace(new RegExp(wrong, "g"), right);
  }
  result = result.replace(/。。+/g, "。");
  result = result.replace(/、、+/g, "、");
  return result;
}

type Props = {
  onResult: (text: string) => void;
};

export function VoiceInput({ onResult }: Props) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognition | null>(null);

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = "ja-JP";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const raw = e.results[0][0].transcript;
      const corrected = autoCorrect(raw);
      onResult(corrected);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  if (typeof window === "undefined") return null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      className={`p-2 rounded-full transition-colors flex-shrink-0 ${
        listening ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
      title={listening ? "停止" : "音声入力"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" x2="12" y1="19" y2="22"/>
      </svg>
    </button>
  );
}
