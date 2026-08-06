import type { GeneratedFile } from "@/lib/forge/types";
import type { Mission, RobotSim } from "./types";

/* ══════════════════════════════════════════════════════════════
   Export du script de l'Atelier en paquet ROS 2 installable.

   Le pari de l'Atelier est que le code écrit ici tourne vraiment
   sur un robot. Autant aller au bout : ce qui sort d'ici est un
   paquet `ament_python` complet, qui se construit avec `colcon` et
   se lance avec `ros2 run`. Rien à réécrire.

   Le paquet est délibérément minimal — un nœud, un point d'entrée,
   un fichier de lancement. Pour la pile complète (URDF, Nav2, EKF,
   udev, systemd), c'est la Robot Forge qu'il faut.
   ══════════════════════════════════════════════════════════════ */

function snake(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function exporterPaquet(
  mission: Mission,
  robot: RobotSim,
  code: string
): { pkg: string; fichiers: GeneratedFile[] } {
  const pkg = `atelier_${snake(mission.id)}`;
  const nomModule = snake(mission.id) || "noeud";
  const executable = nomModule;

  const fichiers: GeneratedFile[] = [
    {
      path: `${pkg}/package.xml`,
      lang: "xml",
      content: `<?xml version="1.0"?>
<?xml-model href="http://download.ros.org/schema/package_format3.xsd" schematypens="http://www.w3.org/2001/XMLSchema"?>
<package format="3">
  <name>${pkg}</name>
  <version>0.1.0</version>
  <description>${mission.titre} — écrit dans l'Atelier de LivretV.</description>
  <maintainer email="toi@exemple.org">toi</maintainer>
  <license>MIT</license>

  <depend>rclpy</depend>
  <depend>std_msgs</depend>
  <depend>geometry_msgs</depend>
  <depend>sensor_msgs</depend>
  <depend>nav_msgs</depend>
  <depend>std_srvs</depend>

  <export>
    <build_type>ament_python</build_type>
  </export>
</package>
`
    },

    {
      path: `${pkg}/setup.py`,
      lang: "python",
      content: `from setuptools import find_packages, setup

package_name = '${pkg}'

setup(
    name=package_name,
    version='0.1.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
         ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/launch', ['launch/${nomModule}.launch.py']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='toi',
    maintainer_email='toi@exemple.org',
    description="${mission.titre.replace(/"/g, "'")}",
    license='MIT',
    entry_points={
        'console_scripts': [
            '${executable} = ${pkg}.${nomModule}:main',
        ],
    },
)
`
    },

    {
      path: `${pkg}/setup.cfg`,
      lang: "text",
      content: `[develop]
script_dir=$base/lib/${pkg}
[install]
install_scripts=$base/lib/${pkg}
`
    },

    { path: `${pkg}/resource/${pkg}`, lang: "text", content: "" },

    { path: `${pkg}/${pkg}/__init__.py`, lang: "python", content: "" },

    {
      path: `${pkg}/${pkg}/${nomModule}.py`,
      lang: "python",
      content: code.endsWith("\n") ? code : code + "\n"
    },

    {
      path: `${pkg}/launch/${nomModule}.launch.py`,
      lang: "python",
      content: `from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    return LaunchDescription([
        Node(
            package='${pkg}',
            executable='${executable}',
            name='${nomModule}',
            output='screen',
        ),
    ])
`
    },

    {
      path: `${pkg}/README.md`,
      lang: "text",
      content: `# ${pkg}

Nœud écrit dans l'Atelier de LivretV — mission ${mission.numero}, « ${mission.titre} ».
Robot visé en simulation : ${robot.nom}.

## Construire

\`\`\`bash
mkdir -p ~/ros2_ws/src && cp -r ${pkg} ~/ros2_ws/src/
cd ~/ros2_ws
colcon build --packages-select ${pkg}
source install/setup.bash
\`\`\`

## Lancer

\`\`\`bash
ros2 run ${pkg} ${executable}
# ou
ros2 launch ${pkg} ${nomModule}.launch.py
\`\`\`

## Avant de brancher un vrai robot

Trois différences avec le simulateur, à connaître :

1. **\`rclpy.spin()\` bloque pour de bon.** Dans l'Atelier elle rendait la
   main ; ici elle ne rendra la main qu'au Ctrl-C. Le fichier n'a pas
   besoin d'être modifié, mais le comportement d'exécution change.
2. **Les topics dépendent de ton robot.** \`/cmd_vel\`, \`/scan\` et \`/odom\`
   sont des conventions largement suivies, pas une garantie. Vérifie avec
   \`ros2 topic list\` et \`ros2 topic info -v <topic>\`.
3. **La QoS aussi se vérifie.** \`ros2 topic info -v /scan\` affiche les
   profils réels des publieurs. Si ton callback ne reçoit rien, c'est la
   première chose à regarder — c'était déjà la leçon de la mission 5.

Un mur simulé ne fait pas mal. Un vrai robot, si : garde l'arrêt d'urgence
à portée de main pour les premiers essais.
`
    }
  ];

  return { pkg, fichiers };
}
