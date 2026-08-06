import { localStore, nouvelId } from "./local";
import type { Profile, ProgressMap, ProjectKind, ProjectRecord } from "./types";

/**
 * Adaptateur unique. Si une base est configurée ET que l'utilisateur est
 * connecté, tout passe par l'API. Sinon, tout reste dans le navigateur.
 * Les composants n'ont pas à savoir lequel des deux est actif.
 */

export const HAS_DB = Boolean(process.env.NEXT_PUBLIC_HAS_DB);

async function api<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) }
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const store = {
  async me(): Promise<Profile | null> {
    if (!HAS_DB) return null;
    const r = await api<{ user: Profile | null }>("/api/auth/me");
    return r?.user ?? null;
  },

  async getProgress(connecte: boolean): Promise<ProgressMap> {
    if (HAS_DB && connecte) {
      const r = await api<{ progress: ProgressMap }>("/api/progress");
      if (r) return r.progress;
    }
    return localStore.getProgress();
  },

  async setLesson(
    connecte: boolean,
    lessonId: string,
    state: { status: "en_cours" | "terminee"; score: number; total: number }
  ) {
    // On écrit toujours en local : cela garde le site utilisable hors ligne
    // et sert de repli immédiat pour l'affichage.
    const map = localStore.getProgress();
    map[lessonId] = { ...state, at: Date.now() };
    localStore.setProgress(map);

    if (HAS_DB && connecte) {
      await api("/api/progress", {
        method: "POST",
        body: JSON.stringify({ lessonId, ...state })
      });
    }
    return map;
  },

  async listProjects(
    connecte: boolean,
    kind?: ProjectKind
  ): Promise<ProjectRecord[]> {
    if (HAS_DB && connecte) {
      const q = kind ? `?kind=${kind}` : "";
      const r = await api<{ projects: ProjectRecord[] }>(`/api/projects${q}`);
      if (r) return r.projects;
    }
    return localStore.listProjects(kind);
  },

  async saveProject(
    connecte: boolean,
    p: { id?: string; name: string; kind: ProjectKind; data: unknown }
  ): Promise<ProjectRecord> {
    const id = p.id || nouvelId(p.kind.toLowerCase());

    if (HAS_DB && connecte) {
      const r = await api<{ project: ProjectRecord }>("/api/projects", {
        method: "POST",
        body: JSON.stringify({ ...p, id })
      });
      if (r) return r.project;
    }
    return localStore.saveProject({ ...p, id });
  },

  async deleteProject(connecte: boolean, id: string) {
    if (HAS_DB && connecte) {
      await api(`/api/projects/${id}`, { method: "DELETE" });
      return;
    }
    localStore.deleteProject(id);
  }
};

export { nouvelId };
