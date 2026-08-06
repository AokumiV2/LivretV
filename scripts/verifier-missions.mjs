/**
 * Rejoue les douze missions de l'Atelier, sans navigateur.
 *
 *   npm run verifier:missions
 *   node scripts/verifier-missions.mjs qos evitement
 *
 * Pour chaque mission, deux runs : le code de départ doit s'exécuter
 * sans planter — c'est la promesse faite à l'élève qui appuie sur
 * « Lancer » avant d'avoir écrit une ligne — et la solution doit
 * atteindre tous ses objectifs.
 *
 * La mécanique du banc est dans scripts/sim/banc.mjs.
 */

import { COULEURS, jouer, preparer } from "./sim/banc.mjs";

const { V, R, J, N } = COULEURS;

const mods = preparer();

const filtres = process.argv.slice(2);
const choisies = mods.missions.MISSIONS.filter(
  (m) => filtres.length === 0 || filtres.includes(m.id)
);

let echecs = 0;

for (const mission of choisies) {
  const depart = await jouer(mods, { ...mission, duree: 2 }, mission.depart);
  if (depart.erreur) {
    echecs += 1;
    console.log(`${R}✗${N} ${mission.numero}. ${mission.titre} — le code de départ plante`);
    console.log(depart.erreur.split("\n").slice(-4).join("\n"));
    continue;
  }

  const t = await jouer(mods, mission, mission.solution);
  if (t.erreur) {
    echecs += 1;
    console.log(`${R}✗${N} ${mission.numero}. ${mission.titre} — la solution plante`);
    console.log(t.erreur.split("\n").slice(-6).join("\n"));
    continue;
  }

  const resultats = mission.objectifs.map((o) => ({ o, ok: Boolean(o.test(t)) }));
  const rates = resultats.filter((r) => !r.ok);
  if (rates.length) echecs += 1;

  console.log(
    `${rates.length ? `${R}✗${N}` : `${V}✓${N}`} ${mission.numero}. ${mission.titre}` +
      `  ${J}${t.etat.parcouru.toFixed(1)} m, ${t.etat.chocs} choc(s),` +
      ` garde ${t.etat.distanceMinMur.toFixed(2)} m,` +
      ` zones ${t.etat.zonesVisitees.join("/") || "—"}${N}`
  );
  for (const r of rates) console.log(`     ${R}→ ${r.o.label}${N}`);
}

console.log(
  echecs === 0
    ? `\n${V}Les ${choisies.length} missions passent.${N}`
    : `\n${R}${echecs} mission(s) en échec.${N}`
);
process.exit(echecs === 0 ? 0 : 1);
