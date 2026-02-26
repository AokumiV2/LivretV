import { epochs, farms } from "@/lib/mock";
import { Position } from "@/lib/types";

export const currentPrice = (farmId: string) => farms.find((f) => f.id === farmId)?.pricePerShareUSD || 0;

export const positionValue = (position: Position) => position.shares * currentPrice(position.farmId);

export const pnl = (position: Position) => (currentPrice(position.farmId) - position.avgBuyPriceUSD) * position.shares;

export const claimableForPosition = (position: Position, claimedEpochIds: string[]) => {
  const farm = farms.find((f) => f.id === position.farmId);
  if (!farm) return 0;
  return epochs
    .filter((e) => e.farmId === position.farmId && (e.status === "FUNDED" || e.status === "CLAIMABLE") && !claimedEpochIds.includes(e.id))
    .reduce((acc, curr) => acc + curr.totalRevenueUSD * (position.shares / farm.totalSharesSold), 0);
};
