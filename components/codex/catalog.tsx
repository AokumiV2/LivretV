"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Category, Component } from "@/content/types";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "@/content/components";
import { Tag, cx } from "@/components/ui/primitives";

const NIVEAUX = ["Débutant", "Intermédiaire", "Avancé"] as const;

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function Catalog({
  components,
  categorieInitiale
}: {
  components: Component[];
  categorieInitiale?: Category;
}) {
  const [q, setQ] = useState("");
  const [cats, setCats] = useState<Category[]>(
    categorieInitiale ? [categorieInitiale] : []
  );
  const [niveaux, setNiveaux] = useState<string[]>([]);
  const [tri, setTri] = useState<"nom" | "prix" | "prix-desc">("nom");

  const resultats = useMemo(() => {
    const nq = norm(q.trim());
    let out = components.filter((c) => {
      if (cats.length && !cats.includes(c.category)) return false;
      if (niveaux.length && !niveaux.includes(c.level)) return false;
      if (nq.length >= 2) {
        const hay = norm(
          [c.name, c.brand, c.tagline, c.description, c.buses.join(" ")].join(" ")
        );
        if (!hay.includes(nq)) return false;
      }
      return true;
    });

    out = [...out].sort((a, b) => {
      if (tri === "prix") return a.price - b.price;
      if (tri === "prix-desc") return b.price - a.price;
      return a.name.localeCompare(b.name, "fr");
    });

    return out;
  }, [components, q, cats, niveaux, tri]);

  const toggle = <T,>(liste: T[], set: (v: T[]) => void, v: T) => {
    set(liste.includes(v) ? liste.filter((x) => x !== v) : [...liste, v]);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-14">
      {/* ─── Filtres ─── */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Chercher…"
            className="w-full border border-line bg-panel/50 py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent2"
          />
        </div>

        <div className="mt-8">
          <p className="hud mb-3">Catégorie</p>
          <div className="space-y-1">
            {CATEGORY_ORDER.map((c) => {
              const n = components.filter((x) => x.category === c).length;
              const actif = cats.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggle(cats, setCats, c)}
                  className={cx(
                    "flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors",
                    actif
                      ? "bg-accent2/[0.08] text-accent2"
                      : "text-muted hover:text-ink"
                  )}
                >
                  <span>{CATEGORY_LABEL[c]}</span>
                  <span className="font-mono text-[11px]">{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <p className="hud mb-3">Niveau</p>
          <div className="space-y-1">
            {NIVEAUX.map((n) => {
              const actif = niveaux.includes(n);
              return (
                <button
                  key={n}
                  onClick={() => toggle(niveaux, setNiveaux, n)}
                  className={cx(
                    "block w-full px-3 py-1.5 text-left text-xs transition-colors",
                    actif
                      ? "bg-accent2/[0.08] text-accent2"
                      : "text-muted hover:text-ink"
                  )}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <p className="hud mb-3">Trier</p>
          <div className="space-y-1">
            {(
              [
                ["nom", "Nom"],
                ["prix", "Prix croissant"],
                ["prix-desc", "Prix décroissant"]
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setTri(v)}
                className={cx(
                  "block w-full px-3 py-1.5 text-left text-xs transition-colors",
                  tri === v ? "text-accent2" : "text-muted hover:text-ink"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {(cats.length > 0 || niveaux.length > 0 || q) && (
          <button
            onClick={() => {
              setCats([]);
              setNiveaux([]);
              setQ("");
            }}
            className="mt-8 w-full border border-line px-3 py-2 font-display text-[10px] uppercase tracking-hud text-muted transition-colors hover:border-bad hover:text-bad"
          >
            Réinitialiser
          </button>
        )}
      </aside>

      {/* ─── Résultats ─── */}
      <div className="min-w-0">
        <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          {resultats.length} composant{resultats.length > 1 ? "s" : ""}
        </p>

        {resultats.length === 0 ? (
          <p className="border border-line bg-panel/30 p-10 text-center text-sm text-muted">
            Aucun composant ne correspond à ces critères.
          </p>
        ) : (
          <div className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
            {resultats.map((c) => (
              <Link
                key={c.id}
                href={`/codex/${c.id}`}
                className="group flex flex-col bg-bg p-6 transition-colors hover:bg-panel"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                    {CATEGORY_LABEL[c.category]}
                  </span>
                  <span className="font-mono text-[11px] text-accent2">
                    {c.price} €
                  </span>
                </div>

                <h3 className="mt-4 text-[15px] leading-snug text-ink transition-colors group-hover:text-accent2">
                  {c.name}
                </h3>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  {c.brand}
                </p>

                <p className="mt-4 flex-1 text-xs leading-relaxed text-muted">
                  {c.tagline}
                </p>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {c.buses.slice(0, 3).map((b) => (
                    <Tag key={b}>{b}</Tag>
                  ))}
                  {c.buses.length > 3 && <Tag>+{c.buses.length - 3}</Tag>}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-line pt-3 font-mono text-[11px] text-muted">
                  <span>
                    {c.voltage.nominal > 0 ? `${c.voltage.nominal} V` : "—"}
                  </span>
                  <span>
                    {c.currentMa.typ > 0 ? `${c.currentMa.typ} mA` : "—"}
                  </span>
                  <span
                    className={cx(
                      c.level === "Débutant" && "text-good",
                      c.level === "Intermédiaire" && "text-warn",
                      c.level === "Avancé" && "text-bad"
                    )}
                  >
                    {c.level}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
