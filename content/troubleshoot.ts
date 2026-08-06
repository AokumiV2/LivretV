import type { TroubleLeaf, TroubleNode } from "./types";

/**
 * Arbre de dépannage. Les identifiants qui commencent par "n-" sont des
 * questions, ceux qui commencent par "f-" sont des verdicts terminaux.
 */

export const TROUBLE_ROOT = "n-start";

export const TROUBLE_NODES: TroubleNode[] = [
  {
    id: "n-start",
    question: "Que se passe-t-il ?",
    hint: "Choisis le symptôme le plus proche de ce que tu observes.",
    options: [
      { label: "Un topic ne transporte rien", next: "n-topic-1" },
      { label: "Le robot ne bouge pas", next: "n-move-1" },
      { label: "RViz2 n'affiche rien", next: "n-rviz-1" },
      { label: "Une erreur TF2 ou de repère", next: "n-tf-1" }
    ]
  },

  /* ─────── Branche topic ─────── */
  {
    id: "n-topic-1",
    question: "Le topic apparaît-il dans `ros2 topic list` ?",
    hint: "Pense à sourcer l'environnement dans le terminal où tu tapes la commande.",
    options: [
      { label: "Oui, il est bien listé", next: "n-topic-2" },
      { label: "Non, il n'apparaît pas", next: "n-topic-absent" }
    ]
  },
  {
    id: "n-topic-absent",
    question: "Le node qui devrait publier est-il dans `ros2 node list` ?",
    options: [
      { label: "Non, le node n'apparaît pas", next: "f-node-absent" },
      { label: "Oui, mais sur une autre machine", next: "f-domain" },
      { label: "Oui, sur la même machine", next: "f-topic-nom" }
    ]
  },
  {
    id: "n-topic-2",
    question: "Que donne `ros2 topic hz <topic>` ?",
    options: [
      { label: "Une fréquence s'affiche", next: "n-topic-3" },
      { label: "Rien, la commande reste bloquée", next: "n-topic-qos" }
    ]
  },
  {
    id: "n-topic-qos",
    question:
      "Compare les QoS avec `ros2 topic info <topic> --verbose`. Que vois-tu ?",
    hint: "Regarde en particulier la ligne Reliability des deux côtés.",
    options: [
      { label: "Publisher BEST_EFFORT, subscriber RELIABLE", next: "f-qos-reliability" },
      { label: "Publisher VOLATILE, subscriber TRANSIENT_LOCAL", next: "f-qos-durability" },
      { label: "Les QoS sont identiques", next: "n-topic-type" },
      { label: "Publisher count est à 0", next: "f-node-absent" }
    ]
  },
  {
    id: "n-topic-type",
    question: "Les types de message sont-ils strictement identiques ?",
    hint: "sensor_msgs/msg/LaserScan et sensor_msgs/msg/PointCloud2 ne se connectent jamais.",
    options: [
      { label: "Non, ils diffèrent", next: "f-type-mismatch" },
      { label: "Oui, ils sont identiques", next: "f-reseau" }
    ]
  },
  {
    id: "n-topic-3",
    question: "Les données arrivent donc. Le problème est-il dans le contenu ?",
    options: [
      { label: "Les valeurs sont nan ou inf", next: "f-nan" },
      { label: "Le frame_id est vide", next: "f-frame-vide" },
      { label: "Les valeurs semblent correctes", next: "f-logique" }
    ]
  },

  /* ─────── Branche robot immobile ─────── */
  {
    id: "n-move-1",
    question: "Que se passe-t-il si tu publies un Twist à la main sur /cmd_vel ?",
    hint: 'ros2 topic pub -r 10 /cmd_vel geometry_msgs/msg/Twist "{linear: {x: 0.1}}"',
    options: [
      { label: "Les roues tournent", next: "n-move-nav" },
      { label: "Rien ne bouge du tout", next: "n-move-hw" },
      { label: "Une seule roue tourne", next: "f-une-roue" }
    ]
  },
  {
    id: "n-move-hw",
    question: "Le node qui pilote le matériel reçoit-il les messages ?",
    hint: "Vérifie avec `ros2 topic info /cmd_vel --verbose` que Subscription count vaut au moins 1.",
    options: [
      { label: "Subscription count est à 0", next: "f-cmdvel-personne" },
      { label: "Il reçoit, mais les moteurs restent muets", next: "n-move-elec" }
    ]
  },
  {
    id: "n-move-elec",
    question: "Côté électronique, qu'observes-tu ?",
    options: [
      { label: "La LED du driver est éteinte", next: "f-driver-alim" },
      { label: "Le driver est alimenté, rien ne sort", next: "f-stby" },
      { label: "Le calculateur redémarre au démarrage des moteurs", next: "f-brownout" },
      { label: "Les moteurs bourdonnent sans tourner", next: "f-courant" }
    ]
  },
  {
    id: "n-move-nav",
    question:
      "Le matériel répond donc. Nav2 produit-il quelque chose sur /cmd_vel ?",
    options: [
      { label: "/cmd_vel ne contient que des zéros", next: "n-nav-etat" },
      { label: "Rien n'est publié du tout", next: "n-nav-etat" },
      { label: "Nav2 n'est pas utilisé", next: "f-logique" }
    ]
  },
  {
    id: "n-nav-etat",
    question: "Que donne `ros2 lifecycle get /planner_server` ?",
    options: [
      { label: "inactive ou unconfigured", next: "f-lifecycle" },
      { label: "active", next: "n-nav-plan" }
    ]
  },
  {
    id: "n-nav-plan",
    question: "Un chemin apparaît-il sur le topic /plan ?",
    options: [
      { label: "Non, aucun chemin n'est calculé", next: "f-no-path" },
      { label: "Oui, mais le robot ne le suit pas", next: "f-controller" }
    ]
  },

  /* ─────── Branche RViz2 ─────── */
  {
    id: "n-rviz-1",
    question: "Que dit le Global Status en haut du panneau Displays ?",
    options: [
      { label: "\"Fixed Frame does not exist\"", next: "f-fixed-frame" },
      { label: "Il est vert, mais rien ne s'affiche", next: "n-rviz-2" },
      { label: "Un display est en erreur", next: "n-rviz-2" }
    ]
  },
  {
    id: "n-rviz-2",
    question: "Le topic concerné transporte-t-il des données ?",
    hint: "Vérifie avec ros2 topic hz dans un terminal séparé.",
    options: [
      { label: "Oui, ros2 topic hz affiche une fréquence", next: "f-rviz-qos" },
      { label: "Non, rien n'arrive", next: "n-topic-1" }
    ]
  },

  /* ─────── Branche TF ─────── */
  {
    id: "n-tf-1",
    question: "Quel message d'erreur exactement ?",
    options: [
      { label: "\"frame does not exist\"", next: "f-tf-absent" },
      { label: "\"extrapolation into the future\"", next: "f-tf-futur" },
      { label: "\"would require extrapolation into the past\"", next: "f-tf-passe" },
      { label: "Le robot tremble ou saute dans RViz2", next: "f-tf-double" }
    ]
  }
];

