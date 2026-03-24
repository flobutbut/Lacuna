# Diagnostic — Pipeline type stellaire (Database → écran)

**Date** : 2026-03-17  
**Contexte** : Affichage correct du type d’objet (étoile, pulsar, naine blanche, etc.) dans toutes les vues. Un pulsar affiche « Naine rouge » dans la tuile de détail (Vue conception).

---

## 1. Modèle de données (base)

### 1.1 `stellar_systems`

| Colonne         | Type   | Description                                                       |
|-----------------|--------|-------------------------------------------------------------------|
| object_type     | TEXT   | STAR (défaut), WHITE_DWARF, NEUTRON_STAR, PULSAR, MAGNETAR, BLACK_HOLE |
| spectral_type   | TEXT   | G2V, M5.5V, PSR B1919+21, ou **NULL** (pulsars)                   |

- **3918 pulsars** en base (object_type = PULSAR, spectral_type souvent NULL)
- Source : import SIMBAD, patch ATNF

### 1.2 `system_objects`

| Colonne       | Type   | Description                                   |
|---------------|--------|-----------------------------------------------|
| type          | ENUM   | STAR, PLANET, MOON, PULSAR, NEUTRON_STAR, MAGNETAR |
| spectral_type | TEXT   | Par objet (étoile principale du système)      |

- Peu d’entrées exotiques (ex. 1 PULSAR dans system_objects vs 3918 dans stellar_systems)
- Utilisé pour la Vue Système (détail d’un système visité)

---

## 2. Sources de données front (RPC / select)

### 2.1 RPC `get_visible_systems`

- **Utilisé par** : Observatoire (ciel), chargement `visibleForSky`
- **Colonnes retournées** : id, name, spectral_type, distance, age, planets, habitable_zone, anomaly_level, coordinates, apparent_magnitude, luminosity, color_index
- **object_type** : ❌ **non retourné**

### 2.2 RPC `get_systems_for_conception`

- **Utilisé par** : Vue 3D conception
- **Colonnes retournées** : id, name, spectral_type, distance, age, planets, habitable_zone, anomaly_level, coordinates, apparent_magnitude, luminosity, color_index, **object_type**
- **object_type** : ✅ retourné (migration 00034 : priorité stellar_systems.object_type)

### 2.3 Select direct `stellar_systems`

- **Utilisé par** : `stellarStore.fetch()` (list), passe 2 de `fetchVisibleForSky`, `searchSystems`
- **Colonnes** : id, name, spectral_type, distance, … (SKY_COLUMNS / searchSystems)
- **object_type** : ❌ **non sélectionné**

### 2.4 Synthèse des sources

| Source                 | object_type | Contexte                               |
|------------------------|-------------|----------------------------------------|
| get_visible_systems    | ❌          | Observatoire, ciel                     |
| get_systems_for_conception | ✅     | Vue 3D conception uniquement           |
| fetch() → list         | ❌          | Carte, recherche, fallback             |
| searchSystems          | ❌          | Recherche Observatoire / Conception    |

---

## 3. Stores

### 3.1 `stellarSystems`

| Propriété          | Source                            | object_type |
|--------------------|-----------------------------------|-------------|
| list               | fetch()                           | ❌          |
| visibleForSky      | get_visible_systems + select      | ❌          |
| conceptionForSky   | get_systems_for_conception        | ✅          |

### 3.2 `systemObjects`

- Données par système : `getForSystem(systemId)` → objets avec `type` (STAR, PULSAR, PLANET, etc.)
- Utilisé pour la Vue Système (détail orbital) et PageCarte quand on a un `selectedStar` (objet système)

---

## 4. Vues et affichage du type

### 4.1 Vue 3D conception (`PageConceptionEtoiles`)

| Élément                 | Donnée                    | Fonction / logique                      | object_type utilisé ? |
|-------------------------|---------------------------|----------------------------------------|------------------------|
| Points 3D (étoiles)     | conceptionForSky          | buildStarsFromDb → star                 | ✅ dans star           |
| Filtre type             | conceptionForSky          | getStarTypeForFilter(star)              | ✅                    |
| Tuile « Type »          | selectedStellar / selectedStar | getStarClassLabel(spectral_type)   | ❌                    |
| Tuile « Type spectral » | selectedStellar           | spectral_type brut                      | —                     |
| Texture / sprite        | p.star                    | getSpectralLetter(spectral_type)        | ❌                    |

- **Bug** : `selectedStarClassLabel` appelle `getStarClassLabel(spectral_type)` → ignore `object_type` → pulsar avec spectral_type null → fallback `'?'` → getSpectralLetter → `'M'` → « Naine rouge ».

### 4.2 Carte (`PageCarte`)

| Contexte              | Donnée            | Affichage Type                         | object_type ? |
|-----------------------|-------------------|----------------------------------------|---------------|
| Détail étoile (drill) | selectedStar      | system_objects.type                    | ✅ PULSAR → « Pulsar » |
| Détail système        | selectedStellar   | getStarClassLabel(spectral_type)       | ❌           |
| stellarBySystemId     | stellarStore.list | —                                      | ❌           |

