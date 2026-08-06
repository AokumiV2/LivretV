import type { Track } from "../types";

export const COMMUNICATION: Track = {
  slug: "communication",
  index: 2,
  title: "Communication",
  tagline: "Les quatre façons dont deux nodes se parlent",
  description:
    "Topics, services, actions et paramètres. Choisir le bon mécanisme évite des architectures bancales. Et la QoS, ce réglage discret qui fait que deux nodes ne se voient pas alors que tout semble correct.",
  color: "#1a2fff",
  lessons: [
    /* ─────────────────────────────────────────────── */
    {
      slug: "nodes",
      title: "Les nodes et le graphe",
      summary:
        "Ce qu'est un node, comment il vit et meurt, ce que fait spin(), et comment inspecter un graphe ROS 2 en fonctionnement.",
      minutes: 13,
      level: "Débutant",
      objectives: [
        "Écrire un node avec un cycle de vie propre",
        "Comprendre le rôle de spin() et des exécuteurs",
        "Inspecter un graphe avec les outils en ligne de commande"
      ],
      quiz: ["q-com-1", "q-com-2"],
      blocks: [
        {
          t: "para",
          text: "Un node est un processus qui s'annonce sur le réseau avec un nom unique. Il peut publier, s'abonner, offrir des services, exposer des paramètres. C'est l'unité de composition d'une application ROS 2 : on assemble un robot en assemblant des nodes."
        },
        {
          t: "h",
          text: "Le squelette d'un node"
        },
        {
          t: "tabs",
          tabs: [
            {
              label: "Python",
              lang: "python",
              file: "capteur_node.py",
              code: `import rclpy
from rclpy.node import Node


class CapteurNode(Node):
    def __init__(self):
        # Ce nom apparaît dans ros2 node list
        super().__init__("capteur_node")
        self.get_logger().info("Initialisation")

    def destroy_node(self):
        # Libère le matériel avant de disparaître
        self.get_logger().info("Arrêt propre")
        return super().destroy_node()


def main():
    rclpy.init()
    node = CapteurNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.try_shutdown()`
            },
            {
              label: "C++",
              lang: "cpp",
              file: "capteur_node.cpp",
              code: `#include "rclcpp/rclcpp.hpp"

class CapteurNode : public rclcpp::Node
{
public:
  CapteurNode() : Node("capteur_node")
  {
    RCLCPP_INFO(get_logger(), "Initialisation");
  }

  ~CapteurNode()
  {
    RCLCPP_INFO(get_logger(), "Arrêt propre");
  }
};

int main(int argc, char ** argv)
{
  rclcpp::init(argc, argv);
  rclcpp::spin(std::make_shared<CapteurNode>());
  rclcpp::shutdown();
  return 0;
}`
            }
          ]
        },
        {
          t: "h",
          text: "Ce que fait vraiment spin()"
        },
        {
          t: "para",
          text: "spin() est une boucle infinie qui vérifie en permanence si quelque chose est arrivé : un message sur un abonnement, un timer arrivé à échéance, une requête de service. Quand c'est le cas, elle appelle le callback correspondant. Rien ne se passe dans un node ROS 2 en dehors de cette boucle."
        },
        {
          t: "callout",
          tone: "danger",
          title: "Ne bloque jamais dans un callback",
          text: "Un exécuteur mono-thread — le comportement par défaut — traite un callback à la fois. Un time.sleep(2) dans un callback gèle le node entier pendant deux secondes : plus de messages reçus, plus de timers, plus de réponses. C'est la cause la plus fréquente de nodes qui « rament » sans raison apparente."
        },
        {
          t: "code",
          lang: "python",
          file: "À ne pas faire / à faire",
          code: `# ✗ Bloque tout le node pendant 2 secondes
def callback_scan(self, msg):
    time.sleep(2.0)
    self.traiter(msg)

# ✓ Le travail long est découpé, ou déporté dans un timer
def callback_scan(self, msg):
    self.dernier_scan = msg          # on stocke, on ne traite pas

def timer_traitement(self):          # timer à 5 Hz
    if self.dernier_scan is not None:
        self.traiter(self.dernier_scan)`
        },
        {
          t: "h",
          text: "Exécuteurs et groupes de callbacks"
        },
        {
          t: "para",
          text: "Quand un node doit vraiment faire plusieurs choses en parallèle, on remplace l'exécuteur par une version multi-thread et on place les callbacks concernés dans un groupe réentrant."
        },
        {
          t: "code",
          lang: "python",
          code: `from rclpy.executors import MultiThreadedExecutor
from rclpy.callback_groups import ReentrantCallbackGroup

class MonNode(Node):
    def __init__(self):
        super().__init__("mon_node")
        groupe = ReentrantCallbackGroup()

        self.create_subscription(
            LaserScan, "/scan", self.cb_scan, 10,
            callback_group=groupe)
        self.create_timer(0.1, self.cb_timer, callback_group=groupe)


def main():
    rclpy.init()
    node = MonNode()
    executor = MultiThreadedExecutor(num_threads=4)
    executor.add_node(node)
    executor.spin()`
        },
        {
          t: "callout",
          tone: "warn",
          title: "Le multi-thread apporte ses propres problèmes",
          text: "Deux callbacks réentrants peuvent modifier la même variable en même temps. Si tu passes en MultiThreadedExecutor, protège tes données partagées avec un verrou. Beaucoup de bugs intermittents viennent de là."
        },
        {
          t: "h",
          text: "Inspecter le graphe"
        },
        {
          t: "terminal",
          lines: [
            { cmd: "ros2 node list" },
            { out: "/capteur_node" },
            { out: "/controleur" },
            { out: "/rplidar_node" },
            { cmd: "ros2 node info /rplidar_node" },
            { out: "/rplidar_node" },
            { out: "  Subscribers:" },
            { out: "  Publishers:" },
            { out: "    /scan: sensor_msgs/msg/LaserScan" },
            { out: "    /rosout: rcl_interfaces/msg/Log" },
            { out: "  Service Servers:" },
            { out: "    /stop_motor: std_srvs/srv/Empty" },
            { out: "    /start_motor: std_srvs/srv/Empty" }
          ]
        },
        {
          t: "para",
          text: "L'outil graphique rqt_graph affiche la même information sous forme de schéma. Sur un robot réel avec quarante nodes, c'est souvent le moyen le plus rapide de repérer un topic mal nommé qui ne relie rien."
        },
        {
          t: "code",
          lang: "bash",
          code: `ros2 run rqt_graph rqt_graph`
        },
        {
          t: "h",
          text: "Nommer et remapper"
        },
        {
          t: "para",
          text: "Deux nodes ne peuvent pas porter le même nom. Pour lancer deux instances du même programme, on remappe au lancement — sans toucher au code."
        },
        {
          t: "code",
          lang: "bash",
          code: `# Deux caméras, deux instances du même node
ros2 run v4l2_camera v4l2_camera_node \\
  --ros-args -r __node:=camera_avant -r /image_raw:=/avant/image_raw

ros2 run v4l2_camera v4l2_camera_node \\
  --ros-args -r __node:=camera_arriere -r /image_raw:=/arriere/image_raw

# Ou par espace de noms, qui préfixe tout d'un coup
ros2 run v4l2_camera v4l2_camera_node --ros-args -r __ns:=/avant`
        },
        {
          t: "callout",
          tone: "tip",
          title: "L'espace de noms est plus propre que le remap topic par topic",
          text: "Sur un robot à deux bras ou une flotte de plusieurs machines, préfixe tout par un espace de noms : /robot1/scan, /robot1/cmd_vel. Un seul argument au lancement au lieu de dix remappages."
        }
      ]
    },

    /* ─────────────────────────────────────────────── */
    {
      slug: "topics",
      title: "Topics : le flux continu",
      summary:
        "Publier et s'abonner, choisir la taille de la file, et comprendre pourquoi un publisher n'a aucune idée de qui l'écoute.",
      minutes: 16,
      level: "Débutant",
      objectives: [
        "Écrire un publisher et un subscriber",
        "Choisir le bon type de message standard",
        "Diagnostiquer un topic qui ne transporte rien"
      ],
      quiz: ["q-com-3", "q-com-4", "q-com-5"],
      blocks: [
        {
          t: "para",
          text: "Le topic est le mécanisme le plus utilisé de ROS 2 : un flux de messages typés, unidirectionnel, sans accusé de réception. Un node publie, zéro ou plusieurs nodes reçoivent. Le publisher ne sait rien de ses lecteurs et ne bloque jamais."
        },
        {
          t: "diagram",
          kind: "pub-sub",
          caption: "Un publisher, un topic, plusieurs subscribers. Aucun ne connaît les autres."
        },
        {
          t: "h",
          text: "Publier"
        },
        {
          t: "tabs",
          tabs: [
            {
              label: "Python",
              lang: "python",
              file: "publisher_vitesse.py",
              code: `import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist


class PilotageSimple(Node):
    def __init__(self):
        super().__init__("pilotage_simple")
        # (type, nom du topic, profondeur de file)
        self.pub = self.create_publisher(Twist, "/cmd_vel", 10)
        self.create_timer(0.1, self.envoyer)   # 10 Hz

    def envoyer(self):
        msg = Twist()
        msg.linear.x = 0.2      # 0,2 m/s vers l'avant
        msg.angular.z = 0.5     # 0,5 rad/s vers la gauche
        self.pub.publish(msg)


def main():
    rclpy.init()
    rclpy.spin(PilotageSimple())
    rclpy.shutdown()`
            },
            {
              label: "C++",
              lang: "cpp",
              file: "publisher_vitesse.cpp",
              code: `#include "rclcpp/rclcpp.hpp"
#include "geometry_msgs/msg/twist.hpp"

using namespace std::chrono_literals;

class PilotageSimple : public rclcpp::Node
{
public:
  PilotageSimple() : Node("pilotage_simple")
  {
    pub_ = create_publisher<geometry_msgs::msg::Twist>("/cmd_vel", 10);
    timer_ = create_wall_timer(
      100ms, std::bind(&PilotageSimple::envoyer, this));
  }

private:
  void envoyer()
  {
    auto msg = geometry_msgs::msg::Twist();
    msg.linear.x = 0.2;
    msg.angular.z = 0.5;
    pub_->publish(msg);
  }

  rclcpp::Publisher<geometry_msgs::msg::Twist>::SharedPtr pub_;
  rclcpp::TimerBase::SharedPtr timer_;
};`
            }
          ]
        },
        {
          t: "h",
          text: "S'abonner"
        },
        {
          t: "code",
          lang: "python",
          file: "subscriber_scan.py",
          code: `import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan


class SurveillanceObstacle(Node):
    def __init__(self):
        super().__init__("surveillance_obstacle")
        self.create_subscription(
            LaserScan, "/scan", self.on_scan, 10)

    def on_scan(self, msg: LaserScan):
        # Les rayons invalides valent inf ou nan : il faut les filtrer
        valides = [r for r in msg.ranges
                   if msg.range_min < r < msg.range_max]
        if not valides:
            return
        plus_proche = min(valides)
        if plus_proche < 0.4:
            self.get_logger().warn(
                f"Obstacle à {plus_proche:.2f} m")`
        },
        {
          t: "callout",
          tone: "warn",
          title: "Les valeurs infinies dans un LaserScan",
          text: "Un rayon qui ne touche rien vaut inf, et un rayon invalide vaut nan. Appeler min(msg.ranges) sans filtrer donne nan, qui contamine ensuite tous tes calculs sans lever d'erreur. Filtre toujours sur range_min et range_max."
        },
        {
          t: "h",
          text: "Les types de messages à connaître"
        },
        {
          t: "table",
          head: ["Message", "Usage", "Topic conventionnel"],
          rows: [
            ["geometry_msgs/Twist", "Consigne de vitesse", "/cmd_vel"],
            ["nav_msgs/Odometry", "Position estimée et vitesse", "/odom"],
            ["sensor_msgs/LaserScan", "Télémétrie laser 2D", "/scan"],
            ["sensor_msgs/PointCloud2", "Nuage de points 3D", "/points"],
            ["sensor_msgs/Imu", "Orientation et accélérations", "/imu/data"],
            ["sensor_msgs/Image", "Image brute", "/camera/image_raw"],
            ["sensor_msgs/JointState", "État des articulations", "/joint_states"],
            ["sensor_msgs/BatteryState", "Niveau de batterie", "/battery_state"],
            ["tf2_msgs/TFMessage", "Transformations entre repères", "/tf"]
          ]
        },
        {
          t: "callout",
          tone: "tip",
          title: "Respecte les noms conventionnels",
          text: "Publier tes commandes de vitesse sur /commande_moteur plutôt que /cmd_vel fonctionne, mais Nav2, teleop_twist_keyboard et tous les outils standards ne trouveront rien. Les conventions sont ce qui rend l'écosystème utilisable."
        },
        {
          t: "h",
          text: "La profondeur de file"
        },
        {
          t: "para",
          text: "Le nombre 10 dans create_publisher n'est pas décoratif : c'est le nombre de messages conservés en attente si le destinataire n'arrive pas à suivre. Au-delà, les plus anciens sont jetés."
        },
        {
          t: "table",
          head: ["Profondeur", "Quand l'utiliser"],
          rows: [
            ["1", "Données de capteur où seule la dernière valeur compte : scan, image, odométrie"],
            ["10", "Valeur par défaut raisonnable pour presque tout"],
            ["100+", "Journalisation, transformations, données qu'on ne veut pas perdre"]
          ]
        },
        {
          t: "callout",
          tone: "info",
          title: "Une grande file n'est pas une bonne file",
          text: "Sur un flux de caméra, une profondeur de 100 signifie que ton algorithme traitera des images vieilles de plusieurs secondes. Pour un capteur, une profondeur de 1 avec la politique « garder le dernier » est presque toujours le bon choix."
        },
        {
          t: "h",
          text: "Déboguer un topic muet"
        },
        {
          t: "terminal",
          lines: [
            { cmd: "ros2 topic list" },
            { out: "/cmd_vel" },
            { out: "/scan" },
            { out: "/odom" },
            { cmd: "ros2 topic info /scan --verbose" },
            { out: "Type: sensor_msgs/msg/LaserScan" },
            { out: "Publisher count: 1" },
            { out: "Subscription count: 0    ← personne n'écoute" },
            { cmd: "ros2 topic hz /scan" },
            { out: "average rate: 9.987  min: 0.098s max: 0.103s std dev: 0.0012s" },
            { cmd: "ros2 topic echo /scan --once" },
            { out: "header:" },
            { out: "  stamp: {sec: 1735142401, nanosec: 115000000}" },
            { out: "  frame_id: laser_frame" },
            { out: "angle_min: -3.14159" },
            { out: "range_max: 12.0" }
          ]
        },
        {
          t: "callout",
          tone: "danger",
          title: "La liste de contrôle du topic qui ne transporte rien",
          text: "1) Le nom est-il exactement le même des deux côtés, slash compris ? 2) Le type de message est-il identique ? 3) Les QoS sont-elles compatibles ? 4) Les deux nodes ont-ils le même ROS_DOMAIN_ID ? 5) ROS_LOCALHOST_ONLY est-il actif alors que tu es en multi-machines ? Ces cinq points couvrent la quasi-totalité des cas."
        },
        {
          t: "h",
          text: "Publier depuis le terminal"
        },
        {
          t: "code",
          lang: "bash",
          code: `# Envoyer une commande de vitesse une seule fois
ros2 topic pub --once /cmd_vel geometry_msgs/msg/Twist \\
  "{linear: {x: 0.2}, angular: {z: 0.0}}"

# En continu à 10 Hz — utile pour tester une base roulante
ros2 topic pub -r 10 /cmd_vel geometry_msgs/msg/Twist \\
  "{linear: {x: 0.1}}"

# Arrêt d'urgence
ros2 topic pub --once /cmd_vel geometry_msgs/msg/Twist "{}"`
        },
        {
          t: "callout",
          tone: "tip",
          title: "Le premier test d'une base roulante",
          text: "Avant d'écrire quoi que ce soit, mets le robot sur cales et envoie un Twist en ligne de commande. Si les roues tournent dans le bon sens à la bonne vitesse, la moitié du travail bas niveau est validée."
        }
      ]
    },

    /* ─────────────────────────────────────────────── */
    {
      slug: "services",
      title: "Services : question et réponse",
      summary:
        "Quand une commande doit être acquittée. Le client asynchrone, et pourquoi appeler un service de façon bloquante gèle ton node.",
      minutes: 14,
      level: "Intermédiaire",
      objectives: [
        "Créer un serveur et un client de service",
        "Choisir entre topic et service à bon escient",
        "Éviter l'interblocage du client synchrone"
      ],
      quiz: ["q-com-6", "q-com-7"],
      blocks: [
        {
          t: "para",
          text: "Un service est un appel de fonction à distance : le client envoie une requête, attend, reçoit une réponse. À utiliser quand une action doit être confirmée et qu'elle est ponctuelle et brève : réinitialiser l'odométrie, activer un moteur, sauvegarder une carte."
        },
        {
          t: "diagram",
          kind: "service",
          caption: "Le client bloque jusqu'à la réponse — d'où la nécessité de la version asynchrone."
        },
        {
          t: "h",
          text: "Topic ou service ?"
        },
        {
          t: "table",
          head: ["", "Topic", "Service"],
          rows: [
            ["Sens", "Unidirectionnel", "Aller-retour"],
            ["Fréquence", "Continu", "Ponctuel"],
            ["Réponse", "Aucune", "Garantie"],
            ["Destinataires", "Plusieurs possibles", "Un seul serveur"],
            ["Exemple type", "Données de capteur, consignes de vitesse", "Réinitialiser, calibrer, activer"]
          ]
        },
        {
          t: "callout",
          tone: "warn",
          title: "Un service ne doit jamais durer",
          text: "Si l'opération prend plus d'une seconde — planifier un chemin, parcourir une pièce, saisir un objet — c'est une action qu'il te faut, pas un service. Un service long bloque le client et n'offre aucun moyen d'annuler."
        },
        {
          t: "h",
          text: "Définir un service personnalisé"
        },
        {
          t: "code",
          lang: "text",
          file: "srv/ReglerVitesseMax.srv",
          code: `# Requête
float64 vitesse_lineaire_max     # m/s
float64 vitesse_angulaire_max    # rad/s
---
# Réponse
bool succes
string message`
        },
        {
          t: "code",
          lang: "text",
          file: "CMakeLists.txt (paquet d'interfaces)",
          code: `find_package(rosidl_default_generators REQUIRED)

rosidl_generate_interfaces(\${PROJECT_NAME}
  "srv/ReglerVitesseMax.srv"
)

ament_export_dependencies(rosidl_default_runtime)`
        },
        {
          t: "callout",
          tone: "danger",
          title: "Les interfaces vivent dans un paquet ament_cmake séparé",
          text: "On ne peut pas générer de messages ou de services depuis un paquet ament_python. La convention est de créer un paquet dédié, par exemple mon_robot_interfaces, en ament_cmake, et d'en dépendre depuis les paquets Python."
        },
        {
          t: "h",
          text: "Le serveur"
        },
        {
          t: "code",
          lang: "python",
          file: "serveur_vitesse.py",
          code: `import rclpy
from rclpy.node import Node
from mon_robot_interfaces.srv import ReglerVitesseMax


class ServeurVitesse(Node):
    def __init__(self):
        super().__init__("serveur_vitesse")
        self.v_max = 0.5
        self.w_max = 1.0
        self.srv = self.create_service(
            ReglerVitesseMax, "/regler_vitesse_max", self.on_requete)

    def on_requete(self, req, res):
        if req.vitesse_lineaire_max > 2.0:
            res.succes = False
            res.message = "Refusé : au-delà de la limite matérielle de 2 m/s"
            return res

        self.v_max = req.vitesse_lineaire_max
        self.w_max = req.vitesse_angulaire_max
        res.succes = True
        res.message = f"Limites réglées à {self.v_max} m/s et {self.w_max} rad/s"
        self.get_logger().info(res.message)
        return res`
        },
        {
          t: "h",
          text: "Le client, et le piège du blocage"
        },
        {
          t: "callout",
          tone: "danger",
          title: "call() dans un callback provoque un interblocage",
          text: "L'appel synchrone attend la réponse. Mais la réponse ne peut arriver que si spin() tourne. Si tu appelles depuis un callback, spin() est déjà occupé à exécuter ce callback : il ne traitera jamais la réponse et le node se fige définitivement. Utilise toujours call_async."
        },
        {
          t: "code",
          lang: "python",
          file: "client_vitesse.py",
          code: `import rclpy
from rclpy.node import Node
from mon_robot_interfaces.srv import ReglerVitesseMax


class ClientVitesse(Node):
    def __init__(self):
        super().__init__("client_vitesse")
        self.cli = self.create_client(
            ReglerVitesseMax, "/regler_vitesse_max")

        while not self.cli.wait_for_service(timeout_sec=1.0):
            self.get_logger().info("Service indisponible, j'attends…")

    def demander(self, v, w):
        req = ReglerVitesseMax.Request()
        req.vitesse_lineaire_max = v
        req.vitesse_angulaire_max = w

        # ✓ Asynchrone : on rend la main immédiatement
        future = self.cli.call_async(req)
        future.add_done_callback(self.on_reponse)

    def on_reponse(self, future):
        res = future.result()
        if res.succes:
            self.get_logger().info(f"OK — {res.message}")
        else:
            self.get_logger().error(f"Échec — {res.message}")`
        },
        {
          t: "h",
          text: "Appeler un service depuis le terminal"
        },
        {
          t: "terminal",
          lines: [
            { cmd: "ros2 service list" },
            { out: "/regler_vitesse_max" },
            { out: "/rplidar_node/stop_motor" },
            { cmd: "ros2 service type /regler_vitesse_max" },
            { out: "mon_robot_interfaces/srv/ReglerVitesseMax" },
            {
              cmd: 'ros2 service call /regler_vitesse_max mon_robot_interfaces/srv/ReglerVitesseMax "{vitesse_lineaire_max: 0.8, vitesse_angulaire_max: 1.5}"'
            },
            { out: "requester: making request..." },
            { out: "response:" },
            { out: "mon_robot_interfaces.srv.ReglerVitesseMax_Response(succes=True, message='Limites réglées à 0.8 m/s et 1.5 rad/s')" }
          ]
        },
        {
          t: "h",
          text: "Les services standards à réutiliser"
        },
        {
          t: "table",
          head: ["Service", "Requête", "Usage"],
          rows: [
            ["std_srvs/Empty", "rien", "Déclencher une action simple"],
            ["std_srvs/Trigger", "rien", "Déclencher, avec succès + message en retour"],
            ["std_srvs/SetBool", "bool", "Activer ou désactiver"],
            ["nav2_msgs/SaveMap", "chemin", "Enregistrer la carte construite"]
          ]
        },
        {
          t: "callout",
          tone: "tip",
          title: "Trigger avant d'inventer un service maison",
          text: "std_srvs/Trigger couvre la plupart des besoins : pas de paramètre en entrée, un booléen et un message en sortie. Utilise-le tant qu'un service personnalisé n'est pas indispensable, cela t'évite un paquet d'interfaces."
        }
      ]
    },

    /* ─────────────────────────────────────────────── */
    {
      slug: "actions",
      title: "Actions : les tâches longues",
      summary:
        "Le mécanisme pour tout ce qui prend du temps : retour d'avancement, annulation, résultat final. C'est ce qu'utilise Nav2.",
      minutes: 16,
      level: "Intermédiaire",
      objectives: [
        "Comprendre les trois canaux d'une action",
        "Écrire un serveur d'action annulable",
        "Envoyer un objectif de navigation à Nav2"
      ],
      quiz: ["q-com-8", "q-com-9"],
      blocks: [
        {
          t: "para",
          text: "Une action combine trois choses : un objectif envoyé par le client, un flux de retours d'avancement, et un résultat final. Elle est annulable à tout moment. C'est le mécanisme de « va à ce point », « saisis cet objet », « explore cette pièce »."
        },
        {
          t: "diagram",
          kind: "action",
          caption: "Objectif, retours périodiques, résultat. Et la possibilité d'annuler en cours de route."
        },
        {
          t: "h",
          text: "Le fichier de définition"
        },
        {
          t: "code",
          lang: "text",
          file: "action/Tourner.action",
          code: `# Objectif — ce que le client demande
float64 angle_cible      # radians
float64 vitesse          # rad/s
---
# Résultat — ce qu'il reçoit à la fin
bool atteint
float64 angle_final
float64 duree_s
---
# Retour — envoyé périodiquement pendant l'exécution
float64 angle_parcouru
float64 pourcentage`
        },
        {
          t: "h",
          text: "Le serveur"
        },
        {
          t: "code",
          lang: "python",
          file: "serveur_tourner.py",
          code: `import time
import rclpy
from rclpy.node import Node
from rclpy.action import ActionServer, CancelResponse, GoalResponse
from rclpy.callback_groups import ReentrantCallbackGroup
from geometry_msgs.msg import Twist
from mon_robot_interfaces.action import Tourner


class ServeurTourner(Node):
    def __init__(self):
        super().__init__("serveur_tourner")
        self.pub = self.create_publisher(Twist, "/cmd_vel", 10)
        self.action_server = ActionServer(
            self, Tourner, "tourner",
            execute_callback=self.executer,
            goal_callback=self.accepter,
            cancel_callback=self.annuler,
            callback_group=ReentrantCallbackGroup())

    def accepter(self, goal_request):
        if abs(goal_request.angle_cible) > 6.29:
            self.get_logger().warn("Objectif refusé : plus d'un tour")
            return GoalResponse.REJECT
        return GoalResponse.ACCEPT

    def annuler(self, goal_handle):
        # On accepte toujours l'annulation : c'est une question de sécurité
        return CancelResponse.ACCEPT

    def executer(self, goal_handle):
        cible = goal_handle.request.angle_cible
        vitesse = goal_handle.request.vitesse
        parcouru = 0.0
        dt = 0.05
        debut = time.time()

        retour = Tourner.Feedback()
        twist = Twist()

        while abs(parcouru) < abs(cible):
            # Vérifier l'annulation à CHAQUE itération
            if goal_handle.is_cancel_requested:
                self.pub.publish(Twist())      # arrêt immédiat
                goal_handle.canceled()
                self.get_logger().info("Rotation annulée")
                res = Tourner.Result()
                res.atteint = False
                res.angle_final = parcouru
                return res

            twist.angular.z = vitesse if cible > 0 else -vitesse
            self.pub.publish(twist)
            parcouru += twist.angular.z * dt

            retour.angle_parcouru = parcouru
            retour.pourcentage = min(100.0, abs(parcouru / cible) * 100.0)
            goal_handle.publish_feedback(retour)

            time.sleep(dt)

        self.pub.publish(Twist())              # on s'arrête
        goal_handle.succeed()

        res = Tourner.Result()
        res.atteint = True
        res.angle_final = parcouru
        res.duree_s = time.time() - debut
        return res`
        },
        {
          t: "callout",
          tone: "danger",
          title: "Publie toujours un Twist vide en sortant",
          text: "Que l'action réussisse, échoue ou soit annulée, la dernière chose à faire est d'envoyer une consigne de vitesse nulle. Sans cela, le robot continue à tourner après la fin de l'action. C'est le genre de détail qui se remarque quand le robot part contre un mur."
        },
        {
          t: "h",
          text: "Le client"
        },
        {
          t: "code",
          lang: "python",
          file: "client_tourner.py",
          code: `from rclpy.action import ActionClient
from mon_robot_interfaces.action import Tourner


class ClientTourner(Node):
    def __init__(self):
        super().__init__("client_tourner")
        self.cli = ActionClient(self, Tourner, "tourner")

    def envoyer(self, angle, vitesse=0.5):
        self.cli.wait_for_server()
        goal = Tourner.Goal()
        goal.angle_cible = angle
        goal.vitesse = vitesse

        future = self.cli.send_goal_async(
            goal, feedback_callback=self.on_retour)
        future.add_done_callback(self.on_accepte)

    def on_retour(self, msg):
        self.get_logger().info(
            f"Avancement : {msg.feedback.pourcentage:.0f} %")

    def on_accepte(self, future):
        handle = future.result()
        if not handle.accepted:
            self.get_logger().error("Objectif refusé par le serveur")
            return
        self.goal_handle = handle
        handle.get_result_async().add_done_callback(self.on_resultat)

    def on_resultat(self, future):
        res = future.result().result
        self.get_logger().info(
            f"Terminé : atteint={res.atteint} en {res.duree_s:.1f} s")

    def stop(self):
        # Annulation depuis le client
        if hasattr(self, "goal_handle"):
            self.goal_handle.cancel_goal_async()`
        },
        {
          t: "h",
          text: "L'action que tu utiliseras vraiment : NavigateToPose"
        },
        {
          t: "para",
          text: "Nav2 expose la navigation sous forme d'action. Envoyer un objectif de déplacement, c'est exactement le code ci-dessus avec un autre type."
        },
        {
          t: "code",
          lang: "python",
          file: "aller_a.py",
          code: `from nav2_msgs.action import NavigateToPose
from geometry_msgs.msg import PoseStamped


class AllerA(Node):
    def __init__(self):
        super().__init__("aller_a")
        self.cli = ActionClient(self, NavigateToPose, "navigate_to_pose")

    def aller(self, x, y, theta_w=1.0):
        self.cli.wait_for_server()

        goal = NavigateToPose.Goal()
        goal.pose = PoseStamped()
        goal.pose.header.frame_id = "map"      # repère obligatoire
        goal.pose.header.stamp = self.get_clock().now().to_msg()
        goal.pose.pose.position.x = x
        goal.pose.pose.position.y = y
        goal.pose.pose.orientation.w = theta_w

        self.cli.send_goal_async(goal, feedback_callback=self.on_retour)

    def on_retour(self, msg):
        d = msg.feedback.distance_remaining
        self.get_logger().info(f"Reste {d:.2f} m")`
        },
        {
          t: "terminal",
          lines: [
            { cmd: "ros2 action list -t" },
            { out: "/navigate_to_pose [nav2_msgs/action/NavigateToPose]" },
            { out: "/tourner [mon_robot_interfaces/action/Tourner]" },
            {
              cmd: 'ros2 action send_goal /tourner mon_robot_interfaces/action/Tourner "{angle_cible: 3.14, vitesse: 0.5}" --feedback'
            },
            { out: "Goal accepted with ID: 8f2a1c…" },
            { out: "Feedback: pourcentage: 24.0" },
            { out: "Feedback: pourcentage: 51.0" },
            { out: "Feedback: pourcentage: 100.0" },
            { out: "Result: atteint=True, duree_s=6.3" }
          ]
        },
        {
          t: "callout",
          tone: "tip",
          title: "Comment choisir, en une phrase",
          text: "Flux continu sans réponse → topic. Opération brève avec accusé → service. Tâche longue, à suivre et à pouvoir annuler → action."
        }
      ]
    },

    /* ─────────────────────────────────────────────── */
    {
      slug: "parametres",
      title: "Paramètres et configuration",
      summary:
        "Déclarer des paramètres, les charger depuis un YAML, réagir à leur modification à chaud. Ce qui évite de recompiler pour changer un gain.",
      minutes: 12,
      level: "Intermédiaire",
      objectives: [
        "Déclarer des paramètres avec description et bornes",
        "Charger une configuration depuis un fichier YAML",
        "Modifier un paramètre en fonctionnement"
      ],
      quiz: ["q-com-10", "q-com-11"],
      blocks: [
        {
          t: "para",
          text: "Un paramètre est une valeur nommée attachée à un node, modifiable au lancement et parfois pendant l'exécution. Tout ce qui est un réglage — un gain PID, un port série, un rayon de roue — doit être un paramètre, jamais une constante dans le code."
        },
        {
          t: "h",
          text: "Déclarer proprement"
        },
        {
          t: "code",
          lang: "python",
          file: "base_roulante.py",
          code: `from rcl_interfaces.msg import ParameterDescriptor, FloatingPointRange


class BaseRoulante(Node):
    def __init__(self):
        super().__init__("base_roulante")

        # Déclaration simple
        self.declare_parameter("port_serie", "/dev/ttyUSB0")

        # Déclaration avec description et bornes — nettement mieux
        self.declare_parameter(
            "rayon_roue", 0.0325,
            ParameterDescriptor(
                description="Rayon des roues motrices, en mètres",
                floating_point_range=[
                    FloatingPointRange(from_value=0.01, to_value=0.5)
                ]))

        self.declare_parameter(
            "entraxe", 0.23,
            ParameterDescriptor(
                description="Distance entre les deux roues, en mètres"))

        self.declare_parameter("vitesse_max", 0.5)

        # Lecture
        self.port = self.get_parameter("port_serie").value
        self.rayon = self.get_parameter("rayon_roue").value
        self.entraxe = self.get_parameter("entraxe").value

        self.get_logger().info(
            f"Base configurée : rayon={self.rayon} m, entraxe={self.entraxe} m")

        # Réagir aux modifications à chaud
        self.add_on_set_parameters_callback(self.on_param_change)

    def on_param_change(self, params):
        from rcl_interfaces.msg import SetParametersResult
        for p in params:
            if p.name == "vitesse_max":
                if p.value <= 0 or p.value > 2.0:
                    return SetParametersResult(
                        successful=False,
                        reason="vitesse_max doit être entre 0 et 2 m/s")
                self.get_logger().info(f"Vitesse max → {p.value} m/s")
        return SetParametersResult(successful=True)`
        },
        {
          t: "callout",
          tone: "warn",
          title: "Un paramètre non déclaré n'existe pas",
          text: "Contrairement à ROS 1, ROS 2 exige la déclaration avant toute lecture. get_parameter sur un paramètre non déclaré lève une exception. Cette rigueur est volontaire : elle rend les paramètres découvrables avec `ros2 param list`."
        },
        {
          t: "h",
          text: "Le fichier YAML"
        },
        {
          t: "code",
          lang: "yaml",
          file: "config/base.yaml",
          code: `base_roulante:
  ros__parameters:
    port_serie: "/dev/ttyUSB0"
    rayon_roue: 0.0325
    entraxe: 0.23
    vitesse_max: 0.6
    pid:
      kp: 2.4
      ki: 0.8
      kd: 0.05

# Un joker pour appliquer à tous les nodes d'un même nom
/**:
  ros__parameters:
    use_sim_time: false`
        },
        {
          t: "callout",
          tone: "danger",
          title: "L'indentation ros__parameters n'est pas facultative",
          text: "Deux underscores, et l'imbrication exacte sous le nom du node. Un YAML mal structuré est chargé sans erreur : les paramètres gardent simplement leur valeur par défaut, silencieusement. Vérifie toujours avec `ros2 param list` après le lancement."
        },
        {
          t: "code",
          lang: "bash",
          code: `# Charger au lancement
ros2 run mon_robot base_roulante \\
  --ros-args --params-file config/base.yaml

# Ou surcharger une seule valeur
ros2 run mon_robot base_roulante \\
  --ros-args -p vitesse_max:=0.3`
        },
        {
          t: "h",
          text: "Manipuler les paramètres en marche"
        },
        {
          t: "terminal",
          lines: [
            { cmd: "ros2 param list /base_roulante" },
            { out: "  entraxe" },
            { out: "  port_serie" },
            { out: "  rayon_roue" },
            { out: "  vitesse_max" },
            { cmd: "ros2 param get /base_roulante rayon_roue" },
            { out: "Double value is: 0.0325" },
            { cmd: "ros2 param describe /base_roulante rayon_roue" },
            { out: "Parameter name: rayon_roue" },
            { out: "  Description: Rayon des roues motrices, en mètres" },
            { out: "  Range: from 0.01 to 0.5" },
            { cmd: "ros2 param set /base_roulante vitesse_max 0.35" },
            { out: "Set parameter successful" },
            { cmd: "ros2 param dump /base_roulante > config/sauvegarde.yaml" }
          ]
        },
        {
          t: "callout",
          tone: "tip",
          title: "Régler un PID sans recompiler",
          text: "Déclare kp, ki et kd en paramètres avec un callback de modification. Tu peux alors ajuster les gains avec `ros2 param set` pendant que le robot roule, puis figer le réglage trouvé avec `ros2 param dump`. Le gain de temps est considérable."
        },
        {
          t: "h",
          text: "use_sim_time, le paramètre à ne jamais oublier"
        },
        {
          t: "para",
          text: "En simulation, le temps ne vient pas de l'horloge système mais du topic /clock. Chaque node doit en être informé, sinon il horodate ses messages avec le temps réel pendant que le reste du système utilise le temps simulé — et rien ne se synchronise."
        },
        {
          t: "code",
          lang: "bash",
          code: `# En simulation, TOUS les nodes doivent avoir ce paramètre
ros2 run mon_robot base_roulante --ros-args -p use_sim_time:=true`
        },
        {
          t: "callout",
          tone: "danger",
          title: "Le symptôme d'un use_sim_time oublié",
          text: "TF2 se plaint d'extrapolation dans le futur, RViz2 affiche des transformations qui clignotent, Nav2 refuse de démarrer. Avant de chercher ailleurs, vérifie que tous les nodes, y compris RViz2, ont use_sim_time à true."
        }
      ]
    },

    /* ─────────────────────────────────────────────── */
    {
      slug: "qos-dds",
      title: "QoS : pourquoi ils ne se voient pas",
      summary:
        "La qualité de service décide si deux nodes arrivent à se connecter. Un publisher et un subscriber incompatibles s'ignorent en silence, sans le moindre message d'erreur.",
      minutes: 17,
      level: "Avancé",
      objectives: [
        "Comprendre les quatre politiques de QoS qui comptent",
        "Reconnaître une incompatibilité et la corriger",
        "Choisir le bon profil selon la nature de la donnée"
      ],
      quiz: ["q-com-12", "q-com-13", "q-com-14"],
      blocks: [
        {
          t: "para",
          text: "C'est le sujet qui fait perdre le plus de temps à ceux qui passent de ROS 1 à ROS 2. Deux nodes peuvent publier et écouter le même topic, avec le même type de message, et ne jamais échanger une seule donnée. La cause est presque toujours une QoS incompatible."
        },
        {
          t: "diagram",
          kind: "dds-discovery",
          caption: "La négociation QoS a lieu à la découverte. Si les politiques sont incompatibles, aucune connexion n'est établie."
        },
        {
          t: "h",
          text: "Les politiques qui comptent"
        },
        {
          t: "table",
          head: ["Politique", "Valeurs", "Ce que ça change"],
          rows: [
            ["Reliability", "RELIABLE / BEST_EFFORT", "Retransmettre les messages perdus, ou non"],
            ["Durability", "VOLATILE / TRANSIENT_LOCAL", "Un abonné tardif reçoit-il le dernier message publié ?"],
            ["History", "KEEP_LAST(n) / KEEP_ALL", "Combien de messages sont mis en attente"],
            ["Deadline", "durée", "Alerter si le flux s'interrompt"]
          ]
        },
        {
          t: "h",
          text: "La règle de compatibilité"
        },
        {
          t: "para",
          text: "Le principe est simple : le subscriber ne peut pas exiger plus que ce que le publisher offre. Un abonné qui demande RELIABLE ne se connectera pas à un publisher BEST_EFFORT, parce que celui-ci ne peut pas garantir ce qui est demandé. L'inverse fonctionne."
        },
        {
          t: "table",
          head: ["Publisher", "Subscriber", "Connexion"],
          rows: [
            ["RELIABLE", "RELIABLE", "✓ établie"],
            ["RELIABLE", "BEST_EFFORT", "✓ établie (l'abonné demande moins)"],
            ["BEST_EFFORT", "BEST_EFFORT", "✓ établie"],
            ["BEST_EFFORT", "RELIABLE", "✗ AUCUNE CONNEXION"],
            ["TRANSIENT_LOCAL", "VOLATILE", "✓ établie"],
            ["VOLATILE", "TRANSIENT_LOCAL", "✗ AUCUNE CONNEXION"]
          ]
        },
        {
          t: "callout",
          tone: "danger",
          title: "L'incompatibilité est silencieuse",
          text: "Aucune exception, aucun avertissement dans la console par défaut. `ros2 topic list` montre le topic, `ros2 node info` montre le publisher et le subscriber. Et rien ne passe. C'est ce silence qui rend le problème difficile à identifier la première fois."
        },
        {
          t: "h",
          text: "Le diagnostic"
        },
        {
          t: "terminal",
          lines: [
            { cmd: "ros2 topic info /scan --verbose" },
            { out: "Type: sensor_msgs/msg/LaserScan" },
            { out: "" },
            { out: "Publisher count: 1" },
            { out: "  QoS profile:" },
            { out: "    Reliability: BEST_EFFORT" },
            { out: "    Durability: VOLATILE" },
            { out: "    History: KEEP_LAST (5)" },
            { out: "" },
            { out: "Subscription count: 1" },
            { out: "  QoS profile:" },
            { out: "    Reliability: RELIABLE      ← incompatible" },
            { out: "    Durability: VOLATILE" }
          ]
        },
        {
          t: "callout",
          tone: "tip",
          title: "ros2 topic info --verbose est l'outil du diagnostic",
          text: "Dès qu'un topic ne transporte rien alors que tout semble correct, cette commande donne la réponse en deux secondes. Elle affiche les QoS des deux côtés."
        },
        {
          t: "h",
          text: "Les profils prédéfinis"
        },
        {
          t: "code",
          lang: "python",
          file: "profils_qos.py",
          code: `from rclpy.qos import (QoSProfile, QoSReliabilityPolicy,
                       QoSDurabilityPolicy, QoSHistoryPolicy,
                       qos_profile_sensor_data)

# 1. Données de capteur : rapide, on tolère la perte
#    → BEST_EFFORT, KEEP_LAST(5)
self.create_subscription(
    LaserScan, "/scan", self.on_scan, qos_profile_sensor_data)

# 2. Commandes : on ne veut rien perdre
qos_commande = QoSProfile(
    reliability=QoSReliabilityPolicy.RELIABLE,
    history=QoSHistoryPolicy.KEEP_LAST,
    depth=10)
self.create_publisher(Twist, "/cmd_vel", qos_commande)

# 3. Données latchées : disponibles pour tout abonné tardif
#    Utilisé par /map, /robot_description, /tf_static
qos_latch = QoSProfile(
    reliability=QoSReliabilityPolicy.RELIABLE,
    durability=QoSDurabilityPolicy.TRANSIENT_LOCAL,
    history=QoSHistoryPolicy.KEEP_LAST,
    depth=1)
self.create_publisher(OccupancyGrid, "/map", qos_latch)`
        },
        {
          t: "h",
          text: "Quel profil pour quelle donnée"
        },
        {
          t: "table",
          head: ["Donnée", "Reliability", "Durability", "Profondeur", "Pourquoi"],
          rows: [
            ["/scan, /image_raw", "BEST_EFFORT", "VOLATILE", "1 à 5", "Un scan perdu est remplacé 100 ms plus tard"],
            ["/cmd_vel", "RELIABLE", "VOLATILE", "10", "Un ordre d'arrêt ne doit pas se perdre"],
            ["/map", "RELIABLE", "TRANSIENT_LOCAL", "1", "RViz2 lancé après doit recevoir la carte"],
            ["/tf", "RELIABLE", "VOLATILE", "100", "Flux dense, aucune perte tolérée"],
            ["/tf_static", "RELIABLE", "TRANSIENT_LOCAL", "1", "Publié une fois, doit rester disponible"],
            ["/robot_description", "RELIABLE", "TRANSIENT_LOCAL", "1", "L'URDF est publié une seule fois au démarrage"]
          ]
        },
        {
          t: "callout",
          tone: "warn",
          title: "Le piège des capteurs qui publient en BEST_EFFORT",
          text: "La plupart des pilotes de LiDAR et de caméra utilisent qos_profile_sensor_data, donc BEST_EFFORT. Si ton subscriber utilise la valeur par défaut de create_subscription — qui est RELIABLE avec une profondeur de 10 — il ne recevra jamais rien. C'est LE piège du débutant en ROS 2."
        },
        {
          t: "h",
          text: "Deadline et Liveliness"
        },
        {
          t: "para",
          text: "Au-delà des quatre politiques principales, deux autres servent à la sûreté de fonctionnement : Deadline alerte quand un flux attendu s'interrompt, Liveliness détecte un publisher qui a cessé de vivre."
        },
        {
          t: "code",
          lang: "python",
          code: `from rclpy.qos import QoSProfile, QoSReliabilityPolicy
from rclpy.duration import Duration

# Le LiDAR doit publier au moins toutes les 200 ms
qos = QoSProfile(
    reliability=QoSReliabilityPolicy.BEST_EFFORT,
    depth=5,
    deadline=Duration(seconds=0, nanoseconds=200_000_000))

sub = self.create_subscription(LaserScan, "/scan", self.on_scan, qos)

# Averti dès que le délai est dépassé
sub.add_event_handler(
    requested_deadline_missed=lambda e: self.arret_urgence())`
        },
        {
          t: "callout",
          tone: "info",
          title: "À quoi cela sert vraiment",
          text: "Sur un robot en mouvement, perdre le LiDAR n'est pas une erreur logicielle mais un danger. Une Deadline sur /scan permet de déclencher un arrêt d'urgence automatiquement, plutôt que de continuer à naviguer sur des données périmées."
        },
        {
          t: "h",
          text: "Changer d'implémentation DDS"
        },
        {
          t: "code",
          lang: "bash",
          code: `# Fast DDS — l'implémentation par défaut
export RMW_IMPLEMENTATION=rmw_fastrtps_cpp

# Cyclone DDS — souvent plus stable en multi-machines
sudo apt install ros-jazzy-rmw-cyclonedds-cpp
export RMW_IMPLEMENTATION=rmw_cyclonedds_cpp`
        },
        {
          t: "callout",
          tone: "danger",
          title: "Toutes les machines doivent utiliser la même",
          text: "Un robot sous Fast DDS et un poste sous Cyclone DDS ne se verront pas. Vérifie RMW_IMPLEMENTATION des deux côtés avant de soupçonner le réseau — c'est une cause fréquente de graphes qui ne se rejoignent pas."
        }
      ]
    }
  ]
};
