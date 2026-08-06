import type * as ThreeNs from "three";
import type { Component } from "@/content/types";
import { formeDe, tailleDe, type Dim3, type Forme } from "./dimensions";

/* ══════════════════════════════════════════════════════════════
   Modèles 3D procéduraux.

   Chaque composant est reconstruit à partir de primitives, aux cotes
   réelles : circuit imprimé, connecteurs USB, barrette de 40 broches,
   puce, dissipateur. On reconnaît un Raspberry Pi d'un ESP32 au premier
   coup d'œil, et l'encombrement affiché correspond à la réalité.

   Convention : modèle centré sur l'origine, longueur sur x, largeur sur
   y, hauteur sur z — comme le reste du site (z vers le haut).
   ══════════════════════════════════════════════════════════════ */

type T = typeof ThreeNs;

export type Mats = {
  pcbVert: ThreeNs.MeshStandardMaterial;
  pcbNoir: ThreeNs.MeshStandardMaterial;
  pcbBleu: ThreeNs.MeshStandardMaterial;
  pcbRouge: ThreeNs.MeshStandardMaterial;
  or: ThreeNs.MeshStandardMaterial;
  metal: ThreeNs.MeshStandardMaterial;
  alu: ThreeNs.MeshStandardMaterial;
  plastique: ThreeNs.MeshStandardMaterial;
  sombre: ThreeNs.MeshStandardMaterial;
  puce: ThreeNs.MeshStandardMaterial;
  cuivre: ThreeNs.MeshStandardMaterial;
  blanc: ThreeNs.MeshStandardMaterial;
  jaune: ThreeNs.MeshStandardMaterial;
  rouge: ThreeNs.MeshStandardMaterial;
  verre: ThreeNs.MeshStandardMaterial;
  led: ThreeNs.MeshBasicMaterial;
};

export function creerMateriaux(THREE: T): Mats {
  const std = (color: number, metalness: number, roughness: number) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness });

  return {
    pcbVert: std(0x1d5c3a, 0.1, 0.62),
    pcbNoir: std(0x14161c, 0.15, 0.6),
    pcbBleu: std(0x14357a, 0.1, 0.6),
    pcbRouge: std(0x8c1f24, 0.1, 0.6),
    or: std(0xd8b45a, 0.95, 0.28),
    metal: std(0xb8bec9, 0.9, 0.3),
    alu: std(0x8f96a3, 0.75, 0.4),
    plastique: std(0x0d0f14, 0.05, 0.85),
    sombre: std(0x05060a, 0.1, 0.9),
    puce: std(0x22242c, 0.4, 0.5),
    cuivre: std(0xb87333, 0.85, 0.35),
    blanc: std(0xd8dbe4, 0.1, 0.75),
    jaune: std(0xd8b12a, 0.2, 0.6),
    rouge: std(0xc4353f, 0.2, 0.6),
    verre: new THREE.MeshStandardMaterial({
      color: 0x0a1a2a,
      metalness: 0.2,
      roughness: 0.08
    }),
    led: new THREE.MeshBasicMaterial({ color: 0x5ee0ff })
  };
}

/* ─────────────── Briques réutilisables ─────────────── */

function boite(
  THREE: T,
  mat: ThreeNs.Material,
  l: number,
  w: number,
  h: number,
  x = 0,
  y = 0,
  z = 0
) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(l, w, h), mat);
  m.position.set(x, y, z);
  return m;
}

function cylindre(
  THREE: T,
  mat: ThreeNs.Material,
  r: number,
  h: number,
  axe: "x" | "y" | "z" = "z",
  x = 0,
  y = 0,
  z = 0,
  segments = 24
) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, h, segments),
    mat
  );
  if (axe === "z") m.rotation.x = Math.PI / 2;
  if (axe === "x") m.rotation.z = Math.PI / 2;
  m.position.set(x, y, z);
  return m;
}

/** Barrette de broches au pas de 2,54 mm, instanciée pour rester légère. */
function barrette(
  THREE: T,
  m: Mats,
  colonnes: number,
  rangees: number,
  hauteur = 0.0085,
  pas = 0.00254
) {
  const g = new THREE.Group();
  const base = boite(
    THREE,
    m.plastique,
    colonnes * pas,
    rangees * pas,
    0.0025,
    0,
    0,
    0.00125
  );
  g.add(base);

  const total = colonnes * rangees;
  const inst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.00064, 0.00064, hauteur),
    m.or,
    total
  );
  const mat4 = new THREE.Matrix4();
  let i = 0;
  for (let c = 0; c < colonnes; c++) {
    for (let r = 0; r < rangees; r++) {
      mat4.makeTranslation(
        (c - (colonnes - 1) / 2) * pas,
        (r - (rangees - 1) / 2) * pas,
        hauteur / 2
      );
      inst.setMatrixAt(i++, mat4);
    }
  }
  inst.instanceMatrix.needsUpdate = true;
  g.add(inst);
  return g;
}

/** Prise USB-A double étage, celle qui trahit un Raspberry Pi de loin. */
function usbDouble(THREE: T, m: Mats, couleur: "bleu" | "noir") {
  const g = new THREE.Group();
  g.add(boite(THREE, m.metal, 0.017, 0.0135, 0.0155, 0, 0, 0.00775));
  const inserer = m.plastique;
  for (const dz of [0.0045, 0.0113]) {
    g.add(boite(THREE, inserer, 0.001, 0.012, 0.0045, 0.0085, 0, dz));
    g.add(
      boite(
        THREE,
        couleur === "bleu" ? m.pcbBleu : m.sombre,
        0.0012,
        0.0105,
        0.0035,
        0.0084,
        0,
        dz
      )
    );
  }
  return g;
}

