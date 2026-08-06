import type { GlossaryEntry } from "./types";

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: "Node",
    category: "Concept",
    short: "Un processus qui participe au graphe ROS 2",
    long: "Unité de base d'une application ROS 2. Un node porte un nom unique sur le réseau, peut publier et s'abonner à des topics, offrir des services et exposer des paramètres. On assemble un robot en assemblant des nodes indépendants.",
    see: ["Topic", "Graphe"]
  },
  {
    term: "Topic",
    category: "Concept",
    short: "Un flux de messages typés, unidirectionnel",
    long: "Canal nommé sur lequel des nodes publient et d'autres s'abonnent. Le publisher ne connaît pas ses lecteurs et ne bloque jamais. C'est ce découplage qui permet d'ajouter un consommateur sans modifier le producteur.",
    see: ["Publisher", "QoS"]
  },
  {
    term: "Service",
    category: "Concept",
    short: "Un appel de fonction à distance, avec réponse garantie",
    long: "Mécanisme requête/réponse pour les opérations ponctuelles et brèves : réinitialiser, calibrer, activer. Si l'opération dure plus d'une seconde, c'est une action qu'il faut utiliser.",
    see: ["Action"]
  },
  {
    term: "Action",
    category: "Concept",
    short: "Une tâche longue, suivie et annulable",
    long: "Combine un objectif, un flux de retours d'avancement et un résultat final, avec possibilité d'annulation. C'est le mécanisme de NavigateToPose dans Nav2.",
    see: ["Service", "Nav2"]
  },
  {
    term: "Message",
    category: "Concept",
    short: "La structure de données échangée sur un topic",
    long: "Définie dans un fichier .msg, compilée pour chaque langage. Publisher et subscriber doivent utiliser exactement le même type, sinon aucune connexion ne s'établit.",
    see: ["Topic", "Interface"]
  },
  {
    term: "Interface",
    category: "Concept",
    short: "Un message, un service ou une action définis par l'utilisateur",
    long: "Les interfaces personnalisées doivent vivre dans un paquet ament_cmake dédié : un paquet ament_python ne peut pas générer de code d'interface.",
    see: ["Message", "Paquet"]
  },
  {
    term: "QoS",
    category: "Réseau",
    short: "Les politiques qui décident si deux nodes arrivent à se connecter",
    long: "Reliability, Durability, History et Deadline. Un subscriber ne peut pas exiger plus que ce que le publisher offre : un abonné RELIABLE ne se connectera jamais à un publisher BEST_EFFORT, et ce, silencieusement.",
    see: ["DDS", "Topic"]
  },
  {
    term: "DDS",
    category: "Réseau",
    short: "Le middleware sous-jacent de ROS 2",
    long: "Data Distribution Service, un standard OMG utilisé dans l'industrie. Il assure la découverte automatique des nodes sans maître central, contrairement au roscore de ROS 1.",
    see: ["QoS", "RMW"]
  },
  {
    term: "RMW",
    category: "Réseau",
    short: "La couche d'abstraction au-dessus du DDS",
    long: "ROS Middleware Interface. Elle permet de changer d'implémentation DDS avec la variable RMW_IMPLEMENTATION. Attention : toutes les machines d'un même système doivent utiliser la même.",
    see: ["DDS"]
  },
  {
    term: "ROS_DOMAIN_ID",
    category: "Réseau",
    short: "Un numéro qui isole les graphes ROS entre eux",
    long: "Deux machines avec des domaines différents ne se voient pas, même sur le même réseau physique. Indispensable dans une salle avec plusieurs robots.",
    see: ["DDS"]
  },
  {
    term: "TF2",
    category: "Concept",
    short: "Le système qui suit les repères géométriques dans le temps",
    long: "Maintient les relations spatiales entre tous les repères du robot et permet de convertir un point de l'un vers l'autre à un instant donné. Sans TF2, une mesure de capteur n'a aucune signification spatiale.",
    see: ["Frame", "URDF"]
  },
  {
    term: "Frame",
    category: "Concept",
    short: "Un repère de coordonnées nommé",
    long: "base_link, laser_frame, odom, map. Chaque frame a exactement un parent : l'ensemble forme un arbre, jamais un graphe. Deux publieurs pour la même transformation rendent l'arbre incohérent.",
    see: ["TF2"]
  },
  {
    term: "base_link",
    category: "Concept",
    short: "Le repère attaché au corps du robot",
    long: "Par convention, l'origine du robot, avec x vers l'avant, y vers la gauche et z vers le haut. Tous les capteurs sont positionnés par rapport à lui.",
    see: ["Frame", "base_footprint"]
  },
  {
    term: "base_footprint",
    category: "Concept",
    short: "La projection de base_link au sol",
    long: "Repère au niveau du sol, sous le centre du robot. Utile pour la navigation 2D, où la hauteur n'a pas de sens.",
    see: ["base_link"]
  },
  {
    term: "odom",
    category: "Concept",
    short: "Le repère de l'odométrie, continu mais dérivant",
    long: "La transformation odom → base_link ne saute jamais, ce qui est indispensable pour un asservissement, mais elle dérive avec le glissement des roues.",
    see: ["map", "Odométrie"]
  },
  {
    term: "map",
    category: "Concept",
    short: "Le repère absolu de la carte",
    long: "La transformation map → odom est la correction apportée par le SLAM ou AMCL. Elle saute au moment des recalages, ce qui est acceptable puisqu'elle sert à la planification, pas à l'asservissement.",
    see: ["odom", "SLAM"]
  },
  {
    term: "URDF",
    category: "Concept",
    short: "Le fichier XML qui décrit la structure du robot",
    long: "Des corps rigides (link) reliés par des articulations (joint). À partir de ce seul fichier, robot_state_publisher produit l'arbre TF, RViz2 affiche le robot et Gazebo le simule.",
    see: ["xacro", "TF2"]
  },
  {
    term: "xacro",
    category: "Outil",
    short: "Un préprocesseur XML pour les URDF",
    long: "Ajoute des variables, des macros et des calculs à l'URDF. Décrire quatre roues devient un appel de macro répété quatre fois au lieu de quatre blocs identiques.",
    see: ["URDF"]
  },
  {
    term: "Odométrie",
    category: "Maths",
    short: "L'estimation de position par intégration du mouvement des roues",
    long: "Base de la localisation, et fondamentalement dérivante : chaque erreur s'ajoute aux précédentes sans jamais être corrigée. Il faut la fusionner avec une IMU et un recalage laser.",
    see: ["EKF", "SLAM"]
  },
  {
    term: "SLAM",
    category: "Concept",
    short: "Cartographier et se localiser simultanément",
    long: "Simultaneous Localization And Mapping. Résout le problème circulaire — il faut une carte pour se situer, et savoir où l'on est pour cartographier — en recalant chaque nouveau scan sur ce qui est déjà connu.",
    see: ["Fermeture de boucle", "Nav2"]
  },
  {
    term: "Fermeture de boucle",
    category: "Concept",
    short: "La reconnaissance d'un lieu déjà visité",
    long: "Quand le robot revient sur ses pas, la dérive accumulée fait que la carte ne se referme pas. La détection de boucle redistribue l'erreur sur tout le graphe de poses, et la carte se remet d'un coup en place.",
    see: ["SLAM"]
  },
  {
    term: "Nav2",
    category: "Outil",
    short: "La pile de navigation autonome de ROS 2",
    long: "Un assemblage de serveurs — planificateur, contrôleur, comportements de secours — coordonnés par un arbre de comportement. Savoir quel serveur fait quoi est essentiel pour diagnostiquer un robot immobile.",
    see: ["Costmap", "Arbre de comportement"]
  },
  {
    term: "Costmap",
    category: "Concept",
    short: "Une grille où chaque case porte un coût de traversée",
    long: "La carte globale sert à la planification sur la carte connue, la carte locale suit le robot pour l'évitement immédiat. Les paramètres robot_radius et inflation_radius expliquent la majorité des échecs de navigation.",
    see: ["Nav2", "Inflation"]
  },
  {
    term: "Inflation",
    category: "Concept",
    short: "Le gonflement des obstacles dans la carte de coût",
    long: "Marge de sécurité ajoutée autour des obstacles pour que le planificateur ne rase pas les murs. Trop large, les couloirs étroits deviennent infranchissables.",
    see: ["Costmap"]
  },
  {
    term: "AMCL",
    category: "Outil",
    short: "Localisation par filtre particulaire sur une carte connue",
    long: "Adaptive Monte Carlo Localization. Plus léger que le SLAM en mode localisation, mais la carte reste figée et la position initiale doit être fournie manuellement.",
    see: ["SLAM", "map"]
  },
  {
    term: "EKF",
    category: "Maths",
    short: "Filtre de Kalman étendu, pour fusionner des capteurs",
    long: "Combine plusieurs sources en pondérant chacune par sa covariance. Le paquet robot_localization en fournit une implémentation prête à configurer. Une covariance à zéro signifie « certitude absolue » et fait ignorer toutes les autres sources.",
    see: ["Covariance", "Odométrie"]
  },
  {
    term: "Covariance",
    category: "Maths",
    short: "La déclaration formelle de l'incertitude d'une mesure",
    long: "Matrice qui dit au filtre à quel point croire chaque dimension. Pour une dimension non mesurée, mets une très grande valeur comme 1e6, jamais zéro.",
    see: ["EKF"]
  },
  {
    term: "Quaternion",
    category: "Maths",
    short: "La représentation d'une rotation en quatre nombres",
    long: "ROS utilise systématiquement des quaternions (x, y, z, w) plutôt que des angles d'Euler, parce qu'ils ne souffrent pas du blocage de cardan. Un quaternion entièrement à zéro est invalide : le neutre est w = 1.",
    see: ["TF2"]
  },
  {
    term: "colcon",
    category: "Outil",
    short: "L'outil de compilation des espaces de travail ROS 2",
    long: "Se lance depuis la racine du workspace, jamais depuis src/. L'option --symlink-install évite de recompiler à chaque modification d'un fichier Python.",
    see: ["Workspace", "Paquet"]
  },
  {
    term: "Workspace",
    category: "Concept",
    short: "Un dossier contenant src/ et les artefacts de compilation",
    long: "Seul src/ se versionne. build/, install/ et log/ sont entièrement régénérables par colcon.",
    see: ["colcon", "Overlay"]
  },
  {
    term: "Overlay",
    category: "Concept",
    short: "La superposition d'un workspace au-dessus de l'installation système",
    long: "Sourcer /opt/ros/jazzy puis son workspace fait que les paquets locaux prennent le pas sur ceux du système. L'ordre compte : le système d'abord.",
    see: ["Workspace"]
  },
  {
    term: "Paquet",
    category: "Concept",
    short: "L'unité de distribution de ROS 2",
    long: "Un dossier avec un package.xml qui déclare nom, licence et dépendances. Deux types de compilation : ament_python et ament_cmake.",
    see: ["rosdep", "colcon"]
  },
  {
    term: "rosdep",
    category: "Outil",
    short: "L'installateur de dépendances déclarées dans package.xml",
    long: "Lit les balises depend et installe les paquets système correspondants. C'est ce qui rend un projet reproductible sur une autre machine.",
    see: ["Paquet"]
  },
  {
    term: "Launch file",
    category: "Outil",
    short: "Un script Python qui démarre plusieurs nodes ensemble",
    long: "Permet de passer des paramètres, remapper des topics, inclure d'autres launch files et conditionner le démarrage. Structure-les par couches : description, matériel, capteurs, navigation.",
    see: ["Paramètre"]
  },
  {
    term: "Paramètre",
    category: "Concept",
    short: "Une valeur nommée attachée à un node",
    long: "Tout réglage — gain PID, port série, rayon de roue — doit être un paramètre. En ROS 2, la déclaration est obligatoire avant toute lecture.",
    see: ["Launch file"]
  },
  {
    term: "Remapping",
    category: "Concept",
    short: "Renommer un topic ou un node au lancement",
    long: "Permet de lancer deux instances du même programme sans toucher au code. L'espace de noms est souvent plus propre qu'un remappage topic par topic.",
    see: ["Namespace"]
  },
  {
    term: "Namespace",
    category: "Concept",
    short: "Un préfixe appliqué à tous les noms d'un node",
    long: "/robot1/scan, /robot1/cmd_vel. Un seul argument au lancement préfixe tout, ce qui est indispensable pour une flotte de robots.",
    see: ["Remapping"]
  },
  {
    term: "ros2_control",
    category: "Outil",
    short: "La couche d'abstraction entre contrôleurs et matériel",
    long: "Écris l'interface matérielle une fois, et tous les contrôleurs standards deviennent utilisables. read() et write() doivent être rapides : elles cadencent toute la boucle.",
    see: ["Contrôleur"]
  },
  {
    term: "Contrôleur",
    category: "Outil",
    short: "Le composant qui transforme une consigne en commandes d'articulations",
    long: "diff_drive_controller transforme un Twist en vitesses de roues et produit l'odométrie. joint_trajectory_controller suit une trajectoire pour un bras.",
    see: ["ros2_control"]
  },
  {
    term: "micro-ROS",
    category: "Outil",
    short: "ROS 2 sur microcontrôleur",
    long: "Permet à un ESP32 ou un Teensy d'être un vrai node ROS 2. Un agent tournant côté Linux traduit le protocole allégé XRCE-DDS vers le graphe DDS. Sans agent, le node reste invisible.",
    see: ["DDS"]
  },
  {
    term: "MoveIt 2",
    category: "Outil",
    short: "La pile de manipulation pour les bras robotisés",
    long: "Cinématique inverse, planification avec évitement de collision, exécution de trajectoires. Ce qui n'est pas déclaré dans la scène n'existe pas pour lui.",
    see: ["Cinématique inverse"]
  },
  {
    term: "Cinématique inverse",
    category: "Maths",
    short: "Calculer les angles d'articulations à partir d'une position d'outil",
    long: "Le problème inverse de la cinématique directe. Peut avoir zéro, une ou une infinité de solutions selon la géométrie du bras et la cible demandée.",
    see: ["MoveIt 2"]
  },
  {
    term: "Arbre de comportement",
    category: "Concept",
    short: "Une logique de décision structurée en arbre",
    long: "Des nœuds de contrôle — Sequence, Fallback, Retry — organisent l'exécution de nœuds feuilles qui font le travail. Plus lisible qu'une machine à états quand les cas de récupération se multiplient.",
    see: ["Nav2"]
  },
  {
    term: "rosbag",
    category: "Outil",
    short: "L'enregistreur et le rejoueur de topics",
    long: "Enregistre les messages pour les rejouer et les analyser hors ligne. N'oublie jamais /tf_static : sans lui, le rejeu est inexploitable.",
    see: ["Topic"]
  },
  {
    term: "RViz2",
    category: "Outil",
    short: "L'outil de visualisation 3D de ROS 2",
    long: "Affiche ce qui circule réellement dans le graphe. Ce n'est pas un simulateur : si rien ne s'affiche, c'est que la donnée n'arrive pas ou que le repère est manquant.",
    see: ["Frame", "Marker"]
  },
  {
    term: "Marker",
    category: "Outil",
    short: "Une primitive graphique publiée pour être affichée dans RViz2",
    long: "Sphères, flèches, textes, lignes. Souvent plus efficace que des dizaines de lignes de log pour comprendre ce que fait un algorithme.",
    see: ["RViz2"]
  },
  {
    term: "Gazebo",
    category: "Outil",
    short: "Le simulateur physique associé à ROS 2",
    long: "Depuis 2025, Gazebo Classic est mort : la version actuelle s'utilise avec la commande gz et le paquet ros_gz. Un pont convertit les messages entre les deux mondes, topic par topic.",
    see: ["use_sim_time"]
  },
  {
    term: "use_sim_time",
    category: "Concept",
    short: "Le paramètre qui fait lire l'heure sur /clock plutôt que sur l'horloge système",
    long: "En simulation, tous les nodes doivent l'avoir à true, RViz2 compris. Un seul oubli produit des erreurs d'extrapolation TF2 qui ressemblent à un problème réseau.",
    see: ["Gazebo", "TF2"]
  },
  {
    term: "I2C",
    category: "Matériel",
    short: "Un bus série à deux fils, avec adressage",
    long: "SDA et SCL, plusieurs périphériques sur le même bus, chacun avec son adresse. Deux capteurs à la même adresse rendent le bus inutilisable : c'est le conflit le plus courant en robotique amateur.",
    see: ["Multiplexeur"]
  },
  {
    term: "Multiplexeur",
    category: "Matériel",
    short: "Un répartiteur de bus I2C",
    long: "Le TCA9548A répartit un bus sur huit canaux commutables. La seule solution propre quand plusieurs capteurs partagent une adresse fixe et non modifiable.",
    see: ["I2C"]
  },
  {
    term: "Quadrature",
    category: "Matériel",
    short: "Deux signaux carrés déphasés de 90°",
    long: "Le principe des encodeurs incrémentaux : compter les fronts donne la position, l'ordre des voies donne le sens. En comptant tous les fronts, on multiplie la résolution par quatre.",
    see: ["Encodeur"]
  },
  {
    term: "Encodeur",
    category: "Matériel",
    short: "Le capteur qui mesure la rotation d'un arbre",
    long: "Incrémental : la position est perdue à l'extinction. Absolu comme l'AS5600 : elle est conservée. C'est la brique de base de l'odométrie.",
    see: ["Quadrature", "Odométrie"]
  },
  {
    term: "PWM",
    category: "Matériel",
    short: "Modulation de largeur d'impulsion",
    long: "Fait varier la puissance moyenne envoyée à un moteur en changeant le rapport cyclique d'un signal carré. Sert aussi à commander la position d'un servo standard.",
    see: ["Pont en H"]
  },
  {
    term: "Pont en H",
    category: "Matériel",
    short: "L'étage de puissance qui permet d'inverser un moteur",
    long: "Quatre interrupteurs qui inversent la polarité aux bornes du moteur. Préfère les versions MOSFET comme le TB6612 : le L298N bipolaire perd 2 V en chaleur.",
    see: ["PWM"]
  },
  {
    term: "BEC",
    category: "Matériel",
    short: "Un régulateur abaisseur pour l'électronique embarquée",
    long: "Transforme la tension batterie en 5 V stable. Utilise-en toujours deux : un pour le calculateur, un pour les servos, sinon les pics de courant font redémarrer le Raspberry Pi.",
    see: ["LiPo"]
  },
  {
    term: "LiPo",
    category: "Matériel",
    short: "Batterie lithium-polymère, forte densité d'énergie",
    long: "3S signifie trois éléments en série, soit 11,1 V nominal. Ne jamais descendre sous 3,3 V par élément, stocker à 3,8 V, charger sous surveillance dans un sac ignifuge.",
    see: ["BEC", "BMS"]
  },
  {
    term: "BMS",
    category: "Matériel",
    short: "Le circuit de protection d'un pack de batteries",
    long: "Coupe en cas de surcharge, décharge profonde ou court-circuit, et équilibre les éléments. La coupure est brutale : publie l'état de batterie pour l'anticiper.",
    see: ["LiPo"]
  },
  {
    term: "Adaptateur de niveau",
    category: "Matériel",
    short: "Le convertisseur 5 V ↔ 3,3 V",
    long: "Deux euros qui évitent de détruire un Raspberry Pi ou un Teensy. Nécessaire dès qu'un encodeur, un HC-SR04 ou tout capteur 5 V rencontre une carte 3,3 V.",
    see: ["I2C"]
  }
];

export const GLOSSARY_CATEGORIES = [
  "Concept",
  "Outil",
  "Matériel",
  "Réseau",
  "Maths"
] as const;

export function findTerm(term: string): GlossaryEntry | undefined {
  const t = term.toLowerCase();
  return GLOSSARY.find((g) => g.term.toLowerCase() === t);
}
