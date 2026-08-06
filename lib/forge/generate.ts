import { getArchetype } from "@/content/archetypes";
import { getComponent } from "@/content/components";
import type { ForgeConfig, GeneratedFile, PreviewShape } from "./types";

/* ══════════════════════════════════════════════════════════════
   Génération d'un projet ROS 2 complet à partir d'une configuration.
   Tout est produit ici, sans template externe, pour que le résultat
   reste cohérent avec les valeurs saisies par l'utilisateur.
   ══════════════════════════════════════════════════════════════ */

const f = (n: number, d = 4) => n.toFixed(d);

/** Inertie d'un pavé plein, formule exacte — Gazebo refuse les valeurs bidon. */
function inertieBoite(m: number, x: number, y: number, z: number) {
  return {
    ixx: (m * (y * y + z * z)) / 12,
    iyy: (m * (x * x + z * z)) / 12,
    izz: (m * (x * x + y * y)) / 12
  };
}

function inertieCylindre(m: number, r: number, h: number) {
  return {
    ixx: (m * (3 * r * r + h * h)) / 12,
    iyy: (m * (3 * r * r + h * h)) / 12,
    izz: (m * r * r) / 2
  };
}

/* ─────────────── package.xml ─────────────── */

function packageXml(c: ForgeConfig): GeneratedFile {
  const deps = [
    "rclpy",
    "geometry_msgs",
    "nav_msgs",
    "sensor_msgs",
    "tf2_ros",
    "robot_state_publisher",
    "xacro",
    "joint_state_publisher"
  ];
  if (c.options.nav2) deps.push("nav2_bringup", "nav2_common");
  if (c.options.slam) deps.push("slam_toolbox");
  if (c.options.ekf) deps.push("robot_localization");
  if (c.options.gazebo) deps.push("ros_gz_sim", "ros_gz_bridge");

  return {
    path: `ros2_ws/src/${c.pkg}/package.xml`,
    lang: "xml",
    content: `<?xml version="1.0"?>
<?xml-model href="http://download.ros.org/schema/package_format3.xsd" schematypens="http://www.w3.org/2001/XMLSchema"?>
<package format="3">
  <name>${c.pkg}</name>
  <version>0.1.0</version>
  <description>Pile logicielle du robot ${c.robotName}, générée par LivretV</description>
  <maintainer email="toi@exemple.fr">toi</maintainer>
  <license>Apache-2.0</license>

  <buildtool_depend>ament_${c.langue === "python" ? "python" : "cmake"}</buildtool_depend>

${deps.map((d) => `  <depend>${d}</depend>`).join("\n")}

  <test_depend>ament_copyright</test_depend>
  <test_depend>ament_flake8</test_depend>
  <test_depend>ament_pep257</test_depend>

  <export>
    <build_type>ament_${c.langue === "python" ? "python" : "cmake"}</build_type>
  </export>
</package>
`
  };
}

/* ─────────────── setup.py ─────────────── */

function setupPy(c: ForgeConfig): GeneratedFile {
  return {
    path: `ros2_ws/src/${c.pkg}/setup.py`,
    lang: "python",
    content: `import os
from glob import glob
from setuptools import find_packages, setup

package_name = "${c.pkg}"

setup(
    name=package_name,
    version="0.1.0",
    packages=find_packages(exclude=["test"]),
    data_files=[
        ("share/ament_index/resource_index/packages",
         ["resource/" + package_name]),
        ("share/" + package_name, ["package.xml"]),
        # Les fichiers de données doivent être installés explicitement,
        # sinon ros2 launch ne les trouve pas.
        (os.path.join("share", package_name, "launch"), glob("launch/*.launch.py")),
        (os.path.join("share", package_name, "config"), glob("config/*.yaml")),
        (os.path.join("share", package_name, "urdf"), glob("urdf/*")),
        (os.path.join("share", package_name, "rviz"), glob("rviz/*.rviz")),
    ],
    install_requires=["setuptools"],
    zip_safe=True,
    maintainer="toi",
    maintainer_email="toi@exemple.fr",
    description="Pile logicielle du robot ${c.robotName}",
    license="Apache-2.0",
    entry_points={
        "console_scripts": [
            "base_controller = ${c.pkg}.base_controller:main",
            "odom_publisher = ${c.pkg}.odom_publisher:main",
            "battery_monitor = ${c.pkg}.battery_monitor:main",
        ],
    },
)
`
  };
}

/* ─────────────── URDF ─────────────── */

