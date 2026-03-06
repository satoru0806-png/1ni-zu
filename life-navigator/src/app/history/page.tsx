"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type DayLog = {
  date: string;
  mit1?: string | null;
  mit2?: string | null;
  mit3?: string | null;
  doneNote?: string | null;
  gratitudeNote?: string | null;
  tomorrowPlan?: string | null;
  relationshipScore: number;
  moneyScore: number;
  workScore: number;
  healthScore: number;
  memoRaw?: string | null;
  memoSummary?: string | null;
  memoTasksJson?: string | null;
  empty?: boolean;
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("ja-JP", {
    year: "numeric", month: "short", day: "numeric", weekday: "short",
  });
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
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/api/history").then((r) => r.json()).then((data: DayLog[]) => {
      setHistory(data);
      const dateParam = searchParams.get("date");
      if (dateParam) {
        const found = data.find((d) => d.date === dateParam);
        if (found && !("empty" in found && found.empty)) setSelected(found);
      }
    });
  }, [searchParams]);

  if (selected) {
    const avg = Math.round(
      (selected.relationshipScore + selected.moneyScore + selected.workScore + selected.healthScore) / 4
    );
    const tasks: string[] = selected.memoTasksJson ? JSON.parse(selected.memoTasksJson) : [];

    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelected(null)}
          className="text-sm text-blue-600 font-medium"
        >
          &larr; 一覧に戻る
        </button>

        <h2 className="text-lg font-bold">{formatDate(selected.date)}</h2>

        {/* MIT */}
        {(selected.mit1 || selected.mit2 || selected.mit3) && (
          <section className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-blue-600 mb-2">MIT</h3>
            <ul className="text-sm space-y-1">
              {[selected.mit1, selected.mit2, selected.mit3].filter(Boolean).map((t, i) => (
                <li key={i}>- {t}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Scores */}
        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-purple-600 mb-2">Score (avg {avg})</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p>人間関係: {selected.relationshipScore}</p>
            <p>お金: {selected.moneyScore}</p>
            <p>仕事: {selected.workScore}</p>
            <p>健康: {selected.healthScore}</p>
          </div>
        </section>

        {/* Reflection */}
        {(selected.doneNote || selected.gratitudeNote || selected.tomorrowPlan) && (
          <section className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-indigo-600 mb-2">振り返り</h3>
            {selected.doneNote && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-green-700">できたこと</p>
                <p className="text-sm">{selected.doneNote}</p>
              </div>
            )}
            {selected.gratitudeNote && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-amber-600">感謝</p>
                <p className="text-sm">{selected.gratitudeNote}</p>
              </div>
            )}
            {selected.tomorrowPlan && (
              <div>
                <p className="text-xs font-semibold text-blue-700">明日やること</p>
                <p className="text-sm">{selected.tomorrowPlan}</p>
              </div>
            )}
          </section>
        )}

        {/* Memo */}
        {selected.memoSummary && (
          <section className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-green-600 mb-2">メモ</h3>
            <p className="text-sm text-gray-700">{selected.memoSummary}</p>
            {tasks.length > 0 && (
              <ul className="mt-2 text-xs text-blue-700 space-y-0.5">
                {tasks.map((t, i) => (
                  <li key={i}>- {t}</li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">過去7日間の履歴</h2>
      {history.map((day) => {
        const isEmpty = "empty" in day && day.empty;
        const avg = isEmpty ? 0 : Math.round(
          (day.relationshipScore + day.moneyScore + day.workScore + day.healthScore) / 4
        );

        return (
          <div
            key={day.date}
            className={`bg-white rounded-xl p-4 shadow-sm ${isEmpty ? "opacity-50" : "cursor-pointer hover:bg-gray-50"}`}
            onClick={() => !isEmpty && setSelected(day)}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">{formatDate(day.date)}</h3>
              {!isEmpty && <span className="text-sm font-bold text-purple-600">{avg}</span>}
            </div>
            {isEmpty ? (
              <p className="text-xs text-gray-400 mt-1">記録なし</p>
            ) : (
              <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                {day.mit1 && <p>MIT: {day.mit1}</p>}
                {day.doneNote && <p className="truncate">振り返り: {day.doneNote}</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
