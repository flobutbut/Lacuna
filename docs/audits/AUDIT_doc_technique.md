# 18 mars 2025 — Audit obsolescence Documentation-technique.md

Comparaison de `docs/reference/Documentation-technique.md` avec l'état actuel du code dans `src/` et la configuration du projet. Mode lecture seule — aucun fichier modifié.

---

## SECTION : Structure du projet (arbre src/)

**PASSAGE :** Arbre `assets/` — `├── main.css # Styles globaux`

**OBSOLÈTE :** `main.css` est listé comme « Styles globaux » mais n'est importé nulle part (pas dans `main.js`). Le fichier existe et ne contient que des commentaires (convention : ne pas utiliser @import, liste des fichiers du design system).

**PROPOSITION :** Soit retirer `main.css` de l'arbre (ou le marquer comme « référence / convention, non chargé »), soit indiquer en note : « main.css : fichier de convention uniquement, non importé ; les styles globaux sont tokens.css, base.css, etc. »

---

**PASSAGE :** Arbre `supabase/migrations/` — `└── 00001_initial_schema.sql`

**OBSOLÈTE :** Il existe 33 fichiers de migration (00001 à 00031, plus doublons de numéros 00012/00013), pas uniquement `00001_initial_schema.sql`.

**PROPOSITION :** Remplacer par « migrations/ (plusieurs dizaines de fichiers, 00001_initial_schema.sql à 00031_…) » ou « migrations/*.sql » avec une note renvoyant à Documentation-backend.md pour la liste à jour.

---

**PASSAGE :** Arbre `components/lab/` — liste de 8 rapports (LabReportSpectrogram, LabReportStructureTemporelle, LabReportPolarisation, LabReportSpectreEnergetique, LabReportGravimetrique, LabReportSpectreStellaire, LabReportOrbital, LabReportAtmosphere)

**OBSOLÈTE :** Il existe 11 composants Lab report. Manquants dans la doc : LabReportMagneto.vue, LabReportMorpho.vue, LabReportVolumetrique.vue.

**PROPOSITION :** Ajouter dans l'arbre : LabReportMagneto.vue, LabReportMorpho.vue, LabReportVolumetrique.vue (avec une courte description si besoin, ex. magnétomètre, morpho, volumétrique).

---

## SECTION : Design system et CSS

**PASSAGE :** « Règle impérative : Tous les fichiers CSS sont importés **directement dans `main.js`**. Ne jamais utiliser `@import` dans un fichier CSS pour importer d'autres CSS »

**OBSOLÈTE :** La règle est globalement respectée pour les fichiers effectivement chargés. En revanche, `main.css` est cité dans l'arbre comme fichier du design system mais n'est pas importé dans `main.js`, ce qui peut laisser croire que « tous les fichiers CSS » incluent main.css.

**PROPOSITION :** Préciser : « Tous les fichiers CSS utilisés par l'app sont importés directement dans `main.js`. Le fichier `main.css` (s'il existe) est une référence de convention uniquement et n'est pas chargé. Ne jamais utiliser `@import` dans un fichier CSS pour importer d'autres fichiers CSS locaux — Vite ignore les changements et le HMR ne fonctionne pas. »

---

**PASSAGE :** Table « Fichier | Rôle » — `tokens.css`, `base.css`, `app-modal.css`, `components/*.css`

**OBSOLÈTE :** `main.js` importe aussi `animations.css`, `layers.css` et `utilities.css` (à la racine de `assets/`), qui ne figurent pas dans la table. Inversement, `main.css` apparaît dans l'arbre mais pas dans la table et n'est pas chargé.

**PROPOSITION :** Compléter la table avec : `animations.css` (animations keyframes), `layers.css` (z-index / couches), `utilities.css` (classes utilitaires). Optionnel : retirer ou clarifier le rôle de `main.css` dans l'arbre (voir premier écart).

---

**PASSAGE :** (Contexte) `base.css` contient `@import url('https://fonts.googleapis.com/...')` pour Share Tech Mono et Syne.

**OBSOLÈTE :** Pas d'écart strict : la règle interdit d'importer « d'autres CSS » (fichiers CSS). L'import de polices via URL externe est un cas à part.

**PROPOSITION :** À titre de clarification, ajouter une phrase : « Les `@import` vers des URLs externes (ex. polices Google dans `base.css`) sont admis ; seuls les `@import` vers des fichiers CSS locaux sont interdits. »

---

## SECTION : Base de données

**PASSAGE :** « Tables principales : `stellar_systems`, `system_objects`, `constellations`, `constellation_lines`, `traces`, `observations`, `ships`, `populations`, `interpretations`, `map_nodes`/`map_edges`, `drake_equation`. »

**OBSOLÈTE :** Non vérifié en détail dans cet audit (schéma et migrations dans Documentation-backend.md). Aucun écart évident signalé par le code parcouru.

**PROPOSITION :** Aucune pour l’instant. À valider éventuellement contre le schéma réel et les migrations.

---

## SECTION : Visualisation — Laboratoire

*Aucun écart identifié entre la doc (D3, spectrogram-js, Three.js, thématisation tokens) et l’usage dans `src/`.*

---

## SECTION : Import stellaires (stellar_import)

*Aucun écart identifié : scripts listés présents, `LACUNA_ID_MAP` dans `upsert_systems.py`, migration 00021 référencée existe.*

---

## SECTION : Alias et configuration

*Aucun écart : `@/` → `./src/` (vite.config.js + jsconfig.json), Node engines dans package.json, Yarn.*

---

## SECTION : Paramètres de transit

*Aucun écart : `VITE_TRANSIT_TIME_SCALE` présent dans `.env.example` avec la valeur indiquée.*

---

## SECTION : Commandes

*Aucun écart : `yarn dev` utilise le port par défaut Vite 5173.*

---

## Synthèse


| Section              | Écarts signalés                       |
| -------------------- | ------------------------------------- |
| Structure du projet  | 3 (main.css, migrations, lab reports) |
| Design system et CSS | 2 (+ 1 clarification optionnelle)     |
| Base de données      | 0 (hors validation fine schéma)       |
| Autres sections      | 0                                     |


