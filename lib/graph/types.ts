export type Reliability = "RELIABLE" | "BEST_EFFORT";
export type Durability = "VOLATILE" | "TRANSIENT_LOCAL";

export type Qos = {
  reliability: Reliability;
  durability: Durability;
  depth: number;
};

export const QOS_DEFAUT: Qos = {
  reliability: "RELIABLE",
  durability: "VOLATILE",
  depth: 10
};

export const QOS_CAPTEUR: Qos = {
  reliability: "BEST_EFFORT",
  durability: "VOLATILE",
  depth: 5
};

export const QOS_LATCH: Qos = {
  reliability: "RELIABLE",
  durability: "TRANSIENT_LOCAL",
  depth: 1
};

export type Endpoint = {
  id: string;
  topic: string;
  msgType: string;
  qos: Qos;
  /** Fréquence de publication, en Hz. Ignoré pour un abonnement. */
  hz?: number;
};

export type GNode = {
  id: string;
  name: string;
  pkg: string;
  x: number;
  y: number;
  pubs: Endpoint[];
  subs: Endpoint[];
};

export type GraphDoc = {
  nodes: GNode[];
};

export type GDiagnostic = {
  id: string;
  level: "erreur" | "alerte" | "info";
  title: string;
  detail: string;
  nodeIds?: string[];
  topic?: string;
};

/** Une liaison effective entre un publisher et un subscriber. */
export type Edge = {
  id: string;
  fromNode: string;
  fromEp: string;
  toNode: string;
  toEp: string;
  topic: string;
  msgType: string;
  hz: number;
  connecte: boolean;
  raison?: string;
};

export const NODE_W = 220;
export const NODE_HEAD = 46;
export const EP_H = 22;

export function nodeHeight(n: GNode) {
  const lignes = n.pubs.length + n.subs.length;
  return NODE_HEAD + Math.max(1, lignes) * EP_H + 14;
}

/** Ancre d'un point d'entrée : les abonnements à gauche, les publications à droite. */
export function epAnchor(n: GNode, epId: string) {
  const iSub = n.subs.findIndex((e) => e.id === epId);
  if (iSub >= 0) {
    return { x: n.x, y: n.y + NODE_HEAD + iSub * EP_H + EP_H / 2, side: "left" as const };
  }
  const iPub = n.pubs.findIndex((e) => e.id === epId);
  if (iPub >= 0) {
    return {
      x: n.x + NODE_W,
      y: n.y + NODE_HEAD + (n.subs.length + iPub) * EP_H + EP_H / 2,
      side: "right" as const
    };
  }
  return null;
}
