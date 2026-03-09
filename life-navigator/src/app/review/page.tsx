"use client";
import { useEffect, useState } from "react";
import { VoiceInput } from "@/components/VoiceInput";

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
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-1">今日どうだった？</h2>
        <p className="text-sm opacity-90">話してくれたら聞くよ。マイクボタンで声で入力できるよ。</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1 text-green-700">
            今日できたことは？
          </label>
          <div className="flex gap-2 items-start">
            <textarea
              value={doneNote}
              onChange={(e) => setDoneNote(e.target.value)}
              placeholder="何ができた？"
              rows={3}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
            />
            <VoiceInput context="evening_done" onResult={(t) => setDoneNote((prev) => prev ? prev + " " + t : t)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-amber-600">
            今日感謝していることは？
          </label>
          <div className="flex gap-2 items-start">
            <textarea
              value={gratitudeNote}
              onChange={(e) => setGratitudeNote(e.target.value)}
              placeholder="ありがたかったことは？"
              rows={3}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
            />
            <VoiceInput context="evening_thanks" onResult={(t) => setGratitudeNote((prev) => prev ? prev + " " + t : t)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-blue-700">
            明日何しようか？
          </label>
          <div className="flex gap-2 items-start">
            <textarea
              value={tomorrowPlan}
              onChange={(e) => setTomorrowPlan(e.target.value)}
              placeholder="明日やりたいことは？"
              rows={3}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
            />
            <VoiceInput context="evening_plan" onResult={(t) => setTomorrowPlan((prev) => prev ? prev + " " + t : t)} />
          </div>
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
