import type { Component } from "../types";
import {
  can,
  encoderAB,
  gnd,
  i2cTolerant,
  in3v3,
  in5v,
  motorAB,
  out5v,
  pin,
  uart,
  usb,
  vin
} from "./_pins";

/* ══════════════════════════════════════════════════════════════
   Moteurs, servos et étages de puissance
   ══════════════════════════════════════════════════════════════ */

export const ACTUATION: Component[] = [
  /* ─────────────── Moteurs ─────────────── */
  {
    id: "jga25-370",
    name: "Motoréducteur JGA25-370 avec encodeur",
    brand: "Générique",
    category: "moteur",
    tagline: "Le moteur du premier robot différentiel",
    description:
      "Motoréducteur 12 V à courant continu avec encodeur à effet Hall en quadrature intégré. Réduction 1:34 typique pour environ 280 tr/min en sortie. C'est le choix par défaut d'une base roulante de 2 à 5 kg : assez de couple, un encodeur pour l'odométrie, et un prix contenu.",
    price: 18,
    level: "Débutant",
    buses: ["Quadrature"],
    voltage: { min: 6, max: 12, nominal: 12 },
    currentMa: { typ: 300, peak: 2200 },
    logicVolts: 3.3,
    weightG: 210,
    specs: [
      { k: "Tension", v: "12 V continu" },
      { k: "Réduction", v: "1:34 (variantes de 1:9 à 1:270)" },
      { k: "Vitesse", v: "≈ 280 tr/min à vide" },
      { k: "Couple", v: "≈ 1,2 N·m au blocage" },
      { k: "Encodeur", v: "Hall 11 impulsions/tour moteur, soit 374 ppr en sortie" },
      { k: "Courant de blocage", v: "≈ 2,2 A" }
    ],
    pins: [
      ...motorAB(),
      pin("enc_v", "Encodeur VCC", "VIN", { volts: 5, dir: "in" }),
      gnd("enc_gnd"),
      ...encoderAB("", 5)
    ],
    rosPackages: [
      { name: "diff_drive_controller", note: "Contrôleur ros2_control pour base différentielle" },
      { name: "ros2_control", note: "Interface matérielle à écrire une fois" }
    ],
    pros: ["Encodeur déjà monté", "Couple suffisant pour un robot d'intérieur", "Pièce très répandue"],
    cons: ["Jeu mécanique dans le réducteur", "Bruyant", "Précision d'odométrie limitée"],
    gotchas: [
      "L'encodeur sort en 5 V. Branché directement sur un Raspberry Pi ou un Teensy, il détruit la broche : il faut un adaptateur de niveau.",
      "Le courant de blocage de 2,2 A dépasse la capacité d'un TB6612 : prévois une limitation logicielle ou un driver plus costaud.",
      "Les deux moteurs d'une paire n'ont jamais exactement la même constante : sans asservissement le robot dérive."
    ],
    worksWith: ["tb6612fng", "bts7960", "level-shifter", "teensy41", "lipo-3s-5000"]
  },
  {
    id: "pololu-37d",
    name: "Pololu 37D métal avec encodeur 64 CPR",
    brand: "Pololu",
    category: "moteur",
    tagline: "La version sérieuse du motoréducteur",
    description:
      "Réducteur tout métal et encodeur 64 impulsions par tour moteur. La différence avec un JGA25 se sent sur la durée de vie et la qualité de l'odométrie. À prendre pour un robot qui doit rouler des centaines d'heures.",
    price: 55,
    level: "Intermédiaire",
    buses: ["Quadrature"],
    voltage: { min: 6, max: 12, nominal: 12 },
    currentMa: { typ: 400, peak: 5000 },
    logicVolts: 3.3,
    weightG: 220,
    specs: [
      { k: "Réduction", v: "1:19 à 1:150 selon référence" },
      { k: "Encodeur", v: "64 CPR sur l'arbre moteur" },
      { k: "Courant de blocage", v: "5 A à 12 V" },
      { k: "Engrenages", v: "Métal, y compris l'étage de sortie" }
    ],
    pins: [...motorAB(), pin("enc_v", "Encodeur VCC 3,5-20V", "VIN", { volts: 5, dir: "in" }), gnd("enc_gnd"), ...encoderAB("", 5)],
    rosPackages: [{ name: "diff_drive_controller", note: "Contrôleur différentiel standard" }],
    pros: ["Robuste", "Encodeur précis", "Documentation Pololu exemplaire"],
    cons: ["Trois fois le prix d'un JGA25", "Lourd"],
    gotchas: ["5 A au blocage : il faut un BTS7960 ou un pont en H de puissance équivalente."],
    worksWith: ["bts7960", "roboclaw", "teensy41"]
  },
  {
    id: "n20-motor",
    name: "Micro-motoréducteur N20 avec encodeur",
    brand: "Générique",
    category: "moteur",
    tagline: "Pour les robots qui tiennent dans la main",
    description:
      "Version miniature du motoréducteur à encodeur, en 6 ou 12 V. Parfait pour un robot de table, un rover pédagogique ou un mécanisme secondaire.",
    price: 9,
    level: "Débutant",
    buses: ["Quadrature"],
    voltage: { min: 3, max: 12, nominal: 6 },
    currentMa: { typ: 120, peak: 800 },
    logicVolts: 3.3,
    weightG: 45,
    specs: [
      { k: "Tension", v: "6 V (variante 12 V)" },
      { k: "Réduction", v: "1:30 à 1:298" },
      { k: "Encodeur", v: "Magnétique 7 ppr moteur" }
    ],
    pins: [...motorAB(), pin("enc_v", "Encodeur VCC", "VIN", { volts: 3.3, dir: "in" }), gnd("enc_gnd"), ...encoderAB("", 3.3)],
    rosPackages: [{ name: "diff_drive_controller", note: "Même contrôleur, autres paramètres" }],
    pros: ["Minuscule et léger", "Très bon marché"],
    cons: ["Couple faible", "Réducteur plastique fragile"],
    gotchas: ["Le réducteur casse net si le robot est bloqué contre un mur à pleine puissance."],
    worksWith: ["tb6612fng", "rpi-pico", "esp32-s3"]
  },
  {
    id: "mg996r",
    name: "Servo MG996R",
    brand: "TowerPro",
    category: "moteur",
    tagline: "Le servo à pignons métal universel",
    description:
      "Servo standard 55 g, environ 10 kg·cm sous 6 V, commandé par PWM 50 Hz. Le cheval de bataille des bras robotisés d'apprentissage et des tourelles de capteurs.",
    price: 7,
    level: "Débutant",
    buses: ["PWM"],
    voltage: { min: 4.8, max: 7.2, nominal: 6 },
    currentMa: { typ: 250, peak: 2500 },
    logicVolts: 5,
    weightG: 55,
    specs: [
      { k: "Couple", v: "9,4 kg·cm à 4,8 V — 11 kg·cm à 6 V" },
      { k: "Vitesse", v: "0,17 s/60° à 6 V" },
      { k: "Signal", v: "PWM 50 Hz, impulsion 1000–2000 µs" },
      { k: "Débattement", v: "180°" }
    ],
    pins: [pin("vcc", "V+ 4,8-7,2V", "VIN", { volts: 6, dir: "in" }), gnd(), pin("sig", "Signal PWM", "PWM", { volts: 5, dir: "in", tolerant5v: true })],
    rosPackages: [{ name: "ros2_control", note: "Via une interface position sur un microcontrôleur" }],
    pros: ["Pas cher", "Pignons métal", "Se pilote avec une seule broche"],
    cons: ["Aucun retour de position vers ROS", "Pic de courant énorme au démarrage", "Tremblements en position tenue"],
    gotchas: [
      "Le pic de 2,5 A fait s'effondrer un rail 5 V partagé et redémarre le Raspberry Pi. Alimente TOUJOURS les servos sur un BEC séparé.",
      "Le signal est en boucle ouverte : ROS croit connaître la position, mais rien ne le confirme.",
      "Six servos MG996R en mouvement, c'est 15 A de pic. Dimensionne l'alimentation en conséquence."
    ],
    worksWith: ["pca9685", "bec-5v-5a", "esp32-s3"]
  },
  {
    id: "ds3218",
    name: "Servo DS3218 20 kg·cm",
    brand: "DSSERVO",
    category: "moteur",
    tagline: "Deux fois le couple, mêmes défauts",
    description:
      "Servo numérique étanche de 20 kg·cm sous 6,8 V. Utile pour les articulations d'épaule d'un bras ou les directions de rover tout-terrain.",
    price: 16,
    level: "Débutant",
    buses: ["PWM"],
    voltage: { min: 4.8, max: 6.8, nominal: 6 },
    currentMa: { typ: 400, peak: 3000 },
    logicVolts: 5,
    weightG: 60,
    specs: [
      { k: "Couple", v: "19 kg·cm à 5 V — 21,5 kg·cm à 6,8 V" },
      { k: "Vitesse", v: "0,16 s/60°" },
      { k: "Étanchéité", v: "IP66" }
    ],
    pins: [pin("vcc", "V+ 4,8-6,8V", "VIN", { volts: 6, dir: "in" }), gnd(), pin("sig", "Signal PWM", "PWM", { volts: 5, dir: "in", tolerant5v: true })],
    rosPackages: [{ name: "ros2_control", note: "Interface position via microcontrôleur" }],
    pros: ["Couple élevé pour le prix", "Résiste à la poussière et à l'humidité"],
    cons: ["Toujours aucun retour de position", "3 A de pic"],
    gotchas: ["Ne dépasse jamais 6,8 V : l'électronique interne lâche au-delà."],
    worksWith: ["pca9685", "bec-5v-5a"]
  },
  {
    id: "dynamixel-xl430",
    name: "Dynamixel XL430-W250",
    brand: "ROBOTIS",
    category: "moteur",
    tagline: "Le servo qui répond quand on lui parle",
    description:
      "Servomoteur intelligent en bus série half-duplex : il renvoie sa position réelle, sa vitesse, son courant et sa température. C'est ce qui change tout pour ROS 2, parce que /joint_states devient une mesure et non une supposition. On les chaîne en série jusqu'à 253 sur un seul bus.",
    price: 55,
    level: "Intermédiaire",
    buses: ["UART"],
    voltage: { min: 6.5, max: 12, nominal: 12 },
    currentMa: { typ: 180, peak: 1400 },
    logicVolts: 3.3,
    weightG: 57,
    specs: [
      { k: "Couple", v: "1,4 N·m à 11,1 V" },
      { k: "Retour", v: "Position, vitesse, courant, tension, température" },
      { k: "Bus", v: "TTL half-duplex, jusqu'à 4,5 Mbit/s" },
      { k: "Résolution", v: "4096 pas par tour" },
      { k: "Chaînage", v: "253 servos maximum par bus" }
    ],
    pins: [vin("vin", 12, "V+ 6,5-12V"), gnd(), pin("data", "DATA half-duplex", "TX", { volts: 3.3, dir: "io" })],
    rosPackages: [
      { name: "dynamixel_hardware_interface", note: "Interface ros2_control officielle" },
      { name: "dynamixel_sdk", note: "Bibliothèque bas niveau C++/Python" }
    ],
    pros: [
      "Vrai retour d'état : /joint_states devient fiable",
      "Câblage minimal grâce au chaînage",
      "Limitation de courant et protection thermique intégrées"
    ],
    cons: ["Huit fois le prix d'un MG996R", "Nécessite un adaptateur U2D2 ou équivalent"],
    gotchas: [
      "Le bus est half-duplex : un montage maison sans circuit de direction ne marchera pas, prends un U2D2.",
      "Chaque servo doit recevoir un ID unique AVANT d'être chaîné, sinon collision sur le bus."
    ],
    worksWith: ["u2d2", "opencr", "lipo-3s-5000"]
  },
  {
    id: "nema17",
    name: "Moteur pas-à-pas NEMA 17",
    brand: "Générique",
    category: "moteur",
    tagline: "Position ouverte, précise et sans encodeur",
    description:
      "1,8° par pas, soit 200 pas par tour, jusqu'à 3200 en micro-pas. Utilisé pour les axes linéaires, les tourelles et tout ce qui doit se positionner précisément sans boucle de retour — tant que la charge reste sous le couple disponible.",
    price: 14,
    level: "Intermédiaire",
    buses: ["GPIO"],
    voltage: { min: 12, max: 24, nominal: 12 },
    currentMa: { typ: 1200, peak: 1700 },
    weightG: 280,
    specs: [
      { k: "Pas", v: "1,8° soit 200 pas/tour" },
      { k: "Couple de maintien", v: "0,4 N·m" },
      { k: "Courant par phase", v: "1,5 à 1,7 A" },
      { k: "Bobinage", v: "Bipolaire, 4 fils" }
    ],
    pins: [pin("a+", "A+", "MOTOR", { dir: "io" }), pin("a-", "A-", "MOTOR", { dir: "io" }), pin("b+", "B+", "MOTOR", { dir: "io" }), pin("b-", "B-", "MOTOR", { dir: "io" })],
    rosPackages: [{ name: "ros2_control", note: "Interface position via driver pas-à-pas" }],
    pros: ["Positionnement précis sans encodeur", "Couple de maintien à l'arrêt", "Peu cher"],
    cons: ["Consomme à pleine puissance même immobile", "Perd des pas silencieusement en cas de surcharge", "Lourd"],
    gotchas: [
      "Un pas perdu ne remonte jamais à ROS : la position commandée diverge sans aucun signal d'erreur.",
      "Le courant par phase doit être réglé sur le driver, sinon le moteur grille ou le couple s'effondre."
    ],
    worksWith: ["tmc2209", "drv8825", "buck-12v-5a"]
  },
  {
    id: "bldc-hoverboard",
    name: "Moteur-roue d'hoverboard 350 W",
    brand: "Générique",
    category: "moteur",
    tagline: "Le moteur d'un vrai robot d'extérieur",
    description:
      "Moteur brushless dans le moyeu de la roue, avec capteurs Hall intégrés. Récupéré sur un hoverboard, il permet de construire une base roulante capable de porter 40 kg pour un budget dérisoire.",
    price: 45,
    level: "Avancé",
    buses: ["Quadrature"],
    voltage: { min: 24, max: 42, nominal: 36 },
    currentMa: { typ: 3000, peak: 15000 },
    weightG: 2600,
    specs: [
      { k: "Puissance", v: "350 W par roue" },
      { k: "Tension", v: "36 V nominal (batterie 10S)" },
      { k: "Capteurs", v: "3 sondes Hall intégrées" },
      { k: "Diamètre", v: "6,5 pouces" }
    ],
    pins: [
      pin("u", "Phase U", "MOTOR", { dir: "io" }),
      pin("v", "Phase V", "MOTOR", { dir: "io" }),
      pin("w", "Phase W", "MOTOR", { dir: "io" }),
      pin("hall_v", "Hall VCC", "VIN", { volts: 5, dir: "in" }),
      gnd("hall_gnd"),
      pin("hall_a", "Hall A", "ENC_A", { volts: 5, dir: "out" }),
      pin("hall_b", "Hall B", "ENC_B", { volts: 5, dir: "out" }),
      pin("hall_c", "Hall C", "GPIO", { volts: 5, dir: "out" })
    ],
    rosPackages: [{ name: "hoverboard_driver", note: "Pilote communautaire pour firmware alternatif" }],
    pros: ["Puissance considérable pour le prix", "Roue, moteur et capteurs en un seul bloc"],
    cons: ["36 V dangereux si mal manipulé", "Lourd", "Nécessite un driver BLDC capable"],
    gotchas: [
      "Une batterie 10S stocke assez d'énergie pour souder un tournevis. Fusible et interrupteur anti-étincelle obligatoires.",
      "Les sondes Hall sortent en 5 V : adaptateur de niveau indispensable côté 3,3 V."
    ],
    worksWith: ["vesc-6", "odrive-s1", "level-shifter"]
  },

  /* ─────────────── Drivers ─────────────── */
  {
    id: "tb6612fng",
    name: "Pont en H double TB6612FNG",
    brand: "Toshiba",
    category: "driver",
    tagline: "Le petit pont en H qu'il faut préférer au L298N",
    description:
      "Deux canaux, 1,2 A continu et 3,2 A crête chacun, avec des MOSFET et non des transistors bipolaires. Résultat : une chute de tension d'environ 0,5 V au lieu de 2 V, donc moins de chaleur et plus de couple utile. À taille et prix comparables, il n'y a aucune raison de choisir un L298N.",
    price: 6,
    level: "Débutant",
    buses: ["PWM", "GPIO"],
    voltage: { min: 2.5, max: 13.5, nominal: 12 },
    currentMa: { typ: 20, peak: 3200 },
    logicVolts: 3.3,
    weightG: 5,
    specs: [
      { k: "Canaux", v: "2 moteurs à courant continu" },
      { k: "Courant", v: "1,2 A continu, 3,2 A crête par canal" },
      { k: "Tension moteur", v: "2,5 à 13,5 V" },
      { k: "Chute", v: "≈ 0,5 V (technologie MOSFET)" },
      { k: "PWM", v: "Jusqu'à 100 kHz" }
    ],
    pins: [
      vin("vm", 12, "VM (moteur)"),
      pin("vcc", "VCC logique 2,7-5,5V", "VIN", { volts: 3.3, dir: "in", tolerant5v: true }),
      gnd(),
      pin("pwma", "PWMA", "PWM", { volts: 3.3, dir: "in", tolerant5v: true }),
      pin("ain1", "AIN1", "GPIO", { volts: 3.3, dir: "in", tolerant5v: true }),
      pin("ain2", "AIN2", "GPIO", { volts: 3.3, dir: "in", tolerant5v: true }),
      pin("pwmb", "PWMB", "PWM", { volts: 3.3, dir: "in", tolerant5v: true }),
      pin("bin1", "BIN1", "GPIO", { volts: 3.3, dir: "in", tolerant5v: true }),
      pin("bin2", "BIN2", "GPIO", { volts: 3.3, dir: "in", tolerant5v: true }),
      pin("stby", "STBY", "GPIO", { volts: 3.3, dir: "in", tolerant5v: true }),
      ...motorAB("a_"),
      ...motorAB("b_")
    ],
    rosPackages: [{ name: "ros2_control", note: "Piloté depuis l'interface matérielle du microcontrôleur" }],
    pros: ["Rendement bien supérieur au L298N", "Logique compatible 3,3 V", "Minuscule"],
    cons: ["1,2 A continu seulement", "Pas de mesure de courant"],
    gotchas: [
      "La broche STBY doit être mise à l'état haut, sinon le driver reste muet — c'est LE piège du premier montage.",
      "1,2 A continu ne suffit pas pour un JGA25 en butée : ajoute une limite logicielle.",
      "VM et VCC sont deux alimentations distinctes : la logique en 3,3 V, la puissance en 12 V."
    ],
    worksWith: ["jga25-370", "n20-motor", "esp32-s3", "teensy41", "rpi-pico"]
  },
  {
    id: "l298n",
    name: "Module L298N",
    brand: "STMicroelectronics",
    category: "driver",
    tagline: "Le classique qu'il vaut mieux éviter",
    description:
      "Le pont en H de tous les kits de démarrage. Technologie bipolaire des années 80 : il perd environ 2 V et dissipe cette énergie en chaleur. Documenté ici pour que tu saches pourquoi le préférer serait une erreur.",
    price: 4,
    level: "Débutant",
    buses: ["PWM", "GPIO"],
    voltage: { min: 5, max: 35, nominal: 12 },
    currentMa: { typ: 50, peak: 2000 },
    logicVolts: 5,
    weightG: 30,
    specs: [
      { k: "Canaux", v: "2 moteurs" },
      { k: "Courant", v: "2 A par canal en théorie, 1 A en pratique sans radiateur" },
      { k: "Chute", v: "≈ 2 V — de l'énergie perdue en chaleur" }
    ],
    pins: [
      vin("vm", 12, "12V (moteur)"),
      out5v("5v"),
      gnd(),
      pin("ena", "ENA", "PWM", { volts: 5, dir: "in", tolerant5v: true }),
      pin("in1", "IN1", "GPIO", { volts: 5, dir: "in", tolerant5v: true }),
      pin("in2", "IN2", "GPIO", { volts: 5, dir: "in", tolerant5v: true }),
      pin("enb", "ENB", "PWM", { volts: 5, dir: "in", tolerant5v: true }),
      pin("in3", "IN3", "GPIO", { volts: 5, dir: "in", tolerant5v: true }),
      pin("in4", "IN4", "GPIO", { volts: 5, dir: "in", tolerant5v: true }),
      ...motorAB("a_"),
      ...motorAB("b_")
    ],
    rosPackages: [{ name: "ros2_control", note: "Interface identique à celle du TB6612" }],
    pros: ["Omniprésent dans les kits", "Accepte jusqu'à 35 V"],
    cons: ["Chute de 2 V", "Chauffe énormément", "Rendement médiocre"],
    gotchas: [
      "Sur une batterie 7,4 V, il n'en reste que 5,4 V pour le moteur. Un tiers du couple part en fumée.",
      "Le régulateur 5 V embarqué est fragile : ne l'utilise jamais pour alimenter une carte de calcul."
    ],
    worksWith: ["jga25-370", "arduino-mega"]
  },
  {
    id: "bts7960",
    name: "Module BTS7960 43 A",
    brand: "Infineon",
    category: "driver",
    tagline: "Un seul moteur, mais beaucoup de courant",
    description:
      "Demi-ponts intelligents capables de 43 A crête. À utiliser dès que les moteurs dépassent ce qu'un TB6612 peut encaisser : rover d'extérieur, treuil, base lourde.",
    price: 12,
    level: "Intermédiaire",
    buses: ["PWM", "GPIO", "Analogique"],
    voltage: { min: 5.5, max: 27, nominal: 12 },
    currentMa: { typ: 30, peak: 43000 },
    logicVolts: 3.3,
    weightG: 65,
    specs: [
      { k: "Canaux", v: "1 moteur (pont complet)" },
      { k: "Courant", v: "43 A crête, ≈ 20 A continu avec dissipateur" },
      { k: "Protection", v: "Surintensité et surchauffe intégrées" },
      { k: "Mesure", v: "Sortie analogique image du courant" }
    ],
    pins: [
      vin("vm", 12, "B+ (batterie)"),
      pin("vcc", "VCC logique", "VIN", { volts: 3.3, dir: "in", tolerant5v: true }),
      gnd(),
      pin("rpwm", "RPWM", "PWM", { volts: 3.3, dir: "in", tolerant5v: true }),
      pin("lpwm", "LPWM", "PWM", { volts: 3.3, dir: "in", tolerant5v: true }),
      pin("r_en", "R_EN", "GPIO", { volts: 3.3, dir: "in", tolerant5v: true }),
      pin("l_en", "L_EN", "GPIO", { volts: 3.3, dir: "in", tolerant5v: true }),
      pin("r_is", "R_IS (courant)", "ANALOG", { volts: 3.3, dir: "out" }),
      ...motorAB()
    ],
    rosPackages: [{ name: "ros2_control", note: "Un module par moteur" }],
    pros: ["Courant très élevé", "Retour de courant exploitable", "Protections intégrées"],
    cons: ["Un seul moteur par module", "Encombrant"],
    gotchas: [
      "43 A n'est atteignable qu'avec une vraie dissipation et des câbles de section suffisante.",
      "Les deux entrées PWM ne doivent jamais être hautes simultanément : court-circuit du pont."
    ],
    worksWith: ["pololu-37d", "bldc-hoverboard", "teensy41", "lipo-4s-5200"]
  },
  {
    id: "tmc2209",
    name: "Driver pas-à-pas TMC2209",
    brand: "Trinamic",
    category: "driver",
    tagline: "Silencieux, et il détecte les pas perdus",
    description:
      "Driver de moteur pas-à-pas avec micro-pas jusqu'à 1/256 et hachage StealthChop qui rend le moteur pratiquement muet. Sa fonction StallGuard détecte la surcharge, ce qui permet de faire une prise d'origine sans capteur de fin de course.",
    price: 9,
    level: "Intermédiaire",
    buses: ["GPIO", "UART"],
    voltage: { min: 4.75, max: 29, nominal: 12 },
    currentMa: { typ: 15, peak: 2000 },
    logicVolts: 3.3,
    weightG: 3,
    specs: [
      { k: "Courant", v: "1,4 A continu, 2 A crête" },
      { k: "Micro-pas", v: "Jusqu'à 1/256" },
      { k: "Modes", v: "StealthChop (silencieux), SpreadCycle (couple)" },
      { k: "StallGuard", v: "Détection de blocage sans capteur" }
    ],
    pins: [
      vin("vm", 12, "VM (moteur)"),
      pin("vio", "VIO logique", "VIN", { volts: 3.3, dir: "in" }),
      gnd(),
      pin("step", "STEP", "GPIO", { volts: 3.3, dir: "in" }),
      pin("dir", "DIR", "GPIO", { volts: 3.3, dir: "in" }),
      pin("en", "EN", "GPIO", { volts: 3.3, dir: "in" }),
      ...uart(3.3),
      pin("a1", "A1", "MOTOR", { dir: "io" }),
      pin("a2", "A2", "MOTOR", { dir: "io" }),
      pin("b1", "B1", "MOTOR", { dir: "io" }),
      pin("b2", "B2", "MOTOR", { dir: "io" })
    ],
    rosPackages: [{ name: "ros2_control", note: "Interface position via générateur d'impulsions" }],
    pros: ["Quasiment silencieux", "StallGuard remplace les fins de course", "Configuration par UART"],
    cons: ["Courant limité à 2 A", "Réglage initial délicat"],
    gotchas: [
      "Le potentiomètre de référence de courant doit être ajusté au multimètre AVANT le premier essai, sinon le moteur ou le driver grille.",
      "Ne jamais débrancher le moteur driver sous tension : la surtension détruit la puce."
    ],
    worksWith: ["nema17", "teensy41", "buck-12v-5a"]
  },
  {
    id: "odrive-s1",
    name: "ODrive S1",
    brand: "ODrive Robotics",
    category: "driver",
    tagline: "Contrôle vectoriel de BLDC, qualité industrielle",
    description:
      "Contrôleur brushless en commande vectorielle avec asservissement en couple, vitesse ou position, calibration automatique et CAN. C'est le passage du bricolage à la robotique sérieuse : un moteur brushless piloté ainsi rivalise avec un actionneur professionnel pour une fraction du prix.",
    price: 160,
    level: "Avancé",
    buses: ["CAN", "USB", "UART"],
    voltage: { min: 12, max: 50, nominal: 24 },
    currentMa: { typ: 100, peak: 40000 },
    logicVolts: 3.3,
    weightG: 40,
    specs: [
      { k: "Canaux", v: "1 moteur brushless" },
      { k: "Courant", v: "40 A crête, 20 A continu" },
      { k: "Tension", v: "12 à 50 V" },
      { k: "Modes", v: "Couple, vitesse, position" },
      { k: "Bus", v: "CAN à 1 Mbit/s, chaînable" }
    ],
    pins: [vin("vbus", 24, "VBUS 12-50V"), gnd(), ...can(), usb("usb", "io"), pin("u", "Phase U", "MOTOR", { dir: "io" }), pin("v", "Phase V", "MOTOR", { dir: "io" }), pin("w", "Phase W", "MOTOR", { dir: "io" }), pin("enc", "Encodeur", "ENC_A", { volts: 3.3, dir: "in" })],
    rosPackages: [
      { name: "odrive_can", note: "Nœud ROS 2 officiel via SocketCAN" },
      { name: "ros2_control", note: "Interface matérielle communautaire" }
    ],
    pros: [
      "Contrôle en couple : indispensable pour un quadrupède ou un bras conforme",
      "CAN chaînable, câblage propre sur un robot à six moteurs",
      "Calibration automatique du moteur et de l'encodeur"
    ],
    cons: ["Cher", "Réglage des gains exigeant", "Un module par moteur"],
    gotchas: [
      "La calibration doit être refaite après tout changement mécanique, sinon l'asservissement s'emballe.",
      "Le bus CAN a besoin d'une résistance de 120 Ω à chaque extrémité, pas ailleurs.",
      "Prévois un frein de dissipation : freiner un moteur renvoie du courant vers la batterie."
    ],
    worksWith: ["bldc-hoverboard", "can-transceiver", "teensy41", "jetson-orin-nano"]
  },
  {
    id: "vesc-6",
    name: "VESC 6 (MkVI)",
    brand: "Benjamin Vedder / Trampa",
    category: "driver",
    tagline: "Le contrôleur BLDC open source du skateboard électrique",
    description:
      "Contrôleur FOC open source très répandu, robuste et bien documenté. Moins orienté robotique que l'ODrive mais moins cher et disponible partout en pièces compatibles.",
    price: 110,
    level: "Avancé",
    buses: ["CAN", "USB", "UART"],
    voltage: { min: 8, max: 60, nominal: 36 },
    currentMa: { typ: 100, peak: 80000 },
    logicVolts: 3.3,
    weightG: 90,
    specs: [
      { k: "Courant", v: "80 A crête, 60 A continu" },
      { k: "Tension", v: "8 à 60 V" },
      { k: "Firmware", v: "Open source, configuré via VESC Tool" }
    ],
    pins: [vin("vbat", 36, "Batterie 8-60V"), gnd(), ...can(), ...uart(3.3), usb("usb", "io"), pin("u", "Phase U", "MOTOR", { dir: "io" }), pin("v", "Phase V", "MOTOR", { dir: "io" }), pin("w", "Phase W", "MOTOR", { dir: "io" })],
    rosPackages: [{ name: "vesc_driver", note: "Pilote ROS 2 utilisé notamment par F1TENTH" }],
    pros: ["Courant très élevé", "Firmware ouvert et modifiable", "Écosystème de clones abordables"],
    cons: ["Conçu pour la traction, pas pour l'asservissement de position", "Qualité des clones inégale"],
    gotchas: ["En asservissement de position, le VESC est bien moins fin qu'un ODrive : choisis selon l'usage."],
    worksWith: ["bldc-hoverboard", "jetson-orin-nano", "can-transceiver"]
  },
  {
    id: "pca9685",
    name: "Driver PWM 16 canaux PCA9685",
    brand: "NXP",
    category: "driver",
    tagline: "Seize servos sur deux fils",
    description:
      "Générateur PWM 12 bits sur I2C. Il libère complètement le processeur : la fréquence et les rapports cycliques sont maintenus en matériel. Indispensable dès qu'un bras dépasse trois articulations.",
    price: 7,
    level: "Débutant",
    buses: ["I2C", "PWM"],
    voltage: { min: 2.3, max: 5.5, nominal: 3.3 },
    currentMa: { typ: 10, peak: 25 },
    logicVolts: 3.3,
    i2cAddress: "0x40",
    i2cAlternates: ["0x41", "0x42", "0x43", "0x44", "0x45", "0x46", "0x47"],
    weightG: 8,
    specs: [
      { k: "Canaux", v: "16 sorties PWM" },
      { k: "Résolution", v: "12 bits (4096 pas)" },
      { k: "Fréquence", v: "24 à 1526 Hz, commune aux 16 canaux" },
      { k: "Adresse I2C", v: "0x40 par défaut, 62 adresses possibles" }
    ],
    pins: [
      pin("vcc", "VCC logique", "VIN", { volts: 3.3, dir: "in", tolerant5v: true }),
      pin("v+", "V+ servos", "VIN", { volts: 6, dir: "in" }),
      gnd(),
      ...i2cTolerant(),
      ...Array.from({ length: 16 }, (_, i) => pin(`ch${i}`, `CH${i}`, "PWM", { volts: 5, dir: "out" }))
    ],
    rosPackages: [{ name: "ros2_control", note: "Interface position multi-articulations" }],
    pros: ["Seize servos pour deux broches", "PWM matériel sans gigue", "Chaînable jusqu'à 62 modules"],
    cons: ["Fréquence commune aux 16 canaux", "Toujours aucun retour de position"],
    gotchas: [
      "Son adresse par défaut 0x40 est la même que celle du capteur de courant INA219. Les deux sur le même bus, c'est un conflit garanti — change l'un des deux avec les cavaliers.",
      "Le rail V+ doit venir d'un BEC séparé, jamais du 5 V du Raspberry Pi.",
      "Une seule fréquence pour tous les canaux : impossible de mêler servos à 50 Hz et LED à 1 kHz."
    ],
    worksWith: ["mg996r", "ds3218", "bec-5v-5a", "rpi5"]
  },
  {
    id: "roboclaw",
    name: "RoboClaw 2×15 A",
    brand: "BaseMicro",
    category: "driver",
    tagline: "Le driver qui gère l'asservissement à ta place",
    description:
      "Contrôleur double moteur avec entrées d'encodeurs et boucles PID intégrées. Tu lui envoies une consigne de vitesse en série, il s'occupe du reste. Cela retire une bonne partie du travail temps réel du microcontrôleur.",
    price: 130,
    level: "Intermédiaire",
    buses: ["UART", "USB", "Quadrature"],
    voltage: { min: 6, max: 34, nominal: 12 },
    currentMa: { typ: 50, peak: 30000 },
    logicVolts: 3.3,
    weightG: 90,
    specs: [
      { k: "Canaux", v: "2 moteurs à courant continu" },
      { k: "Courant", v: "15 A continu, 30 A crête par canal" },
      { k: "Encodeurs", v: "2 entrées quadrature avec PID intégré" },
      { k: "Interfaces", v: "USB, série TTL, PWM, analogique" }
    ],
    pins: [vin("vbat", 12, "Batterie 6-34V"), gnd(), ...uart(3.3), ...encoderAB("e1_", 5), ...encoderAB("e2_", 5), usb("usb", "io"), ...motorAB("m1_"), ...motorAB("m2_")],
    rosPackages: [{ name: "roboclaw_hardware_interface", note: "Interface ros2_control communautaire" }],
    pros: ["PID de vitesse embarqué", "Deux moteurs et deux encodeurs sur un seul module", "USB direct vers le calculateur"],
    cons: ["Cher", "Protocole propriétaire"],
    gotchas: ["Les gains PID se règlent avec l'utilitaire Windows Ion Motion : prévois une machine pour ça."],
    worksWith: ["pololu-37d", "jga25-370", "rpi5"]
  },
  {
    id: "u2d2",
    name: "Adaptateur U2D2",
    brand: "ROBOTIS",
    category: "communication",
    tagline: "Le pont USB vers le bus Dynamixel",
    description:
      "Convertisseur USB vers TTL half-duplex et RS485 qui gère la commutation de direction du bus Dynamixel. Sans lui, impossible de parler proprement à une chaîne de servos intelligents depuis Linux.",
    price: 45,
    level: "Intermédiaire",
    buses: ["USB", "UART"],
    voltage: { min: 5, max: 5, nominal: 5 },
    currentMa: { typ: 30, peak: 60 },
    logicVolts: 3.3,
    weightG: 15,
    specs: [
      { k: "Interfaces", v: "TTL half-duplex, RS485, USB" },
      { k: "Débit", v: "Jusqu'à 4,5 Mbit/s" }
    ],
    pins: [usb("usb", "in"), pin("data", "DATA", "TX", { volts: 3.3, dir: "io" }), gnd()],
    rosPackages: [{ name: "dynamixel_sdk", note: "Détecté comme /dev/ttyUSB0" }],
    pros: ["Gère la direction du bus half-duplex", "Reconnu immédiatement sous Linux"],
    cons: ["Cher pour un convertisseur série"],
    gotchas: ["Le U2D2 ne fournit PAS la puissance aux servos : il faut une alimentation 12 V séparée sur le bus."],
    worksWith: ["dynamixel-xl430", "rpi5", "mini-pc-n100"]
  }
];
