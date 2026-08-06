import type { MsgType } from "./types";

/**
 * Types de messages ROS 2 courants, avec un générateur de valeur plausible
 * par champ. Le simulateur de graphe s'en sert pour produire un flux
 * `ros2 topic echo` crédible.
 */

const f = (v: number, d = 3) => v.toFixed(d);
const wave = (tick: number, amp: number, period: number, phase = 0) =>
  amp * Math.sin((tick / period) * Math.PI * 2 + phase);

export const MSG_TYPES: MsgType[] = [
  {
    name: "geometry_msgs/msg/Twist",
    pkg: "geometry_msgs",
    purpose: "Consigne de vitesse : combien avancer, combien tourner",
    typicalHz: 20,
    fields: [
      { name: "linear.x", type: "float64", note: "m/s vers l'avant", sample: (t) => f(0.25 + wave(t, 0.08, 40)) },
      { name: "linear.y", type: "float64", note: "m/s latéral (0 en différentiel)", sample: () => "0.000" },
      { name: "angular.z", type: "float64", note: "rad/s en lacet", sample: (t) => f(wave(t, 0.4, 25)) }
    ]
  },
  {
    name: "nav_msgs/msg/Odometry",
    pkg: "nav_msgs",
    purpose: "Position estimée et vitesse du robot dans le repère odom",
    typicalHz: 30,
    fields: [
      { name: "header.frame_id", type: "string", sample: () => "odom" },
      { name: "child_frame_id", type: "string", sample: () => "base_link" },
      { name: "pose.pose.position.x", type: "float64", sample: (t) => f(t * 0.012) },
      { name: "pose.pose.position.y", type: "float64", sample: (t) => f(wave(t, 0.3, 120)) },
      { name: "pose.pose.orientation.z", type: "float64", sample: (t) => f(wave(t, 0.2, 120)) },
      { name: "pose.pose.orientation.w", type: "float64", sample: (t) => f(1 - Math.abs(wave(t, 0.02, 120))) },
      { name: "twist.twist.linear.x", type: "float64", sample: (t) => f(0.24 + wave(t, 0.03, 17)) }
    ]
  },
  {
    name: "sensor_msgs/msg/LaserScan",
    pkg: "sensor_msgs",
    purpose: "Télémétrie laser 2D : un tableau de distances sur 360°",
    typicalHz: 10,
    fields: [
      { name: "header.frame_id", type: "string", sample: () => "laser_frame" },
      { name: "angle_min", type: "float32", sample: () => "-3.141593" },
      { name: "angle_max", type: "float32", sample: () => "3.141593" },
      { name: "angle_increment", type: "float32", sample: () => "0.017453" },
      { name: "range_min", type: "float32", sample: () => "0.150" },
      { name: "range_max", type: "float32", sample: () => "12.000" },
      {
        name: "ranges[360]",
        type: "float32[]",
        note: "inf quand aucun écho",
        sample: (t) =>
          `[${f(2.1 + wave(t, 0.4, 30), 2)}, ${f(2.3 + wave(t, 0.4, 30, 1), 2)}, ${f(
            1.8 + wave(t, 0.3, 30, 2),
            2
          )}, inf, inf, …]`
      }
    ]
  },
  {
    name: "sensor_msgs/msg/Imu",
    pkg: "sensor_msgs",
    purpose: "Orientation, vitesse angulaire et accélération linéaire",
    typicalHz: 100,
    fields: [
      { name: "header.frame_id", type: "string", sample: () => "imu_link" },
      { name: "orientation.z", type: "float64", sample: (t) => f(wave(t, 0.25, 90)) },
      { name: "orientation.w", type: "float64", sample: (t) => f(1 - Math.abs(wave(t, 0.03, 90))) },
      { name: "angular_velocity.z", type: "float64", note: "rad/s", sample: (t) => f(wave(t, 0.42, 25)) },
      { name: "linear_acceleration.x", type: "float64", note: "m/s²", sample: (t) => f(wave(t, 0.35, 12)) },
      { name: "linear_acceleration.z", type: "float64", note: "gravité incluse", sample: (t) => f(9.807 + wave(t, 0.05, 8)) }
    ]
  },
  {
    name: "sensor_msgs/msg/Image",
    pkg: "sensor_msgs",
    purpose: "Image brute non compressée — attention au débit",
    typicalHz: 30,
    fields: [
      { name: "header.frame_id", type: "string", sample: () => "camera_link" },
      { name: "height", type: "uint32", sample: () => "480" },
      { name: "width", type: "uint32", sample: () => "640" },
      { name: "encoding", type: "string", sample: () => "bgr8" },
      { name: "step", type: "uint32", sample: () => "1920" },
      { name: "data", type: "uint8[]", note: "921 600 octets par image", sample: () => "<921600 octets>" }
    ]
  },
  {
    name: "sensor_msgs/msg/PointCloud2",
    pkg: "sensor_msgs",
    purpose: "Nuage de points 3D — le message le plus lourd de ROS 2",
    typicalHz: 15,
    fields: [
      { name: "header.frame_id", type: "string", sample: () => "camera_depth_frame" },
      { name: "height", type: "uint32", sample: () => "1" },
      { name: "width", type: "uint32", sample: (t) => `${180000 + Math.round(wave(t, 12000, 40))}` },
      { name: "point_step", type: "uint32", sample: () => "16" },
      { name: "is_dense", type: "bool", sample: () => "false" },
      { name: "data", type: "uint8[]", sample: () => "<2,9 Mo>" }
    ]
  },
  {
    name: "sensor_msgs/msg/JointState",
    pkg: "sensor_msgs",
    purpose: "Position, vitesse et effort de chaque articulation",
    typicalHz: 50,
    fields: [
      { name: "name", type: "string[]", sample: () => "['wheel_left_joint', 'wheel_right_joint']" },
      { name: "position", type: "float64[]", sample: (t) => `[${f(t * 0.09)}, ${f(t * 0.087)}]` },
      { name: "velocity", type: "float64[]", sample: (t) => `[${f(2.1 + wave(t, 0.2, 20))}, ${f(2.0 + wave(t, 0.2, 20, 1))}]` },
      { name: "effort", type: "float64[]", sample: () => "[]" }
    ]
  },
  {
    name: "sensor_msgs/msg/BatteryState",
    pkg: "sensor_msgs",
    purpose: "État de la batterie — permet le retour à la base avant la panne",
    typicalHz: 1,
    fields: [
      { name: "voltage", type: "float32", note: "V", sample: (t) => f(11.9 - t * 0.0015, 2) },
      { name: "current", type: "float32", note: "A, négatif en décharge", sample: (t) => f(-2.1 + wave(t, 0.6, 15), 2) },
      { name: "percentage", type: "float32", note: "0 à 1", sample: (t) => f(Math.max(0, 0.86 - t * 0.0004), 3) },
      { name: "power_supply_status", type: "uint8", sample: () => "2 (DISCHARGING)" }
    ]
  },
  {
    name: "sensor_msgs/msg/Range",
    pkg: "sensor_msgs",
    purpose: "Distance mesurée par un capteur ponctuel : ultrason, ToF",
    typicalHz: 20,
    fields: [
      { name: "radiation_type", type: "uint8", sample: () => "0 (ULTRASOUND)" },
      { name: "field_of_view", type: "float32", sample: () => "0.523599" },
      { name: "min_range", type: "float32", sample: () => "0.020" },
      { name: "max_range", type: "float32", sample: () => "4.000" },
      { name: "range", type: "float32", sample: (t) => f(0.9 + wave(t, 0.35, 22)) }
    ]
  },
  {
    name: "sensor_msgs/msg/NavSatFix",
    pkg: "sensor_msgs",
    purpose: "Position GNSS en latitude, longitude, altitude",
    typicalHz: 5,
    fields: [
      { name: "status.status", type: "int8", sample: () => "0 (STATUS_FIX)" },
      { name: "latitude", type: "float64", sample: (t) => f(48.85837 + t * 0.0000012, 7) },
      { name: "longitude", type: "float64", sample: (t) => f(2.294481 + t * 0.0000009, 7) },
      { name: "altitude", type: "float64", sample: (t) => f(35.2 + wave(t, 0.8, 30), 1) }
    ]
  },
  {
    name: "tf2_msgs/msg/TFMessage",
    pkg: "tf2_msgs",
    purpose: "Transformations entre repères, publiées en continu",
    typicalHz: 50,
    fields: [
      { name: "transforms[0].header.frame_id", type: "string", sample: () => "odom" },
      { name: "transforms[0].child_frame_id", type: "string", sample: () => "base_link" },
      { name: "transforms[0].transform.translation.x", type: "float64", sample: (t) => f(t * 0.012) },
      { name: "transforms[0].transform.rotation.w", type: "float64", sample: (t) => f(1 - Math.abs(wave(t, 0.02, 120))) }
    ]
  },
  {
    name: "nav_msgs/msg/OccupancyGrid",
    pkg: "nav_msgs",
    purpose: "Carte d'occupation produite par le SLAM",
    typicalHz: 1,
    fields: [
      { name: "info.resolution", type: "float32", sample: () => "0.050" },
      { name: "info.width", type: "uint32", sample: () => "384" },
      { name: "info.height", type: "uint32", sample: () => "384" },
      { name: "info.origin.position.x", type: "float64", sample: () => "-8.200" },
      { name: "data", type: "int8[]", note: "-1 inconnu, 0 libre, 100 occupé", sample: () => "[-1, -1, 0, 0, 100, …]" }
    ]
  },
  {
    name: "nav_msgs/msg/Path",
    pkg: "nav_msgs",
    purpose: "Chemin planifié, une suite de poses",
    typicalHz: 1,
    fields: [
      { name: "header.frame_id", type: "string", sample: () => "map" },
      { name: "poses", type: "PoseStamped[]", sample: (t) => `<${40 + Math.round(wave(t, 10, 20))} poses>` }
    ]
  },
  {
    name: "geometry_msgs/msg/PoseStamped",
    pkg: "geometry_msgs",
    purpose: "Une pose horodatée dans un repère donné — objectif de navigation",
    typicalHz: 1,
    fields: [
      { name: "header.frame_id", type: "string", sample: () => "map" },
      { name: "pose.position.x", type: "float64", sample: () => "2.400" },
      { name: "pose.position.y", type: "float64", sample: () => "1.100" },
      { name: "pose.orientation.w", type: "float64", sample: () => "1.000" }
    ]
  },
  {
    name: "std_msgs/msg/String",
    pkg: "std_msgs",
    purpose: "Chaîne de caractères — utile pour les démos et le débogage",
    typicalHz: 1,
    fields: [{ name: "data", type: "string", sample: (t) => `"Hello World: ${t}"` }]
  },
  {
    name: "std_msgs/msg/Bool",
    pkg: "std_msgs",
    purpose: "Booléen — état d'un contact, arrêt d'urgence",
    typicalHz: 10,
    fields: [{ name: "data", type: "bool", sample: (t) => (t % 40 < 30 ? "false" : "true") }]
  }
];

const BY_NAME = new Map(MSG_TYPES.map((m) => [m.name, m]));

export function getMsgType(name: string): MsgType | undefined {
  return BY_NAME.get(name);
}

/** Format court utilisé dans l'interface : sensor_msgs/LaserScan */
export function shortName(full: string): string {
  return full.replace("/msg/", "/");
}

/** Génère un bloc `ros2 topic echo` plausible pour un type donné. */
export function sampleEcho(name: string, tick: number): string[] {
  const m = BY_NAME.get(name);
  if (!m) return ["<type inconnu>"];
  const lines = [
    `header:`,
    `  stamp: {sec: ${1735142400 + Math.floor(tick / 10)}, nanosec: ${(tick % 10) * 100000000}}`
  ];
  for (const field of m.fields) {
    if (field.name.startsWith("header.")) {
      lines.push(`  ${field.name.replace("header.", "")}: ${field.sample(tick)}`);
    } else {
      lines.push(`${field.name}: ${field.sample(tick)}`);
    }
  }
  lines.push("---");
  return lines;
}
