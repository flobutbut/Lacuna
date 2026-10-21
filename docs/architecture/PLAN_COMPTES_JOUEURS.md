# Plan — Comptes joueurs, pseudo et nom du vaisseau

*21 octobre 2026 — plan validé. Étape 1 (`00046_player_accounts.sql`) appliquée en production le 21/10/2026 après sauvegarde (`backups/avant_00046_20261021_141047.dump`).*

Aujourd'hui l'app n'a aucune authentification : tous les visiteurs partagent le vaisseau prototype (`ships.user_id IS NULL`), et les signaux / observations sont rattachés à un identifiant de session stocké dans le navigateur (`lib/session.js`). Ce plan introduit un compte par joueur, un vaisseau par compte, et des règles d'accès (RLS) qui protègent les données de chacun.

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
3. ses systèmes (`ship_systems`) et sa population (`populations`), avec les valeurs initiales aujourd'hui dans `seed.sql` pour le prototype ;
4. le nœud Sol de la carte (`map_nodes`).

Elle refuse si le joueur a déjà un vaisseau. Les valeurs initiales sont définies **une seule fois**, dans la fonction, au lieu d'être recopiées dans le seed.

### 3.4 Rattachement des données au joueur

| Table | Aujourd'hui | Après |
|---|---|---|
| `signals` | `session_id` (navigateur) + `ship_id` | propriété par `ship_id` ; `session_id` supprimé |
| `observations` | `session_id` + `ship_id` | idem |
| `lab_reports` | aucune colonne de propriétaire | propriété via `observation_id` → `observations.ship_id` |
| `interpretations` | `ship_id` jamais renseigné par l'app | `ship_id` renseigné à l'insertion ; **non exposé** en lecture |
| `traces` (dépôts joueur, plus tard) | `discovered_by` (ship_id) | + `signature TEXT` (copie du pseudo) ; `discovered_by` non exposé |

`lib/session.js` disparaît. Les signaux de démo (`session_id = 'seed-demo'`) deviennent des **modèles** (`ship_id` nul, lisibles par `start_new_game` seulement) et sont copiés dans le vaisseau du joueur à sa création, au lieu d'être clonés au premier chargement.

---

## 4. Règles d'accès (RLS)

Principe : **chaque joueur ne voit et ne modifie que ce qui appartient à son vaisseau** ; les données du monde (systèmes stellaires, objets, nébuleuses, traces immuables, Drake) restent en lecture publique.

| Table | Lecture | Écriture |
|---|---|---|
| `profiles` | soi | soi |
| `ships`, `ship_systems`, `populations`, `ship_travels`, `map_nodes`, `map_edges`, `logbook_entries`, `ship_traces` | son vaisseau | son vaisseau (création via `start_new_game`) |
| `signals`, `observations` | son vaisseau | son vaisseau |
| `lab_reports` | via ses observations | via ses observations |
| `interpretations` | tous, **sans** `ship_id` (vue ou droits par colonne) | insertion avec son `ship_id` ; suppression de ses seules interprétations |
| `traces` | tous (sans `discovered_by`) | dépôt joueur : plus tard |
| Données du monde | tous | aucune (import service_role) |

Les politiques « prototype » ouvertes (`USING (true)`, `user_id IS NULL`) sont supprimées. Les politiques « Users can manage own … » de la migration `00001` servent de base : elles existent déjà mais n'étaient jamais utilisées.

---

## 5. Côté application

