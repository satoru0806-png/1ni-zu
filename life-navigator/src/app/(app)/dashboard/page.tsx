"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTodayTheme, type DailyTheme } from "@/lib/daily-themes";

type DayLog = {
  date: string;
  mit1?: string | null;
  mit2?: string | null;
  mit3?: string | null;
  done_note?: string | null;
  gratitude_note?: string | null;
  memo_summary?: string | null;
  empty?: boolean;
};

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
  const [theme] = useState<DailyTheme>(() => getTodayTheme());
  const router = useRouter();

  useEffect(() => {
    fetch("/api/daylog").then((r) => r.json()).then(setToday);
    fetch("/api/history").then((r) => r.json()).then(setHistory);
    fetch("/api/dreams").then((r) => r.json()).then(setDreams);
  }, []);

  if (!today) return <div className="text-center py-8 text-gray-400">Loading...</div>;

  const hasMIT = today.mit1 || today.mit2 || today.mit3;
  const isNight = new Date().getHours() >= 18;

  return (
    <div className="space-y-6">
      {/* 今日のテーマ - 365日の名言 */}
      <section className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{theme.emoji}</span>
          <div className="flex-1">
            <p className="text-xs text-amber-600 font-medium">今日のテーマ</p>
            <p className="text-base font-bold text-amber-900">{theme.title}</p>
            <p className="text-xs text-amber-700 mt-1">{theme.prompt}</p>
          </div>
        </div>
      </section>

      {/* 挨拶 + 夢 + MIT */}
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
              今日の最優先事項を設定する
            </button>
          </>
        ) : isNight ? (
          <div>
            <p className="text-lg font-bold mb-3">今日どうだった？</p>
            <div className="space-y-1 text-sm mb-4">
              {[today.mit1, today.mit2, today.mit3].filter(Boolean).map((t, i) => (
                <p key={i}>✅ {t}</p>
              ))}
            </div>
            <button
              onClick={() => router.push("/review")}
              className="w-full bg-white text-purple-600 font-bold py-3 rounded-xl text-sm shadow"
            >
              振り返りをする
            </button>
          </div>
        ) : (
          <div>
            <p className="text-lg font-bold mb-3">今日の仕事は順調か？</p>
            <div className="space-y-1 text-sm mb-4">
              {[today.mit1, today.mit2, today.mit3].filter(Boolean).map((t, i) => (
                <p key={i}>✅ {t}</p>
              ))}
            </div>
            <button
              onClick={() => router.push("/today")}
              className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl text-sm shadow"
            >
              進捗を更新する
            </button>
          </div>
        )}
      </section>

      {/* 過去7日間 */}
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
            return (
              <div
                key={day.date}
                className="bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/history?date=${day.date}`)}
              >
                <p className="text-xs font-medium">{formatDate(day.date)}</p>
                {day.mit1 && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    最優先: {day.mit1}
                  </p>
                )}
                {day.done_note && (
                  <p className="text-xs text-green-600 mt-1 truncate">
                    ✅ {day.done_note}
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
