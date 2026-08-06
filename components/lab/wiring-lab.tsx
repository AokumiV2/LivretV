"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Download,
  Info,
  OctagonAlert,
  Plus,
  Save,
  Search,
  Trash2
} from "lucide-react";
import { COMPONENTS, CATEGORY_LABEL, CATEGORY_ORDER } from "@/content/components";
import { bom, bomCsv, budget, valider } from "@/lib/wiring/rules";
import { PRESETS, normaliserPreset } from "@/lib/wiring/presets";
import type { PinRef, WiringDoc } from "@/lib/wiring/types";
import { store } from "@/lib/storage/adapter";
import { useProgress } from "@/lib/store/progress-store";
import { Btn, HudLabel, Meter, Tag, cx } from "@/components/ui/primitives";
import { ViewToggle, type Vue } from "@/components/ui/view-toggle";
import { WiringCanvas } from "./wiring-canvas";
import { Wiring3D } from "./wiring-3d";

const NIVEAU_STYLE = {
  erreur: { icon: OctagonAlert, cls: "border-bad/45 bg-bad/[0.05]", ic: "text-bad" },
  alerte: { icon: AlertTriangle, cls: "border-warn/45 bg-warn/[0.05]", ic: "text-warn" },
  info: { icon: Info, cls: "border-accent2/35 bg-accent2/[0.04]", ic: "text-accent2" }
} as const;

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function WiringLab({ ajoutInitial }: { ajoutInitial?: string }) {
  const { profil, hydrate } = useProgress();
  const [doc, setDoc] = useState<WiringDoc>({ placed: [], links: [] });
  const [q, setQ] = useState("");
  const [nom, setNom] = useState("Mon montage");
  const [message, setMessage] = useState<string | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [vue, setVue] = useState<Vue>("2d");

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Chargement initial : soit le composant passé en paramètre, soit le
  // montage d'exemple, qui montre immédiatement à quoi sert l'outil.
  useEffect(() => {
    if (ajoutInitial && COMPONENTS.some((c) => c.id === ajoutInitial)) {
      setDoc({
        placed: [{ uid: uid(), componentId: ajoutInitial, x: 80, y: 80 }],
        links: []
      });
    } else {
      setDoc(normaliserPreset(PRESETS[2].doc));
      setNom(PRESETS[2].nom);
    }
  }, [ajoutInitial]);

  const diagnostics = useMemo(() => valider(doc), [doc]);
  const bilan = useMemo(() => budget(doc), [doc]);
  const nomenclature = useMemo(() => bom(doc), [doc]);

  const erreurs = diagnostics.filter((d) => d.level === "erreur");
  const alertes = diagnostics.filter((d) => d.level === "alerte");

  const surbrillance = useMemo(() => {
    if (selection) {
      return diagnostics.find((d) => d.id === selection)?.uids ?? [];
    }
    return erreurs.flatMap((d) => d.uids ?? []);
  }, [diagnostics, selection, erreurs]);

  const filtres = useMemo(() => {
    const nq = q.trim().toLowerCase();
    if (nq.length < 2) return COMPONENTS;
    return COMPONENTS.filter((c) =>
      `${c.name} ${c.brand} ${c.tagline}`.toLowerCase().includes(nq)
    );
  }, [q]);

  const ajouter = (componentId: string) => {
    setDoc((d) => ({
      ...d,
      placed: [
        ...d.placed,
        {
          uid: uid(),
          componentId,
          x: 60 + ((d.placed.length * 40) % 400),
          y: 60 + ((d.placed.length * 70) % 380)
        }
      ]
    }));
  };

  const deplacer = (u: string, x: number, y: number) =>
    setDoc((d) => ({
      ...d,
      placed: d.placed.map((p) => (p.uid === u ? { ...p, x, y } : p))
    }));

  const relier = (a: PinRef, b: PinRef) =>
    setDoc((d) => {
      const existe = d.links.some(
        (l) =>
          (l.from.uid === a.uid &&
            l.from.pinId === a.pinId &&
            l.to.uid === b.uid &&
            l.to.pinId === b.pinId) ||
          (l.from.uid === b.uid &&
            l.from.pinId === b.pinId &&
            l.to.uid === a.uid &&
            l.to.pinId === a.pinId)
      );
      if (existe) return d;
      return { ...d, links: [...d.links, { id: uid(), from: a, to: b }] };
    });

  const retirer = (u: string) =>
    setDoc((d) => ({
      placed: d.placed.filter((p) => p.uid !== u),
      links: d.links.filter((l) => l.from.uid !== u && l.to.uid !== u)
    }));

  const retirerFil = (id: string) =>
    setDoc((d) => ({ ...d, links: d.links.filter((l) => l.id !== id) }));

  const enregistrer = async () => {
    await store.saveProject(Boolean(profil), {
      name: nom,
      kind: "WIRING",
      data: doc
    });
    setMessage("Montage enregistré");
    window.setTimeout(() => setMessage(null), 2500);
  };

  const telecharger = (contenu: string, fichier: string, type: string) => {
    const blob = new Blob([contenu], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fichier;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chargerPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setDoc(normaliserPreset(p.doc));
    setNom(p.nom);
    setSelection(null);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[230px_1fr_330px]">
      {/* ─── Palette ─── */}
      <aside className="order-2 min-w-0 xl:order-1">
        <HudLabel side="right">Composants</HudLabel>

        <div className="relative mt-4">
          <Search
            size={13}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Chercher…"
            className="w-full border border-line bg-panel/50 py-2 pl-8 pr-3 text-xs text-ink outline-none placeholder:text-muted/70 focus:border-accent2"
          />
        </div>

        <div className="no-scrollbar mt-4 max-h-[520px] space-y-px overflow-y-auto bg-line">
          {CATEGORY_ORDER.map((cat) => {
            const items = filtres.filter((c) => c.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="bg-bg">
                <p className="hud px-3 py-2">{CATEGORY_LABEL[cat]}</p>
                {items.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => ajouter(c.id)}
                    className="group flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-panel"
                  >
                    <span className="min-w-0 truncate text-[11px] text-muted transition-colors group-hover:text-ink">
                      {c.name}
                    </span>
                    <Plus
                      size={11}
                      className="shrink-0 text-line2 transition-colors group-hover:text-accent2"
                    />
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ─── Canvas ─── */}
      <div className="order-1 min-w-0 xl:order-2">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="min-w-0 flex-1 border border-line bg-panel/50 px-3 py-2 text-sm text-ink outline-none focus:border-accent2"
          />
          <select
            onChange={(e) => chargerPreset(e.target.value)}
            defaultValue="rover"
            className="border border-line bg-panel/50 px-3 py-2 text-xs text-muted outline-none focus:border-accent2"
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
          <ViewToggle vue={vue} onChange={setVue} label2d="Schéma" label3d="Robot" />
          <Btn onClick={enregistrer} size="sm">
            <Save size={12} />
            Enregistrer
          </Btn>
        </div>

        {vue === "2d" ? (
          <WiringCanvas
            doc={doc}
            onMove={deplacer}
            onLink={relier}
            onRemove={retirer}
            onRemoveLink={retirerFil}
            surbrillance={surbrillance}
          />
        ) : (
          <Wiring3D doc={doc} surbrillance={surbrillance} />
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <p>
            {vue === "2d"
              ? "Clique une broche puis une autre pour créer un fil. Clique un fil pour le supprimer. Glisse l'en-tête d'une carte pour la déplacer."
              : "Implantation physique déduite du schéma : la position des cartes sur le canvas devient leur position sur le châssis, la hauteur vient de leur rôle. Glisse pour tourner, molette pour zoomer."}
          </p>
          {message && <span className="text-good">{message}</span>}
        </div>
      </div>

      {/* ─── Diagnostics ─── */}
      <aside className="order-3 min-w-0 space-y-8">
        <div>
          <div className="flex items-center justify-between">
            <HudLabel side="right">Diagnostic</HudLabel>
            <div className="flex gap-2">
              <Tag tone={erreurs.length ? "bad" : "good"}>
                {erreurs.length} erreur{erreurs.length > 1 ? "s" : ""}
              </Tag>
              {alertes.length > 0 && <Tag tone="warn">{alertes.length}</Tag>}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {diagnostics.length === 0 && (
              <p className="border border-good/35 bg-good/[0.05] px-4 py-4 text-xs leading-relaxed text-good">
                Aucun problème détecté sur ce montage.
              </p>
            )}
            {diagnostics.map((d) => {
              const { icon: Icon, cls, ic } = NIVEAU_STYLE[d.level];
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
                      <p className="text-xs leading-snug text-ink">{d.title}</p>
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

        {/* Budget */}
        <div>
          <HudLabel side="right">Budget d&apos;énergie</HudLabel>
          <div className="mt-4 border border-line bg-panel/40 p-4">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-xl text-ink">
                {bilan.consommeTyp} mA
              </span>
              <span className="font-mono text-[11px] text-muted">
                / {bilan.fourni || "—"} mA
              </span>
            </div>
            <Meter
              value={bilan.consommeTyp}
              max={bilan.fourni || bilan.consommeTyp || 1}
              tone={
                bilan.fourni === 0
                  ? "warn"
                  : bilan.consommeTyp > bilan.fourni
                    ? "bad"
                    : bilan.consommeTyp > bilan.fourni * 0.8
                      ? "warn"
                      : "good"
              }
              className="mt-3"
            />
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              Pics cumulés · {bilan.consommePeak} mA
            </p>
          </div>
        </div>

        {/* Nomenclature */}
        <div>
          <div className="flex items-center justify-between">
            <HudLabel side="right">Nomenclature</HudLabel>
            <span className="font-display text-sm text-accent2">
              {nomenclature.total} €
            </span>
          </div>

          <div className="mt-4 divide-y divide-line border border-line">
            {nomenclature.lignes.length === 0 && (
              <p className="px-4 py-4 text-xs text-muted">Aucun composant.</p>
            )}
            {nomenclature.lignes.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[11px] text-ink">
                    {l.nom}
                  </span>
                  <span className="font-mono text-[10.5px] text-muted">
                    ×{l.quantite} · {l.prixUnitaire} €
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[11px] text-muted">
                  {l.total} €
                </span>
              </div>
            ))}
          </div>

          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Masse totale · {nomenclature.masse} g
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Btn
              size="sm"
              onClick={() =>
                telecharger(bomCsv(doc), "bom.csv", "text/csv;charset=utf-8")
              }
            >
              <Download size={12} />
              BOM .csv
            </Btn>
            <Btn
              size="sm"
              onClick={() =>
                telecharger(
                  JSON.stringify(doc, null, 2),
                  "montage.json",
                  "application/json"
                )
              }
            >
              <Download size={12} />
              .json
            </Btn>
            <Btn
              size="sm"
              variant="ghost"
              onClick={() => setDoc({ placed: [], links: [] })}
            >
              <Trash2 size={12} />
              Vider
            </Btn>
          </div>
        </div>
      </aside>
    </div>
  );
}
