"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Award, LogOut, Trash2 } from "lucide-react";
import { HAS_DB, store } from "@/lib/storage/adapter";
import type { ProjectKind, ProjectRecord } from "@/lib/storage/types";
import {
  badgesObtenus,
  contexteBadges,
  niveau,
  prochaineLecon,
  progressionParcours,
  useProgress,
  xpTotal
} from "@/lib/store/progress-store";
import { TOTAL_LESSONS } from "@/content/tracks";
import { Btn, HudLabel, Meter, Tag, cx } from "@/components/ui/primitives";

const KIND_LABEL: Record<ProjectKind, string> = {
  WIRING: "Câblage",
  GRAPH: "Graphe",
  FORGE: "Projet ROS 2"
};

const KIND_HREF: Record<ProjectKind, string> = {
  WIRING: "/lab/wiring",
  GRAPH: "/lab/graph",
  FORGE: "/forge"
};

export function ProfileView() {
  const { progress, profil, pret, hydrate, reinitialiser } = useProgress();
  const [projets, setProjets] = useState<ProjectRecord[]>([]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!pret) return;
    void store.listProjects(Boolean(profil)).then(setProjets);
  }, [pret, profil]);

  const xp = profil?.xp ?? xpTotal(progress);
  const n = niveau(xp);
  const parcours = progressionParcours(progress);
  const termines = Object.values(progress).filter(
    (s) => s.status === "terminee"
  ).length;

  const compteProjets: Record<ProjectKind, number> = {
    WIRING: projets.filter((p) => p.kind === "WIRING").length,
    GRAPH: projets.filter((p) => p.kind === "GRAPH").length,
    FORGE: projets.filter((p) => p.kind === "FORGE").length
  };

  const badges = badgesObtenus(contexteBadges(progress, compteProjets));
  const suivante = prochaineLecon(progress);

  const supprimer = async (id: string) => {
    await store.deleteProject(Boolean(profil), id);
    setProjets((p) => p.filter((x) => x.id !== id));
  };

  const deconnexion = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  };

  if (!pret) {
    return (
      <p className="py-20 text-center text-sm text-muted">Chargement…</p>
    );
  }

  return (
    <div className="space-y-16">
      {/* ─── Identité et niveau ─── */}
      <section className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <HudLabel side="right">
            {profil ? `Connecté · ${profil.email}` : "Progression locale"}
          </HudLabel>
          <h2 className="mega mt-5 text-3xl lg:text-4xl">
            {profil?.pseudo ?? "Visiteur"}
          </h2>

          {!profil && (
            <p className="mt-5 max-w-xl border-l-2 border-accent2/40 bg-accent2/[0.04] px-5 py-4 text-sm leading-relaxed text-ink/75">
              {HAS_DB
                ? "Ta progression est enregistrée dans ce navigateur. Crée un compte pour la retrouver ailleurs."
                : "Cette instance fonctionne sans base de données : ta progression reste dans ce navigateur. C'est le mode par défaut, et il suffit à tout utiliser."}
            </p>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-4">
            {suivante ? (
              <Btn
                href={`/academy/${suivante.track.slug}/${suivante.lesson.slug}`}
                variant="solid"
                size="sm"
              >
                Reprendre · {suivante.lesson.title}
              </Btn>
            ) : (
              <Btn href="/forge" variant="solid" size="sm">
                Cursus terminé — passe à la Forge
              </Btn>
            )}
            {profil && (
              <Btn size="sm" variant="ghost" onClick={deconnexion}>
                <LogOut size={12} />
                Se déconnecter
              </Btn>
            )}
            {!profil && HAS_DB && (
              <Btn href="/connexion" size="sm">
                Se connecter
              </Btn>
            )}
          </div>
        </div>

        <div className="border border-line bg-panel/40 p-6">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-4xl text-accent2">
              {n.niveau}
            </span>
            <span className="hud">Niveau</span>
          </div>
          <Meter value={n.dans} max={n.pour} className="mt-5" />
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            {n.dans} / {n.pour} XP vers le niveau {n.niveau + 1}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-y-5 border-t border-line pt-6">
            <div>
              <dd className="font-display text-xl text-ink">{xp}</dd>
              <dt className="hud mt-1">XP total</dt>
            </div>
            <div>
              <dd className="font-display text-xl text-ink">
                {termines} / {TOTAL_LESSONS}
              </dd>
              <dt className="hud mt-1">Leçons</dt>
            </div>
            <div>
              <dd className="font-display text-xl text-ink">{projets.length}</dd>
              <dt className="hud mt-1">Projets</dt>
            </div>
            <div>
              <dd className="font-display text-xl text-ink">
                {badges.filter((b) => b.obtenu).length} / {badges.length}
              </dd>
              <dt className="hud mt-1">Badges</dt>
            </div>
          </dl>
        </div>
      </section>

      {/* ─── Parcours ─── */}
      <section>
        <HudLabel side="right">Progression par parcours</HudLabel>
        <div className="mt-6 space-y-px bg-line">
          {parcours.map((p) => (
            <Link
              key={p.track.slug}
              href={`/academy/${p.track.slug}`}
              className="group grid gap-4 bg-bg p-6 transition-colors hover:bg-panel sm:grid-cols-[1fr_240px] sm:items-center"
            >
              <div className="flex items-center gap-4">
                <span
                  className="font-display text-2xl font-light"
                  style={{ color: p.track.color }}
                >
                  {String(p.track.index).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-display text-sm uppercase tracking-mega text-ink transition-colors group-hover:text-accent2">
                    {p.track.title}
                  </p>
                  <p className="mt-1 text-xs text-muted">{p.track.tagline}</p>
                </div>
              </div>
              <div>
                <div className="mb-2 flex justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  <span>
                    {p.faites} / {p.total}
                  </span>
                  <span>{Math.round(p.pct)} %</span>
                </div>
                <Meter
                  value={p.faites}
                  max={p.total}
                  tone={p.faites === p.total ? "good" : "accent"}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Badges ─── */}
      <section>
        <div className="flex items-center gap-3">
          <Award size={14} className="text-warn" />
          <HudLabel side="right">Badges</HudLabel>
        </div>
        <div className="mt-6 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((b) => (
            <div
              key={b.id}
              className={cx(
                "bg-bg p-6 transition-opacity",
                !b.obtenu && "opacity-35"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cx(
                    "flex h-8 w-8 items-center justify-center border",
                    b.obtenu ? "border-warn text-warn" : "border-line2 text-line2"
                  )}
                >
                  <Award size={14} />
                </span>
                {b.obtenu && <Tag tone="warn">Obtenu</Tag>}
              </div>
              <p className="mt-4 font-display text-sm uppercase tracking-mega text-ink">
                {b.nom}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Projets ─── */}
      <section>
        <HudLabel side="right">Projets enregistrés</HudLabel>
        <div className="mt-6 space-y-px bg-line">
          {projets.length === 0 && (
            <p className="bg-bg p-8 text-center text-sm text-muted">
              Aucun projet pour l&apos;instant. Ouvre le{" "}
              <Link href="/lab/wiring" className="text-accent2 hover:underline">
                Wiring Lab
              </Link>{" "}
              ou la{" "}
              <Link href="/forge" className="text-accent2 hover:underline">
                Forge
              </Link>
              .
            </p>
          )}
          {projets.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-4 bg-bg px-6 py-4"
            >
              <div className="min-w-0">
                <Link
                  href={KIND_HREF[p.kind]}
                  className="block truncate text-sm text-ink transition-colors hover:text-accent2"
                >
                  {p.name}
                </Link>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  {KIND_LABEL[p.kind]} ·{" "}
                  {new Date(p.updatedAt).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  })}
                </p>
              </div>
              <button
                onClick={() => supprimer(p.id)}
                className="shrink-0 text-muted transition-colors hover:text-bad"
                aria-label="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Zone de réinitialisation ─── */}
      {!profil && termines > 0 && (
        <section className="border-t border-line pt-10">
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Effacer toute la progression enregistrée dans ce navigateur ? Cette action est irréversible."
                )
              ) {
                reinitialiser();
              }
            }}
            className="font-display text-[10px] uppercase tracking-hud text-muted transition-colors hover:text-bad"
          >
            Effacer la progression locale
          </button>
        </section>
      )}
    </div>
  );
}
