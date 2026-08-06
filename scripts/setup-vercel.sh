#!/usr/bin/env bash
#
# Configure les variables d'environnement de LivretV sur Vercel et applique
# le schéma Prisma à la base.
#
# À lancer depuis TA machine, une seule fois :
#
#     bash scripts/setup-vercel.sh
#
# Le script ne fait rien de destructif : il te montre ce qu'il va écrire et
# demande confirmation avant chaque variable.

set -euo pipefail

vert()  { printf '\033[0;32m%s\033[0m\n' "$1"; }
jaune() { printf '\033[0;33m%s\033[0m\n' "$1"; }
rouge() { printf '\033[0;31m%s\033[0m\n' "$1"; }
titre() { printf '\n\033[1m── %s ──\033[0m\n' "$1"; }

ENVS=(production preview development)

# ─────────────── 1. Outils ───────────────

titre "Vérification des outils"

if ! command -v vercel >/dev/null 2>&1; then
  jaune "La CLI Vercel n'est pas installée."
  read -r -p "L'installer maintenant (npm i -g vercel) ? [o/N] " rep
  [[ "$rep" =~ ^[oOyY]$ ]] || { rouge "Abandon."; exit 1; }
  npm install -g vercel
fi
vert "CLI Vercel : $(vercel --version)"

if ! vercel whoami >/dev/null 2>&1; then
  jaune "Tu n'es pas connecté à Vercel."
  vercel login
fi
vert "Connecté en tant que $(vercel whoami)"

# ─────────────── 2. Lien du projet ───────────────

titre "Lien avec le projet Vercel"

if [ ! -f .vercel/project.json ]; then
  jaune "Ce dossier n'est lié à aucun projet Vercel."
  vercel link
fi
vert "Projet lié : $(node -p "require('./.vercel/project.json').projectId" 2>/dev/null || echo '?')"

# ─────────────── 3. AUTH_SECRET ───────────────

titre "AUTH_SECRET"

echo "Ce secret signe les jetons de session. Il doit rester privé et ne"
echo "jamais être commité."
read -r -p "Générer un nouveau secret et l'envoyer sur Vercel ? [o/N] " rep

if [[ "$rep" =~ ^[oOyY]$ ]]; then
  SECRET="$(openssl rand -base64 32)"
  for e in "${ENVS[@]}"; do
    # vercel env add refuse d'écraser : on retire d'abord, sans bruit.
    vercel env rm AUTH_SECRET "$e" --yes >/dev/null 2>&1 || true
    printf '%s' "$SECRET" | vercel env add AUTH_SECRET "$e" >/dev/null
    vert "  AUTH_SECRET → $e"
  done

  # Copie locale, pour que prisma et npm run dev fonctionnent tout de suite.
  touch .env
  grep -v '^AUTH_SECRET=' .env > .env.tmp 2>/dev/null || true
  mv .env.tmp .env 2>/dev/null || true
  printf 'AUTH_SECRET="%s"\n' "$SECRET" >> .env
  vert "  AUTH_SECRET → .env local"
else
  jaune "AUTH_SECRET ignoré."
fi

# ─────────────── 4. DATABASE_URL ───────────────

titre "DATABASE_URL"

cat <<'TXT'
Il te faut une base PostgreSQL. Trois voies, au choix :

  1. Vercel Postgres  — onglet Storage du projet, « Create Database ».
                        Vercel injecte alors POSTGRES_PRISMA_URL tout seul ;
                        dans ce cas réponds « n » ci-dessous et va à l'étape 5.
  2. Neon             — neon.tech, offre gratuite, chaîne fournie à la création.
  3. Supabase         — supabase.com, Settings → Database → Connection string.

La chaîne ressemble à :
  postgresql://user:motdepasse@hote/base?sslmode=require
TXT

read -r -p "Saisir une DATABASE_URL maintenant ? [o/N] " rep

if [[ "$rep" =~ ^[oOyY]$ ]]; then
  read -r -s -p "DATABASE_URL : " DBURL
  echo
  if [[ ! "$DBURL" =~ ^postgres(ql)?:// ]]; then
    rouge "Cette chaîne ne ressemble pas à une URL PostgreSQL. Abandon."
    exit 1
  fi

  for e in "${ENVS[@]}"; do
    vercel env rm DATABASE_URL "$e" --yes >/dev/null 2>&1 || true
    printf '%s' "$DBURL" | vercel env add DATABASE_URL "$e" >/dev/null
    vert "  DATABASE_URL → $e"
  done

  touch .env
  grep -v '^DATABASE_URL=' .env > .env.tmp 2>/dev/null || true
  mv .env.tmp .env 2>/dev/null || true
  printf 'DATABASE_URL="%s"\n' "$DBURL" >> .env
  vert "  DATABASE_URL → .env local"

  titre "Application du schéma Prisma"
  read -r -p "Créer les tables dans cette base (prisma db push) ? [o/N] " rep2
  if [[ "$rep2" =~ ^[oOyY]$ ]]; then
    npx prisma db push
    vert "Tables créées."
  else
    jaune "Schéma non appliqué. À faire avant la première connexion :"
    echo "    npx prisma db push"
  fi
else
  jaune "DATABASE_URL ignorée — le site restera en mode localStorage."
fi

# ─────────────── 5. Redéploiement ───────────────

titre "Redéploiement"

echo "Les variables ne sont prises en compte qu'au prochain build."
read -r -p "Redéployer en production maintenant ? [o/N] " rep
if [[ "$rep" =~ ^[oOyY]$ ]]; then
  vercel --prod
else
  jaune "Pense à redéployer : vercel --prod"
fi

titre "Terminé"
cat <<'TXT'
Vérifications utiles :

  vercel env ls                 les variables réellement enregistrées
  npx prisma studio             inspecter la base
  npm run dev                   le site en local, avec la base

Rappel : .env contient maintenant des secrets. Il est déjà dans .gitignore,
laisse-le y rester.
TXT
