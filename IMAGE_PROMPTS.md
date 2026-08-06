# Prompts d'images — LivretV

Ce fichier est fait pour être **copié-collé dans une IA de génération d'images**
(Midjourney, Flux, DALL·E, Stable Diffusion, Nano Banana…).

Chaque bloc donne :

- **Chemin cible** — où déposer le fichier dans le dépôt
- **Dimensions** — le rapport et la taille attendus
- **Prompt** — en anglais, les modèles y répondent mieux
- **Negative prompt** — ce qu'il faut exclure

> Le site est **entièrement fonctionnel sans aucune de ces images** : des
> placeholders SVG dans la palette du design tiennent la mise en page. Ces
> visuels sont une amélioration, pas une dépendance.

---

## Direction artistique commune

À ajouter mentalement à chaque prompt — ou littéralement, si ton modèle
accepte les prompts longs :

```
Dark cinematic product photography. Near-black background (#08080c).
Matte charcoal and gloss black surfaces. Single cold rim light from the
upper right, subtle electric blue bounce (#1a2fff) from the left.
High contrast, deep shadows, no clutter. Editorial, restrained, technical.
Shot on 85mm, shallow depth of field. No text, no logos, no watermark.
```

**Negative prompt commun** — à répéter partout :

```
text, letters, watermark, logo, signature, low quality, blurry, jpeg artifacts,
oversaturated, rainbow colors, warm orange lighting, cartoon, anime, 3d render
look, plastic toy, cluttered background, people faces, hands
```

---

## 1. Robot du hero — LE visuel principal

- **Chemin cible** : `public/images/hero-robot.png`
- **Dimensions** : 900 × 1200 (portrait 3:4), **fond transparent souhaité**
- **Remplace** : `public/placeholders/hero-robot.svg`

```
Full-body portrait of a sleek matte black humanoid robot, seen from the chest
up, head turned three-quarters to the left. Smooth carbon-fibre helmet with no
face, a single dark glossy visor catching a thin cyan reflection. Segmented
neck and shoulder armour, exposed cable routing along the collarbone. Surface
alternates matte charcoal panels and high-gloss black.

Lighting: hard cold rim light from the upper right carving the silhouette,
faint electric blue fill from the lower left. Background pure near-black,
seamless, no environment.

Style: dark cinematic product photography, editorial, high contrast, deep
blacks, subtle specular highlights. 85mm lens, shallow depth of field.
```

**Negative** : le prompt commun + `full body, legs, white background, bright
lighting, friendly expression, eyes, mouth`

**Après génération** : si tu obtiens un fond noir plutôt que transparent, ce
n'est pas grave — le fond du site est déjà `#08080c`. Détoure seulement si le
noir généré est visiblement différent.

Une fois le fichier en place, dans `components/home/hero.tsx` :

```diff
- src="/placeholders/hero-robot.svg"
+ src="/images/hero-robot.png"
```

---

## 2. Archétypes de robots — 4 images

- **Chemins cibles** :
  - `public/images/archetypes/rover.png`
  - `public/images/archetypes/bras.png`
  - `public/images/archetypes/amr.png`
  - `public/images/archetypes/table.png`
- **Dimensions** : 1200 × 800 (paysage 3:2)

### 2.1 — Rover différentiel

```
A compact two-wheel differential drive research robot on a dark seamless
studio floor. Anodised black aluminium chassis plate, two black rubber drive
wheels with visible motor mounts, a small caster at the rear. A cylindrical
360-degree spinning lidar sensor mounted on top, its housing catching a thin
cyan glow. Visible ribbon cables and a single-board computer with heatsink.

Three-quarter low angle. Cold rim light from upper right, deep shadows,
near-black background. Dark cinematic product photography, high contrast.
```

### 2.2 — Bras 6 axes

```
A six-axis desktop robotic arm in matte black and gunmetal, articulated in a
relaxed S-curve pose, two-finger parallel gripper open at the end. Visible
harmonic drive joints, cable channels running along each segment, small
electric blue status LEDs at the joints. Mounted on a heavy circular base.

Dark seamless studio background, cold rim light from upper right, faint blue
bounce from the left. Dark cinematic product photography, high contrast.
```

### 2.3 — AMR d'extérieur

```
A rugged four-wheel autonomous outdoor mobile robot, low and wide, matte black
chassis with knobby all-terrain tyres and visible suspension. A 3D lidar dome
on a raised mast, a small GNSS antenna, and a stereo camera at the front. Mud
and dust on the lower panels.

Three-quarter view, dark seamless studio background, cold hard rim light from
upper right. Dark cinematic product photography, high contrast, industrial.
```

