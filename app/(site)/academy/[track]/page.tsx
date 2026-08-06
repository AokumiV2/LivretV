import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { PageHeader, Tag } from "@/components/ui/primitives";
import { TRACKS, getTrack, lessonId } from "@/content/tracks";
import { LessonStatus, TrackProgress } from "@/components/academy/track-progress";

export function generateStaticParams() {
  return TRACKS.map((t) => ({ track: t.slug }));
}

export function generateMetadata({
  params
}: {
  params: { track: string };
}): Metadata {
  const t = getTrack(params.track);
  if (!t) return { title: "Parcours introuvable" };
  return { title: t.title, description: t.description };
}

export default function TrackPage({ params }: { params: { track: string } }) {
  const track = getTrack(params.track);
  if (!track) notFound();

  const minutes = track.lessons.reduce((n, l) => n + l.minutes, 0);

  return (
    <>
      <PageHeader
        kicker={`Parcours ${String(track.index).padStart(2, "0")}`}
        title={track.title}
        intro={track.description}
        right={
          <div className="w-full lg:w-56">
            <TrackProgress slug={track.slug} total={track.lessons.length} />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted">
              ≈ {minutes} minutes au total
            </p>
          </div>
        }
      />

      <section className="px-6 py-16 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-5xl space-y-px bg-line">
          {track.lessons.map((l, i) => (
            <Link
              key={l.slug}
              href={`/academy/${track.slug}/${l.slug}`}
              className="group flex gap-6 bg-bg p-7 transition-colors hover:bg-panel lg:gap-8 lg:p-8"
            >
              <div className="flex shrink-0 flex-col items-center gap-3 pt-1">
                <span className="font-mono text-xs text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <LessonStatus id={lessonId(track.slug, l.slug)} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="mega text-lg text-ink transition-colors group-hover:text-accent2 lg:text-xl">
                    {l.title}
                  </h2>
                  <Tag
                    tone={
                      l.level === "Débutant"
                        ? "good"
                        : l.level === "Intermédiaire"
                          ? "warn"
                          : "bad"
                    }
                  >
                    {l.level}
                  </Tag>
                </div>

                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
                  {l.summary}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                  <span>{l.minutes} min</span>
                  <span className="h-px w-4 bg-line2" />
                  <span>{l.quiz.length} questions</span>
                  <span className="h-px w-4 bg-line2" />
                  <span>{l.objectives.length} objectifs</span>
                </div>
              </div>

              <ArrowUpRight
                size={18}
                className="mt-1 hidden shrink-0 text-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent2 sm:block"
              />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