function rj45(THREE: T, m: Mats) {
  const g = new THREE.Group();
  g.add(boite(THREE, m.metal, 0.021, 0.016, 0.0135, 0, 0, 0.00675));
  g.add(boite(THREE, m.sombre, 0.0015, 0.0125, 0.0105, 0.0105, 0, 0.0062));
  g.add(boite(THREE, m.led, 0.0008, 0.0018, 0.0012, 0.0105, 0.0048, 0.0122));
  return g;
}

function usbC(THREE: T, m: Mats) {
  const g = new THREE.Group();
  g.add(boite(THREE, m.metal, 0.0072, 0.0092, 0.0032, 0, 0, 0.0016));
  g.add(boite(THREE, m.sombre, 0.0008, 0.0072, 0.0018, 0.0037, 0, 0.0016));
  return g;
}

function microHdmi(THREE: T, m: Mats) {
  const g = new THREE.Group();
  g.add(boite(THREE, m.metal, 0.0065, 0.0085, 0.0042, 0, 0, 0.0021));
  g.add(boite(THREE, m.sombre, 0.0008, 0.0065, 0.0026, 0.0033, 0, 0.0021));
  return g;
}

/** Boîtier de circuit intégré, avec sa patte repère. */
function puce(THREE: T, m: Mats, l: number, w: number, h = 0.0012) {
  const g = new THREE.Group();
  g.add(boite(THREE, m.puce, l, w, h, 0, 0, h / 2));
  g.add(
    cylindre(THREE, m.sombre, Math.min(l, w) * 0.06, h * 0.4, "z", -l * 0.35, w * 0.32, h)
  );
  return g;
}

function condensateur(THREE: T, m: Mats, r: number, h: number, x: number, y: number) {
  const g = new THREE.Group();
  g.add(cylindre(THREE, m.alu, r, h, "z", x, y, h / 2, 14));
  g.add(cylindre(THREE, m.sombre, r * 0.96, 0.0004, "z", x, y, h, 14));
  return g;
}

/** Bornier à vis vert, la signature d'une carte de puissance. */
function bornier(THREE: T, m: Mats, voies: number) {
  const g = new THREE.Group();
  const pas = 0.005;
  const l = voies * pas;
  g.add(boite(THREE, m.pcbVert, l, 0.008, 0.009, 0, 0, 0.0045));
  for (let i = 0; i < voies; i++) {
    const x = (i - (voies - 1) / 2) * pas;
    g.add(cylindre(THREE, m.metal, 0.0013, 0.0008, "z", x, 0.001, 0.0092, 10));
    g.add(boite(THREE, m.sombre, 0.0022, 0.0004, 0.0008, x, 0.001, 0.0094));
  }
  return g;
}

function dissipateur(THREE: T, m: Mats, l: number, w: number, h: number, ailettes = 7) {
  const g = new THREE.Group();
  g.add(boite(THREE, m.alu, l, w, h * 0.25, 0, 0, (h * 0.25) / 2));
  const inst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(l * 0.055, w, h * 0.75),
    m.alu,
    ailettes
  );
  const mat4 = new THREE.Matrix4();
  for (let i = 0; i < ailettes; i++) {
    mat4.makeTranslation(
      (i - (ailettes - 1) / 2) * (l / ailettes),
      0,
      h * 0.25 + (h * 0.75) / 2
    );
    inst.setMatrixAt(i, mat4);
  }
  inst.instanceMatrix.needsUpdate = true;
  g.add(inst);
  return g;
}

/** Câble souple entre deux points, tracé comme une caténaire. */
function cable(
  THREE: T,
  mat: ThreeNs.Material,
  a: [number, number, number],
  b: [number, number, number],
  affaissement = 0.004
) {
  const p1 = new THREE.Vector3(...a);
  const p2 = new THREE.Vector3(...b);
  const mi = p1.clone().lerp(p2, 0.5);
  mi.z -= affaissement;
  const courbe = new THREE.QuadraticBezierCurve3(p1, mi, p2);
  return new THREE.Mesh(new THREE.TubeGeometry(courbe, 14, 0.0009, 6, false), mat);
}

/* ─────────────── Modèles par famille ─────────────── */

function modeleSbc(THREE: T, m: Mats, taille: Dim3, id: string) {
  const [L, W] = taille;
  const g = new THREE.Group();
  const ep = 0.0016;

  const couleurPcb = id.startsWith("rpi") ? m.pcbVert : m.pcbNoir;
  g.add(boite(THREE, couleurPcb, L, W, ep, 0, 0, ep / 2));

  // Trous de fixation, matérialisés par des œillets dorés
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      g.add(
        cylindre(
          THREE,
          m.or,
          0.0016,
          ep + 0.0002,
          "z",
          sx * (L / 2 - 0.0035),
          sy * (W / 2 - 0.0035),
          ep / 2,
          12
        )
      );
    }
  }

  // Barrette GPIO 2×20 le long du grand bord
  const gpio = barrette(THREE, m, 20, 2);
  gpio.position.set(-L / 2 + 0.033, W / 2 - 0.0042, ep);
  g.add(gpio);

  // Processeur et mémoire
  const soc = puce(THREE, m, 0.0155, 0.0155, 0.0018);
  soc.position.set(-0.004, -0.004, ep);
  g.add(soc);
  const ram = puce(THREE, m, 0.0105, 0.009, 0.0011);
  ram.position.set(0.013, -0.012, ep);
  g.add(ram);

  // Connecteurs du bord droit : USB et Ethernet
  const usb1 = usbDouble(THREE, m, "bleu");
  usb1.position.set(L / 2 - 0.0085, -W / 2 + 0.011, ep);
  g.add(usb1);
  const usb2 = usbDouble(THREE, m, "noir");
  usb2.position.set(L / 2 - 0.0085, -W / 2 + 0.029, ep);
  g.add(usb2);
  const eth = rj45(THREE, m);
  eth.position.set(L / 2 - 0.0105, W / 2 - 0.011, ep);
  g.add(eth);

  // Bord avant : alimentation et vidéo
  const pwr = usbC(THREE, m);
  pwr.position.set(-L / 2 + 0.011, -W / 2 + 0.0046, ep);
  g.add(pwr);
  for (const x of [-L / 2 + 0.026, -L / 2 + 0.0405]) {
    const h = microHdmi(THREE, m);
    h.position.set(x, -W / 2 + 0.0042, ep);
    g.add(h);
  }

  // Quelques composants passifs pour casser la platitude
  g.add(condensateur(THREE, m, 0.0022, 0.005, L / 2 - 0.03, -W / 2 + 0.006));
  g.add(boite(THREE, m.sombre, 0.012, 0.011, 0.0015, -L / 2 + 0.008, 0.004, ep + 0.00075));
  g.add(boite(THREE, m.led, 0.0016, 0.0009, 0.0006, -L / 2 + 0.004, W / 2 - 0.012, ep + 0.0003));

  return g;
}

