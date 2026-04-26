import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            夢ナビ
          </Link>
          <nav className="flex gap-4 text-sm text-gray-600">
            <Link href="/legal/tokusho" className="hover:underline">
              特商法
            </Link>
            <Link href="/legal/privacy" className="hover:underline">
              プライバシー
            </Link>
            <Link href="/legal/terms" className="hover:underline">
              利用規約
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 prose prose-sm sm:prose md:prose-lg">
        {children}
      </main>
      <footer className="border-t border-gray-200 px-4 py-6 text-center text-xs text-gray-500">
        © 2026 ドリームズ
      </footer>
    </div>
  );
}
