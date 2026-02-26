"use client";

import Image from "next/image";
import Link from "next/link";
import { Farm } from "@/lib/types";
import { farmStatusLabel, farmTypeLabel, formatUSD, riskLabel } from "@/lib/utils/format";

export function FarmCard({ farm, onBuy }: { farm: Farm; onBuy: () => void }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-line bg-[#0a1614] shadow-soft transition hover:-translate-y-1">
      <div className="relative overflow-hidden">
        <Image src={farm.image} alt={farm.name} width={600} height={280} className="h-44 w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute left-3 top-3 badge bg-[#08201a]/90 text-emerald-200">{farmTypeLabel(farm.type)}</div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{farm.name}</h3>
            <p className="text-xs text-muted">{farm.city}, {farm.country} • {farmStatusLabel(farm.status)}</p>
          </div>
          <span className="badge bg-emerald-400/15 text-emerald-200">{riskLabel(farm.riskBadge)}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#10201c] p-2 text-xs">
          <p>Prix/part <strong>{formatUSD(farm.pricePerShareUSD, 0)}</strong></p>
          <p>Capacite <strong>{farm.capacityMW} MW</strong></p>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="btn-primary" onClick={onBuy}>Acheter des parts</button>
          <Link href={`/app/farms/${farm.id}`} className="btn-soft">Voir la fiche</Link>
        </div>
      </div>
    </article>
  );
}
