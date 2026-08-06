"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { create } from "zustand";
import { search, type SearchEntry, type SearchKind } from "@/lib/search";
import { cx } from "@/components/ui/primitives";

type PaletteState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export const useCommandPalette = create<PaletteState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen }))
}));

const KIND_TONE: Record<SearchKind, string> = {
  Leçon: "text-accent2 border-accent2/40",
  Composant: "text-good border-good/40",
  Glossaire: "text-warn border-warn/40",
  Commande: "text-muted border-line2",
  Archétype: "text-bad border-bad/40",
  Page: "text-muted border-line2"
};

const SUGGESTIONS = [
  "QoS",
  "TF2",
  "Nav2",
  "LiDAR",
  "encodeur",
  "micro-ROS",
  "odométrie",
  "I2C"
];

export function CommandPalette() {
  const router = useRouter();
  const { isOpen, close, toggle } = useCommandPalette();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => search(q), [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, close]);

  useEffect(() => {
    if (isOpen) {
      setQ("");
      setCursor(0);
      // Laisse le temps au champ d'être monté avant de le focaliser
      const id = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(id);
    }
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => setCursor(0), [q]);

  const aller = (e: SearchEntry) => {
    close();
    router.push(e.href);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && results[cursor]) {
      e.preventDefault();
      aller(results[cursor]);
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-i="${cursor}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[10vh]">
      <div className="absolute inset-0 bg-bg/85 backdrop-blur-sm" onClick={close} />

      <div className="relative w-full max-w-2xl animate-fade-up border border-line2 bg-panel shadow-panel">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <Search size={16} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Chercher une leçon, un composant, une commande…"
            className="w-full bg-transparent font-sans text-sm text-ink outline-none placeholder:text-muted/70"
          />
          <kbd className="hidden shrink-0 border border-line2 px-1.5 py-0.5 font-mono text-[9px] text-muted sm:block">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="no-scrollbar max-h-[55vh] overflow-y-auto">
          {q.length < 2 && (
            <div className="px-5 py-6">
              <p className="hud mb-4">Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setQ(s)}
                    className="border border-line px-3 py-1.5 font-mono text-[11px] text-muted transition-colors hover:border-accent2 hover:text-accent2"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {q.length >= 2 && results.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-muted">
              Aucun résultat pour «&nbsp;{q}&nbsp;»
            </p>
          )}

          {results.map((r, i) => (
            <button
              key={`${r.kind}-${r.href}-${i}`}
              data-i={i}
              onClick={() => aller(r)}
              onMouseEnter={() => setCursor(i)}
              className={cx(
                "flex w-full items-center gap-4 border-b border-line/60 px-5 py-3 text-left transition-colors",
                i === cursor ? "bg-panel2" : "hover:bg-panel2/60"
              )}
            >
              <span
                className={cx(
                  "shrink-0 border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest",
                  KIND_TONE[r.kind]
                )}
              >
                {r.kind}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink">{r.title}</span>
                <span className="block truncate text-xs text-muted">{r.sub}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-line px-5 py-2.5 font-mono text-[10px] text-muted">
          <span>↑ ↓ naviguer · ⏎ ouvrir</span>
          <span>{results.length > 0 && `${results.length} résultat(s)`}</span>
        </div>
      </div>
    </div>
  );
}
