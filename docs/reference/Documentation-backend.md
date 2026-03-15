*Dernière modification : 2026-03-14 15:11*

# LACUNA — Documentation Backend

*Schéma base de données, migrations, RLS, seed — Mars 2026*

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Structure Supabase](#2-structure-supabase)
3. [Schéma — tables et relations](#3-schéma--tables-et-relations)
4. [Types ENUM](#4-types-enum)
5. [Migrations](#5-migrations)
6. [RLS (Row Level Security)](#6-rls-row-level-security)
7. [Seed et données prototype](#7-seed-et-données-prototype)
8. [Mapping Store ↔ Table](#8-mapping-store--table)
9. [Configuration](#9-configuration)
10. [Scripts d'import (stellar_import)](#10-scripts-dimport-stellar_import)
11. [Références design](#11-références-design)

---

## 1. Vue d'ensemble

| Composant | Technologie |
|-----------|-------------|
| **Base de données** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (à intégrer) |
| **Client frontend** | `@supabase/supabase-js` |
| **MCP** | user-supabase (list_tables, execute_sql, apply_migration) |

Le backend LACUNA centralise les données de jeu dans Supabase : systèmes stellaires, objets des systèmes, traces, observations, vaisseaux, population, carte, équation de Drake.

---

## 2. Structure Supabase

```
supabase/
├── config.toml          # Config Supabase CLI
├── migrations/
│   ├── 00001_initial_schema.sql
│   ├── 00002_interpretations_delete_policy.sql
│   ├── 00003_observations_table.sql
│   ├── 00004_system_objects.sql
│   ├── 00005_signal_sources_option_a.sql
│   ├── 00006_ship_current_system_and_systems.sql
│   ├── 00007_ship_systems_table.sql
│   ├── 00008_ships_classe_built_year.sql
│   ├── 00009_visible_systems_rpc.sql
│   ├── 00010_brown_dwarfs_and_nebulas.sql
│   ├── 00011_observations_anomalous.sql
│   ├── 00012_observations_structure.sql
│   ├── 00012_sol_system_objects_enrich.sql
│   ├── 00013_composition_rings_satellites.sql
│   ├── 00013_lab_reports.sql
│   ├── 00014_sol_composition_rings_data.sql
│   ├── 00015_seed_gw_region_and_signals.sql
│   ├── 00016_stellar_systems_system_objects_hyg_nasa_fields.sql
│   ├── 00017_fix_visible_systems_rpc_xyz_magnitude.sql
│   ├── 00018_unify_coordinates_xyz.sql
│   ├── 00019_paginate_visible_systems.sql
│   ├── 00020_fix_sol_hyg_fields.sql
│   ├── 00021_remove_hyg_duplicate_gl_gl_71.sql
│   ├── 00022_map_nodes_anon_policy.sql
│   ├── 00023_seed_coordinates_xyz_verify.sql
│   ├── 00024_drop_obsolete_get_visible_systems.sql
│   └── 00025_constellations_support.sql
└── seed.sql             # Données initiales (systèmes, traces, objets, system_objects)
```

---

## 3. Schéma — tables et relations

### Diagramme des dépendances

```
stellar_systems
    ├── traces (system_id)
    ├── system_objects (system_id)
    ├── ships (travel_destination)
    ├── map_nodes (system_id)
    └── constellation_lines (star_from, star_to)

constellations
    └── constellation_lines (constellation_abbr)

ships
    ├── populations
    ├── ship_traces
    ├── interpretations (ship_id, anonyme)
    ├── logbook_entries
    ├── map_nodes / map_edges
    └── observations (ship_id, nullable)

traces
    ├── ship_traces
    └── interpretations

observations
    └── lab_reports (rapports d'analyse persistés)

signal_events (événements transients)
    └── signals (source_event_id)

system_objects (objets émetteurs : PULSAR, NEUTRON_STAR, MAGNETAR)
    └── signals (source_object_id)
```

### Tables détaillées

#### `stellar_systems`
Systèmes stellaires (ciel Observatoire).

| Colonne | Type | Description |
|---------|------|-------------|
| id | TEXT PK | Identifiant (SOL, PROXIMA, ROSS128...) |
| name | TEXT | Nom affiché |
| spectral_type | TEXT | G2V, M5.5V, K2V... |
| distance | DECIMAL | Distance en al depuis Sol |
| age | DECIMAL | Âge en Ga |
| planets | INT | Nombre de planètes (agrégat) |
| habitable_zone | BOOLEAN | Présence zone habitable |
| anomaly_level | INT | 0–3 |
| coordinates | JSONB | `{x, y, z}` en al (référentiel galactique, Sol origine). Fallback `{ra, dec}` legacy. |
| luminosity | DECIMAL | Luminosité relative Soleil (1.0) — HYG lum |
| color_index | DECIMAL | Indice B-V (-0.3 bleu → +2.0 rouge) — HYG ci |
| apparent_magnitude | DECIMAL | Magnitude apparente depuis Sol — HYG mag |
| has_magnetic_field | BOOLEAN | Champ magnétique détecté |
| constellation_abbr | TEXT | Code IAU 3 lettres (ORI, CEN, UMA, CYG...) — source HYG colonne con |
| created_at | TIMESTAMPTZ | |

#### `system_objects`
Objets composant un système (étoiles, planètes, disques).

| Colonne | Type | Applicable à | Description |
|---------|------|--------------|-------------|
| id | UUID PK | tous | |
| system_id | TEXT FK | tous | → stellar_systems |
| parent_id | UUID FK | MOON | → system_objects (lune) |
| type | ENUM | tous | STAR, PLANET, MOON, MINOR_BODY, DEBRIS_DISK, PULSAR, NEUTRON_STAR, MAGNETAR |
| designation | TEXT | | Lettre (a, b, c) |
| name | TEXT | | Proxima b, Disque interne |
| sort_order | INT | | Ordre d'affichage |
| orbital_semi_major_axis_au | DECIMAL | PLANET, MOON, MINOR | |
| orbital_period_days | DECIMAL | | |
| orbital_eccentricity | DECIMAL | | |
| orbital_inclination_deg | DECIMAL | | |
| orbital_semi_major_axis_km | DECIMAL | MOON | Demi-grand axe en km (distance au corps parent) |
| mass_earth | DECIMAL | PLANET, MOON | |
| mass_stellar | DECIMAL | STAR | Masse solaire |
| radius_earth | DECIMAL | | |
| composition | composition_type | PLANET, MOON | TERESTRIAL, GAS_GIANT, ICE_GIANT, ICY |
| has_rings | BOOLEAN | PLANET | Anneaux planétaires |
| rings_inner_radius_km | DECIMAL | | Rayon interne anneaux (km) |
| rings_outer_radius_km | DECIMAL | | Rayon externe anneaux (km) |
| rings_notes | TEXT | | Notes sur les anneaux |
| spectral_type | TEXT | STAR | |
| stellar_activity | TEXT | STAR | ACTIVE, CALM |
| in_habitable_zone | BOOLEAN | PLANET, MOON | |
| habitable_zone_type | TEXT | | INTERNAL, EXTERNAL, TEMPERATE |
| has_atmosphere | BOOLEAN | PLANET, MOON | |
| atmosphere_detected | BOOLEAN | | |
| atmosphere_pressure_bar | DECIMAL | | Pression atmosphérique (bar) |
| atmosphere_notes | TEXT | | |
| atmosphere_composition | JSONB | | Composition structurée ex: {"H2O": 0.4, "CO2": 0.3} |
| surface_temperature_k | DECIMAL | PLANET | Température d'équilibre (K) — NASA pl_eqt |
| magnetic_field_detected | BOOLEAN | | Champ magnétique — Magnétomètre |
| disk_inner_radius_au | DECIMAL | DEBRIS_DISK | |
| disk_outer_radius_au | DECIMAL | | |
| disk_structure | TEXT | | RINGS, DEPLETION_ZONES, ASYMMETRIC, DENSE |
| disk_density_factor | DECIMAL | | Ex. 10× Tau Ceti |
| confirmation_status | ENUM | | CONFIRMED, DEBATED, UNCONFIRMED |
| emits_signals | BOOLEAN | PULSAR, NEUTRON_STAR, MAGNETAR | Émet des signaux captables |
| emission_support | signal_support | émetteurs | EM_RADIO, GAMMA_X, GRAVITATIONNEL |
| emission_pattern | TEXT | émetteurs | CONTINUOUS, PERIODIC, BURST |
| emission_frequency_hz | DECIMAL | PULSAR | Fréquence période (ex. 1,3 Hz pour PSR B1919+21) |
| emission_direction | TEXT | émetteurs | omni, beam (faisceau) |
| attributes | JSONB | | Données extensibles |
| created_at | TIMESTAMPTZ | | |

#### `nebulas`
Nuages de gaz, nébuleuses — objets étendus (formes), visibles en IR.

| Colonne | Type | Description |
|---------|------|--------------|
| id | TEXT PK | Identifiant |
| name | TEXT | Nom affiché |
| designation | TEXT | Ex. Sh 2-276, M42 |
| distance | DECIMAL | Distance en al |
| coordinates | JSONB | `{ra, dec}` centre en degrés |
| shape_type | TEXT | ELLIPSE ou POLYGON |
| shape_params | JSONB | ELLIPSE: `{semi_major_arcmin, semi_minor_arcmin, position_angle_deg}` — POLYGON: `{vertices: [{dra_arcmin, ddec_arcmin}...]}` |
| ir_only | BOOLEAN | Visible uniquement en infrarouge |

#### `constellations`
88 constellations IAU (catalogue officiel).

| Colonne | Type | Description |
|---------|------|-------------|
| abbr | TEXT PK | Code 3 lettres (And, Ori, UMa, UMi, Cyg...) |
| name_latin | TEXT | Nom latin (Orion, Ursa Major) |
| name_fr | TEXT | Nom français (Orion, Grande Ourse) |
| genitive | TEXT | Forme génitive Bayer (Orionis, Ursae Majoris) |
| ra_center | NUMERIC | Ascension droite centre (optionnel) |
| dec_center | NUMERIC | Déclinaison centre (optionnel) |
| area_sq_deg | NUMERIC | Surface en deg² (optionnel) |
| stars_count | INT | Nombre d'étoiles (optionnel) |
| created_at | TIMESTAMPTZ | |

#### `constellation_lines`
Segments stick-figure pour dessiner les constellations (lignes entre étoiles).

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| constellation_abbr | TEXT FK | → constellations |
| star_from | TEXT FK | → stellar_systems.id |
| star_to | TEXT FK | → stellar_systems.id |
| sort_order | INT | Ordre d'affichage |

Source des segments : `Ressources/constellation.shapes.iau.txt` (paires HR explicites, Yale BSC). Peuplement via `populate_constellations.py`.

#### `traces`
Traces collectables (Artefacts, Collection).

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| designation | TEXT UNIQUE | WOW-1977-A, PROXIMA-001 |
| type | trace_type | SIGNAL_RADIO, ORBITAL_ANOMALY... |
| origin | trace_origin | IMMUABLE, GENERÉE, JOUEUR |
| system_id | TEXT FK | → stellar_systems |
| difficulty | trace_difficulty | 1–4 |
| real_reference | BOOLEAN | Ancrage scientifique réel |
| description | TEXT | |
| visual | TEXT | waveform, orbital, spectrogram... |
| points_to | UUID FK | → traces (lien narratif) |
| discovered | DATE | |
| discovered_by | UUID | ship_id, nullable pour IMMUABLE |

#### `observations`
File d'observations Laboratoire.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| session_id | TEXT | Identifiant localStorage (prototype sans auth) |
| ship_id | UUID FK | Nullable, pour auth future |
| type | observation_type | SIGNAL, PLANETE, ATMOSPHERE... |
| system_id | TEXT FK | → stellar_systems |
| name | TEXT | |
| state | observation_state | PENDING, RUNNING, DONE |
| niveau | observation_niveau | PASSIF, SYSTEME, ORBITE, CONTACT |
| support | signal_support | EM_RADIO, GAMMA_X (pour SIGNAL) |
| duration_sec | INT | Pour signaux |
| system_display | TEXT | Nom affiché du système |
| coords, distance, date | TEXT | Métadonnées |
| anomalous | BOOLEAN | | Signal atypique (ex. WOW, pulsation inhabituelle) |
| structure | TEXT | | Structure signal : non uniforme, pulsé, pulsé régulier |

#### `signal_events`
Événements transients (supernova, fusion, GRB). Pas utilisé pour émetteurs permanents.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| system_id | TEXT FK | → stellar_systems |
| event_type | TEXT | SUPERNOVA, MERGER, GRB... |
| observed_at | TIMESTAMPTZ | Date/heure observation |
| duration_sec | INT | Durée estimée |
| attributes | JSONB | Données extensibles |

#### `signals` (captures)
Signaux captés par les capteurs du vaisseau. Pointe vers la source (objet ou événement).

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| source_type | TEXT | OBJECT \| EVENT |
| source_object_id | UUID FK | → system_objects (pulsar, magnétar...) |
| source_event_id | UUID FK | → signal_events (supernova, GRB...) |
| session_id | TEXT | Pour prototype sans auth |
| ship_id | UUID FK | Nullable, pour auth future |
| frequency_hz | DECIMAL | |
| support | signal_support | EM_RADIO, GAMMA_X... |
| duration_sec | INT | |
| captured_at | TIMESTAMPTZ | |
| attributes | JSONB | Forme d'onde, spectre... |

*Flux de détection* : objet émetteur (PULSAR, etc.) → joueur en portée → capteurs actifs → création d'une entrée `signals` avec `source_object_id`. Événement transient → création d'une entrée avec `source_event_id`.

#### `lab_reports`
Rapports d'analyse persistés (instruments Laboratoire).

| Colonne | Type | Description |
|---------|------|--------------|
| id | UUID PK | |
| observation_id | UUID FK | → observations (ON DELETE CASCADE) |
| instrument_id | TEXT | Identifiant de l'instrument |
| instrument | TEXT | Nom affiché |
| fiability | INT | Fiabilité du rapport |
| date, duration, duration_sec | | Métadonnées temporelles |
| anomalous | BOOLEAN | Signal atypique |
| results | TEXT | Résultats bruts ou JSON |
| created_at | TIMESTAMPTZ | |

#### `ships`
Vaisseaux joueurs (1 par user). Nom personnalisable par l'utilisateur.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK | → auth.users (nullable pour prototype) |
| name | TEXT | Nom du vaisseau (ex. ARCA) |
| classe | TEXT | Classe du vaisseau (ex. Vaisseau générationnel de classe I) |
| built_year | INT | Année construction fiction = année(created_at) + 212 (trigger) |
| voyage | INT | |
| generation | INT | |
| current_system_id | TEXT FK | Système actuel (IDLE/ARRIVED) → stellar_systems |
| position | JSONB | Coordonnées (legacy) |
| travel_state | ship_travel_state | IDLE, IN_TRANSIT, ARRIVED, DAMAGED |
| travel_destination | TEXT FK | → stellar_systems |
| systems, fuel | — | *Voir ship_systems* |

#### `ship_systems`
Aspect technique du vaisseau. 1:1 avec ships.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| ship_id | UUID FK UNIQUE | → ships |
| propulsion, hull, plasma_shield, observatory | DECIMAL(4,3) | 0–1 |
| reservoir, alimentation, atmosphere, medical | DECIMAL(4,3) | 0–1 |
| he3_current, he3_max, deuterium_current, deuterium_max | DECIMAL | Tonnes |
| dry_mass, capacity | INT | Masse sèche (t), capacité personnes |
| attributes | JSONB | Extensible |

#### `populations`
Population par vaisseau.

| Colonne | Type | Description |
|---------|------|-------------|
| ship_id | UUID FK | 1:1 avec ships |
| total | INT | Effectif |
| generation | INT | |
| will | DECIMAL | 0–1 |
| social_cohesion | DECIMAL | |
| food_supply | DECIMAL | |
| medical_care | DECIMAL | |
| culture | TEXT | ACTIVE... |
| governance | TEXT | TENSION_MINEURE... |
| history | JSONB | Événements |

#### `interpretations`
Interprétations anonymes des traces.

| Colonne | Type | Description |
|---------|------|-------------|
| trace_id | UUID FK | → traces |
| ship_id | UUID FK | Anonyme, nullable |
| text | TEXT | |
| confidence | confidence_level | OBSERVATION, HYPOTHÈSE... |
| generation | INT | |

#### `ship_traces`
Traces collectées par un vaisseau (PK ship_id, trace_id).

#### `logbook_entries`
Carnet de bord. `type`: MANUEL, AUTO, GENERATIONNEL. `linked_traces`, `linked_systems`: tableaux UUID/TEXT.

#### `map_nodes` / `map_edges`
Carte explorée par vaisseau. Nœuds = systèmes visités. Arêtes = trajets.

#### `drake_equation` / `drake_history`
Équation de Drake globale (singleton). Historique des variations de N.

---

### Sources de signaux (Option A — validé)

**Objets émetteurs permanents** (pulsar, étoile à neutrons, magnétar) : modélisés comme `system_objects` avec `emits_signals`, `emission_support`, `emission_pattern`, etc. Le signal capté référence l'objet via `signals.source_object_id`.

**Événements transients** (supernova, fusion, GRB) : modélisés dans `signal_events`. Le signal capté référence l'événement via `signals.source_event_id`.

Le joueur reçoit un signal quand il est en portée et que ses capteurs sont actifs. La création de l'entrée `signals` est le moment de la *détection*, pas de l'émission (qui est une propriété persistante de l'objet).

---

## 4. Types ENUM

| Type | Valeurs |
|------|---------|
| trace_type | SIGNAL_RADIO, INTERSTELLAR_OBJECT, CHEMICAL_ANOMALY, STELLAR_ANOMALY, ORBITAL_ANOMALY, ENCODED_SEQUENCE, PHYSICAL_ARTIFACT, PLAYER_TRACE |
| trace_origin | IMMUABLE, GENERÉE, JOUEUR |
| trace_difficulty | 1, 2, 3, 4 |
| confidence_level | OBSERVATION, HYPOTHÈSE, CONVICTION, CERTITUDE |
| log_entry_type | MANUEL, AUTO, GENERATIONNEL |
| ship_travel_state | IDLE, IN_TRANSIT, ARRIVED, DAMAGED |
| observation_type | SIGNAL, PLANETE, ATMOSPHERE, ETOILE, MINEUR, OBJET |
| observation_state | PENDING, RUNNING, DONE |
| observation_niveau | PASSIF, SYSTEME, ORBITE, CONTACT |
| signal_support | EM_RADIO, GAMMA_X, GRAVITATIONNEL |
| system_object_type | STAR, PLANET, MOON, MINOR_BODY, DEBRIS_DISK, PULSAR, NEUTRON_STAR, MAGNETAR |
| confirmation_status | CONFIRMED, DEBATED, UNCONFIRMED |
| composition_type | TERESTRIAL, GAS_GIANT, ICE_GIANT, ICY |

---

## 5. Migrations

| Fichier | Contenu |
|---------|---------|
| 00001 | Schéma initial (stellar_systems, traces, ships, populations, ship_traces, interpretations, logbook, map, drake) |
| 00002 | Politique DELETE sur interpretations |
| 00003 | Table observations + types observation_* |
| 00004 | Table system_objects + types system_object_type, confirmation_status |
| 00005 | Option A : extension system_objects (PULSAR, NEUTRON_STAR, MAGNETAR, colonnes émission), signal_events, signals |
| 00006 | ships : current_system_id, systems étendus, fuel, policy Anon can read prototype |
| 00007 | Table ship_systems (systèmes, carburant, capacités). Retrait systems/fuel de ships. |
| 00008 | ships : classe, built_year (trigger = année(created_at) + 212) |
| 00009 | RPC get_visible_systems : filtre magnitude apparente. Coord. x,y,z (HYG) ou ra/dec (legacy). Magnitude : apparent_magnitude HYG si viewer=SOL, sinon M_abs+5*log10(d/10). |
| 00010 | Naines brunes L/T/Y (spectral_type_to_absolute_magnitude), table nebulas (formes ELLIPSE/POLYGON), seed nébuleuses |
| 00011 | observations : colonne `anomalous` (signaux atypiques) |
| 00012_observations_structure | observations : colonne `structure` (non uniforme, pulsé, pulsé régulier) |
| 00012_sol_system_objects_enrich | Seed SOL : orbital_* (UA, jours, excentricité, inclinaison), radius_earth, atmosphères (pressure_bar, notes) — données NASA/IAU |
| 00013_composition_rings_satellites | system_objects : type `composition_type`, colonnes `composition`, `has_rings`, `rings_inner/outer_radius_km`, `rings_notes`, `orbital_semi_major_axis_km` |
| 00013_lab_reports | Table `lab_reports` (rapports d'analyse persistés, FK observation_id) |
| 00014 | Seed SOL : composition (TERESTRIAL, GAS_GIANT, ICE_GIANT), anneaux (Jupiter, Saturne, Uranus, Neptune) — données NASA |
| 00015 | Seed région ondes gravitationnelles (GW) + signaux |
| 00016 | stellar_systems : luminosity, color_index, apparent_magnitude, has_magnetic_field — system_objects : surface_temperature_k, atmosphere_composition, magnetic_field_detected (HYG/NASA import) |
| 00017 | Fix get_visible_systems : coordonnées x,y,z (HYG) + magnitude apparent_magnitude |
| 00018 | Unification coordonnées x/y/z : stellar_systems et nebulas — conversion ra/dec → x,y,z (référentiel galactique, Sol origine) |
| 00019 | Pagination get_visible_systems : p_magnitude_min, p_limit, p_offset ; luminosity, color_index ; chargement deux passes (mag≤8 puis mag 8–18) |
| 00020 | Correction SOL : coordinates x,y,z=0, apparent_magnitude, luminosity (origine référentiel) |
| 00021 | Suppression doublon HYG gl-gl-71 (Tau Ceti → TAU_CETI) |
| 00022 | map_nodes / map_edges : policies anon pour prototype (user_id NULL) |
| 00023 | Conversion ra/dec → x/y/z pour systèmes seed sans coordonnées cartésiennes |
| 00024 | Drop fonctions obsolètes get_visible_systems (surcharges) |
| 00025 | Constellations : stellar_systems.constellation_abbr, table constellations (88 IAU), constellation_lines (stick-figures) |

**Application** : `supabase db reset` (local) ou `apply_migration` (MCP).

### RPC `get_visible_systems` (migration 00009)

Systèmes stellaires visibles depuis un point (Observatoire). Filtre par magnitude apparente.

```sql
get_visible_systems(
  p_viewer_system_id TEXT,    -- ex. 'SOL', 'PROXIMA'
  p_magnitude_limit NUMERIC DEFAULT 12  -- œil nu ~6.5, instrument ~12
)
RETURNS TABLE(id, name, spectral_type, distance, age, planets, habitable_zone, anomaly_level, coordinates, apparent_magnitude)
```

- **Coordonnées** : `coordinates->>'x'`, `'y'`, `'z'` (HYG, en al) prioritaire ; fallback `ra_dec_distance_to_xyz(ra, dec, distance)` pour données legacy (ra/dec).
- **Distance 3D** : √((x₂-x₁)² + (y₂-y₁)² + (z₂-z₁)²) en al.
- **Magnitude apparente** : si viewer = SOL → `apparent_magnitude` (HYG) si renseigné ; sinon M_abs + 5×log₁₀(d/10). Si viewer ≠ SOL → toujours calculée (M_abs + 5×log₁₀(d/10)) car HYG = vue depuis Sol.
- **spectral_type_to_absolute_magnitude** : fallback pour étoiles procédurales sans `apparent_magnitude` (réf. Schmidt-Kaler, Pecaut & Mamajek).

---

## 6. RLS (Row Level Security)

| Table | Politique | Accès |
|-------|-----------|-------|
| ships | Users can manage own ship | auth.uid() = user_id |
| ships | Anon can read prototype ship | user_id IS NULL (lecture anon sans auth) |
| ship_systems | Users can read own ship_systems | Via ship (user ou prototype) |
| populations | Users can manage own population | Via ship |
| ship_traces | Users can manage own ship_traces | Via ship |
| logbook_entries | Users can manage own logbook | Via ship |
| map_nodes / map_edges | Users can manage own map | Via ship |
| traces | Public read traces | SELECT pour tous |
| stellar_systems | Public read stellar_systems | SELECT pour tous |
| system_objects | Public read system_objects | SELECT pour tous |
| signal_events | Public read signal_events | SELECT pour tous |
| signals | Allow all for prototype | Tout ouvert (filtrage session_id côté client) |
| interpretations | Users can insert / Anyone can read / Allow delete | INSERT ouvert, SELECT ouvert, DELETE ouvert |
| observations | Allow all for prototype | Tout ouvert (filtrage session_id côté client) |
| lab_reports | Allow all for prototype | Tout ouvert |
| drake_equation / drake_history | Lecture publique | SELECT pour tous |
| nebulas | Lecture publique | SELECT pour tous |
| constellations | Lecture publique | SELECT pour tous |
| constellation_lines | Lecture publique | SELECT pour tous |

---

## 7. Seed et données prototype

**Fichier** : `supabase/seed.sql`

| Donnée | Contenu |
|--------|---------|
| stellar_systems | ~100 systèmes : 9 de base + ~90 étendus + naines brunes LUHMAN16 (L7.5), WISE0855 (Y4) |
| system_objects | Étoiles, planètes, disques, pulsar PSR B1919+21. Données scientifiques (NASA Exoplanet Archive, Wikipedia). Génération : `yarn seed:generate` |
| traces | WOW-1977-A, OUMUAMUA-2017, BENNU-NB-2023 + PROXIMA-001, BARNARD-001, ROSS128-001, EPSILON-001, TAU-CETI-001, GLIESE667-001 |
| nebulas | Boucle de Barnard, Orion M42, Tête de Cheval, Rosette (formes ellipse, IR-only) |
| drake_equation | Une ligne initiale |
| constellations / constellation_lines | Peuplés par `populate_constellations.py` (88 IAU + segments depuis constellation.shapes.iau.txt), pas par seed |

**Exécution** : `supabase db reset` exécute migrations + seed. Après import HYG, exécuter `populate_constellations.py` pour les constellations.

---

## 8. Mapping Store ↔ Table

| Store Pinia | Table(s) | Opérations |
|-------------|----------|------------|
| stellarSystems | stellar_systems, constellation_lines | SELECT stellar_systems (RPC get_visible_systems). SELECT constellation_lines pour dessiner stick-figures. Fusion naines brunes L/T/Y pour filtre IR. |
| nebulas | nebulas | SELECT (formes étendues, IR-only). SkyCanvas projection ellipse/polygone. |
| systemObjects | system_objects | SELECT par system_id (corps Observatoire) |
| observations | observations | SELECT, INSERT, UPDATE (state), DELETE. Filtre session_id |
| traces (PageArtefacts) | traces, interpretations | SELECT traces, interpretations. INSERT interpretation. DELETE interpretation |
| traces (tracesStore) | — | Mémoire (playerTraces, formalisation) — à brancher sur ship_traces |
| signaux | — | Mémoire uniquement (éphémère) |
| supabase | Client | isConfigured() |

---

## 9. Configuration

### Variables d'environnement

| Variable | Description |
|----------|-------------|
| VITE_SUPABASE_URL | URL du projet Supabase |
| VITE_SUPABASE_ANON_KEY | Clé anon publique |

### Commandes Supabase

```sh
supabase start        # Démarrer local
supabase db reset     # Migrations + seed
supabase stop         # Arrêter local
```

---

## 10. Scripts d'import (stellar_import)

Import des données stellaires et constellationnelles vers Supabase. Requiert `.env` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY ou SUPABASE_*).

### Architecture des scripts

```
stellar_import/
├── main.py                 # Orchestrateur : HYG + NASA, --fix-ids, --nasa-only
├── parse_hyg.py            # Lecture HYG (dist < 500 al), build_system_id (proper > gl > hd > hip > hyg-id)
├── parse_nasa.py           # API NASA Exoplanet Archive TAP
├── upsert_systems.py       # Upsert stellar_systems (LACUNA_ID_MAP, résolution hostname)
├── upsert_objects.py       # Upsert system_objects (planètes), update habitable_zone
├── complete_hyg_fields.py  # Complète champs manquants (coordinates x/y/z, mag, lum, con→constellation_abbr)
├── populate_constellations.py  # 88 constellations IAU + constellation_lines (source constellation.shapes.iau.txt)
├── check_systems.py        # Vérifie champs (apparent_magnitude, coordinates, luminosity) pour ids
├── check_duplicate_systems.py # Détecte doublons HYG/LACUNA
├── diagnose_names.py       # Diagnostique mapping noms DB ↔ HYG
├── diagnose_nasa_planets.py # Diagnostique planètes NASA
├── report.py               # Génère import_report.md
└── supabase_client.py      # Client Supabase (.env)
```

### Ressources requises

| Fichier | Rôle |
|---------|------|
| `Ressources/hyg_v42.csv` | Catalogue HYG (Harvard-Yale-Gliese) — étoiles dist < 500 al |
| `Ressources/constellation.shapes.iau.txt` | Paires HR (Yale BSC) pour segments stick-figure — source IAU/Krzywinski |

### Commandes

```sh
cd stellar_import && python3 main.py                    # Import complet HYG + NASA
cd stellar_import && python3 main.py --nasa-only        # NASA uniquement (planètes)
cd stellar_import && python3 main.py --fix-ids sirius proxima-centauri tau-ceti   # Réimport ciblé (force mise à jour)
cd stellar_import && python3 complete_hyg_fields.py     # Compléter coordinates, constellation_abbr, mag, lum
cd stellar_import && python3 populate_constellations.py # 88 constellations + segments
cd stellar_import && python3 populate_constellations.py --truncate   # Vider constellation_lines puis repeupler
cd stellar_import && python3 populate_constellations.py --lines-only UMi   # Segments pour une constellation
cd stellar_import && python3 check_systems.py           # Vérifier champs stellar_systems
cd stellar_import && python3 check_duplicate_systems.py # Vérifier doublons
cd stellar_import && python3 diagnose_names.py          # Diagnostique noms
```

### Flux d'import

1. **HYG** : `parse_hyg` (filtre dist < 153.4 pc) → `iter_hyg_rows` → `upsert_systems` (LACUNA_ID_MAP pour fusion gl-gl-71→TAU_CETI, etc.)
2. **NASA** : `parse_nasa` (TAP) → `normalize_nasa_row` → création systèmes hôtes si absents → `upsert_objects` (planètes)
3. **Constellations** : `constellation.shapes.iau.txt` (paires HR tab-delimited) → mapping HR→stellar_systems.id via HYG → insert `constellations` + `constellation_lines`
4. **Complétion** : `complete_hyg_fields` matche par id/name et complète coordinates, constellation_abbr, magnitude, luminosité (sans écraser NULL)

---

## 11. Références design

| Document | Section | Contenu lié |
|----------|---------|-------------|
| LACUNA_TRACES | §2, §3 | Traces immuables, propriétés signaux, PSR-001 |
| LACUNA_LABORATOIRE_INSTRUMENTS | §7, §9 | Types d'objets, matrices instrument |
| LACUNA_UI | §3, §4 | Modules, contenu Collection |
| LACUNA_GDD | §5 | Système social, vaisseau |

---

*LACUNA — Documentation Backend v1 — Mars 2026*
