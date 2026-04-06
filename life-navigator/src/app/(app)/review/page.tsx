"use client";
import { useEffect, useState } from "react";

export default function ReviewPage() {
  const [doneNote, setDoneNote] = useState("");
  const [gratitudeNote, setGratitudeNote] = useState("");
  const [tomorrowPlan, setTomorrowPlan] = useState("");
  const [reflectionNote, setReflectionNote] = useState("");
  const [tomorrowMits, setTomorrowMits] = useState(["", "", ""]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/daylog").then((r) => r.json()).then((data) => {
      const rawDone = data.done_note || data.doneNote || "";
      // チェック状態のJSON（[true,true,true]等）は表示しない
      setDoneNote(rawDone.startsWith("[") ? "" : rawDone);
      setGratitudeNote(data.gratitude_note || data.gratitudeNote || "");
      setTomorrowPlan(data.tomorrow_plan || data.tomorrowPlan || "");
    });
  }, []);

  const save = async () => {
    // 今日の振り返りを保存
    await fetch("/api/daylog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doneNote, gratitudeNote, tomorrowPlan }),
    });

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

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
