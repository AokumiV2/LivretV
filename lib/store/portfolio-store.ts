"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import dayjs from "dayjs";
import { baskets } from "@/lib/mock/baskets";
import { epochs } from "@/lib/mock/epochs";
import { farms } from "@/lib/mock/farms";
import { useFarmStore } from "@/lib/store/farm-store";
import { Basket, Position, Transaction } from "@/lib/types";
import { uid } from "@/lib/utils/format";
import { useAuthStore } from "@/lib/store/auth-store";

type BasketHolding = { basketId: string; units: number; avgBuyPriceUSD: number };

type PortfolioState = {
  cashUSD: number;
  positions: Record<string, Position>;
  baskets: Record<string, BasketHolding>;
  transactions: Transaction[];
  claimedEpochIds: string[];
  buyShares: (farmId: string, amountUSD?: number, shares?: number) => void;
  sellShares: (farmId: string, shares: number) => void;
  buyBasket: (basketId: string, amountUSD: number) => void;
  claimRewards: (farmId?: string) => number;
  claimableByFarm: (farmId: string) => number;
  totalClaimable: () => number;
  toggleAutoClaim: (value: boolean) => void;
  toggleAutoReinvest: (value: boolean) => void;
  reset: () => void;
};

const initialCash = 25000;
const feeRate = 0.005;
const farmById = Object.fromEntries(farms.map((f) => [f.id, f]));
const basketById = Object.fromEntries(baskets.map((b) => [b.id, b]));

const tx = (type: Transaction["type"], amountUSD: number, meta: Transaction["meta"]): Transaction => ({
  id: uid(),
  type,
  amountUSD,
  meta,
  timestamp: new Date().toISOString()
});

const allEpochs = () => [...epochs, ...useFarmStore.getState().extraEpochs];

const computeClaimForFarm = (farmId: string, shares: number, claimedEpochIds: string[]) => {
  const farm = farmById[farmId];
  if (!farm || shares <= 0) return 0;
  return allEpochs()
    .filter((e) => e.farmId === farmId && (e.status === "FUNDED" || e.status === "CLAIMABLE") && !claimedEpochIds.includes(e.id))
    .reduce((sum, epoch) => sum + epoch.totalRevenueUSD * (shares / farm.totalSharesSold), 0);
};

