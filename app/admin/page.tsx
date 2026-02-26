"use client";

import { useState } from "react";
import { farms } from "@/lib/mock/farms";
import { useFarmStore } from "@/lib/store/farm-store";
import { useUIStore } from "@/lib/store/ui-store";
import { fakeHash, uid } from "@/lib/utils/format";

export default function AdminPage() {
  const [farmId, setFarmId] = useState(farms[0].id);
  const [amount, setAmount] = useState(25000);
  const [score, setScore] = useState(50);
  const addEpoch = useFarmStore((s) => s.addEpoch);
  const addIncident = useFarmStore((s) => s.addIncident);
  const changeRiskScore = useFarmStore((s) => s.changeRiskScore);
  const pushToast = useUIStore((s) => s.pushToast);

  return (
    <div className="mx-auto mt-8 max-w-3xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Admin simulation</h1>
      <section className="card space-y-3">
        <select className="input" value={farmId} onChange={(e) => setFarmId(e.target.value)}>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}</select>
        <input className="input" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        <button
          className="btn-primary"
          onClick={() => {
            addEpoch({
              id: uid(),
              farmId,
              periodLabel: new Date().toISOString().slice(0, 7),
              totalRevenueUSD: amount,
              timestamp: new Date().toISOString(),
              proofHash: fakeHash(),
              status: "CLAIMABLE"
            });
            pushToast("Epoch simule ajoute");
          }}
        >
          Simuler revenue epoch
        </button>
        <button className="btn-soft" onClick={() => { addIncident(farmId, "MEDIUM", "Incident simule"); pushToast("Incident ajoute"); }}>Simuler incident</button>
        <div className="flex gap-2">
          <input className="input" type="number" value={score} onChange={(e) => setScore(Number(e.target.value))} />
          <button className="btn-soft" onClick={() => { changeRiskScore(farmId, score); pushToast("Risk score modifie"); }}>Changer risk score</button>
        </div>
      </section>
    </div>
  );
}
