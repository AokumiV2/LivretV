"use client";

import type { VueNom } from "./scene-canvas";
import { cx } from "@/components/ui/primitives";

const VUES: { id: VueNom; label: string }[] = [
  { id: "3/4", label: "3/4" },
  { id: "dessus", label: "Dessus" },
  { id: "avant", label: "Avant" },
  { id: "cote", label: "Côté" },
  { id: "arriere", label: "Arrière" }
];

/**
 * Points de vue prédéfinis. Faire tourner une scène à la souris jusqu'à
 * trouver le bon angle est fastidieux ; cinq boutons suffisent.
 */
export function ViewButtons({
  vue,
  onChange,
  className
}: {
  vue: VueNom;
  onChange: (v: VueNom) => void;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-wrap gap-px bg-line", className)}>
      {VUES.map((v) => (
        <button
          key={v.id}
          onClick={() => onChange(v.id)}
          aria-pressed={vue === v.id}
          className={cx(
            "px-3.5 py-2 font-display text-[11px] uppercase tracking-[0.16em] transition-colors",
            vue === v.id
              ? "bg-panel2 text-accent2"
              : "bg-bg text-muted hover:text-ink"
          )}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
