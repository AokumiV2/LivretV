import { Bus } from "../bus";
import {
  PAS,
  avancer,
  etatInitial,
  marquerTrace,
  prng,
  quatZ,
  scanner
} from "../physics";
import { FICHIERS_PY, RACINE_PY } from "../py";
import type {
  DepuisWorker,
  EtatSim,
  LigneLog,
  Monde,
  RobotSim,
  Trace,
  VersWorker
} from "../types";

/* ══════════════════════════════════════════════════════════════
   Le worker : Python d'un côté, physique de l'autre.

   Tout se passe hors du fil principal. C'est ce qui permet de
   terminer brutalement un « while True: » sans que la page bronche,
   et de faire tourner CPython sans hacher les animations.
   ══════════════════════════════════════════════════════════════ */

/* Pyodide est servi par le site lui-même, pas par un CDN : voir
   scripts/copier-pyodide.mjs pour la raison. */
const RUNTIME = "/pyodide/";

type PyodideApi = {
  runPython: (code: string) => unknown;
  registerJsModule: (nom: string, mod: unknown) => void;
  setStdout: (o: { batched: (s: string) => void }) => void;
  setStderr: (o: { batched: (s: string) => void }) => void;
  FS: {
    mkdirTree: (chemin: string) => void;
    writeFile: (chemin: string, contenu: string, o?: { encoding: string }) => void;
  };
  globals: { get: (nom: string) => unknown };
};

/** Le contexte du worker, typé à la main pour ne pas avoir à charger
 *  la bibliothèque `webworker`, qui entre en conflit avec `dom`. */
type Contexte = {
  postMessage: (m: unknown) => void;
  importScripts: (...urls: string[]) => void;
  onmessage: ((ev: MessageEvent<VersWorker>) => void) | null;
  loadPyodide?: (o: { indexURL: string }) => Promise<PyodideApi>;
};

const ctx = globalThis as unknown as Contexte;

/** Les fonctions Python appelées à chaque pas, résolues une fois
 *  pour toutes : recompiler la même ligne cinquante fois par seconde
 *  coûterait plus cher que la simulation elle-même. */
type Api = {
  py: PyodideApi;
  executer: (source: string) => string;
  pas: (t: number) => string;
  finaliser: () => void;
  instantane: () => string;
};

let api: Api | null = null;

/* ---------- État courant ---------- */

type Run = {
  robot: RobotSim;
  monde: Monde;
  etat: EtatSim;
  bus: Bus;
  rng: () => number;
  dureeMax: number;
  facteur: number;
  pause: boolean;
  fini: boolean;
  ids: Record<string, number>;
  minuteurs: Record<string, number>;
  logs: LigneLog[];
  tousLogs: string[];
  seqLog: number;
  nodesDeclares: string[];
  timersDeclares: { node: string; periode: number }[];
  services: { node: string; nom: string; cb: number; appels: number }[];
  attente: [number, number, Record<string, unknown>][];
  seqAppel: number;
  evenements: { t: number; service: string }[];
  erreur: string | null;
  ligneErreur: number | null;
  aSpin: boolean;
};

let run: Run | null = null;
let boucleId: ReturnType<typeof setTimeout> | null = null;

function poster(m: DepuisWorker) {
  ctx.postMessage(m);
}

/** Identifiant réservé au subscriber interne du simulateur. */
const CB_SIM = -1;

/* ---------- Flottants non finis ---------- */

function encoder(o: unknown): unknown {
  if (typeof o === "number") {
    if (Number.isNaN(o)) return "__nan__";
    if (o === Infinity) return "__inf__";
    if (o === -Infinity) return "__ninf__";
    return o;
  }
  if (Array.isArray(o)) return o.map(encoder);
  if (o && typeof o === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) out[k] = encoder(v);
    return out;
  }
  return o;
}

function decoder(o: unknown): unknown {
  if (typeof o === "string") {
    if (o === "__inf__") return Infinity;
    if (o === "__ninf__") return -Infinity;
    if (o === "__nan__") return NaN;
    return o;
  }
  if (Array.isArray(o)) return o.map(decoder);
  if (o && typeof o === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) out[k] = decoder(v);
    return out;
  }
  return o;
}

/* ---------- Journal ---------- */

