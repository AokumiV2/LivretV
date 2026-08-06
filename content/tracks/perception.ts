import type { Track } from "../types";

export const PERCEPTION: Track = {
  slug: "perception",
  index: 5,
  title: "Perception",
  tagline: "Images, nuages de points et fusion de capteurs",
  description:
    "Faire entrer des caméras et des LiDAR 3D dans ROS 2 sans saturer le réseau, calibrer ce qu'il faut calibrer, et combiner plusieurs capteurs en une vision cohérente.",
  color: "#ff4d5e",
  lessons: [
    {
      slug: "cameras",
      title: "Caméras et images",
      summary:
        "Publier un flux, l'étalonner, et surtout éviter d'écrouler le réseau avec des images brutes non compressées.",
      minutes: 16,
      level: "Intermédiaire",
      objectives: [
        "Publier un flux caméra dans ROS 2",
        "Étalonner une caméra et comprendre CameraInfo",
        "Utiliser image_transport pour économiser la bande passante"
      ],
      quiz: ["q-per-1", "q-per-2", "q-per-3"],
      blocks: [
        {
          t: "para",
          text: "Une caméra USB conforme UVC est reconnue par Linux sans pilote. Le passage vers ROS 2 prend une ligne de commande. La difficulté n'est pas là : elle est dans le volume de données."
        },
        {
          t: "code",
          lang: "bash",
          code: `sudo apt install ros-jazzy-v4l2-camera ros-jazzy-image-transport-plugins

ros2 run v4l2_camera v4l2_camera_node --ros-args \\
  -p video_device:=/dev/video0 \\
  -p image_size:="[640,480]" \\
  -p camera_frame_id:=camera_link`
        },
        {
          t: "callout",
          tone: "danger",
          title: "Le calcul qui devrait précéder tout choix de résolution",
          text: "Une image 1920×1080 en RGB8 pèse 6,2 Mo. À 30 images par seconde, cela fait 186 Mo/s, soit près de 1,5 Gbit/s. Aucun Wi-Fi ne tient, et même du Gigabit Ethernet sature. En 640×480 à 15 fps, on tombe à 13 Mo/s — c'est jouable."
        },
        {
          t: "h",
          text: "image_transport, la solution"
        },
        {
          t: "para",
          text: "image_transport publie automatiquement des variantes compressées à côté du topic brut. Les abonnés distants s'abonnent à la version compressée, ce qui divise le débit par vingt ou plus."
        },
        {
          t: "terminal",
          lines: [
            { cmd: "ros2 topic list | grep image" },
            { out: "/camera/image_raw" },
            { out: "/camera/image_raw/compressed" },
            { out: "/camera/image_raw/compressedDepth" },
            { out: "/camera/image_raw/theora" },
            { cmd: "ros2 topic bw /camera/image_raw" },
            { out: "13.27 MB/s from 30 messages" },
            { cmd: "ros2 topic bw /camera/image_raw/compressed" },
            { out: "0.61 MB/s from 30 messages" }
          ]
        },
        {
          t: "code",
          lang: "python",
          file: "abonnement_compresse.py",
          code: `from cv_bridge import CvBridge
from sensor_msgs.msg import CompressedImage
import cv2
import numpy as np


class VisionNode(Node):
    def __init__(self):
        super().__init__("vision")
        self.bridge = CvBridge()
        # S'abonner à la version compressée : 20x moins de réseau
        self.create_subscription(
            CompressedImage, "/camera/image_raw/compressed",
            self.on_image, 1)          # profondeur 1 : la dernière image suffit

    def on_image(self, msg: CompressedImage):
        img = self.bridge.compressed_imgmsg_to_cv2(msg, "bgr8")
        gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        self.get_logger().info(f"Image {img.shape}, moyenne {gris.mean():.0f}")`
        },
        {
          t: "callout",
          tone: "tip",
          title: "Profondeur de file 1 pour les images",
          text: "Avec une file de 10, ton algorithme traite des images vieilles de plusieurs centaines de millisecondes s'il prend du retard. Sur un robot en mouvement, réagir à une image périmée est pire que ne pas réagir. Profondeur 1, toujours."
        },
        {
          t: "h",
          text: "L'étalonnage"
        },
        {
          t: "para",
          text: "Toute lentille déforme. Sans étalonnage, un objet détecté au bord de l'image sera positionné à plusieurs centimètres de sa position réelle. Dès qu'une caméra sert à mesurer — AprilTags, triangulation, VSLAM — l'étalonnage est obligatoire."
        },
        {
          t: "code",
          lang: "bash",
          code: `sudo apt install ros-jazzy-camera-calibration

# Damier de 8x6 cases intérieures, 25 mm de côté
ros2 run camera_calibration cameracalibrator \\
  --size 8x6 --square 0.025 \\
  --ros-args -r image:=/camera/image_raw \\
             -r camera:=/camera

# Bouger le damier : bords, coins, incliné, proche, loin
# Quand les 4 barres sont vertes → CALIBRATE → SAVE
# Le résultat atterrit dans /tmp/calibrationdata.tar.gz`
        },
        {
          t: "code",
          lang: "yaml",
          file: "config/camera_info.yaml",
          code: `image_width: 640
image_height: 480
camera_name: camera
camera_matrix:
  rows: 3
  cols: 3
  data: [525.0,   0.0, 319.5,
           0.0, 525.0, 239.5,
           0.0,   0.0,   1.0]
distortion_model: plumb_bob
distortion_coefficients:
  rows: 1
  cols: 5
  data: [0.0821, -0.1587, 0.0004, -0.0009, 0.0]`
        },
        {
          t: "callout",
          tone: "warn",
          title: "Désactive l'autofocus avant d'étalonner",
          text: "L'étalonnage détermine la distance focale. Si l'autofocus la modifie ensuite, tous les paramètres deviennent faux. Verrouille la mise au point avant l'étalonnage, et n'y touche plus."
        },
        {
          t: "h",
          text: "Détecter des marqueurs AprilTag"
        },
        {
          t: "para",
          text: "Un AprilTag est un marqueur imprimé dont la pose 3D complète se déduit d'une seule image. C'est le moyen le plus simple d'obtenir une localisation absolue en intérieur, ou de repérer un objet à saisir."
        },
        {
          t: "code",
          lang: "bash",
          code: `sudo apt install ros-jazzy-apriltag-ros

ros2 run apriltag_ros apriltag_node --ros-args \\
  -r image_rect:=/camera/image_raw \\
  -r camera_info:=/camera/camera_info \\
  -p family:=36h11 \\
  -p size:=0.08          # taille RÉELLE du marqueur imprimé, en mètres`
        },
        {
          t: "callout",
          tone: "danger",
          title: "La taille du marqueur doit être exacte",
          text: "Le paramètre size est la longueur du côté noir du marqueur, mesurée sur le papier imprimé. Une imprimante qui ajuste à la page décale l'échelle : la distance estimée est alors fausse proportionnellement. Mesure au réglet ce qui est réellement sorti de l'imprimante."
        }
      ]
    },

    {
      slug: "nuages-points",
      title: "Nuages de points",
      summary:
        "PointCloud2, le filtrage indispensable, et la conversion d'une profondeur en LaserScan pour alimenter Nav2.",
      minutes: 15,
      level: "Avancé",
      objectives: [
        "Manipuler un PointCloud2",
        "Réduire le volume avec un filtre voxel",
        "Convertir une profondeur en scan 2D"
      ],
      quiz: ["q-per-4", "q-per-5"],
      blocks: [
        {
          t: "para",
          text: "Un PointCloud2 est un tableau binaire de points avec des champs déclarés dans l'en-tête. Une RealSense en 848×480 produit environ 400 000 points par image : à 30 Hz, c'est douze millions de points par seconde. Le filtrage n'est pas une optimisation, c'est une condition de fonctionnement."
        },
        {
          t: "code",
          lang: "python",
          file: "lecture_nuage.py",
          code: `import numpy as np
from sensor_msgs.msg import PointCloud2
from sensor_msgs_py import point_cloud2


class LectureNuage(Node):
    def __init__(self):
        super().__init__("lecture_nuage")
        self.create_subscription(
            PointCloud2, "/camera/depth/points", self.on_nuage, 1)

    def on_nuage(self, msg: PointCloud2):
        # skip_nans est indispensable : les points invalides sont fréquents
        points = point_cloud2.read_points_numpy(
            msg, field_names=("x", "y", "z"), skip_nans=True)

        if points.size == 0:
            return

        # Ne garder que ce qui est devant, entre 20 cm et 3 m
        devant = points[(points[:, 0] > 0.2) & (points[:, 0] < 3.0)]
        # Ignorer le sol et le plafond
        utile = devant[(devant[:, 2] > -0.1) & (devant[:, 2] < 1.5)]

        if utile.shape[0] > 0:
            self.get_logger().info(
                f"{utile.shape[0]} points utiles, "
                f"le plus proche à {utile[:, 0].min():.2f} m")`
        },
        {
          t: "h",
          text: "Filtrer avant tout traitement"
        },
        {
          t: "code",
          lang: "bash",
          code: `sudo apt install ros-jazzy-pcl-ros

# Sous-échantillonnage voxel : un point par cube de 5 cm
ros2 run pcl_ros voxel_grid_node --ros-args \\
  -r input:=/camera/depth/points \\
  -r output:=/points_filtres \\
  -p leaf_size:=0.05`
        },
        {
          t: "table",
          head: ["Filtre", "Effet", "Quand"],
          rows: [
            ["VoxelGrid", "Un point par cube — division par 10 à 50", "Toujours, en premier"],
            ["PassThrough", "Coupe selon un axe", "Retirer le sol et le plafond"],
            ["StatisticalOutlierRemoval", "Retire les points isolés", "Nettoyer le bruit du capteur"],
            ["RadiusOutlierRemoval", "Retire les points peu entourés", "Plus rapide que le précédent"]
          ]
        },
        {
          t: "callout",
          tone: "tip",
          title: "L'ordre des filtres compte",
          text: "Toujours VoxelGrid en premier : il divise le volume par vingt, et tous les filtres suivants deviennent vingt fois plus rapides. Faire l'inverse revient à nettoyer méticuleusement des données qu'on va jeter."
        },
        {
          t: "h",
          text: "Profondeur vers LaserScan"
        },
        {
          t: "para",
          text: "Nav2 sait consommer un LaserScan bien plus légèrement qu'un nuage 3D. Convertir la profondeur d'une caméra en scan 2D permet d'utiliser une caméra de profondeur comme un LiDAR, avec un coût très inférieur."
        },
        {
          t: "code",
          lang: "python",
          file: "Dans un launch file",
          code: `Node(
    package="depthimage_to_laserscan",
    executable="depthimage_to_laserscan_node",
    remappings=[
        ("depth", "/camera/depth/image_rect_raw"),
        ("depth_camera_info", "/camera/depth/camera_info"),
        ("scan", "/scan_camera"),
    ],
    parameters=[{
        "scan_height": 10,          # bande de pixels utilisée
        "range_min": 0.45,
        "range_max": 8.0,
        "output_frame": "camera_depth_frame",
    }],
)`
        },
        {
          t: "callout",
          tone: "warn",
          title: "Le champ de vision reste étroit",
          text: "Une caméra de profondeur voit environ 85° horizontalement, contre 360° pour un LiDAR. Elle ne remplace pas un LiDAR pour le SLAM : le robot devient aveugle sur les côtés et derrière. En revanche elle voit les obstacles bas et les tables, ce qu'un LiDAR à hauteur fixe rate complètement."
        },
        {
          t: "h",
          text: "Fusionner plusieurs sources dans la carte de coût"
        },
        {
          t: "code",
          lang: "yaml",
          file: "Carte de coût multi-capteurs",
          code: `local_costmap:
  local_costmap:
    ros__parameters:
      plugins: ["obstacle_layer", "voxel_layer", "inflation_layer"]

      # LiDAR 2D : la couche principale
      obstacle_layer:
        plugin: "nav2_costmap_2d::ObstacleLayer"
        observation_sources: scan
        scan:
          topic: /scan
          data_type: "LaserScan"
          marking: true
          clearing: true

      # Caméra de profondeur : voit les obstacles bas
      voxel_layer:
        plugin: "nav2_costmap_2d::VoxelLayer"
        observation_sources: pointcloud
        z_voxels: 16
        origin_z: 0.0
        z_resolution: 0.05
        pointcloud:
          topic: /points_filtres
          data_type: "PointCloud2"
          min_obstacle_height: 0.05    # ignorer le sol
          max_obstacle_height: 1.5
          marking: true
          clearing: true`
        },
        {
          t: "callout",
          tone: "danger",
          title: "min_obstacle_height mal réglé fait voir le sol comme un mur",
          text: "Si la caméra est légèrement inclinée vers le bas et que min_obstacle_height est à 0, le sol lui-même devient un obstacle. Le robot se croit encerclé et refuse de bouger. Monte le seuil à 5 cm au minimum."
        }
      ]
    },

    {
      slug: "fusion",
      title: "Fusion et synchronisation",
      summary:
        "Combiner plusieurs capteurs qui n'ont pas la même cadence ni le même horodatage, sans se tromper de repère ni de moment.",
      minutes: 14,
      level: "Avancé",
      objectives: [
        "Synchroniser deux flux avec message_filters",
        "Comprendre l'importance des horodatages",
        "Choisir quel capteur croire selon la situation"
      ],
      quiz: ["q-per-6", "q-per-7"],
      blocks: [
        {
          t: "para",
          text: "Un LiDAR tourne à 10 Hz, une caméra à 30 Hz, une IMU à 200 Hz. Traiter ensemble une image et un scan impose de choisir les deux mesures qui correspondent au même instant — pas simplement les deux dernières reçues."
        },
        {
          t: "h",
          text: "Synchroniser deux flux"
        },
        {
          t: "code",
          lang: "python",
          file: "fusion_scan_image.py",
          code: `import message_filters
from sensor_msgs.msg import Image, LaserScan


class FusionNode(Node):
    def __init__(self):
        super().__init__("fusion")

        sub_img = message_filters.Subscriber(self, Image, "/camera/image_raw")
        sub_scan = message_filters.Subscriber(self, LaserScan, "/scan")

        # ApproximateTimeSynchronizer : les horodatages sont proches,
        # jamais identiques entre deux capteurs différents
        self.sync = message_filters.ApproximateTimeSynchronizer(
            [sub_img, sub_scan],
            queue_size=10,
            slop=0.05)            # tolérance de 50 ms
        self.sync.registerCallback(self.on_paire)

    def on_paire(self, img: Image, scan: LaserScan):
        dt = abs(
            (img.header.stamp.sec - scan.header.stamp.sec)
            + (img.header.stamp.nanosec - scan.header.stamp.nanosec) * 1e-9)
        self.get_logger().info(f"Paire synchronisée, écart {dt*1000:.1f} ms")`
        },
        {
          t: "callout",
          tone: "warn",
          title: "Le slop mal choisi",
          text: "Trop petit, aucune paire ne se forme et le callback n'est jamais appelé. Trop grand, tu associes une image et un scan séparés de 200 ms — sur un robot à 0,5 m/s, cela fait 10 cm d'écart entre ce que montrent les deux capteurs. Prends la moitié de la période du capteur le plus lent."
        },
        {
          t: "h",
          text: "Les horodatages, encore"
        },
        {
          t: "code",
          lang: "python",
          code: `# ✗ Faux : horodater au moment de la publication
msg.header.stamp = self.get_clock().now().to_msg()
# Le capteur a mesuré 40 ms plus tôt. Cette erreur se propage
# dans TF2 et dans toute la chaîne de perception.

# ✓ Juste : utiliser l'instant de la mesure, si le pilote le fournit
msg.header.stamp = instant_acquisition

# ✓ À défaut, compenser la latence connue du capteur
maintenant = self.get_clock().now()
msg.header.stamp = (maintenant - Duration(seconds=0.040)).to_msg()`
        },
        {
          t: "callout",
          tone: "danger",
          title: "Le frame_id vide",
          text: "Un message sans frame_id renseigné ne peut être transformé nulle part. TF2 échoue avec un message peu explicite, et beaucoup d'outils l'affichent simplement au centre du repère fixe. Vérifie systématiquement avec `ros2 topic echo /topic --field header`."
        },
        {
          t: "h",
          text: "Quel capteur croire"
        },
        {
          t: "table",
          head: ["Situation", "Capteur fiable", "Capteur trompeur"],
          rows: [
            ["Baie vitrée", "Ultrason, caméra", "LiDAR — il traverse"],
            ["Plein soleil", "LiDAR mécanique, ultrason", "Caméra de profondeur infrarouge"],
            ["Mur blanc uniforme", "LiDAR", "Stéréo passive — aucune texture"],
            ["Obstacle bas (marche)", "Caméra de profondeur", "LiDAR 2D — il passe au-dessus"],
            ["Rotation rapide", "IMU", "Odométrie des roues — glissement"],
            ["Long couloir", "Odométrie", "SLAM — glisse le long de l'axe"]
          ]
        },
        {
          t: "callout",
          tone: "info",
          title: "La logique de la fusion",
          text: "Aucun capteur n'est bon partout. La fusion consiste à pondérer chaque source selon la confiance qu'on lui accorde dans la situation courante. C'est exactement ce que fait la matrice de covariance d'un filtre de Kalman : une déclaration formelle de « voici à quel point je crois cette mesure »."
        },
        {
          t: "h",
          text: "Les covariances, à renseigner sérieusement"
        },
        {
          t: "code",
          lang: "python",
          code: `# Matrice 6x6 aplatie : x, y, z, roll, pitch, yaw
odom.pose.covariance = [
    0.01, 0, 0, 0, 0, 0,      # x : ±10 cm d'écart-type
    0, 0.01, 0, 0, 0, 0,      # y
    0, 0, 1e6, 0, 0, 0,       # z inconnu → très grande valeur
    0, 0, 0, 1e6, 0, 0,       # roll inconnu
    0, 0, 0, 0, 1e6, 0,       # pitch inconnu
    0, 0, 0, 0, 0, 0.05,      # yaw : ±0,22 rad
]`
        },
        {
          t: "callout",
          tone: "warn",
          title: "Une covariance à zéro veut dire « certitude absolue »",
          text: "Laisser la matrice entièrement à zéro dit au filtre que la mesure est parfaite. Il ignorera alors toutes les autres sources. C'est une erreur fréquente qui rend un EKF apparemment inutile. Pour une dimension non mesurée, mets une très grande valeur comme 1e6, jamais zéro."
        }
      ]
    }
  ]
};
