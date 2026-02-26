"use client";

import { useMemo, useState } from "react";
import { CreateOrderModal } from "@/components/modals/create-order-modal";
import { farms } from "@/lib/mock/farms";
import { useMarketStore } from "@/lib/store/market-store";
import { usePortfolioStore } from "@/lib/store/portfolio-store";
import { useUIStore } from "@/lib/store/ui-store";
import { formatUSD } from "@/lib/utils/format";

export default function SecondaryPage() {
  const [tab, setTab] = useState<"instant" | "offers">("instant");
  const [farmId, setFarmId] = useState(farms[0].id);
  const [shares, setShares] = useState(10);
  const [showCreate, setShowCreate] = useState(false);
  const orders = useMarketStore((s) => s.orders);
  const fillOrder = useMarketStore((s) => s.fillOrder);
  const buyShares = usePortfolioStore((s) => s.buyShares);
  const sellShares = usePortfolioStore((s) => s.sellShares);
  const pushToast = useUIStore((s) => s.pushToast);

  const farm = farms.find((f) => f.id === farmId)!;
  const instantBuy = farm.pricePerShareUSD * shares * 1.01;
  const instantSell = farm.pricePerShareUSD * shares * 0.99;

  const openOrders = useMemo(() => orders.filter((o) => o.status === "OPEN"), [orders]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Second marche</h1>
      <p className="text-sm text-muted">Choisissez entre execution immediate ou achat via offres publiees par d'autres investisseurs.</p>
      <div className="flex gap-2">
        <button className={tab === "instant" ? "btn-primary" : "btn-soft"} onClick={() => setTab("instant")}>Prix instantane</button>
        <button className={tab === "offers" ? "btn-primary" : "btn-soft"} onClick={() => setTab("offers")}>Offres</button>
      </div>

      {tab === "instant" && (
        <article className="card max-w-xl space-y-3">
          <select className="input" value={farmId} onChange={(e) => setFarmId(e.target.value)}>{farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <input className="input" type="number" value={shares} onChange={(e) => setShares(Number(e.target.value))} />
          <p className="text-sm">Prix achat: <strong>{formatUSD(instantBuy)}</strong> | Prix vente: <strong>{formatUSD(instantSell)}</strong></p>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => { buyShares(farmId, undefined, shares); pushToast("Achat instant execute"); }}>Acheter maintenant</button>
            <button className="btn-soft" onClick={() => { sellShares(farmId, shares); pushToast("Vente instant executee"); }}>Vendre maintenant</button>
          </div>
        </article>
      )}

      {tab === "offers" && (
        <article className="card space-y-3">
          <button className="btn-primary" onClick={() => setShowCreate(true)}>Creer un ordre</button>
          <table className="w-full text-left text-sm">
            <thead><tr className="text-muted"><th>Ferme</th><th>Parts</th><th>Prix demande</th><th>Vendeur</th><th></th></tr></thead>
            <tbody>
              {openOrders.map((order) => {
                const f = farms.find((farm) => farm.id === order.farmId);
                return (
                  <tr key={order.id} className="border-t border-line">
                    <td className="py-2">{f?.name}</td>
                    <td>{order.shares}</td>
                    <td>{formatUSD(order.askPricePerShareUSD)}</td>
                    <td>{order.sellerAddress}</td>
                    <td>
                      <button
                        className="btn-soft px-2 py-1"
                        onClick={() => {
                          const executed = fillOrder(order.id);
                          if (!executed) return;
                          buyShares(order.farmId, undefined, order.shares);
                          pushToast("Ordre rempli", order.id);
                        }}
                      >
                        Acheter
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </article>
      )}

      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