export const TROUBLE_LEAVES: TroubleLeaf[] = [
  {
    id: "f-node-absent",
    verdict: "Le node ne tourne pas",
    cause:
      "Le processus a échoué au démarrage, ou son environnement n'est pas sourcé dans le terminal où tu l'as lancé.",
    fix: [
      "Relance le node au premier plan et lis la sortie complète : l'erreur est presque toujours affichée.",
      "Vérifie que install/setup.bash est sourcé dans CE terminal.",
      "Après toute modification, recompile puis re-source.",
      "Sur un node à cycle de vie, vérifie qu'il a bien été activé."
    ],
    commands: [
      "source ~/ros2_ws/install/setup.bash",
      "ros2 run mon_paquet mon_node",
      "ros2 node list"
    ]
  },
  {
    id: "f-domain",
    verdict: "Les deux machines ne sont pas dans le même graphe",
    cause:
      "ROS_DOMAIN_ID différent, ROS_LOCALHOST_ONLY actif, ou implémentations DDS différentes.",
    fix: [
      "Le même ROS_DOMAIN_ID sur les deux machines.",
      "ROS_LOCALHOST_ONLY doit valoir 0 ou être absent.",
      "Le même RMW_IMPLEMENTATION des deux côtés : Fast DDS et Cyclone DDS ne se parlent pas.",
      "Vérifie que le multicast passe entre les deux machines."
    ],
    commands: [
      "printenv | grep -E 'ROS_DOMAIN_ID|ROS_LOCALHOST_ONLY|RMW_IMPLEMENTATION'",
      "ros2 multicast receive   # sur une machine",
      "ros2 multicast send      # sur l'autre"
    ]
  },
  {
    id: "f-topic-nom",
    verdict: "Les noms de topic ne correspondent pas",
    cause:
      "Un slash de différence, un espace de noms appliqué, ou un remappage oublié suffit à séparer deux nodes.",
    fix: [
      "Compare les noms exacts avec ros2 node info des deux côtés.",
      "Attention aux noms relatifs : « scan » devient « /mon_ns/scan » sous un espace de noms.",
      "Utilise rqt_graph pour visualiser ce qui est réellement relié."
    ],
    commands: ["ros2 node info /mon_node", "ros2 run rqt_graph rqt_graph"]
  },
  {
    id: "f-qos-reliability",
    verdict: "Incompatibilité de QoS sur la fiabilité",
    cause:
      "Le subscriber exige RELIABLE alors que le publisher n'offre que BEST_EFFORT. Aucune connexion n'est établie, et rien n'est signalé.",
    fix: [
      "Passe le subscriber en BEST_EFFORT — la plupart des pilotes de capteurs publient ainsi.",
      "En Python, utilise qos_profile_sensor_data plutôt que la profondeur 10 par défaut.",
      "Dans RViz2, mets Reliability Policy sur Best Effort dans les options du display."
    ],
    commands: [
      "ros2 topic info /scan --verbose",
      "# Python : from rclpy.qos import qos_profile_sensor_data"
    ]
  },
  {
    id: "f-qos-durability",
    verdict: "Incompatibilité de QoS sur la durabilité",
    cause:
      "Le subscriber demande TRANSIENT_LOCAL — recevoir le dernier message publié avant son démarrage — alors que le publisher est VOLATILE.",
    fix: [
      "Passe le publisher en TRANSIENT_LOCAL si la donnée est publiée une seule fois : carte, description du robot, TF statiques.",
      "Ou passe le subscriber en VOLATILE si le flux est continu."
    ],
    commands: ["ros2 topic info /map --verbose"]
  },
  {
    id: "f-type-mismatch",
    verdict: "Types de messages différents",
    cause:
      "Deux types différents ne se connectent jamais, même si les noms de topic correspondent parfaitement.",
    fix: [
      "Aligne les types des deux côtés.",
      "Si la conversion est nécessaire, écris un node passerelle — par exemple depthimage_to_laserscan.",
      "Vérifie aussi la version : un message recompilé après modification doit l'être partout."
    ],
    commands: ["ros2 topic list -t", "ros2 interface show sensor_msgs/msg/LaserScan"]
  },
  {
    id: "f-reseau",
    verdict: "Problème réseau ou pare-feu",
    cause:
      "Le multicast DDS est bloqué, ou les deux machines ne sont pas dans le même sous-réseau.",
    fix: [
      "Teste le multicast avec ros2 multicast send/receive.",
      "Désactive temporairement le pare-feu pour confirmer.",
      "Sur un réseau qui bloque le multicast, configure un Discovery Server Fast DDS.",
      "Le Wi-Fi invité des entreprises isole souvent les clients entre eux."
    ],
    commands: ["ros2 multicast receive", "sudo ufw status"]
  },
  {
    id: "f-nan",
    verdict: "Valeurs invalides dans les données",
    cause:
      "Un LaserScan contient inf pour les rayons sans écho et nan pour les mesures invalides. Ces valeurs contaminent tous les calculs sans lever d'erreur.",
    fix: [
      "Filtre systématiquement sur range_min et range_max avant tout calcul.",
      "Utilise skip_nans=True à la lecture d'un nuage de points.",
      "Vérifie qu'une division par zéro ne produit pas ces valeurs dans ton propre code."
    ],
    commands: [
      "# valides = [r for r in msg.ranges if msg.range_min < r < msg.range_max]"
    ]
  },
  {
    id: "f-frame-vide",
    verdict: "frame_id non renseigné",
    cause:
      "Un message dont l'en-tête n'a pas de frame_id ne peut être transformé nulle part. TF2 échoue et beaucoup d'outils affichent la donnée au centre du repère fixe.",
    fix: [
      "Renseigne header.frame_id dans le node qui publie.",
      "Si le pilote ne le fait pas, il expose souvent un paramètre pour cela.",
      "Vérifie aussi que l'horodatage n'est pas à zéro."
    ],
    commands: ["ros2 topic echo /scan --field header"]
  },
  {
    id: "f-logique",
    verdict: "Les données arrivent : le problème est dans ta logique",
    cause:
      "La chaîne de communication fonctionne. L'erreur est dans le traitement, les unités ou les conditions.",
    fix: [
      "Vérifie les unités : ROS travaille en mètres, radians et secondes. Jamais en centimètres ni en degrés.",
      "Ajoute des logs dans le callback pour confirmer qu'il est bien appelé.",
      "Publie des marqueurs RViz2 pour visualiser l'état interne de l'algorithme.",
      "Enregistre un rosbag et rejoue-le pour analyser tranquillement."
    ],
    commands: ["ros2 bag record -a", "ros2 bag play mon_bag --rate 0.2"]
  },
  {
    id: "f-une-roue",
    verdict: "Une seule roue répond",
    cause:
      "Un canal du driver, un câble ou une sortie du microcontrôleur est en cause.",
    fix: [
      "Inverse les deux moteurs sur le driver : si le défaut suit le moteur, c'est le moteur ; s'il reste sur le canal, c'est le driver.",
      "Vérifie les soudures du connecteur moteur, première cause matérielle.",
      "Contrôle que les deux sorties PWM produisent bien un signal.",
      "Sur un TB6612, vérifie que les deux canaux partagent bien la broche STBY à l'état haut."
    ]
  },
  {
    id: "f-cmdvel-personne",
    verdict: "Personne n'écoute /cmd_vel",
    cause:
      "Le node matériel n'est pas lancé, ou il s'abonne à un autre nom de topic.",
    fix: [
      "Vérifie que le node de base est actif.",
      "Contrôle le nom exact du topic auquel il s'abonne.",
      "Si un espace de noms est appliqué, le topic devient /robot/cmd_vel.",
      "Avec ros2_control, vérifie que le contrôleur différentiel est chargé et actif."
    ],
    commands: ["ros2 topic info /cmd_vel --verbose", "ros2 control list_controllers"]
  },
  {
    id: "f-driver-alim",
    verdict: "Le driver moteur n'est pas alimenté",
    cause:
      "Un driver a deux alimentations distinctes : la logique et la puissance. L'oubli de la seconde est fréquent.",
    fix: [
      "Vérifie la tension sur VM ou VMOT au multimètre, moteur branché.",
      "Vérifie la tension logique sur VCC.",
      "Contrôle le fusible et l'interrupteur de la batterie.",
      "Assure-toi que la masse est commune entre le driver et le microcontrôleur."
    ]
  },
  {
    id: "f-stby",
    verdict: "Broche d'activation non pilotée",
    cause:
      "Beaucoup de drivers ont une broche d'activation qui les maintient inhibés par défaut : STBY sur TB6612, EN sur TMC2209, R_EN et L_EN sur BTS7960.",
    fix: [
      "Mets STBY à l'état haut sur un TB6612 — c'est le piège du premier montage.",
      "Sur TMC2209, la broche EN est active à l'état BAS.",
      "Sur BTS7960, les deux broches d'activation doivent être hautes.",
      "Vérifie au multimètre plutôt que de se fier au code."
    ]
  },
  {
    id: "f-brownout",
    verdict: "Effondrement de l'alimentation",
    cause:
      "Le pic de courant des moteurs ou des servos fait chuter la tension du rail 5 V sous le seuil de fonctionnement du calculateur, qui redémarre.",
    fix: [
      "Sépare les alimentations : un BEC pour le calculateur, un autre pour les servos et moteurs.",
      "Ajoute un condensateur de 1000 µF près de l'entrée du driver.",
      "Vérifie la section des câbles : du fil trop fin chute sous forte charge.",
      "Ajoute une rampe d'accélération au lieu de démarrer à pleine puissance."
    ]
  },
  {
    id: "f-courant",
    verdict: "Courant insuffisant pour faire tourner le moteur",
    cause:
      "Le driver limite, la tension est trop basse, ou le moteur est mécaniquement bloqué.",
    fix: [
      "Compare le courant de blocage du moteur à la capacité du driver : un JGA25 tire 2,2 A, un TB6612 tient 1,2 A en continu.",
      "Vérifie la tension aux bornes du moteur en charge : un L298N en perd 2 V.",
      "Débranche le moteur de la mécanique et fais-le tourner à vide pour éliminer un blocage.",
      "Sur un driver pas-à-pas, règle la référence de courant au multimètre."
    ]
  },
  {
    id: "f-lifecycle",
    verdict: "Les nodes Nav2 ne sont pas activés",
    cause:
      "Le lifecycle_manager n'a pas terminé l'activation, souvent parce qu'un node attend une transformation qui n'arrive jamais.",
    fix: [
      "Lis la sortie du lifecycle_manager : il indique sur quel node il bloque.",
      "Vérifie que l'arbre TF est complet AVANT de lancer Nav2 : map → odom → base_link.",
      "Contrôle que /scan publie effectivement.",
      "Active manuellement pour identifier le node fautif."
    ],
    commands: [
      "ros2 lifecycle get /planner_server",
      "ros2 lifecycle set /planner_server activate",
      "ros2 run tf2_tools view_frames"
    ]
  },
  {
    id: "f-no-path",
    verdict: "Aucun chemin ne peut être calculé",
    cause:
      "L'objectif est dans une zone occupée ou inconnue, ou le robot lui-même est considéré comme en collision.",
    fix: [
      "Affiche la carte de coût globale dans RViz2 et regarde si l'objectif tombe dans une zone gonflée.",
      "Réduis inflation_radius si les couloirs sont bouchés.",
      "Vérifie robot_radius : trop grand, aucune porte n'est franchissable.",
      "Efface les cartes de coût pour supprimer d'éventuels obstacles fantômes.",
      "Si le robot est encerclé d'obstacles fantômes, c'est un problème de TF sur le LiDAR."
    ],
    commands: [
      "ros2 service call /global_costmap/clear_entirely_global_costmap nav2_msgs/srv/ClearEntireCostmap",
      "ros2 param get /global_costmap/global_costmap robot_radius"
    ]
  },
  {
    id: "f-controller",
    verdict: "Le contrôleur ne suit pas le chemin",
    cause:
      "Réglages du contrôleur inadaptés, ou vitesses minimales sous le seuil de démarrage des moteurs.",
    fix: [
      "Vérifie que /cmd_vel contient des valeurs non nulles pendant l'exécution.",
      "Augmente min_x_velocity si le robot ne démarre pas : sous 0,05 m/s beaucoup de moteurs ne bougent pas.",
      "Ajuste lookahead_dist : trop court, le robot oscille ; trop long, il coupe les virages.",
      "Vérifie que le velocity_smoother ne bride pas tout."
    ],
    commands: ["ros2 topic echo /cmd_vel", "ros2 param list /controller_server"]
  },
  {
    id: "f-fixed-frame",
    verdict: "Le repère fixe choisi n'existe pas",
    cause:
      "RViz2 affiche tout dans le Fixed Frame. Si tu choisis map alors qu'aucun SLAM ne tourne, ce repère n'existe pas.",
    fix: [
      "Bascule le Fixed Frame sur odom, ou sur base_link s'il n'y a même pas d'odométrie.",
      "Vérifie quels repères existent réellement avec view_frames.",
      "Lance un SLAM ou AMCL si tu as besoin du repère map."
    ],
    commands: ["ros2 run tf2_tools view_frames", "ros2 topic echo /tf_static --once"]
  },
  {
    id: "f-rviz-qos",
    verdict: "QoS du display RViz2 inadaptée",
    cause:
      "Le display utilise Reliable par défaut alors que le pilote du capteur publie en Best Effort.",
    fix: [
      "Déplie la section Topic du display concerné.",
      "Passe Reliability Policy sur Best Effort.",
      "Pour /map, passe Durability Policy sur Transient Local.",
      "Sauvegarde la configuration une fois le réglage trouvé."
    ]
  },
  {
    id: "f-tf-absent",
    verdict: "Le repère demandé n'est publié par personne",
    cause:
      "Nom mal orthographié, ou le node qui devrait publier cette transformation ne tourne pas.",
    fix: [
      "Génère l'arbre complet avec view_frames et compare les noms exactement.",
      "Vérifie que robot_state_publisher tourne et reçoit bien robot_description.",
      "Pour les transformations statiques, contrôle qu'elles sont publiées en TRANSIENT_LOCAL.",
      "Attention aux slashs en tête : « base_link » et « /base_link » sont deux repères différents."
    ],
    commands: ["ros2 run tf2_tools view_frames", "ros2 topic echo /tf_static --once"]
  },
  {
    id: "f-tf-futur",
    verdict: "Extrapolation dans le futur",
    cause:
      "On demande une transformation à un instant postérieur à la dernière connue. Presque toujours un problème d'horloge.",
    fix: [
      "En simulation : use_sim_time à true sur TOUS les nodes, RViz2 compris.",
      "En multi-machines : synchronise les horloges avec chrony ou ntp.",
      "Vérifie qu'aucun node n'horodate avec l'horloge système alors que les autres utilisent /clock.",
      "Augmente légèrement transform_timeout dans les nodes concernés."
    ],
    commands: [
      "ros2 param get /rviz2 use_sim_time",
      "chronyc tracking",
      "ros2 topic echo /clock --once"
    ]
  },
  {
    id: "f-tf-passe",
    verdict: "Extrapolation dans le passé",
    cause:
      "Le tampon TF ne remonte pas assez loin, ou les transformations sont publiées trop lentement.",
    fix: [
      "Augmente la durée du tampon : Buffer(cache_time=Duration(seconds=30)).",
      "Publie les transformations dynamiques plus fréquemment, au moins à 20 Hz.",
      "Réduis le retard de traitement : un algorithme lent demande des transformations trop anciennes.",
      "Vérifie que le node n'a pas été mis en pause par un callback bloquant."
    ]
  },
  {
    id: "f-tf-double",
    verdict: "Deux publieurs pour la même transformation",
    cause:
      "TF2 alterne entre les deux valeurs, ce qui fait trembler ou sauter le robot dans RViz2.",
    fix: [
      "Cherche qui publie odom → base_link : c'est le doublon le plus fréquent, entre le node d'odométrie et l'EKF.",
      "Si robot_localization publie la transformation, désactive-la dans le node d'odométrie.",
      "Avec ros2_control, enable_odom_tf ne doit être vrai que si aucun EKF ne tourne.",
      "Un seul publieur par transformation, sans exception."
    ],
    commands: [
      "ros2 topic echo /tf --field transforms[0].child_frame_id",
      "ros2 node info /ekf_filter_node"
    ]
  }
];

const NODE_MAP = new Map(TROUBLE_NODES.map((n) => [n.id, n]));
const LEAF_MAP = new Map(TROUBLE_LEAVES.map((l) => [l.id, l]));

export function getTroubleNode(id: string) {
  return NODE_MAP.get(id);
}

export function getTroubleLeaf(id: string) {
  return LEAF_MAP.get(id);
}

export function isLeaf(id: string) {
  return id.startsWith("f-");
}
