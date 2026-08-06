"use client";

import { useEffect, useRef } from "react";
import type * as ThreeNs from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Socle three.js partagé par les trois vues 3D du site.
 *
 * three.js est chargé dynamiquement : la bibliothèque ne pèse sur le bundle
 * que si l'utilisateur bascule réellement en 3D. Le composant s'occupe de la
 * scène, des lumières, des contrôles orbitaux, du redimensionnement et de la
 * libération mémoire ; l'appelant ne fournit que le contenu.
 */

export type SceneApi = {
  THREE: typeof ThreeNs;
  scene: ThreeNs.Scene;
  /** Groupe vidé et reconstruit à chaque changement de `signature`. */
  root: ThreeNs.Group;
  controls: OrbitControls;
  camera: ThreeNs.PerspectiveCamera;
  /** Étiquette de texte lisible depuis n'importe quel angle. */
  label: (
    texte: string,
    options?: { couleur?: string; taille?: number; fond?: string }
  ) => ThreeNs.Sprite;
  /**
   * Enregistre un rappel exécuté à chaque image, avec le temps écoulé en
   * secondes. La liste est vidée à chaque reconstruction : c'est ce qui
   * évite d'empiler des boucles d'animation orphelines.
   */
  onFrame: (cb: (temps: number) => void) => void;
};

type Props = {
  /** Contenu de la scène. Rappelé à chaque changement de `signature`. */
  build: (api: SceneApi) => void;
  /** Chaîne qui décrit l'état ; un changement déclenche la reconstruction. */
  signature: string;
  hauteur?: number;
  /** Distance initiale de la caméra, en unités de scène. */
  distance?: number;
  cible?: [number, number, number];
  /** Rotation automatique tant que l'utilisateur n'a pas touché la vue. */
  autoRotate?: boolean;
  /** Taille de la grille au sol. 0 pour la masquer. */
  grille?: number;
  className?: string;
};

