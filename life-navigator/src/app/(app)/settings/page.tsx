"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [dayStartHour, setDayStartHour] = useState(2);
  const [morningHour, setMorningHour] = useState(7);
  const [noonHour, setNoonHour] = useState(12);
  const [nightHour, setNightHour] = useState(21);
  const [saved, setSaved] = useState(false);
  const [mission, setMission] = useState("");
  const [missionSaved, setMissionSaved] = useState(false);
  const [missionSaving, setMissionSaving] = useState(false);

  // お名前（AI が呼びかける名前）
  const [displayName, setDisplayName] = useState("");
  const [nameSaved, setNameSaved] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);

  // 振り返り設定
  const [weekStartDay, setWeekStartDay] = useState(1); // 0=日, 1=月
  const [weeklyReviewDay, setWeeklyReviewDay] = useState(0); // 0=日曜
  const [weeklyReviewHour, setWeeklyReviewHour] = useState(21);
  const [weeklyReviewRemind, setWeeklyReviewRemind] = useState(false);
  const [monthlyReviewRemind, setMonthlyReviewRemind] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);

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
    // 振り返り設定をサーバから取得
    fetch("/api/user/review-settings")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.displayName === "string") setDisplayName(d.displayName);
        if (typeof d.weekStartDay === "number") setWeekStartDay(d.weekStartDay);
        if (typeof d.weeklyReviewDay === "number") setWeeklyReviewDay(d.weeklyReviewDay);
        if (typeof d.weeklyReviewHour === "number") setWeeklyReviewHour(d.weeklyReviewHour);
        if (typeof d.weeklyReviewRemind === "boolean") setWeeklyReviewRemind(d.weeklyReviewRemind);
        if (typeof d.monthlyReviewRemind === "boolean") setMonthlyReviewRemind(d.monthlyReviewRemind);
      })
      .catch(() => {});
  }, []);

  const saveName = async () => {
    setNameSaving(true);
    try {
      const res = await fetch("/api/user/review-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      if (res.ok) {
        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 2000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert("保存失敗: " + (err.error || "不明なエラー"));
      }
    } catch (e) {
      alert("通信エラー: " + (e as Error).message);
    } finally {
      setNameSaving(false);
    }
  };

  const saveReviewSettings = async () => {
    setReviewSaving(true);
    try {
      const res = await fetch("/api/user/review-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStartDay, weeklyReviewDay, weeklyReviewHour, weeklyReviewRemind, monthlyReviewRemind }),
      });
      if (res.ok) {
        setReviewSaved(true);
        setTimeout(() => setReviewSaved(false), 2000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert("保存失敗: " + (err.error || "不明なエラー"));
      }
    } catch (e) {
      alert("通信エラー: " + (e as Error).message);
    } finally {
      setReviewSaving(false);
    }
  };

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
          決まっていない場合は、ウィザードがAIと一緒に言語化します。
        </p>

        {/* ウィザード誘導 */}
        <Link
          href="/mission/create"
          className="block text-center bg-white border-2 border-dashed border-amber-400 text-amber-700 text-xs font-bold px-3 py-2 rounded-lg mb-3 hover:bg-amber-50 transition-colors"
        >
          ✨ ミッション発見ウィザード（AIと対話して見つける）
        </Link>

        <textarea
          value={mission}
          onChange={(e) => setMission(e.target.value)}
          placeholder="直接入力する場合はここに一文で..."
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

      {/* お名前 */}
      <section className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-pink-600 mb-2">👤 お名前</h3>
        <p className="text-xs text-gray-500 mb-3">
          振り返りのときに AI があなたを呼ぶ名前です。<br />
          ニックネームでも構いません（例: 悟、さとるさん など）。
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="お名前 / ニックネーム"
            maxLength={40}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <button
            type="button"
            onClick={saveName}
            disabled={nameSaving}
            className="bg-pink-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm disabled:opacity-50 whitespace-nowrap"
          >
            {nameSaving ? "保存中..." : nameSaved ? "✅ 保存" : "名前を保存"}
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

      {/* 振り返り設定 */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 shadow-sm border border-amber-200">
        <h3 className="text-sm font-bold text-amber-700 mb-3">🌟 振り返り設定</h3>

        {/* 週の開始曜日 */}
        <div className="mb-4">
          <label className="text-xs text-gray-700 block mb-1 font-medium">週の開始曜日</label>
          <p className="text-xs text-gray-500 mb-2">月始まり / 日始まりなど好みで</p>
          <select
            value={weekStartDay}
            onChange={(e) => setWeekStartDay(parseInt(e.target.value))}
            className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value={0}>日曜始まり</option>
            <option value={1}>月曜始まり</option>
            <option value={2}>火曜始まり</option>
            <option value={3}>水曜始まり</option>
            <option value={4}>木曜始まり</option>
            <option value={5}>金曜始まり</option>
            <option value={6}>土曜始まり</option>
          </select>
        </div>

        {/* 週次振り返りリマインド */}
        <div className="mb-4 bg-white rounded-lg p-3 border border-amber-100">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-700">週次振り返りのリマインド</label>
            <input
              type="checkbox"
              checked={weeklyReviewRemind}
              onChange={(e) => setWeeklyReviewRemind(e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
          </div>
          {weeklyReviewRemind && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">曜日</label>
                <select
                  value={weeklyReviewDay}
                  onChange={(e) => setWeeklyReviewDay(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white"
                >
                  <option value={0}>日曜</option>
                  <option value={1}>月曜</option>
                  <option value={2}>火曜</option>
                  <option value={3}>水曜</option>
                  <option value={4}>木曜</option>
                  <option value={5}>金曜</option>
                  <option value={6}>土曜</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">時刻</label>
                <select
                  value={weeklyReviewHour}
                  onChange={(e) => setWeeklyReviewHour(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white"
                >
                  <option value={7}>7:00（朝）</option>
                  <option value={12}>12:00（昼）</option>
                  <option value={18}>18:00（夕方）</option>
                  <option value={21}>21:00（夜）</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 月次振り返りリマインド */}
        <div className="mb-4 bg-white rounded-lg p-3 border border-amber-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700">月次振り返りのリマインド（毎月 1 日 朝 9 時）</label>
            <input
              type="checkbox"
              checked={monthlyReviewRemind}
              onChange={(e) => setMonthlyReviewRemind(e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
          </div>
        </div>

        <button
          onClick={saveReviewSettings}
          disabled={reviewSaving}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold py-2 rounded-lg shadow-sm disabled:opacity-50"
        >
          {reviewSaving ? "保存中..." : reviewSaved ? "✅ 保存しました" : "振り返り設定を保存"}
        </button>
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
