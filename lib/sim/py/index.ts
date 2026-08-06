import { FICHIERS_MESSAGES } from "./messages";
import { FICHIERS_RCLPY } from "./rclpy";

/**
 * L'arborescence Python déposée dans le système de fichiers virtuel
 * de Pyodide, puis ajoutée à `sys.path`. Les chemins sont ceux d'une
 * installation ROS 2 : `import rclpy` et `from sensor_msgs.msg import
 * LaserScan` fonctionnent sans le moindre alias.
 */
export const RACINE_PY = "/lib/livretv";

export const FICHIERS_PY: Record<string, string> = {
  ...FICHIERS_RCLPY,
  ...FICHIERS_MESSAGES
};

/** Les modules qu'un import peut atteindre, pour l'aide de l'éditeur. */
export const MODULES_DISPONIBLES = [
  "rclpy",
  "rclpy.node",
  "rclpy.qos",
  "rclpy.duration",
  "rclpy.clock",
  "rclpy.parameter",
  "rclpy.executors",
  "rclpy.callback_groups",
  "std_msgs.msg",
  "geometry_msgs.msg",
  "sensor_msgs.msg",
  "nav_msgs.msg",
  "std_srvs.srv",
  "builtin_interfaces.msg"
];
