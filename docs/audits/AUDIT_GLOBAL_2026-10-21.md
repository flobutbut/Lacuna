# 21 octobre 2026 — Audit global du projet

Audit en lecture seule de `src/`, de la configuration, des dépendances et des migrations Supabase, comparé aux bonnes pratiques Vue 3 / Vite / Supabase. Aucun fichier source n'a été modifié.

**Méthode** : analyse statique scriptée (imports, exports, tokens CSS), `npm outdated`, `npm audit`, build de production (`vite build`) et vérifications dans le navigateur sur le serveur de dev.

**État de départ** : 128 fichiers dans `src/` (~25 400 lignes), 9 routes, 13 stores Pinia, 18 composables, 34 modules `lib/`, 26 feuilles CSS globales, 47 migrations SQL. Le build passe en 2,3 s.

> **Suivi (21/10/2026, fin de journée)** — Lots 1, 2 et 3 appliqués (commits `4e6d475`, `3e24b67`, `747638f`), avec ces écarts : `SystemView` et `PageCarte` n'avaient pas de rendu canvas à extraire (§3.6) ; les imports `d3` ciblés n'apportent rien au poids (Rollup élimine déjà le code inutilisé). Les points Supabase du §7.2 sont traités par les comptes joueurs (migrations 00046–00048, `docs/architecture/PLAN_COMPTES_JOUEURS.md`) : RLS par joueur, prototype supprimé, `compute_pulsar_signals` restreinte, RLS activée sur les constellations. Restent ouverts : numéros de migration en double (00012, 00013), rejeu sur base vierge (00019), CSV de 33 Mo dans git — repris dans la liste « avant mise en ligne » du plan (§9).

---

## 1. Synthèse et priorités

| Priorité | Sujet | Constat | Effort |
|---|---|---|---|
| 🔴 P1 | Bug | `App.vue` calcule la mise en page « conception » une seule fois : le header s'affiche sur `/conception-etoiles` quand on ouvre la page directement (vérifié dans le navigateur) | 5 min |
| 🔴 P1 | Bug | `stores/signaux.js` lit `err` au lieu de `error` : les échecs d'insertion Supabase passent inaperçus | 5 min |
| 🔴 P1 | Sécurité | 7 vulnérabilités npm (6 hautes) dont `vite` et `esbuild` | 10 min |
| 🔴 P1 | Sécurité | Politiques RLS `FOR ALL USING (true)` sur `signals`, `observations`, `lab_reports` : n'importe qui avec la clé anon peut tout lire, modifier ou supprimer | À planifier avant toute mise en ligne |
| 🟠 P2 | Outillage | `package-lock.json` désynchronisé de `package.json` et deux lockfiles (npm et yarn) | 10 min |
| 🟠 P2 | Code mort | 11 fichiers jamais importés, 3 dépendances npm inutilisées, 4 imports inutilisés | 30 min |
| 🟠 P2 | Architecture | `stores/ui.js` (397 lignes, utilisé par 34 fichiers) mélange 6 domaines | 2–3 h |
| 🟠 P2 | Architecture | 3 vues appellent Supabase directement au lieu de passer par un store | 1–2 h |
| 🟡 P3 | Doublons | `seededRandom` copié dans 11 fichiers ; setup Three.js dupliqué entre 2 composants | 1–2 h |
| 🟡 P3 | Qualité | Aucun linter, formateur, ni test | 1 h pour démarrer |
| 🟡 P3 | Routes | Pas de route 404, `meta.title` défini mais jamais utilisé | 15 min |
| 🟡 P3 | Design system | Bonne base (87 tokens, 209 `font-size` via token) ; 89 couleurs en dur, 3 composants non documentés | 1–2 h |
| 🟡 P3 | Dépôt | CSV de 33 Mo suivi par git, README obsolète | 30 min |

---

## 2. Routes et navigation

`src/router/index.js` déclare 9 routes, toutes chargées à la demande (`() => import(...)`) : c'est la bonne pratique, et le build produit bien un chunk par page.

### 2.1 Bug : mise en page « conception » non réactive — 🔴

`src/App.vue:8`

```js
const isConceptionLayout = route.meta.conceptionLayout === true
```

La valeur est lue une seule fois, au montage de `App`. Or le routeur n'a pas encore résolu la première navigation à ce moment-là (`main.js` monte l'app sans attendre `router.isReady()`), et la valeur ne change plus ensuite.

