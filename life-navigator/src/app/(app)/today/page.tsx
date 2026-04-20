"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

type DayLog = {
  mit1: string | null;
  mit2: string | null;
  mit3: string | null;
  done_note: string | null;
  memo_raw: string | null;
  relationship_score?: number;
  money_score?: number;
  work_score?: number;
  health_score?: number;
  ai_diary?: string | null;
  ai_advice?: string | null;
  ai_insight?: string | null;
};

type Scores = { rel: number; money: number; work: number; health: number };

function trendArrow(now: number, prev: number): string {
  if (now > prev + 2) return "↗";
  if (now < prev - 2) return "↘";
  return "→";
}

function trendColor(now: number, prev: number): string {
  if (now > prev + 2) return "text-green-600";
  if (now < prev - 2) return "text-red-500";
  return "text-gray-400";
}

function DotGauge({ score, color }: { score: number; color: string }) {
  const dots = Math.round(score / 20); // 0-5
  return (
    <div className="flex gap-0.5 justify-center">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`inline-block w-1.5 h-1.5 rounded-full ${i < dots ? color : "bg-gray-200"}`}
        />
      ))}
    </div>
  );
}

export default function TodayPage() {
  const [mits, setMits] = useState(["", "", ""]);
  const [checks, setChecks] = useState([false, false, false]);
  const [memo, setMemo] = useState("");
  const [saved, setSaved] = useState(false);
  const [scores, setScores] = useState<Scores>({ rel: 50, money: 50, work: 50, health: 50 });
  const [prevScores, setPrevScores] = useState<Scores>({ rel: 50, money: 50, work: 50, health: 50 });
  const [editingDomain, setEditingDomain] = useState<keyof Scores | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [aiDiary, setAiDiary] = useState<string>("");
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isPro, setIsPro] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(3);
  const [aiReasons, setAiReasons] = useState<{ rel: string; money: string; work: string; health: string } | null>(null);
  const [mission, setMission] = useState<string>("");
  const [missionAlignment, setMissionAlignment] = useState<string>("");
  const [missionScore, setMissionScore] = useState<number>(0);
  type Goal = { id: string; title: string; deadline: string | null; progress: number; icon: string };
  const [goals, setGoals] = useState<Goal[]>([]);

  const runAiDiagnosis = async () => {
    setDiagnosing(true);
    try {
      const res = await fetch("/api/score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "AI診断に失敗しました");
        return;
      }
      const data = await res.json();
      setScores(data.scores);
      setAiDiary(data.diary);
      setAiAdvice(data.advice);
      setAiInsight(data.self_insight || "");
      setAiReasons(data.reasons);
      setMissionAlignment(data.mission_alignment || "");
      setMissionScore(data.mission_score || 0);
      if (data.isPro !== undefined) setIsPro(data.isPro);
      setUsageCount((prev) => prev + 1);
    } catch (e) {
      alert("診断エラー: " + (e as Error).message);
    } finally {
      setDiagnosing(false);
    }
  };

  const updateScore = (key: keyof Scores, val: number) => {
    const next = { ...scores, [key]: val };
    setScores(next);
    // 自動保存（デバウンス不要、blur時でもOKだがリアルタイムで）
    const dbField = key === "rel" ? "relationshipScore" : key === "money" ? "moneyScore" : key === "work" ? "workScore" : "healthScore";
    fetch("/api/daylog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [dbField]: val }),
    });
  };

  useEffect(() => {
    // 今日のデータ
    fetch("/api/daylog").then((r) => r.json()).then((data: DayLog) => {
      setMits([data.mit1 || "", data.mit2 || "", data.mit3 || ""]);
      setMemo(data.memo_raw || "");
      setScores({
        rel: data.relationship_score ?? 50,
        money: data.money_score ?? 50,
        work: data.work_score ?? 50,
        health: data.health_score ?? 50,
      });
      setAiDiary(data.ai_diary || "");
      setAiAdvice(data.ai_advice || "");
      setAiInsight(data.ai_insight || "");
      if (data.done_note) {
        try {
          const parsed = JSON.parse(data.done_note);
          if (Array.isArray(parsed)) setChecks(parsed);
        } catch {
          setChecks([false, false, false]);
        }
      }
    });

    // プラン情報取得
    fetch("/api/user/plan").then((r) => r.json()).then((data) => {
      setIsPro(data.isPro || false);
      setUsageCount(data.usageThisMonth || 0);
      setUsageLimit(data.limit === -1 ? -1 : data.limit || 3);
    }).catch(() => {});

    // ミッション取得
    fetch("/api/user/mission").then((r) => r.json()).then((d) => {
      if (typeof d.mission === "string") setMission(d.mission);
    }).catch(() => {});

    // アクティブゴール取得
    fetch("/api/goals").then((r) => r.json()).then((d) => {
      if (Array.isArray(d.goals)) setGoals(d.goals);
    }).catch(() => {});

    // 昨日のスコア（トレンド比較用）
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    fetch(`/api/daylog?date=${yStr}`).then((r) => r.json()).then((data: DayLog) => {
      setPrevScores({
        rel: data.relationship_score ?? 50,
        money: data.money_score ?? 50,
        work: data.work_score ?? 50,
        health: data.health_score ?? 50,
      });
    }).catch(() => {});
  }, []);

  const avgScore = Math.round((scores.rel + scores.money + scores.work + scores.health) / 4);

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

  // 自動保存（2秒デバウンス）
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (isInitialLoad.current) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => { save(); }, 2000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [mits, memo, checks, save]);

  // 初回ロード完了後に自動保存を有効化
  useEffect(() => {
    const timer = setTimeout(() => { isInitialLoad.current = false; }, 1500);
    return () => clearTimeout(timer);
  }, []);

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
      {/* 人生ミッション常時表示 - 決まっていれば最上部に */}
      {mission ? (
        <section className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 text-lg leading-none mt-0.5">🌟</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-amber-700 mb-0.5">MY MISSION</p>
              <p className="text-sm text-gray-700 leading-relaxed">{mission}</p>
            </div>
          </div>
        </section>
      ) : (
        /* ミッション未設定時の誘導バナー */
        <Link
          href="/mission/create"
          className="block bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-400 rounded-xl p-3 shadow-sm hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌟</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-700 mb-0.5">あなたのミッションを見つけましょう</p>
              <p className="text-xs text-gray-600">AIと3つの質問で対話するだけ。人生の軸を言語化できます。</p>
            </div>
            <span className="text-amber-600 text-lg">→</span>
          </div>
        </Link>
      )}

      {/* アクティブゴール（最大3つ表示） */}
      {goals.length > 0 && (
        <Link href="/goals" className="block">
          <section className="bg-white border border-amber-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-amber-700">🎯 追いかけているゴール</h3>
              <span className="text-[10px] text-gray-400">タップで詳細 →</span>
            </div>
            <div className="space-y-1.5">
              {goals.slice(0, 3).map((g) => {
                const days = g.deadline
                  ? Math.ceil((new Date(g.deadline + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
                  : null;
                return (
                  <div key={g.id} className="flex items-center gap-2">
                    <span className="text-sm">{g.icon || "🎯"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 truncate">{g.title}</p>
                    </div>
                    {days != null && (
                      <span className={`text-[10px] font-bold whitespace-nowrap ${days < 0 ? "text-red-500" : days <= 7 ? "text-orange-500" : "text-gray-500"}`}>
                        {days < 0 ? `${-days}日超過` : days === 0 ? "今日" : `${days}日`}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-amber-700 w-8 text-right">{g.progress}%</span>
                  </div>
                );
              })}
              {goals.length > 3 && (
                <p className="text-[10px] text-center text-gray-400 pt-1">他 {goals.length - 3} 個</p>
              )}
            </div>
          </section>
        </Link>
      )}

      {/* バランスカード（4領域スコア可視化 - C+D統合） */}
      <section className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700">🌅 今日のバランス</h2>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-purple-700">{avgScore}</span>
            <span className="text-xs text-gray-500">/100</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { key: "rel", label: "関係", emoji: "💕", color: "bg-pink-500", now: scores.rel, prev: prevScores.rel, reason: aiReasons?.rel },
            { key: "money", label: "お金", emoji: "💰", color: "bg-yellow-500", now: scores.money, prev: prevScores.money, reason: aiReasons?.money },
            { key: "work", label: "仕事", emoji: "💼", color: "bg-blue-500", now: scores.work, prev: prevScores.work, reason: aiReasons?.work },
            { key: "health", label: "健康", emoji: "❤️", color: "bg-green-500", now: scores.health, prev: prevScores.health, reason: aiReasons?.health },
          ].map((d) => (
            <div key={d.key} className="bg-white rounded-lg p-2 text-center shadow-sm">
              <div className="text-lg leading-none mb-1">{d.emoji}</div>
              <div className="text-sm font-bold text-gray-700">{d.now}</div>
              <DotGauge score={d.now} color={d.color} />
              <div className="flex items-center justify-center gap-0.5 mt-1">
                <span className="text-[10px] text-gray-500">{d.label}</span>
                <span className={`text-xs font-bold ${trendColor(d.now, d.prev)}`}>{trendArrow(d.now, d.prev)}</span>
              </div>
              {d.reason && (
                <div className="text-[9px] text-gray-500 mt-1 leading-tight">{d.reason}</div>
              )}
            </div>
          ))}
        </div>

        {/* AI診断ボタン */}
        <button
          onClick={runAiDiagnosis}
          disabled={diagnosing}
          className="mt-3 w-full py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {diagnosing ? "🤔 診断中..." : "🤖 今日の診断をお願いする"}
        </button>
        {!isPro && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              今月の診断: {usageCount}/{usageLimit}回（無料プラン）
            </span>
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch("/api/stripe/checkout", { method: "POST" });
                  const data = await res.json();
                  if (data.url) {
                    window.location.href = data.url;
                  } else {
                    alert(`アップグレードに失敗しました: ${data.error || "不明なエラー"}`);
                  }
                } catch (e) {
                  alert(`通信エラー: ${(e as Error).message}`);
                }
              }}
              className="text-xs font-bold text-purple-600 underline cursor-pointer"
            >
              Proにアップグレード →
            </button>
          </div>
        )}

        {/* AI日記＋アドバイス */}
        {missionAlignment && (
          <div className="mt-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-200">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-amber-700">🌟 ミッション合致度</p>
              <span className="text-sm font-bold text-amber-700">{missionScore}%</span>
            </div>
            <div className="w-full bg-amber-100 rounded-full h-1.5 mb-2 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all" style={{ width: `${missionScore}%` }} />
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{missionAlignment}</p>
          </div>
        )}

        {(aiDiary || aiAdvice || aiInsight) && (
          <div className="mt-3 bg-white rounded-xl p-3 border border-purple-200 space-y-2">
            {aiDiary && (
              <div>
                <p className="text-xs font-bold text-purple-700 mb-1">📖 今日の日記</p>
                <p className="text-sm text-gray-700 leading-relaxed">{aiDiary}</p>
              </div>
            )}
            {aiInsight ? (
              <div className="pt-2 border-t border-purple-100 bg-gradient-to-br from-amber-50 to-orange-50 -mx-3 px-3 py-2 rounded">
                <p className="text-xs font-bold text-amber-700 mb-1">🌱 自分では気づかない気づき</p>
                <p className="text-sm text-gray-700 leading-relaxed">{aiInsight}</p>
              </div>
            ) : !isPro && aiDiary ? (
              <div className="pt-2 border-t border-purple-100 bg-gradient-to-br from-gray-50 to-gray-100 -mx-3 px-3 py-2 rounded">
                <p className="text-xs font-bold text-gray-400 mb-1">🔒 自分では気づかない気づき</p>
                <p className="text-xs text-gray-400">Proプランで解放されます</p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/stripe/checkout", { method: "POST" });
                      const data = await res.json();
                      if (data.url) {
                        window.location.href = data.url;
                      } else {
                        alert(`アップグレードに失敗しました: ${data.error || "不明なエラー"}`);
                      }
                    } catch (e) {
                      alert(`通信エラー: ${(e as Error).message}`);
                    }
                  }}
                  className="mt-1 text-xs font-bold text-purple-600 underline cursor-pointer"
                >
                  Proプラン（月額980円）→
                </button>
              </div>
            ) : null}
            {aiAdvice && (
              <div className="pt-2 border-t border-purple-100">
                <p className="text-xs font-bold text-pink-600 mb-1">💝 明日への一言</p>
                <p className="text-sm text-gray-700 leading-relaxed">{aiAdvice}</p>
              </div>
            )}
          </div>
        )}
      </section>

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
