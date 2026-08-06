import type { Track } from "../types";

export const FONDATIONS: Track = {
  slug: "fondations",
  index: 1,
  title: "Fondations",
  tagline: "Comprendre ce qu'est ROS 2 avant d'écrire du code",
  description:
    "Ce que ROS 2 est réellement, comment l'installer sans se battre avec sa machine, et comment organiser un espace de travail qui ne deviendra pas ingérable au dixième paquet.",
  color: "#5ee0ff",
  lessons: [
    /* ─────────────────────────────────────────────── */
    {
      slug: "pourquoi-ros2",
      title: "Ce qu'est ROS 2, et ce qu'il n'est pas",
      summary:
        "ROS n'est pas un système d'exploitation. C'est un middleware qui permet à des programmes séparés de se parler, plus un écosystème de composants déjà écrits.",
      minutes: 12,
      level: "Débutant",
      objectives: [
        "Distinguer ce que ROS 2 apporte de ce qu'il ne fait pas",
        "Comprendre pourquoi on découpe un robot en processus indépendants",
        "Savoir quelle distribution choisir en 2026"
      ],
      quiz: ["q-fond-1", "q-fond-2", "q-fond-3"],
      blocks: [
        {
          t: "para",
          text: "Le nom complet est Robot Operating System, et c'est trompeur. ROS 2 n'est pas un système d'exploitation : il tourne au-dessus de Linux, généralement Ubuntu. Ce qu'il apporte tient en trois choses."
        },
        {
          t: "list",
          items: [
            "Un middleware : un moyen standard pour des programmes séparés de s'échanger des données, sur la même machine ou à travers le réseau.",
            "Des conventions : des formats de messages, des repères géométriques, des unités. Quand deux bibliothèques écrites par des inconnus parlent de la même chose, elles utilisent le même mot.",
            "Un écosystème : des milliers de paquets déjà écrits pour cartographier, naviguer, piloter un bras, lire un capteur."
          ]
        },
        {
          t: "h",
          text: "Pourquoi découper en processus séparés"
        },
        {
          t: "para",
          text: "Un robot fait plusieurs choses en même temps : lire un LiDAR à 10 Hz, asservir des moteurs à 100 Hz, planifier une trajectoire toutes les secondes, répondre à un opérateur. Écrire tout cela dans un seul programme donne un objet monolithique où une erreur de lecture de capteur fait tomber l'asservissement, où changer de LiDAR impose de tout recompiler, et où deux personnes ne peuvent pas travailler en parallèle."
        },
        {
          t: "para",
          text: "ROS 2 propose l'inverse : chaque responsabilité vit dans son propre processus, appelé node. Les nodes s'échangent des messages. Si le node du LiDAR plante, l'asservissement continue. Si tu remplaces ton RPLIDAR par un LD19, tu changes un node et rien d'autre — parce que les deux publient le même type de message sur le même topic."
        },
        {
          t: "diagram",
          kind: "pub-sub",
          caption:
            "Trois nodes indépendants. Le node LiDAR ne sait pas qui l'écoute, et n'a pas besoin de le savoir."
        },
        {
          t: "callout",
          tone: "info",
          title: "C'est le découplage qui compte",
          text: "Un publisher ne connaît pas ses subscribers. Il envoie sur un topic, point. Tu peux ajouter un enregistreur, un afficheur ou un second algorithme qui écoute le même flux, sans modifier une ligne du node d'origine. C'est la propriété qui rend un robot ROS 2 modifiable."
        },
        {
          t: "h",
          text: "ROS 1 et ROS 2 : pourquoi la coupure"
        },
        {
          t: "para",
          text: "ROS 1 reposait sur un maître central, le roscore. S'il tombait, plus personne ne se découvrait. Il n'avait aucune notion de temps réel, aucune sécurité, et supportait mal le multi-machines. ROS 2 a été réécrit sur DDS, un standard de middleware industriel utilisé dans l'aéronautique et la défense. Plus de maître central : les nodes se découvrent tout seuls sur le réseau."
        },
        {
          t: "table",
          head: ["", "ROS 1", "ROS 2"],
          rows: [
            ["Découverte", "roscore central obligatoire", "Distribuée via DDS, aucun point unique de panne"],
            ["Transport", "TCPROS maison", "DDS, standard OMG"],
            ["Temps réel", "Non prévu", "Exécuteurs et QoS configurables"],
            ["Sécurité", "Aucune", "SROS 2, chiffrement et authentification"],
            ["Multi-machines", "Fragile", "Natif"],
            ["Statut", "Noetic en fin de vie depuis mai 2025", "Distribution active"]
          ]
        },
        {
          t: "callout",
          tone: "warn",
          title: "Ne commence jamais un projet neuf en ROS 1",
          text: "Noetic, la dernière distribution ROS 1, n'est plus maintenue depuis mai 2025. Les tutoriels que tu croiseras encore sur internet en parlent abondamment : vérifie toujours la date et la distribution avant de suivre un guide."
        },
        {
          t: "h",
          text: "Quelle distribution choisir"
        },
        {
          t: "para",
          text: "Une distribution ROS 2 est liée à une version précise d'Ubuntu. Ce couple n'est pas négociable : Jazzy exige Ubuntu 24.04, Humble exige Ubuntu 22.04. Installer l'un sur l'autre revient à compiler l'ensemble depuis les sources, ce qui n'est pas un projet de débutant."
        },
        {
          t: "table",
          head: ["Distribution", "Ubuntu", "Support jusqu'à", "Pour qui"],
          rows: [
            ["Jazzy Jalisco", "24.04 LTS", "Mai 2029", "Nouveau projet, matériel récent"],
            ["Humble Hawksbill", "22.04 LTS", "Mai 2027", "Jetson sous JetPack 6, projets existants"],
            ["Kilted / Rolling", "24.04", "Continue", "Développement amont, pas pour un robot en service"]
          ]
        },
        {
          t: "callout",
          tone: "tip",
          title: "Le cas Jetson",
          text: "Si ton robot embarque un Jetson, la question est tranchée d'avance : JetPack 6 est basé sur Ubuntu 22.04, donc Humble. Vérifie ce point avant de choisir ton architecture logicielle, pas après."
        },
        {
          t: "h",
          text: "Ce que ROS 2 ne fait pas"
        },
        {
          t: "list",
          items: [
            "Il ne pilote aucun moteur tout seul : il te faut toujours un driver et du code bas niveau.",
            "Il ne garantit pas le temps réel sur un Linux ordinaire. Une boucle à 1 kHz appartient à un microcontrôleur.",
            "Il ne rend pas un robot intelligent : les algorithmes restent à choisir et à régler.",
            "Il ne dispense pas de comprendre l'électronique. Un GPIO grillé ne se répare pas en Python."
          ]
        },
        {
          t: "callout",
          tone: "info",
          title: "Le vrai bénéfice",
          text: "ROS 2 t'évite de réécrire la cartographie, la planification de trajectoire, la gestion des repères et la visualisation. Ce sont des années de travail que tu récupères gratuitement. En échange, tu acceptes ses conventions."
        }
      ]
    },

    /* ─────────────────────────────────────────────── */
    {
      slug: "installer-ros2",
      title: "Installer ROS 2 sans y passer le week-end",
      summary:
        "L'installation binaire sur Ubuntu, la solution Docker quand tu n'as pas la bonne version, et le fichier de configuration qui évite les surprises sur un réseau partagé.",
      minutes: 15,
      level: "Débutant",
      objectives: [
        "Installer ROS 2 Jazzy sur Ubuntu 24.04",
        "Utiliser Docker quand la machine n'a pas la bonne version d'Ubuntu",
        "Configurer son environnement shell correctement"
      ],
      quiz: ["q-fond-4", "q-fond-5"],
      blocks: [
        {
          t: "para",
          text: "Sur Ubuntu 24.04, l'installation binaire prend cinq minutes. Sur toute autre configuration, passe directement à la section Docker : tenter de compiler ROS 2 depuis les sources sur une distribution non supportée est le meilleur moyen d'abandonner avant d'avoir commencé."
        },
        {
          t: "h",
          text: "Installation binaire sur Ubuntu 24.04"
        },
        {
          t: "code",
          lang: "bash",
          file: "install-jazzy.sh",
          code: `# 1. Activer le dépôt Universe
sudo apt install software-properties-common
sudo add-apt-repository universe

# 2. Ajouter la clé et le dépôt ROS 2
sudo apt update && sudo apt install curl -y
export ROS_APT_SOURCE_VERSION=$(curl -s \\
  https://api.github.com/repos/ros-infrastructure/ros-apt-source/releases/latest \\
  | grep -F "tag_name" | awk -F\\" '{print $4}')
curl -L -o /tmp/ros2-apt-source.deb \\
  "https://github.com/ros-infrastructure/ros-apt-source/releases/download/\\
\${ROS_APT_SOURCE_VERSION}/ros2-apt-source_\${ROS_APT_SOURCE_VERSION}.$(. /etc/os-release && echo $VERSION_CODENAME)_all.deb"
sudo apt install /tmp/ros2-apt-source.deb

# 3. Installer
sudo apt update && sudo apt upgrade -y
sudo apt install ros-jazzy-desktop -y      # avec RViz2 et les démos
# sudo apt install ros-jazzy-ros-base -y   # version sans interface, pour le robot

# 4. Outils de compilation
sudo apt install ros-dev-tools python3-colcon-common-extensions -y`
        },
        {
          t: "callout",
          tone: "tip",
          title: "desktop ou ros-base ?",
          text: "Sur ton PC de développement, prends desktop : tu as besoin de RViz2 pour voir ce qui se passe. Sur le Raspberry Pi du robot, prends ros-base : trois fois plus léger, et tu n'affiches rien dessus de toute façon."
        },
        {
          t: "h",
          text: "Sourcer l'environnement"
        },
        {
          t: "para",
          text: "Rien ne fonctionne tant que tu n'as pas chargé l'environnement ROS dans ton shell. C'est la première cause de « commande ros2 introuvable »."
        },
        {
          t: "code",
          lang: "bash",
          code: `# À faire dans chaque nouveau terminal
source /opt/ros/jazzy/setup.bash

# Ou une fois pour toutes
echo "source /opt/ros/jazzy/setup.bash" >> ~/.bashrc`
        },
        {
          t: "terminal",
          lines: [
            { cmd: "source /opt/ros/jazzy/setup.bash" },
            { cmd: "ros2 run demo_nodes_cpp talker" },
            { out: "[INFO] [1735142401.115] [talker]: Publishing: 'Hello World: 1'" },
            { out: "[INFO] [1735142402.115] [talker]: Publishing: 'Hello World: 2'" },
            { out: "[INFO] [1735142403.115] [talker]: Publishing: 'Hello World: 3'" }
          ]
        },
        {
          t: "para",
          text: "Dans un second terminal, sourcé lui aussi, lance l'écouteur. Si tu vois les messages arriver, l'installation est bonne."
        },
        {
          t: "terminal",
          lines: [
            { cmd: "ros2 run demo_nodes_py listener" },
            { out: "[INFO] [1735142403.220] [listener]: I heard: [Hello World: 3]" },
            { out: "[INFO] [1735142404.220] [listener]: I heard: [Hello World: 4]" }
          ]
        },
        {
          t: "h",
          text: "La configuration à ne pas oublier"
        },
        {
          t: "para",
          text: "Par défaut, DDS diffuse sur tout le réseau local. Dans une salle de cours ou un espace partagé, ton robot voit les nodes de tout le monde et inversement. Le domaine ROS isole les graphes : deux machines avec des domaines différents ne se voient pas."
        },
        {
          t: "code",
          lang: "bash",
          file: "~/.bashrc",
          code: `source /opt/ros/jazzy/setup.bash

# Choisis un numéro entre 0 et 101, unique dans ton réseau
export ROS_DOMAIN_ID=42

# Limite la découverte à la machine locale (utile en développement)
export ROS_LOCALHOST_ONLY=1

# Format de log plus lisible
export RCUTILS_CONSOLE_OUTPUT_FORMAT="[{severity}] [{name}]: {message}"`
        },
        {
          t: "callout",
          tone: "warn",
          title: "ROS_LOCALHOST_ONLY casse le multi-machines",
          text: "C'est parfait sur ton portable, et c'est exactement ce qui t'empêchera de voir les topics du robot depuis ton PC. Mets-le à 0 ou retire la ligne dès que tu travailles à deux machines. Cette variable est responsable d'un nombre considérable d'heures perdues."
        },
        {
          t: "h",
          text: "Docker, quand Ubuntu n'est pas la bonne version"
        },
        {
          t: "para",
          text: "Sous Windows, macOS, Fedora, ou Ubuntu 22.04 alors que tu veux Jazzy, Docker est la réponse. L'image officielle contient une installation complète et propre."
        },
        {
          t: "code",
          lang: "bash",
          code: `# Conteneur ROS 2 Jazzy avec accès au réseau de l'hôte
docker run -it --rm \\
  --network=host \\
  --ipc=host \\
  -v $HOME/ros2_ws:/ros2_ws \\
  ros:jazzy-ros-base

# Avec l'interface graphique (RViz2, Gazebo) sous Linux
xhost +local:docker
docker run -it --rm \\
  --network=host --ipc=host \\
  -e DISPLAY=$DISPLAY \\
  -v /tmp/.X11-unix:/tmp/.X11-unix \\
  -v $HOME/ros2_ws:/ros2_ws \\
  osrf/ros:jazzy-desktop`
        },
        {
          t: "callout",
          tone: "danger",
          title: "--network=host et --ipc=host ne sont pas optionnels",
          text: "Sans ces deux options, DDS ne peut pas faire sa découverte multicast et le conteneur ne voit aucun node extérieur. C'est le symptôme le plus fréquent chez ceux qui débutent avec ROS 2 dans Docker : tout semble fonctionner à l'intérieur, rien ne sort."
        },
        {
          t: "h",
          text: "Vérifier que tout est en place"
        },
        {
          t: "terminal",
          lines: [
            { cmd: "printenv | grep -i ros" },
            { out: "ROS_VERSION=2" },
            { out: "ROS_PYTHON_VERSION=3" },
            { out: "ROS_DISTRO=jazzy" },
            { out: "ROS_DOMAIN_ID=42" },
            { cmd: "ros2 doctor --report | head -20" },
            { out: "NETWORK CONFIGURATION" },
            { out: "PLATFORM INFORMATION" },
            { out: "RMW MIDDLEWARE: rmw_fastrtps_cpp" }
          ]
        },
        {
          t: "callout",
          tone: "tip",
          title: "ros2 doctor est ton premier réflexe",
          text: "Avant de chercher un bug dans ton code, lance `ros2 doctor`. Il détecte les incohérences de version, les problèmes réseau et les variables mal placées."
        }
      ]
    },

    /* ─────────────────────────────────────────────── */
    {
      slug: "workspace-colcon",
      title: "L'espace de travail et colcon",
      summary:
        "Comment ROS 2 organise le code, ce que fait vraiment colcon build, et la différence entre l'environnement système et l'environnement local qui explique la moitié des problèmes de débutant.",
      minutes: 14,
      level: "Débutant",
      objectives: [
        "Créer un espace de travail correctement structuré",
        "Comprendre la superposition des environnements (overlay)",
        "Utiliser colcon efficacement, y compris --symlink-install"
      ],
      quiz: ["q-fond-6", "q-fond-7", "q-fond-8"],
      blocks: [
        {
          t: "para",
          text: "Un espace de travail ROS 2 est un simple dossier avec un sous-dossier src. Tout le reste est généré par la compilation. Cette structure n'est pas décorative : colcon s'attend à la trouver exactement ainsi."
        },
        {
          t: "code",
          lang: "bash",
          code: `mkdir -p ~/ros2_ws/src
cd ~/ros2_ws
colcon build      # même vide, cela crée la structure`
        },
        {
          t: "code",
          lang: "text",
          file: "Structure obtenue",
          code: `~/ros2_ws/
├── src/          ← TON code. Le seul dossier que tu versionnes.
├── build/        ← fichiers intermédiaires de compilation
├── install/      ← résultat installé, c'est ce qui est sourcé
└── log/          ← journaux des compilations`
        },
        {
          t: "callout",
          tone: "tip",
          title: "Ce que tu mets dans .gitignore",
          text: "build/, install/ et log/ sont entièrement régénérables. Ne les versionne jamais : ils pèsent lourd et provoquent des conflits inutiles."
        },
        {
          t: "h",
          text: "La superposition des environnements"
        },
        {
          t: "para",
          text: "C'est le concept qui explique le plus grand nombre de comportements incompréhensibles chez les débutants. Il y a deux couches : l'installation système dans /opt/ros/jazzy, et ton espace de travail. Sourcer la seconde par-dessus la première fait que tes paquets prennent le pas sur ceux du système."
        },
        {
          t: "code",
          lang: "bash",
          code: `# 1. La couche de base (underlay)
source /opt/ros/jazzy/setup.bash

# 2. Ta couche par-dessus (overlay)
source ~/ros2_ws/install/setup.bash

# L'ordre compte : le système D'ABORD, ton workspace ENSUITE.`
        },
        {
          t: "callout",
          tone: "warn",
          title: "L'erreur classique",
          text: "Tu modifies un fichier, tu recompiles, et le comportement ne change pas. Neuf fois sur dix, tu n'as pas re-sourcé install/setup.bash dans le terminal où tu lances le node. Le shell garde l'ancien chemin en mémoire."
        },
        {
          t: "h",
          text: "colcon build en pratique"
        },
        {
          t: "code",
          lang: "bash",
          code: `cd ~/ros2_ws

# Tout compiler
colcon build

# Un seul paquet — indispensable dès que le workspace grossit
colcon build --packages-select mon_robot

# Un paquet et tout ce qui en dépend
colcon build --packages-up-to mon_robot

# Les liens symboliques : le réglage à connaître
colcon build --symlink-install

# Compilation parallèle limitée (sur Raspberry Pi, sinon la RAM explose)
colcon build --parallel-workers 2`
        },
        {
          t: "callout",
          tone: "tip",
          title: "--symlink-install change la vie en Python",
          text: "Sans cette option, colcon COPIE tes fichiers Python vers install/. Chaque modification impose une recompilation. Avec elle, il crée des liens symboliques : tu édites, tu relances, c'est tout. Utilise-la systématiquement en développement."
        },
        {
          t: "para",
          text: "Attention toutefois : --symlink-install ne dispense pas de recompiler quand tu ajoutes un nouveau fichier, quand tu modifies setup.py, ou évidemment en C++."
        },
        {
          t: "h",
          text: "Résoudre les dépendances avec rosdep"
        },
        {
          t: "para",
          text: "Chaque paquet déclare ses dépendances dans package.xml. rosdep lit ces déclarations et installe ce qui manque avec apt. C'est ce qui rend un projet reproductible sur une autre machine."
        },
        {
          t: "code",
          lang: "bash",
          code: `# Une seule fois par machine
sudo rosdep init
rosdep update

# Depuis la racine du workspace, à chaque fois que tu clones un projet
cd ~/ros2_ws
rosdep install --from-paths src --ignore-src -r -y`
        },
        {
          t: "terminal",
          lines: [
            { cmd: "rosdep install --from-paths src --ignore-src -r -y" },
            { out: "executing command [sudo -H apt-get install -y ros-jazzy-nav2-bringup]" },
            { out: "executing command [sudo -H apt-get install -y ros-jazzy-slam-toolbox]" },
            { out: "#All required rosdeps installed successfully." }
          ]
        },
        {
          t: "h",
          text: "Le script qui t'évitera des heures"
        },
        {
          t: "para",
          text: "Sourcer deux fichiers à chaque terminal devient vite pénible. Un alias règle la question."
        },
        {
          t: "code",
          lang: "bash",
          file: "~/.bashrc",
          code: `source /opt/ros/jazzy/setup.bash

# Sourcer le workspace s'il existe
if [ -f ~/ros2_ws/install/setup.bash ]; then
  source ~/ros2_ws/install/setup.bash
fi

# Raccourcis utiles
alias cb='cd ~/ros2_ws && colcon build --symlink-install && source install/setup.bash'
alias cbs='cd ~/ros2_ws && colcon build --symlink-install --packages-select'
alias ws='cd ~/ros2_ws'

export ROS_DOMAIN_ID=42`
        },
        {
          t: "callout",
          tone: "danger",
          title: "Ne compile jamais en étant dans src/",
          text: "colcon doit être lancé depuis la racine du workspace, pas depuis src/. Sinon il crée un build/ imbriqué dans src/ et le workspace devient incohérent. Si cela t'arrive : supprime les dossiers build, install et log parasites, et recommence depuis la racine."
        }
      ]
    },

    /* ─────────────────────────────────────────────── */
    {
      slug: "premier-package",
      title: "Créer son premier paquet",
      summary:
        "Un paquet Python et un paquet C++ de zéro, la structure de package.xml, l'enregistrement des points d'entrée, et pourquoi ton node n'apparaît pas dans ros2 run.",
      minutes: 18,
      level: "Débutant",
      objectives: [
        "Créer un paquet Python et un paquet C++",
        "Comprendre package.xml et setup.py",
        "Diagnostiquer l'erreur « No executable found »"
      ],
      quiz: ["q-fond-9", "q-fond-10"],
      blocks: [
        {
          t: "para",
          text: "Un paquet est l'unité de distribution de ROS 2 : un dossier avec un package.xml qui déclare son nom, sa licence et ses dépendances. Deux systèmes de compilation coexistent, ament_python pour Python et ament_cmake pour C++."
        },
        {
          t: "h",
          text: "Paquet Python"
        },
        {
          t: "code",
          lang: "bash",
          code: `cd ~/ros2_ws/src
ros2 pkg create --build-type ament_python \\
  --dependencies rclpy std_msgs geometry_msgs \\
  --license Apache-2.0 \\
  mon_robot`
        },
        {
          t: "code",
          lang: "text",
          file: "Arborescence générée",
          code: `mon_robot/
├── package.xml            ← métadonnées et dépendances
├── setup.py               ← installation Python et points d'entrée
├── setup.cfg
├── resource/mon_robot     ← fichier marqueur, ne pas supprimer
├── mon_robot/
│   └── __init__.py        ← ton code va ici
└── test/`
        },
        {
          t: "para",
          text: "Écrivons un node minimal. Il ne fait rien d'utile, mais il démarre, il apparaît dans le graphe, et il s'arrête proprement."
        },
        {
          t: "code",
          lang: "python",
          file: "mon_robot/mon_noeud.py",
          code: `import rclpy
from rclpy.node import Node


class MonNoeud(Node):
    def __init__(self):
        super().__init__("mon_noeud")
        self.compteur = 0
        # Un timer à 1 Hz : le rythme du node
        self.timer = self.create_timer(1.0, self.tic)
        self.get_logger().info("Node démarré")

    def tic(self):
        self.compteur += 1
        self.get_logger().info(f"Tic numéro {self.compteur}")


def main(args=None):
    rclpy.init(args=args)
    noeud = MonNoeud()
    try:
        rclpy.spin(noeud)
    except KeyboardInterrupt:
        pass
    finally:
        noeud.destroy_node()
        rclpy.try_shutdown()


if __name__ == "__main__":
    main()`
        },
        {
          t: "callout",
          tone: "warn",
          title: "L'étape que tout le monde oublie",
          text: "Écrire le fichier ne suffit pas. Tant que tu ne l'as pas déclaré dans les entry_points de setup.py, `ros2 run` répondra « No executable found ». C'est l'erreur numéro un du premier paquet."
        },
        {
          t: "code",
          lang: "python",
          file: "setup.py",
          code: `from setuptools import find_packages, setup

package_name = "mon_robot"

setup(
    name=package_name,
    version="0.1.0",
    packages=find_packages(exclude=["test"]),
    data_files=[
        ("share/ament_index/resource_index/packages",
         ["resource/" + package_name]),
        ("share/" + package_name, ["package.xml"]),
    ],
    install_requires=["setuptools"],
    zip_safe=True,
    maintainer="toi",
    maintainer_email="toi@exemple.fr",
    description="Premier paquet ROS 2",
    license="Apache-2.0",
    entry_points={
        "console_scripts": [
            # nom_de_commande = module:fonction
            "mon_noeud = mon_robot.mon_noeud:main",
        ],
    },
)`
        },
        {
          t: "code",
          lang: "bash",
          code: `cd ~/ros2_ws
colcon build --symlink-install --packages-select mon_robot
source install/setup.bash
ros2 run mon_robot mon_noeud`
        },
        {
          t: "terminal",
          lines: [
            { cmd: "ros2 run mon_robot mon_noeud" },
            { out: "[INFO] [1735142401.001] [mon_noeud]: Node démarré" },
            { out: "[INFO] [1735142402.005] [mon_noeud]: Tic numéro 1" },
            { out: "[INFO] [1735142403.005] [mon_noeud]: Tic numéro 2" }
          ]
        },
        {
          t: "h",
          text: "Le même node en C++"
        },
        {
          t: "code",
          lang: "bash",
          code: `cd ~/ros2_ws/src
ros2 pkg create --build-type ament_cmake \\
  --dependencies rclcpp std_msgs \\
  --license Apache-2.0 \\
  mon_robot_cpp`
        },
        {
          t: "code",
          lang: "cpp",
          file: "src/mon_noeud.cpp",
          code: `#include <chrono>
#include <memory>
#include "rclcpp/rclcpp.hpp"

using namespace std::chrono_literals;

class MonNoeud : public rclcpp::Node
{
public:
  MonNoeud() : Node("mon_noeud"), compteur_(0)
  {
    timer_ = this->create_wall_timer(
      1s, std::bind(&MonNoeud::tic, this));
    RCLCPP_INFO(this->get_logger(), "Node démarré");
  }

private:
  void tic()
  {
    compteur_++;
    RCLCPP_INFO(this->get_logger(), "Tic numéro %d", compteur_);
  }

  rclcpp::TimerBase::SharedPtr timer_;
  int compteur_;
};

int main(int argc, char ** argv)
{
  rclcpp::init(argc, argv);
  rclcpp::spin(std::make_shared<MonNoeud>());
  rclcpp::shutdown();
  return 0;
}`
        },
        {
          t: "code",
          lang: "text",
          file: "CMakeLists.txt (extrait à ajouter)",
          code: `find_package(rclcpp REQUIRED)

add_executable(mon_noeud src/mon_noeud.cpp)
ament_target_dependencies(mon_noeud rclcpp)

install(TARGETS mon_noeud
  DESTINATION lib/\${PROJECT_NAME})

ament_package()`
        },
        {
          t: "h",
          text: "Python ou C++ ?"
        },
        {
          t: "table",
          head: ["Critère", "Python", "C++"],
          rows: [
            ["Vitesse d'écriture", "Nettement plus rapide", "Plus verbeux"],
            ["Performance", "Suffisante en dessous de 100 Hz", "Nécessaire au-delà"],
            ["Traitement d'images", "À éviter en boucle serrée", "Le bon choix"],
            ["Prototypage", "Idéal", "Frein"],
            ["Nœuds composables", "Non supporté", "Supporté, gros gain de latence"]
          ]
        },
        {
          t: "callout",
          tone: "tip",
          title: "La stratégie raisonnable",
          text: "Écris tout en Python d'abord. Mesure. Réécris en C++ uniquement les nodes qui posent un problème de performance mesuré. Réécrire par principe fait perdre du temps sur un robot qui tourne à 10 Hz."
        },
        {
          t: "h",
          text: "package.xml, le fichier qui compte"
        },
        {
          t: "code",
          lang: "xml",
          file: "package.xml",
          code: `<?xml version="1.0"?>
<package format="3">
  <name>mon_robot</name>
  <version>0.1.0</version>
  <description>Pilotage de ma base roulante</description>
  <maintainer email="toi@exemple.fr">toi</maintainer>
  <license>Apache-2.0</license>

  <!-- Nécessaires à l'exécution -->
  <depend>rclpy</depend>
  <depend>std_msgs</depend>
  <depend>geometry_msgs</depend>

  <!-- Uniquement à la compilation -->
  <build_depend>ament_cmake</build_depend>

  <test_depend>ament_copyright</test_depend>
  <test_depend>ament_flake8</test_depend>

  <export>
    <build_type>ament_python</build_type>
  </export>
</package>`
        },
        {
          t: "callout",
          tone: "info",
          title: "Pourquoi ce fichier mérite ton attention",
          text: "C'est lui que rosdep lit pour installer les dépendances. Un paquet dont le package.xml est incomplet compile chez toi et échoue chez tout le monde. Ajoute la dépendance au moment où tu écris l'import, pas trois semaines plus tard."
        }
      ]
    }
  ]
};
