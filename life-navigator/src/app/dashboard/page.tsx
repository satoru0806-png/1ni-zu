"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DayLog = {
  date: string;
  mit1?: string | null;
  mit2?: string | null;
  mit3?: string | null;
  doneNote?: string | null;
  relationshipScore: number;
  moneyScore: number;
  workScore: number;
  healthScore: number;
  memoSummary?: string | null;
  empty?: boolean;
};

const meters = [
  { key: "relationshipScore" as const, label: "人間関係", color: "#ec4899" },
  { key: "moneyScore" as const, label: "お金", color: "#eab308" },
  { key: "workScore" as const, label: "仕事", color: "#3b82f6" },
  { key: "healthScore" as const, label: "健康", color: "#22c55e" },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "おはよう！";
  if (h < 18) return "こんにちは！";
  return "おつかれさま！";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" });
}

export default function DashboardPage() {
  const [today, setToday] = useState<DayLog | null>(null);
  const [history, setHistory] = useState<DayLog[]>([]);
  const [dreams, setDreams] = useState<{ id: number; text: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/daylog").then((r) => r.json()).then(setToday);
    fetch("/api/history").then((r) => r.json()).then(setHistory);
    fetch("/api/dreams").then((r) => r.json()).then(setDreams);
  }, []);

  if (!today) return <div className="text-center py-8 text-gray-400">Loading...</div>;

  const avg = Math.round(
    (today.relationshipScore + today.moneyScore + today.workScore + today.healthScore) / 4
  );
  const hasMIT = today.mit1 || today.mit2 || today.mit3;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <section className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">{getGreeting()}</h2>

        {dreams.length > 0 ? (
          <>
            <p className="text-sm opacity-90 mb-3">私の夢はこれです：</p>
            <div className="space-y-1 mb-4">
              {dreams.map((d) => (
                <p key={d.id} className="text-sm font-medium">✨ {d.text}</p>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm opacity-90 mb-4">まずは夢を登録しよう</p>
        )}

        {!hasMIT ? (
          <>
            <p className="text-sm opacity-90 mb-3">じゃあ今日は何をしようか？</p>
            <button
              onClick={() => router.push("/today")}
              className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl text-sm shadow"
            >
              今日のMITを設定する
            </button>
          </>
        ) : (
          <div>
            <p className="text-sm opacity-90 mb-2">今日のMIT：</p>
            <div className="space-y-1 text-sm">
              {[today.mit1, today.mit2, today.mit3].filter(Boolean).map((t, i) => (
                <p key={i}>✅ {t}</p>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Score Meters */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">ライフスコア</h2>
          <span className="text-2xl font-bold text-purple-600">{avg}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {meters.map((m) => {
            const val = today[m.key];
            return (
              <div key={m.key} className="bg-white rounded-xl p-3 shadow-sm text-center">
                <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                <p className="text-2xl font-bold" style={{ color: m.color }}>{val}</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${val}%`, backgroundColor: m.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7-Day Log */}
      <section>
        <h3 className="text-sm font-bold mb-2">過去7日間</h3>
        <div className="space-y-2">
          {history.map((day) => {
            if ("empty" in day && day.empty) {
              return (
                <div key={day.date} className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs font-medium text-gray-400">{formatDate(day.date)}</p>
                  <p className="text-xs text-gray-300">記録なし</p>
                </div>
              );
            }
            const dayAvg = Math.round(
              (day.relationshipScore + day.moneyScore + day.workScore + day.healthScore) / 4
            );
            return (
              <div
                key={day.date}
                className="bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/history?date=${day.date}`)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">{formatDate(day.date)}</p>
                  <span className="text-xs font-bold text-purple-600">{dayAvg}</span>
                </div>
                {day.mit1 && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    MIT: {day.mit1}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
