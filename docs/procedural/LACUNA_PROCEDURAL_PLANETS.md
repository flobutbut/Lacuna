# LACUNA — Génération procédurale des systèmes planétaires
*Version 0.1 — Mars 2026*

> Stratégie pour peupler les ~42 000 systèmes stellaires HYG avec des planètes
> procédurales calibrées sur les statistiques réelles de Kepler/TESS.
> Les ~200 systèmes NASA sont la couche de vérité — le reste est extrapolation scientifique.

---

## 1. Principe

### Deux couches de données

| Couche | Source | Nombre | Statut |
|--------|--------|--------|--------|
| **Vérité** | NASA Exoplanet Archive | ~200 systèmes | Données réelles confirmées |
| **Extrapolation** | Génération procédurale | ~42 000 systèmes | Statistiquement plausible |

Les systèmes NASA restent distinguables via `data_source = 'NASA'`. Les systèmes procéduraux ont `data_source = 'PROCEDURAL'`. **Cette distinction n'est jamais affichée au joueur** — les deux couches sont présentées identiquement dans l'interface.

### Philosophie

La génération procédurale ne fabrique pas — elle **extrapole**. Chaque paramètre s'appuie sur une distribution statistique réelle issue des missions Kepler, TESS, et des modèles de formation planétaire. Un système généré n'est pas inventé : il est ce qu'un système *pourrait* être selon les lois connues.

Ce que ça change pour LACUNA : quand un joueur visite un système sans trace narrative, il explore quand même quelque chose de plausible. L'absence de trace est une réponse, pas un vide.

---

## 2. Seed déterministe

La génération est **seed-based** — même seed, même système, pour tous les joueurs.

```
seed_global  = "LACUNA-GALAXY-V1"
seed_système = hash(seed_global + system_id)
```

Toutes les décisions aléatoires pour un système donné découlent de `seed_système`. Deux joueurs visitant le même système voient exactement les mêmes planètes.

---

## 3. Pipeline de génération

Pour chaque étoile sans planètes (`data_source` absent ou NULL) :

```
1. Lire spectral_type, luminosity, age depuis stellar_systems
2. Déterminer la probabilité d'avoir des planètes (§4)
3. Si oui → tirer le nombre de planètes (§5)
4. Pour chaque planète → générer les paramètres orbitaux (§6)
5. Calculer la zone habitable et classer les planètes (§7)
6. Écrire dans system_objects avec data_source = 'PROCEDURAL'
7. Mettre à jour stellar_systems.planets et habitable_zone
```

La génération est **lazy** — exécutée à la première visite du système, pas au démarrage. Les systèmes non visités n'ont pas de planètes en base.

---

## 4. Probabilité d'avoir des planètes selon le type spectral

Sources : Kepler DR25, TESS Year 1-3, Howard et al. 2012, Dressing & Charbonneau 2015.

| Type spectral | Classe | P(≥1 planète) | Notes |
|--------------|--------|---------------|-------|
| O, B | Chaudes massives | 0.10 | Vie courte, disque protoplanétaire instable |
| A | Blanc | 0.20 | Durée de vie insuffisante pour planètes complexes |
| F | Jaune pâle | 0.50 | Similaire au Soleil, moins étudié |
| G | Jaune (type Soleil) | 0.55 | Référence Kepler — 50-60% des étoiles G ont des planètes |
| K | Orange | 0.65 | Légèrement plus probable que G, étoiles très stables |
| M | Naine rouge | 0.70 | Très fréquentes, TRAPPIST-1 comme archétype |
| L, T, Y | Naines brunes | 0.05 | Masse limite, formation planétaire rare |

**Cas spéciaux**
- Étoiles binaires proches (détectables via `sy_snum > 1`) : probabilité réduite de 40%
- Étoiles très jeunes (age < 0.5 Ga) : planètes possibles mais non stabilisées
- Étoiles très vieilles (age > 10 Ga) : planètes possibles, potentiellement désertes depuis longtemps

---

## 5. Nombre de planètes

Distribution basée sur Kepler — nombre moyen de planètes par système avec planètes.

| Type | Nombre moyen | Distribution |
|------|-------------|-------------|
| G, K | 3.5 | Poisson(λ=3.5), min 1, max 8 |
| M | 4.5 | Poisson(λ=4.5), min 1, max 7 — TRAPPIST montre que les naines M ont souvent des systèmes compacts |
| F | 3.0 | Poisson(λ=3.0), min 1, max 6 |
| O, B, A | 2.0 | Poisson(λ=2.0), min 1, max 4 |

---

## 6. Paramètres orbitaux

### Demi-grand axe

Distribué selon une loi log-uniforme entre les limites physiques du système.

```
a_min = 0.05 UA  (limite Roche approximative)
a_max = 30 UA    (limite disque protoplanétaire typique)

a ~ LogUniform(a_min, a_max)
```

Les planètes sont ensuite triées par demi-grand axe croissant et assignées aux lettres b, c, d…

**Contrainte d'espacement** : ratio minimum entre deux planètes successives de 1.3× (critère de stabilité de Hill simplifié). Si deux planètes tirées sont trop proches, la plus externe est repoussée.

### Période orbitale

Calculée depuis la 3e loi de Kepler :

```
P (jours) = 365.25 × sqrt(a³ / M_étoile)
```

`M_étoile` estimée depuis le type spectral si non disponible.

### Excentricité

| Type de planète | Distribution | Notes |
|----------------|-------------|-------|
| Planètes internes (a < 0.5 UA) | Beta(1, 8) — pic à 0 | Circularisées par marées |
| Planètes intermédiaires | Beta(2, 5) — moyenne ~0.12 | Distribution Kepler |
| Planètes externes (a > 5 UA) | Beta(2, 3) — moyenne ~0.25 | Plus excentriques |

