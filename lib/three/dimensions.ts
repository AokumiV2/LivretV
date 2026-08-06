import type { Category, Component } from "@/content/types";

/* ══════════════════════════════════════════════════════════════
   Encombrement réel des composants, en mètres, connecteurs compris.
   Ces valeurs viennent des fiches constructeur : c'est ce qui rend
   crédible l'implantation sur le châssis.
   ══════════════════════════════════════════════════════════════ */

export type Dim3 = [number, number, number];

/** Famille de modèle 3D à construire pour un composant. */
export type Forme =
  | "sbc"
  | "minipc"
  | "devkit"
  | "moteur-dc"
  | "moteur-nema"
  | "servo"
  | "servo-bus"
  | "roue-moyeu"
  | "driver"
  | "driver-gros"
  | "lidar-rond"
  | "lidar-cube"
  | "breakout"
  | "capteur-tof"
  | "ultrason"
  | "camera-barre"
  | "camera-webcam"
  | "camera-csi"
  | "gps"
  | "lipo"
  | "module-gaine"
  | "plaque"
  | "interrupteur"
  | "hub"
  | "roue-mecanum";

type Fiche = { taille: Dim3; forme: Forme };

const FICHES: Record<string, Fiche> = {
  /* ── Calculateurs ── */
  rpi5: { taille: [0.085, 0.056, 0.019], forme: "sbc" },
  rpi4: { taille: [0.085, 0.056, 0.019], forme: "sbc" },
  "jetson-orin-nano": { taille: [0.1, 0.079, 0.032], forme: "sbc" },
  "orange-pi-5": { taille: [0.1, 0.062, 0.018], forme: "sbc" },
  "mini-pc-n100": { taille: [0.128, 0.128, 0.04], forme: "minipc" },

  /* ── Microcontrôleurs ── */
  "esp32-s3": { taille: [0.063, 0.0255, 0.011], forme: "devkit" },
  teensy41: { taille: [0.061, 0.018, 0.009], forme: "devkit" },
  "rpi-pico": { taille: [0.051, 0.021, 0.007], forme: "devkit" },
  opencr: { taille: [0.105, 0.075, 0.018], forme: "sbc" },
  "stm32-blackpill": { taille: [0.053, 0.023, 0.009], forme: "devkit" },

  /* ── Moteurs ── */
  "jga25-370": { taille: [0.07, 0.025, 0.025], forme: "moteur-dc" },
  "pololu-37d": { taille: [0.08, 0.037, 0.037], forme: "moteur-dc" },
  "n20-motor": { taille: [0.044, 0.012, 0.012], forme: "moteur-dc" },
  mg996r: { taille: [0.041, 0.02, 0.043], forme: "servo" },
  ds3218: { taille: [0.04, 0.02, 0.041], forme: "servo" },
  "dynamixel-xl430": { taille: [0.0465, 0.0287, 0.034], forme: "servo-bus" },
  nema17: { taille: [0.042, 0.042, 0.04], forme: "moteur-nema" },
  "bldc-hoverboard": { taille: [0.165, 0.06, 0.165], forme: "roue-moyeu" },

  /* ── Drivers ── */
  tb6612fng: { taille: [0.02, 0.02, 0.012], forme: "driver" },
  l298n: { taille: [0.043, 0.043, 0.027], forme: "driver-gros" },
  bts7960: { taille: [0.05, 0.05, 0.025], forme: "driver-gros" },
  tmc2209: { taille: [0.02, 0.015, 0.011], forme: "driver" },
  "odrive-s1": { taille: [0.05, 0.05, 0.015], forme: "driver-gros" },
  "vesc-6": { taille: [0.07, 0.06, 0.025], forme: "driver-gros" },
  pca9685: { taille: [0.062, 0.026, 0.013], forme: "driver" },
  roboclaw: { taille: [0.075, 0.06, 0.02], forme: "driver-gros" },
  u2d2: { taille: [0.048, 0.026, 0.012], forme: "driver" },

  /* ── Télémétrie ── */
  "rplidar-a1": { taille: [0.0985, 0.0985, 0.06], forme: "lidar-rond" },
  "rplidar-a2m12": { taille: [0.076, 0.076, 0.041], forme: "lidar-rond" },
  "ldlidar-ld19": { taille: [0.0385, 0.0385, 0.035], forme: "lidar-cube" },
  "livox-mid360": { taille: [0.065, 0.065, 0.06], forme: "lidar-cube" },
  "tfmini-s": { taille: [0.042, 0.015, 0.016], forme: "capteur-tof" },
  vl53l1x: { taille: [0.018, 0.013, 0.005], forme: "capteur-tof" },
  "hc-sr04": { taille: [0.045, 0.02, 0.015], forme: "ultrason" },

  /* ── Capteurs ── */
  bno085: { taille: [0.0255, 0.0178, 0.009], forme: "breakout" },
  bno055: { taille: [0.0255, 0.0203, 0.009], forme: "breakout" },
  mpu6050: { taille: [0.021, 0.016, 0.008], forme: "breakout" },
  as5600: { taille: [0.016, 0.016, 0.007], forme: "breakout" },
  "hall-encoder": { taille: [0.02, 0.02, 0.008], forme: "breakout" },
  ina219: { taille: [0.025, 0.019, 0.008], forme: "breakout" },
  "gps-neo-m8n": { taille: [0.028, 0.028, 0.012], forme: "gps" },
  "gps-zed-f9p": { taille: [0.055, 0.04, 0.014], forme: "gps" },

  /* ── Caméras ── */
  "realsense-d435i": { taille: [0.09, 0.025, 0.025], forme: "camera-barre" },
  "oak-d-lite": { taille: [0.091, 0.028, 0.028], forme: "camera-barre" },
  "rpi-camera-v3": { taille: [0.025, 0.024, 0.013], forme: "camera-csi" },
  "usb-webcam": { taille: [0.094, 0.029, 0.044], forme: "camera-webcam" },

  /* ── Énergie ── */
  "lipo-3s-5000": { taille: [0.145, 0.047, 0.026], forme: "lipo" },
  "lipo-4s-5200": { taille: [0.15, 0.05, 0.035], forme: "lipo" },
  "li-ion-4s": { taille: [0.14, 0.07, 0.021], forme: "lipo" },
  "bec-5v-5a": { taille: [0.045, 0.02, 0.012], forme: "module-gaine" },
  "buck-12v-5a": { taille: [0.052, 0.028, 0.015], forme: "driver" },
  "bms-3s": { taille: [0.055, 0.02, 0.006], forme: "module-gaine" },
  "power-board": { taille: [0.06, 0.045, 0.01], forme: "driver" },
  "fuse-switch": { taille: [0.05, 0.03, 0.025], forme: "interrupteur" },

  /* ── Connectique ── */
  "level-shifter": { taille: [0.016, 0.013, 0.01], forme: "breakout" },
  "can-transceiver": { taille: [0.024, 0.014, 0.009], forme: "breakout" },
  "i2c-mux": { taille: [0.026, 0.018, 0.009], forme: "breakout" },
  "usb-hub-powered": { taille: [0.1, 0.04, 0.02], forme: "hub" },

  /* ── Structure ── */
  "chassis-alu": { taille: [0.3, 0.22, 0.004], forme: "plaque" },
  "mecanum-wheels": { taille: [0.1, 0.045, 0.1], forme: "roue-mecanum" }
};

/** Repli par catégorie quand le composant n'a pas de fiche dédiée. */
const PAR_CATEGORIE: Record<Category, Fiche> = {
  calculateur: { taille: [0.085, 0.056, 0.019], forme: "sbc" },
  microcontroleur: { taille: [0.055, 0.025, 0.01], forme: "devkit" },
  moteur: { taille: [0.06, 0.025, 0.025], forme: "moteur-dc" },
  driver: { taille: [0.035, 0.025, 0.012], forme: "driver" },
  capteur: { taille: [0.025, 0.018, 0.008], forme: "breakout" },
  camera: { taille: [0.06, 0.025, 0.025], forme: "camera-barre" },
  alimentation: { taille: [0.05, 0.025, 0.014], forme: "module-gaine" },
  communication: { taille: [0.026, 0.018, 0.009], forme: "breakout" },
  chassis: { taille: [0.2, 0.15, 0.005], forme: "plaque" }
};

export function ficheDe(c: Component): Fiche {
  return FICHES[c.id] ?? PAR_CATEGORIE[c.category];
}

export function tailleDe(c: Component): Dim3 {
  return ficheDe(c).taille;
}

export function formeDe(c: Component): Forme {
  return ficheDe(c).forme;
}
