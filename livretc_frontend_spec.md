# Livret C — Frontend Next.js + Tailwind (Web2 UI, Web3 en back **invisible**) — SPEC POUR VIBECODING

Objectif : générer un **frontend Next.js + Tailwind** (sans backend) **fonctionnel** et navigable, avec des parcours complets :
- Connexion “Web2 feel” (email/passkey simulé) → création d’un **Smart Account** (AA) simulé
- Marketplace pour acheter des **parts de fermes** (éolien / solaire / hydro)
- Portfolio : allocations, PnL, historique
- Rendements : claim, auto-claim, preuves par “epochs”
- Auto-reinvest / DCA
- Baskets / Index de fermes (achat 1 clic)
- Second marché : revendre des parts (instant price/offer-accept simulé)
- Pages “fermes” : carte, data room, production, incidents, score risque
- Milestone escrow (étapes) + Safety fund (réserve) **visuels + logique simulée**

⚠️ **Aucun backend requis** : tout doit fonctionner avec **mock data** + **state local** (localStorage). Les actions (buy/claim/sell) doivent modifier l’état et l’historique comme si c’était on-chain.

---

## 1) Stack & contraintes

### Tech
- Next.js (App Router) + TypeScript
- TailwindCSS
- UI kit autorisé : **shadcn/ui** (recommandé) ou composants maison Tailwind
- State : Zustand (recommandé) ou React Context + useReducer
- Charts : Recharts
- Map : `react-leaflet` (ou fallback statique si besoin)
- Icons : lucide-react
- Dates : dayjs
- Persist : localStorage (avec hydration safe côté client)

### Contraintes produit
- L’utilisateur ne voit **jamais** “blockchain”, “USDC”, “NFT”, “wallet”. Toujours “$”, “parts”, “farm shares”.
- AA = **Smart Account** simulé : une adresse hex affichable seulement dans “Détails” (optionnel).
- Les actions doivent être “instantanées” côté UI (optimistic updates).

### Definition of Done (DoD)
- `npm run dev` → app utilisable, aucune page blanche, navigation complète
- On peut :
  - se connecter
  - acheter des parts
  - voir son portfolio se mettre à jour
  - voir/claim des rendements
  - activer auto-claim / auto-reinvest
  - acheter un basket
  - revendre des parts sur second marché (simulé)
  - consulter une ferme (data room + production + incidents)
  - voir une “preuve de payout” par epoch (hash simulé)
- Persistance : refresh navigateur conserve session + holdings + historique

---

## 2) Structure de projet demandée

Utiliser App Router.

```
app/
  (public)/
    page.tsx                 # Landing marketing
    layout.tsx               # Layout public
  app/
    layout.tsx               # Layout privé (sidebar + topbar)
    page.tsx                 # Dashboard overview (entry)
    portfolio/page.tsx
    rewards/page.tsx
    marketplace/page.tsx
    marketplace/baskets/page.tsx
    marketplace/secondary/page.tsx
    farms/page.tsx
    farms/[farmId]/page.tsx
    settings/page.tsx
  admin/
    page.tsx                 # Panel de simulation (hidden link)
components/
  ui/                        # shadcn (si utilisé)
  layout/                    # Sidebar, Topbar, AppShell
  cards/                     # FarmCard, BasketCard, PositionRow, etc.
  charts/                    # AllocationPie, ProductionArea, PnLLine
  tables/                    # TxTable, PositionsTable, OrdersTable
  modals/                    # BuyModal, SellModal, ClaimModal
  map/                       # FarmsMap
lib/
  mock/                      # mock datasets
  store/                     # zustand stores + persistence
  utils/                     # format$, helpers risk, hash fake
  types.ts                   # types
public/
  images/                    # placeholders
```

---

## 3) Design system (simple, fintech)

- Palette neutre (gris/bleu) + accents (success/warn/danger)
- Layout :
  - Sidebar (Dashboard, Portfolio, Rewards, Marketplace, Farms, Settings)
  - Topbar : recherche (fake), notifications, profil
- Mobile-first : sidebar devient drawer
- Composants standards : Card, Button, Badge, Tabs, Dialog, Table, Skeleton, Toast

---

## 4) Modèles de données (TypeScript)

Créer `lib/types.ts` avec les types suivants (minimum) :

- `User`
  - `id`, `email`, `displayName`
  - `smartAccountAddress` (string)
  - `createdAt`
  - `settings` : autoClaim, autoReinvest, preferredBasketId, notifications

- `Farm`
  - `id`, `name`, `type` ("SOLAR" | "WIND" | "HYDRO")
  - `country`, `city`, `lat`, `lng`
  - `status` ("FUNDING" | "BUILDING" | "LIVE" | "MAINTENANCE")
  - `capacityMW`, `expectedAnnualMWh`
  - `riskScore` (0-100) + `riskBadge` ("LOW"|"MEDIUM"|"HIGH")
  - `pricePerShareUSD` (number)
  - `sharesAvailable` (number)
  - `kpis`: { loadFactorPct, uptimePct, curtailmentPct, lastMonthMWh }
  - `timeline`: array milestones (date, title, description)
  - `dataRoom`: array docs (title, type, url placeholder)
  - `productionSeries`: timeseries (date, mwh, revenueUSD)
  - `incidents`: array (date, severity, title, description)

