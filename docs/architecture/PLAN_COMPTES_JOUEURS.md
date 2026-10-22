# Plan — Comptes joueurs, pseudo et nom du vaisseau

*21 octobre 2026 — plan validé et réalisé (étapes 1 à 7). Migrations 00046 à 00048 appliquées en production après sauvegarde. Points restants avant une mise en ligne : §9.*

Avant ce plan, l'app n'avait aucune authentification : tous les visiteurs partageaient le vaisseau prototype (`ships.user_id IS NULL`), et les signaux / observations étaient rattachés à un identifiant de session stocké dans le navigateur (`lib/session.js`). Le plan a introduit un compte par joueur, un vaisseau par compte, et des règles d'accès (RLS) qui protègent les données de chacun. Référence à jour du schéma et des règles : `docs/reference/Documentation-backend.md` (§3, §7).

---

## 1. Décisions

| Sujet | Décision |
|---|---|
| Inscription | **Email obligatoire** (email + mot de passe) avant de jouer |
| Pseudo | Choisi à la création de la partie, **privé**, **non unique** |
| Nom du vaisseau | Choisi à la création de la partie, **privé** ; la classe reste « ARCA » (`ships.classe`) |
| Anonymat (GDD) | Inchangé : les autres joueurs ne voient ni pseudo, ni nom de vaisseau — « Génération 7 — vaisseau inconnu » |
| Rôles | `player` par défaut, `admin` attribué à la main en SQL. La **Vue 3D étoiles** (`/conception-etoiles`, outil de conception) est réservée aux admins : absente du menu et route refusée pour un joueur |
| Connexion | Email + mot de passe uniquement (pas de lien magique pour l'instant) |
| Modifications | Pseudo et nom du vaisseau modifiables à volonté |
| Données du prototype | Supprimées (vaisseau partagé et données de jeu associées) ; le mode démo hors ligne (Supabase non configuré) est conservé |
| Évolution prévue | Le joueur pourra signer ses traces avec son pseudo. Comme les pseudos ne sont pas uniques et qu'aucun lien vers le compte n'est exposé, impossible de savoir si deux « Julien » sont la même personne — c'est voulu |

**Conséquence pour les signatures futures** : la trace stockera une **copie texte** du pseudo au moment du dépôt (`traces.signature`), jamais une référence au compte ou au vaisseau. Changer de pseudo ensuite ne modifie pas les traces déjà signées, et rien ne permet de relier deux signatures.

---

## 2. Parcours joueur

```
/inscription ──► email de confirmation ──► /connexion
                                              │
                         ┌────────────────────┴────────────────────┐
                    pas de vaisseau                           vaisseau existant
                         │                                          │
                   /bienvenue                                  Observatoire
       (pseudo + nom du vaisseau → création de la partie)
```

- **Garde de routeur** : non connecté → `/connexion` ; connecté sans vaisseau → `/bienvenue` ; route admin (`meta.requiresAdmin`) sans rôle admin → Observatoire ; sinon accès normal. Les pages d'authentification utilisent la mise en page sans header ni barre d'instruments (comme `/conception-etoiles`).
- **Pages** : `/inscription`, `/connexion`, `/mot-de-passe-oublie`, `/nouveau-mot-de-passe` (lien de l'email), `/bienvenue`.
- **Déconnexion** : dans le header.
- **Modifier pseudo / renommer le vaisseau** : section « Identité » de la page Systèmes (déjà présente dans `SYSTEMS_MENU_ITEMS`).

---

## 3. Modèle de données

### 3.1 Nouvelle table `profiles`

| Colonne | Type | Règle |
|---|---|---|
| `id` | UUID, PK, FK `auth.users(id)` ON DELETE CASCADE | un profil par compte |
| `pseudo` | TEXT NOT NULL | 2–24 caractères, espaces en bord retirés ; non unique |
| `role` | TEXT NOT NULL DEFAULT `'player'` | `'player'` ou `'admin'` ; **non modifiable par le joueur** (seul `pseudo` est modifiable via RLS / droits par colonne) |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

RLS : le joueur lit et modifie **uniquement son profil**, et seulement la colonne `pseudo`. Aucune lecture publique.
Passer un compte en admin : `update profiles set role = 'admin' where id = '<uuid du compte>';` dans le SQL Editor.

### 3.2 `ships`

Déjà en place : `user_id` (FK `auth.users`, `UNIQUE`), `name NOT NULL`, `classe`, `built_year`.
Ajout : contrainte de longueur sur `name` (2–32 caractères).

### 3.3 Création de la partie : fonction `start_new_game(p_pseudo, p_ship_name)`

Fonction Postgres appelée par `/bienvenue`, qui crée **en une seule transaction** :

1. le profil (`profiles`) ;
2. le vaisseau (`ships`, `user_id = auth.uid()`, `current_system_id = 'SOL'`, état `IDLE`) ;
3. ses systèmes (`ship_systems`) et sa population (`populations`), avec les valeurs par défaut des tables (celles de l'ancien prototype) ;
4. le nœud Sol de la carte (`map_nodes`) ;
5. la copie des signaux modèles (démo).

Elle refuse si le joueur a déjà un vaisseau. Les valeurs initiales ne sont définies qu'à un endroit (les valeurs par défaut des tables), plus dans le seed.

### 3.4 Rattachement des données au joueur

| Table | Avant | Après |
|---|---|---|
| `signals` | `session_id` (navigateur) + `ship_id` | propriété par `ship_id` ; `session_id` facultatif, conservé pour les signaux modèles (`'seed-demo'`) |
| `observations` | `session_id` + `ship_id` | propriété par `ship_id` ; `session_id` facultatif (obsolète) |
| `lab_reports` | aucune colonne de propriétaire | propriété via `observation_id` → `observations.ship_id` |
| `interpretations` | `ship_id` jamais renseigné par l'app | `ship_id` renseigné à l'insertion ; **non exposé** en lecture |
| `traces` (dépôts joueur, plus tard) | `discovered_by` (ship_id) | + `signature TEXT` (copie du pseudo) ; `discovered_by` non exposé |

`lib/session.js` disparaît. Les signaux de démo (`session_id = 'seed-demo'`) deviennent des **modèles** (`ship_id` nul, lisibles par `start_new_game` seulement) et sont copiés dans le vaisseau du joueur à sa création, au lieu d'être clonés au premier chargement.

---

## 4. Règles d'accès (RLS)

Principe : **chaque joueur ne voit et ne modifie que ce qui appartient à son vaisseau** ; les données du monde (systèmes stellaires, objets, nébuleuses, traces immuables, Drake) restent en lecture publique.

| Table | Lecture | Écriture |
|---|---|---|
| `profiles` | soi | `pseudo` seulement (création via `start_new_game`) |
| `ships` | son vaisseau | modification de son vaisseau ; création via `start_new_game`, pas de suppression |
| `ship_systems`, `populations` | son vaisseau | aucune |
| `ship_travels`, `map_nodes`, `map_edges`, `logbook_entries`, `ship_traces` | son vaisseau | son vaisseau |
| `signals`, `observations` | son vaisseau | son vaisseau |
| `lab_reports` | via ses observations | via ses observations |
| `interpretations` | joueurs connectés, **sans** `ship_id` (droits par colonne) | insertion avec son `ship_id` ; suppression de ses seules interprétations |
| `traces` | joueurs connectés, sans `discovered_by` | dépôt joueur : plus tard |
| Données du monde | tous | aucune (import service_role) |

Les politiques « prototype » ouvertes (`USING (true)`, `user_id IS NULL`) ont été supprimées (`00048`). Les politiques « Users can manage own … » de la migration `00001` ont servi de base pour la carte, les voyages, le journal et les traces du vaisseau. Sans compte : aucune donnée de jeu.

---

## 5. Côté application

| Élément | Changement |
|---|---|
| `stores/auth.js` (nouveau) | session, utilisateur, profil, `hasShip`, `isAdmin` ; `init`, `signUp`, `signIn`, `signOut`, `requestPasswordReset`, `updatePassword`, `ensurePlayer`, `startNewGame`, `updatePseudo` ; écoute `onAuthStateChange` |
| `router/index.js` | routes d'authentification + garde `beforeEach` (attend la session initiale) ; `/conception-etoiles` marquée `requiresAdmin` |
| `constants/menus.js` / `InstrumentsBar` | l'entrée « Vue 3D étoiles » n'apparaît que pour un admin |
| `stores/ship.js` | `fetch()` lit le vaisseau du joueur après chargement de la session (un seul chargement à la fois) ; `renameShip()` |
| `stores/signaux.js`, `stores/observations.js` | filtrent et insèrent par `ship_id`, plus par `session_id` |
| `stores/traces.js` | interprétations : `ship_id` à l'insertion, suppression limitée aux siennes |
| `PagePopulation` | affiche la population du vaisseau (lue via le store `ship`) |
| Pages d'auth + `/bienvenue` | `AuthPanel`, `AppTextField`, boutons du design system, textes en français |
| Hors ligne (Supabase non configuré) | conserver le mode démo actuel (données de repli), sans authentification ; la Vue 3D étoiles y reste accessible (développement) |

---

## 6. Configuration Supabase (dashboard)

- **Auth → Providers → Email** : activé, confirmation d'email obligatoire.
- **URL Configuration** : `http://localhost:5173` et le futur domaine de production en *Site URL* / *Redirect URLs* (liens de confirmation et de réinitialisation).
- **Emails** : modèles en français (confirmation, réinitialisation). L'envoi par défaut de Supabase est très limité en débit : prévoir un SMTP personnalisé avant l'ouverture au public.
- **RGPD** : l'email est une donnée personnelle → page de confidentialité, et suppression du compte (le `ON DELETE CASCADE` depuis `auth.users` efface profil, vaisseau et données liées).

---

## 7. Étapes

| # | Étape | Vérification |
|---|---|---|
| 1 | Migration `00046_player_accounts.sql` : `profiles` (avec rôle), contrainte `ships.name`, `start_new_game`, signaux modèles détachés du prototype | ✅ 22 tests OK sur une base Postgres locale jetable ; **appliquée** le 21/10/2026 (transaction unique), vérifiée en base et via l'API anon ; app inchangée |
| 2 | `stores/auth.js`, pages d'inscription / connexion / mot de passe, garde de routeur, déconnexion dans le header | ✅ codée ; 14 tests (messages, validation, garde, redirections) ; pages et garde vérifiées dans le navigateur ; parcours réel inscription → email → connexion validé par le joueur |
| 3 | `/bienvenue` : pseudo + nom du vaisseau → `start_new_game` ; garde « connecté sans vaisseau → /bienvenue » ; store `ship` sur le vaisseau du joueur | ✅ codée ; 8 tests (règles pseudo / nom, erreurs, garde) ; écran et validation vérifiés ; partie réelle créée par le joueur (Artemis, vérifiée en base) |
| 4 | Migration `00047_signals_by_ship.sql` (`session_id` facultatif, `compute_pulsar_signals(ship, bande)` dédupliquée par vaisseau et réservée au propriétaire) ; stores signaux / observations par `ship_id` ; interprétations avec `ship_id` et génération ; `lib/session.js` et réinitialisation prototype supprimés | ✅ 11 tests SQL sur base jetable ; **appliquée** le 21/10/2026 après sauvegarde (`backups/avant_00047_20261021_201801.dump`) ; validée en jeu (15 signaux dont 8 pulsars) après correctif du chargement du vaisseau |
| 5 | Migration `00048_player_rls.sql` : suppression du prototype et de ses données ; politiques par joueur (vaisseau en lecture / modification, systèmes et population en lecture, signaux / observations / rapports par vaisseau) ; interprétations lisibles sans `ship_id` ; traces sans `discovered_by` ; RLS activée sur `constellations` / `constellation_lines` ; `TRUNCATE` retiré | ✅ 31 tests sur base jetable (deux joueurs, visiteur, nouveau joueur) ; **appliquée** le 21/10/2026 après sauvegarde (`backups/avant_00048_20261021_215732.dump`) ; API anonyme : aucune donnée de jeu ; app vérifiée en jeu |
| 6 | Identité dans la page Systèmes (modifier pseudo, renommer, composant `EditableValueRow`), déconnexion ; Vue 3D étoiles réservée aux admins (`meta.requiresAdmin`, entrée `adminOnly`) | ✅ 1 test de garde ; vérifié en jeu : édition et validation, compte admin (entrée + accès) et joueur simulé (entrée absente, URL redirigée) ; renommage réel du vaisseau et du pseudo validé par le joueur |
| 7 | Docs : backend (Auth, `profiles`, RPC, RLS, migrations 00034–00048, seed), technique, fonctionnelle (parcours joueur), status, README, suivi de l'audit ; `seed.sql` sans vaisseau prototype | ✅ relecture finale ; seed vérifié sur base jetable |

Les étapes 1 et 5 sont séparées pour que l'app reste utilisable pendant la transition : les nouvelles politiques arrivent avant que les anciennes soient supprimées.

---

## 8. Base de données : état et prérequis

**Base utilisée** : le projet de l'app (`utdzobspxeecxauwnkve`). Il n'existe pas de base de test séparée, et le connecteur Supabase de cette session pointe vers un autre projet, qui ne sera pas touché.

**État avant l'étape 1 (lecture seule, 21/10/2026)** : schéma conforme aux migrations du dépôt, aucun compte (`auth.users` vide), pas de table `profiles`.

| Données du prototype (supprimées par `00048`) | Lignes avant suppression |
|---|---|
| `ships` (ARCA partagé) | 1 |
| `signals` (93 sessions navigateur) | 2 504 (2 519 au moment de la suppression) |
| `observations` | 89 |
| `lab_reports` | 138 |
| `map_nodes` | 20 |
| `ship_travels` | 22 |
| `populations`, `ship_systems` | 1 + 1 |

**Accès direct à la base** (rétabli le 21/10/2026) : `SUPABASE_DB_URL` est valide. Avant chaque migration destructrice :

1. faire une **sauvegarde complète** : `/opt/homebrew/opt/libpq/bin/pg_dump "$SUPABASE_DB_URL" --schema=public --format=custom --no-owner --file=backups/<nom>.dump` (`pg_dump` 18 requis : la base est en Postgres 17.6 ; `npm run backup:db` demande Docker) ;
2. appliquer la migration en une transaction : `psql "$SUPABASE_DB_URL" --single-transaction -v ON_ERROR_STOP=1 -f supabase/migrations/<fichier>.sql`.

Plusieurs mots de passe refusés de suite font bannir l'IP sur le port 5432 (Dashboard → Database → Network Bans).

**Rejeu sur base vierge** : `seed.sql` ne crée plus le vaisseau prototype et ses signaux modèles n'ont plus de vaisseau ; `00015` ne bloque donc plus (ses insertions sont ignorées si le seed est passé avant). `00019` échoue toujours (`function name "get_visible_systems" is not unique`) — voir §9.

---

## 9. Avant une mise en ligne

Comptes, données par joueur et RLS sont en place. Restent les points suivants, du plus urgent au moins urgent.

### Bloquant

| Sujet | À faire | Où |
|---|---|---|
| **Emails** | SMTP personnalisé (l'envoi par défaut de Supabase est très limité en débit) ; modèles de confirmation et de réinitialisation en français ; *Site URL* et *Redirect URLs* du domaine de production | Dashboard → Authentication (SMTP Settings, Emails, URL Configuration) |
| **Sécurité des comptes** | Longueur minimale du mot de passe côté serveur alignée sur l'app (8) ; CAPTCHA (hCaptcha ou Turnstile) sur inscription et mot de passe oublié ; vérifier les limites de débit | Dashboard → Authentication ; app (jeton CAPTCHA à passer à `signUp` / `resetPasswordForEmail`) |
| **Intégrité du jeu** | ✅ **Transit (22/10/2026, migration `00050`)** : distance, durée et arrivée décidées par `start_transit` / `complete_transit` ; le joueur ne modifie plus que le nom de son vaisseau ; `ship_travels` écrit par le serveur seulement. **Reste** : `lab_reports` (fiabilité, résultats) et insertions libres de signaux / observations — sans effet hors de la partie du joueur tant que ces données ne nourrissent rien de partagé ; à verrouiller (RPC) dès qu'elles comptent pour d'autres joueurs (découverte de traces, classements) | migration + stores `labReports`, `signaux`, `observations` |
| **RGPD et mentions légales** | Mentions légales et politique de confidentialité (email, données de jeu, durée de conservation) ; **suppression du compte** depuis le jeu (fonction `SECURITY DEFINER` qui supprime `auth.users` → cascade sur profil, vaisseau et données). Pas de bandeau cookies nécessaire tant qu'aucun outil d'audience n'est ajouté (la session Supabase est dans le `localStorage`) | nouvelles pages + migration |
| **Environnements** | Aujourd'hui une seule base sert au développement et accueillerait les joueurs : créer un projet Supabase de production distinct (ou une branche) et y appliquer les migrations | Supabase |
| **Hébergement** | Le routeur utilise `createWebHistory` : réécrire toutes les routes vers `index.html` (sinon 404 en rechargeant `/carte`) ; HTTPS ; variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` | config de l'hébergeur (ex. `vercel.json`) |
| **Sauvegardes** | Sauvegardes quotidiennes / restauration à un instant donné selon le plan Supabase ; adapter `npm run backup:db` (aujourd'hui `supabase db dump`, qui demande Docker) pour utiliser `pg_dump` 18 | Supabase ; `scripts/backup-db.sh` |

### Important

| Sujet | À faire |
|---|---|
| **Migrations** | Rejeu sur base vierge bloqué à `00019` ; numéros `00012` / `00013` en double ; la base avait divergé du dépôt (`compute_pulsar_signals`, corrigé par `00047`). Recommandé : une migration de référence tirée du schéma de production (`pg_dump --schema-only`), puis la CLI Supabase pour les suivantes |
| **Parcours de compte** | Renvoyer l'email de confirmation depuis la connexion (erreur « email non confirmé ») ; changer d'email et de mot de passe depuis le jeu |
| **Durée de vie des signaux** | 2 h : un joueur qui revient plus tard ne voit plus ses signaux de démo, et les pulsars ne réapparaissent qu'au recalcul. Vérifier que c'est voulu côté game design |
| **Tests** | Pas de test de bout en bout du parcours inscription → partie : Playwright sur une base de test |
| **Contrôles Supabase** | Lancer les *Database Advisors* (sécurité et performance) depuis le dashboard |

### Plus tard

| Sujet | À faire |
|---|---|
| **Signature des traces** | Colonne `traces.signature` (copie texte du pseudo au dépôt, sans lien vers le compte) quand le dépôt de traces joueur sera branché sur la base |
| **Dépôt git** | `Ressources/hyg_v42.csv` (33 Mo) vers Git LFS ou un téléchargement scripté |
| **Suivi des erreurs** | PostHog ou Sentry (avec consentement si des mesures d'audience sont ajoutées) |

