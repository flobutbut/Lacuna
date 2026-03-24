# Diagnostic — stellar_systems vs system_objects : ne pas mélanger

**Date** : 2026-03-17  
**Contexte** : Branchement Y (étoile vs objets exotiques), fiches détail spécifiques, risque de confusion entre les deux tables.

---

## 1. Deux tables, deux rôles

### 1.1 `stellar_systems` — catalogue des systèmes

| Attribut | Valeur |
|----------|--------|
| **Rôle** | Un enregistrement = un **système** (position dans la galaxie) |
| **Volume** | ~48 195 lignes |
| **Granularité** | 1 ligne = 1 système stellaire |
| **Colonnes clés** | id, name, coordinates, distance, spectral_type, **object_type**, attributes |

**object_type** (migration 00032) : STAR (43 775), PULSAR (3 918), WHITE_DWARF (500), BLACK_HOLE (2), etc.  
→ Décrit le **type d’objet principal du système** au niveau catalogue.

**Relation** : système « père » pour les objets qu’il contient. Pas de notion d’orbite ni de hiérarchie interne.

---

### 1.2 `system_objects` — corps à l’intérieur des systèmes

| Attribut | Valeur |
|----------|--------|
| **Rôle** | Un enregistrement = un **corps** (étoile, planète, lune, disque, etc.) |
| **Volume** | ~2 155 lignes |
| **Granularité** | N lignes par système (N ≥ 0) |
| **Colonnes clés** | system_id (FK → stellar_systems), type, designation, orbital_*, mass_*, etc. |

**type** : STAR, PLANET, MOON, MINOR_BODY, DEBRIS_DISK, PULSAR, NEUTRON_STAR, MAGNETAR.  
→ Décrit le **type de chaque corps** dans un système.

**Relation** : `system_id` → `stellar_systems.id`. Hiérarchie possible (parent_id pour les lunes).

---

## 2. Couverture réelle des données

| Table | Objets | Détail |
|-------|--------|--------|
| stellar_systems | 48 195 | Presque tous les systèmes connus (HYG, SIMBAD, ATNF) |
| system_objects | 2 155 | Uniquement systèmes « détaillés » (SOL, exoplanètes, PSR_B1919, etc.) |

**Répartition system_objects** : PLANET 2 052, STAR 97, DEBRIS_DISK 4, NEUTRON_STAR 1. (PULSAR supprimé — migration 00035, objet artificiel.)

La plupart des systèmes n’ont **aucune** ligne dans `system_objects`.  
Ex. les ~3 918 pulsars en base sont dans `stellar_systems` ; un seul (PSR B1919) a une entrée correspondante dans `system_objects`.

---

## 3. Contextes d’usage et sources de type

### 3.1 Contexte « catalogue » (niveau système)

| Vue / composant | Données | Type utilisé | Table |
|-----------------|---------|--------------|-------|
| Vue 3D conception (points) | conceptionForSky | object_type | stellar_systems (RPC) |
| Filtre type conception | conceptionForSky | object_type | stellar_systems |
| PageCarte — détail système | stellarBySystemId (list) | spectral_type seul | stellar_systems (sans object_type) |
| CarteMap3D (tooltip) | stellarStore.list | spectral_type seul | stellar_systems |
| Recherche / autocomplete | searchSystems | spectral_type seul | stellar_systems |
| Observatoire (ciel) | visibleForSky | spectral_type seul | stellar_systems |

→ Ici, la notion de type vient de **stellar_systems** (object_type + spectral_type).

---

### 3.2 Contexte « drill-down » (niveau objet)

| Vue / composant | Données | Type utilisé | Table |
|-----------------|---------|--------------|-------|
| PageCarte — détail étoile | selectedStar (system_object) | type | system_objects |
| Vue Système (CarteOrbitalView) | system_objects | type | system_objects |
| ObservatoirePanel — corps | system_objects → toBodyFormat | type | system_objects |
| SystemView (tooltip étoile) | star (system_object) | type | system_objects |

→ Ici, la notion de type vient de **system_objects.type**.

---

## 4. Risques de mélange

### 4.1 Confusion étoile vs pulsar

- **stellar_systems** : object_type = PULSAR pour ~3 918 systèmes.
- **system_objects** : plus de PULSAR (objet artificiel supprimé migration 00035).

Si on branche sur `system_objects.type` pour tous les pulsars, on rate les ~3 917 autres (qui n’ont pas d’objet).  
Si on branche sur `stellar_systems.object_type`, on ne couvre pas les cas où on affiche un corps sélectionné dans la Vue Système.

→ Il faut **distinguer le niveau** (système vs objet) avant d’appliquer la logique exotique.

### 4.2 `toBodyFormat` et types exotiques

```js
// systemObjects.toBodyFormat — mapping actuel
const typeMap = {
  STAR: 'ETOILE',
  PLANET: 'PLANETE',
  MOON: 'PLANETE',
  MINOR_BODY: 'MINEUR',
  DEBRIS_DISK: 'MINEUR',
  // PULSAR, NEUTRON_STAR, MAGNETAR absents
}
const bodyType = typeMap[obj.type] || 'PLANETE'  // PULSAR → 'PLANETE' !
```

