import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Clock, Play, Target } from "lucide-react";
import {
  BlockRenderer,
  blockHeadingId
} from "@/components/content/block-renderer";
import { Quiz } from "@/components/academy/quiz";
import { LessonCompanion } from "@/components/academy/lesson-companion";
import { Hairlines, HudLabel, Tag } from "@/components/ui/primitives";
import {
  TRACKS,
  getLesson,
  lessonId,
  lessonNeighbours
} from "@/content/tracks";
import { getQuestions } from "@/content/quiz";
import { missionsPourLecon } from "@/content/sim/missions";

export function generateStaticParams() {
  return TRACKS.flatMap((t) =>
    t.lessons.map((l) => ({ track: t.slug, lesson: l.slug }))
  );
}

export function generateMetadata({
  params
}: {
  params: { track: string; lesson: string };
}): Metadata {
  const found = getLesson(params.track, params.lesson);
  if (!found) return { title: "Leçon introuvable" };
  return { title: found.lesson.title, description: found.lesson.summary };
}

export default function LessonPage({
  params
}: {
  params: { track: string; lesson: string };
}) {
  const found = getLesson(params.track, params.lesson);
  if (!found) notFound();

  const { track, lesson } = found;
  const missions = missionsPourLecon(track.slug, lesson.slug);
  const key = lessonId(track.slug, lesson.slug);
  const questions = getQuestions(lesson.quiz);
  const { prev, next } = lessonNeighbours(track.slug, lesson.slug);
  const numero = track.lessons.findIndex((l) => l.slug === lesson.slug) + 1;
  const headings = lesson.blocks.flatMap((b, i) =>
    b.t === "h" ? [{ id: blockHeadingId(b.text, i), text: b.text }] : []
  );
  const prerequisite =
    prev && prev.track.slug === track.slug
      ? {
          title: prev.lesson.title,
          href: `/academy/${prev.track.slug}/${prev.lesson.slug}`
        }
      : undefined;

  return (
    <article>
      {/* ─── En-tête ─── */}
      <header className="relative border-b border-line px-6 py-14 lg:px-16 lg:py-20">
        <Hairlines className="opacity-20" />
        <div className="relative mx-auto max-w-4xl">
          <nav className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            <Link href="/academy" className="transition-colors hover:text-ink">
              Academy
            </Link>
            <span>/</span>
            <Link
              href={`/academy/${track.slug}`}
              className="transition-colors hover:text-ink"
              style={{ color: track.color }}
            >
              {track.title}
            </Link>
            <span>/</span>
            <span>
              Leçon {String(numero).padStart(2, "0")}
            </span>
          </nav>

          <h1 className="mega mt-6 text-3xl sm:text-4xl lg:text-5xl">
            {lesson.title}
          </h1>

          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-muted">
            {lesson.summary}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Tag
              tone={
                lesson.level === "Débutant"
                  ? "good"
                  : lesson.level === "Intermédiaire"
                    ? "warn"
                    : "bad"
              }
            >
              {lesson.level}
            </Tag>
            <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              <Clock size={11} />
              {lesson.minutes} min
            </span>
          </div>
        </div>
      </header>

      {/* ─── Objectifs ─── */}
      <section className="border-b border-line bg-panel/25 px-6 py-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-5 flex items-center gap-3">
            <Target size={13} className="text-accent2" />
            <HudLabel side="right">Ce que tu sauras faire</HudLabel>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lesson.objectives.map((o, i) => (
              <li
                key={i}
                className="border-l border-line2 pl-4 text-sm leading-relaxed text-ink/75"
              >
                {o}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── Contenu ─── */}
      <section className="px-6 py-16 lg:px-16 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-14">
          <LessonCompanion
            lessonKey={key}
            headings={headings}
            objectives={lesson.objectives}
            prerequisite={prerequisite}
            quizCount={questions.length}
            missionCount={missions.length}
          />
          <div id="lesson-content" className="min-w-0 max-w-4xl">
            <BlockRenderer blocks={lesson.blocks} />
          </div>
        </div>
      </section>

      {/* ─── Mettre en pratique ─── */}
      {missions.length > 0 && (
        <section className="border-t border-line bg-panel/25 px-6 py-12 lg:px-16">
          <div className="mx-auto max-w-4xl">
            <div className="mb-5 flex items-center gap-3">
              <Play size={12} className="text-accent2" />
              <HudLabel side="right">Mettre en pratique</HudLabel>
            </div>
            <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
              Lire ne suffit pas. {missions.length > 1 ? "Ces missions font" : "Cette mission fait"}{" "}
              tourner ce que tu viens d&apos;apprendre sur un robot simulé, avec
              du vrai code Python.
            </p>
            <div
              className={
                missions.length > 1
                  ? "grid gap-px bg-line sm:grid-cols-2"
                  : "grid gap-px bg-line"
              }
            >
              {missions.map((m) => (
                <Link
                  key={m.id}
                  href={`/atelier?mission=${m.id}`}
                  className="group bg-bg p-6 transition-colors hover:bg-panel"
                >
                  <span className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                    Mission {m.numero}
                    <span className="h-px w-4 bg-line2" />
                    {m.difficulte}
                  </span>
                  <p className="mt-3 text-sm text-ink transition-colors group-hover:text-accent2">
                    {m.titre}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {m.resume}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Quiz ─── */}
      <section className="border-t border-line bg-panel/20 px-6 py-16 lg:px-16 lg:py-20">
        <div className="mx-auto max-w-4xl">
          <Quiz questions={questions} lessonKey={key} />
        </div>
      </section>

      {/* ─── Navigation ─── */}
      <nav className="border-t border-line px-6 py-10 lg:px-16">
        <div className="mx-auto grid max-w-4xl gap-px bg-line sm:grid-cols-2">
          {prev ? (
            <Link
              href={`/academy/${prev.track.slug}/${prev.lesson.slug}`}
              className="group bg-bg p-6 transition-colors hover:bg-panel"
            >
              <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                <ArrowLeft size={11} />
                Précédent
              </span>
              <p className="mt-3 text-sm text-ink transition-colors group-hover:text-accent2">
                {prev.lesson.title}
              </p>
              <p className="mt-1 text-xs text-muted">{prev.track.title}</p>
            </Link>
          ) : (
            <div className="bg-bg p-6" />
          )}

          {next ? (
            <Link
              href={`/academy/${next.track.slug}/${next.lesson.slug}`}
              className="group bg-bg p-6 text-right transition-colors hover:bg-panel"
            >
              <span className="flex items-center justify-end gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                Suivant
                <ArrowRight size={11} />
              </span>
              <p className="mt-3 text-sm text-ink transition-colors group-hover:text-accent2">
                {next.lesson.title}
              </p>
              <p className="mt-1 text-xs text-muted">{next.track.title}</p>
            </Link>
          ) : (
            <Link
              href="/forge"
              className="group bg-bg p-6 text-right transition-colors hover:bg-panel"
            >
              <span className="flex items-center justify-end gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                Et maintenant
                <ArrowRight size={11} />
              </span>
              <p className="mt-3 text-sm text-ink transition-colors group-hover:text-accent2">
                Générer un projet dans la Forge
              </p>
              <p className="mt-1 text-xs text-muted">
                Tu as terminé le cursus
              </p>
            </Link>
          )}
        </div>
      </nav>
    </article>
  );
}
