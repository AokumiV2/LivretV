"use client";

import { notFound } from "next/navigation";
import { useState } from "react";
import { ProductionAreaChart } from "@/components/charts/production-area";
import { BuySharesModal } from "@/components/modals/buy-shares-modal";
import { farms } from "@/lib/mock/farms";
import { useFarmStore } from "@/lib/store/farm-store";
import { farmStatusLabel, farmTypeLabel, formatUSD } from "@/lib/utils/format";

export default function FarmDetailsPage({ params }: { params: { farmId: string } }) {
  const farm = farms.find((f) => f.id === params.farmId);
  const [openBuy, setOpenBuy] = useState(false);
  const overrides = useFarmStore((s) => s.incidents[params.farmId] || []);

  if (!farm) return notFound();

  const incidents = [...overrides, ...farm.incidents];

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{farm.name}</h1>
            <p className="text-sm text-muted">{farmTypeLabel(farm.type)} • {farmStatusLabel(farm.status)} • {farm.city}, {farm.country}</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="font-semibold">{formatUSD(farm.pricePerShareUSD, 0)} / part</p>
            <button className="btn-primary" onClick={() => setOpenBuy(true)}>Acheter</button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-5">
        <article className="card"><p className="text-xs text-muted">Capacite</p><p className="font-semibold">{farm.capacityMW} MW</p></article>
        <article className="card"><p className="text-xs text-muted">Facteur de charge</p><p className="font-semibold">{farm.kpis.loadFactorPct}%</p></article>
        <article className="card"><p className="text-xs text-muted">Uptime</p><p className="font-semibold">{farm.kpis.uptimePct}%</p></article>
        <article className="card"><p className="text-xs text-muted">Ecretement</p><p className="font-semibold">{farm.kpis.curtailmentPct}%</p></article>
        <article className="card"><p className="text-xs text-muted">Dernier mois (MWh)</p><p className="font-semibold">{farm.kpis.lastMonthMWh}</p></article>
      </section>

      <section className="card"><h2 className="font-semibold">Tableau de production</h2><ProductionAreaChart data={farm.productionSeries} /></section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card">
          <h2 className="font-semibold">Salle documentaire</h2>
          <ul className="mt-3 space-y-2 text-sm">{farm.dataRoom.map((doc) => <li key={doc.title} className="flex justify-between border-b border-line pb-2"><span>{doc.title}</span><a href={doc.url}>Telecharger {doc.type}</a></li>)}</ul>
        </article>
        <article className="card">
          <h2 className="font-semibold">Chronologie</h2>
          <ul className="mt-3 space-y-2 text-sm">{farm.timeline.map((step) => <li key={step.date}><p className="font-medium">{step.date} - {step.title}</p><p className="text-muted">{step.description}</p></li>)}</ul>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card">
          <h2 className="font-semibold">Incidents</h2>
          {farm.status === "MAINTENANCE" && <div className="mt-3 rounded-xl bg-amber-100 p-2 text-sm text-amber-800">Maintenance en cours</div>}
          <ul className="mt-3 space-y-2 text-sm">
            {incidents.length === 0 && <li className="text-muted">Aucun incident recemment.</li>}
            {incidents.map((incident) => (
              <li key={`${incident.date}-${incident.title}`} className="rounded-xl border border-line p-2">
                <p className="font-medium">{incident.title}</p>
                <p className="text-xs text-muted">{incident.date} - {incident.severity}</p>
                <p>{incident.description}</p>
              </li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h2 className="font-semibold">Escrow par etapes</h2>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><span className="inline-block h-full w-[30%] bg-brand" /><span className="inline-block h-full w-[40%] bg-emerald-500" /><span className="inline-block h-full w-[30%] bg-slate-300" /></div>
          <p className="mt-3 text-sm text-muted">30% Signature • 40% Construction • 30% Mise en service</p>
          <p className="mt-2 text-sm">Etape actuelle: {farm.timeline.at(-1)?.title || "Construction"}</p>
        </article>
      </section>

      {openBuy && <BuySharesModal farm={farm} onClose={() => setOpenBuy(false)} />}
    </div>
  );
}
