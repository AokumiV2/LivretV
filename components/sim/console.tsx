"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/components/ui/primitives";
import { shortName } from "@/content/msgs";
import type { LigneLog, StatTopic } from "@/lib/sim/types";

/* ══════════════════════════════════════════════════════════════
   La console.

   Trois onglets, trois besoins distincts : ce que le code raconte,
   ce qui circule sur le bus, et — le plus utile — pourquoi un
   abonnement ne reçoit rien.
   ══════════════════════════════════════════════════════════════ */

type Onglet = "journal" | "topics" | "echo";

const COULEURS: Record<LigneLog["niveau"], string> = {
  info: "text-ink",
  warn: "text-warn",
  error: "text-bad",
  debug: "text-muted",
  sortie: "text-accent2",
  systeme: "text-muted"
};

const ETIQUETTES: Record<LigneLog["niveau"], string> = {
  info: "INFO",
  warn: "WARN",
  error: "ERR ",
  debug: "DBG ",
  sortie: "OUT ",
  systeme: "SYS "
};

export function Console({
  lignes,
  topics,
  signalErreur = 0,
  className
}: {
  lignes: LigneLog[];
  topics: StatTopic[];
  /** Compteur incrémenté à chaque erreur : la console revient alors au
   *  journal. Une pile d'appels affichée dans un onglet qu'on ne
   *  regarde pas ne sert à personne. */
  signalErreur?: number;
  className?: string;
}) {
  const [onglet, setOnglet] = useState<Onglet>("journal");
  const [selection, setSelection] = useState<string | null>(null);
  const bas = useRef<HTMLDivElement>(null);
  const [colle, setColle] = useState(true);

  useEffect(() => {
    if (signalErreur > 0) setOnglet("journal");
  }, [signalErreur]);

  useEffect(() => {
    if (onglet === "journal" && colle) {
      bas.current?.scrollIntoView({ block: "end" });
    }
  }, [lignes, onglet, colle]);

  const rejets = topics.flatMap((t) =>
    t.rejets.map((r) => ({ topic: t.topic, ...r }))
  );

  const actif = topics.find((t) => t.topic === selection) ?? topics[0] ?? null;

  return (
    <div className={cx("flex min-h-0 flex-col", className)}>
      <div className="flex shrink-0 items-center gap-px border-b border-line bg-line">
        {(
          [
            ["journal", `Journal${lignes.length ? ` (${lignes.length})` : ""}`],
            ["topics", `Topics (${topics.length})`],
            ["echo", "Echo"]
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setOnglet(id)}
            className={cx(
              "px-4 py-2 font-display text-[10px] uppercase tracking-hud transition-colors",
              onglet === id ? "bg-panel2 text-accent2" : "bg-bg text-muted hover:text-ink"
            )}
          >
            {label}
          </button>
        ))}
        {rejets.length > 0 && (
          <span className="ml-auto mr-3 font-mono text-[10px] text-bad">
            {rejets.length} abonnement{rejets.length > 1 ? "s" : ""} refusé
            {rejets.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {onglet === "journal" && (
        <div
          className="min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-[11.5px] leading-relaxed"
          onScroll={(e) => {
            const el = e.currentTarget;
            setColle(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
          }}
        >
          {lignes.length === 0 && (
            <p className="px-1 py-3 text-muted">
              Rien pour l&apos;instant. Lance la simulation.
            </p>
          )}
          {lignes.map((l) => (
            <div key={l.id} className="flex gap-2 whitespace-pre-wrap break-words">
              <span className="shrink-0 text-line2">{l.t.toFixed(2)}</span>
              <span className={cx("shrink-0", COULEURS[l.niveau])}>
                {ETIQUETTES[l.niveau]}
              </span>
              <span className="shrink-0 text-muted">[{l.node}]</span>
              <span className={cx("min-w-0", COULEURS[l.niveau])}>{l.texte}</span>
            </div>
          ))}
          <div ref={bas} />
        </div>
      )}

      {onglet === "topics" && (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse font-mono text-[11px]">
            <thead className="sticky top-0 bg-panel2">
              <tr className="text-left text-muted">
                <th className="px-3 py-2 font-normal">topic</th>
                <th className="px-3 py-2 font-normal">type</th>
                <th className="px-3 py-2 text-right font-normal">Hz</th>
                <th className="px-3 py-2 text-right font-normal">msgs</th>
                <th className="px-3 py-2 font-normal">abonnés</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => (
                <tr
                  key={t.topic}
                  onClick={() => {
                    setSelection(t.topic);
                    setOnglet("echo");
                  }}
                  className="cursor-pointer border-t border-line hover:bg-panel2/60"
                >
                  <td className="px-3 py-1.5 text-accent2">{t.topic}</td>
                  <td className="px-3 py-1.5 text-muted">{shortName(t.msgType)}</td>
                  <td className="px-3 py-1.5 text-right">{t.hz.toFixed(1)}</td>
                  <td className="px-3 py-1.5 text-right">{t.publies}</td>
                  <td className="px-3 py-1.5 text-muted">
                    {t.subscribers.length || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rejets.length > 0 && (
            <div className="border-t border-bad/30 bg-bad/5 px-3 py-3">
              <p className="font-display text-[10px] uppercase tracking-hud text-bad">
                Liaisons refusées par DDS
              </p>
              <ul className="mt-2 space-y-2">
                {rejets.map((r, i) => (
                  <li key={i} className="text-[11.5px] leading-relaxed text-muted">
                    <span className="font-mono text-bad">{r.topic}</span> →{" "}
                    <span className="font-mono">{r.node}</span> : {r.raison}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {onglet === "echo" && (
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="flex flex-wrap gap-px border-b border-line bg-line">
            {topics.map((t) => (
              <button
                key={t.topic}
                onClick={() => setSelection(t.topic)}
                className={cx(
                  "px-3 py-1.5 font-mono text-[10px] transition-colors",
                  actif?.topic === t.topic
                    ? "bg-panel2 text-accent2"
                    : "bg-bg text-muted hover:text-ink"
                )}
              >
                {t.topic}
              </button>
            ))}
          </div>
          {actif ? (
            <pre className="whitespace-pre-wrap px-3 py-3 font-mono text-[11.5px] leading-relaxed text-ink">
              {actif.dernier
                ? aplatir(actif.dernier).join("\n")
                : "Aucun message publié sur ce topic."}
            </pre>
          ) : (
            <p className="px-3 py-3 font-mono text-[11px] text-muted">
              Aucun topic. Lance la simulation.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Aplatit un message imbriqué façon `ros2 topic echo`. */
function aplatir(o: unknown, prefixe = "", sortie: string[] = []): string[] {
  if (Array.isArray(o)) {
    const apercu = o
      .slice(0, 6)
      .map((v) => (typeof v === "number" ? formater(v) : String(v)))
      .join(", ");
    sortie.push(
      `${prefixe}: [${apercu}${o.length > 6 ? `, … ${o.length} valeurs` : ""}]`
    );
    return sortie;
  }
  if (o && typeof o === "object") {
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      aplatir(v, prefixe ? `${prefixe}.${k}` : k, sortie);
    }
    return sortie;
  }
  sortie.push(`${prefixe}: ${typeof o === "number" ? formater(o) : String(o)}`);
  return sortie;
}

function formater(v: number) {
  if (!Number.isFinite(v)) return v > 0 ? "inf" : "-inf";
  return Number.isInteger(v) ? String(v) : v.toFixed(4);
}
