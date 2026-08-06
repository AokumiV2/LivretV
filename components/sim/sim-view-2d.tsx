"use client";

import { useMemo } from "react";
import type { EtatSim, Monde, RobotSim } from "@/lib/sim/types";

/* ══════════════════════════════════════════════════════════════
   Vue de dessus.

   C'est la vue de travail : elle montre d'un coup d'œil ce que la
   3D rend joli mais confus — la pose vraie, la pose que croit
   l'odométrie, l'éventail du LiDAR, la trajectoire, les zones.

   L'écart entre le robot plein et le robot fantôme est le sujet
   entier de la mission 10. Il fallait qu'il soit visible sans
   effort.
   ══════════════════════════════════════════════════════════════ */

const MARGE = 0.6;

export function SimView2D({
  monde,
  robot,
  etat,
  className
}: {
  monde: Monde;
  robot: RobotSim;
  etat: EtatSim | null;
  className?: string;
}) {
  const [x0, y0, x1, y1] = monde.bornes;
  const l = x1 - x0 + 2 * MARGE;
  const h = y1 - y0 + 2 * MARGE;

  /* SVG a l'axe y vers le bas, le monde l'a vers le haut. Une seule
     transformation en tête de groupe suffit à réconcilier les deux. */
  const vb = `${x0 - MARGE} ${-(y1 + MARGE)} ${l} ${h}`;

  const rayons = useMemo(() => {
    if (!etat?.scan || !robot.lidar) return null;
    const pas = Math.max(1, Math.round(robot.lidar.rayons / 90));
    const pts: string[] = [];
    for (let i = 0; i < etat.scan.length; i += pas) {
      const d = etat.scan[i];
      if (!Number.isFinite(d)) continue;
      const a =
        etat.pose.theta - Math.PI + (i * 2 * Math.PI) / robot.lidar.rayons;
      pts.push(
        `M${etat.pose.x.toFixed(3)},${(-etat.pose.y).toFixed(3)}L${(
          etat.pose.x +
          Math.cos(a) * d
        ).toFixed(3)},${(-(etat.pose.y + Math.sin(a) * d)).toFixed(3)}`
      );
    }
    return pts.join("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat?.scan, etat?.pose.x, etat?.pose.y, etat?.pose.theta, robot.lidar]);

  const trace = useMemo(() => {
    if (!etat || etat.trace.length < 2) return "";
    return etat.trace
      .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(3)},${(-p[1]).toFixed(3)}`)
      .join("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat?.trace]);

  const pose = etat?.pose ?? monde.depart;
  /* L'odométrie parle dans son propre repère, né au point de départ.
     Pour l'afficher dans le monde, on la ramène là où elle croit être. */
  const odom = etat
    ? {
        x: monde.depart.x + etat.poseOdom.x,
        y: monde.depart.y + etat.poseOdom.y,
        theta: etat.poseOdom.theta
      }
    : null;

  const R = robot.rayon;

  return (
    <div className={className}>
      <svg viewBox={vb} className="h-full w-full" role="img" aria-label="Vue de dessus">
        <defs>
          <pattern
            id="sim-grille"
            width="1"
            height="1"
            patternUnits="userSpaceOnUse"
          >
            <path d="M1 0 L0 0 0 1" fill="none" stroke="#1e1f2b" strokeWidth="0.012" />
          </pattern>
        </defs>

        <rect
          x={x0 - MARGE}
          y={-(y1 + MARGE)}
          width={l}
          height={h}
          fill="url(#sim-grille)"
        />

        {/* Zones */}
        {monde.zones.map((z) => {
          const vue = etat?.zonesVisitees.includes(z.id);
          return (
            <g key={z.id}>
              <circle
                cx={z.x}
                cy={-z.y}
                r={z.rayon}
                fill={vue ? "rgba(61,220,154,0.16)" : "rgba(94,224,255,0.07)"}
                stroke={vue ? "#3ddc9a" : "#5ee0ff"}
                strokeWidth="0.02"
                strokeDasharray="0.12 0.08"
              />
              <text
                x={z.x}
                y={-z.y - z.rayon - 0.12}
                textAnchor="middle"
                fill={vue ? "#3ddc9a" : "#5ee0ff"}
                fontSize="0.2"
                fontFamily="var(--font-mono), monospace"
              >
                {z.label}
              </text>
            </g>
          );
        })}

        {/* Éventail LiDAR */}
        {rayons && (
          <path d={rayons} stroke="rgba(94,224,255,0.22)" strokeWidth="0.012" fill="none" />
        )}

        {/* Murs */}
        {monde.murs.map((m, i) => (
          <line
            key={i}
            x1={m.x1}
            y1={-m.y1}
            x2={m.x2}
            y2={-m.y2}
            stroke="#5a6076"
            strokeWidth="0.07"
            strokeLinecap="square"
          />
        ))}

        {/* Trajectoire réelle */}
        {trace && (
          <path d={trace} stroke="#1a2fff" strokeWidth="0.03" fill="none" opacity="0.75" />
        )}

        {/* Ce que croit l'odométrie */}
        {odom && (
          <g opacity="0.5">
            <circle
              cx={odom.x}
              cy={-odom.y}
              r={R}
              fill="none"
              stroke="#e0a83c"
              strokeWidth="0.025"
              strokeDasharray="0.1 0.07"
            />
            <line
              x1={odom.x}
              y1={-odom.y}
              x2={odom.x + Math.cos(odom.theta) * R * 1.5}
              y2={-(odom.y + Math.sin(odom.theta) * R * 1.5)}
              stroke="#e0a83c"
              strokeWidth="0.025"
            />
          </g>
        )}

        {/* Le robot, pour de vrai */}
        <g>
          <circle
            cx={pose.x}
            cy={-pose.y}
            r={R}
            fill="rgba(26,47,255,0.28)"
            stroke={etat?.collision ? "#ff4d5e" : robot.couleur}
            strokeWidth="0.035"
          />
          <line
            x1={pose.x}
            y1={-pose.y}
            x2={pose.x + Math.cos(pose.theta) * R * 1.6}
            y2={-(pose.y + Math.sin(pose.theta) * R * 1.6)}
            stroke={etat?.collision ? "#ff4d5e" : robot.couleur}
            strokeWidth="0.04"
          />
        </g>
      </svg>
    </div>
  );
}

/** Légende de la vue 2D, tenue à part pour ne pas encombrer le tracé. */
export function Legende2D() {
  const items = [
    { c: "#2b6bff", t: "pose réelle" },
    { c: "#e0a83c", t: "ce que croit l'odométrie" },
    { c: "#5ee0ff", t: "rayons LiDAR" },
    { c: "#3ddc9a", t: "zone atteinte" }
  ];
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-line px-4 py-2.5">
      {items.map((i) => (
        <span key={i.t} className="flex items-center gap-2 font-mono text-[10px] text-muted">
          <span className="h-2 w-2 shrink-0" style={{ background: i.c }} />
          {i.t}
        </span>
      ))}
    </div>
  );
}
