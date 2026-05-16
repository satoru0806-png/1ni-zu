"use client";
import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Step = 1 | 2 | 3 | 4 | 5; // 1: summary, 2: user_text, 3: feedback, 4: dialogue, 5: done

type DialogueMsg = { role: "user" | "assistant"; content: string };

function getThisWeekStart(weekStartDay = 1): string {
  // weekStartDay: 0=日曜, 1=月曜...
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=日曜
  const diff = (dayOfWeek - weekStartDay + 7) % 7;
  const start = new Date(today);
  start.setDate(start.getDate() - diff);
  return start.toISOString().slice(0, 10);
}

function shiftWeek(weekStart: string, weeks: number): string {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

function isThisWeek(weekStart: string): boolean {
  return weekStart === getThisWeekStart();
}

function isFutureWeek(weekStart: string): boolean {
  return weekStart > getThisWeekStart();
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.getMonth() + 1}/${start.getDate()} 〜 ${end.getMonth() + 1}/${end.getDate()}`;
}

export default function WeeklyReviewPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-gray-400">Loading...</div>}>
      <WeeklyReviewContent />
    </Suspense>
  );
}

function WeeklyReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialWeek = searchParams.get("week") || getThisWeekStart();
  const [step, setStep] = useState<Step>(1);
  const [weekStart, setWeekStart] = useState<string>(initialWeek);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState("");
  const [stats, setStats] = useState<{ recordedDays: number; totalDays: number; allMitsCount: number; gratitudeCount: number; avgScore: number } | null>(null);

  const [userText, setUserText] = useState("");
  const userTextRef = useRef<HTMLTextAreaElement>(null);

  const [feedback, setFeedback] = useState("");

  const [dialogue, setDialogue] = useState<DialogueMsg[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const userMessageRef = useRef<HTMLTextAreaElement>(null);

  const [finalMits, setFinalMits] = useState<{ mit1: string; mit2: string; mit3: string; theme: string } | null>(null);
  const [applied, setApplied] = useState(false);

  const callApi = useCallback(async (action: string, extraBody: Record<string, unknown> = {}): Promise<Record<string, unknown> | null> => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/weekly-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, weekStart, ...extraBody }),
      });
      const text = await res.text();
      let json: Record<string, unknown> | null = null;
      try { json = text ? JSON.parse(text) : null; } catch {
        setError(`サーバーエラー (${res.status}): ${text.slice(0, 200) || "空レスポンス"}`);
        return null;
      }
      if (!res.ok) {
        const errMsg = json && typeof json.error === "string" ? json.error : null;
        setError(errMsg || `API エラー (${res.status})`);
        return null;
      }
      return json;
    } catch (e) {
      setError("通信エラー: " + (e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  // 週変更時 or 初回ロード時にデータ取得
  useEffect(() => {
    // ステート完全リセット（前の週のデータを混ぜない）
    setSummary("");
    setStats(null);
    setUserText("");
    setFeedback("");
    setDialogue([]);
    setFinalMits(null);
    setApplied(false);
    setStep(1);
    setError("");

    callApi("get").then((data) => {
      const reflection = (data?.reflection as Record<string, unknown> | undefined) || null;
      if (reflection?.ai_summary) {
        setSummary(reflection.ai_summary as string);
        if (reflection.user_text) setUserText(reflection.user_text as string);
        if (reflection.ai_feedback) setFeedback(reflection.ai_feedback as string);
        if (reflection.next_week_dialogue) setDialogue(reflection.next_week_dialogue as DialogueMsg[]);
        if (reflection.next_week_mits) setFinalMits(reflection.next_week_mits as { mit1: string; mit2: string; mit3: string; theme: string });
        if (reflection.applied) setApplied(true);
        // 既に進んでる場合、最も進んだステップに移動
        if (reflection.next_week_mits) setStep(5);
        else if (reflection.next_week_dialogue && (reflection.next_week_dialogue as DialogueMsg[]).length > 0) setStep(4);
        else if (reflection.ai_feedback) setStep(3);
        else if (reflection.user_text) setStep(2);
      } else {
        callApi("summary").then((s) => {
          if (s) {
            setSummary(s.summary as string);
            setStats(s.stats as { recordedDays: number; totalDays: number; allMitsCount: number; gratitudeCount: number; avgScore: number });
          }
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const generateFeedback = async () => {
    if (!userText.trim()) {
      setError("ご自身の言葉を入力してください");
      return;
    }
    const data = await callApi("feedback", { userText });
    if (data) {
      setFeedback(data.feedback as string);
      setStep(3);
    }
  };

  const startDialogue = async () => {
    setStep(4);
    if (dialogue.length === 0) {
      const data = await callApi("next-week", { userMessage: "" });
      if (data) setDialogue(data.dialogue as DialogueMsg[]);
    }
  };

  const sendDialogueMessage = async () => {
    if (!userMessage.trim()) return;
    const data = await callApi("next-week", { userMessage });
    if (data) {
      setDialogue(data.dialogue as DialogueMsg[]);
      setUserMessage("");
    }
  };

  const finalizeMits = async () => {
    const data = await callApi("next-week", { finalize: true });
    if (data?.mits) {
      setFinalMits(data.mits as { mit1: string; mit2: string; mit3: string; theme: string });
      setStep(5);
    }
  };

  const applyToNextWeek = async () => {
    const data = await callApi("apply");
    if (data?.ok) {
      setApplied(true);
    }
  };

  const stepBadge = (n: number, label: string) => (
    <div className={`flex items-center gap-1 text-xs ${step >= n ? "text-amber-600 font-bold" : "text-gray-400"}`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= n ? "bg-amber-500 text-white" : "bg-gray-200"}`}>{n}</span>
      <span>{label}</span>
    </div>
  );

  return (
    <div className="space-y-4 pb-8">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold text-amber-900">🌟 1 週間の振り返り</h1>
          {!isThisWeek(weekStart) && (
            <button onClick={() => setWeekStart(getThisWeekStart())} className="text-xs bg-amber-600 text-white px-2 py-1 rounded-md">
              今週へ
            </button>
          )}
        </div>
        {/* 週ナビゲーション */}
        <div className="flex items-center justify-between bg-white rounded-xl px-2 py-1.5 mb-3">
          <button
            onClick={() => setWeekStart(shiftWeek(weekStart, -1))}
            className="text-amber-700 text-xs font-bold px-2 py-1 hover:bg-amber-50 rounded"
          >
            ← 前週
          </button>
          <span className="text-sm font-semibold text-amber-900">{formatWeekRange(weekStart)}</span>
          <button
            onClick={() => setWeekStart(shiftWeek(weekStart, 1))}
            disabled={isFutureWeek(shiftWeek(weekStart, 1))}
            className="text-amber-700 text-xs font-bold px-2 py-1 hover:bg-amber-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            翌週 →
          </button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {stepBadge(1, "サマリー")}
          {stepBadge(2, "自分の言葉")}
          {stepBadge(3, "気づき")}
          {stepBadge(4, "来週")}
          {stepBadge(5, "確定")}
        </div>
      </header>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}

      {/* Step 1: AI Summary */}
      {step >= 1 && (
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-bold text-amber-700">Step 1: AI が今週を振り返ります</h2>
          {!summary && loading && <p className="text-sm text-gray-500">📝 AI が今週を見つめています...</p>}
          {summary && (
            <>
              <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">{summary}</p>
              {stats && (
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-blue-50 rounded p-2">
                    <div className="font-bold text-blue-700">{stats.recordedDays}/{stats.totalDays}</div>
                    <div className="text-gray-500">記録日</div>
                  </div>
                  <div className="bg-green-50 rounded p-2">
                    <div className="font-bold text-green-700">{stats.allMitsCount}</div>
                    <div className="text-gray-500">MIT 設定</div>
                  </div>
                  <div className="bg-amber-50 rounded p-2">
                    <div className="font-bold text-amber-700">{stats.gratitudeCount}</div>
                    <div className="text-gray-500">感謝</div>
                  </div>
                  <div className="bg-purple-50 rounded p-2">
                    <div className="font-bold text-purple-700">{stats.avgScore}</div>
                    <div className="text-gray-500">スコア平均</div>
                  </div>
                </div>
              )}
              {step === 1 && (
                <button onClick={() => setStep(2)} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold">
                  自分の言葉で話す →
                </button>
              )}
            </>
          )}
        </section>
      )}

      {/* Step 2: User Text */}
      {step >= 2 && (
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-bold text-amber-700">Step 2: 今週、ご自身の言葉で振り返ってみましょう</h2>
          <p className="text-xs text-gray-600">何でも自由に。うまくいったこと、もやもやしたこと、感じたこと。音声入力 (SpeakNote) もキーボードもどちらも OK です。</p>
          <textarea
            ref={userTextRef}
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            placeholder="今週どうでしたか?..."
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
            disabled={step >= 3}
          />
          {step === 2 && (
            <button onClick={generateFeedback} disabled={loading} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold disabled:opacity-50">
              {loading ? "AI が読んでいます..." : "AI に見てもらう →"}
            </button>
          )}
        </section>
      )}

      {/* Step 3: AI Feedback */}
      {step >= 3 && feedback && (
        <section className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-purple-700">Step 3: AI からの気づき</h2>
          <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">{feedback}</p>
          {step === 3 && (
            <button onClick={startDialogue} className="w-full bg-purple-500 text-white py-2.5 rounded-xl font-bold">
              来週を一緒に考える →
            </button>
          )}
        </section>
      )}

      {/* Step 4: Next-week dialogue */}
      {step >= 4 && (
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-bold text-amber-700">Step 4: 来週の一歩を一緒に</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {dialogue.map((m, i) => (
              <div key={i} className={`p-3 rounded-lg text-sm ${m.role === "user" ? "bg-amber-50 ml-6" : "bg-purple-50 mr-6"}`}>
                <div className={`text-[10px] font-bold mb-1 ${m.role === "user" ? "text-amber-700" : "text-purple-700"}`}>
                  {m.role === "user" ? "あなた" : "AI"}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              </div>
            ))}
            {loading && <div className="text-xs text-gray-500 text-center py-2">AI が考えています...</div>}
          </div>
          {step === 4 && !finalMits && (
            <>
              <textarea
                ref={userMessageRef}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="返信を入力（音声入力も可）..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <div className="flex gap-2">
                <button onClick={sendDialogueMessage} disabled={loading || !userMessage.trim()} className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                  送る
                </button>
                <button onClick={finalizeMits} disabled={loading || dialogue.length < 2} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                  来週の MIT 確定
                </button>
              </div>
              <p className="text-[10px] text-gray-500 text-center">十分話し合えたら「来週の MIT 確定」を押してください</p>
            </>
          )}
        </section>
      )}

      {/* Step 5: 確定 */}
      {step >= 5 && finalMits && (
        <section className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-green-700">🌱 来週の MIT が決まりました</h2>
          <div className="bg-white rounded-xl p-3 space-y-2">
            <p className="text-xs text-gray-500">重点テーマ</p>
            <p className="text-sm font-bold text-green-800">{finalMits.theme}</p>
          </div>
          <ol className="space-y-2">
            <li className="bg-white rounded-xl p-3 text-sm">📝 <strong>MIT 1:</strong> {finalMits.mit1}</li>
            <li className="bg-white rounded-xl p-3 text-sm">📝 <strong>MIT 2:</strong> {finalMits.mit2}</li>
            <li className="bg-white rounded-xl p-3 text-sm">📝 <strong>MIT 3:</strong> {finalMits.mit3}</li>
          </ol>
          {!applied ? (
            <button onClick={applyToNextWeek} disabled={loading} className="w-full bg-green-600 text-white py-2.5 rounded-xl font-bold disabled:opacity-50">
              {loading ? "反映中..." : "来週の「今日」に反映する"}
            </button>
          ) : (
            <div className="bg-green-100 rounded-xl p-3 text-center text-sm font-bold text-green-800">
              ✓ 来週の MIT として反映されました
              <button onClick={() => router.push("/today")} className="block w-full mt-2 text-xs text-green-700 underline">「今日」に戻る</button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
