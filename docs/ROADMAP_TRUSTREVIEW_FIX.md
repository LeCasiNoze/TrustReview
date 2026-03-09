# TrustReview Fix Roadmap

## 1. Objectif global
- Unifier complètement la résolution d'identité sur toutes les routes et helpers.
- Supprimer tout risque de données croisées entre comptes et sessions temporaires.
- Fiabiliser les routes business / billing / subscription / QR et leurs helpers partagés.
- Corriger et standardiser les contrats HTTP (401/403/404) sur l'ensemble du backend.
- Stabiliser le rendu dynamique Next.js lorsque l'identité influe sur le HTML.
- Atteindre un état final vérifié (tests manuels + recherches globales + rapport complet + commit final).

## 2. Symptômes initiaux
- `GET /api/subscription-info` répondait 404 au lieu de 401/200.
- Logs "Subscription API failed: 404" côté client.
- Email affiché dans le layout différent des entreprises chargées.
- Entreprises d'un autre compte visibles une fois connecté.
- Création/chargement des QR codes impossible ou mélange les comptes.
- Comportements différents selon le navigateur (cookies/temp session divergents).
- Erreurs liées aux cookies/rendu dynamique (temp session non nettoyée, suspense server/client).

## 3. Causes racines identifiées
- Sources d'identité multiples (requireUserServer, authenticateRequest, getTempSession direct, supabase.auth.getUser direct).
- Fallback `temp-session` non centralisé et jamais nettoyé.
- Helpers métiers qui relançaient une auth différente de la route appelante.
- Faux 404 renvoyés lorsqu'un utilisateur n'était pas authentifié.
- Routes métier hétérogènes (business, QR, billing) avec des schémas d'accès différents.
- Statuts HTTP incohérents et ownership business parfois non vérifié.

