export type LessonState = {
  status: "en_cours" | "terminee";
  score: number;
  total: number;
  at: number;
};

export type ProgressMap = Record<string, LessonState>;

export type ProjectKind = "WIRING" | "GRAPH" | "FORGE";

export type ProjectRecord = {
  id: string;
  name: string;
  kind: ProjectKind;
  data: unknown;
  updatedAt: number;
};

export type Profile = {
  id: string;
  email: string;
  pseudo: string;
  xp: number;
};

/** XP attribué par type d'événement. */
export const XP = {
  lecon: 40,
  quizParfait: 60,
  quizReussi: 30,
  projet: 80
} as const;

export const BADGES: {
  id: string;
  nom: string;
  desc: string;
  test: (ctx: BadgeContext) => boolean;
}[] = [
  {
    id: "premiere-lecon",
    nom: "Premier node",
    desc: "Terminer une première leçon",
    test: (c) => c.leconsTerminees >= 1
  },
  {
    id: "parcours-fondations",
    nom: "Fondations posées",
    desc: "Terminer le parcours Fondations",
    test: (c) => c.parcoursTermines.includes("fondations")
  },
  {
    id: "dix-lecons",
    nom: "Dix sur dix",
    desc: "Terminer dix leçons",
    test: (c) => c.leconsTerminees >= 10
  },
  {
    id: "sans-faute",
    nom: "Sans faute",
    desc: "Obtenir un score parfait à cinq quiz",
    test: (c) => c.quizParfaits >= 5
  },
  {
    id: "cablage",
    nom: "Câbleur",
    desc: "Enregistrer un montage dans le Wiring Lab",
    test: (c) => c.projets.WIRING >= 1
  },
  {
    id: "graphiste",
    nom: "Architecte de graphe",
    desc: "Enregistrer un graphe de nodes",
    test: (c) => c.projets.GRAPH >= 1
  },
  {
    id: "forgeron",
    nom: "Forgeron",
    desc: "Générer un projet ROS 2 complet",
    test: (c) => c.projets.FORGE >= 1
  },
  {
    id: "cursus",
    nom: "Cursus complet",
    desc: "Terminer les six parcours",
    test: (c) => c.parcoursTermines.length >= 6
  }
];

export type BadgeContext = {
  leconsTerminees: number;
  quizParfaits: number;
  parcoursTermines: string[];
  projets: Record<ProjectKind, number>;
};
