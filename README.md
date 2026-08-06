# LivretV

**Apprendre la robotique ROS 2, du premier node au robot complet.**

Plateforme d'apprentissage en français : théorie, catalogue de composants,
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

1. Provisionne une base PostgreSQL — Vercel Postgres, Neon ou Supabase.
2. Copie `.env.example` vers `.env` et renseigne :

```bash
DATABASE_URL="postgresql://…"
AUTH_SECRET="$(openssl rand -base64 32)"
```

3. Applique le schéma :

```bash
npx prisma db push
```

Le basculement est automatique : dès que `DATABASE_URL` est présent,
l'adaptateur de stockage (`lib/storage/adapter.ts`) passe par l'API au lieu du
`localStorage`.

## Déploiement sur Vercel

1. Importe le dépôt dans Vercel.
2. Ajoute `DATABASE_URL` et `AUTH_SECRET` dans les variables d'environnement du
   projet — ou n'ajoute rien, le site fonctionne sans.
3. Déploie. `prisma generate` tourne automatiquement au `postinstall` et au
   `build`.

---

## Structure

```
app/
├── (site)/              pages publiques
│   ├── page.tsx         accueil
│   ├── academy/         parcours et leçons
│   ├── codex/           catalogue de composants
│   ├── lab/wiring/      Wiring Lab
│   ├── lab/graph/       Node Graph Simulator
│   ├── forge/           Robot Forge
│   ├── glossaire/  terminal/  depannage/  profil/
│   └── connexion/  inscription/
└── api/                 auth, progression, projets

content/                 tout le contenu pédagogique, typé en TypeScript
├── tracks/              6 parcours, 25 leçons
├── components/          60 fiches composants avec brochage
├── quiz.ts  glossary.ts  cli.ts  msgs.ts  archetypes.ts  troubleshoot.ts

lib/
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
└── lab/graph-3d          graphe en couches
prisma/schema.prisma     User, LessonProgress, QuizAttempt, UserBadge, Project
```

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma + PostgreSQL ·
zustand · three.js · JSZip

## Images

Le site utilise des placeholders SVG générés dans sa propre palette. Pour les
remplacer par de vrais visuels, `IMAGE_PROMPTS.md` contient les prompts prêts à
coller dans une IA de génération d'images, avec le chemin cible et les
dimensions de chaque fichier.

---

## Avertissement

Contenu pédagogique indépendant, sans lien avec Open Robotics ni les fabricants
cités. Les prix sont indicatifs et les brochages simplifiés : **vérifie toujours
la datasheet du composant avant de câbler**. Un montage validé par le Wiring
Lab reste un montage validé par un modèle, pas par un multimètre.
