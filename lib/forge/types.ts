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
      color: string;
    }
  | {
      kind: "cylinder";
      name: string;
      radius: number;
      length: number;
      pos: [number, number, number];
      axis: "x" | "y" | "z";
      color: string;
    };

export const DEFAUT_GEOMETRIE: ForgeConfig["geometrie"] = {
  rayonRoue: 0.0325,
  entraxe: 0.23,
  longueur: 0.3,
  largeur: 0.22,
  hauteur: 0.08,
  hauteurLidar: 0.2,
  masse: 2.5
};
