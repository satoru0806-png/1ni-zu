"use client";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [dayStartHour, setDayStartHour] = useState(2);
  const [morningHour, setMorningHour] = useState(7);
  const [noonHour, setNoonHour] = useState(12);
  const [nightHour, setNightHour] = useState(21);
  const [saved, setSaved] = useState(false);
  const [mission, setMission] = useState("");
  const [missionSaved, setMissionSaved] = useState(false);
  const [missionSaving, setMissionSaving] = useState(false);

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
    // ミッションをサーバから取得
    fetch("/api/user/mission")
      .then((r) => r.json())
      .then((d) => { if (typeof d.mission === "string") setMission(d.mission); })
      .catch(() => {});
  }, []);

  const save = () => {
    const settings = { dayStartHour, morningHour, noonHour, nightHour };
    localStorage.setItem("yumenavi_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveMission = async () => {
    setMissionSaving(true);
    try {
      const res = await fetch("/api/user/mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission }),
      });
      if (res.ok) {
        setMissionSaved(true);
        setTimeout(() => setMissionSaved(false), 2000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert("保存失敗: " + (err.error || "不明なエラー"));
      }
    } catch (e) {
      alert("通信エラー: " + (e as Error).message);
    } finally {
      setMissionSaving(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">⚙️ 設定</h2>

      {/* 人生ミッション */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 shadow-sm border border-amber-200">
        <h3 className="text-sm font-bold text-amber-700 mb-2">🌟 人生ミッション</h3>
        <p className="text-xs text-gray-600 mb-3">
          あなたの人生の軸となる言葉。毎日のMITと照らし合わせる基準になります。<br />
          例: 「自分の悩みを、誰かの『ありがとう』に変える道具を、一生作り続ける。」
        </p>
        <textarea
          value={mission}
          onChange={(e) => setMission(e.target.value)}
          placeholder="自分のミッションを一文で..."
          maxLength={500}
          rows={3}
          className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">{mission.length}/500</span>
          <button
            type="button"
            onClick={saveMission}
            disabled={missionSaving}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm disabled:opacity-50"
          >
            {missionSaving ? "保存中..." : missionSaved ? "✅ 保存しました" : "ミッションを保存"}
          </button>
        </div>
      </section>

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
