# Classification des systèmes stellaires — Problème et options

**Date** : 2026-03-17  
**Objectif** : Documenter le problème de classification (type d'objet affiché) et lister les options de résolution.

---

## 1. Énoncé du problème

Lorsqu'un utilisateur sélectionne un **pulsar** (ou autre objet exotique) dans la Vue conception ou les instruments, le système affiche **« Naine rouge »** au lieu de **« Pulsar »**. Les pulsars n'ont pas de type spectral par nature (`spectral_type` = NULL en base), et la logique d'affichage actuelle se base uniquement sur `spectral_type`.

---

## 2. Détail du problème

### 2.1 Données en base

| Table | Colonne | Rôle | Exemple pulsar |
|-------|---------|------|----------------|
| stellar_systems | object_type | Type d'objet principal du système | PULSAR |
| stellar_systems | spectral_type | Classe spectrale (Morgan-Keenan) | **NULL** |
| stellar_systems | id, name | Identifiant | psr-j1835-0928, PSR J1835-0928 |

- **3918 pulsars** en base : `object_type = PULSAR`, `spectral_type` souvent NULL.
- **Types exotiques** : PULSAR, NEUTRON_STAR, MAGNETAR, WHITE_DWARF, BLACK_HOLE.
- **Étoiles classiques** : `object_type = STAR`, `spectral_type` = G2V, M5V, etc.

### 2.2 Chaîne de causalité (bug)

```
1. Tuile détail affiche "Type" via selectedStarClassLabel
2. selectedStarClassLabel = getStarClassLabel(spectral_type ?? spectral)
3. Pour pulsar : spectral_type = null → spectral = '?' (fallback buildStarsFromDb)
4. getStarClassLabel('?') appelle getSpectralLetter('?')
5. getSpectralLetter('?') : pas de préfixe PSR, pas de lettre OBAFGKM… → retourne 'M'
6. STAR_TYPE_LABELS['M'] = 'Naine rouge'
7. Affichage : « Naine rouge » ❌
```

**Cause racine** : `getStarClassLabel` ne reçoit qu'une chaîne (`spectral_type`) et ignore `object_type`. Elle ne peut pas distinguer un pulsar d'une étoile M.

### 2.3 Incohérence des sources de données

| Source | object_type exposé ? | Utilisé par |
|--------|----------------------|-------------|
| get_systems_for_conception | ✅ Oui | Vue 3D conception |
| get_visible_systems | ❌ Non | Observatoire, ciel |
| stellarStore.fetch() (list) | ❌ Non | Carte, fallback |
| searchSystems | ❌ Non | Recherche étoiles |

→ Seule la Vue conception reçoit `object_type`. Les autres vues (Carte, Observatoire, recherche) n'ont pas cette donnée.

### 2.4 Deux niveaux à distinguer

| Niveau | Table | Contexte | Volume |
|--------|-------|----------|--------|
| **Catalogue** | stellar_systems | Liste systèmes, détail système, conception | 48 195 |
| **Drill-down** | system_objects | Vue orbitale, corps sélectionné | 2 155 |

- **Pulsars** : uniquement dans stellar_systems (object_type). Pas d'objet dans system_objects (supprimé migration 00035).
- **Planètes** : uniquement dans system_objects.
- Ne pas mélanger les deux niveaux.

---

## 3. Manifestations du problème par vue

| Vue / Composant | Contexte | Donnée disponible | Affichage actuel | Correct ? |
|-----------------|----------|-------------------|------------------|-----------|
| **PageConceptionEtoiles** (tuile) | Système sélectionné | conceptionForSky (object_type ✅) | getStarClassLabel(spectral) → Naine rouge | ❌ |
| **PageConceptionEtoiles** (filtre) | Filtre type | conceptionForSky | getStarTypeForFilter → PULSAR | ✅ |
| **PageConceptionEtoiles** (texture 3D) | Sprite étoile | p.star | getSpectralLetter(spectral) → M | ❌ |
| **PageCarte** (détail système) | Système sans drill | list (object_type ❌) | getStarClassLabel(spectral) | ❌ |
| **PageCarte** (détail étoile) | Corps drill-down | system_objects | type === PULSAR → Pulsar | ✅ (obsolète : plus de PULSAR) |
| **CarteMap3D** (tooltip) | Survol point | list | getStarClassLabel(spectral) | ❌ |
| **StarAutocompleteMenu** | Résultats recherche | searchSystems | getStarClassLabel(spectral) | ❌ |
| **TravelWidget** | Système cible | selectedStar | spectral brut | ⚠️ |
| **Observatoire** (ciel) | Points affichés | visibleForSky | Pas d'affichage type | — |

---

## 4. Options de résolution

### Option A — Correction minimale (Vue conception uniquement)

**Principe** : Corriger uniquement les endroits où `object_type` est déjà disponible (conceptionForSky).

**Actions** :
1. Créer `getStarDisplayLabel(star)` : si object_type exotique → libellé ; sinon → getStarClassLabel(spectral_type).
2. Utiliser `getStarDisplayLabel(selectedStellar)` dans la tuile conception.
3. Adapter la texture 3D : utiliser object_type pour choisir star-pulsar.svg quand pertinent.

**Avantages** : Faible surface de modification, pas de changement RPC/DB.  
**Inconvénients** : Carte, recherche, Observatoire restent incorrects si un pulsar y apparaît.

---

### Option B — Exposer object_type partout (recommandé)

**Principe** : Rendre `object_type` disponible dans toutes les sources, puis appliquer la logique de branchement Y partout.

**Actions** :
1. **Backend** : Ajouter `object_type` dans get_visible_systems, SKY_COLUMNS, searchSystems.
2. **Front** : Créer `getStarDisplayLabel(star)` (branchement Y : object_type exotique vs spectral).
3. **Front** : Créer `getDisplayLetterForObject(star)` pour textures/icônes.
4. Remplacer `getStarClassLabel(spectral_type)` par `getStarDisplayLabel(star)` dans toutes les vues qui ont accès à l'objet complet.

**Avantages** : Cohérence totale, extensible (WHITE_DWARF, BLACK_HOLE futurs).  
**Inconvénients** : Modifications RPC, store, plusieurs composants.

---

### Option C — Branchement Y + table exotic_objects

**Principe** : Comme B, plus une table dédiée `exotic_objects` pour les détails spécifiques (période, champ magnétique, etc.).

**Actions** :
1. Créer table `exotic_objects` (1:1 stellar_systems) avec colonnes par type.
2. Migrer stellar_systems.attributes (pulsars) vers exotic_objects.
3. Suivre Option B pour l'affichage du type.

**Avantages** : Schéma propre, fiches détail exotiques facilitées.  
**Inconvénients** : Migration data, jointures supplémentaires.

---

### Option D — Détection par convention (sans object_type)

**Principe** : Étendre `getSpectralLetter` / `getStarClassLabel` pour détecter les pulsars via id/name (préfixe PSR) même sans object_type.

**Actions** :
1. Modifier `getStarClassLabel` pour accepter un objet `{ spectral_type, id, name }`.
2. Si id/name commence par PSR → retourner « Pulsar » avant d'analyser spectral_type.
3. Propager l'objet (ou au moins id/name) partout où on appelle getStarClassLabel.

**Avantages** : Pas de changement backend.  
**Inconvénients** : Heuristique fragile (PSR dans le nom), ne couvre pas tous les exotiques (NEUTRON_STAR, MAGNETAR sans préfixe PSR), mélange de responsabilités.

---

### Option E — Correction ciblée (sélection utilisateur)

**Principe** : Corriger uniquement les chemins où un pulsar peut être **sélectionné** et affiché (sans chercher à afficher les pulsars partout).

**Actions** :
1. Identifier les points d'entrée : Vue conception (clic), Observatoire (recherche + clic si pulsar trouvé).
2. S'assurer que ces chemins reçoivent object_type (conception oui, recherche non → ajouter object_type à searchSystems).
3. Utiliser getStarDisplayLabel(star) pour l'affichage du type au moment de la sélection.

**Avantages** : Périmètre limité, objectif métier respecté.  
**Inconvénients** : Tooltips, listes, Carte peuvent rester incorrects en survol/navigation.

---

## 5. Synthèse des options

| Option | Backend | Front | Périmètre | Robustesse |
|--------|---------|-------|-----------|------------|
| A — Minimale | Non | Tuile + texture conception | Conception uniquement | Faible |
| B — Exposer partout | Oui (RPC, selects) | getStarDisplayLabel partout | Toutes les vues | Forte |
| C — + exotic_objects | Oui (nouvelle table) | Comme B | Toutes + fiches détail | Très forte |
| D — Convention id/name | Non | getStarClassLabel étendu | Partiel | Fragile |
| E — Ciblée sélection | Partiel (searchSystems) | Points de sélection | Conception, instruments | Moyenne |

---

## 6. Recommandation

**Option B** (exposer object_type partout) offre le meilleur rapport coût/bénéfice :
- Une seule source de vérité (stellar_systems.object_type).
- Branchement Y clair : STAR → spectral ; exotiques → libellés dédiés.
- Pas de nouvelle table, pas d'heuristique fragile.
- Extensible pour WHITE_DWARF, BLACK_HOLE, fiches détail futures.

**Option E** peut suffire si l'objectif est strictement « ne jamais cataloguer un pulsar sélectionné comme naine rouge », sans corriger les tooltips/listes secondaires.
