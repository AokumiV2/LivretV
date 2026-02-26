"use client";

import Link from "next/link";
import { useState } from "react";
import { FarmCard } from "@/components/cards/farm-card";
import { BuySharesModal } from "@/components/modals/buy-shares-modal";
import { farms } from "@/lib/mock/farms";

export default function MarketplacePage() {
  const [tab, setTab] = useState<"farms" | "baskets" | "secondary">("farms");
  const [buyId, setBuyId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <section className="card border-emerald-400/30 bg-gradient-to-r from-[#0f3529] to-[#0a221b] text-white">
        <p className="text-xs uppercase tracking-[0.18em] text-emerald-100">Marche</p>
        <h1 className="mt-1 text-2xl font-bold">Selection de fermes energetiques</h1>
        <p className="mt-1 text-sm text-emerald-100">Comparez prix, risque, production et achetez en quelques secondes.</p>
        <div className="mt-4 grid gap-2 text-sm text-emerald-50 md:grid-cols-3">
          <p>• Donnees de production visibles</p>
          <p>• Suivi des incidents en continu</p>
          <p>• Achat et vente instantanes</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button className={tab === "farms" ? "btn-primary" : "btn-soft"} onClick={() => setTab("farms")}>Fermes</button>
        <button className={tab === "baskets" ? "btn-primary" : "btn-soft"} onClick={() => setTab("baskets")}>Baskets</button>
        <button className={tab === "secondary" ? "btn-primary" : "btn-soft"} onClick={() => setTab("secondary")}>Second marche</button>
      </div>

      {tab === "farms" && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {farms.map((farm) => <FarmCard key={farm.id} farm={farm} onBuy={() => setBuyId(farm.id)} />)}
        </section>
      )}

      {tab === "baskets" && (
        <div className="card flex items-center justify-between">
          <p>Baskets d'investissement en 1 clic, ideales pour diversifier rapidement.</p>
          <Link href="/app/marketplace/baskets" className="btn-primary">Ouvrir</Link>
        </div>
      )}

      {tab === "secondary" && (
        <div className="card flex items-center justify-between">
          <p>Ordres ouverts et execution instantanee pour optimiser vos points d'entree/sortie.</p>
          <Link href="/app/marketplace/secondary" className="btn-primary">Ouvrir</Link>
        </div>
      )}

      {buyId && <BuySharesModal farm={farms.find((f) => f.id === buyId)!} onClose={() => setBuyId(null)} />}
    </div>
  );
}
