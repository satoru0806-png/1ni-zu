"use client";
import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Step = 1 | 2 | 3 | 4 | 5;
type DialogueMsg = { role: "user" | "assistant"; content: string };

function getThisMonthStart(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
}

function shiftMonth(monthStart: string, months: number): string {
  const d = new Date(monthStart + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function isThisMonth(monthStart: string): boolean {
  return monthStart === getThisMonthStart();
}

function isFutureMonth(monthStart: string): boolean {
  return monthStart > getThisMonthStart();
}

function formatMonth(monthStart: string): string {
  const d = new Date(monthStart + "T00:00:00");
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

export default function MonthlyReviewPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-gray-400">Loading...</div>}>
      <MonthlyReviewContent />
    </Suspense>
  );
}

function MonthlyReviewContent() {
  const searchParams = useSearchParams();
  const initialMonth = searchParams.get("month") || getThisMonthStart();
  const [step, setStep] = useState<Step>(1);
  const [monthStart, setMonthStart] = useState<string>(initialMonth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState("");
  const [stats, setStats] = useState<{ recordedDays: number; totalDays: number; allMitsCount: number; gratitudeCount: number; avgScore: number; weekliesCount: number } | null>(null);

  const [userText, setUserText] = useState("");
  const [feedback, setFeedback] = useState("");

  const [dialogue, setDialogue] = useState<DialogueMsg[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const userMessageRef = useRef<HTMLTextAreaElement>(null);

  const [finalResult, setFinalResult] = useState<{ theme: string; goals: string[] } | null>(null);

  const callApi = useCallback(async (action: string, extraBody: Record<string, unknown> = {}): Promise<Record<string, unknown> | null> => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/monthly-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, monthStart, ...extraBody }),
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
  }, [monthStart]);

  useEffect(() => {
    setSummary(""); setStats(null); setUserText(""); setFeedback("");
    setDialogue([]); setFinalResult(null); setStep(1); setError("");

    callApi("get").then((data) => {
      const reflection = (data?.reflection as Record<string, unknown> | undefined) || null;
      if (reflection?.ai_summary) {
        setSummary(reflection.ai_summary as string);
        if (reflection.user_text) setUserText(reflection.user_text as string);
        if (reflection.ai_feedback) setFeedback(reflection.ai_feedback as string);
        if (reflection.next_month_dialogue) setDialogue(reflection.next_month_dialogue as DialogueMsg[]);
        if (reflection.next_month_theme) {
          setFinalResult({
            theme: reflection.next_month_theme as string,
            goals: (reflection.next_month_goals as string[]) || [],
          });
        }
        if (reflection.next_month_theme) setStep(5);
        else if (reflection.next_month_dialogue && (reflection.next_month_dialogue as DialogueMsg[]).length > 0) setStep(4);
        else if (reflection.ai_feedback) setStep(3);
        else if (reflection.user_text) setStep(2);
      } else {
        callApi("summary").then((s) => {
          if (s) {
            setSummary(s.summary as string);
            setStats(s.stats as typeof stats);
          }
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthStart]);

  const generateFeedback = async () => {
    if (!userText.trim()) { setError("ご自身の言葉を入力してください"); return; }
    const data = await callApi("feedback", { userText });
    if (data) {
      setFeedback(data.feedback as string);
      setStep(3);
    }
  };

  const startDialogue = async () => {
    setStep(4);
    if (dialogue.length === 0) {
      const data = await callApi("next-month", { userMessage: "" });
      if (data) setDialogue(data.dialogue as DialogueMsg[]);
    }
  };

  const sendDialogueMessage = async () => {
    if (!userMessage.trim()) return;
    const data = await callApi("next-month", { userMessage });
    if (data) {
      setDialogue(data.dialogue as DialogueMsg[]);
      setUserMessage("");
    }
  };

  const finalize = async () => {
    const data = await callApi("next-month", { finalize: true });
    if (data?.theme) {
      setFinalResult({ theme: data.theme as string, goals: (data.goals as string[]) || [] });
      setStep(5);
    }
  };

  const stepBadge = (n: number, label: string) => (
    <div className={`flex items-center gap-1 text-xs ${step >= n ? "text-blue-600 font-bold" : "text-gray-400"}`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= n ? "bg-blue-500 text-white" : "bg-gray-200"}`}>{n}</span>
      <span>{label}</span>
    </div>
  );

  return (
    <div className="space-y-4 pb-8">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold text-blue-900">🌙 1 ヶ月の振り返り</h1>
          {!isThisMonth(monthStart) && (
            <button onClick={() => setMonthStart(getThisMonthStart())} className="text-xs bg-blue-600 text-white px-2 py-1 rounded-md">
              今月へ
            </button>
          )}
        </div>
        <div className="flex items-center justify-between bg-white rounded-xl px-2 py-1.5 mb-3">
          <button onClick={() => setMonthStart(shiftMonth(monthStart, -1))} className="text-blue-700 text-xs font-bold px-2 py-1 hover:bg-blue-50 rounded">
            ← 前月
          </button>
          <span className="text-sm font-semibold text-blue-900">{formatMonth(monthStart)}</span>
          <button onClick={() => setMonthStart(shiftMonth(monthStart, 1))} disabled={isFutureMonth(shiftMonth(monthStart, 1))} className="text-blue-700 text-xs font-bold px-2 py-1 hover:bg-blue-50 rounded disabled:opacity-30 disabled:cursor-not-allowed">
            翌月 →
          </button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {stepBadge(1, "サマリー")}
          {stepBadge(2, "自分の言葉")}
          {stepBadge(3, "気づき")}
          {stepBadge(4, "来月")}
          {stepBadge(5, "確定")}
        </div>
      </header>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}

      {step >= 1 && (
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-bold text-blue-700">Step 1: AI が今月を振り返ります</h2>
          {!summary && loading && <p className="text-sm text-gray-500">📝 AI が今月を見つめています...</p>}
          {summary && (
            <>
              <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">{summary}</p>
              {stats && (
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  <div className="bg-blue-50 rounded p-2">
                    <div className="font-bold text-blue-700">{stats.recordedDays}/{stats.totalDays}</div>
                    <div className="text-gray-500 text-[10px]">記録日</div>
                  </div>
                  <div className="bg-green-50 rounded p-2">
                    <div className="font-bold text-green-700">{stats.allMitsCount}</div>
                    <div className="text-gray-500 text-[10px]">MIT</div>
                  </div>
                  <div className="bg-amber-50 rounded p-2">
                    <div className="font-bold text-amber-700">{stats.gratitudeCount}</div>
                    <div className="text-gray-500 text-[10px]">感謝</div>
                  </div>
                  <div className="bg-purple-50 rounded p-2">
                    <div className="font-bold text-purple-700">{stats.avgScore}</div>
                    <div className="text-gray-500 text-[10px]">スコア</div>
                  </div>
                  <div className="bg-pink-50 rounded p-2">
                    <div className="font-bold text-pink-700">{stats.weekliesCount}</div>
                    <div className="text-gray-500 text-[10px]">週次</div>
                  </div>
                </div>
              )}
              {step === 1 && (
                <button onClick={() => setStep(2)} className="w-full bg-blue-500 text-white py-2.5 rounded-xl font-bold">
                  自分の言葉で話す →
                </button>
              )}
            </>
          )}
        </section>
      )}

      {step >= 2 && (
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-bold text-blue-700">Step 2: 今月、ご自身の言葉で振り返ってみましょう</h2>
          <p className="text-xs text-gray-600">大きな視点で。月単位で何を感じたか、何が変わったか。音声入力もキーボードも OK。</p>
          <textarea
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            placeholder="今月どうでしたか?..."
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={step >= 3}
          />
          {step === 2 && (
            <button onClick={generateFeedback} disabled={loading} className="w-full bg-blue-500 text-white py-2.5 rounded-xl font-bold disabled:opacity-50">
              {loading ? "AI が読んでいます..." : "AI に見てもらう →"}
            </button>
          )}
        </section>
      )}

      {step >= 3 && feedback && (
        <section className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-purple-700">Step 3: AI からの気づき</h2>
          <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">{feedback}</p>
          {step === 3 && (
            <button onClick={startDialogue} className="w-full bg-purple-500 text-white py-2.5 rounded-xl font-bold">
              来月を一緒に考える →
            </button>
          )}
        </section>
      )}

      {step >= 4 && (
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-bold text-blue-700">Step 4: 来月の方向性を一緒に</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {dialogue.map((m, i) => (
              <div key={i} className={`p-3 rounded-lg text-sm ${m.role === "user" ? "bg-blue-50 ml-6" : "bg-purple-50 mr-6"}`}>
                <div className={`text-[10px] font-bold mb-1 ${m.role === "user" ? "text-blue-700" : "text-purple-700"}`}>
                  {m.role === "user" ? "あなた" : "AI"}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              </div>
            ))}
            {loading && <div className="text-xs text-gray-500 text-center py-2">AI が考えています...</div>}
          </div>
          {step === 4 && !finalResult && (
            <>
              <textarea
                ref={userMessageRef}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="返信を入力（音声入力も可）..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex gap-2">
                <button onClick={sendDialogueMessage} disabled={loading || !userMessage.trim()} className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                  送る
                </button>
                <button onClick={finalize} disabled={loading || dialogue.length < 2} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                  来月のテーマ確定
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {step >= 5 && finalResult && (
        <section className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-green-700">🌱 来月の方向性が決まりました</h2>
          <div className="bg-white rounded-xl p-3 space-y-2">
            <p className="text-xs text-gray-500">重点テーマ</p>
            <p className="text-base font-bold text-green-800">{finalResult.theme}</p>
          </div>
          {finalResult.goals.length > 0 && (
            <div className="bg-white rounded-xl p-3 space-y-2">
              <p className="text-xs text-gray-500">目標</p>
              <ol className="space-y-1.5">
                {finalResult.goals.map((g, i) => (
                  <li key={i} className="text-sm">🎯 {g}</li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
