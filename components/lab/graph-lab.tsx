"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Info,
  OctagonAlert,
  Pause,
  Play,
  Plus,
  Save,
  Trash2,
  X
} from "lucide-react";
import { MSG_TYPES, sampleEcho, shortName } from "@/content/msgs";
import { debitTotal, edges, valider } from "@/lib/graph/validate";
import { GRAPH_PRESETS } from "@/lib/graph/presets";
import {
  EP_H,
  NODE_HEAD,
  NODE_W,
  QOS_CAPTEUR,
  QOS_DEFAUT,
  QOS_LATCH,
  epAnchor,
  nodeHeight,
  type Endpoint,
  type GNode,
  type GraphDoc,
  type Qos
} from "@/lib/graph/types";
import { store } from "@/lib/storage/adapter";
import { useProgress } from "@/lib/store/progress-store";
import { Btn, HudLabel, Tag, cx } from "@/components/ui/primitives";

const NIVEAU = {
  erreur: { icon: OctagonAlert, cls: "border-bad/45 bg-bad/[0.05]", ic: "text-bad" },
  alerte: { icon: AlertTriangle, cls: "border-warn/45 bg-warn/[0.05]", ic: "text-warn" },
  info: { icon: Info, cls: "border-accent2/35 bg-accent2/[0.04]", ic: "text-accent2" }
} as const;

