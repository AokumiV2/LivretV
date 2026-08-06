import type { Component, Pin } from "@/content/types";
import { getComponent } from "@/content/components";

export type Placed = {
  uid: string;
  componentId: string;
  x: number;
  y: number;
};

export type PinRef = { uid: string; pinId: string };

export type WLink = {
  id: string;
  from: PinRef;
  to: PinRef;
};

export type WiringDoc = {
  placed: Placed[];
  links: WLink[];
};

export type Severity = "erreur" | "alerte" | "info";

export type Diagnostic = {
  id: string;
  level: Severity;
  title: string;
  detail: string;
  /** Composants concernés, pour la mise en évidence sur le canvas. */
  uids?: string[];
};

export type PowerBudget = {
  fourni: number;
  consommeTyp: number;
  consommePeak: number;
  lignes: { nom: string; typ: number; peak: number; fournit: number }[];
};

/* ─────────────── Géométrie du canvas ─────────────── */

export const CARD_W = 210;
export const HEAD_H = 48;
export const ROW_H = 24;
export const PAD_B = 12;

/** Combien de broches d'un même rôle garder sur un schéma. */
const CAP_PAR_ROLE: Record<string, number> = {
  GPIO: 4,
  PWM: 3,
  ANALOG: 2
};

/**
 * Le catalogue déclare parfois quarante broches — un Raspberry Pi, par
 * exemple. Sur un schéma on n'en veut qu'un échantillon représentatif, plus
 * toutes celles qui portent déjà une liaison.
 */
export function pinsFor(doc: WiringDoc, placed: Placed): Pin[] {
  const c = getComponent(placed.componentId);
  if (!c) return [];

  const forcees = new Set<string>();
  for (const l of doc.links) {
    for (const r of [l.from, l.to]) {
      if (r.uid === placed.uid) forcees.add(r.pinId);
    }
  }

  if (c.pins.length <= 16) return c.pins;

  const compte = new Map<string, number>();
  const out: Pin[] = [];

  for (const p of c.pins) {
    const cle = `${p.kind}:${p.volts ?? ""}`;
    const cap = CAP_PAR_ROLE[p.kind] ?? 1;
    const n = compte.get(cle) ?? 0;
    if (n < cap) {
      compte.set(cle, n + 1);
      out.push(p);
    }
  }

  // Les broches déjà câblées doivent toujours être visibles.
  for (const p of c.pins) {
    if (forcees.has(p.id) && !out.some((x) => x.id === p.id)) out.push(p);
  }

  return out;
}

export function cardHeight(doc: WiringDoc, placed: Placed): number {
  const rows = Math.ceil(pinsFor(doc, placed).length / 2);
  return HEAD_H + rows * ROW_H + PAD_B;
}

/** Position absolue du point d'ancrage d'une broche sur le canvas. */
export function pinAnchor(
  doc: WiringDoc,
  placed: Placed,
  pinId: string
): { x: number; y: number; side: "left" | "right" } | null {
  const pins = pinsFor(doc, placed);
  const i = pins.findIndex((p) => p.id === pinId);
  if (i < 0) return null;

  const row = Math.floor(i / 2);
  const gauche = i % 2 === 0;
  return {
    x: placed.x + (gauche ? 0 : CARD_W),
    y: placed.y + HEAD_H + row * ROW_H + ROW_H / 2,
    side: gauche ? "left" : "right"
  };
}

export function pinOf(placed: Placed, pinId: string): Pin | undefined {
  const c = getComponent(placed.componentId);
  return c?.pins.find((p) => p.id === pinId);
}

export function samePin(a: PinRef, b: PinRef) {
  return a.uid === b.uid && a.pinId === b.pinId;
}

export function composantDe(placed: Placed): Component | undefined {
  return getComponent(placed.componentId);
}

/** Couleur d'un fil selon le rôle des broches qu'il relie. */
export function couleurFil(kind?: string): string {
  switch (kind) {
    case "GND":
      return "#767d92";
    case "5V":
    case "VIN":
      return "#ff4d5e";
    case "3V3":
      return "#e0a83c";
    case "SDA":
    case "SCL":
      return "#5ee0ff";
    case "TX":
    case "RX":
      return "#3ddc9a";
    case "MOTOR":
      return "#e0a83c";
    case "USB":
      return "#a78bfa";
    default:
      return "#4a4f66";
  }
}