function modeleMiniPc(THREE: T, m: Mats, taille: Dim3) {
  const [L, W, H] = taille;
  const g = new THREE.Group();
  g.add(boite(THREE, m.alu, L, W, H, 0, 0, H / 2));
  g.add(boite(THREE, m.sombre, L * 0.98, W * 0.98, 0.0015, 0, 0, H));
  // Grilles d'aération
  for (let i = 0; i < 9; i++) {
    g.add(
      boite(
        THREE,
        m.sombre,
        L * 0.7,
        0.002,
        0.0008,
        0,
        (i - 4) * 0.008,
        H + 0.0006
      )
    );
  }
  const usb = usbDouble(THREE, m, "bleu");
  usb.position.set(L / 2 - 0.009, -0.02, 0.008);
  g.add(usb);
  const eth = rj45(THREE, m);
  eth.position.set(L / 2 - 0.011, 0.012, 0.008);
  g.add(eth);
  g.add(cylindre(THREE, m.led, 0.0018, 0.0008, "z", -L / 2 + 0.01, W / 2 - 0.01, H + 0.001, 12));
  return g;
}

function modeleDevkit(THREE: T, m: Mats, taille: Dim3, id: string) {
  const [L, W] = taille;
  const g = new THREE.Group();
  const ep = 0.0016;

  const couleur =
    id === "rpi-pico" ? m.pcbVert : id === "stm32-blackpill" ? m.pcbNoir : m.pcbNoir;
  g.add(boite(THREE, couleur, L, W, ep, 0, 0, ep / 2));

  // Deux barrettes latérales, comme sur toute carte de développement
  const broches = Math.max(6, Math.round((L - 0.006) / 0.00254));
  for (const sy of [-1, 1]) {
    const b = barrette(THREE, m, broches, 1);
    b.position.set(0, sy * (W / 2 - 0.0016), ep);
    g.add(b);
  }

  if (id.startsWith("esp32")) {
    // Module WROOM : blindage métallique et antenne céramique
    const blindage = boite(THREE, m.metal, 0.018, 0.0255, 0.0031, -L / 2 + 0.012, 0, ep + 0.00155);
    g.add(blindage);
    g.add(boite(THREE, m.blanc, 0.0065, 0.0068, 0.0011, -L / 2 + 0.0028, 0, ep + 0.00055));
    // Trame de blindage
    for (let i = 0; i < 4; i++) {
      g.add(
        boite(
          THREE,
          m.sombre,
          0.0004,
          0.021,
          0.0002,
          -L / 2 + 0.006 + i * 0.004,
          0,
          ep + 0.0031
        )
      );
    }
  } else {
    const mcu = puce(THREE, m, 0.009, 0.009, 0.001);
    mcu.position.set(-0.002, 0, ep);
    g.add(mcu);
  }

  // Connecteur USB au bout de la carte
  const usb = id === "teensy41" || id === "rpi-pico" ? microHdmi(THREE, m) : usbC(THREE, m);
  usb.position.set(L / 2 - 0.004, 0, ep);
  usb.rotation.z = Math.PI;
  g.add(usb);

  // Boutons et LED
  for (const sx of [-1, 1]) {
    g.add(boite(THREE, m.blanc, 0.0032, 0.0032, 0.0018, sx * 0.006 + L / 2 - 0.016, 0.006, ep + 0.0009));
  }
  g.add(boite(THREE, m.led, 0.0014, 0.0008, 0.0006, L / 2 - 0.012, -0.006, ep + 0.0003));
  return g;
}

function modeleMoteurDc(THREE: T, m: Mats, taille: Dim3) {
  const [L, , H] = taille;
  const r = H / 2;
  const g = new THREE.Group();

  // Corps du moteur, réducteur, encodeur : la silhouette caractéristique
  const lCan = L * 0.44;
  const lRed = L * 0.3;
  const lEnc = L * 0.14;

  g.add(cylindre(THREE, m.metal, r * 0.96, lCan, "x", -L / 2 + lEnc + lCan / 2, 0, 0, 26));
  // Nervures de la cloche
  for (const a of [0, Math.PI / 2]) {
    const nerv = boite(THREE, m.alu, lCan * 0.9, r * 1.9, 0.0006, -L / 2 + lEnc + lCan / 2, 0, 0);
    nerv.rotation.x = a;
    g.add(nerv);
  }

  g.add(cylindre(THREE, m.alu, r, lRed, "x", L / 2 - lRed / 2 - 0.004, 0, 0, 26));
  g.add(cylindre(THREE, m.puce, r * 0.98, lEnc, "x", -L / 2 + lEnc / 2, 0, 0, 22));

  // Arbre de sortie décentré, comme sur un réducteur droit
  g.add(cylindre(THREE, m.metal, 0.002, 0.012, "x", L / 2 - 0.002, 0, r * 0.42, 14));
  // Flasque de fixation
  g.add(boite(THREE, m.alu, 0.0025, r * 2.4, r * 0.9, L / 2 - lRed - 0.003, 0, 0));

  // Faisceau de l'encodeur
  g.add(
    cable(
      THREE,
      m.rouge,
      [-L / 2 + 0.001, 0.002, r * 0.5],
      [-L / 2 - 0.018, 0.006, r * 0.2],
      0.003
    )
  );
  g.add(
    cable(
      THREE,
      m.sombre,
      [-L / 2 + 0.001, -0.002, r * 0.5],
      [-L / 2 - 0.018, -0.004, r * 0.15],
      0.003
    )
  );
  return g;
}

