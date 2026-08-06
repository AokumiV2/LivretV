"use client";

import { useMemo } from "react";
import { CATEGORY_LABEL, getComponent } from "@/content/components";
import { ETAGE_LABEL, construireLayout } from "@/lib/wiring/layout3d";
import type { WiringDoc } from "@/lib/wiring/types";
import {
  construireModele,
  construireRoue,
  creerMateriaux
} from "@/lib/three/models";
import { SceneCanvas, type SceneApi } from "@/components/three/scene-canvas";
import { cx } from "@/components/ui/primitives";

/** Nom court : les références commerciales sont trop longues sur un schéma. */
function abreger(nom: string): string {
  const court = nom
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(
      /^(Motoréducteur|Pont en H double|Adaptateur de niveau|Batterie|Module|Convertisseur|Driver)\s+/i,
      ""
    )
    .trim();
  return court.length > 18 ? court.slice(0, 17) + "…" : court;
}

/**
 * Implantation physique du montage. Chaque composant est reconstruit en 3D
 * aux cotes réelles — circuit imprimé, connecteurs, barrettes de broches —
 * puis posé sur l'étage du châssis qui correspond à son rôle.
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
    const mats = creerMateriaux(THREE);

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

      if (etage > 0) {
        const bas = hauteurs[etage - 1];
        for (const sx of [-1, 1]) {
          for (const sy of [-1, 1]) {
            const col = new THREE.Mesh(
              new THREE.CylinderGeometry(0.003, 0.003, hauteurs[etage] - bas, 8),
              mats.alu
            );
            col.rotation.x = Math.PI / 2;
            col.position.set(
              sx * (chassis.longueur / 2 - 0.02),
              sy * (chassis.largeur / 2 - 0.02),
              (hauteurs[etage] + bas) / 2
            );
            root.add(col);
          }
        }
      }
    }

    // ── Roues motrices, pour l'échelle ──
    for (const cote of [1, -1]) {
      const roue = construireRoue(THREE, mats, 0.0325, 0.026);
      roue.position.set(0, cote * 0.115, 0.0325);
      root.add(roue);
    }

    // ── Composants ──
    for (const b of boites) {
      const composant = getComponent(b.componentId);
      if (!composant) continue;

      const alerte = surbrillance.includes(b.uid);
      const modele = construireModele(THREE, mats, composant);

      // Chaque modèle est construit posé sur z = 0 ; on le cale sur le
      // plateau en retirant le minimum réel de sa boîte englobante.
      const bbox = new THREE.Box3().setFromObject(modele);
      const baseZ = b.pos[2] - b.taille[2] / 2;
      modele.position.set(b.pos[0], b.pos[1], baseZ - bbox.min.z);
      root.add(modele);

      const hautZ = baseZ + (bbox.max.z - bbox.min.z);

      // Les capteurs du mât ne flottent pas : ils sont posés sur un tube
      // qui monte depuis le plateau supérieur.
      if (b.etage === 2) {
        const bas = hauteurs[1] + 0.002;
        const mat = new THREE.Mesh(
          new THREE.CylinderGeometry(0.006, 0.006, baseZ - bas, 12),
          mats.alu
        );
        mat.rotation.x = Math.PI / 2;
        mat.position.set(b.pos[0], b.pos[1], (baseZ + bas) / 2);
        root.add(mat);
      }

      // Empreinte au sol dans la couleur de la catégorie : elle garde la
      // légende lisible malgré des modèles aux couleurs réalistes.
      const empreinte = new THREE.Mesh(
        new THREE.PlaneGeometry(b.taille[0] * 1.14, b.taille[1] * 1.14),
        new THREE.MeshBasicMaterial({
          color: alerte ? 0xff4d5e : b.couleur,
          transparent: true,
          opacity: alerte ? 0.45 : 0.14,
          depthWrite: false
        })
      );
      empreinte.position.set(b.pos[0], b.pos[1], baseZ + 0.0004);
      root.add(empreinte);

      // Un composant en défaut est encadré, pas repeint : on veut continuer
      // à le reconnaître.
      if (alerte) {
        const cage = new THREE.Box3Helper(
          new THREE.Box3(
            new THREE.Vector3(
              b.pos[0] - b.taille[0] / 2,
              b.pos[1] - b.taille[1] / 2,
              baseZ
            ),
            new THREE.Vector3(
              b.pos[0] + b.taille[0] / 2,
              b.pos[1] + b.taille[1] / 2,
              hautZ
            )
          ),
          new THREE.Color(0xff4d5e)
        );
        root.add(cage);
      }

      // Étiquettes décalées en hauteur : sur un châssis de 30 cm, une
      // dizaine de cartes se chevauchent sinon en permanence.
      const rang = boites.indexOf(b);
      const sp = label(abreger(b.nom), {
        couleur: alerte ? "#ff4d5e" : "#e8eaf2",
        taille: 0.0095,
        fond: "rgba(8,8,16,0.88)"
      });
      const hauteurEtiquette = hautZ + 0.011 + (rang % 3) * 0.011;
      sp.position.set(b.pos[0], b.pos[1], hauteurEtiquette);
      root.add(sp);

      const trait = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(b.pos[0], b.pos[1], hautZ),
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
      milieu.z += 0.014 + a.distanceTo(b) * 0.12;

      const courbe = new THREE.QuadraticBezierCurve3(a, milieu, b);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(courbe, 24, 0.0011, 6, false),
        new THREE.MeshStandardMaterial({
          color: f.couleur,
          metalness: 0.05,
          roughness: 0.85
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
        distance={0.58}
        cible={[0, 0, 0.12]}
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
