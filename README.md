# LivretV

**Apprendre la robotique ROS 2, du premier node au robot complet.**

Plateforme d'apprentissage en français : théorie, catalogue de composants,
atelier où l'on écrit du vrai code ROS 2 qui pilote un robot simulé,
laboratoire de câblage avec validation, simulateur de graphe de nœuds, et
générateur de projet ROS 2 téléchargeable.

Cible : **ROS 2 Jazzy Jalisco** (Ubuntu 24.04), avec option Humble.

---

## Ce que contient le site

### Academy — 6 parcours, 25 leçons

| # | Parcours | Contenu |
|---|---|---|
| 01 | Fondations | Ce qu'est ROS 2, installation, workspace colcon, premier paquet |
| 02 | Communication | Nodes, topics, services, actions, paramètres, QoS et DDS |
| 03 | Représentation | TF2, URDF/xacro, RViz2, simulation Gazebo |
| 04 | Navigation | Odométrie, SLAM Toolbox, Nav2, arbres de comportement |
| 05 | Perception | Caméras, nuages de points, fusion et synchronisation |
| 06 | Manipulation & embarqué | ros2_control, MoveIt 2, micro-ROS, déploiement |

Chaque leçon contient du code Python **et** C++, les commandes à taper, les
sorties attendues — et surtout les pièges qui coûtent un week-end quand
personne ne les a signalés. 58 questions de quiz avec explication.

### Codex — 60 fiches composants

Calculateurs, microcontrôleurs, moteurs, drivers, capteurs, caméras,
alimentation et connectique. Chaque fiche donne la tension, le courant, le
brochage, le paquet ROS 2 associé, le prix, et les pièges classiques.

### Atelier — écrire du ROS 2 et le voir bouger

Un éditeur Python, un robot simulé, une console. Le code est exécuté par
**CPython compilé en WebAssembly** (Pyodide) dans un Web Worker, avec une API
`rclpy` conforme : `Node`, `create_publisher`, `create_subscription`,
`create_timer`, `create_service`, `declare_parameter`, `QoSProfile`. Le
fichier écrit ici se dépose sur un vrai robot sans une virgule de changement,
et le bouton **Exporter** en fait un paquet `ament_python` complet.

Ce que le simulateur fournit, aux cadences d'un vrai robot :
`/scan` (LaserScan 360°, 10 Hz, obtenu par lancer de rayons sur les murs),
`/odom` (30 Hz, **avec sa dérive**), `/imu/data` (100 Hz), `/joint_states`.
Il s'abonne à `/cmd_vel` comme le ferait un contrôleur différentiel.

Le bus applique la **règle de compatibilité QoS de `lib/graph/validate.ts`** —
la même que le Node Graph. Un abonné `RELIABLE` sur un publieur `BEST_EFFORT`
ne reçoit rien, silencieusement, exactement comme en DDS. C'est le sujet de la
mission 5, et le piège est réel, pas scénarisé.

**Douze missions**, du premier `get_logger()` à la traversée d'un labyrinthe :
publier sur `/cmd_vel`, tracer un carré en boucle ouverte, s'arrêter à deux
mètres avec `/odom`, la QoS, l'évitement au LiDAR, le suivi de mur par
correcteur proportionnel, les paramètres ROS 2, la machine à états, la dérive
d'odométrie, un service `Trigger`, et l'aller-au-but avec évitement.

Les objectifs sont **vérifiés automatiquement** sur la trace du run — « a
publié sur `/cmd_vel` à au moins 10 Hz », « n'est jamais passé sous 15 cm d'un
mur », « l'abonnement à `/scan` est en `BEST_EFFORT` ». Aucun modèle, aucune
clé d'API : deux codes différents qui produisent le même comportement passent
tous les deux.

Trois robots, une bascule **2D ↔ 3D**. La vue 2D montre côte à côte la pose
réelle et celle que croit l'odométrie — l'écart entre les deux est toute la
mission 10. Le même code d'évitement sur le robot de table et sur l'AMR de
vingt-deux kilos ne donne pas le même résultat : c'est l'inertie, et il n'y a
pas de seuil de distance universel.

La simulation tourne à pas fixe de 20 ms avec un générateur pseudo-aléatoire à
graine fixe : **deux runs du même code donnent le même résultat**, sans quoi la
validation ne voudrait rien dire. Le worker est terminable, donc un
`while True: pass` ne fige pas la page.

### Wiring Lab · 2D ↔ 3D

Canvas de câblage. Pose les composants, relie les broches, et l'application
valide :

