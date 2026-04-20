"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Goal = {
  id: string;
  title: string;
  deadline: string | null;
  progress: number;
  mission_connection: string | null;
  icon: string;
  archived: boolean;
  created_at: string;
  completed_at: string | null;
};

type GoalForm = {
  title: string;
  deadline: string;
  mission_connection: string;
  icon: string;
};

const ICONS = ["🎯", "🚀", "📚", "💪", "💰", "❤️", "🌱", "🏆"];

function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  const d = new Date(deadline + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function deadlineLabel(deadline: string | null): { text: string; color: string } {
  const days = daysUntil(deadline);
  if (days === null) return { text: "期限なし", color: "text-gray-400" };
  if (days < 0) return { text: `${-days}日超過`, color: "text-red-500" };
  if (days === 0) return { text: "今日まで", color: "text-orange-500" };
  if (days <= 7) return { text: `残 ${days}日`, color: "text-orange-500" };
  if (days <= 30) return { text: `残 ${days}日`, color: "text-amber-600" };
  return { text: `残 ${days}日`, color: "text-gray-600" };
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState<GoalForm>({ title: "", deadline: "", mission_connection: "", icon: "🎯" });
  const [showArchived, setShowArchived] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/goals${showArchived ? "?archived=1" : ""}`);
      const data = await res.json();
      setGoals(data.goals || []);
    } catch {
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", deadline: "", mission_connection: "", icon: "🎯" });
    setError("");
    setShowForm(true);
  };

  const openEdit = (g: Goal) => {
    setEditing(g);
    setForm({
      title: g.title,
      deadline: g.deadline || "",
      mission_connection: g.mission_connection || "",
      icon: g.icon || "🎯",
    });
    setError("");
    setShowForm(true);
  };

  const close = () => {
    setShowForm(false);
    setEditing(null);
    setError("");
  };

  const save = async () => {
    if (!form.title.trim()) {
      setError("タイトルは必須です");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = editing ? `/api/goals/${editing.id}` : "/api/goals";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          deadline: form.deadline || null,
          mission_connection: form.mission_connection.trim() || null,
          icon: form.icon,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "保存失敗");
        return;
      }
      close();
      loadGoals();
    } catch (e) {
      setError("通信エラー: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const updateProgress = async (goal: Goal, progress: number) => {
    const prev = goals;
    setGoals(goals.map((g) => (g.id === goal.id ? { ...g, progress } : g)));
    try {
      await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress }),
      });
    } catch {
      setGoals(prev);
    }
  };

  const archive = async (goal: Goal, archivedFlag: boolean) => {
    if (archivedFlag && !confirm(`「${goal.title}」を達成済みにしますか？\n（一覧から消えます。完了リストからいつでも復元できます）`)) return;
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: archivedFlag }),
      });
      if (res.ok) loadGoals();
    } catch {}
  };

  const remove = async (goal: Goal) => {
    if (!confirm(`「${goal.title}」を削除しますか？（復元できません）`)) return;
    try {
      const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      if (res.ok) loadGoals();
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">🎯 ゴール</h2>
        <button
          type="button"
          onClick={openNew}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm"
        >
          + 新しいゴール
        </button>
      </div>

      {/* 説明 */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3">
        <p className="text-xs text-gray-700 leading-relaxed">
          ミッションと毎日のMITを繋ぐ「中間目標」です。<br />
          <strong>具体的・期限付き・3〜5個まで</strong>（神田昌典メソッド）。達成したい未来を書きましょう。
        </p>
      </div>

      {/* タブ */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowArchived(false)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${!showArchived ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          アクティブ
        </button>
        <button
          type="button"
          onClick={() => setShowArchived(true)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${showArchived ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          達成済み
        </button>
      </div>

      {/* 一覧 */}
      {loading ? (
        <p className="text-center text-sm text-gray-400 py-6">読み込み中...</p>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <p className="text-sm text-gray-400 mb-4">
            {showArchived ? "達成済みのゴールはまだありません" : "ゴールがまだ設定されていません"}
          </p>
          {!showArchived && (
            <button
              type="button"
              onClick={openNew}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold px-5 py-2 rounded-lg"
            >
              最初のゴールを設定する
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((g) => {
            const dl = deadlineLabel(g.deadline);
            const archived = g.archived;
            return (
              <div
                key={g.id}
                className={`bg-white rounded-xl p-4 shadow-sm border ${archived ? "border-green-200 bg-green-50" : "border-amber-200"}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{g.icon || "🎯"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-800 leading-snug">{g.title}</h3>
                      {!archived && <span className={`text-xs font-bold ${dl.color} whitespace-nowrap`}>{dl.text}</span>}
                      {archived && <span className="text-xs font-bold text-green-600 whitespace-nowrap">✅ 達成</span>}
                    </div>

                    {g.mission_connection && (
                      <p className="text-xs text-amber-700 mb-2 leading-relaxed">💡 {g.mission_connection}</p>
                    )}

                    {!archived && (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 bg-amber-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                              style={{ width: `${g.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-amber-700 w-10 text-right">{g.progress}%</span>
                        </div>
                        <div className="flex gap-1 mb-2">
                          {[0, 25, 50, 75, 100].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => updateProgress(g, p)}
                              className={`flex-1 text-xs py-1 rounded ${g.progress >= p ? "bg-amber-100 text-amber-800" : "bg-gray-50 text-gray-400"}`}
                            >
                              {p}%
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="flex gap-3 text-xs mt-2">
                      {!archived && (
                        <>
                          <button type="button" onClick={() => openEdit(g)} className="text-amber-700 underline">
                            編集
                          </button>
                          <button type="button" onClick={() => archive(g, true)} className="text-green-600 underline">
                            達成✓
                          </button>
                        </>
                      )}
                      {archived && (
                        <button type="button" onClick={() => archive(g, false)} className="text-amber-700 underline">
                          復元
                        </button>
                      )}
                      <button type="button" onClick={() => remove(g)} className="text-red-500 underline ml-auto">
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ミッション確認リンク */}
      <Link
        href="/settings"
        className="block text-center text-xs text-gray-500 underline py-2"
      >
        🌟 ミッションを確認・変更する
      </Link>

      {/* 作成/編集モーダル */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={close}>
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editing ? "ゴールを編集" : "新しいゴール"}</h3>

            {/* アイコン選択 */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">アイコン</label>
              <div className="flex gap-2 flex-wrap">
                {ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setForm({ ...form, icon: ic })}
                    className={`text-2xl w-10 h-10 rounded-lg ${form.icon === ic ? "bg-amber-100 ring-2 ring-amber-400" : "bg-gray-50"}`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* タイトル */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">タイトル *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="例: 夢ナビ Pro を100人に届ける"
                maxLength={200}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* 期限 */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">期限</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* ミッションとの繋がり */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">ミッションとの繋がり（なぜ達成したいか）</label>
              <textarea
                value={form.mission_connection}
                onChange={(e) => setForm({ ...form, mission_connection: e.target.value })}
                placeholder="ミッションにどう貢献するか1-2文で"
                rows={3}
                maxLength={300}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <div className="flex gap-2">
              <button type="button" onClick={close} className="flex-1 py-2 rounded-lg text-sm bg-gray-100 text-gray-700">
                キャンセル
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex-1 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
