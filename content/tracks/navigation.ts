import type { Track } from "../types";

export const NAVIGATION: Track = {
  slug: "navigation",
  index: 4,
  title: "Navigation",
  tagline: "Du comptage de tics à la traversée autonome d'un appartement",
  description:
    "Odométrie, fusion de capteurs, cartographie SLAM et pile Nav2. C'est ici qu'un robot cesse d'être télécommandé pour décider lui-même de son chemin.",
  color: "#e0a83c",
  lessons: [
    {
      slug: "odometrie",
      title: "L'odométrie, et pourquoi elle ment",
      summary:
        "Transformer des tics d'encodeurs en position, comprendre pourquoi cette position dérive inévitablement, et la corriger avec une IMU.",
      minutes: 17,
      level: "Intermédiaire",
      objectives: [
        "Calculer l'odométrie d'une base différentielle",
        "Identifier les sources de dérive",
        "Fusionner roues et IMU avec robot_localization"
      ],
      quiz: ["q-nav-1", "q-nav-2", "q-nav-3"],
      blocks: [
        {
          t: "para",
          text: "L'odométrie estime la position du robot en intégrant le mouvement de ses roues. C'est la base de tout, et c'est fondamentalement faux : chaque erreur s'ajoute aux précédentes et rien ne les efface. La question n'est pas si elle dérive, mais à quelle vitesse."
        },
        {
          t: "h",
          text: "Le calcul, pas à pas"
        },
        {
          t: "code",
          lang: "python",
          file: "odometrie_diff.py",
          code: `import math


class OdometrieDiff:
    def __init__(self, rayon_roue, entraxe, tics_par_tour):
        self.r = rayon_roue          # m
        self.L = entraxe             # m, distance entre les roues
        self.tics_tour = tics_par_tour
        self.x = self.y = self.theta = 0.0
        self.tics_g_prec = self.tics_d_prec = 0

    def mettre_a_jour(self, tics_g, tics_d, dt):
        # 1. Différence de tics depuis le dernier appel
        d_tics_g = tics_g - self.tics_g_prec
        d_tics_d = tics_d - self.tics_d_prec
        self.tics_g_prec, self.tics_d_prec = tics_g, tics_d

        # 2. Distance parcourue par chaque roue
        m_par_tic = (2 * math.pi * self.r) / self.tics_tour
        dist_g = d_tics_g * m_par_tic
        dist_d = d_tics_d * m_par_tic

        # 3. Mouvement du centre du robot
        dist = (dist_g + dist_d) / 2.0
        dtheta = (dist_d - dist_g) / self.L

        # 4. Intégration — c'est ici que l'erreur s'accumule
        #    On utilise l'angle moyen sur l'intervalle : plus juste
        theta_moyen = self.theta + dtheta / 2.0
        self.x += dist * math.cos(theta_moyen)
        self.y += dist * math.sin(theta_moyen)
        self.theta += dtheta

        # 5. Normaliser dans [-pi, pi]
        self.theta = math.atan2(math.sin(self.theta),
                                math.cos(self.theta))

        return {
            "x": self.x, "y": self.y, "theta": self.theta,
            "v": dist / dt if dt > 0 else 0.0,
            "w": dtheta / dt if dt > 0 else 0.0,
        }`
        },
        {
          t: "callout",
          tone: "tip",
          title: "L'angle moyen plutôt que l'angle initial",
          text: "Intégrer avec theta + dtheta/2 au lieu de theta divise l'erreur d'intégration en virage par un facteur important. C'est une correction d'une ligne pour un gain réel sur des trajectoires courbes."
        },
        {
          t: "h",
          text: "D'où vient la dérive"
        },
        {
          t: "table",
          head: ["Source", "Effet typique", "Atténuation"],
          rows: [
            ["Rayon de roue mal mesuré", "Erreur proportionnelle à la distance", "Calibrer sur 10 m mesurés au sol"],
            ["Entraxe mal mesuré", "Erreur d'angle en virage", "Calibrer sur 10 rotations complètes"],
            ["Glissement des roues", "Erreur aléatoire, pire en accélération", "Accélérations douces, IMU"],
            ["Tics manqués", "Dérive lente permanente", "Câbles séparés de la puissance"],
            ["Sol irrégulier", "Erreur imprévisible", "Fusion avec le laser"]
          ]
        },
        {
          t: "h",
          text: "Calibrer, concrètement"
        },
        {
          t: "code",
          lang: "bash",
          file: "Procédure de calibration",
          code: `# ── Calibration linéaire ──
# 1. Marquer un départ au sol, mesurer 5,00 m au mètre ruban
# 2. Faire avancer le robot en ligne droite jusqu'à la marque
# 3. Lire la distance annoncée par l'odométrie
ros2 topic echo /odom --field pose.pose.position.x

# Si l'odométrie annonce 4,80 m pour 5,00 m réels :
#   rayon_corrige = rayon_actuel * (5.00 / 4.80)

# ── Calibration angulaire ──
# 1. Faire tourner le robot exactement 10 tours sur lui-même
# 2. Comparer l'orientation finale à l'orientation de départ
# Si le robot a physiquement tourné 3620° pour 3600° annoncés :
#   entraxe_corrige = entraxe_actuel * (3620 / 3600)`
        },
        {
          t: "callout",
          tone: "warn",
          title: "Dix tours, pas un seul",
          text: "Sur un seul tour, l'erreur de mesure de ton œil dépasse l'erreur du robot. En multipliant les tours, l'erreur systématique devient mesurable et l'erreur d'observation devient négligeable. Même principe pour la distance : 5 mètres, pas 50 centimètres."
        },
        {
          t: "h",
          text: "Fusionner avec l'IMU"
        },
        {
          t: "para",
          text: "Les roues sont bonnes en distance et mauvaises en angle, à cause du glissement. Le gyroscope est excellent en angle sur le court terme. robot_localization fusionne les deux avec un filtre de Kalman étendu."
        },
        {
          t: "code",
          lang: "yaml",
          file: "config/ekf.yaml",
          code: `ekf_filter_node:
  ros__parameters:
    frequency: 30.0
    two_d_mode: true              # robot au sol : on ignore z, roll, pitch
    publish_tf: true

    map_frame: map
    odom_frame: odom
    base_link_frame: base_link
    world_frame: odom             # ce nœud produit odom → base_link

    # ── Odométrie des roues ──
    odom0: /odom_roues
    # Matrice 15 champs : x y z / roll pitch yaw / vx vy vz / ...
    # On ne garde QUE les vitesses linéaires, pas les positions
    odom0_config: [false, false, false,
                   false, false, false,
                   true,  true,  false,
                   false, false, false,
                   false, false, false]
    odom0_differential: false

    # ── IMU ──
    imu0: /imu/data
    # On ne garde QUE la vitesse angulaire en lacet
    imu0_config: [false, false, false,
                  false, false, false,
                  false, false, false,
                  false, false, true,
                  false, false, false]
    imu0_differential: false
    imu0_remove_gravitational_acceleration: true`
        },
        {
          t: "callout",
          tone: "danger",
          title: "L'erreur de configuration qui rend l'EKF instable",
          text: "Ne fournis jamais à la fois la position ET la vitesse issues de la même source. L'EKF les considère comme deux mesures indépendantes alors qu'elles sont parfaitement corrélées, ce qui fait diverger le filtre. Pour les roues, donne les vitesses. Pour l'IMU, donne la vitesse angulaire."
        },
        {
          t: "callout",
          tone: "warn",
          title: "Un seul publieur de odom → base_link",
          text: "Si l'EKF publie cette transformation, ton node d'odométrie ne doit surtout pas le faire aussi. Deux publieurs pour la même transformation font trembler le robot dans RViz2. Renomme le topic brut en /odom_roues et désactive sa publication TF."
        },
        {
          t: "h",
          text: "Mesurer la qualité"
        },
        {
          t: "code",
          lang: "bash",
          code: `# Test du carré : le robot doit revenir à son point de départ
# 2 m en avant, tourner 90°, quatre fois.
# Mesurer l'écart réel entre le départ et l'arrivée.

# Une bonne odométrie : moins de 5 cm d'écart sur un carré de 2 m
# Acceptable : moins de 15 cm
# À corriger : au-delà de 30 cm`
        }
      ]
    },

    {
      slug: "slam",
      title: "SLAM : cartographier et se localiser",
      summary:
        "Construire une carte tout en s'y repérant, avec SLAM Toolbox. Le mode cartographie, le mode localisation, et la fermeture de boucle.",
      minutes: 16,
      level: "Intermédiaire",
      objectives: [
        "Cartographier une pièce avec SLAM Toolbox",
        "Sauvegarder et recharger une carte",
        "Comprendre ce qu'apporte la fermeture de boucle"
      ],
      quiz: ["q-nav-4", "q-nav-5"],
      blocks: [
        {
          t: "para",
          text: "Le problème est circulaire : pour construire une carte il faut savoir où l'on est, et pour savoir où l'on est il faut une carte. Le SLAM résout les deux simultanément en recalant chaque nouveau scan sur ce qui a déjà été cartographié."
        },
        {
          t: "h",
          text: "Ce qu'il faut avant de commencer"
        },
        {
          t: "list",
          ordered: true,
          items: [
            "Un LiDAR qui publie /scan avec un frame_id correct",
            "Une odométrie qui publie la transformation odom → base_link",
            "La transformation statique base_link → laser_frame, mesurée précisément",
            "Toutes les horloges cohérentes (use_sim_time partout ou nulle part)"
          ]
        },
        {
          t: "callout",
          tone: "danger",
          title: "Le SLAM ne rattrape pas une odométrie catastrophique",
          text: "SLAM Toolbox utilise l'odométrie comme estimation initiale du recalage. Si elle dérive de 50 cm par mètre, le recalage part sur de mauvaises hypothèses et la carte devient inutilisable. Calibre l'odométrie AVANT de tenter la cartographie."
        },
        {
          t: "h",
          text: "Cartographier"
        },
        {
          t: "code",
          lang: "bash",
          code: `sudo apt install ros-jazzy-slam-toolbox

# Mode cartographie
ros2 launch slam_toolbox online_async_launch.py \\
  slam_params_file:=config/slam.yaml

# Piloter le robot pour couvrir la zone
ros2 run teleop_twist_keyboard teleop_twist_keyboard

# Regarder la carte se construire
rviz2 -d ~/ros2_ws/src/mon_robot/rviz/slam.rviz`
        },
        {
          t: "code",
          lang: "yaml",
          file: "config/slam.yaml",
          code: `slam_toolbox:
  ros__parameters:
    mode: mapping                    # ou localization
    odom_frame: odom
    map_frame: map
    base_frame: base_link
    scan_topic: /scan

    resolution: 0.05                 # 5 cm par case
    max_laser_range: 12.0
    minimum_time_interval: 0.2
    transform_timeout: 0.2

    # Distance et angle minimaux entre deux scans retenus
    minimum_travel_distance: 0.3
    minimum_travel_heading: 0.3

    # Fermeture de boucle
    do_loop_closing: true
    loop_search_maximum_distance: 3.0
    loop_match_minimum_response_fine: 0.45`
        },
        {
          t: "h",
          text: "La fermeture de boucle"
        },
        {
          t: "para",
          text: "Quand le robot revient à un endroit déjà visité, l'accumulation de dérive fait que la carte ne se referme pas : le couloir apparaît deux fois, légèrement décalé. La fermeture de boucle détecte cette situation, reconnaît le lieu et redistribue l'erreur sur tout le graphe de poses. C'est le moment où la carte se remet d'un coup en place."
        },
        {
          t: "callout",
          tone: "tip",
          title: "Comment aider la fermeture de boucle",
          text: "Repasse volontairement par les endroits déjà cartographiés, en particulier après un grand tour. Roule lentement, moins de 0,3 m/s. Évite de tourner sur place vite : le scan se déforme et le recalage échoue."
        },
        {
          t: "h",
          text: "Sauvegarder la carte"
        },
        {
          t: "code",
          lang: "bash",
          code: `# Format nav2 : image PGM + fichier YAML
ros2 run nav2_map_server map_saver_cli -f ~/maps/appartement

# Produit :
#   appartement.pgm   image en niveaux de gris
#   appartement.yaml  résolution, origine, seuils

# Format natif SLAM Toolbox : permet de REPRENDRE la cartographie
ros2 service call /slam_toolbox/serialize_map \\
  slam_toolbox/srv/SerializePoseGraph "{filename: '/home/toi/maps/appart'}"`
        },
        {
          t: "code",
          lang: "yaml",
          file: "appartement.yaml",
          code: `image: appartement.pgm
mode: trinary
resolution: 0.05
origin: [-8.2, -5.4, 0.0]   # coin bas-gauche dans le repère map
negate: 0
occupied_thresh: 0.65
free_thresh: 0.25`
        },
        {
          t: "callout",
          tone: "info",
          title: "Deux formats, deux usages",
          text: "Le PGM sert à naviguer avec AMCL : c'est une image figée. Le format sérialisé de SLAM Toolbox conserve le graphe de poses complet et permet de reprendre la cartographie plus tard, ou de corriger une zone. Sauvegarde les deux."
        },
        {
          t: "h",
          text: "Passer en localisation"
        },
        {
          t: "code",
          lang: "yaml",
          file: "config/localization.yaml",
          code: `slam_toolbox:
  ros__parameters:
    mode: localization
    map_file_name: /home/toi/maps/appart
    map_start_at_dock: true`
        },
        {
          t: "para",
          text: "L'alternative classique est AMCL, un filtre particulaire qui se localise sur une carte figée. Il est plus léger mais ne corrige pas la carte."
        },
        {
          t: "table",
          head: ["", "SLAM Toolbox localisation", "AMCL"],
          rows: [
            ["Charge CPU", "Plus élevée", "Faible"],
            ["Carte", "Peut être affinée", "Figée"],
            ["Position initiale", "Peut être retrouvée", "À fournir manuellement"],
            ["Enlèvement du robot", "Se récupère", "Souvent perdu"]
          ]
        },
        {
          t: "callout",
          tone: "warn",
          title: "Les environnements que le SLAM 2D déteste",
          text: "Un long couloir vide et uniforme ne donne aucune information de position le long de son axe : le robot glisse dans la carte. Une grande salle vide dépasse la portée du LiDAR. Les baies vitrées sont invisibles au laser. Dans ces cas, il faut ajouter des repères artificiels ou passer à un SLAM visuel."
        }
      ]
    },

    {
      slug: "nav2",
      title: "Nav2 : la pile de navigation",
      summary:
        "L'architecture de Nav2, les serveurs qui la composent, les cartes de coût et le fichier de paramètres qui décide de tout.",
      minutes: 22,
      level: "Avancé",
      objectives: [
        "Comprendre l'architecture en serveurs de Nav2",
        "Régler les cartes de coût pour son robot",
        "Choisir et régler un contrôleur"
      ],
      quiz: ["q-nav-6", "q-nav-7", "q-nav-8"],
      blocks: [
        {
          t: "para",
          text: "Nav2 n'est pas un algorithme mais un assemblage de serveurs coordonnés par un arbre de comportement. Comprendre qui fait quoi est indispensable pour savoir où chercher quand le robot ne bouge pas."
        },
        {
          t: "diagram",
          kind: "nav2-stack",
          caption: "Les serveurs de Nav2 et leur enchaînement."
        },
        {
          t: "table",
          head: ["Serveur", "Rôle", "En cas de problème"],
          rows: [
            ["bt_navigator", "Orchestre l'ensemble via un arbre de comportement", "Le robot ne réagit pas à l'objectif"],
            ["planner_server", "Calcule le chemin global sur la carte", "\"No valid path found\""],
            ["controller_server", "Suit le chemin, produit /cmd_vel", "Le robot oscille ou reste immobile"],
            ["smoother_server", "Lisse le chemin global", "Trajectoire en escalier"],
            ["behavior_server", "Comportements de secours : recul, rotation", "Le robot tourne en rond"],
            ["velocity_smoother", "Limite les accélérations", "Démarrages brutaux"],
            ["collision_monitor", "Arrêt d'urgence sur proximité", "Sécurité de dernier recours"]
          ]
        },
        {
          t: "h",
          text: "Les deux cartes de coût"
        },
        {
          t: "para",
          text: "La carte de coût globale couvre toute la carte connue et sert à la planification. La carte locale est une petite fenêtre qui suit le robot, reconstruite en permanence à partir des capteurs, et sert à l'évitement immédiat."
        },
        {
          t: "code",
          lang: "yaml",
          file: "config/nav2_params.yaml (extrait)",
          code: `local_costmap:
  local_costmap:
    ros__parameters:
      update_frequency: 5.0
      publish_frequency: 2.0
      global_frame: odom            # local = repère odom
      robot_base_frame: base_link
      rolling_window: true
      width: 3
      height: 3
      resolution: 0.05

      # Le rayon du robot : paramètre critique
      robot_radius: 0.18

      plugins: ["obstacle_layer", "inflation_layer"]

      obstacle_layer:
        plugin: "nav2_costmap_2d::ObstacleLayer"
        enabled: true
        observation_sources: scan
        scan:
          topic: /scan
          max_obstacle_height: 2.0
          clearing: true
          marking: true
          data_type: "LaserScan"
          raytrace_max_range: 12.0
          obstacle_max_range: 8.0

      inflation_layer:
        plugin: "nav2_costmap_2d::InflationLayer"
        cost_scaling_factor: 3.0
        inflation_radius: 0.40

global_costmap:
  global_costmap:
    ros__parameters:
      update_frequency: 1.0
      global_frame: map             # global = repère map
      robot_base_frame: base_link
      robot_radius: 0.18
      resolution: 0.05
      track_unknown_space: true
      plugins: ["static_layer", "obstacle_layer", "inflation_layer"]`
        },
        {
          t: "callout",
          tone: "danger",
          title: "Les trois paramètres qui expliquent 80 % des échecs",
          text: "robot_radius trop petit : le robot frotte les murs. Trop grand : il refuse de passer une porte pourtant assez large. inflation_radius trop grand : les couloirs étroits deviennent infranchissables. Mesure le rayon réel de ton robot, ajoute 2 cm de marge, et pas davantage."
        },
        {
          t: "h",
          text: "Choisir un contrôleur"
        },
        {
          t: "table",
          head: ["Contrôleur", "Convient à", "Caractère"],
          rows: [
            ["DWB", "Base différentielle, intérieur", "Historique, beaucoup de paramètres"],
            ["Regulated Pure Pursuit", "Différentielle, chemins lisses", "Simple à régler, robuste, à préférer au début"],
            ["MPPI", "Tous types, obstacles dynamiques", "Excellent mais gourmand en CPU"],
            ["Rotation Shim", "Complément", "Fait pivoter le robot avant d'avancer"]
          ]
        },
        {
          t: "code",
          lang: "yaml",
          file: "Contrôleur RPP",
          code: `controller_server:
  ros__parameters:
    controller_frequency: 20.0
    min_x_velocity_threshold: 0.001
    min_theta_velocity_threshold: 0.001

    progress_checker:
      plugin: "nav2_controller::SimpleProgressChecker"
      required_movement_radius: 0.5
      movement_time_allowance: 10.0

    goal_checker:
      plugin: "nav2_controller::SimpleGoalChecker"
      xy_goal_tolerance: 0.20
      yaw_goal_tolerance: 0.25

    FollowPath:
      plugin: "nav2_regulated_pure_pursuit_controller::RegulatedPurePursuitController"
      desired_linear_vel: 0.4
      lookahead_dist: 0.5
      min_lookahead_dist: 0.3
      max_lookahead_dist: 0.9
      use_velocity_scaled_lookahead_dist: true
      # Ralentir dans les virages serrés
      use_regulated_linear_velocity_scaling: true
      regulated_linear_scaling_min_radius: 0.9
      # Ralentir près des obstacles
      use_cost_regulated_linear_velocity_scaling: true`
        },
        {
          t: "callout",
          tone: "tip",
          title: "Le réglage qui compte le plus en RPP",
          text: "lookahead_dist : la distance à laquelle le robot vise sur le chemin. Trop court, il oscille. Trop long, il coupe les virages et frotte les murs. Commence à 0,5 m pour un robot de 30 cm, puis ajuste en observant."
        },
        {
          t: "h",
          text: "Le cycle de vie des nodes"
        },
        {
          t: "para",
          text: "Les nodes Nav2 sont des nodes à cycle de vie : ils passent par unconfigured, inactive puis active. Le lifecycle_manager orchestre ces transitions. Un serveur bloqué en inactive ne fait rien du tout, sans erreur visible."
        },
        {
          t: "terminal",
          lines: [
            { cmd: "ros2 lifecycle get /planner_server" },
            { out: "inactive [2]" },
            { cmd: "ros2 lifecycle set /planner_server activate" },
            { out: "Transitioning successful" },
            { cmd: "ros2 topic echo /diagnostics --once" }
          ]
        },
        {
          t: "callout",
          tone: "warn",
          title: "Le robot ignore les objectifs",
          text: "Premier réflexe : vérifier l'état des nodes de cycle de vie. S'ils sont en inactive, le lifecycle_manager n'a pas terminé son activation — souvent parce qu'un node attend une transformation qui n'arrive jamais. Regarde la sortie du lifecycle_manager."
        },
        {
          t: "h",
          text: "Diagnostiquer un robot immobile"
        },
        {
          t: "list",
          ordered: true,
          items: [
            "L'arbre TF est-il complet ? map → odom → base_link → laser_frame",
            "/scan arrive-t-il ? ros2 topic hz /scan",
            "Les nodes de cycle de vie sont-ils actifs ?",
            "La carte de coût globale s'affiche-t-elle dans RViz2 ?",
            "Le chemin /plan est-il calculé ?",
            "/cmd_vel contient-il autre chose que des zéros ?",
            "Le robot est-il coincé dans une zone gonflée de la carte de coût ?"
          ]
        },
        {
          t: "callout",
          tone: "info",
          title: "Le cas du robot entouré d'obstacles fantômes",
          text: "Si la carte de coût locale montre des obstacles là où il n'y a rien, c'est presque toujours un problème de TF : le scan est placé au mauvais endroit. Vérifie base_link → laser_frame, et l'orientation du LiDAR en particulier — un capteur monté à 180° est une erreur fréquente."
        }
      ]
    },

    {
      slug: "comportements",
      title: "Arbres de comportement et missions",
      summary:
        "Personnaliser la logique de Nav2 avec BehaviorTree.CPP, et écrire une mission qui enchaîne plusieurs objectifs.",
      minutes: 15,
      level: "Avancé",
      objectives: [
        "Lire un arbre de comportement Nav2",
        "Modifier la stratégie de récupération",
        "Écrire une mission multi-points"
      ],
      quiz: ["q-nav-9", "q-nav-10"],
      blocks: [
        {
          t: "para",
          text: "Un arbre de comportement décrit la logique de décision sous forme d'arbre : des nœuds de contrôle organisent l'exécution, des nœuds feuilles font le travail. C'est plus lisible et plus modulaire qu'une machine à états, surtout quand les cas de récupération se multiplient."
        },
        {
          t: "table",
          head: ["Nœud", "Comportement"],
          rows: [
            ["Sequence", "Exécute les enfants dans l'ordre, s'arrête au premier échec"],
            ["Fallback", "Essaie chaque enfant jusqu'au premier succès"],
            ["RetryUntilSuccessful", "Réessaie n fois"],
            ["ReactiveFallback", "Réévalue les conditions en permanence"],
            ["PipelineSequence", "Rejoue les enfants précédents à chaque cycle"]
          ]
        },
        {
          t: "code",
          lang: "xml",
          file: "behavior_trees/navigate_perso.xml",
          code: `<root main_tree_to_execute="MainTree">
  <BehaviorTree ID="MainTree">
    <RecoveryNode number_of_retries="6" name="NavigateRecovery">

      <PipelineSequence name="NavigateWithReplanning">
        <!-- Replanifier toutes les secondes -->
        <RateController hz="1.0">
          <RecoveryNode number_of_retries="1" name="ComputePathToPose">
            <ComputePathToPose goal="{goal}" path="{path}"
                               planner_id="GridBased"/>
            <ClearEntireCostmap
              name="ClearGlobalCostmap-Context"
              service_name="global_costmap/clear_entirely_global_costmap"/>
          </RecoveryNode>
        </RateController>

        <RecoveryNode number_of_retries="1" name="FollowPath">
          <FollowPath path="{path}" controller_id="FollowPath"/>
          <ClearEntireCostmap
            name="ClearLocalCostmap-Context"
            service_name="local_costmap/clear_entirely_local_costmap"/>
        </RecoveryNode>
      </PipelineSequence>

      <!-- Stratégie de récupération, dans l'ordre d'escalade -->
      <ReactiveFallback name="RecoveryFallback">
        <GoalUpdated/>
        <RoundRobin name="RecoveryActions">
          <ClearEntireCostmap name="ClearGlobal"
            service_name="global_costmap/clear_entirely_global_costmap"/>
          <Spin spin_dist="1.57"/>
          <Wait wait_duration="3"/>
          <BackUp backup_dist="0.20" backup_speed="0.05"/>
        </RoundRobin>
      </ReactiveFallback>

    </RecoveryNode>
  </BehaviorTree>
</root>`
        },
        {
          t: "callout",
          tone: "tip",
          title: "Adapter la récupération à ton robot",
          text: "Spin fait pivoter le robot sur place : dangereux pour un robot long ou dans un couloir étroit. BackUp recule sans capteur arrière : à retirer si le robot n'a rien qui regarde derrière. Ce fichier XML se modifie sans recompiler quoi que ce soit."
        },
        {
          t: "h",
          text: "Une mission multi-points"
        },
        {
          t: "code",
          lang: "python",
          file: "mission_patrouille.py",
          code: `import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from nav2_msgs.action import NavigateThroughPoses
from geometry_msgs.msg import PoseStamped


class Patrouille(Node):
    def __init__(self):
        super().__init__("patrouille")
        self.cli = ActionClient(
            self, NavigateThroughPoses, "navigate_through_poses")

    def pose(self, x, y, w=1.0):
        p = PoseStamped()
        p.header.frame_id = "map"
        p.header.stamp = self.get_clock().now().to_msg()
        p.pose.position.x = float(x)
        p.pose.position.y = float(y)
        p.pose.orientation.w = float(w)
        return p

    def lancer(self, points):
        self.cli.wait_for_server()
        goal = NavigateThroughPoses.Goal()
        goal.poses = [self.pose(x, y) for x, y in points]

        fut = self.cli.send_goal_async(goal, self.on_retour)
        fut.add_done_callback(self.on_accepte)

    def on_retour(self, msg):
        restants = msg.feedback.number_of_poses_remaining
        self.get_logger().info(f"{restants} points restants")

    def on_accepte(self, future):
        h = future.result()
        if not h.accepted:
            self.get_logger().error("Mission refusée")
            return
        h.get_result_async().add_done_callback(
            lambda f: self.get_logger().info("Patrouille terminée"))


def main():
    rclpy.init()
    n = Patrouille()
    n.lancer([(1.0, 0.0), (1.0, 2.0), (-1.0, 2.0), (0.0, 0.0)])
    rclpy.spin(n)`
        },
        {
          t: "table",
          head: ["Action Nav2", "Usage"],
          rows: [
            ["NavigateToPose", "Un seul objectif"],
            ["NavigateThroughPoses", "Une suite de points de passage, sans s'arrêter"],
            ["FollowWaypoints", "Une suite de points, avec une tâche à chaque arrêt"],
            ["ComputePathToPose", "Calculer un chemin sans l'exécuter"],
            ["Spin / BackUp / DriveOnHeading", "Manœuvres unitaires"]
          ]
        },
        {
          t: "callout",
          tone: "info",
          title: "NavigateThroughPoses ou FollowWaypoints ?",
          text: "Le premier traverse les points sans s'arrêter : parfait pour une trajectoire imposée. Le second s'arrête à chaque point et peut y déclencher une tâche — prendre une photo, attendre, mesurer. Choisis selon que les points sont un passage ou une destination."
        }
      ]
    }
  ]
};
