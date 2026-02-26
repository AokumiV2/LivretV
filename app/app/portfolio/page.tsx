"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BuySharesModal } from "@/components/modals/buy-shares-modal";
import { SellSharesModal } from "@/components/modals/sell-shares-modal";
import { TxTable } from "@/components/tables/tx-table";
import { farms } from "@/lib/mock/farms";
import { usePortfolioStore } from "@/lib/store/portfolio-store";
import { farmTypeLabel, formatUSD } from "@/lib/utils/format";
import { pnl, positionValue } from "@/lib/utils/portfolio";

export default function PortfolioPage() {
  const positionsMap = usePortfolioStore((s) => s.positions);
  const txs = usePortfolioStore((s) => s.transactions);
  const claimableByFarm = usePortfolioStore((s) => s.claimableByFarm);
  const [buyId, setBuyId] = useState<string | null>(null);
  const [sellId, setSellId] = useState<string | null>(null);

  const rows = Object.values(positionsMap);
  const countries = useMemo(() => [...new Set(rows.map((p) => farms.find((f) => f.id === p.farmId)?.country).filter(Boolean))], [rows]);

  const exportCsv = () => {
    const head = "farmId,shares,avgBuyPriceUSD,valueUSD,pnlUSD,claimableUSD\n";
    const body = rows
      .map((p) => `${p.farmId},${p.shares.toFixed(4)},${p.avgBuyPriceUSD.toFixed(2)},${positionValue(p).toFixed(2)},${pnl(p).toFixed(2)},${claimableByFarm(p.farmId).toFixed(2)}`)
      .join("\n");
    const txHead = "\n\ntransactions\nid,type,timestamp,amountUSD,ref\n";
    const txBody = txs.map((t) => `${t.id},${t.type},${t.timestamp},${t.amountUSD.toFixed(2)},${t.meta.farmId || t.meta.basketId || ""}`).join("\n");
    const blob = new Blob([head + body + txHead + txBody], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <button className="btn-soft" onClick={exportCsv}>Exporter CSV</button>
      </div>
      <p className="text-sm text-muted">Retrouvez toutes vos positions, vos performances et vos rendements retirables.</p>
      <section className="grid gap-3 md:grid-cols-3">
        <article className="card"><p className="text-xs text-muted">Positions actives</p><p className="mt-1 text-xl font-bold">{rows.length}</p></article>
        <article className="card"><p className="text-xs text-muted">Valeur totale</p><p className="mt-1 text-xl font-bold">{formatUSD(rows.reduce((sum, p) => sum + positionValue(p), 0))}</p></article>
        <article className="card"><p className="text-xs text-muted">Rendements retirables</p><p className="mt-1 text-xl font-bold">{formatUSD(rows.reduce((sum, p) => sum + claimableByFarm(p.farmId), 0))}</p></article>
      </section>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="text-muted"><th>Ferme</th><th>Type</th><th>Parts</th><th>Prix moyen</th><th>Valeur</th><th>PnL</th><th>Retirable</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td className="py-4 text-muted" colSpan={8}>Aucune position pour le moment. Commencez sur le marche pour investir dans votre premiere ferme.</td></tr>}
            {rows.map((position) => {
              const farm = farms.find((f) => f.id === position.farmId);
              if (!farm) return null;
              const claimable = claimableByFarm(position.farmId);
              return (
                <tr key={position.farmId} className="border-t border-line">
                  <td className="py-3 font-medium">{farm.name}</td>
                  <td>{farmTypeLabel(farm.type)}</td>
                  <td>{position.shares.toFixed(2)}</td>
                  <td>{formatUSD(position.avgBuyPriceUSD)}</td>
                  <td>{formatUSD(positionValue(position))}</td>
                  <td className={pnl(position) >= 0 ? "text-good" : "text-bad"}>{formatUSD(pnl(position))}</td>
                  <td>{formatUSD(claimable)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn-soft px-2 py-1" onClick={() => setBuyId(farm.id)}>Acheter</button>
                      <button className="btn-soft px-2 py-1" onClick={() => setSellId(farm.id)}>Vendre</button>
                      <Link href={`/app/farms/${farm.id}`} className="btn-soft px-2 py-1">Fiche</Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        {countries.map((c) => <span key={c} className="badge bg-slate-100 text-slate-700">{c}</span>)}
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Historique transactions</h2>
        <TxTable txs={txs} />
      </div>

      {buyId && <BuySharesModal farm={farms.find((f) => f.id === buyId)!} onClose={() => setBuyId(null)} />}
      {sellId && (
        <SellSharesModal
          farm={farms.find((f) => f.id === sellId)!}
          maxShares={positionsMap[sellId]?.shares || 0}
          onClose={() => setSellId(null)}
        />
      )}
    </div>
  );
}
