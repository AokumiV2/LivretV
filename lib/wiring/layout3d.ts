import { getComponent } from "@/content/components";
import type { Category, Component } from "@/content/types";
import { tailleDe } from "@/lib/three/dimensions";
import { pinOf, type WiringDoc } from "./types";

/* ══════════════════════════════════════════════════════════════
   Conversion du schéma 2D en implantation physique.

   La position que tu donnes aux cartes sur le canvas est réutilisée
   comme position sur le châssis : ranger proprement le schéma range
   aussi le robot. La hauteur, elle, vient du rôle du composant.
   ══════════════════════════════════════════════════════════════ */

export type Boite3D = {
  uid: string;
  componentId: string;
  nom: string;
  categorie: Category;
  /** Dimensions en mètres. */
  taille: [number, number, number];
  /** Centre de la boîte, en mètres, repère base_link. */
  pos: [number, number, number];
  couleur: string;
  etage: number;
};

export type Fil3D = {
  id: string;
  /** Composants reliés, pour pouvoir mettre en avant ceux d'une sélection. */
  deUid: string;
  versUid: string;
  role: string;
  de: [number, number, number];
  vers: [number, number, number];
  couleur: string;
  /** Longueur de câble estimée, en mètres, cheminement compris. */
  longueur: number;
};

export type Layout3D = {
  boites: Boite3D[];
  fils: Fil3D[];
  chassis: { longueur: number; largeur: number; etages: number[] };
  /** Longueur totale de câble à prévoir, en mètres. */
  longueurCable: number;
  masse: number;
};

const COULEURS: Record<Category, string> = {
  calculateur: "#1a2fff",
  microcontroleur: "#5ee0ff",
  moteur: "#e0a83c",
  driver: "#ff4d5e",
  capteur: "#3ddc9a",
  camera: "#a78bfa",
  alimentation: "#767d92",
  communication: "#4a4f66",
  chassis: "#22242f"
};

/**
 * Étage d'implantation. Ce n'est pas décoratif : la masse va en bas pour
 * abaisser le centre de gravité, et le LiDAR va en haut pour voir.
 */
function etageDe(c: Component): number {
  switch (c.category) {
    case "alimentation":
      return 0; // batterie au plus bas
    case "moteur":
    case "driver":
      return 0;
    case "chassis":
      return 0;
    case "calculateur":
    case "microcontroleur":
    case "communication":
      return 1;
    case "capteur":
    case "camera":
      // Un LiDAR rotatif doit dominer le robot ; les autres capteurs non.
      return c.buses.includes("UART") && c.currentMa.typ > 200 ? 2 : 1;
    default:
      return 1;
  }
}

const HAUTEUR_ETAGE = [0.045, 0.1, 0.2];
const EP_PLATEAU = 0.004;

export function construireLayout(doc: WiringDoc): Layout3D {
  const boites: Boite3D[] = [];

  // Le canvas fait environ 1200 × 700 px ; on le ramène à un châssis
  // de 30 × 22 cm, en conservant les positions relatives.
  const xs = doc.placed.map((p) => p.x);
  const ys = doc.placed.map((p) => p.y);
  const minX = xs.length ? Math.min(...xs) : 0;
  const maxX = xs.length ? Math.max(...xs) : 1;
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxY = ys.length ? Math.max(...ys) : 1;

  const chassisL = 0.3;
  const chassisW = 0.22;
  const etendueX = Math.max(1, maxX - minX);
  const etendueY = Math.max(1, maxY - minY);

  let masse = 0;

  for (const p of doc.placed) {
    const c = getComponent(p.componentId);
    if (!c) continue;

    const taille = tailleDe(c);
    const etage = etageDe(c);
    masse += c.weightG ?? 0;

    // Le canvas descend quand y augmente ; l'axe y de ROS pointe à gauche.
    const u = (p.x - minX) / etendueX;
    const v = (p.y - minY) / etendueY;

    const marge = 0.03;
    const x = -chassisL / 2 + marge + u * (chassisL - 2 * marge);
    const y = chassisW / 2 - marge - v * (chassisW - 2 * marge);
    const z = HAUTEUR_ETAGE[etage] + EP_PLATEAU / 2 + taille[2] / 2;

    boites.push({
      uid: p.uid,
      componentId: c.id,
      nom: c.name,
      categorie: c.category,
      taille,
      pos: [x, y, z],
      couleur: COULEURS[c.category],
      etage
    });
  }

  // ── Fils ──
  const parUid = new Map(boites.map((b) => [b.uid, b]));
  const fils: Fil3D[] = [];
  let longueurCable = 0;

  for (const l of doc.links) {
    const a = parUid.get(l.from.uid);
    const b = parUid.get(l.to.uid);
    if (!a || !b) continue;

    const pa = doc.placed.find((x) => x.uid === l.from.uid);
    const kind = pa ? pinOf(pa, l.from.pinId)?.kind : undefined;

    const de: [number, number, number] = [
      a.pos[0],
      a.pos[1],
      a.pos[2] + a.taille[2] / 2
    ];
    const vers: [number, number, number] = [
      b.pos[0],
      b.pos[1],
      b.pos[2] + b.taille[2] / 2
    ];

    const d = Math.hypot(de[0] - vers[0], de[1] - vers[1], de[2] - vers[2]);
    // Un câble ne va jamais en ligne droite : il longe le châssis et il
    // faut du mou aux deux extrémités. 40 % de marge, plus 6 cm.
    const longueur = d * 1.4 + 0.06;
    longueurCable += longueur;

    fils.push({
      id: l.id,
      deUid: a.uid,
      versUid: b.uid,
      role: kind ?? "signal",
      de,
      vers,
      couleur: couleurFilKind(kind),
      longueur
    });
  }

  const etages = [...new Set(boites.map((b) => b.etage))].sort();

  return {
    boites,
    fils,
    chassis: { longueur: chassisL, largeur: chassisW, etages },
    longueurCable,
    masse
  };
}

function couleurFilKind(kind?: string): string {
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

export const ETAGE_LABEL = ["Plateau bas · masse et puissance", "Plateau haut · calcul", "Mât · perception"];
