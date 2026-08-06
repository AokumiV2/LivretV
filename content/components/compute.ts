import type { Component } from "../types";
import {
  bus5v,
  can,
  encoderAB,
  gnd,
  gpios,
  i2c33,
  in5v,
  out3v3,
  out5v,
  pin,
  pwms,
  spi,
  uart,
  usb
} from "./_pins";

/* ══════════════════════════════════════════════════════════════
   Calculateurs (SBC) et microcontrôleurs
   ══════════════════════════════════════════════════════════════ */

export const COMPUTE: Component[] = [
  {
    id: "rpi5",
    name: "Raspberry Pi 5 (8 Go)",
    brand: "Raspberry Pi",
    category: "calculateur",
    tagline: "Le cerveau par défaut d'un robot ROS 2 amateur",
    description:
      "Quatre cœurs Cortex-A76 à 2,4 GHz, assez de puissance pour faire tourner Nav2, SLAM Toolbox et un LiDAR 2D en simultané. C'est le meilleur rapport puissance/prix/communauté pour un premier robot mobile. Sous Ubuntu 24.04 il fait tourner ROS 2 Jazzy nativement, sans bidouille.",
    price: 85,
    level: "Débutant",
    buses: ["USB", "Ethernet", "I2C", "SPI", "UART", "GPIO", "PWM"],
    voltage: { min: 4.75, max: 5.25, nominal: 5 },
    currentMa: { typ: 1200, peak: 5000 },
    logicVolts: 3.3,
    weightG: 46,
    specs: [
      { k: "CPU", v: "BCM2712, 4× Cortex-A76 @ 2,4 GHz" },
      { k: "RAM", v: "8 Go LPDDR4X-4267" },
      { k: "Alimentation", v: "USB-C PD 5 V / 5 A (27 W)" },
      { k: "GPIO", v: "40 broches, logique 3,3 V stricte" },
      { k: "Réseau", v: "Gigabit Ethernet, Wi-Fi 5, BT 5.0" },
      { k: "USB", v: "2× USB 3.0, 2× USB 2.0" },
      { k: "OS conseillé", v: "Ubuntu Server 24.04 LTS (ROS 2 Jazzy)" }
    ],
    pins: [
      bus5v("5v"),
      out3v3("3v3"),
      gnd(),
      ...i2c33(),
      ...uart(3.3),
      ...spi(3.3),
      ...gpios(20, 3.3, false),
      usb("usb", "out"),
      pin("eth", "Ethernet", "ETH", { dir: "io" })
    ],
    rosPackages: [
      { name: "ros-jazzy-desktop", note: "Installation complète avec RViz2" },
      { name: "ros-jazzy-ros-base", note: "Version sans interface graphique, à privilégier embarquée" },
      { name: "v4l2_camera", note: "Flux de la caméra CSI ou USB en sensor_msgs/Image" }
    ],
    pros: [
      "Communauté immense : quasiment tout problème a déjà été résolu par quelqu'un",
      "Ubuntu 24.04 officiel donc paquets ROS 2 binaires, pas de compilation",
      "USB 3.0 réel, indispensable pour une caméra de profondeur"
    ],
    cons: [
      "Pas d'accélération pour l'inférence : oublie YOLO temps réel",
      "Exige une alimentation 5 V / 5 A sérieuse, sinon throttling",
      "Chauffe : un dissipateur actif n'est pas optionnel"
    ],
    gotchas: [
      "Les GPIO ne sont PAS tolérants 5 V. Une broche d'encodeur en 5 V branchée directement détruit le SoC.",
      "Le port USB-C ne délivre 5 A que si le chargeur annonce le profil PD adéquat ; sinon le Pi bride ses ports USB.",
      "La bibliothèque RPi.GPIO ne fonctionne plus sur Pi 5 : il faut passer à lgpio ou gpiod."
    ],
    worksWith: ["rplidar-a1", "bno085", "realsense-d435i", "bec-5v-5a", "pca9685", "level-shifter"]
  },
  {
    id: "rpi4",
    name: "Raspberry Pi 4 B (4 Go)",
    brand: "Raspberry Pi",
    category: "calculateur",
    tagline: "L'ancien fidèle, encore largement suffisant",
    description:
      "Moins rapide que le Pi 5 mais moins gourmand et souvent moins cher d'occasion. Fait tourner un robot différentiel avec LiDAR 2D et Nav2 sans difficulté, à condition de ne pas y ajouter de vision lourde.",
    price: 55,
    level: "Débutant",
    buses: ["USB", "Ethernet", "I2C", "SPI", "UART", "GPIO", "PWM"],
    voltage: { min: 4.75, max: 5.25, nominal: 5 },
    currentMa: { typ: 700, peak: 3000 },
    logicVolts: 3.3,
    weightG: 46,
    specs: [
      { k: "CPU", v: "BCM2711, 4× Cortex-A72 @ 1,5 GHz" },
      { k: "RAM", v: "4 Go LPDDR4" },
      { k: "Alimentation", v: "USB-C 5 V / 3 A" },
      { k: "GPIO", v: "40 broches, logique 3,3 V" }
    ],
    pins: [
      bus5v("5v"),
      out3v3("3v3"),
      gnd(),
      ...i2c33(),
      ...uart(3.3),
      ...spi(3.3),
      ...gpios(20, 3.3, false),
      usb("usb", "out"),
      pin("eth", "Ethernet", "ETH", { dir: "io" })
    ],
    rosPackages: [
      { name: "ros-humble-ros-base", note: "Ubuntu 22.04, la combinaison la plus testée sur Pi 4" }
    ],
    pros: ["Consommation modérée", "Énorme base de tutoriels", "Bon marché d'occasion"],
    cons: ["CPU juste pour la vision", "USB 3 partagé avec l'Ethernet sur le même bus"],
    gotchas: [
      "GPIO non tolérants 5 V, même remarque que sur le Pi 5.",
      "Les premiers modèles USB-C refusent les câbles e-marked : un grand classique de 2019."
    ],
    worksWith: ["rplidar-a1", "mpu6050", "bec-5v-5a", "tb6612fng"]
  },
  {
    id: "jetson-orin-nano",
    name: "Jetson Orin Nano 8 Go",
    brand: "NVIDIA",
    category: "calculateur",
    tagline: "Quand le robot doit voir et comprendre",
    description:
      "GPU Ampere avec 1024 cœurs CUDA et 32 cœurs Tensor. C'est la carte à prendre dès que la perception par réseau de neurones entre dans le projet : détection d'objets, segmentation, VSLAM accéléré avec Isaac ROS. Le prix et la complexité logicielle sont le ticket d'entrée.",
    price: 260,
    level: "Avancé",
    buses: ["USB", "Ethernet", "I2C", "SPI", "UART", "GPIO", "CAN", "PWM"],
    voltage: { min: 4.75, max: 20, nominal: 12 },
    currentMa: { typ: 1500, peak: 3500 },
    logicVolts: 3.3,
    weightG: 176,
    specs: [
      { k: "CPU", v: "6× Cortex-A78AE @ 1,7 GHz" },
      { k: "GPU", v: "Ampere 1024 cœurs CUDA, 32 Tensor" },
      { k: "IA", v: "40 TOPS (67 TOPS en mode Super)" },
      { k: "RAM", v: "8 Go LPDDR5, 102 Go/s" },
      { k: "Enveloppe", v: "7 W / 15 W / 25 W configurables" },
      { k: "Alimentation", v: "Jack 9–19 V ou USB-C 5 V / 5 A" }
    ],
    pins: [
      pin("vin", "DC IN 9-19V", "VIN", { volts: 12, dir: "in" }),
      out5v("5v"),
      out3v3("3v3"),
      gnd(),
      ...i2c33(),
      ...uart(3.3),
      ...spi(3.3),
      ...can(),
      ...gpios(16, 3.3, false),
      usb("usb", "out"),
      pin("eth", "Ethernet", "ETH", { dir: "io" })
    ],
    rosPackages: [
      { name: "isaac_ros_visual_slam", note: "VSLAM accéléré GPU, temps réel sur cette carte" },
      { name: "isaac_ros_dnn_inference", note: "TensorRT branché sur des topics ROS 2" },
      { name: "ros-humble-ros-base", note: "JetPack 6 est basé sur Ubuntu 22.04" }
    ],
    pros: [
      "Seule option raisonnable pour de l'inférence temps réel embarquée",
      "Isaac ROS fournit des nœuds déjà optimisés",
      "CAN natif, pratique pour les contrôleurs moteurs sérieux"
    ],
    cons: [
      "Cher, et le kit de développement est encombrant",
      "JetPack impose sa version d'Ubuntu, donc sa distribution ROS",
      "Consommation qui pèse lourd sur un budget batterie"
    ],
    gotchas: [
      "JetPack 6 reste sur Ubuntu 22.04 : tu seras sur Humble, pas Jazzy. Vérifie ce point avant d'écrire une ligne de code.",
      "Le mode 25 W n'est utile qu'avec un refroidissement correct, sinon la carte se bride toute seule.",
      "Beaucoup de paquets ROS 2 n'ont pas de binaire arm64 : prévois de compiler depuis les sources."
    ],
    worksWith: ["realsense-d435i", "oak-d-lite", "livox-mid360", "lipo-4s-5200", "buck-12v-5a"]
  },
  {
    id: "orange-pi-5",
    name: "Orange Pi 5 Plus (8 Go)",
    brand: "Orange Pi",
    category: "calculateur",
    tagline: "Beaucoup de CPU pour peu d'argent",
    description:
      "RK3588 huit cœurs : nettement plus rapide qu'un Pi 5 en calcul pur, avec deux ports 2,5 GbE et du NVMe. Le compromis se paie sur le support logiciel, moins poli que chez Raspberry Pi.",
    price: 110,
    level: "Intermédiaire",
    buses: ["USB", "Ethernet", "I2C", "SPI", "UART", "GPIO"],
    voltage: { min: 5, max: 20, nominal: 5 },
    currentMa: { typ: 1400, peak: 4000 },
    logicVolts: 3.3,
    weightG: 105,
    specs: [
      { k: "CPU", v: "RK3588, 4× A76 + 4× A55" },
      { k: "NPU", v: "6 TOPS (RKNN, hors écosystème ROS)" },
      { k: "Réseau", v: "2× 2,5 GbE" },
      { k: "Stockage", v: "NVMe M.2 natif" }
    ],
    pins: [bus5v("5v"), out3v3("3v3"), gnd(), ...i2c33(), ...uart(3.3), ...spi(3.3), ...gpios(16), usb("usb", "out")],
    rosPackages: [{ name: "ros-jazzy-ros-base", note: "Via Ubuntu 24.04 arm64 de Joshua Riek" }],
    pros: ["Rapport puissance/prix imbattable", "NVMe natif, gros gain sur les rosbags"],
    cons: ["Noyau vendeur, mises à jour aléatoires", "Documentation GPIO approximative"],
    gotchas: [
      "Le NPU de 6 TOPS ne se pilote qu'avec la chaîne propriétaire RKNN : il n'existe rien d'équivalent à Isaac ROS."
    ],
    worksWith: ["rplidar-a2m12", "usb-hub-powered", "buck-12v-5a"]
  },
  {
    id: "mini-pc-n100",
    name: "Mini-PC Intel N100",
    brand: "Générique",
    category: "calculateur",
    tagline: "x86 embarqué : tout marche du premier coup",
    description:
      "Un mini-PC N100 se glisse sur un robot de taille moyenne et supprime d'un coup tous les problèmes d'architecture arm64. Chaque paquet ROS 2 a un binaire amd64, Gazebo tourne, RViz2 tourne. Alimentation 12 V, ce qui tombe bien avec une batterie 3S ou 4S.",
    price: 150,
    level: "Intermédiaire",
    buses: ["USB", "Ethernet"],
    voltage: { min: 9, max: 20, nominal: 12 },
    currentMa: { typ: 1000, peak: 3000 },
    weightG: 350,
    specs: [
      { k: "CPU", v: "Intel N100, 4 cœurs @ 3,4 GHz" },
      { k: "RAM", v: "8 à 16 Go DDR4/DDR5" },
      { k: "Alimentation", v: "12 V DC, 3 A" },
      { k: "Architecture", v: "amd64 — tous les binaires ROS 2 existent" }
    ],
    pins: [pin("vin", "DC 12V", "VIN", { volts: 12, dir: "in" }), gnd(), usb("usb", "out"), pin("eth", "Ethernet", "ETH", { dir: "io" })],
    rosPackages: [{ name: "ros-jazzy-desktop-full", note: "Y compris Gazebo et tous les outils de démo" }],
    pros: [
      "Zéro surprise de compatibilité : c'est la même architecture que ton PC de bureau",
      "12 V natif, pas besoin de régulateur 5 V costaud",
      "Gazebo et RViz2 tournent directement sur le robot"
    ],
    cons: ["Pas de GPIO du tout : il faut un microcontrôleur à côté", "Plus lourd et volumineux qu'une SBC"],
    gotchas: [
      "Aucun GPIO ni I2C : associe-le systématiquement à un ESP32 ou un Teensy en micro-ROS pour le bas niveau."
    ],
    worksWith: ["esp32-s3", "teensy41", "lipo-4s-5200", "rplidar-a2m12"]
  },

  /* ─────────────── Microcontrôleurs ─────────────── */

  {
    id: "esp32-s3",
    name: "ESP32-S3 DevKitC",
    brand: "Espressif",
    category: "microcontroleur",
    tagline: "Le micro-ROS sans fil, pour trois euros",
    description:
      "Deux cœurs Xtensa à 240 MHz, Wi-Fi et Bluetooth intégrés. Avec micro-ROS il publie directement des topics ROS 2 sur le réseau : plus besoin de câble entre la base roulante et le calculateur. C'est le meilleur point d'entrée pour déporter le temps réel hors du Linux.",
    price: 8,
    level: "Débutant",
    buses: ["I2C", "SPI", "UART", "GPIO", "PWM", "Analogique", "USB"],
    voltage: { min: 3, max: 3.6, nominal: 3.3 },
    currentMa: { typ: 90, peak: 500 },
    logicVolts: 3.3,
    weightG: 9,
    specs: [
      { k: "CPU", v: "2× Xtensa LX7 @ 240 MHz" },
      { k: "RAM", v: "512 Ko SRAM + 8 Mo PSRAM" },
      { k: "Sans fil", v: "Wi-Fi 802.11 b/g/n, BLE 5" },
      { k: "GPIO", v: "45 broches, logique 3,3 V" },
      { k: "ADC", v: "2× 12 bits" }
    ],
    pins: [
      in5v("5v"),
      out3v3("3v3"),
      gnd(),
      ...i2c33(),
      ...uart(3.3),
      ...spi(3.3),
      ...gpios(20, 3.3, false),
      ...pwms(8, 3.3),
      usb("usb", "in")
    ],
    rosPackages: [
      { name: "micro_ros_arduino", note: "Bibliothèque Arduino, la voie la plus rapide" },
      { name: "micro_ros_espidf_component", note: "Intégration ESP-IDF, plus propre en production" },
      { name: "micro_ros_agent", note: "À lancer côté Linux pour faire le pont vers le graphe ROS 2" }
    ],
    pros: [
      "Wi-Fi intégré : micro-ROS sans le moindre câble",
      "Prix dérisoire, on en met plusieurs sans réfléchir",
      "PWM matériel de qualité pour piloter des moteurs"
    ],
    cons: [
      "3,3 V strict, pas tolérant 5 V",
      "Le Wi-Fi introduit de la gigue : évite-le pour une boucle d'asservissement rapide",
      "L'ADC est notoirement peu linéaire"
    ],
    gotchas: [
      "Un agent micro-ROS doit tourner en permanence côté Linux, sinon le nœud n'apparaît jamais dans `ros2 node list`.",
      "Le régulateur embarqué ne fournit que 500 mA sur la broche 3V3 : n'alimente pas un LiDAR avec.",
      "Les GPIO 19 et 20 servent à l'USB natif sur le S3 : les utiliser coupe la liaison série."
    ],
    worksWith: ["mpu6050", "bno085", "tb6612fng", "as5600", "level-shifter"]
  },
  {
    id: "teensy41",
    name: "Teensy 4.1",
    brand: "PJRC",
    category: "microcontroleur",
    tagline: "600 MHz de temps réel pour les boucles serrées",
    description:
      "Cortex-M7 à 600 MHz : c'est le microcontrôleur qu'on choisit quand la boucle d'asservissement doit tourner à 1 kHz sans jamais rater un cycle. Il gère plusieurs encodeurs en quadrature matériels, du CAN FD et une liaison USB rapide vers le calculateur.",
    price: 32,
    level: "Intermédiaire",
    buses: ["I2C", "SPI", "UART", "CAN", "GPIO", "PWM", "Analogique", "Quadrature", "USB"],
    voltage: { min: 3.3, max: 5.5, nominal: 5 },
    currentMa: { typ: 100, peak: 250 },
    logicVolts: 3.3,
    weightG: 5,
    specs: [
      { k: "CPU", v: "Cortex-M7 @ 600 MHz" },
      { k: "RAM", v: "1 Mo" },
      { k: "E/S", v: "55 broches, 35 sorties PWM" },
      { k: "CAN", v: "3 contrôleurs dont 1 CAN FD" },
      { k: "Encodeurs", v: "Décodage quadrature matériel" }
    ],
    pins: [
      in5v("5v"),
      out3v3("3v3"),
      gnd(),
      ...i2c33(),
      ...uart(3.3),
      ...spi(3.3),
      ...can(),
      ...encoderAB("e0_"),
      ...encoderAB("e1_"),
      ...gpios(24, 3.3, false),
      ...pwms(12, 3.3),
      usb("usb", "in")
    ],
    rosPackages: [
      { name: "micro_ros_arduino", note: "Support Teensy officiel, liaison série USB" },
      { name: "ros2_control", note: "Le Teensy joue le rôle de couche matérielle" }
    ],
    pros: [
      "Déterminisme réel, contrairement à un Linux non temps réel",
      "Décodage d'encodeurs en matériel, sans charge CPU",
      "USB série très rapide vers le calculateur"
    ],
    cons: ["Pas de sans-fil", "Écosystème lié à l'IDE Arduino / PlatformIO"],
    gotchas: [
      "Alimenté en 5 V mais les E/S sont en 3,3 V et NE SONT PAS tolérantes 5 V. C'est la cause numéro un de Teensy grillés.",
      "Pour utiliser le CAN il faut un transceiver externe type SN65HVD230 : le Teensy n'a que le contrôleur."
    ],
    worksWith: ["odrive-s1", "tb6612fng", "can-transceiver", "hall-encoder", "mini-pc-n100"]
  },
  {
    id: "rpi-pico",
    name: "Raspberry Pi Pico 2",
    brand: "Raspberry Pi",
    category: "microcontroleur",
    tagline: "Le PIO qui change tout pour les encodeurs",
    description:
      "Le RP2350 embarque des machines d'état programmables (PIO) capables de décoder des encodeurs ou de générer des signaux exotiques sans consommer de CPU. À quatre euros, c'est imbattable pour la couche basse d'un robot.",
    price: 5,
    level: "Débutant",
    buses: ["I2C", "SPI", "UART", "GPIO", "PWM", "Analogique", "USB"],
    voltage: { min: 1.8, max: 5.5, nominal: 5 },
    currentMa: { typ: 35, peak: 120 },
    logicVolts: 3.3,
    weightG: 3,
    specs: [
      { k: "CPU", v: "RP2350, 2× Cortex-M33 @ 150 MHz" },
      { k: "RAM", v: "520 Ko" },
      { k: "Particularité", v: "12 machines d'état PIO" },
      { k: "GPIO", v: "26 broches, 3,3 V" }
    ],
    pins: [in5v("vsys"), out3v3("3v3"), gnd(), ...i2c33(), ...uart(3.3), ...spi(3.3), ...gpios(20, 3.3, false), ...pwms(8), usb("usb", "in")],
    rosPackages: [{ name: "micro_ros_raspberrypi_pico_sdk", note: "Portage officiel micro-ROS" }],
    pros: ["Prix ridicule", "PIO pour du décodage sans CPU", "Consommation minuscule"],
    cons: ["Pas de sans-fil sur la version de base", "Moins de puissance de calcul qu'un Teensy"],
    gotchas: [
      "VSYS accepte 1,8 à 5,5 V mais les GPIO restent en 3,3 V non tolérants."
    ],
    worksWith: ["tb6612fng", "as5600", "hall-encoder"]
  },
  {
    id: "opencr",
    name: "OpenCR 1.0",
    brand: "ROBOTIS",
    category: "microcontroleur",
    tagline: "La carte de contrôle du TurtleBot3",
    description:
      "Carte pensée pour ROS : STM32F7, IMU intégrée, connecteurs Dynamixel, gestion de batterie et firmware micro-ROS fourni. Si tu construis un clone de TurtleBot3, elle t'évite des semaines d'intégration.",
    price: 160,
    level: "Intermédiaire",
    buses: ["UART", "I2C", "SPI", "GPIO", "PWM", "CAN", "USB"],
    voltage: { min: 7, max: 24, nominal: 12 },
    currentMa: { typ: 200, peak: 800 },
    logicVolts: 3.3,
    weightG: 60,
    specs: [
      { k: "CPU", v: "STM32F746 @ 216 MHz" },
      { k: "IMU", v: "Gyroscope + accéléromètre 3 axes intégrés" },
      { k: "Dynamixel", v: "3 connecteurs TTL + RS485" },
      { k: "Entrée", v: "7–24 V avec protection" }
    ],
    pins: [pin("vin", "VIN 7-24V", "VIN", { volts: 12, dir: "in" }), out5v(), out3v3(), gnd(), ...uart(3.3), ...i2c33(), ...gpios(12), usb("usb", "io")],
    rosPackages: [{ name: "turtlebot3_bringup", note: "Firmware et pile logicielle officiels" }],
    pros: ["Tout intégré, conçu pour ROS dès l'origine", "Entrée large 7–24 V protégée"],
    cons: ["Cher pour ce que c'est", "Écosystème fermé autour de ROBOTIS"],
    gotchas: ["Le firmware doit être flashé dans la version qui correspond exactement à ta distribution ROS 2."],
    worksWith: ["dynamixel-xl430", "rplidar-a1", "rpi5"]
  },
  {
    id: "stm32-blackpill",
    name: "STM32F411 « Black Pill »",
    brand: "WeAct",
    category: "microcontroleur",
    tagline: "Du STM32 sérieux pour cinq euros",
    description:
      "Cortex-M4F à 100 MHz avec unité de calcul flottant. Idéal pour porter une boucle de contrôle écrite en C sur du matériel industriel, avec les timers avancés du STM32 pour les encodeurs.",
    price: 6,
    level: "Avancé",
    buses: ["I2C", "SPI", "UART", "GPIO", "PWM", "Analogique", "Quadrature", "USB"],
    voltage: { min: 3.3, max: 5, nominal: 5 },
    currentMa: { typ: 40, peak: 100 },
    logicVolts: 3.3,
    weightG: 5,
    specs: [
      { k: "CPU", v: "STM32F411CE, Cortex-M4F @ 100 MHz" },
      { k: "Timers", v: "Mode encodeur matériel sur TIM1/2/3/4" },
      { k: "GPIO", v: "Majoritairement tolérants 5 V" }
    ],
    pins: [in5v("5v"), out3v3(), gnd(), ...i2c33(), ...uart(3.3), ...spi(3.3), ...encoderAB("e0_"), ...gpios(20, 3.3, true), ...pwms(8), usb("usb", "in")],
    rosPackages: [{ name: "micro_ros_stm32cubemx_utils", note: "Intégration dans un projet CubeMX" }],
    pros: ["Timers en mode encodeur, précis et gratuits en CPU", "La plupart des broches tolèrent 5 V"],
    cons: ["Chaîne de compilation plus rude que Arduino", "Qualité des clones variable"],
    gotchas: ["Attention : certaines broches (PA0, analogiques) ne sont PAS tolérantes 5 V. Vérifie la datasheet broche par broche."],
    worksWith: ["hall-encoder", "tb6612fng", "can-transceiver"]
  }
];
