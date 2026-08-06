"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HAS_DB } from "@/lib/storage/adapter";
import { Btn, HudLabel } from "@/components/ui/primitives";

export function AuthForm({ mode }: { mode: "connexion" | "inscription" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  const inscription = mode === "inscription";

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setOccupe(true);

    try {
      const res = await fetch(`/api/auth/${inscription ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          inscription ? { email, pseudo, password } : { email, password }
        )
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErreur(data.error ?? "Une erreur est survenue");
        return;
      }

      router.push("/profil");
      router.refresh();
    } catch {
      setErreur("Le serveur est injoignable");
    } finally {
      setOccupe(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <HudLabel side="right">
        {inscription ? "Créer un compte" : "Se connecter"}
      </HudLabel>

      <h1 className="mega mt-5 text-3xl lg:text-4xl">
        {inscription ? "Inscription" : "Connexion"}
      </h1>

      {!HAS_DB && (
        <p className="mt-8 border-l-2 border-warn/45 bg-warn/[0.05] px-5 py-4 text-sm leading-relaxed text-ink/75">
          Cette instance fonctionne sans base de données : les comptes sont
          désactivés. Ce n&apos;est pas bloquant — ta progression, tes montages
          et tes projets sont enregistrés dans ce navigateur, et le site
          s&apos;utilise intégralement.
        </p>
      )}

      <form onSubmit={soumettre} className="mt-10 space-y-6">
        <label className="block">
          <span className="hud">Adresse e-mail</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border border-line bg-panel/50 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent2"
          />
        </label>

        {inscription && (
          <label className="block">
            <span className="hud">Pseudo</span>
            <input
              type="text"
              required
              minLength={2}
              maxLength={40}
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              className="mt-2 w-full border border-line bg-panel/50 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent2"
            />
          </label>
        )}

        <label className="block">
          <span className="hud">Mot de passe</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete={inscription ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border border-line bg-panel/50 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent2"
          />
          {inscription && (
            <span className="mt-2 block text-xs text-muted">
              Huit caractères au minimum.
            </span>
          )}
        </label>

        {erreur && (
          <p className="border-l-2 border-bad/50 bg-bad/[0.05] px-4 py-3 text-sm text-ink/80">
            {erreur}
          </p>
        )}

        <Btn type="submit" variant="solid" disabled={occupe} className="w-full">
          {occupe
            ? "Un instant…"
            : inscription
              ? "Créer mon compte"
              : "Se connecter"}
        </Btn>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        {inscription ? (
          <>
            Déjà un compte ?{" "}
            <Link href="/connexion" className="text-accent2 hover:underline">
              Se connecter
            </Link>
          </>
        ) : (
          <>
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="text-accent2 hover:underline">
              S&apos;inscrire
            </Link>
          </>
        )}
      </p>

      <p className="mt-4 text-center text-xs text-muted">
        <Link href="/academy" className="hover:text-ink">
          Continuer sans compte
        </Link>
      </p>
    </div>
  );
}