- tension incompatible (5 V sur une entrée 3,3 V non tolérante)
- masse commune absente
- SDA relié à SCL, **adresses I2C dupliquées**
- liaison série non croisée (TX ↔ TX)
- moteur relié directement à une sortie logique
- budget de courant dépassé, en régime établi et en pointe
- broche d'activation d'un driver laissée en l'air

Sorties : nomenclature CSV, bilan de puissance, export JSON.

La bascule **Robot** montre l'implantation physique. Chaque composant est
reconstruit en 3D aux cotes réelles : un Raspberry Pi a son circuit vert, sa
barrette de 40 broches dorées, ses deux blocs USB et sa prise Ethernet ; un
motoréducteur a sa cloche, son réducteur et son arbre de sortie ; un RPLIDAR
a sa tête tournante et sa fenêtre optique. La position des cartes sur le
canvas devient leur position sur le châssis, la hauteur vient de leur rôle
(masse en bas, calcul au milieu, perception sur le mât). Le plateau supérieur
est translucide, les fils suivent un cheminement plausible, et la longueur
totale de câble à prévoir est estimée.

### Node Graph Simulator · 2D ↔ 3D

Construis un graphe de nœuds et de topics. La validation reproduit la
négociation DDS : types de messages, **compatibilité QoS**, topics orphelins,
double publication sur `/tf` ou `/cmd_vel`. Lecture animée du flux avec un
`ros2 topic echo` simulé.

La bascule **Couches** répartit les nœuds en profondeur selon leur distance
aux capteurs — sources, traitement, décision, commande — ce qui rend lisible
le trajet de la donnée. Les liaisons rompues restent en pointillés rouges et
ne transportent aucun paquet.

### Robot Forge · 3D ↔ plan coté

Quatre archétypes — rover différentiel, bras 6 axes, AMR d'extérieur, robot de
table. Choisis le matériel, ajuste les cotes, et récupère un projet ROS 2
complet en `.zip` : `package.xml`, `setup.py`, nœuds Python, launch files en
couches, URDF xacro avec inerties calculées, configurations EKF / SLAM / Nav2,
règles udev, service systemd, nomenclature et schéma de câblage.

Aperçu temps réel du modèle, avec bascule **3D / Plan** : la vue 3D — roues
à crampons et à rayons, LiDAR rotatif, roulette à bille — pour juger de
l'allure, le plan technique coté — vue de dessus et vue de côté, en
millimètres — pour percer le châssis. Le plan affiche aussi les valeurs
dérivées qui comptent : rayon de collision Nav2, circonférence de roue,
garde au sol.

### Et aussi

Glossaire (60 entrées), référence des commandes `ros2` (42 commandes),
arbre de dépannage interactif, recherche globale ⌘K, progression avec XP et
badges.

---

## Démarrage

```bash
npm install
npm run dev
```

Le site tourne sur <http://localhost:3000>. **Aucune configuration n'est
nécessaire** : sans base de données, la progression, les montages et les
projets sont enregistrés dans le `localStorage` du navigateur, et toutes les
fonctionnalités sont disponibles.

## Activer les comptes utilisateurs

Optionnel. Utile pour retrouver sa progression sur plusieurs machines.

### Le chemin court

```bash
bash scripts/setup-vercel.sh
```

Le script installe la CLI Vercel si besoin, lie le projet, génère
`AUTH_SECRET`, l'écrit dans les trois environnements Vercel et dans ton `.env`
local, te demande ta `DATABASE_URL`, applique le schéma Prisma et redéploie.
Il confirme avant chaque écriture et ne fait rien de destructif.

### À la main

