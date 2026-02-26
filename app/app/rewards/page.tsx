"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { ClaimModal } from "@/components/modals/claim-modal";
import { epochs } from "@/lib/mock/epochs";
import { farms } from "@/lib/mock/farms";
import { useAuthStore } from "@/lib/store/auth-store";
import { useFarmStore } from "@/lib/store/farm-store";
import { usePortfolioStore } from "@/lib/store/portfolio-store";
import { useUIStore } from "@/lib/store/ui-store";
import { Epoch } from "@/lib/types";
import { epochStatusLabel, formatUSD } from "@/lib/utils/format";
import { claimableForPosition } from "@/lib/utils/portfolio";

export default function RewardsPage() {
  const positionsMap = usePortfolioStore((s) => s.positions);
  const claimedEpochIds = usePortfolioStore((s) => s.claimedEpochIds);
  const claimRewards = usePortfolioStore((s) => s.claimRewards);
  const claimableByFarm = usePortfolioStore((s) => s.claimableByFarm);
  const toggleAutoClaim = usePortfolioStore((s) => s.toggleAutoClaim);
  const toggleAutoReinvest = usePortfolioStore((s) => s.toggleAutoReinvest);
  const extraEpochs = useFarmStore((s) => s.extraEpochs);
  const user = useAuthStore((s) => s.user);
  const setSetting = useAuthStore((s) => s.setSetting);
  const pushToast = useUIStore((s) => s.pushToast);
  const [focusEpoch, setFocusEpoch] = useState<Epoch | null>(null);
  const positions = useMemo(() => Object.values(positionsMap), [positionsMap]);
  const totalClaimable = useMemo(
    () => positions.reduce((sum, position) => sum + claimableForPosition(position, claimedEpochIds), 0),
    [positions, claimedEpochIds]
  );

  const recentEpochs = useMemo(
    () => [...extraEpochs, ...epochs].filter((e) => e.status !== "ANNOUNCED").slice(0, 8),
    [extraEpochs]
  );

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Total retirable</p>
          <p className="text-3xl font-bold">{formatUSD(totalClaimable)}</p>
        </div>
        <button className="btn-primary" disabled={totalClaimable <= 0} onClick={() => { const amount = claimRewards(); pushToast("Retrait effectue", formatUSD(amount)); }}>Retirer tout</button>
      </div>
      <p className="text-sm text-muted">Astuce: activez le reinvestissement auto pour accelerer la croissance de votre portefeuille.</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="card">
          <h2 className="font-semibold">Par ferme</h2>
          <div className="mt-3 space-y-2">
            {positions.length === 0 && <p className="text-sm text-muted">Aucun rendement disponible pour le moment.</p>}
            {positions.map((p) => {
              const farm = farms.find((f) => f.id === p.farmId);
              if (!farm) return null;
              return (
                <div key={p.farmId} className="flex items-center justify-between rounded-xl border border-line p-3">
                  <div>
                    <p className="font-medium">{farm.name}</p>
                    <p className="text-xs text-muted">Retirable {formatUSD(claimableByFarm(p.farmId))}</p>
                  </div>
                  <button className="btn-soft" onClick={() => { const amt = claimRewards(p.farmId); pushToast("Retrait ferme", `${farm.name}: ${formatUSD(amt)}`); }}>Retirer</button>
                </div>
              );
            })}
          </div>
        </article>

        <article className="card space-y-4">
          <h2 className="font-semibold">Retrait automatique</h2>
          <label className="flex items-center justify-between text-sm"><span>Activer (mensuel)</span><input type="checkbox" checked={!!user?.settings.autoClaim} onChange={(e) => toggleAutoClaim(e.target.checked)} /></label>
          <label className="flex items-center justify-between text-sm"><span>Reinvestissement auto</span><input type="checkbox" checked={!!user?.settings.autoReinvest} onChange={(e) => toggleAutoReinvest(e.target.checked)} /></label>
          <div>
            <p className="text-xs text-muted">Prochaine execution estimee</p>
            <p>{dayjs(user?.settings.lastAutoClaimAt || new Date()).add(30, "day").format("YYYY-MM-DD")}</p>
          </div>
          <select className="input" value={user?.settings.preferredBasketId} onChange={(e) => setSetting("preferredBasketId", e.target.value)}>
            <option value="basket-diversified">Panier Diversifie</option>
            <option value="basket-solar">Panier Solaire</option>
            <option value="basket-wind">Panier Eolien</option>
          </select>
        </article>
      </div>

      <article className="card">
        <h2 className="font-semibold">Derniers paiements (preuve)</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-muted"><th>Periode</th><th>Ferme</th><th>Montant</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              {recentEpochs.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="py-2">{e.periodLabel}</td>
                  <td>{farms.find((f) => f.id === e.farmId)?.name}</td>
                  <td>{formatUSD(e.totalRevenueUSD)}</td>
                  <td>{epochStatusLabel(e.status)}</td>
                  <td><button className="btn-soft px-2 py-1" onClick={() => setFocusEpoch(e)}>Voir le detail</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {focusEpoch && <ClaimModal epoch={focusEpoch} onClose={() => setFocusEpoch(null)} />}
    </div>
  );
}
