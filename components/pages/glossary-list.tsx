"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GLOSSARY, GLOSSARY_CATEGORIES } from "@/content/glossary";
import { Tag, cx } from "@/components/ui/primitives";

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function GlossaryList() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);

  const resultats = useMemo(() => {
    const nq = norm(q.trim());
    return GLOSSARY.filter((g) => {
      if (cat && g.category !== cat) return false;
      if (nq.length >= 2) {
        return norm(`${g.term} ${g.short} ${g.long}`).includes(nq);
      }
      return true;
    }).sort((a, b) => a.term.localeCompare(b.term, "fr"));
  }, [q, cat]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Chercher un terme…"
            className="w-full border border-line bg-panel/50 py-2.5 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-accent2"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCat(null)}
            className={cx(
              "border px-4 py-2 font-display text-[10px] uppercase tracking-hud transition-colors",
              cat === null
                ? "border-accent2 text-accent2"
                : "border-line text-muted hover:text-ink"
            )}
          >
            Tout
          </button>
          {GLOSSARY_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(cat === c ? null : c)}
              className={cx(
                "border px-4 py-2 font-display text-[10px] uppercase tracking-hud transition-colors",
                cat === c
                  ? "border-accent2 text-accent2"
                  : "border-line text-muted hover:text-ink"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted">
        {resultats.length} entrée{resultats.length > 1 ? "s" : ""}
      </p>

      <div className="mt-4 space-y-px bg-line">
        {resultats.map((g) => {
          const actif = ouvert === g.term;
          return (
            <div key={g.term} id={g.term} className="scroll-mt-28 bg-bg">
              <button
                onClick={() => setOuvert(actif ? null : g.term)}
                className="flex w-full items-start justify-between gap-6 p-6 text-left transition-colors hover:bg-panel"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2
                      className={cx(
                        "font-display text-lg uppercase tracking-mega transition-colors",
                        actif ? "text-accent2" : "text-ink"
                      )}
                    >
                      {g.term}
                    </h2>
                    <Tag>{g.category}</Tag>
                  </div>
                  <p className="mt-2 text-sm text-muted">{g.short}</p>
                </div>
                <span className="mt-1 shrink-0 font-mono text-lg text-line2">
                  {actif ? "−" : "+"}
                </span>
              </button>

              {actif && (
                <div className="border-t border-line px-6 pb-6 pt-5">
                  <p className="max-w-3xl text-[15px] leading-relaxed text-ink/80">
                    {g.long}
                  </p>
                  {g.see && g.see.length > 0 && (
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <span className="hud">Voir aussi</span>
                      {g.see.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setQ("");
                            setCat(null);
                            setOuvert(s);
                            document
                              .getElementById(s)
                              ?.scrollIntoView({ block: "center" });
                          }}
                          className="border border-line px-3 py-1 font-mono text-[10px] text-muted transition-colors hover:border-accent2 hover:text-accent2"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {resultats.length === 0 && (
          <p className="bg-bg p-10 text-center text-sm text-muted">
            Aucun terme ne correspond.
          </p>
        )}
      </div>
    </div>
  );
}