- `Basket`
  - `id`, `name`, `description`, `riskBadge`
  - `composition`: [{ farmId, weightPct }]
  - `pricePerUnitUSD` (computed from farms)
  - `apyEstimatePct` (mock)

- `Position`
  - `farmId`, `shares`
  - `avgBuyPriceUSD`
  - `unrealizedPnLUSD` (computed)
  - `claimableUSD` (computed from distributor state)

- `Epoch`
  - `id`, `farmId`, `periodLabel` (e.g. "2026-02")
  - `totalRevenueUSD`
  - `timestamp`
  - `proofHash` (fake tx hash)
  - `status` ("ANNOUNCED"|"FUNDED"|"CLAIMABLE")

- `Transaction`
  - `id`, `type` ("DEPOSIT"|"BUY_SHARES"|"SELL_SHARES"|"CLAIM"|"BUY_BASKET")
  - `timestamp`
  - `amountUSD`
  - `meta` (farmId, basketId, shares, epochId, pricePerShareUSD)

- `SecondaryOrder`
  - `id`, `farmId`, `sellerAddress`, `shares`, `askPricePerShareUSD`
  - `status` ("OPEN"|"FILLED"|"CANCELLED")

---

## 5) Mock data (obligatoire)

Créer `lib/mock/farms.ts`, `baskets.ts`, `epochs.ts`, `orders.ts` avec :
- 6 fermes min :
  - 2 solaire (FR/ES)
  - 2 éolien (DE/DK)
  - 2 hydro (NO/CH)
- 3 baskets min :
  - “Panier Solaire”, “Panier Éolien”, “Panier Diversifié”
- 2 epochs par ferme (dont 1 claimable)
- 5 ordres second marché

