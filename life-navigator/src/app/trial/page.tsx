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

              {/* LINE 友だち追加（限定特典訴求） */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3 text-left">
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-2xl">🎁</span>
                  <h3 className="text-base font-bold text-green-900">
                    LINE 限定の 3 つのプレゼント
                  </h3>
                </div>
                <ul className="text-xs text-green-900 space-y-1 leading-relaxed">
                  <li>🎁 今すぐ: 夢ナビ完全活用ガイド（PDF 20p）</li>
                  <li>🎁 1週間後: 人生ミッション発見ワークシート</li>
                  <li>🎁 2週間後: 飯村悟からの音声メッセージ</li>
                </ul>
                <a
                  href="https://line.me/R/ti/p/@267flvxg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#06C755] hover:bg-[#05B14B] text-white font-bold py-3 rounded-xl transition shadow-md"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M19.365 9.89c.50 0 .906.41.906.91s-.406.91-.906.91h-1.273v.84h1.273c.50 0 .906.40.906.90 0 .50-.406.91-.906.91h-2.18c-.50 0-.906-.41-.906-.91V8.92c0-.50.406-.91.906-.91h2.18c.50 0 .906.41.906.91s-.406.91-.906.91h-1.273v.84h1.273zM14.65 13.55c0 .39-.25.74-.63.86-.09.03-.18.04-.27.04-.30 0-.59-.15-.77-.41l-2.23-3.04v2.55c0 .50-.406.91-.906.91-.50 0-.906-.41-.906-.91V8.92c0-.39.25-.73.63-.86.10-.03.20-.04.30-.04.30 0 .59.16.77.41l2.23 3.04V8.92c0-.50.406-.91.906-.91.50 0 .906.41.906.91v4.63zM8.30 13.55c0 .50-.41.91-.91.91-.50 0-.91-.41-.91-.91V8.92c0-.50.41-.91.91-.91.50 0 .91.41.91.91v4.63zM5.36 14.46H3.18c-.50 0-.906-.41-.906-.91V8.92c0-.50.406-.91.906-.91.50 0 .906.41.906.91v3.72h1.27c.50 0 .906.40.906.90s-.406.92-.906.92zM12 0C5.37 0 0 4.41 0 9.86c0 4.88 4.28 8.96 10.06 9.74.39.08.93.26 1.06.59.12.30.08.77.04 1.07l-.16 1.02c-.05.30-.24 1.18 1.04.65 1.27-.54 6.86-4.04 9.36-6.92 1.72-1.89 2.55-3.81 2.55-6.15C24 4.41 18.63 0 12 0z"/>
                  </svg>
                  LINE で受け取る（無料）
                </a>
                <p className="text-[10px] text-green-700 text-center">
                  友だち追加するとガイドブックが届きます
                </p>
              </div>

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
