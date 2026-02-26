"use client";

import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";

export function Topbar() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-20 border-b border-line glass px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-3xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-300/80" />
          <input
            className="h-12 w-full rounded-3xl border border-emerald-400/20 bg-[#0b1916] pl-12 pr-4 text-base font-medium text-ink outline-none placeholder:text-slate-500 focus:border-emerald-400"
            placeholder="Rechercher une ferme, une ville, une transaction"
          />
        </div>
        <Link href="/admin" className="btn-soft text-xs">Simulation admin</Link>
        <button className="btn-soft p-2"><Bell className="h-4 w-4" /></button>
        <div className="rounded-xl border border-line bg-[#10241f] px-3 py-2 text-sm font-semibold text-emerald-200">{user?.displayName || "Invite"}</div>
      </div>
    </header>
  );
}
