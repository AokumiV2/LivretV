"use client";

import { create } from "zustand";
import { MISSIONS } from "@/content/sim/missions";
import { TRACKS, allLessons, lessonId } from "@/content/tracks";
import { store } from "@/lib/storage/adapter";
import {
  BADGES,
  XP,
  type BadgeContext,
  type Profile,
  type ProgressMap
} from "@/lib/storage/types";

type State = {
  pret: boolean;
  profil: Profile | null;
  progress: ProgressMap;
  hydrate: () => Promise<void>;
  marquerLecon: (id: string, score: number, total: number) => Promise<void>;
  reinitialiser: () => void;
};

export const useProgress = create<State>((set, get) => ({
  pret: false,
  profil: null,
  progress: {},

  hydrate: async () => {
    if (get().pret) return;
    const profil = await store.me();
    const progress = await store.getProgress(Boolean(profil));
    set({ profil, progress, pret: true });
  },

  marquerLecon: async (id, score, total) => {
    const map = await store.setLesson(Boolean(get().profil), id, {
      status: "terminee",
      score,
      total
    });
    set({ progress: { ...map } });
  },

  reinitialiser: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("livretv.progress.v1");
    }
    set({ progress: {} });
  }
}));

/* ─────────────── Dérivés ─────────────── */

/** Préfixe des clés de progression venant de l'Atelier. */
export const PREFIXE_SIM = "sim/";

export function xpTotal(progress: ProgressMap): number {
  let xp = 0;
  for (const [id, st] of Object.entries(progress)) {
    if (st.status !== "terminee") continue;

    // Une mission porte sa propre valeur : réussir le serpentin ne
    // vaut pas la même chose que réussir le premier nœud.
    if (id.startsWith(PREFIXE_SIM)) {
      const m = MISSIONS.find((x) => PREFIXE_SIM + x.id === id);
      xp += m?.xp ?? XP.lecon;
      continue;
    }

    xp += XP.lecon;
    if (st.total > 0) {
      if (st.score === st.total) xp += XP.quizParfait;
      else if (st.score / st.total >= 0.6) xp += XP.quizReussi;
    }
  }
  return xp;
}

/** Missions de l'Atelier réussies. */
export function missionsReussies(progress: ProgressMap): number {
  return Object.entries(progress).filter(
    ([id, st]) => id.startsWith(PREFIXE_SIM) && st.status === "terminee"
  ).length;
}

/** Niveau : chaque palier coûte 20 % de plus que le précédent. */
export function niveau(xp: number): { niveau: number; dans: number; pour: number } {
  let n = 1;
  let seuil = 200;
  let reste = xp;
  while (reste >= seuil) {
    reste -= seuil;
    n += 1;
    seuil = Math.round(seuil * 1.2);
  }
  return { niveau: n, dans: reste, pour: seuil };
}

export function progressionParcours(progress: ProgressMap) {
  return TRACKS.map((t) => {
    const total = t.lessons.length;
    const faites = t.lessons.filter(
      (l) => progress[lessonId(t.slug, l.slug)]?.status === "terminee"
    ).length;
    return { track: t, total, faites, pct: total ? (faites / total) * 100 : 0 };
  });
}

export function contexteBadges(
  progress: ProgressMap,
  projets: BadgeContext["projets"]
): BadgeContext {
  const termines = Object.entries(progress)
    .filter(([id]) => !id.startsWith(PREFIXE_SIM))
    .map(([, s]) => s)
    .filter((s) => s.status === "terminee");
  const parcoursTermines = progressionParcours(progress)
    .filter((p) => p.total > 0 && p.faites === p.total)
    .map((p) => p.track.slug);

  return {
    leconsTerminees: termines.length,
    quizParfaits: termines.filter((s) => s.total > 0 && s.score === s.total)
      .length,
    parcoursTermines,
    missions: missionsReussies(progress),
    projets
  };
}

export function badgesObtenus(ctx: BadgeContext) {
  return BADGES.map((b) => ({ ...b, obtenu: b.test(ctx) }));
}

/** Prochaine leçon non terminée, pour le bouton « Reprendre ». */
export function prochaineLecon(progress: ProgressMap) {
  return allLessons().find((l) => progress[l.id]?.status !== "terminee");
}
