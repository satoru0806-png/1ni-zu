"use client";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [dayStartHour, setDayStartHour] = useState(2);
  const [morningHour, setMorningHour] = useState(7);
  const [noonHour, setNoonHour] = useState(12);
  const [nightHour, setNightHour] = useState(21);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("yumenavi_settings");
    if (stored) {
      try {
        const s = JSON.parse(stored);
        setDayStartHour(s.dayStartHour ?? 2);
        setMorningHour(s.morningHour ?? 7);
        setNoonHour(s.noonHour ?? 12);
        setNightHour(s.nightHour ?? 21);
      } catch {}
    }
  }, []);

  const save = () => {
    const settings = { dayStartHour, morningHour, noonHour, nightHour };
    localStorage.setItem("yumenavi_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">⚙️ 設定</h2>

      {/* 一日の始まり */}
      <section className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-blue-600 mb-2">🌙 一日の始まり</h3>
        <p className="text-xs text-gray-500 mb-3">
          何時から新しい一日として扱いますか？<br />
          例：2時に設定すると、午前1時までは前日扱いになります
        </p>
        <select
          value={dayStartHour}
          onChange={(e) => setDayStartHour(parseInt(e.target.value))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          {hours.map((h) => (
            <option key={h} value={h}>
              {h.toString().padStart(2, "0")}:00
            </option>
          ))}
        </select>
      </section>

      {/* 通知時刻 */}
      <section className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-purple-600 mb-3">🔔 通知時刻</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 block mb-1">☀️ 朝の通知</label>
            <select
              value={morningHour}
              onChange={(e) => setMorningHour(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {hours.map((h) => (
                <option key={h} value={h}>{h.toString().padStart(2, "0")}:00</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">🌤 昼の通知</label>
            <select
              value={noonHour}
              onChange={(e) => setNoonHour(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {hours.map((h) => (
                <option key={h} value={h}>{h.toString().padStart(2, "0")}:00</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">🌙 夜の通知</label>
            <select
              value={nightHour}
              onChange={(e) => setNightHour(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {hours.map((h) => (
                <option key={h} value={h}>{h.toString().padStart(2, "0")}:00</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* 保存ボタン */}
      <button
        onClick={save}
        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-sm shadow"
      >
        {saved ? "✅ 保存しました" : "設定を保存"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        設定はこの端末に保存されます
      </p>
    </div>
  );
}
