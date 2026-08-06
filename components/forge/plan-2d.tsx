"use client";

import { useState } from "react";
import type { ForgeConfig } from "@/lib/forge/types";
import { cx } from "@/components/ui/primitives";

/* ══════════════════════════════════════════════════════════════
   Plan technique coté. C'est le document dont on a besoin devant
   la perceuse : toutes les cotes viennent de la configuration,
   en millimètres, avec les valeurs dérivées qui comptent pour ROS.
   ══════════════════════════════════════════════════════════════ */

const INK = "#e8eaf2";
const MUTED = "#767d92";
const LINE = "#2b2d3d";
const ACCENT = "#5ee0ff";
const BLUE = "#1a2fff";

const mm = (m: number) => Math.round(m * 1000);

/** Ligne de cote avec ses embouts et son étiquette. */
function Cote({
  x1,
  y1,
  x2,
  y2,
  texte,
  decalage = 0,
  vertical = false,
  couleur = MUTED
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  texte: string;
  decalage?: number;
  vertical?: boolean;
  couleur?: string;
}) {
  const dx = vertical ? decalage : 0;
  const dy = vertical ? 0 : decalage;
  const ax = x1 + dx;
  const ay = y1 + dy;
  const bx = x2 + dx;
  const by = y2 + dy;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;

  return (
    <g>
      {/* Lignes d'attache */}
      <line x1={x1} y1={y1} x2={ax} y2={ay} stroke={couleur} strokeWidth="0.6" strokeDasharray="2 2" />
      <line x1={x2} y1={y2} x2={bx} y2={by} stroke={couleur} strokeWidth="0.6" strokeDasharray="2 2" />
      {/* Ligne de cote */}
      <line x1={ax} y1={ay} x2={bx} y2={by} stroke={couleur} strokeWidth="0.8" />
      {/* Embouts */}
      {[
        [ax, ay],
        [bx, by]
      ].map(([px, py], i) => (
        <line
          key={i}
          x1={px - (vertical ? 3 : 0)}
          y1={py - (vertical ? 0 : 3)}
          x2={px + (vertical ? 3 : 0)}
          y2={py + (vertical ? 0 : 3)}
          stroke={couleur}
          strokeWidth="1.2"
        />
      ))}
      <text
        x={vertical ? mx - 6 : mx}
        y={vertical ? my : my - 6}
        textAnchor={vertical ? "end" : "middle"}
        dominantBaseline={vertical ? "middle" : "auto"}
        fill={couleur}
        fontSize="9"
        fontFamily="var(--font-mono), monospace"
      >
        {texte}
      </text>
    </g>
  );
}

/* ─────────────── Vue de dessus ─────────────── */