- **Constaté dans le navigateur** : en ouvrant `http://localhost:5173/conception-etoiles` directement, `.lacuna-app` n'a pas la classe `route-conception` et le header est affiché.
- **Même problème en naviguant** depuis une autre page, dans les deux sens.

**Correction** :

```js
const isConceptionLayout = computed(() => route.meta.conceptionLayout === true)
```

### 2.2 Pas de route 404 — 🟡

Une URL inconnue (ex. `/page-inexistante`) affiche une zone principale vide avec seulement un avertissement Vue Router dans la console. Ajouter une route `/:pathMatch(.*)*` qui redirige vers `/` ou affiche une page dédiée.

### 2.3 `meta.title` inutilisé — 🟡

Chaque route a un `meta.title`, mais `document.title` n'est jamais mis à jour : l'onglet affiche toujours « LACUNA ». Un `router.afterEach((to) => { document.title = \`${to.meta.title} — LACUNA\` })` suffit.

### 2.4 Doublon routes ↔ menu — 🟡

`src/constants/menus.js` (`INSTRUMENTS`) recopie les chemins et libellés des routes. Générer `INSTRUMENTS` depuis `router.getRoutes()` (avec `meta.icon`) éviterait que les deux listes divergent.

---

## 3. Stores, composables et objets métier

### 3.1 Bugs de gestion d'erreur Supabase — 🔴

Supabase ne lève pas d'exception : il renvoie `{ data, error }`.

| Emplacement | Problème |
|---|---|
| `src/stores/signaux.js:158` et `:275` | `const { data, err } = ...` : `err` vaut toujours `undefined`, l'erreur est ignorée |
| `src/stores/signaux.js:221` | `.then(() => {}).catch(...)` : une erreur SQL ou RLS ne passe jamais dans `catch` |
| `src/stores/observations.js:181` et `:190` | `delete` et `update` sans lecture de `error` ; l'état local est modifié avant, donc l'interface et la base divergent en cas d'échec |

**Bonne pratique** : toujours lire `error`, et soit annuler la mise à jour optimiste, soit notifier via le toast (`ui.showNotification(msg, 3000, 'error')`).

### 3.2 `stores/ui.js` : store « fourre-tout » — 🟠

397 lignes, utilisé par 34 fichiers. Il regroupe au moins 6 domaines sans lien :

- notifications (toast) ;
- widget de voyage et confirmation de départ ;
- sélection et survol (étoile, corps, signal, constellation, réticule) ;
- direction de vue et filtres de l'observatoire ;
- réglages du radar (bande, pause, seuils, son, bruit, zoom fréquentiel…) ;
- panneaux (`activePanel`), qui ne servent plus que les composants `panels/` morts.

**Recommandation** : découper en `useNotificationStore`, `useObservatoireStore`, `useRadarStore` et `useTransitStore`, puis supprimer `activePanel`. Chaque composant ne réagira alors qu'aux changements qui le concernent, et le code sera plus facile à suivre.

### 3.3 Accès aux données hors des stores — 🟠

| Vue | Accès direct | Store existant |
|---|---|---|
| `views/PageArtefacts.vue` | `traces`, `interpretations` (lecture, insertion, suppression) | `stores/traces.js` ne gère que les traces locales |
| `views/PagePopulation.vue` | `ships`, `populations` | aucun |
| `views/observatoire/PageObservatoire.vue` | `rpc(...)` | `stellarSystems` |

Les 10 autres accès passent par des stores. Pour rester cohérent, il faut déplacer ces requêtes dans `traces`, dans un nouveau store `population`, et dans `stellarSystems`.

### 3.4 Couche Supabase doublée — 🟡

`stores/supabase.js` ne fait qu'exposer le client de `lib/supabase.js` et une fonction `isConfigured()`. Un store Pinia n'apporte rien ici. On peut exporter `isSupabaseConfigured` depuis `lib/supabase.js` et supprimer le store (11 fichiers à mettre à jour).

### 3.5 Pas d'état de chargement — 🟡

Aucun store n'expose `loading` ou `error`. Les vues ne peuvent donc afficher ni squelette, ni message d'erreur. Le motif `{ data, loading, error }` par requête, ou un petit `useAsyncState`, couvrirait la plupart des cas.

### 3.6 Grosses vues — 🟡

`RadarView.vue` (970 lignes), `SystemView.vue` (875) et `PageCarte.vue` (851) mélangent rendu canvas, logique métier et template. Il faut sortir le rendu canvas dans des composables (`useRadarCanvas`, `useSystemOrbitRender`) : `useRadarColumnBuffer` et `useRadarNoise` montrent déjà la voie.