1. Provisionne une base PostgreSQL — Vercel Postgres, [Neon](https://neon.tech)
   ou [Supabase](https://supabase.com), les trois ont une offre gratuite.
2. Copie `.env.example` vers `.env` et renseigne :

```bash
DATABASE_URL="postgresql://user:motdepasse@hote/base?sslmode=require"
AUTH_SECRET="$(openssl rand -base64 32)"
```

3. Applique le schéma :

```bash
npx prisma db push
```

4. Reporte les deux variables dans Vercel : **Settings → Environment
   Variables**, pour Production, Preview et Development. Redéploie ensuite,
   les variables ne sont lues qu'au build.

Le basculement est automatique : dès que `DATABASE_URL` est présent,
l'adaptateur de stockage (`lib/storage/adapter.ts`) passe par l'API au lieu du
`localStorage`. Sans elle, le site reste intégralement utilisable.

## Déploiement sur Vercel

1. Importe le dépôt dans Vercel.
2. Ajoute `DATABASE_URL` et `AUTH_SECRET` — ou n'ajoute rien, le site
   fonctionne sans.
3. Déploie. `prisma generate` tourne automatiquement au `postinstall` et au
   `build`.

> **Vercel Postgres** injecte ses propres variables, dont
> `POSTGRES_PRISMA_URL`. Dans ce cas, ajoute une variable `DATABASE_URL` qui
> reprend cette valeur, ou change `env("DATABASE_URL")` en
> `env("POSTGRES_PRISMA_URL")` dans `prisma/schema.prisma`.

---

## Structure

```
app/
├── (site)/              pages publiques
│   ├── page.tsx         accueil
│   ├── academy/         parcours et leçons
│   ├── codex/           catalogue de composants
│   ├── atelier/         Atelier : coder ROS 2 et simuler
│   ├── lab/wiring/      Wiring Lab
│   ├── lab/graph/       Node Graph Simulator
│   ├── forge/           Robot Forge
│   ├── glossaire/  terminal/  depannage/  profil/
│   └── connexion/  inscription/
└── api/                 auth, progression, projets

content/                 tout le contenu pédagogique, typé en TypeScript
├── tracks/              6 parcours, 25 leçons
├── components/          60 fiches composants avec brochage
├── sim/                 12 missions, 3 robots simulables, 4 arènes
├── quiz.ts  glossary.ts  cli.ts  msgs.ts  archetypes.ts  troubleshoot.ts

lib/
├── sim/py/              le shim rclpy et les paquets de messages, en Python
├── sim/worker/          Pyodide dans un Web Worker, boucle de simulation
├── sim/physics.ts       diff-drive, LiDAR par lancer de rayons, collisions
├── sim/bus.ts           middleware simulé, branché sur la règle QoS
├── sim/objectifs.ts     prédicats de validation des missions
├── sim/export.ts        script → paquet ament_python
├── three/models.ts      modèles 3D procéduraux des composants
├── three/dimensions.ts  encombrement réel, en mètres
├── wiring/rules.ts      moteur de validation du câblage
├── wiring/layout3d.ts   schéma 2D → implantation physique
├── graph/validate.ts    compatibilité QoS et types de messages
├── graph/layout3d.ts    répartition des nœuds en couches
├── forge/generate.ts    génération du projet ROS 2
├── storage/             adaptateur base de données ↔ localStorage
├── auth/session.ts      JWT en cookie httpOnly
└── db/prisma.ts

components/              interface, découpée par domaine
├── three/scene-canvas    socle three.js partagé par les trois vues 3D
├── forge/plan-2d         plan technique coté, en SVG
├── lab/wiring-3d         implantation physique sur le châssis
├── lab/graph-3d          graphe en couches
└── sim/                  éditeur, vues 2D/3D du monde, console, missions
prisma/schema.prisma     User, LessonProgress, QuizAttempt, UserBadge, Project
```

## Vérifier

```bash
npm run verifier:missions        # les 12 missions, sous CPython
```

Ce banc d'essai ne passe pas par le navigateur : Node tient la boucle, la
physique et le bus — le code du worker — et un vrai `python3` exécute le shim
`rclpy` et le script de chaque mission. Il vérifie que le code de départ
s'exécute sans planter et que la solution atteint tous ses objectifs. Une
mission dont la solution ne passe plus est un bug, pas un détail.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma + PostgreSQL ·
zustand · three.js · CodeMirror 6 · Pyodide · JSZip

Le runtime Python (~13 Mo) n'est pas versionné : `scripts/copier-pyodide.mjs`
le copie de `node_modules` vers `public/pyodide` avant chaque build. Il est
servi par le site plutôt que par un CDN — pas de tiers, pas de panne externe,
et il reste en cache après le premier lancement.

## Images

Les visuels vivent dans `public/images/` : le robot du hero, l'image de partage,
la texture de grain, quatre rendus d'archétypes et six vignettes de parcours.

`IMAGE_PROMPTS.md` conserve le prompt de chaque visuel, son chemin cible et ses
dimensions — utile pour en régénérer un ou produire une variante. Remplace un
fichier au même chemin, la mise en page suit sans modification de code.

---

## Avertissement

Contenu pédagogique indépendant, sans lien avec Open Robotics ni les fabricants
cités. Les prix sont indicatifs et les brochages simplifiés : **vérifie toujours
la datasheet du composant avant de câbler**. Un montage validé par le Wiring
Lab reste un montage validé par un modèle, pas par un multimètre.