function modeleNema(THREE: T, m: Mats, taille: Dim3) {
  const [L, W, H] = taille;
  const g = new THREE.Group();
  g.add(boite(THREE, m.puce, L, W, H * 0.8, 0, 0, H / 2));
  for (const sz of [-1, 1]) {
    g.add(boite(THREE, m.alu, L, W, H * 0.1, 0, 0, H / 2 + sz * (H * 0.45)));
  }
  g.add(cylindre(THREE, m.metal, 0.011, 0.002, "z", 0, 0, H + 0.001, 20));
  g.add(cylindre(THREE, m.metal, 0.0025, 0.021, "z", 0, 0, H + 0.011, 14));
  g.add(cable(THREE, m.sombre, [-L / 2, 0, H * 0.3], [-L / 2 - 0.02, 0.004, H * 0.15], 0.004));
  return g;
}

function modeleServo(THREE: T, m: Mats, taille: Dim3) {
  const [L, W, H] = taille;
  const g = new THREE.Group();
  const hCorps = H * 0.62;
  g.add(boite(THREE, m.plastique, L, W, hCorps, 0, 0, hCorps / 2));
  // Oreilles de fixation
  g.add(boite(THREE, m.plastique, L * 1.42, W, 0.0025, 0, 0, hCorps * 0.72));
  // Cloche du réducteur et palonnier
  g.add(cylindre(THREE, m.plastique, W * 0.42, H * 0.16, "z", -L * 0.22, 0, hCorps + H * 0.08, 20));
  g.add(cylindre(THREE, m.blanc, 0.0035, 0.004, "z", -L * 0.22, 0, hCorps + H * 0.18, 16));
  g.add(boite(THREE, m.blanc, 0.026, 0.004, 0.0022, -L * 0.22, 0, hCorps + H * 0.2));
  // Capot arrière et faisceau trois fils
  g.add(boite(THREE, m.sombre, L * 0.36, W * 0.94, hCorps * 0.9, L * 0.3, 0, hCorps / 2));
  const couleurs = [m.jaune, m.rouge, m.sombre];
  couleurs.forEach((c, i) => {
    g.add(
      cable(
        THREE,
        c,
        [L / 2 - 0.001, (i - 1) * 0.0022, hCorps * 0.4],
        [L / 2 + 0.02, (i - 1) * 0.003, hCorps * 0.2],
        0.003
      )
    );
  });
  return g;
}

function modeleServoBus(THREE: T, m: Mats, taille: Dim3) {
  const [L, W, H] = taille;
  const g = new THREE.Group();
  g.add(boite(THREE, m.plastique, L, W, H, 0, 0, H / 2));
  g.add(boite(THREE, m.sombre, L * 0.96, W * 0.96, 0.0012, 0, 0, H));
  g.add(cylindre(THREE, m.blanc, W * 0.3, 0.004, "z", -L * 0.24, 0, H + 0.002, 20));
  for (const sx of [-1, 1]) {
    g.add(boite(THREE, m.sombre, 0.0085, 0.006, 0.004, sx * (L / 2 - 0.006), -W / 2 + 0.003, 0.006));
  }
  return g;
}

function modeleRoueMoyeu(THREE: T, m: Mats, taille: Dim3) {
  const [D, ep] = taille;
  const r = D / 2;
  const g = new THREE.Group();
  // Pneu, jante, moyeu moteur
  const pneu = new THREE.Mesh(new THREE.TorusGeometry(r * 0.86, r * 0.14, 12, 40), m.plastique);
  pneu.rotation.y = Math.PI / 2;
  g.add(pneu);
  g.add(cylindre(THREE, m.alu, r * 0.74, ep * 0.8, "y", 0, 0, 0, 32));
  g.add(cylindre(THREE, m.puce, r * 0.42, ep * 1.05, "y", 0, 0, 0, 24));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(
      boite(
        THREE,
        m.alu,
        r * 0.5,
        ep * 0.5,
        0.004,
        Math.cos(a) * r * 0.55,
        0,
        Math.sin(a) * r * 0.55
      )
    );
  }
  g.add(cable(THREE, m.sombre, [0, ep / 2, 0], [0.02, ep / 2 + 0.012, -0.01], 0.004));
  return g;
}

function modeleRoueMecanum(THREE: T, m: Mats, taille: Dim3) {
  const [D, ep] = taille;
  const r = D / 2;
  const g = new THREE.Group();
  g.add(cylindre(THREE, m.alu, r * 0.5, ep * 0.9, "y", 0, 0, 0, 26));
  // Rouleaux inclinés à 45°, la signature du mécanum
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const rouleau = new THREE.Mesh(
      new THREE.CapsuleGeometry(r * 0.11, r * 0.5, 4, 10),
      m.plastique
    );
    rouleau.position.set(Math.cos(a) * r * 0.8, 0, Math.sin(a) * r * 0.8);
    rouleau.rotation.set(Math.PI / 4, 0, -a);
    g.add(rouleau);
  }
  return g;
}

