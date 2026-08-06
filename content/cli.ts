import type { CliCommand } from "./types";

export const CLI_COMMANDS: CliCommand[] = [
  /* ─────────── Nodes ─────────── */
  {
    cmd: "ros2 node list",
    group: "Nodes",
    what: "Liste tous les nodes actifs du graphe",
    example: "ros2 node list",
    output: "/rplidar_node\n/base_roulante\n/slam_toolbox"
  },
  {
    cmd: "ros2 node info <node>",
    group: "Nodes",
    what: "Détaille les publishers, subscribers, services et actions d'un node",
    example: "ros2 node info /rplidar_node",
    output: "  Publishers:\n    /scan: sensor_msgs/msg/LaserScan\n  Service Servers:\n    /stop_motor: std_srvs/srv/Empty"
  },
  {
    cmd: "ros2 run <paquet> <exécutable>",
    group: "Nodes",
    what: "Lance un node unique",
    example: "ros2 run demo_nodes_cpp talker"
  },
  {
    cmd: "ros2 launch <paquet> <fichier>",
    group: "Nodes",
    what: "Lance un ensemble de nodes décrit dans un launch file",
    example: "ros2 launch mon_robot bringup.launch.py navigation:=true"
  },

  /* ─────────── Topics ─────────── */
  {
    cmd: "ros2 topic list -t",
    group: "Topics",
    what: "Liste les topics avec leur type de message",
    example: "ros2 topic list -t",
    output: "/cmd_vel [geometry_msgs/msg/Twist]\n/scan [sensor_msgs/msg/LaserScan]"
  },
  {
    cmd: "ros2 topic info <topic> --verbose",
    group: "Topics",
    what: "Affiche les QoS des deux côtés — l'outil du diagnostic",
    example: "ros2 topic info /scan --verbose",
    output: "Publisher count: 1\n  Reliability: BEST_EFFORT\nSubscription count: 1\n  Reliability: RELIABLE"
  },
  {
    cmd: "ros2 topic echo <topic>",
    group: "Topics",
    what: "Affiche les messages qui circulent",
    example: "ros2 topic echo /odom --once"
  },
  {
    cmd: "ros2 topic echo <topic> --field <champ>",
    group: "Topics",
    what: "N'affiche qu'un champ, bien plus lisible sur les gros messages",
    example: "ros2 topic echo /odom --field pose.pose.position.x"
  },
  {
    cmd: "ros2 topic hz <topic>",
    group: "Topics",
    what: "Mesure la fréquence réelle de publication",
    example: "ros2 topic hz /scan",
    output: "average rate: 9.987\n  min: 0.098s max: 0.103s std dev: 0.00121s"
  },
  {
    cmd: "ros2 topic bw <topic>",
    group: "Topics",
    what: "Mesure la bande passante consommée",
    example: "ros2 topic bw /camera/image_raw",
    output: "13.27 MB/s from 30 messages"
  },
  {
    cmd: "ros2 topic pub <topic> <type> <valeurs>",
    group: "Topics",
    what: "Publie manuellement — le premier test d'une base roulante",
    example: 'ros2 topic pub --once /cmd_vel geometry_msgs/msg/Twist "{linear: {x: 0.2}}"'
  },
  {
    cmd: "ros2 topic pub -r <hz> …",
    group: "Topics",
    what: "Publie en continu à une fréquence donnée",
    example: 'ros2 topic pub -r 10 /cmd_vel geometry_msgs/msg/Twist "{linear: {x: 0.1}}"'
  },

  /* ─────────── Services et actions ─────────── */
  {
    cmd: "ros2 service list -t",
    group: "Services",
    what: "Liste les services avec leur type",
    example: "ros2 service list -t"
  },
  {
    cmd: "ros2 service call <service> <type> <requête>",
    group: "Services",
    what: "Appelle un service depuis le terminal",
    example: 'ros2 service call /reset std_srvs/srv/Trigger "{}"'
  },
  {
    cmd: "ros2 action list -t",
    group: "Services",
    what: "Liste les actions disponibles",
    example: "ros2 action list -t",
    output: "/navigate_to_pose [nav2_msgs/action/NavigateToPose]"
  },
  {
    cmd: "ros2 action send_goal <action> <type> <objectif> --feedback",
    group: "Services",
    what: "Envoie un objectif et suit son avancement",
    example:
      'ros2 action send_goal /navigate_to_pose nav2_msgs/action/NavigateToPose "{pose: {header: {frame_id: map}, pose: {position: {x: 2.0, y: 1.0}, orientation: {w: 1.0}}}}" --feedback'
  },

  /* ─────────── Paramètres ─────────── */
  {
    cmd: "ros2 param list <node>",
    group: "Paramètres",
    what: "Liste les paramètres déclarés par un node",
    example: "ros2 param list /base_roulante"
  },
  {
    cmd: "ros2 param get <node> <param>",
    group: "Paramètres",
    what: "Lit la valeur courante d'un paramètre",
    example: "ros2 param get /base_roulante rayon_roue",
    output: "Double value is: 0.0325"
  },
  {
    cmd: "ros2 param set <node> <param> <valeur>",
    group: "Paramètres",
    what: "Modifie un paramètre à chaud — idéal pour régler un PID",
    example: "ros2 param set /base_roulante vitesse_max 0.35"
  },
  {
    cmd: "ros2 param describe <node> <param>",
    group: "Paramètres",
    what: "Affiche la description et les bornes d'un paramètre",
    example: "ros2 param describe /base_roulante rayon_roue"
  },
  {
    cmd: "ros2 param dump <node>",
    group: "Paramètres",
    what: "Exporte tous les paramètres au format YAML — pour figer un réglage trouvé",
    example: "ros2 param dump /base_roulante > config/regle.yaml"
  },

  /* ─────────── TF ─────────── */
  {
    cmd: "ros2 run tf2_tools view_frames",
    group: "TF",
    what: "Génère un PDF de l'arbre des repères complet",
    example: "ros2 run tf2_tools view_frames"
  },
  {
    cmd: "ros2 run tf2_ros tf2_echo <parent> <enfant>",
    group: "TF",
    what: "Affiche la transformation entre deux repères en continu",
    example: "ros2 run tf2_ros tf2_echo base_link laser_frame",
    output: "- Translation: [0.150, 0.000, 0.200]\n- Rotation: in Quaternion [0.000, 0.000, 0.000, 1.000]"
  },
  {
    cmd: "ros2 run tf2_ros static_transform_publisher …",
    group: "TF",
    what: "Publie une transformation statique pour tester rapidement",
    example:
      "ros2 run tf2_ros static_transform_publisher --x 0.15 --z 0.2 --frame-id base_link --child-frame-id laser_frame"
  },

  /* ─────────── Compilation ─────────── */
  {
    cmd: "colcon build --symlink-install",
    group: "Compilation",
    what: "Compile le workspace avec des liens symboliques — à utiliser en développement",
    example: "cd ~/ros2_ws && colcon build --symlink-install"
  },
  {
    cmd: "colcon build --packages-select <paquet>",
    group: "Compilation",
    what: "Ne recompile qu'un seul paquet",
    example: "colcon build --packages-select mon_robot"
  },
  {
    cmd: "colcon build --parallel-workers <n>",
    group: "Compilation",
    what: "Limite la parallélisation — indispensable sur Raspberry Pi",
    example: "colcon build --parallel-workers 2"
  },
  {
    cmd: "rosdep install --from-paths src --ignore-src -r -y",
    group: "Compilation",
    what: "Installe toutes les dépendances déclarées dans les package.xml",
    example: "cd ~/ros2_ws && rosdep install --from-paths src --ignore-src -r -y"
  },
  {
    cmd: "ros2 pkg create --build-type <type> --dependencies … <nom>",
    group: "Compilation",
    what: "Crée un nouveau paquet avec sa structure",
    example: "ros2 pkg create --build-type ament_python --dependencies rclpy std_msgs mon_robot"
  },

  /* ─────────── Enregistrement ─────────── */
  {
    cmd: "ros2 bag record <topics>",
    group: "Enregistrement",
    what: "Enregistre des topics pour analyse ultérieure",
    example: "ros2 bag record -o mission /scan /odom /tf /tf_static"
  },
  {
    cmd: "ros2 bag record -a",
    group: "Enregistrement",
    what: "Enregistre tout — attention au disque avec les images",
    example: "ros2 bag record -a --compression-mode file --compression-format zstd"
  },
  {
    cmd: "ros2 bag play <dossier>",
    group: "Enregistrement",
    what: "Rejoue un enregistrement",
    example: "ros2 bag play mission --clock --rate 0.5"
  },
  {
    cmd: "ros2 bag info <dossier>",
    group: "Enregistrement",
    what: "Inspecte un enregistrement sans le rejouer",
    example: "ros2 bag info mission"
  },

  /* ─────────── Diagnostic ─────────── */
  {
    cmd: "ros2 doctor --report",
    group: "Diagnostic",
    what: "Vérifie l'installation, le réseau et les versions",
    example: "ros2 doctor --report"
  },
  {
    cmd: "ros2 interface show <type>",
    group: "Diagnostic",
    what: "Affiche la définition complète d'un message",
    example: "ros2 interface show sensor_msgs/msg/LaserScan"
  },
  {
    cmd: "ros2 interface list",
    group: "Diagnostic",
    what: "Liste toutes les interfaces disponibles",
    example: "ros2 interface list | grep sensor_msgs"
  },
  {
    cmd: "ros2 lifecycle get <node>",
    group: "Diagnostic",
    what: "État d'un node à cycle de vie — essentiel pour déboguer Nav2",
    example: "ros2 lifecycle get /planner_server",
    output: "inactive [2]"
  },
  {
    cmd: "ros2 control list_controllers",
    group: "Diagnostic",
    what: "État des contrôleurs ros2_control",
    example: "ros2 control list_controllers"
  },
  {
    cmd: "ros2 run rqt_graph rqt_graph",
    group: "Diagnostic",
    what: "Affiche le graphe des nodes et topics sous forme de schéma",
    example: "ros2 run rqt_graph rqt_graph"
  },
  {
    cmd: "ros2 run teleop_twist_keyboard teleop_twist_keyboard",
    group: "Diagnostic",
    what: "Pilotage au clavier — le premier test d'une base roulante",
    example: "ros2 run teleop_twist_keyboard teleop_twist_keyboard"
  }
];

export const CLI_GROUPS = [
  "Nodes",
  "Topics",
  "Services",
  "Paramètres",
  "TF",
  "Compilation",
  "Enregistrement",
  "Diagnostic"
] as const;
