"use client";

import { useEffect, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import type { Question } from "@/content/types";
import { useProgress } from "@/lib/store/progress-store";
import { Btn, HudLabel, cx } from "@/components/ui/primitives";

export function Quiz({
  questions,
  lessonKey
}: {
  questions: Question[];
  lessonKey: string;
}) {
  const { marquerLecon, progress, hydrate, pret } = useProgress();
  const [reponses, setReponses] = useState<Record<string, number>>({});
  const [valide, setValide] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const dejaFait = pret && progress[lessonKey]?.status === "terminee";

  if (questions.length === 0) {
    return (
      <div className="border border-line bg-panel/40 p-8 text-center">
        <p className="text-sm text-muted">
          Pas de quiz pour cette leçon.
        </p>
        <Btn
          onClick={() => void marquerLecon(lessonKey, 0, 0)}
          className="mt-5"
          size="sm"
        >
          Marquer comme terminée
        </Btn>
      </div>
    );
  }

  const score = questions.filter((q) => reponses[q.id] === q.answer).length;
  const complet = questions.every((q) => reponses[q.id] !== undefined);

  const valider = async () => {
    setValide(true);
    await marquerLecon(lessonKey, score, questions.length);
  };

  const recommencer = () => {
    setReponses({});
    setValide(false);
  };

  return (
    <div className="border border-line bg-panel/30">
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <HudLabel side="right">Quiz de fin de leçon</HudLabel>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          {valide
            ? `${score} / ${questions.length}`
            : `${Object.keys(reponses).length} / ${questions.length}`}
        </span>
      </div>

      <div className="divide-y divide-line">
        {questions.map((q, qi) => {
          const choisi = reponses[q.id];
          return (
            <div key={q.id} className="p-6 lg:p-8">
              <div className="flex gap-4">
                <span className="mt-0.5 shrink-0 font-mono text-[11px] text-accent2">
                  {String(qi + 1).padStart(2, "0")}
                </span>
                <p className="text-[15px] leading-relaxed text-ink">{q.prompt}</p>
              </div>

              <div className="mt-5 space-y-2 lg:pl-10">
                {q.choices.map((c, ci) => {
                  const estChoisi = choisi === ci;
                  const estBonne = ci === q.answer;
                  const montrer = valide;

                  return (
                    <button
                      key={ci}
                      disabled={valide}
                      onClick={() =>
                        setReponses((r) => ({ ...r, [q.id]: ci }))
                      }
                      className={cx(
                        "flex w-full items-start gap-3 border px-4 py-3 text-left text-sm transition-colors",
                        !montrer &&
                          (estChoisi
                            ? "border-accent2 bg-accent2/[0.06] text-ink"
                            : "border-line text-muted hover:border-line2 hover:text-ink"),
                        montrer &&
                          estBonne &&
                          "border-good bg-good/[0.07] text-ink",
                        montrer &&
                          estChoisi &&
                          !estBonne &&
                          "border-bad bg-bad/[0.07] text-ink",
                        montrer &&
                          !estBonne &&
                          !estChoisi &&
                          "border-line text-muted/60"
                      )}
                    >
                      <span
                        className={cx(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border",
                          !montrer && estChoisi && "border-accent2",
                          !montrer && !estChoisi && "border-line2",
                          montrer && estBonne && "border-good bg-good/20",
                          montrer && estChoisi && !estBonne && "border-bad bg-bad/20",
                          montrer && !estBonne && !estChoisi && "border-line"
                        )}
                      >
                        {montrer && estBonne && (
                          <Check size={10} className="text-good" />
                        )}
                        {montrer && estChoisi && !estBonne && (
                          <X size={10} className="text-bad" />
                        )}
                      </span>
                      <span className="leading-relaxed">{c}</span>
                    </button>
                  );
                })}
              </div>

              {valide && (
                <p className="mt-4 border-l-2 border-accent2/40 bg-accent2/[0.04] px-4 py-3 text-sm leading-relaxed text-ink/75 lg:ml-10">
                  {q.explain}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-5">
        {!valide ? (
          <>
            <p className="text-xs text-muted">
              {complet
                ? "Toutes les questions sont répondues."
                : `Encore ${questions.length - Object.keys(reponses).length} question(s).`}
            </p>
            <Btn onClick={valider} disabled={!complet} variant="solid" size="sm">
              Valider
            </Btn>
          </>
        ) : (
          <>
            <div>
              <p
                className={cx(
                  "font-display text-sm uppercase tracking-hud",
                  score === questions.length
                    ? "text-good"
                    : score / questions.length >= 0.6
                      ? "text-warn"
                      : "text-bad"
                )}
              >
                {score === questions.length
                  ? "Score parfait"
                  : score / questions.length >= 0.6
                    ? "Leçon validée"
                    : "À relire"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {score} bonne(s) réponse(s) sur {questions.length}
                {dejaFait && " · progression enregistrée"}
              </p>
            </div>
            <Btn onClick={recommencer} size="sm">
              <RotateCcw size={12} />
              Recommencer
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}
