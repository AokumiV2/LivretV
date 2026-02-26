"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/lib/types";
import { uid } from "@/lib/utils/format";

type AuthState = {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
  createSmartAccount: () => string;
  setSetting: <K extends keyof User["settings"]>(key: K, value: User["settings"][K]) => void;
  reset: () => void;
};

const newAddress = () => `0x${Math.random().toString(16).slice(2).padEnd(40, "0").slice(0, 40)}`;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      login: (email) => {
        if (get().user) return;
        set({
          user: {
            id: uid(),
            email,
            displayName: email.split("@")[0],
            smartAccountAddress: newAddress(),
            createdAt: new Date().toISOString(),
            settings: {
              autoClaim: false,
              autoReinvest: false,
              preferredBasketId: "basket-diversified",
              notifications: { email: true, push: false }
            }
          }
        });
      },
      logout: () => set({ user: null }),
      createSmartAccount: () => {
        const address = newAddress();
        set((state) =>
          state.user
            ? { user: { ...state.user, smartAccountAddress: address } }
            : state
        );
        return address;
      },
      setSetting: (key, value) =>
        set((state) =>
          state.user
            ? {
                user: {
                  ...state.user,
                  settings: {
                    ...state.user.settings,
                    [key]: value
                  }
                }
              }
            : state
        ),
      reset: () => set({ user: null })
    }),
    {
      name: "livretc-auth",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
