import { RiskBadge } from "@/lib/types";

export const formatUSD = (value: number, digits = 2) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value || 0);

export const shortAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

export const riskLabel = (risk: RiskBadge) => {
  if (risk === "LOW") return "Risque faible";
  if (risk === "MEDIUM") return "Risque moyen";
  return "Risque élevé";
};

export const farmTypeLabel = (type: "SOLAR" | "WIND" | "HYDRO") => {
  if (type === "SOLAR") return "Solaire";
  if (type === "WIND") return "Eolien";
  return "Hydraulique";
};

export const farmStatusLabel = (status: "FUNDING" | "BUILDING" | "LIVE" | "MAINTENANCE") => {
  if (status === "FUNDING") return "Financement";
  if (status === "BUILDING") return "Construction";
  if (status === "LIVE") return "En production";
  return "Maintenance";
};

export const txTypeLabel = (type: "DEPOSIT" | "BUY_SHARES" | "SELL_SHARES" | "CLAIM" | "BUY_BASKET") => {
  if (type === "DEPOSIT") return "Depot";
  if (type === "BUY_SHARES") return "Achat de parts";
  if (type === "SELL_SHARES") return "Vente de parts";
  if (type === "CLAIM") return "Retrait rendement";
  return "Achat de panier";
};

export const epochStatusLabel = (status: "ANNOUNCED" | "FUNDED" | "CLAIMABLE") => {
  if (status === "ANNOUNCED") return "Annonce";
  if (status === "FUNDED") return "Finance";
  return "Retirable";
};

export const fakeHash = () =>
  `0x${Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64)}`;

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
