import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { RegisterSW } from "@/components/RegisterSW";
import { PushPermission } from "@/components/PushPermission";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "夢ナビ",
  description: "AIと習慣化で人生の4大悩みを整えるアプリ",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "夢ナビ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${geistSans.variable} antialiased bg-gray-50 text-gray-900`}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white border-b border-gray-200 px-4 py-3">
            <h1 className="text-xl font-bold text-center">夢ナビ</h1>
          </header>
          <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-20">
            {children}
          </main>
          <Nav />
          <RegisterSW />
          <PushPermission />
        </div>
      </body>
    </html>
  );
}
