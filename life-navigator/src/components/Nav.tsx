"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Home", icon: "H" },
  { href: "/today", label: "Today", icon: "T" },
  { href: "/review", label: "Review", icon: "R" },
  { href: "/history", label: "History", icon: "L" },
  { href: "/onboarding", label: "Dreams", icon: "D" },
];

export function Nav() {
  const pathname = usePathname();
  if (pathname === "/watch") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center py-2 text-xs ${
                active ? "text-blue-600 font-bold" : "text-gray-500"
              }`}
            >
              <span className="text-base font-bold">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
