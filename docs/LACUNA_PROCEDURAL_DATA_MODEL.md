*Dernière modification : 2026-03-15 15:11*

# LACUNA — Modèle de données procédural
*Version 0.1 — Mars 2026*

> Contrat transversal qui gouverne toute génération procédurale et toute extrapolation
> dans LACUNA. Tous les scripts de génération, d'import et de migration doivent
> respecter ces règles sans exception.
>
> Documents dépendants : `LACUNA_PROCEDURAL_PLANETS.md`, `LACUNA_PROCEDURAL_EXTRAPOLATION.md`
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

> **On ne remplace jamais une donnée sourcée sauf par une source plus fiable.
> On comble uniquement les trous — ou on améliore la précision.**

Deux cas autorisent l'écriture sur un champ :

1. **Trou** — le champ est NULL ou sans source → écrire librement
2. **Mise à jour** — la source entrante est strictement plus fiable que la source existante → écraser et mettre à jour `field_sources`

Tout le reste est **intouchable**.

```python
def can_write_field(
    field_name: str,
    current_value,
    field_sources: dict,
    incoming_source: str
) -> bool:
    """
    Retourne True si on peut écrire ce champ.

    Cas 1 : trou — champ vide et sans source → toujours écrire
    Cas 2 : mise à jour — source entrante strictement plus fiable → écrire
    Sinon : intouchable
    """
    existing_source = field_sources.get(field_name)

    # Cas 1 — trou
    if current_value is None and existing_source is None:
        return True

    # MANUAL est toujours intouchable par un script automatique
    if existing_source == "MANUAL":
        return False

    # Cas 2 — mise à jour par source plus fiable
    if existing_source is not None:
        return SOURCE_PRIORITY.get(incoming_source, 0) > SOURCE_PRIORITY.get(existing_source, 0)

    return False
```

**Ce que cette règle autorise :**
- Une étoile HYG dont la distance est mise à jour par Gaia DR3 (plus précis) → ✅
- Une planète NASA dont la masse est affinée par une nouvelle publication → ✅
- Une valeur extrapolée remplacée par une mesure réelle → ✅

**Ce que cette règle interdit :**
- Une génération procédurale qui écrase une valeur NASA → ❌
- Une extrapolation qui écrase une mesure HYG → ❌
- Un import HYG qui écrase une valeur MANUAL → ❌
- Deux sources de même niveau qui s'écrasent mutuellement → ❌ (premier arrivé, premier servi)

**Seule exception supplémentaire** : une action MANUAL explicite dans le backoffice,
qui peut écraser n'importe quelle source après confirmation.

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
| `"HYG"` | HYG Database v4 | ★★★★☆ |
| `"MANUAL"` | Saisi dans le backoffice | ★★★☆☆ |
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
JWST = GAIA = NASA > SIMBAD = HYG > MANUAL > EXTRAPOLATED > PROCEDURAL
```

```python
SOURCE_PRIORITY = {
    "JWST": 100, "GAIA": 100, "NASA": 100,
    "SIMBAD": 80, "HYG": 80,
    "MANUAL": 60,
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

## 8. Migration SQL requise

Avant tout script de génération, vérifier que ces colonnes existent en base :

```sql
-- stellar_systems
ALTER TABLE public.stellar_systems
  ADD COLUMN IF NOT EXISTS field_sources jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS chemical_region_id text;

-- system_objects
ALTER TABLE public.system_objects
  ADD COLUMN IF NOT EXISTS field_sources    jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS data_source      text  DEFAULT 'PROCEDURAL'
    CHECK (data_source IN ('NASA','PROCEDURAL','LACUNA','PLAYER','EXTRAPOLATED')),
  ADD COLUMN IF NOT EXISTS density_profile  jsonb,
  ADD COLUMN IF NOT EXISTS thermal_map      jsonb,
  ADD COLUMN IF NOT EXISTS magnetic_field   jsonb,
  ADD COLUMN IF NOT EXISTS surface_composition jsonb,
  ADD COLUMN IF NOT EXISTS sample_analysis  jsonb;
```

---

*LACUNA — Modèle de données procédural v0.1 — Mars 2026 — Confidentiel*
