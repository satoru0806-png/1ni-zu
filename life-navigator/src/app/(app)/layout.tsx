import { Nav } from "@/components/Nav";
import { RegisterSW } from "@/components/RegisterSW";
import { PushPermission } from "@/components/PushPermission";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
  );
}
