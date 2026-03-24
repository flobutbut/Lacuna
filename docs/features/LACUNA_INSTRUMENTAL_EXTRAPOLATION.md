# LACUNA — Extrapolation des données instrumentales
*Version 0.1 — Mars 2026*

> Stratégie pour générer les données manquantes nécessaires aux instruments du Laboratoire.
> Complément de `LACUNA_PROCEDURAL_PLANETS.md` et `LACUNA_PROCEDURAL_TRACES.md`.
> Référence : `LACUNA_LABORATOIRE_INSTRUMENTS.md` §11.

---

## 1. Principe

Les instruments du Laboratoire consomment des données physiques sur les astres. Pour les instruments qui opèrent à des niveaux d'observation avancés (orbite proche, contact), aucune base de données publique ne fournit les données nécessaires — elles n'existent tout simplement pas pour la grande majorité des exoplanètes.

La stratégie est la même que pour les planètes procédurales : **extrapoler à partir de ce qu'on sait**. Chaque paramètre manquant est calculé depuis des propriétés connues (masse, type spectral, distance orbitale, âge) en appliquant des lois physiques réelles ou des distributions statistiques calibrées sur les observations disponibles.

### Règle fondamentale

Un paramètre extrapolé doit :
1. Être **physiquement cohérent** avec les autres propriétés connues de l'objet
2. Être **déductible par le joueur** depuis les données brutes sans que le jeu le formule explicitement
3. **Ne jamais prétendre être une mesure réelle** — les données réelles (NASA, HYG) ont `data_source = 'NASA'` ; les données extrapolées ont `data_source = 'PROCEDURAL'`

---

## 2. État des données par instrument

| Instrument | Données nécessaires | Présent en base | Manquant | Stratégie |
|------------|---------------------|-----------------|----------|-----------|
| Spectromètre stellaire | spectral_type, luminosity | ✅ HYG | — | Rien à faire |
| Analyseur orbital | a, e, i, P, désignation, ZH | ✅ NASA | — | Rien à faire |
| Spectromètre atmosphérique | composition, pression | △ NASA partiel | ~95% des planètes | Extrapolation §4 |
| Analyseur volumétrique | distribution densité 3D | ❌ | Tout | Synthèse §5 |
| Scanner morphologique | forme, aspect_ratio, thermique | ❌ | Tout | Extrapolation §6 |
| Magnétomètre | intensité champ, orientation | △ booléen seul | Intensité, orientation | Extrapolation §7 |
| Spectromètre de contact | éléments, isotopes, datation | ❌ | Tout | Extrapolation §8 |
| Analyseur d'échantillon | molécules, chiralité, datation | ❌ | Tout | Extrapolation §9 |

---

## 3. Atmosphère — enrichissement depuis données réelles

Avant d'extrapoler, importer les données atmosphériques réelles disponibles.

### Sources réelles exploitables

**NASA Exoplanet Archive — atmosphères détectées**
*Note : la colonne `pl_atmoscomp` a été retirée de l'API NASA (2023+).*
Le script `jwst_atmospheres_patch.py` utilise désormais un jeu de données curé (`jwst_atmospheres_data.json`) issu de la littérature.

Couvre ~50 planètes avec détections JWST/Hubble/Spitzer confirmées.

**JWST Early Release Science — cas emblématiques**
- WASP-39b : H₂O, CO₂, CO, SO₂, K détectés
- WASP-96b : H₂O
- TOI-270d : H₂O, CO₂, CH₄ (potentiel)
- K2-18b : CH₄, CO₂, possible DMS (biosignature candidate)

Ces planètes doivent avoir des données atmosphériques réelles en base, pas extrapolées.

### Mapping vers `atmosphere_composition` jsonb

```python
# Exemple de parsing pour WASP-39b
{
  "H2O": 0.001,     # fraction molaire estimée
  "CO2": 0.0005,
  "CO":  0.0003,
  "SO2": 0.00001,   # détection notable — anomalie potentielle
  "K":   0.00001,
  "source": "JWST_ERS_2022",
  "confidence": 0.92
}
```

---

## 4. Extrapolation atmosphérique

Pour les planètes sans données atmosphériques réelles (~95% du catalogue).

### 4.1 Conditions d'existence d'une atmosphère

