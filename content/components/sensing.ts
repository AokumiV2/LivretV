import type { Component } from "../types";
import {
  encoderAB,
  gnd,
  i2c33,
  i2cTolerant,
  in3v3,
  in5v,
  pin,
  spi,
  uart,
  usb,
  vin
} from "./_pins";

/* ══════════════════════════════════════════════════════════════
   Capteurs et caméras
   ══════════════════════════════════════════════════════════════ */

export const SENSING: Component[] = [
  /* ─────────────── Télémétrie laser ─────────────── */
  {
    id: "rplidar-a1",
    name: "RPLIDAR A1M8",
    brand: "Slamtec",
    category: "capteur",
    tagline: "Le LiDAR 2D d'entrée de gamme qui fait tourner SLAM",
    description:
      "Télémètre laser rotatif à triangulation, 360° sur 12 mètres, environ 8000 points par seconde. C'est le capteur qui transforme un robot roulant en robot qui cartographie : avec SLAM Toolbox et Nav2, il suffit à faire de la navigation autonome d'intérieur.",
    price: 95,
    level: "Débutant",
    buses: ["UART", "USB"],
    voltage: { min: 4.9, max: 5.5, nominal: 5 },
    currentMa: { typ: 450, peak: 600 },
    logicVolts: 3.3,
    weightG: 190,
    specs: [
      { k: "Portée", v: "0,15 à 12 m" },
      { k: "Champ", v: "360°" },
      { k: "Fréquence", v: "5,5 Hz (réglable 2 à 10 Hz)" },
      { k: "Échantillonnage", v: "8000 points/s" },
      { k: "Précision", v: "≈ 1 % de la distance" },
      { k: "Interface", v: "UART 115200 bauds via adaptateur USB" }
    ],
    pins: [in5v("5v"), gnd(), ...uart(3.3), pin("motoctl", "MOTOCTL", "PWM", { volts: 3.3, dir: "in" }), usb("usb", "in")],
    rosPackages: [
      { name: "rplidar_ros", note: "Publie /scan en sensor_msgs/LaserScan" },
      { name: "slam_toolbox", note: "Construit la carte à partir de /scan" },
      { name: "nav2_bringup", note: "Navigation autonome sur cette carte" }
    ],
    pros: [
      "Le moins cher pour démarrer avec du SLAM sérieux",
      "Pilote ROS 2 mature et stable",
      "Consommation raisonnable"
    ],
    cons: [
      "Aveugle au soleil direct : inutilisable en extérieur de jour",
      "Pièces mobiles, donc usure du moteur",
      "12 m théoriques, plutôt 6 m utiles sur surfaces sombres"
    ],
    gotchas: [
      "450 mA en continu : ne l'alimente pas depuis la broche 3V3 d'un microcontrôleur, elle ne tiendra pas.",
      "Le laser voit à travers le verre et le rate complètement : une baie vitrée est un trou noir dans la carte.",
      "Le repère du capteur doit être déclaré dans la TF, sinon la carte se construit décalée et Nav2 part en vrille."
    ],
    worksWith: ["rpi5", "rpi4", "bec-5v-5a", "usb-hub-powered"]
  },
  {
    id: "rplidar-a2m12",
    name: "RPLIDAR A2M12",
    brand: "Slamtec",
    category: "capteur",
    tagline: "Plus rapide, plus loin, mieux construit",
    description:
      "Successeur du A1 : 16 000 points par seconde sur 12 mètres, entraînement sans balais donc bien plus durable. Le choix raisonnable dès qu'on dépasse le prototype.",
    price: 320,
    level: "Intermédiaire",
    buses: ["UART", "USB"],
    voltage: { min: 4.9, max: 5.5, nominal: 5 },
    currentMa: { typ: 500, peak: 700 },
    logicVolts: 3.3,
    weightG: 190,
    specs: [
      { k: "Portée", v: "0,2 à 12 m" },
      { k: "Échantillonnage", v: "16 000 points/s" },
      { k: "Fréquence", v: "10 Hz" },
      { k: "Entraînement", v: "Sans balais, sans contact" }
    ],
    pins: [in5v("5v"), gnd(), ...uart(3.3), usb("usb", "in")],
    rosPackages: [{ name: "rplidar_ros", note: "Même pilote que le A1, autre modèle" }],
    pros: ["Deux fois plus de points", "Durée de vie très supérieure", "10 Hz stable"],
    cons: ["Trois fois le prix du A1", "Toujours inutilisable au soleil"],
    gotchas: ["10 Hz double le débit sur /scan : vérifie que le CPU suit avant de monter la fréquence."],
    worksWith: ["rpi5", "mini-pc-n100", "jetson-orin-nano"]
  },
  {
    id: "ldlidar-ld19",
    name: "LDROBOT LD19 (STL-19P)",
    brand: "LDROBOT",
    category: "capteur",
    tagline: "Le meilleur LiDAR à moins de 100 €",
    description:
      "12 mètres, 4500 points par seconde, sortie UART directe sans adaptateur. Beaucoup de robots d'intérieur récents partent sur ce capteur plutôt que sur un RPLIDAR pour une question de prix et de compacité.",
    price: 75,
    level: "Débutant",
    buses: ["UART"],
    voltage: { min: 4.5, max: 5.5, nominal: 5 },
    currentMa: { typ: 260, peak: 350 },
    logicVolts: 3.3,
    weightG: 110,
    specs: [
      { k: "Portée", v: "0,02 à 12 m" },
      { k: "Échantillonnage", v: "4500 points/s" },
      { k: "Fréquence", v: "10 Hz" },
      { k: "Sortie", v: "UART 230400 bauds, flux continu" }
    ],
    pins: [in5v("5v"), gnd(), pin("tx", "TX", "TX", { volts: 3.3, dir: "out" }), pin("pwm", "PWM moteur", "PWM", { volts: 3.3, dir: "in" })],
    rosPackages: [{ name: "ldlidar_stl_ros2", note: "Pilote officiel, publie /scan" }],
    pros: ["Rapport qualité/prix excellent", "Compact et léger", "Consommation modérée"],
    cons: ["Moins de points qu'un A2", "Documentation traduite approximativement"],
    gotchas: ["Le capteur émet en permanence, il n'attend aucune commande : le port série doit être lu en continu ou le tampon déborde."],
    worksWith: ["rpi5", "esp32-s3", "bec-5v-5a"]
  },
  {
    id: "livox-mid360",
    name: "Livox MID-360",
    brand: "Livox",
    category: "capteur",
    tagline: "LiDAR 3D pour robots d'extérieur",
    description:
      "Balayage non répétitif sur 360° × 59°, 40 mètres de portée, avec IMU intégrée. C'est le capteur des robots quadrupèdes et des AMR d'extérieur qui font du SLAM 3D type FAST-LIO.",
    price: 900,
    level: "Avancé",
    buses: ["Ethernet"],
    voltage: { min: 9, max: 27, nominal: 12 },
    currentMa: { typ: 550, peak: 1200 },
    weightG: 265,
    specs: [
      { k: "Portée", v: "40 m à 10 % de réflectivité" },
      { k: "Champ", v: "360° × 59°" },
      { k: "Débit", v: "200 000 points/s" },
      { k: "IMU", v: "6 axes intégrée" },
      { k: "Interface", v: "Ethernet 100 Mbit/s" }
    ],
    pins: [vin("vin", 12, "DC 9-27V"), gnd(), pin("eth", "Ethernet", "ETH", { dir: "io" })],
    rosPackages: [
      { name: "livox_ros_driver2", note: "Publie des PointCloud2" },
      { name: "fast_lio", note: "SLAM 3D inertiel-laser temps réel" }
    ],
    pros: ["Nuage 3D dense", "Fonctionne en extérieur", "IMU synchronisée intégrée"],
    cons: ["Cher", "Motif non répétitif déroutant au début", "Nécessite du CPU sérieux"],
    gotchas: [
      "200 000 points par seconde saturent un Raspberry Pi : prévois un Jetson ou un x86.",
      "L'adresse IP du capteur doit être configurée avant tout, sinon le pilote ne trouve rien."
    ],
    worksWith: ["jetson-orin-nano", "mini-pc-n100", "lipo-4s-5200"]
  },
  {
    id: "tfmini-s",
    name: "TFmini-S",
    brand: "Benewake",
    category: "capteur",
    tagline: "Un point de mesure laser, 12 mètres",
    description:
      "Télémètre laser ponctuel sur UART ou I2C. Utile pour mesurer une hauteur au sol, détecter un vide devant le robot ou compléter un LiDAR 2D en surveillance verticale.",
    price: 40,
    level: "Débutant",
    buses: ["UART", "I2C"],
    voltage: { min: 4.5, max: 6, nominal: 5 },
    currentMa: { typ: 110, peak: 140 },
    logicVolts: 3.3,
    i2cAddress: "0x10",
    weightG: 5,
    specs: [
      { k: "Portée", v: "0,1 à 12 m" },
      { k: "Fréquence", v: "1 à 1000 Hz" },
      { k: "Précision", v: "±6 cm à courte distance" }
    ],
    pins: [in5v("5v"), gnd(), ...uart(3.3), ...i2cTolerant()],
    rosPackages: [{ name: "tfmini_ros2", note: "Publie sensor_msgs/Range" }],
    pros: ["Longue portée pour un capteur ponctuel", "Deux interfaces au choix"],
    cons: ["Un seul point de mesure", "Sensible au soleil"],
    gotchas: ["Le mode I2C doit être activé par commande série avant usage : sorti d'usine il est en UART."],
    worksWith: ["esp32-s3", "rpi5"]
  },
  {
    id: "vl53l1x",
    name: "Capteur de distance ToF VL53L1X",
    brand: "STMicroelectronics",
    category: "capteur",
    tagline: "Quatre mètres, deux fils, minuscule",
    description:
      "Capteur de temps de vol I2C, 4 mètres de portée, avec zone de mesure configurable. Idéal en ceinture anti-collision autour d'une base roulante.",
    price: 12,
    level: "Débutant",
    buses: ["I2C"],
    voltage: { min: 2.6, max: 5.5, nominal: 3.3 },
    currentMa: { typ: 16, peak: 40 },
    logicVolts: 3.3,
    i2cAddress: "0x29",
    weightG: 2,
    specs: [
      { k: "Portée", v: "4 cm à 4 m" },
      { k: "Champ", v: "15 à 27° configurable" },
      { k: "Cadence", v: "Jusqu'à 50 Hz" },
      { k: "Adresse I2C", v: "0x29, non modifiable en dur" }
    ],
    pins: [pin("vin", "VIN 2,6-5,5V", "VIN", { volts: 3.3, dir: "in", tolerant5v: true }), gnd(), ...i2cTolerant(), pin("xshut", "XSHUT", "GPIO", { volts: 3.3, dir: "in" })],
    rosPackages: [{ name: "vl53l1x_ros2", note: "Publie sensor_msgs/Range" }],
    pros: ["Très bon marché", "Consommation négligeable", "Insensible à la couleur de l'obstacle"],
    cons: ["Portée courte", "Une seule adresse I2C d'usine"],
    gotchas: [
      "Tous les VL53L1X naissent à l'adresse 0x29. Pour en mettre plusieurs, il faut les réveiller un par un avec la broche XSHUT et réattribuer les adresses au démarrage.",
      "Une vitre ou un capot transparent devant le capteur fausse toutes les mesures."
    ],
    worksWith: ["esp32-s3", "rpi5", "level-shifter"]
  },
  {
    id: "hc-sr04",
    name: "Télémètre ultrason HC-SR04",
    brand: "Générique",
    category: "capteur",
    tagline: "Deux euros, et des pièges partout",
    description:
      "Le capteur de distance des premiers projets. Fonctionne, mais son cône d'émission large et sa sensibilité aux matériaux en font un mauvais capteur de navigation. On le garde comme détecteur de contact imminent, rien de plus.",
    price: 2,
    level: "Débutant",
    buses: ["GPIO"],
    voltage: { min: 4.5, max: 5.5, nominal: 5 },
    currentMa: { typ: 15, peak: 30 },
    logicVolts: 5,
    weightG: 9,
    specs: [
      { k: "Portée", v: "2 cm à 4 m" },
      { k: "Cône", v: "≈ 30°, très large" },
      { k: "Cadence", v: "20 Hz maximum" }
    ],
    pins: [in5v("5v"), gnd(), pin("trig", "TRIG", "GPIO", { volts: 5, dir: "in", tolerant5v: true }), pin("echo", "ECHO", "GPIO", { volts: 5, dir: "out" })],
    rosPackages: [{ name: "ros2_control", note: "Lecture via microcontrôleur, publié en Range" }],
    pros: ["Prix dérisoire", "Insensible à la lumière", "Détecte le verre, contrairement au laser"],
    cons: ["Cône énorme", "Mousse et tissu absorbent l'écho", "Lent"],
    gotchas: [
      "La broche ECHO sort en 5 V. Reliée directement à un Raspberry Pi ou un ESP32, elle abîme l'entrée : diviseur de tension ou adaptateur de niveau obligatoire.",
      "Deux capteurs déclenchés en même temps s'écoutent l'un l'autre : il faut les séquencer."
    ],
    worksWith: ["level-shifter", "esp32-s3", "arduino-mega"]
  },

  /* ─────────────── Inertiel et position ─────────────── */
  {
    id: "bno085",
    name: "IMU 9 axes BNO085",
    brand: "CEVA / Hillcrest",
    category: "capteur",
    tagline: "L'IMU qui calcule son orientation toute seule",
    description:
      "Accéléromètre, gyroscope et magnétomètre avec un processeur de fusion embarqué. Il sort directement un quaternion d'orientation stable, ce qui évite d'implémenter un filtre de Madgwick approximatif. Pour un robot ROS 2, c'est un gain de temps considérable.",
    price: 26,
    level: "Intermédiaire",
    buses: ["I2C", "SPI", "UART"],
    voltage: { min: 3, max: 5.5, nominal: 3.3 },
    currentMa: { typ: 12, peak: 20 },
    logicVolts: 3.3,
    i2cAddress: "0x4A",
    i2cAlternates: ["0x4B"],
    weightG: 3,
    specs: [
      { k: "Axes", v: "9 (accéléromètre, gyroscope, magnétomètre)" },
      { k: "Fusion", v: "Processeur embarqué, sortie en quaternion" },
      { k: "Cadence", v: "Jusqu'à 400 Hz" },
      { k: "Adresse I2C", v: "0x4A (0x4B avec cavalier)" }
    ],
    pins: [pin("vin", "VIN 3-5,5V", "VIN", { volts: 3.3, dir: "in", tolerant5v: true }), gnd(), ...i2cTolerant(), pin("int", "INT", "GPIO", { volts: 3.3, dir: "out" }), pin("rst", "RST", "GPIO", { volts: 3.3, dir: "in" })],
    rosPackages: [
      { name: "bno08x_ros2", note: "Publie sensor_msgs/Imu avec orientation valide" },
      { name: "robot_localization", note: "Fusionne cette IMU avec l'odométrie des roues" }
    ],
    pros: [
      "Orientation absolue prête à l'emploi, sans filtre à écrire",
      "Calibration automatique en fonctionnement",
      "Un vrai quaternion dans /imu/data, pas des zéros"
    ],
    cons: ["Plus cher qu'un MPU6050", "Protocole SH-2 verbeux", "Le magnétomètre déteste les moteurs"],
    gotchas: [
      "Le magnétomètre est perturbé par les moteurs et les câbles de puissance. Éloigne l'IMU d'au moins 10 cm, ou l'orientation dérive en permanence.",
      "Le repère de l'IMU doit être aligné avec la convention ROS (x avant, y gauche, z haut) ou déclaré dans la TF."
    ],
    worksWith: ["rpi5", "esp32-s3", "teensy41"]
  },
  {
    id: "bno055",
    name: "IMU 9 axes BNO055",
    brand: "Bosch",
    category: "capteur",
    tagline: "L'ancêtre du BNO085, encore très utilisé",
    description:
      "Même principe de fusion embarquée, plus ancien et un peu moins précis, mais avec un pilote ROS 2 bien rodé et une documentation abondante.",
    price: 22,
    level: "Débutant",
    buses: ["I2C", "UART"],
    voltage: { min: 3, max: 5, nominal: 3.3 },
    currentMa: { typ: 12, peak: 15 },
    logicVolts: 3.3,
    i2cAddress: "0x28",
    i2cAlternates: ["0x29"],
    weightG: 3,
    specs: [
      { k: "Axes", v: "9 avec fusion embarquée" },
      { k: "Cadence", v: "100 Hz" },
      { k: "Adresse I2C", v: "0x28 (0x29 avec cavalier)" }
    ],
    pins: [pin("vin", "VIN 3-5V", "VIN", { volts: 3.3, dir: "in", tolerant5v: true }), gnd(), ...i2cTolerant()],
    rosPackages: [{ name: "bno055", note: "Paquet ROS 2 officiel, publie sensor_msgs/Imu" }],
    pros: ["Pilote ROS 2 dans les dépôts officiels", "Bien documenté"],
    cons: ["Cadence limitée à 100 Hz", "Calibration parfois capricieuse"],
    gotchas: [
      "Son adresse 0x29 alternative entre en conflit avec le VL53L1X. Vérifie avec `i2cdetect -y 1` avant d'accuser le code.",
      "Le capteur doit être bougé dans plusieurs orientations au démarrage pour se calibrer."
    ],
    worksWith: ["rpi5", "esp32-s3"]
  },
  {
    id: "mpu6050",
    name: "IMU 6 axes MPU-6050",
    brand: "InvenSense",
    category: "capteur",
    tagline: "Deux euros, mais tout le travail reste à faire",
    description:
      "Accéléromètre et gyroscope, sans magnétomètre ni fusion embarquée. Il faut implémenter soi-même un filtre complémentaire ou de Madgwick, et le lacet dérive fatalement. Excellent pour comprendre ce que fait une IMU, insuffisant pour un robot sérieux.",
    price: 3,
    level: "Débutant",
    buses: ["I2C"],
    voltage: { min: 3, max: 5, nominal: 3.3 },
    currentMa: { typ: 4, peak: 6 },
    logicVolts: 3.3,
    i2cAddress: "0x68",
    i2cAlternates: ["0x69"],
    weightG: 2,
    specs: [
      { k: "Axes", v: "6 (pas de magnétomètre)" },
      { k: "Cadence", v: "Jusqu'à 1 kHz" },
      { k: "Adresse I2C", v: "0x68 (0x69 si AD0 au niveau haut)" }
    ],
    pins: [pin("vcc", "VCC 3-5V", "VIN", { volts: 3.3, dir: "in", tolerant5v: true }), gnd(), ...i2cTolerant(), pin("int", "INT", "GPIO", { volts: 3.3, dir: "out" }), pin("ad0", "AD0", "GPIO", { volts: 3.3, dir: "in" })],
    rosPackages: [
      { name: "imu_tools", note: "Filtre complémentaire pour produire une orientation" },
      { name: "imu_filter_madgwick", note: "Fusion logicielle, à ajouter obligatoirement" }
    ],
    pros: ["Prix imbattable", "Parfait pour apprendre le fonctionnement d'une IMU"],
    cons: ["Aucune fusion embarquée", "Le lacet dérive de plusieurs degrés par minute", "Bruité"],
    gotchas: [
      "Son adresse 0x68 est partagée avec l'ICM-20948 et plusieurs horloges temps réel. Deux capteurs à 0x68 sur le même bus et rien ne répond correctement.",
      "Sans magnétomètre, la référence de cap n'existe pas : le robot croit tourner alors qu'il est immobile."
    ],
    worksWith: ["esp32-s3", "rpi-pico", "teensy41"]
  },
  {
    id: "as5600",
    name: "Encodeur magnétique AS5600",
    brand: "ams",
    category: "capteur",
    tagline: "Position absolue d'un arbre, 12 bits, sans contact",
    description:
      "Capteur à effet Hall qui lit l'angle d'un aimant diamétral collé sur l'arbre. Position absolue conservée après coupure, ce qu'un encodeur incrémental ne sait pas faire. Base des articulations de bras robotisés maison.",
    price: 5,
    level: "Intermédiaire",
    buses: ["I2C", "Analogique"],
    voltage: { min: 3, max: 5.5, nominal: 3.3 },
    currentMa: { typ: 7, peak: 10 },
    logicVolts: 3.3,
    i2cAddress: "0x36",
    weightG: 2,
    specs: [
      { k: "Résolution", v: "12 bits, soit 4096 positions par tour" },
      { k: "Type", v: "Absolu sur un tour" },
      { k: "Adresse I2C", v: "0x36, fixe" }
    ],
    pins: [pin("vcc", "VCC 3-5,5V", "VIN", { volts: 3.3, dir: "in", tolerant5v: true }), gnd(), ...i2cTolerant(), pin("out", "OUT analogique", "ANALOG", { volts: 3.3, dir: "out" })],
    rosPackages: [{ name: "ros2_control", note: "Lu par le microcontrôleur, publié en JointState" }],
    pros: ["Position absolue conservée hors tension", "Aucun contact mécanique, donc aucune usure", "Très bon marché"],
    cons: ["Adresse I2C fixe : un seul par bus", "L'aimant doit être bien centré"],
    gotchas: [
      "Adresse 0x36 non modifiable : pour plusieurs articulations, il faut un multiplexeur TCA9548A.",
      "Un décentrage de l'aimant de plus de 0,5 mm rend la lecture non linéaire."
    ],
    worksWith: ["esp32-s3", "teensy41", "i2c-mux"]
  },
  {
    id: "hall-encoder",
    name: "Encodeur en quadrature à effet Hall",
    brand: "Générique",
    category: "capteur",
    tagline: "Les deux fils qui rendent l'odométrie possible",
    description:
      "Deux signaux carrés déphasés de 90°. En comptant les fronts et en observant l'ordre des voies, on obtient position et sens de rotation. C'est la brique de base de l'odométrie d'un robot différentiel.",
    price: 6,
    level: "Débutant",
    buses: ["Quadrature"],
    voltage: { min: 3.3, max: 5.5, nominal: 5 },
    currentMa: { typ: 20, peak: 30 },
    logicVolts: 5,
    weightG: 8,
    specs: [
      { k: "Sorties", v: "A et B en quadrature" },
      { k: "Résolution", v: "11 à 64 impulsions par tour moteur" },
      { k: "Décodage", v: "×4 en comptant tous les fronts" }
    ],
    pins: [pin("vcc", "VCC", "VIN", { volts: 5, dir: "in" }), gnd(), ...encoderAB("", 5)],
    rosPackages: [{ name: "diff_drive_controller", note: "Convertit les tics en odométrie" }],
    pros: ["Simple et fiable", "Résolution multipliée par 4 en décodage complet"],
    cons: ["Incrémental : la position est perdue à l'extinction", "Sensible au bruit des moteurs"],
    gotchas: [
      "Alimenté en 5 V, il sort du 5 V. C'est la première cause de GPIO grillés sur Raspberry Pi et Teensy.",
      "Les fils d'encodeur qui longent les câbles de puissance captent le bruit PWM : compte des tics fantômes. Sépare-les physiquement."
    ],
    worksWith: ["jga25-370", "teensy41", "level-shifter", "stm32-blackpill"]
  },
  {
    id: "ina219",
    name: "Capteur de courant INA219",
    brand: "Texas Instruments",
    category: "capteur",
    tagline: "Sais combien il reste de batterie",
    description:
      "Mesure tension, courant et puissance sur I2C. Publier l'état de la batterie dans ROS 2 permet à Nav2 de renvoyer le robot à sa base avant la panne, plutôt qu'après.",
    price: 6,
    level: "Débutant",
    buses: ["I2C"],
    voltage: { min: 3, max: 5.5, nominal: 3.3 },
    currentMa: { typ: 1, peak: 2 },
    logicVolts: 3.3,
    i2cAddress: "0x40",
    i2cAlternates: ["0x41", "0x44", "0x45"],
    weightG: 3,
    specs: [
      { k: "Mesure", v: "Jusqu'à 26 V et ±3,2 A avec le shunt fourni" },
      { k: "Résolution", v: "12 bits" },
      { k: "Adresse I2C", v: "0x40 par défaut, 16 possibles" }
    ],
    pins: [pin("vcc", "VCC", "VIN", { volts: 3.3, dir: "in", tolerant5v: true }), gnd(), ...i2cTolerant(), pin("vin+", "VIN+", "VIN", { dir: "in" }), pin("vin-", "VIN-", "VIN", { dir: "out" })],
    rosPackages: [{ name: "sensor_msgs/BatteryState", note: "Message standard de niveau de batterie" }],
    pros: ["Publie un vrai BatteryState", "Permet le retour à la base automatique", "Presque gratuit"],
    cons: ["3,2 A maximum avec le shunt d'origine", "Mesure côté haut à câbler avec soin"],
    gotchas: [
      "Adresse 0x40 par défaut, exactement comme le PCA9685. Sur le même bus I2C, c'est le conflit classique — change l'adresse par cavalier.",
      "Pour mesurer plus de 3,2 A il faut remplacer le shunt de 0,1 Ω et recalculer l'étalonnage."
    ],
    worksWith: ["lipo-3s-5000", "rpi5", "esp32-s3"]
  },
  {
    id: "gps-neo-m8n",
    name: "Module GPS u-blox NEO-M8N",
    brand: "u-blox",
    category: "capteur",
    tagline: "Localisation grossière en extérieur",
    description:
      "Récepteur multi-constellations avec une précision d'environ 2,5 mètres. Suffisant pour donner une position globale à un robot d'extérieur, insuffisant pour naviguer entre deux rangs de culture.",
    price: 25,
    level: "Intermédiaire",
    buses: ["UART", "I2C"],
    voltage: { min: 3, max: 5.5, nominal: 5 },
    currentMa: { typ: 45, peak: 70 },
    logicVolts: 3.3,
    weightG: 25,
    specs: [
      { k: "Précision", v: "≈ 2,5 m CEP" },
      { k: "Constellations", v: "GPS, GLONASS, Galileo, BeiDou" },
      { k: "Cadence", v: "1 à 10 Hz" }
    ],
    pins: [pin("vcc", "VCC 3-5,5V", "VIN", { volts: 5, dir: "in" }), gnd(), ...uart(3.3), ...i2cTolerant()],
    rosPackages: [
      { name: "ublox_gps", note: "Publie sensor_msgs/NavSatFix" },
      { name: "robot_localization", note: "navsat_transform_node convertit en repère local" }
    ],
    pros: ["Position absolue en extérieur", "Bon marché", "Pilote ROS 2 mature"],
    cons: ["Inutilisable en intérieur", "2,5 m de précision seulement", "Fixation initiale lente à froid"],
    gotchas: [
      "2,5 m de précision, c'est plus large qu'un robot : jamais de navigation fine au GPS seul, il faut fusionner avec l'odométrie.",
      "L'antenne doit voir le ciel : sous un capot en aluminium, aucun signal."
    ],
    worksWith: ["rpi5", "bno085", "mini-pc-n100"]
  },
  {
    id: "gps-zed-f9p",
    name: "GNSS RTK u-blox ZED-F9P",
    brand: "u-blox",
    category: "capteur",
    tagline: "Le centimètre, en extérieur",
    description:
      "Récepteur RTK bi-fréquence : avec une station de base ou un flux de correction NTRIP, la précision descend à quelques centimètres. C'est ce qui rend possible la robotique agricole autonome.",
    price: 220,
    level: "Avancé",
    buses: ["UART", "USB", "I2C"],
    voltage: { min: 3, max: 5.5, nominal: 5 },
    currentMa: { typ: 130, peak: 200 },
    logicVolts: 3.3,
    weightG: 30,
    specs: [
      { k: "Précision", v: "1 cm + 1 ppm en RTK fixé" },
      { k: "Fréquences", v: "L1 et L2, multi-constellations" },
      { k: "Corrections", v: "RTCM3 via NTRIP ou radio" }
    ],
    pins: [pin("vcc", "VCC", "VIN", { volts: 5, dir: "in" }), gnd(), ...uart(3.3), usb("usb", "in")],
    rosPackages: [{ name: "ublox_gps", note: "NavSatFix avec statut RTK dans covariance" }],
    pros: ["Précision centimétrique", "Compatible avec les réseaux NTRIP publics"],
    cons: ["Cher", "Nécessite un flux de correction permanent", "Antenne de qualité indispensable"],
    gotchas: [
      "Sans correction RTCM, la précision retombe à celle d'un GPS ordinaire : vérifie toujours le statut de fixation avant de croire la position."
    ],
    worksWith: ["mini-pc-n100", "jetson-orin-nano"]
  },

  /* ─────────────── Caméras ─────────────── */
  {
    id: "realsense-d435i",
    name: "Intel RealSense D435i",
    brand: "Intel",
    category: "camera",
    tagline: "La caméra de profondeur de référence en robotique",
    description:
      "Stéréo active à projection infrarouge : elle fournit un nuage de points dense en intérieur comme en extérieur modéré, avec une IMU intégrée. Le pilote ROS 2 est excellent, c'est ce qui en fait le choix par défaut pour l'évitement d'obstacles en 3D.",
    price: 320,
    level: "Intermédiaire",
    buses: ["USB"],
    voltage: { min: 5, max: 5, nominal: 5 },
    currentMa: { typ: 700, peak: 1100 },
    weightG: 72,
    specs: [
      { k: "Profondeur", v: "1280×720 à 90 fps" },
      { k: "Portée", v: "0,3 à 3 m utile (10 m annoncés)" },
      { k: "Couleur", v: "1920×1080 à 30 fps" },
      { k: "IMU", v: "Accéléromètre + gyroscope intégrés" },
      { k: "Interface", v: "USB 3.1 Gen 1, type C" }
    ],
    pins: [usb("usb", "in")],
    rosPackages: [
      { name: "realsense2_camera", note: "Pilote officiel, publie image, depth et PointCloud2" },
      { name: "rtabmap_ros", note: "SLAM visuel dense à partir de cette caméra" },
      { name: "depthimage_to_laserscan", note: "Convertit la profondeur en /scan pour Nav2" }
    ],
    pros: [
      "Nuage de points dense sans calcul lourd côté hôte",
      "Pilote ROS 2 très abouti",
      "IMU synchronisée pour le VSLAM"
    ],
    cons: [
      "Exige un vrai port USB 3.0",
      "Consomme 700 mA en continu",
      "Sensible aux surfaces réfléchissantes et transparentes"
    ],
    gotchas: [
      "Sur un port USB 2.0 elle démarre puis se coupe sans message clair. Vérifie avec `lsusb -t` que tu es bien en 5000M.",
      "Un câble USB de mauvaise qualité provoque des coupures aléatoires : utilise celui fourni.",
      "Publier le nuage de points complet sature un Raspberry Pi. Réduis la résolution ou passe en depth seul."
    ],
    worksWith: ["jetson-orin-nano", "mini-pc-n100", "rpi5", "usb-hub-powered"]
  },
  {
    id: "oak-d-lite",
    name: "Luxonis OAK-D Lite",
    brand: "Luxonis",
    category: "camera",
    tagline: "La caméra qui fait tourner le réseau de neurones elle-même",
    description:
      "Stéréo avec un processeur Myriad X embarqué : la détection d'objets tourne dans la caméra et sort déjà sous forme de détections. Le calculateur hôte reste libre, ce qui permet d'utiliser un Raspberry Pi pour de la vision.",
    price: 150,
    level: "Intermédiaire",
    buses: ["USB"],
    voltage: { min: 5, max: 5, nominal: 5 },
    currentMa: { typ: 500, peak: 900 },
    weightG: 61,
    specs: [
      { k: "Profondeur", v: "Stéréo 480p à 90 fps" },
      { k: "Couleur", v: "4056×3040 (IMX214)" },
      { k: "Inférence", v: "Myriad X, 4 TOPS embarqués" },
      { k: "Interface", v: "USB 3.0 type C" }
    ],
    pins: [usb("usb", "in")],
    rosPackages: [
      { name: "depthai_ros_driver", note: "Publie images, profondeur et détections" },
      { name: "depthai_examples", note: "Modèles YOLO et MobileNet prêts à l'emploi" }
    ],
    pros: [
      "L'inférence ne coûte rien au calculateur hôte",
      "Rend la vision par réseau accessible sur Raspberry Pi",
      "Moins chère qu'une RealSense"
    ],
    cons: ["Profondeur moins fine qu'une D435i", "Conversion de modèle en blob obligatoire", "Chauffe"],
    gotchas: [
      "Les modèles doivent être convertis au format .blob pour le Myriad X : un fichier ONNX ne se charge pas directement.",
      "La stéréo passive sans projecteur échoue sur les murs blancs unis, là où la RealSense s'en sort."
    ],
    worksWith: ["rpi5", "mini-pc-n100", "usb-hub-powered"]
  },
  {
    id: "rpi-camera-v3",
    name: "Raspberry Pi Camera Module 3",
    brand: "Raspberry Pi",
    category: "camera",
    tagline: "12 mégapixels avec autofocus, sur le bus CSI",
    description:
      "Caméra CSI qui ne consomme aucun port USB et laisse la bande passante libre pour le LiDAR. Suffisante pour la détection d'AprilTags, le suivi de ligne ou la téléprésence.",
    price: 30,
    level: "Débutant",
    buses: ["USB"],
    voltage: { min: 3.3, max: 3.3, nominal: 3.3 },
    currentMa: { typ: 250, peak: 350 },
    weightG: 4,
    specs: [
      { k: "Capteur", v: "IMX708, 11,9 Mpx" },
      { k: "Autofocus", v: "Détection de phase" },
      { k: "Vidéo", v: "1080p à 50 fps" },
      { k: "Interface", v: "Nappe CSI-2" }
    ],
    pins: [pin("csi", "CSI-2", "USB", { volts: 3.3, dir: "out" })],
    rosPackages: [
      { name: "camera_ros", note: "Pilote libcamera pour ROS 2" },
      { name: "apriltag_ros", note: "Détection de marqueurs pour la localisation" }
    ],
    pros: ["N'occupe pas de port USB", "Autofocus", "Très bon marché"],
    cons: ["Pas de profondeur", "Nappe courte et fragile", "Uniquement sur Raspberry Pi"],
    gotchas: [
      "Sur Ubuntu 24.04 le pilote passe par libcamera et non par l'ancienne pile : le paquet camera_ros est le bon choix.",
      "Toute caméra utilisée pour de la mesure doit être calibrée avec camera_calibration, sinon les AprilTags sont mal positionnés."
    ],
    worksWith: ["rpi5", "rpi4"]
  },
  {
    id: "usb-webcam",
    name: "Webcam USB UVC (type C920)",
    brand: "Logitech",
    category: "camera",
    tagline: "La caméra qui marche partout, tout de suite",
    description:
      "N'importe quelle webcam conforme UVC est reconnue par Linux sans pilote. C'est le moyen le plus rapide d'avoir un flux d'images dans ROS 2 pour tester un algorithme.",
    price: 60,
    level: "Débutant",
    buses: ["USB"],
    voltage: { min: 5, max: 5, nominal: 5 },
    currentMa: { typ: 250, peak: 400 },
    weightG: 160,
    specs: [
      { k: "Résolution", v: "1080p à 30 fps" },
      { k: "Interface", v: "USB 2.0 UVC" },
      { k: "Compression", v: "MJPEG matériel" }
    ],
    pins: [usb("usb", "in")],
    rosPackages: [
      { name: "v4l2_camera", note: "Publie sensor_msgs/Image depuis /dev/video0" },
      { name: "usb_cam", note: "Alternative avec plus d'options de format" },
      { name: "camera_calibration", note: "Produit le fichier d'étalonnage intrinsèque" }
    ],
    pros: ["Aucun pilote à installer", "Disponible partout", "MJPEG matériel, donc peu de CPU"],
    cons: ["Pas de profondeur", "Latence de la compression", "Autofocus qui pompe"],
    gotchas: [
      "Publier en brut fait 1920×1080×3×30 soit près de 180 Mo/s sur le réseau. Reste en MJPEG ou réduis la résolution.",
      "Désactive l'autofocus pour tout usage métrique, sinon l'étalonnage n'est plus valable."
    ],
    worksWith: ["rpi5", "mini-pc-n100", "jetson-orin-nano"]
  }
];
