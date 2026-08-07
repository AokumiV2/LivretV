export type ForgeConfig = {
  archetypeId: string;
  /** Nom du paquet ROS 2, en snake_case. */
  pkg: string;
  robotName: string;
  distro: "jazzy" | "humble";
  langue: "python" | "cpp";
  /** Composant retenu pour chaque rôle de la stack. */
  choix: Record<string, string>;
  geometrie: {
    rayonRoue: number;
    entraxe: number;
    longueur: number;
    largeur: number;
    hauteur: number;
    hauteurLidar: number;
    masse: number;
  };
  options: {
    nav2: boolean;
    slam: boolean;
    ekf: boolean;
    microRos: boolean;
    gazebo: boolean;
  };
};

export type GeneratedFile = {
  path: string;
  content: string;
  lang: "python" | "xml" | "yaml" | "bash" | "text" | "cpp";
};

/** Modèle géométrique simplifié, utilisé pour l'aperçu 3D. */
export type PreviewShape =
  | {
      kind: "box";
      name: string;
      size: [number, number, number];
      pos: [number, number, number];
      rotation?: [number, number, number];
      color: string;
    }
  | {
      kind: "cylinder";
      name: string;
      radius: number;
      length: number;
      pos: [number, number, number];
      axis: "x" | "y" | "z";
      rotation?: [number, number, number];
      color: string;
    };

export const GEOMETRIE_PAR_ARCHETYPE: Record<string, ForgeConfig["geometrie"]> = {
  rover: {
    rayonRoue: 0.065,
    entraxe: 0.32,
    longueur: 0.42,
    largeur: 0.3,
    hauteur: 0.09,
    hauteurLidar: 0.28,
    masse: 4.2
  },
  bras: {
    // Les champs roulants restent présents dans la configuration commune,
    // mais l'aperçu du bras utilise surtout l'emprise et la hauteur totale.
    rayonRoue: 0.04,
    entraxe: 0.22,
    longueur: 0.28,
    largeur: 0.28,
    hauteur: 0.08,
    hauteurLidar: 0.68,
    masse: 8
  },
  amr: {
    rayonRoue: 0.18,
    entraxe: 0.62,
    longueur: 0.9,
    largeur: 0.68,
    hauteur: 0.2,
    hauteurLidar: 0.72,
    masse: 32
  },
  table: {
    rayonRoue: 0.022,
    entraxe: 0.115,
    longueur: 0.16,
    largeur: 0.13,
    hauteur: 0.038,
    hauteurLidar: 0.075,
    masse: 0.65
  }
};

export const DEFAUT_GEOMETRIE: ForgeConfig["geometrie"] =
  GEOMETRIE_PAR_ARCHETYPE.rover;
