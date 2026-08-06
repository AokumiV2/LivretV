"use client";

import { useState } from "react";
import type { ForgeConfig, PreviewShape } from "@/lib/forge/types";
import { ViewToggle, type Vue } from "@/components/ui/view-toggle";
import { SceneCanvas, type SceneApi } from "@/components/three/scene-canvas";
import {
  construireLidar,
  construireRoue,
  construireRoulette,
  creerMateriaux
} from "@/lib/three/models";
import { Plan2D } from "./plan-2d";

/** Scène 3D des primitives du modèle URDF. */
export function RobotPreview3D({ shapes }: { shapes: PreviewShape[] }) {
  const build = (api: SceneApi) => {
    const { THREE, root, label } = api;
    const mats = creerMateriaux(THREE);

    // Axes ROS : x rouge vers l'avant, y vert à gauche, z bleu en haut
    root.add(new THREE.AxesHelper(0.22));

    for (const s of shapes) {
      // Les pièces reconnaissables ont leur propre modèle : une roue a des
      // crampons et des rayons, un LiDAR a une tête tournante et une
      // fenêtre optique. Les cotes restent celles de l'URDF.
      if (s.kind === "cylinder" && s.name.startsWith("wheel")) {
        const roue = construireRoue(THREE, mats, s.radius, s.length);
        roue.position.set(s.pos[0], s.pos[1], s.pos[2]);
        root.add(roue);
        continue;
      }
      if (s.kind === "cylinder" && s.name === "laser_frame") {
        const lidar = construireLidar(THREE, mats, s.radius, s.length);
        lidar.position.set(s.pos[0], s.pos[1], s.pos[2] - s.length / 2);
        root.add(lidar);
        continue;
      }
      if (s.kind === "cylinder" && s.name === "caster") {
        const roulette = construireRoulette(THREE, mats, s.radius);
        roulette.position.set(s.pos[0], s.pos[1], s.pos[2]);
        root.add(roulette);
        continue;
      }

      const materiau = new THREE.MeshStandardMaterial({
        color: s.color,
        metalness: 0.35,
        roughness: 0.55
      });

      const geo =
        s.kind === "box"
          ? new THREE.BoxGeometry(s.size[0], s.size[1], s.size[2])
          : new THREE.CylinderGeometry(s.radius, s.radius, s.length, 32);

      const mesh = new THREE.Mesh(geo, materiau);
      // Un cylindre three.js est aligné sur y : on le réoriente.
      if (s.kind === "cylinder") {
        if (s.axis === "z") mesh.rotation.x = Math.PI / 2;
        if (s.axis === "x") mesh.rotation.z = Math.PI / 2;
      }
      mesh.position.set(s.pos[0], s.pos[1], s.pos[2]);
      root.add(mesh);

      const contour = new THREE.LineSegments(
        new THREE.EdgesGeometry(mesh.geometry),
        new THREE.LineBasicMaterial({
          color: 0x5ee0ff,
          transparent: true,
          opacity: 0.28
        })
      );
      contour.position.copy(mesh.position);
      contour.rotation.copy(mesh.rotation);
      root.add(contour);
    }

    // Étiquette du repère du LiDAR : le seul dont la position compte vraiment
    const laser = shapes.find((s) => s.name === "laser_frame");
    if (laser) {
      const sp = label("laser_frame", { couleur: "#5ee0ff", taille: 0.028 });
      sp.position.set(laser.pos[0], laser.pos[1], laser.pos[2] + 0.06);
      root.add(sp);
    }
  };

  return (
    <SceneCanvas
      build={build}
      signature={JSON.stringify(shapes)}
      hauteur={380}
      distance={0.62}
      cible={[0, 0, 0.11]}
    />
  );
}

/** Aperçu du robot avec bascule entre le plan coté et la vue 3D. */
export function RobotPreview({
  shapes,
  cfg
}: {
  shapes: PreviewShape[];
  cfg: ForgeConfig;
}) {
  const [vue, setVue] = useState<Vue>("3d");

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          {vue === "3d" ? "Glisse pour tourner" : "Cotes en millimètres"}
        </p>
        <ViewToggle vue={vue} onChange={setVue} label2d="Plan" label3d="3D" />
      </div>

      {vue === "3d" ? <RobotPreview3D shapes={shapes} /> : <Plan2D cfg={cfg} />}
    </div>
  );
}