### 3.7 Points positifs

- Composition API (`<script setup>`) et setup stores Pinia partout.
- Logique métier bien isolée dans `lib/` : fonctions pures, testables.
- Listeners et `requestAnimationFrame` libérés au démontage dans tous les composants canvas ; ressources Three.js libérées (`dispose()`) dans `CarteMap3D` et `Stars3DCanvas`.

---

## 4. Code mort et doublons

### 4.1 Fichiers jamais importés — 🟠

| Fichier | Remarque |
|---|---|
| `src/components/panels/PanelArtefacts.vue` | Déjà signalé dans `AUDIT_code_mort.md` (mars 2026), toujours présent |
| `src/components/panels/PanelDrake.vue` | idem |
| `src/components/panels/PanelJournal.vue` | idem |
| `src/components/panels/PanelPlaceholder.vue` | idem |
| `src/components/panels/PanelPopulation.vue` | idem |
| `src/components/AppRangeSlider.vue` | Remplacé par `AppDualRangeSlider` dans `ObservatoireRadarFilters` |
| `src/components/carte/CarteMapView.vue` | Plus référencé |
| `src/components/carte/CarteSystemCard.vue` | Plus référencé |
| `src/components/icons/RadarSoundIcon.vue` | Créé mais pas encore utilisé (à brancher ou supprimer) |
| `src/stores/counter.js` | Exemple du template Vite |
| `src/assets/main.css` | Ne contient qu'un commentaire, jamais importé |
| `src/components/FlyoutContainer/` | Dossier vide |

Après suppression des panels : retirer aussi `activePanel`, `openPanel`, `closePanel` et `togglePanel` de `stores/ui.js`.

### 4.2 Exports jamais importés — 🟡

Exports utilisés nulle part, même pas dans leur propre fichier :

- `constants/starDisplay.js` : `COLOR_GREEN_HEX`, `HIGHLIGHT_3D_SIZE_MULT`
- `lib/astroConstants.js` : `SUN_MASS_KG`
- `lib/ringUtils.js` : `getRingSvgAttrs`, `getRingPathD`, `getRingCircleAttrs`
- `lib/spectralBands.js` : `magnitudeInBand`
- `lib/stellarProjection.js` : `signalPosition`, `getOffscreenStarAzimuth`

Une vingtaine d'autres exports ne servent qu'en interne : le mot-clé `export` peut être retiré.

### 4.3 Imports inutilisés — 🟡

- `src/views/PageLaboratoire.vue:29` : `ObservationTypeIcon`
- `src/lib/systemObjectConverters.js:7` : `AU_KM`
- `src/components/carte/CarteMap3D.vue:13` et `src/components/conception/Stars3DCanvas.vue:8` : `MIN_HIGHLIGHT_PIXELS`

### 4.4 Fonctions dupliquées — 🟡

| Fonction | Copies | Action |
|---|---|---|
| `seededRandom` (mulberry32) | **11** : `useRadarSpectrogram` + 10 fichiers `lib/*Data.js` | Créer `lib/random.js` et l'importer partout |
| `distanceAuToPx` | `lib/orbitalUtils.js`, `CarteOrbitalView.vue`, `SystemView.vue` | Utiliser celle de `lib/` |
| `radiusToDiameterPx` | `lib/bodyRadius.js`, `CarteOrbitalView.vue` | idem |
| `lerp` | `lib/geometry.js`, `useCameraFocusAnimation.js` | idem |
| `getCssVar` | `RadarView.vue`, `RadarMiniature.vue` | Déplacer dans `lib/` |
| `getBodyDisplayName` | `lib/observationPayload.js`, `ObservatoirePanel.vue` | Utiliser celle de `lib/` |
| `parseStructure` | `gravimetriqueData.js`, `spectrogramData.js` | À comparer puis fusionner |
| `initThree`, `pickStarAtMouse`… | `CarteMap3D.vue` et `Stars3DCanvas.vue` | Extraire un composable `useThreeStarScene` |

---

## 5. Dépendances

### 5.1 Inutilisées — 🟠

| Paquet | Statut |
|---|---|
| `@vueuse/core` | 0 import |
| `gsap` | 0 import |
| `spectrogram-js` | 0 import (seulement cité dans un commentaire de `lib/spectrogramData.js`) |

**Action** : `npm uninstall @vueuse/core gsap spectrogram-js`

### 5.2 Vulnérabilités — 🔴