```python
def has_atmosphere(planet: dict, star: dict) -> bool:
    """Une planète peut avoir une atmosphère si elle remplit ces conditions."""
    
    # Trop petite → pas assez de gravité pour retenir une atmosphère
    if planet['mass_earth'] < 0.1:
        return False
    
    # Trop chaude → atmosphère évaporée
    if planet['surface_temperature_k'] > 900:
        return False
    
    # Étoile trop active → érosion atmosphérique
    spectral_cls = star['spectral_type'][0] if star.get('spectral_type') else 'G'
    if spectral_cls == 'M' and planet['orbital_semi_major_axis_au'] < 0.1:
        return random() > 0.7  # 30% de chance seulement
    
    # Planète en zone habitable → atmosphère probable
    if planet['in_habitable_zone']:
        return random() > 0.3  # 70% de chance
    
    return random() > 0.5  # 50% sinon
```

### 4.2 Type atmosphérique selon le type planétaire

| Type planète | Masse | Atmosphère type | Composition dominante |
|-------------|-------|-----------------|----------------------|
| Rocheuse froide | < 1.5 R⊕, T < 250K | Mince / CO₂ | CO₂ dominant, traces N₂ |
| Rocheuse habitable | < 1.5 R⊕, ZH | N₂/O₂ ou CO₂ | Variable — potentiellement biosignature |
| Rocheuse chaude | < 1.5 R⊕, T > 700K | Vénusienne | CO₂ dominant, H₂SO₄ |
| Super-Terre | 1.5–4 R⊕ | Épaisse / H₂ | H₂, He, H₂O variable |
| Neptune | 4–8 R⊕ | H₂/He | H₂, He, CH₄ |
| Géante gazeuse | > 8 R⊕ | Jovienne | H₂, He dominant, traces |

### 4.3 Biosignatures procédurales

Pour les planètes en zone habitable avec atmosphère N₂/O₂ :
- Probabilité de biosignature (O₂ + CH₄ simultanés) = `0.15 * (age_Ga / 5) * will_factor`
- `will_factor` = 1.0 par défaut, modulable par les arcs narratifs
- Ne jamais générer de biosignature à difficulté < 2

```python
# Exemple atmosphere_composition pour planète rocheuse habitable avec biosignature
{
  "N2":  0.78,
  "O2":  0.21,
  "CH4": 0.000002,   # Anomalie — O2+CH4 simultanés → déséquilibre chimique
  "H2O": 0.01,
  "CO2": 0.0004,
  "source": "PROCEDURAL",
  "biosignature_candidate": true,
  "confidence": 0.0   # Pas de mesure — extrapolé
}
```

---

## 5. Analyseur volumétrique — distribution de densité 3D

L'instrument produit une carte de densité interne de l'objet. Pour les planètes procédurales, la distribution est calculée depuis la masse et le rayon.

### 5.1 Modèle de structure interne

```python
def generate_density_profile(planet: dict, rng: random.Random) -> dict:
    """
    Génère un profil de densité radial en 5 couches.
    Retourne des fractions de rayon et densités associées.
    """
    mass = planet.get('mass_earth', 1.0)
    radius = planet.get('radius_earth', 1.0)
    
    mean_density = mass / (radius ** 3)  # relative à la Terre
    
    # Déterminer le type de structure
    if radius < 1.5:  # Rocheuse
        return {
            "layers": [
                {"r_fraction": 0.20, "density_factor": 3.5, "label": "Noyau interne"},
                {"r_fraction": 0.35, "density_factor": 2.8, "label": "Noyau externe"},
                {"r_fraction": 0.55, "density_factor": 1.8, "label": "Manteau inférieur"},
                {"r_fraction": 0.85, "density_factor": 1.2, "label": "Manteau supérieur"},
                {"r_fraction": 1.00, "density_factor": 0.7, "label": "Croûte"},
            ],
            "anomaly": _generate_density_anomaly(rng, mean_density),
            "source": "PROCEDURAL"
        }
    elif radius < 4:  # Super-Terre / Neptune-like
        return {
            "layers": [
                {"r_fraction": 0.25, "density_factor": 4.0, "label": "Noyau rocheux"},
                {"r_fraction": 0.50, "density_factor": 2.0, "label": "Manteau de glace"},
                {"r_fraction": 0.80, "density_factor": 0.8, "label": "Enveloppe gazeuse"},
                {"r_fraction": 1.00, "density_factor": 0.2, "label": "Atmosphère"},
            ],
            "anomaly": _generate_density_anomaly(rng, mean_density),
            "source": "PROCEDURAL"
        }
    else:  # Géante gazeuse
        return {
            "layers": [
                {"r_fraction": 0.15, "density_factor": 5.0, "label": "Noyau métallique"},
                {"r_fraction": 0.40, "density_factor": 1.5, "label": "H₂ métallique"},
                {"r_fraction": 0.75, "density_factor": 0.5, "label": "H₂ moléculaire"},
                {"r_fraction": 1.00, "density_factor": 0.1, "label": "Atmosphère"},
            ],
            "anomaly": None,
            "source": "PROCEDURAL"
        }

def _generate_density_anomaly(rng, mean_density):
    """Génère une anomalie de densité localisée (5% de probabilité)."""
    if rng.random() > 0.05:
        return None
    return {
        "type": rng.choice(["concentration", "void", "asymmetry"]),
        "r_fraction": rng.uniform(0.3, 0.7),
        "magnitude": rng.uniform(1.5, 4.0),  # × densité locale
        "angular_position": rng.uniform(0, 360)
    }
```

