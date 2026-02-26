import { SecondaryOrder } from "@/lib/types";

export const secondaryOrders: SecondaryOrder[] = [
  { id: "ord-1", farmId: "farm-solar-fr", sellerAddress: "0x8d1c...7f2a", shares: 60, askPricePerShareUSD: 126, status: "OPEN" },
  { id: "ord-2", farmId: "farm-solar-es", sellerAddress: "0x4ac1...13d9", shares: 80, askPricePerShareUSD: 119, status: "OPEN" },
  { id: "ord-3", farmId: "farm-wind-de", sellerAddress: "0x52bf...8aa0", shares: 40, askPricePerShareUSD: 141, status: "OPEN" },
  { id: "ord-4", farmId: "farm-hydro-no", sellerAddress: "0x1ea8...cc90", shares: 22, askPricePerShareUSD: 154, status: "OPEN" },
  { id: "ord-5", farmId: "farm-wind-dk", sellerAddress: "0x9c6d...104f", shares: 70, askPricePerShareUSD: 132, status: "OPEN" }
];
