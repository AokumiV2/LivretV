"use client";

import { create } from "zustand";
import { farms } from "@/lib/mock/farms";
import { Epoch } from "@/lib/types";

export type FarmOverrides = {
  incidents: Record<string, Array<{ date: string; severity: "LOW" | "MEDIUM" | "HIGH"; title: string; description: string }>>;
  riskScore: Record<string, number>;
  extraEpochs: Epoch[];
};

type FarmStore = FarmOverrides & {
  addIncident: (farmId: string, severity: "LOW" | "MEDIUM" | "HIGH", title: string) => void;
  changeRiskScore: (farmId: string, score: number) => void;
  addEpoch: (epoch: Epoch) => void;
};

export const useFarmStore = create<FarmStore>((set) => ({
  incidents: Object.fromEntries(farms.map((f) => [f.id, []])),
  riskScore: {},
  extraEpochs: [],
  addIncident: (farmId, severity, title) =>
    set((state) => ({
      incidents: {
        ...state.incidents,
        [farmId]: [
          {
            date: new Date().toISOString().slice(0, 10),
            severity,
            title,
            description: "Incident simule depuis le panneau admin."
          },
          ...(state.incidents[farmId] || [])
        ]
      }
    })),
  changeRiskScore: (farmId, score) =>
    set((state) => ({
      riskScore: { ...state.riskScore, [farmId]: Math.max(0, Math.min(100, score)) }
    })),
  addEpoch: (epoch) => set((state) => ({ extraEpochs: [epoch, ...state.extraEpochs] }))
}));