| Élément | Changement |
|---|---|
| `stores/auth.js` (nouveau) | session, utilisateur, profil ; `signUp`, `signIn`, `signOut`, `resetPassword`, `updatePseudo` ; écoute `onAuthStateChange` |
| `router/index.js` | routes d'authentification + garde `beforeEach` (attend la session initiale) ; `/conception-etoiles` marquée `requiresAdmin` |
| `constants/menus.js` / `InstrumentsBar` | l'entrée « Vue 3D étoiles » n'apparaît que pour un admin |
| `stores/ship.js` | `fetch()` lit le vaisseau du joueur (RLS) au lieu de `.is('user_id', null)` ; `renameShip()` |
| `stores/signaux.js`, `stores/observations.js` | filtrent et insèrent par `ship_id`, plus par `session_id` |
| `stores/traces.js` | interprétations : `ship_id` à l'insertion, suppression limitée aux siennes |
| `PagePopulation` | affichera la vraie population : la ligne existe pour le prototype mais n'était pas lisible (pas de politique anon sur `populations`) |
| Pages d'auth + `/bienvenue` | composants du design system (AppModal / champs / boutons), textes en français |
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
| 2 | `stores/auth.js`, pages d'inscription / connexion / mot de passe, garde de routeur, déconnexion dans le header | ✅ codée ; 14 tests (messages, validation, garde, redirections) ; pages et garde vérifiées dans le navigateur sans compte réel ; **parcours réel inscription → email → connexion à faire par le joueur** |
| 3 | `/bienvenue` : pseudo + nom du vaisseau → `start_new_game` | nouveau compte → vaisseau à Sol, header avec le bon nom |
| 4 | Stores sans `session_id` ; interprétations avec `ship_id` | deux comptes : chacun ne voit que ses signaux, observations, carte |
| 5 | Migration RLS : suppression des politiques prototype, politiques par joueur ; restreindre `compute_pulsar_signals` (aujourd'hui `SECURITY DEFINER`, appelable sans compte sur n'importe quel `ship_id`) au vaisseau du joueur | requêtes avec la clé anon sans session → refusées |
| 6 | Identité dans la page Systèmes (modifier pseudo, renommer), déconnexion ; Vue 3D étoiles réservée aux admins | compte joueur : entrée absente, URL directe redirigée ; compte admin : accès |
| 7 | Docs (technique, fonctionnelle, README) | |

Les étapes 1 et 5 sont séparées pour que l'app reste utilisable pendant la transition : les nouvelles politiques arrivent avant que les anciennes soient supprimées.

---

## 8. Base de données : état et prérequis

**Base utilisée** : le projet de l'app (`utdzobspxeecxauwnkve`). Il n'existe pas de base de test séparée, et le connecteur Supabase de cette session pointe vers un autre projet, qui ne sera pas touché.

**État constaté (lecture seule, 21/10/2026)** : schéma conforme aux migrations du dépôt, aucun compte (`auth.users` vide), pas de table `profiles`.

| Données du prototype à supprimer | Lignes |
|---|---|
| `ships` (ARCA partagé) | 1 |
| `signals` (93 sessions navigateur) | 2 504 |
| `observations` | 89 |
| `lab_reports` | 138 |
| `map_nodes` | 20 |
| `ship_travels` | 22 |
| `populations`, `ship_systems` | 1 + 1 |

**Accès direct à la base** (rétabli le 21/10/2026) : `SUPABASE_DB_URL` est valide. Avant chaque migration destructrice :

1. faire une **sauvegarde complète** : `/opt/homebrew/opt/libpq/bin/pg_dump "$SUPABASE_DB_URL" --schema=public --format=custom --no-owner --file=backups/<nom>.dump` (`pg_dump` 18 requis : la base est en Postgres 17.6 ; `npm run backup:db` demande Docker) ;
2. appliquer la migration en une transaction : `psql "$SUPABASE_DB_URL" --single-transaction -v ON_ERROR_STOP=1 -f supabase/migrations/<fichier>.sql`.

Plusieurs mots de passe refusés de suite font bannir l'IP sur le port 5432 (Dashboard → Database → Network Bans).

**Constaté en testant l'étape 1** : les migrations du dépôt ne se rejouent pas telles quelles sur une base vierge. `00015` suppose que le vaisseau prototype de `seed.sql` existe déjà, et `00019` échoue (`function name "get_visible_systems" is not unique`). Sans effet sur la base actuelle, mais à corriger pour pouvoir recréer une base de test ou de production de zéro.
