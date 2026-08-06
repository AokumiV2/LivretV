"use client";

import { useMemo, useState } from "react";
import { CATEGORY_LABEL, getComponent } from "@/content/components";
import { ETAGE_LABEL, construireLayout } from "@/lib/wiring/layout3d";
import type { WiringDoc } from "@/lib/wiring/types";
import {
  construireModele,
  construireRoue,
  creerMateriaux
} from "@/lib/three/models";
import {
  SceneCanvas,
  type SceneApi,
  type VueNom
} from "@/components/three/scene-canvas";
import { ViewButtons } from "@/components/three/view-buttons";
import { cx } from "@/components/ui/primitives";

const HAUTEURS = [0.045, 0.1, 0.2];

/**
 * Implantation physique du montage.
 *
 * Chaque composant est reconstruit en 3D aux cotes réelles, puis repéré par
 * un numéro. Le nom complet vit dans la légende en dessous, pas en tout
 * petit au milieu de la scène : c'est ce qui rend l'ensemble lisible.
 */
export function Wiring3D({
  doc,
  surbrillance
}: {
  doc: WiringDoc;
  surbrillance: string[];
}) {
  const layout = useMemo(() => construireLayout(doc), [doc]);
  const [vue, setVue] = useState<VueNom>("3/4");
  const [selection, setSelection] = useState<string | null>(null);

  const numero = useMemo(() => {
    const m = new Map<string, number>();
    // Numérotation de l'avant vers l'arrière : on retrouve la pièce sur le
    // robot dans cet ordre, capot ouvert.
    [...layout.boites]
      .sort((a, b) => b.pos[0] - a.pos[0] || b.pos[1] - a.pos[1])
      .forEach((b, i) => m.set(b.uid, i + 1));
    return m;
  }, [layout]);

  const build = (api: SceneApi) => {
    const { THREE, root, label } = api;
    const { chassis, boites, fils } = layout;
    const mats = creerMateriaux(THREE);

    // ── Plateaux du châssis ──
    for (const etage of chassis.etages) {
      if (etage === 2) continue; // le mât n'est pas un plateau

      const geo = new THREE.BoxGeometry(chassis.longueur, chassis.largeur, 0.004);
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: "#191b26",
          metalness: 0.2,
          roughness: 0.8,
          transparent: true,
          // Le plateau haut laisse voir ce qui est rangé dessous.
          opacity: etage === 0 ? 0.95 : 0.32,
          depthWrite: etage === 0
        })
      );
      mesh.position.set(0, 0, HAUTEURS[etage]);
      root.add(mesh);

      const bord = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x3a3e52 })
      );
      bord.position.copy(mesh.position);
      root.add(bord);

      if (etage > 0) {
        const bas = HAUTEURS[etage - 1];
        for (const sx of [-1, 1]) {
          for (const sy of [-1, 1]) {
            const col = new THREE.Mesh(
              new THREE.CylinderGeometry(0.003, 0.003, HAUTEURS[etage] - bas, 8),
              mats.alu
            );
            col.rotation.x = Math.PI / 2;
            col.position.set(
              sx * (chassis.longueur / 2 - 0.02),
              sy * (chassis.largeur / 2 - 0.02),
              (HAUTEURS[etage] + bas) / 2
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

    // ── Repère d'orientation : sans lui on ne sait pas où est l'avant ──
    const fleche = new THREE.Mesh(
      new THREE.ConeGeometry(0.012, 0.03, 4),
      new THREE.MeshBasicMaterial({ color: 0xff4d5e })
    );
    fleche.rotation.z = -Math.PI / 2;
    fleche.position.set(chassis.longueur / 2 + 0.035, 0, 0.004);
    root.add(fleche);
    const avant = label("AVANT", { couleur: "#ff4d5e", taille: 0.015 });
    avant.position.set(chassis.longueur / 2 + 0.078, 0, 0.004);
    root.add(avant);

    // ── Composants ──
    for (const b of boites) {
      const composant = getComponent(b.componentId);
      if (!composant) continue;

      const enDefaut = surbrillance.includes(b.uid);
      const actif = selection === b.uid;
      const attenue = selection !== null && !actif;

      const modele = construireModele(THREE, mats, composant);

      // Chaque modèle est posé sur z = 0 : on le cale sur le plateau en
      // retirant le minimum réel de sa boîte englobante.
      const bbox = new THREE.Box3().setFromObject(modele);
      const baseZ = b.pos[2] - b.taille[2] / 2;
      modele.position.set(b.pos[0], b.pos[1], baseZ - bbox.min.z);
      root.add(modele);

      const hautZ = baseZ + (bbox.max.z - bbox.min.z);

      // Les capteurs du mât ne flottent pas : un tube les porte.
      if (b.etage === 2) {
        const bas = HAUTEURS[1] + 0.002;
        const tube = new THREE.Mesh(
          new THREE.CylinderGeometry(0.006, 0.006, baseZ - bas, 12),
          mats.alu
        );
        tube.rotation.x = Math.PI / 2;
        tube.position.set(b.pos[0], b.pos[1], (baseZ + bas) / 2);
        root.add(tube);
      }

      // Empreinte colorée : garde le lien avec la légende des catégories
      const empreinte = new THREE.Mesh(
        new THREE.PlaneGeometry(b.taille[0] * 1.2, b.taille[1] * 1.2),
        new THREE.MeshBasicMaterial({
          color: enDefaut ? 0xff4d5e : b.couleur,
          transparent: true,
          opacity: attenue ? 0.08 : enDefaut ? 0.5 : actif ? 0.55 : 0.2,
          depthWrite: false
        })
      );
      empreinte.position.set(b.pos[0], b.pos[1], baseZ + 0.0004);
      root.add(empreinte);

      // Une pièce sélectionnée ou en défaut est encadrée, jamais repeinte :
      // on doit continuer à la reconnaître.
      if (actif || enDefaut) {
        const cage = new THREE.Box3Helper(
          new THREE.Box3(
            new THREE.Vector3(
              b.pos[0] - b.taille[0] / 2 - 0.002,
              b.pos[1] - b.taille[1] / 2 - 0.002,
              baseZ - 0.001
            ),
            new THREE.Vector3(
              b.pos[0] + b.taille[0] / 2 + 0.002,
              b.pos[1] + b.taille[1] / 2 + 0.002,
              hautZ + 0.002
            )
          ),
          new THREE.Color(enDefaut ? 0xff4d5e : 0x5ee0ff)
        );
        root.add(cage);
      }

      // Pastille numérotée : le nom complet est dans la légende HTML,
      // largement plus lisible qu'un texte flottant de trois pixels.
      const n = numero.get(b.uid) ?? 0;
      const zBadge = hautZ + 0.026;
      const pastille = label(String(n), {
        forme: "disque",
        couleur: enDefaut ? "#ff4d5e" : actif ? "#5ee0ff" : "#c8cede",
        fond: actif ? "#0d2230" : "#0a0c14",
        taille: attenue ? 0.017 : 0.024
      });
      pastille.position.set(b.pos[0], b.pos[1], zBadge);
      root.add(pastille);

      const trait = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(b.pos[0], b.pos[1], hautZ),
          new THREE.Vector3(b.pos[0], b.pos[1], zBadge - 0.012)
        ]),
        new THREE.LineBasicMaterial({
          color: enDefaut ? 0xff4d5e : actif ? 0x5ee0ff : 0x555b70,
          transparent: true,
          opacity: attenue ? 0.25 : 0.85
        })
      );
      root.add(trait);
    }

    // ── Fils ──
    for (const f of fils) {
      const concerne =
        selection === null || f.deUid === selection || f.versUid === selection;

      const a = new THREE.Vector3(...f.de);
      const b = new THREE.Vector3(...f.vers);
      const milieu = a.clone().lerp(b, 0.5);
      milieu.z += 0.014 + a.distanceTo(b) * 0.12;

      const courbe = new THREE.QuadraticBezierCurve3(a, milieu, b);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(courbe, 24, concerne ? 0.0013 : 0.0009, 6, false),
        new THREE.MeshStandardMaterial({
          color: f.couleur,
          metalness: 0.05,
          roughness: 0.85,
          transparent: true,
          opacity: concerne ? 1 : 0.12
        })
      );
      root.add(tube);
    }
  };

  const parEtage = useMemo(() => {
    const m = new Map<number, typeof layout.boites>();
    for (const b of layout.boites) {
      const l = m.get(b.etage) ?? [];
      l.push(b);
      m.set(b.etage, l);
    }
    for (const [, l] of m) {
      l.sort((a, c) => (numero.get(a.uid) ?? 0) - (numero.get(c.uid) ?? 0));
    }
    return m;
  }, [layout, numero]);

  const selectionne = layout.boites.find((b) => b.uid === selection);
  const filsDeLaSelection = selection
    ? layout.fils.filter((f) => f.deUid === selection || f.versUid === selection)
    : [];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <ViewButtons vue={vue} onChange={setVue} />
        <p className="text-xs text-muted">
          {selection
            ? "Clique à nouveau la pièce pour tout réafficher."
            : "Clique un numéro dans la légende pour isoler une pièce."}
        </p>
      </div>

      <SceneCanvas
        build={build}
        signature={JSON.stringify({ layout, surbrillance, selection })}
        hauteur={560}
        distance={0.58}
        cible={[0, 0, 0.12]}
        grille={0.5}
        vue={vue}
        autoRotate={false}
      />

      {/* ─── Légende : c'est ici qu'on lit ce qu'on regarde ─── */}
      <div className="mt-4 grid gap-px bg-line lg:grid-cols-3">
        {[0, 1, 2].map((etage) => {
          const items = parEtage.get(etage) ?? [];
          return (
            <div key={etage} className="bg-bg p-4">
              <p className="font-display text-[12px] uppercase tracking-[0.16em] text-accent2">
                {ETAGE_LABEL[etage].split(" · ")[0]}
              </p>
              <p className="mt-1 text-xs text-muted">
                {ETAGE_LABEL[etage].split(" · ")[1] ?? "—"} · {items.length}{" "}
                élément{items.length > 1 ? "s" : ""}
              </p>

              <ul className="mt-4 space-y-1">
                {items.map((b) => {
                  const n = numero.get(b.uid) ?? 0;
                  const actif = selection === b.uid;
                  const enDefaut = surbrillance.includes(b.uid);
                  return (
                    <li key={b.uid}>
                      <button
                        onClick={() => setSelection(actif ? null : b.uid)}
                        className={cx(
                          "flex w-full items-center gap-3 px-2 py-2 text-left transition-colors",
                          actif ? "bg-accent2/[0.1]" : "hover:bg-panel"
                        )}
                      >
                        <span
                          className={cx(
                            "flex h-6 w-6 shrink-0 items-center justify-center border font-mono text-[11px]",
                            enDefaut
                              ? "border-bad text-bad"
                              : actif
                                ? "border-accent2 text-accent2"
                                : "border-line2 text-muted"
                          )}
                        >
                          {n}
                        </span>
                        <span
                          className="h-3.5 w-1 shrink-0"
                          style={{ backgroundColor: b.couleur }}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={cx(
                              "block truncate text-[13px]",
                              actif ? "text-accent2" : "text-ink"
                            )}
                          >
                            {b.nom}
                          </span>
                          <span className="block truncate text-[11px] text-muted">
                            {CATEGORY_LABEL[b.categorie]}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
                {items.length === 0 && (
                  <li className="px-2 py-2 text-xs text-muted">Vide.</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      {/* ─── Détail de la pièce sélectionnée ─── */}
      {selectionne && (
        <div className="mt-px grid gap-px bg-line sm:grid-cols-4">
          <div className="bg-panel px-4 py-3">
            <p className="font-display text-sm text-accent2">
              {numero.get(selectionne.uid)} · {selectionne.nom}
            </p>
            <p className="mt-1 text-xs text-muted">
              {CATEGORY_LABEL[selectionne.categorie]}
            </p>
          </div>
          <div className="bg-bg px-4 py-3">
            <p className="font-display text-base text-ink">
              {Math.round(selectionne.taille[0] * 1000)} ×{" "}
              {Math.round(selectionne.taille[1] * 1000)} ×{" "}
              {Math.round(selectionne.taille[2] * 1000)} mm
            </p>
            <p className="hud mt-1">Encombrement</p>
          </div>
          <div className="bg-bg px-4 py-3">
            <p className="font-display text-base text-ink">
              {filsDeLaSelection.length}
            </p>
            <p className="hud mt-1">Fils raccordés</p>
          </div>
          <div className="bg-bg px-4 py-3">
            <p className="font-display text-base text-ink">
              {filsDeLaSelection.reduce((n, f) => n + f.longueur, 0).toFixed(2)} m
            </p>
            <p className="hud mt-1">Câble vers cette pièce</p>
          </div>
        </div>
      )}

      {/* ─── Bilan global ─── */}
      <div className="mt-4 grid gap-px bg-line sm:grid-cols-3">
        <div className="bg-bg px-4 py-3">
          <p className="font-display text-base text-accent2">
            {layout.longueurCable.toFixed(2)} m
          </p>
          <p className="hud mt-1">Câble total à prévoir</p>
        </div>
        <div className="bg-bg px-4 py-3">
          <p className="font-display text-base text-ink">{layout.masse} g</p>
          <p className="hud mt-1">Masse embarquée</p>
        </div>
        <div className="bg-bg px-4 py-3">
          <p className="font-display text-base text-ink">
            {layout.boites.length}
          </p>
          <p className="hud mt-1">Pièces implantées</p>
        </div>
      </div>
    </div>
  );
}
