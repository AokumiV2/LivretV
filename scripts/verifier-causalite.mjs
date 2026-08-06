/**
 * Prouve que le robot obéit au code, et pas à côté.
 *
 *   npm run verifier:causalite
 *
 * Les missions montrent que « ça marche ». Ce test-ci répond à une
 * question plus exigeante : la distance parcourue est-elle **causée**
 * par la valeur publiée sur /cmd_vel ? On ne change qu'un nombre dans
 * le nœud Python et on compare le résultat à une prédiction calculée
 * d'avance, pas à un run de référence.
 *
 * Si un point échoue, ce n'est pas la tolérance qu'il faut élargir :
 * c'est que la commande ne se propage pas comme annoncé.
 */

import { COULEURS, jouer, preparer } from "./sim/banc.mjs";

const { V, R, J, G, N } = COULEURS;

const mods = preparer();
const { getRobot } = mods.robots;

let echecs = 0;
const verdict = (ok, ligne) => {
  if (!ok) echecs += 1;
  console.log(`  ${ok ? V + "✓" : R + "✗"}${N} ${ligne}`);
};

/* ---------- Le cobaye : un nœud dont une seule valeur varie ---------- */

/** Période du timer, en secondes. Elle décale le premier ordre. */
const PERIODE = 0.1;

const NOEUD = (lin, ang) => `import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist


class Cobaye(Node):
    def __init__(self):
        super().__init__('cobaye')
        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.create_timer(${PERIODE}, self.boucle)

    def boucle(self):
        msg = Twist()
        msg.linear.x = ${lin}
        msg.angular.z = ${ang}
        self.pub.publish(msg)


def main():
    rclpy.init()
    node = Cobaye()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


main()
`;

/* ---------- Prédictions ---------- */

/**
 * Distance théorique parcourue.
 *
 * Trois termes, et aucun n'est un facteur d'ajustement : la consigne
 * est écrêtée à `vMax`, le premier ordre n'arrive qu'au premier
 * déclenchement du timer, et la rampe d'accélération coûte
 * v²/(2·aMax) — l'aire manquante sous le profil de vitesse.
 */
function distanceAttendue(v, duree, robotId) {
  const r = getRobot(robotId);
  const vr = Math.min(v, r.vMax);
  return vr * (duree - PERIODE) - (vr * vr) / (2 * r.aMax);
}

function rotationAttendue(w, duree, robotId) {
  const r = getRobot(robotId);
  const wr = Math.min(w, r.wMax);
  return wr * (duree - PERIODE) - (wr * wr) / (2 * r.alphaMax);
}

const TOLERANCE = 0.03;
const base = { robot: "table", monde: "piste" };

/* ---------- A. Proportionnalité ---------- */

console.log(`\n${J}A — proportionnalité : seul msg.linear.x change${N}`);
for (const v of [0.05, 0.1, 0.15, 0.2]) {
  const r = await jouer(mods, { ...base, duree: 12 }, NOEUD(v.toFixed(2), "0.0"));
  const th = distanceAttendue(v, 12, "table");
  const ecart = Math.abs(r.etat.parcouru - th) / th;
  verdict(
    ecart < TOLERANCE,
    `linear.x = ${v.toFixed(2)} m/s  →  attendu ${th.toFixed(3)} m, ` +
      `mesuré ${r.etat.parcouru.toFixed(3)} m  ${G}(écart ${(ecart * 100).toFixed(2)} %)${N}`
  );
}

/* ---------- B. Contrôles nuls ---------- */

console.log(`\n${J}B — contrôles nuls : rien ne doit bouger${N}`);
{
  const sansPublish = NOEUD("0.15", "0.0").replace(
    "        self.pub.publish(msg)",
    "        pass"
  );
  const r1 = await jouer(mods, { ...base, duree: 12 }, sansPublish);
  verdict(r1.etat.parcouru === 0, `publish() retiré     →  ${r1.etat.parcouru.toFixed(3)} m`);

  const sansSpin = NOEUD("0.15", "0.0").replace("    rclpy.spin(node)", "    pass");
  const r2 = await jouer(mods, { ...base, duree: 12 }, sansSpin);
  verdict(
    r2.etat.parcouru === 0 && !r2.spin,
    `rclpy.spin() retiré  →  ${r2.etat.parcouru.toFixed(3)} m, spin=${r2.spin}`
  );
}

/* ---------- C. Rotation pure ---------- */

console.log(`\n${J}C — les deux voies de commande sont distinctes${N}`);
{
  const r = await jouer(mods, { ...base, duree: 10 }, NOEUD("0.0", "0.6"));
  const th = rotationAttendue(0.6, 10, "table");
  const ecart = Math.abs(r.rotation - th) / th;
  verdict(
    r.etat.parcouru < 0.01,
    `angular.z seul       →  ${r.etat.parcouru.toFixed(4)} m parcourus (doit être nul)`
  );
  verdict(
    ecart < TOLERANCE,
    `rotation cumulée     →  attendu ${th.toFixed(3)} rad, ` +
      `mesuré ${r.rotation.toFixed(3)} rad  ${G}(écart ${(ecart * 100).toFixed(2)} %)${N}`
  );
}

/* ---------- D. La physique borne la consigne ---------- */

console.log(`\n${J}D — la consigne est écrêtée, pas obéie aveuglément${N}`);
{
  const r = await jouer(mods, { ...base, duree: 12 }, NOEUD("5.0", "0.0"));
  const th = distanceAttendue(5.0, 12, "table");
  const ecart = Math.abs(r.etat.parcouru - th) / th;
  verdict(
    ecart < TOLERANCE && r.etat.parcouru < 3,
    `linear.x = 5.00 m/s  →  attendu ${th.toFixed(3)} m ` +
      `(vMax = ${getRobot("table").vMax} m/s), mesuré ${r.etat.parcouru.toFixed(3)} m ` +
      `${G}— et non 59 m${N}`
  );
}

/* ---------- E. Reproductibilité ---------- */

console.log(`\n${J}E — deux runs du même code sont identiques${N}`);
{
  const a = await jouer(mods, { ...base, duree: 12 }, NOEUD("0.15", "0.0"));
  const b = await jouer(mods, { ...base, duree: 12 }, NOEUD("0.15", "0.0"));
  verdict(
    a.etat.parcouru === b.etat.parcouru,
    `run 1 = ${a.etat.parcouru.toFixed(6)} m, run 2 = ${b.etat.parcouru.toFixed(6)} m`
  );
}

console.log(
  echecs === 0
    ? `\n${V}Tous les points passent : le mouvement est causé par le code.${N}\n`
    : `\n${R}${echecs} point(s) en échec.${N}\n`
);
process.exit(echecs === 0 ? 0 : 1);
