"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { useAuthStore } from "@/lib/store/auth-store";
import { usePortfolioStore } from "@/lib/store/portfolio-store";

export function AuthGate({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState("investor@livretc.com");
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const processedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      processedUserId.current = null;
      return;
    }
    if (processedUserId.current === user.id) return;
    processedUserId.current = user.id;

    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.settings.autoClaim || !currentUser.settings.lastAutoClaimAt) return;
    if (dayjs().diff(dayjs(currentUser.settings.lastAutoClaimAt), "day") < 30) return;

    queueMicrotask(() => {
      usePortfolioStore.getState().claimRewards();
      useAuthStore.getState().setSetting("lastAutoClaimAt", dayjs().toISOString());
    });
  }, [user?.id]);

  if (user) return <>{children}</>;

  return (
    <div className="mx-auto mt-16 grid max-w-4xl gap-5 lg:grid-cols-[1.2fr_1fr]">
      <section className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-[#0e2f25] to-[#081b17] p-6 text-white shadow-soft">
        <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Livret C</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight">Faites travailler votre epargne dans l'energie reelle.</h1>
        <p className="mt-2 text-sm text-emerald-200">Investissez en parts, suivez vos rendements et retirez quand vous voulez.</p>
        <div className="mt-5 grid gap-2 text-sm">
          <p>• Rendements suivis chaque mois</p>
          <p>• Transparence des fermes et des paiements</p>
          <p>• Simulation complete, sans engagement</p>
        </div>
      </section>
      <section className="rounded-2xl border border-line bg-[#091412] p-6 shadow-sm">
      <h2 className="text-xl font-bold">Connexion rapide</h2>
      <p className="mt-1 text-sm text-muted">Accedez a votre espace en moins de 10 secondes.</p>
      <input className="input mt-5" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
      <button className="btn-primary mt-4 w-full" onClick={() => login(email)}>Ouvrir mon espace</button>
      <p className="mt-3 text-xs text-muted">Mode demo: aucune donnee n'est envoyee, tout reste local.</p>
      </section>
    </div>
  );
}
