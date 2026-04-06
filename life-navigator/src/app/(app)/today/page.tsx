"use client";
import { useEffect, useState, useCallback } from "react";

type DayLog = {
  mit1: string | null;
  mit2: string | null;
  mit3: string | null;
  done_note: string | null;
  memo_raw: string | null;
};

export default function TodayPage() {
  const [mits, setMits] = useState(["", "", ""]);
  const [checks, setChecks] = useState([false, false, false]);
  const [memo, setMemo] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/daylog").then((r) => r.json()).then((data: DayLog) => {
      setMits([data.mit1 || "", data.mit2 || "", data.mit3 || ""]);
      setMemo(data.memo_raw || "");
      // チェック状態をdone_noteから復元
      if (data.done_note) {
        try {
          const parsed = JSON.parse(data.done_note);
          if (Array.isArray(parsed)) setChecks(parsed);
        } catch {
          setChecks([false, false, false]);
        }
      }
    });
  }, []);

  const save = useCallback(async () => {
    await fetch("/api/daylog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mit1: mits[0] || null,
        mit2: mits[1] || null,
        mit3: mits[2] || null,
        doneNote: JSON.stringify(checks),
        memoRaw: memo || null,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [mits, checks, memo]);

  const updateMit = (idx: number, val: string) => {
    const next = [...mits];
    next[idx] = val;
    setMits(next);
  };

  const toggleCheck = (idx: number) => {
    const next = [...checks];
    next[idx] = !next[idx];
    setChecks(next);
    // 自動保存
    fetch("/api/daylog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mit1: mits[0] || null,
        mit2: mits[1] || null,
        mit3: mits[2] || null,
        doneNote: JSON.stringify(next),
        memoRaw: memo || null,
      }),
    });
  };

  return (
    <div className="space-y-6">
      {/* 今日の大切なこと 3つ */}
      <section>
        <h2 className="text-lg font-bold mb-1">今日の大切なこと</h2>
        <p className="text-xs text-gray-500 mb-3">夢に近づくために今日やること</p>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm">
              {/* チェックボックス */}
              <button
                onClick={() => toggleCheck(i)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-all ${
                  checks[i]
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-400 border border-gray-300"
                }`}
              >
                {checks[i] ? "✓" : i + 1}
              </button>
              <input
                type="text"
                value={mits[i]}
                onChange={(e) => updateMit(i, e.target.value)}
                placeholder={`大切なこと ${i + 1}`}
                className={`flex-1 text-sm outline-none bg-transparent ${
                  checks[i] ? "line-through text-gray-400" : ""
                }`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ちょっとしたメモ */}
      <section>
        <h2 className="text-lg font-bold mb-1">メモ</h2>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="ちょっとしたメモ..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
        />
      </section>

      {/* 保存ボタン */}
      <button
        onClick={save}
        className={`w-full py-3 rounded-xl font-medium sticky bottom-16 transition-all ${
          saved
            ? "bg-green-500 text-white"
            : "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
        }`}
      >
        {saved ? "✓ 保存しました!" : "保存する"}
      </button>
    </div>
  );
}
