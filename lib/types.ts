export type RiskBadge = "LOW" | "MEDIUM" | "HIGH";

export type User = {
  id: string;
  email: string;
  displayName: string;
  smartAccountAddress: string;
  createdAt: string;
  settings: {
    autoClaim: boolean;
    autoReinvest: boolean;
    preferredBasketId?: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
    lastAutoClaimAt?: string;
  };
};

export type Farm = {
  id: string;
  name: string;
  type: "SOLAR" | "WIND" | "HYDRO";
  country: string;
  city: string;
  lat: number;
  lng: number;
  status: "FUNDING" | "BUILDING" | "LIVE" | "MAINTENANCE";
  capacityMW: number;
  expectedAnnualMWh: number;
  riskScore: number;
  riskBadge: RiskBadge;
  pricePerShareUSD: number;
  sharesAvailable: number;
  totalSharesSold: number;
  kpis: {
    loadFactorPct: number;
    uptimePct: number;
    curtailmentPct: number;
    lastMonthMWh: number;
  };
  timeline: Array<{ date: string; title: string; description: string }>;
  dataRoom: Array<{ title: string; type: string; url: string }>;
  productionSeries: Array<{ date: string; mwh: number; revenueUSD: number }>;
  incidents: Array<{
    date: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    title: string;
    description: string;
  }>;
  image: string;
};

export type Basket = {
  id: string;
  name: string;
  description: string;
  riskBadge: RiskBadge;
  composition: Array<{ farmId: string; weightPct: number }>;
  pricePerUnitUSD: number;
  apyEstimatePct: number;
};

export type Position = {
  farmId: string;
  shares: number;
  avgBuyPriceUSD: number;
};

export type Epoch = {
  id: string;
  farmId: string;
  periodLabel: string;
  totalRevenueUSD: number;
  timestamp: string;
  proofHash: string;
  status: "ANNOUNCED" | "FUNDED" | "CLAIMABLE";
};

export type TxType = "DEPOSIT" | "BUY_SHARES" | "SELL_SHARES" | "CLAIM" | "BUY_BASKET";

export type Transaction = {
  id: string;
  type: TxType;
  timestamp: string;
  amountUSD: number;
  meta: {
    farmId?: string;
    basketId?: string;
    shares?: number;
    epochId?: string;
    pricePerShareUSD?: number;
  };
};

export type SecondaryOrder = {
  id: string;
  farmId: string;
  sellerAddress: string;
  shares: number;
  askPricePerShareUSD: number;
  status: "OPEN" | "FILLED" | "CANCELLED";
};
