"use client";

import dayjs from "dayjs";
import { Transaction } from "@/lib/types";
import { formatUSD, txTypeLabel } from "@/lib/utils/format";

export function TxTable({ txs }: { txs: Transaction[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-muted">
            <th className="pb-2">Date</th>
            <th className="pb-2">Type</th>
            <th className="pb-2">Montant</th>
            <th className="pb-2">Reference</th>
          </tr>
        </thead>
        <tbody>
          {txs.map((tx) => (
            <tr key={tx.id} className="border-t border-line">
              <td className="py-2">{dayjs(tx.timestamp).format("YYYY-MM-DD HH:mm")}</td>
              <td className="py-2">{txTypeLabel(tx.type)}</td>
              <td className="py-2">{formatUSD(tx.amountUSD)}</td>
              <td className="py-2 text-xs text-muted">{tx.meta.farmId || tx.meta.basketId || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