function modeleDriver(THREE: T, m: Mats, taille: Dim3, id: string) {
  const [L, W] = taille;
  const g = new THREE.Group();
  const ep = 0.0016;
  const couleur = id === "pca9685" ? m.pcbVert : m.pcbBleu;
  g.add(boite(THREE, couleur, L, W, ep, 0, 0, ep / 2));

  const p = puce(THREE, m, Math.min(L * 0.4, 0.008), Math.min(W * 0.4, 0.006), 0.001);
  p.position.set(0, 0, ep);
  g.add(p);

  const broches = Math.max(4, Math.round((L - 0.004) / 0.00254));
  for (const sy of [-1, 1]) {
    const b = barrette(THREE, m, broches, 1);
    b.position.set(0, sy * (W / 2 - 0.0016), ep);
    g.add(b);
  }
  g.add(condensateur(THREE, m, 0.0016, 0.0035, L / 2 - 0.004, W / 2 - 0.005));
  g.add(boite(THREE, m.led, 0.0012, 0.0008, 0.0005, -L / 2 + 0.003, -W / 2 + 0.004, ep + 0.00025));
  return g;
}

function modeleDriverGros(THREE: T, m: Mats, taille: Dim3) {
  const [L, W, H] = taille;
  const g = new THREE.Group();
  const ep = 0.0016;
  g.add(boite(THREE, m.pcbBleu, L, W, ep, 0, 0, ep / 2));

  const diss = dissipateur(THREE, m, L * 0.5, W * 0.55, H * 0.62, 6);
  diss.position.set(-L * 0.12, 0, ep);
  g.add(diss);

  const b1 = bornier(THREE, m, 3);
  b1.position.set(L / 2 - 0.009, -W / 2 + 0.006, ep);
  b1.rotation.z = Math.PI / 2;
  g.add(b1);
  const b2 = bornier(THREE, m, 2);
  b2.position.set(L / 2 - 0.009, W / 2 - 0.006, ep);
  b2.rotation.z = Math.PI / 2;
  g.add(b2);

  const b = barrette(THREE, m, 6, 1);
  b.position.set(-L / 2 + 0.01, -W / 2 + 0.003, ep);
  g.add(b);
  g.add(condensateur(THREE, m, 0.0035, 0.009, -L / 2 + 0.008, W / 2 - 0.008));
  return g;
}

function modeleLidarRond(THREE: T, m: Mats, taille: Dim3) {
  const [D, , H] = taille;
  const r = D / 2;
  const g = new THREE.Group();

  // Socle avec la carte de commande
  g.add(cylindre(THREE, m.plastique, r, H * 0.3, "z", 0, 0, H * 0.15, 40));
  g.add(cylindre(THREE, m.pcbNoir, r * 0.94, 0.0016, "z", 0, 0, H * 0.3, 40));
  // Ergot du moteur d'entraînement
  g.add(boite(THREE, m.plastique, r * 0.5, r * 0.34, H * 0.26, r * 0.72, 0, H * 0.15));

  // Tête tournante : c'est elle qu'on reconnaît
  const rTete = r * 0.72;
  g.add(cylindre(THREE, m.plastique, rTete, H * 0.12, "z", 0, 0, H * 0.36, 32));
  g.add(cylindre(THREE, m.sombre, rTete * 0.98, H * 0.34, "z", 0, 0, H * 0.59, 32));
  g.add(cylindre(THREE, m.plastique, rTete, H * 0.14, "z", 0, 0, H * 0.83, 32));

  // Fenêtre optique et émetteur laser
  const fenetre = new THREE.Mesh(
    new THREE.CylinderGeometry(rTete * 0.99, rTete * 0.99, H * 0.2, 32, 1, true, -0.5, 1.0),
    m.verre
  );
  fenetre.rotation.x = Math.PI / 2;
  fenetre.position.set(0, 0, H * 0.6);
  g.add(fenetre);
  g.add(cylindre(THREE, m.led, 0.0022, 0.0015, "y", rTete * 0.6, -rTete * 0.72, H * 0.6, 12));

  // Nappe de liaison
  g.add(cable(THREE, m.blanc, [-r * 0.6, 0, H * 0.28], [-r - 0.014, 0.006, H * 0.1], 0.003));
  return g;
}

function modeleLidarCube(THREE: T, m: Mats, taille: Dim3) {
  const [L, W, H] = taille;
  const g = new THREE.Group();
  g.add(boite(THREE, m.plastique, L, W, H * 0.36, 0, 0, H * 0.18));
  g.add(cylindre(THREE, m.sombre, Math.min(L, W) * 0.44, H * 0.46, "z", 0, 0, H * 0.6, 28));
  g.add(cylindre(THREE, m.plastique, Math.min(L, W) * 0.46, H * 0.12, "z", 0, 0, H * 0.89, 28));
  const bande = new THREE.Mesh(
    new THREE.CylinderGeometry(
      Math.min(L, W) * 0.45,
      Math.min(L, W) * 0.45,
      H * 0.22,
      28,
      1,
      true
    ),
    m.verre
  );
  bande.rotation.x = Math.PI / 2;
  bande.position.set(0, 0, H * 0.6);
  g.add(bande);
  g.add(cable(THREE, m.blanc, [-L * 0.4, 0, H * 0.14], [-L * 0.4 - 0.014, 0.005, H * 0.05], 0.002));
  return g;
}

