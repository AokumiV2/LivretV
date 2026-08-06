export type NavItem = {
  href: string;
  label: string;
  desc: string;
};

/** Navigation principale, affichée en haut de page. */
export const MAIN_NAV: NavItem[] = [
  { href: "/", label: "Accueil", desc: "Le point de départ" },
  { href: "/academy", label: "Academy", desc: "6 parcours, 24 leçons ROS 2" },
  { href: "/codex", label: "Codex", desc: "Catalogue de composants" },
  { href: "/atelier", label: "Atelier", desc: "Coder ROS 2 et simuler" },
  { href: "/lab/wiring", label: "Labs", desc: "Câblage et graphe de nœuds" },
  { href: "/forge", label: "Forge", desc: "Génère ton projet ROS 2" }
];

/** Navigation complète, affichée dans l'overlay du menu grille. */
export const FULL_NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Apprendre",
    items: [
      { href: "/academy", label: "Academy", desc: "Les 6 parcours progressifs" },
      { href: "/atelier", label: "Atelier", desc: "Écrire du ROS 2 et le simuler" },
      { href: "/glossaire", label: "Glossaire", desc: "Le vocabulaire ROS 2 décodé" },
      { href: "/terminal", label: "Terminal", desc: "Commandes ros2 et bac à sable" },
      { href: "/depannage", label: "Dépannage", desc: "Arbre de diagnostic guidé" }
    ]
  },
  {
    group: "Concevoir",
    items: [
      { href: "/codex", label: "Codex", desc: "Fiches composants détaillées" },
      { href: "/lab/wiring", label: "Wiring Lab", desc: "Câblage avec validation" },
      { href: "/lab/graph", label: "Node Graph", desc: "Simulateur de graphe ROS 2" },
      { href: "/forge", label: "Robot Forge", desc: "Génération de projet complet" }
    ]
  },
  {
    group: "Compte",
    items: [
      { href: "/profil", label: "Profil", desc: "XP, badges et projets" },
      { href: "/connexion", label: "Connexion", desc: "Retrouve ta progression" },
      { href: "/inscription", label: "Inscription", desc: "Créer un compte" }
    ]
  }
];

export const SOCIAL_RAIL = [
  { label: "Gh", href: "https://github.com/AokumiV2/LivretV", title: "GitHub" },
  { label: "Ros", href: "https://docs.ros.org/en/jazzy/", title: "Documentation ROS 2" },
  { label: "Ans", href: "https://robotics.stackexchange.com/", title: "Robotics Stack Exchange" },
  { label: "Dis", href: "https://discourse.ros.org/", title: "ROS Discourse" },
  { label: "Idx", href: "https://index.ros.org/", title: "ROS Index" }
];
