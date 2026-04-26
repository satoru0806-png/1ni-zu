"use client";
import { useEffect, useState, useRef, useCallback, Suspense } from "react";
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
  ai_diary?: string | null;
  ai_advice?: string | null;
  ai_insight?: string | null;
  relationship_score?: number;
  money_score?: number;
  work_score?: number;
  health_score?: number;
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

function addDays(dateStr: string, diff: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function isFutureDate(dateStr: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr > today;
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
  const [viewMode, setViewMode] = useState<"week" | "month" | "mission">("week");
  // ミッション週報
  type WeeklyReport = {
    hasMission: boolean;
    mission?: string;
    periodStart?: string;
    periodEnd?: string;
    logCount?: number;
    score?: number;
    top3?: { date: string; action: string; reason: string }[];
    observation?: string;
  };
  const [weekly, setWeekly] = useState<WeeklyReport | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyError, setWeeklyError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "pending" | "saving" | "saved" | "error">("idle");
  const [edit, setEdit] = useState<DayLog | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const editInitialLoad = useRef(true);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inFlightController = useRef<AbortController | null>(null);
  const searchParams = useSearchParams();

  const navigateDay = async (diff: number) => {
    if (!selected) return;
    const newDate = addDays(selected.date, diff);
    try {
      const res = await fetch(`/api/daylog?date=${newDate}`, { cache: "no-store" });
      if (!res.ok) throw new Error("取得失敗");
      const data = await res.json();
      setSelected({ ...data, date: newDate });
      setEditing(false);
      setEdit(null);
    } catch {
      setSelected({ date: newDate, empty: true });
    }
  };

  const startEdit = () => {
    if (!selected) return;
    setEdit({ ...selected });
    setEditing(true);
    editInitialLoad.current = true;
    setAutoSaveStatus("idle");
    // 初回ロード後に自動保存を有効化（フォーム展開直後の意図しない保存を防止）
    setTimeout(() => { editInitialLoad.current = false; }, 800);
  };

  const cancelEdit = () => {
    // 編集破棄前に未保存があれば強制保存
    if (autoSaveStatus === "pending" || autoSaveStatus === "saving") {
      flushAutoSave();
    }
    setEditing(false);
    setEdit(null);
    setAutoSaveStatus("idle");
  };

  // 即時保存（編集状態を直接受け取る）— レース対策のため最新editを引数化
  const persistEdit = useCallback(async (current: DayLog): Promise<boolean> => {
    // 既存の保存リクエストをキャンセル
    if (inFlightController.current) inFlightController.current.abort();
    const controller = new AbortController();
    inFlightController.current = controller;
    setAutoSaveStatus("saving");
    try {
      const res = await fetch("/api/daylog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: current.date,
          mit1: current.mit1 ?? "",
          mit2: current.mit2 ?? "",
          mit3: current.mit3 ?? "",
          doneNote: current.done_note ?? "",
          gratitudeNote: current.gratitude_note ?? "",
          tomorrowPlan: current.tomorrow_plan ?? "",
          memoRaw: current.memo_raw ?? "",
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("保存失敗");
      setAutoSaveStatus("saved");
      // 数秒後に saved → idle に戻す
      setTimeout(() => setAutoSaveStatus((s) => (s === "saved" ? "idle" : s)), 2000);
      return true;
    } catch (e) {
      if ((e as Error).name === "AbortError") return false;
      setAutoSaveStatus("error");
      return false;
    }
  }, []);

  // 確定保存（保存ボタン押下用）
  const saveEdit = async () => {
    if (!edit) return;
    setSaving(true);
    try {
      const ok = await persistEdit(edit);
      if (!ok) {
        alert("保存に失敗しました。ネットワークを確認してください。");
        return;
      }
      // 保存後に最新データをサーバーから再取得（整合性確保）
      const freshRes = await fetch(`/api/daylog?date=${edit.date}`, { cache: "no-store" });
      const fresh = await freshRes.json();
      setSelected(fresh);
      setEditing(false);
      setEdit(null);
      // 履歴リストも再取得
      await loadHistory();
    } finally {
      setSaving(false);
    }
  };

  // 未保存タイマー強制実行
  const flushAutoSave = useCallback(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = undefined;
      if (edit) persistEdit(edit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edit, persistEdit]);

  // edit 変更時の自動保存（1.5秒デバウンス）
  useEffect(() => {
    if (!editing || !edit || editInitialLoad.current) return;
    setAutoSaveStatus("pending");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => { persistEdit(edit); }, 1500);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [edit, editing, persistEdit]);

  // ページ離脱時の警告 + 保留保存のフラッシュ
  useEffect(() => {
    if (!editing) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (autoSaveStatus === "pending" || autoSaveStatus === "saving") {
        e.preventDefault();
        e.returnValue = "";
        flushAutoSave();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      // アンマウント時にフラッシュ
      if (autoSaveTimer.current && edit) {
        clearTimeout(autoSaveTimer.current);
        persistEdit(edit);
      }
    };
  }, [editing, autoSaveStatus, edit, flushAutoSave, persistEdit]);

  // 過去日の AI 診断を実行
  const runAiDiagnosisForDate = async (date: string) => {
    // 編集中なら先にフラッシュ保存
    if (autoSaveTimer.current && edit) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = undefined;
      await persistEdit(edit);
    }
    setDiagnosing(true);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "AI診断に失敗しました");
        return;
      }
      // 診断結果を反映するため最新を再取得
      const freshRes = await fetch(`/api/daylog?date=${date}`, { cache: "no-store" });
      const fresh = await freshRes.json();
      setSelected(fresh);
      if (edit) setEdit(fresh);
    } catch (e) {
      alert("診断エラー: " + (e as Error).message);
    } finally {
      setDiagnosing(false);
    }
  };

  const [refreshTick, setRefreshTick] = useState(0);

  const loadHistory = async () => {
    const url = viewMode === "month" ? `/api/history?month=${month}` : "/api/history";
    const res = await fetch(url, { cache: "no-store" });
    const data: DayLog[] = await res.json();
    setHistory(data);
    return data;
  };

  useEffect(() => {
    loadHistory().then((data) => {
      const dateParam = searchParams.get("date");
      if (dateParam) {
        const found = data.find((d) => d.date === dateParam);
        if (found && !("empty" in found && found.empty)) setSelected(found);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, month, viewMode, refreshTick]);

  // タブを戻ってきた時 / フォーカスが戻った時に自動再取得
  useEffect(() => {
    const onFocus = () => setRefreshTick((t) => t + 1);
    const onVis = () => { if (document.visibilityState === "visible") setRefreshTick((t) => t + 1); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // 詳細表示
  if (selected) {
    const doneNote = selected.done_note || "";
    const showDone = doneNote && !doneNote.startsWith("[");
    const inputCls = "w-full text-sm border border-gray-300 rounded-lg p-2 focus:border-blue-500 focus:outline-none";

    // 編集モード
    if (editing && edit) {
      const upd = (k: keyof DayLog, v: string) => setEdit({ ...edit, [k]: v });
      const statusLabel =
        autoSaveStatus === "pending" ? "入力中…"
        : autoSaveStatus === "saving" ? "💾 保存中…"
        : autoSaveStatus === "saved" ? "✓ 保存しました"
        : autoSaveStatus === "error" ? "⚠ 保存失敗（再入力で再試行）"
        : "";
      const statusColor =
        autoSaveStatus === "saved" ? "text-green-600"
        : autoSaveStatus === "error" ? "text-red-500"
        : autoSaveStatus === "saving" ? "text-blue-600"
        : "text-gray-400";
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <button onClick={cancelEdit} className="text-sm text-gray-500 font-medium whitespace-nowrap">完了</button>
            <h2 className="text-base font-bold flex-1 text-center">{formatDate(edit.date)} を編集</h2>
            <button
              onClick={saveEdit}
              disabled={saving}
              className="text-xs bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 whitespace-nowrap"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
          {/* 自動保存ステータス */}
          <div className={`text-xs text-center ${statusColor} h-4`}>
            {statusLabel || "自動保存が有効です"}
          </div>
          {/* 過去日の AI 診断ボタン */}
          <div>
            <button
              onClick={() => runAiDiagnosisForDate(edit.date)}
              disabled={diagnosing}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2.5 rounded-xl shadow-sm disabled:opacity-50"
            >
              {diagnosing ? "🤔 診断中..." : "🤖 この日の AI 診断を実行"}
            </button>
            <p className="text-[10px] text-gray-500 text-center mt-1">
              翌日以降に書き足した内容も含めて再診断できます
            </p>
          </div>

          <section className="bg-white rounded-xl p-4 shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-blue-600">📝 重要なこと</h3>
            <input className={inputCls} placeholder="MIT 1" value={edit.mit1 ?? ""} onChange={(e) => upd("mit1", e.target.value)} />
            <input className={inputCls} placeholder="MIT 2" value={edit.mit2 ?? ""} onChange={(e) => upd("mit2", e.target.value)} />
            <input className={inputCls} placeholder="MIT 3" value={edit.mit3 ?? ""} onChange={(e) => upd("mit3", e.target.value)} />
          </section>

          <section className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-purple-600">💭 振り返り</h3>
            <div>
              <p className="text-xs font-semibold text-green-700 mb-1">😊 今日はどうだった？</p>
              <textarea className={inputCls} rows={3} value={edit.done_note ?? ""} onChange={(e) => upd("done_note", e.target.value)} />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-600 mb-1">🙏 感謝</p>
              <textarea className={inputCls} rows={2} value={edit.gratitude_note ?? ""} onChange={(e) => upd("gratitude_note", e.target.value)} />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-1">🌅 明日の予定</p>
              <textarea className={inputCls} rows={2} value={edit.tomorrow_plan ?? ""} onChange={(e) => upd("tomorrow_plan", e.target.value)} />
            </div>
          </section>

          <section className="bg-white rounded-xl p-4 shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-green-600">🎤 メモ</h3>
            <textarea className={inputCls} rows={4} value={edit.memo_raw ?? ""} onChange={(e) => upd("memo_raw", e.target.value)} />
          </section>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelected(null)} className="text-sm text-blue-600 font-medium">
            &larr; 一覧に戻る
          </button>
          <button onClick={startEdit} className="text-sm bg-blue-600 text-white font-bold px-4 py-1.5 rounded-lg">
            ✏️ 編集
          </button>
        </div>

        {/* 日付ナビゲーション */}
        <div className="flex items-center justify-between bg-white rounded-xl px-2 py-2 shadow-sm">
          <button
            onClick={() => navigateDay(-1)}
            className="text-blue-600 text-sm font-bold px-3 py-1 hover:bg-blue-50 rounded"
          >
            ← 前日
          </button>
          <h2 className="text-lg font-bold">{formatDate(selected.date)}</h2>
          <button
            onClick={() => navigateDay(1)}
            disabled={isFutureDate(addDays(selected.date, 1))}
            className="text-blue-600 text-sm font-bold px-3 py-1 hover:bg-blue-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            翌日 →
          </button>
        </div>

        {/* AI診断（あれば表示） */}
        {(selected.ai_diary || selected.ai_advice) && (
          <section className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-purple-700">🤖 AI診断</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-purple-700">
                  {Math.round(((selected.relationship_score ?? 50) + (selected.money_score ?? 50) + (selected.work_score ?? 50) + (selected.health_score ?? 50)) / 4)}
                </span>
                <span className="text-xs text-gray-500">/100</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "💕関係", v: selected.relationship_score ?? 50, c: "text-pink-600" },
                { label: "💰お金", v: selected.money_score ?? 50, c: "text-yellow-600" },
                { label: "💼仕事", v: selected.work_score ?? 50, c: "text-blue-600" },
                { label: "❤️健康", v: selected.health_score ?? 50, c: "text-green-600" },
              ].map((d) => (
                <div key={d.label} className="bg-white rounded-lg p-2 text-center">
                  <div className={`text-lg font-bold ${d.c}`}>{d.v}</div>
                  <div className="text-[10px] text-gray-500">{d.label}</div>
                </div>
              ))}
            </div>
            {selected.ai_diary && (
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs font-bold text-purple-700 mb-1">📖 日記</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.ai_diary}</p>
              </div>
            )}
            {selected.ai_insight && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs font-bold text-amber-700 mb-1">🌱 自分では気づかない気づき</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.ai_insight}</p>
              </div>
            )}
            {selected.ai_advice && (
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs font-bold text-pink-600 mb-1">💝 AIからの一言</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.ai_advice}</p>
              </div>
            )}
          </section>
        )}

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
        <button
          onClick={() => setViewMode("mission")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${viewMode === "mission" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          🌟 ミッション
        </button>
      </div>

      {/* ミッション週報 */}
      {viewMode === "mission" && (
        <section className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
          {!weekly && !weeklyLoading && (
            <div className="text-center py-6">
              <p className="text-sm text-gray-600 mb-4">
                過去7日間の行動を、あなたの人生ミッションの視点で振り返ります。
              </p>
              <button
                type="button"
                onClick={async () => {
                  setWeeklyLoading(true);
                  setWeeklyError("");
                  try {
                    const res = await fetch("/api/mission/weekly", { cache: "no-store" });
                    const json = await res.json();
                    if (!res.ok) {
                      setWeeklyError(json.error || "生成失敗");
                      return;
                    }
                    setWeekly(json);
                  } catch (e) {
                    setWeeklyError("通信エラー: " + (e as Error).message);
                  } finally {
                    setWeeklyLoading(false);
                  }
                }}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-6 py-3 rounded-xl shadow-sm"
              >
                🤖 週報を生成
              </button>
              {weeklyError && <p className="text-xs text-red-500 mt-3">{weeklyError}</p>}
            </div>
          )}

          {weeklyLoading && (
            <div className="text-center py-8">
              <p className="text-sm text-amber-700 font-bold">🤖 AIが今週を振り返っています...</p>
            </div>
          )}

          {weekly && !weekly.hasMission && (
            <div className="text-center py-6">
              <p className="text-sm text-gray-700 mb-4">ミッションが未設定です。</p>
              <a href="/mission/create" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-5 py-2 rounded-lg shadow-sm">
                ✨ ミッションを見つける
              </a>
            </div>
          )}

          {weekly && weekly.hasMission && (
            <div className="space-y-4">
              {/* ミッション常時表示 */}
              <div className="bg-white rounded-xl p-3 border border-amber-200">
                <p className="text-[10px] font-bold text-amber-700 mb-1">MY MISSION</p>
                <p className="text-sm text-gray-700 leading-relaxed">{weekly.mission}</p>
              </div>

              {/* 週平均合致度 */}
              <div className="bg-white rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-amber-700">今週のミッション合致度</h3>
                  <span className="text-2xl font-bold text-amber-700">{weekly.score}%</span>
                </div>
                <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                    style={{ width: `${weekly.score}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {weekly.periodStart} 〜 {weekly.periodEnd} の{weekly.logCount}日分の記録より
                </p>
              </div>

              {/* TOP3 */}
              {weekly.top3 && weekly.top3.length > 0 && (
                <div className="bg-white rounded-xl p-4 border border-amber-200">
                  <h3 className="text-sm font-bold text-amber-700 mb-3">🏆 ミッション貢献 TOP {weekly.top3.length}</h3>
                  <div className="space-y-3">
                    {weekly.top3.map((item, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="text-amber-500 font-bold">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 mb-0.5">{item.date}</p>
                          <p className="text-sm text-gray-800 font-medium mb-0.5">{item.action}</p>
                          <p className="text-xs text-amber-600">✨ {item.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI観察 */}
              {weekly.observation && (
                <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-4 border border-amber-300">
                  <p className="text-xs font-bold text-amber-800 mb-2">💡 AIからの観察</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{weekly.observation}</p>
                </div>
              )}

              {/* 再生成 */}
              <button
                type="button"
                onClick={() => { setWeekly(null); setWeeklyError(""); }}
                className="w-full text-xs text-amber-700 underline py-2"
              >
                🔄 もう一度生成する
              </button>
            </div>
          )}
        </section>
      )}

      {/* サマリー（ミッションタブでは非表示） */}
      {viewMode !== "mission" && history.length > 0 && (() => {
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

      {/* 履歴リスト（ミッションタブでは非表示） */}
      {viewMode !== "mission" && (history.length === 0 ? (
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
                  {day.ai_diary && <p className="truncate text-purple-600">🤖 {day.ai_diary}</p>}
                  {day.mit1 && <p>📝 {day.mit1}</p>}
                  {showDone && <p className="truncate">💭 {doneNote}</p>}
                  {day.gratitude_note && <p className="truncate">🙏 {day.gratitude_note}</p>}
                </div>
              )}
            </div>
          );
        })
      ))}
    </div>
  );
}