---

## 6. Scanner morphologique — forme et thermique

### 6.1 Aspect ratio

```python
def generate_aspect_ratio(planet: dict, rng: random.Random) -> float:
    """
    Ratio forme allongée. 1.0 = sphère parfaite.
    Les planètes massives sont plus sphériques.
    Les corps mineurs peuvent être très allongés.
    """
    mass = planet.get('mass_earth', 1.0)
    
    if mass > 5:
        # Grande planète — quasi-sphérique
        return 1.0 + rng.gauss(0, 0.005)
    elif mass > 0.5:
        # Planète moyenne
        return 1.0 + rng.gauss(0, 0.02)
    else:
        # Petite planète / corps mineur — peut être allongé
        # Distribution inspirée de la population des astéroïdes
        return 1.0 + abs(rng.gauss(0, 0.15))
```

### 6.2 Carte thermique de surface

```python
def generate_thermal_map(planet: dict, star: dict, rng: random.Random) -> dict:
    """
    Génère un profil de température de surface.
    Paramètre clé : planet['surface_temperature_k']
    """
    T_base = planet.get('surface_temperature_k', 278)
    
    # Gradient jour/nuit (si rotation synchrone probable)
    is_tidally_locked = (
        planet.get('orbital_semi_major_axis_au', 1.0) < 0.1 and
        star.get('spectral_type', 'G')[0] in ('M', 'K')
    )
    
    if is_tidally_locked:
        day_night_delta = T_base * 0.6  # Fort gradient
        hot_spot_offset = rng.uniform(-15, 15)  # Décalage du point chaud
    else:
        day_night_delta = T_base * 0.15
        hot_spot_offset = 0
    
    # Anomalie thermique (source de chaleur interne non identifiée)
    has_thermal_anomaly = rng.random() < 0.04  # 4% de probabilité
    
    return {
        "T_mean": T_base,
        "T_max": T_base + day_night_delta / 2,
        "T_min": T_base - day_night_delta / 2,
        "hot_spot_offset_deg": hot_spot_offset,
        "tidally_locked": is_tidally_locked,
        "thermal_anomaly": {
            "present": has_thermal_anomaly,
            "T_excess": rng.uniform(50, 200) if has_thermal_anomaly else 0,
            "surface_pct": rng.uniform(0.5, 5.0) if has_thermal_anomaly else 0
        },
        "source": "PROCEDURAL"
    }
```

---

## 7. Magnétomètre — intensité et orientation

### 7.1 Intensité du champ magnétique

