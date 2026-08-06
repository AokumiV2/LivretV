import type { WiringDoc } from "./types";

/**
 * Montages de démarrage. Le premier est volontairement fautif : il déclenche
 * plusieurs diagnostics d'un coup, ce qui montre à quoi sert l'outil.
 */

export const PRESETS: { id: string; nom: string; desc: string; doc: WiringDoc }[] = [
  {
    id: "vide",
    nom: "Canvas vide",
    desc: "Partir de zéro",
    doc: { placed: [], links: [] }
  },
  {
    id: "conflits",
    nom: "Montage fautif",
    desc: "Deux capteurs à 0x68, un encodeur 5 V sur un Pi, et pas de masse",
    doc: {
      placed: [
        { uid: "a", componentId: "rpi5", x: 60, y: 60 },
        { uid: "b", componentId: "mpu6050", x: 420, y: 40 },
        { uid: "c", componentId: "icm-conflit", x: 420, y: 200 },
        { uid: "d", componentId: "hall-encoder", x: 420, y: 340 }
      ],
      links: [
        { id: "l1", from: { uid: "a", pinId: "sda" }, to: { uid: "b", pinId: "sda" } },
        { id: "l2", from: { uid: "a", pinId: "scl" }, to: { uid: "b", pinId: "scl" } },
        { id: "l3", from: { uid: "a", pinId: "sda" }, to: { uid: "c", pinId: "sda" } },
        { id: "l4", from: { uid: "a", pinId: "scl" }, to: { uid: "c", pinId: "scl" } },
        { id: "l5", from: { uid: "a", pinId: "gpio0" }, to: { uid: "d", pinId: "enca" } }
      ]
    }
  },
  {
    id: "rover",
    nom: "Base roulante",
    desc: "Pi 5, ESP32, TB6612, deux moteurs, LiDAR et alimentation",
    doc: {
      placed: [
        { uid: "bat", componentId: "lipo-3s-5000", x: 40, y: 300 },
        { uid: "bec", componentId: "bec-5v-5a", x: 40, y: 470 },
        { uid: "pi", componentId: "rpi5", x: 330, y: 40 },
        { uid: "esp", componentId: "esp32-s3", x: 330, y: 380 },
        { uid: "drv", componentId: "tb6612fng", x: 680, y: 340 },
        { uid: "mot", componentId: "jga25-370", x: 990, y: 340 },
        { uid: "lid", componentId: "rplidar-a1", x: 680, y: 60 },
        { uid: "imu", componentId: "bno085", x: 680, y: 180 },
        { uid: "ls", componentId: "level-shifter", x: 680, y: 560 }
      ],
      links: [
        { id: "p1", from: { uid: "bat", pinId: "v+" }, to: { uid: "bec", pinId: "vin" } },
        { id: "p2", from: { uid: "bat", pinId: "gnd" }, to: { uid: "bec", pinId: "gnd" } },
        { id: "p3", from: { uid: "bec", pinId: "vout" }, to: { uid: "pi", pinId: "5v" } },
        { id: "p4", from: { uid: "bec", pinId: "gnd" }, to: { uid: "pi", pinId: "gnd" } },
        { id: "p5", from: { uid: "bat", pinId: "v+" }, to: { uid: "drv", pinId: "vm" } },
        { id: "p6", from: { uid: "bec", pinId: "gnd" }, to: { uid: "drv", pinId: "gnd" } },
        { id: "p7", from: { uid: "bec", pinId: "gnd" }, to: { uid: "esp", pinId: "gnd" } },
        { id: "p8", from: { uid: "bec", pinId: "vout" }, to: { uid: "esp", pinId: "5v" } },
        { id: "p9", from: { uid: "bec", pinId: "vout" }, to: { uid: "lid", pinId: "5v" } },
        { id: "p10", from: { uid: "bec", pinId: "gnd" }, to: { uid: "lid", pinId: "gnd" } },
        { id: "p11", from: { uid: "bec", pinId: "gnd" }, to: { uid: "imu", pinId: "gnd" } },
        { id: "s1", from: { uid: "esp", pinId: "pwm0" }, to: { uid: "drv", pinId: "pwma" } },
        { id: "s2", from: { uid: "esp", pinId: "gpio0" }, to: { uid: "drv", pinId: "ain1" } },
        { id: "s3", from: { uid: "esp", pinId: "gpio1" }, to: { uid: "drv", pinId: "ain2" } },
        { id: "s4", from: { uid: "esp", pinId: "gpio2" }, to: { uid: "drv", pinId: "stby" } },
        { id: "s5", from: { uid: "drv", pinId: "a_m+" }, to: { uid: "mot", pinId: "m+" } },
        { id: "s6", from: { uid: "drv", pinId: "a_m-" }, to: { uid: "mot", pinId: "m-" } },
        { id: "s7", from: { uid: "pi", pinId: "sda" }, to: { uid: "imu", pinId: "sda" } },
        { id: "s8", from: { uid: "pi", pinId: "scl" }, to: { uid: "imu", pinId: "scl" } },
        { id: "s9", from: { uid: "pi", pinId: "3v3" }, to: { uid: "imu", pinId: "vin" } },
        { id: "s10", from: { uid: "pi", pinId: "usb" }, to: { uid: "lid", pinId: "usb" } },
        { id: "s11", from: { uid: "esp", pinId: "3v3" }, to: { uid: "drv", pinId: "vcc" } },
        { id: "s12", from: { uid: "esp", pinId: "3v3" }, to: { uid: "ls", pinId: "lv" } },
        { id: "s13", from: { uid: "bec", pinId: "vout" }, to: { uid: "ls", pinId: "hv" } },
        { id: "s14", from: { uid: "bec", pinId: "gnd" }, to: { uid: "ls", pinId: "gnd" } },
        { id: "s15", from: { uid: "mot", pinId: "enca" }, to: { uid: "ls", pinId: "hv1" } },
        { id: "s16", from: { uid: "ls", pinId: "lv1" }, to: { uid: "esp", pinId: "gpio3" } },
        { id: "s17", from: { uid: "bec", pinId: "vout" }, to: { uid: "mot", pinId: "enc_v" } },
        { id: "s18", from: { uid: "bec", pinId: "gnd" }, to: { uid: "mot", pinId: "enc_gnd" } }
      ]
    }
  }
];

/**
 * Le preset « conflits » référence volontairement un composant absent du
 * catalogue afin de rester lisible : on le remplace par un vrai doublon
 * d'adresse au chargement.
 */
export function normaliserPreset(doc: WiringDoc): WiringDoc {
  return {
    ...doc,
    placed: doc.placed.map((p) =>
      p.componentId === "icm-conflit"
        ? { ...p, componentId: "mpu6050" }
        : p
    )
  };
}