function journal(niveau: LigneLog["niveau"], node: string, texte: string) {
  if (!run) return;
  for (const ligne of texte.replace(/\s+$/, "").split("\n")) {
    run.logs.push({ id: run.seqLog++, t: run.etat.t, niveau, node, texte: ligne });
    /* Les lignes sont aussi conservées à part : celles envoyées à la
       page sont consommées à l'affichage, alors que la validation des
       objectifs a besoin de l'intégralité du run. */
    if (niveau !== "systeme") run.tousLogs.push(ligne);
  }
  if (run.logs.length > 4000) run.logs.splice(0, run.logs.length - 4000);
  if (run.tousLogs.length > 6000) run.tousLogs.splice(0, 2000);
}

function viderLogs() {
  if (run && run.logs.length) {
    poster({ type: "logs", lignes: run.logs.splice(0, run.logs.length) });
  }
}

/* ---------- Chargement de Python ---------- */

async function charger(): Promise<Api> {
  if (api) return api;

  poster({ type: "chargement", phase: "Téléchargement de CPython", pct: 8 });
  ctx.importScripts(new URL(RUNTIME + "pyodide.js", location.origin).href);

  poster({ type: "chargement", phase: "Démarrage de l'interpréteur", pct: 45 });
  if (!ctx.loadPyodide) throw new Error("Pyodide introuvable après chargement du script.");
  const py = await ctx.loadPyodide({ indexURL: new URL(RUNTIME, location.origin).href });

  poster({ type: "chargement", phase: "Installation de rclpy", pct: 85 });
  py.FS.mkdirTree(RACINE_PY);
  for (const [chemin, contenu] of Object.entries(FICHIERS_PY)) {
    const complet = RACINE_PY + "/" + chemin;
    py.FS.mkdirTree(complet.slice(0, complet.lastIndexOf("/")));
    py.FS.writeFile(complet, contenu, { encoding: "utf8" });
  }

  py.setStdout({ batched: (s) => journal("sortie", "print", s) });
  py.setStderr({ batched: (s) => journal("error", "python", s) });

  py.registerJsModule("_pont", pont());

  py.runPython(
    [
      "import sys",
      `sys.path.insert(0, '${RACINE_PY}')`,
      "import _livretv.core as _c",
      "_lv_exec = _c.executer",
      "_lv_pas = _c.pas",
      "_lv_fin = _c.finaliser",
      "_lv_snap = _c.instantane"
    ].join("\n")
  );

  api = {
    py,
    executer: py.globals.get("_lv_exec") as (s: string) => string,
    pas: py.globals.get("_lv_pas") as (t: number) => string,
    finaliser: py.globals.get("_lv_fin") as () => void,
    instantane: py.globals.get("_lv_snap") as () => string
  };

  poster({ type: "chargement", phase: "Prêt", pct: 100 });
  poster({ type: "pret" });
  return api;
}

/* ---------- Le pont exposé à Python ---------- */

function pont() {
  const qos = (rel: string, dur: string, depth: number) => ({
    reliability: rel as "RELIABLE" | "BEST_EFFORT",
    durability: dur as "VOLATILE" | "TRANSIENT_LOCAL",
    depth
  });

  return {
    now: () => (run ? run.etat.t : 0),

    log: (node: string, niveau: string, texte: string) =>
      journal(niveau as LigneLog["niveau"], node, texte),

    pub_new: (n: string, t: string, ty: string, r: string, d: string, p: number) =>
      run ? run.bus.publisher(n, t, ty, qos(r, d, p)) : 0,

    sub_new: (
      n: string,
      t: string,
      ty: string,
      r: string,
      d: string,
      p: number,
      cb: number
    ) => (run ? run.bus.subscription(n, t, ty, qos(r, d, p), cb) : 0),

    node_new: (nom: string) => {
      if (run && !run.nodesDeclares.includes(nom)) run.nodesDeclares.push(nom);
    },

    srv_new: (node: string, nom: string, _type: string, cb: number) => {
      run?.services.push({ node, nom, cb, appels: 0 });
      journal("systeme", "atelier", `Service ${nom} déclaré par ${node}.`);
      return cb;
    },

    timer: (node: string, periode: number) => {
      run?.timersDeclares.push({ node, periode });
    },

    emit: (pubId: number, charge: string) => {
      if (!run) return;
      run.bus.publier(pubId, decoder(JSON.parse(charge)) as Record<string, unknown>);
    },

    sub_count: (topic: string) =>
      run ? run.bus.topics().find((t) => t.topic === topic)?.subscribers.length ?? 0 : 0,

    harvest: () => {
      if (!run) return "[]";
      const paquets: [number, string, unknown][] = [];
      for (const l of run.bus.recolter()) {
        if (l.cb === CB_SIM) {
          appliquerCmdVel(l.msg);
          continue;
        }
        paquets.push([l.cb, l.msgType, encoder(l.msg)]);
      }
      return paquets.length ? JSON.stringify(paquets) : "[]";
    },

    srv_pending: () => {
      if (!run || run.attente.length === 0) return "[]";
      const a = run.attente.map((x) => [x[0], x[1], encoder(x[2])]);
      run.attente = [];
      return JSON.stringify(a);
    },

    srv_reply: (_appel: number, charge: string) => {
      if (!run) return;
      const r = decoder(JSON.parse(charge)) as Record<string, unknown>;
      journal(
        r.success ? "info" : "warn",
        "service",
        `réponse : success=${r.success}, message="${String(r.message ?? "")}"`
      );
    }
  };
}