function urdf(c: ForgeConfig): GeneratedFile {
  const g = c.geometrie;
  const mChassis = g.masse * 0.8;
  const mRoue = 0.05;
  const iB = inertieBoite(mChassis, g.longueur, g.largeur, g.hauteur);
  const iR = inertieCylindre(mRoue, g.rayonRoue, 0.026);

  return {
    path: `ros2_ws/src/${c.pkg}/urdf/${c.robotName}.urdf.xacro`,
    lang: "xml",
    content: `<?xml version="1.0"?>
<!-- Généré par LivretV. Les cotes viennent de la configuration :
     mesure-les sur le robot réel avant de t'y fier. -->
<robot name="${c.robotName}" xmlns:xacro="http://www.ros.org/wiki/xacro">

  <xacro:property name="rayon_roue"    value="${f(g.rayonRoue)}"/>
  <xacro:property name="largeur_roue"  value="0.026"/>
  <xacro:property name="entraxe"       value="${f(g.entraxe)}"/>
  <xacro:property name="chassis_l"     value="${f(g.longueur)}"/>
  <xacro:property name="chassis_w"     value="${f(g.largeur)}"/>
  <xacro:property name="chassis_h"     value="${f(g.hauteur)}"/>
  <xacro:property name="hauteur_lidar" value="${f(g.hauteurLidar)}"/>

  <material name="anthracite"><color rgba="0.11 0.11 0.14 1.0"/></material>
  <material name="bleu">      <color rgba="0.10 0.18 1.00 1.0"/></material>
  <material name="cyan">      <color rgba="0.37 0.88 1.00 1.0"/></material>

  <!-- Projection au sol : repère de référence pour la navigation 2D -->
  <link name="base_footprint"/>

  <link name="base_link">
    <visual>
      <geometry><box size="\${chassis_l} \${chassis_w} \${chassis_h}"/></geometry>
      <material name="anthracite"/>
    </visual>
    <collision>
      <geometry><box size="\${chassis_l} \${chassis_w} \${chassis_h}"/></geometry>
    </collision>
    <inertial>
      <mass value="${f(mChassis, 3)}"/>
      <inertia ixx="${f(iB.ixx, 6)}" ixy="0" ixz="0"
               iyy="${f(iB.iyy, 6)}" iyz="0" izz="${f(iB.izz, 6)}"/>
    </inertial>
  </link>

  <joint name="base_footprint_joint" type="fixed">
    <parent link="base_footprint"/>
    <child  link="base_link"/>
    <origin xyz="0 0 \${rayon_roue + chassis_h/2 - 0.01}"/>
  </joint>

  <!-- Une macro, deux appels : c'est tout l'intérêt de xacro -->
  <xacro:macro name="roue" params="prefix cote">
    <link name="wheel_\${prefix}_link">
      <visual>
        <origin rpy="\${pi/2} 0 0"/>
        <geometry><cylinder radius="\${rayon_roue}" length="\${largeur_roue}"/></geometry>
        <material name="bleu"/>
      </visual>
      <collision>
        <origin rpy="\${pi/2} 0 0"/>
        <geometry><cylinder radius="\${rayon_roue}" length="\${largeur_roue}"/></geometry>
      </collision>
      <inertial>
        <mass value="${f(mRoue, 3)}"/>
        <inertia ixx="${f(iR.ixx, 8)}" ixy="0" ixz="0"
                 iyy="${f(iR.iyy, 8)}" iyz="0" izz="${f(iR.izz, 8)}"/>
      </inertial>
    </link>

    <joint name="wheel_\${prefix}_joint" type="continuous">
      <parent link="base_link"/>
      <child  link="wheel_\${prefix}_link"/>
      <origin xyz="0 \${cote * entraxe / 2} \${-chassis_h/2}"/>
      <axis xyz="0 1 0"/>
    </joint>
  </xacro:macro>

  <xacro:roue prefix="left"  cote="1"/>
  <xacro:roue prefix="right" cote="-1"/>

  <!-- Roue folle arrière -->
  <link name="caster_link">
    <visual>
      <geometry><sphere radius="\${rayon_roue/2}"/></geometry>
      <material name="anthracite"/>
    </visual>
    <collision><geometry><sphere radius="\${rayon_roue/2}"/></geometry></collision>
    <inertial>
      <mass value="0.02"/>
      <inertia ixx="1e-6" ixy="0" ixz="0" iyy="1e-6" iyz="0" izz="1e-6"/>
    </inertial>
  </link>
  <joint name="caster_joint" type="fixed">
    <parent link="base_link"/>
    <child  link="caster_link"/>
    <origin xyz="\${-chassis_l/2 + 0.03} 0 \${-chassis_h/2 - rayon_roue/2}"/>
  </joint>

  <!-- LiDAR : cette position DOIT être mesurée sur le robot réel.
       Trois centimètres d'erreur donnent des murs dédoublés dans la carte. -->
  <link name="laser_frame">
    <visual>
      <geometry><cylinder radius="0.038" length="0.041"/></geometry>
      <material name="cyan"/>
    </visual>
    <collision><geometry><cylinder radius="0.038" length="0.041"/></geometry></collision>
    <inertial>
      <mass value="0.19"/>
      <inertia ixx="1e-4" ixy="0" ixz="0" iyy="1e-4" iyz="0" izz="1e-4"/>
    </inertial>
  </link>
  <joint name="laser_joint" type="fixed">
    <parent link="base_link"/>
    <child  link="laser_frame"/>
    <origin xyz="\${chassis_l/2 - 0.06} 0 \${hauteur_lidar - chassis_h/2}"/>
  </joint>

  <link name="imu_link"/>
  <joint name="imu_joint" type="fixed">
    <parent link="base_link"/>
    <child  link="imu_link"/>
    <origin xyz="0 0 \${chassis_h/2}"/>
  </joint>

</robot>
`
  };
}

/* ─────────────── Nœuds Python ─────────────── */

function baseController(c: ForgeConfig): GeneratedFile {
  const g = c.geometrie;
  return {
    path: `ros2_ws/src/${c.pkg}/${c.pkg}/base_controller.py`,
    lang: "python",
    content: `"""Pont entre /cmd_vel et l'électronique de puissance.

Reçoit des consignes de vitesse, applique la cinématique inverse
différentielle, et envoie les vitesses de roues au microcontrôleur.
"""

import math

import rclpy
import serial
from geometry_msgs.msg import Twist
from rclpy.node import Node
from sensor_msgs.msg import JointState


class BaseController(Node):
    def __init__(self):
        super().__init__("base_controller")

        self.declare_parameter("port", "/dev/base")
        self.declare_parameter("baud", 115200)
        self.declare_parameter("rayon_roue", ${f(g.rayonRoue)})
        self.declare_parameter("entraxe", ${f(g.entraxe)})
        self.declare_parameter("v_max", 0.6)
        self.declare_parameter("w_max", 2.0)
        # Sécurité : sans nouvelle commande pendant ce délai, on arrête.
        self.declare_parameter("cmd_timeout", 0.5)

        self.r = self.get_parameter("rayon_roue").value
        self.L = self.get_parameter("entraxe").value
        self.v_max = self.get_parameter("v_max").value
        self.w_max = self.get_parameter("w_max").value
        self.timeout = self.get_parameter("cmd_timeout").value

        port = self.get_parameter("port").value
        baud = self.get_parameter("baud").value
        try:
            self.serie = serial.Serial(port, baud, timeout=0.05)
            self.get_logger().info(f"Liaison ouverte sur {port}")
        except serial.SerialException as e:
            self.serie = None
            self.get_logger().error(f"Port {port} indisponible : {e}")

        self.derniere_cmd = self.get_clock().now()
        self.create_subscription(Twist, "/cmd_vel", self.on_cmd, 10)
        self.js_pub = self.create_publisher(JointState, "/joint_states", 10)
        self.create_timer(0.02, self.boucle)          # 50 Hz

        self.pos_gauche = 0.0
        self.pos_droite = 0.0
        self.w_gauche = 0.0
        self.w_droite = 0.0

    def on_cmd(self, msg: Twist):
        v = max(-self.v_max, min(self.v_max, msg.linear.x))
        w = max(-self.w_max, min(self.w_max, msg.angular.z))

        # Cinématique inverse d'une base différentielle
        v_g = v - (w * self.L / 2.0)
        v_d = v + (w * self.L / 2.0)

        self.w_gauche = v_g / self.r     # rad/s
        self.w_droite = v_d / self.r
        self.derniere_cmd = self.get_clock().now()

    def boucle(self):
        # Arrêt automatique si la liaison de commande se tait
        age = (self.get_clock().now() - self.derniere_cmd).nanoseconds / 1e9
        if age > self.timeout:
            self.w_gauche = self.w_droite = 0.0

        self.envoyer(self.w_gauche, self.w_droite)
        self.publier_joint_states()

    def envoyer(self, wg, wd):
        if self.serie is None:
            return
        try:
            self.serie.write(f"V {wg:.3f} {wd:.3f}\\n".encode())
        except serial.SerialException:
            self.get_logger().warn("Écriture série échouée", throttle_duration_sec=2.0)

    def publier_joint_states(self):
        dt = 0.02
        self.pos_gauche += self.w_gauche * dt
        self.pos_droite += self.w_droite * dt

        js = JointState()
        js.header.stamp = self.get_clock().now().to_msg()
        js.name = ["wheel_left_joint", "wheel_right_joint"]
        js.position = [self.pos_gauche, self.pos_droite]
        js.velocity = [self.w_gauche, self.w_droite]
        self.js_pub.publish(js)

    def destroy_node(self):
        # Toujours arrêter les moteurs avant de disparaître.
        self.envoyer(0.0, 0.0)
        if self.serie is not None:
            self.serie.close()
        return super().destroy_node()


def main(args=None):
    rclpy.init(args=args)
    node = BaseController()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.try_shutdown()


if __name__ == "__main__":
    main()
`
  };
}

