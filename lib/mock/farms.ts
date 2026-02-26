import { Farm } from "@/lib/types";

const monthlySeries = (baseMwh: number, baseRevenue: number) =>
  Array.from({ length: 12 }).map((_, i) => ({
    date: `2025-${String(i + 1).padStart(2, "0")}`,
    mwh: Math.round(baseMwh * (0.85 + (i % 3) * 0.07)),
    revenueUSD: Math.round(baseRevenue * (0.82 + (i % 4) * 0.06))
  }));

export const farms: Farm[] = [
  {
    id: "farm-solar-fr",
    name: "Provence Solar One",
    type: "SOLAR",
    country: "FR",
    city: "Arles",
    lat: 43.6766,
    lng: 4.6278,
    status: "LIVE",
    capacityMW: 38,
    expectedAnnualMWh: 61200,
    riskScore: 31,
    riskBadge: "LOW",
    pricePerShareUSD: 124,
    sharesAvailable: 12000,
    totalSharesSold: 18000,
    kpis: { loadFactorPct: 22, uptimePct: 98.6, curtailmentPct: 1.7, lastMonthMWh: 5010 },
    timeline: [
      { date: "2023-02", title: "Signature", description: "Contrats EPC et PPA finalises." },
      { date: "2023-09", title: "Construction", description: "Installation des rangs PV." },
      { date: "2024-03", title: "Commissioning", description: "Tests reussis du poste." },
      { date: "2024-05", title: "Live", description: "Injection commerciale." }
    ],
    dataRoom: [
      { title: "PPA Summary", type: "PDF", url: "#" },
      { title: "Engineering Report", type: "PDF", url: "#" }
    ],
    productionSeries: monthlySeries(4800, 390000),
    incidents: [{ date: "2025-10-02", severity: "LOW", title: "Capteur remplace", description: "Maintenance preventive d'un onduleur." }],
    image: "/images/farms/solar-fr.svg"
  },
  {
    id: "farm-solar-es",
    name: "Valencia Sun Grid",
    type: "SOLAR",
    country: "ES",
    city: "Valencia",
    lat: 39.4699,
    lng: -0.3763,
    status: "LIVE",
    capacityMW: 54,
    expectedAnnualMWh: 93200,
    riskScore: 44,
    riskBadge: "MEDIUM",
    pricePerShareUSD: 118,
    sharesAvailable: 14500,
    totalSharesSold: 22000,
    kpis: { loadFactorPct: 25, uptimePct: 97.9, curtailmentPct: 2.8, lastMonthMWh: 7650 },
    timeline: [
      { date: "2023-04", title: "Signature", description: "Contrat terrain + raccordement." },
      { date: "2023-11", title: "Construction", description: "Montage structures." },
      { date: "2024-06", title: "Commissioning", description: "Tests electriques complets." },
      { date: "2024-08", title: "Live", description: "Passage en exploitation." }
    ],
    dataRoom: [
      { title: "Insurance Terms", type: "PDF", url: "#" },
      { title: "Grid Access", type: "DOC", url: "#" }
    ],
    productionSeries: monthlySeries(7600, 520000),
    incidents: [],
    image: "/images/farms/solar-es.svg"
  },
  {
    id: "farm-wind-de",
    name: "Nordwind Bremen",
    type: "WIND",
    country: "DE",
    city: "Bremen",
    lat: 53.0793,
    lng: 8.8017,
    status: "LIVE",
    capacityMW: 72,
    expectedAnnualMWh: 189000,
    riskScore: 37,
    riskBadge: "LOW",
    pricePerShareUSD: 142,
    sharesAvailable: 9900,
    totalSharesSold: 26000,
    kpis: { loadFactorPct: 34, uptimePct: 97.2, curtailmentPct: 1.2, lastMonthMWh: 15320 },
    timeline: [
      { date: "2022-12", title: "Signature", description: "Permis et contrat O&M." },
      { date: "2023-07", title: "Construction", description: "Mise en place turbines." },
      { date: "2024-01", title: "Commissioning", description: "Essais rotor et poste." },
      { date: "2024-02", title: "Live", description: "Production en continu." }
    ],
    dataRoom: [
      { title: "Wind Resource Study", type: "PDF", url: "#" },
      { title: "Maintenance SLA", type: "PDF", url: "#" }
    ],
    productionSeries: monthlySeries(15000, 880000),
    incidents: [{ date: "2025-11-18", severity: "MEDIUM", title: "Arret turbine", description: "Alerte vibration sur turbine #4." }],
    image: "/images/farms/wind-de.svg"
  },
  {
    id: "farm-wind-dk",
    name: "Aarhus Wind Park",
    type: "WIND",
    country: "DK",
    city: "Aarhus",
    lat: 56.1629,
    lng: 10.2039,
    status: "MAINTENANCE",
    capacityMW: 61,
    expectedAnnualMWh: 166000,
    riskScore: 63,
    riskBadge: "MEDIUM",
    pricePerShareUSD: 135,
    sharesAvailable: 16000,
    totalSharesSold: 20000,
    kpis: { loadFactorPct: 31, uptimePct: 94.8, curtailmentPct: 3.1, lastMonthMWh: 12200 },
    timeline: [
      { date: "2023-01", title: "Signature", description: "Contrats de fourniture turbines." },
      { date: "2023-08", title: "Construction", description: "Installation offshore legere." },
      { date: "2024-04", title: "Commissioning", description: "Validation reseau danois." },
      { date: "2024-06", title: "Live", description: "Demarrage commercial." }
    ],
    dataRoom: [
      { title: "Inspection Report", type: "PDF", url: "#" },
      { title: "Grid Settlement", type: "XLS", url: "#" }
    ],
    productionSeries: monthlySeries(12400, 740000),
    incidents: [{ date: "2026-01-04", severity: "HIGH", title: "Roulement principal", description: "Maintenance corrective en cours." }],
    image: "/images/farms/wind-dk.svg"
  },
  {
    id: "farm-hydro-no",
    name: "Fjord Hydro North",
    type: "HYDRO",
    country: "NO",
    city: "Bergen",
    lat: 60.3913,
    lng: 5.3221,
    status: "LIVE",
    capacityMW: 46,
    expectedAnnualMWh: 175000,
    riskScore: 28,
    riskBadge: "LOW",
    pricePerShareUSD: 151,
    sharesAvailable: 8700,
    totalSharesSold: 24000,
    kpis: { loadFactorPct: 43, uptimePct: 99.1, curtailmentPct: 0.5, lastMonthMWh: 14780 },
    timeline: [
      { date: "2022-10", title: "Signature", description: "Concession hydraulique." },
      { date: "2023-05", title: "Construction", description: "Remise a niveau turbines." },
      { date: "2023-12", title: "Commissioning", description: "Essais debit charge." },
      { date: "2024-01", title: "Live", description: "Production base." }
    ],
    dataRoom: [
      { title: "Hydrology Study", type: "PDF", url: "#" },
      { title: "Dam Safety", type: "PDF", url: "#" }
    ],
    productionSeries: monthlySeries(14200, 830000),
    incidents: [],
    image: "/images/farms/hydro-no.svg"
  },
  {
    id: "farm-hydro-ch",
    name: "Alpine Hydro Vault",
    type: "HYDRO",
    country: "CH",
    city: "Sion",
    lat: 46.2331,
    lng: 7.3606,
    status: "BUILDING",
    capacityMW: 29,
    expectedAnnualMWh: 88000,
    riskScore: 55,
    riskBadge: "MEDIUM",
    pricePerShareUSD: 111,
    sharesAvailable: 30000,
    totalSharesSold: 9000,
    kpis: { loadFactorPct: 0, uptimePct: 0, curtailmentPct: 0, lastMonthMWh: 0 },
    timeline: [
      { date: "2025-02", title: "Signature", description: "Accords de chantier signes." },
      { date: "2025-12", title: "Construction", description: "Travaux en cours." },
      { date: "2026-09", title: "Commissioning", description: "Mise en service prevue." }
    ],
    dataRoom: [
      { title: "Construction Schedule", type: "PDF", url: "#" },
      { title: "Budget Breakdown", type: "XLS", url: "#" }
    ],
    productionSeries: monthlySeries(1200, 90000),
    incidents: [],
    image: "/images/farms/hydro-ch.svg"
  }
];