- list n’a pas object_type → détail système affiche toujours type spectral, jamais Pulsar/Naine blanche, etc.

### 4.3 Carte 3D (`CarteMap3D`)

| Élément   | Donnée           | Affichage                              | object_type ? |
|-----------|------------------|----------------------------------------|---------------|
| Points    | stellarStore.list| spectralType = stellar.spectral_type   | ❌            |
| Tooltip   | hoveredPoint     | getStarClassLabel(spectralType)        | ❌            |

- list sans object_type → pas de distinction pulsar/étoile.

### 4.4 Observatoire

| Élément           | Donnée           | Affichage                | object_type ? |
|-------------------|------------------|---------------------------|---------------|
| ui.selectedStar   | buildStarsFromDb | spectral, dist, etc.      | Dépend de la source (visibleForSky vs conception) |
| ObservatoirePanel | system_objects   | Corps (planètes, étoile)  | ✅ via system_objects.type |
| SkyCanvas         | visibleForSky    | Pas d’affichage type      | ❌            |

### 4.5 Recherche / autocomplete (`StarAutocompleteMenu`)

| Élément  | Donnée   | Affichage                         | object_type ? |
|----------|----------|-----------------------------------|---------------|
| items    | searchMatches | getStarClassLabel(s.spectral_type) | ❌          |

- searchSystems ne retourne pas object_type.

### 4.6 TravelWidget

| Élément | Donnée           | Affichage          | object_type ? |
|---------|------------------|--------------------|---------------|
| TYPE    | ui.selectedStar  | spectral (brut)    | ❌            |

### 4.7 Vue Système (`SystemView`)

| Élément      | Donnée        | Affichage                      | object_type ? |
|--------------|---------------|--------------------------------|---------------|
| Tooltip corps| system_objects| obj.type → ETOILE / planète    | ✅            |
| Étoile SVG   | star.type     | PULSAR → 'PSR', sinon spectral | ✅            |

- Données system_objects → type correct pour PULSAR.

### 4.8 Illustrations / textures

| Composant            | Donnée        | Logique                                      | object_type ? |
|----------------------|---------------|----------------------------------------------|---------------|
| getStarSvgPath       | spectralType  | getSpectralLetter(spectralType)              | ❌            |
| getStarIconUrlForNode| stellar       | getSpectralLetter(stellar.spectral_type)     | ❌            |
| Stars3DCanvas        | p.star        | getSpectralLetter(spectral_type)             | ❌            |
| CarteMap3D           | stellar       | getSpectralLetter(p.spectralType)            | ❌            |
| StarSvgInline        | spectralType  | getSpectralLetter(props.spectralType)        | ❌            |

---

## 5. Fonctions de classification (`starClassification.js`)

| Fonction                 | Entrée           | Utilise object_type ? | Rôle                          |
|--------------------------|------------------|------------------------|-------------------------------|
| getSpectralLetter        | string           | ❌                     | spectral_type → lettre        |
| getSpectralLetterFromObject | objet (type, spectral) | ✅ (type PULSAR) | Objet → lettre (vue système)  |
| getStarClassLabel        | string           | ❌                     | spectral_type → libellé       |
| getStarTypeForFilter     | objet complet    | ✅                     | Filtre conception             |

- `getStarClassLabel` ne reçoit qu’une chaîne → ne peut pas prendre en compte object_type.

---

## 6. Synthèse des écarts

| Problème                         | Cause                                             |
|----------------------------------|---------------------------------------------------|
| Pulsar = « Naine rouge » (tuile) | getStarClassLabel(spectral_type) sans object_type |
| object_type absent ailleurs      | RPC et selects n’exposent pas object_type         |
| Incohérence Vue Système vs reste | SystemView utilise system_objects, autres vues stellar_systems sans object_type |

---

## 7. Pistes de correction

### 7.1 Exposer object_type partout

1. **get_visible_systems** : ajouter `ss.object_type` dans le RETURNS TABLE.
2. **stellarStore** : inclure `object_type` dans SKY_COLUMNS et dans les selects (fetch, searchSystems).
3. **useSkyStars** : propager `object_type` dans `star` pour buildStarsFromDb.

### 7.2 Fonction d’affichage unifiée

- Créer `getStarDisplayLabel(star)` :
  - Si `object_type` ∈ {PULSAR, NEUTRON_STAR, MAGNETAR, WHITE_DWARF, BLACK_HOLE} → libellé depuis mapping object_type.
  - Sinon (STAR ou null) → `getStarClassLabel(spectral_type)`.
- Remplacer les appels à `getStarClassLabel(spectral_type)` par `getStarDisplayLabel(star)` lorsque l’objet complet est disponible.

### 7.3 Représentation visuelle

- Étendre `getSpectralLetter` ou ajouter `getDisplayLetterForObject(star)` qui tient compte de `object_type` pour le choix de la texture/icône (PULSAR → star-pulsar.svg, etc.).

### 7.4 Ordre recommandé

1. Exposer object_type dans toutes les sources (RPC + selects).
2. Implémenter getStarDisplayLabel et l’utiliser partout où on affiche un type.
3. Adapter la logique de texture/icône pour utiliser object_type quand disponible.
