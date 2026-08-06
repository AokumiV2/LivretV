import type { Lesson, Track } from "../types";
import { COMMUNICATION } from "./communication";
import { EMBARQUE } from "./embarque";
import { FONDATIONS } from "./fondations";
import { NAVIGATION } from "./navigation";
import { PERCEPTION } from "./perception";
import { REPRESENTATION } from "./representation";

export const TRACKS: Track[] = [
  FONDATIONS,
  COMMUNICATION,
  REPRESENTATION,
  NAVIGATION,
  PERCEPTION,
  EMBARQUE
];

export function getTrack(slug: string): Track | undefined {
  return TRACKS.find((t) => t.slug === slug);
}

export function getLesson(
  trackSlug: string,
  lessonSlug: string
): { track: Track; lesson: Lesson } | undefined {
  const track = getTrack(trackSlug);
  const lesson = track?.lessons.find((l) => l.slug === lessonSlug);
  if (!track || !lesson) return undefined;
  return { track, lesson };
}

/** Identifiant global d'une leçon, utilisé pour la progression. */
export function lessonId(trackSlug: string, lessonSlug: string): string {
  return `${trackSlug}/${lessonSlug}`;
}

/** Toutes les leçons à plat, dans l'ordre du cursus. */
export function allLessons(): { track: Track; lesson: Lesson; id: string }[] {
  return TRACKS.flatMap((track) =>
    track.lessons.map((lesson) => ({
      track,
      lesson,
      id: lessonId(track.slug, lesson.slug)
    }))
  );
}

/** Leçon précédente et suivante, pour la navigation en bas de page. */
export function lessonNeighbours(trackSlug: string, lessonSlug: string) {
  const flat = allLessons();
  const i = flat.findIndex((x) => x.id === lessonId(trackSlug, lessonSlug));
  return {
    prev: i > 0 ? flat[i - 1] : undefined,
    next: i >= 0 && i < flat.length - 1 ? flat[i + 1] : undefined
  };
}

export const TOTAL_LESSONS = TRACKS.reduce((n, t) => n + t.lessons.length, 0);

export const TOTAL_MINUTES = TRACKS.reduce(
  (n, t) => n + t.lessons.reduce((m, l) => m + l.minutes, 0),
  0
);
