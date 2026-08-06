/**
 * Vérifie les douze missions sans navigateur.
 *
 *   node scripts/verifier-missions.mjs            # toutes
 *   node scripts/verifier-missions.mjs qos evitement
 *
 * Le principe : Node tient la boucle, la physique et le bus — le même
 * code que le worker du site — et CPython exécute le shim rclpy et le
 * script de la mission. Un aller-retour par pas de temps sur les
 * tubes, soit quelques milliers de messages : c'est instantané, et ça
 * teste la vraie chaîne plutôt qu'une imitation.
 *
 * Ce qui n'est pas couvert ici : Pyodide et l'interface. C'est le rôle
 * du test Playwright.
 */

import { spawn, execFileSync } from "node:child_process";
import { createInterface } from "node:readline";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(ICI, "..");
const VERIF = join(RACINE, ".verif");
const ARBRE = join(VERIF, "pytree");

const require = createRequire(import.meta.url);

/* tsc conserve les alias « @/… » tels quels dans le JavaScript émis.
   On les résout ici plutôt que d'ajouter une dépendance. */
const Module = require("node:module");
const resoudre = Module._resolveFilename;
Module._resolveFilename = function (demande, ...reste) {
  if (typeof demande === "string" && demande.startsWith("@/")) {
    demande = join(VERIF, demande.slice(2));
  }
  return resoudre.call(this, demande, ...reste);
};

/* ---------- 1. Compiler le TypeScript nécessaire ---------- */

function compiler() {
  rmSync(VERIF, { recursive: true, force: true });
  execFileSync("npx", ["tsc", "-p", "tsconfig.verif.json"], {
    cwd: RACINE,
    stdio: "inherit"
  });
}

/* ---------- 2. Déposer l'arborescence Python ---------- */

function deposerPython() {
  const { FICHIERS_PY } = require(join(VERIF, "lib/sim/py/index.js"));
  for (const [chemin, contenu] of Object.entries(FICHIERS_PY)) {
    const f = join(ARBRE, chemin);
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, contenu, "utf8");
  }
}

/* ---------- 3. Le processus Python ---------- */

class Python {
  constructor() {
    this.proc = spawn("python3", [join(ICI, "sim", "pilote.py")], {
      cwd: ARBRE,
      env: { ...process.env, PYTHONPATH: ARBRE, PYTHONIOENCODING: "utf-8" },
      stdio: ["pipe", "pipe", "inherit"]
    });
    this.lignes = createInterface({ input: this.proc.stdout });
    this.attentes = [];
    this.lignes.on("line", (l) => {
      const f = this.attentes.shift();
      if (f) f(JSON.parse(l));
    });
  }

  demander(objet) {
    return new Promise((ok) => {
      this.attentes.push(ok);
      this.proc.stdin.write(JSON.stringify(objet) + "\n");
    });
  }

  fermer() {
    this.proc.stdin.write(JSON.stringify({ c: "stop" }) + "\n");
    this.proc.stdin.end();
  }
}

/* ---------- 4. Un run complet ---------- */

