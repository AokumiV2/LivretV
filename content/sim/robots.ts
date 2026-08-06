import type { RobotSim } from "@/lib/sim/types";

/* ══════════════════════════════════════════════════════════════
   Les robots pilotables en simulation.

   Ce ne sont pas de nouveaux robots : ce sont les archétypes du
   Codex, décrits ici avec ce qu'il faut pour les faire bouger.
   Les cotes sont celles des fiches, pas des valeurs choisies pour
   que ça marche.

   Ce qui les distingue vraiment, ce n'est pas la taille : c'est
   l'inertie. Le même code d'évitement passe sur le robot de table
   et rentre dans le mur avec l'AMR, parce que l'AMR met huit fois
   plus de temps à s'arrêter. C'est l'intérêt de pouvoir changer de
   robot sans changer une ligne.
   ══════════════════════════════════════════════════════════════ */

export const ROBOTS: RobotSim[] = [
  {
    id: "table",
    nom: "Robot de table",
    court: "Table",
    resume: "Petit, lent, inoffensif. Le robot des premiers pas.",
    simulable: true,
    rayon: 0.09,
    longueur: 0.17,
    largeur: 0.15,
    hauteur: 0.09,
    rayonRoue: 0.0325,
    entraxe: 0.13,
    masse: 0.9,
    vMax: 0.22,
    wMax: 2.4,
    aMax: 1.2,
    alphaMax: 8,
    lidar: {
      rayons: 360,
      portee: 3.5,
      porteeMin: 0.05,
      hz: 10,
      bruit: 0.008,
      hauteur: 0.075
    },
    capteurs: ["/scan", "/odom", "/imu/data", "/joint_states"],
    derive: { gauche: 1.0, droite: 1.002, bruit: 0.008 },
    modele3d: [
      { composant: "rpi-pico", pos: [0.0, 0.0, 0], etage: 0 },
      { composant: "tb6612fng", pos: [-0.045, 0.0, 0], etage: 0 },
      { composant: "ldlidar-ld19", pos: [0.02, 0, 0], etage: 1 },
      { composant: "bno055", pos: [0.045, 0.035, 0], etage: 0 }
    ],
    couleur: "#4da3ff"
  },

  {
    id: "rover",
    nom: "Rover différentiel",
    court: "Rover",
    resume: "Deux roues motrices, un LiDAR 12 m. Le robot de référence.",
    simulable: true,
    rayon: 0.17,
    longueur: 0.3,
    largeur: 0.22,
    hauteur: 0.12,
    rayonRoue: 0.0325,
    entraxe: 0.23,
    masse: 2.5,
    vMax: 0.6,
    wMax: 2.0,
    aMax: 0.7,
    alphaMax: 4,
    lidar: {
      rayons: 360,
      portee: 12,
      porteeMin: 0.15,
      hz: 10,
      bruit: 0.012,
      hauteur: 0.2
    },
    capteurs: ["/scan", "/odom", "/imu/data", "/joint_states"],
    derive: { gauche: 0.99975, droite: 1.00025, bruit: 0.01 },
    modele3d: [
      { composant: "rpi5", pos: [-0.03, 0, 0], etage: 0 },
      { composant: "esp32-s3", pos: [0.075, -0.055, 0], etage: 0 },
      { composant: "tb6612fng", pos: [0.075, 0.055, 0], etage: 0 },
      { composant: "lipo-3s-5000", pos: [-0.1, 0, 0], etage: 0 },
      { composant: "bno085", pos: [0.02, 0.06, 0], etage: 0 },
      { composant: "rplidar-a1", pos: [0, 0, 0], etage: 2 }
    ],
    couleur: "#2b6bff"
  },

  {
    id: "amr",
    nom: "AMR d'extérieur",
    court: "AMR",
    resume: "Lourd, rapide, LiDAR longue portée. Il ne pardonne pas l'à-peu-près.",
    simulable: true,
    rayon: 0.31,
    longueur: 0.58,
    largeur: 0.44,
    hauteur: 0.24,
    rayonRoue: 0.085,
    entraxe: 0.42,
    masse: 22,
    vMax: 1.4,
    wMax: 1.6,
    aMax: 0.35,
    alphaMax: 1.6,
    lidar: {
      rayons: 360,
      portee: 25,
      porteeMin: 0.25,
      hz: 10,
      bruit: 0.02,
      hauteur: 0.35
    },
    capteurs: ["/scan", "/odom", "/imu/data", "/joint_states"],
    derive: { gauche: 1.012, droite: 0.991, bruit: 0.035 },
    modele3d: [
      { composant: "jetson-orin-nano", pos: [-0.05, 0, 0], etage: 0 },
      { composant: "odrive-s1", pos: [0.13, 0.09, 0], etage: 0 },
      { composant: "lipo-4s-5200", pos: [-0.2, 0, 0], etage: 0 },
      { composant: "bno085", pos: [0.05, -0.1, 0], etage: 0 },
      { composant: "gps-zed-f9p", pos: [0.16, -0.09, 0], etage: 1 },
      { composant: "livox-mid360", pos: [0, 0, 0], etage: 2 }
    ],
    couleur: "#e0b23a"
  },

  {
    id: "bras",
    nom: "Bras 6 axes",
    court: "Bras",
    resume: "Six articulations et une pince.",
    simulable: false,
    raisonIndispo:
      "Le bras demande une cinématique articulée et un solveur de trajectoires — un moteur entièrement différent de la base roulante. Il n'est pas simulé pour l'instant, et le prétendre serait mentir sur ce qu'on t'apprend.",
    rayon: 0.2,
    longueur: 0.3,
    largeur: 0.3,
    hauteur: 0.6,
    rayonRoue: 0.03,
    entraxe: 0.2,
    masse: 6,
    vMax: 0,
    wMax: 0,
    aMax: 0,
    alphaMax: 0,
    lidar: null,
    capteurs: ["/joint_states"],
    derive: { gauche: 1, droite: 1, bruit: 0 },
    modele3d: [],
    couleur: "#8a8f9e"
  }
];

export function getRobot(id: string): RobotSim {
  return ROBOTS.find((r) => r.id === id) ?? ROBOTS[1];
}

export const ROBOTS_SIMULABLES = ROBOTS.filter((r) => r.simulable);
