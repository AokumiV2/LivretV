"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Gauge, Pause, Play, RotateCcw, Square, Zap } from "lucide-react";
import { MISSIONS, cleMission } from "@/content/sim/missions";
import { getMonde } from "@/content/sim/mondes";
import { ROBOTS, getRobot } from "@/content/sim/robots";
import { exporterPaquet } from "@/lib/sim/export";
import { Simulateur } from "@/lib/sim/worker/client";
import type {
  DepuisWorker,
  EtatSim,
  LigneLog,
  Mission,
  StatTopic,
  Trace
} from "@/lib/sim/types";
import { useProgress } from "@/lib/store/progress-store";
import { Meter, Tag, cx } from "@/components/ui/primitives";
import { ViewToggle, type Vue } from "@/components/ui/view-toggle";
import { ViewButtons } from "@/components/three/view-buttons";
import type { VueNom } from "@/components/three/scene-canvas";
import { Console } from "./console";
import { CodeCoach } from "./code-coach";
import { Editeur } from "./editeur";
import { MissionPanel } from "./mission-panel";
import { Legende2D, SimView2D } from "./sim-view-2d";
import { SimView3D, type Couches3D } from "./sim-view-3d";

/* ══════════════════════════════════════════════════════════════
   L'Atelier.

   À gauche la mission, au centre le code, à droite le monde et la
   console. Le bouton « Lancer » compile et exécute vraiment du
   Python ; le bouton « Stop » termine le worker, ce qui reprend la
   main même sur une boucle infinie.
   ══════════════════════════════════════════════════════════════ */

type Statut = "repos" | "chargement" | "tourne" | "pause" | "fini" | "erreur";

const CLE = (id: string) => `livretv.atelier.${id}`;
const VITESSES = [1, 2, 4, 8];

