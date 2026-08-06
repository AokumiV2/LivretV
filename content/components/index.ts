import type { Category, Component } from "../types";
import { ACTUATION } from "./actuation";
import { COMPUTE } from "./compute";
import { POWER } from "./power";
import { SENSING } from "./sensing";

export const COMPONENTS: Component[] = [
  ...COMPUTE,
  ...ACTUATION,
  ...SENSING,
  ...POWER
];

const BY_ID = new Map(COMPONENTS.map((c) => [c.id, c]));

export function getComponent(id: string): Component | undefined {
  return BY_ID.get(id);
}

export function getComponents(ids: string[]): Component[] {
  return ids.map((id) => BY_ID.get(id)).filter((c): c is Component => Boolean(c));
}

export const CATEGORY_LABEL: Record<Category, string> = {
  calculateur: "Calculateur",
  microcontroleur: "Microcontrôleur",
  moteur: "Moteur",
  driver: "Driver",
  capteur: "Capteur",
  camera: "Caméra",
  alimentation: "Alimentation",
  chassis: "Châssis",
  communication: "Communication"
};

export const CATEGORY_ORDER: Category[] = [
  "calculateur",
  "microcontroleur",
  "moteur",
  "driver",
  "capteur",
  "camera",
  "alimentation",
  "communication",
  "chassis"
];

/** Compte les composants par catégorie, pour les filtres du Codex. */
export function countByCategory(): Record<Category, number> {
  const out = {} as Record<Category, number>;
  for (const cat of CATEGORY_ORDER) out[cat] = 0;
  for (const c of COMPONENTS) out[c.category] += 1;
  return out;
}
