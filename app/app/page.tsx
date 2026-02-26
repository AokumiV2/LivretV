"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AllocationPieChart } from "@/components/charts/allocation-pie";
import { PnLLineChart } from "@/components/charts/pnl-line";
import { TxTable } from "@/components/tables/tx-table";
import { farms } from "@/lib/mock/farms";
import { usePortfolioStore } from "@/lib/store/portfolio-store";
import { farmTypeLabel, formatUSD } from "@/lib/utils/format";
import { claimableForPosition, positionValue } from "@/lib/utils/portfolio";

export default function DashboardPage() {
  const positionsMap = usePortfolioStore((s) => s.positions);
  const transactions = usePortfolioStore((s) => s.transactions);
  const claimedEpochIds = usePortfolioStore((s) => s.claimedEpochIds);
  const positions = useMemo(() => Object.values(positionsMap), [positionsMap]);
  const txs = useMemo(() => transactions.slice(0, 7), [transactions]);
  const totalClaimable = useMemo(
    () => positions.reduce((sum, position) => sum + claimableForPosition(position, claimedEpochIds), 0),
    [positions, claimedEpochIds]
  );
  const totalValue = positions.reduce((sum, p) => sum + positionValue(p), 0);

  const byType = (["SOLAR", "WIND", "HYDRO"] as const).map((type) => ({
    name: farmTypeLabel(type),
    value: Math.round(
      positions.reduce((sum, p) => {
        const farm = farms.find((f) => f.id === p.farmId);
        return farm?.type === type ? sum + positionValue(p) : sum;
      }, 0)
    )
  }));

  const pnlSeries = Array.from({ length: 30 }).reduce<Array<{ day: string; pnl: number }>>((acc, _, i) => {
    const previous = acc[i - 1]?.pnl ?? 0;
    const increment = 55 + Math.round(i * 3.5);
    acc.push({
      day: `J-${29 - i}`,
      pnl: previous + increment
    });
    return acc;
  }, []);

  const weightedRisk = positions.length
    ? positions.reduce((sum, p) => {
        const farm = farms.find((f) => f.id === p.farmId);
        const v = positionValue(p);
        return sum + (farm?.riskScore || 0) * v;
      }, 0) / Math.max(totalValue, 1)
    : 0;

  return (
    <div className="space-y-6">
      <section className="card border-emerald-400/30 bg-gradient-to-r from-[#0e3126] to-[#0a211a] text-white">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="mt-1 text-sm text-emerald-100">Vue rapide de vos investissements, rendements et risque global.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/app/marketplace" className="btn bg-emerald-300 text-[#04120e] hover:bg-emerald-200">Investir maintenant</Link>
          <Link href="/app/rewards" className="btn border border-emerald-300/30 text-white hover:bg-emerald-500/20">Voir mes rendements</Link>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="card"><p className="text-sm text-muted">Solde total</p><p className="mt-2 text-2xl font-bold">{formatUSD(totalValue)}</p></article>
        <article className="card"><p className="text-sm text-muted">Rendements cumulés</p><p className="mt-2 text-2xl font-bold">{formatUSD(totalClaimable)}</p></article>
        <article className="card"><p className="text-sm text-muted">Rendement annuel estimé</p><p className="mt-2 text-2xl font-bold">6.0%</p></article>
        <article className="card"><p className="text-sm text-muted">Score risque global</p><p className="mt-2 text-2xl font-bold">{weightedRisk.toFixed(0)}/100</p></article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card"><h2 className="font-semibold">Allocation</h2><AllocationPieChart data={byType} /></article>
        <article className="card"><h2 className="font-semibold">PnL 30 jours</h2><PnLLineChart data={pnlSeries} /></article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="card">
          <p className="text-sm font-semibold">Parcours recommande</p>
          <p className="mt-1 text-sm text-muted">1. Choisir une ferme 2. Acheter des parts 3. Activer le reinvestissement.</p>
        </article>
        <article className="card">
          <p className="text-sm font-semibold">Votre prochaine action</p>
          <p className="mt-1 text-sm text-muted">{positions.length === 0 ? "Demarrez avec votre premiere ferme." : "Verifiez vos rendements a retirer."}</p>
        </article>
        <article className="card">
          <p className="text-sm font-semibold">Confiance</p>
          <p className="mt-1 text-sm text-muted">Production, incidents et preuves de paiements disponibles en un clic.</p>
        </article>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Dernieres operations</h2>
        <TxTable txs={txs} />
      </section>
    </div>
  );
}
