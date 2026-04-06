"use client";
import { useEffect, useState } from "react";

type Memo = {
  id: number;
  text: string;
  date: string;
  created_at: string;
};

export default function MemosPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/memos?key=yumenavi-watch-2026")
      .then((r) => r.json())
      .then((data) => { setMemos(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("コピーしました！Keepに貼り付けできます");
  };

  if (loading) return <div className="text-center py-8 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">📋 時計のメモ ({memos.length}件)</h2>
      <p className="text-xs text-gray-500">時計のSpeakNoteで録音したメモがここに表示されます</p>

      {memos.length === 0 ? (
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <p className="text-gray-400">メモがありません</p>
          <p className="text-xs text-gray-300 mt-2">時計のSpeakNoteで録音→保存してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {memos.map((memo) => (
            <div key={memo.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{memo.date}</span>
                <button
                  onClick={() => copyToClipboard(memo.text)}
                  className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full"
                >
                  📋 コピー
                </button>
              </div>
              <p className="text-sm text-gray-800">{memo.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