```python
def generate_magnetic_field(planet: dict, rng: random.Random) -> dict:
    """
    Intensité en nanoteslas (nT). Terre = ~50 000 nT en surface.
    Dépend de la masse, de la rotation et de la composition interne.
    """
    mass = planet.get('mass_earth', 1.0)
    radius = planet.get('radius_earth', 1.0)
    
    # Seules les planètes rocheuses avec noyau liquide ont un champ magnétique fort
    if radius > 4:  # Géante gazeuse — champ fort lié à H₂ métallique
        intensity = 50000 * (mass ** 0.7) * rng.uniform(0.5, 2.0)
        has_field = True
    elif radius > 1.5:  # Super-Terre — variable
        has_field = rng.random() < 0.4
        intensity = 50000 * (mass ** 0.4) * rng.uniform(0.1, 1.0) if has_field else 0
    else:  # Rocheuse
        # Noyau liquide probable si masse entre 0.5 et 5 M⊕
        has_field = 0.5 < mass < 5 and rng.random() < 0.6
        intensity = 50000 * (mass ** 0.5) * rng.uniform(0.1, 1.5) if has_field else 0
    
    # Anomalie localisée (structure anormale sous-surfacique)
    has_anomaly = has_field and rng.random() < 0.06
    
    return {
        "has_field": has_field,
        "intensity_nt": round(intensity),
        "orientation_deg": rng.uniform(0, 180) if has_field else None,
        "local_anomaly": {
            "present": has_anomaly,
            "intensity_factor": rng.uniform(8, 120) if has_anomaly else 0,
            "surface_pct": rng.uniform(0.3, 4.2) if has_anomaly else 0,
            "shape": rng.choice(["circulaire", "linéaire", "polygonale"]) if has_anomaly else None
        },
        "source": "PROCEDURAL"
    }
```

---

## 8. Spectromètre de contact — composition de surface

### 8.1 Composition élémentaire

```python
# Table de référence : composition de surface selon le type planétaire
SURFACE_COMPOSITIONS = {
    "ROCKY_HABITABLE": {
        "Si": (25, 35), "O": (42, 48), "Fe": (5, 12),
        "Mg": (8, 14), "Al": (2, 5), "Ca": (1, 3),
        "trace_organics": True
    },
    "ROCKY_HOT": {
        "Si": (20, 30), "O": (35, 45), "Fe": (10, 20),
        "Mg": (5, 10), "S": (3, 8), "Ca": (1, 3),
        "trace_organics": False
    },
    "ROCKY_COLD": {
        "Si": (15, 25), "O": (30, 40), "Fe": (5, 15),
        "H2O_ice": (10, 40), "CO2_ice": (5, 20),
        "trace_organics": True  # Chimie prébiotique possible
    },
    "SUPER_EARTH": {
        "Si": (20, 30), "O": (35, 50), "Fe": (8, 15),
        "Mg": (5, 12), "H2O": (5, 20),
        "trace_organics": True
    }
}

def generate_surface_composition(planet: dict, rng: random.Random) -> dict:
    T = planet.get('surface_temperature_k', 278)
    in_hz = planet.get('in_habitable_zone', False)
    radius = planet.get('radius_earth', 1.0)
    
    if radius > 4:
        return None  # Pas de surface solide accessible
    
    if T > 700:
        template = "ROCKY_HOT"
    elif T < 200:
        template = "ROCKY_COLD"
    elif in_hz and radius < 1.5:
        template = "ROCKY_HABITABLE"
    else:
        template = "SUPER_EARTH"
    
    base = SURFACE_COMPOSITIONS[template]
    composition = {}
    
    for element, (lo, hi) in base.items():
        if element in ("trace_organics",):
            continue
        composition[element] = round(rng.uniform(lo, hi), 2)
    
    # Anomalie isotopique (rare)
    has_isotopic_anomaly = rng.random() < 0.03
    
    return {
        "composition": composition,
        "template": template,
        "isotopic_anomaly": {
            "present": has_isotopic_anomaly,
            "element": rng.choice(["Fe", "Si", "Mg"]) if has_isotopic_anomaly else None,
            "ratio_deviation_sigma": rng.uniform(2.1, 4.8) if has_isotopic_anomaly else 0
        },
        "trace_organics": base.get("trace_organics", False),
        "source": "PROCEDURAL"
    }
```

---

## 9. Analyseur d'échantillon — molécules et datation

### 9.1 Molécules organiques