### 2.4 — Robot de table

```
A tiny palm-sized two-wheel robot on a dark surface, single circuit board
chassis with two micro gearmotors and small rubber wheels, a microcontroller
with a visible antenna trace, three small time-of-flight distance sensors
facing forward. Exposed electronics, deliberately minimal and honest.

Close macro shot, shallow depth of field, cold rim light from upper right,
near-black background. Dark cinematic product photography.
```

**Negative pour les quatre** : le prompt commun + `humanoid, face, toy plastic,
bright colors, grass, outdoor scenery, people`

---

## 3. Vignettes de parcours — 6 images

- **Chemins cibles** : `public/images/tracks/<slug>.png`
  avec `<slug>` ∈ `fondations`, `communication`, `representation`,
  `navigation`, `perception`, `embarque`
- **Dimensions** : 800 × 500 (paysage 8:5)

Ces vignettes doivent être **abstraites**, pas illustratives : elles servent de
texture derrière le numéro du parcours.

| Parcours | Prompt |
|---|---|
| `fondations` | `Abstract dark composition: a grid of thin luminous lines converging into a single bright point, isometric, near-black background, electric blue and cyan only, minimal, technical blueprint aesthetic, no text` |
| `communication` | `Abstract dark composition: streams of small glowing cyan particles flowing along curved paths between three dim nodes, long exposure light trails, near-black background, electric blue accents, minimal, no text` |
| `representation` | `Abstract dark composition: a wireframe coordinate frame with three orthogonal axes floating in space, faint nested transparent bounding boxes around it, near-black background, cyan wireframe, minimal, technical, no text` |
| `navigation` | `Abstract dark composition: a top-down occupancy grid map, faint white walls on near-black, a single glowing cyan path curving through corridors, subtle blue gradient halo around obstacles, minimal, no text` |
| `perception` | `Abstract dark composition: a dense point cloud of thousands of tiny cyan dots forming the faint suggestion of a room interior, depth fading into near-black, minimal, technical, no text` |
| `embarque` | `Abstract dark macro composition: a printed circuit board at an extreme angle, copper traces catching a thin cyan rim light, shallow depth of field, near-black background, minimal, no text` |

---

## 4. Image de partage (Open Graph)

- **Chemin cible** : `public/images/og.png`
- **Dimensions** : 1200 × 630

```
Dark cinematic banner. Left two-thirds empty near-black space for text overlay.
Right third: the silhouette of a matte black humanoid robot head in profile,
cold cyan rim light along the edge of the visor. A single electric blue square
block of solid colour anchored in the lower left. Thin vertical hairlines
crossing the composition. Editorial, minimal, high contrast.
```

**Negative** : le prompt commun + `text, title, headline, UI mockup`

Une fois en place, ajouter dans `app/layout.tsx` :

```diff
  openGraph: {
    type: "website",
    locale: "fr_FR",
+   images: [{ url: "/images/og.png", width: 1200, height: 630 }],
```

---

## 5. Texture de bruit (optionnel)

- **Chemin cible** : `public/images/noise.png`
- **Dimensions** : 512 × 512, tuilable

Actuellement généré en SVG dans `app/globals.css` (classe `.noise`). Une vraie
texture de grain argentique donnerait un rendu plus fin.

```
Seamless tileable fine film grain texture, monochrome, very subtle,
high frequency noise, neutral grey on black, no pattern, no visible tiling
```

---

## Récapitulatif des chemins

```
public/images/
├── hero-robot.png            900 × 1200   ← priorité 1
├── og.png                    1200 × 630   ← priorité 2
├── noise.png                 512 × 512    optionnel
├── archetypes/
│   ├── rover.png             1200 × 800
│   ├── bras.png              1200 × 800
│   ├── amr.png               1200 × 800
│   └── table.png             1200 × 800
└── tracks/
    ├── fondations.png        800 × 500
    ├── communication.png     800 × 500
    ├── representation.png    800 × 500
    ├── navigation.png        800 × 500
    ├── perception.png        800 × 500
    └── embarque.png          800 × 500
```

## Palette de référence

À citer dans le prompt si le modèle dérive vers des couleurs chaudes :

| Rôle | Hex |
|---|---|
| Fond | `#08080c` |
| Panneau | `#0e0e15` |
| Ligne | `#1e1f2b` |
| Texte | `#e8eaf2` |
| Bleu d'accent | `#1a2fff` |
| Cyan | `#5ee0ff` |
