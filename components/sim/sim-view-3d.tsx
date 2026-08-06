"use client";

import { useCallback, type MutableRefObject } from "react";
import { getComponent } from "@/content/components";
import {
  construireLidar,
  construireModele,
  construireRoue,
  construireRoulette,
  creerMateriaux
} from "@/lib/three/models";
import { SceneCanvas, type SceneApi } from "@/components/three/scene-canvas";
import type { EtatSim, Monde, RobotSim } from "@/lib/sim/types";

/* ══════════════════════════════════════════════════════════════
   Vue 3D du monde simulé.

   Point d'attention principal : la scène est construite **une
   seule fois** par couple robot/monde. Tout ce qui bouge — le
   robot, ses roues, l'éventail LiDAR, la traînée — est mis à jour
   dans `onFrame` à partir d'une référence mutable. Reconstruire la
   scène à chaque image ferait ramer la page pour rien.
   ══════════════════════════════════════════════════════════════ */

const HAUTEUR_MUR = 0.55;

export function SimView3D({
  monde,
  robot,
  etatRef,
  suivre,
  className
}: {
  monde: Monde;
  robot: RobotSim;
  etatRef: MutableRefObject<EtatSim | null>;
  suivre: boolean;
  className?: string;
}) {
  const [x0, y0, x1, y1] = monde.bornes;
  const etendue = Math.max(x1 - x0, y1 - y0);
  const centre: [number, number, number] = [(x0 + x1) / 2, (y0 + y1) / 2, 0.2];

  const build = useCallback(
    (api: SceneApi) => {
      const { THREE, root, onFrame, controls, camera } = api;
      const mats = creerMateriaux(THREE);

      /* ── Sol ── */
      const sol = new THREE.Mesh(
        new THREE.PlaneGeometry(x1 - x0 + 2, y1 - y0 + 2),
        new THREE.MeshStandardMaterial({
          color: "#0d0e16",
          roughness: 0.95,
          metalness: 0.05
        })
      );
      sol.position.set((x0 + x1) / 2, (y0 + y1) / 2, -0.005);
      root.add(sol);

      /* ── Murs ── */
      const matMur = new THREE.MeshStandardMaterial({
        color: "#2c3044",
        roughness: 0.85,
        metalness: 0.1
      });
      for (const m of monde.murs) {
        const dx = m.x2 - m.x1;
        const dy = m.y2 - m.y1;
        const len = Math.hypot(dx, dy);
        if (len < 1e-6) continue;
        const mur = new THREE.Mesh(
          new THREE.BoxGeometry(len, 0.07, HAUTEUR_MUR),
          matMur
        );
        mur.position.set((m.x1 + m.x2) / 2, (m.y1 + m.y2) / 2, HAUTEUR_MUR / 2);
        mur.rotation.z = Math.atan2(dy, dx);
        root.add(mur);

        const arete = new THREE.LineSegments(
          new THREE.EdgesGeometry(mur.geometry),
          new THREE.LineBasicMaterial({ color: 0x4a5068 })
        );
        arete.position.copy(mur.position);
        arete.rotation.copy(mur.rotation);
        root.add(arete);
      }

      /* ── Zones ── */
      const anneaux: { id: string; mesh: import("three").Mesh }[] = [];
      for (const z of monde.zones) {
        const anneau = new THREE.Mesh(
          new THREE.RingGeometry(z.rayon * 0.82, z.rayon, 48),
          new THREE.MeshBasicMaterial({
            color: 0x5ee0ff,
            transparent: true,
            opacity: 0.55,
            side: THREE.DoubleSide
          })
        );
        anneau.position.set(z.x, z.y, 0.01);
        root.add(anneau);
        anneaux.push({ id: z.id, mesh: anneau });

        const etiquette = api.label(z.label, {
          couleur: "#5ee0ff",
          taille: 0.16,
          fond: "#0a0c14"
        });
        etiquette.position.set(z.x, z.y, 0.42);
        root.add(etiquette);
      }

      /* ── Le robot ── */
      const groupe = new THREE.Group();
      root.add(groupe);

      const rr = robot.rayonRoue;
      const deck = rr + 0.012;

      const plateau = new THREE.Mesh(
        new THREE.BoxGeometry(robot.longueur, robot.largeur, 0.008),
        new THREE.MeshStandardMaterial({
          color: "#1a1c28",
          roughness: 0.85,
          metalness: 0.15
        })
      );
      plateau.position.set(0, 0, deck);
      groupe.add(plateau);

      const bord = new THREE.LineSegments(
        new THREE.EdgesGeometry(plateau.geometry),
        new THREE.LineBasicMaterial({ color: 0x3a3e52 })
      );
      bord.position.copy(plateau.position);
      groupe.add(bord);

      /* Repère de cap : on doit voir où le robot regarde. */
      const nez = new THREE.Mesh(
        new THREE.ConeGeometry(0.035, 0.09, 16),
        new THREE.MeshStandardMaterial({ color: robot.couleur, roughness: 0.4 })
      );
      nez.rotation.z = -Math.PI / 2;
      nez.position.set(robot.longueur / 2 + 0.03, 0, deck + 0.02);
      groupe.add(nez);

      const roues: import("three").Group[] = [];
      for (const cote of [1, -1]) {
        const roue = construireRoue(THREE, mats, rr, rr * 0.5);
        roue.position.set(0, (cote * robot.entraxe) / 2, rr);
        groupe.add(roue);
        roues.push(roue);
      }

      const roulette = construireRoulette(THREE, mats, rr * 0.45);
      roulette.position.set(-robot.longueur / 2 + 0.03, 0, rr * 0.45);
      groupe.add(roulette);

      /* ── Composants réels, aux cotes du Codex ── */
      for (const c of robot.modele3d) {
        const comp = getComponent(c.composant);
        if (!comp) continue;
        const m = construireModele(THREE, mats, comp);
        const z =
          c.etage === 2 ? (robot.lidar?.hauteur ?? deck + 0.14) : deck + 0.004 + c.etage * 0.05;
        m.position.set(c.pos[0], c.pos[1], z);
        groupe.add(m);

        if (c.etage === 2) {
          const mat = new THREE.Mesh(
            new THREE.CylinderGeometry(0.012, 0.012, z - deck, 12),
            mats.alu
          );
          mat.rotation.x = Math.PI / 2;
          mat.position.set(c.pos[0], c.pos[1], deck + (z - deck) / 2);
          groupe.add(mat);
        }
      }

      /* Si aucun LiDAR n'a été posé par le Codex, on en met un : le
         robot doit montrer d'où partent les rayons. */
      if (robot.lidar && !robot.modele3d.some((c) => c.etage === 2)) {
        const l = construireLidar(THREE, mats, 0.035, 0.04);
        l.position.set(0, 0, robot.lidar.hauteur);
        groupe.add(l);
      }

      /* ── Éventail LiDAR ── */
      const l = robot.lidar;
      const nRayons = l ? Math.floor(l.rayons / 4) : 0;
      const posRayons = new Float32Array(Math.max(1, nRayons) * 6);
      const geoRayons = new THREE.BufferGeometry();
      geoRayons.setAttribute("position", new THREE.BufferAttribute(posRayons, 3));
      const faisceau = new THREE.LineSegments(
        geoRayons,
        new THREE.LineBasicMaterial({
          color: 0x5ee0ff,
          transparent: true,
          opacity: 0.28
        })
      );
      faisceau.frustumCulled = false;
      root.add(faisceau);

      /* ── Traînée ── */
      const MAX_TRACE = 1400;
      const posTrace = new Float32Array(MAX_TRACE * 3);
      const geoTrace = new THREE.BufferGeometry();
      geoTrace.setAttribute("position", new THREE.BufferAttribute(posTrace, 3));
      geoTrace.setDrawRange(0, 0);
      const traine = new THREE.Line(
        geoTrace,
        new THREE.LineBasicMaterial({ color: 0x1a2fff })
      );
      traine.frustumCulled = false;
      root.add(traine);

      /* ── Fantôme de l'odométrie ── */
      const fantome = new THREE.Mesh(
        new THREE.RingGeometry(robot.rayon * 0.88, robot.rayon, 40),
        new THREE.MeshBasicMaterial({
          color: 0xe0a83c,
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide
        })
      );
      fantome.position.z = 0.012;
      root.add(fantome);

      /* ── Animation ── */
      const offset = new THREE.Vector3();
      let premierSuivi = true;

      onFrame(() => {
        const e = etatRef.current;
        if (!e) return;

        groupe.position.set(e.pose.x, e.pose.y, 0);
        groupe.rotation.z = e.pose.theta;
        roues[0].rotation.y = -e.roues[0];
        roues[1].rotation.y = -e.roues[1];

        fantome.position.set(
          monde.depart.x + e.poseOdom.x,
          monde.depart.y + e.poseOdom.y,
          0.012
        );

        if (l && e.scan) {
          const pas = 4;
          let i = 0;
          for (let k = 0; k < nRayons; k++) {
            const idx = k * pas;
            /* Une mesure hors portée vaut l'infini. La borner avant de
               tester sa finitude dessinerait un rayon plein là où le
               LiDAR n'a justement rien vu. */
            const brut = e.scan[idx];
            const dd = Number.isFinite(brut) ? Math.min(brut, l.portee) : 0;
            const a = e.pose.theta - Math.PI + (idx * 2 * Math.PI) / l.rayons;
            posRayons[i++] = e.pose.x;
            posRayons[i++] = e.pose.y;
            posRayons[i++] = l.hauteur;
            posRayons[i++] = e.pose.x + Math.cos(a) * dd;
            posRayons[i++] = e.pose.y + Math.sin(a) * dd;
            posRayons[i++] = l.hauteur;
          }
          geoRayons.attributes.position.needsUpdate = true;
        }

        const n = Math.min(e.trace.length, MAX_TRACE);
        for (let k = 0; k < n; k++) {
          posTrace[k * 3] = e.trace[k][0];
          posTrace[k * 3 + 1] = e.trace[k][1];
          posTrace[k * 3 + 2] = 0.02;
        }
        geoTrace.setDrawRange(0, n);
        geoTrace.attributes.position.needsUpdate = true;

        if (suivre) {
          /* On déplace la cible sans toucher à l'orientation choisie
             par l'utilisateur : l'écart caméra-cible est conservé. */
          if (premierSuivi) {
            offset.copy(camera.position).sub(controls.target);
            premierSuivi = false;
          } else {
            offset.copy(camera.position).sub(controls.target);
          }
          controls.target.set(e.pose.x, e.pose.y, 0.15);
          camera.position.copy(controls.target).add(offset);
        }
      });

      /* Les zones changent de couleur une fois franchies : c'est la
         seule chose qui justifie une relecture par image. */
      onFrame(() => {
        const e = etatRef.current;
        if (!e) return;
        for (const a of anneaux) {
          const m = a.mesh.material as import("three").MeshBasicMaterial;
          const vue = e.zonesVisitees.includes(a.id);
          const cible = vue ? 0x3ddc9a : 0x5ee0ff;
          if (m.color.getHex() !== cible) m.color.setHex(cible);
        }
      });
    },
    [monde, robot, etatRef, suivre, x0, x1, y0, y1]
  );

  return (
    <SceneCanvas
      build={build}
      signature={`${monde.id}|${robot.id}|${suivre ? "suivi" : "fixe"}`}
      hauteur="100%"
      distance={suivre ? Math.max(2.4, etendue * 0.35) : etendue * 0.95}
      cible={suivre ? [monde.depart.x, monde.depart.y, 0.15] : centre}
      autoRotate={false}
      grille={0}
      className={className}
    />
  );
}
