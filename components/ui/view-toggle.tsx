"use client";

import { Box, Square } from "lucide-react";
import { cx } from "./primitives";

export type Vue = "2d" | "3d";

/** Bascule 2D / 3D, partagée par la Forge et les deux laboratoires. */
export function ViewToggle({
  vue,
  onChange,
  label2d = "2D",
  label3d = "3D",
  className
}: {
  vue: Vue;
  onChange: (v: Vue) => void;
  label2d?: string;
  label3d?: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Mode d'affichage"
      className={cx("flex gap-px border border-line bg-line", className)}
    >
      {(
        [
          ["2d", label2d, Square],
          ["3d", label3d, Box]
        ] as const
      ).map(([v, l, Icon]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          aria-pressed={vue === v}
          className={cx(
            "flex items-center gap-2 px-4 py-2 font-display text-[10px] uppercase tracking-hud transition-colors",
            vue === v
              ? "bg-panel2 text-accent2"
              : "bg-bg text-muted hover:text-ink"
          )}
        >
          <Icon size={11} />
          {l}
        </button>
      ))}
    </div>
  );
}
