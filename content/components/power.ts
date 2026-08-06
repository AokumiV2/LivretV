import type { Component } from "../types";
import { can, gnd, i2cTolerant, in5v, out3v3, out5v, pin, usb, vin } from "./_pins";

/* ══════════════════════════════════════════════════════════════
   Énergie, distribution et connectique
   ══════════════════════════════════════════════════════════════ */

export const POWER: Component[] = [
  {
    id: "lipo-3s-5000",
    name: "Batterie LiPo 3S 5000 mAh",
    brand: "Générique",
    category: "alimentation",
    tagline: "11,1 V, l'énergie d'un robot d'intérieur",
    description:
      "Trois éléments en série, 11,1 V nominal et 55 Wh d'énergie. C'est le format le plus courant pour une base roulante d'intérieur : environ deux heures d'autonomie pour un robot qui consomme 25 W en moyenne.",
    price: 45,
    level: "Intermédiaire",
    buses: [],
    voltage: { min: 9, max: 12.6, nominal: 11.1 },
    currentMa: { typ: 0, peak: 0 },
    suppliesMa: 25000,
    weightG: 380,
    specs: [
      { k: "Tension", v: "11,1 V nominal, 12,6 V chargée, 9 V vide" },
      { k: "Capacité", v: "5000 mAh soit 55 Wh" },
      { k: "Décharge", v: "50C, environ 250 A en pic théorique" },
      { k: "Connecteur", v: "XT60 + prise d'équilibrage JST-XH" }
    ],
    pins: [pin("v+", "V+ 11,1V", "VIN", { volts: 11.1, dir: "out" }), gnd()],
    rosPackages: [{ name: "sensor_msgs/BatteryState", note: "À publier depuis un INA219 ou le BMS" }],
    pros: ["Densité d'énergie élevée", "Fort courant disponible", "Format standard, chargeurs partout"],
    cons: [
      "Prend feu si maltraitée",
      "Se détruit si un élément descend sous 3 V",
      "Nécessite un chargeur équilibreur"
    ],
    gotchas: [
      "Ne descends jamais sous 3,3 V par élément, soit 9,9 V au total. En dessous, la batterie est bonne pour le recyclage.",
      "Une LiPo se stocke à 3,8 V par élément, pas chargée à bloc. Stockée pleine trois mois, elle gonfle.",
      "Charge-la toujours dans un sac ignifuge, et jamais sans surveillance. Ce n'est pas une précaution théorique."
    ],
    worksWith: ["bec-5v-5a", "buck-12v-5a", "bms-3s", "power-board", "ina219"]
  },
  {
    id: "lipo-4s-5200",
    name: "Batterie LiPo 4S 5200 mAh",
    brand: "Générique",
    category: "alimentation",
    tagline: "14,8 V pour les robots qui tirent fort",
    description:
      "Quatre éléments, 14,8 V nominal, 77 Wh. Le bon choix quand le robot embarque un Jetson, des moteurs de 12 V sous charge et un LiDAR 3D : la marge au-dessus de 12 V permet aux régulateurs de tenir jusqu'en fin de décharge.",
    price: 60,
    level: "Intermédiaire",
    buses: [],
    voltage: { min: 12, max: 16.8, nominal: 14.8 },
    currentMa: { typ: 0, peak: 0 },
    suppliesMa: 30000,
    weightG: 520,
    specs: [
      { k: "Tension", v: "14,8 V nominal, 16,8 V chargée" },
      { k: "Capacité", v: "5200 mAh soit 77 Wh" },
      { k: "Connecteur", v: "XT60 ou XT90" }
    ],
    pins: [pin("v+", "V+ 14,8V", "VIN", { volts: 14.8, dir: "out" }), gnd()],
    rosPackages: [{ name: "sensor_msgs/BatteryState", note: "Publication du niveau via capteur de courant" }],
    pros: ["Marge confortable pour les régulateurs 12 V", "Beaucoup d'énergie embarquée"],
    cons: ["Lourde", "16,8 V à pleine charge détruit un équipement prévu pour 12 V"],
    gotchas: [
      "Chargée à bloc elle sort 16,8 V. Un moteur ou un régulateur limité à 15 V branché directement grille immédiatement.",
      "77 Wh dépasse la limite de 100 Wh du transport aérien en cabine seulement de peu : vérifie avant de voyager avec."
    ],
    worksWith: ["jetson-orin-nano", "buck-12v-5a", "bts7960", "odrive-s1"]
  },
  {
    id: "li-ion-4s",
    name: "Pack Li-ion 4S 18650",
    brand: "Générique",
    category: "alimentation",
    tagline: "Moins nerveux, beaucoup plus durable",
    description:
      "Pack de cellules 18650 avec BMS intégré : moins de courant crête qu'une LiPo, mais mille cycles au lieu de trois cents et un comportement bien plus sûr. Le bon choix pour un robot qui roule tous les jours.",
    price: 55,
    level: "Débutant",
    buses: [],
    voltage: { min: 12, max: 16.8, nominal: 14.4 },
    currentMa: { typ: 0, peak: 0 },
    suppliesMa: 10000,
    weightG: 400,
    specs: [
      { k: "Tension", v: "14,4 V nominal" },
      { k: "Capacité", v: "3000 à 3500 mAh par cellule" },
      { k: "Cycles", v: "≈ 1000 contre 300 pour une LiPo" },
      { k: "BMS", v: "Protection intégrée" }
    ],
    pins: [pin("v+", "V+ 14,4V", "VIN", { volts: 14.4, dir: "out" }), gnd()],
    rosPackages: [{ name: "sensor_msgs/BatteryState", note: "Publication du niveau" }],
    pros: ["Longue durée de vie", "BMS intégré, donc protection contre la décharge profonde", "Chimie plus sûre"],
    cons: ["Courant crête limité", "Plus lourd à capacité égale"],
    gotchas: ["Le BMS coupe brutalement en fin de décharge : le robot s'éteint net, sans avertissement. Publie l'état de batterie pour l'anticiper."],
    worksWith: ["buck-12v-5a", "bec-5v-5a", "rpi5"]
  },
  {
    id: "bec-5v-5a",
    name: "UBEC 5 V / 5 A",
    brand: "Générique",
    category: "alimentation",
    tagline: "Le régulateur qui empêche le Pi de redémarrer",
    description:
      "Abaisseur à découpage qui transforme le 11,1 ou 14,8 V de la batterie en 5 V stable capable de 5 A. C'est la pièce qui sépare un robot qui fonctionne d'un robot qui redémarre chaque fois que les moteurs démarrent.",
    price: 12,
    level: "Débutant",
    buses: [],
    voltage: { min: 6, max: 26, nominal: 12 },
    currentMa: { typ: 20, peak: 5000 },
    suppliesMa: 5000,
    weightG: 25,
    specs: [
      { k: "Entrée", v: "6 à 26 V" },
      { k: "Sortie", v: "5 V, 5 A continu, 6 A crête" },
      { k: "Rendement", v: "≈ 92 %" },
      { k: "Topologie", v: "Découpage synchrone" }
    ],
    pins: [vin("vin", 12, "VIN 6-26V"), gnd(), out5v("vout")],
    rosPackages: [],
    pros: ["Rendement élevé, peu de chaleur", "5 A suffisent à un Pi 5 avec ses périphériques", "Bon marché"],
    cons: ["Bruit de découpage sur la ligne", "Aucune protection contre l'inversion de polarité"],
    gotchas: [
      "Un seul BEC pour le calculateur ET les servos ne marche pas : le pic de courant des servos fait chuter la tension et le Pi redémarre. Prends-en deux.",
      "Le bruit de découpage perturbe les capteurs analogiques : ajoute un condensateur de 470 µF près de la charge.",
      "Inverser l'entrée détruit le module instantanément. Repère les polarités avant de brancher."
    ],
    worksWith: ["lipo-3s-5000", "rpi5", "rplidar-a1", "pca9685"]
  },
  {
    id: "buck-12v-5a",
    name: "Convertisseur abaisseur 12 V / 5 A",
    brand: "Générique",
    category: "alimentation",
    tagline: "Le 12 V stable, même quand la batterie faiblit",
    description:
      "Régulateur à découpage réglable qui maintient 12 V constants pendant que la batterie 4S descend de 16,8 à 12 V. Sans lui, la vitesse des moteurs change au fil de la décharge et l'odométrie dérive.",
    price: 10,
    level: "Débutant",
    buses: [],
    voltage: { min: 5, max: 32, nominal: 16 },
    currentMa: { typ: 15, peak: 5000 },
    suppliesMa: 5000,
    weightG: 30,
    specs: [
      { k: "Entrée", v: "5 à 32 V" },
      { k: "Sortie", v: "1,25 à 30 V réglable, 5 A" },
      { k: "Rendement", v: "≈ 90 %" }
    ],
    pins: [vin("vin", 16, "VIN 5-32V"), gnd(), pin("vout", "VOUT réglable", "VIN", { volts: 12, dir: "out" })],
    rosPackages: [],
    pros: ["Tension de sortie stable et réglable", "Supprime la dérive d'odométrie liée à la décharge"],
    cons: ["Il faut régler la sortie au multimètre avant de brancher quoi que ce soit"],
    gotchas: [
      "Un abaisseur ne peut pas élever la tension : sous 12 V d'entrée, la sortie suit la batterie vers le bas.",
      "Règle la sortie AVANT de connecter la charge. À la réception, le potentiomètre est souvent au maximum."
    ],
    worksWith: ["lipo-4s-5200", "jga25-370", "nema17", "mini-pc-n100"]
  },
  {
    id: "bms-3s",
    name: "BMS 3S avec équilibrage",
    brand: "Générique",
    category: "alimentation",
    tagline: "Le garde-fou qui sauve la batterie",
    description:
      "Circuit de protection qui coupe en cas de surcharge, de décharge profonde, de court-circuit, et qui équilibre les éléments. Obligatoire sur un pack assemblé soi-même.",
    price: 8,
    level: "Intermédiaire",
    buses: [],
    voltage: { min: 9, max: 12.6, nominal: 11.1 },
    currentMa: { typ: 1, peak: 0 },
    suppliesMa: 20000,
    weightG: 15,
    specs: [
      { k: "Éléments", v: "3S" },
      { k: "Courant", v: "20 A continu" },
      { k: "Protections", v: "Surcharge, décharge profonde, court-circuit, équilibrage" }
    ],
    pins: [pin("b+", "B+", "VIN", { volts: 11.1, dir: "in" }), pin("b-", "B-", "GND", { volts: 0, dir: "in" }), pin("p+", "P+ sortie", "VIN", { volts: 11.1, dir: "out" }), gnd("p-")],
    rosPackages: [],
    pros: ["Protège contre la décharge profonde", "Équilibre les éléments à chaque charge", "Presque gratuit"],
    cons: ["Introduit une petite chute de tension", "Coupe sans prévenir"],
    gotchas: ["La coupure est instantanée : sans publication de l'état de batterie, le robot s'arrête en pleine mission."],
    worksWith: ["li-ion-4s", "lipo-3s-5000"]
  },
  {
    id: "power-board",
    name: "Carte de distribution avec XT60",
    brand: "Générique",
    category: "alimentation",
    tagline: "Un point unique pour la masse et la puissance",
    description:
      "Plaque qui répartit la batterie vers les régulateurs et les drivers, avec un plan de masse commun. C'est ce qui évite le nœud de dominos et les boucles de masse qui polluent les capteurs.",
    price: 15,
    level: "Débutant",
    buses: [],
    voltage: { min: 6, max: 30, nominal: 12 },
    currentMa: { typ: 0, peak: 0 },
    suppliesMa: 60000,
    weightG: 40,
    specs: [
      { k: "Entrée", v: "XT60, jusqu'à 60 A" },
      { k: "Sorties", v: "6 paires en parallèle" },
      { k: "Masse", v: "Plan commun sur toute la carte" }
    ],
    pins: [vin("in", 12, "Entrée XT60"), gnd(), pin("out1", "Sortie 1", "VIN", { volts: 12, dir: "out" }), pin("out2", "Sortie 2", "VIN", { volts: 12, dir: "out" }), pin("out3", "Sortie 3", "VIN", { volts: 12, dir: "out" })],
    rosPackages: [],
    pros: ["Masse commune propre", "Câblage lisible et démontable"],
    cons: ["Une pièce de plus à loger"],
    gotchas: [
      "Toutes les masses du robot doivent se rejoindre en un seul point. Deux masses séparées créent une différence de potentiel qui fausse les signaux I2C."
    ],
    worksWith: ["lipo-3s-5000", "bec-5v-5a", "buck-12v-5a", "fuse-switch"]
  },
  {
    id: "fuse-switch",
    name: "Interrupteur anti-étincelle et fusible",
    brand: "Générique",
    category: "alimentation",
    tagline: "Cinq euros contre un incendie",
    description:
      "Interrupteur avec limitation du courant d'appel et porte-fusible en série sur la batterie. Sur un pack au-delà de 3S, ce n'est pas un accessoire.",
    price: 14,
    level: "Débutant",
    buses: [],
    voltage: { min: 6, max: 60, nominal: 12 },
    currentMa: { typ: 0, peak: 0 },
    suppliesMa: 40000,
    weightG: 45,
    specs: [
      { k: "Courant", v: "40 A avec fusible remplaçable" },
      { k: "Anti-étincelle", v: "Précharge des condensateurs" }
    ],
    pins: [vin("in", 12, "Batterie"), pin("out", "Vers robot", "VIN", { volts: 12, dir: "out" }), gnd()],
    rosPackages: [],
    pros: ["Coupe tout en un geste", "Évite l'arc à la connexion", "Le fusible protège du court-circuit"],
    cons: ["Aucun"],
    gotchas: ["Le fusible doit être calibré au-dessus du courant maximal réel : trop juste, il saute au démarrage des moteurs."],
    worksWith: ["lipo-4s-5200", "power-board", "bldc-hoverboard"]
  },

  /* ─────────────── Connectique et adaptation ─────────────── */
  {
    id: "level-shifter",
    name: "Adaptateur de niveau bidirectionnel 4 canaux",
    brand: "Générique",
    category: "communication",
    tagline: "Deux euros qui évitent de griller un Raspberry Pi",
    description:
      "Convertit des signaux 5 V en 3,3 V et inversement, dans les deux sens, sur quatre canaux. Nécessaire dès qu'un encodeur, un HC-SR04 ou tout capteur 5 V rencontre une carte 3,3 V.",
    price: 3,
    level: "Débutant",
    buses: ["I2C", "GPIO", "UART"],
    voltage: { min: 1.8, max: 6, nominal: 5 },
    currentMa: { typ: 1, peak: 5 },
    logicVolts: 3.3,
    weightG: 2,
    specs: [
      { k: "Canaux", v: "4 bidirectionnels" },
      { k: "Tensions", v: "1,8 à 6 V des deux côtés" },
      { k: "Vitesse", v: "Suffisante pour I2C, UART et encodeurs" }
    ],
    pins: [
      pin("hv", "HV (5V)", "VIN", { volts: 5, dir: "in" }),
      pin("lv", "LV (3,3V)", "VIN", { volts: 3.3, dir: "in" }),
      gnd(),
      pin("hv1", "HV1", "GPIO", { volts: 5, dir: "io", tolerant5v: true }),
      pin("hv2", "HV2", "GPIO", { volts: 5, dir: "io", tolerant5v: true }),
      pin("lv1", "LV1", "GPIO", { volts: 3.3, dir: "io" }),
      pin("lv2", "LV2", "GPIO", { volts: 3.3, dir: "io" })
    ],
    rosPackages: [],
    pros: ["Sauve du matériel bien plus cher que lui", "Bidirectionnel, donc compatible I2C", "Minuscule"],
    cons: ["Limite la vitesse des signaux rapides"],
    gotchas: [
      "Les deux références de tension HV et LV doivent être alimentées, sinon rien ne passe.",
      "Sur un signal rapide comme du SPI à 10 MHz, le module MOSFET déforme les fronts : préfère un circuit dédié type TXS0108E."
    ],
    worksWith: ["hall-encoder", "hc-sr04", "rpi5", "jga25-370"]
  },
  {
    id: "can-transceiver",
    name: "Transceiver CAN SN65HVD230",
    brand: "Texas Instruments",
    category: "communication",
    tagline: "Le bus qui résiste au bruit des moteurs",
    description:
      "Convertit le contrôleur CAN d'un microcontrôleur en signal différentiel exploitable sur plusieurs mètres. Le CAN est le seul bus qui traverse sereinement un robot rempli de moteurs brushless.",
    price: 4,
    level: "Avancé",
    buses: ["CAN"],
    voltage: { min: 3, max: 3.6, nominal: 3.3 },
    currentMa: { typ: 17, peak: 40 },
    logicVolts: 3.3,
    weightG: 3,
    specs: [
      { k: "Débit", v: "Jusqu'à 1 Mbit/s" },
      { k: "Alimentation", v: "3,3 V" },
      { k: "Nœuds", v: "Jusqu'à 120 sur le bus" }
    ],
    pins: [pin("vcc", "VCC 3,3V", "VIN", { volts: 3.3, dir: "in" }), gnd(), pin("txd", "TXD", "TX", { volts: 3.3, dir: "in" }), pin("rxd", "RXD", "RX", { volts: 3.3, dir: "out" }), ...can()],
    rosPackages: [
      { name: "ros2_socketcan", note: "Passerelle entre SocketCAN et les topics ROS 2" },
      { name: "odrive_can", note: "Pilotage des ODrive sur le même bus" }
    ],
    pros: ["Très résistant aux perturbations", "Un seul câble pour tous les nœuds", "Détection d'erreurs intégrée"],
    cons: ["Débit limité", "Terminaison à respecter précisément"],
    gotchas: [
      "Exactement deux résistances de 120 Ω, une à chaque extrémité du bus. Ni une, ni trois : le bus ne fonctionne pas.",
      "Tous les nœuds doivent utiliser le même débit, sinon aucune trame ne passe."
    ],
    worksWith: ["teensy41", "odrive-s1", "jetson-orin-nano", "stm32-blackpill"]
  },
  {
    id: "i2c-mux",
    name: "Multiplexeur I2C TCA9548A",
    brand: "Texas Instruments",
    category: "communication",
    tagline: "Huit capteurs à la même adresse, enfin possible",
    description:
      "Répartit un bus I2C sur huit canaux commutables. La seule solution propre quand plusieurs capteurs partagent une adresse fixe et non modifiable, comme l'AS5600 ou le VL53L1X.",
    price: 6,
    level: "Intermédiaire",
    buses: ["I2C"],
    voltage: { min: 1.65, max: 5.5, nominal: 3.3 },
    currentMa: { typ: 1, peak: 3 },
    logicVolts: 3.3,
    i2cAddress: "0x70",
    i2cAlternates: ["0x71", "0x72", "0x73", "0x74", "0x75", "0x76", "0x77"],
    weightG: 3,
    specs: [
      { k: "Canaux", v: "8 bus I2C commutables" },
      { k: "Adresse", v: "0x70 à 0x77" },
      { k: "Cascade", v: "Jusqu'à 64 canaux avec plusieurs modules" }
    ],
    pins: [pin("vin", "VIN", "VIN", { volts: 3.3, dir: "in", tolerant5v: true }), gnd(), ...i2cTolerant(), ...i2cTolerant("c0_"), ...i2cTolerant("c1_")],
    rosPackages: [],
    pros: ["Résout définitivement les conflits d'adresses", "Adaptation de niveau intégrée sur chaque canal"],
    cons: ["Il faut commuter le canal avant chaque lecture", "Ajoute de la latence"],
    gotchas: [
      "Son adresse 0x70 peut elle-même entrer en conflit avec un BMP280 configuré en 0x76 si tu utilises la cascade complète : planifie le plan d'adressage."
    ],
    worksWith: ["as5600", "vl53l1x", "rpi5", "esp32-s3"]
  },
  {
    id: "usb-hub-powered",
    name: "Hub USB 3.0 alimenté",
    brand: "Générique",
    category: "communication",
    tagline: "Parce que les ports du Pi ne suffisent jamais",
    description:
      "Un LiDAR, une caméra de profondeur et un microcontrôleur, cela fait déjà trois ports et près de 1,5 A. Un hub avec sa propre alimentation évite que le calculateur ne s'effondre.",
    price: 25,
    level: "Débutant",
    buses: ["USB"],
    voltage: { min: 5, max: 12, nominal: 5 },
    currentMa: { typ: 50, peak: 100 },
    suppliesMa: 4000,
    weightG: 90,
    specs: [
      { k: "Ports", v: "4 en USB 3.0" },
      { k: "Alimentation", v: "Externe 5 V / 4 A" }
    ],
    pins: [in5v("pwr"), gnd(), usb("up", "in"), usb("d1", "out"), usb("d2", "out"), usb("d3", "out")],
    rosPackages: [],
    pros: ["Découple la consommation des périphériques du calculateur", "Indispensable avec une caméra de profondeur"],
    cons: ["Un hub bas de gamme provoque des déconnexions aléatoires"],
    gotchas: [
      "Les périphériques USB changent de nom entre deux démarrages. Crée des règles udev pour obtenir des noms stables comme /dev/lidar, sinon le launch file pointe au hasard."
    ],
    worksWith: ["rpi5", "realsense-d435i", "rplidar-a1"]
  },
  {
    id: "chassis-alu",
    name: "Châssis aluminium à deux étages",
    brand: "Générique",
    category: "chassis",
    tagline: "La base sur laquelle tout se visse",
    description:
      "Plateau perforé au pas de 10 mm avec entretoises. Le maillage régulier permet de repositionner les capteurs sans percer, ce qui compte quand la position du LiDAR doit être mesurée précisément pour la TF.",
    price: 40,
    level: "Débutant",
    buses: [],
    voltage: { min: 0, max: 0, nominal: 0 },
    currentMa: { typ: 0, peak: 0 },
    weightG: 700,
    specs: [
      { k: "Dimensions", v: "300 × 220 mm, deux niveaux" },
      { k: "Perçage", v: "Grille au pas de 10 mm" },
      { k: "Charge", v: "Jusqu'à 10 kg" }
    ],
    pins: [],
    rosPackages: [{ name: "urdf", note: "Les cotes du châssis alimentent le fichier URDF" }],
    pros: ["Grille régulière donc positions mesurables", "Rigide", "Sert aussi de masse mécanique"],
    cons: ["Conducteur : gare aux courts-circuits sous une carte"],
    gotchas: [
      "Un châssis en aluminium sous une carte électronique sans entretoise isolante, c'est un court-circuit garanti.",
      "Mesure la position réelle du LiDAR par rapport au centre des roues : c'est cette valeur qui va dans la TF, pas une estimation."
    ],
    worksWith: ["jga25-370", "rplidar-a1", "rpi5"]
  },
  {
    id: "mecanum-wheels",
    name: "Jeu de 4 roues mécanum 100 mm",
    brand: "Générique",
    category: "chassis",
    tagline: "Déplacement latéral sans tourner",
    description:
      "Rouleaux inclinés à 45° qui autorisent la translation dans toutes les directions. Séduisant, mais l'odométrie devient nettement moins fiable qu'en différentiel à cause du glissement.",
    price: 70,
    level: "Avancé",
    buses: [],
    voltage: { min: 0, max: 0, nominal: 0 },
    currentMa: { typ: 0, peak: 0 },
    weightG: 1200,
    specs: [
      { k: "Diamètre", v: "100 mm" },
      { k: "Configuration", v: "2 gauches et 2 droites, montage en X" },
      { k: "Charge", v: "10 kg par roue" }
    ],
    pins: [],
    rosPackages: [{ name: "mecanum_drive_controller", note: "Contrôleur omnidirectionnel de ros2_control" }],
    pros: ["Translation latérale et rotation sur place", "Manœuvres en espace contraint"],
    cons: ["Odométrie médiocre", "Vibrations", "Exige un sol lisse"],
    gotchas: [
      "Le glissement des rouleaux fausse l'odométrie de plusieurs pourcents. Sans IMU et sans recalage laser, la position dérive vite.",
      "Le montage en X est impératif : mal orientées, les roues se combattent."
    ],
    worksWith: ["jga25-370", "bno085", "tb6612fng"]
  }
];