function modeleBreakout(THREE: T, m: Mats, taille: Dim3, id: string) {
  const [L, W] = taille;
  const g = new THREE.Group();
  const ep = 0.0014;
  const couleur =
    id === "mpu6050" ? m.pcbBleu : id === "level-shifter" ? m.pcbRouge : m.pcbNoir;
  g.add(boite(THREE, couleur, L, W, ep, 0, 0, ep / 2));

  const p = puce(THREE, m, Math.min(L * 0.32, 0.005), Math.min(W * 0.32, 0.005), 0.0009);
  p.position.set(-L * 0.05, 0, ep);
  g.add(p);

  const broches = Math.max(3, Math.round((L - 0.003) / 0.00254));
  const b = barrette(THREE, m, broches, 1, 0.007);
  b.position.set(0, -W / 2 + 0.0016, ep);
  g.add(b);

  // Perçages de fixation, présents sur toutes ces petites cartes
  for (const sx of [-1, 1]) {
    g.add(cylindre(THREE, m.or, 0.0009, ep + 0.0002, "z", sx * (L / 2 - 0.0022), W / 2 - 0.0022, ep / 2, 10));
  }
  g.add(boite(THREE, m.led, 0.001, 0.0007, 0.0004, L / 2 - 0.003, W / 2 - 0.003, ep + 0.0002));
  return g;
}

function modeleCapteurTof(THREE: T, m: Mats, taille: Dim3) {
  const [L, W, H] = taille;
  const g = new THREE.Group();
  g.add(boite(THREE, m.pcbNoir, L, W, 0.0014, 0, 0, 0.0007));
  // Deux fenêtres : émetteur et récepteur
  for (const sx of [-1, 1]) {
    g.add(boite(THREE, m.sombre, L * 0.22, W * 0.5, H * 0.5, sx * L * 0.16, 0, 0.0014 + H * 0.25));
    g.add(cylindre(THREE, m.verre, W * 0.16, 0.0004, "z", sx * L * 0.16, 0, 0.0014 + H * 0.5, 12));
  }
  const b = barrette(THREE, m, 4, 1, 0.006);
  b.position.set(0, -W / 2 + 0.0015, 0.0014);
  g.add(b);
  return g;
}

function modeleUltrason(THREE: T, m: Mats, taille: Dim3) {
  const [L, W, H] = taille;
  const g = new THREE.Group();
  g.add(boite(THREE, m.pcbBleu, L, W, 0.0014, 0, 0, 0.0007));
  // Les deux capsules, immédiatement reconnaissables
  for (const sx of [-1, 1]) {
    g.add(cylindre(THREE, m.metal, 0.008, H * 0.75, "y", sx * 0.0125, 0, 0.0014 + H * 0.37, 24));
    g.add(cylindre(THREE, m.sombre, 0.0072, 0.0006, "y", sx * 0.0125, -W / 2 + 0.0004, 0.0014 + H * 0.37, 20));
  }
  g.add(puce(THREE, m, 0.006, 0.004, 0.0009));
  const b = barrette(THREE, m, 4, 1, 0.006);
  b.position.set(0, W / 2 - 0.0016, 0.0014);
  g.add(b);
  return g;
}

function modeleCameraBarre(THREE: T, m: Mats, taille: Dim3) {
  const [L, W, H] = taille;
  const g = new THREE.Group();
  g.add(boite(THREE, m.alu, L, W, H, 0, 0, H / 2));
  g.add(boite(THREE, m.sombre, L * 0.97, 0.0008, H * 0.8, 0, -W / 2, H / 2));
  // Stéréo à gauche et à droite, RGB au centre, projecteur infrarouge
  const objectif = (x: number, r: number, mat: ThreeNs.Material) => {
    g.add(cylindre(THREE, m.sombre, r * 1.25, 0.0018, "y", x, -W / 2 + 0.0006, H / 2, 20));
    g.add(cylindre(THREE, mat, r, 0.0012, "y", x, -W / 2 - 0.0002, H / 2, 20));
  };
  objectif(-L * 0.36, 0.0035, m.verre);
  objectif(0, 0.0032, m.verre);
  objectif(L * 0.36, 0.0035, m.verre);
  objectif(-L * 0.16, 0.0022, m.plastique);
  g.add(boite(THREE, m.led, 0.0012, 0.0006, 0.0008, L * 0.2, -W / 2, H * 0.82));
  // Filetage de fixation sous la barre
  g.add(cylindre(THREE, m.metal, 0.0032, 0.0016, "z", 0, 0, 0.0008, 14));
  return g;
}

function modeleCameraWebcam(THREE: T, m: Mats, taille: Dim3) {
  const [L, W, H] = taille;
  const g = new THREE.Group();
  const hCorps = H * 0.55;
  g.add(boite(THREE, m.plastique, L, W, hCorps, 0, 0, H - hCorps / 2));
  g.add(cylindre(THREE, m.sombre, hCorps * 0.4, 0.004, "y", 0, -W / 2, H - hCorps / 2, 24));
  g.add(cylindre(THREE, m.verre, hCorps * 0.26, 0.0016, "y", 0, -W / 2 - 0.002, H - hCorps / 2, 20));
  // Pied articulé
  g.add(boite(THREE, m.plastique, L * 0.55, W * 1.6, 0.004, 0, 0.004, 0.002));
  g.add(boite(THREE, m.plastique, L * 0.1, 0.004, H * 0.45, 0, 0.004, H * 0.28));
  return g;
}

function modeleCameraCsi(THREE: T, m: Mats, taille: Dim3) {
  const [L, W, H] = taille;
  const g = new THREE.Group();
  g.add(boite(THREE, m.pcbVert, L, W, 0.0011, 0, 0, 0.00055));
  g.add(boite(THREE, m.sombre, 0.0085, 0.0085, H * 0.5, 0, 0, 0.0011 + H * 0.25));
  g.add(cylindre(THREE, m.sombre, 0.0038, H * 0.32, "z", 0, 0, 0.0011 + H * 0.62, 20));
  g.add(cylindre(THREE, m.verre, 0.0026, 0.0006, "z", 0, 0, 0.0011 + H * 0.78, 18));
  // Connecteur de nappe CSI
  g.add(boite(THREE, m.blanc, L * 0.7, 0.0025, 0.0016, 0, -W / 2 + 0.0018, 0.0019));
  return g;
}

