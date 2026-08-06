/* ══════════════════════════════════════════════════════════════
   Le paquet `rclpy`, tel qu'on l'importe sur un vrai robot.

   Ce n'est pas une imitation approximative : les noms, les
   signatures et les comportements sont ceux de rclpy. Le code que
   tu écris ici se dépose sur un Raspberry Pi sans une virgule de
   changement.

   Une seule mécanique diffère, et elle est visible dans le code
   ci-dessous plutôt que cachée : `rclpy.spin()` rend la main au
   simulateur au lieu de bloquer, et les `destroy_node()` /
   `shutdown()` qui suivent sont exécutés à la fin du run. L'ordre
   des opérations vécu par ton nœud reste donc celui du vrai ROS 2.
   ══════════════════════════════════════════════════════════════ */

export const FICHIERS_RCLPY: Record<string, string> = {
  "_livretv/__init__.py": "",

  "_livretv/core.py": `"""Runtime interne du simulateur.

Rien ici n'est destine a etre importe par ton code : passe par
rclpy et par les paquets de messages. Ce fichier n'est pas cache
pour autant — il n'y a aucune raison de te dissimuler comment le
simulateur fonctionne.
"""

import json
import sys
import traceback
import types as _types

import _pont

INF = float('inf')
FICHIER = 'mon_noeud.py'

_SENTINELLES = {'__inf__': INF, '__ninf__': -INF, '__nan__': float('nan')}

# Registre des types de messages, rempli par __init_subclass__.
TYPES = {}


def encoder(o):
    """JSON n'a pas d'infini. On le remplace par une sentinelle
    plutot que par 0, qui ferait croire a un obstacle colle au
    capteur — l'erreur classique quand on bricole un LiDAR."""
    if isinstance(o, float):
        if o != o:
            return '__nan__'
        if o == INF:
            return '__inf__'
        if o == -INF:
            return '__ninf__'
        return o
    if isinstance(o, dict):
        return dict((k, encoder(v)) for k, v in o.items())
    if isinstance(o, (list, tuple)):
        return [encoder(v) for v in o]
    return o


def decoder(o):
    if isinstance(o, str):
        return _SENTINELLES.get(o, o)
    if isinstance(o, dict):
        return dict((k, decoder(v)) for k, v in o.items())
    if isinstance(o, list):
        return [decoder(v) for v in o]
    return o


class Message(object):
    """Base des messages ROS 2.

    Un message refuse qu'on lui pose un champ inexistant. C'est le
    comportement du vrai rclpy, avec un message d'erreur plus
    bavard : 'msg.linear_x = 0.2' au lieu de 'msg.linear.x = 0.2'
    est l'erreur la plus frequente des premiers jours.
    """

    _TYPE = ''
    _FIELDS = ()
    _NOMS = frozenset()

    def __init_subclass__(cls, **kw):
        super().__init_subclass__(**kw)
        cls._NOMS = frozenset(n for n, _ in cls._FIELDS)
        if cls._TYPE:
            TYPES[cls._TYPE] = cls

    def __init__(self, **kwargs):
        for nom, defaut in self._FIELDS:
            object.__setattr__(self, nom, defaut() if callable(defaut) else defaut)
        for k, v in kwargs.items():
            setattr(self, k, v)

    def __setattr__(self, nom, valeur):
        if nom not in self._NOMS:
            dispo = ', '.join(n for n, _ in self._FIELDS) or 'aucun'
            raise AttributeError(
                "%s n'a pas de champ '%s'. Champs disponibles : %s"
                % (self._TYPE or type(self).__name__, nom, dispo))
        object.__setattr__(self, nom, valeur)

    def to_dict(self):
        out = {}
        for nom, _ in self._FIELDS:
            v = getattr(self, nom)
            out[nom] = v.to_dict() if isinstance(v, Message) else v
        return out

    @classmethod
    def from_dict(cls, d):
        m = cls()
        for nom, _ in cls._FIELDS:
            if nom not in d:
                continue
            v = d[nom]
            actuel = getattr(m, nom)
            if isinstance(actuel, Message) and isinstance(v, dict):
                object.__setattr__(m, nom, type(actuel).from_dict(v))
            else:
                object.__setattr__(m, nom, v)
        return m

    def __repr__(self):
        bouts = []
        for nom, _ in self._FIELDS:
            v = getattr(self, nom)
            if isinstance(v, list) and len(v) > 6:
                v = '[%s, ... %d valeurs]' % (
                    ', '.join(repr(x) for x in v[:4]), len(v))
                bouts.append('%s=%s' % (nom, v))
            else:
                bouts.append('%s=%r' % (nom, v))
        court = self._TYPE.split('/')[-1] or type(self).__name__
        return '%s(%s)' % (court, ', '.join(bouts))


class Journal(object):
    """Ce que renvoie node.get_logger()."""

    def __init__(self, nom):
        self._nom = nom

    def info(self, texte, **kw):
        _pont.log(self._nom, 'info', str(texte))

    def warn(self, texte, **kw):
        _pont.log(self._nom, 'warn', str(texte))

    warning = warn

    def error(self, texte, **kw):
        _pont.log(self._nom, 'error', str(texte))

    def fatal(self, texte, **kw):
        _pont.log(self._nom, 'error', str(texte))

    def debug(self, texte, **kw):
        _pont.log(self._nom, 'debug', str(texte))


class Timer(object):
    def __init__(self, periode, callback, node):
        self.timer_period_ns = int(float(periode) * 1e9)
        self.periode = max(1e-3, float(periode))
        self.callback = callback
        self.node = node
        self.annule = False
        self.prochain = _pont.now() + self.periode

    def cancel(self):
        self.annule = True

    def reset(self):
        self.annule = False
        self.prochain = _pont.now() + self.periode

    def is_canceled(self):
        return self.annule

    def is_ready(self):
        return not self.annule and self.prochain <= _pont.now()


def formater(exc):
    lignes = traceback.format_exception(type(exc), exc, exc.__traceback__)
    # On retire les cadres du simulateur : l'eleve n'a pas a lire la
    # pile de rclpy pour comprendre sa propre faute de frappe.
    gardees = [l for l in lignes if '/lib/livretv/' not in l]
    return ''.join(gardees if len(gardees) > 1 else lignes)


def ligne_fautive(exc):
    if isinstance(exc, SyntaxError) and exc.filename == FICHIER:
        return exc.lineno
    n = None
    tb = exc.__traceback__
    while tb is not None:
        if tb.tb_frame.f_code.co_filename == FICHIER:
            n = tb.tb_lineno
        tb = tb.tb_next
    return n


class Moteur(object):
    """L'executeur. Il tient les nodes, les timers et les callbacks."""

    def __init__(self):
        self.reinit()

    def reinit(self):
        self.initialise = False
        self.arrete = False
        self.nodes = []
        self.cbs = {}
        self.srv_types = {}
        self.suivant = 1
        self.spin_appele = False
        self.differe = []
        self.timers = []
        self.parametres = {}
        self.erreur = None
        self.ligne = None

    # -- cycle de vie --

    def init(self, args=None):
        self.initialise = True
        self.arrete = False

    def ok(self):
        return self.initialise and not self.arrete

    def shutdown(self):
        if self.spin_appele:
            self.differe.append(('shutdown', None))
            return
        self.arrete = True

    def spin(self, node):
        if node is not None and not any(n is node for n in self.nodes):
            self.nodes.append(node)
        self.spin_appele = True

    def declarer_node(self, node):
        if not any(n is node for n in self.nodes):
            self.nodes.append(node)

    def detruire(self, node):
        if self.spin_appele:
            self.differe.append(('destroy', node))
            return
        self._detruire(node)

    def _detruire(self, node):
        self.nodes = [n for n in self.nodes if n is not node]
        self.timers = [t for t in self.timers if t.node is not node]

    def finaliser(self):
        for quoi, arg in self.differe:
            if quoi == 'destroy':
                self._detruire(arg)
            else:
                self.arrete = True
        self.differe = []

    # -- enregistrements --

    def enregistrer(self, fn):
        i = self.suivant
        self.suivant += 1
        self.cbs[i] = fn
        return i

    def ajouter_timer(self, t):
        self.timers.append(t)

    # -- boucle --

    def pas(self, t):
        if self.erreur is not None:
            return
        try:
            self._livrer()
            self._echus(t)
            self._services()
        except Exception as exc:
            self.erreur = formater(exc)
            self.ligne = ligne_fautive(exc)

    def _livrer(self):
        brut = _pont.harvest()
        if not brut or brut == '[]':
            return
        for cb_id, type_name, charge in json.loads(brut):
            fn = self.cbs.get(cb_id)
            if fn is None:
                continue
            cls = TYPES.get(type_name)
            donnees = decoder(charge)
            fn(cls.from_dict(donnees) if cls is not None else donnees)

    def _echus(self, t):
        for tm in list(self.timers):
            if tm.annule:
                continue
            tours = 0
            # Le rattrapage est borne : si un callback met plus
            # longtemps que sa periode, on ne veut pas d'un effet
            # boule de neige.
            while tm.prochain <= t + 1e-9 and tours < 4:
                tm.prochain += tm.periode
                tours += 1
                tm.callback()

    def _services(self):
        brut = _pont.srv_pending()
        if not brut or brut == '[]':
            return
        for appel, cb_id, req in json.loads(brut):
            fn = self.cbs.get(cb_id)
            srv = self.srv_types.get(cb_id)
            if fn is None or srv is None:
                continue
            requete = srv.Request.from_dict(decoder(req))
            reponse = srv.Response()
            sortie = fn(requete, reponse)
            if sortie is None:
                sortie = reponse
            _pont.srv_reply(appel, json.dumps(encoder(sortie.to_dict())))


MOTEUR = Moteur()


def executer(source):
    """Compile puis execute le script, dans un module nomme __main__
    afin que le 'if __name__ == "__main__"' habituel se declenche."""
    MOTEUR.reinit()
    mod = _types.ModuleType('__main__')
    mod.__dict__['__name__'] = '__main__'
    mod.__dict__['__file__'] = FICHIER
    sys.modules['__main__'] = mod
    try:
        code = compile(source, FICHIER, 'exec')
        exec(code, mod.__dict__)
    except BaseException as exc:
        return json.dumps({
            'ok': False,
            'message': formater(exc),
            'ligne': ligne_fautive(exc),
        })
    return json.dumps({'ok': True, 'spin': MOTEUR.spin_appele})


def pas(t):
    MOTEUR.pas(t)
    if MOTEUR.erreur is not None:
        return json.dumps({'erreur': MOTEUR.erreur, 'ligne': MOTEUR.ligne})
    return ''


def instantane():
    def sur(v):
        try:
            json.dumps(v)
            return v
        except Exception:
            return repr(v)

    return json.dumps({
        'nodes': [
            {
                'name': n.get_name(),
                'timers': [round(t.periode, 4) for t in MOTEUR.timers if t.node is n],
            }
            for n in MOTEUR.nodes
        ],
        'parametres': dict((k, sur(v)) for k, v in MOTEUR.parametres.items()),
        'spin': MOTEUR.spin_appele,
        'erreur': MOTEUR.erreur,
    })


def finaliser():
    MOTEUR.finaliser()
`,

  "rclpy/__init__.py": `"""Client Python de ROS 2 — version simulee de LivretV.

Les fonctions de haut niveau sont celles du vrai rclpy.
"""

import _pont
from _livretv.core import MOTEUR as _M

from rclpy import node, qos, timer, duration, clock, parameter, publisher
from rclpy import subscription, service, client, executors, logging

__all__ = ['init', 'ok', 'shutdown', 'spin', 'spin_once', 'node', 'qos']


def init(args=None, context=None, **kwargs):
    _M.init(args)


def ok(context=None):
    return _M.ok()


def shutdown(context=None, **kwargs):
    _M.shutdown()


def spin(node, executor=None):
    """Sur un robot, spin() bloque jusqu'au Ctrl-C.

    Ici, elle confie le node au simulateur et rend la main : c'est
    la page qui cadence les pas de temps. Les lignes qui suivent
    dans ton main() — destroy_node(), shutdown() — sont differees
    jusqu'a la fin du run, exactement comme si spin() avait bloque.
    """
    _M.spin(node)


def spin_once(node, executor=None, timeout_sec=None):
    _M.spin(node)
    _M.pas(_pont.now())


def spin_until_future_complete(node, future, executor=None, timeout_sec=None):
    _M.spin(node)
`,

  "rclpy/logging.py": `from _livretv.core import Journal


def get_logger(nom):
    return Journal(nom)
`,

  "rclpy/qos.py": `from enum import IntEnum


class QoSReliabilityPolicy(IntEnum):
    SYSTEM_DEFAULT = 0
    RELIABLE = 1
    BEST_EFFORT = 2


class QoSDurabilityPolicy(IntEnum):
    SYSTEM_DEFAULT = 0
    TRANSIENT_LOCAL = 1
    VOLATILE = 2


class QoSHistoryPolicy(IntEnum):
    SYSTEM_DEFAULT = 0
    KEEP_LAST = 1
    KEEP_ALL = 2


# Alias courts, ceux qu'on lit dans la plupart des tutoriels.
ReliabilityPolicy = QoSReliabilityPolicy
DurabilityPolicy = QoSDurabilityPolicy
HistoryPolicy = QoSHistoryPolicy


class QoSProfile(object):
    def __init__(self, depth=10, history=QoSHistoryPolicy.KEEP_LAST,
                 reliability=QoSReliabilityPolicy.RELIABLE,
                 durability=QoSDurabilityPolicy.VOLATILE, **kwargs):
        self.depth = int(depth)
        self.history = history
        self.reliability = reliability
        self.durability = durability

    def codes(self):
        rel = ('BEST_EFFORT'
               if self.reliability == QoSReliabilityPolicy.BEST_EFFORT
               else 'RELIABLE')
        dur = ('TRANSIENT_LOCAL'
               if self.durability == QoSDurabilityPolicy.TRANSIENT_LOCAL
               else 'VOLATILE')
        return rel, dur, self.depth

    def __repr__(self):
        return 'QoSProfile(depth=%d, reliability=%s, durability=%s)' % (
            self.depth,
            QoSReliabilityPolicy(self.reliability).name,
            QoSDurabilityPolicy(self.durability).name)


# Le profil des capteurs : BEST_EFFORT, parce qu'un scan perime ne
# vaut pas la peine d'etre retransmis. C'est celui qu'utilisent les
# pilotes de LiDAR — et la source du piege le plus courant de ROS 2.
qos_profile_sensor_data = QoSProfile(
    depth=5,
    reliability=QoSReliabilityPolicy.BEST_EFFORT,
    durability=QoSDurabilityPolicy.VOLATILE)

qos_profile_system_default = QoSProfile(depth=10)
qos_profile_services_default = QoSProfile(depth=10)

qos_profile_parameters = QoSProfile(depth=1000)
`,

  "rclpy/duration.py": `class Duration(object):
    def __init__(self, seconds=0, nanoseconds=0):
        self.nanoseconds = int(float(seconds) * 1e9) + int(nanoseconds)

    def to_msg(self):
        from builtin_interfaces.msg import Duration as D
        m = D()
        m.sec = int(self.nanoseconds // 1000000000)
        m.nanosec = int(self.nanoseconds % 1000000000)
        return m

    def __repr__(self):
        return 'Duration(nanoseconds=%d)' % self.nanoseconds
`,

  "rclpy/clock.py": `import _pont
from rclpy.duration import Duration


class Time(object):
    def __init__(self, seconds=0, nanoseconds=0, clock_type=None):
        self.nanoseconds = int(float(seconds) * 1e9) + int(nanoseconds)

    def to_msg(self):
        from builtin_interfaces.msg import Time as T
        m = T()
        m.sec = int(self.nanoseconds // 1000000000)
        m.nanosec = int(self.nanoseconds % 1000000000)
        return m

    def __sub__(self, autre):
        return Duration(nanoseconds=self.nanoseconds - autre.nanoseconds)

    def __repr__(self):
        return 'Time(nanoseconds=%d)' % self.nanoseconds


class Clock(object):
    def now(self):
        return Time(seconds=_pont.now())
`,

  "rclpy/parameter.py": `class ParameterValue(object):
    def __init__(self, valeur):
        self._v = valeur

    @property
    def double_value(self):
        return float(self._v)

    @property
    def integer_value(self):
        return int(self._v)

    @property
    def string_value(self):
        return str(self._v)

    @property
    def bool_value(self):
        return bool(self._v)


class Parameter(object):
    class Type(object):
        BOOL = 1
        INTEGER = 2
        DOUBLE = 3
        STRING = 4

    def __init__(self, name, type_=None, value=None):
        self.name = name
        self.type_ = type_
        self.value = value

    def get_parameter_value(self):
        return ParameterValue(self.value)

    def __repr__(self):
        return 'Parameter(%r, value=%r)' % (self.name, self.value)
`,

  "rclpy/publisher.py": `import json

import _pont
from _livretv.core import encoder


class Publisher(object):
    def __init__(self, msg_type, topic, ident):
        self.msg_type = msg_type
        self.topic = topic
        self._id = ident

    def publish(self, msg):
        if not isinstance(msg, self.msg_type):
            raise TypeError(
                "publish() sur %s attend un %s, pas un %s."
                % (self.topic, self.msg_type.__name__, type(msg).__name__))
        _pont.emit(self._id, json.dumps(encoder(msg.to_dict())))

    def get_subscription_count(self):
        return int(_pont.sub_count(self.topic))

    def __repr__(self):
        return 'Publisher(%s)' % self.topic
`,

  "rclpy/subscription.py": `class Subscription(object):
    def __init__(self, msg_type, topic, callback, ident):
        self.msg_type = msg_type
        self.topic = topic
        self.callback = callback
        self._id = ident

    def __repr__(self):
        return 'Subscription(%s)' % self.topic
`,

  "rclpy/service.py": `class Service(object):
    def __init__(self, srv_type, srv_name, callback, ident):
        self.srv_type = srv_type
        self.srv_name = srv_name
        self.callback = callback
        self._id = ident


class Client(object):
    def __init__(self, srv_type, srv_name):
        self.srv_type = srv_type
        self.srv_name = srv_name

    def wait_for_service(self, timeout_sec=None):
        return True

    def service_is_ready(self):
        return True
`,

  "rclpy/client.py": `from rclpy.service import Client

__all__ = ['Client']
`,

  "rclpy/timer.py": `from _livretv.core import Timer

__all__ = ['Timer']
`,

  "rclpy/executors.py": `from _livretv.core import MOTEUR


class SingleThreadedExecutor(object):
    def add_node(self, node):
        MOTEUR.declarer_node(node)

    def spin(self):
        pass

    def spin_once(self, timeout_sec=None):
        pass

    def shutdown(self):
        pass


class MultiThreadedExecutor(SingleThreadedExecutor):
    def __init__(self, num_threads=None):
        pass
`,

  "rclpy/callback_groups.py": `class CallbackGroup(object):
    pass


class ReentrantCallbackGroup(CallbackGroup):
    pass


class MutuallyExclusiveCallbackGroup(CallbackGroup):
    pass
`,

  "rclpy/node.py": `import _pont
from _livretv.core import MOTEUR as _M, Journal, Timer
from rclpy.clock import Clock
from rclpy.parameter import Parameter
from rclpy.publisher import Publisher
from rclpy.qos import QoSProfile
from rclpy.service import Service, Client
from rclpy.subscription import Subscription


def _profil(qos):
    """rclpy accepte soit un QoSProfile, soit une simple profondeur
    de file. On accepte les deux, comme lui."""
    if isinstance(qos, QoSProfile):
        return qos
    return QoSProfile(depth=int(qos))


def _nom_type(t, quoi):
    nom = getattr(t, '_TYPE', None)
    if not nom:
        raise TypeError(
            "%s attend un type de message, par exemple Twist importe "
            "depuis geometry_msgs.msg — pas %r." % (quoi, t))
    return nom


def _topic(nom):
    return nom if nom.startswith('/') else '/' + nom


class Node(object):
    def __init__(self, node_name, *, context=None, namespace='',
                 parameter_overrides=None, **kwargs):
        self._name = str(node_name)
        self._namespace = namespace or ''
        self._logger = Journal(self._name)
        self._clock = Clock()
        self._publishers = []
        self._subscriptions = []
        self._timers = []
        self._services = []
        self._parametres = {}
        _M.declarer_node(self)
        _pont.node_new(self._name)

    # -- identite --

    def get_name(self):
        return self._name

    def get_namespace(self):
        return self._namespace or '/'

    def get_logger(self):
        return self._logger

    def get_clock(self):
        return self._clock

    # -- publication --

    def create_publisher(self, msg_type, topic, qos_profile=10, **kwargs):
        p = _profil(qos_profile)
        rel, dur, depth = p.codes()
        ident = _pont.pub_new(self._name, _topic(topic),
                              _nom_type(msg_type, 'create_publisher'),
                              rel, dur, depth)
        pub = Publisher(msg_type, _topic(topic), ident)
        self._publishers.append(pub)
        return pub

    def create_subscription(self, msg_type, topic, callback,
                            qos_profile=10, **kwargs):
        if not callable(callback):
            raise TypeError(
                "create_subscription attend une fonction en troisieme "
                "argument. Passe self.ma_fonction, sans les parentheses.")
        p = _profil(qos_profile)
        rel, dur, depth = p.codes()
        cb = _M.enregistrer(callback)
        ident = _pont.sub_new(self._name, _topic(topic),
                              _nom_type(msg_type, 'create_subscription'),
                              rel, dur, depth, cb)
        sub = Subscription(msg_type, _topic(topic), callback, ident)
        self._subscriptions.append(sub)
        return sub

    # -- temps --

    def create_timer(self, timer_period_sec, callback, callback_group=None,
                     **kwargs):
        if not callable(callback):
            raise TypeError(
                "create_timer attend une fonction en second argument. "
                "Passe self.ma_fonction, sans les parentheses.")
        t = Timer(timer_period_sec, callback, self)
        self._timers.append(t)
        _M.ajouter_timer(t)
        _pont.timer(self._name, float(timer_period_sec))
        return t

    def destroy_timer(self, timer):
        timer.cancel()

    # -- services --

    def create_service(self, srv_type, srv_name, callback, **kwargs):
        cb = _M.enregistrer(callback)
        _M.srv_types[cb] = srv_type
        ident = _pont.srv_new(self._name, _topic(srv_name),
                              getattr(srv_type, '_TYPE', '?'), cb)
        s = Service(srv_type, _topic(srv_name), callback, ident)
        self._services.append(s)
        return s

    def create_client(self, srv_type, srv_name, **kwargs):
        return Client(srv_type, _topic(srv_name))

    # -- parametres --

    def declare_parameter(self, name, value=None, descriptor=None):
        self._parametres[name] = value
        _M.parametres[name] = value
        return Parameter(name, value=value)

    def declare_parameters(self, namespace, parameters):
        out = []
        for entree in parameters:
            nom = entree[0]
            valeur = entree[1] if len(entree) > 1 else None
            out.append(self.declare_parameter(nom, valeur))
        return out

    def get_parameter(self, name):
        if name not in self._parametres:
            raise KeyError(
                "Le parametre '%s' n'a pas ete declare. Appelle "
                "self.declare_parameter('%s', valeur_par_defaut) dans "
                "__init__." % (name, name))
        return Parameter(name, value=self._parametres[name])

    def get_parameter_or(self, name, alternative=None):
        if name not in self._parametres:
            return alternative
        return Parameter(name, value=self._parametres[name])

    def set_parameters(self, parameters):
        for p in parameters:
            self._parametres[p.name] = p.value
            _M.parametres[p.name] = p.value
        return []

    # -- fin de vie --

    def destroy_node(self):
        _M.detruire(self)

    def __repr__(self):
        return 'Node(%s)' % self._name
`
};
