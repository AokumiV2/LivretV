import { Basket, Farm } from "@/lib/types";

export const basketsFromFarms = (farms: Farm[]): Basket[] => {
  const byId = Object.fromEntries(farms.map((f) => [f.id, f]));
  const rows: Omit<Basket, "pricePerUnitUSD">[] = [
    {
      id: "basket-solar",
      name: "Panier Solaire",
      description: "Exposition concentree aux fermes solaires europeennes.",
      riskBadge: "MEDIUM",
      apyEstimatePct: 8.2,
      composition: [
        { farmId: "farm-solar-fr", weightPct: 45 },
        { farmId: "farm-solar-es", weightPct: 55 }
      ]
    },
    {
      id: "basket-wind",
      name: "Panier Eolien",
      description: "Rendement potentiel sur actifs eoliens matures.",
      riskBadge: "MEDIUM",
      apyEstimatePct: 9.1,
      composition: [
        { farmId: "farm-wind-de", weightPct: 52 },
        { farmId: "farm-wind-dk", weightPct: 48 }
      ]
    },
    {
      id: "basket-diversified",
      name: "Panier Diversifie",
      description: "Mix solaire, eolien et hydro pour lisser le risque.",
      riskBadge: "LOW",
      apyEstimatePct: 7.4,
      composition: [
        { farmId: "farm-solar-fr", weightPct: 18 },
        { farmId: "farm-solar-es", weightPct: 18 },
        { farmId: "farm-wind-de", weightPct: 18 },
        { farmId: "farm-wind-dk", weightPct: 16 },
        { farmId: "farm-hydro-no", weightPct: 20 },
        { farmId: "farm-hydro-ch", weightPct: 10 }
      ]
    }
  ];

  return rows.map((row) => ({
    ...row,
    pricePerUnitUSD: row.composition.reduce(
      (sum, chunk) => sum + (byId[chunk.farmId]?.pricePerShareUSD || 0) * (chunk.weightPct / 100),
      0
    )
  }));
};
