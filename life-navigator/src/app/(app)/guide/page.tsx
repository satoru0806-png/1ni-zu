"use client";
import Link from "next/link";

export default function GuidePage() {
  return (
    <div className="space-y-6 pb-8">
      {/* ヒーロー */}
      <header className="bg-gradient-to-br from-amber-100 via-orange-50 to-pink-50 border border-amber-200 rounded-2xl p-6 text-center">
        <p className="text-sm text-amber-700 font-bold mb-2">夢ナビの使い方</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">人生を 4 つの階層で整える</h1>
        <p className="text-sm text-gray-700 leading-relaxed">
          ぼんやりした夢を、確実な行動に変える方法。
          <br />
          毎日の小さな一歩が、生涯の理想に繋がります。
        </p>
      </header>

      {/* 4 階層の図 */}
      <section className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-lg font-bold mb-4">🗺 4 つの階層</h2>
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 border-l-4 border-amber-500 rounded-lg p-3">
            <div className="text-2xl mb-1">🌟</div>
            <p className="font-bold text-amber-900">ミッション</p>
            <p className="text-xs text-gray-600">何のために生きるか（軸）</p>
          </div>
          <div className="text-center text-2xl text-gray-300">↓</div>
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-l-4 border-purple-500 rounded-lg p-3">
            <div className="text-2xl mb-1">✨</div>
            <p className="font-bold text-purple-900">夢</p>
            <p className="text-xs text-gray-600">人生で実現したい絵姿（10年〜生涯）</p>
          </div>
          <div className="text-center text-2xl text-gray-300">↓</div>
          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-l-4 border-blue-500 rounded-lg p-3">
            <div className="text-2xl mb-1">🎯</div>
            <p className="font-bold text-blue-900">ゴール</p>
            <p className="text-xs text-gray-600">夢に近づく中間目標（3ヶ月〜1年）</p>
          </div>
          <div className="text-center text-2xl text-gray-300">↓</div>
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-l-4 border-green-500 rounded-lg p-3">
            <div className="text-2xl mb-1">📝</div>
            <p className="font-bold text-green-900">MIT</p>
            <p className="text-xs text-gray-600">今日の最重要 3 つ（24 時間）</p>
          </div>
        </div>
      </section>

      {/* 詳細: ミッション */}
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
        <h2 className="text-lg font-bold text-amber-900">🌟 ミッション</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          あなたが <strong>何のために生きるか</strong>。価値観の表明であり、人生の北極星です。
          抽象的でも、感情が乗っていればそれで十分。
        </p>
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">例</p>
          <p className="text-sm">「自分の悩みを、誰かの『ありがとう』に変える道具を、一生作り続ける」</p>
        </div>
        <Link href="/onboarding" className="block bg-amber-500 text-white font-bold py-2 rounded-xl text-sm text-center">
          ミッションを設定する →
        </Link>
      </section>

      {/* 詳細: 夢 */}
      <section className="bg-purple-50 border border-purple-200 rounded-2xl p-5 space-y-3">
        <h2 className="text-lg font-bold text-purple-900">✨ 夢</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          人生で実現したい <strong>大きな絵姿</strong>。期限はなくても、想像してワクワクできるなら何でも OK。
        </p>
        <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
          <p className="text-xs text-gray-500">例</p>
          <p>・家族みんなで世界一周したい</p>
          <p>・自分のサービスで 1 万人を救いたい</p>
          <p>・田舎で家庭菜園しながら穏やかに暮らしたい</p>
        </div>
        <Link href="/onboarding" className="block bg-purple-500 text-white font-bold py-2 rounded-xl text-sm text-center">
          夢を書き留める →
        </Link>
      </section>

      {/* 詳細: ゴール */}
      <section className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
        <h2 className="text-lg font-bold text-blue-900">🎯 ゴール</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          夢に近づくための <strong>中間目標</strong>。3 ヶ月〜1 年で達成可能、期限と数字で明確に。
        </p>
        <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
          <p className="text-xs text-gray-500">例</p>
          <p>・今年中に夢ナビを 100 人に届ける</p>
          <p>・6 ヶ月で月収 30 万円</p>
          <p>・12 月までに本を 1 冊出版</p>
        </div>
        <Link href="/goals" className="block bg-blue-500 text-white font-bold py-2 rounded-xl text-sm text-center">
          ゴールを設定する →
        </Link>
      </section>

      {/* 詳細: MIT */}
      <section className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
        <h2 className="text-lg font-bold text-green-900">📝 MIT（Most Important Things）</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          今日やる <strong>最重要 3 つ</strong>。多くやろうとせず、確実に終わる 3 つに絞る。
          ゴールに繋がる行動を選びましょう。
        </p>
        <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
          <p className="text-xs text-gray-500">例（夢ナビを 100 人に届けるゴールから）</p>
          <p>・LP の文言を直す</p>
          <p>・候補者 5 人に DM</p>
          <p>・購入後フォローのメール文を準備</p>
        </div>
        <Link href="/today" className="block bg-green-500 text-white font-bold py-2 rounded-xl text-sm text-center">
          今日の MIT を決める →
        </Link>
      </section>

      {/* 階層の関係 */}
      <section className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-lg font-bold mb-3">🔗 階層の関係</h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          <strong>夢があってこそゴールが意味を持つ</strong>。
        </p>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          「100 人に届ける」というゴールは、
          「自分の作ったもので人の人生を整えたい」という夢があるから熱量が乗ります。
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">
          逆に、ゴールがあるから夢は妄想で終わらず、
          <strong>毎日の MIT が夢に向かう一歩</strong>になります。
        </p>
      </section>

      {/* 振り返りのサイクル */}
      <section className="bg-gradient-to-br from-pink-50 to-amber-50 border border-pink-200 rounded-2xl p-5 space-y-3">
        <h2 className="text-lg font-bold text-pink-900">🔄 振り返りのサイクル</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          夢ナビは「行動」と「振り返り」を交互に回すことで、自然と成長が加速します。
        </p>
        <ul className="space-y-2 text-sm">
          <li className="bg-white rounded-lg p-3">
            <strong className="text-amber-700">毎日</strong>
            <p className="text-xs text-gray-600 mt-1">朝: MIT 3 つ決定 → 夜: 振り返り（できた・感謝・明日の予定）</p>
          </li>
          <li className="bg-white rounded-lg p-3">
            <strong className="text-blue-700">毎週</strong>
            <p className="text-xs text-gray-600 mt-1">AI と対話して 1 週間を振り返り、来週の MIT を決める</p>
          </li>
          <li className="bg-white rounded-lg p-3">
            <strong className="text-purple-700">毎月</strong>
            <p className="text-xs text-gray-600 mt-1">大きなスパンで方向性を見直し、来月のテーマを決める</p>
          </li>
        </ul>
        <Link href="/review" className="block bg-pink-500 text-white font-bold py-2 rounded-xl text-sm text-center">
          振り返りに行く →
        </Link>
      </section>

      {/* おまけ: SpeakNote 連携 */}
      <section className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 space-y-3">
        <h2 className="text-lg font-bold text-indigo-900">🎤 SpeakNote 連携</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Pro プランには <strong>SpeakNote</strong>（AI 音声入力ツール）が同梱されています。
          話すだけで夢ナビにきれいな文字が入力されるので、書く負担が大きく減ります。
        </p>
        <p className="text-xs text-gray-500">
          Windows 版は右 Alt キー長押しで録音、離すとテキストが自動挿入されます。
        </p>
      </section>

      {/* おわりに */}
      <section className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl p-5 text-center">
        <p className="text-sm text-gray-800 leading-relaxed">
          すべての階層を完璧に埋める必要はありません。
          <br />
          まずは <strong>今日の MIT</strong> から始めてみましょう。
          <br />
          その積み重ねが、いつか夢に届きます。
        </p>
      </section>
    </div>
  );
}