export function SceneCanvas({
  build,
  signature,
  hauteur = 400,
  distance = 1.2,
  cible = [0, 0, 0.1],
  autoRotate = true,
  grille = 2,
  className
}: Props) {
  const hote = useRef<HTMLDivElement>(null);
  const buildRef = useRef(build);
  const sigRef = useRef(signature);
  buildRef.current = build;
  sigRef.current = signature;

  // Ces réglages ne changent pas en cours de vie du composant : on les fige
  // dans une ref pour garder l'effet de montage sans dépendances.
  const cfg = useRef({ distance, cible, autoRotate, grille });

  useEffect(() => {
    let annule = false;
    let nettoyer: (() => void) | undefined;

    (async () => {
      const [THREE, { OrbitControls: OC }] = await Promise.all([
        import("three"),
        import("three/examples/jsm/controls/OrbitControls.js")
      ]);
      if (annule || !hote.current) return;

      const el = hote.current;
      const w = () => el.clientWidth || 600;
      const h = () => el.clientHeight || 400;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#080810");
      scene.fog = new THREE.Fog("#080810", cfg.current.distance * 2.5, cfg.current.distance * 8);

      const camera = new THREE.PerspectiveCamera(40, w() / h(), 0.02, 400);
      camera.up.set(0, 0, 1); // convention ROS : z vers le haut
      const d = cfg.current.distance;
      const cible = new THREE.Vector3(...cfg.current.cible);
      // La caméra se place PAR RAPPORT à la cible, pas à l'origine : sinon
      // un contenu décentré sort du champ dès que la cible s'éloigne de 0.
      const direction = new THREE.Vector3(0.72, -0.72, 0.52).normalize();
      camera.position.copy(cible).add(direction.multiplyScalar(d));

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w(), h());
      el.appendChild(renderer.domElement);

      const controls = new OC(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.target.copy(cible);
      controls.autoRotate = cfg.current.autoRotate;
      controls.autoRotateSpeed = 0.9;
      controls.minDistance = d * 0.25;
      controls.maxDistance = d * 5;
      // La rotation automatique s'arrête dès que l'utilisateur prend la main.
      controls.addEventListener("start", () => {
        controls.autoRotate = false;
      });
      controls.update();

      // Depuis three r155 les intensités sont en unités physiques : il faut
      // des valeurs bien plus élevées qu'avec l'ancien rendu.
      scene.add(new THREE.AmbientLight(0xffffff, 1.1));
      scene.add(new THREE.HemisphereLight(0x9fd8ff, 0x101018, 1.2));

      const key = new THREE.DirectionalLight(0xffffff, 2.6);
      key.position.copy(cible).add(new THREE.Vector3(d, -d * 0.8, d * 1.4));
      scene.add(key);

      const fill = new THREE.DirectionalLight(0x9fd8ff, 1.3);
      fill.position.copy(cible).add(new THREE.Vector3(-d * 0.6, -d * 1.1, d * 0.5));
      scene.add(fill);

      const rim = new THREE.DirectionalLight(0x5a7dff, 1.1);
      rim.position.copy(cible).add(new THREE.Vector3(-d * 1.2, d, d * 0.4));
      scene.add(rim);

      if (cfg.current.grille > 0) {
        const g = new THREE.GridHelper(
          cfg.current.grille,
          Math.round(cfg.current.grille * 10),
          0x2b2d3d,
          0x181a24
        );
        g.rotation.x = Math.PI / 2;
        scene.add(g);
      }

      const root = new THREE.Group();
      scene.add(root);

      /** Texte rendu sur un canvas 2D puis affiché comme sprite. */
      const label: SceneApi["label"] = (texte, options = {}) => {
        const couleur = options.couleur ?? "#e8eaf2";
        const taille = options.taille ?? 0.05;
        const fond = options.fond;

        const dpr = 2;
        const police = 44;
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d")!;
        ctx.font = `${police}px ui-monospace, monospace`;
        const larg = Math.ceil(ctx.measureText(texte).width) + 28;
        c.width = larg * dpr;
        c.height = (police + 22) * dpr;
        ctx.scale(dpr, dpr);

        if (fond) {
          ctx.fillStyle = fond;
          ctx.fillRect(0, 0, larg, police + 22);
        }
        ctx.font = `${police}px ui-monospace, monospace`;
        ctx.fillStyle = couleur;
        ctx.textBaseline = "middle";
        ctx.fillText(texte, 14, (police + 22) / 2);

        const tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearFilter;
        tex.needsUpdate = true;

        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
        );
        const ratio = c.width / c.height;
        sprite.scale.set(taille * ratio, taille, 1);
        sprite.renderOrder = 999;
        return sprite;
      };

      /** Libère géométries, matériaux et textures d'une branche de la scène. */
      const vider = (groupe: ThreeNs.Object3D) => {
        for (let i = groupe.children.length - 1; i >= 0; i--) {
          const enfant = groupe.children[i];
          vider(enfant);
          groupe.remove(enfant);
          const m = enfant as ThreeNs.Mesh;
          m.geometry?.dispose?.();
          const mat = m.material as ThreeNs.Material | ThreeNs.Material[];
          if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
          else if (mat) {
            const carte = (mat as ThreeNs.SpriteMaterial).map;
            carte?.dispose();
            mat.dispose();
          }
        }
      };

      let frames: ((t: number) => void)[] = [];
      const api: SceneApi = {
        THREE,
        scene,
        root,
        controls,
        camera,
        label,
        onFrame: (cb) => frames.push(cb)
      };

      let derniere = "";
      const reconstruire = () => {
        frames = [];
        vider(root);
        buildRef.current(api);
        derniere = sigRef.current;
      };
      reconstruire();

      const horloge = new THREE.Clock();
      let raf = 0;
      const boucle = () => {
        raf = requestAnimationFrame(boucle);
        if (sigRef.current !== derniere) reconstruire();
        const t = horloge.getElapsedTime();
        for (const f of frames) f(t);
        controls.update();
        renderer.render(scene, camera);
      };
      boucle();

      const onResize = () => {
        camera.aspect = w() / h();
        camera.updateProjectionMatrix();
        renderer.setSize(w(), h());
      };
      window.addEventListener("resize", onResize);
      const ro = new ResizeObserver(onResize);
      ro.observe(el);

      nettoyer = () => {
        frames = [];
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        ro.disconnect();
        controls.dispose();
        vider(root);
        renderer.dispose();
        if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
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
      style={{ height: hauteur }}
      className={className ?? "w-full border border-line bg-[#080810]"}
    />
  );
}
