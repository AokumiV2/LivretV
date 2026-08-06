"use client";

import { useMemo, useState } from "react";
import { construireGraphLayout } from "@/lib/graph/layout3d";
import type { GraphDoc } from "@/lib/graph/types";
import {
  SceneCanvas,
  type SceneApi,
  type VueNom
} from "@/components/three/scene-canvas";
import { ViewButtons } from "@/components/three/view-buttons";

/**
 * Graphe de nœuds en volume. La profondeur porte la distance aux capteurs :
 * on lit le trajet de la donnée, du matériel jusqu'à la commande.
 */
export function Graph3D({
  doc,
  surbrillance,
  lecture
}: {
  doc: GraphDoc;
  surbrillance: string[];
  lecture: boolean;
}) {
  const layout = useMemo(() => construireGraphLayout(doc), [doc]);
  const [vue, setVue] = useState<VueNom>("3/4");

  // Cadrage déduit de l'étendue réelle du graphe : sans cela, un graphe à
  // deux nodes est perdu au loin et un graphe à vingt sort du champ.
  const cadre = useMemo(() => {
    if (layout.noeuds.length === 0) {
      return { cible: [0, 0, 0.3] as [number, number, number], distance: 2.4, etendue: 1.2 };
    }
    const xs = layout.noeuds.map((n) => n.pos[0]);
    const ys = layout.noeuds.map((n) => n.pos[1]);
    const zs = layout.noeuds.map((n) => n.pos[2]);
    const cible: [number, number, number] = [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
      (Math.min(...zs) + Math.max(...zs)) / 2 + 0.1
    ];
    const etendue = Math.max(
      Math.max(...xs) - Math.min(...xs),
      Math.max(...ys) - Math.min(...ys),
      1.2
    );
    // Champ vertical de 40° : couvrir E impose une distance d'environ 1,37 E.
    // On garde un peu de marge pour les étiquettes qui dépassent des nodes.
    return { cible, distance: etendue * 1.25 + 0.5, etendue };
  }, [layout]);

  const largeurPlan = Math.max(1.8, cadre.etendue * 0.9);

  const build = (api: SceneApi) => {
    const { THREE, root, label, onFrame } = api;

    // ── Plans de couche ──
    for (const c of layout.couches) {
      const geo = new THREE.PlaneGeometry(largeurPlan, largeurPlan * 0.6);
      const plan = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          color: 0x14141d,
          transparent: true,
          opacity: 0.32,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      plan.position.set(0, c.y, 0.45);
      root.add(plan);

      const bord = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x2b2d3d, transparent: true, opacity: 0.6 })
      );
      bord.position.copy(plan.position);
      root.add(bord);

      const sp = label(c.nom.toUpperCase(), {
        couleur: "#aab1c4",
        taille: cadre.etendue * 0.055,
        gras: true
      });
      sp.position.set(-largeurPlan / 2 - 0.12, c.y, 0.45);
      root.add(sp);
    }

    // ── Nœuds ──
    for (const n of layout.noeuds) {
      const alerte = surbrillance.includes(n.id);
      const casse = n.rompues > 0;
      const couleur = alerte ? 0xff4d5e : casse ? 0xe0a83c : 0x1a2fff;

      const geo = new THREE.BoxGeometry(0.42, 0.05, 0.13);
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: couleur,
          metalness: 0.5,
          roughness: 0.4,
          emissive: couleur,
          emissiveIntensity: alerte ? 0.5 : 0.12
        })
      );
      mesh.position.set(...n.pos);
      root.add(mesh);

      const contour = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x5ee0ff, transparent: true, opacity: 0.5 })
      );
      contour.position.copy(mesh.position);
      root.add(contour);

      const sp = label(`/${n.nom}`, {
        couleur: alerte ? "#ff4d5e" : "#e8eaf2",
        taille: cadre.etendue * 0.045,
        fond: "rgba(8,10,20,0.94)"
      });
      sp.position.set(n.pos[0], n.pos[1], n.pos[2] + 0.16);
      root.add(sp);
    }

    // ── Arcs ──
    for (const a of layout.arcs) {
      const p1 = new THREE.Vector3(...a.de);
      const p2 = new THREE.Vector3(...a.vers);
      const milieu = p1.clone().lerp(p2, 0.5);
      milieu.z += 0.12 + p1.distanceTo(p2) * 0.08;
      const courbe = new THREE.QuadraticBezierCurve3(p1, milieu, p2);

      if (a.connecte) {
        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(courbe, 40, 0.0055, 6, false),
          new THREE.MeshStandardMaterial({
            color: 0x5ee0ff,
            transparent: true,
            opacity: 0.45,
            emissive: 0x5ee0ff,
            emissiveIntensity: 0.25
          })
        );
        root.add(tube);

        // Paquets qui circulent : la densité suit la fréquence du topic
        if (lecture) {
          const nb = Math.min(6, Math.max(1, Math.round(a.hz / 10)));
          for (let i = 0; i < nb; i++) {
            const bille = new THREE.Mesh(
              new THREE.SphereGeometry(0.016, 10, 10),
              new THREE.MeshBasicMaterial({ color: 0x5ee0ff })
            );
            bille.userData = { courbe, offset: i / nb, vitesse: 0.35 };
            root.add(bille);
          }
        }
      } else {
        // Liaison rompue : pointillés rouges, aucun paquet ne circule
        const pts = courbe.getPoints(48);
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const ligne = new THREE.LineSegments(
          geo,
          new THREE.LineDashedMaterial({
            color: 0xff4d5e,
            dashSize: 0.05,
            gapSize: 0.04,
            transparent: true,
            opacity: 0.9
          })
        );
        ligne.computeLineDistances();
        root.add(ligne);
      }

      const sp = label(a.topic, {
        couleur: a.connecte ? "#767d92" : "#ff4d5e",
        taille: cadre.etendue * 0.026,
        fond: "rgba(8,10,20,0.82)"
      });
      sp.position.copy(courbe.getPoint(0.42));
      sp.position.z += 0.06;
      root.add(sp);
    }

    // ── Animation des paquets ──
    if (lecture) {
      const billes = root.children.filter((c) => c.userData?.courbe);
      onFrame((t) => {
        for (const b of billes) {
          const { courbe, offset, vitesse } = b.userData as {
            courbe: InstanceType<typeof THREE.QuadraticBezierCurve3>;
            offset: number;
            vitesse: number;
          };
          b.position.copy(courbe.getPoint((t * vitesse + offset) % 1));
        }
      });
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <ViewButtons vue={vue} onChange={setVue} />
        <p className="text-xs text-muted">
          Les couches vont des capteurs, en bas, jusqu&apos;à la commande.
        </p>
      </div>

      <SceneCanvas
        build={build}
        signature={JSON.stringify({ layout, surbrillance, lecture })}
        hauteur={620}
        distance={cadre.distance}
        cible={cadre.cible}
        grille={0}
        autoRotate={false}
        vue={vue}
      />

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        {[
          ["#1a2fff", "Node sain"],
          ["#e0a83c", "Liaison rompue"],
          ["#5ee0ff", "Topic actif"],
          ["#ff4d5e", "Diagnostic sélectionné"]
        ].map(([c, l]) => (
          <span
            key={l}
            className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted"
          >
            <span className="h-2 w-2 shrink-0" style={{ backgroundColor: c }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