function odomPublisher(c: ForgeConfig): GeneratedFile {
  const g = c.geometrie;
  const tfSurEkf = c.options.ekf;
  return {
    path: `ros2_ws/src/${c.pkg}/${c.pkg}/odom_publisher.py`,
    lang: "python",
    content: `"""Odométrie à partir des encodeurs.

Publie nav_msgs/Odometry${tfSurEkf ? " sur /odom_roues.\n\nLa transformation odom -> base_link est publiée par l'EKF, PAS ici :\ndeux publieurs pour la même transformation font trembler le robot." : " et la transformation odom -> base_link."}
"""

import math

import rclpy
import serial
from nav_msgs.msg import Odometry
from rclpy.node import Node
${tfSurEkf ? "" : "from geometry_msgs.msg import TransformStamped\nfrom tf2_ros import TransformBroadcaster\n"}

class OdomPublisher(Node):
    def __init__(self):
        super().__init__("odom_publisher")

        self.declare_parameter("port", "/dev/base")
        self.declare_parameter("rayon_roue", ${f(g.rayonRoue)})
        self.declare_parameter("entraxe", ${f(g.entraxe)})
        self.declare_parameter("tics_par_tour", 374)

        self.r = self.get_parameter("rayon_roue").value
        self.L = self.get_parameter("entraxe").value
        self.tics = self.get_parameter("tics_par_tour").value

        self.x = self.y = self.theta = 0.0
        self.tics_g = self.tics_d = 0
        self.t_prec = self.get_clock().now()

        try:
            self.serie = serial.Serial(
                self.get_parameter("port").value, 115200, timeout=0.05)
        except serial.SerialException as e:
            self.serie = None
            self.get_logger().error(f"Port indisponible : {e}")

        self.pub = self.create_publisher(Odometry, "${tfSurEkf ? "/odom_roues" : "/odom"}", 10)
${tfSurEkf ? "" : "        self.br = TransformBroadcaster(self)\n"}        self.create_timer(0.05, self.boucle)          # 20 Hz

    def lire_encodeurs(self):
        """Attend des lignes de la forme 'E <tics_gauche> <tics_droite>'."""
        if self.serie is None:
            return None
        try:
            ligne = self.serie.readline().decode(errors="ignore").strip()
        except serial.SerialException:
            return None
        if not ligne.startswith("E "):
            return None
        try:
            _, g, d = ligne.split()
            return int(g), int(d)
        except ValueError:
            return None

    def boucle(self):
        lecture = self.lire_encodeurs()
        if lecture is None:
            return
        tics_g, tics_d = lecture

        maintenant = self.get_clock().now()
        dt = (maintenant - self.t_prec).nanoseconds / 1e9
        if dt <= 0:
            return
        self.t_prec = maintenant

        d_g = tics_g - self.tics_g
        d_d = tics_d - self.tics_d
        self.tics_g, self.tics_d = tics_g, tics_d

        m_par_tic = (2 * math.pi * self.r) / self.tics
        dist_g = d_g * m_par_tic
        dist_d = d_d * m_par_tic

        dist = (dist_g + dist_d) / 2.0
        dtheta = (dist_d - dist_g) / self.L

        # Intégration à l'angle moyen : nettement plus juste en virage
        theta_moyen = self.theta + dtheta / 2.0
        self.x += dist * math.cos(theta_moyen)
        self.y += dist * math.sin(theta_moyen)
        self.theta = math.atan2(
            math.sin(self.theta + dtheta), math.cos(self.theta + dtheta))

        self.publier(maintenant, dist / dt, dtheta / dt)

    def publier(self, stamp, v, w):
        qz = math.sin(self.theta / 2.0)
        qw = math.cos(self.theta / 2.0)

        odom = Odometry()
        odom.header.stamp = stamp.to_msg()
        odom.header.frame_id = "odom"
        odom.child_frame_id = "base_link"
        odom.pose.pose.position.x = self.x
        odom.pose.pose.position.y = self.y
        odom.pose.pose.orientation.z = qz
        odom.pose.pose.orientation.w = qw
        odom.twist.twist.linear.x = v
        odom.twist.twist.angular.z = w

        # Une covariance à zéro voudrait dire "certitude absolue" :
        # l'EKF ignorerait alors toutes les autres sources.
        odom.pose.covariance[0] = 0.01     # x
        odom.pose.covariance[7] = 0.01     # y
        odom.pose.covariance[35] = 0.05    # yaw
        odom.twist.covariance[0] = 0.01
        odom.twist.covariance[35] = 0.05

        self.pub.publish(odom)
${
  tfSurEkf
    ? ""
    : `
        t = TransformStamped()
        t.header.stamp = stamp.to_msg()
        t.header.frame_id = "odom"
        t.child_frame_id = "base_link"
        t.transform.translation.x = self.x
        t.transform.translation.y = self.y
        t.transform.rotation.z = qz
        t.transform.rotation.w = qw
        self.br.sendTransform(t)
`
}

def main(args=None):
    rclpy.init(args=args)
    node = OdomPublisher()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.try_shutdown()


if __name__ == "__main__":
    main()
`
  };
}

