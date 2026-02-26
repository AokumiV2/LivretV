"use client";

import { useUIStore } from "@/lib/store/ui-store";

export function ToastProvider() {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="rounded-xl border border-line bg-white p-3 shadow">
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.description && <p className="text-xs text-muted">{toast.description}</p>}
        </div>
      ))}
    </div>
  );
}
