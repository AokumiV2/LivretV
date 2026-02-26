"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { secondaryOrders } from "@/lib/mock/orders";
import { SecondaryOrder } from "@/lib/types";
import { uid } from "@/lib/utils/format";

type MarketState = {
  orders: SecondaryOrder[];
  placeOrder: (farmId: string, shares: number, askPricePerShareUSD: number) => void;
  fillOrder: (orderId: string) => SecondaryOrder | undefined;
  cancelOrder: (orderId: string) => void;
};

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      orders: secondaryOrders,
      placeOrder: (farmId, shares, askPricePerShareUSD) =>
        set((state) => ({
          orders: [
            {
              id: uid(),
              farmId,
              shares,
              askPricePerShareUSD,
              sellerAddress: `0x${Math.random().toString(16).slice(2, 14)}...`,
              status: "OPEN"
            },
            ...state.orders
          ]
        })),
      fillOrder: (orderId) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order || order.status !== "OPEN") return undefined;
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, status: "FILLED" } : o))
        }));
        return order;
      },
      cancelOrder: (orderId) =>
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" } : o))
        }))
    }),
    {
      name: "livretc-market",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
