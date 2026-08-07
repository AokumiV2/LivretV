"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Check, ChevronRight, ClipboardCheck } from "lucide-react";
import { Meter, cx } from "@/components/ui/primitives";

type Heading = { id: string; text: string };

export function LessonCompanion({
  lessonKey,
  headings,
  objectives,
  prerequisite,
  quizCount,
  missionCount
}: {
  lessonKey: string;
  headings: Heading[];
  objectives: string[];
  prerequisite?: { title: string; href: string };
  quizCount: number;
  missionCount: number;
}) {
  const cle = `livretv.lesson.checklist.${lessonKey}`;
  const [lecture, setLecture] = useState(0);
  const [coches, setCoches] = useState<boolean[]>(() => objectives.map(() => false));

  useEffect(() => {
    try {
      const sauve = window.localStorage.getItem(cle);
      if (sauve) {
        const valeurs = JSON.parse(sauve) as boolean[];
        setCoches(objectives.map((_, i) => Boolean(valeurs[i])));
      }
    } catch {
      // Une checklist corrompue ne doit jamais bloquer la leçon.
    }
  }, [cle, objectives]);

  useEffect(() => {
    const mesurer = () => {
      const contenu = document.getElementById("lesson-content");
      if (!contenu) return;
      const rect = contenu.getBoundingClientRect();
      const debut = window.scrollY + rect.top - window.innerHeight * 0.3;
      const fin = debut + contenu.offsetHeight - window.innerHeight * 0.55;
      const pct = fin <= debut ? 100 : ((window.scrollY - debut) / (fin - debut)) * 100;
      setLecture(Math.round(Math.max(0, Math.min(100, pct))));
    };
    mesurer();
    window.addEventListener("scroll", mesurer, { passive: true });
    window.addEventListener("resize", mesurer);
    return () => {
      window.removeEventListener("scroll", mesurer);
      window.removeEventListener("resize", mesurer);
    };
  }, []);

  const acquis = useMemo(() => coches.filter(Boolean).length, [coches]);

  const basculer = (index: number) => {
    setCoches((courant) => {
      const suite = courant.map((v, i) => (i === index ? !v : v));
      try {
        window.localStorage.setItem(cle, JSON.stringify(suite));
      } catch {
        // Le mode privé peut refuser le stockage ; l'état courant reste utilisable.
      }
      return suite;
    });
  };

  return (
    <aside className="self-start border border-line bg-panel/35 lg:sticky lg:top-24">
      <div className="border-b border-line p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-display text-[10px] uppercase tracking-hud text-muted">
            <BookOpen size={11} className="text-accent2" />
            Progression de lecture
          </span>
          <span className="font-mono text-[11px] text-accent2">{lecture}%</span>
        </div>
        <Meter value={lecture} className="mt-3" />
      </div>

      {prerequisite && (
        <div className="border-b border-line p-4">
          <p className="font-display text-[10px] uppercase tracking-hud text-muted">
            Prérequis conseillé
          </p>
          <Link
            href={prerequisite.href}
            className="mt-2 flex items-start gap-2 text-[12px] leading-relaxed text-ink/80 transition-colors hover:text-accent2"
          >
            <ChevronRight size={12} className="mt-0.5 shrink-0" />
            {prerequisite.title}
          </Link>
        </div>
      )}

      <nav className="border-b border-line p-4" aria-label="Plan de la leçon">
        <p className="font-display text-[10px] uppercase tracking-hud text-muted">
          Plan de la leçon
        </p>
        <ol className="mt-3 space-y-2.5">
          {headings.map((h, i) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className="group flex gap-2 text-[11.5px] leading-snug text-muted transition-colors hover:text-ink"
              >
                <span className="shrink-0 font-mono text-line2 group-hover:text-accent2">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {h.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-display text-[10px] uppercase tracking-hud text-muted">
            <ClipboardCheck size={11} className="text-good" />
            Auto-évaluation
          </span>
          <span className="font-mono text-[11px] text-muted">
            {acquis}/{objectives.length}
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          {objectives.map((objectif, i) => (
            <li key={objectif}>
              <button
                onClick={() => basculer(i)}
                aria-pressed={coches[i]}
                className="flex w-full items-start gap-2 text-left"
              >
                <span
                  className={cx(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border",
                    coches[i]
                      ? "border-good bg-good/10 text-good"
                      : "border-line2 text-transparent"
                  )}
                >
                  <Check size={10} strokeWidth={3} />
                </span>
                <span
                  className={cx(
                    "text-[11.5px] leading-relaxed",
                    coches[i] ? "text-ink/80" : "text-muted"
                  )}
                >
                  {objectif}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-line pt-3 font-mono text-[10px] leading-relaxed text-line2">
          Validation : {quizCount} question{quizCount > 1 ? "s" : ""}
          {missionCount > 0
            ? ` · ${missionCount} mission${missionCount > 1 ? "s" : ""} pratique${missionCount > 1 ? "s" : ""}`
            : " · quiz de fin"}
        </p>
      </div>
    </aside>
  );
}
