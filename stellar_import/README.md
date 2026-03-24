# Import données stellaires LACUNA

Import HYG Database + NASA Exoplanet Archive → Supabase.

## Prérequis

- Python 3.10+
- Fichier HYG : `Ressources/hyg_v42.csv` ou `resources/hyg.csv`
- `.env` avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`

## Installation

```sh
cd stellar_import
python3 -m venv .venv
source .venv/bin/activate   # ou .venv\Scripts\activate sur Windows
pip install -r requirements.txt
```

## Exécution

```sh
python main.py
```

Ou depuis la racine du projet :

```sh
yarn import:stellar
```

## Progression et reprise

- `import_progress.json` : progression (reprise automatique en cas d'interruption)
- `import_report.md` : rapport final (généré dans stellar_import/)
- `import_errors.log` : erreurs détaillées

## Patch HYG (champs manquants)

Le script `hyg_patch.py` complète `constellation_abbr`, `luminosity`, `color_index` depuis HYG.
Règle absolue : ne jamais écraser une valeur existante. Met à jour `field_sources`.

```sh
# Simulation — aucune écriture (défaut)
python3 stellar_import/hyg_patch.py

# Application réelle
python3 stellar_import/hyg_patch.py --apply

# Test sur un seul système
python3 stellar_import/hyg_patch.py --system BARNARD --apply
```

- `hyg_patch_unmatched.log` : IDs des systèmes non matchés dans HYG

## Patch NASA (âge stellaire)

Le script `nasa_age_patch.py` complète `age` (Ga) depuis NASA Exoplanet Archive.
Règle absolue : ne jamais écraser une valeur existante. Met à jour `field_sources`.

```sh
# Simulation — aucune écriture (défaut)
python3 stellar_import/nasa_age_patch.py

# Application réelle
python3 stellar_import/nasa_age_patch.py --apply

# Test sur un seul système
python3 stellar_import/nasa_age_patch.py --system k2-141 --apply
```

- `nasa_age_patch_unmatched.log` : hostnames NASA non matchés

## Import systèmes NASA (manquants)

Le script `nasa_systems_import.py` crée les `stellar_systems` et `system_objects` pour les systèmes exoplanétaires NASA absents de la base (dist ≤ 500 al).

Règle absolue : ne jamais écraser un système existant. Idempotent.

```sh
# Simulation — aucune écriture (défaut)
python3 stellar_import/nasa_systems_import.py --dry-run

# Application réelle (lots de 100)
python3 stellar_import/nasa_systems_import.py --apply --batch-size 100

# Test sur un seul système
python3 stellar_import/nasa_systems_import.py --system "Kepler-442" --apply
```

- `nasa_systems_import.log` : log des créations et erreurs

## Patch constellation (depuis coordonnées)

Le script `constellation_patch.py` complète `constellation_abbr` pour les systèmes qui n'en ont pas, en calculant RA/Dec depuis (x, y, z) et en déterminant la constellation via le catalogue IAU (astropy).

Source : COMPUTED. Ne remplace jamais une valeur existante. Idempotent.

```sh
# Simulation — aucune écriture (défaut)
python3 stellar_import/constellation_patch.py

# Application réelle (lots de 200)
python3 stellar_import/constellation_patch.py --apply --batch-size 200

# Test sur un seul système
python3 stellar_import/constellation_patch.py --system gj-1061 --apply
```

- `constellation_patch_errors.log` : erreurs détaillées
- Prérequis : `pip install astropy`

## Patch coordonnées (NASA RA/Dec → x/y/z)

Le script `coords_patch.py` complète `coordinates` pour les systèmes sans x/y/z valides (hors SOL) à partir du TAP NASA (hostname → ra, dec, sy_dist). Recalcule `constellation_abbr` si elle est absente (astropy, source COMPUTED). Matching : `_resolve_hostname_fast` comme `nasa_age_patch.py`.

Ne remplace jamais des coordonnées déjà valides. Idempotent.

```sh
# Simulation — aucune écriture (défaut)
python3 stellar_import/coords_patch.py

# Application
python3 stellar_import/coords_patch.py --apply --batch-size 200

# Test sur un seul système
python3 stellar_import/coords_patch.py --system k2-141 --apply
```

- `coords_patch_unmatched.log` : IDs sans correspondance NASA

## Patch luminosité (extrapolation)

Le script `luminosity_patch.py` extrapole `luminosity` depuis `spectral_type` pour les systèmes sans mesure directe. Table calibrée HYG + littérature. Source EXTRAPOLATED.

```sh
# Simulation
python3 stellar_import/luminosity_patch.py --dry-run

# Application
python3 stellar_import/luminosity_patch.py --apply --batch-size 500