const allocateBasket = (
  basket: Basket,
  amountUSD: number,
  state: PortfolioState
): { positions: Record<string, Position>; txs: Transaction[] } => {
  const nextPositions = { ...state.positions };
  const txs: Transaction[] = [];

  basket.composition.forEach((chunk) => {
    const farm = farmById[chunk.farmId];
    if (!farm) return;
    const gross = amountUSD * (chunk.weightPct / 100);
    const effective = gross / (1 + feeRate);
    const shares = effective / farm.pricePerShareUSD;
    const prev = nextPositions[farm.id] || { farmId: farm.id, shares: 0, avgBuyPriceUSD: farm.pricePerShareUSD };
    const totalCost = prev.avgBuyPriceUSD * prev.shares + effective;
    const totalShares = prev.shares + shares;
    nextPositions[farm.id] = {
      farmId: farm.id,
      shares: totalShares,
      avgBuyPriceUSD: totalShares > 0 ? totalCost / totalShares : farm.pricePerShareUSD
    };
    txs.push(tx("BUY_SHARES", gross, { farmId: farm.id, shares, pricePerShareUSD: farm.pricePerShareUSD }));
  });

  return { positions: nextPositions, txs };
};

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      cashUSD: initialCash,
      positions: {},
      baskets: {},
      transactions: [tx("DEPOSIT", initialCash, {})],
      claimedEpochIds: [],
      buyShares: (farmId, amountUSD, sharesInput) => {
        const farm = farmById[farmId];
        if (!farm) return;
        set((state) => {
          const shares = sharesInput ?? (amountUSD || 0) / farm.pricePerShareUSD;
          if (shares <= 0) return state;
          const effective = shares * farm.pricePerShareUSD;
          const total = effective * (1 + feeRate);
          if (state.cashUSD < total) return state;
          const prev = state.positions[farmId] || { farmId, shares: 0, avgBuyPriceUSD: farm.pricePerShareUSD };
          const totalCost = prev.avgBuyPriceUSD * prev.shares + effective;
          const totalShares = prev.shares + shares;
          return {
            cashUSD: state.cashUSD - total,
            positions: {
              ...state.positions,
              [farmId]: {
                farmId,
                shares: totalShares,
                avgBuyPriceUSD: totalCost / totalShares
              }
            },
            transactions: [tx("BUY_SHARES", total, { farmId, shares, pricePerShareUSD: farm.pricePerShareUSD }), ...state.transactions]
          };
        });
      },
      sellShares: (farmId, shares) => {
        const farm = farmById[farmId];
        if (!farm) return;
        set((state) => {
          const prev = state.positions[farmId];
          if (!prev || shares <= 0 || prev.shares < shares) return state;
          const gross = shares * farm.pricePerShareUSD;
          const net = gross * (1 - feeRate);
          const remaining = prev.shares - shares;
          const nextPositions = { ...state.positions };
          if (remaining <= 0.0001) delete nextPositions[farmId];
          else nextPositions[farmId] = { ...prev, shares: remaining };
          return {
            cashUSD: state.cashUSD + net,
            positions: nextPositions,
            transactions: [tx("SELL_SHARES", net, { farmId, shares, pricePerShareUSD: farm.pricePerShareUSD }), ...state.transactions]
          };
        });
      },
      buyBasket: (basketId, amountUSD) => {
        const basket = basketById[basketId];
        if (!basket || amountUSD <= 0) return;
        set((state) => {
          if (state.cashUSD < amountUSD) return state;
          const units = amountUSD / basket.pricePerUnitUSD;
          const prev = state.baskets[basketId] || { basketId, units: 0, avgBuyPriceUSD: basket.pricePerUnitUSD };
          const holdings = {
            ...state.baskets,
            [basketId]: {
              basketId,
              units: prev.units + units,
              avgBuyPriceUSD:
                (prev.avgBuyPriceUSD * prev.units + amountUSD) /
                (prev.units + units)
            }
          };
          const { positions, txs } = allocateBasket(basket, amountUSD, state as PortfolioState);
          return {
            cashUSD: state.cashUSD - amountUSD,
            baskets: holdings,
            positions,
            transactions: [tx("BUY_BASKET", amountUSD, { basketId }), ...txs, ...state.transactions]
          };
        });
      },
      claimableByFarm: (farmId) => {
        const state = get();
        const pos = state.positions[farmId];
        return computeClaimForFarm(farmId, pos?.shares || 0, state.claimedEpochIds);
      },
      totalClaimable: () => {
        const state = get();
        return Object.values(state.positions).reduce(
          (sum, pos) => sum + computeClaimForFarm(pos.farmId, pos.shares, state.claimedEpochIds),
          0
        );
      },
      claimRewards: (farmId) => {
        const state = get();
        const farmIds = farmId ? [farmId] : Object.keys(state.positions);
        let totalClaimed = 0;
        const claimEpochIds = [...state.claimedEpochIds];
        farmIds.forEach((id) => {
          const farm = farmById[id];
          const pos = state.positions[id];
          if (!farm || !pos) return;
          allEpochs().forEach((epoch) => {
            if (
              epoch.farmId === id &&
              (epoch.status === "FUNDED" || epoch.status === "CLAIMABLE") &&
              !claimEpochIds.includes(epoch.id)
            ) {
              totalClaimed += epoch.totalRevenueUSD * (pos.shares / farm.totalSharesSold);
              claimEpochIds.push(epoch.id);
            }
          });
        });
        if (totalClaimed <= 0) return 0;
        const auth = useAuthStore.getState();
        const autoReinvest = auth.user?.settings.autoReinvest;
        const preferredBasketId = auth.user?.settings.preferredBasketId;
        set((curr) => ({
          cashUSD: curr.cashUSD + totalClaimed,
          claimedEpochIds: claimEpochIds,
          transactions: [tx("CLAIM", totalClaimed, { epochId: claimEpochIds.join(",") }), ...curr.transactions]
        }));

        if (autoReinvest && preferredBasketId) {
          get().buyBasket(preferredBasketId, totalClaimed);
        }

        return totalClaimed;
      },
      toggleAutoClaim: (value) => {
        useAuthStore.getState().setSetting("autoClaim", value);
        if (value) {
          useAuthStore.getState().setSetting("lastAutoClaimAt", dayjs().toISOString());
        }
      },
      toggleAutoReinvest: (value) => useAuthStore.getState().setSetting("autoReinvest", value),
      reset: () =>
        set({
          cashUSD: initialCash,
          positions: {},
          baskets: {},
          transactions: [tx("DEPOSIT", initialCash, {})],
          claimedEpochIds: []
        })
    }),
    {
      name: "livretc-portfolio",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