function modeleGps(THREE: T, m: Mats, taille: Dim3) {
  const [L, W, H] = taille;
  const g = new THREE.Group();
  g.add(boite(THREE, m.pcbBleu, L, W, 0.0014, 0, 0, 0.0007));
  // Antenne patch céramique dorée : la marque de fabrique d'un GPS
  g.add(boite(THREE, m.or, L * 0.8, W * 0.8, H * 0.45, 0, 0, 0.0014 + H * 0.22));
  g.add(cylindre(THREE, m.metal, 0.0008, H * 0.12, "z", 0, 0, 0.0014 + H * 0.5, 8));
  const b = barrette(THREE, m, 5, 1, 0.006);
  b.position.set(0, -W / 2 + 0.0016, 0.0014);
  g.add(b);
  return g;
}

function modeleLipo(THREE: T, m: Mats, taille: Dim3) {
  const [L, W, H] = taille;
  const g = new THREE.Group();
  // Sachet souple : arêtes adoucies
  const corps = new THREE.Mesh(
    new THREE.BoxGeometry(L, W, H, 2, 2, 2),
    m.plastique
  );
  corps.position.z = H / 2;
  g.add(corps);
  // Bande d'étiquette
  g.add(boite(THREE, m.pcbBleu, L * 0.98, W * 0.4, 0.0006, 0, 0, H + 0.0003));
  g.add(boite(THREE, m.blanc, L * 0.5, W * 0.16, 0.0004, -L * 0.15, 0, H + 0.0007));
  // Fils de puissance et prise XT60
  g.add(cable(THREE, m.rouge, [L / 2, 0.006, H * 0.5], [L / 2 + 0.022, 0.008, H * 0.35], 0.005));
  g.add(cable(THREE, m.sombre, [L / 2, -0.006, H * 0.5], [L / 2 + 0.022, -0.008, H * 0.35], 0.005));
  g.add(boite(THREE, m.jaune, 0.0155, 0.0075, 0.008, L / 2 + 0.03, 0, H * 0.3));
  // Prise d'équilibrage
  g.add(boite(THREE, m.blanc, 0.008, 0.004, 0.003, L / 2 + 0.012, W / 2 - 0.008, H * 0.75));
  return g;
}

function modeleModuleGaine(THREE: T, m: Mats, taille: Dim3) {
  const [L, W, H] = taille;
  const g = new THREE.Group();
  // Module sous gaine thermorétractable
  g.add(boite(THREE, m.sombre, L, W, H, 0, 0, H / 2));
  g.add(boite(THREE, m.plastique, L * 0.99, W * 0.6, H * 0.15, 0, 0, H));
  for (const [sx, c1, c2] of [
    [-1, m.rouge, m.sombre],
    [1, m.rouge, m.sombre]
  ] as const) {
    g.add(cable(THREE, c1, [sx * (L / 2), 0.003, H * 0.5], [sx * (L / 2 + 0.016), 0.004, H * 0.3], 0.003));
    g.add(cable(THREE, c2, [sx * (L / 2), -0.003, H * 0.5], [sx * (L / 2 + 0.016), -0.004, H * 0.3], 0.003));
  }
  return g;
}

function modeleInterrupteur(THREE: T, m: Mats, taille: Dim3) {
  const [L, W, H] = taille;
  const g = new THREE.Group();
  g.add(boite(THREE, m.plastique, L, W, H * 0.6, 0, 0, H * 0.3));
  g.add(boite(THREE, m.rouge, L * 0.35, W * 0.5, H * 0.35, -L * 0.2, 0, H * 0.72));
  // Porte-fusible transparent
  g.add(cylindre(THREE, m.verre, W * 0.22, L * 0.34, "x", L * 0.24, 0, H * 0.72, 16));
  g.add(cylindre(THREE, m.metal, W * 0.16, L * 0.1, "x", L * 0.38, 0, H * 0.72, 12));
  return g;
}

function modeleHub(THREE: T, m: Mats, taille: Dim3) {
  const [L, W, H] = taille;
  const g = new THREE.Group();
  g.add(boite(THREE, m.plastique, L, W, H, 0, 0, H / 2));
  for (let i = 0; i < 4; i++) {
    const u = usbDouble(THREE, m, "bleu");
    u.position.set(-L / 2 + 0.016 + i * 0.021, -W / 2 + 0.007, H - 0.0155);
    u.rotation.z = -Math.PI / 2;
    u.scale.set(1, 0.55, 1);
    g.add(u);
  }
  g.add(cylindre(THREE, m.led, 0.0012, 0.0006, "z", L / 2 - 0.008, W / 2 - 0.006, H, 10));
  return g;
}

function modelePlaque(THREE: T, m: Mats, taille: Dim3) {
  const [L, W, H] = taille;
  const g = new THREE.Group();
  g.add(boite(THREE, m.alu, L, W, H, 0, 0, H / 2));
  // Grille de perçage au pas de 10 mm, matérialisée en instanciation
  const cols = Math.floor(L / 0.02) - 1;
  const rows = Math.floor(W / 0.02) - 1;
  const total = Math.max(0, cols * rows);
  if (total > 0) {
    const inst = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.0018, 0.0018, H * 1.4, 8),
      m.sombre,
      total
    );
    const mat4 = new THREE.Matrix4();
    const rot = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    let i = 0;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        mat4
          .makeTranslation((c - (cols - 1) / 2) * 0.02, (r - (rows - 1) / 2) * 0.02, H / 2)
          .multiply(rot);
        inst.setMatrixAt(i++, mat4);
      }
    }
    inst.instanceMatrix.needsUpdate = true;
    g.add(inst);
  }
  return g;
}

