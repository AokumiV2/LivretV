import type { ProgressMap, ProjectKind, ProjectRecord } from "./types";

/**
 * Stockage navigateur. C'est le mode par défaut : sans DATABASE_URL, le site
 * fonctionne intégralement, la progression reste simplement locale.
 */

const K_PROGRESS = "livretv.progress.v1";
const K_PROJECTS = "livretv.projects.v1";

function lire<T>(cle: string, defaut: T): T {
  if (typeof window === "undefined") return defaut;
  try {
    const brut = window.localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : defaut;
  } catch {
    return defaut;
  }
}

function ecrire(cle: string, valeur: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    // Quota dépassé ou stockage désactivé : on n'interrompt pas la navigation.
  }
}

export const localStore = {
  getProgress(): ProgressMap {
    return lire<ProgressMap>(K_PROGRESS, {});
  },

  setProgress(map: ProgressMap) {
    ecrire(K_PROGRESS, map);
  },

  listProjects(kind?: ProjectKind): ProjectRecord[] {
    const tous = lire<ProjectRecord[]>(K_PROJECTS, []);
    const filtres = kind ? tous.filter((p) => p.kind === kind) : tous;
    return filtres.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  saveProject(p: Omit<ProjectRecord, "updatedAt"> & { updatedAt?: number }) {
    const tous = lire<ProjectRecord[]>(K_PROJECTS, []);
    const record: ProjectRecord = { ...p, updatedAt: Date.now() };
    const i = tous.findIndex((x) => x.id === p.id);
    if (i >= 0) tous[i] = record;
    else tous.push(record);
    ecrire(K_PROJECTS, tous);
    return record;
  },

  deleteProject(id: string) {
    const tous = lire<ProjectRecord[]>(K_PROJECTS, []);
    ecrire(
      K_PROJECTS,
      tous.filter((p) => p.id !== id)
    );
  },

  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(K_PROGRESS);
    window.localStorage.removeItem(K_PROJECTS);
  }
};

/** Identifiant local, sans dépendance externe. */
export function nouvelId(prefix = "p") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
