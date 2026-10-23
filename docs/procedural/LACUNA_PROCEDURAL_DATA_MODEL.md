# LACUNA — Modèle de données procédural
*Version 0.1 — Mars 2026*

> Contrat transversal qui gouverne toute génération procédurale et toute extrapolation
> dans LACUNA. Tous les scripts de génération, d'import et de migration doivent
> respecter ces règles sans exception.
>
> Documents dépendants : `LACUNA_PROCEDURAL_PLANETS.md`, `LACUNA_PROCEDURAL_TRACES.md`, `LACUNA_INSTRUMENTAL_EXTRAPOLATION.md`
> Document distinct de l'architecture backend technique → voir `Documentation-backend.md`

---

## Table des matières

1. [Règle absolue](#1-règle-absolue)
2. [Seed déterministe](#2-seed-déterministe)
3. [Traçabilité des sources — field_sources](#3-traçabilité-des-sources--field_sources)
4. [Hiérarchie des sources](#4-hiérarchie-des-sources)
5. [Couches de données](#5-couches-de-données)
6. [Lazy generation](#6-lazy-generation)
7. [Cohérence inter-scripts](#7-cohérence-inter-scripts)
8. [Migration SQL requise](#8-migration-sql-requise)

---

## 1. Règle absolue

> **On ne remplace jamais une donnée sourcée. On comble uniquement les trous.**

Un champ qui a une valeur et une source dans `field_sources` est **intouchable**
par tout processus automatique — génération procédurale, extrapolation, import,
migration — quelle que soit la raison invoquée.

```python
def can_write_field(field_name: str, current_value, field_sources: dict) -> bool:
    """
    Retourne True uniquement si le champ est vide ET sans source enregistrée.
    Tout le reste est protégé.
    """
    if current_value is not None:
        return False  # Valeur existante → intouchable
    if field_sources.get(field_name) is not None:
        return False  # Source enregistrée → intouchable
    return True       # NULL sans source → trou → on peut écrire
```

Cette règle s'applique sans exception à :
- Tout script de génération procédurale
- Toute extrapolation calibrée
- Tout import automatique (HYG, NASA, SIMBAD, Gaia)
- Tout script de migration

**Seule exception** : une action MANUAL explicite dans le backoffice,
qui requiert une confirmation avant d'écraser une donnée sourcée.

---

## 2. Seed déterministe

Toute génération aléatoire dans LACUNA est **reproductible** — même seed,
même résultat, pour tous les joueurs et à toutes les exécutions.

```python
import hashlib, random

SEED_GLOBAL = "LACUNA-GALAXY-V1"

def make_rng(system_id: str) -> random.Random:
    """RNG déterministe unique par système."""
    seed = int(hashlib.sha256(
        f"{SEED_GLOBAL}:{system_id}".encode()
    ).hexdigest(), 16) % (2**32)
    return random.Random(seed)

def make_rng_object(system_id: str, object_designation: str) -> random.Random:
    """RNG déterministe unique par objet dans un système."""
    seed = int(hashlib.sha256(
        f"{SEED_GLOBAL}:{system_id}:{object_designation}".encode()
    ).hexdigest(), 16) % (2**32)
    return random.Random(seed)
```

**Conséquence** : deux joueurs visitant le même système voient exactement
les mêmes planètes, les mêmes données extrapolées, les mêmes anomalies.
La galaxie est partagée.

---

## 3. Traçabilité des sources — field_sources

### 3.1 Principe

Chaque champ de données peut provenir de sources différentes. Cette provenance
est tracée dans un champ JSONB dédié sur chaque table — sans dupliquer les colonnes.

```sql
-- Présent dans stellar_systems et system_objects
field_sources jsonb DEFAULT '{}'::jsonb
```

### 3.2 Valeurs de source

| Valeur | Signification | Fiabilité |
|--------|---------------|-----------|
| `"JWST"` | Détection JWST/Hubble | ★★★★★ |
| `"GAIA"` | Catalogue Gaia DR3 | ★★★★★ |
| `"NASA"` | NASA Exoplanet Archive | ★★★★★ |
| `"SIMBAD"` | Base SIMBAD/CDS Strasbourg | ★★★★☆ |
| `"ATNF"` | ATNF Pulsar Catalogue | ★★★★☆ |
| `"HYG"` | HYG Database v4 | ★★★★☆ |
| `"MANUAL"` | Saisi dans le backoffice | ★★★☆☆ |
| `"COMPUTED"` | Dérivé depuis coordonnées (ex. constellation depuis x/y/z) | ★★★☆☆ |
| `"EXTRAPOLATED"` | Calculé depuis propriétés connues | ★★☆☆☆ |
| `"PROCEDURAL"` | Généré depuis le seed | ★☆☆☆☆ |

### 3.3 Exemples

**stellar_systems.field_sources**
```json
{
  "spectral_type": "HYG",
  "luminosity": "HYG",
  "apparent_magnitude": "HYG",
  "color_index": "HYG",
  "distance": "HYG",
  "age": "NASA",
  "chemical_region_id": "EXTRAPOLATED",
  "has_magnetic_field": "EXTRAPOLATED"
}
```

**system_objects.field_sources**
```json
{
  "orbital_semi_major_axis_au": "NASA",
  "orbital_period_days": "NASA",
  "mass_earth": "NASA",
  "radius_earth": "NASA",
  "surface_temperature_k": "NASA",
  "in_habitable_zone": "NASA",
  "atmosphere_composition": "JWST",
  "density_profile": "EXTRAPOLATED",
  "thermal_map": "EXTRAPOLATED",
  "magnetic_field": "EXTRAPOLATED",
  "surface_composition": "EXTRAPOLATED",
  "sample_analysis": "EXTRAPOLATED"
}
```

### 3.4 Mise à jour de field_sources

```python
def write_field(obj: dict, field: str, value, source: str, field_sources: dict) -> bool:
    """
    Écrit une valeur si et seulement si le champ est vide et sans source.
    Retourne True si l'écriture a eu lieu.
    """
    if not can_write_field(field, obj.get(field), field_sources):
        return False
    obj[field] = value
    field_sources[field] = source
    return True
```

---

## 4. Hiérarchie des sources

Lors d'un import ou d'une mise à jour, la source entrante est comparée
à la source existante. La source la plus fiable gagne.

```
JWST = GAIA = NASA > SIMBAD = HYG > MANUAL = COMPUTED > EXTRAPOLATED > PROCEDURAL
```

```python
SOURCE_PRIORITY = {
    "JWST": 100, "GAIA": 100, "NASA": 100,
    "SIMBAD": 80, "ATNF": 80, "HYG": 80,
    "MANUAL": 60, "COMPUTED": 60,  # Dérivé depuis coordonnées
    "EXTRAPOLATED": 30,
    "PROCEDURAL": 10,
}

def should_update(incoming_source: str, existing_source: str) -> bool:
    """
    Une source entrante peut écraser une source existante
    uniquement si elle est strictement plus fiable.
    """
    if existing_source is None:
        return True  # Trou → toujours écrire
    incoming_p = SOURCE_PRIORITY.get(incoming_source, 0)
    existing_p = SOURCE_PRIORITY.get(existing_source, 0)
    return incoming_p > existing_p
    # Égalité → ne pas écraser (premier arrivé, premier servi)
```

**Cas MANUAL** : une source MANUAL ne peut jamais être écrasée automatiquement,
même par une source de fiabilité supérieure. Elle représente une décision
éditoriale intentionnelle.

```python
def should_update_with_manual_protection(incoming_source, existing_source):
    if existing_source == "MANUAL":
        return False  # Jamais — décision éditoriale protégée
    return should_update(incoming_source, existing_source)
```

---

## 5. Couches de données

Toute donnée dans LACUNA appartient à l'une de ces couches :

```
COUCHE 1 — Mesure réelle
  Sources : NASA, HYG, JWST, GAIA, SIMBAD
  Nature  : Observation astronomique confirmée
  Règle   : Source de vérité — ne jamais écraser sauf source plus fiable

COUCHE 2 — Décision éditoriale
  Source  : MANUAL
  Nature  : Saisie intentionnelle dans le backoffice
  Règle   : Intouchable par tout processus automatique

COUCHE 3 — Extrapolation calibrée
  Source  : EXTRAPOLATED
  Nature  : Calculé depuis des propriétés connues + lois physiques réelles
  Règle   : Comble les trous de couche 1 — jamais sur une valeur existante

COUCHE 4 — Génération procédurale
  Source  : PROCEDURAL
  Nature  : Généré depuis le seed — plausible mais non calibré
  Règle   : Comble les trous de couches 1, 2, 3 — priorité la plus basse
```

---

## 6. Lazy generation

La génération procédurale et l'extrapolation sont **lazy** — exécutées
à la première visite du système, jamais en masse au démarrage.

```
Système non visité → aucune donnée procédurale en base
Première visite    → génération déclenchée, données écrites en base
Visites suivantes  → lecture des données déjà générées
```

**Avantage** : la base ne stocke que ce qui a été découvert. Les systèmes
non visités restent vierges — l'espace reste inexploré jusqu'à ce qu'un
joueur y mette le cap.

**Implémentation** : le trigger de génération est déclenché par l'événement
`ARRIVED` du vaisseau, côté serveur (Edge Function Supabase ou backend).

---

## 7. Cohérence inter-scripts

Tous les scripts de génération partagent le même RNG depuis le seed système.
Les données générées par des scripts différents sont donc **cohérentes entre elles**
pour un même système — sans coordination explicite entre les scripts.

```
make_rng("proxima-centauri") → même RNG dans :
  - generate_planets.py
  - extrapolate_atmosphere.py
  - extrapolate_magnetic.py
  - extrapolate_surface.py
```

**Conséquence** : si l'Analyseur orbital révèle une anomalie gravitationnelle
et que le Magnétomètre révèle une anomalie de champ magnétique, les deux anomalies
sont cohérentes en position parce qu'elles découlent du même seed.

---

## 8. Migration SQL — référence complète

> Source de vérité unique pour toutes les migrations. Les fragments SQL présents dans `LACUNA_PROCEDURAL_PLANETS.md`, `LACUNA_PROCEDURAL_TRACES.md` et `LACUNA_INSTRUMENTAL_EXTRAPOLATION.md` renvoient ici — ne pas les dupliquer.

Exécuter dans cet ordre avant tout script de génération.

---

### 8.1 Table `stellar_systems`

```sql
ALTER TABLE public.stellar_systems
  ADD COLUMN IF NOT EXISTS field_sources      jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS chemical_region_id text,
  ADD COLUMN IF NOT EXISTS object_type        text  DEFAULT 'STAR'
    CHECK (object_type IN ('STAR', 'WHITE_DWARF', 'NEUTRON_STAR', 'PULSAR', 'MAGNETAR', 'BLACK_HOLE'));
```

**object_type** : type de l'objet principal du système. Valeurs : STAR (défaut), WHITE_DWARF, NEUTRON_STAR, PULSAR, MAGNETAR, BLACK_HOLE. Source SIMBAD pour les objets exotiques (import `simbad_exotic_import.py`).

**attributes** (stellar_systems, migration 00033) : données extensibles. Pour les pulsars, contient les paramètres ATNF (source `atnf_pulsar_patch.py`) :
- `pulse_period_s` — période de rotation (s)
- `pulse_period_ms` — période en millisecondes
- `rotation_frequency_hz` — fréquence de rotation (Hz)
- `magnetic_field_gauss` — champ magnétique de surface (Gauss)
- `emission_width_w50_ms` — largeur du pulse à 50 % (proxy du cône d'émission)
- `emission_width_w10_ms` — largeur du pulse à 10 %
- `characteristic_age_yr` — âge caractéristique (années)
- `pulsar_type` — type (MSP, AXP, SGR, etc.)

Ces champs alimentent la mécanique de détection directionnelle : W50 / P0 × 360° donne le demi-angle du cône d'émission en degrés.

---

### 8.2 Table `system_objects`

```sql
ALTER TABLE public.system_objects
  -- Traçabilité des sources (voir §3)
  ADD COLUMN IF NOT EXISTS field_sources       jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS data_source         text  DEFAULT 'PROCEDURAL'
    CHECK (data_source IN ('NASA','PROCEDURAL','LACUNA','PLAYER','EXTRAPOLATED','MANUAL')),

  -- Données extrapolées par les instruments (voir LACUNA_INSTRUMENTAL_EXTRAPOLATION.md)
  ADD COLUMN IF NOT EXISTS density_profile     jsonb,
  ADD COLUMN IF NOT EXISTS thermal_map         jsonb,
  ADD COLUMN IF NOT EXISTS magnetic_field      jsonb,
  ADD COLUMN IF NOT EXISTS surface_composition jsonb,
  ADD COLUMN IF NOT EXISTS sample_analysis     jsonb;
```

---

### 8.3 Table `traces`

```sql
ALTER TABLE public.traces
  -- Traçabilité des gabarits procéduraux (voir LACUNA_PROCEDURAL_TRACES.md)
  ADD COLUMN IF NOT EXISTS template_id        text,
  ADD COLUMN IF NOT EXISTS template_variables jsonb;
```

---

### 8.4 Mise à jour des données existantes

Marquer les planètes déjà en base comme données NASA (à exécuter une seule fois après 8.2) :

```sql
UPDATE public.system_objects
SET data_source = 'NASA'
WHERE data_source IS NULL
  AND system_id IN (
    SELECT id FROM public.stellar_systems
    WHERE planets > 0
  );
```

---

### 8.5 Vérification

```sql
-- Vérifier que toutes les colonnes sont présentes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('stellar_systems', 'system_objects', 'traces')
  AND column_name IN (
    'field_sources', 'chemical_region_id', 'data_source',
    'density_profile', 'thermal_map', 'magnetic_field',
    'surface_composition', 'sample_analysis',
    'template_id', 'template_variables'
  )
ORDER BY table_name, column_name;
```

---

## 9. Objets du jeu — schémas de référence

> Schémas JSON des objets manipulés côté client et serveur. Extraits du `LACUNA_GDD.md` et consolidés ici comme contrat de données. Ces schémas définissent la structure attendue — les implémentations peuvent ajouter des champs, jamais en retirer sans versionner.

---

### 9.1 Le Vaisseau

```json
{
  "id": "ark-0042",
  "name": "ARK TESSERA",
  "voyage": 1,
  "generation": 1,
  "departureDate": "2187-01-01",
  "position": {
    "x": 0.0,
    "y": 0.0,
    "z": 0.0
  },
  "travelState": {
    "inTransit": false,
    "destination": null,
    "departureTime": null,
    "arrivalTime": null,
    "phase": null,
    "currentSpeed": 0.0,
    "cruiseSpeed": 0.0,
    "maxSpeedSafe": 0.0,
    "distanceCovered": 0.0,
    "distanceTotal": 0.0,
    "fuelBudgeted": 0.0,
    "detectedInTransit": [],
    "diversionAvailable": false,
    "originalDestination": null
  },
  "systems": {
    "propulsion": 0.88,
    "hull": 0.97,
    "plasmaShield": 1.0,
    "observatory": 1.0,
    "lifeSupport": 0.99
  },
  "fuel": {
    "he3": 0.742,
    "deuterium": 0.81
  },
  "population": { },
  "logbook": [ ],
  "artifacts": [ ],
  "map": { }
}
```

#### États du vaisseau

| État | Description | Conséquences |
|------|-------------|-------------|
| `IDLE` | En orbite / stationnaire | Navigation libre, analyse possible |
| `IN_TRANSIT` | Voyage en cours | Interface réduite, temps qui passe |
| `ARRIVED` | Vient d'arriver | Scan automatique, nouvelles traces potentielles |
| `DAMAGED` | Système en panne | Certaines fonctions indisponibles |

---

### 9.2 La Population

```json
{
  "total": 15000,
  "generation": 1,
  "averageAge": 34.2,
  "birthRate": 0.012,
  "will": 0.82,
  "socialCohesion": 0.67,
  "foodSupply": 0.91,
  "medicalCare": 0.95,
  "culture": "ACTIVE",
  "governance": "TENSION_MINEURE",
  "history": [
    {
      "generation": 1,
      "event": "Départ",
      "will_snapshot": 0.95
    }
  ]
}
```

#### La Volonté (`will`)

Valeur entre 0 et 1. Elle influence la capacité à interpréter des traces complexes, la tolérance aux voyages longs sans découverte, et la résistance aux événements négatifs. Elle baisse lentement lors des voyages sans découverte. Elle peut s'effondrer suite à un événement critique.

#### Événements populationnels

| Événement | Déclencheur probable | Effet |
|-----------|---------------------|-------|
| Épidémie | Voyage très long + cohésion basse | Perte de population, baisse volonté |
| Schisme | Cohésion < 0.3 | Deux factions, interprétations divergentes |
| Renaissance culturelle | Découverte majeure + culture active | Boost volonté, nouvelle génération motivée |
| Panne critique | Intégrité coque < 0.2 | Système indisponible temporairement |
| Naissance d'un prodige | Aléatoire rare | Bonus temporaire en analyse scientifique |

---

### 9.3 Une Trace

```json
{
  "id": "trace-wow-1977-a",
  "designation": "WOW-1977-A",
  "type": "SIGNAL_RADIO",
  "origin": "IMMUABLE",
  "system": "Sagittarius",
  "coordinates": { "x": -2.4, "y": 0.1, "z": 0.8 },
  "age": null,
  "difficulty": 1,
  "realReference": true,
  "description": "Signal radio de 72 secondes détecté à 1420 MHz, correspondant exactement à la raie de l'hydrogène. Non reproduit depuis. Non expliqué.",
  "visual": "waveform",
  "interpretations": [ ],
  "pointsTo": null,
  "discovered": "2187-01-01",
  "discoveredBy": null
}
```

#### Types de traces

| Type | `type` | Description | Exemple réel |
|------|--------|-------------|-------------|
| Signal radio | `SIGNAL_RADIO` | Fréquence, durée, structure | Signal WOW! 1977 |
| Objet interstellaire | `INTERSTELLAR_OBJECT` | Trajectoire, forme, accélération | Oumuamua |
| Anomalie chimique | `CHEMICAL_ANOMALY` | Ratios isotopiques, molécules impossibles | Nucléobases Bennu/Ryugu |
| Anomalie stellaire | `STELLAR_ANOMALY` | Variations de luminosité inexpliquées | Étoile de Tabby |
| Anomalie orbitale | `ORBITAL_ANOMALY` | Géométrie trop régulière | — |
| Séquence codée | `ENCODED_SEQUENCE` | Structure mathématique dans un signal | Code génétique |
| Artefact physique | `PHYSICAL_ARTIFACT` | Objet à géométrie non naturelle | — |
| Trace de joueur | `PLAYER_TRACE` | Déposée par un autre joueur | — |

#### Origines

| Origine | Description |
|---------|-------------|
| `IMMUABLE` | Créée par les développeurs, ancrée dans la vraie science, ne change pas |
| `GENERÉE` | Créée procéduralement à la génération du système |
| `JOUEUR` | Déposée par un autre joueur lors de son passage |
| `PRÉCURSEUR` | Entrée de Yael, prédéfinie, au format d'une trace joueur (migration `00054`) |

Colonnes de `traces` réservées au serveur (jamais lisibles par les joueurs, migration `00055`) : `scenario_arc`, `linked_trace_id`, `precursor_generation`.

---

### 9.4 Une Interprétation

```json
{
  "id": "interp-00847",
  "traceId": "trace-wow-1977-a",
  "playerId": null,
  "generation": 1,
  "shipAge": "47 jours",
  "galacticDate": "2187-02-17",
  "text": "...",
  "direction": "Sagittarius — axe galactique central",
  "confidence": "HYPOTHÈSE",
  "timestamp": "2187-02-17T14:32:00Z"
}
```

Les joueurs sont **anonymes**. Pas de pseudo, pas d'identité. L'interprétation existe seule, datée par sa génération de voyage.

#### Niveaux de confiance

| Valeur | Signification |
|--------|--------------|
| `OBSERVATION` | Je note ce que je vois, sans conclure |
| `HYPOTHÈSE` | Je propose une interprétation possible |
| `CONVICTION` | Je pense savoir ce que c'est |
| `CERTITUDE` | Je suis certain — avec les données que j'ai |

---

### 9.5 Le Carnet de Bord (Logbook)

```json
{
  "entries": [
    {
      "id": "log-001",
      "type": "MANUEL",
      "generation": 1,
      "date": "2187-01-01",
      "title": "Départ",
      "text": "15 000 âmes embarquées. On a regardé la Terre disparaître pendant 4 heures.",
      "linkedTraces": [],
      "linkedSystems": []
    },
    {
      "id": "log-002",
      "type": "AUTO",
      "generation": 1,
      "date": "2187-03-15",
      "title": "Arrivée — HD 44594",
      "text": "Système atteint après 12s. Scan initial : 3 planètes, zone habitable, anomalie de niveau 1 détectée.",
      "linkedTraces": ["trace-hd44594-a"],
      "linkedSystems": ["HD-44594"]
    }
  ]
}
```

#### Types d'entrées

| Type | Auteur | Description |
|------|--------|-------------|
| `MANUEL` | Joueur | Texte libre, écrit dans l'interface Journal |
| `AUTO` | Système | Arrivée, départ, événement notable, trace découverte |
| `GENERATIONNEL` | Système | Passage de génération, résumé de l'héritage |

---

### 9.6 La Carte

```json
{
  "nodes": [
    {
      "systemId": "SOL",
      "name": "Sol",
      "visitedAt": "2187-01-01",
      "generation": 1,
      "tracesFound": 2
    }
  ],
  "edges": [
    {
      "from": "SOL",
      "to": "HD-44594",
      "travelTime": 12,
      "generation": 1
    }
  ],
  "totalDistance": 11.4,
  "systemsVisited": 1
}
```

La carte est **subjective** — elle reflète uniquement les systèmes visités par ce vaisseau. Elle ne se met pas à jour automatiquement quand un système évolue : un nœud visité il y a 200 000 ans simulés peut pointer vers une étoile qui n'existe plus. C'est voulu.

---

### 9.7 L'Équation de Drake (état global)

```json
{
  "R_star": 3.0,
  "fp": 1.0,
  "ne": 0.4,
  "fl": 0.31,
  "fi": 0.10,
  "fc": 0.20,
  "L": 10000,
  "N": 12.4,
  "lastUpdated": "2026-03-05T08:00:00Z",
  "lastDelta": 0.3,
  "history": [
    {
      "date": "2026-03-01",
      "N": 12.1,
      "changedTerm": "fl",
      "reason": "Nucléobase découverte — système Gliese 667C"
    }
  ]
}
```

Objet global, partagé par tous les joueurs. `fl`, `fi` et `L` sont les seuls termes susceptibles de changer en cours de jeu. Recalculé automatiquement lors de chaque variation. Mis à jour pour tous les joueurs actifs.

---

## Changelog

| Date | Modifications |
|------|---------------|
| Mars 2026 | Version 0.1 — document initial |
| 2026-10-22 | §9.2 et exemple de journal : population de départ 15 000 (alignée sur `LACUNA_GDD.md` v0.5). Code aligné le 2026-10-23 (constante `INITIAL_POPULATION`, migration `00052`) |
| 2026-10-23 | §9.3 : origine `PRÉCURSEUR` et colonnes de scénario sur `traces` (migrations `00054`, `00055`) |

---

*LACUNA — Modèle de données procédural v0.1 — Mars 2026 (mise à jour octobre 2026) — Confidentiel*