`npm audit` : 7 vulnérabilités (1 modérée, 6 hautes) dans `vite` 7.3.1, `esbuild`, `postcss`, `nanoid`, `picomatch`, `source-map-js`, `yaml` et `@babel/core`. Elles touchent surtout l'outillage de dev (serveur Vite), mais doivent être corrigées. `npm audit fix` les règle sans changer de version majeure.

### 5.3 Versions — 🟡

Tout est à jour dans la plage semver, sauf de petits retards : `vue` 3.5.30 → 3.5.44, `vue-router` 5.0.3 → 5.4.0, `@supabase/supabase-js` 2.99 → 2.118. Il existe des versions majeures plus récentes pour `vite` (8), `pinia` (4), `@vueuse/core` (15) et `three` (0.186) : à évaluer séparément.

### 5.4 Lockfiles — 🟠

- `package-lock.json` et `yarn.lock` sont tous les deux suivis par git. Il faut n'en garder qu'un : le README parle de `yarn`, mais `package-lock.json` est le plus utilisé en pratique.
- `package-lock.json` ne correspond plus à `package.json` (`@supabase/supabase-js`, `d3`, `spectrogram-js` manquants) : `npm ci` échoue. Il faut lancer `npm install` puis commiter le lockfile.
- Il manque deux binaires natifs dans `node_modules` (Rollup, esbuild), et le dossier porte l'attribut de quarantaine macOS. Une réinstallation propre (`rm -rf node_modules && npm install`) règle ces deux problèmes.

### 5.5 Poids du bundle — 🟡

| Chunk | Taille | Gzip | Contenu |
|---|---|---|---|
| `useTransitLines3d-*.js` | 524 Ko | 131 Ko | Three.js, chargé à la demande (Carte, Conception) : acceptable |
| `index-*.js` (initial) | 312 Ko | 98 Ko | Vue, Pinia, Supabase, stores, header, barre d'instruments |
| `index-*.css` (initial) | 67 Ko | 10 Ko | **Les 26 feuilles CSS**, y compris celles propres à une page |

- `d3` est importé en bloc (`import * as d3`) dans 13 fichiers. Importer seulement les sous-modules utilisés (`d3-scale`, `d3-shape`…) rend la dépendance explicite et allège le bundle.
- `lab.css`, `carte.css`, `conception.css`, `population.css`, `journal.css`, `artifact.css` et `systems.css` sont chargés au démarrage alors qu'ils ne servent qu'à une page. Les importer depuis la vue concernée permettrait de les découper par route.

---

## 6. Design system et CSS

### 6.1 Points forts

- 87 tokens dans `tokens.css`, tous définis : aucun `var(--x)` sans définition.
- Typographie quasi entièrement tokenisée : 209 `font-size` via token contre 4 en px.
- Seulement 3 `!important`.
- Le commentaire de `main.css` documente le choix de ne pas utiliser `@import`.

### 6.2 Tokens inutilisés — 🟡

`--color-green-bright`, `--space-9`, `--space-14`, `--transition-slow`, `--z-sky` : à supprimer, ou à utiliser là où des valeurs sont encore en dur.

### 6.3 Valeurs en dur — 🟡

89 couleurs hex ou `rgba()` hors de `tokens.css`. Fichiers les plus concernés :

| Fichier | Occurrences |
|---|---|
| `views/observatoire/SystemView.vue` | 14 |
| `assets/components/lab.css` | 8 |
| `assets/layers.css` | 4 |
| `RadarView.vue`, `StarAutocompleteMenu.vue`, `header.css`, `app-modal.css` | 3 chacun |

8 couleurs hex sont aussi codées en JS pour le canvas et Three.js (`useStarHighlight`, `starSpriteTexture`, `RadarView`, `RadarMiniature`, `CarteMap3D`, `Stars3DCanvas`). `RadarView` lit déjà les tokens via `getCssVar` : généraliser ce motif garderait une seule source de vérité.

Le point de `TODO_REFACTO.md` (mars 2026) sur `panel.css` (`top: 60px`, `left/right: 220px`) devient sans objet si les panels sont supprimés.

### 6.4 Documentation du design system — 🟡

`docs/design/Design-system.md` documente `AppModal`, `AppSelect`, `Divider`, `InstrumentButton`, `ModalCell`, `NavMenuItem`, `NavTabButton` et `ProgressBar`. Il manque `AppCard`, `AppDualRangeSlider` (nouveau) et `RadarMiniature`. `AppRangeSlider`, lui, est mort.