function VueDessus({ c, s }: { c: ForgeConfig["geometrie"]; s: number }) {
  const L = c.longueur * s;
  const W = c.largeur * s;
  const R = c.rayonRoue * s;
  const E = c.entraxe * s;
  const larg_roue = 0.026 * s;
  const rayonNav = (Math.max(c.longueur, c.largeur) / 2 + 0.02) * s;

  // Repère : origine au centre du châssis, x vers la droite (avant du robot)
  const cx0 = 292;
  const cy0 = 196;

  return (
    <g>
      {/* Cercle de collision Nav2 */}
      <circle
        cx={cx0}
        cy={cy0}
        r={rayonNav}
        fill="none"
        stroke={BLUE}
        strokeWidth="1"
        strokeDasharray="5 4"
        opacity="0.75"
      />
      <text
        x={cx0 + rayonNav * 0.72}
        y={cy0 - rayonNav * 0.72}
        fill={BLUE}
        fontSize="8.5"
        fontFamily="var(--font-mono), monospace"
      >
        robot_radius
      </text>

      {/* Châssis */}
      <rect
        x={cx0 - L / 2}
        y={cy0 - W / 2}
        width={L}
        height={W}
        fill="#0e0e15"
        stroke={INK}
        strokeWidth="1.2"
      />

      {/* Roues, vues de dessus : rectangles de largeur de roue */}
      {[1, -1].map((cote) => (
        <rect
          key={cote}
          x={cx0 - R}
          y={cy0 + (cote * E) / 2 - larg_roue / 2}
          width={R * 2}
          height={larg_roue}
          fill={BLUE}
          opacity="0.5"
          stroke={BLUE}
          strokeWidth="0.8"
        />
      ))}

      {/* Roue folle arrière */}
      <circle
        cx={cx0 - L / 2 + 0.03 * s}
        cy={cy0}
        r={(c.rayonRoue / 2) * s}
        fill="none"
        stroke={MUTED}
        strokeWidth="0.8"
      />

      {/* LiDAR */}
      <circle
        cx={cx0 + L / 2 - 0.06 * s}
        cy={cy0}
        r={0.038 * s}
        fill="none"
        stroke={ACCENT}
        strokeWidth="1.2"
      />
      <text
        x={cx0 + L / 2 - 0.06 * s}
        y={cy0 - 0.038 * s - 6}
        textAnchor="middle"
        fill={ACCENT}
        fontSize="8.5"
        fontFamily="var(--font-mono), monospace"
      >
        laser_frame
      </text>

      {/* Axes ROS : x vers l'avant (droite), y vers la gauche (haut) */}
      <line x1={cx0} y1={cy0} x2={cx0 + 46} y2={cy0} stroke="#ff4d5e" strokeWidth="1.4" />
      <text x={cx0 + 50} y={cy0 + 3} fill="#ff4d5e" fontSize="9" fontFamily="var(--font-mono), monospace">
        x
      </text>
      <line x1={cx0} y1={cy0} x2={cx0} y2={cy0 - 46} stroke="#3ddc9a" strokeWidth="1.4" />
      <text x={cx0 - 4} y={cy0 - 50} textAnchor="middle" fill="#3ddc9a" fontSize="9" fontFamily="var(--font-mono), monospace">
        y
      </text>
      <circle cx={cx0} cy={cy0} r="2.5" fill={INK} />
      <text x={cx0 + 8} y={cy0 + 16} fill={MUTED} fontSize="8.5" fontFamily="var(--font-mono), monospace">
        base_link
      </text>

      {/* Cotes */}
      <Cote
        x1={cx0 - L / 2}
        y1={cy0 + W / 2}
        x2={cx0 + L / 2}
        y2={cy0 + W / 2}
        decalage={54}
        texte={`${mm(c.longueur)} mm`}
      />
      <Cote
        x1={cx0 + L / 2}
        y1={cy0 - W / 2}
        x2={cx0 + L / 2}
        y2={cy0 + W / 2}
        decalage={62}
        vertical
        texte={`${mm(c.largeur)} mm`}
      />
      <Cote
        x1={cx0 - L / 2}
        y1={cy0 - E / 2}
        x2={cx0 - L / 2}
        y2={cy0 + E / 2}
        decalage={-52}
        vertical
        texte={`entraxe ${mm(c.entraxe)} mm`}
        couleur={ACCENT}
      />
      <Cote
        x1={cx0}
        y1={cy0 + W / 2}
        x2={cx0 + L / 2 - 0.06 * s}
        y2={cy0 + W / 2}
        decalage={84}
        texte={`LiDAR +${mm(c.longueur / 2 - 0.06)} mm`}
        couleur={ACCENT}
      />

      <text x={16} y={24} fill={INK} fontSize="11" fontFamily="var(--font-display), sans-serif" letterSpacing="2">
        VUE DE DESSUS
      </text>
      <text x={16} y={38} fill={MUTED} fontSize="8.5" fontFamily="var(--font-mono), monospace">
        plan xy · z vers l&apos;observateur
      </text>
    </g>
  );
}

/* ─────────────── Vue de côté ─────────────── */

