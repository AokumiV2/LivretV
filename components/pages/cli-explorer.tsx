"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Search } from "lucide-react";
import { CLI_COMMANDS, CLI_GROUPS } from "@/content/cli";
import { cx } from "@/components/ui/primitives";

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function CliExplorer() {
  const [q, setQ] = useState("");
  const [groupe, setGroupe] = useState<string | null>(null);
  const [copie, setCopie] = useState<string | null>(null);

  const resultats = useMemo(() => {
    const nq = norm(q.trim());
    return CLI_COMMANDS.filter((c) => {
      if (groupe && c.group !== groupe) return false;
      if (nq.length >= 2) {
        return norm(`${c.cmd} ${c.what} ${c.example}`).includes(nq);
      }
      return true;
    });
  }, [q, groupe]);

  const copier = async (texte: string, cle: string) => {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(cle);
      window.setTimeout(() => setCopie(null), 1600);
    } catch {
      // Presse-papiers indisponible hors contexte sécurisé.
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[200px_1fr] lg:gap-14">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="relative">
          <Search
            size={13}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Chercher…"
            className="w-full border border-line bg-panel/50 py-2.5 pl-8 pr-3 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-accent2"
          />
        </div>

        <div className="mt-6 space-y-1">
          <button
            onClick={() => setGroupe(null)}
            className={cx(
              "block w-full px-3 py-1.5 text-left text-xs transition-colors",
              groupe === null ? "text-accent2" : "text-muted hover:text-ink"
            )}
          >
            Toutes ({CLI_COMMANDS.length})
          </button>
          {CLI_GROUPS.map((g) => {
            const n = CLI_COMMANDS.filter((c) => c.group === g).length;
            return (
              <button
                key={g}
                onClick={() => setGroupe(groupe === g ? null : g)}
                className={cx(
                  "flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors",
                  groupe === g
                    ? "bg-accent2/[0.08] text-accent2"
                    : "text-muted hover:text-ink"
                )}
              >
                <span>{g}</span>
                <span className="font-mono text-[10px]">{n}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="min-w-0 space-y-px bg-line">
        {resultats.map((c) => (
          <div
            key={c.cmd}
            id={c.cmd}
            className="scroll-mt-28 bg-bg p-6 transition-colors hover:bg-panel/60"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <code className="font-mono text-sm text-accent2">{c.cmd}</code>
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
                {c.group}
              </span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted">{c.what}</p>

            <div className="mt-4 border border-line bg-[#07070d]">
              <div className="flex items-center justify-between border-b border-line px-4 py-1.5">
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
                  Exemple
                </span>
                <button
                  onClick={() => copier(c.example, c.cmd)}
                  className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-muted transition-colors hover:text-accent2"
                >
                  {copie === c.cmd ? <Check size={10} /> : <Copy size={10} />}
                  {copie === c.cmd ? "Copié" : "Copier"}
                </button>
              </div>
              <div className="no-scrollbar overflow-x-auto p-4 font-mono text-[12px] leading-relaxed">
                <div className="flex gap-2 whitespace-pre">
                  <span className="shrink-0 text-good">$</span>
                  <span className="text-ink">{c.example}</span>
                </div>
                {c.output && (
                  <div className="mt-2 whitespace-pre text-muted">{c.output}</div>
                )}
              </div>
            </div>
          </div>
        ))}

        {resultats.length === 0 && (
          <p className="bg-bg p-10 text-center text-sm text-muted">
            Aucune commande ne correspond.
          </p>
        )}
      </div>
    </div>
  );
}
