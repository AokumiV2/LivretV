"use client";

import { useEffect, useRef } from "react";
import type * as ThreeNs from "three";
import type { PreviewShape } from "@/lib/forge/types";

/**
 * Aperçu 3D des primitives du modèle. three.js est chargé dynamiquement :
 * la bibliothèque ne pèse sur le bundle que si l'utilisateur ouvre la Forge.
 */
export function RobotPreview({ shapes }: { shapes: PreviewShape[] }) {
  const hote = useRef<HTMLDivElement>(null);
  const shapesRef = useRef(shapes);
  shapesRef.current = shapes;

  useEffect(() => {
    let annule = false;
    let nettoyer: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      if (annule || !hote.current) return;

      const el = hote.current;
      const largeur = el.clientWidth || 600;
      const hauteur = el.clientHeight || 380;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#080810");

      const camera = new THREE.PerspectiveCamera(38, largeur / hauteur, 0.05, 50);
      camera.position.set(0.75, -0.75, 0.55);
      camera.up.set(0, 0, 1); // convention ROS : z vers le haut
      camera.lookAt(0, 0, 0.08);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(largeur, hauteur);
      el.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      const key = new THREE.DirectionalLight(0x9fd8ff, 1.5);
      key.position.set(1.2, -0.8, 1.6);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x1a2fff, 1.1);
      rim.position.set(-1.4, 1.0, 0.5);
      scene.add(rim);

      const grille = new THREE.GridHelper(2, 20, 0x2b2d3d, 0x1a1c26);
      grille.rotation.x = Math.PI / 2;
      scene.add(grille);

      // Axes ROS : x rouge vers l'avant, y vert à gauche, z bleu en haut
      scene.add(new THREE.AxesHelper(0.22));

      const groupe = new THREE.Group();
      scene.add(groupe);

      const construire = (liste: PreviewShape[]) => {
        while (groupe.children.length) {
          const enfant = groupe.children[0] as ThreeNs.Mesh;
          groupe.remove(enfant);
          enfant.geometry?.dispose();
          (enfant.material as ThreeNs.Material)?.dispose();
        }

        for (const s of liste) {
          const materiau = new THREE.MeshStandardMaterial({
            color: s.color,
            metalness: 0.35,
            roughness: 0.55
          });

          let mesh: ThreeNs.Mesh;
          if (s.kind === "box") {
            mesh = new THREE.Mesh(
              new THREE.BoxGeometry(s.size[0], s.size[1], s.size[2]),
              materiau
            );
          } else {
            mesh = new THREE.Mesh(
              new THREE.CylinderGeometry(s.radius, s.radius, s.length, 32),
              materiau
            );
            // Un cylindre three.js est aligné sur y : on le réoriente.
            if (s.axis === "z") mesh.rotation.x = Math.PI / 2;
            if (s.axis === "x") mesh.rotation.z = Math.PI / 2;
          }

          mesh.position.set(s.pos[0], s.pos[1], s.pos[2]);
          groupe.add(mesh);

          const contour = new THREE.LineSegments(
            new THREE.EdgesGeometry(mesh.geometry),
            new THREE.LineBasicMaterial({ color: 0x5ee0ff, transparent: true, opacity: 0.28 })
          );
          contour.position.copy(mesh.position);
          contour.rotation.copy(mesh.rotation);
          groupe.add(contour);
        }
      };

      construire(shapesRef.current);

      let derniereSignature = JSON.stringify(shapesRef.current);
      let raf = 0;
      let angle = 0;

      const boucle = () => {
        raf = requestAnimationFrame(boucle);

        const signature = JSON.stringify(shapesRef.current);
        if (signature !== derniereSignature) {
          derniereSignature = signature;
          construire(shapesRef.current);
        }

        angle += 0.004;
        camera.position.x = Math.cos(angle) * 0.95;
        camera.position.y = Math.sin(angle) * 0.95;
        camera.lookAt(0, 0, 0.09);
        renderer.render(scene, camera);
      };
      boucle();

      const onResize = () => {
        const w = el.clientWidth || 600;
        const h = el.clientHeight || 380;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      nettoyer = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
        if (renderer.domElement.parentNode === el) {
          el.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      annule = true;
      nettoyer?.();
    };
  }, []);

  return (
    <div
      ref={hote}
      className="h-[380px] w-full border border-line bg-[#080810]"
      aria-label="Aperçu 3D du robot généré"
    />
  );
}