function VueCote({ c, s }: { c: ForgeConfig["geometrie"]; s: number }) {
  const L = c.longueur * s;
  const H = c.hauteur * s;
  const R = c.rayonRoue * s;

  const cx0 = 292;
  const sol = 312; // ligne de sol
  const zChassis = sol - (c.rayonRoue + c.hauteur / 2 - 0.01) * s;

  return (
    <g>
      {/* Sol */}
      <line x1={70} y1={sol} x2={520} y2={sol} stroke={LINE} strokeWidth="1.2" />
      {Array.from({ length: 23 }).map((_, i) => (
        <line
          key={i}
          x1={74 + i * 19}
          y1={sol}
          x2={68 + i * 19}
          y2={sol + 7}
          stroke={LINE}
          strokeWidth="0.7"
        />
      ))}

      {/* Châssis */}
      <rect
        x={cx0 - L / 2}
        y={zChassis - H / 2}
        width={L}
        height={H}
        fill="#0e0e15"
        stroke={INK}
        strokeWidth="1.2"
      />

      {/* Roue motrice */}
      <circle cx={cx0} cy={sol - R} r={R} fill="none" stroke={BLUE} strokeWidth="1.4" />
      <circle cx={cx0} cy={sol - R} r={R * 0.25} fill="none" stroke={BLUE} strokeWidth="0.8" />

      {/* Roue folle */}
      <circle
        cx={cx0 - L / 2 + 0.03 * s}
        cy={sol - (c.rayonRoue / 2) * s}
        r={(c.rayonRoue / 2) * s}
        fill="none"
        stroke={MUTED}
        strokeWidth="1"
      />

      {/* Mât et LiDAR */}
      <line
        x1={cx0 + L / 2 - 0.06 * s}
        y1={zChassis - H / 2}
        x2={cx0 + L / 2 - 0.06 * s}
        y2={sol - c.hauteurLidar * s}
        stroke={LINE}
        strokeWidth="1"
      />
      <rect
        x={cx0 + L / 2 - 0.06 * s - 0.038 * s}
        y={sol - c.hauteurLidar * s - (0.041 * s) / 2}
        width={0.076 * s}
        height={0.041 * s}
        fill="none"
        stroke={ACCENT}
        strokeWidth="1.2"
      />

      {/* Cotes */}
      <Cote
        x1={cx0 + L / 2}
        y1={sol}
        x2={cx0 + L / 2}
        y2={sol - c.hauteurLidar * s}
        decalage={76}
        vertical
        texte={`LiDAR ${mm(c.hauteurLidar)} mm`}
        couleur={ACCENT}
      />
      <Cote
        x1={cx0 - L / 2}
        y1={sol}
        x2={cx0 - L / 2}
        y2={sol - 2 * R}
        decalage={-48}
        vertical
        texte={`Ø ${mm(c.rayonRoue * 2)} mm`}
        couleur={BLUE}
      />
      <Cote
        x1={cx0 - L / 2}
        y1={zChassis - H / 2}
        x2={cx0 - L / 2}
        y2={zChassis + H / 2}
        decalage={-108}
        vertical
        texte={`${mm(c.hauteur)} mm`}
      />

      {/* base_footprint */}
      <circle cx={cx0} cy={sol} r="2.5" fill={INK} />
      <text x={cx0 + 8} y={sol - 6} fill={MUTED} fontSize="8.5" fontFamily="var(--font-mono), monospace">
        base_footprint
      </text>

      <text x={16} y={24} fill={INK} fontSize="11" fontFamily="var(--font-display), sans-serif" letterSpacing="2">
        VUE DE CÔTÉ
      </text>
      <text x={16} y={38} fill={MUTED} fontSize="8.5" fontFamily="var(--font-mono), monospace">
        plan xz · avant à droite
      </text>
    </g>
  );
}

/* ─────────────── Composant ─────────────── */

export function Plan2D({ cfg }: { cfg: ForgeConfig }) {
  const [vue, setVue] = useState<"dessus" | "cote">("dessus");
  const g = cfg.geometrie;

  // Échelle : le robot le plus long occupe ~300 px de large sur le plan.
  // Le robot occupe 260 px de large ; le reste du cadre est réservé
  // aux lignes de cote, qui débordaient sinon.
  const s = 260 / Math.max(g.longueur, g.largeur, g.entraxe + 0.05);

  const derives = [
    ["Circonférence de roue", `${(2 * Math.PI * g.rayonRoue * 1000).toFixed(0)} mm/tour`],
    [
      "Rayon de collision",
      `${((Math.max(g.longueur, g.largeur) / 2 + 0.02) * 1000).toFixed(0)} mm`
    ],
    ["Garde au sol", `${((g.rayonRoue - g.hauteur / 2 + 0.01) * 1000).toFixed(0)} mm`],
    ["Empattement roue folle", `${((g.longueur / 2 - 0.03) * 1000).toFixed(0)} mm`]
  ];

  return (
    <div>
      <div className="flex gap-px border border-line bg-line">
        {(
          [
            ["dessus", "Dessus"],
            ["cote", "Côté"]
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setVue(v)}
            className={cx(
              "flex-1 px-4 py-2 font-display text-[10px] uppercase tracking-hud transition-colors",
              vue === v ? "bg-panel2 text-accent2" : "bg-bg text-muted hover:text-ink"
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="border border-t-0 border-line bg-[#080810]">
        <svg viewBox="0 0 560 400" className="h-auto w-full" role="img">
          {vue === "dessus" ? <VueDessus c={g} s={s} /> : <VueCote c={g} s={s} />}
        </svg>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-px bg-line">
        {derives.map(([k, v]) => (
          <div key={k} className="bg-bg px-3 py-2.5">
            <dd className="font-mono text-[11px] text-accent2">{v}</dd>
            <dt className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
              {k}
            </dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
