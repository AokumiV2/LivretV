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
    options?: {
      couleur?: string;
      taille?: number;
      fond?: string;
      /** "disque" produit une pastille ronde, pour les repères numérotés. */
      forme?: "rect" | "disque";
      gras?: boolean;
    }
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
  /** Hauteur du canevas. Une chaîne permet de remplir un conteneur
   *  flexible, ce dont l'Atelier a besoin. */
  hauteur?: number | string;
  /** Distance initiale de la caméra, en unités de scène. */
  distance?: number;
  cible?: [number, number, number];
  /** Rotation automatique tant que l'utilisateur n'a pas touché la vue. */
  autoRotate?: boolean;
  /** Taille de la grille au sol. 0 pour la masquer. */
  grille?: number;
  /** Point de vue imposé. Un changement replace la caméra. */
  vue?: VueNom;
  className?: string;
};

/** Points de vue proposés, en direction depuis la cible. */
export const VUES: Record<string, [number, number, number]> = {
  "3/4": [0.72, -0.72, 0.52],
  dessus: [0.001, -0.22, 1],
  avant: [1, 0, 0.16],
  cote: [0, -1, 0.16],
  arriere: [-1, 0, 0.22]
};

export type VueNom = keyof typeof VUES;

export function SceneCanvas({
  build,
  signature,
  hauteur = 400,
  distance = 1.2,
  cible = [0, 0, 0.1],
  autoRotate = true,
  grille = 2,
  vue,
  className
}: Props) {
  const hote = useRef<HTMLDivElement>(null);
  const pilote = useRef<{
    appliquer: (v: VueNom) => void;
  } | null>(null);
  const buildRef = useRef(build);
  const sigRef = useRef(signature);
  buildRef.current = build;
  sigRef.current = signature;

  // Ces réglages ne changent pas en cours de vie du composant : on les fige
  // dans une ref pour garder l'effet de montage sans dépendances.
  const cfg = useRef({ distance, cible, autoRotate, grille });
  const vueRef = useRef(vue);
  vueRef.current = vue;

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
        const disque = options.forme === "disque";
        const gras = options.gras ?? disque;

        const dpr = 3; // texte net même en zoom fort
        const police = 46;
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d")!;
        const fonte = `${gras ? "700 " : ""}${police}px ui-monospace, monospace`;
        ctx.font = fonte;

        const largTexte = Math.ceil(ctx.measureText(texte).width);
        const padX = disque ? 0 : 18;
        const h = police + 26;
        const larg = disque ? h : largTexte + padX * 2;

        c.width = larg * dpr;
        c.height = h * dpr;
        ctx.scale(dpr, dpr);
        ctx.font = fonte;
        ctx.textBaseline = "middle";

        if (disque) {
          ctx.beginPath();
          ctx.arc(larg / 2, h / 2, h / 2 - 3, 0, Math.PI * 2);
          ctx.fillStyle = fond ?? "#0a0c14";
          ctx.fill();
          ctx.lineWidth = 4;
          ctx.strokeStyle = couleur;
          ctx.stroke();
          ctx.fillStyle = couleur;
          ctx.textAlign = "center";
          ctx.fillText(texte, larg / 2, h / 2 + 1);
        } else {
          if (fond) {
            // Fond à coins arrondis : plus lisible qu'un rectangle net
            const r = 8;
            ctx.beginPath();
            ctx.moveTo(r, 0);
            ctx.arcTo(larg, 0, larg, h, r);
            ctx.arcTo(larg, h, 0, h, r);
            ctx.arcTo(0, h, 0, 0, r);
            ctx.arcTo(0, 0, larg, 0, r);
            ctx.closePath();
            ctx.fillStyle = fond;
            ctx.fill();
          }
          ctx.fillStyle = couleur;
          ctx.textAlign = "left";
          ctx.fillText(texte, padX, h / 2 + 1);
        }

        const tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        tex.needsUpdate = true;

        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
        );
        const ratio = larg / h;
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
      // Permet de replacer la caméra depuis l'extérieur, sans recharger
      // la scène : c'est ce qui rend les vues « dessus » et « côté » utiles.
      pilote.current = {
        appliquer: (v) => {
          const dir = VUES[v] ?? VUES["3/4"];
          const n = Math.hypot(dir[0], dir[1], dir[2]) || 1;
          const t = controls.target;
          camera.position.set(
            t.x + (dir[0] / n) * d,
            t.y + (dir[1] / n) * d,
            t.z + (dir[2] / n) * d
          );
          controls.autoRotate = false;
          controls.update();
        }
      };
      if (vueRef.current) pilote.current.appliquer(vueRef.current);

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
        pilote.current = null;
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

  useEffect(() => {
    if (vue) pilote.current?.appliquer(vue);
  }, [vue]);

  return (
    <div
      ref={hote}
      style={{ height: hauteur }}
      className={className ?? "w-full border border-line bg-[#080810]"}
    />
  );
}