/* ---------- Messages produits par la simulation ---------- */

function entete(r: Run, frame: string) {
  const ns = Math.round(r.etat.t * 1e9);
  return {
    stamp: { sec: Math.floor(ns / 1e9), nanosec: ns % 1_000_000_000 },
    frame_id: frame
  };
}

function publierScan(r: Run) {
  const l = r.robot.lidar;
  if (!l || !r.etat.scan) return;
  r.bus.publier(r.ids.scan, {
    header: entete(r, "laser_frame"),
    angle_min: -Math.PI,
    angle_max: Math.PI,
    angle_increment: (2 * Math.PI) / l.rayons,
    time_increment: 0,
    scan_time: 1 / l.hz,
    range_min: l.porteeMin,
    range_max: l.portee,
    ranges: r.etat.scan.slice()
  });
}

function publierOdom(r: Run) {
  const q = quatZ(r.etat.poseOdom.theta);
  r.bus.publier(r.ids.odom, {
    header: entete(r, "odom"),
    child_frame_id: "base_link",
    pose: {
      pose: {
        position: { x: r.etat.poseOdom.x, y: r.etat.poseOdom.y, z: 0 },
        orientation: { x: 0, y: 0, z: q.z, w: q.w }
      }
    },
    twist: {
      twist: {
        linear: { x: r.etat.v, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: r.etat.w }
      }
    }
  });
}

function publierImu(r: Run) {
  const q = quatZ(r.etat.pose.theta);
  r.bus.publier(r.ids.imu, {
    header: entete(r, "imu_link"),
    orientation: { x: 0, y: 0, z: q.z, w: q.w },
    angular_velocity: { x: 0, y: 0, z: r.etat.w },
    linear_acceleration: { x: 0, y: 0, z: 9.81 }
  });
}

function publierJoints(r: Run) {
  const b = r.robot.entraxe;
  const rr = r.robot.rayonRoue;
  r.bus.publier(r.ids.joints, {
    header: entete(r, "base_link"),
    name: ["roue_gauche", "roue_droite"],
    position: [r.etat.roues[0], r.etat.roues[1]],
    velocity: [(r.etat.v - (r.etat.w * b) / 2) / rr, (r.etat.v + (r.etat.w * b) / 2) / rr],
    effort: []
  });
}

function appliquerCmdVel(msg: Record<string, unknown>) {
  if (!run) return;
  const lin = (msg.linear ?? {}) as Record<string, number>;
  const ang = (msg.angular ?? {}) as Record<string, number>;
  run.etat.consigne.v = Number(lin.x ?? 0) || 0;
  run.etat.consigne.w = Number(ang.z ?? 0) || 0;
}

/** Consomme les messages destinés au simulateur lui-même. */
function drainerSim(r: Run) {
  const reste = r.bus.recolter();
  if (!reste.length) return;
  const garde: typeof reste = [];
  for (const l of reste) {
    if (l.cb === CB_SIM) appliquerCmdVel(l.msg);
    else garde.push(l);
  }
  /* Ce qui n'était pas pour nous repart dans la file : Python le
     récupérera au pas suivant. */
  for (const l of garde) r.bus.remettre(l);
}

/* ---------- Boucle ---------- */

/** Déclenche un service au nom de l'utilisateur. */
function appelerService(r: Run, nom: string) {
  const s = r.services.find((x) => x.nom === nom);
  if (!s) {
    journal("warn", "atelier", `Aucun service nommé ${nom} n'est déclaré.`);
    return;
  }
  s.appels += 1;
  r.attente.push([r.seqAppel++, s.cb, {}]);
  journal("systeme", "atelier", `Appel du service ${nom}.`);
}

