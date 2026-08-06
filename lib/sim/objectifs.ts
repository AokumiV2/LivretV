import type { Trace } from "./types";

/* ══════════════════════════════════════════════════════════════
   Les briques de validation des missions.

   Un objectif n'est pas une comparaison de sortie texte : c'est une
   question posée à la trace du run. « A-t-il publié sur /cmd_vel à
   au moins 5 Hz ? », « Est-il passé à moins de 15 cm d'un mur ? ».
   Deux codes différents qui produisent le même comportement passent
   tous les deux — c'est la seule façon honnête de noter du code.
   ══════════════════════════════════════════════════════════════ */

export function topic(t: Trace, nom: string) {
  return t.topics.find((x) => x.topic === nom);
}

/** Le code a publié sur ce topic, à une cadence suffisante. */
export function publie(t: Trace, nom: string, hzMin = 0, nMin = 1) {
  const s = topic(t, nom);
  if (!s) return false;
  if (!s.publishers.some((p) => p !== "simulation")) return false;
  return s.publies >= nMin && s.hz >= hzMin;
}

/** Des messages sont réellement arrivés jusqu'au callback. */
export function recoit(t: Trace, nom: string, nMin = 1) {
  return (t.callbacks[nom] ?? 0) >= nMin;
}

/** Le code s'est abonné à ce topic, quelle que soit la suite. */
export function abonne(t: Trace, nom: string) {
  return t.nodes.some((n) => n.subs.some((s) => s.topic === nom));
}

export function qosAbonnement(t: Trace, nom: string) {
  for (const n of t.nodes) {
    const s = n.subs.find((x) => x.topic === nom);
    if (s) return s.qos;
  }
  return null;
}

export function aNode(t: Trace, nom?: string) {
  if (!nom) return t.nodes.length > 0;
  return t.nodes.some((n) => n.name === nom);
}

export function aTimer(t: Trace, periodeMax = Infinity) {
  return t.nodes.some((n) => n.timers.some((p) => p <= periodeMax));
}

export function aParametre(t: Trace, nom: string) {
  return Object.prototype.hasOwnProperty.call(t.parametres, nom);
}

export function aServiceAppele(t: Trace, nom: string, nMin = 1) {
  return (t.services[nom] ?? 0) >= nMin;
}

export function journalContient(t: Trace, motif: RegExp) {
  return t.logs.some((l) => motif.test(l));
}

/* ---------- Comportement physique ---------- */

export function zoneAtteinte(t: Trace, zone: string) {
  return t.etat.zonesVisitees.includes(zone);
}

export function parcouru(t: Trace, metres: number) {
  return t.etat.parcouru >= metres;
}

export function chocs(t: Trace, max: number) {
  return t.etat.chocs <= max;
}

export function garde(t: Trace, metres: number) {
  return t.etat.distanceMinMur >= metres;
}

/** Le robot est immobile à la fin du run. */
export function arrete(t: Trace, seuil = 0.03) {
  return Math.abs(t.etat.v) < seuil && Math.abs(t.etat.w) < seuil;
}

/** Distance à vol d'oiseau entre la pose finale et un point. */
export function distanceA(t: Trace, x: number, y: number) {
  return Math.hypot(t.etat.pose.x - x, t.etat.pose.y - y);
}

/** Écart entre la position vraie et celle que croit l'odométrie. */
export function derive(t: Trace) {
  return Math.hypot(
    t.etat.pose.x - t.etat.poseOdom.x,
    t.etat.pose.y - t.etat.poseOdom.y
  );
}

export function longeMur(t: Trace, secondes: number) {
  return t.etat.tempsLongeMur >= secondes;
}