function batteryMonitor(c: ForgeConfig): GeneratedFile {
  return {
    path: `ros2_ws/src/${c.pkg}/${c.pkg}/battery_monitor.py`,
    lang: "python",
    content: `"""Publication de l'état de batterie.

Sans ce node, le robot s'arrête sans prévenir au milieu d'une mission.
Avec, Nav2 peut décider de rentrer à la base avant la coupure.
"""

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import BatteryState


class BatteryMonitor(Node):
    def __init__(self):
        super().__init__("battery_monitor")

        self.declare_parameter("cellules", 3)
        self.declare_parameter("v_pleine", 4.2)
        self.declare_parameter("v_vide", 3.3)
        self.declare_parameter("seuil_alerte", 0.20)

        self.n = self.get_parameter("cellules").value
        self.v_pleine = self.get_parameter("v_pleine").value * self.n
        self.v_vide = self.get_parameter("v_vide").value * self.n
        self.seuil = self.get_parameter("seuil_alerte").value

        self.pub = self.create_publisher(BatteryState, "/battery_state", 10)
        self.create_timer(1.0, self.publier)

    def lire_tension(self) -> float:
        """À remplacer par la lecture réelle d'un INA219 sur le bus I2C."""
        return self.v_pleine * 0.9

    def publier(self):
        v = self.lire_tension()
        pct = (v - self.v_vide) / (self.v_pleine - self.v_vide)
        pct = max(0.0, min(1.0, pct))

        msg = BatteryState()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.voltage = float(v)
        msg.percentage = float(pct)
        msg.power_supply_status = BatteryState.POWER_SUPPLY_STATUS_DISCHARGING
        msg.present = True
        self.pub.publish(msg)

        if pct < self.seuil:
            self.get_logger().warn(
                f"Batterie à {pct*100:.0f} % — retour à la base conseillé",
                throttle_duration_sec=30.0)


def main(args=None):
    rclpy.init(args=args)
    node = BatteryMonitor()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.try_shutdown()


if __name__ == "__main__":
    main()
`
  };
}

/* ─────────────── Launch files ─────────────── */

function bringupLaunch(c: ForgeConfig): GeneratedFile {
  return {
    path: `ros2_ws/src/${c.pkg}/launch/bringup.launch.py`,
    lang: "python",
    content: `"""Lancement complet du robot ${c.robotName}.

Structuré en couches : description, matériel, capteurs, puis navigation.
Chaque couche est incluable seule, ce qui accélère beaucoup le débogage.
"""

import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription, GroupAction
from launch.conditions import IfCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration


def generate_launch_description():
    pkg = get_package_share_directory("${c.pkg}")
    lp = os.path.join(pkg, "launch")

    use_sim_time = LaunchConfiguration("use_sim_time")
    navigation = LaunchConfiguration("navigation")
    slam = LaunchConfiguration("slam")

    return LaunchDescription([
        DeclareLaunchArgument("use_sim_time", default_value="false",
                              description="Temps simulé (Gazebo)"),
        DeclareLaunchArgument("navigation", default_value="${c.options.nav2}",
                              description="Démarrer Nav2"),
        DeclareLaunchArgument("slam", default_value="${c.options.slam}",
                              description="Démarrer SLAM Toolbox"),

        # ── Couche 1 : description du robot ──
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(os.path.join(lp, "description.launch.py")),
            launch_arguments={"use_sim_time": use_sim_time}.items()),

        # ── Couche 2 : matériel ──
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(os.path.join(lp, "hardware.launch.py"))),

        # ── Couche 3 : capteurs ──
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(os.path.join(lp, "sensors.launch.py"))),

        # ── Couche 4 : cartographie ──
        GroupAction(
            condition=IfCondition(slam),
            actions=[IncludeLaunchDescription(
                PythonLaunchDescriptionSource(os.path.join(lp, "slam.launch.py")),
                launch_arguments={"use_sim_time": use_sim_time}.items())]),

        # ── Couche 5 : navigation ──
        GroupAction(
            condition=IfCondition(navigation),
            actions=[IncludeLaunchDescription(
                PythonLaunchDescriptionSource(os.path.join(lp, "navigation.launch.py")),
                launch_arguments={"use_sim_time": use_sim_time}.items())]),
    ])
`
  };
}

function descriptionLaunch(c: ForgeConfig): GeneratedFile {
  return {
    path: `ros2_ws/src/${c.pkg}/launch/description.launch.py`,
    lang: "python",
    content: `import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import Command, LaunchConfiguration
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue


def generate_launch_description():
    pkg = get_package_share_directory("${c.pkg}")
    xacro_file = os.path.join(pkg, "urdf", "${c.robotName}.urdf.xacro")

    use_sim_time = LaunchConfiguration("use_sim_time")

    # L'espace après "xacro " est OBLIGATOIRE : sans lui la commande
    # devient "xacro/chemin" et échoue avec un message incompréhensible.
    robot_description = ParameterValue(
        Command(["xacro ", xacro_file]), value_type=str)

    return LaunchDescription([
        DeclareLaunchArgument("use_sim_time", default_value="false"),

        Node(
            package="robot_state_publisher",
            executable="robot_state_publisher",
            output="screen",
            parameters=[{
                "robot_description": robot_description,
                "use_sim_time": use_sim_time,
            }],
        ),
    ])
`
  };
}

