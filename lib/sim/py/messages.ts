/* ══════════════════════════════════════════════════════════════
   Les paquets d'interfaces ROS 2, en Python.

   Les chemins d'import sont ceux du vrai ROS 2
   (`from geometry_msgs.msg import Twist`) et les champs portent
   les vrais noms, ceux de `content/msgs.ts`. Un fichier écrit ici
   s'importe sans modification sur un robot réel.

   La seule liberté prise : les messages refusent qu'on leur pose
   un champ qui n'existe pas, avec un message d'erreur explicite.
   Le vrai rclpy lève aussi une AttributeError, mais plus sèche.
   ══════════════════════════════════════════════════════════════ */

export const FICHIERS_MESSAGES: Record<string, string> = {
  "builtin_interfaces/__init__.py": "",
  "builtin_interfaces/msg/__init__.py": `from _livretv.core import Message


class Time(Message):
    _TYPE = 'builtin_interfaces/msg/Time'
    _FIELDS = (('sec', 0), ('nanosec', 0))


class Duration(Message):
    _TYPE = 'builtin_interfaces/msg/Duration'
    _FIELDS = (('sec', 0), ('nanosec', 0))
`,

  "std_msgs/__init__.py": "",
  "std_msgs/msg/__init__.py": `from _livretv.core import Message
from builtin_interfaces.msg import Time


class Header(Message):
    _TYPE = 'std_msgs/msg/Header'
    _FIELDS = (('stamp', Time), ('frame_id', ''))


class String(Message):
    _TYPE = 'std_msgs/msg/String'
    _FIELDS = (('data', ''),)


class Bool(Message):
    _TYPE = 'std_msgs/msg/Bool'
    _FIELDS = (('data', False),)


class Int32(Message):
    _TYPE = 'std_msgs/msg/Int32'
    _FIELDS = (('data', 0),)


class Float32(Message):
    _TYPE = 'std_msgs/msg/Float32'
    _FIELDS = (('data', 0.0),)


class Float64(Message):
    _TYPE = 'std_msgs/msg/Float64'
    _FIELDS = (('data', 0.0),)


class Empty(Message):
    _TYPE = 'std_msgs/msg/Empty'
    _FIELDS = ()
`,

  "geometry_msgs/__init__.py": "",
  "geometry_msgs/msg/__init__.py": `from _livretv.core import Message
from std_msgs.msg import Header


class Vector3(Message):
    _TYPE = 'geometry_msgs/msg/Vector3'
    _FIELDS = (('x', 0.0), ('y', 0.0), ('z', 0.0))


class Point(Message):
    _TYPE = 'geometry_msgs/msg/Point'
    _FIELDS = (('x', 0.0), ('y', 0.0), ('z', 0.0))


class Quaternion(Message):
    _TYPE = 'geometry_msgs/msg/Quaternion'
    _FIELDS = (('x', 0.0), ('y', 0.0), ('z', 0.0), ('w', 1.0))


class Twist(Message):
    _TYPE = 'geometry_msgs/msg/Twist'
    _FIELDS = (('linear', Vector3), ('angular', Vector3))


class TwistWithCovariance(Message):
    _TYPE = 'geometry_msgs/msg/TwistWithCovariance'
    _FIELDS = (('twist', Twist), ('covariance', lambda: [0.0] * 36))


class Pose(Message):
    _TYPE = 'geometry_msgs/msg/Pose'
    _FIELDS = (('position', Point), ('orientation', Quaternion))


class PoseWithCovariance(Message):
    _TYPE = 'geometry_msgs/msg/PoseWithCovariance'
    _FIELDS = (('pose', Pose), ('covariance', lambda: [0.0] * 36))


class PoseStamped(Message):
    _TYPE = 'geometry_msgs/msg/PoseStamped'
    _FIELDS = (('header', Header), ('pose', Pose))


class TwistStamped(Message):
    _TYPE = 'geometry_msgs/msg/TwistStamped'
    _FIELDS = (('header', Header), ('twist', Twist))
`,

  "sensor_msgs/__init__.py": "",
  "sensor_msgs/msg/__init__.py": `from _livretv.core import Message
from std_msgs.msg import Header
from geometry_msgs.msg import Quaternion, Vector3


class LaserScan(Message):
    """Télémétrie laser 2D.

    Convention retenue, celle de la plupart des LiDAR 360 :
    angle_min vaut -pi, angle_increment vaut 2*pi/360. L'indice 0
    regarde donc vers l'arrière et l'indice 180 droit devant.
    Une mesure hors portée vaut float('inf'), jamais 0.
    """

    _TYPE = 'sensor_msgs/msg/LaserScan'
    _FIELDS = (
        ('header', Header),
        ('angle_min', 0.0),
        ('angle_max', 0.0),
        ('angle_increment', 0.0),
        ('time_increment', 0.0),
        ('scan_time', 0.0),
        ('range_min', 0.0),
        ('range_max', 0.0),
        ('ranges', list),
        ('intensities', list),
    )


class Imu(Message):
    _TYPE = 'sensor_msgs/msg/Imu'
    _FIELDS = (
        ('header', Header),
        ('orientation', Quaternion),
        ('orientation_covariance', lambda: [0.0] * 9),
        ('angular_velocity', Vector3),
        ('angular_velocity_covariance', lambda: [0.0] * 9),
        ('linear_acceleration', Vector3),
        ('linear_acceleration_covariance', lambda: [0.0] * 9),
    )


class JointState(Message):
    _TYPE = 'sensor_msgs/msg/JointState'
    _FIELDS = (
        ('header', Header),
        ('name', list),
        ('position', list),
        ('velocity', list),
        ('effort', list),
    )


class Range(Message):
    _TYPE = 'sensor_msgs/msg/Range'
    _FIELDS = (
        ('header', Header),
        ('radiation_type', 0),
        ('field_of_view', 0.0),
        ('min_range', 0.0),
        ('max_range', 0.0),
        ('range', 0.0),
    )


class BatteryState(Message):
    _TYPE = 'sensor_msgs/msg/BatteryState'
    _FIELDS = (
        ('header', Header),
        ('voltage', 0.0),
        ('current', 0.0),
        ('percentage', 0.0),
    )
`,

  "nav_msgs/__init__.py": "",
  "nav_msgs/msg/__init__.py": `from _livretv.core import Message
from std_msgs.msg import Header
from geometry_msgs.msg import PoseWithCovariance, TwistWithCovariance


class Odometry(Message):
    _TYPE = 'nav_msgs/msg/Odometry'
    _FIELDS = (
        ('header', Header),
        ('child_frame_id', ''),
        ('pose', PoseWithCovariance),
        ('twist', TwistWithCovariance),
    )
`,

  "std_srvs/__init__.py": "",
  "std_srvs/srv/__init__.py": `from _livretv.core import Message


class _TriggerRequest(Message):
    _TYPE = 'std_srvs/srv/Trigger_Request'
    _FIELDS = ()


class _TriggerResponse(Message):
    _TYPE = 'std_srvs/srv/Trigger_Response'
    _FIELDS = (('success', False), ('message', ''))


class Trigger:
    _TYPE = 'std_srvs/srv/Trigger'
    Request = _TriggerRequest
    Response = _TriggerResponse


class _SetBoolRequest(Message):
    _TYPE = 'std_srvs/srv/SetBool_Request'
    _FIELDS = (('data', False),)


class _SetBoolResponse(Message):
    _TYPE = 'std_srvs/srv/SetBool_Response'
    _FIELDS = (('success', False), ('message', ''))


class SetBool:
    _TYPE = 'std_srvs/srv/SetBool'
    Request = _SetBoolRequest
    Response = _SetBoolResponse
`
};
