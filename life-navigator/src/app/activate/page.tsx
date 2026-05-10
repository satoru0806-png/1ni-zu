"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ActivatePage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-gray-400">Loading...</div>}>
      <ActivateContent />
    </Suspense>
  );
}

function ActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [key, setKey] = useState(searchParams.get("key") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ message: string; trialEndDate: string } | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    // 認証状態確認
    fetch("/api/user/plan")
      .then((r) => {
        setIsAuthed(r.ok);
      })
      .catch(() => setIsAuthed(false))
      .finally(() => setAuthChecking(false));
  }, []);

  const activate = async () => {
    if (!key.trim()) {
      setError("キーを入力してください");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/trial/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "アクティベート失敗");
        return;
      }
      setSuccess({ message: data.message, trialEndDate: data.trialEndDate });
      setTimeout(() => router.push("/dashboard"), 3000);
    } catch (e) {
      setError("通信エラー: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (authChecking) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">確認中...</div>;
  }

  if (!isAuthed) {
    const email = searchParams.get("email") || "";
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center space-y-4">
          <div className="text-5xl">🌟</div>
          <h1 className="text-2xl font-bold">夢ナビへようこそ</h1>
          <p className="text-sm text-gray-700 leading-relaxed">
            まずはアカウントを作成してください。<br />
            その後、キーを入力して 21 日無料トライアルを開始できます。
          </p>
          {key && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700 mb-1">あなたのキー（後ほど使います）</p>
              <p className="font-mono font-bold text-amber-900">{key}</p>
            </div>
          )}
          <Link
            href={`/login?mode=signup${email ? `&email=${encodeURIComponent(email)}` : ""}${key ? `&key=${encodeURIComponent(key)}` : ""}`}
            className="block bg-amber-500 text-white font-bold py-3 rounded-xl"
          >
            アカウントを作成する
          </Link>
          <p className="text-xs text-gray-500">
            既にアカウントをお持ちの方は <Link href={`/login${key ? `?key=${encodeURIComponent(key)}` : ""}`} className="underline">ログイン</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full space-y-4">
        {!success ? (
          <>
            <div className="text-center">
              <div className="text-5xl mb-3">🔑</div>
              <h1 className="text-2xl font-bold mb-2">トライアルキー入力</h1>
              <p className="text-sm text-gray-700">
                21 日無料キーを入力すると、<br />
                すぐに夢ナビが使えるようになります
              </p>
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="YUME-XXXX-XXXX-XXXX"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-center font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={activate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-xl shadow-md disabled:opacity-50"
            >
              {loading ? "認証中..." : "トライアルを始める"}
            </button>
            <p className="text-xs text-gray-500 text-center">
              キーをまだお持ちでない方は <Link href="/trial" className="underline text-amber-700">こちら</Link>
            </p>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-bold">トライアル開始！</h2>
            <p className="text-sm text-gray-700">{success.message}</p>
            <p className="text-xs text-gray-500">3 秒後に dashboard に移動します...</p>
          </div>
        )}
      </div>
    </div>
  );
}
