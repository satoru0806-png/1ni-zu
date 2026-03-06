"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Dream = { id: number; text: string };

export default function OnboardingPage() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [input, setInput] = useState("");
  const router = useRouter();

  const fetchDreams = () =>
    fetch("/api/dreams").then((r) => r.json()).then(setDreams);

  useEffect(() => { fetchDreams(); }, []);

  const add = async () => {
    if (!input.trim() || dreams.length >= 3) return;
    await fetch("/api/dreams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input.trim() }),
    });
    setInput("");
    fetchDreams();
  };

  const remove = async (id: number) => {
    await fetch(`/api/dreams?id=${id}`, { method: "DELETE" });
    fetchDreams();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">あなたの夢を教えてください</h2>
        <p className="text-sm text-gray-500">最大3つまで登録できます</p>
      </div>

      <div className="space-y-3">
        {dreams.map((d, i) => (
          <div key={d.id} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {i + 1}
            </span>
            <span className="flex-1 font-medium">{d.text}</span>
            <button
              onClick={() => remove(d.id)}
              className="text-red-400 hover:text-red-600 text-xs"
            >
              x
            </button>
          </div>
        ))}

        {dreams.length < 3 && (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder={`夢 ${dreams.length + 1} を入力...`}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
            />
            <button
              onClick={add}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium"
            >
              追加
            </button>
          </div>
        )}
      </div>

      {dreams.length > 0 && (
        <button
          onClick={() => router.push("/today")}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-medium"
        >
          今日を始める
        </button>
      )}
    </div>
  );
}
