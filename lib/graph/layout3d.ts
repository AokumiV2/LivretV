import { edges } from "./validate";
import type { GraphDoc } from "./types";

/* ══════════════════════════════════════════════════════════════
   Disposition 3D du graphe.

   La profondeur porte l'information : chaque node est placé sur une
   couche déduite de sa distance aux capteurs. On lit d'un coup d'œil
   le trajet de la donnée, du matériel jusqu'à la commande.
   ══════════════════════════════════════════════════════════════ */

export type NoeudPlace = {
  id: string;
  nom: string;
  pkg: string;
  couche: number;
  pos: [number, number, number];
  /** Nombre de liaisons rompues qui touchent ce node. */
  rompues: number;
};

export type ArcPlace = {
  id: string;
  de: [number, number, number];
  vers: [number, number, number];
  topic: string;
  connecte: boolean;
  hz: number;
};

export type GraphLayout3D = {
  noeuds: NoeudPlace[];
  arcs: ArcPlace[];
  couches: { index: number; nom: string; y: number; nb: number }[];
};

const NOMS_COUCHES = [
  "Sources",
  "Traitement",
  "Décision",
  "Commande",
  "Aval"
];

/**
 * Couche d'un node : longueur du plus long chemin depuis une source.
 * Le graphe ROS contient des boucles — /cmd_vel revient vers la base —
 * donc on borne la profondeur de parcours au lieu de faire un tri
 * topologique, qui n'aboutirait pas.
 */
function calculerCouches(doc: GraphDoc): Map<string, number> {
  const liens = edges(doc).filter((e) => e.connecte);
  const entrants = new Map<string, string[]>();
  for (const n of doc.nodes) entrants.set(n.id, []);
  for (const e of liens) entrants.get(e.toNode)?.push(e.fromNode);

  const couche = new Map<string, number>();
  const MAX = 4;

  const profondeur = (id: string, vus: Set<string>): number => {
    if (couche.has(id)) return couche.get(id)!;
    if (vus.has(id)) return 0; // cycle : on coupe
    const sources = entrants.get(id) ?? [];
    if (sources.length === 0) return 0;

    vus.add(id);
    let max = 0;
    for (const s of sources) {
      max = Math.max(max, profondeur(s, vus) + 1);
    }
    vus.delete(id);
    return Math.min(max, MAX);
  };

  for (const n of doc.nodes) couche.set(n.id, profondeur(n.id, new Set()));
  return couche;
}

export function construireGraphLayout(doc: GraphDoc): GraphLayout3D {
  const couches = calculerCouches(doc);
  const liens = edges(doc);

  const rompuesPar = new Map<string, number>();
  for (const e of liens) {
    if (e.connecte) continue;
    rompuesPar.set(e.fromNode, (rompuesPar.get(e.fromNode) ?? 0) + 1);
    rompuesPar.set(e.toNode, (rompuesPar.get(e.toNode) ?? 0) + 1);
  }

  // Regroupement par couche, puis répartition en grille dans le plan xz
  const parCouche = new Map<number, string[]>();
  for (const n of doc.nodes) {
    const c = couches.get(n.id) ?? 0;
    const l = parCouche.get(c) ?? [];
    l.push(n.id);
    parCouche.set(c, l);
  }

  const ECART_COUCHE = 0.9;
  const ECART_X = 0.85;
  const ECART_Z = 0.4;

  const noeuds: NoeudPlace[] = [];
  const positions = new Map<string, [number, number, number]>();

  for (const [c, ids] of [...parCouche.entries()].sort((a, b) => a[0] - b[0])) {
    const colonnes = Math.ceil(Math.sqrt(ids.length));
    ids.forEach((id, i) => {
      const n = doc.nodes.find((x) => x.id === id)!;
      const col = i % colonnes;
      const rang = Math.floor(i / colonnes);
      const nbCol = Math.min(colonnes, ids.length - rang * colonnes);

      const pos: [number, number, number] = [
        (col - (nbCol - 1) / 2) * ECART_X,
        c * ECART_COUCHE,
        rang * ECART_Z
      ];
      positions.set(id, pos);
      noeuds.push({
        id,
        nom: n.name,
        pkg: n.pkg,
        couche: c,
        pos,
        rompues: rompuesPar.get(id) ?? 0
      });
    });
  }

  const arcs: ArcPlace[] = liens
    .map((e) => {
      const de = positions.get(e.fromNode);
      const vers = positions.get(e.toNode);
      if (!de || !vers) return null;
      return {
        id: e.id,
        de,
        vers,
        topic: e.topic,
        connecte: e.connecte,
        hz: e.hz
      };
    })
    .filter((a): a is ArcPlace => a !== null);

  const listeCouches = [...parCouche.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([index, ids]) => ({
      index,
      nom: NOMS_COUCHES[index] ?? `Niveau ${index}`,
      y: index * ECART_COUCHE,
      nb: ids.length
    }));

  return { noeuds, arcs, couches: listeCouches };
}