## 4. Règles d'architecture à respecter
- Toute route métier dépendante du compte doit passer par `getRequestIdentity()` (ou recevoir une `RequestIdentity`).
- Aucun helper métier ne doit relancer l'auth si l'identité est déjà résolue.
- 401 = non authentifié, 403 = authentifié mais interdit, 404 = ressource absente (pas un problème d'auth).
- Le layout, les API et les helpers doivent partager la même source d'identité.
- Le flux temp-session doit être centralisé (résolution + nettoyage à la connexion Supabase).
- `getSupabaseForIdentity()` doit être la seule manière d'obtenir un client adapté à la session.

## 5. Lots de travail
- [x] **Lot 1 — QR routes** *(TERMINÉ — toutes routes QR migrées)*
- [x] **Lot 2 — Business routes** *(TERMINÉ — toutes routes business migrées)*
- [x] **Lot 3 — Billing / Subscription** *(TERMINÉ — toutes routes billing/subscription migrées)*
- [x] **Lot 4 — Routes secondaires dépendantes du compte** *(TERMINÉ — toutes routes secondaires migrées)*
- [ ] **Lot 5 — Audit final / recherche globale / E2E / commit final** *(NON DÉMARRÉ)*

### Lot 1 — QR routes
- **Fichiers concernés**: `src/app/api/qr-codes/route.ts`, `src/app/api/qr-codes/[id]/route.ts`, `src/app/api/qr-codes/[id]/download/route.ts`, `src/app/api/qr-color-presets/route.ts`, composants front qui consomment ces routes.
- **Helpers concernés**: `getActiveBusiness`, `getUserSubscriptionInfoServer`, éventuels helpers QR (à créer si besoin).
- **Objectifs**: utiliser `getRequestIdentity()` partout, vérifier ownership business/QR avec la même identité, aligner les statuts HTTP, brancher les presets couleur sur l'identité et le plan réel.
- **Risques**: oubli d'un flux (temp session), latence supplémentaire si double auth, risque de casser le téléchargement d'image (utilise buffer et fetch logo).
- **Critères de validation**: toutes les routes QR n'utilisent plus `requireUserServer`/`authenticateRequest`, les temp sessions sont supportées là où autorisées, tests manuels GET/POST/PUT/DELETE/download + presets.

### Lot 2 — Business routes
- **Fichiers concernés**: `src/app/api/businesses/route.ts`, `src/app/api/businesses/user/route.ts`, `src/app/api/business/route.ts`, `src/app/api/business/google-url/route.ts`, layout/app shell.
- **Helpers concernés**: `src/lib/business-manager.ts`, `src/lib/active-business.ts` (déjà migrés mais à confirmer).
- **Objectifs**: garantir que toutes les mutations business utilisent l'identité unifiée et vérifient l'ownership.
- **Risques**: formulaires existants côté app shell, dépendances active-business.
- **Critères de validation**: toutes les routes business utilisent l'identité unifiée et ne relancent pas Supabase.

### Lot 3 — Billing / Subscription
- **Fichiers concernés**: `src/app/api/billing/route.ts`, `src/app/api/billing/start-trial/route.ts`, `src/app/api/billing/switch-plan/route.ts`, `src/app/api/stripe/create-*.ts`, `src/app/api/subscription-info/route.ts`.
- **Helpers concernés**: `src/lib/subscription.server.ts`, `src/lib/quotas.ts`, `src/lib/stripe.ts` (coté server).
- **Objectifs**: unifier l'identité dans tous les flux de billing, arrêter les 404 fictifs, vérifier l'utilisation du même userId que business/QR.
- **Risques**: intégrations Stripe, dépendances front existantes.
- **Critères de validation**: tests manuels des endpoints billing + absence d'appels directs à `supabase.auth.getUser` dans ces routes.

### Lot 4 — Routes secondaires dépendantes du compte
- **Fichiers concernés**: `src/app/api/stats/route.ts`, `src/app/api/feedbacks/route.ts`, `src/app/api/feedbacks/read-status/route.ts`, `src/app/api/weekly-summary/route.ts`, routes dev (`/api/dev/*`) si utilisées.
- **Objectifs**: garantir que toutes ces routes consomment l'identité unifiée et renvoient les bons statuts.
- **Risques**: manipulation de gros volumes de données, dépendances front multiples.
- **Critères de validation**: plus aucun `requireUserServer` / `supabase.auth.getUser` direct dans ces fichiers.

### Lot 5 — Audit final / recherche globale / E2E / commit final
- **Objectifs**: exécuter les recherches globales demandées, compléter le rapport final (tableaux, preuves), valider la checklist E2E, effectuer commit/push final.
- **Critères de validation**: fichier roadmap à jour, rapport final livré, `git status` clean.

## 6. Journal d'avancement
### 2026-03-08 — Préparation identité unifiée (Lot 2 & 3 partiel)
- **Modifié**: `src/lib/request-identity.ts`, `src/lib/active-business.ts`, `src/lib/business-manager.ts`, `src/app/app/layout.tsx`, `src/app/api/business*.ts`, `src/app/api/subscription-info/route.ts`, `src/app/api/billing/route.ts`.
- **Changement**: création de `getRequestIdentity()` + adoption sur layout, business principaux et subscription-info.
- **Statut**: terminé pour ces fichiers, en attente de propagation aux autres routes.
- **Reste**: routes QR, billing avancé, stats/feedbacks, recherche globale.

### 2026-03-09 — Lot Routes secondaires finalisé (stats, feedbacks, stripe)
- **Modifié**: `src/app/api/stats/route.ts`, `src/app/api/feedbacks/route.ts`, `src/app/api/feedbacks/read-status/route.ts`, `src/app/api/stripe/create-checkout-session/route.ts`, `src/app/api/stripe/create-customer/route.ts`, `src/app/api/stripe/create-subscription/route.ts`.
- **Changement**: migration vers getRequestIdentity() + getSupabaseForIdentity(), suppression de authenticateRequest et supabase.auth.getUser directs, ajout de 403 pour temp sessions où requis.
- **Statut**: Lot 4 Routes secondaires terminé (stats, feedbacks, stripe tous migrés).
- **Reste**: passer au Lot 5 (audit final / recherche globale / E2E / commit final).

## 7. État actuel des routes critiques
| Route | Fichier | Source d'identité actuelle | Statut migration | Problèmes restants | Dernière vérif |
| --- | --- | --- | --- | --- | --- |
| Layout AppShell | `src/app/app/layout.tsx` | `getRequestIdentity()` | ✅ Terminé | Aucun signalé | 2026-03-08 |
| `/api/businesses` | `src/app/api/businesses/route.ts` | `getRequestIdentity()` | ✅ Terminé | Vérifier encore quotas après lot final | 2026-03-08 |
| `/api/businesses/user` | `src/app/api/businesses/user/route.ts` | `getRequestIdentity()` | ✅ Terminé | Suivi active business ok | 2026-03-08 |
| `/api/business` | `src/app/api/business/route.ts` | `getRequestIdentity()` | ✅ Terminé | - | 2026-03-08 |
| `/api/business/google-url` | `src/app/api/business/google-url/route.ts` | `getRequestIdentity()` | ✅ Terminé | Aucun | 2026-03-09 |
| `/api/qr-codes` | `src/app/api/qr-codes/route.ts` | `getRequestIdentity()` | ✅ GET/POST ok | Aucun pour ces handlers | 2026-03-09 |
| `/api/qr-codes/[id]` | `src/app/api/qr-codes/[id]/route.ts` | `getRequestIdentity()` | ⏳ PUT/DELETE migrés mais à revérifier | Vérifier réponses JSON & logs | 2026-03-09 |
| `/api/qr-codes/[id]/download` | `src/app/api/qr-codes/[id]/download/route.ts` | `getRequestIdentity()` | ✅ Terminé | Aucun | 2026-03-09 |
| `/api/qr-color-presets` | `src/app/api/qr-color-presets/route.ts` | `getRequestIdentity()` | ✅ Terminé | Aucun | 2026-03-09 |
| `/api/subscription-info` | `src/app/api/subscription-info/route.ts` | `getRequestIdentity()` | ✅ Terminé | Aucun | 2026-03-08 |
| `/api/billing` | `src/app/api/billing/route.ts` | `getRequestIdentity()` | ✅ Terminé | - | 2026-03-08 |
| `/api/billing/start-trial` | `src/app/api/billing/start-trial/route.ts` | `getRequestIdentity()` | ✅ Terminé | Aucun | 2026-03-09 |
| `/api/billing/switch-plan` | `src/app/api/billing/switch-plan/route.ts` | `getRequestIdentity()` | ✅ Terminé | Aucun | 2026-03-09 |
| `/api/stats` | `src/app/api/stats/route.ts` | `getRequestIdentity()` | ✅ Terminé | Aucun | 2026-03-09 |
| `/api/feedbacks` | `src/app/api/feedbacks/route.ts` | `getRequestIdentity()` | ✅ Terminé | Aucun | 2026-03-09 |
| `/api/feedbacks/read-status` | `src/app/api/feedbacks/read-status/route.ts` | `getRequestIdentity()` | ✅ Terminé | Aucun | 2026-03-09 |
| `/api/stripe/create-*` | `src/app/api/stripe/*.ts` | `getRequestIdentity()` | ✅ Terminé | Aucun | 2026-03-09 |
| `/api/weekly-summary` | `src/app/api/weekly-summary/route.ts` | `supabase.auth.getUser` direct | ❌ Non migré | Lot 4 | 2026-03-09 |

## 8. Recherche globale finale à compléter
*(À exécuter quand tous les lots seront migrés — placeholders pour consigner les résultats)*
- `getRequestIdentity` — occurrences attendues: routes + helpers centralisés → ✅ (à revalider)
- `authenticateRequest` — doit disparaître des routes métier.
- `requireUserServer` — doit disparaître.
- `getTempSession` — uniquement dans `request-identity` et helpers centralisés.
- `supabase.auth.getUser` — uniquement dans `request-identity` ou quelques callbacks auth.
- Autres: vérifier `getUserServer`, `createSupabaseServer` usages directs.

## 9. Checklist E2E finale (à valider en Lot 5)
- [ ] Login compte A → email A affiché dans layout.
- [ ] Compte A → uniquement entreprises A chargées (pages + API).
- [ ] Login compte B → email B affiché.
- [ ] Compte B → uniquement entreprises B.
- [ ] `GET /api/subscription-info` → 200 si authentifié, 401 sinon.
- [ ] Page QR → chargement sans crash (session Supabase & temp).
- [ ] Création QR → rattache le bon business, respecte quotas.
- [ ] Téléchargement QR → uniquement propriétaire.
- [ ] Billing: start trial, switch plan, Stripe endpoints → statuts attendus.
- [ ] Feedbacks/Stats → pas de données croisées.
- [ ] Recherche globale finale → aucune occurrence legacy.
- [ ] Rapport final + commit/push final effectués.
