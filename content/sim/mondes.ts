import type { Monde, Segment } from "@/lib/sim/types";

/* ══════════════════════════════════════════════════════════════
   Les arènes.

   Un monde n'est qu'une liste de murs — des segments en mètres —
   et quelques zones à atteindre. Aucun modèle 3D, aucun asset :
   le LiDAR travaille sur ces segments, la vue 2D les dessine, la
   vue 3D les extrude. Une seule source de vérité.
   ══════════════════════════════════════════════════════════════ */

/** Les quatre murs d'un rectangle, donné par ses coins opposés. */
function boite(x1: number, y1: number, x2: number, y2: number): Segment[] {
  return [
    { x1, y1, x2, y2: y1 },
    { x1: x2, y1, x2, y2 },
    { x1: x2, y1: y2, x2: x1, y2 },
    { x1, y1: y2, x2: x1, y2: y1 }
  ];
}

/** Un obstacle centré, donné par son centre et ses dimensions. */
function obstacle(cx: number, cy: number, l: number, h: number): Segment[] {
  return boite(cx - l / 2, cy - h / 2, cx + l / 2, cy + h / 2);
}

function mur(x1: number, y1: number, x2: number, y2: number): Segment {
  return { x1, y1, x2, y2 };
}

export const MONDES: Monde[] = [
  {
    id: "piste",
    nom: "Piste libre",
    resume: "Une salle vide de 8 mètres. Rien pour te gêner, rien pour t'aider.",
    bornes: [-4, -4, 4, 4],
    murs: boite(-4, -4, 4, 4),
    zones: [{ id: "cible", label: "Cible", x: 2, y: 0, rayon: 0.4 }],
    depart: { x: -2.5, y: 0, theta: 0 }
  },

  {
    id: "couloir",
    nom: "Couloir coudé",
    resume: "Un couloir de 1,6 m de large avec un virage à angle droit.",
    bornes: [-5, -1.5, 2.5, 4],
    murs: [
      mur(-4.5, -0.8, 2, -0.8),
      mur(-4.5, 0.8, 0.4, 0.8),
      mur(-4.5, -0.8, -4.5, 0.8),
      mur(2, -0.8, 2, 3.5),
      mur(0.4, 0.8, 0.4, 3.5),
      mur(0.4, 3.5, 2, 3.5)
    ],
    zones: [
      { id: "virage", label: "Virage", x: 1.2, y: 0, rayon: 0.55 },
      { id: "arrivee", label: "Arrivée", x: 1.2, y: 2.9, rayon: 0.5 }
    ],
    depart: { x: -4, y: 0, theta: 0 }
  },

  {
    id: "salle",
    nom: "Salle encombrée",
    resume: "9 × 7 mètres, cinq obstacles, une diagonale à franchir.",
    bornes: [-4.5, -3.5, 4.5, 3.5],
    murs: [
      ...boite(-4.5, -3.5, 4.5, 3.5),
      ...obstacle(-1.5, -1.0, 0.8, 2.0),
      ...obstacle(0.8, 1.4, 1.6, 0.7),
      ...obstacle(2.4, -1.8, 0.7, 1.6),
      ...obstacle(-0.6, 2.2, 0.9, 0.9),
      ...obstacle(3.2, 0.6, 0.6, 0.6)
    ],
    zones: [{ id: "arrivee", label: "Arrivée", x: 3.7, y: 2.7, rayon: 0.5 }],
    depart: { x: -3.8, y: -2.6, theta: 0 }
  },

  {
    id: "labyrinthe",
    nom: "Serpentin",
    resume: "Trois cloisons décalées : il faut remonter, redescendre, remonter.",
    bornes: [-4.2, -3, 4.2, 3],
    murs: [
      ...boite(-4.2, -3, 4.2, 3),
      mur(-2, -3, -2, 1.4),
      mur(0, 3, 0, -1.4),
      mur(2, -3, 2, 1.4)
    ],
    zones: [
      { id: "cp1", label: "Point 1", x: -1, y: 2.2, rayon: 0.6 },
      { id: "cp2", label: "Point 2", x: 1, y: -2.2, rayon: 0.6 },
      { id: "arrivee", label: "Arrivée", x: 3.3, y: 2.2, rayon: 0.6 }
    ],
    depart: { x: -3.4, y: -2.2, theta: 0 }
  }
];

export function getMonde(id: string): Monde {
  return MONDES.find((m) => m.id === id) ?? MONDES[0];
}
