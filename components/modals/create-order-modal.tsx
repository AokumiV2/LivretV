"use client";

import { useState } from "react";
import { farms } from "@/lib/mock/farms";
import { useMarketStore } from "@/lib/store/market-store";
import { useUIStore } from "@/lib/store/ui-store";

export function CreateOrderModal({ onClose }: { onClose: () => void }) {
  const [farmId, setFarmId] = useState(farms[0].id);
  const [shares, setShares] = useState(10);
  const [ask, setAsk] = useState(farms[0].pricePerShareUSD);
  const placeOrder = useMarketStore((s) => s.placeOrder);
  const pushToast = useUIStore((s) => s.pushToast);

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5">
        <h3 className="text-lg font-semibold">Creer un ordre de vente</h3>
        <select className="input mt-3" value={farmId} onChange={(e) => setFarmId(e.target.value)}>
          {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <input className="input mt-2" type="number" value={shares} onChange={(e) => setShares(Number(e.target.value))} placeholder="Parts" />
        <input className="input mt-2" type="number" value={ask} onChange={(e) => setAsk(Number(e.target.value))} placeholder="Prix par part" />
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-soft" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={() => { placeOrder(farmId, shares, ask); pushToast("Ordre cree"); onClose(); }}>Publier</button>
        </div>
      </div>
    </div>
  );
}
