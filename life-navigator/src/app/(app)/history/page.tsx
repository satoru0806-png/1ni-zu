"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type DayLog = {
  date: string;
  mit1?: string | null;
  mit2?: string | null;
  mit3?: string | null;
  done_note?: string | null;
  gratitude_note?: string | null;
  tomorrow_plan?: string | null;
  memo_raw?: string | null;
  empty?: boolean;
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("ja-JP", {
    month: "long", day: "numeric", weekday: "short",
  });
}

function getMonthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}年${parseInt(m)}月`;
}

function getCurrentMonth(): string {
  const d = new Date();
  return d.toISOString().slice(0, 7);
}

function prevMonth(ym: string): string {
  const d = new Date(ym + "-15");
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
}

function nextMonth(ym: string): string {
  const d = new Date(ym + "-15");
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 7);
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-gray-400">Loading...</div>}>
      <HistoryContent />
    </Suspense>
  );
}

function HistoryContent() {
  const [history, setHistory] = useState<DayLog[]>([]);
  const [selected, setSelected] = useState<DayLog | null>(null);
  const [month, setMonth] = useState(getCurrentMonth());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = viewMode === "month"
      ? `/api/history?month=${month}`
      : "/api/history";

    fetch(url).then((r) => r.json()).then((data: DayLog[]) => {
      setHistory(data);
      const dateParam = searchParams.get("date");
      if (dateParam) {
        const found = data.find((d) => d.date === dateParam);
        if (found && !("empty" in found && found.empty)) setSelected(found);
      }
    });
  }, [searchParams, month, viewMode]);

  // 詳細表示
  if (selected) {
    const doneNote = selected.done_note || "";
    const showDone = doneNote && !doneNote.startsWith("[");

    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="text-sm text-blue-600 font-medium">
          &larr; 一覧に戻る
        </button>

        <h2 className="text-lg font-bold">{formatDate(selected.date)}</h2>

        {(selected.mit1 || selected.mit2 || selected.mit3) && (
          <section className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-blue-600 mb-2">📝 重要なこと</h3>
            <ul className="text-sm space-y-1">
              {[selected.mit1, selected.mit2, selected.mit3].filter(Boolean).map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </section>
        )}

        {(showDone || selected.gratitude_note || selected.tomorrow_plan) && (
          <section className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-purple-600 mb-2">💭 振り返り</h3>
            {showDone && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-green-700">😊 今日はどうだった？</p>
                <p className="text-sm mt-1">{doneNote}</p>
              </div>
            )}
            {selected.gratitude_note && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-amber-600">🙏 感謝</p>
                <p className="text-sm mt-1">{selected.gratitude_note}</p>
              </div>
            )}
            {selected.tomorrow_plan && (
              <div>
                <p className="text-xs font-semibold text-blue-700">🌅 明日の予定</p>
                <p className="text-sm mt-1">{selected.tomorrow_plan}</p>
              </div>
            )}
          </section>
        )}

        {selected.memo_raw && (
          <section className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-green-600 mb-2">🎤 メモ</h3>
            <p className="text-sm text-gray-700">{selected.memo_raw}</p>
          </section>
        )}
      </div>
    );
  }

  // 一覧表示
  return (
    <div className="space-y-4">
      {/* 表示切替 */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("week")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${viewMode === "week" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          過去7日間
        </button>
        <button
          onClick={() => setViewMode("month")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${viewMode === "month" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          月別
        </button>
      </div>

      {/* サマリー */}
      {history.length > 0 && (() => {
        const active = history.filter((d) => !("empty" in d && d.empty));
        const totalDays = history.length;
        const recordedDays = active.length;
        const mitDays = active.filter((d) => d.mit1 || d.mit2 || d.mit3).length;
        const gratDays = active.filter((d) => d.gratitude_note).length;
        const reflectDays = active.filter((d) => {
          const dn = d.done_note || "";
          return dn && !dn.startsWith("[");
        }).length;
        return (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-blue-700 mb-2">
              {viewMode === "week" ? "今週のサマリー" : `${getMonthLabel(month)}のサマリー`}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white rounded-lg p-2">
                <p className="text-xl font-bold text-blue-600">{recordedDays}/{totalDays}</p>
                <p className="text-xs text-gray-500">記録日数</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-xl font-bold text-green-600">{mitDays}</p>
                <p className="text-xs text-gray-500">MIT設定日</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-xl font-bold text-purple-600">{reflectDays}</p>
                <p className="text-xs text-gray-500">振り返り日</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-xl font-bold text-amber-600">{gratDays}</p>
                <p className="text-xs text-gray-500">感謝の記録</p>
              </div>
            </div>
            {recordedDays > 0 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(recordedDays / totalDays) * 100}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">継続率 {Math.round((recordedDays / totalDays) * 100)}%</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* 月ナビゲーション */}
      {viewMode === "month" && (
        <div className="flex items-center justify-between">
          <button onClick={() => setMonth(prevMonth(month))} className="text-blue-600 text-sm font-bold px-3 py-1">
            ← 前月
          </button>
          <span className="text-sm font-bold">{getMonthLabel(month)}</span>
          <button onClick={() => setMonth(nextMonth(month))} className="text-blue-600 text-sm font-bold px-3 py-1">
            翌月 →
          </button>
        </div>
      )}

      {/* 履歴リスト */}
      {history.length === 0 ? (
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <p className="text-gray-400">記録がありません</p>
        </div>
      ) : (
        history.map((day) => {
          const isEmpty = "empty" in day && day.empty;
          const doneNote = day.done_note || "";
          const showDone = doneNote && !doneNote.startsWith("[");

          return (
            <div
              key={day.date}
              className={`bg-white rounded-xl p-4 shadow-sm ${isEmpty ? "opacity-50" : "cursor-pointer hover:bg-gray-50"}`}
              onClick={() => !isEmpty && setSelected(day)}
            >
              <h3 className="text-sm font-bold">{formatDate(day.date)}</h3>
              {isEmpty ? (
                <p className="text-xs text-gray-400 mt-1">記録なし</p>
              ) : (
                <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                  {day.mit1 && <p>📝 {day.mit1}</p>}
                  {showDone && <p className="truncate">💭 {doneNote}</p>}
                  {day.gratitude_note && <p className="truncate">🙏 {day.gratitude_note}</p>}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
