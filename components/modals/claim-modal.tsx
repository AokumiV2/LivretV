"use client";

import { Epoch } from "@/lib/types";
import { epochStatusLabel } from "@/lib/utils/format";

export function ClaimModal({ epoch, onClose }: { epoch: Epoch; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5">
        <h3 className="text-lg font-semibold">Details du paiement</h3>
        <div className="mt-4 space-y-2 text-sm">
          <p>Periode: {epoch.periodLabel}</p>
          <p>Montant total: ${epoch.totalRevenueUSD.toLocaleString()}</p>
          <p>Statut: {epochStatusLabel(epoch.status)}</p>
          <p className="break-all">Hash de preuve: {epoch.proofHash}</p>
        </div>
        <div className="mt-5 flex justify-end">
          <button className="btn-primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
