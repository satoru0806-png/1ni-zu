"use client";
import { useState } from "react";
import Link from "next/link";

export default function TrialRequestPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [lineId, setLineId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ message: string; key?: string } | null>(null);

  const submit = async () => {
    setError("");
    setSuccess(null);
    if (!email.trim()) {
      setError("メールアドレスを入力してください");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/trial/request-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, line_id: lineId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "キー発行に失敗しました");
        return;
      }
      setSuccess({
        message: data.message || "キーを送信しました",
        key: data.key,
      });
    } catch (e) {
      setError("通信エラー: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex flex-col">
      <header className="px-4 py-4 bg-white/80 backdrop-blur sticky top-0 border-b border-gray-100">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">夢ナビ</Link>
          <Link href="/login" className="text-sm text-gray-600 underline">既にお持ちの方</Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="max-w-md mx-auto">
          {!success ? (
            <>
              <div className="text-center mb-8">
                <p className="text-sm text-amber-700 font-bold mb-2">21 日間 無料</p>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">夢ナビを<br />試してみませんか</h1>
                <p className="text-sm text-gray-700 leading-relaxed">
                  メールアドレスを送信すると<br />
                  <strong>21 日無料キー</strong>がメールで届きます。<br />
                  クレジットカード不要、強制課金もなし。
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 mb-4">
                  {error}
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">メールアドレス *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">お名前（任意）</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="飯村 悟"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">LINE ID（任意）</label>
                  <input
                    type="text"
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value)}
                    placeholder="LINE で繋がりたい方のみ"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">後ほど飯村悟さんから直接ご連絡することがあります</p>
                </div>
                <button
                  onClick={submit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-xl shadow-md disabled:opacity-50"
                >
                  {loading ? "送信中..." : "21 日無料キーをもらう"}
                </button>
                <p className="text-[10px] text-gray-500 text-center">
                  送信することで <Link href="/legal/terms" className="underline">利用規約</Link> と <Link href="/legal/privacy" className="underline">プライバシーポリシー</Link> に同意したものとみなします
                </p>
              </div>

              <div className="mt-8 bg-white rounded-2xl shadow-sm p-6 space-y-3">
                <h2 className="text-sm font-bold text-amber-700">21 日間で体験できること</h2>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>📝 毎日の MIT で行動を整理</li>
                  <li>📊 4 大悩みのスコア追跡</li>
                  <li>🌟 週次振り返り（AI と対話）</li>
                  <li>🎤 SpeakNote 連携で音声入力</li>
                  <li>💝 21 日続けば習慣化、続けたい時だけ Pro へ</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-md p-8 text-center space-y-4">
              <div className="text-5xl">📩</div>
              <h2 className="text-xl font-bold">送信完了！</h2>
              <p className="text-sm text-gray-700 leading-relaxed">{success.message}</p>
              {success.key && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700 mb-1">キー</p>
                  <p className="font-mono font-bold text-amber-900">{success.key}</p>
                </div>
              )}
              <p className="text-xs text-gray-500">
                メールが届かない場合は迷惑メールフォルダもご確認ください。
              </p>
              <Link
                href="/login?mode=signup"
                className="block bg-amber-500 text-white font-bold py-3 rounded-xl"
              >
                夢ナビにアカウントを作る
              </Link>
            </div>
          )}
        </div>
      </main>

      <footer className="px-4 py-6 text-center text-xs text-gray-500">
        © 2026 ドリームズ
      </footer>
    </div>
  );
}
