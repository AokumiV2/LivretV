import type { EtatSim, Monde, Pose, RobotSim, Segment } from "./types";

/* ══════════════════════════════════════════════════════════════
   Moteur physique 2D.

   Trois principes tenus de bout en bout :

   1. Pas de temps fixe. Le monde avance par tranches de 20 ms,
      indépendamment de la fréquence d'affichage.
   2. Aléatoire à graine. Le bruit des capteurs et la dérive des
      roues sont pseudo-aléatoires mais reproductibles : deux runs
      du même code donnent exactement le même résultat, sinon la
      validation des objectifs ne voudrait rien dire.
   3. Le robot ne connaît pas la vérité. `pose` est la position
      réelle, `poseOdom` est ce que l'odométrie croit. L'écart entre
      les deux est le sujet de la mission 10.
   ══════════════════════════════════════════════════════════════ */

export const PAS = 0.02;

/** Générateur mulberry32 : court, rapide, et surtout déterministe. */
export function prng(graine: number) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bruit gaussien centré, par Box-Muller. */
export function gauss(rng: () => number, sigma: number) {
  if (sigma <= 0) return 0;
  const u = Math.max(rng(), 1e-9);
  const v = rng();
  return sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ---------- Géométrie ---------- */

/**
 * Distance du premier mur rencontré par un rayon.
 * Renvoie `Infinity` si rien n'est touché dans la portée — c'est
 * exactement ce que publie un vrai LiDAR.
 */
export function rayon(
  murs: Segment[],
  ox: number,
  oy: number,
  angle: number,
  portee: number
): number {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let meilleur = Infinity;

  for (const s of murs) {
    const ax = s.x1;
    const ay = s.y1;
    const ex = s.x2 - s.x1;
    const ey = s.y2 - s.y1;

    const denom = dx * ey - dy * ex;
    if (Math.abs(denom) < 1e-12) continue;

    const t = ((ax - ox) * ey - (ay - oy) * ex) / denom;
    const u = ((ax - ox) * dy - (ay - oy) * dx) / denom;

    if (t >= 0 && u >= 0 && u <= 1 && t < meilleur) meilleur = t;
  }

  return meilleur <= portee ? meilleur : Infinity;
}

/** Distance d'un point au segment le plus proche. */
export function distanceMur(murs: Segment[], px: number, py: number): number {
  let min = Infinity;
  for (const s of murs) {
    const ex = s.x2 - s.x1;
    const ey = s.y2 - s.y1;
    const len2 = ex * ex + ey * ey;
    let u = len2 > 0 ? ((px - s.x1) * ex + (py - s.y1) * ey) / len2 : 0;
    u = Math.max(0, Math.min(1, u));
    const cx = s.x1 + u * ex;
    const cy = s.y1 + u * ey;
    const d = Math.hypot(px - cx, py - cy);
    if (d < min) min = d;
  }
  return min;
}

/** Ramène un angle dans ]-π, π]. */
export function normaliser(a: number): number {
  let x = a;
  while (x > Math.PI) x -= 2 * Math.PI;
  while (x <= -Math.PI) x += 2 * Math.PI;
  return x;
}

/* ---------- Simulation ---------- */

export function etatInitial(robot: RobotSim, monde: Monde): EtatSim {
  const pose: Pose = { ...monde.depart };
  return {
    t: 0,
    pose,
    /* Le repère odom naît là où le robot démarre, orienté comme lui :
       c'est la convention de ROS 2, et c'est pour cela que /odom
       part toujours de zéro quel que soit l'endroit du monde. */
    poseOdom: { x: 0, y: 0, theta: 0 },
    v: 0,
    w: 0,
    consigne: { v: 0, w: 0 },
    roues: [0, 0],
    scan: robot.lidar ? scanner(robot, monde, pose, prng(1)) : null,
    collision: false,
    chocs: 0,
    distanceMinMur: distanceMur(monde.murs, pose.x, pose.y),
    parcouru: 0,
    tempsLongeMur: 0,
    trace: [[pose.x, pose.y]],
    zonesVisitees: []
  };
}

/**
 * Un tour complet de LiDAR, dans la convention de `sensor_msgs/LaserScan`
 * avec `angle_min = -π` : l'indice du milieu regarde droit devant.
 */
export function scanner(
  robot: RobotSim,
  monde: Monde,
  pose: Pose,
  rng: () => number
): number[] {
  const l = robot.lidar;
  if (!l) return [];

  const out = new Array<number>(l.rayons);
  const pas = (2 * Math.PI) / l.rayons;

  for (let i = 0; i < l.rayons; i++) {
    const a = pose.theta - Math.PI + i * pas;
    const d = rayon(monde.murs, pose.x, pose.y, a, l.portee);
    if (!Number.isFinite(d) || d < l.porteeMin) {
      out[i] = Infinity;
    } else {
      out[i] = Math.max(l.porteeMin, d + gauss(rng, l.bruit));
    }
  }

  return out;
}

/**
 * Avance le monde d'un pas.
 *
 * `etat` est modifié en place : c'est un objet unique réutilisé des
 * milliers de fois par seconde, en allouer un nouveau à chaque pas
 * ferait travailler le ramasse-miettes pour rien.
 */
export function avancer(
  etat: EtatSim,
  robot: RobotSim,
  monde: Monde,
  rng: () => number,
  dt = PAS
): void {
  /* Limitation de la consigne : un robot lourd ne change pas de
     vitesse instantanément, et c'est ce qui fait qu'un même code
     ne se comporte pas pareil sur le rover et sur l'AMR. */
  const vCible = Math.max(-robot.vMax, Math.min(robot.vMax, etat.consigne.v));
  const wCible = Math.max(-robot.wMax, Math.min(robot.wMax, etat.consigne.w));

  const dv = Math.max(-robot.aMax * dt, Math.min(robot.aMax * dt, vCible - etat.v));
  const dw = Math.max(
    -robot.alphaMax * dt,
    Math.min(robot.alphaMax * dt, wCible - etat.w)
  );
  etat.v += dv;
  etat.w += dw;

  /* Déplacement réel */
  const theta = etat.pose.theta;
  const nx = etat.pose.x + etat.v * Math.cos(theta) * dt;
  const ny = etat.pose.y + etat.v * Math.sin(theta) * dt;

  const libre = distanceMur(monde.murs, nx, ny) > robot.rayon;
  const enContact = !libre;

  if (libre) {
    etat.parcouru += Math.hypot(nx - etat.pose.x, ny - etat.pose.y);
    etat.pose.x = nx;
    etat.pose.y = ny;
  } else {
    /* On bute : la translation est annulée, la rotation reste
       possible — c'est ce que fait un vrai robot coincé. */
    etat.v = 0;
  }

  etat.pose.theta = normaliser(etat.pose.theta + etat.w * dt);

  if (enContact && !etat.collision) etat.chocs += 1;
  etat.collision = enContact;

  /* Vitesses de roues, avec biais systématique et bruit : c'est
     de là que naît la dérive d'odométrie. */
  const vl = etat.v - (etat.w * robot.entraxe) / 2;
  const vr = etat.v + (etat.w * robot.entraxe) / 2;
  const vlm = vl * robot.derive.gauche + gauss(rng, robot.derive.bruit * Math.abs(vl));
  const vrm = vr * robot.derive.droite + gauss(rng, robot.derive.bruit * Math.abs(vr));

  const vOdom = (vlm + vrm) / 2;
  const wOdom = (vrm - vlm) / robot.entraxe;

  etat.poseOdom.x += vOdom * Math.cos(etat.poseOdom.theta) * dt;
  etat.poseOdom.y += vOdom * Math.sin(etat.poseOdom.theta) * dt;
  etat.poseOdom.theta = normaliser(etat.poseOdom.theta + wOdom * dt);

  etat.roues[0] = etat.roues[0] + (vl / robot.rayonRoue) * dt;
  etat.roues[1] = etat.roues[1] + (vr / robot.rayonRoue) * dt;

  const d = distanceMur(monde.murs, etat.pose.x, etat.pose.y);
  if (d < etat.distanceMinMur) etat.distanceMinMur = d;
  /* Longer un mur, c'est se tenir ni collé ni loin. La fenêtre est
     large : on mesure une intention, pas une performance. */
  if (d > robot.rayon + 0.05 && d < robot.rayon + 0.65) etat.tempsLongeMur += dt;

  for (const z of monde.zones) {
    if (etat.zonesVisitees.includes(z.id)) continue;
    if (Math.hypot(etat.pose.x - z.x, etat.pose.y - z.y) <= z.rayon) {
      etat.zonesVisitees.push(z.id);
    }
  }

  etat.t += dt;
}

/** Ajoute un point à la traînée, en bornant sa longueur. */
export function marquerTrace(etat: EtatSim, max = 1200): void {
  const last = etat.trace[etat.trace.length - 1];
  if (last && Math.hypot(etat.pose.x - last[0], etat.pose.y - last[1]) < 0.02) return;
  etat.trace.push([etat.pose.x, etat.pose.y]);
  if (etat.trace.length > max) etat.trace.shift();
}

/** Quaternion (z, w) d'un lacet, pour remplir les messages d'odométrie. */
export function quatZ(theta: number): { z: number; w: number } {
  return { z: Math.sin(theta / 2), w: Math.cos(theta / 2) };
}
