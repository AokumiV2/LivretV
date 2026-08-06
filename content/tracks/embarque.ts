import type { Track } from "../types";

export const EMBARQUE: Track = {
  slug: "embarque",
  index: 6,
  title: "Manipulation & embarqué",
  tagline: "Descendre au niveau du matériel, et remonter jusqu'au bras",
  description:
    "ros2_control comme couche d'abstraction matérielle, MoveIt 2 pour les bras, micro-ROS pour le temps réel sur microcontrôleur, et le déploiement d'un robot qui démarre tout seul.",
  color: "#a78bfa",
  lessons: [
    {
      slug: "ros2-control",
      title: "ros2_control : la couche matérielle",
      summary:
        "L'architecture qui sépare le contrôle de la mécanique. Écrire une interface matérielle une seule fois, et réutiliser tous les contrôleurs existants.",
      minutes: 18,
      level: "Avancé",
      objectives: [
        "Comprendre l'architecture ros2_control",
        "Écrire une interface matérielle minimale",
        "Configurer un contrôleur différentiel"
      ],
      quiz: ["q-emb-1", "q-emb-2"],
      blocks: [
        {
          t: "para",
          text: "ros2_control sépare deux mondes : d'un côté les contrôleurs, qui savent transformer une consigne de vitesse en commandes d'articulations ; de l'autre l'interface matérielle, qui sait parler à ton électronique. Écris la seconde une fois, et tous les contrôleurs standards deviennent utilisables."
        },
        {
          t: "diagram",
          kind: "control-loop",
          caption: "Le controller_manager fait tourner la boucle : lire, mettre à jour, écrire."
        },
        {
          t: "table",
          head: ["Élément", "Rôle"],
          rows: [
            ["controller_manager", "Cadence la boucle et charge les contrôleurs"],
            ["Hardware interface", "TON code : lit les encodeurs, écrit les commandes moteur"],
            ["diff_drive_controller", "Twist → vitesses de roues, et odométrie en retour"],
            ["joint_trajectory_controller", "Suit une trajectoire d'articulations, pour les bras"],
            ["joint_state_broadcaster", "Publie /joint_states depuis les états lus"]
          ]
        },
        {
          t: "h",
          text: "Déclarer le matériel dans l'URDF"
        },
        {
          t: "code",
          lang: "xml",
          file: "urdf/rover.ros2_control.xacro",
          code: `<ros2_control name="RoverSystem" type="system">

  <hardware>
    <plugin>mon_robot/RoverHardware</plugin>
    <param name="port_serie">/dev/ttyUSB0</param>
    <param name="baud">115200</param>
    <param name="tics_par_tour">374</param>
  </hardware>

  <joint name="wheel_left_joint">
    <command_interface name="velocity">
      <param name="min">-10</param>
      <param name="max">10</param>
    </command_interface>
    <state_interface name="position"/>
    <state_interface name="velocity"/>
  </joint>

  <joint name="wheel_right_joint">
    <command_interface name="velocity">
      <param name="min">-10</param>
      <param name="max">10</param>
    </command_interface>
    <state_interface name="position"/>
    <state_interface name="velocity"/>
  </joint>

</ros2_control>`
        },
        {
          t: "h",
          text: "L'interface matérielle"
        },
        {
          t: "code",
          lang: "cpp",
          file: "src/rover_hardware.cpp",
          code: `#include "hardware_interface/system_interface.hpp"

namespace mon_robot
{

class RoverHardware : public hardware_interface::SystemInterface
{
public:
  CallbackReturn on_init(const hardware_interface::HardwareInfo & info) override
  {
    if (SystemInterface::on_init(info) != CallbackReturn::SUCCESS)
      return CallbackReturn::ERROR;

    port_ = info_.hardware_parameters["port_serie"];
    tics_par_tour_ = std::stoi(info_.hardware_parameters["tics_par_tour"]);

    positions_.resize(info_.joints.size(), 0.0);
    vitesses_.resize(info_.joints.size(), 0.0);
    commandes_.resize(info_.joints.size(), 0.0);
    return CallbackReturn::SUCCESS;
  }

  CallbackReturn on_activate(const rclcpp_lifecycle::State &) override
  {
    // Ouvrir le port série ici, pas dans on_init
    serie_.ouvrir(port_, 115200);
    return CallbackReturn::SUCCESS;
  }

  CallbackReturn on_deactivate(const rclcpp_lifecycle::State &) override
  {
    // Arrêter les moteurs AVANT de fermer : sécurité
    serie_.ecrire("V 0 0\\n");
    serie_.fermer();
    return CallbackReturn::SUCCESS;
  }

  // Appelée à chaque cycle : lire l'état réel du matériel
  return_type read(const rclcpp::Time &,
                   const rclcpp::Duration & periode) override
  {
    auto tics = serie_.lire_encodeurs();
    for (size_t i = 0; i < positions_.size(); ++i) {
      double nouvelle_pos = tics[i] * 2.0 * M_PI / tics_par_tour_;
      vitesses_[i] = (nouvelle_pos - positions_[i]) / periode.seconds();
      positions_[i] = nouvelle_pos;
    }
    return return_type::OK;
  }

  // Appelée à chaque cycle : envoyer les commandes
  return_type write(const rclcpp::Time &, const rclcpp::Duration &) override
  {
    char buf[64];
    snprintf(buf, sizeof(buf), "V %.3f %.3f\\n",
             commandes_[0], commandes_[1]);
    serie_.ecrire(buf);
    return return_type::OK;
  }

private:
  std::string port_;
  int tics_par_tour_;
  std::vector<double> positions_, vitesses_, commandes_;
  LiaisonSerie serie_;
};

}  // namespace mon_robot

PLUGINLIB_EXPORT_CLASS(mon_robot::RoverHardware,
                       hardware_interface::SystemInterface)`
        },
        {
          t: "callout",
          tone: "danger",
          title: "read() et write() doivent être rapides",
          text: "Ces deux fonctions sont appelées à la fréquence du controller_manager, souvent 50 ou 100 Hz. Une lecture série bloquante avec un timeout d'une seconde fait s'effondrer toute la boucle de contrôle. Utilise des lectures non bloquantes, ou un fil dédié à la liaison série."
        },
        {
          t: "h",
          text: "Configurer les contrôleurs"
        },
        {
          t: "code",
          lang: "yaml",
          file: "config/controllers.yaml",
          code: `controller_manager:
  ros__parameters:
    update_rate: 50           # Hz — la cadence de read/write

    joint_state_broadcaster:
      type: joint_state_broadcaster/JointStateBroadcaster

    diff_drive_controller:
      type: diff_drive_controller/DiffDriveController

diff_drive_controller:
  ros__parameters:
    left_wheel_names: ["wheel_left_joint"]
    right_wheel_names: ["wheel_right_joint"]

    wheel_separation: 0.23
    wheel_radius: 0.0325

    publish_rate: 50.0
    odom_frame_id: odom
    base_frame_id: base_link
    enable_odom_tf: true

    # Limites — c'est ce qui protège la mécanique
    linear.x.max_velocity: 0.6
    linear.x.min_velocity: -0.4
    linear.x.max_acceleration: 1.0
    angular.z.max_velocity: 1.5
    angular.z.max_acceleration: 2.0

    # Sécurité : arrêt si plus aucune commande n'arrive
    cmd_vel_timeout: 0.5`
        },
        {
          t: "terminal",
          lines: [
            { cmd: "ros2 control list_hardware_interfaces" },
            { out: "command interfaces" },
            { out: "  wheel_left_joint/velocity [available] [claimed]" },
            { out: "state interfaces" },
            { out: "  wheel_left_joint/position" },
            { out: "  wheel_left_joint/velocity" },
            { cmd: "ros2 control list_controllers" },
            { out: "joint_state_broadcaster[joint_state_broadcaster/JointStateBroadcaster] active" },
            { out: "diff_drive_controller[diff_drive_controller/DiffDriveController] active" }
          ]
        },
        {
          t: "callout",
          tone: "tip",
          title: "cmd_vel_timeout est une sécurité, pas un détail",
          text: "Si le Wi-Fi tombe pendant que le robot roule, sans ce timeout il continue à la dernière vitesse reçue jusqu'à rencontrer un obstacle. Une demi-seconde est un bon compromis."
        }
      ]
    },

    {
      slug: "moveit2",
      title: "MoveIt 2 : piloter un bras",
      summary:
        "Cinématique inverse, planification avec évitement de collision, et la configuration qui prend plus de temps que le code.",
      minutes: 20,
      level: "Avancé",
      objectives: [
        "Générer une configuration MoveIt avec l'assistant",
        "Planifier un mouvement vers une pose cartésienne",
        "Ajouter des objets de collision à la scène"
      ],
      quiz: ["q-emb-3", "q-emb-4"],
      blocks: [
        {
          t: "para",
          text: "Commander un bras articulation par articulation devient impraticable au-delà de trois axes. MoveIt 2 résout le problème inverse : tu indiques où doit se trouver la pince, il calcule les angles et vérifie que le chemin ne traverse rien."
        },
        {
          t: "h",
          text: "L'assistant de configuration"
        },
        {
          t: "code",
          lang: "bash",
          code: `sudo apt install ros-jazzy-moveit

ros2 launch moveit_setup_assistant setup_assistant.launch.py

# Les étapes, dans l'ordre :
# 1. Charger l'URDF du bras
# 2. Générer la matrice de collisions auto-exclues
# 3. Définir les repères virtuels (base fixe au monde)
# 4. Créer les groupes de planification (bras, pince)
# 5. Enregistrer des poses nommées (repos, prise)
# 6. Déclarer l'effecteur terminal
# 7. Générer le paquet _moveit_config`
        },
        {
          t: "callout",
          tone: "warn",
          title: "L'étape 2 conditionne tout le reste",
          text: "La matrice de collisions auto-exclues indique quels segments peuvent se toucher sans que ce soit une collision — typiquement deux segments voisins. Si elle est mal générée, MoveIt considère le bras en collision avec lui-même dès la position de repos et refuse toute planification."
        },
        {
          t: "h",
          text: "Planifier un mouvement"
        },
        {
          t: "code",
          lang: "python",
          file: "commande_bras.py",
          code: `from moveit.planning import MoveItPy
from geometry_msgs.msg import PoseStamped


class CommandeBras(Node):
    def __init__(self):
        super().__init__("commande_bras")
        self.moveit = MoveItPy(node_name="moveit_py")
        self.bras = self.moveit.get_planning_component("bras")

    def aller_a(self, x, y, z):
        cible = PoseStamped()
        cible.header.frame_id = "base_link"
        cible.pose.position.x = x
        cible.pose.position.y = y
        cible.pose.position.z = z
        cible.pose.orientation.w = 1.0

        self.bras.set_start_state_to_current_state()
        self.bras.set_goal_state(
            pose_stamped_msg=cible, pose_link="outil_link")

        plan = self.bras.plan()
        if not plan:
            self.get_logger().error(
                "Aucun plan trouvé : cible hors d'atteinte ou en collision")
            return False

        self.moveit.execute(plan.trajectory, controllers=[])
        return True

    def position_nommee(self, nom):
        # Les poses enregistrées dans l'assistant
        self.bras.set_start_state_to_current_state()
        self.bras.set_goal_state(configuration_name=nom)
        plan = self.bras.plan()
        if plan:
            self.moveit.execute(plan.trajectory, controllers=[])`
        },
        {
          t: "h",
          text: "La scène de planification"
        },
        {
          t: "para",
          text: "MoveIt planifie en évitant les obstacles qu'il connaît. Une table qui n'est pas déclarée dans la scène n'existe pas : le bras la traversera dans son plan, et la percutera en réalité."
        },
        {
          t: "code",
          lang: "python",
          file: "scene.py",
          code: `from moveit_msgs.msg import CollisionObject
from shape_msgs.msg import SolidPrimitive


def ajouter_table(self):
    obj = CollisionObject()
    obj.header.frame_id = "base_link"
    obj.id = "table"

    boite = SolidPrimitive()
    boite.type = SolidPrimitive.BOX
    boite.dimensions = [1.2, 0.8, 0.02]

    pose = Pose()
    pose.position.x = 0.4
    pose.position.z = -0.01
    pose.orientation.w = 1.0

    obj.primitives = [boite]
    obj.primitive_poses = [pose]
    obj.operation = CollisionObject.ADD

    self.scene_pub.publish(obj)`
        },
        {
          t: "callout",
          tone: "danger",
          title: "Ce que MoveIt ne voit pas n'existe pas",
          text: "MoveIt ne perçoit rien de lui-même. Table, câbles, opérateur, capot du robot : tout ce que tu ne déclares pas sera traversé. Pour les obstacles dynamiques, il faut alimenter l'Octomap depuis une caméra de profondeur."
        },
        {
          t: "h",
          text: "Choisir un planificateur"
        },
        {
          t: "table",
          head: ["Planificateur", "Caractère", "Usage"],
          rows: [
            ["OMPL (RRTConnect)", "Rapide, mais chemins irréguliers", "Défaut, à lisser ensuite"],
            ["Pilz Industrial Motion", "Mouvements géométriques exacts", "Ligne droite, arc de cercle"],
            ["STOMP", "Optimise le chemin", "Trajectoires lisses"],
            ["CHOMP", "Optimise par gradient", "Raffinement d'un chemin existant"]
          ]
        },
        {
          t: "callout",
          tone: "tip",
          title: "Pilz quand le mouvement doit être prévisible",
          text: "OMPL est probabiliste : deux appels identiques donnent deux chemins différents. Pour une dépose précise ou un mouvement que l'opérateur doit anticiper, Pilz LIN donne une vraie ligne droite cartésienne, reproductible."
        }
      ]
    },

    {
      slug: "micro-ros",
      title: "micro-ROS : ROS 2 sur microcontrôleur",
      summary:
        "Faire d'un ESP32 ou d'un Teensy un vrai node ROS 2, avec ses publishers et ses subscribers, pour déporter le temps réel.",
      minutes: 16,
      level: "Avancé",
      objectives: [
        "Comprendre le rôle de l'agent micro-ROS",
        "Écrire un node sur ESP32",
        "Choisir entre série et Wi-Fi"
      ],
      quiz: ["q-emb-5", "q-emb-6"],
      blocks: [
        {
          t: "para",
          text: "Linux n'est pas temps réel. Une boucle d'asservissement à 1 kHz sur un Raspberry Pi rate des cycles dès que le système s'occupe d'autre chose. micro-ROS déplace cette boucle sur un microcontrôleur, tout en gardant l'intégration au graphe ROS 2."
        },
        {
          t: "h",
          text: "L'agent, la pièce indispensable"
        },
        {
          t: "para",
          text: "Un microcontrôleur ne peut pas faire tourner DDS. micro-ROS utilise un protocole allégé, XRCE-DDS, et un agent tournant côté Linux fait la traduction vers le vrai graphe ROS 2."
        },
        {
          t: "code",
          lang: "bash",
          code: `sudo apt install ros-jazzy-micro-ros-agent

# Liaison série
ros2 run micro_ros_agent micro_ros_agent serial \\
  --dev /dev/ttyUSB0 -b 115200

# Liaison Wi-Fi UDP
ros2 run micro_ros_agent micro_ros_agent udp4 --port 8888`
        },
        {
          t: "callout",
          tone: "danger",
          title: "Sans agent, rien n'apparaît",
          text: "Le microcontrôleur peut tourner parfaitement, `ros2 node list` restera vide tant que l'agent n'est pas lancé. C'est la première chose à vérifier quand un node micro-ROS semble invisible."
        },
        {
          t: "h",
          text: "Un node sur ESP32"
        },
        {
          t: "code",
          lang: "cpp",
          file: "esp32_base.ino",
          code: `#include <micro_ros_arduino.h>
#include <rcl/rcl.h>
#include <rclc/rclc.h>
#include <rclc/executor.h>
#include <geometry_msgs/msg/twist.h>
#include <nav_msgs/msg/odometry.h>

rcl_publisher_t pub_odom;
rcl_subscription_t sub_cmd;
geometry_msgs__msg__Twist msg_cmd;
nav_msgs__msg__Odometry msg_odom;
rclc_executor_t executor;
rcl_node_t node;

// Appelé à chaque commande reçue
void cb_cmd_vel(const void * msgin)
{
  const auto * m = (const geometry_msgs__msg__Twist *)msgin;
  float v = m->linear.x;      // m/s
  float w = m->angular.z;     // rad/s

  // Cinématique inverse différentielle
  float v_gauche = v - (w * ENTRAXE / 2.0);
  float v_droite = v + (w * ENTRAXE / 2.0);

  consigne_gauche = v_gauche / RAYON_ROUE;   // rad/s
  consigne_droite = v_droite / RAYON_ROUE;
}

void setup()
{
  set_microros_transports();
  delay(2000);

  rclc_support_t support;
  rcl_allocator_t allocator = rcl_get_default_allocator();
  rclc_support_init(&support, 0, NULL, &allocator);
  rclc_node_init_default(&node, "base_esp32", "", &support);

  rclc_publisher_init_default(
    &pub_odom, &node,
    ROSIDL_GET_MSG_TYPE_SUPPORT(nav_msgs, msg, Odometry), "odom");

  rclc_subscription_init_default(
    &sub_cmd, &node,
    ROSIDL_GET_MSG_TYPE_SUPPORT(geometry_msgs, msg, Twist), "cmd_vel");

  rclc_executor_init(&executor, &support.context, 1, &allocator);
  rclc_executor_add_subscription(
    &executor, &sub_cmd, &msg_cmd, &cb_cmd_vel, ON_NEW_DATA);
}

void loop()
{
  // La boucle d'asservissement tourne à 1 kHz, indépendamment de ROS
  asservir_moteurs();

  // On donne 1 ms à micro-ROS pour traiter ce qui arrive
  rclc_executor_spin_some(&executor, RCL_MS_TO_NS(1));

  // Publier l'odométrie à 50 Hz
  if (millis() - dernier_odom > 20) {
    remplir_odometrie(&msg_odom);
    rcl_publish(&pub_odom, &msg_odom, NULL);
    dernier_odom = millis();
  }
}`
        },
        {
          t: "h",
          text: "Série ou Wi-Fi"
        },
        {
          t: "table",
          head: ["", "Série USB", "Wi-Fi UDP"],
          rows: [
            ["Latence", "1 à 2 ms, stable", "5 à 50 ms, variable"],
            ["Fiabilité", "Excellente", "Dépend du réseau"],
            ["Câblage", "Un câble", "Aucun"],
            ["Alimentation", "Fournie par l'USB", "À prévoir séparément"],
            ["Bon pour", "Asservissement, odométrie", "Télémétrie, capteurs distants"]
          ]
        },
        {
          t: "callout",
          tone: "warn",
          title: "Ne fais jamais passer une boucle d'asservissement par le Wi-Fi",
          text: "La gigue du Wi-Fi atteint plusieurs dizaines de millisecondes. Un asservissement de vitesse devient instable. Garde la boucle entière DANS le microcontrôleur, et n'échange que des consignes et des mesures avec ROS 2."
        },
        {
          t: "h",
          text: "Les contraintes de mémoire"
        },
        {
          t: "callout",
          tone: "danger",
          title: "Les messages à taille variable doivent être pré-alloués",
          text: "Un tableau ou une chaîne dans un message micro-ROS n'a pas de mémoire réservée par défaut. Publier sans allouer provoque une corruption mémoire, et le microcontrôleur redémarre sans explication. C'est le piège numéro un de micro-ROS."
        },
        {
          t: "code",
          lang: "cpp",
          code: `// Allouer explicitement avant tout usage
msg_scan.ranges.capacity = 360;
msg_scan.ranges.size = 360;
msg_scan.ranges.data =
  (float *) malloc(360 * sizeof(float));

// Les chaînes aussi
msg_odom.header.frame_id.capacity = 32;
msg_odom.header.frame_id.data = (char *) malloc(32);
strcpy(msg_odom.header.frame_id.data, "odom");
msg_odom.header.frame_id.size =
  strlen(msg_odom.header.frame_id.data);`
        }
      ]
    },

    {
      slug: "deploiement",
      title: "Déployer un robot qui démarre tout seul",
      summary:
        "Launch files structurés, règles udev pour des périphériques stables, service systemd, et diagnostic à distance.",
      minutes: 15,
      level: "Intermédiaire",
      objectives: [
        "Structurer ses launch files par couches",
        "Fixer les noms de périphériques avec udev",
        "Démarrer le robot automatiquement au boot"
      ],
      quiz: ["q-emb-7", "q-emb-8"],
      blocks: [
        {
          t: "para",
          text: "Un robot de démonstration se lance à la main dans six terminaux. Un robot utilisable démarre seul à la mise sous tension. La différence tient à trois fichiers."
        },
        {
          t: "h",
          text: "Structurer les launch files"
        },
        {
          t: "code",
          lang: "python",
          file: "launch/bringup.launch.py",
          code: `import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import (DeclareLaunchArgument, IncludeLaunchDescription,
                            GroupAction)
from launch.conditions import IfCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration


def generate_launch_description():
    pkg = get_package_share_directory("mon_robot")
    lp = os.path.join(pkg, "launch")

    use_sim = LaunchConfiguration("use_sim_time")
    avec_nav = LaunchConfiguration("navigation")

    return LaunchDescription([
        DeclareLaunchArgument("use_sim_time", default_value="false"),
        DeclareLaunchArgument("navigation", default_value="true"),

        # Couche 1 : description du robot
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(
                os.path.join(lp, "description.launch.py")),
            launch_arguments={"use_sim_time": use_sim}.items()),

        # Couche 2 : matériel
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(
                os.path.join(lp, "hardware.launch.py"))),

        # Couche 3 : capteurs
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(
                os.path.join(lp, "sensors.launch.py"))),

        # Couche 4 : navigation, optionnelle
        GroupAction(
            condition=IfCondition(avec_nav),
            actions=[IncludeLaunchDescription(
                PythonLaunchDescriptionSource(
                    os.path.join(lp, "navigation.launch.py")),
                launch_arguments={"use_sim_time": use_sim}.items())]),
    ])`
        },
        {
          t: "callout",
          tone: "tip",
          title: "Une couche par responsabilité",
          text: "description, hardware, sensors, navigation. Tu peux alors lancer les trois premières couches seules pour tester les capteurs sans lancer Nav2, ce qui accélère beaucoup le débogage."
        },
        {
          t: "h",
          text: "Les règles udev"
        },
        {
          t: "callout",
          tone: "danger",
          title: "/dev/ttyUSB0 change entre deux démarrages",
          text: "Si le LiDAR est branché avant le microcontrôleur, il prend ttyUSB0. L'inverse au démarrage suivant, et le launch file envoie des commandes moteur au LiDAR. Les règles udev donnent un nom stable, dérivé du numéro de série du périphérique."
        },
        {
          t: "code",
          lang: "bash",
          code: `# Identifier le périphérique
udevadm info -a -n /dev/ttyUSB0 | grep -E "idVendor|idProduct|serial"`
        },
        {
          t: "code",
          lang: "text",
          file: "/etc/udev/rules.d/99-robot.rules",
          code: `# LiDAR RPLIDAR — CP2102
SUBSYSTEM=="tty", ATTRS{idVendor}=="10c4", ATTRS{idProduct}=="ea60", \\
  ATTRS{serial}=="0001", SYMLINK+="lidar", MODE="0666"

# Carte de base ESP32 — CH340
SUBSYSTEM=="tty", ATTRS{idVendor}=="1a86", ATTRS{idProduct}=="7523", \\
  SYMLINK+="base", MODE="0666"

# Manette
SUBSYSTEM=="input", ATTRS{name}=="*Controller*", MODE="0666"`
        },
        {
          t: "code",
          lang: "bash",
          code: `sudo udevadm control --reload-rules
sudo udevadm trigger

ls -l /dev/lidar /dev/base
# /dev/lidar -> ttyUSB1
# /dev/base  -> ttyUSB0

# Et dans le launch file, on utilise le nom stable
# -p port:=/dev/lidar`
        },
        {
          t: "h",
          text: "Démarrage automatique"
        },
        {
          t: "code",
          lang: "text",
          file: "/etc/systemd/system/robot.service",
          code: `[Unit]
Description=Robot ROS 2 bringup
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=robot
# L'environnement n'est PAS hérité : il faut tout déclarer
Environment="ROS_DOMAIN_ID=42"
Environment="RMW_IMPLEMENTATION=rmw_fastrtps_cpp"
ExecStart=/bin/bash -c "source /opt/ros/jazzy/setup.bash && \\
  source /home/robot/ros2_ws/install/setup.bash && \\
  ros2 launch mon_robot bringup.launch.py"
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target`
        },
        {
          t: "code",
          lang: "bash",
          code: `sudo systemctl daemon-reload
sudo systemctl enable robot.service
sudo systemctl start robot.service

# Suivre les logs en direct
journalctl -u robot.service -f`
        },
        {
          t: "callout",
          tone: "warn",
          title: "systemd ne connaît pas ton ~/.bashrc",
          text: "Le service démarre dans un environnement vierge : ni ROS_DOMAIN_ID, ni les chemins ROS. Tout doit être déclaré explicitement dans le fichier de service, sinon le launch échoue avec « ros2: command not found »."
        },
        {
          t: "h",
          text: "Enregistrer pour analyser ensuite"
        },
        {
          t: "code",
          lang: "bash",
          code: `# Enregistrer les topics utiles, avec compression
ros2 bag record -o mission_\$(date +%Y%m%d_%H%M) \\
  --compression-mode file --compression-format zstd \\
  /scan /odom /tf /tf_static /cmd_vel /imu/data

# Rejouer plus tard, sur ton poste
ros2 bag play mission_20260315_1420 --clock

# Inspecter sans rejouer
ros2 bag info mission_20260315_1420`
        },
        {
          t: "callout",
          tone: "tip",
          title: "N'enregistre jamais les images brutes sans y penser",
          text: "Un rosbag qui contient /camera/image_raw remplit un disque en quelques minutes. Enregistre la version compressée, ou baisse la fréquence. Et n'oublie jamais /tf_static : sans lui, le rejeu est inexploitable puisque l'arbre des repères est incomplet."
        }
      ]
    }
  ]
};
