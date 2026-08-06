import type { Track } from "../types";

export const REPRESENTATION: Track = {
  slug: "representation",
  index: 3,
  title: "Représentation",
  tagline: "Décrire le robot et savoir où sont ses morceaux",
  description:
    "TF2 et l'arbre des repères, la description URDF, la visualisation dans RViz2 et la simulation. Sans cette couche, un capteur ne fournit que des nombres sans signification spatiale.",
  color: "#3ddc9a",
  lessons: [
    {
      slug: "tf2",
      title: "TF2 : l'arbre des repères",
      summary:
        "Chaque capteur mesure dans son propre repère. TF2 maintient les relations entre tous ces repères dans le temps et permet de convertir n'importe quel point de l'un vers l'autre.",
      minutes: 18,
      level: "Intermédiaire",
      objectives: [
        "Comprendre la hiérarchie map → odom → base_link → capteurs",
        "Publier une transformation statique et une transformation dynamique",
        "Diagnostiquer les erreurs d'extrapolation"
      ],
      quiz: ["q-rep-1", "q-rep-2", "q-rep-3"],
      blocks: [
        {
          t: "para",
          text: "Un LiDAR dit « obstacle à 2 mètres, 30 degrés ». Deux mètres depuis où ? Le capteur est monté 15 cm devant le centre du robot et 20 cm au-dessus du sol, peut-être tourné de 180°. Sans cette information, la mesure est inexploitable. TF2 est le système qui la maintient."
        },
        {
          t: "h",
          text: "La hiérarchie standard"
        },
        {
          t: "diagram",
          kind: "tf-tree",
          caption: "L'arbre des repères d'un robot mobile. Chaque repère a exactement un parent."
        },
        {
          t: "table",
          head: ["Transformation", "Publiée par", "Nature"],
          rows: [
            ["map → odom", "AMCL ou SLAM Toolbox", "Corrige la dérive, saute par moments"],
            ["odom → base_link", "Nœud d'odométrie", "Continue et lisse, mais dérive"],
            ["base_link → laser_frame", "robot_state_publisher", "Statique, définie dans l'URDF"],
            ["base_link → imu_link", "robot_state_publisher", "Statique"],
            ["base_link → wheel_left", "robot_state_publisher", "Dynamique, suit /joint_states"]
          ]
        },
        {
          t: "callout",
          tone: "info",
          title: "Pourquoi map et odom sont séparés",
          text: "odom → base_link est continue : elle ne saute jamais, ce qui est indispensable pour un asservissement. Mais elle dérive avec le glissement des roues. map → odom apporte la correction issue du recalage laser, et elle, elle saute. Séparer les deux permet d'avoir à la fois une position lisse et une position juste."
        },
        {
          t: "h",
          text: "Les règles à ne pas enfreindre"
        },
        {
          t: "list",
          ordered: true,
          items: [
            "Un repère a exactement un parent. Deux nodes qui publient la même transformation créent un arbre incohérent et TF2 alterne entre les deux valeurs.",
            "Aucun cycle : l'ensemble doit former un arbre, pas un graphe.",
            "Toute transformation est horodatée. Interroger un instant non couvert lève une erreur.",
            "Le repère racine, map ou odom, n'a pas de parent."
          ]
        },
        {
          t: "h",
          text: "Publier une transformation statique"
        },
        {
          t: "code",
          lang: "python",
          file: "tf_statique.py",
          code: `from tf2_ros import StaticTransformBroadcaster
from geometry_msgs.msg import TransformStamped


class TfStatique(Node):
    def __init__(self):
        super().__init__("tf_statique")
        self.br = StaticTransformBroadcaster(self)

        t = TransformStamped()
        t.header.stamp = self.get_clock().now().to_msg()
        t.header.frame_id = "base_link"       # parent
        t.child_frame_id = "laser_frame"      # enfant

        # Position du LiDAR par rapport au centre du robot, en mètres
        t.transform.translation.x = 0.15
        t.transform.translation.y = 0.0
        t.transform.translation.z = 0.20

        # Rotation : ici le LiDAR est monté à l'endroit
        t.transform.rotation.x = 0.0
        t.transform.rotation.y = 0.0
        t.transform.rotation.z = 0.0
        t.transform.rotation.w = 1.0

        # Une seule publication suffit : c'est du TRANSIENT_LOCAL
        self.br.sendTransform(t)`
        },
        {
          t: "code",
          lang: "bash",
          code: `# La même chose en une ligne, pour tester
ros2 run tf2_ros static_transform_publisher \\
  --x 0.15 --y 0 --z 0.20 \\
  --yaw 0 --pitch 0 --roll 0 \\
  --frame-id base_link --child-frame-id laser_frame`
        },
        {
          t: "h",
          text: "Publier une transformation dynamique"
        },
        {
          t: "code",
          lang: "python",
          file: "odom_publisher.py",
          code: `import math
from tf2_ros import TransformBroadcaster
from nav_msgs.msg import Odometry


class OdomPublisher(Node):
    def __init__(self):
        super().__init__("odom_publisher")
        self.br = TransformBroadcaster(self)
        self.pub = self.create_publisher(Odometry, "/odom", 10)
        self.x, self.y, self.theta = 0.0, 0.0, 0.0
        self.create_timer(0.05, self.publier)     # 20 Hz

    def publier(self):
        maintenant = self.get_clock().now().to_msg()

        t = TransformStamped()
        t.header.stamp = maintenant
        t.header.frame_id = "odom"
        t.child_frame_id = "base_link"
        t.transform.translation.x = self.x
        t.transform.translation.y = self.y
        t.transform.rotation.z = math.sin(self.theta / 2.0)
        t.transform.rotation.w = math.cos(self.theta / 2.0)
        self.br.sendTransform(t)

        # Publier AUSSI le message Odometry : Nav2 en a besoin
        odom = Odometry()
        odom.header.stamp = maintenant
        odom.header.frame_id = "odom"
        odom.child_frame_id = "base_link"
        odom.pose.pose.position.x = self.x
        odom.pose.pose.position.y = self.y
        odom.pose.pose.orientation = t.transform.rotation
        self.pub.publish(odom)`
        },
        {
          t: "h",
          text: "Consulter une transformation"
        },
        {
          t: "code",
          lang: "python",
          file: "lecture_tf.py",
          code: `from tf2_ros import Buffer, TransformListener
from tf2_ros import LookupException, ExtrapolationException
import tf2_geometry_msgs      # indispensable pour transformer des PointStamped


class LectureTf(Node):
    def __init__(self):
        super().__init__("lecture_tf")
        self.buffer = Buffer()
        self.listener = TransformListener(self.buffer, self)
        self.create_timer(1.0, self.lire)

    def lire(self):
        try:
            # Time() vide = "la plus récente disponible"
            tf = self.buffer.lookup_transform(
                "map", "base_link", rclpy.time.Time())
            p = tf.transform.translation
            self.get_logger().info(f"Robot en x={p.x:.2f} y={p.y:.2f}")

        except LookupException:
            self.get_logger().warn("Repère inconnu — l'arbre est incomplet")
        except ExtrapolationException:
            self.get_logger().warn("Instant hors de la fenêtre du tampon")`
        },
        {
          t: "callout",
          tone: "danger",
          title: "L'import tf2_geometry_msgs qui ne sert à rien en apparence",
          text: "Il n'est utilisé nulle part dans le code, et pourtant sans lui do_transform_point lève une exception. Cet import enregistre les fonctions de conversion pour les types geometry_msgs. C'est un piège classique en Python."
        },
        {
          t: "h",
          text: "Diagnostiquer"
        },
        {
          t: "terminal",
          lines: [
            { cmd: "ros2 run tf2_tools view_frames" },
            { out: "Listening to tf data during 5 seconds..." },
            { out: "Generating graph in frames.pdf file." },
            { cmd: "ros2 run tf2_ros tf2_echo base_link laser_frame" },
            { out: "At time 1735142401.115" },
            { out: "- Translation: [0.150, 0.000, 0.200]" },
            { out: "- Rotation: in Quaternion [0.000, 0.000, 0.000, 1.000]" },
            { cmd: "ros2 topic echo /tf_static --once" }
          ]
        },
        {
          t: "table",
          head: ["Erreur", "Cause probable", "Correction"],
          rows: [
            [
              "\"frame does not exist\"",
              "Personne ne publie ce repère",
              "Vérifier avec view_frames, contrôler le nom exact"
            ],
            [
              "\"extrapolation into the future\"",
              "Horloges désynchronisées ou use_sim_time oublié",
              "chrony entre les machines, use_sim_time partout"
            ],
            [
              "\"Lookup would require extrapolation into the past\"",
              "Le tampon TF ne remonte pas assez loin",
              "Augmenter la durée du Buffer, publier plus souvent"
            ],
            [
              "Le robot tremble dans RViz2",
              "Deux nodes publient la même transformation",
              "Chercher le doublon : un seul publieur par transformation"
            ]
          ]
        },
        {
          t: "callout",
          tone: "tip",
          title: "Toujours mesurer, jamais estimer",
          text: "Les valeurs de translation dans la TF doivent être mesurées au mètre ruban sur le robot réel. Une erreur de 3 cm sur la position du LiDAR se traduit par des murs dédoublés dans la carte SLAM. C'est la source la plus fréquente de cartes de mauvaise qualité."
        }
      ]
    },

    {
      slug: "urdf",
      title: "URDF : décrire le robot",
      summary:
        "Le fichier qui décrit les corps, les articulations et la géométrie. C'est lui qui alimente TF2, RViz2, la simulation et MoveIt.",
      minutes: 20,
      level: "Intermédiaire",
      objectives: [
        "Écrire un URDF de base roulante",
        "Utiliser xacro pour éviter la répétition",
        "Comprendre link, joint et les conventions d'axes"
      ],
      quiz: ["q-rep-4", "q-rep-5"],
      blocks: [
        {
          t: "para",
          text: "L'URDF est un fichier XML qui décrit la structure du robot : des corps rigides (link) reliés par des articulations (joint). À partir de ce seul fichier, robot_state_publisher produit toutes les transformations de l'arbre TF, RViz2 affiche le robot, et Gazebo le simule."
        },
        {
          t: "h",
          text: "Les conventions d'axes de ROS"
        },
        {
          t: "callout",
          tone: "warn",
          title: "x avant, y à gauche, z en haut",
          text: "ROS utilise un repère direct : x pointe vers l'avant du robot, y vers la gauche, z vers le haut. Les rotations suivent la règle de la main droite. Un capteur monté à l'envers doit être déclaré comme tel dans l'URDF, pas corrigé par un signe moins dans le code."
        },
        {
          t: "h",
          text: "Un URDF minimal"
        },
        {
          t: "code",
          lang: "xml",
          file: "urdf/rover.urdf",
          code: `<?xml version="1.0"?>
<robot name="rover">

  <!-- Repère de référence au sol, sous le centre du robot -->
  <link name="base_footprint"/>

  <!-- Le corps principal -->
  <link name="base_link">
    <visual>
      <geometry>
        <box size="0.30 0.22 0.08"/>
      </geometry>
      <material name="anthracite">
        <color rgba="0.15 0.15 0.18 1.0"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <box size="0.30 0.22 0.08"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="2.5"/>
      <inertia ixx="0.012" ixy="0" ixz="0"
               iyy="0.021" iyz="0" izz="0.028"/>
    </inertial>
  </link>

  <joint name="base_footprint_joint" type="fixed">
    <parent link="base_footprint"/>
    <child link="base_link"/>
    <origin xyz="0 0 0.0625"/>
  </joint>

  <!-- Roue gauche : elle tourne, donc joint continu -->
  <link name="wheel_left_link">
    <visual>
      <origin rpy="1.5708 0 0"/>
      <geometry>
        <cylinder radius="0.0325" length="0.026"/>
      </geometry>
    </visual>
  </link>

  <joint name="wheel_left_joint" type="continuous">
    <parent link="base_link"/>
    <child link="wheel_left_link"/>
    <origin xyz="0 0.115 -0.03"/>
    <axis xyz="0 1 0"/>          <!-- rotation autour de y -->
  </joint>

  <!-- Le LiDAR : fixe par rapport au corps -->
  <link name="laser_frame">
    <visual>
      <geometry>
        <cylinder radius="0.038" length="0.041"/>
      </geometry>
    </visual>
  </link>

  <joint name="laser_joint" type="fixed">
    <parent link="base_link"/>
    <child link="laser_frame"/>
    <origin xyz="0.15 0 0.20"/>  <!-- MESURÉ sur le robot réel -->
  </joint>

</robot>`
        },
        {
          t: "table",
          head: ["Type de joint", "Mouvement", "Exemple"],
          rows: [
            ["fixed", "Aucun", "Capteur vissé sur le châssis"],
            ["continuous", "Rotation sans limite", "Roue motrice"],
            ["revolute", "Rotation bornée", "Articulation de bras"],
            ["prismatic", "Translation bornée", "Axe linéaire, pince"],
            ["floating", "6 degrés de liberté", "Rare, base flottante"]
          ]
        },
        {
          t: "h",
          text: "xacro : arrêter de se répéter"
        },
        {
          t: "para",
          text: "Un robot à quatre roues décrit en URDF pur, c'est quatre fois le même bloc avec trois nombres différents. xacro ajoute des variables, des macros et des calculs."
        },
        {
          t: "code",
          lang: "xml",
          file: "urdf/rover.urdf.xacro",
          code: `<?xml version="1.0"?>
<robot name="rover" xmlns:xacro="http://www.ros.org/wiki/xacro">

  <xacro:property name="rayon_roue" value="0.0325"/>
  <xacro:property name="largeur_roue" value="0.026"/>
  <xacro:property name="entraxe" value="0.23"/>
  <xacro:property name="masse_roue" value="0.05"/>

  <!-- Macro appelée une fois par roue -->
  <xacro:macro name="roue" params="prefix cote">
    <link name="wheel_\${prefix}_link">
      <visual>
        <origin rpy="\${pi/2} 0 0"/>
        <geometry>
          <cylinder radius="\${rayon_roue}" length="\${largeur_roue}"/>
        </geometry>
      </visual>
      <collision>
        <origin rpy="\${pi/2} 0 0"/>
        <geometry>
          <cylinder radius="\${rayon_roue}" length="\${largeur_roue}"/>
        </geometry>
      </collision>
      <inertial>
        <mass value="\${masse_roue}"/>
        <inertia ixx="1e-5" ixy="0" ixz="0"
                 iyy="1e-5" iyz="0" izz="1e-5"/>
      </inertial>
    </link>

    <joint name="wheel_\${prefix}_joint" type="continuous">
      <parent link="base_link"/>
      <child link="wheel_\${prefix}_link"/>
      <origin xyz="0 \${cote * entraxe / 2} -0.03"/>
      <axis xyz="0 1 0"/>
    </joint>
  </xacro:macro>

  <!-- Deux appels au lieu de deux blocs entiers -->
  <xacro:roue prefix="left"  cote="1"/>
  <xacro:roue prefix="right" cote="-1"/>

</robot>`
        },
        {
          t: "code",
          lang: "bash",
          code: `# Voir le XML final produit par xacro
ros2 run xacro xacro urdf/rover.urdf.xacro > /tmp/rover.urdf

# Vérifier la validité
check_urdf /tmp/rover.urdf

# Générer le schéma de l'arbre
urdf_to_graphiz /tmp/rover.urdf`
        },
        {
          t: "h",
          text: "Le launch file qui publie tout"
        },
        {
          t: "code",
          lang: "python",
          file: "launch/description.launch.py",
          code: `import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch_ros.actions import Node
from launch.substitutions import Command


def generate_launch_description():
    pkg = get_package_share_directory("mon_robot")
    xacro_file = os.path.join(pkg, "urdf", "rover.urdf.xacro")

    # Command exécute xacro au lancement
    robot_description = Command(["xacro ", xacro_file])

    return LaunchDescription([
        Node(
            package="robot_state_publisher",
            executable="robot_state_publisher",
            parameters=[{
                "robot_description": robot_description,
                # Sans ce type, la chaîne est interprétée comme un booléen
                "use_sim_time": False,
            }],
        ),
        Node(
            package="joint_state_publisher_gui",
            executable="joint_state_publisher_gui",
        ),
    ])`
        },
        {
          t: "callout",
          tone: "danger",
          title: "L'espace après xacro n'est pas une coquille",
          text: "Command([\"xacro \", fichier]) — l'espace final est obligatoire, sinon la commande devient « xacro/chemin/fichier » et échoue avec un message incompréhensible. C'est une erreur qui coûte facilement une heure."
        },
        {
          t: "callout",
          tone: "tip",
          title: "Les inerties comptent uniquement en simulation",
          text: "Pour RViz2 et TF2, les balises inertial sont ignorées. Dès que tu passes à Gazebo, des inerties nulles ou incohérentes font exploser le robot au démarrage. Utilise des formules réelles, pas des valeurs au hasard."
        }
      ]
    },

    {
      slug: "rviz2",
      title: "RViz2 : voir ce que le robot voit",
      summary:
        "L'outil de visualisation central. Ce qu'il faut afficher, comment sauvegarder une configuration, et comment publier ses propres marqueurs de débogage.",
      minutes: 13,
      level: "Débutant",
      objectives: [
        "Configurer RViz2 pour un robot mobile",
        "Comprendre le rôle du Fixed Frame",
        "Publier des marqueurs pour déboguer visuellement"
      ],
      quiz: ["q-rep-6", "q-rep-7"],
      blocks: [
        {
          t: "para",
          text: "RViz2 n'est pas un simulateur : il affiche ce qui circule réellement dans le graphe ROS. Si un nuage de points n'apparaît pas, c'est que la donnée n'arrive pas ou que le repère est manquant — pas que l'affichage est cassé."
        },
        {
          t: "h",
          text: "Le Fixed Frame, le réglage qui décide de tout"
        },
        {
          t: "callout",
          tone: "danger",
          title: "\"Global Status: Error — Fixed Frame [map] does not exist\"",
          text: "C'est le message le plus vu de tous les utilisateurs de RViz2. Le Fixed Frame est le repère fixe dans lequel tout est affiché. Si tu choisis map alors qu'aucun SLAM ne tourne, ce repère n'existe pas. Bascule sur odom, ou sur base_link si tu n'as même pas d'odométrie."
        },
        {
          t: "table",
          head: ["Fixed Frame", "Quand l'utiliser"],
          rows: [
            ["base_link", "Test de capteurs, sans odométrie. Le robot reste au centre."],
            ["odom", "Robot en mouvement, sans SLAM. Le monde défile."],
            ["map", "SLAM ou AMCL en fonctionnement. La référence absolue."]
          ]
        },
        {
          t: "h",
          text: "Les affichages à ajouter"
        },
        {
          t: "table",
          head: ["Display", "Topic", "Ce qu'il montre"],
          rows: [
            ["RobotModel", "/robot_description", "Le robot en 3D depuis l'URDF"],
            ["TF", "/tf, /tf_static", "Tous les repères et leurs liens"],
            ["LaserScan", "/scan", "Les points du LiDAR"],
            ["Map", "/map", "La carte d'occupation du SLAM"],
            ["Path", "/plan", "Le chemin planifié par Nav2"],
            ["PointCloud2", "/camera/depth/points", "Le nuage de la caméra de profondeur"],
            ["Image", "/camera/image_raw", "Le flux vidéo brut"],
            ["MarkerArray", "/debug_markers", "Tes propres visualisations"]
          ]
        },
        {
          t: "callout",
          tone: "warn",
          title: "Le LaserScan qui n'apparaît pas",
          text: "Le pilote publie en BEST_EFFORT, et le display de RViz2 utilise Reliable par défaut. Ouvre la section Topic du display et passe Reliability Policy sur Best Effort. Cette manipulation résout la grande majorité des cas."
        },
        {
          t: "h",
          text: "Sauvegarder sa configuration"
        },
        {
          t: "code",
          lang: "bash",
          code: `# Après avoir tout configuré : File → Save Config As
# Range le fichier dans ton paquet
mkdir -p ~/ros2_ws/src/mon_robot/rviz
# → ~/ros2_ws/src/mon_robot/rviz/robot.rviz

# Puis lance directement avec
rviz2 -d ~/ros2_ws/src/mon_robot/rviz/robot.rviz`
        },
        {
          t: "code",
          lang: "python",
          file: "Dans un launch file",
          code: `Node(
    package="rviz2",
    executable="rviz2",
    arguments=["-d", os.path.join(pkg, "rviz", "robot.rviz")],
    parameters=[{"use_sim_time": use_sim_time}],
)`
        },
        {
          t: "h",
          text: "Publier ses propres marqueurs"
        },
        {
          t: "para",
          text: "Quand un algorithme se comporte mal, afficher son état interne dans RViz2 est souvent plus efficace que des dizaines de lignes de log."
        },
        {
          t: "code",
          lang: "python",
          file: "marqueurs_debug.py",
          code: `from visualization_msgs.msg import Marker, MarkerArray
from geometry_msgs.msg import Point


class MarqueursDebug(Node):
    def __init__(self):
        super().__init__("marqueurs_debug")
        self.pub = self.create_publisher(
            MarkerArray, "/debug_markers", 10)

    def montrer_obstacles(self, points):
        tableau = MarkerArray()

        for i, (x, y) in enumerate(points):
            m = Marker()
            m.header.frame_id = "base_link"
            m.header.stamp = self.get_clock().now().to_msg()
            m.ns = "obstacles"
            m.id = i                      # unique, sinon les marqueurs s'écrasent
            m.type = Marker.SPHERE
            m.action = Marker.ADD
            m.pose.position.x = x
            m.pose.position.y = y
            m.pose.position.z = 0.1
            m.pose.orientation.w = 1.0
            m.scale.x = m.scale.y = m.scale.z = 0.08
            m.color.r, m.color.g, m.color.b, m.color.a = 1.0, 0.3, 0.36, 0.9
            # Sans durée de vie, les anciens marqueurs restent affichés
            m.lifetime.sec = 1
            tableau.markers.append(m)

        self.pub.publish(tableau)`
        },
        {
          t: "callout",
          tone: "tip",
          title: "Deux détails qui font perdre du temps",
          text: "Un marqueur avec alpha à 0 est invisible : renseigne toujours color.a. Et un quaternion tout à zéro est invalide : mets orientation.w à 1.0, même pour une sphère où l'orientation n'a pas de sens."
        },
        {
          t: "h",
          text: "Les outils interactifs"
        },
        {
          t: "list",
          items: [
            "2D Pose Estimate : indique à AMCL où se trouve le robot au démarrage. Publie sur /initialpose.",
            "2D Goal Pose : envoie un objectif de navigation à Nav2. Publie sur /goal_pose.",
            "Publish Point : publie un point cliqué sur /clicked_point, pratique pour mesurer.",
            "Measure : mesure une distance directement dans la scène."
          ]
        }
      ]
    },

    {
      slug: "simulation",
      title: "Simuler avant de casser du matériel",
      summary:
        "Gazebo et l'alternative légère. Comment tester Nav2 sans robot, et pourquoi ce qui marche en simulation ne marche pas toujours en vrai.",
      minutes: 15,
      level: "Intermédiaire",
      objectives: [
        "Lancer un robot URDF dans Gazebo",
        "Comprendre le rôle de use_sim_time et du topic /clock",
        "Connaître les limites de la simulation"
      ],
      quiz: ["q-rep-8", "q-rep-9"],
      blocks: [
        {
          t: "para",
          text: "Un algorithme de navigation qui envoie le robot dans un mur coûte cher en vrai. En simulation, on relance. C'est la raison d'être de Gazebo : tester la logique avant de risquer le matériel."
        },
        {
          t: "h",
          text: "Installer"
        },
        {
          t: "code",
          lang: "bash",
          code: `# Gazebo Harmonic, la version associée à Jazzy
sudo apt install ros-jazzy-ros-gz

# Vérifier
gz sim --version`
        },
        {
          t: "callout",
          tone: "warn",
          title: "Gazebo Classic est mort",
          text: "L'ancien Gazebo (gazebo11, commandes gazebo_ros) est en fin de vie depuis janvier 2025. Les tutoriels qui utilisent gazebo_ros_pkgs et les balises <gazebo> historiques ne s'appliquent plus. Le nouveau s'appelle simplement Gazebo, avec la commande gz."
        },
        {
          t: "h",
          text: "Ajouter les plugins de simulation à l'URDF"
        },
        {
          t: "code",
          lang: "xml",
          file: "urdf/rover.gazebo.xacro",
          code: `<?xml version="1.0"?>
<robot xmlns:xacro="http://www.ros.org/wiki/xacro">

  <!-- Contrôleur de base différentielle -->
  <gazebo>
    <plugin filename="gz-sim-diff-drive-system"
            name="gz::sim::systems::DiffDrive">
      <left_joint>wheel_left_joint</left_joint>
      <right_joint>wheel_right_joint</right_joint>
      <wheel_separation>0.23</wheel_separation>
      <wheel_radius>0.0325</wheel_radius>
      <topic>cmd_vel</topic>
      <odom_topic>odom</odom_topic>
      <frame_id>odom</frame_id>
      <child_frame_id>base_link</child_frame_id>
    </plugin>
  </gazebo>

  <!-- LiDAR simulé -->
  <gazebo reference="laser_frame">
    <sensor name="lidar" type="gpu_lidar">
      <topic>scan</topic>
      <update_rate>10</update_rate>
      <lidar>
        <scan>
          <horizontal>
            <samples>360</samples>
            <min_angle>-3.14159</min_angle>
            <max_angle>3.14159</max_angle>
          </horizontal>
        </scan>
        <range>
          <min>0.15</min>
          <max>12.0</max>
        </range>
      </lidar>
      <always_on>1</always_on>
      <visualize>true</visualize>
    </sensor>
  </gazebo>

</robot>`
        },
        {
          t: "h",
          text: "Le pont entre Gazebo et ROS 2"
        },
        {
          t: "para",
          text: "Gazebo a son propre système de transport. Un pont convertit les messages dans les deux sens — il faut le déclarer topic par topic."
        },
        {
          t: "code",
          lang: "python",
          file: "launch/simulation.launch.py",
          code: `Node(
    package="ros_gz_bridge",
    executable="parameter_bridge",
    arguments=[
        # L'horloge : dans le sens Gazebo → ROS
        "/clock@rosgraph_msgs/msg/Clock[gz.msgs.Clock",
        # Commandes : ROS → Gazebo
        "/cmd_vel@geometry_msgs/msg/Twist@gz.msgs.Twist",
        # Capteurs : Gazebo → ROS
        "/scan@sensor_msgs/msg/LaserScan[gz.msgs.LaserScan",
        "/odom@nav_msgs/msg/Odometry[gz.msgs.Odometry",
    ],
    output="screen",
)`
        },
        {
          t: "callout",
          tone: "info",
          title: "La syntaxe des flèches",
          text: "@ signifie bidirectionnel, [ signifie Gazebo vers ROS, ] signifie ROS vers Gazebo. Se tromper de direction donne un topic qui existe mais reste vide — un symptôme déroutant quand on ne connaît pas la convention."
        },
        {
          t: "h",
          text: "use_sim_time, encore"
        },
        {
          t: "code",
          lang: "bash",
          code: `# Gazebo publie le temps simulé sur /clock
# TOUS les nodes doivent l'utiliser, RViz2 compris
ros2 param set /rviz2 use_sim_time true
ros2 param set /slam_toolbox use_sim_time true`
        },
        {
          t: "callout",
          tone: "danger",
          title: "Un seul node qui l'oublie casse tout le système",
          text: "Si un node horodate avec le temps réel pendant que les autres utilisent le temps simulé, TF2 rejette les transformations pour cause d'écart temporel énorme. Le symptôme — extrapolation into the future — est le même que celui d'horloges désynchronisées, ce qui rend le diagnostic confus."
        },
        {
          t: "h",
          text: "Ce que la simulation ne reproduit pas"
        },
        {
          t: "table",
          head: ["En simulation", "En réalité"],
          rows: [
            ["Encodeurs parfaits", "Glissement, jeu mécanique, tics manqués"],
            ["LiDAR sans bruit", "Réflexions, verre invisible, poussière"],
            ["Moteurs identiques", "Chaque moteur a sa propre constante"],
            ["Latence nulle", "USB, Wi-Fi, ordonnancement Linux"],
            ["Sol parfaitement plan", "Seuils, câbles, moquette"],
            ["Batterie infinie", "La tension baisse, la vitesse aussi"]
          ]
        },
        {
          t: "callout",
          tone: "tip",
          title: "Ce que la simulation valide vraiment",
          text: "La logique : machines d'états, arbres de comportement, planification, gestion des repères. Elle ne valide jamais les réglages d'asservissement ni la robustesse des capteurs. Considère qu'un robot validé en simulation a franchi la moitié du chemin, pas la totalité."
        }
      ]
    }
  ]
};
