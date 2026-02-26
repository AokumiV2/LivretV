"use client";

import { create } from "zustand";
import { uid } from "@/lib/utils/format";

export type Toast = { id: string; title: string; description?: string };

type UIState = {
  toasts: Toast[];
  pushToast: (title: string, description?: string) => void;
  removeToast: (id: string) => void;
};

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  pushToast: (title, description) => {
    const id = uid();
    set((state) => ({ toasts: [{ id, title, description }, ...state.toasts].slice(0, 4) }));
    setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), 3500);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
}));