function hardwareLaunch(c: ForgeConfig): GeneratedFile {
  const microRos = c.options.microRos;
  return {
    path: `ros2_ws/src/${c.pkg}/launch/hardware.launch.py`,
    lang: "python",
    content: `import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    pkg = get_package_share_directory("${c.pkg}")
    ekf_config = os.path.join(pkg, "config", "ekf.yaml")

    noeuds = [
        Node(
            package="${c.pkg}",
            executable="base_controller",
            name="base_controller",
            output="screen",
            parameters=[{
                # /dev/base est un nom stable fourni par les règles udev :
                # /dev/ttyUSB0 change d'un démarrage à l'autre.
                "port": "/dev/base",
                "rayon_roue": ${f(c.geometrie.rayonRoue)},
                "entraxe": ${f(c.geometrie.entraxe)},
            }],
        ),
        Node(
            package="${c.pkg}",
            executable="odom_publisher",
            name="odom_publisher",
            output="screen",
        ),
        Node(
            package="${c.pkg}",
            executable="battery_monitor",
            name="battery_monitor",
        ),
    ]
${
  microRos
    ? `
    # L'agent micro-ROS : sans lui, le node du microcontrôleur
    # n'apparaît JAMAIS dans ros2 node list.
    noeuds.append(Node(
        package="micro_ros_agent",
        executable="micro_ros_agent",
        name="micro_ros_agent",
        arguments=["serial", "--dev", "/dev/base", "-b", "115200"],
        output="screen",
    ))
`
    : ""
}${
      c.options.ekf
        ? `
    # L'EKF fusionne roues et IMU, et publie odom -> base_link.
    # Le node d'odométrie ne doit donc PAS publier cette transformation.
    noeuds.append(Node(
        package="robot_localization",
        executable="ekf_node",
        name="ekf_filter_node",
        output="screen",
        parameters=[ekf_config],
    ))
`
        : ""
    }
    return LaunchDescription(noeuds)
`
  };
}

function sensorsLaunch(c: ForgeConfig): GeneratedFile {
  const lidarId = c.choix["Télémétrie"] ?? "rplidar-a1";
  const lidar = getComponent(lidarId);
  const estLd19 = lidarId.includes("ld19");

  return {
    path: `ros2_ws/src/${c.pkg}/launch/sensors.launch.py`,
    lang: "python",
    content: `from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    return LaunchDescription([
        # ${lidar?.name ?? "LiDAR"} — publie /scan en BEST_EFFORT.
        # Tout abonné laissé sur le profil RELIABLE par défaut
        # ne recevra RIEN, sans le moindre message d'erreur.
        Node(
            package="${estLd19 ? "ldlidar_stl_ros2" : "rplidar_ros"}",
            executable="${estLd19 ? "ldlidar_stl_ros2_node" : "rplidar_node"}",
            name="lidar_node",
            output="screen",
            parameters=[{
                "serial_port": "/dev/lidar",
                "serial_baudrate": ${estLd19 ? "230400" : "115200"},
                "frame_id": "laser_frame",
                "angle_compensate": True,
            }],
        ),

        Node(
            package="bno055",
            executable="bno055",
            name="imu_node",
            output="screen",
            parameters=[{
                "connection_type": "i2c",
                "frame_id": "imu_link",
                # Éloigne l'IMU des moteurs d'au moins 10 cm,
                # sinon le magnétomètre dérive en permanence.
            }],
        ),
    ])
`
  };
}

function slamLaunch(c: ForgeConfig): GeneratedFile {
  return {
    path: `ros2_ws/src/${c.pkg}/launch/slam.launch.py`,
    lang: "python",
    content: `import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    pkg = get_package_share_directory("${c.pkg}")
    slam_config = os.path.join(pkg, "config", "slam.yaml")

    return LaunchDescription([
        DeclareLaunchArgument("use_sim_time", default_value="false"),

        Node(
            package="slam_toolbox",
            executable="async_slam_toolbox_node",
            name="slam_toolbox",
            output="screen",
            parameters=[
                slam_config,
                {"use_sim_time": LaunchConfiguration("use_sim_time")},
            ],
        ),
    ])
`
  };
}

function navigationLaunch(c: ForgeConfig): GeneratedFile {
  return {
    path: `ros2_ws/src/${c.pkg}/launch/navigation.launch.py`,
    lang: "python",
    content: `import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration


def generate_launch_description():
    pkg = get_package_share_directory("${c.pkg}")
    nav2_bringup = get_package_share_directory("nav2_bringup")
    params = os.path.join(pkg, "config", "nav2_params.yaml")

    return LaunchDescription([
        DeclareLaunchArgument("use_sim_time", default_value="false"),

        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(
                os.path.join(nav2_bringup, "launch", "navigation_launch.py")),
            launch_arguments={
                "use_sim_time": LaunchConfiguration("use_sim_time"),
                "params_file": params,
                "autostart": "true",
            }.items(),
        ),
    ])
`
  };
}

/* ─────────────── Configurations YAML ─────────────── */

function ekfYaml(c: ForgeConfig): GeneratedFile {
  return {
    path: `ros2_ws/src/${c.pkg}/config/ekf.yaml`,
    lang: "yaml",
    content: `# Fusion odométrie des roues + IMU.
#
# Règle d'or : ne JAMAIS fournir position ET vitesse depuis la même source.
# Le filtre les croirait indépendantes et divergerait.
#   - roues -> vitesses linéaires
#   - IMU   -> vitesse angulaire en lacet

ekf_filter_node:
  ros__parameters:
    frequency: 30.0
    sensor_timeout: 0.1
    two_d_mode: true          # robot au sol : z, roll et pitch sont ignorés
    publish_tf: true

    map_frame: map
    odom_frame: odom
    base_link_frame: base_link
    world_frame: odom         # ce nœud produit odom -> base_link

    # ── Odométrie des roues ──
    odom0: /odom_roues
    # x  y  z | roll pitch yaw | vx vy vz | vroll vpitch vyaw | ax ay az
    odom0_config: [false, false, false,
                   false, false, false,
                   true,  true,  false,
                   false, false, false,
                   false, false, false]
    odom0_queue_size: 10
    odom0_differential: false
    odom0_relative: false

    # ── IMU ──
    imu0: /imu/data
    imu0_config: [false, false, false,
                  false, false, false,
                  false, false, false,
                  false, false, true,
                  false, false, false]
    imu0_queue_size: 10
    imu0_differential: false
    imu0_remove_gravitational_acceleration: true

    process_noise_covariance: [0.05, 0.05, 0.06, 0.03, 0.03, 0.06,
                               0.025, 0.025, 0.04, 0.01, 0.01, 0.02,
                               0.01, 0.01, 0.015]
`
  };
}

