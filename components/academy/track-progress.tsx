"use client";

import { useEffect } from "react";
import { TRACKS, lessonId } from "@/content/tracks";
import { useProgress } from "@/lib/store/progress-store";
import { Meter } from "@/components/ui/primitives";

/** Barre de progression d'un parcours, hydratée côté client. */
export function TrackProgress({
  slug,
  total
}: {
  slug: string;
  total: number;
}) {
  const { progress, pret, hydrate } = useProgress();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const track = TRACKS.find((t) => t.slug === slug);
  const faites = track
    ? track.lessons.filter(
        (l) => progress[lessonId(slug, l.slug)]?.status === "terminee"
      ).length
    : 0;

  return (
    <div className="w-full max-w-[220px]">
      <div className="mb-2 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        <span>{pret ? `${faites} / ${total}` : `— / ${total}`}</span>
        <span>{total} leçons</span>
      </div>
      <Meter value={faites} max={total} tone={faites === total ? "good" : "accent"} />
    </div>
  );
}

/** Pastille d'état d'une leçon dans un sommaire. */
export function LessonStatus({ id }: { id: string }) {
  const { progress, pret, hydrate } = useProgress();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const st = progress[id];

  if (!pret) {
    return <span className="block h-2 w-2 rounded-full border border-line2" />;
  }
  if (st?.status === "terminee") {
    return (
      <span
        className="block h-2 w-2 rounded-full bg-good"
        title={st.total > 0 ? `Quiz : ${st.score}/${st.total}` : "Terminée"}
      />
    );
  }
  return <span className="block h-2 w-2 rounded-full border border-line2" />;
}
