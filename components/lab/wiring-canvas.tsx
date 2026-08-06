"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { getComponent, CATEGORY_LABEL } from "@/content/components";
import {
  CARD_W,
  HEAD_H,
  ROW_H,
  cardHeight,
  couleurFil,
  pinAnchor,
  pinOf,
  pinsFor,
  samePin,
  type PinRef,
  type WiringDoc
} from "@/lib/wiring/types";
import { cx } from "@/components/ui/primitives";

type Props = {
  doc: WiringDoc;
  onMove: (uid: string, x: number, y: number) => void;
  onLink: (a: PinRef, b: PinRef) => void;
  onRemove: (uid: string) => void;
  onRemoveLink: (id: string) => void;
  surbrillance: string[];
};

const GRILLE = 10;

export function WiringCanvas({
  doc,
  onMove,
  onLink,
  onRemove,
  onRemoveLink,
  surbrillance
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{
    uid: string;
    dx: number;
    dy: number;
  } | null>(null);
  const [enCours, setEnCours] = useState<PinRef | null>(null);
  const [souris, setSouris] = useState({ x: 0, y: 0 });

  const coord = useCallback((e: { clientX: number; clientY: number }) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return {
      x: e.clientX - r.left + (ref.current?.scrollLeft ?? 0),
      y: e.clientY - r.top + (ref.current?.scrollTop ?? 0)
    };
  }, []);

  useEffect(() => {
    if (!drag) return;

    const onMoveWin = (e: PointerEvent) => {
      const c = coord(e);
      onMove(
        drag.uid,
        Math.max(0, Math.round((c.x - drag.dx) / GRILLE) * GRILLE),
        Math.max(0, Math.round((c.y - drag.dy) / GRILLE) * GRILLE)
      );
    };
    const onUp = () => setDrag(null);

    window.addEventListener("pointermove", onMoveWin);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMoveWin);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, coord, onMove]);

  const cliquerPin = (ref_: PinRef) => {
    if (!enCours) {
      setEnCours(ref_);
      return;
    }
    if (samePin(enCours, ref_)) {
      setEnCours(null);
      return;
    }
    if (enCours.uid === ref_.uid) {
      // On ne relie pas deux broches du même composant.
      setEnCours(ref_);
      return;
    }
    onLink(enCours, ref_);
    setEnCours(null);
  };

  const largeur = Math.max(
    1200,
    ...doc.placed.map((p) => p.x + CARD_W + 120)
  );
  const hauteur = Math.max(
    700,
    ...doc.placed.map((p) => p.y + cardHeight(doc, p) + 120)
  );

  return (
    <div
      ref={ref}
      onPointerMove={(e) => enCours && setSouris(coord(e))}
      onClick={(e) => {
        if (e.target === e.currentTarget) setEnCours(null);
      }}
      className="relative h-[620px] overflow-auto border border-line bg-[#080810]"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(43,45,61,0.55) 1px, transparent 1px)",
        backgroundSize: "20px 20px"
      }}
    >
      <div style={{ width: largeur, height: hauteur, position: "relative" }}>
        {/* ─── Fils ─── */}
        <svg
          className="pointer-events-none absolute inset-0"
          width={largeur}
          height={hauteur}
        >
          {doc.links.map((l) => {
            const pa = doc.placed.find((p) => p.uid === l.from.uid);
            const pb = doc.placed.find((p) => p.uid === l.to.uid);
            if (!pa || !pb) return null;
            const a = pinAnchor(doc, pa, l.from.pinId);
            const b = pinAnchor(doc, pb, l.to.pinId);
            if (!a || !b) return null;

            const kind = pinOf(pa, l.from.pinId)?.kind;
            const c = couleurFil(kind);
            const dx = Math.max(40, Math.abs(b.x - a.x) * 0.4);
            const x1 = a.side === "left" ? a.x - dx : a.x + dx;
            const x2 = b.side === "left" ? b.x - dx : b.x + dx;

            return (
              <g key={l.id} className="pointer-events-auto">
                <path
                  d={`M ${a.x} ${a.y} C ${x1} ${a.y}, ${x2} ${b.y}, ${b.x} ${b.y}`}
                  stroke={c}
                  strokeWidth="1.6"
                  fill="none"
                  opacity="0.75"
                />
                <path
                  d={`M ${a.x} ${a.y} C ${x1} ${a.y}, ${x2} ${b.y}, ${b.x} ${b.y}`}
                  stroke="transparent"
                  strokeWidth="12"
                  fill="none"
                  className="cursor-pointer"
                  onClick={() => onRemoveLink(l.id)}
                >
                  <title>Cliquer pour supprimer ce fil</title>
                </path>
              </g>
            );
          })}

          {/* Fil en cours de tracé */}
          {enCours &&
            (() => {
              const p = doc.placed.find((x) => x.uid === enCours.uid);
              if (!p) return null;
              const a = pinAnchor(doc, p, enCours.pinId);
              if (!a) return null;
              return (
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={souris.x}
                  y2={souris.y}
                  stroke="#5ee0ff"
                  strokeWidth="1.4"
                  strokeDasharray="4 3"
                />
              );
            })()}
        </svg>

        {/* ─── Composants ─── */}
        {doc.placed.map((p) => {
          const c = getComponent(p.componentId);
          if (!c) return null;
          const pins = pinsFor(doc, p);
          const alerte = surbrillance.includes(p.uid);

          return (
            <div
              key={p.uid}
              className={cx(
                "absolute select-none border bg-panel shadow-panel",
                alerte ? "border-bad" : "border-line2"
              )}
              style={{ left: p.x, top: p.y, width: CARD_W }}
            >
              <div
                onPointerDown={(e) => {
                  const co = coord(e);
                  setDrag({ uid: p.uid, dx: co.x - p.x, dy: co.y - p.y });
                }}
                className={cx(
                  "flex cursor-grab items-start justify-between gap-2 border-b px-3 py-2 active:cursor-grabbing",
                  alerte ? "border-bad/50 bg-bad/[0.08]" : "border-line"
                )}
                style={{ height: HEAD_H }}
              >
                <div className="min-w-0">
                  <p className="truncate text-[11px] leading-tight text-ink">
                    {c.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[8px] uppercase tracking-widest text-muted">
                    {CATEGORY_LABEL[c.category]}
                  </p>
                </div>
                <button
                  onClick={() => onRemove(p.uid)}
                  className="shrink-0 text-muted transition-colors hover:text-bad"
                  aria-label="Retirer"
                >
                  <X size={11} />
                </button>
              </div>

              <div className="py-1.5">
                {Array.from({ length: Math.ceil(pins.length / 2) }).map(
                  (_, row) => {
                    const gauche = pins[row * 2];
                    const droite = pins[row * 2 + 1];
                    return (
                      <div
                        key={row}
                        className="flex items-center justify-between"
                        style={{ height: ROW_H }}
                      >
                        {gauche ? (
                          <PinButton
                            pin={gauche}
                            side="left"
                            actif={
                              !!enCours &&
                              samePin(enCours, { uid: p.uid, pinId: gauche.id })
                            }
                            onClick={() =>
                              cliquerPin({ uid: p.uid, pinId: gauche.id })
                            }
                          />
                        ) : (
                          <span />
                        )}
                        {droite ? (
                          <PinButton
                            pin={droite}
                            side="right"
                            actif={
                              !!enCours &&
                              samePin(enCours, { uid: p.uid, pinId: droite.id })
                            }
                            onClick={() =>
                              cliquerPin({ uid: p.uid, pinId: droite.id })
                            }
                          />
                        ) : (
                          <span />
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          );
        })}

        {doc.placed.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="max-w-xs text-center text-sm leading-relaxed text-muted">
              Ajoute un composant depuis le panneau de gauche, puis clique sur
              deux broches pour les relier.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PinButton({
  pin,
  side,
  actif,
  onClick
}: {
  pin: { id: string; label: string; kind: string; volts?: number; tolerant5v?: boolean };
  side: "left" | "right";
  actif: boolean;
  onClick: () => void;
}) {
  const couleur = couleurFil(pin.kind);
  return (
    <button
      onClick={onClick}
      title={`${pin.label}${pin.volts !== undefined ? ` · ${pin.volts} V` : ""}${
        pin.tolerant5v ? " · tolérant 5 V" : ""
      }`}
      className={cx(
        "group flex items-center gap-1.5 px-1 font-mono text-[9px] transition-colors",
        side === "right" && "flex-row-reverse",
        actif ? "text-accent2" : "text-muted hover:text-ink"
      )}
    >
      <span
        className={cx(
          "block h-2 w-2 shrink-0 rounded-full border transition-transform",
          actif && "scale-150"
        )}
        style={{
          borderColor: couleur,
          backgroundColor: actif ? "#5ee0ff" : "transparent",
          marginLeft: side === "left" ? -4 : 0,
          marginRight: side === "right" ? -4 : 0
        }}
      />
      <span className="max-w-[78px] truncate">{pin.label}</span>
    </button>
  );
}
