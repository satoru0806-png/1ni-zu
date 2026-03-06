"use client";
import { useEffect, useState } from "react";

export default function ReviewPage() {
  const [doneNote, setDoneNote] = useState("");
  const [gratitudeNote, setGratitudeNote] = useState("");
  const [tomorrowPlan, setTomorrowPlan] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/daylog").then((r) => r.json()).then((data) => {
      setDoneNote(data.doneNote || "");
      setGratitudeNote(data.gratitudeNote || "");
      setTomorrowPlan(data.tomorrowPlan || "");
    });
  }, []);

  const save = async () => {
    await fetch("/api/daylog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doneNote, gratitudeNote, tomorrowPlan }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">夜の振り返り</h2>
        <p className="text-xs text-gray-500 mb-4">今日を振り返り、明日に備えよう</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1 text-green-700">
            できたこと
          </label>
          <textarea
            value={doneNote}
            onChange={(e) => setDoneNote(e.target.value)}
            placeholder="今日達成できたことを書こう..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-amber-600">
            感謝
          </label>
          <textarea
            value={gratitudeNote}
            onChange={(e) => setGratitudeNote(e.target.value)}
            placeholder="今日感謝していることは..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-blue-700">
            明日やること
          </label>
          <textarea
            value={tomorrowPlan}
            onChange={(e) => setTomorrowPlan(e.target.value)}
            placeholder="明日取り組むことを書こう..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
          />
        </div>
      </div>

      <button
        onClick={save}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium"
      >
        {saved ? "保存しました!" : "振り返りを保存"}
      </button>
    </div>
  );
}