function slamYaml(c: ForgeConfig): GeneratedFile {
  return {
    path: `ros2_ws/src/${c.pkg}/config/slam.yaml`,
    lang: "yaml",
    content: `slam_toolbox:
  ros__parameters:
    solver_plugin: solver_plugins::CeresSolver
    ceres_linear_solver: SPARSE_NORMAL_CHOLESKY
    ceres_preconditioner: SCHUR_JACOBI
    ceres_trust_strategy: LEVENBERG_MARQUARDT

    mode: mapping                 # passer à "localization" une fois la carte faite

    odom_frame: odom
    map_frame: map
    base_frame: base_link
    scan_topic: /scan

    resolution: 0.05              # 5 cm par case
    max_laser_range: 12.0
    minimum_time_interval: 0.2
    transform_timeout: 0.2
    tf_buffer_duration: 30.0

    # Distance et angle minimaux entre deux scans retenus.
    # Trop petit : le graphe explose. Trop grand : la carte se dégrade.
    minimum_travel_distance: 0.3
    minimum_travel_heading: 0.3

    # Fermeture de boucle : ce qui remet la carte en place
    # quand le robot repasse par un endroit déjà visité.
    do_loop_closing: true
    loop_search_maximum_distance: 3.0
    loop_match_minimum_chain_size: 10
    loop_match_minimum_response_fine: 0.45
`
  };
}

function nav2Yaml(c: ForgeConfig): GeneratedFile {
  const g = c.geometrie;
  const rayon = Math.max(g.longueur, g.largeur) / 2 + 0.02;
  return {
    path: `ros2_ws/src/${c.pkg}/config/nav2_params.yaml`,
    lang: "yaml",
    content: `# Paramètres Nav2 pour ${c.robotName}.
#
# robot_radius est calculé depuis la géométrie déclarée, avec 2 cm de marge.
# Trop petit, le robot frotte les murs ; trop grand, il refuse de passer
# une porte pourtant assez large.

amcl:
  ros__parameters:
    use_sim_time: false
    base_frame_id: base_link
    odom_frame_id: odom
    global_frame_id: map
    scan_topic: /scan
    max_particles: 2000
    min_particles: 500

bt_navigator:
  ros__parameters:
    use_sim_time: false
    global_frame: map
    robot_base_frame: base_link
    odom_topic: /odom

controller_server:
  ros__parameters:
    use_sim_time: false
    controller_frequency: 20.0
    min_x_velocity_threshold: 0.001
    min_theta_velocity_threshold: 0.001

    progress_checker_plugins: ["progress_checker"]
    goal_checker_plugins: ["goal_checker"]
    controller_plugins: ["FollowPath"]

    progress_checker:
      plugin: "nav2_controller::SimpleProgressChecker"
      required_movement_radius: 0.5
      movement_time_allowance: 10.0

    goal_checker:
      plugin: "nav2_controller::SimpleGoalChecker"
      xy_goal_tolerance: 0.20
      yaw_goal_tolerance: 0.25
      stateful: true

    FollowPath:
      plugin: "nav2_regulated_pure_pursuit_controller::RegulatedPurePursuitController"
      desired_linear_vel: 0.4
      # Le réglage qui compte le plus : trop court, le robot oscille ;
      # trop long, il coupe les virages et frotte les murs.
      lookahead_dist: 0.5
      min_lookahead_dist: 0.3
      max_lookahead_dist: 0.9
      use_velocity_scaled_lookahead_dist: true
      use_regulated_linear_velocity_scaling: true
      regulated_linear_scaling_min_radius: 0.9
      use_cost_regulated_linear_velocity_scaling: true
      max_angular_accel: 3.2

local_costmap:
  local_costmap:
    ros__parameters:
      use_sim_time: false
      update_frequency: 5.0
      publish_frequency: 2.0
      global_frame: odom
      robot_base_frame: base_link
      rolling_window: true
      width: 3
      height: 3
      resolution: 0.05
      robot_radius: ${f(rayon, 3)}
      plugins: ["obstacle_layer", "inflation_layer"]

      obstacle_layer:
        plugin: "nav2_costmap_2d::ObstacleLayer"
        enabled: true
        observation_sources: scan
        scan:
          topic: /scan
          data_type: "LaserScan"
          max_obstacle_height: 2.0
          clearing: true
          marking: true
          raytrace_max_range: 12.0
          obstacle_max_range: 8.0

      inflation_layer:
        plugin: "nav2_costmap_2d::InflationLayer"
        cost_scaling_factor: 3.0
        inflation_radius: ${f(rayon + 0.2, 3)}

global_costmap:
  global_costmap:
    ros__parameters:
      use_sim_time: false
      update_frequency: 1.0
      publish_frequency: 1.0
      global_frame: map
      robot_base_frame: base_link
      resolution: 0.05
      track_unknown_space: true
      robot_radius: ${f(rayon, 3)}
      plugins: ["static_layer", "obstacle_layer", "inflation_layer"]

      static_layer:
        plugin: "nav2_costmap_2d::StaticLayer"
        map_subscribe_transient_local: true

      obstacle_layer:
        plugin: "nav2_costmap_2d::ObstacleLayer"
        observation_sources: scan
        scan:
          topic: /scan
          data_type: "LaserScan"
          clearing: true
          marking: true

      inflation_layer:
        plugin: "nav2_costmap_2d::InflationLayer"
        cost_scaling_factor: 3.0
        inflation_radius: ${f(rayon + 0.2, 3)}

behavior_server:
  ros__parameters:
    use_sim_time: false
    behavior_plugins: ["spin", "backup", "wait"]
    spin:
      plugin: "nav2_behaviors/Spin"
    backup:
      plugin: "nav2_behaviors/BackUp"
    wait:
      plugin: "nav2_behaviors/Wait"

velocity_smoother:
  ros__parameters:
    use_sim_time: false
    smoothing_frequency: 20.0
    max_velocity: [0.6, 0.0, 2.0]
    min_velocity: [-0.4, 0.0, -2.0]
    max_accel: [1.0, 0.0, 3.2]
    max_decel: [-1.5, 0.0, -3.2]
`
  };
}

/* ─────────────── Documentation ─────────────── */

