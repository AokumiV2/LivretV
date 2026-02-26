"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, HandCoins, Home, Settings, Store } from "lucide-react";

const nav = [
  { href: "/app", label: "Tableau de bord", icon: Home },
  { href: "/app/portfolio", label: "Portefeuille", icon: BarChart3 },
  { href: "/app/rewards", label: "Rendements", icon: HandCoins },
  { href: "/app/marketplace", label: "Marche", icon: Store },
  { href: "/app/farms", label: "Fermes", icon: Building2 },
  { href: "/app/settings", label: "Parametres", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 flex-col border-r border-line bg-[#071311]/80 p-5 backdrop-blur lg:flex">
      <div className="mb-8 rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-[#0d2a22] to-[#0a1f1a] p-4 text-white shadow-soft">
        <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Livret V</p>
        <p className="mt-1 text-xl font-bold">Pilotage investissement vert</p>
      </div>
      <nav className="space-y-1.5">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active ? "bg-emerald-400/20 text-emerald-300" : "text-slate-300 hover:bg-[#112722]"}`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
