import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  // ログイン済みなら dashboard へ
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  // 未ログインユーザーには LP を表示
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-blue-50">
      {/* ヘッダー */}
      <header className="px-4 py-4 border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">夢ナビ</h1>
          <Link
            href="/login"
            className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            ログイン
          </Link>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="px-4 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-semibold text-amber-700 mb-3">
            音声で人生を整える
          </p>
          <h2 className="text-3xl sm:text-5xl font-bold leading-tight mb-6">
            思考を吐き出して、
            <br className="sm:hidden" />
            人生を整える。
          </h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            毎日の小さなモヤモヤから、人生の大きなミッションまで。
            <br />
            話すだけで AI が整え、夢ナビがあなたの人生を伴走します。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login?mode=signup"
              className="px-8 py-3 rounded-xl bg-amber-500 text-white font-semibold shadow-lg hover:bg-amber-600 transition"
            >
              無料ではじめる
            </Link>
            <Link
              href="#pricing"
              className="px-8 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition"
            >
              料金を見る
            </Link>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            メールアドレス 1 つで 30 秒登録 / クレジットカード不要
          </p>
        </div>
      </section>

      {/* 4 大悩みセクション */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            あなたの「4 つの悩み」を整える
          </h3>
          <div className="grid sm:grid-cols-2 gap-6">
            <Card
              emoji="💼"
              title="仕事"
              text="「何から手をつければいいか」を毎朝 3 つに整理。今日の MIT (最重要事項) で迷いをゼロに。"
            />
            <Card
              emoji="💰"
              title="お金"
              text="価値ある時間にお金を使えているか。日々のスコアで「使い方の癖」を見える化。"
            />
            <Card
              emoji="❤️"
              title="人間関係"
              text="感謝の記録、伝えそびれた言葉。寝る前 3 分の振り返りが、明日の関係を変える。"
            />
            <Card
              emoji="🌿"
              title="健康"
              text="心と体の状態を毎日スコア化。蓄積されたパターンから、自分の整い方が見えてくる。"
            />
          </div>
        </div>
      </section>

      {/* SpeakNote 同梱訴求 */}
      <section className="px-4 py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
              Pro プラン同梱
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              音声入力ツール「SpeakNote」も使える
            </h3>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Pro プランでは、PC・スマホで使える音声入力ツール
              <strong>SpeakNote</strong>
              が追加料金なしでご利用いただけます。
              話すだけで AI が整えた美しい文章が、あらゆるアプリに自動で貼り付けられます。
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Mini emoji="🖥️" title="Windows / Mac" text="右 Alt キー長押しで瞬時に音声入力" />
            <Mini emoji="📱" title="Android IME" text="標準キーボードとして利用可能" />
            <Mini emoji="🌐" title="Web 版" text="どの端末からでもブラウザで使える" />
          </div>
        </div>
      </section>

      {/* 価格 */}
      <section id="pricing" className="px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-2">
            シンプルな料金体系
          </h3>
          <p className="text-center text-gray-600 mb-12">
            まずは無料、必要になったら Pro へ
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Free */}
            <div className="border border-gray-200 rounded-2xl p-8 bg-white">
              <h4 className="text-xl font-bold mb-2">Free</h4>
              <p className="text-3xl font-bold mb-4">¥0</p>
              <ul className="text-sm text-gray-700 space-y-2 mb-6">
                <li>✓ 4 大悩みの記録機能</li>
                <li>✓ ミッション・ゴール</li>
                <li>✓ 夜の振り返り</li>
                <li>✓ AI 整形 30 回 / 月</li>
              </ul>
              <Link
                href="/login?mode=signup"
                className="block text-center px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition"
              >
                無料ではじめる
              </Link>
            </div>
            {/* Pro */}
            <div className="border-2 border-amber-400 rounded-2xl p-8 bg-white shadow-lg relative">
              <span className="absolute -top-3 right-4 bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                人気
              </span>
              <h4 className="text-xl font-bold mb-2">Pro</h4>
              <p className="text-3xl font-bold mb-1">
                ¥980<span className="text-base font-normal text-gray-600">/月</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                年額 ¥9,800（2 ヶ月分お得）
              </p>
              <ul className="text-sm text-gray-700 space-y-2 mb-6">
                <li>✓ Free のすべて</li>
                <li>✓ AI 整形 無制限</li>
                <li>✓ <strong>SpeakNote 同梱</strong>（PC / スマホ / Web）</li>
                <li>✓ 音声日記 自動振り分け</li>
                <li>✓ 全デバイス同期</li>
              </ul>
              <Link
                href="/login?mode=signup"
                className="block text-center px-6 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition"
              >
                Pro ではじめる
              </Link>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-6">
            いつでもキャンセル可能 / 自動更新
          </p>
        </div>
      </section>

      {/* 最終 CTA */}
      <section className="px-4 py-16 bg-amber-50">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">
            今日から、人生を整えよう
          </h3>
          <p className="text-gray-700 mb-8">
            登録は 30 秒。クレジットカードも不要です。
          </p>
          <Link
            href="/login?mode=signup"
            className="inline-block px-10 py-4 rounded-xl bg-amber-500 text-white font-semibold shadow-lg hover:bg-amber-600 transition"
          >
            無料で夢ナビをはじめる
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="px-4 py-10 border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm text-gray-600 mb-4">
            <Link href="/legal/tokusho" className="hover:underline">
              特定商取引法に基づく表記
            </Link>
            <Link href="/legal/privacy" className="hover:underline">
              プライバシーポリシー
            </Link>
            <Link href="/legal/terms" className="hover:underline">
              利用規約
            </Link>
          </div>
          <p className="text-center text-xs text-gray-500">
            © 2026 ドリームズ
          </p>
        </div>
      </footer>
    </div>
  );
}

function Card({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="p-6 rounded-2xl border border-gray-200 bg-white hover:shadow-md transition">
      <div className="text-4xl mb-3">{emoji}</div>
      <h4 className="text-lg font-bold mb-2">{title}</h4>
      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}

function Mini({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="p-5 rounded-xl bg-white text-center">
      <div className="text-3xl mb-2">{emoji}</div>
      <h5 className="font-bold mb-1">{title}</h5>
      <p className="text-xs text-gray-600">{text}</p>
    </div>
  );
}