/* ─────────────── Point d'entrée ─────────────── */

const BUILDERS: Record<
  Forme,
  (THREE: T, m: Mats, taille: Dim3, id: string) => ThreeNs.Group
> = {
  sbc: modeleSbc,
  minipc: (T3, m, t) => modeleMiniPc(T3, m, t),
  devkit: modeleDevkit,
  "moteur-dc": (T3, m, t) => modeleMoteurDc(T3, m, t),
  "moteur-nema": (T3, m, t) => modeleNema(T3, m, t),
  servo: (T3, m, t) => modeleServo(T3, m, t),
  "servo-bus": (T3, m, t) => modeleServoBus(T3, m, t),
  "roue-moyeu": (T3, m, t) => modeleRoueMoyeu(T3, m, t),
  "roue-mecanum": (T3, m, t) => modeleRoueMecanum(T3, m, t),
  driver: modeleDriver,
  "driver-gros": (T3, m, t) => modeleDriverGros(T3, m, t),
  "lidar-rond": (T3, m, t) => modeleLidarRond(T3, m, t),
  "lidar-cube": (T3, m, t) => modeleLidarCube(T3, m, t),
  breakout: modeleBreakout,
  "capteur-tof": (T3, m, t) => modeleCapteurTof(T3, m, t),
  ultrason: (T3, m, t) => modeleUltrason(T3, m, t),
  "camera-barre": (T3, m, t) => modeleCameraBarre(T3, m, t),
  "camera-webcam": (T3, m, t) => modeleCameraWebcam(T3, m, t),
  "camera-csi": (T3, m, t) => modeleCameraCsi(T3, m, t),
  gps: (T3, m, t) => modeleGps(T3, m, t),
  lipo: (T3, m, t) => modeleLipo(T3, m, t),
  "module-gaine": (T3, m, t) => modeleModuleGaine(T3, m, t),
  interrupteur: (T3, m, t) => modeleInterrupteur(T3, m, t),
  hub: (T3, m, t) => modeleHub(T3, m, t),
  plaque: (T3, m, t) => modelePlaque(T3, m, t)
};

/**
 * Construit le modèle d'un composant. Le groupe renvoyé est posé sur le
 * plan z = 0 : l'appelant n'a qu'à le placer sur le plateau voulu.
 */
export function construireModele(
  THREE: T,
  mats: Mats,
  composant: Component
): ThreeNs.Group {
  const forme = formeDe(composant);
  const taille = tailleDe(composant);
  return BUILDERS[forme](THREE, mats, taille, composant.id);
}

/* ─────────────── Pièces du robot, pour la Forge ─────────────── */

/** Roue avec pneu, jante et rayons — plus parlante qu'un cylindre nu. */
export function construireRoue(
  THREE: T,
  m: Mats,
  rayon: number,
  largeur: number
): ThreeNs.Group {
  const g = new THREE.Group();

  const pneu = new THREE.Mesh(
    new THREE.CylinderGeometry(rayon, rayon, largeur, 32),
    m.plastique
  );
  g.add(pneu);

  // Crampons
  const nb = 20;
  const inst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(rayon * 0.16, largeur * 1.06, rayon * 0.08),
    m.sombre,
    nb
  );
  const mat4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const ech = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < nb; i++) {
    const a = (i / nb) * Math.PI * 2;
    pos.set(Math.cos(a) * rayon * 0.97, 0, Math.sin(a) * rayon * 0.97);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a);
    mat4.compose(pos, q, ech);
    inst.setMatrixAt(i, mat4);
  }
  inst.instanceMatrix.needsUpdate = true;
  g.add(inst);

  // Jante et rayons
  const jante = new THREE.Mesh(
    new THREE.CylinderGeometry(rayon * 0.62, rayon * 0.62, largeur * 1.02, 28),
    m.alu
  );
  g.add(jante);
  const moyeu = new THREE.Mesh(
    new THREE.CylinderGeometry(rayon * 0.2, rayon * 0.2, largeur * 1.3, 18),
    m.metal
  );
  g.add(moyeu);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const rayonBarre = new THREE.Mesh(
      new THREE.BoxGeometry(rayon * 0.42, largeur * 0.5, rayon * 0.07),
      m.alu
    );
    rayonBarre.position.set(Math.cos(a) * rayon * 0.4, 0, Math.sin(a) * rayon * 0.4);
    rayonBarre.rotation.y = -a;
    g.add(rayonBarre);
  }

  // Le cylindre three.js est aligné sur y : c'est déjà l'axe de la roue.
  return g;
}

/** Roue folle à bille, comme sous une base différentielle. */
export function construireRoulette(THREE: T, m: Mats, rayon: number): ThreeNs.Group {
  const g = new THREE.Group();
  const bille = new THREE.Mesh(new THREE.SphereGeometry(rayon, 20, 16), m.metal);
  g.add(bille);
  const cage = new THREE.Mesh(
    new THREE.CylinderGeometry(rayon * 1.15, rayon * 1.15, rayon * 1.2, 18, 1, true),
    m.alu
  );
  cage.rotation.x = Math.PI / 2;
  cage.position.z = rayon * 0.85;
  g.add(cage);
  return g;
}

/** LiDAR rotatif, aux cotes passées, pour l'aperçu de la Forge. */
export function construireLidar(
  THREE: T,
  m: Mats,
  rayon: number,
  hauteur: number
): ThreeNs.Group {
  return modeleLidarRond(THREE, m, [rayon * 2, rayon * 2, hauteur]);
}
