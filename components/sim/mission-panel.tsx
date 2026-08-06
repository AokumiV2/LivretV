"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronRight, Lightbulb, Lock, X } from "lucide-react";
import { Tag, cx } from "@/components/ui/primitives";
import type { Mission, Trace } from "@/lib/sim/types";

/* ══════════════════════════════════════════════════════════════
   Le panneau de mission.

   L'énoncé, les objectifs, les indices. Les indices se dévoilent
   un par un et à la demande : un indice affiché d'office n'est
   plus un indice, c'est la solution.
   ══════════════════════════════════════════════════════════════ */

export function MissionPanel({
  mission,
  trace,
  termine,
  onSolution,
  className
}: {
  mission: Mission;
  trace: Trace | null;
  termine: boolean;
  onSolution: () => void;
  className?: string;
}) {
  const [indices, setIndices] = useState(0);
  const [solutionDemandee, setSolutionDemandee] = useState(false);

  const etats = mission.objectifs.map((o) => ({
    o,
    ok: trace ? Boolean(o.test(trace)) : null
  }));
  const reussis = etats.filter((e) => e.ok).length;

  return (
    <div className={cx("flex min-h-0 flex-col", className)}>
      <div className="min-h-0 flex-1 overflow-auto">
        {/* ── En-tête ── */}
        <div className="border-b border-line px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="accent">Mission {mission.numero}</Tag>
            <Tag>{mission.difficulte}</Tag>
            <Tag>{mission.xp} XP</Tag>
            {termine && <Tag tone="good">Réussie</Tag>}
          </div>
          <h2 className="mt-3 font-display text-lg uppercase tracking-mega text-ink">
            {mission.titre}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            {mission.resume}
          </p>
        </div>

        {/* ── Énoncé ── */}
        <div className="space-y-3 border-b border-line px-5 py-4">
          {mission.enonce.map((p, i) => (
            <p key={i} className="text-[13px] leading-relaxed text-muted">
              {p}
            </p>
          ))}
        </div>

        {/* ── Objectifs ── */}
        <div className="border-b border-line px-5 py-4">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-[10px] uppercase tracking-hud text-muted">
              Objectifs
            </h3>
            <span className="font-mono text-[11px] text-muted">
              {trace ? `${reussis}/${etats.length}` : "—"}
            </span>
          </div>
          <ul className="mt-3 space-y-2.5">
            {etats.map(({ o, ok }) => (
              <li key={o.id} className="flex gap-2.5">
                <span
                  className={cx(
                    "mt-px flex h-4 w-4 shrink-0 items-center justify-center border",
                    ok === null && "border-line2 text-line2",
                    ok === true && "border-good bg-good/10 text-good",
                    ok === false && "border-bad/60 text-bad"
                  )}
                >
                  {ok === true && <Check size={11} strokeWidth={3} />}
                  {ok === false && <X size={11} strokeWidth={3} />}
                </span>
                <span className="min-w-0">
                  <span
                    className={cx(
                      "text-[13px] leading-snug",
                      ok === true ? "text-ink" : "text-muted"
                    )}
                  >
                    {o.label}
                  </span>
                  {ok === false && o.aide && (
                    <span className="mt-1 block text-[12px] leading-relaxed text-warn">
                      {o.aide}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {!trace && (
            <p className="mt-3 text-[12px] text-line2">
              Les objectifs se vérifient à la fin d&apos;un run.
            </p>
          )}
        </div>

        {/* ── Indices ── */}
        <div className="border-b border-line px-5 py-4">
          <h3 className="font-display text-[10px] uppercase tracking-hud text-muted">
            Indices
          </h3>
          <ul className="mt-3 space-y-2.5">
            {mission.indices.slice(0, indices).map((h, i) => (
              <li key={i} className="flex gap-2.5">
                <Lightbulb size={13} className="mt-0.5 shrink-0 text-warn" />
                <span className="text-[13px] leading-relaxed text-muted">{h}</span>
              </li>
            ))}
          </ul>
          {indices < mission.indices.length ? (
            <button
              onClick={() => setIndices((n) => n + 1)}
              className="mt-3 inline-flex items-center gap-2 border border-line2 px-3 py-1.5 font-display text-[10px] uppercase tracking-hud text-muted transition-colors hover:border-warn/50 hover:text-warn"
            >
              <Lightbulb size={11} />
              Indice {indices + 1} sur {mission.indices.length}
            </button>
          ) : (
            <p className="mt-3 text-[12px] text-line2">
              Tous les indices sont affichés.
            </p>
          )}
        </div>

        {/* ── Solution ── */}
        <div className="border-b border-line px-5 py-4">
          <h3 className="font-display text-[10px] uppercase tracking-hud text-muted">
            Solution
          </h3>
          {!solutionDemandee ? (
            <>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                Elle remplace ton code dans l&apos;éditeur. Ce n&apos;est pas une
                défaite — lire une solution qu&apos;on a cherchée apprend
                beaucoup. La lire avant d&apos;avoir cherché n&apos;apprend rien.
              </p>
              <button
                onClick={() => setSolutionDemandee(true)}
                className="mt-3 inline-flex items-center gap-2 border border-line2 px-3 py-1.5 font-display text-[10px] uppercase tracking-hud text-muted transition-colors hover:border-line2 hover:text-ink"
              >
                <Lock size={11} />
                Afficher quand même
              </button>
            </>
          ) : (
            <button
              onClick={onSolution}
              className="mt-3 inline-flex items-center gap-2 border border-accent2/40 bg-accent2/5 px-3 py-1.5 font-display text-[10px] uppercase tracking-hud text-accent2 transition-colors hover:bg-accent2/10"
            >
              <ChevronRight size={11} />
              Charger la solution dans l&apos;éditeur
            </button>
          )}
        </div>

        {/* ── Pour aller plus loin ── */}
        <div className="px-5 py-4">
          <h3 className="font-display text-[10px] uppercase tracking-hud text-muted">
            Sur le site
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {mission.concepts.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="border border-line2 px-3 py-1.5 font-mono text-[11px] text-muted transition-colors hover:border-accent2/50 hover:text-accent2"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