# Test sur un système
python3 stellar_import/luminosity_patch.py --system wolf-359 --apply
```

- `luminosity_patch_unknown.log` : types spectraux non reconnus

## Patch Gaia DR3 (color_index, age)

Le script `gaia_patch.py` complète `color_index` (depuis bp_rp) et optionnellement `age` (estimation HR) depuis Gaia DR3. Matching par HIP pour les ids `hip-NNNNN` (~6 072 systèmes), cone search pour les autres (hd-, gj-, toi-, k2-, etc.). Source GAIA/EXTRAPOLATED.

```sh
# Simulation
python3 stellar_import/gaia_patch.py --dry-run

# Application
python3 stellar_import/gaia_patch.py --apply --batch-size 1000

# Test sur un système
python3 stellar_import/gaia_patch.py --system hip-570 --apply
```

- `gaia_patch_unmatched.log` : systèmes non matchés Gaia
- **Note** : le matching complet (40k+ HIP) peut prendre 30-60 min

### Scripts d'analyse (diagnostic)

| Script | Rôle |
|--------|------|
| `analyze_unmatched_hyg.py` | Analyse des IDs Supabase non matchés dans HYG |
| `nasa_systems_by_distance.py` | Liste les systèmes NASA par distance (zone &lt; 500 al) |
| `analyze_nasa_age_matching.py` | Croise hostnames non matchés avec systèmes NASA sans âge |
| `check_duplicate_systems.py` | Détecte doublons HYG/LACUNA |
| `diagnose_names.py` | Diagnostique mapping noms DB ↔ HYG |
| `diagnose_nasa_planets.py` | Diagnostique planètes NASA |
| `query_hd_system_objects.py` | Requêtes système par ID HD |
| `source_existing_data.py` | Utilitaires lecture données existantes |

### Résolution conflits NASA

Le script `resolve_conflicts.py` génère un rapport (`resolv_conflicts_report.md`) comparant les désignations officielles NASA (default_flag=1) aux entrées `system_objects` en base. Dry-run uniquement — aucune modification en base.

```sh
python3 stellar_import/resolve_conflicts.py
```

### Vérification HD (aliases, HYG, NASA)

| Script | Rôle |
|--------|------|
| `verify_hd_aliases.py` | Vérifie mapping aliases HD via NASA Alias Lookup |
| `verify_hd_hyg.py` | Vérifie cohérence HD entre HYG et base |
| `verify_hd_nasa.py` | Vérifie cohérence HD entre NASA Exoplanet Archive et base |

### Import planètes HYG

Le script `hyg_planets_import.py` importe les planètes depuis HYG (référence complémentaire NASA).

## Déduplication stellar_systems (37 doublons)

Le script `dedup_stellar_systems.py` supprime les 37 paires de doublons (MANUAL vs HYG/NASA, artefacts +/-). Transfère les champs manquants, redirige les FK, supprime l'entrée dupliquée. Idempotent.

```sh
# Simulation — aucune écriture (défaut)
python3 stellar_import/dedup_stellar_systems.py

# Application réelle
python3 stellar_import/dedup_stellar_systems.py --apply
```

- `dedup_stellar_systems.log` : log des opérations
- Résultat attendu : 43 813 - 37 = 43 776 systèmes

## Déduplication system_objects (doublons)

Le script `dedup_system_objects.py` supprime les doublons (même system_id + designation). Catégorie A (vrais doublons, écart période < 10%) : garde la plus complète, supprime les autres. Catégorie B (conflits, écart > 10%) : log uniquement.

```sh
# Simulation
python3 stellar_import/dedup_system_objects.py --dry-run

# Application
python3 stellar_import/dedup_system_objects.py --apply

# Test sur un système
python3 stellar_import/dedup_system_objects.py --system hd-69830 --apply
```

- `dedup_objects.log` : log des suppressions
- `dedup_objects_conflicts.log` : conflits catégorie B (ne pas toucher)

## Patch JWST (compositions atmosphériques)

Le script `jwst_atmospheres_patch.py` importe les compositions atmosphériques détectées par spectroscopie (JWST, Hubble, Spitzer) depuis un jeu de données curé (`jwst_atmospheres_data.json`). La colonne `pl_atmoscomp` ayant été retirée de l'API NASA, les données proviennent de la littérature.

Met à jour `atmosphere_composition` (jsonb), `has_atmosphere`, `atmosphere_detected` et `field_sources` (source JWST).

```sh
# Simulation — aucune écriture (défaut)
python3 stellar_import/jwst_atmospheres_patch.py --dry-run

# Application
python3 stellar_import/jwst_atmospheres_patch.py --apply

