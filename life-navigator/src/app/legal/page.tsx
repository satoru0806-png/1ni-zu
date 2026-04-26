import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "法的情報 | 夢ナビ",
  description: "夢ナビの法的情報",
};

export default function LegalIndexPage() {
  return (
    <article>
      <h1>法的情報</h1>
      <p>夢ナビおよび SpeakNote をご利用いただくうえでの法的情報です。</p>

      <ul className="list-none space-y-3 not-prose mt-6">
        <li>
          <Link
            href="/legal/tokusho"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <span className="font-semibold">特定商取引法に基づく表記</span>
            <span className="block text-sm text-gray-600 mt-1">
              販売事業者・所在地・支払方法・解約方法等
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/legal/privacy"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <span className="font-semibold">プライバシーポリシー</span>
            <span className="block text-sm text-gray-600 mt-1">
              個人情報の取扱い、外部サービスへの委託について
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/legal/terms"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <span className="font-semibold">利用規約</span>
            <span className="block text-sm text-gray-600 mt-1">
              本サービスをご利用いただくうえでの条件
            </span>
          </Link>
        </li>
      </ul>
    </article>
  );
}
