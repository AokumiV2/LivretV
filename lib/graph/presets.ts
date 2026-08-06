import { QOS_CAPTEUR, QOS_DEFAUT, QOS_LATCH, type GraphDoc } from "./types";

/**
 * Graphes d'exemple. Le premier reproduit l'incompatibilité QoS la plus
 * coûteuse en temps de ROS 2 : un LiDAR en BEST_EFFORT lu par un node
 * laissé sur le profil par défaut, qui est RELIABLE.
 */

export const GRAPH_PRESETS: {
  id: string;
  nom: string;
  desc: string;
  doc: GraphDoc;
}[] = [
  {
    id: "qos",
    nom: "Le piège QoS",
    desc: "Un LiDAR BEST_EFFORT et un abonné RELIABLE : rien ne passe",
    doc: {
      nodes: [
        {
          id: "lidar",
          name: "rplidar_node",
          pkg: "rplidar_ros",
          x: 60,
          y: 80,
          subs: [],
          pubs: [
            {
              id: "p1",
              topic: "/scan",
              msgType: "sensor_msgs/msg/LaserScan",
              qos: QOS_CAPTEUR,
              hz: 10
            }
          ]
        },
        {
          id: "obst",
          name: "surveillance_obstacle",
          pkg: "mon_robot",
          x: 480,
          y: 60,
          pubs: [],
          subs: [
            {
              id: "s1",
              topic: "/scan",
              msgType: "sensor_msgs/msg/LaserScan",
              qos: QOS_DEFAUT
            }
          ]
        },
        {
          id: "slam",
          name: "slam_toolbox",
          pkg: "slam_toolbox",
          x: 480,
          y: 220,
          subs: [
            {
              id: "s2",
              topic: "/scan",
              msgType: "sensor_msgs/msg/LaserScan",
              qos: QOS_CAPTEUR
            }
          ],
          pubs: [
            {
              id: "p2",
              topic: "/map",
              msgType: "nav_msgs/msg/OccupancyGrid",
              qos: QOS_LATCH,
              hz: 1
            }
          ]
        }
      ]
    }
  },
  {
    id: "rover",
    nom: "Base roulante complète",
    desc: "De l'odométrie à Nav2, le graphe d'un robot différentiel",
    doc: {
      nodes: [
        {
          id: "base",
          name: "base_controller",
          pkg: "mon_robot",
          x: 40,
          y: 40,
          subs: [
            {
              id: "s-cmd",
              topic: "/cmd_vel",
              msgType: "geometry_msgs/msg/Twist",
              qos: QOS_DEFAUT
            }
          ],
          pubs: [
            {
              id: "p-odom",
              topic: "/odom_roues",
              msgType: "nav_msgs/msg/Odometry",
              qos: QOS_DEFAUT,
              hz: 30
            },
            {
              id: "p-js",
              topic: "/joint_states",
              msgType: "sensor_msgs/msg/JointState",
              qos: QOS_DEFAUT,
              hz: 50
            }
          ]
        },
        {
          id: "imu",
          name: "bno085_node",
          pkg: "bno08x_ros2",
          x: 40,
          y: 260,
          subs: [],
          pubs: [
            {
              id: "p-imu",
              topic: "/imu/data",
              msgType: "sensor_msgs/msg/Imu",
              qos: QOS_CAPTEUR,
              hz: 100
            }
          ]
        },
        {
          id: "lidar",
          name: "rplidar_node",
          pkg: "rplidar_ros",
          x: 40,
          y: 440,
          subs: [],
          pubs: [
            {
              id: "p-scan",
              topic: "/scan",
              msgType: "sensor_msgs/msg/LaserScan",
              qos: QOS_CAPTEUR,
              hz: 10
            }
          ]
        },
        {
          id: "ekf",
          name: "ekf_filter_node",
          pkg: "robot_localization",
          x: 400,
          y: 200,
          subs: [
            {
              id: "s-odom",
              topic: "/odom_roues",
              msgType: "nav_msgs/msg/Odometry",
              qos: QOS_DEFAUT
            },
            {
              id: "s-imu",
              topic: "/imu/data",
              msgType: "sensor_msgs/msg/Imu",
              qos: QOS_CAPTEUR
            }
          ],
          pubs: [
            {
              id: "p-filt",
              topic: "/odom",
              msgType: "nav_msgs/msg/Odometry",
              qos: QOS_DEFAUT,
              hz: 30
            },
            {
              id: "p-tf",
              topic: "/tf",
              msgType: "tf2_msgs/msg/TFMessage",
              qos: QOS_DEFAUT,
              hz: 30
            }
          ]
        },
        {
          id: "slam",
          name: "slam_toolbox",
          pkg: "slam_toolbox",
          x: 400,
          y: 460,
          subs: [
            {
              id: "s-scan",
              topic: "/scan",
              msgType: "sensor_msgs/msg/LaserScan",
              qos: QOS_CAPTEUR
            }
          ],
          pubs: [
            {
              id: "p-map",
              topic: "/map",
              msgType: "nav_msgs/msg/OccupancyGrid",
              qos: QOS_LATCH,
              hz: 1
            }
          ]
        },
        {
          id: "ctrl",
          name: "controller_server",
          pkg: "nav2_controller",
          x: 780,
          y: 260,
          subs: [
            {
              id: "s-plan",
              topic: "/plan",
              msgType: "nav_msgs/msg/Path",
              qos: QOS_DEFAUT
            },
            {
              id: "s-odom2",
              topic: "/odom",
              msgType: "nav_msgs/msg/Odometry",
              qos: QOS_DEFAUT
            }
          ],
          pubs: [
            {
              id: "p-cmd",
              topic: "/cmd_vel",
              msgType: "geometry_msgs/msg/Twist",
              qos: QOS_DEFAUT,
              hz: 20
            }
          ]
        },
        {
          id: "plan",
          name: "planner_server",
          pkg: "nav2_planner",
          x: 780,
          y: 60,
          subs: [
            {
              id: "s-map",
              topic: "/map",
              msgType: "nav_msgs/msg/OccupancyGrid",
              qos: QOS_LATCH
            }
          ],
          pubs: [
            {
              id: "p-plan",
              topic: "/plan",
              msgType: "nav_msgs/msg/Path",
              qos: QOS_DEFAUT,
              hz: 1
            }
          ]
        }
      ]
    }
  },
  {
    id: "vide",
    nom: "Graphe vide",
    desc: "Partir de zéro",
    doc: { nodes: [] }
  }
];
