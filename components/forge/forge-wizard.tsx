"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileCode,
  Save
} from "lucide-react";
import { ARCHETYPES, getArchetype } from "@/content/archetypes";
import { getComponent } from "@/content/components";
import { apercu, genererProjet } from "@/lib/forge/generate";
import { DEFAUT_GEOMETRIE, type ForgeConfig } from "@/lib/forge/types";
import { store } from "@/lib/storage/adapter";
import { useProgress } from "@/lib/store/progress-store";
import { CodeBlock } from "@/components/content/code-block";
import { Btn, HudLabel, Meter, Tag, cx } from "@/components/ui/primitives";
import { RobotPreview } from "./robot-preview";

const ETAPES = [
  "Archétype",
  "Matériel",
  "Géométrie",
  "Logiciel",
  "Revue"
] as const;

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "mon_robot";
}

function configInitiale(archetypeId: string): ForgeConfig {
  const a = getArchetype(archetypeId) ?? ARCHETYPES[0];
  const choix: Record<string, string> = {};
  for (const s of a.stack) choix[s.role] = s.componentIds[0];

  return {
    archetypeId: a.id,
    pkg: `${a.id}_bringup`,
    robotName: a.id,
    distro: "jazzy",
    langue: "python",
    choix,
    geometrie: { ...DEFAUT_GEOMETRIE },
    options: {
      nav2: a.id !== "bras",
      slam: a.id === "rover" || a.id === "amr",
      ekf: a.id !== "table",
      microRos: a.id === "table" || a.id === "rover",
      gazebo: false
    }
  };
}