Inclure des photos placeholder (public/images/farms/*).

---

## 6) State management (fonctionnel, persistant)

Créer un store Zustand :
- `authStore` : user, login/logout, createSmartAccount (fake)
- `portfolioStore` :
  - balances: `cashUSD` (simulé), positions par ferme, basket holdings
  - transactions: append + persist
  - methods: `buyShares`, `sellShares`, `buyBasket`, `claimRewards`, `toggleAutoClaim`, `toggleAutoReinvest`
- `marketStore` : secondary orders (open/filled), `placeOrder`, `fillOrder`, `cancelOrder`
- `farmStore` : incidents, production series overrides (si admin sim)
- `uiStore` : toasts, modals

Persistance :
- Sauver stores clés dans localStorage (`zustand/middleware` persist)
- Hydration safe : composants “use client” et guard `mounted`

---

## 7) Pages & fonctionnalités détaillées

### 7.1 Landing `/`
- Hero “Livret C — Investissement énergie (en $)”
- CTA : “Accéder à l’app”
- Sections : Comment ça marche, Sécurité (texte), FAQ
- Footer

### 7.2 App Dashboard `/app`
Cartes :
- Solde total ($)
- Rendements cumulés ($)
- Rendement mensuel estimé (mock)
- Risk score global (moyenne pondérée)
Charts :
- Allocation (pie: SOLAR/WIND/HYDRO)
- PnL (line 30 jours, mock)
List :
- Dernières transactions

### 7.3 Portfolio `/app/portfolio`
- Tableau positions par ferme :
  - Farm, Type, Shares, Avg price, Value, PnL, Claimable
  - Actions : “Acheter” / “Vendre” / “Détails”
- Répartition par zone (chips FR/ES/DE…)
- Historique transactions (filtre type/date)
- Export CSV (frontend-only) :
  - bouton “Exporter CSV” qui génère un fichier CSV du portfolio + tx

### 7.4 Rewards (Claim center) `/app/rewards`
- Total claimable (toutes fermes) + bouton “Retirer tout”
- Liste par ferme :
  - claimable, derniers epochs, bouton “Retirer”
- Auto-claim :
  - toggle + fréquence (mensuel)
  - affichage “prochaine exécution estimée” (mock)
- Payout proof :
  - section “Derniers paiements” → epoch list avec “Voir détails” (modal)
  - détail : période, montant, proofHash, status

### 7.5 Marketplace `/app/marketplace`
Tabs :
- “Fermes” : grid FarmCard (prix/part, risk badge, status)
- “Baskets” : lien vers /baskets
- “Second marché” : lien vers /secondary
FarmCard :
- CTA : “Acheter des parts” → modal achat
Buy modal :
- input `$ amount` ou `shares`
- résumé : parts reçues, prix, frais (mock 0.5%)
- confirm → update store + toast

### 7.6 Baskets `/app/marketplace/baskets`
- Liste BasketCard :
  - composition (mini bar), risk badge, apy estimate
- Achat 1 clic :
  - input $ → mint “units” basket (simulé)
  - répartir l’achat en parts de fermes selon weights (store update)
- Toggle “Auto-reinvest vers ce basket” (setting)

### 7.7 Second marché `/app/marketplace/secondary`
Deux modes (tabs) :
- “Instant price” (AMM simulé) :
  - choisir ferme, saisir shares, afficher quote buy/sell (spread mock)
  - exécuter (update positions)
- “Offers” :
  - liste ordres ouverts (Open)
  - bouton “Acheter” remplit l’ordre (update positions + tx)
  - bouton “Créer un ordre” (sell listing) : farm + shares + ask price

### 7.8 Farms map `/app/farms`
- Carte (Leaflet) avec pins fermes
- Filtre type + risk badge + status
- Liste à côté (responsive) + recherche (nom/ville/pays)
- Click ferme → /app/farms/[farmId]

### 7.9 Farm details `/app/farms/[farmId]`
Sections :
1) Header : nom, type, risk badge, status, prix/part, CTA Acheter
2) KPI cards : capacity, load factor, uptime, curtailment, lastMonthMWh
3) Production dashboard :
   - chart mwh/jour (ou mois) + revenue USD (2 séries)
4) Data room :
   - table docs (download fake)
5) Timeline :
   - milestones (signature → build → commissioning → live)
6) Incidents :
   - liste (severity badge), filter
   - si maintenance : banner “maintenance en cours”
7) “Milestone escrow” (visuel) :
   - barre de progression 30/40/30
   - statut current milestone + texte

### 7.10 Settings `/app/settings`
- Profil : email, smartAccount (masqué; bouton “Afficher”)
- Préférences :
  - auto-claim toggle
  - auto-reinvest toggle + basket target
  - notifications : email/push (simulé)
- Danger zone :
  - reset local data

### 7.11 Admin sim `/admin` (optionnel mais recommandé)
But : démontrer le système sans backend.
- Boutons :
  - “Simuler revenue epoch (farmId, amount $)” → ajoute epoch claimable + incrémente claimables
  - “Simuler incident” (farmId, severity)
  - “Changer risk score” (farmId, new score)
- Note : accès via URL (pas dans le menu)

---

## 8) Logique de calcul (mock, mais cohérente)

### 8.1 Valeur position
`positionValueUSD = shares * currentPricePerShareUSD`

### 8.2 PnL
`unrealizedPnLUSD = (currentPrice - avgBuyPrice) * shares`

### 8.3 Claimable
- `claimableUSD` calculé à partir des epochs “FUNDED/CLAIMABLE” non encore claim
- Pour MVP : stocker par user un set `claimedEpochIds` et calculer pro-rata :
  - `userSharePct = userShares / totalSharesSold` (mock totalSharesSold par ferme)
  - `userClaim = epoch.totalRevenueUSD * userSharePct`

### 8.4 Auto-claim / Auto-reinvest (simulé)
- Si auto-claim ON : au chargement app, si `lastAutoClaimAt` > 30j alors déclencher `claimAll()` (simulé)
- Si auto-reinvest ON : après claim, réinvestir claimable dans basket cible (simulé)

---

## 9) Composants requis (minimum)

- `AppShell`, `Sidebar`, `Topbar`
- `FarmCard`, `BasketCard`, `PositionRow`, `EpochRow`, `OrderRow`
- `BuySharesModal`, `SellSharesModal`, `ClaimModal`, `CreateOrderModal`
- Charts :
  - `AllocationPieChart`
  - `PnLLineChart`
  - `ProductionAreaChart`
- `FarmsMap` (Leaflet)
- `ToastProvider`

---

## 10) UX details (important)
- Toutes les actions doivent afficher :
  - confirmation toast
  - transaction row dans l’historique
  - update immédiate du portfolio
- Loading states : Skeletons sur charts/tables au 1er render
- Currency formatting :
  - `$1,234.56` (en-US) + gestion 0/2 décimales selon contexte
- Empty states :
  - portfolio vide
  - aucun claimable
  - aucun ordre

---

## 11) Instructions de build (à inclure dans README)
- `npm i`
- `npm run dev`
- Mentionner : “This is a frontend-only demo using localStorage mock data”

---

## 12) Bonus (si temps)
- Dark mode toggle
- Command palette (⌘K) pour navigation
- “Proof details” modal avec copier hash
- Recherche globale (fermes + tx) dans topbar

---

## 13) Copie (exemples de texte UI)
- “Investi” / “Rendements” / “Parts” / “Retirer” / “Acheter” / “Vendre”
- “Risque faible / moyen / élevé”
- “Production estimée” / “Revenus générés”
- “Paiement mensuel” / “Dernier paiement”

---

## 14) Résultat attendu
Un site qui ressemble à une app fintech, avec :
- parcours complet, pages complètes, interactions complètes
- data cohérente (même si simulée)
- aucune mention crypto en surface
- un mode admin pour simuler rendement/incident

Fin.