→ Un `system_object` de type PULSAR est transformé en PLANETE, ce qui casse l’affichage et les fiches.

### 4.3 Planètes et objets exotiques

- **Planètes** : uniquement dans `system_objects` (type PLANET, MOON, MINOR_BODY).
- **Pulsars / magnétars** : surtout dans `stellar_systems` (object_type), rarement dans `system_objects`.

Si on applique la même logique « objet central vs planète » aux deux tables sans distinguer le niveau, on risque de traiter un pulsar comme une planète ou d’ignorer les pulsars de catalogue.

---

## 5. Schéma du branchement Y (par niveau)

### 5.1 Niveau stellar_systems (catalogue)

```
stellar_systems (ligne système)
         │
         ▼
   object_type ?
         │
    ┌────┴────┐
    │         │
  STAR    PULSAR / NEUTRON_STAR / MAGNETAR / WHITE_DWARF / BLACK_HOLE
    │         │
    ▼         ▼
Pipeline     Pipeline exotique
spectral     (stellar_systems.attributes, libellés, icônes)
(spectral_type)
```

- **Source** : `stellar_systems.object_type`.
- **Contexte** : Vue conception, liste catalogue, recherche, détail système (côté stellar_systems).

---

### 5.2 Niveau system_objects (drill-down)

```
system_objects (ligne corps)
         │
         ▼
   type ?
         │
    ┌────┴────────────────────────┐
    │                             │
  STAR, PULSAR,              PLANET, MOON, MINOR_BODY,
  NEUTRON_STAR, MAGNETAR     DEBRIS_DISK
    │                             │
    ▼                             ▼
Objet central                 Pipeline planétaire
    │                         (orbites, atmosphère, etc.)
    ├── STAR → pipeline spectral
    └── PULSAR / NEUTRON_STAR / MAGNETAR → pipeline exotique
```

- **Source** : `system_objects.type`.
- **Contexte** : Vue Système, détail étoile sélectionnée, ObservatoirePanel, etc.

---

## 6. Fiches détail et niveaux

### 6.1 Fiche « système » (niveau stellar_systems)

- **Données** : stellar_systems (id, name, object_type, spectral_type, distance, attributes, etc.).
- **Branchement** : object_type.
- **Contenu type** :
  - STAR : infos spectrales (spectral_type), magnitude, zone habitable éventuelle.
  - PULSAR / NEUTRON_STAR / MAGNETAR : attributes (période, champ magnétique, etc.), pas de zone habitable.
  - WHITE_DWARF / BLACK_HOLE : champs adaptés à chaque type.

→ Fiche générique par type, sans accès aux planètes (qui sont dans system_objects).

---

### 6.2 Fiche « corps » (niveau system_objects)

- **Données** : system_objects (type, designation, orbital_*, mass_*, etc.) + stellar_systems pour le contexte.
- **Branchement** : type.
- **Contenu type** :
  - STAR : spectral_type, masse, luminosité, zone habitable.
  - PULSAR / NEUTRON_STAR / MAGNETAR : attributes d’émission, période, etc.
  - PLANET / MOON : orbite, composition, atmosphère.

→ Ne pas confondre avec la fiche système : ici on parle d’un corps précis dans un système.

---

### 6.3 Systèmes sans system_objects

Pour ~46 000 systèmes (dont la plupart des pulsars) :
- Fiche disponible : uniquement au niveau **stellar_systems**.
- Pas de Vue Système orbitale (pas de planètes ni d’objets détaillés).
- Branchement : uniquement `stellar_systems.object_type`.

---

## 7. Points à corriger

| Problème | Niveau | Action |
|----------|--------|--------|
| Pulsar affiché « Naine rouge » | stellar_systems | Utiliser object_type dans les vues catalogue (conception, détail système) |
| toBodyFormat : PULSAR → PLANETE | system_objects | Ajouter PULSAR, NEUTRON_STAR, MAGNETAR dans le mapping |
| object_type absent des RPC / selects | stellar_systems | Exposer object_type dans get_visible_systems, list, searchSystems |
| Mélange des contextes | — | Documenter clairement stellar_systems vs system_objects et ne pas mélanger les logiques |

---

## 8. Récapitulatif

| Question | Réponse |
|----------|---------|
| Où est le type pour un système catalogue ? | `stellar_systems.object_type` |
| Où est le type pour un corps (étoile, planète) ? | `system_objects.type` |
| Fiches détail par type d’objet ? | Oui : fiches « système » (stellar_systems) et fiches « corps » (system_objects) avec contenu différent selon le type |
| Risque principal ? | Utiliser system_objects pour tous les pulsars (1 seul) ou stellar_systems pour les corps orbitaux (planètes absentes) |
| Règle simple | **Niveau système** → stellar_systems.object_type. **Niveau objet** → system_objects.type. Ne pas croiser. |
