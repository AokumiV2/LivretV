import type { Pin, PinKind } from "../types";

/**
 * Fabriques de broches — évitent de répéter la même structure 800 fois
 * dans le catalogue. Chaque broche porte sa tension et sa tolérance 5 V :
 * ce sont ces deux champs que le Wiring Lab utilise pour détecter les
 * erreurs de câblage.
 */

export function pin(
  id: string,
  label: string,
  kind: PinKind,
  extra: Partial<Pin> = {}
): Pin {
  return { id, label, kind, ...extra };
}

export const gnd = (id = "gnd") => pin(id, "GND", "GND", { volts: 0, dir: "io" });

export const vin = (id: string, volts: number, label = "VIN") =>
  pin(id, label, "VIN", { volts, dir: "in" });

export const out5v = (id = "5v") => pin(id, "5V", "5V", { volts: 5, dir: "out" });

/** Rail 5 V d'une carte qui peut être alimentée PAR cette broche ou en fournir. */
export const bus5v = (id = "5v") => pin(id, "5V", "5V", { volts: 5, dir: "io" });
export const in5v = (id = "5v") => pin(id, "5V", "5V", { volts: 5, dir: "in" });
export const out3v3 = (id = "3v3") => pin(id, "3V3", "3V3", { volts: 3.3, dir: "out" });
export const in3v3 = (id = "3v3") => pin(id, "3V3", "3V3", { volts: 3.3, dir: "in" });

/** Bus I2C à 3,3 V (Raspberry Pi, ESP32, Teensy…). */
export const i2c33 = (prefix = ""): Pin[] => [
  pin(`${prefix}sda`, "SDA", "SDA", { volts: 3.3, dir: "io", tolerant5v: false }),
  pin(`${prefix}scl`, "SCL", "SCL", { volts: 3.3, dir: "io", tolerant5v: false })
];

/** Bus I2C d'un capteur qui embarque son propre régulateur et ses level-shifters. */
export const i2cTolerant = (prefix = ""): Pin[] => [
  pin(`${prefix}sda`, "SDA", "SDA", { volts: 3.3, dir: "io", tolerant5v: true }),
  pin(`${prefix}scl`, "SCL", "SCL", { volts: 3.3, dir: "io", tolerant5v: true })
];

export const uart = (volts = 3.3, prefix = ""): Pin[] => [
  pin(`${prefix}tx`, "TX", "TX", { volts, dir: "out", tolerant5v: volts >= 5 }),
  pin(`${prefix}rx`, "RX", "RX", { volts, dir: "in", tolerant5v: volts >= 5 })
];

export const spi = (volts = 3.3, prefix = ""): Pin[] => [
  pin(`${prefix}mosi`, "MOSI", "MOSI", { volts, dir: "out" }),
  pin(`${prefix}miso`, "MISO", "MISO", { volts, dir: "in" }),
  pin(`${prefix}sck`, "SCK", "SCK", { volts, dir: "out" }),
  pin(`${prefix}cs`, "CS", "CS", { volts, dir: "out" })
];

export const usb = (id = "usb", dir: "in" | "out" | "io" = "io") =>
  pin(id, "USB", "USB", { volts: 5, dir });

export const can = (prefix = ""): Pin[] => [
  pin(`${prefix}canh`, "CAN_H", "CAN_H", { dir: "io" }),
  pin(`${prefix}canl`, "CAN_L", "CAN_L", { dir: "io" })
];

export const encoderAB = (prefix = "", volts = 3.3): Pin[] => [
  pin(`${prefix}enca`, "ENC_A", "ENC_A", { volts, dir: "out" }),
  pin(`${prefix}encb`, "ENC_B", "ENC_B", { volts, dir: "out" })
];

export const motorAB = (prefix = ""): Pin[] => [
  pin(`${prefix}m+`, "M+", "MOTOR", { dir: "io" }),
  pin(`${prefix}m-`, "M-", "MOTOR", { dir: "io" })
];

/** Génère n broches GPIO génériques. */
export function gpios(n: number, volts = 3.3, tolerant5v = false): Pin[] {
  return Array.from({ length: n }, (_, i) =>
    pin(`gpio${i}`, `GPIO${i}`, "GPIO", { volts, dir: "io", tolerant5v })
  );
}

/** Génère n sorties PWM. */
export function pwms(n: number, volts = 3.3): Pin[] {
  return Array.from({ length: n }, (_, i) =>
    pin(`pwm${i}`, `PWM${i}`, "PWM", { volts, dir: "out" })
  );
}