function pasSimulation(r: Run) {
  const l = r.robot.lidar;

  /* Les appels de service programmés partent à l'heure dite : c'est
     ce qui rend la mission 11 rejouable à l'identique. */
  while (r.evenements.length && r.evenements[0].t <= r.etat.t) {
    appelerService(r, r.evenements.shift()!.service);
  }

  /* Les capteurs publient à leur propre cadence, comme de vrais
     pilotes : le LiDAR à 10 Hz, l'odométrie à 30, l'IMU à 100. */
  r.minuteurs.scan += PAS;
  r.minuteurs.odom += PAS;
  r.minuteurs.imu += PAS;

  if (l && r.minuteurs.scan >= 1 / l.hz) {
    r.minuteurs.scan = 0;
    r.etat.scan = scanner(r.robot, r.monde, r.etat.pose, r.rng);
    publierScan(r);
  }
  if (r.minuteurs.odom >= 1 / 30) {
    r.minuteurs.odom = 0;
    publierOdom(r);
    publierJoints(r);
  }
  if (r.minuteurs.imu >= 1 / 100) {
    r.minuteurs.imu = 0;
    publierImu(r);
  }

  /* Le code de l'élève tourne ici : livraison des messages, puis
     déclenchement des timers échus. */
  const retour = api?.pas(Number(r.etat.t.toFixed(4)));
  if (typeof retour === "string" && retour.length > 0) {
    try {
      const e = JSON.parse(retour) as { erreur: string; ligne: number | null };
      r.erreur = e.erreur;
      r.ligneErreur = e.ligne;
    } catch {
      r.erreur = retour;
    }
  }

  drainerSim(r);
  avancer(r.etat, r.robot, r.monde, r.rng);
  r.bus.horloge(r.etat.t);
  marquerTrace(r.etat);
}

function boucle() {
  const r = run;
  if (!r || r.fini) return;

  if (!r.pause) {
    const n = Math.max(1, Math.round(r.facteur));
    for (let i = 0; i < n; i++) {
      pasSimulation(r);
      if (r.erreur || r.etat.t >= r.dureeMax) break;
    }
  }

  viderLogs();
  poster({ type: "tick", etat: instantane(r), topics: r.bus.topics() });

  if (r.erreur) {
    journal("error", "python", r.erreur);
    viderLogs();
    poster({ type: "erreur", message: r.erreur, ligne: r.ligneErreur ?? undefined });
    terminer(r);
    return;
  }
  if (r.etat.t >= r.dureeMax) {
    journal("systeme", "atelier", `Fin du run après ${r.dureeMax} s simulées.`);
    viderLogs();
    terminer(r);
    return;
  }

  boucleId = setTimeout(boucle, 20);
}

/** Copie sérialisable de l'état, sûre à envoyer au fil principal. */
function instantane(r: Run): EtatSim {
  return {
    ...r.etat,
    pose: { ...r.etat.pose },
    poseOdom: { ...r.etat.poseOdom },
    consigne: { ...r.etat.consigne },
    roues: [r.etat.roues[0], r.etat.roues[1]],
    scan: r.etat.scan ? r.etat.scan.slice() : null,
    trace: r.etat.trace.slice(),
    zonesVisitees: r.etat.zonesVisitees.slice()
  };
}

function terminer(r: Run) {
  if (r.fini) return;
  r.fini = true;
  if (boucleId) clearTimeout(boucleId);
  boucleId = null;

  let infos: { parametres?: Record<string, unknown> } = {};
  try {
    api?.finaliser();
    const brut = api?.instantane();
    if (typeof brut === "string") infos = JSON.parse(brut);
  } catch {
    /* Un script cassé ne doit pas empêcher de rendre la trace. */
  }

  const trace: Trace = {
    duree: r.etat.t,
    topics: r.bus.topics(),
    nodes: Array.from(new Set([...r.nodesDeclares, ...r.bus.noms()]))
      .filter((n) => n !== "simulation")
      .map((n) => {
        const e = r.bus.endpoints(n);
        return {
          name: n,
          pubs: e.pubs,
          subs: e.subs,
          timers: r.timersDeclares.filter((t) => t.node === n).map((t) => t.periode)
        };
      }),
    callbacks: r.bus.callbacks(),
    parametres: infos.parametres ?? {},
    services: Object.fromEntries(r.services.map((s) => [s.nom, s.appels])),
    logs: r.tousLogs.slice(),
    etat: instantane(r),
    spin: r.aSpin,
    erreur: r.erreur
  };

  viderLogs();
  poster({ type: "fini", trace });
}

