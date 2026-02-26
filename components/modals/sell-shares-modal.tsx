"use client";

import { useState } from "react";
import { Farm } from "@/lib/types";
import { usePortfolioStore } from "@/lib/store/portfolio-store";
import { useUIStore } from "@/lib/store/ui-store";

export function SellSharesModal({ farm, maxShares, onClose }: { farm: Farm; maxShares: number; onClose: () => void }) {
  const [shares, setShares] = useState(Math.min(1, maxShares));
  const sellShares = usePortfolioStore((s) => s.sellShares);
  const pushToast = useUIStore((s) => s.pushToast);

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-5 text-ink shadow-soft">
        <h3 className="text-lg font-semibold">Vendre des parts - {farm.name}</h3>
        <p className="mt-3 text-sm text-muted">Parts a vendre (max {maxShares.toFixed(2)})</p>
        <input className="input mt-1" type="number" max={maxShares} value={shares} onChange={(e) => setShares(Number(e.target.value))} />
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-soft" onClick={onClose}>Annuler</button>
          <button
            className="btn-primary"
            onClick={() => {
              sellShares(farm.id, shares);
              pushToast("Vente executee", `${shares.toFixed(2)} parts vendues`);
              onClose();
            }}
          >
            Vendre
          </button>
        </div>
      </div>
    </div>
  );
}