function readme(c: ForgeConfig): GeneratedFile {
  const arch = getArchetype(c.archetypeId);
  const composants = Object.entries(c.choix)
    .map(([role, id]) => {
      const comp = getComponent(id);
      return comp ? `| ${role} | ${comp.name} | ${comp.price} € |` : null;
    })
    .filter(Boolean);

  const total = Object.values(c.choix).reduce(
    (n, id) => n + (getComponent(id)?.price ?? 0),
    0
  );

  return {
    path: `ros2_ws/src/${c.pkg}/README.md`,
    lang: "text",
    content: `# ${c.robotName}

${arch?.description ?? ""}

Projet généré par **LivretV**. Cible : ROS 2 ${c.distro === "jazzy" ? "Jazzy Jalisco (Ubuntu 24.04)" : "Humble Hawksbill (Ubuntu 22.04)"}.

## Matériel

| Rôle | Composant | Prix |
|---|---|---|
${composants.join("\n")}

**Total indicatif : ${total} €**

## Compilation

\`\`\`bash
cd ~/ros2_ws
rosdep install --from-paths src --ignore-src -r -y
colcon build --symlink-install --packages-select ${c.pkg}
source install/setup.bash
\`\`\`

## Avant le premier démarrage

### 1. Règles udev

Sans elles, \`/dev/ttyUSB0\` change d'un démarrage à l'autre et le launch file
peut envoyer des commandes moteur au LiDAR.

\`\`\`bash
sudo cp udev/99-${c.robotName}.rules /etc/udev/rules.d/
sudo udevadm control --reload-rules && sudo udevadm trigger
ls -l /dev/lidar /dev/base
\`\`\`

### 2. Calibration

Les valeurs de \`rayon_roue\` et \`entraxe\` sont des estimations. Calibre-les :

- **Linéaire** : fais avancer le robot sur 5 m mesurés au sol, compare à
  \`/odom\`. Corrige \`rayon_roue\` proportionnellement.
- **Angulaire** : fais tourner le robot dix tours sur lui-même, compare
  l'orientation finale. Corrige \`entraxe\`.

Dix tours, pas un seul : sur un tour, ton erreur d'observation dépasse
l'erreur du robot.

### 3. Mesurer la position du LiDAR

La valeur \`hauteur_lidar\` de l'URDF doit correspondre à la réalité au
centimètre près. Trois centimètres d'erreur donnent des murs dédoublés
dans la carte SLAM.

## Utilisation

\`\`\`bash
# Le robot seul, sans navigation
ros2 launch ${c.pkg} bringup.launch.py navigation:=false slam:=false

# Premier test : mets le robot sur cales
ros2 topic pub -r 10 /cmd_vel geometry_msgs/msg/Twist "{linear: {x: 0.1}}"

# Cartographier
ros2 launch ${c.pkg} bringup.launch.py slam:=true
ros2 run teleop_twist_keyboard teleop_twist_keyboard
ros2 run nav2_map_server map_saver_cli -f ~/maps/ma_carte

# Naviguer sur la carte enregistrée
ros2 launch ${c.pkg} bringup.launch.py navigation:=true
\`\`\`

## Vérifications utiles

\`\`\`bash
ros2 run tf2_tools view_frames        # l'arbre des repères est-il complet ?
ros2 topic hz /scan                    # le LiDAR publie-t-il ?
ros2 topic info /scan --verbose        # les QoS sont-elles compatibles ?
ros2 lifecycle get /planner_server     # Nav2 est-il activé ?
\`\`\`

## Pièges à connaître

${(arch?.stack ?? [])
  .flatMap((s) => {
    const comp = getComponent(c.choix[s.role] ?? s.componentIds[0]);
    return comp ? comp.gotchas.slice(0, 1).map((g) => `- **${comp.name}** — ${g}`) : [];
  })
  .join("\n")}

## Démarrage automatique

\`\`\`bash
sudo cp systemd/${c.robotName}.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ${c.robotName}.service
journalctl -u ${c.robotName}.service -f
\`\`\`
`
  };
}

function wiringMd(c: ForgeConfig): GeneratedFile {
  const lignes = Object.entries(c.choix)
    .map(([role, id]) => {
      const comp = getComponent(id);
      if (!comp) return null;
      const alim =
        comp.voltage.nominal > 0
          ? `${comp.voltage.nominal} V`
          : "—";
      return `| ${role} | ${comp.name} | ${alim} | ${comp.currentMa.typ} mA | ${comp.currentMa.peak} mA | ${comp.buses.join(", ") || "—"} |`;
    })
    .filter(Boolean);

  const conso = Object.values(c.choix).reduce(
    (n, id) => n + (getComponent(id)?.currentMa.typ ?? 0),
    0
  );
  const peak = Object.values(c.choix).reduce(
    (n, id) => n + (getComponent(id)?.currentMa.peak ?? 0),
    0
  );
  const fourni = Object.values(c.choix).reduce(
    (n, id) => n + (getComponent(id)?.suppliesMa ?? 0),
    0
  );

  return {
    path: `ros2_ws/src/${c.pkg}/WIRING.md`,
    lang: "text",
    content: `# Câblage de ${c.robotName}

## Bilan électrique

| Rôle | Composant | Tension | Courant typ. | Pic | Bus |
|---|---|---|---|---|---|
${lignes.join("\n")}

- **Consommation en régime établi : ${conso} mA**
- **Pics cumulés : ${peak} mA**
- **Capacité des sources : ${fourni || "à définir"} mA**

${
  fourni > 0 && peak > fourni
    ? `> ⚠ Les pics dépassent la capacité des sources. Sépare l'alimentation du calculateur de celle des moteurs et des servos, sinon le calculateur redémarrera au démarrage des moteurs.`
    : ""
}

## Règles à respecter

1. **Deux régulateurs, pas un.** Un BEC pour le calculateur, un autre pour
   les servos et les moteurs. Le pic de courant des actionneurs ne doit
   jamais atteindre le rail du calculateur.

2. **Une seule masse.** Toutes les masses se rejoignent en un point unique,
   sur la carte de distribution. Deux masses séparées créent une différence
   de potentiel qui fausse les signaux I2C.

3. **Niveaux logiques.** Les encodeurs et beaucoup de capteurs sortent en
   5 V. Les GPIO du Raspberry Pi et de l'ESP32 sont en 3,3 V **non
   tolérants**. Un adaptateur de niveau coûte deux euros ; un Raspberry Pi
   en coûte 85.

4. **Adresses I2C.** Vérifie l'absence de doublon avant de câbler :
   \`i2cdetect -y 1\`. Le PCA9685 et l'INA219 sont tous deux en 0x40 par
   défaut. Le MPU6050 et l'ICM-20948 sont tous deux en 0x68.

5. **Broches d'activation.** Sur un TB6612, la broche STBY doit être au
   niveau haut ou rien ne sort. Sur un TMC2209, EN est active à l'état bas.

6. **Fusible et interrupteur.** En série sur la batterie, systématiquement.

## Séquence de mise sous tension

1. Vérifier la polarité au multimètre **avant** de connecter la batterie.
2. Régler la tension de sortie des régulateurs **hors charge**.
3. Connecter le calculateur seul, vérifier qu'il démarre.
4. Ajouter les capteurs, vérifier \`i2cdetect\` et \`ls /dev/tty*\`.
5. Connecter la puissance moteur, robot **sur cales**.
6. Premier essai de mouvement, main sur l'interrupteur.
`
  };
}

