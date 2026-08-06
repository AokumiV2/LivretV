/**
 * Copie le runtime Pyodide depuis node_modules vers public/pyodide.
 *
 * Pourquoi pas un CDN : l'Atelier téléchargerait alors ~13 Mo depuis un
 * tiers à chaque premier lancement. Servir les mêmes fichiers depuis le
 * site coûte le même poids réseau mais n'expose personne à un domaine
 * externe, survit à une panne du CDN, et permet une politique de
 * sécurité de contenu stricte.
 *
 * Les fichiers ne sont pas versionnés : ce script tourne avant chaque
 * build, en local comme sur Vercel.
 */

import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(RACINE, "node_modules", "pyodide");
const CIBLE = join(RACINE, "public", "pyodide");

/* Le strict nécessaire pour un interpréteur sans paquet tiers.
   Pas de scipy, pas de numpy : l'Atelier n'en a pas besoin, et
   chaque mégaoctet se paie au premier lancement. */
const FICHIERS = [
  "pyodide.js",
  "pyodide.mjs",
  "pyodide.asm.js",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json"
];

if (!existsSync(SOURCE)) {
  console.error(
    "pyodide est introuvable dans node_modules. Lance `npm install` d'abord."
  );
  process.exit(1);
}

mkdirSync(CIBLE, { recursive: true });

let total = 0;
for (const f of FICHIERS) {
  const de = join(SOURCE, f);
  if (!existsSync(de)) {
    console.error(`Fichier attendu absent du paquet pyodide : ${f}`);
    process.exit(1);
  }
  copyFileSync(de, join(CIBLE, f));
  total += statSync(de).size;
}

console.log(
  `pyodide → public/pyodide (${FICHIERS.length} fichiers, ${(total / 1048576).toFixed(1)} Mo)`
);