### Masse et rayon

Distribution basée sur la relation masse-rayon Kepler (Chen & Kipping 2017) :

```
Tirage dans 4 populations :
  Rocheuse       (R < 1.5 R⊕)  : 40% des planètes internes
  Super-Terre    (1.5–2 R⊕)    : 25%
  Neptune-like   (2–6 R⊕)      : 20%
  Géante gazeuse (> 6 R⊕)      : 15% (plus probable à a > 1 UA)
```

---

## 7. Zone habitable et classification

### Calcul de la zone habitable

Limites de Kopparapu et al. 2013, adaptées à la luminosité de l'étoile :

```
HZ_inner (al) = sqrt(L / 1.1)  UA   (limite Vénus conservative)
HZ_outer (al) = sqrt(L / 0.53) UA   (limite Mars conservative)
```

`L` = luminosité relative au Soleil depuis `stellar_systems.luminosity`.

Une planète est `in_habitable_zone = true` si `HZ_inner ≤ a ≤ HZ_outer`.

### Température d'équilibre

```
T_eq (K) = 278 × L^0.25 / sqrt(a)
```

Stockée dans `system_objects.surface_temperature_k`.

### Types planétaires pour system_objects

| Conditions | Type narratif | Notes LACUNA |
|-----------|--------------|-------------|
| R < 1.5 R⊕, HZ | Rocheuse habitable | Candidate pour traces biologiques |
| R < 1.5 R⊕, T > 700K | Rocheuse chaude | Type Vénus |
| R < 1.5 R⊕, T < 200K | Rocheuse froide | Type Mars |
| 1.5–4 R⊕ | Super-Terre | Ambiguë — peut être rocheuse ou gazeuse |
| 4–8 R⊕ | Neptune | Souvent riche en glaces |
| > 8 R⊕ | Géante gazeuse | Type Jupiter/Saturne |

---

## 8. Cas particuliers

### Étoiles sans luminosité connue

Si `luminosity` est NULL, estimer depuis le type spectral :

| Type | L/L☉ estimée |
|------|-------------|
| O5 | 500 000 |
| B0 | 10 000 |
| A0 | 80 |
| F0 | 6 |
| G0 | 1.5 |
| G2 (Soleil) | 1.0 |
| K0 | 0.5 |
| M0 | 0.08 |
| M5 | 0.01 |

### Systèmes très vieux (age > 8 Ga)

Pertinent pour LACUNA — un système à 10 Ga a eu le temps de voir émerger et disparaître une civilisation. Aucun paramètre orbital ne change, mais un flag `ancient = true` peut alimenter des décisions de génération de traces futures.

### Systèmes du voisinage scénarisé

Ces systèmes ont déjà leurs planètes en base (source NASA ou saisie manuelle) :
```
SOL, proxima-centauri, ross-128, gliese-667c, tau-ceti,
epsilon-eridani, barnard-star, hd-44594
```

**Ne pas générer de planètes procédurales pour ces systèmes.** Vérifier `data_source` avant toute génération.

---

## 9. Implémentation technique

### Script Python — `stellar_import/generate_planets.py`

```python
import hashlib, math, random

def make_rng(system_id: str) -> random.Random:
    """RNG déterministe depuis l'id du système."""
    seed = int(hashlib.sha256(
        f"LACUNA-GALAXY-V1:{system_id}".encode()
    ).hexdigest(), 16) % (2**32)
    return random.Random(seed)

def should_have_planets(spectral_type: str, rng: random.Random) -> bool:
    probs = {'O': 0.10, 'B': 0.10, 'A': 0.20, 'F': 0.50,
             'G': 0.55, 'K': 0.65, 'M': 0.70}
    cls = spectral_type[0].upper() if spectral_type else 'G'
    p = probs.get(cls, 0.40)
    return rng.random() < p

def planet_count(spectral_type: str, rng: random.Random) -> int:
    lambdas = {'G': 3.5, 'K': 3.5, 'M': 4.5, 'F': 3.0}
    cls = spectral_type[0].upper() if spectral_type else 'G'
    lam = lambdas.get(cls, 2.0)
    # Poisson approximé
    n = int(rng.gauss(lam, math.sqrt(lam)))
    return max(1, min(n, 8))
```

### Exécution

```
python generate_planets.py --dry-run     # Simulation sans écriture
python generate_planets.py --system SOL  # Test sur un système
python generate_planets.py --all         # Génération complète (lazy)
```

Ou via yarn : `yarn generate:planets`

### Migration SQL

> Toutes les migrations sont centralisées dans `LACUNA_PROCEDURAL_DATA_MODEL.md` §8. Exécuter §8.2 et §8.4 avant ce script.

---

## 10. Ce que cette stratégie ne fait pas

- **Pas d'atmosphères procédurales** — trop complexe, réservé aux systèmes NASA et LACUNA
- **Pas de lunes** — non implémenté dans le schéma actuel, à considérer plus tard
- **Pas de ceintures d'astéroïdes** — possible en extension
- **Pas de vie** — la présence de vie est une décision narrative, jamais procédurale

---

## 11. Relation avec les traces

Les planètes procédurales ne génèrent pas de traces automatiquement. La génération de traces reste une décision éditoriale (traces immuables) ou une mécanique joueur (traces déposées).

Ce que les planètes procédurales donnent au joueur :
- Un contexte visuel à l'arrivée dans un système
- Des données orbitales analysables au Laboratoire
- Une zone habitable calculée — qui peut alimenter une décision de voyage

Ce qu'elles ne donnent pas :
- Une certitude sur la présence de vie passée ou présente
- Une trace scénarisée
- Une réponse

---

*LACUNA — Génération procédurale v0.1 — Mars 2026 — Confidentiel*
