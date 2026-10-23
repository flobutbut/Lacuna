*Dernière modification : 2026-03-16*

# LACUNA — Documentation Backend

*Schéma base de données, migrations, RLS, seed — Mars 2026*

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Structure Supabase](#2-structure-supabase)
3. [Schéma — tables et relations](#3-schéma--tables-et-relations)
4. [Types ENUM](#4-types-enum)
5. [Migrations](#5-migrations)
6. [Convention de nommage des IDs stellaires](#6-convention-de-nommage-des-ids-stellaires)
7. [RLS (Row Level Security)](#7-rls-row-level-security)
8. [Seed et données du monde](#8-seed-et-données-du-monde)
9. [Mapping Store ↔ Table](#9-mapping-store--table)
10. [Configuration](#10-configuration)
11. [Scripts d'import (stellar_import)](#11-scripts-dimport-stellar_import)
12. [Références design](#12-références-design)

---

## 1. Vue d'ensemble

| Composant | Technologie |
|-----------|-------------|
| **Base de données** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth — email + mot de passe, confirmation d'email obligatoire ; un vaisseau par compte (`docs/architecture/PLAN_COMPTES_JOUEURS.md`) |
| **Client frontend** | `@supabase/supabase-js` |
| **MCP** | user-supabase (list_tables, execute_sql, apply_migration) |

Le backend LACUNA centralise les données de jeu dans Supabase : systèmes stellaires, objets des systèmes, traces, observations, vaisseaux, population, carte, équation de Drake.

**Données du monde** (systèmes, objets, traces, nébuleuses, constellations, Drake) : lecture publique. **Données de jeu** (vaisseau, signaux, observations, carte…) : rattachées au vaisseau du joueur connecté, protégées par RLS (§7).

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
│   ├── 00025_constellations_support.sql
│   ├── 00026_procedural_data_model.sql
│   ├── 00027_nasa_planets_data_source_and_field_sources.sql
│   ├── 00028_nasa_planets_field_sources_name_designation.sql
│   ├── 00029_get_systems_for_conception.sql
│   ├── 00030_conception_add_star_object_type.sql
│   ├── 00031_ship_transit_rls_and_travels.sql
│   ├── 00032_stellar_systems_object_type.sql
│   ├── 00033_stellar_systems_attributes.sql
│   ├── 00034 … 00045    # Pulsars (object_type, signaux PULSAR, compute_pulsar_signals, flux)
│   ├── 00046_player_accounts.sql   # profiles, start_new_game
│   ├── 00047_signals_by_ship.sql   # session_id facultatif, compute_pulsar_signals par vaisseau
│   └── 00048_player_rls.sql        # RLS par joueur, suppression du prototype
└── seed.sql             # Données initiales du monde (systèmes, traces, objets) + signaux modèles
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
    ├── ship_travels (historique des voyages)
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
| id | TEXT PK | Identifiant — convention slug minuscules-tirets (§6) |
| name | TEXT | Nom affiché |
| object_type | TEXT | STAR (défaut), WHITE_DWARF, NEUTRON_STAR, PULSAR, MAGNETAR, BLACK_HOLE — source SIMBAD |
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
| field_sources | JSONB | Traçabilité des sources par champ (HYG, NASA, ATNF, EXTRAPOLATED, PROCEDURAL...) — réf. LACUNA_PROCEDURAL_DATA_MODEL |
| attributes | JSONB | Données extensibles — pulsars : pulse_period_s, magnetic_field_gauss, emission_width_w50_ms (source ATNF) |
| chemical_region_id | TEXT | Région chimique galactique (extrapolation) |
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
| disk_mass_earth | DECIMAL | DEBRIS_DISK | Masse du disque (M⊕) |
| disk_structure | TEXT | | RINGS, DEPLETION_ZONES, ASYMMETRIC, DENSE |
| disk_density_factor | DECIMAL | | Ex. 10× Tau Ceti |
| confirmation_status | ENUM | | CONFIRMED, DEBATED, UNCONFIRMED |
| emits_signals | BOOLEAN | PULSAR, NEUTRON_STAR, MAGNETAR | Émet des signaux captables |
| emission_support | signal_support | émetteurs | EM_RADIO, GAMMA_X, GRAVITATIONNEL |
| emission_pattern | TEXT | émetteurs | CONTINUOUS, PERIODIC, BURST |
| emission_frequency_hz | DECIMAL | PULSAR | Fréquence période (ex. 1,3 Hz pour PSR B1919+21) |
| emission_direction | TEXT | émetteurs | omni, beam (faisceau) |
| attributes | JSONB | | Données extensibles |
| field_sources | JSONB | | Traçabilité des sources par champ (réf. LACUNA_PROCEDURAL_DATA_MODEL) |
| data_source | TEXT | | NASA, PROCEDURAL, LACUNA, PLAYER, EXTRAPOLATED |
| density_profile | JSONB | | Profil de densité extrapolé (couches internes) |
| thermal_map | JSONB | | Carte thermique extrapolée |
| magnetic_field | JSONB | | Champ magnétique extrapolé |
| surface_composition | JSONB | | Composition de surface extrapolée |
| sample_analysis | JSONB | | Analyse d'échantillon extrapolée |
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
| session_id | TEXT | Obsolète (prototype), facultatif depuis 00047 |
| ship_id | UUID FK | → ships (CASCADE) — propriétaire de l'observation |
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
| source_type | TEXT | OBJECT \| EVENT \| PULSAR \| EMITTER \| UNKNOWN (EMITTER : émetteur du système du vaisseau, 00057) |
| source_object_id | UUID FK | → system_objects (pulsar, magnétar...) |
| source_event_id | UUID FK | → signal_events (supernova, GRB...) |
| source_system_id | TEXT FK | → stellar_systems (pulsars, 00036) |
| session_id | TEXT | Obsolète (prototype), facultatif depuis 00047 ; `'seed-demo'` + `ship_id` nul = signal modèle |
| ship_id | UUID FK | → ships (CASCADE) — propriétaire ; nul uniquement pour les signaux modèles |
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

#### `profiles`
Profil privé du joueur (00046). Jamais exposé aux autres joueurs.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK FK | → auth.users (CASCADE) |
| pseudo | TEXT | 2–24 caractères, espaces en bord retirés (trigger), **non unique** |
| role | TEXT | `player` (défaut) \| `admin` — non modifiable par le joueur (droit UPDATE limité à `pseudo`) |
| created_at, updated_at | TIMESTAMPTZ | `updated_at` tenu par trigger |

Passer un compte en admin : `UPDATE profiles SET role = 'admin' WHERE id = '<uuid>';` (SQL Editor).

#### `ships`
Vaisseaux joueurs (1 par compte, créé par `start_new_game`). Nom choisi et modifiable par le joueur, privé.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK | → auth.users (CASCADE), UNIQUE |
| name | TEXT | Nom du vaisseau, 2–32 caractères (contrainte `ships_name_length`) ; la classe reste ARCA |
| classe | TEXT | Classe du vaisseau (ex. Vaisseau générationnel de classe I) |
| built_year | INT | Année construction fiction = année(created_at) + 212 (trigger) |
| voyage | INT | |
| generation | INT | |
| current_system_id | TEXT FK | Système actuel (IDLE/ARRIVED) → stellar_systems |
| position | JSONB | Coordonnées (legacy) |
| travel_state | ship_travel_state | IDLE, IN_TRANSIT, ARRIVED, DAMAGED |
| travel_destination | TEXT FK | → stellar_systems |
| travel_departure_at | TIMESTAMPTZ | Départ transit (pour calcul progression) |
| travel_arrival_at | TIMESTAMPTZ | Arrivée prévue, fixée par `start_transit` |
| systems, fuel | — | *Déplacés dans ship_systems (migration 00007)* |

Le joueur ne modifie que `name` (droits par colonne, migration 00050) ; position, transit et numéro de voyage passent par `start_transit` et `complete_transit`.

#### `ship_travels`
Historique des trajets : un enregistrement par voyage terminé (pour retracer la route).

| Colonne | Type | Description |
|---------|------|--------------|
| id | UUID PK | |
| ship_id | UUID FK | → ships (ON DELETE CASCADE) |
| voyage_number | INT | Numéro de voyage (aligné sur ships.voyage après arrivée) |
| origin_system_id | TEXT FK | → stellar_systems |
| destination_system_id | TEXT FK | → stellar_systems |
| departure_at | TIMESTAMPTZ | Heure de départ |
| arrival_at | TIMESTAMPTZ | Heure d'arrivée |
| distance_al | DOUBLE PRECISION | Distance du trajet en al |
| created_at | TIMESTAMPTZ | |

Création : migration 00031. Remplie par `complete_transit` à chaque arrivée ; lecture seule pour le joueur (00050).

#### `game_settings`
Réglages du jeu propres à la base (développement, production), lus par les fonctions serveur ; aucun accès depuis l'API.

| Clé | Valeur | Description |
|-----|--------|-------------|
| transit_time_scale | nombre | Facteur de la durée de transit : 1 = durées du GDD, 0.00138889 = mode test (Proxima ≈ 5 s) |

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
| signal_support | EM_RADIO, GAMMA_X, GRAVITATIONNEL, NEUTRINO (00062) |
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
| 00006 | ships : current_system_id, systems étendus, fuel, policy Anon can read prototype (supprimée en 00048) |
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
| 00022 | map_nodes / map_edges : policies anon pour prototype (user_id NULL) — supprimées en 00048 |
| 00023 | Conversion ra/dec → x/y/z pour systèmes seed sans coordonnées cartésiennes |
| 00024 | Drop fonctions obsolètes get_visible_systems (surcharges) |
| 00025 | Constellations : stellar_systems.constellation_abbr, table constellations (88 IAU), constellation_lines (stick-figures) |
| 00026 | Modèle procédural : stellar_systems (field_sources, chemical_region_id), system_objects (field_sources, data_source, density_profile, thermal_map, magnetic_field, surface_composition, sample_analysis) |
| 00027 | Planètes NASA : data_source = 'NASA' et field_sources pour champs orbitaux/physiques |
| 00028 | field_sources NASA : name, designation, confirmation_status, mass_earth, radius_earth sur system_objects |
| 00029 | RPC get_systems_for_conception : systèmes avec coordonnées, paginé (Vue 3D conception) |
| 00030 | get_systems_for_conception : colonne object_type (STAR, PULSAR, NEUTRON_STAR, MAGNETAR depuis system_objects) |
| 00031 | Transit : policy Anon can update prototype ship (ships), table ship_travels + RLS (anon insert/read prototype — supprimées en 00048 ; users manage own) |
| 00032 | stellar_systems : colonne object_type (STAR, WHITE_DWARF, NEUTRON_STAR, PULSAR, MAGNETAR, BLACK_HOLE) — import SIMBAD |
| 00033 | stellar_systems : colonne attributes (jsonb) pour paramètres pulsars ATNF (pulse_period_s, magnetic_field_gauss, etc.) |
| 00034 | get_systems_for_conception : filtre pulsar depuis stellar_systems.object_type |
| 00035 | Suppression de l'objet pulsar artificiel de system_objects |
| 00036 | signals : colonne source_system_id → stellar_systems |
| 00037 | signals : duration_sec facultatif |
| 00038 | signals : contrainte de source mise à jour |
| 00039 | signals : source_type PULSAR |
| 00040 | RPC get_pulsars_with_period |
| 00041 | RPC compute_pulsar_signals (signaux pulsars visibles depuis le vaisseau) |
| 00042–00045 | compute_pulsar_signals : formules de flux relatif, rotation_frequency_hz (la version en base utilise aussi s1400_mjy — reprise dans 00047) |
| 00046 | Comptes joueurs : table profiles (pseudo, rôle), contrainte ships.name, RPC start_new_game, signaux modèles détachés du prototype |
| 00047 | session_id facultatif (signals, observations), index ship_id ; compute_pulsar_signals(vaisseau, bande) dédupliquée par vaisseau et réservée au propriétaire |
| 00048 | RLS par joueur (§7), suppression du vaisseau prototype et des données de session, RLS sur constellations, TRUNCATE retiré à l'API |
| 00049 | Suppression des pulsars en double |
| 00050 | Transit côté serveur : table game_settings, RPC start_transit et complete_transit, UPDATE de ships limité à name, ship_travels en lecture seule |
| 00051 | RPC delete_account : suppression du compte par le joueur (RGPD) |
| 00052 | Population de départ 15 000 (défaut et lignes existantes) |
| 00053 | Équation de Drake : fl = 0,30, N = 72 |
| 00054 | trace_origin : valeur PRÉCURSEUR |
| 00055 | traces : scenario_arc, linked_trace_id, precursor_generation (non lisibles par les joueurs) |
| 00056 | observations : attributes (polarisation, période mesurées) |
| 00057 | signals : source_type EMITTER ; table system_signal_sources (illisible côté client) ; RPC capture_system_signals ; game_settings.scenario_signal_epoch |
| 00058 | system_objects : tidally_locked, rotation_period_h ; données Proxima b et Ross 128 b |
| 00059 | trace_type : valeur BIOLOGICAL |
| 00060 | trace_levels, ship_trace_levels, RPC unlock_trace_levels / get_trace_levels / trace_is_visible ; ship_traces en lecture seule ; traces lisibles seulement une fois découvertes (hors traces sans scénario) ; nœuds du Fil des 75 |
| 00061 | profiles.fast_transit ; start_transit n'accélère que pour un admin qui l'a activé ; RPC set_fast_transit et reset_my_game (admins) |
| 00062 | signal_support : valeur NEUTRINO (détecteur de neutrinos) |
| 00063 | ships.supernova_t0 (création + 10 min) et supernova_captured_at ; événement SN-001 (signal_events) ; RPC capture_supernova_neutrinos |
| 00064 | supernova_t0 : création + 3 min (au lieu de 10) ; parties en attente alignées |
| 00065 | supernova_t0 = création + 8 min ; supernova_pre_captured_at ; capture_supernova_neutrinos capte la montée de pré-supernova puis la bouffée |
| 00066 | ships.lpt_captured_at ; RPC capture_lpt_signal : première impulsion de GPM J1839−10 après création + 20 min, phase calée sur scenario_signal_epoch (LPT-001) |
| 00067 | Signaux modèles de départ : doublon du sursaut gravitationnel (objet BNS GW-2341) retiré |
| 00068 | Journal de bord : logbook_entries (famille, contexte, clé), date du vaisseau (ship_galactic_date), entrées écrites par déclencheurs (fondatrice, départ, arrivée, neutrinos) et RPC log_sky_event (sortie du choc, LPT-001) ; le joueur n'écrit que des entrées MANUEL ; date de réception des signaux au calendrier du vaisseau |
| 00069 | Générations : ships.generation et populations.generation recalculés à l'arrivée (1 + années simulées ÷ 25) ; entrée GENERATIONNEL au premier passage |

**Application** : `supabase db reset` (local), `supabase db push` (projet lié), ou SQL Editor / MCP Supabase.

**Procédure utilisée en production** (sans CLI Supabase) : sauvegarde `pg_dump` 18 (la base est en Postgres 17.6) puis `psql --single-transaction -v ON_ERROR_STOP=1 -f <migration>` — détail dans `docs/architecture/PLAN_COMPTES_JOUEURS.md` §8.

**Rejeu sur base vierge** : échoue à `00019` (`function name "get_visible_systems" is not unique`) ; à corriger avant de recréer une base de zéro.

### RPC `start_new_game(p_pseudo, p_ship_name)` (migration 00046)

`SECURITY DEFINER`, réservée à `authenticated`. Crée en une transaction : profil, vaisseau à Sol, `ship_systems` et `populations` (valeurs par défaut des tables), nœud Sol de la carte, copie des signaux modèles. Erreurs : `42501` (non connecté), `22023` (longueurs), `23505` (partie déjà créée).

### RPC `start_transit(p_destination)` et `complete_transit()` (migration 00050)

`SECURITY DEFINER`, réservées à `authenticated`, sur le vaisseau du joueur connecté. Renvoient la ligne `ships`.

- `start_transit` : refuse si un transit est en cours (`55000`), si la destination est inconnue ou est le système courant (`22023`). Distance entre les coordonnées des deux systèmes (`system_xyz`), durée `transit_player_seconds(distance) × transit_time_scale`, arrivée = `now()` + durée.
- `complete_transit` : avant l'heure d'arrivée (horloge du serveur) ou hors transit, renvoie le vaisseau inchangé ; sinon ajoute le voyage à `ship_travels`, place le vaisseau à destination et incrémente `voyage`.

### RPC `delete_account()` (migration 00051)

`SECURITY DEFINER`, réservée à `authenticated`. Supprime les interprétations du joueur (sinon conservées sans auteur, `ON DELETE SET NULL`), efface son vaisseau de `traces.discovered_by`, puis supprime `auth.users` : profil, vaisseau et toutes ses données suivent en cascade. Appelée depuis Paramètres → Compte.

### RPC `unlock_trace_levels()` et `get_trace_levels(p_trace_id)` (migration 00060)

`SECURITY DEFINER`, réservées à `authenticated`. `unlock_trace_levels()` débloque pour le vaisseau du joueur les lectures de `trace_levels` accessibles depuis ses observations du système courant (même type, même corps `attributes.body_designation`, niveau au moins égal), découvre les traces correspondantes (`ship_traces`) et les entrées `PRÉCURSEUR` du système. Renvoie `{ levels, traces }`. `get_trace_levels` renvoie les lectures débloquées d'une trace. `trace_levels`, `ship_trace_levels` et les écritures sur `ship_traces` ne sont pas accessibles aux joueurs.

### RPC `capture_system_signals()` (migration 00057)

`SECURITY DEFINER`, réservée à `authenticated`. Sans paramètre : lit le système courant du vaisseau du joueur et y copie, dans `signals` (`source_type = 'EMITTER'`), les émetteurs de `system_signal_sources`. Idempotente (verrou sur le vaisseau, clé `attributes.source_ref`), sans effet en transit. Renvoie `{ inserted }`. Les fenêtres d'émission sont copiées avec l'époque de `game_settings.scenario_signal_epoch`.

### RPC `compute_pulsar_signals(p_ship_id, p_band)` (migrations 00041 → 00047)

`SECURITY DEFINER`, réservée à `authenticated` et au **propriétaire** du vaisseau. Insère un signal `PULSAR` par pulsar visible dans la bande (P, L, X, G), dédupliqué par vaisseau. Renvoie `{ inserted, evaluated, band, ship_id }`.

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

### RPC `get_systems_for_conception` (migrations 00029, 00030)

Systèmes pour la Vue 3D conception (catalogue, filtres côté client). Pas de filtre magnitude ni viewer.

```sql
get_systems_for_conception(
  p_limit  INT DEFAULT 10000,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(id, name, spectral_type, distance, age, planets, habitable_zone, anomaly_level,
              coordinates, apparent_magnitude, luminosity, color_index, object_type)
```

- **object_type** : type de l'objet principal du système (STAR, PULSAR, NEUTRON_STAR, MAGNETAR) depuis `system_objects`, premier par `sort_order`.
- Utilisée par le store `stellarSystems` pour chargement paginé (Page Conception Étoiles).

---

## 6. Convention de nommage des IDs stellaires

Les IDs de `stellar_systems` suivent des règles strictes pour éviter les doublons lors des imports futurs.

### Règle générale — slug minuscules-tirets

Tout hostname ou nom d'étoile est transformé selon :
1. Passage en minuscules
2. Remplacement de tout caractère non alphanumérique par `-`
3. Suppression des tirets en début et fin

Ex : `"Barnard's Star"` → `barnards-star`
Ex : `"HD 40307"` → `hd-40307`
Ex : `"GJ 1061"` → `gj-1061`

### Exception 1 — Le `+` astronomique est conservé

Les désignations BD+, 2MASS J+, WD+ contiennent un `+` qui a une signification astronomique (déclinaison positive). Il est conservé tel quel dans l'ID.

Ex : `"BD+05 4868 A"` → `bd+05-4868-a` ✓
Ex : `"BD+05 4868 A"` → `bd-05-4868-a` ✗

### Exception 2 — Le point décimal est supprimé

Les identifiants Gliese avec point décimal (`GJ 508.2`) sont slugifiés en supprimant le point, pas en le remplaçant par un tiret.

Ex : `"GJ 508.2"` → `gj-5082` ✓
Ex : `"GJ 508.2"` → `gj-508-2` ✗

### Priorité des sources pour la construction de l'ID

En cas de conflit entre sources, l'ID retenu suit cet ordre :
1. **HYG** — slug du champ `proper` ou `gl`
2. **NASA** — slug du `hostname`
3. **MANUAL** — jamais ; les entrées manuelles doivent adopter la convention HYG/NASA

---

## 7. RLS (Row Level Security)

État après les migrations `00048` (comptes joueurs) et `00050` (transit). « Son vaisseau » = `ship_id IN (SELECT id FROM ships WHERE user_id = auth.uid())`.

| Table | Lecture | Écriture |
|-------|---------|----------|
| profiles | soi (`authenticated`) | UPDATE de `pseudo` seulement ; création par `start_new_game` |
| ships | son vaisseau | UPDATE de `name` seulement ; transit par `start_transit` / `complete_transit` ; pas d'INSERT (→ `start_new_game`) ni de DELETE |
| ship_systems, populations | son vaisseau | aucune |
| signals, observations | son vaisseau | son vaisseau |
| lab_reports | via ses observations | via ses observations |
| ship_travels | son vaisseau | aucune (→ `complete_transit`) |
| map_nodes, map_edges, ship_traces, logbook_entries | son vaisseau | son vaisseau |
| game_settings | aucune | aucune (dashboard) |
| interpretations | tous les joueurs connectés, **sans `ship_id`** (droits par colonne) | INSERT avec son `ship_id` ; DELETE des siennes |
| traces | joueurs connectés, **sans `discovered_by`** | aucune |
| stellar_systems, system_objects, signal_events, nebulas, drake_*, constellations, constellation_lines | publique | aucune |

Sans compte (`anon`) : aucune donnée de jeu, données du monde en lecture. `TRUNCATE` retiré à `anon` et `authenticated` (non soumis à la RLS).

---

## 8. Seed et données du monde

**Fichier** : `supabase/seed.sql` — données du monde uniquement. Plus de vaisseau prototype : chaque joueur crée le sien avec `start_new_game`.

| Donnée | Contenu |
|--------|---------|
| stellar_systems | ~100 systèmes : 9 de base + ~90 étendus + naines brunes LUHMAN16 (L7.5), WISE0855 (Y4) |
| system_objects | Étoiles, planètes, disques, pulsar PSR B1919+21. Données scientifiques (NASA Exoplanet Archive, Wikipedia). Génération : `yarn seed:generate` |
| traces | WOW-1977-A, OUMUAMUA-2017, BENNU-NB-2023 + PROXIMA-001, BARNARD-001, ROSS128-001, EPSILON-001, TAU-CETI-001, GLIESE667-001 |
| nebulas | Boucle de Barnard, Orion M42, Tête de Cheval, Rosette (formes ellipse, IR-only) |
| drake_equation | Une ligne initiale |
| signals (modèles) | 7 signaux de démo, `session_id = 'seed-demo'`, `ship_id` nul — copiés par `start_new_game` dans chaque nouvelle partie |
| constellations / constellation_lines | Peuplés par `populate_constellations.py` (88 IAU + segments depuis constellation.shapes.iau.txt), pas par seed |

**Exécution** : `supabase db reset` exécute migrations + seed. Après import HYG, exécuter `populate_constellations.py` pour les constellations.

---

## 9. Mapping Store ↔ Table

| Store Pinia | Table(s) | Opérations |
|-------------|----------|------------|
| stellarSystems | stellar_systems, constellation_lines | SELECT stellar_systems (RPC get_visible_systems pour Observatoire ; get_systems_for_conception pour Vue 3D conception). SELECT constellation_lines pour stick-figures. Fusion naines brunes L/T/Y pour filtre IR. |
| nebulas | nebulas | SELECT (formes étendues, IR-only). SkyCanvas projection ellipse/polygone. |
| systemObjects | system_objects | SELECT par system_id (corps Observatoire) |
| observations | observations | SELECT, INSERT, UPDATE (state), DELETE. Filtre ship_id (vaisseau du joueur) |
| traces | traces, interpretations | SELECT traces immuables, interpretations (sans ship_id). INSERT interpretation (ship_id, génération). DELETE de ses interprétations. Traces joueur en mémoire (playerTraces) — à brancher sur ship_traces |
| signaux | signals, RPC compute_pulsar_signals | SELECT / INSERT / DELETE filtrés par ship_id ; calcul des pulsars par bande |
| ship | ships, ship_systems, populations, ship_travels | SELECT du vaisseau du joueur (attend la session). UPDATE ships (transit, renameShip). INSERT ship_travels à chaque arrivée |
| auth | auth (Supabase), profiles, ships, RPC start_new_game | Session, inscription, connexion, mot de passe ; profil (pseudo, rôle), hasShip ; startNewGame, updatePseudo |
| supabase | Client | isConfigured() |

---

## 10. Configuration

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

### Sauvegarde base de données

Sauvegarde de la base Supabase distante vers un fichier SQL.

| Méthode | Commande |
|---------|----------|
| **Yarn** | `yarn backup:db` |
| **Script** | `./scripts/backup-db.sh` |

**Prérequis** (au choix) :
1. **Projet lié** : `npx supabase link --project-ref utdzobspxeecxauwnkve` puis `SUPABASE_DB_PASSWORD` dans `.env`
2. **URL directe** : `SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.utdzobspxeecxauwnkve.supabase.co:5432/postgres` dans `.env`

Le mot de passe DB se récupère dans Dashboard Supabase → Project Settings → Database.

**Sortie** : `backups/dump_YYYYMMDD_HHMMSS.sql` (dossier `backups/` ignoré par git)

### pg_dump tables critiques (dans le repo)

Dump ciblé des tables de référence vers `supabase/dumps_critiques/` (versionné).

| Commande | `yarn dump:critiques` |
|----------|------------------------|
| **Tables** | stellar_systems, system_objects, constellations, constellation_lines, traces |
| **Sortie** | `supabase/dumps_critiques/dump_critiques_YYYYMMDD.sql` |
| **Prérequis** | `SUPABASE_DB_URL` dans `.env`, `pg_dump` installé (brew install libpq) |

---

## 11. Scripts d'import (stellar_import)

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
├── hyg_patch.py            # Patch HYG : constellation_abbr, luminosity, color_index + field_sources (--dry-run/--apply)
├── nasa_age_patch.py       # Patch NASA : age (Ga) depuis Exoplanet Archive st_age
├── nasa_systems_import.py  # Import systèmes NASA manquants (stellar_systems + system_objects)
├── constellation_patch.py  # Patch constellation_abbr depuis x/y/z (RA/Dec → IAU astropy)
├── coords_patch.py         # Patch coordinates depuis NASA TAP (RA/Dec sy_dist → x/y/z)
├── luminosity_patch.py     # Extrapole luminosity depuis spectral_type (EXTRAPOLATED, table calibrée HYG)
├── gaia_patch.py           # Gaia DR3 : color_index (bp_rp), age (estimation HR), teff dans attributes
├── dedup_stellar_systems.py # Supprime doublons stellar_systems (MANUAL vs HYG/NASA, artefacts +/-, transfert champs, FK)
├── dedup_system_objects.py  # Supprime doublons system_objects (même system_id+designation, cat A/B, score complétude)
├── jwst_atmospheres_patch.py # Import compositions atmosphériques (données curées, source JWST)
├── simbad_exotic_import.py   # Import objets exotiques SIMBAD (WD max 500 + parallaxe ; PSR/NS/BH/Magnetar sans filtre plx)
├── atnf_pulsar_patch.py      # Patch pulsars : coordonnées, distance, attributes (P0, BSURF, W50, AGE) depuis ATNF Catalogue
├── resolve_conflicts.py      # Rapport résolution conflits NASA (default_flag=1) vs doublons en base
├── verify_hd_aliases.py      # Vérifie mapping aliases HD (hostname NASA ↔ IDs base)
├── verify_hd_hyg.py          # Vérifie cohérence HD entre HYG et base
├── verify_hd_nasa.py         # Vérifie cohérence HD entre NASA Exoplanet Archive et base
├── hyg_planets_import.py     # Import planètes depuis HYG (référence complémentaire)
├── query_hd_system_objects.py # Requêtes système par ID HD
├── source_existing_data.py   # Utilitaires lecture données existantes (base)
├── populate_constellations.py  # 88 constellations IAU + constellation_lines (source constellation.shapes.iau.txt)
├── check_systems.py        # Vérifie champs (apparent_magnitude, coordinates, luminosity) pour ids
├── check_duplicate_systems.py # Détecte doublons HYG/LACUNA
├── diagnose_names.py       # Diagnostique mapping noms DB ↔ HYG
├── diagnose_nasa_planets.py # Diagnostique planètes NASA
├── analyze_unmatched_hyg.py # Analyse IDs Supabase non matchés dans HYG
├── nasa_systems_by_distance.py # Systèmes NASA par distance (&lt; 500 al)
├── analyze_nasa_age_matching.py # Croise hostnames non matchés / NASA sans âge
├── report.py               # Génère stellar_import/import_report.md
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
cd stellar_import && python3 hyg_patch.py [--apply]     # Patch champs manquants (con, lum, ci) + field_sources
cd stellar_import && python3 nasa_age_patch.py [--apply] # Patch age (Ga) depuis NASA
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

## 12. Références design

| Document | Section | Contenu lié |
|----------|---------|-------------|
| LACUNA_TRACES | §2, §3 | Traces immuables, propriétés signaux, PSR-001 |
| LACUNA_LABORATOIRE_INSTRUMENTS | §7, §9 | Types d'objets, matrices instrument |
| LACUNA_UI | §3, §4 | Modules, contenu Collection |
| LACUNA_GDD | §5 | Système social, vaisseau |

---

## Changelog

| Date | Modifications |
|------|---------------|
| 2026-10-22 | Suppression du compte : RPC delete_account (00051) |
| 2026-10-23 | Migrations 00052–00058 écrites, non appliquées : population 15 000, Drake, origine PRÉCURSEUR, colonnes de scénario sur traces, émetteurs de système (EMITTER, capture_system_signals), données astronomiques du Fil des 75 |
| 2026-10-23 | Migrations 00059–00060 écrites, non appliquées : niveaux de lecture des traces, découverte côté serveur, nœuds du Fil des 75 |
| 2026-10-23 | Migrations 00052–00061 appliquées en production ; 00061 : réglages d'administration |
| 2026-10-23 | 00062 appliquée : support de signal NEUTRINO |
| 2026-10-23 | 00063 appliquée : supernova de Bételgeuse (T0 par partie, bouffée de neutrinos) |
| 2026-10-23 | 00064–00065 appliquées : montée de pré-supernova ; 00066 écrite : signal de 22 minutes (LPT-001) |
| 2026-10-23 | 00066 appliquée : signal de 22 minutes (LPT-001) |
| 2026-10-23 | 00067 écrite : doublon GW retiré des signaux modèles de départ |
| 2026-10-23 | 00067 appliquée : 6 signaux modèles de départ |
| 2026-10-23 | 00068 écrite : journal de bord |
| 2026-10-23 | 00068 appliquée : journal de bord (entrée fondatrice et neutrinos rattrapés pour la partie en cours) |
| 2026-10-23 | 00069 écrite : générations |
| 2026-10-22 | Transit côté serveur : game_settings, RPC start_transit / complete_transit, droits par colonne sur ships, ship_travels en lecture seule (00050) |
| 2026-10-21 | Comptes joueurs : Auth, table profiles, RPC start_new_game et compute_pulsar_signals(vaisseau, bande), RLS par joueur (§7), seed sans prototype, migrations 00034–00048 |
| 2026-03-16 | Audit documentation : scripts resolve_conflicts, verify_hd_*, hyg_planets_import, query_hd_system_objects, source_existing_data ; migrations 00032, 00033 ; colonne disk_mass_earth (system_objects) |

---

*LACUNA — Documentation Backend v1 — Mars 2026*