export function Atelier({ missionInitiale }: { missionInitiale?: string }) {
  const [missionId, setMissionId] = useState(
    () => missionInitiale ?? MISSIONS[0].id
  );
  const mission: Mission =
    MISSIONS.find((m) => m.id === missionId) ?? MISSIONS[0];

  /* Chaque mission propose un robot, mais rien n'oblige à le garder :
     lancer le même code sur l'AMR est la meilleure façon de comprendre
     ce que l'inertie change. Les objectifs, eux, restent calibrés sur
     le robot d'origine — c'est dit à l'écran. */
  const [robotId, setRobotId] = useState(mission.robot);
  const robot = getRobot(robotId);
  const monde = getMonde(mission.monde);

  const [code, setCode] = useState(mission.depart);
  const [statut, setStatut] = useState<Statut>("repos");
  const [chargement, setChargement] = useState<{ phase: string; pct: number } | null>(
    null
  );
  const [logs, setLogs] = useState<LigneLog[]>([]);
  const [topics, setTopics] = useState<StatTopic[]>([]);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [ligneErreur, setLigneErreur] = useState<number | null>(null);
  const [vue, setVue] = useState<Vue>("2d");
  const [vue3d, setVue3d] = useState<VueNom>("3/4");
  const [couches3d, setCouches3d] = useState<Couches3D>({
    lidar: true,
    trace: true,
    odometrie: true,
    repere: true
  });
  /* La 3D suit le robot par défaut : dans une pièce de huit mètres,
     un robot de trente centimètres vu de loin n'apprend rien. On
     dézoome à la molette si l'on veut le décor entier. */
  const [suivre, setSuivre] = useState(true);
  const [facteur, setFacteur] = useState(1);
  const [etatAffiche, setEtatAffiche] = useState<EtatSim | null>(null);
  const [signalErreur, setSignalErreur] = useState(0);

  const etatRef = useRef<EtatSim | null>(null);
  const simRef = useRef<Simulateur | null>(null);
  const dernierRendu = useRef(0);

  const { progress, hydrate, marquerLecon } = useProgress();
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const termine = progress[cleMission(mission.id)]?.status === "terminee";

  /* ── Chargement et sauvegarde du script ── */

  useEffect(() => {
    const sauve =
      typeof window !== "undefined" ? window.localStorage.getItem(CLE(mission.id)) : null;
    setCode(sauve ?? mission.depart);
    setTrace(null);
    setLogs([]);
    setTopics([]);
    setLigneErreur(null);
    setStatut("repos");
    setRobotId(mission.robot);
    etatRef.current = null;
    setEtatAffiche(null);
    simRef.current?.tuer();
  }, [mission.id, mission.depart, mission.robot]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = window.setTimeout(
      () => window.localStorage.setItem(CLE(mission.id), code),
      400
    );
    return () => window.clearTimeout(t);
  }, [code, mission.id]);

  /* ── Réception des messages du worker ── */

  const recevoir = useCallback(
    (m: DepuisWorker) => {
      if (m.type === "chargement") {
        setChargement({ phase: m.phase, pct: m.pct });
        return;
      }
      if (m.type === "pret") {
        setChargement(null);
        return;
      }
      if (m.type === "logs") {
        setLogs((l) => {
          const suite = [...l, ...m.lignes];
          return suite.length > 2500 ? suite.slice(-2500) : suite;
        });
        return;
      }
      if (m.type === "tick") {
        etatRef.current = m.etat;
        /* Le worker publie 50 fois par seconde ; on ne redessine la
           vue 2D qu'à 25 Hz. L'œil ne voit pas la différence, React
           si. La vue 3D, elle, lit la référence à chaque image. */
        const maintenant =
          typeof performance !== "undefined" ? performance.now() : Date.now();
        if (maintenant - dernierRendu.current > 40) {
          dernierRendu.current = maintenant;
          setEtatAffiche(m.etat);
          setTopics(m.topics);
        }
        return;
      }
      if (m.type === "erreur") {
        setLigneErreur(m.ligne ?? null);
        setStatut("erreur");
        setSignalErreur((n) => n + 1);
        return;
      }
      if (m.type === "fini") {
        setTrace(m.trace);
        setEtatAffiche(m.trace.etat);
        setTopics(m.trace.topics);
        etatRef.current = m.trace.etat;
        setStatut((s) => (s === "erreur" ? s : "fini"));

        const reussis = mission.objectifs.filter((o) => {
          try {
            return o.test(m.trace);
          } catch {
            return false;
          }
        }).length;
        if (reussis === mission.objectifs.length) {
          void marquerLecon(cleMission(mission.id), reussis, mission.objectifs.length);
        }
      }
    },
    [mission, marquerLecon]
  );

  /* L'écouteur change à chaque mission ; le worker, lui, doit
     survivre. On garde donc une référence toujours à jour plutôt que
     de reconstruire le simulateur. */
  const recevoirRef = useRef(recevoir);
  recevoirRef.current = recevoir;

  const sim = useCallback(() => {
    if (!simRef.current) {
      simRef.current = new Simulateur((m) => recevoirRef.current(m));
    }
    return simRef.current;
  }, []);

  useEffect(() => {
    return () => simRef.current?.tuer();
  }, []);

  /* ── Commandes ── */

  const lancer = useCallback(() => {
    const s = sim();
    setLogs([]);
    setTopics([]);
    setTrace(null);
    setLigneErreur(null);
    setStatut("chargement");
    setChargement({ phase: "Préparation", pct: 2 });
    setFacteur(1);
    s.demarrer({
      code,
      robot,
      monde,
      dureeMax: mission.duree,
      evenements: mission.evenements
    });
    setStatut("tourne");
  }, [code, mission.duree, mission.evenements, monde, robot, sim]);

  const stopper = () => {
    simRef.current?.tuer();
    simRef.current = null;
    setChargement(null);
    setStatut("repos");
  };

  const pause = () => {
    const p = statut === "tourne";
    simRef.current?.pause(p);
    setStatut(p ? "pause" : "tourne");
  };

  const changerVitesse = () => {
    const i = (VITESSES.indexOf(facteur) + 1) % VITESSES.length;
    setFacteur(VITESSES[i]);
    simRef.current?.vitesse(VITESSES[i]);
  };

  const enCours = statut === "tourne" || statut === "pause" || statut === "chargement";

  /* Raccourci d'IDE : le même geste relance le fichier tant que la
     simulation est au repos. Stop reste volontairement explicite. */
  useEffect(() => {
    const clavier = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !enCours) {
        e.preventDefault();
        lancer();
      }
    };
    window.addEventListener("keydown", clavier);
    return () => window.removeEventListener("keydown", clavier);
  }, [enCours, lancer]);

  const services = useMemo(
    () => Array.from(new Set((mission.evenements ?? []).map((e) => e.service))),
    [mission.evenements]
  );

  const exporter = async () => {
    const { pkg, fichiers } = exporterPaquet(mission, robot, code);
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const f of fichiers) zip.file(f.path, f.content);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pkg}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* ─── Colonne 1 : missions ─── */}
      <div className="flex min-w-0 flex-col gap-4">
        <SelecteurMission
          missionId={mission.id}
          onChange={setMissionId}
          progress={progress}
        />
        <MissionPanel
          /* La clé force la remise à zéro des indices et du verrou de
             solution quand on change de mission : sans elle, un indice
             ouvert sur la mission 3 resterait ouvert sur la 4. */
          key={mission.id}
          mission={mission}
          trace={trace}
          termine={termine}
          onSolution={() => {
            setCode(mission.solution);
            setLigneErreur(null);
          }}
          className="max-h-[46rem] border border-line bg-panel/70"
        />
      </div>

      {/* ─── Colonne 2 : éditeur ─── */}
      <div className="flex min-w-0 flex-col border border-line bg-panel/70">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
          <span className="font-mono text-[11px] text-muted">mon_noeud.py</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              onClick={enCours ? stopper : lancer}
              title={enCours ? "Arrêter le run" : "Lancer — Ctrl/⌘ + Entrée"}
              className={cx(
                "inline-flex items-center gap-2 border px-3.5 py-1.5 font-display text-[10px] uppercase tracking-hud transition-colors",
                enCours
                  ? "border-bad/50 text-bad hover:bg-bad/10"
                  : "border-accent2/50 text-accent2 hover:bg-accent2/10"
              )}
            >
              {enCours ? <Square size={11} /> : <Play size={11} />}
              {enCours ? "Stop" : "Lancer"}
              {!enCours && (
                <kbd className="hidden border-l border-accent2/25 pl-2 font-mono text-[9px] opacity-70 2xl:inline">
                  ⌘↵
                </kbd>
              )}
            </button>
            <button
              onClick={pause}
              disabled={statut !== "tourne" && statut !== "pause"}
              className="inline-flex items-center gap-2 border border-line2 px-3 py-1.5 font-display text-[10px] uppercase tracking-hud text-muted transition-colors hover:text-ink disabled:opacity-35"
            >
              {statut === "pause" ? <Play size={11} /> : <Pause size={11} />}
              {statut === "pause" ? "Reprendre" : "Pause"}
            </button>
            <button
              onClick={changerVitesse}
              disabled={!enCours}
              className="inline-flex items-center gap-2 border border-line2 px-3 py-1.5 font-mono text-[11px] text-muted transition-colors hover:text-ink disabled:opacity-35"
            >
              <Gauge size={11} />×{facteur}
            </button>
            <button
              onClick={() => {
                setCode(mission.depart);
                setLigneErreur(null);
              }}
              title="Revenir au code de départ"
              className="inline-flex items-center gap-2 border border-line2 px-3 py-1.5 font-display text-[10px] uppercase tracking-hud text-muted transition-colors hover:text-ink"
            >
              <RotateCcw size={11} />
              Réinitialiser
            </button>
            <button
              onClick={exporter}
              title="Télécharger un paquet ament_python prêt à construire"
              className="inline-flex items-center gap-2 border border-line2 px-3 py-1.5 font-display text-[10px] uppercase tracking-hud text-muted transition-colors hover:text-ink"
            >
              <Download size={11} />
              Exporter
            </button>
          </div>
        </div>

        {chargement && (
          <div className="border-b border-line px-3 py-2">
            <div className="flex items-baseline justify-between font-mono text-[11px] text-muted">
              <span>{chargement.phase}</span>
              <span>{chargement.pct}%</span>
            </div>
            <Meter value={chargement.pct} className="mt-1.5" />
            <p className="mt-1.5 text-[11px] leading-relaxed text-line2">
              Premier lancement : environ 13 Mo de CPython sont téléchargés depuis
              le site, puis gardés en cache par le navigateur.
            </p>
          </div>
        )}

        <div className="min-h-[26rem] flex-1 overflow-hidden">
          <Editeur valeur={code} onChange={setCode} ligneErreur={ligneErreur} />
        </div>

        <CodeCoach missionId={mission.id} code={code} />

        <p className="border-t border-line px-3 py-2 text-[11px] leading-relaxed text-line2">
          Ce fichier est du ROS 2 valide. Une seule chose diffère :{" "}
          <code className="font-mono text-muted">rclpy.spin()</code> rend la main
          au simulateur au lieu de bloquer, et les lignes qui la suivent
          s&apos;exécutent à la fin du run.
        </p>
      </div>

      {/* ─── Colonne 3 : monde et console ─── */}
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex min-w-0 flex-col border border-line bg-panel/70">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
            <div className="flex flex-wrap items-center gap-px border border-line bg-line">
              {ROBOTS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => r.simulable && setRobotId(r.id)}
                  disabled={!r.simulable}
                  title={r.simulable ? r.resume : r.raisonIndispo}
                  aria-pressed={robotId === r.id}
                  className={cx(
                    "px-3 py-1.5 font-display text-[10px] uppercase tracking-hud transition-colors",
                    robotId === r.id
                      ? "bg-panel2 text-accent2"
                      : "bg-bg text-muted hover:text-ink",
                    !r.simulable && "cursor-not-allowed opacity-35 hover:text-muted"
                  )}
                >
                  {r.court}
                </button>
              ))}
            </div>
            <span className="font-mono text-[11px] text-line2">{monde.nom}</span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {vue === "3d" && (
                <button
                  onClick={() => setSuivre((s) => !s)}
                  aria-pressed={suivre}
                  className={cx(
                    "border px-3 py-1.5 font-display text-[10px] uppercase tracking-hud transition-colors",
                    suivre
                      ? "border-accent2/50 text-accent2"
                      : "border-line2 text-muted hover:text-ink"
                  )}
                >
                  Suivre
                </button>
              )}
              <ViewToggle vue={vue} onChange={setVue} />
            </div>
          </div>

          <div className="h-[24rem] min-h-0 bg-[#080810]">
            {vue === "2d" ? (
              <SimView2D
                monde={monde}
                robot={robot}
                etat={etatAffiche}
                className="h-full w-full"
              />
            ) : (
              <SimView3D
                key={`${monde.id}-${robot.id}`}
                monde={monde}
                robot={robot}
                etatRef={etatRef}
                suivre={suivre}
                vue={vue3d}
                couches={couches3d}
                className="h-full w-full"
              />
            )}
          </div>

          {vue === "3d" && (
            <div className="border-t border-line bg-bg/35 p-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <ViewButtons vue={vue3d} onChange={setVue3d} />
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Couches de la vue 3D">
                  {(
                    [
                      ["lidar", "LiDAR", "#5ee0ff"],
                      ["trace", "Trajectoire", "#1a2fff"],
                      ["odometrie", "Odométrie", "#e0a83c"],
                      ["repere", "Repère ROS", "#3ddc9a"]
                    ] as const
                  ).map(([id, label, couleur]) => (
                    <button
                      key={id}
                      onClick={() =>
                        setCouches3d((c) => ({ ...c, [id]: !c[id] }))
                      }
                      aria-pressed={couches3d[id]}
                      className={cx(
                        "inline-flex items-center gap-2 border px-2.5 py-1.5 font-mono text-[10.5px] transition-colors",
                        couches3d[id]
                          ? "border-line2 bg-panel2 text-ink"
                          : "border-line text-line2"
                      )}
                    >
                      <span
                        className="h-2 w-2 shrink-0"
                        style={{ backgroundColor: couches3d[id] ? couleur : "#343747" }}
                      />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-2 font-mono text-[10px] leading-relaxed text-line2">
                x rouge = avant · y vert = gauche · z bleu = haut · glisse pour orbiter · molette pour zoomer
              </p>
            </div>
          )}

          {robotId !== mission.robot && (
            <p className="border-t border-warn/30 bg-warn/5 px-4 py-2 text-[11.5px] leading-relaxed text-warn">
              Les objectifs de cette mission sont calibrés sur le{" "}
              {getRobot(mission.robot).nom.toLowerCase()}. Sur le {robot.nom.toLowerCase()},
              le même code ne se comporte pas pareil — c&apos;est tout l&apos;intérêt,
              mais la mission peut rester rouge.
            </p>
          )}

          {vue === "2d" && <Legende2D />}

          <Telemetrie etat={etatAffiche} statut={statut} duree={mission.duree} />

          {services.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-2.5">
              <span className="font-display text-[10px] uppercase tracking-hud text-muted">
                Services
              </span>
              {services.map((nom) => (
                <button
                  key={nom}
                  onClick={() => sim().service(nom)}
                  disabled={!enCours}
                  className="inline-flex items-center gap-2 border border-line2 px-3 py-1 font-mono text-[11px] text-muted transition-colors hover:border-accent2/50 hover:text-accent2 disabled:opacity-35"
                >
                  <Zap size={10} />
                  {nom}
                </button>
              ))}
              <span className="text-[11px] text-line2">
                appelés aussi automatiquement pendant le run
              </span>
            </div>
          )}
        </div>

        <Console
          lignes={logs}
          topics={topics}
          signalErreur={signalErreur}
          className="h-[22rem] border border-line bg-panel/70"
        />
      </div>
    </div>
  );
}

