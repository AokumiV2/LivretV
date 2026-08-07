/* ══════════════════════════════════════════════════════════════
   Analyse statique légère pour l'Atelier.

   Ce module ne prétend pas valider une mission : seule la trace du
   simulateur le peut. Il donne un retour immédiat avant le lancement,
   exactement comme une checklist de prévol sur un vrai robot.
   ══════════════════════════════════════════════════════════════ */

export type EtatDiagnostic = "ok" | "a-faire" | "attention";

export type DiagnosticCode = {
  id: string;
  label: string;
  detail: string;
  etat: EtatDiagnostic;
};

type Regle = {
  id: string;
  label: string;
  detail: string;
  test: (code: string) => boolean;
};

const contient = (motif: RegExp) => (code: string) => motif.test(code);

const REGLES_COMMUNES: Regle[] = [
  {
    id: "init",
    label: "Initialisation ROS 2",
    detail: "Appelle rclpy.init() avant de créer le nœud.",
    test: contient(/\brclpy\.init\s*\(/)
  },
  {
    id: "node",
    label: "Nœud déclaré",
    detail: "Une classe doit hériter de Node et appeler son constructeur.",
    test: (code) =>
      /class\s+\w+\s*\(\s*Node\s*\)/.test(code) &&
      /super\(\)\.__init__\s*\(/.test(code)
  },
  {
    id: "cleanup",
    label: "Arrêt propre",
    detail: "Détruis le nœud puis appelle rclpy.shutdown().",
    test: (code) =>
      /\.destroy_node\s*\(/.test(code) && /\brclpy\.shutdown\s*\(/.test(code)
  }
];

const REGLES_MISSION: Record<string, Regle[]> = {
  "premier-noeud": [
    {
      id: "logger",
      label: "Journal actif",
      detail: "Écris au moins un message avec get_logger().info().",
      test: contient(/get_logger\(\)\.info\s*\(/)
    },
    {
      id: "timer",
      label: "Battement planifié",
      detail: "Crée un timer et passe-lui une fonction sans l'appeler.",
      test: contient(/create_timer\s*\([^,]+,\s*(?:self\.)?\w+\s*\)/)
    },
    {
      id: "spin",
      label: "Boucle d'événements",
      detail: "rclpy.spin(node) donne vie aux timers et callbacks.",
      test: contient(/\brclpy\.spin\s*\(/)
    }
  ],
  avancer: [
    {
      id: "publisher",
      label: "Publisher /cmd_vel",
      detail: "Crée un publisher de Twist sur /cmd_vel.",
      test: (code) => /create_publisher\s*\(/.test(code) && /['\"]\/?cmd_vel['\"]/.test(code)
    },
    {
      id: "linear",
      label: "Vitesse linéaire",
      detail: "Renseigne msg.linear.x avec une valeur non nulle.",
      test: contient(/\.linear\.x\s*=\s*(?!0(?:\.0+)?\b)/)
    },
    {
      id: "publish",
      label: "Commande publiée",
      detail: "Publie le message Twist dans un callback périodique.",
      test: contient(/\.publish\s*\(/)
    }
  ],
  carre: [
    {
      id: "timer",
      label: "Commande périodique",
      detail: "Pilote le robot depuis un timer, pas depuis une boucle bloquante.",
      test: contient(/create_timer\s*\(/)
    },
    {
      id: "turn",
      label: "Rotation commandée",
      detail: "Utilise angular.z pour tourner sur place.",
      test: contient(/\.angular\.z\s*=/)
    },
    {
      id: "state",
      label: "État avance / tourne",
      detail: "Mémorise une phase ou un état pour alterner les côtés.",
      test: contient(/\b(?:etat|phase|state|cote|segment)\b/i)
    }
  ],
  odometrie: [
    {
      id: "odom-sub",
      label: "Abonnement odométrie",
      detail: "Abonne le nœud à /odom avec le type Odometry.",
      test: (code) => /create_subscription\s*\(/.test(code) && /['\"]\/?odom['\"]/.test(code)
    },
    {
      id: "distance",
      label: "Distance calculée",
      detail: "Compare la pose courante à la pose de départ.",
      test: contient(/(?:hypot|sqrt|position\.x|pose\.pose)/)
    },
    {
      id: "stop",
      label: "Arrêt explicite",
      detail: "Publie un Twist nul quand la distance cible est atteinte.",
      test: contient(/(?:Twist\s*\(\)|linear\.x\s*=\s*0)/)
    }
  ],
  qos: [
    {
      id: "scan-sub",
      label: "Abonnement LaserScan",
      detail: "Abonne-toi à /scan avec le type LaserScan.",
      test: (code) => /LaserScan/.test(code) && /['\"]\/?scan['\"]/.test(code)
    },
    {
      id: "best-effort",
      label: "QoS capteur",
      detail: "Le LiDAR publie en BEST_EFFORT : l'abonné doit l'accepter.",
      test: contient(/BEST_EFFORT|qos_profile_sensor_data/)
    },
    {
      id: "callback",
      label: "Callback de réception",
      detail: "Passe une fonction de callback à create_subscription().",
      test: contient(/create_subscription\s*\([\s\S]*?,[\s\S]*?,[\s\S]*?(?:self\.)?\w+/)
    }
  ],
  evitement: [
    {
      id: "scan",
      label: "Secteur LiDAR lu",
      detail: "Lis ranges et ignore les mesures non finies.",
      test: contient(/\.ranges|ranges\[/)
    },
    {
      id: "threshold",
      label: "Seuil d'obstacle",
      detail: "Compare la distance frontale à un seuil de sécurité.",
      test: contient(/(?:distance|devant|front|minimum|min_scan)[\s\S]{0,100}[<>]/i)
    },
    {
      id: "steer",
      label: "Manœuvre d'évitement",
      detail: "Réduis linear.x et commande angular.z près d'un obstacle.",
      test: contient(/\.angular\.z\s*=/)
    }
  ],
  "suivi-mur": [
    {
      id: "lateral",
      label: "Distance latérale",
      detail: "Extrait un secteur latéral du LaserScan.",
      test: contient(/(?:gauche|droite|lateral|side|ranges\[)/i)
    },
    {
      id: "error",
      label: "Erreur de suivi",
      detail: "Calcule l'écart entre distance mesurée et consigne.",
      test: contient(/(?:erreur|error|consigne|cible)[\s\S]{0,80}[-+]/i)
    },
    {
      id: "proportional",
      label: "Correction proportionnelle",
      detail: "Applique un gain à l'erreur pour produire angular.z.",
      test: contient(/(?:kp|gain|erreur|error)[\s\S]{0,100}\*/i)
    }
  ],
  parametres: [
    {
      id: "declare",
      label: "Paramètre déclaré",
      detail: "Déclare les réglages avec declare_parameter().",
      test: contient(/declare_parameter\s*\(/)
    },
    {
      id: "read",
      label: "Paramètre lu",
      detail: "Récupère la valeur avec get_parameter().value.",
      test: contient(/get_parameter\s*\([^)]*\)(?:\.value|\.get_parameter_value)/)
    },
    {
      id: "used",
      label: "Réglage appliqué",
      detail: "Utilise la valeur lue dans le calcul de commande.",
      test: contient(/self\.(?:vitesse|distance|seuil|gain|kp|consigne)/i)
    }
  ],
  etats: [
    {
      id: "state",
      label: "Machine à états",
      detail: "Mémorise explicitement l'étape courante de la mission.",
      test: contient(/\b(?:etat|state|phase)\b/i)
    },
    {
      id: "transitions",
      label: "Transitions",
      detail: "Change d'état selon les mesures et les zones atteintes.",
      test: contient(/self\.(?:etat|state|phase)\s*=/i)
    },
    {
      id: "scan",
      label: "Perception utilisée",
      detail: "La décision s'appuie sur les distances LaserScan.",
      test: contient(/LaserScan|\.ranges/)
    }
  ],
  derive: [
    {
      id: "odom",
      label: "Pose odométrique suivie",
      detail: "Observe /odom et mémorise sa position.",
      test: (code) => /['\"]\/?odom['\"]/.test(code) && /position\.[xy]/.test(code)
    },
    {
      id: "loop",
      label: "Trajectoire fermée",
      detail: "Commande plusieurs segments pour revenir au point de départ.",
      test: contient(/\b(?:etat|phase|segment|cote)\b/i)
    },
    {
      id: "report",
      label: "Écart observé",
      detail: "Journalise ou exploite l'écart final de l'odométrie.",
      test: contient(/get_logger\(\)\.(?:info|warn)\s*\(/)
    }
  ],
  service: [
    {
      id: "service",
      label: "Service Trigger",
      detail: "Crée un service avec create_service().",
      test: contient(/create_service\s*\([\s\S]*?Trigger/)
    },
    {
      id: "armed",
      label: "État armé",
      detail: "Mémorise si le robot est autorisé à bouger.",
      test: contient(/\b(?:arme|armed|actif|enabled)\b/i)
    },
    {
      id: "response",
      label: "Réponse renseignée",
      detail: "Remplis success et message dans la réponse Trigger.",
      test: (code) => /response\.success\s*=/.test(code) && /response\.message\s*=/.test(code)
    }
  ],
  serpentin: [
    {
      id: "scan",
      label: "LiDAR exploité",
      detail: "Observe plusieurs secteurs du scan, pas un seul rayon.",
      test: contient(/\.ranges|ranges\[/)
    },
    {
      id: "state",
      label: "Décision structurée",
      detail: "Utilise un état ou des phases pour franchir le serpentin.",
      test: contient(/\b(?:etat|state|phase|objectif|checkpoint)\b/i)
    },
    {
      id: "bounded",
      label: "Commande bornée",
      detail: "Borne la correction angulaire pour garder le robot stable.",
      test: contient(/\b(?:min|max|clamp|limite)\s*\(/i)
    }
  ]
};

export function analyserCode(missionId: string, code: string): DiagnosticCode[] {
  const diagnostics: DiagnosticCode[] = [...REGLES_COMMUNES, ...(REGLES_MISSION[missionId] ?? [])].map(
    (regle) => ({
      id: regle.id,
      label: regle.label,
      detail: regle.detail,
      etat: regle.test(code) ? "ok" : "a-faire"
    })
  );

  const todos = code.match(/\bTODO\b/g)?.length ?? 0;
  if (todos > 0) {
    diagnostics.push({
      id: "todos",
      label: `${todos} TODO${todos > 1 ? "s" : ""} encore présent${todos > 1 ? "s" : ""}`,
      detail: "Les TODO sont des repères, pas des erreurs. Vérifie-les avant le run.",
      etat: "attention"
    });
  }

  if (/while\s+True\s*:/.test(code) && !/(?:sleep|spin_once)\s*\(/.test(code)) {
    diagnostics.push({
      id: "busy-loop",
      label: "Boucle potentiellement bloquante",
      detail: "Une boucle infinie sans sleep() ni spin_once() affame les callbacks ROS 2.",
      etat: "attention"
    });
  }

  return diagnostics;
}

export type ExtraitCode = {
  id: string;
  label: string;
  detail: string;
  code: string;
};

export const EXTRAITS_CODE: ExtraitCode[] = [
  {
    id: "publisher",
    label: "Publisher Twist",
    detail: "Publisher de vitesse, à placer dans __init__.",
    code: "self.cmd_pub = self.create_publisher(Twist, '/cmd_vel', 10)"
  },
  {
    id: "scan",
    label: "Subscriber LaserScan",
    detail: "Profil QoS adapté aux capteurs ROS 2.",
    code:
      "self.create_subscription(\n    LaserScan, '/scan', self.on_scan,\n    qos_profile_sensor_data\n)"
  },
  {
    id: "timer",
    label: "Timer 10 Hz",
    detail: "Boucle de contrôle non bloquante.",
    code: "self.create_timer(0.1, self.controler)"
  },
  {
    id: "parameter",
    label: "Paramètre",
    detail: "Réglage modifiable sans recompiler.",
    code:
      "self.declare_parameter('vitesse', 0.15)\nself.vitesse = self.get_parameter('vitesse').value"
  },
  {
    id: "safe-stop",
    label: "Arrêt sûr",
    detail: "Commande nulle à publier avant de quitter.",
    code: "stop = Twist()\nself.cmd_pub.publish(stop)"
  }
];
