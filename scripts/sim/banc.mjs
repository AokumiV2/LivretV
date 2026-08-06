/**
 * Banc d'essai du simulateur, hors navigateur.
 *
 * Node tient la boucle, la physique et le bus — exactement le code du
 * worker du site — et un vrai CPython exécute le shim rclpy et le
 * script à tester. Un aller-retour par pas de temps sur les tubes,
 * soit quelques milliers de messages : c'est instantané, et ça teste
 * la vraie chaîne plutôt qu'une imitation.
 *
 * Ce qui n'est pas couvert ici : Pyodide et l'interface. C'est le rôle
 * des tests Playwright.
 *
 * Deux scripts s'en servent : `verifier-missions.mjs` rejoue les douze
 * missions, `verifier-causalite.mjs` prouve que la commande publiée
 * gouverne bien le mouvement.
 */

import { spawn, execFileSync } from "node:child_process";
import { createInterface } from "node:readline";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ICI = dirname(fileURLToPath(import.meta.url));
export const RACINE = resolve(ICI, "..", "..");
export const VERIF = join(RACINE, ".verif");
export const ARBRE = join(VERIF, "pytree");

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

/* ---------- Préparation ---------- */

/** Compile le TypeScript utile et dépose l'arborescence Python. */
export function preparer() {
  rmSync(VERIF, { recursive: true, force: true });
  execFileSync("npx", ["tsc", "-p", "tsconfig.verif.json"], {
    cwd: RACINE,
    stdio: "inherit"
  });

  const { FICHIERS_PY } = require(join(VERIF, "lib/sim/py/index.js"));
  for (const [chemin, contenu] of Object.entries(FICHIERS_PY)) {
    const f = join(ARBRE, chemin);
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, contenu, "utf8");
  }

  return {
    bus: require(join(VERIF, "lib/sim/bus.js")),
    physics: require(join(VERIF, "lib/sim/physics.js")),
    robots: require(join(VERIF, "content/sim/robots.js")),
    mondes: require(join(VERIF, "content/sim/mondes.js")),
    missions: require(join(VERIF, "content/sim/missions.js"))
  };
}

/* ---------- Le processus Python ---------- */

class Python {
  constructor() {
    this.proc = spawn("python3", [join(ICI, "pilote.py")], {
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

/* ---------- Encodage des flottants non finis ---------- */

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

/* ---------- Un run complet ---------- */

/**
 * Exécute `source` et renvoie une trace de la même forme que celle que
 * produit le worker, plus `rotation` — le lacet cumulé, non replié,
 * dont les objectifs n'ont pas besoin mais qui sert à mesurer une
 * commande angulaire.
 */
export async function jouer(mods, config, source) {
  const { Bus } = mods.bus;
  const { PAS, avancer, etatInitial, marquerTrace, prng, quatZ, scanner } = mods.physics;
  const robot = mods.robots.getRobot(config.robot);
  const monde = mods.mondes.getMonde(config.monde);

  const py = new Python();
  const bus = new Bus();
  const etat = etatInitial(robot, monde);
  const rng = prng(config.graine ?? 20240607);

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
  const evenements = (config.evenements ?? []).map((e) => ({ ...e }));
  let seqAppel = 1;
  let erreur = null;
  let rotation = 0;

  function absorber(sortie) {
    for (const [niveau, node, texte] of sortie.logs ?? []) {
      logs.push(texte);
      if (process.env.SIM_VERBEUX) console.log(`   [${niveau}] ${node}: ${texte}`);
    }
    const n = sortie.news ?? {};
    for (const nom of n.nodes ?? []) if (!nodes.includes(nom)) nodes.push(nom);
    for (const [pid, node, topic, type, rel, dur, depth] of n.pubs ?? []) {
      versBus.set(
        pid,
        bus.publisher(node, topic, type, { reliability: rel, durability: dur, depth })
      );
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

  while (!erreur && etat.t < config.duree) {
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

    absorber(
      await py.demander({
        c: "step",
        t: Number(etat.t.toFixed(4)),
        msgs: recolter(),
        srv
      })
    );

    for (const li of bus.recolter()) {
      if (li.cb === CB_SIM) appliquerCmdVel(li.msg);
      else bus.remettre(li);
    }

    avancer(etat, robot, monde, rng);
    rotation += etat.w * PAS;
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
    rotation,
    spin,
    erreur
  };
}

/* ---------- Affichage ---------- */

export const COULEURS = {
  V: "[32m",
  R: "[31m",
  J: "[33m",
  G: "[2m",
  N: "[0m"
};
