"use client";

import { useMemo, useState } from "react";
import { Farm } from "@/lib/types";
import { usePortfolioStore } from "@/lib/store/portfolio-store";
import { useUIStore } from "@/lib/store/ui-store";
import { formatUSD } from "@/lib/utils/format";

export function BuySharesModal({ farm, onClose }: { farm: Farm; onClose: () => void }) {
  const [amount, setAmount] = useState(1000);
  const buyShares = usePortfolioStore((s) => s.buyShares);
  const pushToast = useUIStore((s) => s.pushToast);

  const { shares, fee } = useMemo(() => {
    const gross = amount / 1.005;
    return { shares: gross / farm.pricePerShareUSD, fee: amount - gross };
  }, [amount, farm.pricePerShareUSD]);

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-5 text-ink shadow-soft">
        <h3 className="text-lg font-semibold">Acheter des parts - {farm.name}</h3>
        <p className="mt-3 text-sm text-muted">Montant ($)</p>
        <input className="input mt-1" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        <div className="mt-4 rounded-xl border border-line bg-[#0d1f1a] p-3 text-sm">
          <p>Parts recues: {shares.toFixed(3)}</p>
          <p>Prix: {formatUSD(farm.pricePerShareUSD)}</p>
          <p>Frais (0.5%): {formatUSD(fee)}</p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-soft" onClick={onClose}>Annuler</button>
          <button
            className="btn-primary"
            onClick={() => {
              buyShares(farm.id, amount);
              pushToast("Achat confirme", `${shares.toFixed(2)} parts ajoutees`);
              onClose();
            }}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
