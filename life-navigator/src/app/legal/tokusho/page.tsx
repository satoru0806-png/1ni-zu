import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | 夢ナビ",
  description: "夢ナビの特定商取引法に基づく表記",
};

export default function TokushoPage() {
  return (
    <article>
      <h1>特定商取引法に基づく表記</h1>

      <table className="w-full border-collapse">
        <tbody>
          <tr className="border-b">
            <th className="text-left py-3 pr-4 align-top whitespace-nowrap font-semibold w-40">
              販売事業者
            </th>
            <td className="py-3">飯村悟（屋号: ドリームズ）</td>
          </tr>
          <tr className="border-b">
            <th className="text-left py-3 pr-4 align-top whitespace-nowrap font-semibold">
              所在地
            </th>
            <td className="py-3">福島県白河市立石105-1</td>
          </tr>
          <tr className="border-b">
            <th className="text-left py-3 pr-4 align-top whitespace-nowrap font-semibold">
              電話番号
            </th>
            <td className="py-3">
              0248-22-1979
              <br />
              <span className="text-xs text-gray-600">
                ※ お問い合わせは原則メールにてお願いいたします。電話でのご連絡が必要な場合は、メールにてご請求ください。
              </span>
            </td>
          </tr>
          <tr className="border-b">
            <th className="text-left py-3 pr-4 align-top whitespace-nowrap font-semibold">
              メールアドレス
            </th>
            <td className="py-3">satoru0806@gmail.com</td>
          </tr>
          <tr className="border-b">
            <th className="text-left py-3 pr-4 align-top whitespace-nowrap font-semibold">
              運営責任者
            </th>
            <td className="py-3">飯村悟</td>
          </tr>
          <tr className="border-b">
            <th className="text-left py-3 pr-4 align-top whitespace-nowrap font-semibold">
              販売価格
            </th>
            <td className="py-3">
              各サービス紹介ページに記載の価格に従います。
              <br />
              （例: 夢ナビ Pro 月額 980 円 / 年額 9,800 円・税込）
            </td>
          </tr>
          <tr className="border-b">
            <th className="text-left py-3 pr-4 align-top whitespace-nowrap font-semibold">
              商品代金以外の必要料金
            </th>
            <td className="py-3">
              インターネット接続にかかる通信費、決済時に発生する手数料はお客様のご負担となります。
            </td>
          </tr>
          <tr className="border-b">
            <th className="text-left py-3 pr-4 align-top whitespace-nowrap font-semibold">
              支払方法
            </th>
            <td className="py-3">
              クレジットカード決済（Stripe）
              <br />
              利用可能ブランド: Visa / Mastercard / American Express / JCB / Discover / Diners Club
            </td>
          </tr>
          <tr className="border-b">
            <th className="text-left py-3 pr-4 align-top whitespace-nowrap font-semibold">
              支払時期
            </th>
            <td className="py-3">
              月額プラン: お申込み時に初回課金、以後毎月同日に自動更新
              <br />
              年額プラン: お申込み時に初回課金、以後毎年同日に自動更新
            </td>
          </tr>
          <tr className="border-b">
            <th className="text-left py-3 pr-4 align-top whitespace-nowrap font-semibold">
              サービス提供時期
            </th>
            <td className="py-3">
              決済完了直後よりご利用いただけます。
            </td>
          </tr>
          <tr className="border-b">
            <th className="text-left py-3 pr-4 align-top whitespace-nowrap font-semibold">
              解約方法
            </th>
            <td className="py-3">
              アプリ内「設定」ページから「サブスクリプション管理」を選択し、Stripe カスタマーポータルにて解約手続きが行えます。次回課金日の前日までに解約手続きを完了することで、それ以降の課金は発生しません。
            </td>
          </tr>
          <tr className="border-b">
            <th className="text-left py-3 pr-4 align-top whitespace-nowrap font-semibold">
              返金・キャンセルポリシー
            </th>
            <td className="py-3">
              本サービスはデジタル役務の継続提供であるため、原則として既にお支払いいただいた料金の返金は致しかねます。重大な不具合により正常にサービスをご利用いただけなかった場合等は、個別に対応いたしますのでメールにてご連絡ください。
            </td>
          </tr>
          <tr className="border-b">
            <th className="text-left py-3 pr-4 align-top whitespace-nowrap font-semibold">
              動作環境
            </th>
            <td className="py-3">
              モダンブラウザ（Chrome / Edge / Safari の最新版を推奨）
              <br />
              SpeakNote PC 版: Windows 10 / 11、macOS 12 以降
              <br />
              SpeakNote Android 版: Android 8.0 以降
            </td>
          </tr>
        </tbody>
      </table>

      <p className="text-xs text-gray-500 mt-8">
        最終更新日: 2026 年 4 月 25 日
      </p>
    </article>
  );
}