```python
ORGANIC_MOLECULES = {
    # Molécules prébiotiques (présence dans astéroïdes confirmée)
    "nucleobases": ["adénine", "guanine", "cytosine", "thymine", "uracile"],
    "amino_acids": ["glycine", "alanine", "sérine", "acide aspartique"],
    "sugars": ["ribose", "désoxyribose"],
    # Molécules biosignatures (présence implique processus biologique)
    "biosignatures": ["chlorophylle", "stérols", "hopanes", "porphyrines"]
}

def generate_sample_analysis(planet: dict, rng: random.Random) -> dict:
    in_hz = planet.get('in_habitable_zone', False)
    T = planet.get('surface_temperature_k', 278)
    
    # Molécules prébiotiques universelles (comme Bennu/Ryugu)
    prebiotics_present = rng.random() < 0.7 if T < 400 else 0.1
    
    # Molécules biosignatures — très rares, conditions strictes
    biosig_possible = in_hz and 250 < T < 350 and prebiotics_present
    biosig_present = biosig_possible and rng.random() < 0.05
    
    detected_molecules = []
    
    if prebiotics_present:
        # Toujours les nucléobases si prébiotique (Bennu/Ryugu)
        n_nucleobases = rng.randint(3, 5)
        detected_molecules.extend(
            rng.sample(ORGANIC_MOLECULES["nucleobases"], n_nucleobases)
        )
        # Acides aminés
        if rng.random() < 0.6:
            detected_molecules.extend(
                rng.sample(ORGANIC_MOLECULES["amino_acids"], rng.randint(1, 3))
            )
    
    if biosig_present:
        detected_molecules.extend(
            rng.sample(ORGANIC_MOLECULES["biosignatures"], rng.randint(1, 2))
        )
    
    # Concentration relative (× valeurs nominales Bennu/Ryugu)
    concentration_factor = rng.uniform(0.3, 2.0)
    if biosig_present:
        concentration_factor = rng.uniform(15, 80)  # Anomalie marquée
    
    # Datation radiométrique
    age_ga = rng.uniform(0.5, 5.0)
    
    return {
        "molecules_detected": detected_molecules,
        "concentration_factor": round(concentration_factor, 1),
        "chirality": rng.choice(["L", "D", "racémique"]) if biosig_present else "racémique",
        "dating_ga": round(age_ga, 2),
        "dating_method": rng.choice(["Rb-Sr", "U-Pb", "K-Ar", "Sm-Nd"]),
        "prebiotics_present": prebiotics_present,
        "biosignature_candidate": biosig_present,
        "source": "PROCEDURAL"
    }
```

---

## 10. Architecture de stockage et traçabilité des sources

### 10.1 Principe

Chaque champ de données dans `stellar_systems` et `system_objects` peut provenir
de sources différentes : mesure réelle (HYG, NASA, JWST), extrapolation calibrée,
génération procédurale, saisie manuelle. Cette provenance doit être traçable sans
dupliquer les colonnes.

**Solution retenue : colonne `field_sources` JSONB sur chaque table.**

> Migration SQL complète : `LACUNA_PROCEDURAL_DATA_MODEL.md` §8.1 et §8.2.

### 10.2 Valeurs de source possibles

| Valeur | Signification |
|--------|---------------|
| `"HYG"` | Données HYG Database v4 — mesure réelle |
| `"NASA"` | NASA Exoplanet Archive — mesure réelle confirmée |
| `"JWST"` | Détection JWST/Hubble — mesure réelle |
| `"SIMBAD"` | Base SIMBAD/CDS — mesure réelle |
| `"GAIA"` | Catalogue Gaia DR3 — mesure réelle |
| `"EXTRAPOLATED"` | Calculé depuis des propriétés connues selon les règles de ce document |
| `"PROCEDURAL"` | Généré depuis le seed du système — plausible mais non calibré |
| `"MANUAL"` | Saisi manuellement dans le backoffice |

### 10.3 Exemple de valeurs

**stellar_systems.field_sources**
```json
{
  "spectral_type": "HYG",
  "luminosity": "HYG",
  "apparent_magnitude": "HYG",
  "color_index": "HYG",
  "distance": "HYG",
  "age": "NASA",
  "has_magnetic_field": "EXTRAPOLATED"
}
```

