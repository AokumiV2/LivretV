"use client";

import { useState } from "react";
import { Basket } from "@/lib/types";
import { formatUSD, riskLabel } from "@/lib/utils/format";
import { usePortfolioStore } from "@/lib/store/portfolio-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { useUIStore } from "@/lib/store/ui-store";

export function BasketCard({ basket }: { basket: Basket }) {
  const [amount, setAmount] = useState(1000);
  const buyBasket = usePortfolioStore((s) => s.buyBasket);
  const setSetting = useAuthStore((s) => s.setSetting);
  const pushToast = useUIStore((s) => s.pushToast);

  return (
    <article className="card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{basket.name}</h3>
        <span className="badge bg-sky-100 text-sky-700">{riskLabel(basket.riskBadge)}</span>
      </div>
      <p className="mt-2 text-sm text-muted">{basket.description}</p>
      <p className="mt-2 text-sm">APY estime: <strong>{basket.apyEstimatePct}%</strong></p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        {basket.composition.map((c) => <span key={c.farmId} className="inline-block h-full bg-brand" style={{ width: `${c.weightPct}%` }} />)}
      </div>
      <p className="mt-3 text-sm">Prix unite: {formatUSD(basket.pricePerUnitUSD)}</p>
      <input className="input mt-3" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn-primary" onClick={() => { buyBasket(basket.id, amount); pushToast("Achat basket confirme"); }}>Acheter 1 clic</button>
        <button className="btn-soft" onClick={() => { setSetting("preferredBasketId", basket.id); setSetting("autoReinvest", true); pushToast("Auto-reinvest configure", basket.name); }}>Auto-reinvest ici</button>
      </div>
    </article>
  );
}
