"use client";
import { useEffect, useState, useCallback } from "react";
import { VoiceInput } from "@/components/VoiceInput";

const scoreFields = [
  { key: "relationshipScore", label: "人間関係", color: "accent-pink-500" },
  { key: "moneyScore", label: "お金", color: "accent-yellow-500" },
  { key: "workScore", label: "仕事", color: "accent-blue-500" },
  { key: "healthScore", label: "健康", color: "accent-green-500" },
] as const;

type DayLog = {
  mit1: string | null;
  mit2: string | null;
  mit3: string | null;
  relationshipScore: number;
  moneyScore: number;
  workScore: number;
  healthScore: number;
  memoRaw: string | null;
  memoSummary: string | null;
  memoTasksJson: string | null;
};

export default function TodayPage() {
  const [mits, setMits] = useState(["", "", ""]);
  const [scores, setScores] = useState({ relationshipScore: 50, moneyScore: 50, workScore: 50, healthScore: 50 });
  const [memo, setMemo] = useState("");
  const [memoResult, setMemoResult] = useState<{ summary: string; tasks: string[] } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/daylog").then((r) => r.json()).then((data: DayLog) => {
      setMits([data.mit1 || "", data.mit2 || "", data.mit3 || ""]);
      setScores({
        relationshipScore: data.relationshipScore,
        moneyScore: data.moneyScore,
        workScore: data.workScore,
        healthScore: data.healthScore,
      });
      setMemo(data.memoRaw || "");
      if (data.memoSummary) {
        setMemoResult({
          summary: data.memoSummary,
          tasks: data.memoTasksJson ? JSON.parse(data.memoTasksJson) : [],
        });
      }
    });
  }, []);

  const save = useCallback(async () => {
    const res = await fetch("/api/daylog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mit1: mits[0] || null,
        mit2: mits[1] || null,
        mit3: mits[2] || null,
        ...scores,
        memoRaw: memo || null,
      }),
    });
    const data = await res.json();
    if (data.memoSummary) {
      setMemoResult({
        summary: data.memoSummary,
        tasks: data.memoTasksJson ? JSON.parse(data.memoTasksJson) : [],
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [mits, scores, memo]);

  const updateMit = (idx: number, val: string) => {
    const next = [...mits];
    next[idx] = val;
    setMits(next);
  };

  const updateScore = (key: string, val: number) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const avg = Math.round(
    (scores.relationshipScore + scores.moneyScore + scores.workScore + scores.healthScore) / 4
  );

  return (
    <div className="space-y-6">
      {/* MIT Section */}
      <section>
        <h2 className="text-lg font-bold mb-1">今日の最優先事項 3つ</h2>
        <p className="text-xs text-gray-500 mb-3">夢に近づくために今日やること</p>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </span>
              <input
                type="text"
                value={mits[i]}
                onChange={(e) => updateMit(i, e.target.value)}
                placeholder={`タスク ${i + 1}`}
                className="flex-1 text-sm outline-none bg-transparent"
              />
              <VoiceInput onResult={(t) => updateMit(i, t)} />
            </div>
          ))}
        </div>
      </section>

      {/* Score Section */}
      <section>
        <h2 className="text-lg font-bold mb-1">4大スコア</h2>
        <p className="text-xs text-gray-500 mb-3">総合: {avg}点</p>
        <div className="space-y-3">
          {scoreFields.map((f) => (
            <div key={f.key} className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{f.label}</span>
                <span className="text-sm font-bold">{scores[f.key]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={scores[f.key]}
                onChange={(e) => updateScore(f.key, Number(e.target.value))}
                className={`w-full ${f.color}`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Memo Section */}
      <section>
        <h2 className="text-lg font-bold mb-1">メモ</h2>
        <p className="text-xs text-gray-500 mb-3">入力するとタスクを自動抽出します</p>
        <div className="flex gap-2 items-start">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder={"メモを入力...\n例: 企画書を作成する / 山田さんに連絡する"}
            rows={4}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
          />
          <VoiceInput onResult={(t) => setMemo((prev) => prev ? prev + " " + t : t)} />
        </div>
        {memoResult && (
          <div className="mt-2 bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-gray-600">{memoResult.summary}</p>
            {memoResult.tasks.length > 0 && (
              <ul className="mt-2 space-y-1">
                {memoResult.tasks.map((t, i) => (
                  <li key={i} className="text-xs text-blue-700">- {t}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Save Button */}
      <button
        onClick={save}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium sticky bottom-16"
      >
        {saved ? "保存しました!" : "保存する"}
      </button>
    </div>
  );
}
