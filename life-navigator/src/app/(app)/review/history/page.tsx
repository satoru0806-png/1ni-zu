"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type WeeklyItem = {
  week_start: string;
  ai_summary: string | null;
  user_text: string | null;
  ai_feedback: string | null;
  next_week_mits: { mit1?: string; mit2?: string; mit3?: string; theme?: string } | null;
  applied: boolean | null;
};

type MonthlyItem = {
  month_start: string;
  ai_summary: string | null;
  user_text: string | null;
  ai_feedback: string | null;
  next_month_theme: string | null;
  next_month_goals: string[] | null;
};

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.getMonth() + 1}/${start.getDate()} 〜 ${end.getMonth() + 1}/${end.getDate()}`;
}

function formatMonth(monthStart: string): string {
  const d = new Date(monthStart + "T00:00:00");
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

export default function ReviewHistoryPage() {
  const router = useRouter();
  const [weekly, setWeekly] = useState<WeeklyItem[]>([]);
  const [monthly, setMonthly] = useState<MonthlyItem[]>([]);
  const [tab, setTab] = useState<"weekly" | "monthly">("weekly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/review/history")
      .then((r) => r.json())
      .then((d) => {
        setWeekly(d.weekly || []);
        setMonthly(d.monthly || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 pb-8">
      <header className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
        <h1 className="text-lg font-bold text-amber-900">📚 振り返りの記録</h1>
        <p className="text-xs text-amber-700 mt-1">過去の週次・月次振り返りを見返せます</p>
      </header>

      {/* タブ切替 */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("weekly")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === "weekly" ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          🌟 週次
        </button>
        <button
          onClick={() => setTab("monthly")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === "monthly" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          🌙 月次
        </button>
      </div>

      {loading && <div className="text-center py-8 text-gray-400">Loading...</div>}

      {/* 週次一覧 */}
      {!loading && tab === "weekly" && (
        <>
          {weekly.length === 0 ? (
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <p className="text-gray-400 text-sm">まだ週次振り返りの記録がありません</p>
              <button
                onClick={() => router.push("/review/weekly")}
                className="mt-3 bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                振り返りを始める
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {weekly.map((w) => (
                <button
                  key={w.week_start}
                  onClick={() => router.push(`/review/weekly?week=${w.week_start}`)}
                  className="w-full text-left bg-white rounded-xl p-4 shadow-sm hover:bg-amber-50 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-amber-900">{formatWeekRange(w.week_start)}</h3>
                    <div className="flex items-center gap-1">
                      {w.ai_summary && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">要約</span>}
                      {w.user_text && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">記述</span>}
                      {w.ai_feedback && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">気づき</span>}
                      {w.next_week_mits && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">確定</span>}
                      {w.applied && <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">反映済</span>}
                    </div>
                  </div>
                  {w.next_week_mits?.theme && (
                    <p className="text-xs text-amber-700 font-medium mb-1">🌱 {w.next_week_mits.theme}</p>
                  )}
                  {w.ai_summary && (
                    <p className="text-xs text-gray-600 line-clamp-2">{w.ai_summary}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* 月次一覧 */}
      {!loading && tab === "monthly" && (
        <>
          {monthly.length === 0 ? (
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <p className="text-gray-400 text-sm">まだ月次振り返りの記録がありません</p>
              <button
                onClick={() => router.push("/review/monthly")}
                className="mt-3 bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                月の振り返りを始める
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {monthly.map((m) => (
                <button
                  key={m.month_start}
                  onClick={() => router.push(`/review/monthly?month=${m.month_start}`)}
                  className="w-full text-left bg-white rounded-xl p-4 shadow-sm hover:bg-blue-50 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-blue-900">{formatMonth(m.month_start)}</h3>
                    <div className="flex items-center gap-1">
                      {m.ai_summary && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">要約</span>}
                      {m.user_text && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">記述</span>}
                      {m.ai_feedback && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">気づき</span>}
                      {m.next_month_theme && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">確定</span>}
                    </div>
                  </div>
                  {m.next_month_theme && (
                    <p className="text-xs text-blue-700 font-medium mb-1">🌱 {m.next_month_theme}</p>
                  )}
                  {m.ai_summary && (
                    <p className="text-xs text-gray-600 line-clamp-2">{m.ai_summary}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
