"use client";

import { useMemo } from "react";
import { CATEGORY_LABEL } from "@/content/components";
import { ETAGE_LABEL, construireLayout } from "@/lib/wiring/layout3d";
import type { WiringDoc } from "@/lib/wiring/types";
import { SceneCanvas, type SceneApi } from "@/components/three/scene-canvas";
import { cx } from "@/components/ui/primitives";

/** Nom court : les références commerciales sont trop longues sur un schéma. */
function abreger(nom: string): string {
  const court = nom
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/^(Motoréducteur|Pont en H double|Adaptateur de niveau|Batterie|Module|Convertisseur|Driver)\s+/i, "")
    .trim();
  return court.length > 18 ? court.slice(0, 17) + "…" : court;
}

/**
 * Implantation physique du montage : les composants sont posés sur les
 * étages du châssis, les fils suivent un cheminement plausible, et la
 * longueur totale de câble est estimée.
 */
export function Wiring3D({
  doc,
  surbrillance
}: {
  doc: WiringDoc;
  surbrillance: string[];
}) {
  const layout = useMemo(() => construireLayout(doc), [doc]);

  const build = (api: SceneApi) => {
    const { THREE, root, label } = api;
    const { chassis, boites, fils } = layout;

    // ── Plateaux du châssis ──
    const hauteurs = [0.045, 0.1, 0.2];
    for (const etage of chassis.etages) {
      if (etage === 2) continue; // le mât n'est pas un plateau
      const geo = new THREE.BoxGeometry(chassis.longueur, chassis.largeur, 0.004);
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: "#12131c",
          metalness: 0.15,
          roughness: 0.85,
          transparent: true,
          // Le plateau haut doit laisser voir ce qui est rangé dessous,
          // sinon la moitié du montage disparaît.
          opacity: etage === 0 ? 0.9 : 0.4,
          depthWrite: etage === 0
        })
      );
      mesh.position.set(0, 0, hauteurs[etage]);
      root.add(mesh);

      const bord = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x2b2d3d })
      );
      bord.position.copy(mesh.position);
      root.add(bord);

      // Entretoises aux quatre coins
      if (etage > 0) {
        const bas = hauteurs[etage - 1];
        for (const sx of [-1, 1]) {
          for (const sy of [-1, 1]) {
            const col = new THREE.Mesh(
              new THREE.CylinderGeometry(0.003, 0.003, hauteurs[etage] - bas, 8),
              new THREE.MeshStandardMaterial({ color: "#2b2d3d", metalness: 0.8 })
            );
            col.rotation.x = Math.PI / 2;
            col.position.set(
              (sx * (chassis.longueur / 2 - 0.02)),
              (sy * (chassis.largeur / 2 - 0.02)),
              (hauteurs[etage] + bas) / 2
            );
            root.add(col);
          }
        }
      }
    }

    // ── Roues, pour donner l'échelle ──
    for (const cote of [1, -1]) {
      const roue = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0325, 0.0325, 0.026, 24),
        new THREE.MeshStandardMaterial({ color: "#1a2fff", metalness: 0.3, roughness: 0.7 })
      );
      roue.position.set(0, cote * 0.115, 0.0325);
      root.add(roue);
    }

    // ── Composants ──
    for (const b of boites) {
      const alerte = surbrillance.includes(b.uid);
      const geo = new THREE.BoxGeometry(...b.taille);
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: alerte ? "#ff4d5e" : b.couleur,
          metalness: 0.4,
          roughness: 0.45,
          emissive: alerte ? "#ff4d5e" : "#000000",
          emissiveIntensity: alerte ? 0.35 : 0
        })
      );
      mesh.position.set(...b.pos);
      root.add(mesh);

      const contour = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({
          color: alerte ? 0xff4d5e : 0x5ee0ff,
          transparent: true,
          opacity: alerte ? 0.9 : 0.35
        })
      );
      contour.position.copy(mesh.position);
      root.add(contour);

      // Étiquettes décalées en hauteur selon l'ordre : sur un châssis de
      // 30 cm, une dizaine de cartes se chevauchent sinon en permanence.
      const rang = boites.indexOf(b);
      const sp = label(abreger(b.nom), {
        couleur: alerte ? "#ff4d5e" : "#e8eaf2",
        taille: 0.0095,
        fond: "rgba(8,8,16,0.88)"
      });
      const hauteurEtiquette =
        b.pos[2] + b.taille[2] / 2 + 0.012 + (rang % 3) * 0.011;
      sp.position.set(b.pos[0], b.pos[1], hauteurEtiquette);
      root.add(sp);

      // Trait de rappel entre la carte et son étiquette
      const trait = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(b.pos[0], b.pos[1], b.pos[2] + b.taille[2] / 2),
          new THREE.Vector3(b.pos[0], b.pos[1], hauteurEtiquette - 0.005)
        ]),
        new THREE.LineBasicMaterial({
          color: alerte ? 0xff4d5e : 0x2b2d3d,
          transparent: true,
          opacity: 0.7
        })
      );
      root.add(trait);
    }

    // ── Fils : une courbe qui monte légèrement, comme un vrai câble ──
    for (const f of fils) {
      const a = new THREE.Vector3(...f.de);
      const b = new THREE.Vector3(...f.vers);
      const milieu = a.clone().lerp(b, 0.5);
      milieu.z += 0.012 + a.distanceTo(b) * 0.12;

      const courbe = new THREE.QuadraticBezierCurve3(a, milieu, b);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(courbe, 24, 0.0016, 6, false),
        new THREE.MeshStandardMaterial({
          color: f.couleur,
          metalness: 0.1,
          roughness: 0.8
        })
      );
      root.add(tube);
    }
  };

  const parEtage = useMemo(() => {
    const m = new Map<number, number>();
    for (const b of layout.boites) m.set(b.etage, (m.get(b.etage) ?? 0) + 1);
    return m;
  }, [layout]);

  return (
    <div>
      <SceneCanvas
        build={build}
        signature={JSON.stringify({ layout, surbrillance })}
        hauteur={620}
        distance={0.56}
        cible={[0, 0, 0.1]}
        grille={0.5}
      />

      <div className="mt-3 grid gap-px bg-line sm:grid-cols-4">
        <div className="bg-bg px-4 py-3">
          <p className="font-display text-base text-accent2">
            {layout.longueurCable.toFixed(2)} m
          </p>
          <p className="hud mt-1">Câble estimé</p>
        </div>
        <div className="bg-bg px-4 py-3">
          <p className="font-display text-base text-ink">{layout.masse} g</p>
          <p className="hud mt-1">Masse embarquée</p>
        </div>
        {[0, 1, 2].map((e) => (
          <div key={e} className="hidden bg-bg px-4 py-3 sm:block">
            <p
              className={cx(
                "font-display text-base",
                parEtage.get(e) ? "text-ink" : "text-line2"
              )}
            >
              {parEtage.get(e) ?? 0}
            </p>
            <p className="hud mt-1">{ETAGE_LABEL[e].split(" · ")[0]}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {Object.entries(CATEGORY_LABEL).map(([cat, l]) => {
          const b = layout.boites.find((x) => x.categorie === cat);
          if (!b) return null;
          return (
            <span
              key={cat}
              className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted"
            >
              <span
                className="h-2 w-2 shrink-0"
                style={{ backgroundColor: b.couleur }}
              />
              {l}
            </span>
          );
        })}
      </div>
    </div>
  );
}
