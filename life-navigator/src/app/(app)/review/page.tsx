"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ReviewPage() {
  const [doneNote, setDoneNote] = useState("");
  const [gratitudeNote, setGratitudeNote] = useState("");
  const [tomorrowPlan, setTomorrowPlan] = useState("");
  const [reflectionNote, setReflectionNote] = useState("");
  const [tomorrowMits, setTomorrowMits] = useState(["", "", ""]);
  const [saved, setSaved] = useState(false);
  const [aiDiary, setAiDiary] = useState("");
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiInsight, setAiInsight] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [scores, setScores] = useState({ rel: 50, money: 50, work: 50, health: 50 });
  const [diagnosing, setDiagnosing] = useState(false);

  useEffect(() => {
    fetch("/api/daylog").then((r) => r.json()).then((data) => {
      const rawDone = data.done_note || data.doneNote || "";
      setDoneNote(rawDone.startsWith("[") ? "" : rawDone);
      setGratitudeNote(data.gratitude_note || data.gratitudeNote || "");
      setTomorrowPlan(data.tomorrow_plan || data.tomorrowPlan || "");
      setAiDiary(data.ai_diary || "");
      setAiAdvice(data.ai_advice || "");
      setAiInsight(data.ai_insight || "");
      setScores({
        rel: data.relationship_score ?? 50,
        money: data.money_score ?? 50,
        work: data.work_score ?? 50,
        health: data.health_score ?? 50,
      });
    });
    fetch("/api/user/plan").then((r) => r.json()).then((data) => {
      setIsPro(data.isPro || false);
      setUsageCount(data.usageThisMonth || 0);
    }).catch(() => {});
  }, []);

  const runAiDiagnosis = async () => {
    setDiagnosing(true);
    try {
      // 先に入力内容を保存してから診断
      await fetch("/api/daylog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doneNote, gratitudeNote, tomorrowPlan }),
      });
      const res = await fetch("/api/score", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "AI診断に失敗しました");
        return;
      }
      const data = await res.json();
      setAiDiary(data.diary);
      setAiAdvice(data.advice);
      setAiInsight(data.self_insight || "");
      setScores(data.scores);
    } catch (e) {
      alert("診断エラー: " + (e as Error).message);
    } finally {
      setDiagnosing(false);
    }
  };

  const saveReview = useCallback(async () => {
    await fetch("/api/daylog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doneNote, gratitudeNote, tomorrowPlan }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [doneNote, gratitudeNote, tomorrowPlan]);

  // 自動保存（2秒デバウンス）
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (isInitialLoad.current) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => { saveReview(); }, 2000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [doneNote, gratitudeNote, tomorrowPlan, tomorrowMits, saveReview]);

  useEffect(() => {
    const timer = setTimeout(() => { isInitialLoad.current = false; }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const save = async () => {
    await saveReview();

    // 明日の大切なこと3点を翌日のMITとして保存
    if (tomorrowMits.some(m => m.trim())) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().slice(0, 10);
      await fetch("/api/daylog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: tomorrowDate,
          mit1: tomorrowMits[0] || null,
          mit2: tomorrowMits[1] || null,
          mit3: tomorrowMits[2] || null,
        }),
      });
    }
  };

  const updateTomorrowMit = (idx: number, val: string) => {
    const next = [...tomorrowMits];
    next[idx] = val;
    setTomorrowMits(next);
  };

  return (
    <div className="space-y-5">
      {/* 挨拶 */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-1">おつかれさま！</h2>
        <p className="text-sm opacity-90">今日も一日がんばったね。少し話を聞かせて。</p>
      </div>

      {/* AI診断結果（あれば表示） */}
      {(aiDiary || aiAdvice) && (
        <section className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-purple-700">🤖 AIからのメッセージ</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-purple-700">{Math.round((scores.rel + scores.money + scores.work + scores.health) / 4)}</span>
              <span className="text-xs text-gray-500">/100</span>
            </div>
          </div>

          {/* 4領域スコア */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "💕関係", v: scores.rel, c: "text-pink-600" },
              { label: "💰お金", v: scores.money, c: "text-yellow-600" },
              { label: "💼仕事", v: scores.work, c: "text-blue-600" },
              { label: "❤️健康", v: scores.health, c: "text-green-600" },
            ].map((d) => (
              <div key={d.label} className="bg-white rounded-lg p-2 text-center">
                <div className={`text-lg font-bold ${d.c}`}>{d.v}</div>
                <div className="text-[10px] text-gray-500">{d.label}</div>
              </div>
            ))}
          </div>

          {aiDiary && (
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs font-bold text-purple-700 mb-1">📖 今日の日記</p>
              <p className="text-sm text-gray-700 leading-relaxed">{aiDiary}</p>
            </div>
          )}
          {aiInsight ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-bold text-amber-700 mb-1">🌱 自分では気づかない気づき</p>
              <p className="text-sm text-gray-700 leading-relaxed">{aiInsight}</p>
            </div>
          ) : !isPro && aiDiary ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
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
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs font-bold text-pink-600 mb-1">💝 明日への一言</p>
              <p className="text-sm text-gray-700 leading-relaxed">{aiAdvice}</p>
            </div>
          )}
        </section>
      )}

      {/* AI診断実行ボタン */}
      <button
        onClick={runAiDiagnosis}
        disabled={diagnosing}
        className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        {diagnosing ? "🤔 AIが診断中..." : aiDiary ? "🔄 もう一度AI診断" : "🤖 AIに今日を振り返ってもらう"}
      </button>
      {!isPro && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            今月の診断: {usageCount}/3回（無料プラン）
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

      {/* 今日の振り返り */}
      <section>
        <label className="block text-sm font-semibold mb-1 text-green-700">
          😊 今日はどうだった？
        </label>
        <textarea
          value={doneNote}
          onChange={(e) => setDoneNote(e.target.value)}
          placeholder="今日できたこと、感じたこと..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
        />
      </section>

      {/* 反省 */}
      <section>
        <label className="block text-sm font-semibold mb-1 text-red-500">
          💭 反省・改善したいことは？
        </label>
        <textarea
          value={reflectionNote}
          onChange={(e) => setReflectionNote(e.target.value)}
          placeholder="次はこうしたい、もっとこうすればよかった..."
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
        />
      </section>

      {/* 感謝 */}
      <section>
        <label className="block text-sm font-semibold mb-1 text-amber-600">
          🙏 今日ありがたかったことは？
        </label>
        <textarea
          value={gratitudeNote}
          onChange={(e) => setGratitudeNote(e.target.value)}
          placeholder="小さなことでもいいよ..."
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
        />
      </section>

      {/* 明日の予定 */}
      <section>
        <label className="block text-sm font-semibold mb-1 text-blue-700">
          🌅 明日はどんな日にしたい？
        </label>
        <textarea
          value={tomorrowPlan}
          onChange={(e) => setTomorrowPlan(e.target.value)}
          placeholder="明日やりたいこと、予定..."
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
        />
      </section>

      {/* 明日の大切なこと */}
      <section>
        <label className="block text-sm font-semibold mb-1 text-purple-700">
          ⭐ 明日の大切なこと
        </label>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </span>
              <input
                type="text"
                value={tomorrowMits[i]}
                onChange={(e) => updateTomorrowMit(i, e.target.value)}
                placeholder={`大切なこと ${i + 1}`}
                className="flex-1 text-sm outline-none bg-transparent"
              />
            </div>
          ))}
        </div>
      </section>

      {/* おやすみメッセージ + 保存 */}
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-3">明日もいい日になるよ。おやすみ。</p>
        <button
          onClick={save}
          className={`w-full py-3 rounded-xl font-medium transition-all ${
            saved
              ? "bg-green-500 text-white"
              : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
          }`}
        >
          {saved ? "✓ 保存しました!" : "振り返りを保存"}
        </button>
      </div>
    </div>
  );
}
