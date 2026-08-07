"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, Circle, Clipboard, Sparkles } from "lucide-react";
import { EXTRAITS_CODE, analyserCode } from "@/lib/sim/code-analysis";
import { Meter, cx } from "@/components/ui/primitives";

export function CodeCoach({
  missionId,
  code
}: {
  missionId: string;
  code: string;
}) {
  const diagnostics = useMemo(() => analyserCode(missionId, code), [missionId, code]);
  const valides = diagnostics.filter((d) => d.etat === "ok").length;
  const attendus = diagnostics.filter((d) => d.etat !== "attention").length;
  const [copie, setCopie] = useState<string | null>(null);

  const copier = async (id: string, extrait: string) => {
    try {
      await navigator.clipboard.writeText(extrait);
      setCopie(id);
      window.setTimeout(() => setCopie(null), 1600);
    } catch {
      // Le presse-papiers peut être refusé hors contexte sécurisé.
    }
  };

  return (
    <details className="group border-t border-line bg-bg/35">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 marker:hidden">
        <Sparkles size={12} className="text-accent2" />
        <span className="font-display text-[10px] uppercase tracking-hud text-muted">
          Prévol du code
        </span>
        <span className="font-mono text-[11px] text-muted">
          {valides}/{attendus}
        </span>
        <Meter value={valides} max={Math.max(1, attendus)} className="ml-auto w-24" />
        <span className="font-mono text-[10px] text-line2 group-open:hidden">
          ouvrir
        </span>
        <span className="hidden font-mono text-[10px] text-line2 group-open:inline">
          fermer
        </span>
      </summary>

      <div className="border-t border-line px-3 py-3">
        <p className="text-[11.5px] leading-relaxed text-muted">
          Retour instantané sur la structure du fichier. La réussite reste décidée par
          le comportement du robot à la fin du run.
        </p>

        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {diagnostics.map((d) => {
            const Icon = d.etat === "ok" ? Check : d.etat === "attention" ? AlertTriangle : Circle;
            return (
              <li key={d.id} className="flex gap-2 border border-line bg-panel/40 p-2.5">
                <Icon
                  size={12}
                  className={cx(
                    "mt-0.5 shrink-0",
                    d.etat === "ok" && "text-good",
                    d.etat === "a-faire" && "text-line2",
                    d.etat === "attention" && "text-warn"
                  )}
                />
                <span className="min-w-0">
                  <span className="block text-[12px] text-ink/85">{d.label}</span>
                  <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted">
                    {d.detail}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 border-t border-line pt-3">
          <p className="font-display text-[10px] uppercase tracking-hud text-muted">
            Extraits prêts à copier
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXTRAITS_CODE.map((e) => (
              <button
                key={e.id}
                onClick={() => copier(e.id, e.code)}
                title={e.detail}
                className="inline-flex items-center gap-1.5 border border-line2 px-2.5 py-1.5 font-mono text-[10.5px] text-muted transition-colors hover:border-accent2/50 hover:text-accent2"
              >
                {copie === e.id ? <Check size={10} /> : <Clipboard size={10} />}
                {copie === e.id ? "Copié" : e.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}
