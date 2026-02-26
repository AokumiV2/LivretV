"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { usePortfolioStore } from "@/lib/store/portfolio-store";
import { shortAddress } from "@/lib/utils/format";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setSetting = useAuthStore((s) => s.setSetting);
  const resetAuth = useAuthStore((s) => s.reset);
  const resetPortfolio = usePortfolioStore((s) => s.reset);
  const [showAddress, setShowAddress] = useState(false);

  if (!user) return null;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Parametres</h1>
      <section className="card space-y-2">
        <h2 className="font-semibold">Profil</h2>
        <p className="text-sm">Email: {user.email}</p>
        <p className="text-sm">Compte intelligent: {showAddress ? user.smartAccountAddress : shortAddress(user.smartAccountAddress)}</p>
        <button className="btn-soft" onClick={() => setShowAddress((s) => !s)}>Afficher</button>
      </section>
      <section className="card space-y-3">
        <h2 className="font-semibold">Preferences</h2>
        <label className="flex items-center justify-between text-sm"><span>Retrait automatique</span><input type="checkbox" checked={user.settings.autoClaim} onChange={(e) => setSetting("autoClaim", e.target.checked)} /></label>
        <label className="flex items-center justify-between text-sm"><span>Reinvestissement auto</span><input type="checkbox" checked={user.settings.autoReinvest} onChange={(e) => setSetting("autoReinvest", e.target.checked)} /></label>
        <label className="flex items-center justify-between text-sm"><span>Notifications email</span><input type="checkbox" checked={user.settings.notifications.email} onChange={(e) => setSetting("notifications", { ...user.settings.notifications, email: e.target.checked })} /></label>
        <label className="flex items-center justify-between text-sm"><span>Notifications mobile</span><input type="checkbox" checked={user.settings.notifications.push} onChange={(e) => setSetting("notifications", { ...user.settings.notifications, push: e.target.checked })} /></label>
      </section>
      <section className="card">
        <h2 className="font-semibold text-bad">Zone sensible</h2>
        <button className="btn-soft mt-3" onClick={() => { localStorage.clear(); resetAuth(); resetPortfolio(); window.location.href = "/"; }}>Reinitialiser les donnees locales</button>
      </section>
    </div>
  );
}
