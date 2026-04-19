"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Candidate = {
  style: string;
  label: string;
  mission: string;
  why: string;
};

type WizardData = {
  wakuwaku: string;
  origin: string;
  person: string;
};

const DRAFT_KEY = "yumenavi_mission_wizard_draft";

export default function MissionCreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [data, setData] = useState<WizardData>({ wakuwaku: "", origin: "", person: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [commonThread, setCommonThread] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedMission, setSelectedMission] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // ドラフト復元
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.data) setData(parsed.data);
        if (parsed.step && parsed.step <= 3) setStep(parsed.step);
      }
    } catch {}
  }, []);

  // ドラフト保存（Step 1-3のみ）
  useEffect(() => {
    if (step <= 3) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step }));
      } catch {}
    }
  }, [data, step]);

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  };

  const generateCandidates = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/mission/wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "生成に失敗しました");
        return;
      }
      setCommonThread(json.common_thread || "");
      setCandidates(json.candidates || []);
      setStep(4);
    } catch (e) {
      setError("通信エラー: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const saveMission = async () => {
    if (!selectedMission.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission: selectedMission.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert("保存失敗: " + (err.error || "不明なエラー"));
        return;
      }
      clearDraft();
      router.push("/today");
    } catch (e) {
      alert("通信エラー: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // ===== Step 1-3 共通レイアウト =====
  const Header = ({ stepNum, title, intro }: { stepNum: number; title: string; intro: string }) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold text-amber-600">STEP {stepNum} / 4</span>
        <div className="flex-1 h-1 bg-amber-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all" style={{ width: `${(stepNum / 4) * 100}%` }} />
        </div>
      </div>
      <h1 className="text-lg font-bold text-gray-800 mb-1">{title}</h1>
      <p className="text-sm text-gray-600 leading-relaxed">{intro}</p>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto p-4">
      {/* 上部メッセージ */}
      <div className="mb-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3">
        <p className="text-xs text-amber-700 font-bold">🌟 ミッション発見ウィザード</p>
        <p className="text-xs text-gray-600 mt-1">あなたの心の奥にある「大事なもの」を一緒に見つけましょう。答えは既にあなたの中にあります。</p>
      </div>

      {step === 1 && (
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <Header
            stepNum={1}
            title="今、一番ワクワクしていることは？"
            intro="どんな小さなことでもOKです。仕事でも、趣味でも、誰かと話している時でも。具体的な瞬間を思い浮かべてください。"
          />
          <textarea
            value={data.wakuwaku}
            onChange={(e) => setData({ ...data, wakuwaku: e.target.value })}
            placeholder="例: 新しいアイデアを形にしている時間、誰かに感謝された時、勉強して新しいことを知った瞬間..."
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!data.wakuwaku.trim()}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-5 py-2 rounded-lg shadow-sm disabled:opacity-40"
            >
              次へ →
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <Header
            stepNum={2}
            title="この喜びを最初に感じた瞬間は？"
            intro="子どもの頃の記憶でも、誰かに感謝された瞬間でも、「あ、自分これだ」と確信した出来事でも。原点となる体験を教えてください。"
          />
          <textarea
            value={data.origin}
            onChange={(e) => setData({ ...data, origin: e.target.value })}
            placeholder="例: 誰かが涙を流して感謝してくれた時、自分で作ったものを人が喜んでくれた時、初めて「役に立てた」と感じた場面..."
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div className="flex justify-between mt-3">
            <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-500">
              ← 戻る
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!data.origin.trim()}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-5 py-2 rounded-lg shadow-sm disabled:opacity-40"
            >
              次へ →
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <Header
            stepNum={3}
            title="今、頭に浮かぶのは誰の顔？"
            intro="何かを作る・届けるとき、心の中で浮かぶ人は誰ですか？特定の人でも、過去の自分でも、漠然としたイメージでもOKです。"
          />
          <textarea
            value={data.person}
            onChange={(e) => setData({ ...data, person: e.target.value })}
            placeholder="例: 過去の自分（困っていた頃の自分）、家族の笑顔、同じ悩みを抱える誰か、以前感謝してくれた人..."
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          <div className="flex justify-between mt-3">
            <button type="button" onClick={() => setStep(2)} className="text-sm text-gray-500">
              ← 戻る
            </button>
            <button
              type="button"
              onClick={generateCandidates}
              disabled={!data.person.trim() || loading}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-5 py-2 rounded-lg shadow-sm disabled:opacity-40"
            >
              {loading ? "AIが考えています..." : "ミッション候補を生成 →"}
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="mb-4">
            <span className="text-xs font-bold text-amber-600">STEP 4 / 4</span>
            <div className="h-1 bg-amber-100 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: "100%" }} />
            </div>
          </div>

          <h1 className="text-lg font-bold text-gray-800 mb-1">あなたの5つのミッション候補</h1>
          <p className="text-sm text-gray-600 mb-4">心にしっくり来るものを選んでください。編集も自由です。</p>

          {commonThread && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-bold text-amber-700 mb-1">💡 AIが見つけた共通の糸</p>
              <p className="text-sm text-gray-700">{commonThread}</p>
            </div>
          )}

          <div className="space-y-3">
            {candidates.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setSelectedMission(c.mission); setEditing(false); }}
                className={`w-full text-left bg-white border-2 rounded-xl p-3 transition-all ${
                  selectedMission === c.mission
                    ? "border-amber-400 shadow-md bg-amber-50"
                    : "border-gray-200 hover:border-amber-200"
                }`}
              >
                <p className="text-xs font-bold text-amber-600 mb-1">{c.label}</p>
                <p className="text-sm text-gray-800 leading-relaxed font-medium mb-1">{c.mission}</p>
                <p className="text-xs text-gray-500">{c.why}</p>
              </button>
            ))}
          </div>

          {selectedMission && (
            <div className="mt-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-700 mb-2">✨ 選んだミッション（編集可能）</p>
              {editing ? (
                <textarea
                  value={selectedMission}
                  onChange={(e) => setSelectedMission(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              ) : (
                <p className="text-sm text-gray-800 leading-relaxed font-medium p-2 bg-white rounded-lg border border-amber-200">
                  {selectedMission}
                </p>
              )}
              <div className="flex items-center justify-between mt-3">
                <button type="button" onClick={() => setEditing(!editing)} className="text-xs text-amber-700 underline">
                  {editing ? "編集終了" : "✏️ 編集する"}
                </button>
                <button
                  type="button"
                  onClick={saveMission}
                  disabled={saving || !selectedMission.trim()}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-5 py-2 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {saving ? "保存中..." : "✅ このミッションに決める"}
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-between">
            <button type="button" onClick={() => setStep(3)} className="text-sm text-gray-500">
              ← やり直す
            </button>
            <button type="button" onClick={generateCandidates} disabled={loading} className="text-sm text-amber-600">
              {loading ? "再生成中..." : "🔄 別の候補を見る"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