/* ---------- Démarrage ---------- */

const CAPTEUR = {
  reliability: "BEST_EFFORT" as const,
  durability: "VOLATILE" as const,
  depth: 5
};
const FIABLE = {
  reliability: "RELIABLE" as const,
  durability: "VOLATILE" as const,
  depth: 10
};

async function demarrer(m: Extract<VersWorker, { type: "demarrer" }>) {
  /* Un run précédent peut encore tourner : on le coupe sans rendre
     de trace, sinon deux boucles avanceraient le même monde. */
  if (boucleId) clearTimeout(boucleId);
  boucleId = null;
  if (run) run.fini = true;

  const a = await charger();

  const bus = new Bus();
  run = {
    robot: m.robot,
    monde: m.monde,
    etat: etatInitial(m.robot, m.monde),
    bus,
    rng: prng(m.graine),
    dureeMax: m.dureeMax,
    facteur: 1,
    pause: false,
    fini: false,
    ids: {},
    /* Les minuteurs démarrent au-delà de leur période : le premier
       scan et la première odométrie partent dès le premier pas,
       sans quoi un nœud qui n'écoute que /scan attendrait 100 ms
       pour rien. */
    minuteurs: { scan: 9, odom: 9, imu: 9 },
    logs: [],
    tousLogs: [],
    seqLog: 1,
    nodesDeclares: [],
    timersDeclares: [],
    services: [],
    attente: [],
    seqAppel: 1,
    evenements: (m.evenements ?? []).map((e) => ({ ...e })),
    erreur: null,
    ligneErreur: null,
    aSpin: false
  };

  /* Le simulateur se présente comme un nœud ordinaire : il publie
     ses capteurs et s'abonne à /cmd_vel. Les mêmes règles de QoS
     s'appliquent à lui qu'au code de l'élève — /scan est en
     BEST_EFFORT, comme un vrai pilote de LiDAR. */
  run.ids.scan = bus.publisher("simulation", "/scan", "sensor_msgs/msg/LaserScan", CAPTEUR);
  run.ids.odom = bus.publisher("simulation", "/odom", "nav_msgs/msg/Odometry", FIABLE);
  run.ids.imu = bus.publisher("simulation", "/imu/data", "sensor_msgs/msg/Imu", FIABLE);
  run.ids.joints = bus.publisher(
    "simulation",
    "/joint_states",
    "sensor_msgs/msg/JointState",
    FIABLE
  );
  bus.subscription("simulation", "/cmd_vel", "geometry_msgs/msg/Twist", FIABLE, CB_SIM);

  journal("systeme", "atelier", `${m.robot.nom} — monde « ${m.monde.nom} ».`);

  let ok = true;
  const brut = a.executer(m.code);
  try {
    const res = JSON.parse(brut) as {
      ok: boolean;
      message?: string;
      ligne?: number | null;
      spin?: boolean;
    };
    ok = res.ok;
    run.aSpin = Boolean(res.spin);
    if (!ok) {
      run.erreur = res.message ?? "Erreur inconnue.";
      run.ligneErreur = res.ligne ?? null;
    }
  } catch {
    /* Réponse illisible : on laisse tourner plutôt que de bloquer. */
  }

  if (!ok && run.erreur) {
    journal("error", "python", run.erreur);
    viderLogs();
    poster({ type: "erreur", message: run.erreur, ligne: run.ligneErreur ?? undefined });
    terminer(run);
    return;
  }

  if (!run.aSpin) {
    journal(
      "warn",
      "atelier",
      "Aucun appel à rclpy.spin() : ton nœud existe, mais rien ne le fait tourner. Ses timers et ses callbacks resteront muets."
    );
  }

  boucle();
}

/* ---------- Réception ---------- */

ctx.onmessage = async (ev: MessageEvent<VersWorker>) => {
  const m = ev.data;

  if (m.type === "demarrer") {
    try {
      await demarrer(m);
    } catch (e) {
      poster({ type: "erreur", message: String(e) });
    }
    return;
  }

  if (!run) return;

  if (m.type === "pause") run.pause = m.valeur;
  if (m.type === "vitesse") run.facteur = m.facteur;
  if (m.type === "teleop") {
    run.etat.consigne.v = m.v;
    run.etat.consigne.w = m.w;
  }
  if (m.type === "service") appelerService(run, m.nom);
  if (m.type === "arreter") terminer(run);
};

export {};
