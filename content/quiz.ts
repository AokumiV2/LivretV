import type { Question } from "./types";

/**
 * Les questions sont rattachées à une leçon par son identifiant global
 * "parcours/lecon". Chaque leçon déclare la liste des ids qu'elle utilise.
 */
export const QUESTIONS: Question[] = [
  /* ═══════════ Fondations ═══════════ */
  {
    id: "q-fond-1",
    lesson: "fondations/pourquoi-ros2",
    prompt: "ROS 2 est-il un système d'exploitation ?",
    choices: [
      "Non : c'est un middleware qui tourne au-dessus de Linux",
      "Oui, il remplace Linux sur le robot",
      "Oui, mais uniquement sur les microcontrôleurs",
      "Non : c'est un langage de programmation dédié à la robotique"
    ],
    answer: 0,
    explain:
      "Malgré son nom, ROS 2 s'installe sur un système d'exploitation existant, généralement Ubuntu. Il apporte un middleware de communication, des conventions et un écosystème de paquets."
  },
  {
    id: "q-fond-2",
    lesson: "fondations/pourquoi-ros2",
    prompt: "Quel est le principal avantage du découplage publisher / subscriber ?",
    choices: [
      "Le publisher ignore qui l'écoute : on peut ajouter des consommateurs sans le modifier",
      "Les messages sont transmis plus rapidement",
      "Cela réduit la consommation mémoire",
      "Cela permet d'utiliser plusieurs langages de programmation"
    ],
    answer: 0,
    explain:
      "C'est cette indépendance qui rend un robot ROS 2 modifiable : ajouter un enregistreur ou un second algorithme sur un flux existant ne demande aucune modification du node qui publie."
  },
  {
    id: "q-fond-3",
    lesson: "fondations/pourquoi-ros2",
    prompt:
      "Tu démarres un projet neuf en 2026 sur un Raspberry Pi 5. Quelle distribution choisir ?",
    choices: [
      "ROS 2 Jazzy sur Ubuntu 24.04",
      "ROS 1 Noetic, plus stable car plus ancien",
      "ROS 2 Rolling, pour avoir les dernières fonctionnalités",
      "Peu importe, elles sont interchangeables"
    ],
    answer: 0,
    explain:
      "Noetic n'est plus maintenu depuis mai 2025. Rolling change en permanence et n'est pas fait pour un robot en service. Jazzy est supporté jusqu'en 2029 et correspond à Ubuntu 24.04."
  },
  {
    id: "q-fond-4",
    lesson: "fondations/installer-ros2",
    prompt: "À quoi sert ROS_DOMAIN_ID ?",
    choices: [
      "À isoler des graphes ROS différents sur un même réseau",
      "À identifier le robot dans une base de données",
      "À choisir le port TCP utilisé par les topics",
      "À définir la priorité d'ordonnancement des nodes"
    ],
    answer: 0,
    explain:
      "Deux machines avec des ROS_DOMAIN_ID différents ne se voient pas. C'est indispensable dans une salle où plusieurs robots partagent le même réseau."
  },
  {
    id: "q-fond-5",
    lesson: "fondations/installer-ros2",
    prompt:
      "Ton PC ne voit aucun topic du robot alors que les deux sont sur le même réseau. Quelle variable vérifier en premier ?",
    choices: [
      "ROS_LOCALHOST_ONLY, qui bloque toute communication hors machine",
      "ROS_PYTHON_VERSION",
      "AMENT_PREFIX_PATH",
      "COLCON_PREFIX_PATH"
    ],
    answer: 0,
    explain:
      "ROS_LOCALHOST_ONLY=1 restreint la découverte à la machine locale. C'est pratique en développement solo, et c'est exactement ce qui empêche le multi-machines de fonctionner."
  },
  {
    id: "q-fond-6",
    lesson: "fondations/workspace-colcon",
    prompt: "Dans quel ordre faut-il sourcer les environnements ?",
    choices: [
      "D'abord /opt/ros/jazzy, puis l'espace de travail",
      "D'abord l'espace de travail, puis /opt/ros/jazzy",
      "L'ordre n'a aucune importance",
      "Il ne faut jamais sourcer les deux ensemble"
    ],
    answer: 0,
    explain:
      "L'installation système est la couche de base, ton workspace se superpose par-dessus. Cet ordre fait que tes paquets prennent le pas sur ceux du système en cas de nom identique."
  },
  {
    id: "q-fond-7",
    lesson: "fondations/workspace-colcon",
    prompt: "Que fait l'option --symlink-install de colcon ?",
    choices: [
      "Elle crée des liens symboliques au lieu de copier : modifier un fichier Python ne nécessite plus de recompiler",
      "Elle accélère la compilation C++ en parallélisant davantage",
      "Elle installe les dépendances système manquantes",
      "Elle réduit la taille du dossier build"
    ],
    answer: 0,
    explain:
      "Sans elle, colcon copie les fichiers Python vers install/ et chaque modification impose un rebuild. C'est l'option à utiliser systématiquement en développement."
  },
  {
    id: "q-fond-8",
    lesson: "fondations/workspace-colcon",
    prompt: "Quels dossiers d'un espace de travail faut-il versionner dans git ?",
    choices: [
      "Uniquement src/",
      "src/ et install/",
      "Tous les dossiers",
      "src/ et build/"
    ],
    answer: 0,
    explain:
      "build/, install/ et log/ sont entièrement régénérés par colcon. Les versionner alourdit le dépôt et provoque des conflits inutiles."
  },
  {
    id: "q-fond-9",
    lesson: "fondations/premier-package",
    prompt:
      "Tu as écrit mon_noeud.py mais ros2 run répond « No executable found ». Pourquoi ?",
    choices: [
      "Le node n'est pas déclaré dans les entry_points de setup.py",
      "Le fichier n'a pas les droits d'exécution",
      "Il manque un shebang en début de fichier",
      "Le nom du fichier doit finir par _node.py"
    ],
    answer: 0,
    explain:
      "ros2 run cherche un exécutable installé. Tant que le point d'entrée n'est pas déclaré dans setup.py puis recompilé, la commande n'existe pas."
  },
  {
    id: "q-fond-10",
    lesson: "fondations/premier-package",
    prompt: "Quand faut-il préférer C++ à Python pour un node ?",
    choices: [
      "Quand une mesure de performance montre que Python ne suit pas, typiquement au-delà de 100 Hz ou en traitement d'image",
      "Toujours : Python n'est pas adapté à la robotique",
      "Uniquement pour les nodes qui parlent à du matériel",
      "Jamais, C++ n'apporte rien en ROS 2"
    ],
    answer: 0,
    explain:
      "Écris en Python d'abord, mesure, puis réécris en C++ ce qui pose réellement problème. Réécrire par principe fait perdre du temps sur un robot qui tourne à 10 Hz."
  },

  /* ═══════════ Communication ═══════════ */
  {
    id: "q-com-1",
    lesson: "communication/nodes",
    prompt: "Que se passe-t-il si un callback contient time.sleep(2.0) ?",
    choices: [
      "L'exécuteur mono-thread est bloqué : le node ne traite plus rien pendant 2 secondes",
      "Seul ce callback est retardé, les autres continuent",
      "ROS 2 lève une exception de timeout",
      "Le callback est exécuté dans un thread séparé automatiquement"
    ],
    answer: 0,
    explain:
      "L'exécuteur par défaut traite un callback à la fois. Bloquer dedans gèle timers, abonnements et services du node entier."
  },
  {
    id: "q-com-2",
    lesson: "communication/nodes",
    prompt: "Comment lancer deux instances du même node sans modifier le code ?",
    choices: [
      "En remappant le nom du node et ses topics au lancement, ou via un espace de noms",
      "C'est impossible, il faut dupliquer le fichier source",
      "En changeant le ROS_DOMAIN_ID de la seconde instance",
      "En compilant le paquet deux fois sous des noms différents"
    ],
    answer: 0,
    explain:
      "Les arguments --ros-args -r __node:= et -r __ns:= permettent de renommer node et topics au lancement. C'est le mécanisme prévu pour les capteurs multiples."
  },
  {
    id: "q-com-3",
    lesson: "communication/topics",
    prompt: "Sur quel topic conventionnel envoie-t-on une consigne de vitesse ?",
    choices: ["/cmd_vel", "/velocity", "/robot/speed", "/motion_command"],
    answer: 0,
    explain:
      "Respecter les conventions est ce qui permet à teleop_twist_keyboard, Nav2 et tous les outils standards de fonctionner avec ton robot sans configuration."
  },
  {
    id: "q-com-4",
    lesson: "communication/topics",
    prompt:
      "Pourquoi min(msg.ranges) sur un LaserScan peut-il retourner nan ?",
    choices: [
      "Les rayons invalides valent nan et les rayons sans écho valent inf : il faut filtrer sur range_min et range_max",
      "Parce que le LiDAR n'est pas calibré",
      "Parce que le tableau ranges est vide au démarrage",
      "Parce que la QoS est en BEST_EFFORT"
    ],
    answer: 0,
    explain:
      "nan contamine ensuite tous les calculs sans lever la moindre erreur. Filtre toujours les rayons sur les bornes déclarées dans le message."
  },
  {
    id: "q-com-5",
    lesson: "communication/topics",
    prompt: "Quelle profondeur de file choisir pour un flux de caméra ?",
    choices: [
      "1 — seule la dernière image est pertinente sur un robot en mouvement",
      "100 — pour ne perdre aucune image",
      "10 — la valeur par défaut convient toujours",
      "0 — pour désactiver la mise en file"
    ],
    answer: 0,
    explain:
      "Une file profonde fait traiter des images périmées quand l'algorithme prend du retard. Réagir à une image vieille de 500 ms est pire que de la sauter."
  },
  {
    id: "q-com-6",
    lesson: "communication/services",
    prompt: "Quand faut-il utiliser une action plutôt qu'un service ?",
    choices: [
      "Dès que l'opération dure plus d'une seconde ou doit pouvoir être annulée",
      "Quand plusieurs nodes doivent répondre à la même requête",
      "Quand la réponse contient un tableau de grande taille",
      "Quand le client et le serveur sont sur des machines différentes"
    ],
    answer: 0,
    explain:
      "Un service long bloque le client et n'offre ni retour d'avancement ni annulation. Naviguer, saisir ou explorer sont des actions."
  },
  {
    id: "q-com-7",
    lesson: "communication/services",
    prompt:
      "Pourquoi appeler un service avec call() depuis un callback provoque-t-il un interblocage ?",
    choices: [
      "La réponse ne peut être traitée que par spin(), déjà occupé à exécuter le callback",
      "Parce que le serveur refuse les appels imbriqués",
      "Parce que le timeout par défaut est nul",
      "Parce que les services ne sont pas thread-safe"
    ],
    answer: 0,
    explain:
      "L'appel synchrone attend une réponse que l'exécuteur ne pourra jamais traiter, puisqu'il est bloqué dans le callback appelant. Utilise call_async."
  },
  {
    id: "q-com-8",
    lesson: "communication/actions",
    prompt: "Quels sont les trois canaux d'une action ?",
    choices: [
      "Objectif, retour d'avancement, résultat",
      "Requête, réponse, erreur",
      "Publication, abonnement, service",
      "Début, milieu, fin"
    ],
    answer: 0,
    explain:
      "Le client envoie un objectif, reçoit des retours périodiques pendant l'exécution, puis un résultat final. Il peut annuler à tout moment."
  },
  {
    id: "q-com-9",
    lesson: "communication/actions",
    prompt:
      "Que doit impérativement faire un serveur d'action de déplacement avant de terminer, quelle que soit l'issue ?",
    choices: [
      "Publier une consigne de vitesse nulle",
      "Fermer le port série",
      "Réinitialiser l'odométrie",
      "Effacer la carte de coût"
    ],
    answer: 0,
    explain:
      "Succès, échec ou annulation : sans un Twist vide en sortie, le robot continue sur sa dernière consigne. C'est un problème de sécurité, pas de propreté."
  },
  {
    id: "q-com-10",
    lesson: "communication/parametres",
    prompt: "Que se passe-t-il si tu lis un paramètre non déclaré en ROS 2 ?",
    choices: [
      "Une exception est levée : la déclaration est obligatoire",
      "Le paramètre est créé automatiquement avec une valeur nulle",
      "Une valeur par défaut vide est retournée",
      "Un avertissement est affiché mais le code continue"
    ],
    answer: 0,
    explain:
      "Contrairement à ROS 1, ROS 2 exige declare_parameter avant toute lecture. Cette rigueur rend les paramètres découvrables avec ros2 param list."
  },
  {
    id: "q-com-11",
    lesson: "communication/parametres",
    prompt:
      "En simulation, tous les nodes doivent avoir use_sim_time à true. Que se passe-t-il si un seul l'oublie ?",
    choices: [
      "Il horodate avec le temps réel, TF2 rejette ses données pour écart temporel et le système paraît cassé",
      "Rien, ce paramètre est purement informatif",
      "Ce node tourne simplement plus vite que les autres",
      "La simulation s'arrête avec une erreur explicite"
    ],
    answer: 0,
    explain:
      "Le symptôme est un message d'extrapolation dans le futur, identique à celui d'horloges désynchronisées, ce qui rend le diagnostic confus."
  },
  {
    id: "q-com-12",
    lesson: "communication/qos-dds",
    prompt:
      "Un publisher en BEST_EFFORT et un subscriber en RELIABLE : que se passe-t-il ?",
    choices: [
      "Aucune connexion n'est établie, et aucune erreur n'est affichée",
      "La connexion se fait en mode dégradé BEST_EFFORT",
      "Une exception est levée au démarrage du subscriber",
      "Les messages passent mais sans garantie d'ordre"
    ],
    answer: 0,
    explain:
      "Le subscriber ne peut pas exiger plus que ce que le publisher offre. C'est le piège le plus coûteux en temps de ROS 2, parce que l'échec est totalement silencieux."
  },
  {
    id: "q-com-13",
    lesson: "communication/qos-dds",
    prompt: "Quelle commande affiche les QoS des deux côtés d'un topic ?",
    choices: [
      "ros2 topic info /le_topic --verbose",
      "ros2 topic echo /le_topic",
      "ros2 node info /le_node",
      "ros2 doctor --report"
    ],
    answer: 0,
    explain:
      "C'est l'outil de diagnostic à réflexe dès qu'un topic ne transporte rien alors que publisher et subscriber semblent en place."
  },
  {
    id: "q-com-14",
    lesson: "communication/qos-dds",
    prompt:
      "Quelle durability faut-il pour que RViz2, lancé après le SLAM, reçoive la carte ?",
    choices: [
      "TRANSIENT_LOCAL, qui conserve le dernier message pour les abonnés tardifs",
      "VOLATILE, qui est le comportement par défaut",
      "BEST_EFFORT, qui accélère la transmission",
      "KEEP_ALL, qui garde tout l'historique"
    ],
    answer: 0,
    explain:
      "TRANSIENT_LOCAL est utilisé par /map, /tf_static et /robot_description : ces données sont publiées une fois et doivent rester disponibles ensuite."
  },

  /* ═══════════ Représentation ═══════════ */
  {
    id: "q-rep-1",
    lesson: "representation/tf2",
    prompt: "Pourquoi sépare-t-on les repères map et odom ?",
    choices: [
      "odom → base_link est continue mais dérive, map → odom apporte une correction qui saute",
      "Pour permettre à deux robots de partager la même carte",
      "Parce que map est en 3D et odom en 2D",
      "Pour respecter la norme DDS"
    ],
    answer: 0,
    explain:
      "L'asservissement a besoin d'une position continue et lisse, la navigation a besoin d'une position juste. Séparer les deux repères permet d'avoir les deux."
  },
  {
    id: "q-rep-2",
    lesson: "representation/tf2",
    prompt: "Combien de parents un repère TF peut-il avoir ?",
    choices: [
      "Exactement un — c'est un arbre, pas un graphe",
      "Autant que nécessaire",
      "Deux au maximum",
      "Aucun, tous les repères sont indépendants"
    ],
    answer: 0,
    explain:
      "Deux nodes qui publient la même transformation créent un arbre incohérent : TF2 alterne entre les deux valeurs et le robot tremble dans RViz2."
  },
  {
    id: "q-rep-3",
    lesson: "representation/tf2",
    prompt:
      "TF2 lève « extrapolation into the future ». Quelle cause vérifier en premier ?",
    choices: [
      "Les horloges : use_sim_time oublié sur un node, ou machines désynchronisées",
      "La taille du tampon TF, trop petite",
      "Un nom de repère mal orthographié",
      "Une QoS incompatible sur /tf"
    ],
    answer: 0,
    explain:
      "Cette erreur signifie qu'on demande une transformation à un instant postérieur à la dernière connue. C'est presque toujours un problème d'horloge."
  },
  {
    id: "q-rep-4",
    lesson: "representation/urdf",
    prompt: "Quelle est la convention d'axes de ROS pour un robot mobile ?",
    choices: [
      "x vers l'avant, y vers la gauche, z vers le haut",
      "x vers la droite, y vers l'avant, z vers le haut",
      "x vers l'avant, y vers la droite, z vers le bas",
      "Chaque projet définit la sienne"
    ],
    answer: 0,
    explain:
      "Repère direct, rotations selon la règle de la main droite. Un capteur monté à l'envers se déclare dans l'URDF, jamais par un signe moins dans le code."
  },
  {
    id: "q-rep-5",
    lesson: "representation/urdf",
    prompt: "Quel type de joint utiliser pour une roue motrice ?",
    choices: ["continuous", "revolute", "prismatic", "fixed"],
    answer: 0,
    explain:
      "continuous est une rotation sans limite. revolute serait bornée, ce qui empêcherait la roue de faire plus d'un tour."
  },
  {
    id: "q-rep-6",
    lesson: "representation/rviz2",
    prompt:
      "RViz2 affiche « Fixed Frame [map] does not exist ». Que faire si aucun SLAM ne tourne ?",
    choices: [
      "Basculer le Fixed Frame sur odom, ou sur base_link s'il n'y a pas d'odométrie",
      "Redémarrer RViz2",
      "Publier une transformation map → map",
      "Passer la QoS du display en Best Effort"
    ],
    answer: 0,
    explain:
      "Le repère map n'existe que si un SLAM ou AMCL le publie. Choisis un repère qui existe réellement dans ton arbre TF."
  },
  {
    id: "q-rep-7",
    lesson: "representation/rviz2",
    prompt:
      "Ton LaserScan n'apparaît pas dans RViz2 alors que ros2 topic echo montre des données. Pourquoi ?",
    choices: [
      "Le display RViz2 est en Reliable alors que le pilote publie en Best Effort",
      "Le topic n'est pas dans le bon espace de noms",
      "Le nuage est trop dense pour être affiché",
      "RViz2 ne supporte pas sensor_msgs/LaserScan"
    ],
    answer: 0,
    explain:
      "Ouvre la section Topic du display et passe Reliability Policy sur Best Effort. C'est la cause de la grande majorité des affichages vides."
  },
  {
    id: "q-rep-8",
    lesson: "representation/simulation",
    prompt:
      "Dans le pont ros_gz, que signifie le crochet [ dans /scan@sensor_msgs/msg/LaserScan[gz.msgs.LaserScan ?",
    choices: [
      "Transmission de Gazebo vers ROS uniquement",
      "Transmission de ROS vers Gazebo uniquement",
      "Transmission bidirectionnelle",
      "Le topic est mis en file d'attente"
    ],
    answer: 0,
    explain:
      "@ signifie bidirectionnel, [ va de Gazebo vers ROS, ] va de ROS vers Gazebo. Se tromper donne un topic existant mais toujours vide."
  },
  {
    id: "q-rep-9",
    lesson: "representation/simulation",
    prompt: "Que la simulation ne permet-elle PAS de valider ?",
    choices: [
      "Les réglages d'asservissement et la robustesse réelle des capteurs",
      "La logique d'un arbre de comportement",
      "La cohérence de l'arbre TF",
      "Le fonctionnement d'un planificateur de trajectoire"
    ],
    answer: 0,
    explain:
      "La simulation valide la logique. Le glissement des roues, le bruit des capteurs, la latence USB et la baisse de tension de la batterie n'y existent pas."
  },

  /* ═══════════ Navigation ═══════════ */
  {
    id: "q-nav-1",
    lesson: "navigation/odometrie",
    prompt: "Pourquoi l'odométrie par encodeurs dérive-t-elle toujours ?",
    choices: [
      "Chaque erreur d'intégration s'ajoute aux précédentes et rien ne les corrige",
      "Parce que les encodeurs perdent des tics en permanence",
      "Parce que le calcul utilise des nombres flottants",
      "Parce que la fréquence de publication est trop basse"
    ],
    answer: 0,
    explain:
      "L'odométrie intègre le mouvement. Une intégration accumule ses erreurs sans jamais les effacer : c'est structurel, pas un défaut de qualité."
  },
  {
    id: "q-nav-2",
    lesson: "navigation/odometrie",
    prompt: "Comment calibrer correctement l'entraxe d'une base différentielle ?",
    choices: [
      "Faire tourner le robot dix tours sur lui-même et comparer à l'angle annoncé",
      "Mesurer au mètre entre le centre des deux roues",
      "Utiliser la valeur du fabricant du châssis",
      "Faire un aller-retour de deux mètres"
    ],
    answer: 0,
    explain:
      "Sur un seul tour, l'erreur d'observation dépasse l'erreur du robot. Multiplier les tours rend l'erreur systématique mesurable."
  },
  {
    id: "q-nav-3",
    lesson: "navigation/odometrie",
    prompt:
      "Dans une configuration EKF, pourquoi ne faut-il pas fournir position ET vitesse issues de la même source ?",
    choices: [
      "Le filtre les traite comme deux mesures indépendantes alors qu'elles sont corrélées, ce qui le fait diverger",
      "Cela double inutilement la charge CPU",
      "Le message Odometry ne peut contenir qu'un des deux",
      "Cela empêche la publication de la transformation TF"
    ],
    answer: 0,
    explain:
      "Pour les roues, fournis les vitesses linéaires. Pour l'IMU, la vitesse angulaire en lacet. C'est l'erreur de configuration la plus courante."
  },
  {
    id: "q-nav-4",
    lesson: "navigation/slam",
    prompt: "Qu'est-ce que la fermeture de boucle en SLAM ?",
    choices: [
      "La reconnaissance d'un lieu déjà visité, qui permet de redistribuer la dérive accumulée sur tout le graphe",
      "L'arrêt automatique de la cartographie quand la carte est complète",
      "Le retour du robot à sa base de recharge",
      "La fermeture du fichier de carte à la sauvegarde"
    ],
    answer: 0,
    explain:
      "C'est le moment où la carte se remet d'un coup en place, parce que le couloir dédoublé par la dérive redevient un seul couloir."
  },
  {
    id: "q-nav-5",
    lesson: "navigation/slam",
    prompt: "Quel environnement met le SLAM 2D le plus en difficulté ?",
    choices: [
      "Un long couloir vide et uniforme, qui ne fournit aucune information de position selon son axe",
      "Une pièce encombrée de meubles",
      "Un environnement avec beaucoup d'angles droits",
      "Une pièce de petite taille"
    ],
    answer: 0,
    explain:
      "Sans variation le long de l'axe, le recalage laser n'a rien pour se caler : le robot glisse dans la carte. Les baies vitrées et les grandes salles vides posent le même type de problème."
  },
  {
    id: "q-nav-6",
    lesson: "navigation/nav2",
    prompt: "Quel serveur Nav2 produit les messages /cmd_vel ?",
    choices: ["controller_server", "planner_server", "bt_navigator", "behavior_server"],
    answer: 0,
    explain:
      "Le planner calcule le chemin global, le controller le suit en produisant les consignes de vitesse. Savoir qui fait quoi accélère beaucoup le diagnostic."
  },
  {
    id: "q-nav-7",
    lesson: "navigation/nav2",
    prompt:
      "Le robot refuse de franchir une porte pourtant assez large. Quel paramètre suspecter ?",
    choices: [
      "inflation_radius ou robot_radius, trop grands dans la carte de coût",
      "controller_frequency, trop basse",
      "La résolution de la carte",
      "xy_goal_tolerance"
    ],
    answer: 0,
    explain:
      "Un gonflement trop large rend les passages étroits infranchissables aux yeux du planificateur. Mesure le rayon réel du robot et ajoute environ 2 cm."
  },
  {
    id: "q-nav-8",
    lesson: "navigation/nav2",
    prompt:
      "La carte de coût locale montre des obstacles là où il n'y a rien. Cause la plus probable ?",
    choices: [
      "La transformation base_link → laser_frame est fausse, souvent en orientation",
      "Le LiDAR est défectueux",
      "La résolution de la carte de coût est trop fine",
      "Le filtre d'inflation est mal configuré"
    ],
    answer: 0,
    explain:
      "Un LiDAR monté à 180° et déclaré à l'endroit place tous les points à l'opposé. Vérifie l'orientation dans l'URDF avant de soupçonner le capteur."
  },
  {
    id: "q-nav-9",
    lesson: "navigation/comportements",
    prompt: "Que fait un nœud Fallback dans un arbre de comportement ?",
    choices: [
      "Il essaie chaque enfant jusqu'au premier succès",
      "Il exécute tous les enfants en parallèle",
      "Il exécute les enfants dans l'ordre et s'arrête au premier échec",
      "Il répète le premier enfant jusqu'à réussite"
    ],
    answer: 0,
    explain:
      "Fallback essaie les alternatives, Sequence enchaîne les étapes obligatoires. C'est la distinction de base pour lire un arbre de comportement."
  },
  {
    id: "q-nav-10",
    lesson: "navigation/comportements",
    prompt:
      "Tu veux que le robot s'arrête à chaque point pour prendre une photo. Quelle action Nav2 ?",
    choices: [
      "FollowWaypoints, qui s'arrête à chaque point et peut y déclencher une tâche",
      "NavigateThroughPoses, qui traverse les points sans s'arrêter",
      "NavigateToPose, appelée en boucle",
      "ComputePathToPose"
    ],
    answer: 0,
    explain:
      "NavigateThroughPoses traite les points comme un passage imposé. FollowWaypoints les traite comme des destinations avec une tâche associée."
  },

  /* ═══════════ Perception ═══════════ */
  {
    id: "q-per-1",
    lesson: "perception/cameras",
    prompt:
      "Une image 1920×1080 en RGB8 à 30 fps représente environ quel débit ?",
    choices: [
      "Environ 186 Mo/s — aucun Wi-Fi ne tient",
      "Environ 6 Mo/s — cela passe partout",
      "Environ 60 Mo/s — le Wi-Fi suffit",
      "Cela dépend uniquement de la compression"
    ],
    answer: 0,
    explain:
      "1920 × 1080 × 3 octets = 6,2 Mo par image, fois 30. C'est le calcul à faire avant de choisir une résolution."
  },
  {
    id: "q-per-2",
    lesson: "perception/cameras",
    prompt: "À quoi sert image_transport ?",
    choices: [
      "À publier automatiquement des variantes compressées à côté du topic brut",
      "À transférer les images vers un serveur distant",
      "À convertir entre les formats de pixels",
      "À synchroniser plusieurs caméras"
    ],
    answer: 0,
    explain:
      "Les abonnés distants s'abonnent au topic /compressed, ce qui divise le débit par vingt ou plus sans modifier le node qui publie."
  },
  {
    id: "q-per-3",
    lesson: "perception/cameras",
    prompt:
      "Pourquoi faut-il désactiver l'autofocus avant d'étalonner une caméra ?",
    choices: [
      "L'étalonnage détermine la distance focale ; si elle change ensuite, tous les paramètres deviennent faux",
      "Parce que l'autofocus ralentit la capture",
      "Parce que le damier serait flou",
      "Parce que ROS 2 ne gère pas l'autofocus"
    ],
    answer: 0,
    explain:
      "Les paramètres intrinsèques sont valables pour une focale donnée. Verrouille la mise au point avant l'étalonnage et n'y touche plus ensuite."
  },
  {
    id: "q-per-4",
    lesson: "perception/nuages-points",
    prompt: "Dans quel ordre appliquer les filtres sur un nuage de points ?",
    choices: [
      "VoxelGrid en premier, il divise le volume et accélère tous les filtres suivants",
      "StatisticalOutlierRemoval en premier, pour nettoyer les données",
      "PassThrough en premier, pour couper selon les axes",
      "L'ordre n'a aucune importance"
    ],
    answer: 0,
    explain:
      "Nettoyer méticuleusement des points qu'on va ensuite jeter est du temps perdu. Réduis d'abord, affine ensuite."
  },
  {
    id: "q-per-5",
    lesson: "perception/nuages-points",
    prompt:
      "Une caméra de profondeur peut-elle remplacer un LiDAR 2D pour le SLAM ?",
    choices: [
      "Non : son champ de vision d'environ 85° laisse le robot aveugle sur les côtés et derrière",
      "Oui, elle fournit strictement plus d'informations",
      "Oui, à condition de la faire tourner",
      "Non, parce qu'elle ne mesure pas de distances"
    ],
    answer: 0,
    explain:
      "Elle complète un LiDAR — elle voit les obstacles bas et les tables qu'un LiDAR à hauteur fixe rate — mais ne le remplace pas pour la cartographie."
  },
  {
    id: "q-per-6",
    lesson: "perception/fusion",
    prompt:
      "Comment choisir la valeur de slop d'un ApproximateTimeSynchronizer ?",
    choices: [
      "Environ la moitié de la période du capteur le plus lent",
      "Le plus grand possible, pour ne rater aucune paire",
      "Toujours 1 seconde",
      "Le plus petit possible, pour la précision"
    ],
    answer: 0,
    explain:
      "Trop petit, aucune paire ne se forme. Trop grand, tu associes des mesures séparées de plusieurs centimètres de déplacement réel."
  },
  {
    id: "q-per-7",
    lesson: "perception/fusion",
    prompt:
      "Quelle valeur de covariance mettre pour une dimension que le capteur ne mesure pas ?",
    choices: [
      "Une très grande valeur, typiquement 1e6",
      "Zéro, puisqu'il n'y a pas de mesure",
      "1.0, la valeur neutre",
      "Une valeur négative"
    ],
    answer: 0,
    explain:
      "Zéro signifie « certitude absolue » : le filtre ignorerait alors toutes les autres sources. Une grande covariance signifie « je n'en sais rien »."
  },

  /* ═══════════ Manipulation & embarqué ═══════════ */
  {
    id: "q-emb-1",
    lesson: "embarque/ros2-control",
    prompt: "Quel est l'intérêt principal de ros2_control ?",
    choices: [
      "Écrire l'interface matérielle une fois, puis réutiliser tous les contrôleurs standards existants",
      "Accélérer la boucle de contrôle grâce au temps réel",
      "Remplacer le besoin d'un microcontrôleur",
      "Générer automatiquement l'URDF du robot"
    ],
    answer: 0,
    explain:
      "Le découplage entre contrôleurs et matériel permet d'utiliser diff_drive_controller, joint_trajectory_controller et les autres sans les réécrire."
  },
  {
    id: "q-emb-2",
    lesson: "embarque/ros2-control",
    prompt: "Pourquoi read() et write() doivent-elles être rapides ?",
    choices: [
      "Elles sont appelées à la fréquence du controller_manager : une lecture bloquante fait s'effondrer toute la boucle",
      "Parce qu'elles tournent dans un thread temps réel du noyau",
      "Parce que ROS 2 les interrompt après 1 ms",
      "Parce qu'elles bloquent la publication de /joint_states"
    ],
    answer: 0,
    explain:
      "À 100 Hz, chaque cycle dure 10 ms. Une lecture série avec un timeout d'une seconde détruit complètement la cadence."
  },
  {
    id: "q-emb-3",
    lesson: "embarque/moveit2",
    prompt: "Que se passe-t-il si une table n'est pas déclarée dans la scène MoveIt ?",
    choices: [
      "Le planificateur la traverse dans son plan, et le bras la percute en réalité",
      "MoveIt refuse de planifier par précaution",
      "La table est détectée automatiquement par la caméra",
      "Le bras s'arrête au contact grâce à la mesure de courant"
    ],
    answer: 0,
    explain:
      "MoveIt ne perçoit rien de lui-même. Tout ce qui n'est pas déclaré — table, câbles, capot, opérateur — n'existe pas pour lui."
  },
  {
    id: "q-emb-4",
    lesson: "embarque/moveit2",
    prompt:
      "Tu veux un mouvement en ligne droite exacte et reproductible. Quel planificateur ?",
    choices: [
      "Pilz Industrial Motion, en mode LIN",
      "OMPL avec RRTConnect",
      "STOMP",
      "CHOMP"
    ],
    answer: 0,
    explain:
      "OMPL est probabiliste : deux appels identiques donnent deux chemins différents. Pilz produit une vraie trajectoire cartésienne déterministe."
  },
  {
    id: "q-emb-5",
    lesson: "embarque/micro-ros",
    prompt: "À quoi sert l'agent micro-ROS ?",
    choices: [
      "Il traduit le protocole allégé XRCE-DDS du microcontrôleur vers le vrai graphe DDS de ROS 2",
      "Il compile le firmware pour le microcontrôleur",
      "Il surveille la consommation du microcontrôleur",
      "Il fournit l'alimentation via l'USB"
    ],
    answer: 0,
    explain:
      "Sans agent lancé côté Linux, le node du microcontrôleur n'apparaît jamais dans ros2 node list, même s'il fonctionne parfaitement."
  },
  {
    id: "q-emb-6",
    lesson: "embarque/micro-ros",
    prompt:
      "Pourquoi ne faut-il pas faire passer une boucle d'asservissement par le Wi-Fi ?",
    choices: [
      "La gigue atteint plusieurs dizaines de millisecondes, ce qui rend l'asservissement instable",
      "Le Wi-Fi ne supporte pas le protocole XRCE-DDS",
      "La bande passante est insuffisante",
      "Le chiffrement ajoute trop de latence"
    ],
    answer: 0,
    explain:
      "Garde la boucle entière dans le microcontrôleur. N'échange avec ROS 2 que des consignes et des mesures, où quelques dizaines de millisecondes sont tolérables."
  },
  {
    id: "q-emb-7",
    lesson: "embarque/deploiement",
    prompt: "Pourquoi créer des règles udev pour les périphériques du robot ?",
    choices: [
      "Parce que /dev/ttyUSB0 change d'un démarrage à l'autre selon l'ordre d'énumération",
      "Pour augmenter la vitesse du port série",
      "Pour autoriser plusieurs nodes à lire le même port",
      "Pour réduire la latence USB"
    ],
    answer: 0,
    explain:
      "Sans nom stable, le launch file peut envoyer des commandes moteur au LiDAR. Une règle udev fixe /dev/lidar et /dev/base par numéro de série."
  },
  {
    id: "q-emb-8",
    lesson: "embarque/deploiement",
    prompt:
      "Ton service systemd échoue avec « ros2: command not found ». Pourquoi ?",
    choices: [
      "systemd démarre dans un environnement vierge : il ne lit pas ton ~/.bashrc",
      "Le paquet ROS 2 n'est pas installé pour l'utilisateur du service",
      "Le service démarre avant le montage du disque",
      "Il manque les droits root"
    ],
    answer: 0,
    explain:
      "Tout doit être déclaré explicitement : sourcer /opt/ros/jazzy et le workspace dans ExecStart, et déclarer les variables avec Environment=."
  }
];

const BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

export function getQuestion(id: string): Question | undefined {
  return BY_ID.get(id);
}

export function getQuestions(ids: string[]): Question[] {
  return ids.map((id) => BY_ID.get(id)).filter((q): q is Question => Boolean(q));
}

/** Toutes les questions d'un parcours, pour l'examen de fin de parcours. */
export function questionsForTrack(trackSlug: string) {
  return QUESTIONS.filter((q) => q.lesson.startsWith(`${trackSlug}/`));
}