/* ─────────────── Sélecteur de mission ─────────────── */

function SelecteurMission({
  missionId,
  onChange,
  progress
}: {
  missionId: string;
  onChange: (id: string) => void;
  progress: Record<string, { status: string }>;
}) {
  const faites = MISSIONS.filter(
    (m) => progress[cleMission(m.id)]?.status === "terminee"
  ).length;

  return (
    <div className="border border-line bg-panel/70">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <h2 className="font-display text-[10px] uppercase tracking-hud text-muted">
          Missions
        </h2>
        <span className="font-mono text-[11px] text-muted">
          {faites}/{MISSIONS.length}
        </span>
      </div>
      <Meter value={faites} max={MISSIONS.length} tone="good" />
      <ul className="max-h-64 overflow-auto">
        {MISSIONS.map((m) => {
          const ok = progress[cleMission(m.id)]?.status === "terminee";
          const actif = m.id === missionId;
          return (
            <li key={m.id}>
              <button
                onClick={() => onChange(m.id)}
                className={cx(
                  "flex w-full items-center gap-3 border-b border-line px-4 py-2.5 text-left transition-colors",
                  actif ? "bg-panel2" : "hover:bg-panel2/50"
                )}
              >
                <span
                  className={cx(
                    "w-6 shrink-0 font-mono text-[11px]",
                    ok ? "text-good" : actif ? "text-accent2" : "text-line2"
                  )}
                >
                  {String(m.numero).padStart(2, "0")}
                </span>
                <span
                  className={cx(
                    "min-w-0 flex-1 truncate text-[13px]",
                    actif ? "text-ink" : ok ? "text-muted" : "text-muted"
                  )}
                >
                  {m.titre}
                </span>
                {ok && <Tag tone="good">✓</Tag>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─────────────── Télémétrie ─────────────── */

function Telemetrie({
  etat,
  statut,
  duree
}: {
  etat: EtatSim | null;
  statut: Statut;
  duree: number;
}) {
  const cases: [string, string][] = [
    ["temps", etat ? `${etat.t.toFixed(1)} / ${duree} s` : `— / ${duree} s`],
    ["v", etat ? `${etat.v.toFixed(2)} m/s` : "—"],
    ["ω", etat ? `${etat.w.toFixed(2)} rad/s` : "—"],
    ["parcouru", etat ? `${etat.parcouru.toFixed(2)} m` : "—"],
    ["chocs", etat ? String(etat.chocs) : "—"],
    [
      "garde",
      etat && Number.isFinite(etat.distanceMinMur)
        ? `${etat.distanceMinMur.toFixed(2)} m`
        : "—"
    ]
  ];

  const ton =
    statut === "erreur"
      ? "bad"
      : statut === "fini"
        ? "good"
        : statut === "tourne"
          ? "accent"
          : "neutral";

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-4 py-2.5">
      <Tag tone={ton as "neutral" | "accent" | "good" | "bad"}>
        {statut === "repos" && "au repos"}
        {statut === "chargement" && "chargement"}
        {statut === "tourne" && "en cours"}
        {statut === "pause" && "en pause"}
        {statut === "fini" && "terminé"}
        {statut === "erreur" && "erreur"}
      </Tag>
      {cases.map(([k, v]) => (
        <span key={k} className="font-mono text-[11px] text-muted">
          <span className="text-line2">{k}</span> {v}
        </span>
      ))}
    </div>
  );
}
