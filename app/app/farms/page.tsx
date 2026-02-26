"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { farms } from "@/lib/mock/farms";
import { farmStatusLabel, farmTypeLabel } from "@/lib/utils/format";

const FarmsMap = dynamic(() => import("@/components/map/farms-map").then((m) => m.FarmsMap), { ssr: false });

export default function FarmsPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ALL");

  const filtered = useMemo(() =>
    farms.filter((farm) => {
      const hay = `${farm.name} ${farm.city} ${farm.country}`.toLowerCase();
      return hay.includes(query.toLowerCase()) && (type === "ALL" || farm.type === type);
    }), [query, type]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Carte des fermes</h1>
      <div className="grid gap-2 md:grid-cols-3">
        <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom, ville, pays" />
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="ALL">Tous types</option>
          <option value="SOLAR">{farmTypeLabel("SOLAR")}</option>
          <option value="WIND">{farmTypeLabel("WIND")}</option>
          <option value="HYDRO">{farmTypeLabel("HYDRO")}</option>
        </select>
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <FarmsMap farms={filtered} />
        <div className="card max-h-[420px] overflow-auto">
          {filtered.map((farm) => (
            <Link key={farm.id} href={`/app/farms/${farm.id}`} className="block border-b border-line py-2 last:border-0">
              <p className="font-medium">{farm.name}</p>
              <p className="text-xs text-muted">{farm.city}, {farm.country} - {farmStatusLabel(farm.status)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