const PROFILS: { id: string; nom: string; qos: Qos }[] = [
  { id: "defaut", nom: "Défaut (RELIABLE)", qos: QOS_DEFAUT },
  { id: "capteur", nom: "Capteur (BEST_EFFORT)", qos: QOS_CAPTEUR },
  { id: "latch", nom: "Latché (TRANSIENT_LOCAL)", qos: QOS_LATCH }
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function nomProfil(q: Qos) {
  if (q.reliability === "BEST_EFFORT") return "BEST_EFFORT";
  if (q.durability === "TRANSIENT_LOCAL") return "LATCH";
  return "RELIABLE";
}

export function GraphLab() {
  const { profil, hydrate } = useProgress();
  const [doc, setDoc] = useState<GraphDoc>(GRAPH_PRESETS[0].doc);
  const [nom, setNom] = useState(GRAPH_PRESETS[0].nom);
  const [lecture, setLecture] = useState(false);
  const [tick, setTick] = useState(0);
  const [topicEcoute, setTopicEcoute] = useState<string | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(
    null
  );
  const [edition, setEdition] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!lecture) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 200);
    return () => window.clearInterval(id);
  }, [lecture]);

  const coord = useCallback((e: { clientX: number; clientY: number }) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return {
      x: e.clientX - r.left + (canvasRef.current?.scrollLeft ?? 0),
      y: e.clientY - r.top + (canvasRef.current?.scrollTop ?? 0)
    };
  }, []);

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const c = coord(e);
      setDoc((d) => ({
        nodes: d.nodes.map((n) =>
          n.id === drag.id
            ? {
                ...n,
                x: Math.max(0, Math.round((c.x - drag.dx) / 10) * 10),
                y: Math.max(0, Math.round((c.y - drag.dy) / 10) * 10)
              }
            : n
        )
      }));
    };
    const up = () => setDrag(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [drag, coord]);

  const liens = useMemo(() => edges(doc), [doc]);
  const diagnostics = useMemo(() => valider(doc), [doc]);
  const debit = useMemo(() => debitTotal(doc), [doc]);
  const erreurs = diagnostics.filter((d) => d.level === "erreur");

  const surbrillance = useMemo(() => {
    if (!selection) return [];
    return diagnostics.find((d) => d.id === selection)?.nodeIds ?? [];
  }, [diagnostics, selection]);

  const topicsDispo = useMemo(() => {
    const s = new Set<string>();
    for (const l of liens) if (l.connecte) s.add(l.topic);
    return [...s].sort();
  }, [liens]);

  const echo = useMemo(() => {
    if (!topicEcoute) return [];
    const lien = liens.find((l) => l.topic === topicEcoute && l.connecte);
    if (!lien) return [];
    return sampleEcho(lien.msgType, tick);
  }, [topicEcoute, liens, tick]);

  /* ─────── Mutations ─────── */

  const ajouterNode = () => {
    const n: GNode = {
      id: uid(),
      name: `node_${doc.nodes.length + 1}`,
      pkg: "mon_robot",
      x: 60 + ((doc.nodes.length * 60) % 500),
      y: 60 + ((doc.nodes.length * 90) % 400),
      pubs: [],
      subs: []
    };
    setDoc((d) => ({ nodes: [...d.nodes, n] }));
    setEdition(n.id);
  };

  const majNode = (id: string, patch: Partial<GNode>) =>
    setDoc((d) => ({
      nodes: d.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n))
    }));

  const supprimerNode = (id: string) => {
    setDoc((d) => ({ nodes: d.nodes.filter((n) => n.id !== id) }));
    if (edition === id) setEdition(null);
  };

  const ajouterEp = (nodeId: string, sens: "pubs" | "subs") => {
    const ep: Endpoint = {
      id: uid(),
      topic: "/nouveau_topic",
      msgType: "std_msgs/msg/String",
      qos: QOS_DEFAUT,
      ...(sens === "pubs" ? { hz: 10 } : {})
    };
    setDoc((d) => ({
      nodes: d.nodes.map((n) =>
        n.id === nodeId ? { ...n, [sens]: [...n[sens], ep] } : n
      )
    }));
  };

  const majEp = (
    nodeId: string,
    sens: "pubs" | "subs",
    epId: string,
    patch: Partial<Endpoint>
  ) =>
    setDoc((d) => ({
      nodes: d.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              [sens]: n[sens].map((e) => (e.id === epId ? { ...e, ...patch } : e))
            }
          : n
      )
    }));

  const supprimerEp = (nodeId: string, sens: "pubs" | "subs", epId: string) =>
    setDoc((d) => ({
      nodes: d.nodes.map((n) =>
        n.id === nodeId ? { ...n, [sens]: n[sens].filter((e) => e.id !== epId) } : n
      )
    }));

  const enregistrer = async () => {
    await store.saveProject(Boolean(profil), {
      name: nom,
      kind: "GRAPH",
      data: doc
    });
    setMessage("Graphe enregistré");
    window.setTimeout(() => setMessage(null), 2500);
  };

  const largeur = Math.max(1200, ...doc.nodes.map((n) => n.x + NODE_W + 140));
  const hauteur = Math.max(660, ...doc.nodes.map((n) => n.y + nodeHeight(n) + 100));
  const nodeEdite = doc.nodes.find((n) => n.id === edition);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        {/* Barre d'outils */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="min-w-0 flex-1 border border-line bg-panel/50 px-3 py-2 text-sm text-ink outline-none focus:border-accent2"
          />
          <select
            defaultValue="qos"
            onChange={(e) => {
              const p = GRAPH_PRESETS.find((x) => x.id === e.target.value);
              if (p) {
                setDoc(p.doc);
                setNom(p.nom);
                setSelection(null);
                setEdition(null);
              }
            }}
            className="border border-line bg-panel/50 px-3 py-2 text-xs text-muted outline-none focus:border-accent2"
          >
            {GRAPH_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
          <Btn size="sm" onClick={ajouterNode}>
            <Plus size={12} />
            Node
          </Btn>
          <Btn
            size="sm"
            variant={lecture ? "solid" : "outline"}
            onClick={() => setLecture((v) => !v)}
          >
            {lecture ? <Pause size={12} /> : <Play size={12} />}
            {lecture ? "Pause" : "Lecture"}
          </Btn>
          <Btn size="sm" onClick={enregistrer}>
            <Save size={12} />
            Enregistrer
          </Btn>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="relative h-[620px] overflow-auto border border-line bg-[#080810]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(43,45,61,0.5) 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }}
        >
          <div style={{ width: largeur, height: hauteur, position: "relative" }}>
            <svg className="absolute inset-0" width={largeur} height={hauteur}>
              {liens.map((l) => {
                const src = doc.nodes.find((n) => n.id === l.fromNode);
                const dst = doc.nodes.find((n) => n.id === l.toNode);
                if (!src || !dst) return null;
                const a = epAnchor(src, l.fromEp);
                const b = epAnchor(dst, l.toEp);
                if (!a || !b) return null;

                const dx = Math.max(50, Math.abs(b.x - a.x) * 0.45);
                const d = `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
                const couleur = l.connecte ? "#5ee0ff" : "#ff4d5e";

                return (
                  <g key={l.id}>
                    <path
                      d={d}
                      stroke={couleur}
                      strokeWidth="1.5"
                      fill="none"
                      opacity={l.connecte ? 0.55 : 0.85}
                      strokeDasharray={l.connecte ? undefined : "5 4"}
                    />
                    {l.connecte && lecture && (
                      <circle r="3" fill="#5ee0ff">
                        <animateMotion
                          dur={`${Math.max(0.5, 6 / l.hz)}s`}
                          repeatCount="indefinite"
                          path={d}
                        />
                      </circle>
                    )}
                    <text
                      x={(a.x + b.x) / 2}
                      y={(a.y + b.y) / 2 - 6}
                      textAnchor="middle"
                      fill={l.connecte ? "#767d92" : "#ff4d5e"}
                      fontSize="9"
                      fontFamily="var(--font-mono), monospace"
                    >
                      {l.topic}
                    </text>
                  </g>
                );
              })}
            </svg>

            {doc.nodes.map((n) => {
              const alerte = surbrillance.includes(n.id);
              return (
                <div
                  key={n.id}
                  className={cx(
                    "absolute border bg-panel shadow-panel",
                    alerte ? "border-bad" : "border-line2",
                    edition === n.id && "ring-1 ring-accent2"
                  )}
                  style={{ left: n.x, top: n.y, width: NODE_W }}
                >
                  <div
                    onPointerDown={(e) => {
                      const c = coord(e);
                      setDrag({ id: n.id, dx: c.x - n.x, dy: c.y - n.y });
                    }}
                    onDoubleClick={() => setEdition(n.id)}
                    className={cx(
                      "flex cursor-grab items-start justify-between gap-2 border-b px-3 py-2 active:cursor-grabbing",
                      alerte ? "border-bad/50 bg-bad/[0.08]" : "border-line"
                    )}
                    style={{ height: NODE_HEAD }}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[11px] text-accent2">
                        /{n.name}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[8px] uppercase tracking-widest text-muted">
                        {n.pkg}
                      </p>
                    </div>
                    <button
                      onClick={() => setEdition(edition === n.id ? null : n.id)}
                      className="shrink-0 font-mono text-[9px] text-muted transition-colors hover:text-accent2"
                    >
                      ⚙
                    </button>
                  </div>

                  <div className="py-1">
                    {n.subs.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center gap-1.5 px-1"
                        style={{ height: EP_H }}
                      >
                        <span className="-ml-1 h-1.5 w-1.5 shrink-0 rounded-full bg-good" />
                        <span className="min-w-0 truncate font-mono text-[9px] text-muted">
                          {e.topic}
                        </span>
                        <span className="ml-auto shrink-0 font-mono text-[8px] text-line2">
                          {nomProfil(e.qos)}
                        </span>
                      </div>
                    ))}
                    {n.pubs.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center gap-1.5 px-1"
                        style={{ height: EP_H }}
                      >
                        <span className="ml-auto shrink-0 font-mono text-[8px] text-line2">
                          {nomProfil(e.qos)}
                        </span>
                        <span className="min-w-0 truncate font-mono text-[9px] text-muted">
                          {e.topic}
                        </span>
                        <span className="-mr-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent2" />
                      </div>
                    ))}
                    {n.pubs.length + n.subs.length === 0 && (
                      <p
                        className="px-2 font-mono text-[9px] text-line2"
                        style={{ lineHeight: `${EP_H}px` }}
                      >
                        aucun point d&apos;entrée
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {doc.nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="max-w-xs text-center text-sm text-muted">
                  Ajoute un node, puis déclare ses publications et ses
                  abonnements.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Éditeur de node */}
        {nodeEdite && (
          <div className="mt-4 border border-line bg-panel/40 p-5">
            <div className="flex items-center justify-between">
              <HudLabel side="right">Éditer le node</HudLabel>
              <button
                onClick={() => setEdition(null)}
                className="text-muted transition-colors hover:text-ink"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className="block">
                <span className="hud">Nom du node</span>
                <input
                  value={nodeEdite.name}
                  onChange={(e) =>
                    majNode(nodeEdite.id, {
                      name: e.target.value.replace(/[^\w]/g, "_")
                    })
                  }
                  className="mt-1.5 w-full border border-line bg-bg px-3 py-2 font-mono text-xs text-ink outline-none focus:border-accent2"
                />
              </label>
              <label className="block">
                <span className="hud">Paquet</span>
                <input
                  value={nodeEdite.pkg}
                  onChange={(e) => majNode(nodeEdite.id, { pkg: e.target.value })}
                  className="mt-1.5 w-full border border-line bg-bg px-3 py-2 font-mono text-xs text-ink outline-none focus:border-accent2"
                />
              </label>
              <button
                onClick={() => supprimerNode(nodeEdite.id)}
                className="mt-6 flex items-center gap-2 border border-line px-4 py-2 font-display text-[10px] uppercase tracking-hud text-muted transition-colors hover:border-bad hover:text-bad"
              >
                <Trash2 size={12} />
                Supprimer
              </button>
            </div>

            {(["subs", "pubs"] as const).map((sens) => (
              <div key={sens} className="mt-6">
                <div className="flex items-center justify-between">
                  <span className="hud">
                    {sens === "subs" ? "Abonnements" : "Publications"}
                  </span>
                  <button
                    onClick={() => ajouterEp(nodeEdite.id, sens)}
                    className="flex items-center gap-1.5 font-mono text-[10px] text-muted transition-colors hover:text-accent2"
                  >
                    <Plus size={11} />
                    Ajouter
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {nodeEdite[sens].map((e) => (
                    <div
                      key={e.id}
                      className="grid gap-2 border border-line bg-bg p-3 sm:grid-cols-[1.1fr_1.4fr_1fr_auto]"
                    >
                      <input
                        value={e.topic}
                        onChange={(ev) =>
                          majEp(nodeEdite.id, sens, e.id, { topic: ev.target.value })
                        }
                        placeholder="/topic"
                        className="border border-line bg-panel/50 px-2 py-1.5 font-mono text-[11px] text-ink outline-none focus:border-accent2"
                      />
                      <select
                        value={e.msgType}
                        onChange={(ev) =>
                          majEp(nodeEdite.id, sens, e.id, {
                            msgType: ev.target.value
                          })
                        }
                        className="border border-line bg-panel/50 px-2 py-1.5 font-mono text-[11px] text-muted outline-none focus:border-accent2"
                      >
                        {MSG_TYPES.map((m) => (
                          <option key={m.name} value={m.name}>
                            {shortName(m.name)}
                          </option>
                        ))}
                      </select>
                      <select
                        value={
                          PROFILS.find((p) => nomProfil(p.qos) === nomProfil(e.qos))
                            ?.id ?? "defaut"
                        }
                        onChange={(ev) => {
                          const p = PROFILS.find((x) => x.id === ev.target.value);
                          if (p) majEp(nodeEdite.id, sens, e.id, { qos: p.qos });
                        }}
                        className="border border-line bg-panel/50 px-2 py-1.5 font-mono text-[11px] text-muted outline-none focus:border-accent2"
                      >
                        {PROFILS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nom}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => supprimerEp(nodeEdite.id, sens, e.id)}
                        className="px-2 text-muted transition-colors hover:text-bad"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  {nodeEdite[sens].length === 0 && (
                    <p className="text-xs text-muted">Aucun.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Panneau latéral ─── */}
      <aside className="min-w-0 space-y-8">
        <div className="grid grid-cols-3 gap-px bg-line">
          {[
            ["Nodes", doc.nodes.length],
            ["Liaisons", liens.filter((l) => l.connecte).length],
            ["Débit", `${debit} Ko/s`]
          ].map(([k, v]) => (
            <div key={String(k)} className="bg-bg px-3 py-4">
              <p className="font-display text-base text-ink">{v}</p>
              <p className="hud mt-1">{k}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <HudLabel side="right">Diagnostic</HudLabel>
            <Tag tone={erreurs.length ? "bad" : "good"}>
              {erreurs.length} erreur{erreurs.length > 1 ? "s" : ""}
            </Tag>
          </div>

          <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto">
            {diagnostics.length === 0 && (
              <p className="border border-good/35 bg-good/[0.05] px-4 py-4 text-xs text-good">
                Le graphe est cohérent.
              </p>
            )}
            {diagnostics.map((d) => {
              const { icon: Icon, cls, ic } = NIVEAU[d.level];
              const ouvert = selection === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelection(ouvert ? null : d.id)}
                  className={cx(
                    "block w-full border-l-2 px-4 py-3 text-left transition-colors",
                    cls,
                    ouvert && "bg-panel2"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <Icon size={13} className={cx("mt-0.5 shrink-0", ic)} />
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] leading-snug text-ink">
                        {d.title}
                      </p>
                      <p
                        className={cx(
                          "mt-1.5 text-[11px] leading-relaxed text-muted",
                          !ouvert && "line-clamp-2"
                        )}
                      >
                        {d.detail}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Terminal echo */}
        <div>
          <HudLabel side="right">ros2 topic echo</HudLabel>
          <select
            value={topicEcoute ?? ""}
            onChange={(e) => setTopicEcoute(e.target.value || null)}
            className="mt-3 w-full border border-line bg-panel/50 px-3 py-2 font-mono text-xs text-muted outline-none focus:border-accent2"
          >
            <option value="">Choisir un topic…</option>
            {topicsDispo.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <div className="mt-3 h-[220px] overflow-y-auto border border-line bg-[#07070d] p-3 font-mono text-[11px] leading-relaxed">
            {!topicEcoute && (
              <p className="text-muted">
                Sélectionne un topic connecté, puis lance la lecture.
              </p>
            )}
            {topicEcoute && !lecture && (
              <p className="text-muted">
                <span className="text-good">$</span> ros2 topic echo {topicEcoute}
                <br />
                <span className="text-warn">
                  Lecture en pause — appuie sur Lecture.
                </span>
              </p>
            )}
            {topicEcoute && lecture && (
              <>
                <p className="text-muted">
                  <span className="text-good">$</span> ros2 topic echo{" "}
                  {topicEcoute}
                </p>
                {echo.map((l, i) => (
                  <p
                    key={i}
                    className={cx(
                      l === "---" ? "text-line2" : "text-ink/80",
                      "whitespace-pre"
                    )}
                  >
                    {l}
                  </p>
                ))}
              </>
            )}
          </div>
        </div>

        {message && <p className="text-xs text-good">{message}</p>}
      </aside>
    </div>
  );
}