function bomCsvFile(c: ForgeConfig): GeneratedFile {
  const lignes = Object.entries(c.choix)
    .map(([role, id]) => {
      const comp = getComponent(id);
      if (!comp) return null;
      return `${role};${comp.name};${comp.brand};1;${comp.price};${comp.price}`;
    })
    .filter(Boolean);

  const total = Object.values(c.choix).reduce(
    (n, id) => n + (getComponent(id)?.price ?? 0),
    0
  );

  return {
    path: `ros2_ws/src/${c.pkg}/BOM.csv`,
    lang: "text",
    content: `Role;Composant;Marque;Quantite;PrixUnitaire;Total
${lignes.join("\n")}
;;;;TOTAL;${total}
`
  };
}

function udevRules(c: ForgeConfig): GeneratedFile {
  return {
    path: `ros2_ws/src/${c.pkg}/udev/99-${c.robotName}.rules`,
    lang: "text",
    content: `# Noms de périphériques stables pour ${c.robotName}.
#
# Sans ces règles, /dev/ttyUSB0 change selon l'ordre de branchement :
# le launch file peut alors envoyer des commandes moteur au LiDAR.
#
# Trouve les identifiants réels avec :
#   udevadm info -a -n /dev/ttyUSB0 | grep -E "idVendor|idProduct|serial"

# LiDAR — pont CP2102
SUBSYSTEM=="tty", ATTRS{idVendor}=="10c4", ATTRS{idProduct}=="ea60", SYMLINK+="lidar", MODE="0666"

# Carte de base — pont CH340
SUBSYSTEM=="tty", ATTRS{idVendor}=="1a86", ATTRS{idProduct}=="7523", SYMLINK+="base", MODE="0666"

# Manette de téléopération
SUBSYSTEM=="input", ATTRS{name}=="*Controller*", MODE="0666"
`
  };
}

function systemdService(c: ForgeConfig): GeneratedFile {
  return {
    path: `ros2_ws/src/${c.pkg}/systemd/${c.robotName}.service`,
    lang: "text",
    content: `[Unit]
Description=${c.robotName} — bringup ROS 2
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=robot

# systemd ne lit PAS ~/.bashrc : tout doit être déclaré ici,
# sinon le service échoue avec "ros2: command not found".
Environment="ROS_DOMAIN_ID=42"
Environment="RMW_IMPLEMENTATION=rmw_fastrtps_cpp"

ExecStart=/bin/bash -c "source /opt/ros/${c.distro}/setup.bash && \\
  source /home/robot/ros2_ws/install/setup.bash && \\
  ros2 launch ${c.pkg} bringup.launch.py"

Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
`
  };
}

function resourceMarker(c: ForgeConfig): GeneratedFile {
  return {
    path: `ros2_ws/src/${c.pkg}/resource/${c.pkg}`,
    lang: "text",
    content: ""
  };
}

function initPy(c: ForgeConfig): GeneratedFile {
  return {
    path: `ros2_ws/src/${c.pkg}/${c.pkg}/__init__.py`,
    lang: "python",
    content: ""
  };
}

/* ─────────────── Point d'entrée ─────────────── */

export function genererProjet(c: ForgeConfig): GeneratedFile[] {
  const fichiers: GeneratedFile[] = [
    packageXml(c),
    setupPy(c),
    resourceMarker(c),
    initPy(c),
    urdf(c),
    baseController(c),
    odomPublisher(c),
    batteryMonitor(c),
    bringupLaunch(c),
    descriptionLaunch(c),
    hardwareLaunch(c),
    sensorsLaunch(c),
    readme(c),
    wiringMd(c),
    bomCsvFile(c),
    udevRules(c),
    systemdService(c)
  ];

  if (c.options.ekf) fichiers.push(ekfYaml(c));
  if (c.options.slam) fichiers.push(slamYaml(c), slamLaunch(c));
  if (c.options.nav2) fichiers.push(nav2Yaml(c), navigationLaunch(c));

  return fichiers.sort((a, b) => a.path.localeCompare(b.path));
}

/* ─────────────── Aperçu 3D ─────────────── */

export function apercu(c: ForgeConfig): PreviewShape[] {
  const g = c.geometrie;
  const zChassis = g.rayonRoue + g.hauteur / 2 - 0.01;

  return [
    {
      kind: "box",
      name: "base_link",
      size: [g.longueur, g.largeur, g.hauteur],
      pos: [0, 0, zChassis],
      color: "#1c1e2a"
    },
    {
      kind: "cylinder",
      name: "wheel_left",
      radius: g.rayonRoue,
      length: 0.026,
      pos: [0, g.entraxe / 2, g.rayonRoue],
      axis: "y",
      color: "#1a2fff"
    },
    {
      kind: "cylinder",
      name: "wheel_right",
      radius: g.rayonRoue,
      length: 0.026,
      pos: [0, -g.entraxe / 2, g.rayonRoue],
      axis: "y",
      color: "#1a2fff"
    },
    {
      // Support du LiDAR : absent de l'URDF, qui n'a pas besoin de le
      // décrire, mais sans lui l'aperçu donne un capteur en lévitation.
      kind: "box",
      name: "mast",
      size: [0.02, 0.02, Math.max(0.01, g.hauteurLidar - g.hauteur / 2 - 0.02)],
      pos: [
        g.longueur / 2 - 0.06,
        0,
        zChassis +
          g.hauteur / 2 +
          Math.max(0.01, g.hauteurLidar - g.hauteur / 2 - 0.02) / 2
      ],
      color: "#2b2d3d"
    },
    {
      kind: "cylinder",
      name: "laser_frame",
      radius: 0.038,
      length: 0.041,
      pos: [g.longueur / 2 - 0.06, 0, zChassis + g.hauteurLidar - g.hauteur / 2],
      axis: "z",
      color: "#5ee0ff"
    },
    {
      kind: "cylinder",
      name: "caster",
      radius: g.rayonRoue / 2,
      length: 0.02,
      pos: [-g.longueur / 2 + 0.03, 0, g.rayonRoue / 2],
      axis: "y",
      color: "#3a3d52"
    }
  ];
}