async function jouer(mods, mission, source) {
  const { Bus } = mods.bus;
  const { PAS, avancer, etatInitial, marquerTrace, prng, quatZ, scanner } = mods.physics;
  const robot = mods.robots.getRobot(mission.robot);
  const monde = mods.mondes.getMonde(mission.monde);

  const py = new Python();
  const bus = new Bus();
  const etat = etatInitial(robot, monde);
  const rng = prng(20240607);

  const CAPTEUR = { reliability: "BEST_EFFORT", durability: "VOLATILE", depth: 5 };
  const FIABLE = { reliability: "RELIABLE", durability: "VOLATILE", depth: 10 };
  const CB_SIM = -1;

  const ids = {
    scan: bus.publisher("simulation", "/scan", "sensor_msgs/msg/LaserScan", CAPTEUR),
    odom: bus.publisher("simulation", "/odom", "nav_msgs/msg/Odometry", FIABLE),
    imu: bus.publisher("simulation", "/imu/data", "sensor_msgs/msg/Imu", FIABLE),
    joints: bus.publisher(
      "simulation",
      "/joint_states",
      "sensor_msgs/msg/JointState",
      FIABLE
    )
  };
  bus.subscription("simulation", "/cmd_vel", "geometry_msgs/msg/Twist", FIABLE, CB_SIM);

  /* Les identifiants Python sont locaux au pilote : on les traduit
     vers ceux du bus au fur et à mesure des déclarations. */
  const versBus = new Map();
  const nodes = [];
  const timers = [];
  const services = [];
  const logs = [];
  const evenements = (mission.evenements ?? []).map((e) => ({ ...e }));
  let seqAppel = 1;
  let erreur = null;

  const enc = (o) => {
    if (typeof o === "number") {
      if (Number.isNaN(o)) return "__nan__";
      if (o === Infinity) return "__inf__";
      if (o === -Infinity) return "__ninf__";
      return o;
    }
    if (Array.isArray(o)) return o.map(enc);
    if (o && typeof o === "object") {
      const r = {};
      for (const [k, v] of Object.entries(o)) r[k] = enc(v);
      return r;
    }
    return o;
  };
  const dec = (o) => {
    if (typeof o === "string") {
      if (o === "__inf__") return Infinity;
      if (o === "__ninf__") return -Infinity;
      if (o === "__nan__") return NaN;
      return o;
    }
    if (Array.isArray(o)) return o.map(dec);
    if (o && typeof o === "object") {
      const r = {};
      for (const [k, v] of Object.entries(o)) r[k] = dec(v);
      return r;
    }
    return o;
  };

  function absorber(sortie) {
    for (const [niveau, node, texte] of sortie.logs ?? []) {
      logs.push(texte);
      if (process.env.SIM_VERBEUX) console.log(`   [${niveau}] ${node}: ${texte}`);
    }
    const n = sortie.news ?? {};
    for (const nom of n.nodes ?? []) if (!nodes.includes(nom)) nodes.push(nom);
    for (const [pid, node, topic, type, rel, dur, depth] of n.pubs ?? []) {
      versBus.set(pid, bus.publisher(node, topic, type, {
        reliability: rel,
        durability: dur,
        depth
      }));
    }
    for (const [, node, topic, type, rel, dur, depth, cb] of n.subs ?? []) {
      bus.subscription(node, topic, type, { reliability: rel, durability: dur, depth }, cb);
    }
    for (const [node, nom, cb] of n.srvs ?? []) services.push({ node, nom, cb, appels: 0 });
    for (const [node, periode] of n.timers ?? []) timers.push({ node, periode });
    for (const [pid, charge] of sortie.emits ?? []) {
      const bid = versBus.get(pid);
      if (bid !== undefined) bus.publier(bid, dec(JSON.parse(charge)));
    }
    if (sortie.err) {
      try {
        erreur = JSON.parse(sortie.err).erreur;
      } catch {
        erreur = sortie.err;
      }
    }
  }

  function appliquerCmdVel(msg) {
    etat.consigne.v = Number(msg?.linear?.x ?? 0) || 0;
    etat.consigne.w = Number(msg?.angular?.z ?? 0) || 0;
  }

  function recolter() {
    const paquets = [];
    for (const l of bus.recolter()) {
      if (l.cb === CB_SIM) appliquerCmdVel(l.msg);
      else paquets.push([l.cb, l.msgType, enc(l.msg)]);
    }
    return paquets;
  }

  const entete = (frame) => {
    const ns = Math.round(etat.t * 1e9);
    return {
      stamp: { sec: Math.floor(ns / 1e9), nanosec: ns % 1_000_000_000 },
      frame_id: frame
    };
  };

  /* Exécution du script */
  const dep = await py.demander({ c: "exec", src: source });
  absorber(dep);
  let spin = false;
  try {
    const r = JSON.parse(dep.r);
    spin = Boolean(r.spin);
    if (!r.ok) erreur = r.message;
  } catch {
    /* réponse illisible */
  }

  const minuteurs = { scan: 9, odom: 9, imu: 9 };
  const l = robot.lidar;

  while (!erreur && etat.t < mission.duree) {
    minuteurs.scan += PAS;
    minuteurs.odom += PAS;
    minuteurs.imu += PAS;

    if (l && minuteurs.scan >= 1 / l.hz) {
      minuteurs.scan = 0;
      etat.scan = scanner(robot, monde, etat.pose, rng);
      bus.publier(ids.scan, {
        header: entete("laser_frame"),
        angle_min: -Math.PI,
        angle_max: Math.PI,
        angle_increment: (2 * Math.PI) / l.rayons,
        time_increment: 0,
        scan_time: 1 / l.hz,
        range_min: l.porteeMin,
        range_max: l.portee,
        ranges: etat.scan.slice()
      });
    }
    if (minuteurs.odom >= 1 / 30) {
      minuteurs.odom = 0;
      const q = quatZ(etat.poseOdom.theta);
      bus.publier(ids.odom, {
        header: entete("odom"),
        child_frame_id: "base_link",
        pose: {
          pose: {
            position: { x: etat.poseOdom.x, y: etat.poseOdom.y, z: 0 },
            orientation: { x: 0, y: 0, z: q.z, w: q.w }
          }
        },
        twist: {
          twist: {
            linear: { x: etat.v, y: 0, z: 0 },
            angular: { x: 0, y: 0, z: etat.w }
          }
        }
      });
      bus.publier(ids.joints, {
        header: entete("base_link"),
        name: ["roue_gauche", "roue_droite"],
        position: [etat.roues[0], etat.roues[1]],
        velocity: [0, 0],
        effort: []
      });
    }
    if (minuteurs.imu >= 1 / 100) {
      minuteurs.imu = 0;
      const q = quatZ(etat.pose.theta);
      bus.publier(ids.imu, {
        header: entete("imu_link"),
        orientation: { x: 0, y: 0, z: q.z, w: q.w },
        angular_velocity: { x: 0, y: 0, z: etat.w },
        linear_acceleration: { x: 0, y: 0, z: 9.81 }
      });
    }

    const srv = [];
    while (evenements.length && evenements[0].t <= etat.t) {
      const e = evenements.shift();
      const s = services.find((x) => x.nom === e.service);
      if (s) {
        s.appels += 1;
        srv.push([seqAppel++, s.cb, {}]);
      }
    }

    const sortie = await py.demander({
      c: "step",
      t: Number(etat.t.toFixed(4)),
      msgs: recolter(),
      srv
    });
    absorber(sortie);

    for (const li of bus.recolter()) {
      if (li.cb === CB_SIM) appliquerCmdVel(li.msg);
      else bus.remettre(li);
    }

    avancer(etat, robot, monde, rng);
    bus.horloge(etat.t);
    marquerTrace(etat);
  }

  const fin = await py.demander({ c: "fin" });
  py.fermer();

  let params = {};
  try {
    params = JSON.parse(fin.snap).parametres ?? {};
  } catch {
    /* ignoré */
  }

  return {
    duree: etat.t,
    topics: bus.topics(),
    nodes: Array.from(new Set([...nodes, ...bus.noms()]))
      .filter((n) => n !== "simulation")
      .map((n) => {
        const e = bus.endpoints(n);
        return {
          name: n,
          pubs: e.pubs,
          subs: e.subs,
          timers: timers.filter((t) => t.node === n).map((t) => t.periode)
        };
      }),
    callbacks: bus.callbacks(),
    parametres: params,
    services: Object.fromEntries(services.map((s) => [s.nom, s.appels])),
    logs,
    etat,
    spin,
    erreur
  };
}

/* ---------- 5. Programme principal ---------- */

const V = "[32m";
const R = "[31m";
const J = "[33m";
const N = "[0m";

async function principal() {
  compiler();
  deposerPython();

  const mods = {
    bus: require(join(VERIF, "lib/sim/bus.js")),
    physics: require(join(VERIF, "lib/sim/physics.js")),
    robots: require(join(VERIF, "content/sim/robots.js")),
    mondes: require(join(VERIF, "content/sim/mondes.js")),
    missions: require(join(VERIF, "content/sim/missions.js"))
  };

  const filtres = process.argv.slice(2);
  const choisies = mods.missions.MISSIONS.filter(
    (m) => filtres.length === 0 || filtres.includes(m.id)
  );

  let echecs = 0;

  for (const mission of choisies) {
    /* Le code de départ doit s'exécuter sans planter : c'est la
       promesse faite à l'élève quand il appuie sur « Lancer » avant
       d'avoir écrit une ligne. */
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

    const marque = rates.length ? `${R}✗${N}` : `${V}✓${N}`;
    console.log(
      `${marque} ${mission.numero}. ${mission.titre}` +
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
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
