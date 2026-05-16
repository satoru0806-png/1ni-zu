"use client";
import { useEffect, useState, useRef } from "react";

type Scene = {
  image_url: string;
  text: string;
  duration_sec: number;
};

type Movie = {
  id: string;
  title: string;
  theme: string | null;
  scenes: Scene[];
  bgm_id: string;
  voiceover_text: string | null;
  ai_images_used_this_month: number;
};

const BGM_OPTIONS = [
  { id: "calm", label: "🌊 落ち着き（Calm）", url: "" }, // Phase 1: Web Audio API でアンビエント生成 or なし
  { id: "energetic", label: "⚡ 活力（Energetic）", url: "" },
  { id: "spiritual", label: "✨ スピリチュアル", url: "" },
  { id: "none", label: "🔇 BGM なし", url: "" },
];

const AI_LIMIT = 5;

export default function MovieEditorPage() {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState("");

  // Editor state
  const [title, setTitle] = useState("My Mind Movie");
  const [theme, setTheme] = useState("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [bgmId, setBgmId] = useState("calm");
  const [voiceover, setVoiceover] = useState("");

  // AI image generation
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiUsed, setAiUsed] = useState(0);

  // Player mode
  const [playing, setPlaying] = useState(false);
  const [currentScene, setCurrentScene] = useState(0);
  const playerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/mindmovie")
      .then((r) => r.json())
      .then((d) => {
        if (d.movie) {
          setMovie(d.movie);
          setTitle(d.movie.title || "My Mind Movie");
          setTheme(d.movie.theme || "");
          setScenes(d.movie.scenes || []);
          setBgmId(d.movie.bgm_id || "calm");
          setVoiceover(d.movie.voiceover_text || "");
          setAiUsed(d.movie.ai_images_used_this_month || 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/mindmovie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, theme, scenes, bgm_id: bgmId, voiceover_text: voiceover }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "保存失敗");
        return;
      }
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (e) {
      setError("通信エラー: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const generateAiImage = async () => {
    if (!aiPrompt.trim()) {
      setError("プロンプトを入力してください");
      return;
    }
    if (scenes.length >= 10) {
      setError("シーンは 10 個まで");
      return;
    }
    setAiGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/mindmovie/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "生成失敗");
        return;
      }
      setScenes([...scenes, { image_url: d.imageUrl, text: aiPrompt, duration_sec: 5 }]);
      setAiUsed(d.used);
      setAiPrompt("");
    } catch (e) {
      setError("通信エラー: " + (e as Error).message);
    } finally {
      setAiGenerating(false);
    }
  };

  const uploadImage = async (file: File) => {
    if (scenes.length >= 10) {
      setError("シーンは 10 個まで");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/mindmovie/upload-image", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "アップロード失敗");
        return;
      }
      setScenes([...scenes, { image_url: d.imageUrl, text: "", duration_sec: 5 }]);
    } catch (e) {
      setError("通信エラー: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const updateSceneText = (i: number, text: string) => {
    const next = [...scenes];
    next[i] = { ...next[i], text };
    setScenes(next);
  };

  const deleteScene = (i: number) => {
    setScenes(scenes.filter((_, idx) => idx !== i));
  };

  const moveScene = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= scenes.length) return;
    const next = [...scenes];
    [next[i], next[target]] = [next[target], next[i]];
    setScenes(next);
  };

  // Player
  const startPlay = () => {
    if (scenes.length === 0) return;
    setCurrentScene(0);
    setPlaying(true);
  };

  useEffect(() => {
    if (!playing) return;
    if (currentScene >= scenes.length) {
      setPlaying(false);
      return;
    }
    const dur = (scenes[currentScene]?.duration_sec ?? 5) * 1000;
    playerTimer.current = setTimeout(() => {
      setCurrentScene((c) => c + 1);
    }, dur);
    return () => {
      if (playerTimer.current) clearTimeout(playerTimer.current);
    };
  }, [playing, currentScene, scenes]);

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>;
  }

  // === Player View ===
  if (playing && scenes.length > 0) {
    const scene = scenes[Math.min(currentScene, scenes.length - 1)];
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
        {scene?.image_url && (
          <img
            src={scene.image_url}
            alt=""
            className="max-w-full max-h-full object-contain animate-fade-in"
            style={{ animation: "fadeIn 1s ease-in-out" }}
          />
        )}
        {scene?.text && (
          <div className="absolute bottom-20 left-0 right-0 px-8 text-center">
            <p className="text-white text-2xl font-bold drop-shadow-lg" style={{ animation: "fadeIn 1.5s ease-in-out" }}>{scene.text}</p>
          </div>
        )}
        <button
          onClick={() => setPlaying(false)}
          className="absolute top-4 right-4 bg-white/20 text-white px-4 py-2 rounded-full text-sm backdrop-blur"
        >
          ✕ 閉じる
        </button>
        <div className="absolute top-4 left-4 bg-white/20 text-white px-3 py-1 rounded-full text-xs backdrop-blur">
          {currentScene + 1} / {scenes.length}
        </div>
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(1.05); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  // === Editor View ===
  return (
    <div className="space-y-4 pb-8">
      <header className="bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 border border-purple-200 rounded-2xl p-4">
        <h1 className="text-lg font-bold text-purple-900">🎬 マインドムービー</h1>
        <p className="text-xs text-purple-700 mt-1">理想の未来を画像と言葉で映像化、毎日見て潜在意識に届けます</p>
      </header>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}

      {/* タイトル・テーマ */}
      <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-bold text-purple-700">タイトル・テーマ</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ムービーのタイトル"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          maxLength={100}
        />
        <textarea
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="このムービーで描きたい未来は何ですか?"
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
          maxLength={500}
        />
      </section>

      {/* シーン一覧 */}
      <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-bold text-purple-700">シーン ({scenes.length}/10)</h2>
        {scenes.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-4">画像を AI 生成 or アップロードして追加してください</p>
        )}
        {scenes.map((scene, i) => (
          <div key={i} className="flex gap-2 border border-gray-200 rounded-lg p-2">
            {scene.image_url ? (
              <img src={scene.image_url} alt="" className="w-20 h-20 object-cover rounded" />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">画像なし</div>
            )}
            <div className="flex-1 space-y-1">
              <input
                value={scene.text}
                onChange={(e) => updateSceneText(i, e.target.value)}
                placeholder="このシーンのキャッチコピー"
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                maxLength={200}
              />
              <div className="flex items-center gap-1 text-xs">
                <button onClick={() => moveScene(i, -1)} disabled={i === 0} className="px-1 disabled:opacity-30">↑</button>
                <button onClick={() => moveScene(i, 1)} disabled={i === scenes.length - 1} className="px-1 disabled:opacity-30">↓</button>
                <button onClick={() => deleteScene(i)} className="ml-auto text-red-500 px-2">削除</button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 画像追加: AI 生成 */}
      <section className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 space-y-3 border border-purple-200">
        <h2 className="text-sm font-bold text-purple-700">🎨 AI 画像を生成（残り {Math.max(0, AI_LIMIT - aiUsed)}/{AI_LIMIT} 枚）</h2>
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="どんな画像を描きたいか、自由に書いてください。例: 朝日が差し込む山の頂上で深呼吸する自分"
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none bg-white"
          maxLength={500}
          disabled={aiUsed >= AI_LIMIT}
        />
        <button
          onClick={generateAiImage}
          disabled={aiGenerating || !aiPrompt.trim() || aiUsed >= AI_LIMIT || scenes.length >= 10}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-50"
        >
          {aiGenerating ? "🎨 生成中（30秒ほど）..." : "AI で画像生成"}
        </button>
      </section>

      {/* 画像追加: アップロード */}
      <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-bold text-purple-700">📷 自分の画像をアップロード</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadImage(f);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || scenes.length >= 10}
          className="w-full bg-blue-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-50"
        >
          {uploading ? "アップロード中..." : "画像を選ぶ"}
        </button>
        <p className="text-[10px] text-gray-500 text-center">最大 5MB、JPG/PNG/GIF</p>
      </section>

      {/* BGM */}
      <section className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
        <h2 className="text-sm font-bold text-purple-700">🎵 BGM</h2>
        <select
          value={bgmId}
          onChange={(e) => setBgmId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          {BGM_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
        <p className="text-[10px] text-gray-500">※ BGM 機能は Phase 2 で完全実装予定（現状は無音再生）</p>
      </section>

      {/* 保存 + 再生 */}
      <div className="flex gap-2 sticky bottom-16">
        <button
          onClick={save}
          disabled={saving}
          className={`flex-1 py-3 rounded-xl font-bold ${savedFlash ? "bg-green-500 text-white" : "bg-purple-500 text-white"} disabled:opacity-50`}
        >
          {savedFlash ? "✓ 保存しました" : saving ? "保存中..." : "保存"}
        </button>
        <button
          onClick={startPlay}
          disabled={scenes.length === 0}
          className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white disabled:opacity-50"
        >
          ▶ 再生
        </button>
      </div>
    </div>
  );
}
