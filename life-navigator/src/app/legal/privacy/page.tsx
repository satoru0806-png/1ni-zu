import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー | 夢ナビ",
  description: "夢ナビのプライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <article>
      <h1>プライバシーポリシー</h1>

      <p>
        ドリームズ（以下「当方」）は、当方が提供するサービス「夢ナビ」および「SpeakNote」（以下総称して「本サービス」）における、ユーザーの個人情報を含む情報の取扱いについて、以下のとおりプライバシーポリシーを定めます。
      </p>

      <h2>1. 取得する情報</h2>
      <p>本サービスでは、以下の情報を取得することがあります。</p>
      <ul>
        <li>
          <strong>アカウント情報</strong>: メールアドレス、パスワード（ハッシュ化して保存）
        </li>
        <li>
          <strong>サービス利用情報</strong>: ユーザーが入力したミッション、ゴール、メモ、振り返り、音声日記等の本文
        </li>
        <li>
          <strong>音声データ</strong>: SpeakNote および音声日記機能でユーザーが録音した音声
        </li>
        <li>
          <strong>決済情報</strong>: Stripe を通じた決済処理に必要な情報（カード番号自体は当方サーバーには保存されません）
        </li>
        <li>
          <strong>技術情報</strong>: IP アドレス、ブラウザ・OS の種類、アクセス日時、Cookie、プッシュ通知トークン
        </li>
      </ul>

      <h2>2. 利用目的</h2>
      <ul>
        <li>本サービスの提供および機能改善</li>
        <li>ユーザーからのお問い合わせへの対応</li>
        <li>料金の請求および決済処理</li>
        <li>サービスに関する重要なお知らせの送信</li>
        <li>不正アクセス、不正利用の防止</li>
        <li>統計的データの作成（個人を特定できない形式に限る）</li>
      </ul>

      <h2>3. 第三者への提供・委託</h2>
      <p>
        当方は、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。ただし、本サービスの提供のために以下の外部サービスを利用しており、これらのサービスへ必要最小限の情報を委託送信することがあります。
      </p>

      <table className="w-full border-collapse mt-4">
        <thead>
          <tr className="border-b-2">
            <th className="text-left py-2 pr-4 font-semibold">事業者</th>
            <th className="text-left py-2 pr-4 font-semibold">利用目的</th>
            <th className="text-left py-2 font-semibold">送信される主な情報</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-2 pr-4 align-top">Supabase, Inc.</td>
            <td className="py-2 pr-4 align-top">
              認証・データベース・ファイルストレージ
            </td>
            <td className="py-2 align-top">
              アカウント情報、サービス利用情報全般
            </td>
          </tr>
          <tr className="border-b">
            <td className="py-2 pr-4 align-top">Vercel Inc.</td>
            <td className="py-2 pr-4 align-top">アプリのホスティング</td>
            <td className="py-2 align-top">アクセスログ、IP アドレス</td>
          </tr>
          <tr className="border-b">
            <td className="py-2 pr-4 align-top">Stripe, Inc.</td>
            <td className="py-2 pr-4 align-top">決済処理</td>
            <td className="py-2 align-top">
              決済に必要な情報（カード情報は Stripe が直接取得）
            </td>
          </tr>
          <tr className="border-b">
            <td className="py-2 pr-4 align-top">OpenAI, L.L.C.</td>
            <td className="py-2 pr-4 align-top">
              音声認識（Whisper）、テキスト整形（GPT）
            </td>
            <td className="py-2 align-top">
              録音音声、入力テキスト
            </td>
          </tr>
          <tr className="border-b">
            <td className="py-2 pr-4 align-top">Anthropic, PBC</td>
            <td className="py-2 pr-4 align-top">
              テキスト整形・要約（Claude）
            </td>
            <td className="py-2 align-top">入力テキスト</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-4 text-sm text-gray-700">
        ※ OpenAI および Anthropic は、API 経由で送信されたデータを AI モデルの学習に利用しないことを公表しています（2026 年 4 月時点）。
      </p>

      <h2>4. 情報の保管・削除</h2>
      <ul>
        <li>
          ユーザーのデータは Supabase（米国・EU 等のデータセンター）にて暗号化保管されます。
        </li>
        <li>
          ユーザーがアカウントを削除した場合、関連するサービス利用情報は速やかに削除されます。
        </li>
        <li>
          上記による削除を希望される場合は、本ページ末尾のお問い合わせ先までご連絡ください。
        </li>
      </ul>

      <h2>5. Cookie・類似技術の使用</h2>
      <p>
        本サービスでは、認証セッションの維持、利便性向上のために Cookie および類似のローカルストレージ技術を使用します。ブラウザの設定により Cookie を無効化できますが、その場合一部機能が制限されることがあります。
      </p>

      <h2>6. 安全管理措置</h2>
      <ul>
        <li>通信の暗号化（HTTPS / TLS）</li>
        <li>パスワードのハッシュ化保存</li>
        <li>データベースの行レベルセキュリティ（RLS）によるユーザー間データ分離</li>
        <li>API キー・シークレットの環境変数管理</li>
      </ul>

      <h2>7. 未成年者の利用について</h2>
      <p>
        13 歳未満の方は本サービスをご利用いただけません。13 歳以上 18 歳未満の方は、保護者の同意を得たうえでご利用ください。
      </p>

      <h2>8. ポリシーの変更</h2>
      <p>
        本ポリシーの内容は法令の改正やサービスの変更に応じて適宜改訂することがあります。重要な変更がある場合は本サービス上で告知いたします。
      </p>

      <h2>9. お問い合わせ窓口</h2>
      <p>
        個人情報に関するお問い合わせ、開示・訂正・削除のご請求は下記までご連絡ください。
      </p>
      <ul>
        <li>事業者: 飯村悟（屋号: ドリームズ）</li>
        <li>所在地: 福島県白河市立石105-1</li>
        <li>メール: satoru0806@gmail.com</li>
      </ul>

      <p className="text-xs text-gray-500 mt-8">
        制定日: 2026 年 4 月 25 日
      </p>
    </article>
  );
}