export function ForgeWizard({ archetypeInitial }: { archetypeInitial?: string }) {
  const { profil, hydrate } = useProgress();
  const [etape, setEtape] = useState(0);
  const [cfg, setCfg] = useState<ForgeConfig>(() =>
    configInitiale(
      archetypeInitial && getArchetype(archetypeInitial)
        ? archetypeInitial
        : "rover"
    )
  );
  const [fichierActif, setFichierActif] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const archetype = getArchetype(cfg.archetypeId) ?? ARCHETYPES[0];
  const fichiers = useMemo(() => genererProjet(cfg), [cfg]);
  const formes = useMemo(() => apercu(cfg), [cfg]);

  const bilan = useMemo(() => {
    const ids = Object.values(cfg.choix);
    const prix = ids.reduce((n, id) => n + (getComponent(id)?.price ?? 0), 0);
    const conso = ids.reduce((n, id) => n + (getComponent(id)?.currentMa.typ ?? 0), 0);
    const peak = ids.reduce((n, id) => n + (getComponent(id)?.currentMa.peak ?? 0), 0);
    const fourni = ids.reduce((n, id) => n + (getComponent(id)?.suppliesMa ?? 0), 0);
    const masse = ids.reduce((n, id) => n + (getComponent(id)?.weightG ?? 0), 0);
    return { prix, conso, peak, fourni, masse };
  }, [cfg.choix]);

  const maj = (patch: Partial<ForgeConfig>) => setCfg((c) => ({ ...c, ...patch }));

  const changerArchetype = (id: string) => {
    setCfg(configInitiale(id));
    setFichierActif(0);
  };

  const telecharger = async () => {
    setOccupe(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const f of fichiers) zip.file(f.path, f.content);

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cfg.pkg}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      await store.saveProject(Boolean(profil), {
        name: cfg.robotName,
        kind: "FORGE",
        data: cfg
      });
      setMessage(`${fichiers.length} fichiers exportés`);
    } catch {
      setMessage("L'export a échoué");
    } finally {
      setOccupe(false);
      window.setTimeout(() => setMessage(null), 3000);
    }
  };

  const enregistrer = async () => {
    await store.saveProject(Boolean(profil), {
      name: cfg.robotName,
      kind: "FORGE",
      data: cfg
    });
    setMessage("Configuration enregistrée");
    window.setTimeout(() => setMessage(null), 2500);
  };

  return (
    <div>
      {/* ─── Étapes ─── */}
      <nav className="mb-10 grid gap-px bg-line sm:grid-cols-5">
        {ETAPES.map((e, i) => (
          <button
            key={e}
            onClick={() => setEtape(i)}
            className={cx(
              "flex items-center gap-3 px-5 py-4 text-left transition-colors",
              i === etape
                ? "bg-panel2 text-ink"
                : i < etape
                  ? "bg-bg text-muted hover:bg-panel"
                  : "bg-bg text-muted/60 hover:bg-panel"
            )}
          >
            <span
              className={cx(
                "flex h-6 w-6 shrink-0 items-center justify-center border font-mono text-[10px]",
                i === etape
                  ? "border-accent2 text-accent2"
                  : i < etape
                    ? "border-good text-good"
                    : "border-line2"
              )}
            >
              {i < etape ? <Check size={11} /> : String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-display text-[10px] uppercase tracking-hud">
              {e}
            </span>
          </button>
        ))}
      </nav>

      <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {/* ─── Étape 1 : archétype ─── */}
          {etape === 0 && (
            <div>
              <HudLabel side="right">Choisis une base de départ</HudLabel>
              <div className="mt-6 grid gap-px bg-line sm:grid-cols-2">
                {ARCHETYPES.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => changerArchetype(a.id)}
                    className={cx(
                      "flex flex-col p-7 text-left transition-colors",
                      a.id === cfg.archetypeId
                        ? "bg-panel2 ring-1 ring-inset ring-accent2"
                        : "bg-bg hover:bg-panel"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Tag
                        tone={
                          a.difficulty === "Débutant"
                            ? "good"
                            : a.difficulty === "Intermédiaire"
                              ? "warn"
                              : "bad"
                        }
                      >
                        {a.difficulty}
                      </Tag>
                      <span className="font-mono text-[10px] text-muted">
                        {a.budget[0]}–{a.budget[1]} €
                      </span>
                    </div>
                    <h3 className="mega mt-5 text-xl text-ink">{a.name}</h3>
                    <p className="mt-2 text-sm text-muted">{a.tagline}</p>
                    <p className="mt-4 flex-1 text-xs leading-relaxed text-ink/65">
                      {a.description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {a.skills.map((s) => (
                        <Tag key={s}>{s}</Tag>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Étape 2 : matériel ─── */}
          {etape === 1 && (
            <div>
              <HudLabel side="right">Composant retenu par rôle</HudLabel>
              <div className="mt-6 space-y-px bg-line">
                {archetype.stack.map((s) => {
                  const options = s.componentIds
                    .map(getComponent)
                    .filter((c): c is NonNullable<typeof c> => Boolean(c));
                  const actuel = getComponent(cfg.choix[s.role]);

                  return (
                    <div key={s.role} className="bg-bg p-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <p className="font-display text-[11px] uppercase tracking-hud text-accent2">
                          {s.role}
                        </p>
                        {actuel && (
                          <span className="font-mono text-[11px] text-muted">
                            {actuel.price} € · {actuel.currentMa.typ} mA
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted">
                        {s.why}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {options.map((o) => (
                          <button
                            key={o.id}
                            onClick={() =>
                              maj({ choix: { ...cfg.choix, [s.role]: o.id } })
                            }
                            className={cx(
                              "border px-4 py-2 text-left text-xs transition-colors",
                              cfg.choix[s.role] === o.id
                                ? "border-accent2 bg-accent2/[0.07] text-ink"
                                : "border-line text-muted hover:border-line2 hover:text-ink"
                            )}
                          >
                            {o.name}
                          </button>
                        ))}
                      </div>

                      {actuel && actuel.gotchas.length > 0 && (
                        <p className="mt-4 border-l-2 border-warn/40 bg-warn/[0.04] px-4 py-2.5 text-[11px] leading-relaxed text-ink/70">
                          {actuel.gotchas[0]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Étape 3 : géométrie ─── */}
          {etape === 2 && (
            <div>
              <HudLabel side="right">Cotes du robot</HudLabel>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Ces valeurs alimentent l&apos;URDF, l&apos;odométrie et le rayon
                de collision de Nav2. Mesure-les sur le robot réel : trois
                centimètres d&apos;erreur sur la position du LiDAR donnent des
                murs dédoublés dans la carte.
              </p>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {(
                  [
                    ["rayonRoue", "Rayon des roues", 0.01, 0.2, 0.0005, "m"],
                    ["entraxe", "Entraxe des roues", 0.08, 0.8, 0.005, "m"],
                    ["longueur", "Longueur du châssis", 0.1, 1.2, 0.01, "m"],
                    ["largeur", "Largeur du châssis", 0.08, 0.9, 0.01, "m"],
                    ["hauteur", "Hauteur du châssis", 0.02, 0.4, 0.005, "m"],
                    ["hauteurLidar", "Hauteur du LiDAR", 0.05, 0.8, 0.005, "m"],
                    ["masse", "Masse totale", 0.3, 40, 0.1, "kg"]
                  ] as const
                ).map(([cle, label, min, max, pas, unite]) => (
                  <label key={cle} className="block">
                    <div className="flex items-baseline justify-between">
                      <span className="hud">{label}</span>
                      <span className="font-mono text-xs text-accent2">
                        {cfg.geometrie[cle]} {unite}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={pas}
                      value={cfg.geometrie[cle]}
                      onChange={(e) =>
                        maj({
                          geometrie: {
                            ...cfg.geometrie,
                            [cle]: Number(e.target.value)
                          }
                        })
                      }
                      className="mt-3 w-full accent-[#1a2fff]"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-8 border border-line bg-panel/40 p-5">
                <p className="hud mb-3">Conséquences</p>
                <ul className="space-y-2 text-xs leading-relaxed text-muted">
                  <li>
                    Rayon de collision Nav2 :{" "}
                    <span className="text-accent2">
                      {(
                        Math.max(cfg.geometrie.longueur, cfg.geometrie.largeur) / 2 +
                        0.02
                      ).toFixed(3)}{" "}
                      m
                    </span>
                  </li>
                  <li>
                    Circonférence de roue :{" "}
                    <span className="text-accent2">
                      {(2 * Math.PI * cfg.geometrie.rayonRoue).toFixed(4)} m par tour
                    </span>
                  </li>
                  <li>
                    Vitesse de rotation à 0,5 m/s différentiel :{" "}
                    <span className="text-accent2">
                      {((2 * 0.5) / cfg.geometrie.entraxe).toFixed(2)} rad/s
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ─── Étape 4 : logiciel ─── */}
          {etape === 3 && (
            <div>
              <HudLabel side="right">Configuration logicielle</HudLabel>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="hud">Nom du robot</span>
                  <input
                    value={cfg.robotName}
                    onChange={(e) => {
                      const n = slugify(e.target.value);
                      maj({ robotName: n, pkg: `${n}_bringup` });
                    }}
                    className="mt-2 w-full border border-line bg-panel/50 px-3 py-2.5 font-mono text-sm text-ink outline-none focus:border-accent2"
                  />
                </label>
                <label className="block">
                  <span className="hud">Nom du paquet</span>
                  <input
                    value={cfg.pkg}
                    onChange={(e) => maj({ pkg: slugify(e.target.value) })}
                    className="mt-2 w-full border border-line bg-panel/50 px-3 py-2.5 font-mono text-sm text-ink outline-none focus:border-accent2"
                  />
                </label>
              </div>

              <div className="mt-8">
                <span className="hud">Distribution</span>
                <div className="mt-3 flex gap-2">
                  {(
                    [
                      ["jazzy", "Jazzy · Ubuntu 24.04"],
                      ["humble", "Humble · Ubuntu 22.04"]
                    ] as const
                  ).map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => maj({ distro: v })}
                      className={cx(
                        "border px-5 py-2.5 text-xs transition-colors",
                        cfg.distro === v
                          ? "border-accent2 bg-accent2/[0.07] text-ink"
                          : "border-line text-muted hover:text-ink"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                {cfg.distro === "humble" && (
                  <p className="mt-3 border-l-2 border-accent2/40 bg-accent2/[0.04] px-4 py-2.5 text-[11px] leading-relaxed text-ink/70">
                    Humble est le bon choix si le robot embarque un Jetson :
                    JetPack 6 est basé sur Ubuntu 22.04.
                  </p>
                )}
              </div>

              <div className="mt-8">
                <span className="hud">Modules à inclure</span>
                <div className="mt-3 space-y-px bg-line">
                  {(
                    [
                      ["slam", "SLAM Toolbox", "Cartographie et localisation simultanées"],
                      ["nav2", "Nav2", "Planification et navigation autonome"],
                      [
                        "ekf",
                        "robot_localization",
                        "Fusion roues + IMU. Publie odom → base_link à la place du node d'odométrie."
                      ],
                      [
                        "microRos",
                        "Agent micro-ROS",
                        "Pont vers le microcontrôleur. Sans lui, son node reste invisible."
                      ],
                      ["gazebo", "Simulation Gazebo", "Plugins et pont ros_gz"]
                    ] as const
                  ).map(([cle, nom, desc]) => (
                    <button
                      key={cle}
                      onClick={() =>
                        maj({
                          options: { ...cfg.options, [cle]: !cfg.options[cle] }
                        })
                      }
                      className="flex w-full items-start gap-4 bg-bg p-5 text-left transition-colors hover:bg-panel"
                    >
                      <span
                        className={cx(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border",
                          cfg.options[cle]
                            ? "border-accent2 bg-accent2/20"
                            : "border-line2"
                        )}
                      >
                        {cfg.options[cle] && (
                          <Check size={10} className="text-accent2" />
                        )}
                      </span>
                      <span>
                        <span className="block text-sm text-ink">{nom}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted">
                          {desc}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Étape 5 : revue ─── */}
          {etape === 4 && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <HudLabel side="right">
                  {fichiers.length} fichiers générés
                </HudLabel>
                <div className="flex gap-3">
                  <Btn size="sm" onClick={enregistrer}>
                    <Save size={12} />
                    Enregistrer
                  </Btn>
                  <Btn
                    size="sm"
                    variant="solid"
                    onClick={telecharger}
                    disabled={occupe}
                  >
                    <Download size={12} />
                    {occupe ? "Compression…" : "Télécharger .zip"}
                  </Btn>
                </div>
              </div>

              <div className="mt-6 grid gap-px bg-line lg:grid-cols-[260px_1fr]">
                <div className="no-scrollbar max-h-[560px] overflow-y-auto bg-bg">
                  {fichiers.map((f, i) => (
                    <button
                      key={f.path}
                      onClick={() => setFichierActif(i)}
                      className={cx(
                        "flex w-full items-center gap-2 px-4 py-2 text-left transition-colors",
                        i === fichierActif
                          ? "bg-panel2 text-accent2"
                          : "text-muted hover:bg-panel hover:text-ink"
                      )}
                    >
                      <FileCode size={11} className="shrink-0" />
                      <span className="min-w-0 truncate font-mono text-[10px]">
                        {f.path.replace(`ros2_ws/src/${cfg.pkg}/`, "")}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="bg-bg">
                  {fichiers[fichierActif] && (
                    <CodeBlock
                      code={
                        fichiers[fichierActif].content ||
                        "// fichier vide — marqueur requis par ament"
                      }
                      lang={
                        fichiers[fichierActif].lang === "cpp"
                          ? "cpp"
                          : (fichiers[fichierActif].lang as
                              | "python"
                              | "xml"
                              | "yaml"
                              | "bash"
                              | "text")
                      }
                      file={fichiers[fichierActif].path}
                      className="border-0"
                    />
                  )}
                </div>
              </div>

              {message && (
                <p className="mt-4 text-sm text-good">{message}</p>
              )}
            </div>
          )}

          {/* ─── Navigation ─── */}
          <div className="mt-12 flex items-center justify-between border-t border-line pt-6">
            <Btn
              size="sm"
              onClick={() => setEtape((e) => Math.max(0, e - 1))}
              disabled={etape === 0}
            >
              <ArrowLeft size={12} />
              Précédent
            </Btn>
            {etape < ETAPES.length - 1 ? (
              <Btn
                size="sm"
                variant="solid"
                onClick={() => setEtape((e) => Math.min(ETAPES.length - 1, e + 1))}
              >
                {ETAPES[etape + 1]}
                <ArrowRight size={12} />
              </Btn>
            ) : (
              <Btn size="sm" variant="solid" onClick={telecharger} disabled={occupe}>
                <Download size={12} />
                Télécharger
              </Btn>
            )}
          </div>
        </div>

        {/* ─── Panneau latéral ─── */}
        <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
          <div>
            <HudLabel side="right">Aperçu</HudLabel>
            <div className="mt-4">
              <RobotPreview shapes={formes} />
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted">
              x rouge avant · y vert gauche · z bleu haut
            </p>
          </div>

          <div>
            <HudLabel side="right">Bilan</HudLabel>
            <div className="mt-4 grid grid-cols-2 gap-px bg-line">
              {[
                ["Budget", `${bilan.prix} €`],
                ["Masse électronique", `${bilan.masse} g`],
                ["Consommation", `${bilan.conso} mA`],
                ["Pics", `${bilan.peak} mA`]
              ].map(([k, v]) => (
                <div key={k} className="bg-bg px-4 py-4">
                  <p className="font-display text-base text-ink">{v}</p>
                  <p className="hud mt-1">{k}</p>
                </div>
              ))}
            </div>

            {bilan.fourni > 0 && (
              <div className="mt-4">
                <div className="mb-2 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-widest text-muted">
                  <span>Budget d&apos;énergie</span>
                  <span>
                    {bilan.conso} / {bilan.fourni} mA
                  </span>
                </div>
                <Meter
                  value={bilan.conso}
                  max={bilan.fourni}
                  tone={
                    bilan.conso > bilan.fourni
                      ? "bad"
                      : bilan.peak > bilan.fourni
                        ? "warn"
                        : "good"
                  }
                />
                {bilan.peak > bilan.fourni && (
                  <p className="mt-3 text-[11px] leading-relaxed text-warn">
                    Les pics cumulés dépassent la capacité des sources. Sépare
                    l&apos;alimentation du calculateur de celle des actionneurs.
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <HudLabel side="right">Nœuds du bringup</HudLabel>
            <div className="mt-4 space-y-px bg-line">
              {archetype.nodes.map((n) => (
                <div key={n.name} className="bg-bg px-4 py-3">
                  <p className="font-mono text-[11px] text-accent2">/{n.name}</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted">
                    {n.pkg}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted">
                    {n.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