### 6.5 Accessibilité — 🟡

- **Bon** : `lang="fr"`, meta description, 54 attributs `aria-*`, 24 `role`, 11 styles `:focus-visible`, seulement 2 éléments non-bouton cliquables.
- **À faire** : aucune règle `prefers-reduced-motion`. L'app est riche en animations (scintillement, transitions, radar défilant) : ajouter un bloc global dans `animations.css` qui coupe ou ralentit ces animations.
- **À vérifier** : 7 `outline: none/0`. S'assurer que chacun a un `:focus-visible` de remplacement.
- **À vérifier** : les contrastes des textes secondaires sur fond sombre (WCAG AA, 4,5:1).

---

## 7. Outillage, dépôt et sécurité

### 7.1 Qualité de code — 🟡

Aucun ESLint, Prettier, test (Vitest) ni typage (TypeScript ou JSDoc vérifié). Les bugs 2.1 et 3.1 auraient été détectés par `eslint-plugin-vue` et par `no-unused-vars` / TypeScript. Démarrage recommandé :

1. `npm init @eslint/config` avec `eslint-plugin-vue` (règles `flat/recommended`) et Prettier.
2. Vitest sur `src/lib/` : fonctions pures, donc faciles à tester (orbites, magnitudes, conversions de coordonnées).
3. Plus tard : un workflow GitHub Actions `lint + build + test` sur chaque push.

### 7.2 Supabase — 🔴 / 🟠

- **RLS** : `signals`, `observations` et `lab_reports` ont `FOR ALL USING (true) WITH CHECK (true)`. La clé anon est publique par nature (elle est dans le bundle), donc n'importe qui peut lire, modifier ou supprimer toutes les lignes. Le `session_id` stocké dans `localStorage` (`lib/session.js`) n'est pas vérifié côté serveur. Acceptable pour un prototype local ; avant toute mise en ligne, passer à Supabase Auth (même anonyme : `signInAnonymously`) et restreindre par `auth.uid()`.
- **Numérotation des migrations** : `00012_*` et `00013_*` existent en double. L'ordre d'application dépend alors du nom de fichier, ce qui est fragile : renuméroter.
- **README** : il dit de n'exécuter que `00001_initial_schema.sql`, alors qu'il y a 47 migrations. Le remplacer par `supabase db push` ou `supabase db reset`.

### 7.3 Dépôt — 🟡

- `Ressources/hyg_v42.csv` (33 Mo) est suivi par git et alourdit chaque clone. Le déplacer vers Git LFS ou le télécharger via un script.
- `docs/analyses/complete_hyg_report.md` fait 3 Mo : vérifier qu'il doit vraiment être versionné.
- `.cursor-mcp-43.json` est à la racine : ajouter `.cursor-mcp-*.json` au `.gitignore`.
- Logs d'import à la racine (`*.log`, `import_progress.json`) : bien ignorés, mais à ranger dans `stellar_import/logs/`.

---

## 8. Plan d'action proposé

**Lot 1 — corrections rapides (≈ 1 h)**

1. `App.vue` : rendre `isConceptionLayout` réactif avec `computed`.
2. `signaux.js` et `observations.js` : lire `error` correctement.
3. `npm audit fix`, puis `rm -rf node_modules && npm install`. Supprimer `yarn.lock`, commiter `package-lock.json`.
4. `npm uninstall @vueuse/core gsap spectrogram-js`.
5. Supprimer les 12 éléments morts (§ 4.1) et les 4 imports inutilisés (§ 4.3).
6. Route 404 et `document.title`.

**Lot 2 — hygiène (≈ ½ journée)**

7. ESLint, Prettier et Vitest, avec quelques tests sur `lib/`.
8. Créer `lib/random.js` et supprimer les doublons de § 4.4.
9. Remplacer les 89 couleurs en dur par des tokens ; ajouter `prefers-reduced-motion` ; documenter `AppCard` et `AppDualRangeSlider`.
10. README à jour ; renuméroter les migrations en double.

**Lot 3 — architecture (≈ 1–2 jours)**

11. Découper `stores/ui.js` en 4 stores par domaine.
12. Déplacer les requêtes Supabase des vues vers les stores ; ajouter des états `loading` et `error`.
13. Extraire le rendu canvas de `RadarView`, `SystemView` et `PageCarte` dans des composables ; mutualiser la scène Three.js.
14. CSS des pages chargé par route ; imports `d3` ciblés.
15. Avant toute mise en ligne : Supabase Auth et RLS par utilisateur.