**system_objects.field_sources**
```json
{
  "orbital_semi_major_axis_au": "NASA",
  "orbital_period_days": "NASA",
  "orbital_eccentricity": "NASA",
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

### 10.4 Règles de mise à jour

```
Priorité des sources (de la plus à la moins fiable) :
  JWST > GAIA > NASA > SIMBAD > HYG > MANUAL > EXTRAPOLATED > PROCEDURAL

Lors d'un import :
  - Si field_sources[champ] est absent → écrire la valeur et enregistrer la source
  - Si source entrante > source existante en priorité → écrire et mettre à jour field_sources
  - Si source entrante ≤ source existante → ne pas écraser, logger le conflit
  - Exception : MANUAL ne peut jamais être écrasé automatiquement
```

### 10.5 Colonnes nécessaires dans `system_objects`

> Migration SQL complète : `LACUNA_PROCEDURAL_DATA_MODEL.md` §8.2.

Les champs `atmosphere_composition` et `surface_temperature_k` existent déjà. Les champs `density_profile`, `thermal_map`, `magnetic_field`, `surface_composition`, `sample_analysis` et `field_sources` sont ajoutés par la migration §8.2.

### 10.6 Utilisation dans le Laboratoire

Les instruments du Laboratoire lisent `field_sources` pour adapter leur affichage :

```javascript
function getSourceLabel(fieldSources, fieldName) {
  const source = fieldSources?.[fieldName]
  const labels = {
    'HYG':         'Catalogue HYG',
    'NASA':        'NASA Exoplanet Archive',
    'JWST':        'JWST / Hubble',
    'SIMBAD':      'SIMBAD / CDS',
    'GAIA':        'Gaia DR3',
    'EXTRAPOLATED':'Extrapolé — modèle physique',
    'PROCEDURAL':  'Généré — seed procédural',
    'MANUAL':      'Saisie manuelle'
  }
  return labels[source] ?? 'Source inconnue'
}
```

En **mode scientifique**, la source est toujours affichée sous chaque donnée.
En **mode Exploration**, la source n'est affichée que si elle est `EXTRAPOLATED`
ou `PROCEDURAL` — pour maintenir l'ambiguïté sans mentir sur la nature des données.

```
// Exemple d'affichage dans le Spectromètre atmosphérique (mode scientifique)
Composition atmosphérique
  H₂O  : 0,4 %
  CO₂  : 0,03 %
  CH₄  : traces
  O₂   : 21 %
  
Source : JWST ERS — WASP-39b — 2022
Confiance : 0.92
```

```
// Même instrument, données extrapolées
Composition atmosphérique (modélisée)
  N₂   : 78 %
  O₂   : 21 %
  CH₄  : 0,0002 %  ← déséquilibre chimique détecté
  
Source : Extrapolé — modèle physique
Note : aucune mesure directe disponible pour ce système
```

---

## 11. Pipeline d'exécution

```
Pour chaque planète sans données extrapolées (data_source = 'PROCEDURAL') :

1. Vérifier si atmosphere_composition est NULL → générer §4
2. Générer density_profile → §5
3. Générer thermal_map → §6
4. Si has_atmosphere ou mass_earth > 0.3 → générer magnetic_field → §7
5. Si radius_earth < 4 → générer surface_composition → §8
6. Si surface_composition présente trace_organics → générer sample_analysis → §9
7. Écrire dans system_objects
```

Lazy generation — exécuté à la première visite du système, pas en masse.

---

## 12. Cohérence entre instruments

Les données extrapolées sont interdépendantes. Un joueur utilisant plusieurs instruments sur la même planète doit trouver des données cohérentes :

| Si l'instrument X révèle... | L'instrument Y doit être cohérent |
|----------------------------|----------------------------------|
| Magnétomètre : anomalie localisée | Analyseur volumétrique : concentration de densité à la même position |
| Spectromètre atmosphérique : O₂ + CH₄ | Analyseur d'échantillon : biosignature_candidate = true |
| Scanner morphologique : anomalie thermique | Magnétomètre : champ magnétique actif probable |
| Spectromètre de contact : anomalie isotopique Fe | Scanner morphologique : gradient thermique anormal |

Cette cohérence est garantie par le seed déterministe — le même `seed_système` produit les mêmes données pour tous les instruments sur le même objet.

---

*LACUNA — Extrapolation données instrumentales v0.1 — Mars 2026 — Confidentiel*
