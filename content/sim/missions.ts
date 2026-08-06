import {
  aNode,
  aParametre,
  aServiceAppele,
  aTimer,
  arrete,
  chocs,
  derive,
  distanceA,
  journalContient,
  longeMur,
  parcouru,
  publie,
  qosAbonnement,
  recoit,
  zoneAtteinte
} from "@/lib/sim/objectifs";
import type { Mission } from "@/lib/sim/types";

/* ══════════════════════════════════════════════════════════════
   Les douze missions.

   Chacune est un fichier Python complet, pas un exercice à trous
   déguisé : le code de départ s'exécute sans erreur, il ne fait
   simplement pas encore ce qu'on lui demande. On lance, on regarde
   le robot ne rien faire, on corrige.

   Les objectifs interrogent la trace du run, jamais le texte du
   code. Deux solutions différentes qui produisent le même
   comportement passent toutes les deux — c'est la seule façon
   honnête de valider du code.
   ══════════════════════════════════════════════════════════════ */

export const MISSIONS: Mission[] = [
  /* ─────────────────────────── 1 ─────────────────────────── */
  {
    id: "premier-noeud",
    numero: 1,
    titre: "Ton premier nœud",
    resume: "Une classe, un journal, un battement de cœur.",
    difficulte: "Découverte",
    robot: "table",
    monde: "piste",
    duree: 8,
    enonce: [
      "Un nœud ROS 2 en Python, c'est une classe qui hérite de `Node`. Elle se déclare un nom, puis elle vit : elle publie, elle écoute, elle bat la mesure.",
      "Trois choses à faire ici. Annoncer le démarrage dans le journal. Créer un timer qui appelle `battement` toutes les secondes. Et surtout faire tourner le nœud — sans `rclpy.spin()`, ton objet existe en mémoire mais rien ne l'anime, et la console reste désespérément vide.",
      "C'est l'erreur la plus fréquente des premiers jours : un nœud parfaitement écrit qui ne fait rien, parce que personne ne l'a lancé."
    ],
    depart: `import rclpy
from rclpy.node import Node


class PremierNoeud(Node):
    """Un nœud ROS 2, c'est une classe qui hérite de Node."""

    def __init__(self):
        super().__init__('premier_noeud')
        self.compteur = 0

        # TODO 1 : annonce le démarrage dans le journal.
        #          self.get_logger().info('...')

        # TODO 2 : appelle self.battement toutes les secondes.
        #          self.create_timer(periode_en_secondes, fonction)

    def battement(self):
        self.compteur += 1
        self.get_logger().info('battement %d' % self.compteur)


def main(args=None):
    rclpy.init(args=args)
    node = PremierNoeud()

    # TODO 3 : fais tourner le nœud.

    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    solution: `import rclpy
from rclpy.node import Node


class PremierNoeud(Node):
    def __init__(self):
        super().__init__('premier_noeud')
        self.compteur = 0
        self.get_logger().info('premier_noeud démarré')
        self.create_timer(1.0, self.battement)

    def battement(self):
        self.compteur += 1
        self.get_logger().info('battement %d' % self.compteur)


def main(args=None):
    rclpy.init(args=args)
    node = PremierNoeud()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    indices: [
      "`self.get_logger().info('texte')` écrit une ligne dans la console. Le logger appartient au nœud : il porte son nom automatiquement.",
      "`self.create_timer(1.0, self.battement)` — attention, on passe `self.battement` sans parenthèses. Avec les parenthèses, Python appellerait la fonction tout de suite et passerait son résultat au timer.",
      "Dans `main`, entre la création du nœud et sa destruction : `rclpy.spin(node)`."
    ],
    objectifs: [
      {
        id: "node",
        label: "Un nœud nommé premier_noeud existe",
        aide: "La classe doit appeler super().__init__('premier_noeud').",
        test: (t) => aNode(t, "premier_noeud")
      },
      {
        id: "spin",
        label: "rclpy.spin() est appelé",
        aide: "Sans spin, le nœud existe mais rien ne le fait tourner.",
        test: (t) => t.spin
      },
      {
        id: "timer",
        label: "Un timer d'au plus une seconde est créé",
        test: (t) => aTimer(t, 1.05)
      },
      {
        id: "journal",
        label: "Au moins cinq lignes dans le journal",
        aide: "Le message de démarrage, puis un battement par seconde.",
        test: (t) => t.logs.length >= 5
      }
    ],
    concepts: [
      { label: "Nodes", href: "/academy/communication/nodes" },
      { label: "Premier package", href: "/academy/fondations/premier-package" }
    ],
    xp: 40
  },

  /* ─────────────────────────── 2 ─────────────────────────── */
  {
    id: "avancer",
    numero: 2,
    titre: "Faire avancer le robot",
    resume: "Un publisher, un Twist, et la première fois que ça bouge.",
    difficulte: "Découverte",
    robot: "table",
    monde: "piste",
    duree: 12,
    enonce: [
      "Sur un robot mobile, tout passe par un seul topic : `/cmd_vel`. On y publie un `geometry_msgs/msg/Twist`, qui contient une vitesse linéaire et une vitesse angulaire.",
      "Le piège classique : `Twist` est un message imbriqué. `msg.linear` est un `Vector3`, et c'est `msg.linear.x` qui porte la vitesse d'avance en mètres par seconde. Écrire `msg.linear_x` lève une erreur — le simulateur te le dira franchement.",
      "Publie 0,15 m/s dix fois par seconde. Un contrôleur qui publie une seule fois n'obtient rien : sur un vrai robot, la plupart des pilotes coupent les moteurs si la consigne cesse d'arriver."
    ],
    depart: `import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist


class Avance(Node):
    def __init__(self):
        super().__init__('avance')

        # TODO 1 : crée un publisher de Twist sur '/cmd_vel',
        #          avec une file de 10. Range-le dans self.pub.

        self.create_timer(0.1, self.boucle)

    def boucle(self):
        msg = Twist()

        # TODO 2 : demande 0.15 m/s vers l'avant.
        # TODO 3 : publie le message.

        pass


def main(args=None):
    rclpy.init(args=args)
    node = Avance()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    solution: `import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist


class Avance(Node):
    def __init__(self):
        super().__init__('avance')
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.create_timer(0.1, self.boucle)
        self.get_logger().info('en route')

    def boucle(self):
        msg = Twist()
        msg.linear.x = 0.15
        msg.angular.z = 0.0
        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = Avance()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    indices: [
      "`self.pub = self.create_publisher(Twist, '/cmd_vel', 10)` — le type d'abord, le topic ensuite, la profondeur de file en dernier.",
      "`msg.linear.x = 0.15`. Le point entre `linear` et `x` compte : `linear` est lui-même un message.",
      "`self.pub.publish(msg)` à la fin de la boucle."
    ],
    objectifs: [
      {
        id: "publie",
        label: "Publie sur /cmd_vel à au moins 5 Hz",
        aide: "Vérifie le nom du topic et que publish() est bien appelé dans le timer.",
        test: (t) => publie(t, "/cmd_vel", 5, 20)
      },
      {
        id: "bouge",
        label: "Le robot a parcouru au moins 1,2 m",
        aide: "Si le compteur reste à zéro, c'est linear.x qui vaut encore 0.",
        test: (t) => parcouru(t, 1.2)
      },
      { id: "propre", label: "Aucune collision", test: (t) => chocs(t, 0) }
    ],
    concepts: [
      { label: "Topics", href: "/academy/communication/topics" },
      { label: "Odométrie", href: "/academy/navigation/odometrie" }
    ],
    xp: 40
  },

  /* ─────────────────────────── 3 ─────────────────────────── */
  {
    id: "carre",
    numero: 3,
    titre: "Tracer un carré",
    resume: "Une machine à états minuscule, et le temps comme seul capteur.",
    difficulte: "Découverte",
    robot: "table",
    monde: "piste",
    duree: 30,
    enonce: [
      "Alterner quatre lignes droites et quatre quarts de tour. Sans capteur : uniquement le temps, compté dans le timer.",
      "Le calcul est simple. À 0,2 m/s pendant 3 secondes, le robot fait 60 cm. À 0,8 rad/s, un quart de tour (π/2 ≈ 1,571 rad) demande 1,96 seconde.",
      "Cette approche s'appelle la commande en boucle ouverte. Elle marche ici parce que le simulateur est docile. Sur un vrai robot elle dérive vite — c'est justement le sujet de la mission 10."
    ],
    depart: `import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist

PERIODE = 0.05
DUREE_COTE = 3.0
DUREE_TOURNANT = 1.963
VITESSE = 0.2
ROTATION = 0.8


class Carre(Node):
    def __init__(self):
        super().__init__('carre')
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.phase = 'avance'
        self.depuis = 0.0
        self.cotes = 0
        self.create_timer(PERIODE, self.boucle)

    def boucle(self):
        self.depuis += PERIODE
        msg = Twist()

        # TODO : en phase 'avance', imposer VITESSE puis, au bout de
        #        DUREE_COTE, passer en phase 'tourne' et remettre
        #        self.depuis à zéro.
        #        En phase 'tourne', imposer ROTATION puis, au bout de
        #        DUREE_TOURNANT, revenir en 'avance', remettre
        #        self.depuis à zéro et incrémenter self.cotes.
        #        Une fois les quatre côtés faits, ne plus rien demander.

        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = Carre()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    solution: `import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist

PERIODE = 0.05
DUREE_COTE = 3.0
DUREE_TOURNANT = 1.963
VITESSE = 0.2
ROTATION = 0.8


class Carre(Node):
    def __init__(self):
        super().__init__('carre')
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.phase = 'avance'
        self.depuis = 0.0
        self.cotes = 0
        self.create_timer(PERIODE, self.boucle)

    def boucle(self):
        self.depuis += PERIODE
        msg = Twist()

        if self.cotes >= 4:
            self.pub.publish(msg)
            return

        if self.phase == 'avance':
            msg.linear.x = VITESSE
            if self.depuis >= DUREE_COTE:
                self.phase = 'tourne'
                self.depuis = 0.0
        else:
            msg.angular.z = ROTATION
            if self.depuis >= DUREE_TOURNANT:
                self.phase = 'avance'
                self.depuis = 0.0
                self.cotes += 1
                self.get_logger().info('côté %d terminé' % self.cotes)

        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = Carre()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    indices: [
      "Deux branches suffisent : `if self.phase == 'avance': ... else: ...`.",
      "À chaque changement de phase, remets `self.depuis = 0.0`, sinon le compteur continue de courir et la phase suivante est tronquée.",
      "Pour arrêter à la fin : `if self.cotes >= 4:` publie un `Twist()` vide et sors de la fonction avec `return`."
    ],
    objectifs: [
      {
        id: "publie",
        label: "Publie sur /cmd_vel à au moins 10 Hz",
        test: (t) => publie(t, "/cmd_vel", 10, 100)
      },
      {
        id: "distance",
        label: "A parcouru au moins 2 m",
        test: (t) => parcouru(t, 2)
      },
      {
        id: "boucle",
        label: "Revenu à moins de 60 cm de son point de départ",
        aide: "Si le robot finit loin, une phase dure trop longtemps ou trop peu.",
        test: (t) => distanceA(t, -2.5, 0) <= 0.6
      },
      { id: "propre", label: "Aucune collision", test: (t) => chocs(t, 0) }
    ],
    concepts: [
      { label: "Topics", href: "/academy/communication/topics" },
      { label: "Comportements", href: "/academy/navigation/comportements" }
    ],
    xp: 60
  },

  /* ─────────────────────────── 4 ─────────────────────────── */
  {
    id: "odometrie",
    numero: 4,
    titre: "S'arrêter à deux mètres",
    resume: "Premier abonnement : lire /odom et fermer la boucle.",
    difficulte: "Intermédiaire",
    robot: "rover",
    monde: "piste",
    duree: 25,
    enonce: [
      "Jusqu'ici le robot avançait à l'aveugle. On passe en boucle fermée : il lit sa propre position sur `/odom` et décide quand s'arrêter.",
      "`nav_msgs/msg/Odometry` est profondément imbriqué. La position est en `msg.pose.pose.position.x` — deux `pose` d'affilée, ce n'est pas une faute de frappe : le premier porte la covariance, le second la pose elle-même.",
      "Le repère `odom` naît là où le robot démarre. La première mesure vaut donc zéro, et il suffit de comparer à cette origine. On prévoit quand même de la mémoriser : sur un vrai robot, ton nœud peut démarrer bien après le pilote de roues."
    ],
    depart: `import math

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from nav_msgs.msg import Odometry

OBJECTIF = 2.0
VITESSE = 0.3


class Metre(Node):
    def __init__(self):
        super().__init__('metre')
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)

        # TODO 1 : abonne-toi à '/odom' (type Odometry) avec une file
        #          de 10, et appelle self.on_odom à chaque message.

        self.origine = None
        self.distance = 0.0
        self.arrive = False
        self.create_timer(0.05, self.boucle)

    def on_odom(self, msg):
        p = msg.pose.pose.position
        if self.origine is None:
            self.origine = (p.x, p.y)

        # TODO 2 : mets à jour self.distance, la distance parcourue
        #          depuis self.origine. math.hypot(dx, dy) t'aide.

    def boucle(self):
        msg = Twist()

        # TODO 3 : avance tant que self.distance est inférieure à
        #          OBJECTIF moins une petite marge de freinage.
        #          Sinon, annonce l'arrivée une seule fois.

        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = Metre()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    solution: `import math

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from nav_msgs.msg import Odometry

OBJECTIF = 2.0
VITESSE = 0.3
MARGE = 0.07


class Metre(Node):
    def __init__(self):
        super().__init__('metre')
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.create_subscription(Odometry, '/odom', self.on_odom, 10)
        self.origine = None
        self.distance = 0.0
        self.arrive = False
        self.create_timer(0.05, self.boucle)

    def on_odom(self, msg):
        p = msg.pose.pose.position
        if self.origine is None:
            self.origine = (p.x, p.y)
        self.distance = math.hypot(p.x - self.origine[0], p.y - self.origine[1])

    def boucle(self):
        msg = Twist()
        if self.distance < OBJECTIF - MARGE:
            msg.linear.x = VITESSE
        elif not self.arrive:
            self.arrive = True
            self.get_logger().info('arrivé à %.3f m' % self.distance)
        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = Metre()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    indices: [
      "`self.create_subscription(Odometry, '/odom', self.on_odom, 10)`. Le callback reçoit le message en unique argument.",
      "`self.distance = math.hypot(p.x - self.origine[0], p.y - self.origine[1])`.",
      "Le robot ne s'arrête pas net : il lui faut une demi-seconde pour freiner. Coupe la consigne un peu avant les 2 m — sept centimètres suffisent."
    ],
    objectifs: [
      {
        id: "recoit",
        label: "Reçoit des messages sur /odom",
        aide: "Sans abonnement, le callback n'est jamais appelé.",
        test: (t) => recoit(t, "/odom", 100)
      },
      {
        id: "distance",
        label: "S'est arrêté entre 1,85 m et 2,20 m",
        aide: "Trop loin ? Anticipe le freinage. Trop court ? Réduis la marge.",
        test: (t) => t.etat.parcouru >= 1.85 && t.etat.parcouru <= 2.2
      },
      {
        id: "immobile",
        label: "Le robot est immobile à la fin",
        test: (t) => arrete(t)
      }
    ],
    concepts: [
      { label: "Odométrie", href: "/academy/navigation/odometrie" },
      { label: "Topics", href: "/academy/communication/topics" }
    ],
    xp: 60
  },

  /* ─────────────────────────── 5 ─────────────────────────── */
  {
    id: "qos",
    numero: 5,
    titre: "Le piège de la QoS",
    resume: "Un abonnement correct qui ne reçoit rien, et pas un mot d'erreur.",
    difficulte: "Intermédiaire",
    robot: "rover",
    monde: "salle",
    duree: 20,
    enonce: [
      "Lance le code de départ tel quel. Le nœud démarre, l'abonnement est créé, le topic `/scan` existe et le LiDAR publie à 10 Hz. Et pourtant ton callback n'est jamais appelé. Aucune erreur, aucun avertissement, rien.",
      "C'est DDS qui refuse la connexion. Le pilote de LiDAR publie en `BEST_EFFORT` : il ne retransmet pas un scan perdu, parce qu'un scan périmé ne vaut rien. Ton abonnement, lui, demande la valeur par défaut, `RELIABLE` — il exige des retransmissions. Le contrat est impossible, la liaison ne s'établit pas, et personne ne t'en informe.",
      "La règle tient en une phrase : un abonné ne peut jamais exiger plus que ce que le publieur offre. Pour les capteurs, ROS 2 fournit un profil tout prêt, `qos_profile_sensor_data`.",
      "Onglet « Topics » du panneau de droite : le simulateur affiche la raison exacte du refus."
    ],
    depart: `import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan


class Ecoute(Node):
    def __init__(self):
        super().__init__('ecoute')
        self.recus = 0

        # Cet abonnement a l'air parfait. Il ne recevra rien.
        # TODO : donne-lui le bon profil de QoS.
        self.create_subscription(LaserScan, '/scan', self.on_scan, 10)

    def on_scan(self, msg):
        self.recus += 1
        if self.recus % 10 == 1:
            milieu = len(msg.ranges) // 2
            devant = min(msg.ranges[milieu - 5:milieu + 6])
            self.get_logger().info(
                'devant : %.2f m (scan n°%d)' % (devant, self.recus))


def main(args=None):
    rclpy.init(args=args)
    node = Ecoute()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    solution: `import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from sensor_msgs.msg import LaserScan


class Ecoute(Node):
    def __init__(self):
        super().__init__('ecoute')
        self.recus = 0
        self.create_subscription(LaserScan, '/scan', self.on_scan,
                                 qos_profile_sensor_data)

    def on_scan(self, msg):
        self.recus += 1
        if self.recus % 10 == 1:
            milieu = len(msg.ranges) // 2
            devant = min(msg.ranges[milieu - 5:milieu + 6])
            self.get_logger().info(
                'devant : %.2f m (scan n°%d)' % (devant, self.recus))


def main(args=None):
    rclpy.init(args=args)
    node = Ecoute()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    indices: [
      "`from rclpy.qos import qos_profile_sensor_data`, puis passe-le en quatrième argument à la place du `10`.",
      "Si tu préfères le construire à la main : `QoSProfile(depth=5, reliability=ReliabilityPolicy.BEST_EFFORT)`.",
      "Souviens-toi du sens de la règle : c'est l'abonné qui doit s'abaisser au niveau du publieur, jamais l'inverse."
    ],
    objectifs: [
      {
        id: "recoit",
        label: "Le callback /scan est appelé",
        aide: "Tant que la QoS est incompatible, il ne le sera jamais.",
        test: (t) => recoit(t, "/scan", 50)
      },
      {
        id: "besteffort",
        label: "L'abonnement à /scan est en BEST_EFFORT",
        test: (t) => qosAbonnement(t, "/scan")?.reliability === "BEST_EFFORT"
      },
      {
        id: "mesure",
        label: "La distance devant le robot est affichée",
        test: (t) => journalContient(t, /devant/i)
      }
    ],
    concepts: [
      { label: "QoS et DDS", href: "/academy/communication/qos-dds" },
      { label: "Node Graph", href: "/lab/graph" }
    ],
    xp: 80
  },

  /* ─────────────────────────── 6 ─────────────────────────── */
  {
    id: "evitement",
    numero: 6,
    titre: "Éviter les obstacles",
    resume: "Le LiDAR devient un capteur de proximité.",
    difficulte: "Intermédiaire",
    robot: "rover",
    monde: "salle",
    duree: 60,
    enonce: [
      "Un `LaserScan` est un tableau de distances. `angle_min` vaut −π et l'incrément est d'un degré : l'indice 0 regarde derrière, l'indice 180 droit devant. Le milieu du tableau, c'est l'avant du robot.",
      "Les mesures hors portée valent `float('inf')`, jamais zéro. Un `min()` naïf sur un tableau plein d'infinis fonctionne, mais gare aux comparaisons : `inf > 0.8` est vrai, ce qui est justement ce qu'on veut.",
      "Écris le comportement le plus simple qui tienne : avancer tant que la voie est libre, tourner sur place vers le côté le plus dégagé sinon. Soixante secondes sans toucher un mur, et au moins six mètres au compteur.",
      "Un détail change tout : il faut deux seuils, pas un. Si le robot repart dès que la voie redevient tout juste libre, il retombe aussitôt sur l'obstacle et fait du surplace. On entre en rotation à une distance, on en sort à une distance plus grande — c'est ce qu'on appelle une hystérésis.",
      "Une fois que ça marche, change de robot dans le sélecteur. Le même code sur l'AMR : il pèse vingt-deux kilos et freine huit fois moins vite. Tu comprendras pourquoi un seuil de distance n'est jamais universel."
    ],
    depart: `import math

import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from geometry_msgs.msg import Twist
from sensor_msgs.msg import LaserScan

SEUIL = 0.9
VITESSE = 0.35
ROTATION = 0.9


def minimum(valeurs):
    """min() en ignorant les mesures hors portée."""
    finis = [v for v in valeurs if not math.isinf(v)]
    return min(finis) if finis else float('inf')


class Evitement(Node):
    def __init__(self):
        super().__init__('evitement')
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.create_subscription(LaserScan, '/scan', self.on_scan,
                                 qos_profile_sensor_data)
        self.avant = float('inf')
        self.gauche = float('inf')
        self.droite = float('inf')
        self.tourne = False
        self.sens = 1.0
        self.create_timer(0.05, self.boucle)

    def on_scan(self, msg):
        m = len(msg.ranges) // 2      # l'indice du milieu regarde devant

        # TODO 1 : self.avant  = cône de ±30° devant
        #          self.gauche = secteur +20° à +80°
        #          self.droite = secteur -80° à -20°
        #          Utilise minimum(msg.ranges[a:b]).

    def boucle(self):
        msg = Twist()

        # TODO 2 : quand self.avant passe sous SEUIL, entre en rotation
        #          (self.tourne = True) et fige le sens une bonne fois :
        #          self.sens = 1.0 vers la gauche, -1.0 vers la droite,
        #          selon le côté le plus dégagé.

        # TODO 3 : ne repars que lorsque self.avant dépasse SEUIL * 1.5.
        #          Sans cette marge, le robot repart trop tôt et se
        #          remet à tourner aussitôt : il fait du surplace.

        # TODO 4 : en rotation, ne demande que angular.z ;
        #          sinon, ne demande que linear.x.

        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = Evitement()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    solution: `import math

import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from geometry_msgs.msg import Twist
from sensor_msgs.msg import LaserScan

SEUIL = 0.9
VITESSE = 0.35
ROTATION = 0.9


def minimum(valeurs):
    finis = [v for v in valeurs if not math.isinf(v)]
    return min(finis) if finis else float('inf')


class Evitement(Node):
    def __init__(self):
        super().__init__('evitement')
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.create_subscription(LaserScan, '/scan', self.on_scan,
                                 qos_profile_sensor_data)
        self.avant = float('inf')
        self.gauche = float('inf')
        self.droite = float('inf')
        self.tourne = False
        self.sens = 1.0
        self.create_timer(0.05, self.boucle)

    def on_scan(self, msg):
        m = len(msg.ranges) // 2
        self.avant = minimum(msg.ranges[m - 30:m + 31])
        self.gauche = minimum(msg.ranges[m + 20:m + 81])
        self.droite = minimum(msg.ranges[m - 80:m - 19])

    def boucle(self):
        msg = Twist()

        if self.tourne:
            if self.avant > SEUIL * 1.5:
                self.tourne = False
        elif self.avant < SEUIL:
            self.tourne = True
            self.sens = 1.0 if self.gauche > self.droite else -1.0

        if self.tourne:
            msg.angular.z = ROTATION * self.sens
        else:
            msg.linear.x = VITESSE

        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = Evitement()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    indices: [
      "Les tranches Python fonctionnent comme partout : `msg.ranges[m - 30:m + 31]` prend les 61 rayons autour de l'avant.",
      "Quand un obstacle est détecté, mets `linear.x` à zéro et ne joue que sur `angular.z`. Tourner en avançant, c'est se jeter dans le mur en biais.",
      "Un booléen `self.tourne` suffit à tenir l'hystérésis : on le met à vrai sous `SEUIL`, on ne le remet à faux qu'au-dessus de `SEUIL * 1.5`.",
      "Fige le sens de rotation au moment où tu entres en rotation. S'il est recalculé à chaque cycle, le robot hésite entre gauche et droite et n'avance plus."
    ],
    objectifs: [
      {
        id: "scan",
        label: "Reçoit des scans",
        test: (t) => recoit(t, "/scan", 100)
      },
      {
        id: "publie",
        label: "Publie sur /cmd_vel à au moins 10 Hz",
        test: (t) => publie(t, "/cmd_vel", 10, 200)
      },
      {
        id: "propre",
        label: "Aucune collision en 60 secondes",
        aide: "Augmente le seuil, ou élargis le cône avant.",
        test: (t) => chocs(t, 0)
      },
      {
        id: "distance",
        label: "A parcouru au moins 6 m",
        aide: "Un robot qui tourne sur place sans jamais avancer ne compte pas.",
        test: (t) => parcouru(t, 6)
      }
    ],
    concepts: [
      { label: "Nuages de points", href: "/academy/perception/nuages-points" },
      { label: "Comportements", href: "/academy/navigation/comportements" }
    ],
    xp: 80
  },

  /* ─────────────────────────── 7 ─────────────────────────── */
  {
    id: "suivi-mur",
    numero: 7,
    titre: "Longer un mur",
    resume: "Premier correcteur proportionnel.",
    difficulte: "Intermédiaire",
    robot: "rover",
    monde: "salle",
    duree: 60,
    enonce: [
      "Éviter, c'est réagir. Longer, c'est régler. On veut maintenir une distance constante au mur de droite — ni collé, ni perdu au milieu de la pièce.",
      "Le principe du correcteur proportionnel tient en une ligne : erreur = consigne − mesure, puis commande = gain × erreur. Ici la commande est la vitesse de rotation.",
      "Attention aux signes. Si le mur de droite est plus loin que la consigne, l'erreur est négative, et il faut tourner à droite — donc `angular.z` négatif. Le gain se règle à la main : trop faible, le robot dérive ; trop fort, il oscille comme un pendule.",
      "Le cas du mur absent mérite d'être traité : quand la mesure vaut l'infini, borne-la, sinon l'erreur devient infinie et la commande n'a plus de sens."
    ],
    depart: `import math

import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from geometry_msgs.msg import Twist
from sensor_msgs.msg import LaserScan

CIBLE = 0.5      # distance visée au mur de droite, en mètres
KP = 1.8         # gain proportionnel
VITESSE = 0.3
SEUIL_AVANT = 0.7
PORTEE_UTILE = 2.5


def minimum(valeurs):
    finis = [v for v in valeurs if not math.isinf(v)]
    return min(finis) if finis else float('inf')


class SuiviMur(Node):
    def __init__(self):
        super().__init__('suivi_mur')
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.create_subscription(LaserScan, '/scan', self.on_scan,
                                 qos_profile_sensor_data)
        self.avant = float('inf')
        self.droite = float('inf')
        self.create_timer(0.05, self.boucle)

    def on_scan(self, msg):
        m = len(msg.ranges) // 2
        self.avant = minimum(msg.ranges[m - 25:m + 26])
        self.droite = minimum(msg.ranges[m - 100:m - 59])

    def boucle(self):
        msg = Twist()

        # TODO 1 : si self.avant est sous SEUIL_AVANT, tourne à gauche
        #          sur place — un mur devant prime sur tout le reste.

        # TODO 2 : sinon, borne self.droite à PORTEE_UTILE, calcule
        #          l'erreur CIBLE - mesure, avance à VITESSE et
        #          applique KP * erreur sur angular.z.
        #          Borne la rotation à ±1.2 rad/s.

        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = SuiviMur()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    solution: `import math

import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from geometry_msgs.msg import Twist
from sensor_msgs.msg import LaserScan

CIBLE = 0.5
KP = 1.8
VITESSE = 0.3
SEUIL_AVANT = 0.7
PORTEE_UTILE = 2.5
ROTATION_MAX = 1.2


def minimum(valeurs):
    finis = [v for v in valeurs if not math.isinf(v)]
    return min(finis) if finis else float('inf')


def borner(v, mini, maxi):
    return max(mini, min(maxi, v))


class SuiviMur(Node):
    def __init__(self):
        super().__init__('suivi_mur')
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.create_subscription(LaserScan, '/scan', self.on_scan,
                                 qos_profile_sensor_data)
        self.avant = float('inf')
        self.droite = float('inf')
        self.create_timer(0.05, self.boucle)

    def on_scan(self, msg):
        m = len(msg.ranges) // 2
        self.avant = minimum(msg.ranges[m - 25:m + 26])
        self.droite = minimum(msg.ranges[m - 100:m - 59])

    def boucle(self):
        msg = Twist()

        if self.avant < SEUIL_AVANT:
            msg.angular.z = 1.1
        else:
            mesure = min(self.droite, PORTEE_UTILE)
            erreur = CIBLE - mesure
            msg.linear.x = VITESSE
            msg.angular.z = borner(KP * erreur, -ROTATION_MAX, ROTATION_MAX)

        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = SuiviMur()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    indices: [
      "`mesure = min(self.droite, PORTEE_UTILE)` règle d'un coup le cas de l'infini et celui du mur trop lointain.",
      "`erreur = CIBLE - mesure`. Mur trop loin → erreur négative → `angular.z` négatif → le robot se rapproche du mur.",
      "Si le robot oscille, baisse `KP`. S'il s'éloigne sans jamais revenir, monte-le."
    ],
    objectifs: [
      {
        id: "publie",
        label: "Publie sur /cmd_vel à au moins 10 Hz",
        test: (t) => publie(t, "/cmd_vel", 10, 200)
      },
      {
        id: "longe",
        label: "A longé un mur pendant au moins 25 secondes",
        aide: "Longer, c'est rester entre 5 et 65 cm de la paroi.",
        test: (t) => longeMur(t, 25)
      },
      {
        id: "distance",
        label: "A parcouru au moins 8 m",
        test: (t) => parcouru(t, 8)
      },
      {
        id: "propre",
        label: "Au plus une collision",
        test: (t) => chocs(t, 1)
      }
    ],
    concepts: [
      { label: "Comportements", href: "/academy/navigation/comportements" },
      { label: "ros2_control", href: "/academy/embarque/ros2-control" }
    ],
    xp: 100
  },

  /* ─────────────────────────── 8 ─────────────────────────── */
  {
    id: "parametres",
    numero: 8,
    titre: "Régler sans recompiler",
    resume: "Les paramètres ROS 2, ou comment sortir les constantes du code.",
    difficulte: "Intermédiaire",
    robot: "rover",
    monde: "salle",
    duree: 45,
    enonce: [
      "Les constantes en tête de fichier sont commodes tant qu'on est seul devant son écran. Sur un robot déployé, changer un seuil ne doit pas demander de rouvrir le code, encore moins de recompiler.",
      "ROS 2 fournit les paramètres pour ça. On les déclare dans `__init__` avec une valeur par défaut, on les relit avec `get_parameter`. Ensuite ils se règlent depuis un fichier YAML, depuis la ligne de commande, ou à chaud avec `ros2 param set`.",
      "Reprends l'évitement de la mission 6, et sors-en deux réglages : la vitesse d'avance et la distance de freinage. Annonce leurs valeurs au démarrage — un nœud qui dit avec quoi il tourne fait gagner des heures de débogage."
    ],
    depart: `import math

import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from geometry_msgs.msg import Twist
from sensor_msgs.msg import LaserScan


def minimum(valeurs):
    finis = [v for v in valeurs if not math.isinf(v)]
    return min(finis) if finis else float('inf')


class Reglable(Node):
    def __init__(self):
        super().__init__('reglable')

        # TODO 1 : déclare deux paramètres,
        #          'vitesse_max' (0.35) et 'distance_arret' (0.9),
        #          puis relis-les dans self.vitesse et self.arret.
        #          self.declare_parameter(nom, defaut)
        #          self.get_parameter(nom).value

        # TODO 2 : annonce les deux valeurs dans le journal.

        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.create_subscription(LaserScan, '/scan', self.on_scan,
                                 qos_profile_sensor_data)
        self.avant = float('inf')
        self.gauche = float('inf')
        self.droite = float('inf')
        self.tourne = False
        self.sens = 1.0
        self.create_timer(0.05, self.boucle)

    def on_scan(self, msg):
        m = len(msg.ranges) // 2
        self.avant = minimum(msg.ranges[m - 30:m + 31])
        self.gauche = minimum(msg.ranges[m + 20:m + 81])
        self.droite = minimum(msg.ranges[m - 80:m - 19])

    def boucle(self):
        msg = Twist()

        # TODO 3 : même comportement qu'en mission 6, hystérésis
        #          comprise, mais en utilisant self.vitesse et
        #          self.arret à la place des constantes.

        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = Reglable()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    solution: `import math

import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from geometry_msgs.msg import Twist
from sensor_msgs.msg import LaserScan


def minimum(valeurs):
    finis = [v for v in valeurs if not math.isinf(v)]
    return min(finis) if finis else float('inf')


class Reglable(Node):
    def __init__(self):
        super().__init__('reglable')

        self.declare_parameter('vitesse_max', 0.35)
        self.declare_parameter('distance_arret', 0.9)
        self.vitesse = self.get_parameter('vitesse_max').value
        self.arret = self.get_parameter('distance_arret').value
        self.get_logger().info(
            'vitesse_max=%.2f m/s, distance_arret=%.2f m'
            % (self.vitesse, self.arret))

        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.create_subscription(LaserScan, '/scan', self.on_scan,
                                 qos_profile_sensor_data)
        self.avant = float('inf')
        self.gauche = float('inf')
        self.droite = float('inf')
        self.tourne = False
        self.sens = 1.0
        self.create_timer(0.05, self.boucle)

    def on_scan(self, msg):
        m = len(msg.ranges) // 2
        self.avant = minimum(msg.ranges[m - 30:m + 31])
        self.gauche = minimum(msg.ranges[m + 20:m + 81])
        self.droite = minimum(msg.ranges[m - 80:m - 19])

    def boucle(self):
        msg = Twist()

        if self.tourne:
            if self.avant > self.arret * 1.5:
                self.tourne = False
        elif self.avant < self.arret:
            self.tourne = True
            self.sens = 1.0 if self.gauche > self.droite else -1.0

        if self.tourne:
            msg.angular.z = 0.9 * self.sens
        else:
            msg.linear.x = self.vitesse

        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = Reglable()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    indices: [
      "`self.declare_parameter('vitesse_max', 0.35)` puis `self.get_parameter('vitesse_max').value`.",
      "Un paramètre non déclaré lève une erreur à la lecture : c'est volontaire, ROS 2 refuse les réglages fantômes.",
      "Déclare les paramètres tout au début de `__init__`, avant de créer publishers et timers."
    ],
    objectifs: [
      {
        id: "p1",
        label: "Le paramètre vitesse_max est déclaré",
        test: (t) => aParametre(t, "vitesse_max")
      },
      {
        id: "p2",
        label: "Le paramètre distance_arret est déclaré",
        test: (t) => aParametre(t, "distance_arret")
      },
      {
        id: "annonce",
        label: "Les valeurs sont annoncées au démarrage",
        test: (t) => journalContient(t, /vitesse_max/)
      },
      {
        id: "roule",
        label: "A parcouru au moins 5 m sans collision",
        test: (t) => parcouru(t, 5) && chocs(t, 0)
      }
    ],
    concepts: [
      { label: "Paramètres", href: "/academy/communication/parametres" },
      { label: "Déploiement", href: "/academy/embarque/deploiement" }
    ],
    xp: 80
  },

  /* ─────────────────────────── 9 ─────────────────────────── */
  {
    id: "etats",
    numero: 9,
    titre: "Traverser le couloir",
    resume: "Une machine à états lisible plutôt qu'une cascade de si.",
    difficulte: "Avancé",
    robot: "rover",
    monde: "couloir",
    duree: 60,
    enonce: [
      "Un couloir de 1,6 m avec un virage à angle droit vers la gauche. Le robot doit atteindre le fond, en passant par le virage.",
      "On pourrait empiler les conditions. On va plutôt écrire une vraie machine à états : trois états nommés, une transition par état, et une trace dans le journal à chaque changement. C'est ce qui rend un comportement débogable trois semaines plus tard.",
      "AVANCE tant que le mur du fond est loin. TOURNE de quatre-vingt-dix degrés à gauche quand il approche. AVANCE à nouveau, puis ARRÊT devant le fond du couloir.",
      "Pour la rotation, compte le temps plutôt que l'odométrie : à cette échelle c'est suffisant, et ça garde la mission centrée sur la structure du code."
    ],
    depart: `import math

import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from geometry_msgs.msg import Twist
from sensor_msgs.msg import LaserScan

PERIODE = 0.05
VITESSE = 0.35
ROTATION = 0.8
DUREE_QUART = 1.963      # pi/2 divisé par ROTATION
DISTANCE_VIRAGE = 1.0
DISTANCE_FIN = 0.8


def minimum(valeurs):
    finis = [v for v in valeurs if not math.isinf(v)]
    return min(finis) if finis else float('inf')


class Couloir(Node):
    def __init__(self):
        super().__init__('couloir')
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.create_subscription(LaserScan, '/scan', self.on_scan,
                                 qos_profile_sensor_data)
        self.avant = float('inf')
        self.etat = 'AVANCE'
        self.depuis = 0.0
        self.create_timer(PERIODE, self.boucle)

    def aller_a(self, etat):
        self.get_logger().info('état %s -> %s' % (self.etat, etat))
        self.etat = etat
        self.depuis = 0.0

    def on_scan(self, msg):
        m = len(msg.ranges) // 2
        self.avant = minimum(msg.ranges[m - 20:m + 21])

    def boucle(self):
        self.depuis += PERIODE
        msg = Twist()

        # TODO : trois états.
        #   'AVANCE'  : avance ; si self.avant < DISTANCE_VIRAGE,
        #               passe à 'TOURNE' via self.aller_a.
        #   'TOURNE'  : tourne à gauche ; après DUREE_QUART,
        #               passe à 'FINAL'.
        #   'FINAL'   : avance ; si self.avant < DISTANCE_FIN,
        #               passe à 'ARRET'.
        #   'ARRET'   : ne rien demander.

        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = Couloir()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    solution: `import math

import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from geometry_msgs.msg import Twist
from sensor_msgs.msg import LaserScan

PERIODE = 0.05
VITESSE = 0.35
ROTATION = 0.8
DUREE_QUART = 1.963
DISTANCE_VIRAGE = 1.0
DISTANCE_FIN = 0.8


def minimum(valeurs):
    finis = [v for v in valeurs if not math.isinf(v)]
    return min(finis) if finis else float('inf')


class Couloir(Node):
    def __init__(self):
        super().__init__('couloir')
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.create_subscription(LaserScan, '/scan', self.on_scan,
                                 qos_profile_sensor_data)
        self.avant = float('inf')
        self.etat = 'AVANCE'
        self.depuis = 0.0
        self.create_timer(PERIODE, self.boucle)

    def aller_a(self, etat):
        self.get_logger().info('état %s -> %s' % (self.etat, etat))
        self.etat = etat
        self.depuis = 0.0

    def on_scan(self, msg):
        m = len(msg.ranges) // 2
        self.avant = minimum(msg.ranges[m - 20:m + 21])

    def boucle(self):
        self.depuis += PERIODE
        msg = Twist()

        if self.etat == 'AVANCE':
            msg.linear.x = VITESSE
            if self.avant < DISTANCE_VIRAGE:
                self.aller_a('TOURNE')

        elif self.etat == 'TOURNE':
            msg.angular.z = ROTATION
            if self.depuis >= DUREE_QUART:
                self.aller_a('FINAL')

        elif self.etat == 'FINAL':
            msg.linear.x = VITESSE
            if self.avant < DISTANCE_FIN:
                self.aller_a('ARRET')

        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = Couloir()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    indices: [
      "Une suite de `if self.etat == '...' : ... elif ...` suffit. L'important est que chaque branche ne s'occupe que de son propre état.",
      "`self.aller_a('TOURNE')` fait tout d'un coup : la trace dans le journal et la remise à zéro du compteur.",
      "En état `ARRET`, il n'y a rien à écrire : un `Twist()` vide est déjà une consigne d'arrêt."
    ],
    objectifs: [
      {
        id: "virage",
        label: "A passé le virage",
        test: (t) => zoneAtteinte(t, "virage")
      },
      {
        id: "arrivee",
        label: "A atteint le fond du couloir",
        aide: "Vérifie la durée du quart de tour : trop court, le robot repart de biais.",
        test: (t) => zoneAtteinte(t, "arrivee")
      },
      {
        id: "trace",
        label: "Les changements d'état sont tracés",
        test: (t) => journalContient(t, /état/i)
      },
      {
        id: "propre",
        label: "Au plus une collision",
        test: (t) => chocs(t, 1)
      }
    ],
    concepts: [
      { label: "Comportements", href: "/academy/navigation/comportements" },
      { label: "Actions", href: "/academy/communication/actions" }
    ],
    xp: 100
  },

  /* ─────────────────────────── 10 ─────────────────────────── */
  {
    id: "derive",
    numero: 10,
    titre: "L'odométrie ment",
    resume: "Mesurer la dérive, et comprendre pourquoi l'EKF existe.",
    difficulte: "Avancé",
    robot: "amr",
    monde: "piste",
    duree: 70,
    enonce: [
      "L'AMR pèse vingt-deux kilos et ses roues ne font pas exactement le même diamètre. Un écart d'un pour cent entre les deux suffit à faire tourner l'odométrie alors que le robot va droit.",
      "Le protocole est simple : avancer de trois mètres selon `/odom`, faire demi-tour, revenir de trois mètres. Si l'odométrie disait vrai, le robot finirait exactement à son point de départ, et `/odom` afficherait zéro.",
      "Il affichera zéro. Le robot, lui, sera ailleurs — la vue 2D montre les deux poses côte à côte, la vraie et celle que le robot croit. Calcule et affiche l'écart final selon l'odométrie, et compare avec ce que tu vois.",
      "C'est exactement pour cela qu'existent `robot_localization` et son filtre de Kalman étendu : fusionner l'odométrie des roues avec l'IMU, puis corriger le tout par SLAM. Aucune de ces briques n'est un caprice d'ingénieur."
    ],
    depart: `import math

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from nav_msgs.msg import Odometry

PERIODE = 0.05
DISTANCE = 3.0
VITESSE = 0.6
ROTATION = 0.6


def lacet(q):
    """Angle de lacet, extrait du quaternion."""
    return math.atan2(2.0 * (q.w * q.z), 1.0 - 2.0 * (q.z * q.z))


def ecart_angle(a, b):
    """Différence d'angles, ramenée dans ]-pi, pi]."""
    d = a - b
    while d > math.pi:
        d -= 2 * math.pi
    while d <= -math.pi:
        d += 2 * math.pi
    return d


class AllerRetour(Node):
    def __init__(self):
        super().__init__('aller_retour')
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.create_subscription(Odometry, '/odom', self.on_odom, 10)
        self.x = 0.0
        self.y = 0.0
        self.theta = 0.0
        self.theta_demi = None
        self.etat = 'ALLER'
        self.create_timer(PERIODE, self.boucle)

    def on_odom(self, msg):
        p = msg.pose.pose.position
        self.x = p.x
        self.y = p.y
        self.theta = lacet(msg.pose.pose.orientation)

    def aller_a(self, etat):
        self.get_logger().info('état %s -> %s' % (self.etat, etat))
        self.etat = etat

    def boucle(self):
        msg = Twist()
        distance = math.hypot(self.x, self.y)

        # TODO 1 : état 'ALLER' — avancer à VITESSE. Quand la distance
        #          approche DISTANCE, mémoriser self.theta_demi et
        #          passer en 'DEMI_TOUR'. L'AMR met près de deux
        #          secondes à s'arrêter : anticipe.

        # TODO 2 : état 'DEMI_TOUR' — tourner à ROTATION jusqu'à ce que
        #          ecart_angle(self.theta, self.theta_demi) atteigne pi,
        #          puis passer en 'RETOUR'.

        # TODO 3 : état 'RETOUR' — revenir. Quand la distance retombe
        #          sous 0.5, passer en 'FINI' et afficher l'erreur
        #          finale selon l'odométrie, ainsi que la position que
        #          l'odométrie croit occuper.

        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = AllerRetour()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    solution: `import math

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from nav_msgs.msg import Odometry

PERIODE = 0.05
DISTANCE = 3.0
VITESSE = 0.6
ROTATION = 0.6


def lacet(q):
    return math.atan2(2.0 * (q.w * q.z), 1.0 - 2.0 * (q.z * q.z))


def ecart_angle(a, b):
    d = a - b
    while d > math.pi:
        d -= 2 * math.pi
    while d <= -math.pi:
        d += 2 * math.pi
    return d


class AllerRetour(Node):
    def __init__(self):
        super().__init__('aller_retour')
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.create_subscription(Odometry, '/odom', self.on_odom, 10)
        self.x = 0.0
        self.y = 0.0
        self.theta = 0.0
        self.theta_demi = None
        self.etat = 'ALLER'
        self.create_timer(PERIODE, self.boucle)

    def on_odom(self, msg):
        p = msg.pose.pose.position
        self.x = p.x
        self.y = p.y
        self.theta = lacet(msg.pose.pose.orientation)

    def aller_a(self, etat):
        self.get_logger().info('état %s -> %s' % (self.etat, etat))
        self.etat = etat

    def boucle(self):
        msg = Twist()
        distance = math.hypot(self.x, self.y)

        if self.etat == 'ALLER':
            msg.linear.x = VITESSE
            if distance >= DISTANCE - 0.6:
                self.theta_demi = self.theta
                self.aller_a('DEMI_TOUR')

        elif self.etat == 'DEMI_TOUR':
            msg.angular.z = ROTATION
            if abs(ecart_angle(self.theta, self.theta_demi)) >= math.pi - 0.12:
                self.aller_a('RETOUR')

        elif self.etat == 'RETOUR':
            msg.linear.x = VITESSE
            if distance <= 0.5:
                self.aller_a('FINI')
                self.get_logger().info(
                    "erreur finale selon l'odométrie : %.3f m" % distance)
                self.get_logger().info(
                    "l'odométrie se croit en (%.2f, %.2f) — regarde la vue 2D"
                    % (self.x, self.y))

        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = AllerRetour()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    indices: [
      "Le lacet se tire du quaternion : `math.atan2(2*(q.w*q.z), 1 - 2*q.z*q.z)`. En 2D seuls `z` et `w` sont utiles.",
      "L'AMR met près de deux secondes à s'arrêter. Anticipe : déclenche le demi-tour avant les trois mètres, pas à trois mètres pile.",
      "Pour savoir si le demi-tour est fini, compare le lacet courant à celui du début du demi-tour, en ramenant la différence dans ]−π, π]."
    ],
    objectifs: [
      {
        id: "roule",
        label: "A parcouru au moins 5 m",
        test: (t) => parcouru(t, 5)
      },
      {
        id: "odom",
        label: "Reçoit des messages sur /odom",
        test: (t) => recoit(t, "/odom", 200)
      },
      {
        id: "annonce",
        label: "L'erreur finale est affichée",
        test: (t) => journalContient(t, /erreur|écart|ecart/i)
      },
      {
        id: "derive",
        label: "La dérive constatée dépasse 15 cm",
        aide: "Elle apparaît au retour : plus le trajet est long, plus l'écart grandit.",
        test: (t) => derive(t) >= 0.15
      }
    ],
    concepts: [
      { label: "Odométrie", href: "/academy/navigation/odometrie" },
      { label: "Fusion de capteurs", href: "/academy/perception/fusion" },
      { label: "SLAM", href: "/academy/navigation/slam" }
    ],
    xp: 120
  },

  /* ─────────────────────────── 11 ─────────────────────────── */
  {
    id: "service",
    numero: 11,
    titre: "Armer par service",
    resume: "Un topic pour les flux, un service pour les décisions.",
    difficulte: "Avancé",
    robot: "rover",
    monde: "salle",
    duree: 45,
    enonce: [
      "Un topic, c'est un flux : personne n'accuse réception. Un service, c'est une question avec une réponse — exactement ce qu'il faut pour armer ou désarmer un robot.",
      "`std_srvs/srv/Trigger` est le service le plus simple de ROS 2 : aucune donnée en entrée, un booléen `success` et un texte `message` en sortie. Le callback reçoit la requête et une réponse à remplir, puis la renvoie.",
      "Déclare `/armer` en bascule : armé, le robot évite les obstacles ; désarmé, il ne bouge pas. Le simulateur appelle automatiquement le service à 5 s puis à 30 s, pour que le déroulé reste reproductible — le bouton du panneau te laisse aussi l'appeler à la main."
    ],
    depart: `import math

import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from geometry_msgs.msg import Twist
from sensor_msgs.msg import LaserScan
from std_srvs.srv import Trigger


def minimum(valeurs):
    finis = [v for v in valeurs if not math.isinf(v)]
    return min(finis) if finis else float('inf')


class Armement(Node):
    def __init__(self):
        super().__init__('armement')
        self.arme = False
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.create_subscription(LaserScan, '/scan', self.on_scan,
                                 qos_profile_sensor_data)

        # TODO 1 : déclare un service Trigger nommé '/armer',
        #          traité par self.on_armer.
        #          self.create_service(type, nom, callback)

        self.avant = float('inf')
        self.gauche = float('inf')
        self.droite = float('inf')
        self.create_timer(0.05, self.boucle)

    def on_armer(self, requete, reponse):
        # TODO 2 : bascule self.arme, remplis reponse.success et
        #          reponse.message, écris une ligne de journal
        #          contenant « armé » ou « désarmé », puis renvoie
        #          la réponse.
        return reponse

    def on_scan(self, msg):
        m = len(msg.ranges) // 2
        self.avant = minimum(msg.ranges[m - 30:m + 31])
        self.gauche = minimum(msg.ranges[m + 20:m + 81])
        self.droite = minimum(msg.ranges[m - 80:m - 19])

    def boucle(self):
        msg = Twist()

        # TODO 3 : ne bouge que si self.arme est vrai.

        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = Armement()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    solution: `import math

import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from geometry_msgs.msg import Twist
from sensor_msgs.msg import LaserScan
from std_srvs.srv import Trigger


def minimum(valeurs):
    finis = [v for v in valeurs if not math.isinf(v)]
    return min(finis) if finis else float('inf')


class Armement(Node):
    def __init__(self):
        super().__init__('armement')
        self.arme = False
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.create_subscription(LaserScan, '/scan', self.on_scan,
                                 qos_profile_sensor_data)
        self.create_service(Trigger, '/armer', self.on_armer)
        self.avant = float('inf')
        self.gauche = float('inf')
        self.droite = float('inf')
        self.create_timer(0.05, self.boucle)

    def on_armer(self, requete, reponse):
        self.arme = not self.arme
        reponse.success = True
        reponse.message = 'armé' if self.arme else 'désarmé'
        self.get_logger().info('robot %s' % reponse.message)
        return reponse

    def on_scan(self, msg):
        m = len(msg.ranges) // 2
        self.avant = minimum(msg.ranges[m - 30:m + 31])
        self.gauche = minimum(msg.ranges[m + 20:m + 81])
        self.droite = minimum(msg.ranges[m - 80:m - 19])

    def boucle(self):
        msg = Twist()
        if self.arme:
            if self.avant > 0.9:
                msg.linear.x = 0.35
            else:
                msg.angular.z = 0.9 if self.gauche > self.droite else -0.9
        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = Armement()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    indices: [
      "`self.create_service(Trigger, '/armer', self.on_armer)` — comme un abonnement, mais avec un type de service.",
      "Le callback d'un service prend deux arguments : la requête et une réponse pré-construite. Il faut renvoyer la réponse, sinon l'appelant attend dans le vide.",
      "`Trigger.Response` n'a que deux champs : `success` (booléen) et `message` (texte)."
    ],
    evenements: [
      { t: 5, service: "/armer" },
      { t: 30, service: "/armer" }
    ],
    objectifs: [
      {
        id: "service",
        label: "Le service /armer répond aux appels",
        aide: "Il doit s'appeler exactement /armer.",
        test: (t) => aServiceAppele(t, "/armer", 2)
      },
      {
        id: "journal",
        label: "L'armement est annoncé dans le journal",
        test: (t) => journalContient(t, /arm[ée]|désarm|desarm/i)
      },
      {
        id: "bouge",
        label: "Le robot s'est déplacé une fois armé",
        test: (t) => parcouru(t, 2)
      },
      {
        id: "propre",
        label: "Aucune collision",
        test: (t) => chocs(t, 0)
      }
    ],
    concepts: [
      { label: "Services", href: "/academy/communication/services" },
      { label: "Actions", href: "/academy/communication/actions" }
    ],
    xp: 100
  },

  /* ─────────────────────────── 12 ─────────────────────────── */
  {
    id: "serpentin",
    numero: 12,
    titre: "Traverser le serpentin",
    resume: "Aller au but, éviter les murs, et arriver au bout.",
    difficulte: "Avancé",
    robot: "rover",
    monde: "labyrinthe",
    duree: 160,
    enonce: [
      "La synthèse. Trois cloisons décalées, une arrivée à l'autre bout, et deux commandes à réconcilier : celle qui vise le but, celle qui évite le mur.",
      "Les points de passage te sont donnés, exprimés dans le repère `odom` — donc relatifs au point de départ du robot, comme sur un vrai robot qui vient de démarrer.",
      "L'algorithme est classique. On calcule le cap vers le point visé, on corrige avec un correcteur proportionnel, on ralentit quand le cap est très faux, et on laisse le LiDAR reprendre la main quand un mur est trop près. Dès qu'un point est atteint à moins de trente centimètres, on passe au suivant.",
      "C'est, en tout petit, ce que fait Nav2 : un planificateur global qui donne des points, un contrôleur local qui les suit sans percuter. La différence tient dans la robustesse, pas dans l'idée."
    ],
    depart: `import math

import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from geometry_msgs.msg import Twist
from nav_msgs.msg import Odometry
from sensor_msgs.msg import LaserScan

# Points de passage dans le repère odom, en mètres.
POINTS = [
    (0.0, 4.2),
    (2.4, 4.2),
    (2.4, 0.2),
    (4.4, 0.2),
    (4.4, 4.2),
    (6.6, 4.2),
]

TOLERANCE = 0.3
VITESSE = 0.35
KP_CAP = 1.6
SEUIL_MUR = 0.55


def minimum(valeurs):
    finis = [v for v in valeurs if not math.isinf(v)]
    return min(finis) if finis else float('inf')


def lacet(q):
    return math.atan2(2.0 * (q.w * q.z), 1.0 - 2.0 * (q.z * q.z))


def ecart_angle(a, b):
    d = a - b
    while d > math.pi:
        d -= 2 * math.pi
    while d <= -math.pi:
        d += 2 * math.pi
    return d


class Serpentin(Node):
    def __init__(self):
        super().__init__('serpentin')
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.create_subscription(Odometry, '/odom', self.on_odom, 10)
        self.create_subscription(LaserScan, '/scan', self.on_scan,
                                 qos_profile_sensor_data)
        self.x = 0.0
        self.y = 0.0
        self.theta = 0.0
        self.avant = float('inf')
        self.gauche = float('inf')
        self.droite = float('inf')
        self.cible = 0
        self.create_timer(0.05, self.boucle)

    def on_odom(self, msg):
        p = msg.pose.pose.position
        self.x = p.x
        self.y = p.y
        self.theta = lacet(msg.pose.pose.orientation)

    def on_scan(self, msg):
        m = len(msg.ranges) // 2
        self.avant = minimum(msg.ranges[m - 25:m + 26])
        self.gauche = minimum(msg.ranges[m + 25:m + 76])
        self.droite = minimum(msg.ranges[m - 75:m - 24])

    def boucle(self):
        msg = Twist()

        # TODO 1 : si tous les points sont faits, ne rien demander.
        # TODO 2 : calculer dx, dy vers POINTS[self.cible], puis la
        #          distance et le cap voulu (math.atan2(dy, dx)).
        #          Si la distance est sous TOLERANCE, passer au point
        #          suivant et l'annoncer.
        # TODO 3 : erreur = ecart_angle(cap_voulu, self.theta).
        #          angular.z = KP_CAP * erreur, borné à ±1.4.
        #          linear.x = VITESSE, réduit quand |erreur| est grand.
        # TODO 4 : si self.avant est sous SEUIL_MUR, oublier le but et
        #          tourner vers le côté le plus dégagé.

        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = Serpentin()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    solution: `import math

import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from geometry_msgs.msg import Twist
from nav_msgs.msg import Odometry
from sensor_msgs.msg import LaserScan

POINTS = [
    (0.0, 4.2),
    (2.4, 4.2),
    (2.4, 0.2),
    (4.4, 0.2),
    (4.4, 4.2),
    (6.6, 4.2),
]

TOLERANCE = 0.3
VITESSE = 0.35
KP_CAP = 1.6
SEUIL_MUR = 0.55
ROTATION_MAX = 1.4


def minimum(valeurs):
    finis = [v for v in valeurs if not math.isinf(v)]
    return min(finis) if finis else float('inf')


def lacet(q):
    return math.atan2(2.0 * (q.w * q.z), 1.0 - 2.0 * (q.z * q.z))


def ecart_angle(a, b):
    d = a - b
    while d > math.pi:
        d -= 2 * math.pi
    while d <= -math.pi:
        d += 2 * math.pi
    return d


def borner(v, mini, maxi):
    return max(mini, min(maxi, v))


class Serpentin(Node):
    def __init__(self):
        super().__init__('serpentin')
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.create_subscription(Odometry, '/odom', self.on_odom, 10)
        self.create_subscription(LaserScan, '/scan', self.on_scan,
                                 qos_profile_sensor_data)
        self.x = 0.0
        self.y = 0.0
        self.theta = 0.0
        self.avant = float('inf')
        self.gauche = float('inf')
        self.droite = float('inf')
        self.cible = 0
        self.create_timer(0.05, self.boucle)

    def on_odom(self, msg):
        p = msg.pose.pose.position
        self.x = p.x
        self.y = p.y
        self.theta = lacet(msg.pose.pose.orientation)

    def on_scan(self, msg):
        m = len(msg.ranges) // 2
        self.avant = minimum(msg.ranges[m - 25:m + 26])
        self.gauche = minimum(msg.ranges[m + 25:m + 76])
        self.droite = minimum(msg.ranges[m - 75:m - 24])

    def boucle(self):
        msg = Twist()

        if self.cible >= len(POINTS):
            self.pub.publish(msg)
            return

        bx, by = POINTS[self.cible]
        dx = bx - self.x
        dy = by - self.y
        distance = math.hypot(dx, dy)

        if distance < TOLERANCE:
            self.cible += 1
            self.get_logger().info(
                'point %d atteint' % self.cible)
            self.pub.publish(msg)
            return

        erreur = ecart_angle(math.atan2(dy, dx), self.theta)

        if self.avant < SEUIL_MUR:
            # Un mur trop près l'emporte sur le but : on dégage d'abord.
            msg.angular.z = 1.1 if self.gauche > self.droite else -1.1
        else:
            msg.angular.z = borner(KP_CAP * erreur, -ROTATION_MAX, ROTATION_MAX)
            # On n'avance franchement que lorsqu'on regarde à peu près
            # dans la bonne direction.
            facteur = max(0.0, 1.0 - abs(erreur) / 1.2)
            msg.linear.x = VITESSE * facteur

        self.pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = Serpentin()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
`,
    indices: [
      "L'ordre des opérations compte : on calcule toujours le cap vers le but, mais l'évitement peut écraser la commande juste avant de publier.",
      "Ralentir quand le cap est faux évite les grandes courbes qui frôlent les cloisons : `facteur = max(0, 1 - abs(erreur) / 1.2)`.",
      "Si le robot tourne indéfiniment sur place devant une cloison, c'est que `SEUIL_MUR` est trop grand par rapport à la largeur du passage."
    ],
    objectifs: [
      {
        id: "cp1",
        label: "Premier point de passage atteint",
        test: (t) => zoneAtteinte(t, "cp1")
      },
      {
        id: "cp2",
        label: "Deuxième point de passage atteint",
        test: (t) => zoneAtteinte(t, "cp2")
      },
      {
        id: "arrivee",
        label: "Arrivée atteinte",
        test: (t) => zoneAtteinte(t, "arrivee")
      },
      {
        id: "propre",
        label: "Au plus deux collisions",
        test: (t) => chocs(t, 2)
      }
    ],
    concepts: [
      { label: "Nav2", href: "/academy/navigation/nav2" },
      { label: "SLAM", href: "/academy/navigation/slam" },
      { label: "Robot Forge", href: "/forge" }
    ],
    xp: 150
  }
];

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

/** Clé de progression, partagée avec le ProgressMap du profil. */
export function cleMission(id: string) {
  return `sim/${id}`;
}

/**
 * Les missions qui mettent une leçon en pratique.
 *
 * Le lien est déjà écrit dans `concepts` : plutôt que d'entretenir
 * une seconde table qui finirait par diverger, on le lit à l'envers.
 */
export function missionsPourLecon(track: string, lecon: string): Mission[] {
  const href = `/academy/${track}/${lecon}`;
  return MISSIONS.filter((m) => m.concepts.some((c) => c.href === href));
}
