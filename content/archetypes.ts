import type { Archetype } from "./types";

export const ARCHETYPES: Archetype[] = [
  {
    id: "rover",
    name: "Rover différentiel",
    tagline: "Deux roues motrices, un LiDAR, la navigation autonome",
    description:
      "La base de tout : deux moteurs indépendants, une roue folle, un LiDAR 2D. C'est la configuration la mieux supportée par l'écosystème ROS 2 — diff_drive_controller, SLAM Toolbox et Nav2 fonctionnent dessus sans adaptation. Si c'est ton premier robot, commence ici.",
    difficulty: "Débutant",
    budget: [280, 550],
    buildDays: 4,
    skills: ["Odométrie", "SLAM", "Nav2", "TF2", "ros2_control"],
    stack: [
      {
        role: "Calculateur",
        componentIds: ["rpi5", "rpi4"],
        why: "Assez de puissance pour Nav2 et SLAM Toolbox avec un LiDAR 2D, sans surcoût inutile."
      },
      {
        role: "Contrôle bas niveau",
        componentIds: ["esp32-s3", "teensy41"],
        why: "Déporte l'asservissement des roues hors de Linux, qui n'est pas temps réel."
      },
      {
        role: "Motorisation",
        componentIds: ["jga25-370"],
        why: "Encodeurs intégrés, couple suffisant pour 2 à 5 kg, pièce très répandue."
      },
      {
        role: "Étage de puissance",
        componentIds: ["tb6612fng"],
        why: "MOSFET plutôt que bipolaire : deux fois moins de pertes qu'un L298N."
      },
      {
        role: "Télémétrie",
        componentIds: ["rplidar-a1", "ldlidar-ld19"],
        why: "360° sur 12 m : c'est ce qui rend le SLAM possible."
      },
      {
        role: "Inertiel",
        componentIds: ["bno085"],
        why: "Corrige la dérive angulaire de l'odométrie, fusionné par l'EKF."
      },
      {
        role: "Énergie",
        componentIds: ["lipo-3s-5000", "bec-5v-5a"],
        why: "11,1 V pour les moteurs, 5 V régulé et séparé pour le calculateur."
      },
      {
        role: "Adaptation",
        componentIds: ["level-shifter"],
        why: "Les encodeurs sortent en 5 V, les GPIO du Pi sont en 3,3 V non tolérants."
      },
      {
        role: "Structure",
        componentIds: ["chassis-alu"],
        why: "Grille au pas de 10 mm : les positions de capteurs sont mesurables pour la TF."
      }
    ],
    nodes: [
      {
        name: "base_controller",
        pkg: "<pkg>",
        pubs: ["/odom_roues", "/joint_states"],
        subs: ["/cmd_vel"],
        note: "Liaison série vers le microcontrôleur, conversion Twist ↔ vitesses de roues"
      },
      {
        name: "ekf_filter_node",
        pkg: "robot_localization",
        pubs: ["/odometry/filtered", "/tf"],
        subs: ["/odom_roues", "/imu/data"],
        note: "Fusionne roues et IMU, publie la transformation odom → base_link"
      },
      {
        name: "rplidar_node",
        pkg: "rplidar_ros",
        pubs: ["/scan"],
        subs: [],
        note: "Publie en BEST_EFFORT — pense à la QoS côté abonnés"
      },
      {
        name: "robot_state_publisher",
        pkg: "robot_state_publisher",
        pubs: ["/tf", "/tf_static", "/robot_description"],
        subs: ["/joint_states"],
        note: "Produit l'arbre TF à partir de l'URDF"
      },
      {
        name: "slam_toolbox",
        pkg: "slam_toolbox",
        pubs: ["/map", "/tf"],
        subs: ["/scan", "/tf"],
        note: "Cartographie et publie la correction map → odom"
      },
      {
        name: "controller_server",
        pkg: "nav2_controller",
        pubs: ["/cmd_vel"],
        subs: ["/plan", "/odom", "/scan"],
        note: "Suit le chemin planifié et produit les consignes de vitesse"
      }
    ]
  },

  {
    id: "bras",
    name: "Bras 6 axes",
    tagline: "Cinématique inverse, planification et évitement de collision",
    description:
      "Six articulations en série avec une pince. Le vrai sujet n'est pas la mécanique mais la configuration MoveIt 2 : matrice de collisions, groupes de planification, contrôleurs de trajectoire. Prévois autant de temps sur la configuration que sur la construction.",
    difficulty: "Avancé",
    budget: [450, 1400],
    buildDays: 10,
    skills: ["MoveIt 2", "Cinématique inverse", "ros2_control", "URDF", "Trajectoires"],
    stack: [
      {
        role: "Calculateur",
        componentIds: ["mini-pc-n100", "rpi5"],
        why: "MoveIt 2 est gourmand : un x86 évite en plus tous les soucis d'architecture arm64."
      },
      {
        role: "Articulations",
        componentIds: ["dynamixel-xl430", "ds3218"],
        why: "Les Dynamixel renvoient leur position réelle : /joint_states devient une mesure, pas une supposition."
      },
      {
        role: "Interface bus",
        componentIds: ["u2d2"],
        why: "Gère la commutation de direction du bus half-duplex Dynamixel."
      },
      {
        role: "Retour de position",
        componentIds: ["as5600"],
        why: "Position absolue conservée hors tension, pour les axes à servos classiques."
      },
      {
        role: "Multiplexeur",
        componentIds: ["i2c-mux"],
        why: "L'AS5600 a une adresse I2C fixe : plusieurs axes imposent un multiplexeur."
      },
      {
        role: "Perception",
        componentIds: ["realsense-d435i"],
        why: "Alimente l'Octomap de MoveIt pour l'évitement d'obstacles dynamiques."
      },
      {
        role: "Énergie",
        componentIds: ["lipo-3s-5000", "bec-5v-5a", "power-board"],
        why: "Six articulations en mouvement tirent beaucoup de courant en simultané."
      }
    ],
    nodes: [
      {
        name: "arm_hardware",
        pkg: "<pkg>",
        pubs: ["/joint_states"],
        subs: [],
        note: "Interface ros2_control vers le bus Dynamixel"
      },
      {
        name: "joint_trajectory_controller",
        pkg: "ros2_controllers",
        pubs: ["/joint_states"],
        subs: ["/arm_controller/joint_trajectory"],
        note: "Exécute les trajectoires calculées par MoveIt"
      },
      {
        name: "move_group",
        pkg: "moveit_ros_move_group",
        pubs: ["/display_planned_path"],
        subs: ["/joint_states", "/planning_scene"],
        note: "Le cœur de MoveIt : cinématique inverse et planification"
      },
      {
        name: "realsense2_camera",
        pkg: "realsense2_camera",
        pubs: ["/camera/depth/points"],
        subs: [],
        note: "Nuage de points pour l'Octomap"
      },
      {
        name: "robot_state_publisher",
        pkg: "robot_state_publisher",
        pubs: ["/tf", "/robot_description"],
        subs: ["/joint_states"],
        note: "Position de chaque segment du bras"
      }
    ]
  },

  {
    id: "amr",
    name: "AMR d'extérieur",
    tagline: "Robot autonome robuste, GPS et perception 3D",
    description:
      "Une base lourde capable de rouler sur de l'herbe et du gravier, avec fusion GPS-inertielle et perception 3D. Le saut de difficulté est réel : tensions élevées, courants importants, et un environnement où le LiDAR 2D ne suffit plus.",
    difficulty: "Avancé",
    budget: [1600, 4500],
    buildDays: 25,
    skills: ["Fusion GNSS", "SLAM 3D", "Nav2 extérieur", "CAN", "Sécurité électrique"],
    stack: [
      {
        role: "Calculateur",
        componentIds: ["jetson-orin-nano"],
        why: "SLAM 3D et perception par réseau de neurones exigent un GPU embarqué."
      },
      {
        role: "Traction",
        componentIds: ["bldc-hoverboard"],
        why: "350 W par roue : de quoi porter 40 kg sur terrain irrégulier."
      },
      {
        role: "Contrôle moteur",
        componentIds: ["odrive-s1", "vesc-6"],
        why: "Commande vectorielle avec asservissement en couple, chaînable sur CAN."
      },
      {
        role: "Bus",
        componentIds: ["can-transceiver"],
        why: "Le seul bus qui traverse sereinement un robot plein de brushless."
      },
      {
        role: "Télémétrie 3D",
        componentIds: ["livox-mid360"],
        why: "360° × 59° sur 40 m, avec IMU synchronisée pour FAST-LIO."
      },
      {
        role: "Localisation",
        componentIds: ["gps-zed-f9p", "bno085"],
        why: "RTK centimétrique fusionné avec l'inertiel et l'odométrie."
      },
      {
        role: "Énergie",
        componentIds: ["lipo-4s-5200", "buck-12v-5a", "fuse-switch", "power-board"],
        why: "Interrupteur anti-étincelle et fusible ne sont pas optionnels à cette puissance."
      }
    ],
    nodes: [
      {
        name: "odrive_can_node",
        pkg: "odrive_can",
        pubs: ["/odom_roues", "/joint_states"],
        subs: ["/cmd_vel"],
        note: "Pilotage des contrôleurs brushless via SocketCAN"
      },
      {
        name: "livox_ros_driver2",
        pkg: "livox_ros_driver2",
        pubs: ["/livox/lidar", "/livox/imu"],
        subs: [],
        note: "Nuage 3D à 200 000 points par seconde"
      },
      {
        name: "fast_lio",
        pkg: "fast_lio",
        pubs: ["/Odometry", "/cloud_registered"],
        subs: ["/livox/lidar", "/livox/imu"],
        note: "SLAM 3D inertiel-laser temps réel"
      },
      {
        name: "navsat_transform_node",
        pkg: "robot_localization",
        pubs: ["/odometry/gps"],
        subs: ["/gps/fix", "/imu/data"],
        note: "Convertit la position GNSS vers le repère local"
      },
      {
        name: "ekf_global",
        pkg: "robot_localization",
        pubs: ["/odometry/filtered/global", "/tf"],
        subs: ["/odom_roues", "/imu/data", "/odometry/gps"],
        note: "Fusion complète, publie map → odom"
      }
    ]
  },

  {
    id: "table",
    name: "Robot de table",
    tagline: "Petit, sûr, parfait pour apprendre sans risque",
    description:
      "Une base miniature à moins de 150 €, sans danger électrique et sans risque de casse. C'est le meilleur support pour comprendre les topics, la TF et l'odométrie avant d'investir dans du matériel sérieux. Il tourne entièrement sur un ESP32.",
    difficulty: "Débutant",
    budget: [90, 180],
    buildDays: 2,
    skills: ["micro-ROS", "Topics", "TF2", "Odométrie", "Téléopération"],
    stack: [
      {
        role: "Cerveau",
        componentIds: ["esp32-s3"],
        why: "micro-ROS en Wi-Fi : le robot est un vrai node ROS 2, sans le moindre câble."
      },
      {
        role: "Motorisation",
        componentIds: ["n20-motor"],
        why: "Micro-motoréducteurs avec encodeur, largement suffisants à cette échelle."
      },
      {
        role: "Puissance",
        componentIds: ["tb6612fng"],
        why: "Dimensionné exactement pour ces moteurs."
      },
      {
        role: "Inertiel",
        componentIds: ["mpu6050"],
        why: "Trois euros, et l'occasion d'écrire soi-même un filtre complémentaire."
      },
      {
        role: "Anti-collision",
        componentIds: ["vl53l1x"],
        why: "Trois capteurs ToF en ceinture suffisent à éviter le vide et les murs."
      },
      {
        role: "Énergie",
        componentIds: ["li-ion-4s"],
        why: "Chimie plus sûre qu'une LiPo, et mille cycles au lieu de trois cents."
      }
    ],
    nodes: [
      {
        name: "base_esp32",
        pkg: "micro_ros",
        pubs: ["/odom", "/imu/data_raw", "/range_front"],
        subs: ["/cmd_vel"],
        note: "Node micro-ROS complet embarqué sur l'ESP32"
      },
      {
        name: "micro_ros_agent",
        pkg: "micro_ros_agent",
        pubs: [],
        subs: [],
        note: "Passerelle obligatoire côté Linux — sans elle, rien n'apparaît"
      },
      {
        name: "imu_filter_madgwick",
        pkg: "imu_tools",
        pubs: ["/imu/data"],
        subs: ["/imu/data_raw"],
        note: "Le MPU6050 n'a pas de fusion embarquée : elle se fait ici"
      },
      {
        name: "teleop_twist_keyboard",
        pkg: "teleop_twist_keyboard",
        pubs: ["/cmd_vel"],
        subs: [],
        note: "Pilotage au clavier pour les premiers essais"
      }
    ]
  }
];

export function getArchetype(id: string) {
  return ARCHETYPES.find((a) => a.id === id);
}
