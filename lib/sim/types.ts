import type { Qos } from "@/lib/graph/types";

/* ══════════════════════════════════════════════════════════════
   Types partagés entre la page, le worker et le moteur physique.
   Tout ce qui traverse `postMessage` doit rester sérialisable :
   pas de fonction, pas de classe, pas de Map.
   ══════════════════════════════════════════════════════════════ */

/* ---------- Monde ---------- */

/** Un mur, décrit par ses deux extrémités en mètres. */
export type Segment = { x1: number; y1: number; x2: number; y2: number };

export type Zone = {
  id: string;
  label: string;
  x: number;
  y: number;
  rayon: number;
};

export type Monde = {
  id: string;
  nom: string;
  resume: string;
  /** Emprise utile, en mètres : [xmin, ymin, xmax, ymax]. */
  bornes: [number, number, number, number];
  murs: Segment[];
  zones: Zone[];
  /** Pose de départ du robot : x, y en mètres, theta en radians. */
  depart: { x: number; y: number; theta: number };
};

/* ---------- Robot ---------- */

export type ProfilLidar = {
  /** Nombre de rayons sur un tour complet. */
  rayons: number;
  portee: number;
  porteeMin: number;
  hz: number;
  /** Écart-type du bruit de mesure, en mètres. */
  bruit: number;
  /** Hauteur du plan de scan, pour la vue 3D. */
  hauteur: number;
};

export type RobotSim = {
  /** Identifiant partagé avec `content/archetypes.ts`. */
  id: string;
  nom: string;
  /** Nom court, pour les sélecteurs. */
  court: string;
  resume: string;
  /** Disponible en simulation. `false` affiche la carte grisée. */
  simulable: boolean;
  raisonIndispo?: string;
  /** Rayon d'encombrement, pour les collisions. */
  rayon: number;
  longueur: number;
  largeur: number;
  hauteur: number;
  rayonRoue: number;
  entraxe: number;
  masse: number;
  /** Vitesses maximales admissibles. */
  vMax: number;
  wMax: number;
  /** Accélérations maximales : c'est l'inertie qui distingue les robots. */
  aMax: number;
  alphaMax: number;
  lidar: ProfilLidar | null;
  /** Topics publiés par la simulation elle-même. */
  capteurs: string[];
  /** Dérive d'odométrie : facteur d'erreur systématique par roue. */
  derive: { gauche: number; droite: number; bruit: number };
  /** Composants du Codex utilisés pour construire le modèle 3D. */
  modele3d: { composant: string; pos: [number, number, number]; etage: number }[];
  couleur: string;
};

/* ---------- État de simulation ---------- */

export type Pose = { x: number; y: number; theta: number };

export type EtatSim = {
  /** Temps simulé écoulé, en secondes. */
  t: number;
  /** Pose vraie, celle du monde. */
  pose: Pose;
  /** Pose telle que l'odométrie la croit — elle dérive. */
  poseOdom: Pose;
  v: number;
  w: number;
  /** Consigne reçue sur /cmd_vel, avant limitation. */
  consigne: { v: number; w: number };
  /** Angle des roues, en radians, pour l'animation 3D. */
  roues: [number, number];
  /** Dernier scan complet. `null` quand le robot n'a pas de LiDAR. */
  scan: number[] | null;
  collision: boolean;
  /** Nombre de contacts depuis le début du run. */
  chocs: number;
  /** Distance minimale à un mur sur tout le run. */
  distanceMinMur: number;
  /** Distance parcourue, en mètres. */
  parcouru: number;
  /** Temps passé à longer un mur, entre 25 et 80 cm. */
  tempsLongeMur: number;
  /** Traînée : une pose sur cinq, pour l'affichage. */
  trace: [number, number][];
  /** Zones visitées, dans l'ordre. */
  zonesVisitees: string[];
};

/* ---------- Bus ---------- */

export type QosSim = Qos;

export type Endpoint = {
  node: string;
  topic: string;
  msgType: string;
  qos: QosSim;
};

/** Statistiques accumulées par topic, interrogées par les objectifs. */
export type StatTopic = {
  topic: string;
  msgType: string;
  publishers: string[];
  subscribers: string[];
  /** Messages publiés. */
  publies: number;
  /** Messages effectivement remis à au moins un abonné. */
  remis: number;
  /** Fréquence moyenne de publication, en Hz. */
  hz: number;
  /** Dernier message publié, aplati en paires clé/valeur. */
  dernier: Record<string, unknown> | null;
  /** Abonnements refusés par la règle QoS. */
  rejets: { node: string; raison: string }[];
};

/* ---------- Trace, base des vérifications ---------- */

export type Trace = {
  /** Durée du run, en secondes simulées. */
  duree: number;
  topics: StatTopic[];
  /** Nœuds déclarés par le code de l'élève. */
  nodes: { name: string; pubs: Endpoint[]; subs: Endpoint[]; timers: number[] }[];
  /** Nombre d'appels de callback, par topic. */
  callbacks: Record<string, number>;
  /** Paramètres déclarés. */
  parametres: Record<string, unknown>;
  /** Services déclarés et nombre d'appels reçus. */
  services: Record<string, number>;
  /** Lignes passées à `get_logger()`. */
  logs: string[];
  etat: EtatSim;
  /** Vrai si `rclpy.spin()` a été appelé. */
  spin: boolean;
  /** Vrai si le script a levé une exception. */
  erreur: string | null;
};

/* ---------- Journal ---------- */

export type NiveauLog = "info" | "warn" | "error" | "debug" | "sortie" | "systeme";

export type LigneLog = {
  id: number;
  t: number;
  niveau: NiveauLog;
  node: string;
  texte: string;
  /** Ligne du script de l'élève, quand elle est connue. */
  ligne?: number;
};

/* ---------- Protocole worker ---------- */

export type VersWorker =
  | {
      type: "demarrer";
      code: string;
      robot: RobotSim;
      monde: Monde;
      graine: number;
      dureeMax: number;
      /** Appels de service déclenchés automatiquement, pour que le
       *  run reste reproductible quand une mission en dépend. */
      evenements?: Evenement[];
    }
  | { type: "pause"; valeur: boolean }
  | { type: "vitesse"; facteur: number }
  | { type: "teleop"; v: number; w: number }
  | { type: "service"; nom: string }
  | { type: "arreter" };

export type DepuisWorker =
  | { type: "pret" }
  | { type: "chargement"; phase: string; pct: number }
  | { type: "logs"; lignes: LigneLog[] }
  | { type: "tick"; etat: EtatSim; topics: StatTopic[] }
  | { type: "fini"; trace: Trace }
  | { type: "erreur"; message: string; ligne?: number };

/* ---------- Missions ---------- */

/** Un appel de service programmé à un instant de la simulation. */
export type Evenement = { t: number; service: string };

export type Objectif = {
  id: string;
  label: string;
  /** Indice affiché quand l'objectif reste rouge. */
  aide?: string;
  test: (t: Trace) => boolean;
};

export type Mission = {
  id: string;
  numero: number;
  titre: string;
  resume: string;
  /** Énoncé, en paragraphes. */
  enonce: string[];
  difficulte: "Découverte" | "Intermédiaire" | "Avancé";
  robot: string;
  monde: string;
  /** Durée simulée avant arrêt automatique, en secondes. */
  duree: number;
  depart: string;
  solution: string;
  indices: string[];
  objectifs: Objectif[];
  evenements?: Evenement[];
  concepts: { label: string; href: string }[];
  xp: number;
};