# Test sur une planète
python3 stellar_import/jwst_atmospheres_patch.py --planet "WASP-39 b" --apply
```

- `jwst_atmospheres_data.json` : données curées (hostname, pl_letter, pl_atmoscomp)
- `jwst_unmatched.log` : planètes non matchées (système absent de la base)

## Import SIMBAD — Objets exotiques

Le script `simbad_exotic_import.py` importe les objets exotiques (pulsars, naines blanches,
étoiles à neutrons, magnétars, trous noirs) depuis SIMBAD TAP.

**Stratégie** : naines blanches avec filtre parallaxe (&lt; 1000 al) et **max 500** par défaut ;
PSR / Magnetar / NS / BH via une requête séparée **sans** filtre parallaxe (création possible
sans distance si parallaxe absente — coords optionnelles). Sgr A* exclu.

Crée les entrées manquantes dans `stellar_systems`, met à jour `object_type` pour les
entrées déjà présentes (ex. naines blanches HYG mal typées).

```sh
# Simulation — aucune écriture (défaut)
python3 stellar_import/simbad_exotic_import.py --dry-run

# Application
python3 stellar_import/simbad_exotic_import.py --apply

# Filtre par type (PULSAR, WHITE_DWARF, NEUTRON_STAR, MAGNETAR, BLACK_HOLE)
python3 stellar_import/simbad_exotic_import.py --type PULSAR --dry-run

# Max naines blanches (défaut 500)
python3 stellar_import/simbad_exotic_import.py --wd-limit 300 --apply
```

## Patch ATNF (pulsars)

Le script `atnf_pulsar_patch.py` complète les pulsars importés depuis SIMBAD (object_type = 'PULSAR') avec les données du **ATNF Pulsar Catalogue** : coordonnées, distance, paramètres de rotation (période, champ magnétique, cône d'émission). Ces paramètres alimentent la mécanique de détection directionnelle future.

Source : ATNF (priorité = SIMBAD). Ne remplace jamais les champs sourcés MANUAL. Idempotent.

**Prérequis** : `pip install psrqpy astropy`. Migration `00033_stellar_systems_attributes.sql` pour la colonne `attributes`.

```sh
# Simulation — aucune écriture (défaut)
python3 stellar_import/atnf_pulsar_patch.py --dry-run

# Application
python3 stellar_import/atnf_pulsar_patch.py --apply --batch-size 500

# Test sur un pulsar
python3 stellar_import/atnf_pulsar_patch.py --pulsar "psr-j0437-4715" --apply
```

- `atnf_unmatched.log` : pulsars en base sans correspondance ATNF

## Dernières exécutions des patchs

| Patch | Date | Systèmes mis à jour |
|-------|------|---------------------|
| `hyg_patch.py --apply` | 2026-03-19 | 55 (constellation_abbr, luminosity, color_index) |
| `nasa_age_patch.py --apply` | 2026-03-19 | 647 (age en Ga depuis NASA Exoplanet Archive) |
| `constellation_patch.py --apply` | 2026-03-19 | 363 (constellation_abbr depuis x/y/z, IAU astropy) |
| `coords_patch.py --apply` | 2026-03-19 | 651 (coordinates x/y/z + constellation_abbr depuis NASA TAP) |
| `dedup_stellar_systems.py --apply` | 2026-03-20 | 37 doublons supprimés (43 813 → 43 776) |
| `dedup_system_objects.py --apply` | 2026-03-20 | 992 doublons supprimés (3 260 → 2 268) |
| `luminosity_patch.py --apply` | 2026-03-20 | 367 (luminosity extrapolée depuis spectral_type) |
| `gaia_patch.py --apply` | 2026-03-20 | ~4 944 (color_index, age depuis Gaia DR3, matching HIP + cone search) |
| `jwst_atmospheres_patch.py --apply` | 2026-03-20 | 22 (atmosphere_composition, has_atmosphere, atmosphere_detected — source JWST) |
| `simbad_exotic_import.py --apply` | 2026-03-21 | 4419 créés + 1 object_type corrigé (WD, PSR, BH — source SIMBAD) |
| `atnf_pulsar_patch.py --apply` | 2026-03-21 | 2945 (coordinates, distance, attributes, age — source ATNF) |
| `resolve_conflicts.py` | — | Dry-run uniquement — rapport resolv_conflicts_report.md |

**État base (audit 2026-03-16)** : 48 195 stellar_systems, 2 155 system_objects (PLANET 2 052, STAR 97, DEBRIS_DISK 4, PULSAR 1, NEUTRON_STAR 1).

## Changelog

| Date | Modifications |
|------|---------------|
| 2026-03-16 | Audit doc : scripts resolve_conflicts, verify_hd_*, hyg_planets_import, query_hd_system_objects, source_existing_data ; stats base réelles ; changelog |

## Sources

- HYG Database v3 : <https://github.com/astronexus/HYG-Database>
- NASA Exoplanet Archive TAP API : <https://exoplanetarchive.ipac.caltech.edu/>
- ATNF Pulsar Catalogue : <https://www.atnf.csiro.au/research/pulsar/psrcat/> (via psrqpy)
