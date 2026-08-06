"use client";

import { useState } from "react";
import { ArrowLeft, Check, RotateCcw, Wrench } from "lucide-react";
import {
  TROUBLE_ROOT,
  getTroubleLeaf,
  getTroubleNode,
  isLeaf
} from "@/content/troubleshoot";
import { Btn, HudLabel, cx } from "@/components/ui/primitives";

export function Troubleshooter() {
  const [chemin, setChemin] = useState<string[]>([TROUBLE_ROOT]);
  const [copie, setCopie] = useState<string | null>(null);

  const courant = chemin[chemin.length - 1];
  const node = getTroubleNode(courant);
  const feuille = isLeaf(courant) ? getTroubleLeaf(courant) : undefined;

  const avancer = (id: string) => setChemin((c) => [...c, id]);
  const reculer = () => setChemin((c) => (c.length > 1 ? c.slice(0, -1) : c));
  const recommencer = () => setChemin([TROUBLE_ROOT]);

  const copier = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t);
      setCopie(t);
      window.setTimeout(() => setCopie(null), 1600);
    } catch {
      // Presse-papiers indisponible.
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Fil d'Ariane */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {chemin.map((id, i) => (
          <span key={`${id}-${i}`} className="flex items-center gap-2">
            <span
              className={cx(
                "h-1.5 w-1.5 rounded-full",
                i === chemin.length - 1
                  ? isLeaf(id)
                    ? "bg-good"
                    : "bg-accent2"
                  : "bg-line2"
              )}
            />
            {i < chemin.length - 1 && (
              <span className="h-px w-6 bg-line2" />
            )}
          </span>
        ))}
        <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-muted">
          Étape {chemin.length}
        </span>
      </div>

      {/* Question */}
      {node && (
        <div>
          <HudLabel side="right">Question</HudLabel>
          <h2 className="mega mt-5 text-2xl lg:text-3xl">{node.question}</h2>
          {node.hint && (
            <p className="mt-4 border-l-2 border-accent2/40 bg-accent2/[0.04] px-5 py-3 font-mono text-xs leading-relaxed text-ink/70">
              {node.hint}
            </p>
          )}

          <div className="mt-8 space-y-px bg-line">
            {node.options.map((o) => (
              <button
                key={o.next + o.label}
                onClick={() => avancer(o.next)}
                className="group flex w-full items-center justify-between gap-4 bg-bg px-6 py-5 text-left transition-colors hover:bg-panel"
              >
                <span className="text-sm leading-relaxed text-ink/85 transition-colors group-hover:text-accent2">
                  {o.label}
                </span>
                <span className="shrink-0 font-mono text-xs text-line2 transition-colors group-hover:text-accent2">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Verdict */}
      {feuille && (
        <div>
          <div className="flex items-center gap-3">
            <Wrench size={14} className="text-good" />
            <HudLabel side="right">Diagnostic</HudLabel>
          </div>

          <h2 className="mega mt-5 text-2xl text-good lg:text-3xl">
            {feuille.verdict}
          </h2>

          <p className="mt-6 text-[15px] leading-relaxed text-ink/80">
            {feuille.cause}
          </p>

          <div className="mt-10">
            <HudLabel side="right">Ce qu&apos;il faut faire</HudLabel>
            <ol className="mt-5 space-y-4">
              {feuille.fix.map((f, i) => (
                <li key={i} className="flex gap-4">
                  <span className="mt-[3px] shrink-0 font-mono text-[11px] text-accent2">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm leading-relaxed text-ink/80">{f}</span>
                </li>
              ))}
            </ol>
          </div>

          {feuille.commands && feuille.commands.length > 0 && (
            <div className="mt-10">
              <HudLabel side="right">Commandes</HudLabel>
              <div className="mt-5 border border-line bg-[#07070d] p-4 font-mono text-[12px] leading-relaxed">
                {feuille.commands.map((c) => (
                  <button
                    key={c}
                    onClick={() => copier(c)}
                    className="group flex w-full gap-2 whitespace-pre text-left"
                    title="Cliquer pour copier"
                  >
                    <span className="shrink-0 text-good">$</span>
                    <span className="text-ink transition-colors group-hover:text-accent2">
                      {c}
                    </span>
                    {copie === c && (
                      <Check size={11} className="ml-auto mt-1 text-good" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between border-t border-line pt-6">
        <Btn size="sm" onClick={reculer} disabled={chemin.length === 1}>
          <ArrowLeft size={12} />
          Retour
        </Btn>
        <Btn size="sm" variant="ghost" onClick={recommencer}>
          <RotateCcw size={12} />
          Recommencer
        </Btn>
      </div>
    </div>
  );
}
