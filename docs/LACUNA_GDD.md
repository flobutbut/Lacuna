# LACUNA — Game Design Document
*Version 0.3 — Mars 2026*

---

## Table des matières

1. [Concept](#1-concept)
2. [Univers](#2-univers)
3. [Objets du jeu](#3-objets-du-jeu)
4. [Mécanique de jeu](#4-mécanique-de-jeu)
5. [Physique du voyage](#5-physique-du-voyage)
6. [Interface utilisateur](#6-interface-utilisateur)
7. [Système social](#7-système-social)
8. [La séquence secrète](#8-la-séquence-secrète)
9. [Équation de Drake](#9-équation-de-drake)
10. [Onboarding](#10-onboarding)
11. [Stack technique suggérée](#11-stack-technique-suggérée)

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 0.1 | Mars 2026 | Document initial |
| 0.2 | Mars 2026 | Physique du voyage — profil d'accélération réaliste, observation décalée dans le temps, détection en transit, mécanique de déroute |
| 0.3 | Mars 2026 | Calibration temporelle — compression non-linéaire (fonction puissance), paramètres physiques ARCA définitifs, table de référence complète, analyse gameplay zones de jeu |

---

## 1. Concept

LACUNA est une simulation d'exploration galactique **persistante, asynchrone et sans fin**. Le joueur incarne une civilisation à bord d'un vaisseau générationnel. Il navigue dans une galaxie procédurale inspirée de la Voie Lactée, collecte des **traces** laissées par des civilisations inconnues, les interprète, et choisit ses destinations.

### Piliers de design

| Pilier | Description |
|--------|-------------|
| **Solitude réelle** | Pas de communication directe entre joueurs. La seule interaction passe par les traces laissées dans le jeu. |
| **Ambiguïté irréductible** | Il n'y a pas de bonne réponse. Les mêmes données peuvent être interprétées de dix façons légitimes. |
| **Science ancrée** | Les phénomènes de référence sont réels et non résolus (Oumuamua, WOW!, Bennu, étoile de Tabby…). |
| **Temps long** | Certains voyages prennent des heures réelles. Des générations passent. Ça ne se finit pas. |
| **Émergence** | La cosmologie collective du jeu est construite par les joueurs, pas par les créateurs. |

### Ce que LACUNA n'est pas

- Ce n'est pas un jeu de stratégie — rien à optimiser
- Ce n'est pas une chasse au trésor — pas de trésor défini
- Ce n'est pas de la fiction — les références scientifiques sont réelles
- Ce n'est pas un MMO — les joueurs ne se voient pas, ne se parlent pas
- Ce n'est pas un jeu avec une fin

> *"Ce n'est pas un jeu qu'on finit. C'est un jeu qu'on habite."*

---

## 2. Univers

### La galaxie

Procédurale, structurellement cohérente avec la Voie Lactée :

- **Bras spiraux** — densité stellaire variable, plus de traces dans les bras
- **Bulbe central** — haute radiation, peu de systèmes habitables, zones dangereuses
- **Zone de corotation galactique** — région stable où démarre le joueur
- **Amas globulaires périphériques** — très anciens (~12 Ga), potentiellement riches en traces très anciennes
- **Zones vides** — inter-bras, peu explorés, terra incognita

La galaxie n'est jamais montrée dans sa totalité au joueur. Elle se révèle par les voyages.

### Échelle temporelle

Il n'y a pas de ratio arbitraire AL/seconde. La durée d'un voyage est calculée en deux étapes :

1. **Durée physique réelle** — calculée par la physique newtonienne du vaisseau (accélération, vitesse de croisière, Tsiolkovsky)
2. **Durée joueur** — obtenue par compression non-linéaire de la durée physique

#### Paramètres physiques du vaisseau ARCA (état nominal)

```
masse_totale        = 4 000 000 t
acceleration_max    = 0,12g = 1,177 m/s²
vitesse_croisiere   = 4,8% c = 14 388 km/s
exhaust_velocity    = 0,1c (moteur MTF)
```

#### Compression non-linéaire — fonction puissance

La durée joueur ne peut pas être une compression linéaire de la durée physique — les courtes distances ont une vitesse moyenne très basse (le vaisseau n'atteint jamais sa croisière), les longues distances atteignent 4,8% c. Une compression linéaire écraserait les distances intermédiaires.

On applique une **fonction puissance** calibrée sur deux contraintes fixes :
- Proxima Centauri (4,24 al) → **1 heure joueur**
- Bord opposé (100 000 al) → **90 jours joueur**

```
t_joueur = K × t_physique ^ 0.762

exposant = log(90 jours / 1h) / log(2 083 333 ans / 88 ans) ≈ 0,762
K        = calibré pour que Proxima = 1h
```

#### Table de référence

| Destination | Distance | Durée physique | Vitesse moyenne | Durée joueur |
|-------------|----------|---------------|----------------|-------------|
| Proxima Centauri | 4,24 al | 88 ans | 0,048% c | **1h** |
| Tau Ceti | 11,9 al | 248 ans | 0,048% c | **2h24** |
| Gliese 667C | 22 al | 458 ans | 0,048% c | **3h54** |
| Étoile de Tabby | 1 280 al | 26 600 ans | 2,4% c | **1,7 jours** |
| Centre galactique | 26 000 al | 541 000 ans | 4,6% c | **14 jours** |
| Bord opposé | 100 000 al | 2 083 333 ans | 4,8% c | **90 jours** |

Les destinations proches ont une vitesse moyenne très basse — le vaisseau passe tout son temps à accélérer et décélérer. C'est physiquement correct et crée une géographie de l'effort naturelle : aller loin est proportionnellement plus efficace qu'aller près.

#### Géographie de jeu

| Zone | Distance | Durée joueur | Rythme |
|------|----------|-------------|--------|
| **Voisinage** | < 25 al | 1h – 4h | Explorable dans une session |
| **Zone intermédiaire** | 25 – 500 al | 4h – 18h | Une nuit de voyage |
| **Zone profonde** | 500 – 10 000 al | 18h – 10 jours | Expédition |
| **Destinations mythiques** | > 10 000 al | 10 – 90 jours | Odyssée |

#### Analyse gameplay

**Ce qui fonctionne**

Le voisinage à 1h-4h est idéal pour l'onboarding — 2 à 3 systèmes explorables en une soirée. La zone intermédiaire à "une nuit de voyage" est le sweet spot du jeu asynchrone : on programme un cap le soir, on revient le lendemain. Le centre galactique à 14 jours et le bord opposé à 90 jours créent une vraie stratification de l'ambition entre joueurs.

**Point de vigilance — le voisinage**

À 1h-4h par voyage, la tentation d'enchaîner les systèmes sans s'arrêter interpréter est forte. La richesse du jeu est dans l'interprétation des traces — pas dans le déplacement. La solution n'est pas d'allonger les voyages courts mais de concevoir les traces du voisinage pour qu'elles **nécessitent** un temps d'analyse : scan de 2h, croisement avec une autre trace, écriture d'une interprétation comme prérequis au prochain cap.

**Point de vigilance — détection en transit**

Sur les voyages d'1h, la fenêtre de détection et de décision est courte. En pratique les déroutes ne seront pertinentes qu'à partir de la zone intermédiaire (> 4h). C'est acceptable tant que c'est cohérent avec ce que le jeu communique.

**Enjeu critique — densité des traces dans le voisinage**

Le vrai risque n'est pas la durée des voyages — c'est le vide entre les traces. Un joueur qui arrive dans plusieurs systèmes consécutifs sans rien trouver de significatif abandonne. La densité et la qualité des traces dans les 50 premiers systèmes accessibles est critique pour l'accroche initiale. À traiter en priorité avant la production.

### L'observation est toujours du passé

Quand le joueur observe un système depuis sa position actuelle, il voit la lumière qui en est partie il y a N années — N étant la distance en années-lumière. Ce qu'il observe n'est pas l'état actuel du système. C'est son état **au moment où cette lumière a quitté ce système**.

```
Système à 500 AL → image vieille de 500 ans
Système à 20 000 AL → image vieille de 20 000 ans
```

L'interface le signale systématiquement dans l'observatoire :

```
HD 44594 — observé tel qu'il était il y a 11 ans
Type spectral : G2V  |  Âge estimé : 4,2 Ga
Statut actuel : INCONNU
```

### Risque de disparition selon le type stellaire

Toutes les étoiles ne vivent pas au même rythme. Plus une étoile est massive, plus elle brûle vite et meurt jeune.

| Type spectral | Couleur | Durée de vie | Risque sur 10 000 AL |
|--------------|---------|-------------|----------------------|
| O, B | Bleue | 1 – 100 Ma | **ÉLEVÉ** — peut avoir disparu |
| A, F | Blanche/jaune pâle | 1 – 5 Ga | Modéré sur très longues distances |
| G (type Soleil) | Jaune | 8 – 12 Ga | Faible |
| K, M | Orange/rouge | 15 – 70 Ga | Quasi nul |

À l'arrivée dans un système, trois états sont possibles :

| État | Description |
|------|-------------|
| `CONFORME` | Le système correspond à ce qui avait été observé |
| `ÉVOLUÉ` | L'étoile a changé de stade (géante, subgéante…), les planètes ont migré |
| `DISPARU` | Supernova, naine blanche, système déstabilisé — la trace était réelle, elle n'est plus accessible |

Un système `DISPARU` n'est pas un échec — c'est une donnée. La trace qu'il contenait existait. Ce que ça signifie pour la civilisation qui l'avait laissée appartient au joueur.

### Dilatation gravitationnelle

Lorsque le vaisseau s'installe dans un système stellaire, le temps propre du vaisseau s'écoule plus lentement que dans le système solaire de référence. L'effet est calculé à partir de la masse de l'astre hôte — relativité générale.

#### Référentiel

Le Soleil est le référentiel temporel du jeu. Tout joueur part de Sol — c'est l'étalon. La dilatation d'un système est toujours exprimée **par rapport au Soleil**, pas par rapport au vide interstellaire.

#### Équation

Le rayon de Schwarzschild de l'astre hôte :

```
r_s(M) = 2GM / c²

G = 6,674 × 10⁻¹¹ m³ kg⁻¹ s⁻²
c = 3 × 10⁸ m/s
M = masse de l'astre en kg
```

Le facteur de dilatation absolu, calculé à r_orbite = r_surface + 10 km :

```
γ_abs(M) = √(1 - r_s(M) / r_orbite)
```

Le facteur de dilatation relatif au Soleil :

```
γ_rel(M) = γ_abs(M) / γ_abs(M_soleil)
```

C'est γ_rel qui gouverne l'écoulement du temps en jeu. Quand γ_rel < 1, le temps vaisseau s'écoule plus lentement que dans le système solaire — la galaxie avance plus vite autour du joueur.

#### Convention d'orbite

Le vaisseau est considéré en orbite à **r_surface + 10 km** de l'astre hôte. Pour les objets compacts sans surface physique (trous noirs), r_surface = r_s. C'est une convention de jeu — le vaisseau ARCA maintient cette orbite par ses propres moyens.

#### Table de référence

| Objet | γ_rel | Effet différentiel (1 an vaisseau) |
|-------|-------|-----------------------------------|
| Soleil (G2V, 1 M☉) | 1,000000 | référence — aucun écart |
| Étoiles de séquence principale | ~1,000000 | négligeable |
| Naine blanche (0,6 M☉) | 0,999876 | +1,1 h / an |
| Étoile à neutrons (1,4 M☉) | 0,890775 | +1,5 mois / an |
| Trou noir stellaire (10 M☉) | 0,503162 | +11,8 mois / an |
| Trou noir intermédiaire (1 000 M☉) | 0,058125 | +17 ans galactiques / an vaisseau |
| Trou noir supermassif (10⁶ M☉) | 0,001841 | +543 ans galactiques / an vaisseau |
| Sgr A* (4 × 10⁶ M☉) | 0,000921 | +1 086 ans galactiques / an vaisseau |

#### Implémentation

```python
import math

G     = 6.674e-11  # m³ kg⁻¹ s⁻²
c     = 3e8        # m/s
MARGE = 1e4        # 10 km en mètres
M_SOL = 1.989e30   # kg
R_SOL = 6.96e8     # m

def rs(M):
    return (2 * G * M) / (c ** 2)

def gamma_abs(M, r_surface):
    r_orb = r_surface + MARGE
    ratio = rs(M) / r_orb
    if ratio >= 1:
        return 0.0  # sous l'horizon — orbite impossible
    return math.sqrt(1 - ratio)

# Référence Sol — calculée une seule fois
GAMMA_SOL = gamma_abs(M_SOL, R_SOL)

def gamma_rel(M, r_surface):
    return gamma_abs(M, r_surface) / GAMMA_SOL

def delta_annuel(M, r_surface):
    """Années galactiques écoulées par an vaisseau dans ce système."""
    g = gamma_rel(M, r_surface)
    if g == 0: return float('inf')
    return 1 / g
```

#### Seuil d'affichage

La dilatation est calculée pour tous les systèmes à la génération. Elle est affichée dans l'interface uniquement si γ_rel < 0,999 — en dessous de ce seuil l'effet est perceptible à l'échelle d'une session de jeu.

#### Ce qui est physiquement réel

- **L'équation de Schwarzschild** est la formulation exacte de la relativité générale pour un corps massif non-rotatif. γ = √(1 - r_s/r) est la physique, sans approximation.
- **La direction de l'effet** est correcte : plus on est proche d'un objet massif, plus le temps propre ralentit par rapport à un observateur distant. C'est ce que vivent les satellites GPS (correction de 45 µs/jour) et ce que représente la scène de la planète Miller dans *Interstellar*.
- **La hiérarchie des objets** est juste : les étoiles ordinaires produisent un effet négligeable à distance orbitale raisonnable, les objets compacts (naines blanches, étoiles à neutrons, trous noirs) produisent des effets croissants.
- **Le rayon de Schwarzschild** de chaque objet est calculé avec les vraies constantes physiques.
- **L'étoile à neutrons plus dilatante que le trou noir stellaire** à même catégorie est physiquement correct : son rayon réel (~10 km) est très proche de son r_s (~4 km), ce qui place l'orbite minimale à seulement 2,4 × r_s — plus proche proportionnellement que l'ISCO d'un trou noir.

#### Ce qui est une convention de jeu

- **r_orbite = r_surface + 10 km pour les trous noirs.** En réalité, aucune orbite stable n'existe en dessous de 3 × r_s (ISCO — Innermost Stable Circular Orbit). Le vaisseau ARCA orbite à r_s + 10 km, ce qui est physiquement impossible. Cette convention est assumée pour obtenir une dilatation proportionnelle à la masse et jouablement dramatique. Sans elle, tous les trous noirs produisent le même γ ≈ 0,816 à leur ISCO respective — indifférenciable en jeu.

- **Le référentiel Soleil plutôt que le vide interstellaire.** Physiquement, le référentiel absolu est le vide loin de toute masse. Le Soleil y est choisi comme étalon zéro pour des raisons de cohérence narrative : le joueur part de Sol, Sol est son point de comparaison naturel. L'écart entre γ_vide et γ_soleil est de toute façon infinitésimal (~10⁻⁸) et sans conséquence jouable.

- **Le vaisseau s'installe "dans un système", pas à une distance précise de l'astre.** Physiquement, la dilatation dépend strictement de la distance à l'objet. En jeu, le joueur ne choisit pas son altitude orbitale — il choisit un système. La dilatation est donc un attribut fixe du système, calculé une fois à la génération, pas une variable continue. C'est une simplification nécessaire à la lisibilité.

- **La dilatation par la vitesse est ignorée.** À 4,8% c, le facteur de Lorentz est γ_v = 1/√(1 - v²/c²) ≈ 1,001 — soit environ 9 heures de décalage par an de transit. Cet effet existe physiquement mais est délibérément exclu du jeu : il rendrait chaque voyage légèrement dilatant, noierait les effets gravitationnels dans le bruit, et compliquerait l'implémentation sans gain narratif. Seule la dilatation gravitationnelle est retenue.

#### Compression temporelle et ratio de jeu

Le jeu applique un ratio de compression uniforme à tout le temps simulé — transits et orbites confondus. Ce ratio est dérivé du contrat fondamental du jeu : **1 mois joueur = traversée complète de la galaxie**.

La Voie Lactée faisant ~100 000 al, un transit à 4,8% c prend ~2 millions d'années simulées. Ce qui donne :

```
1 an réel   = ~24 000 000 ans simulés
1 mois réel = ~2 000 000 ans simulés
1 jour réel = ~65 700 ans simulés
1 heure réelle = ~2 740 ans simulés
1 minute réelle = ~45 ans simulés
```

Ce ratio s'applique identiquement à l'orbite dilatante. L'effet galactique d'un stationnement s'obtient en combinant le ratio de compression et γ_rel :

```
années galactiques = temps_joueur_réel × ratio_compression / γ_rel
```

#### Échelle de référence — orbite près de Sgr A*

| Durée joueur | Temps vaisseau | Temps galactique écoulé |
|-------------|---------------|------------------------|
| 30 minutes | ~80 ans | ~87 000 ans |
| 1 jour | ~65 700 ans | ~71 millions d'années |
| 2 semaines | ~919 800 ans | ~1 milliard d'années |
| 1 mois | ~2 000 000 ans | ~2,2 milliards d'années |
| 2 mois | ~4 000 000 ans | ~4,3 milliards d'années |
| 3 mois | ~6 000 000 ans | ~6,5 milliards d'années |

#### Horizons atteignables et inaccessibles

| Événement | Distance temporelle | Coût près de Sgr A* | Accessible |
|-----------|--------------------|--------------------|-----------|
| Silence radio de la Terre | ~100 ans | quelques secondes | oui — déjà passé au départ |
| Fusion Andromède / Voie Lactée | ~4,6 Ga | ~2,1 mois joueur | oui — au prix fort |
| Mort du Soleil | ~5 Ga | ~2,3 mois joueur | oui — au prix fort |
| Dernière étoile de la galaxie | ~100 000 Ga | ~3 800 ans réels | non |
| Désintégration des protons | ~10³⁴ ans | ~10¹⁴ milliards d'années réelles | jamais |

La mort du Soleil et la fusion d'Andromède sont les **horizons ultimes atteignables** — au prix de deux mois réels de jeu, sans compression supplémentaire. Au-delà, l'inaccessibilité n'est pas une règle de jeu : c'est l'arithmétique elle-même qui l'interdit.

#### Conséquences d'un stationnement long — note de conception

Un stationnement prolongé près d'un objet compact produit des conséquences qui dépassent la simple irréversibilité temporelle. Elles sont documentées ici pour orienter la conception de l'arc générationnel et du système population.

**Rupture généalogique.** À 25 ans par génération, 2 mois joueur près de Sgr A* représentent ~184 000 générations à bord. C'est 15 fois l'histoire humaine depuis l'écriture. La population qui existe à la sortie de l'orbite n'a aucun lien biologique, culturel ou mémoriel avec celle qui existait à l'entrée. Le fil générationnel — qui est le cœur de l'arc générationnel du jeu — est rompu de façon absolue.

**La population devient une trace.** À la sortie d'un stationnement de cette amplitude, le joueur ne retrouve pas "sa" population — il rencontre une civilisation qui a vécu 4 millions d'années dans un vaisseau fermé. Elle a développé sa propre culture, sa propre cosmologie, peut-être sa propre mythologie du capitaine. Elle est à traiter comme une découverte, pas comme une continuité.

**Asymétrie radicale.** Pendant un transit long, des générations passent à bord pendant que le joueur attend. Pendant un stationnement dilatant long, des générations passent à bord pendant que le joueur est *immobile*. Dans les deux cas la population change — mais dans le second cas, c'est le joueur qui a délibérément choisi l'immobilité. Il est responsable de la rupture.

**Inaccessibilité réciproque.** Ce qui s'est passé à bord pendant un stationnement de 4 millions d'années est la plus grande lacuna interne du jeu — inaccessible même au joueur lui-même. Le journal de bord ne peut en restituer qu'une infime fraction. Le reste est silence.

### Systèmes stellaires

Chaque système a des propriétés générées :

```json
{
  "id": "HD-44594",
  "name": "HD 44594",
  "spectralType": "G2V",
  "distance": 11.4,
  "age": 4.2,
  "planets": 3,
  "habitableZone": true,
  "anomalyLevel": 0,
  "traces": [],
  "visitCount": 0,
  "firstVisited": null
}
```

`anomalyLevel` va de 0 (rien de notable) à 3 (anomalie forte, pulse visible dans l'observatoire).

---

## 3. Objets du jeu

### 3.1 Le Vaisseau

Objet central, persistant, appartenant au joueur.

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
  "population": { ... },
  "logbook": [ ... ],
  "artifacts": [ ... ],
  "map": { ... }
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

### 3.2 La Population

La population n'est pas un chiffre à optimiser — c'est une **texture narrative** qui évolue lentement et colore les interprétations.

```json
{
  "total": 10247,
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

Valeur entre 0 et 1. Elle influence :
- La **capacité à interpréter** des traces complexes (volonté basse = interprétations plus courtes, moins nuancées)
- La **tolérance aux voyages longs** sans découverte
- La **résistance aux événements négatifs**

Elle baisse lentement lors des voyages sans découverte. Elle monte lors des trouvailles significatives. Elle peut s'effondrer suite à un événement critique.

#### Événements populationnels

Rares, imprévisibles, non annoncés à l'avance. Exemples :

| Événement | Déclencheur probable | Effet |
|-----------|---------------------|-------|
| Épidémie | Voyage très long + cohésion basse | Perte de population, baisse volonté |
| Schisme | Cohésion < 0.3 | Deux factions, interprétations divergentes |
| Renaissance culturelle | Découverte majeure + culture active | Boost volonté, nouvelle génération motivée |
| Panne critique | Intégrité coque < 0.2 | Système indisponible temporairement |
| Naissance d'un prodige | Aléatoire rare | Bonus temporaire en analyse scientifique |

---

### 3.3 Les Traces

Objet fondamental du jeu. Tout ce que le joueur trouve, collecte, interprète et dépose.

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
  "interpretations": [ ... ],
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

#### Niveaux de difficulté

| Niveau | Description |
|--------|-------------|
| `1` — Évidente | Visible dès l'arrivée dans le système, interprétable sans contexte |
| `2` — Discrète | Nécessite un scan approfondi ou une connaissance préalable |
| `3` — Cachée | Nécessite d'avoir collecté une trace spécifique pour la détecter |
| `4` — Secrète | Partie de la séquence secrète, conditions d'accès complexes |

#### Origines

| Origine | Description |
|---------|-------------|
| `IMMUABLE` | Créée par les développeurs, ancrée dans la vraie science, ne change pas |
| `GENERÉE` | Créée procéduralement à la génération du système |
| `JOUEUR` | Déposée par un autre joueur lors de son passage |

---

### 3.4 Les Interprétations

Chaque trace peut accumuler des interprétations de joueurs.

```json
{
  "id": "interp-00847",
  "traceId": "trace-wow-1977-a",
  "playerId": null,
  "generation": 1,
  "shipAge": "47 jours",
  "galacticDate": "2187-02-17",
  "text": "La fréquence 1420 MHz n'est pas une coïncidence. C'est la raie de l'hydrogène — l'élément le plus abondant de l'univers. Quelqu'un a choisi cette fréquence parce qu'il savait qu'on l'écouterait. La durée de 72 secondes correspond à 6×12, soit le carré de 6, qui est lui-même 2×3. Structure mathématique intentionnelle.",
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

### 3.5 Le Carnet de Bord (Logbook)

Objet persistant, unique par vaisseau. Mélange de journal écrit par le joueur et de mémoire automatique des voyages.

```json
{
  "entries": [
    {
      "id": "log-001",
      "type": "MANUEL",
      "generation": 1,
      "date": "2187-01-01",
      "title": "Départ",
      "text": "10 247 âmes embarquées. On a regardé la Terre disparaître pendant 4 heures.",
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

### 3.6 La Carte

Construite progressivement par le joueur. Elle n'existe pas au départ.

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

La carte est **subjective** — elle reflète uniquement les systèmes visités par ce vaisseau. Deux joueurs ayant fait des voyages différents ont des cartes radicalement différentes.

---

### 3.7 L'Équation de Drake (état global)

Objet global, partagé par tous les joueurs. Se recalcule en fonction des découvertes collectives.

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
  "lastDelta": +0.3,
  "history": [
    { "date": "2026-03-01", "N": 12.1, "changedTerm": "fl", "reason": "Nucléobase découverte — système Gliese 667C" }
  ]
}
```

`fl`, `fi` et `L` sont les seuls termes susceptibles de changer en cours de jeu, basés sur les découvertes collectives des joueurs.

---

## 4. Mécanique de jeu

### 4.1 Flux principal

```
OBSERVER LE CIEL
      ↓
SÉLECTIONNER UN SYSTÈME
      ↓
ANALYSER (optionnel — laboratoire, scan)
      ↓
DÉCIDER DE VOYAGER
      ↓
VOYAGE (temps réel, vaisseau en transit)
      ↓
ARRIVÉE — SCAN AUTOMATIQUE
      ↓
TRACES DÉTECTÉES (selon niveau difficulté + contexte)
      ↓
INTERPRÉTER — ÉCRIRE DANS LE JOURNAL
      ↓
DÉCIDER : repartir / laisser une trace / rester analyser
```

### 4.2 Le Voyage

#### Durée et physique

La durée d'un voyage est le résultat direct de la physique newtonienne appliquée aux capacités du vaisseau — pas d'un ratio arbitraire. Un voyage peut durer quelques minutes ou plusieurs jours réels. C'est intentionnel. LACUNA vit sans le joueur. Il revient voir où il en est. Il reçoit des notifications en chemin.

**Profil de voyage — 4 phases :**

```
Phase 1 — ACCÉLÉRATION
  Moteur allumé à poussée constante.
  Durée : jusqu'à vitesse de croisière atteinte, ou jusqu'au point médian
  si la destination est trop proche pour une phase d'inertie.

Phase 2 — INERTIE
  Moteur éteint. Vitesse constante.
  Phase la plus longue sur les grands voyages.
  L'observatoire reste actif. Détection latérale possible. Déroute possible.

Phase 3 — RETOURNEMENT
  Manœuvre sur axe. Consomme un peu de carburant.
  La destination apparaît devant pour la première fois.

Phase 4 — DÉCÉLÉRATION
  Moteur rallumé, poussée symétrique à l'accélération.
  Même durée et consommation carburant que la phase 1.
```

**Calcul de durée :**

```
acceleration_max  = f(systems.propulsion, masse_totale)
vitesse_max_safe  = f(systems.plasmaShield, systems.hull)
vitesse_croisiere = min(vitesse_atteignable, vitesse_max_safe)

temps_accel       = vitesse_croisiere / acceleration_max
distance_accel    = ½ × acceleration_max × temps_accel²

si (distance_accel × 2) > distance_totale :
    # Pas d'inertie — accélération jusqu'au milieu, retournement, décélération
    temps_total = 2 × sqrt(distance_totale / acceleration_max)
sinon :
    distance_inertie = distance_totale − (2 × distance_accel)
    temps_inertie    = distance_inertie / vitesse_croisiere
    temps_total      = (2 × temps_accel) + temps_inertie

carburant_consommé = f(masse, delta_v)   # équation de Tsiolkovsky
```

Un vaisseau dégradé ou à court de carburant ne peut pas atteindre sa vitesse de croisière nominale — le voyage prend plus de temps et coûte proportionnellement plus. La dégradation a des conséquences concrètes sur chaque décision.

**Ordres de grandeur** (vaisseau en état nominal — durée joueur après compression) :

| Destination | Distance | Durée joueur |
|-------------|----------|-------------|
| Proxima Centauri | 4,24 al | **1h** |
| Tau Ceti | 11,9 al | **2h24** |
| Gliese 667C | 22 al | **3h54** |
| Étoile de Tabby | 1 280 al | **1,7 jours** |
| Centre galactique | 26 000 al | **14 jours** |
| Bord opposé | 100 000 al | **90 jours** |

Voir section 2 — Échelle temporelle pour le détail du calcul et de la compression non-linéaire.

**Contrainte de vitesse maximale :**

Dépasser un certain pourcentage de *c* sans bouclier plasma en état nominal endommage la coque — les impacts de poussière interstellaire deviennent destructeurs à haute vitesse. La vitesse maximale safe est une fonction de `systems.plasmaShield` et `systems.hull`, pas une constante.

#### Accès aux modules pendant le voyage

| Module | Phase accel. | Phase inertie | Phase décel. |
|--------|-------------|---------------|-------------|
| Journal de bord | ✓ | ✓ | ✓ |
| Collection d'artefacts | ✓ | ✓ | ✓ |
| Mémoire générationnelle | ✓ | ✓ | ✓ |
| Équation de Drake | ✓ | ✓ | ✓ |
| Observatoire (détection latérale) | — | ✓ | — |
| Navigation / déroute | — | ✓ | — |
| Laboratoire | — | ✓ | — |

#### Détection en transit

Pendant la phase d'inertie, l'observatoire scanne en continu les systèmes latéraux. À mesure que le vaisseau s'approche, sa résolution augmente — il détecte des anomalies invisibles depuis le point de départ.

Ce qui peut apparaître :
- **Nouvelle anomalie latérale** — système hors trajectoire entre dans la fenêtre de résolution
- **Alerte destination** — recalcul du statut estimé de l'étoile cible (type stellaire, probabilité de transition)
- **Trace de joueur** — un vaisseau a récemment visité un système proche de la trajectoire
- **Événement populationnel** — la durée du voyage déclenche une évolution interne

#### Déroute

À tout moment pendant la phase d'inertie, le joueur peut fixer une nouvelle destination.

Conséquences physiques :
1. Décélération jusqu'à vitesse nulle ou acceptable
2. Réorientation sur le nouvel axe
3. Nouvelle accélération

Le coût carburant d'une déroute à haute vitesse est significatif. La destination initiale reste dans le journal — abandonnée, avec la raison et le coût.

```json
{
  "type": "AUTO",
  "title": "Déroute — HD 44594 abandonnée",
  "reason": "Anomalie niveau 2 détectée — Wolf 359 — J+14 du départ",
  "fuelCost": 0.08,
  "timeLost": "3h 20min"
}
```

### 4.3 Les Générations

Une génération passe quand le vaisseau a accumulé suffisamment de distance parcourue et de temps simulé. Ce n'est pas un timer fixe — c'est contextuel.

Chaque passage de génération :
- Ajoute une entrée automatique `GENERATIONNEL` dans le journal
- Conserve **tout** le carnet de bord précédent comme héritage
- Peut modifier légèrement les propriétés de la population (culture, volonté, interprétation)
- Incrémente le compteur de génération visible dans l'interface

La génération en cours **colore** les nouvelles interprétations — une civilisation qui a connu un schisme interprète les artefacts différemment d'une civilisation soudée.

### 4.4 Laisser une trace

À tout moment dans un système visité, le joueur peut déposer une trace de type `PLAYER_TRACE` :

```json
{
  "type": "PLAYER_TRACE",
  "subtype": "ANNOTATION" | "WARNING" | "DIRECTION" | "DISCOVERY",
  "text": "...",
  "generation": 3,
  "shipAge": "12 ans",
  "direction": "HD-40307 — système suivant selon notre lecture",
  "linkedTrace": "trace-wow-1977-a"
}
```

La trace est **permanente**. Elle ne peut pas être supprimée. Elle fait partie du réseau.

---

## 5. Physique du voyage

### Principe général

La durée d'un voyage n'est pas un ratio arbitraire. Elle découle entièrement de la **physique newtonienne appliquée aux contraintes réelles du vaisseau** : poussée disponible, masse totale, carburant embarqué, vitesse maximale safe. Deux voyages vers la même destination peuvent avoir des durées différentes selon l'état du vaisseau.

Les voyages longs peuvent durer plusieurs jours réels. C'est un choix de design délibéré — LACUNA est un jeu qui vit sans le joueur. On programme un cap, on revient voir où on en est, on reçoit des notifications. C'est le rythme d'un vrai voyage interstellaire.

---

### Les quatre phases

#### Phase 1 — Accélération

Le moteur MTF est allumé à poussée constante. Le vaisseau accélère depuis l'arrêt jusqu'à sa vitesse de croisière cible. Cette phase consomme du carburant He³.

```
acceleration = propulsion_state × thrust_nominal / total_mass
```

La durée et la distance d'accélération dépendent directement de l'état du système de propulsion — un moteur dégradé accélère moins fort, donc plus lentement.

#### Phase 2 — Inertie

Moteur éteint. Vitesse constante. Le vaisseau glisse dans le vide. C'est la phase la plus longue sur les grands voyages, et la plus riche en jeu — l'observatoire tourne en continu, les anomalies et traces apparaissent progressivement dans le champ de détection, des notifications arrivent.

**Aucun carburant consommé pendant la phase d'inertie.**

#### Phase 3 — Retournement

Le vaisseau se retourne sur son axe pour présenter ses moteurs dans le sens du voyage. Manœuvre délicate, coût carburant mineur. Moment narratif — la destination apparaît pour la première fois à travers les hublots avant. Une entrée automatique est créée dans le journal.

#### Phase 4 — Décélération

Moteur rallumé, même poussée qu'en phase 1, appliquée en sens inverse. Consomme autant de carburant que la phase d'accélération. Le vaisseau arrive à vitesse quasi nulle à destination.

---

### Calcul de la durée de voyage

```
// Paramètres vaisseau
acceleration     = propulsion × thrust_nominal / total_mass   // en al/s²
speed_max_safe   = f(plasma_shield, hull_integrity)            // en fraction de c
speed_cruise     = min(speed_atteignable, speed_max_safe)

// Distance d'accélération (et de décélération — symétrique)
t_accel          = speed_cruise / acceleration
d_accel          = 0.5 × acceleration × t_accel²

// Cas 1 : destination proche — pas de phase d'inertie
si (d_accel × 2) >= distance_totale :
    t_total = 2 × sqrt(distance_totale / acceleration)
    speed_cruise = acceleration × (t_total / 2)

// Cas 2 : destination lointaine — trois phases
sinon :
    d_inertie = distance_totale - (2 × d_accel)
    t_inertie = d_inertie / speed_cruise
    t_total   = (2 × t_accel) + t_inertie

// Carburant consommé — équation de Tsiolkovsky
delta_v          = 2 × speed_cruise    // accélération + décélération
fuel_consumed    = ship_mass × (1 - e^(-delta_v / (exhaust_velocity)))
```

---

### Vitesse maximale safe

Le bouclier plasma protège le vaisseau des impacts de poussière interstellaire. À haute vitesse, l'énergie cinétique de ces impacts devient destructrice. La vitesse maximale safe est donc une fonction directe de l'état du bouclier et de la coque.

| État bouclier plasma | Vitesse max | Remarque |
|---------------------|------------|---------|
| 1.0 (parfait) | 5% c | Vitesse nominale de croisière |
| 0.7 – 0.9 | 3% c | Prudence recommandée |
| 0.4 – 0.7 | 1.5% c | Voyages longs à risque |
| < 0.4 | 0.5% c | Danger — voyages courts uniquement |

Dépasser la vitesse safe est possible — c'est une décision du joueur, avec un risque croissant de dégradation de la coque à chaque heure de voyage.

---

### Détection en transit

Pendant la phase d'inertie, l'observatoire scanne en continu dans toutes les directions. Les systèmes entrent progressivement dans la résolution instrumentale au fur et à mesure que le vaisseau s'en approche latéralement.

Chaque détection génère une notification :

```
TRANSIT — JOUR 3 — 14h22
Système non référencé détecté à 8,3 AL — tribord
Type spectral estimé : K2V
Anomalie de niveau 2 suspectée
Déviation de trajectoire possible — coût carburant : 12%
```

La détection en transit est le principal mécanisme de **découverte non planifiée** — le joueur ne sait pas ce qu'il va croiser avant de partir.

---

### La déviation de trajectoire

À tout moment pendant la phase d'inertie, le joueur peut choisir de dérouter vers un système détecté en chemin. La déviation est irréversible — le cap original est abandonné.

**Conséquences d'une déviation :**

| Facteur | Effet |
|---------|-------|
| Carburant | Consommé pour le changement de vecteur — non récupérable |
| Temps | Allongement du voyage selon l'angle de déviation |
| Journal | Entrée automatique "Déviation — cap abandonné : [système original]" |
| Destination originale | Ne sera peut-être jamais atteinte |

L'abandon d'une destination est lui-même une donnée narrative. Pourquoi a-t-on dévié ? Qu'est-ce qu'on a laissé derrière ? Peut-être que la destination originale avait une trace que personne n'atteindra jamais.

---

### États du vaisseau en transit

| État | Description | Accès interface |
|------|-------------|----------------|
| `ACCELERATING` | Phase 1 — moteur allumé | Journal, Artefacts, Drake |
| `COASTING` | Phase 2 — inertie | Journal, Artefacts, Drake, Observatoire (passif), Déviation possible |
| `TURNING` | Phase 3 — retournement | Journal uniquement |
| `DECELERATING` | Phase 4 — moteur allumé | Journal, Artefacts, Drake |

L'observatoire interactif (clic sur étoile, choix de cap) n'est disponible qu'à l'arrêt (`IDLE`) ou pendant la phase d'inertie pour initier une déviation.

---

## 6. Interface utilisateur

### 5.1 Architecture générale

```
┌─────────────────────────────────────────────────────┐
│  HEADER — Logo / Nom vaisseau / Coords / Génération / N=  │
├─────────────────────────────────────────────────────┤
│  │              │                        │           │
│  │  INDICATEURS │    CIEL INTERACTIF     │INDICATEURS│
│  │  GAUCHE      │    (interface prin.)   │  DROITE   │
│  │              │                        │           │
│  │  - Systèmes  │    [étoiles, hover,    │- Population│
│  │    vaisseau  │     clic, anomalies]   │- Dernière │
│  │  - Observ.   │                        │  trace    │
│  │              │                        │           │
├─────────────────────────────────────────────────────┤
│  INSTRUMENTS — 8 boutons d'accès aux modules        │
└─────────────────────────────────────────────────────┘
```

### 5.2 Le Ciel (interface principale)

Le ciel est **toujours présent** derrière tous les panels. Il ne disparaît jamais complètement.

#### Comportement des étoiles

| État | Visuel |
|------|--------|
| Non explorée | Point blanc, taille proportionnelle à la magnitude |
| Visitée | Anneau cyan fin autour de l'étoile |
| Anomalie niveau 1 | Légère teinte ambre |
| Anomalie niveau 2 | Pulse ambré lent |
| Anomalie niveau 3 | Pulse ambré fort + halo |
| En transit vers | Ligne de trajectoire fine |

#### Interactions

| Action | Effet |
|--------|-------|
| Hover | Réticule + tooltip (nom, distance, type spectral, durée voyage) |
| Clic simple | Sélection + widget de voyage |
| Double-clic | Ouvre le panel Observatoire centré sur ce système |

### 5.3 Header permanent

Toujours visible. Contient :

| Élément | Donnée | Update |
|---------|--------|--------|
| Logo LACUNA | — | Statique |
| Nom du vaisseau | `ship.name` + voyage | Statique |
| Coordonnées | Position galactique courante | Temps réel |
| Génération | `population.generation` | Sur événement |
| **N =** | `drake.N` | Toutes les ~10 min (fluctuation globale) |

### 5.4 Indicateurs latéraux

Toujours visibles, non interactifs (lecture seule).

**Gauche — Systèmes vaisseau**

| Indicateur | Source | Seuils |
|------------|--------|--------|
| Propulsion | `systems.propulsion` | >0.7 vert / 0.4-0.7 ambré / <0.4 rouge |
| Carburant He³ | `fuel.he3` | >0.5 vert / 0.2-0.5 ambré / <0.2 rouge |
| Intégrité coque | `systems.hull` | >0.8 vert / 0.5-0.8 ambré / <0.5 rouge |
| Bouclier plasma | `systems.plasmaShield` | Actif/Inactif |

**Droite — Snapshot civilisation**

| Indicateur | Source |
|------------|--------|
| Effectif | `population.total` |
| Natalité | `population.birthRate` |
| Volonté | `population.will` (barre + label) |
| Dernière trace | Désignation + statut |

### 5.5 Modules (panels overlay)

Tous s'ouvrent en overlay sur le ciel. Le ciel reste visible en arrière-plan.

---

#### MODULE — Observatoire

Accès direct depuis la barre d'instruments ou double-clic sur une étoile.

**Contenu :**
- Vue détaillée du système sélectionné
- Liste des corps célestes
- Niveau d'anomalie + description brute
- Traces détectées dans ce système (liste)
- Bouton "Lancer scan approfondi" (consomme du temps simulé)
- Bouton "Fixer cap" → déclenche le voyage

---

#### MODULE — Carte

Visualisation des systèmes visités et des routes parcourues. Construite progressivement.

**Contenu :**
- Graphe 2D des systèmes visités (nœuds) et routes (arêtes)
- Couleur des nœuds selon l'ancienneté de la visite
- Indicateur de traces trouvées par système
- Statistiques : systèmes visités, distance totale, traces collectées

**Pas de** carte globale de la galaxie. Uniquement ce que le vaisseau a vu.

---

#### MODULE — Collection d'artefacts

Grille des traces collectées.

**Contenu :**
- Grille N×N de slots (certains vides)
- Chaque artefact : icône générée selon le type, désignation, badge si non interprété
- Clic sur un artefact → détail complet + liste des interprétations d'autres joueurs + champ pour écrire la sienne
- Filtre par type / niveau de difficulté / statut d'interprétation

---

#### MODULE — Laboratoire

Outil d'analyse scientifique. Permet d'examiner les données brutes d'une trace ou d'un système.

**Contenu :**
- Sélection d'une trace ou d'un système à analyser
- Visualisation des données brutes (waveform, spectrogramme, carte orbitale, séquence…)
- Outils de mesure : zoom, comparaison avec base de données, calcul de distance/fréquence
- Rapport d'analyse généré après scan approfondi
- Lien vers les interprétations existantes

---

#### MODULE — Journal de bord

Interface d'écriture et de lecture du carnet.

**Contenu :**
- Fil chronologique des entrées (manuelles + automatiques)
- Éditeur texte simple pour nouvelle entrée manuelle
- Filtre : tout / manuel / auto / générationnel
- Mémoire générationnelle : onglet dédié aux entrées des générations précédentes
- Entrées liables à des traces ou des systèmes

---

#### MODULE — Équation de Drake

Tableau de bord de l'état galactique collectif.

**Contenu :**
- Chaque terme de l'équation avec sa valeur courante et une barre visuelle
- Historique des variations de N (graphe temporel simple)
- Pour chaque variation notable : la trace responsable et le système d'origine
- N affiché en grand, avec son dernier delta et horodatage

---

#### MODULE — Population

État de la civilisation embarquée.

**Contenu :**
- Effectif total + tendance (croissance/déclin)
- Barres : Volonté, Cohésion sociale, Alimentation, Soins
- Statuts des systèmes sociaux (éducation, gouvernance, culture, médecine)
- Historique des événements populationnels passés
- Génération courante + résumé de l'héritage reçu

---

#### MODULE — Systèmes vaisseau

État technique du vaisseau.

**Contenu :**
- État détaillé de chaque système (propulsion, coque, bouclier, observatoire, survie)
- Niveaux de carburant He³ et deutérium avec estimation d'autonomie
- Historique des pannes et réparations
- Alertes actives

---

## 7. Système social

### Pas de communication directe

Les joueurs n'ont aucun moyen de se contacter hors du jeu via la plateforme. Pas de chat, pas de profil, pas de liste d'amis, pas de forum intégré.

### La communication par les traces

La seule façon d'interagir avec d'autres joueurs est de **déposer des traces**. Un joueur peut :

- Annoter un artefact avec son interprétation
- Laisser une trace `PLAYER_TRACE` dans un système avec une direction suggérée
- Encoder une information dans le contenu textuel de sa trace

Ce que les joueurs ne peuvent **pas** faire :
- Voir qui a laissé une trace (anonymat total)
- Répondre directement à une interprétation
- Se coordonner en temps réel

### Profils émergents (non nommés dans le jeu)

| Profil | Comportement observé |
|--------|---------------------|
| **L'archéologue** | Suit les traces des autres, visite les systèmes fréquentés, accumule les interprétations existantes |
| **L'intuitif** | Choisit des destinations selon des patterns esthétiques ou symboliques dans les données |
| **Le scientifique** | Analyse méthodiquement, cherche des signatures mathématiques, fait des rapports détaillés |
| **L'explorateur du vide** | Va délibérément là où personne n'est allé, accepte le risque de ne rien trouver |

Ces profils ne sont jamais mentionnés dans l'interface. Ils émergent des comportements.

### Convergence indépendante

La séquence secrète ne peut pas être résolue par coordination explicite. Elle est conçue pour que des joueurs de profils différents, arrivant par des chemins différents, convergent vers les mêmes conclusions de façon indépendante.

---

## 8. La Séquence Secrète

### Principe

Une ou plusieurs séquences de traces conçues à l'avance par les créateurs. Introuvables par les chemins évidents. Peuvent nécessiter des indices **hors de la plateforme** (ARG).

### Caractéristiques

- Traces de niveau 4, invisibles sans clé
- La clé peut être dans les métadonnées d'une image, dans le code source d'une page, dans une fréquence audio
- La récompense n'est pas un score — c'est **une trace différente**, plus ancienne, plus claire
- Cette trace finale pose une question que toutes les autres ne posaient pas
- Le joueur qui l'atteint ne sait pas si c'est du game design ou si c'est réel

### Règles de conception

- Chaque étape doit être résoluble par un seul profil de joueur (pas besoin de collaboration)
- La séquence complète nécessite idéalement tous les profils (archéologue + scientifique + intuitif + explorateur)
- Aucune étape ne doit être devinable — elle doit être **déductible**
- La dernière trace doit sembler avoir été conçue pour être trouvée **maintenant**, par **nous**

---

## 9. Équation de Drake

### Termes fixes (données astronomiques actuelles)

| Terme | Valeur | Source |
|-------|--------|--------|
| R* | 3.0 /an | Astronomie observationnelle |
| fp | 1.0 | Missions Kepler/TESS |
| ne | 0.40 | Données Kepler 2013 |

### Termes variables (influencés par les joueurs)

| Terme | Valeur initiale | Peut changer si… |
|-------|----------------|------------------|
| fl | 0.30 | Découverte de traces chimiques / biologiques |
| fi | 0.10 | Découverte d'artefacts complexes / mathématiques |
| fc | 0.20 | Découverte de signaux technologiques |
| L | 10 000 ans | Découverte de civilisations disparues ou actives |

### Recalcul

```
N = R* × fp × ne × fl × fi × fc × L
```

Recalculé automatiquement lors de chaque variation d'un terme. Mis à jour pour tous les joueurs actifs. La variation est visible dans le header (N= + delta) sans explication immédiate.

---

## 10. Onboarding

### Principe

L'onboarding n'est pas un tutoriel. C'est le moment fondateur. Le joueur n'a pas choisi de partir — sa civilisation a déjà décidé.

### Séquence

**Écran 1 — Les données**
```
Notre civilisation a catalogué 847 anomalies inexpliquées
dans un rayon de 500 années-lumière.

Parmi elles, 12 résistent à toute modélisation naturelle connue.
```

**Écran 2 — La décision**
```
Un consensus s'est formé.
Pas une certitude — un pari.

[N] personnes ont choisi d'y répondre en personne.
Ce vaisseau ne reviendra pas.
```

**Écran 3 — Les premiers indices**

Présentation de 3 traces immuables réelles :
- Signal WOW! (1977)
- Oumuamua (2017)
- Nucléobases de Bennu (2023)

Chacune présentée avec ses données brutes et la question qu'elle pose. Pas de réponse.

**Écran 4 — Le ciel**

Le ciel s'ouvre. Rien d'autre. Pas de flèche. Pas d'objectif affiché.

---

## 11. Stack technique suggérée

> *Note : à adapter selon les contraintes d'Antigravity.*

### Frontend

| Composant | Technologie suggérée |
|-----------|---------------------|
| Ciel interactif | Canvas 2D ou WebGL (Three.js) |
| Interface panels | React + CSS custom |
| Typographie | Share Tech Mono + Syne (Google Fonts) |
| Animations | CSS transitions + requestAnimationFrame |

### Backend

| Composant | Technologie suggérée |
|-----------|---------------------|
| API | REST ou GraphQL |
| Base de données | PostgreSQL (données structurées) |
| Temps réel (N=) | WebSocket ou Server-Sent Events |
| Génération galaxie | Seed-based procedural (déterministe) |

### Données

| Entité | Stockage |
|--------|---------|
| Vaisseau + état | Par joueur, persistant |
| Traces immuables | Seed global, jamais modifiées |
| Traces générées | Par système, générées à la première visite |
| Traces joueurs | Globales, permanentes, anonymisées |
| Interprétations | Liées à une trace, anonymes, permanentes |
| Équation de Drake | Globale, versionnée, historique |

### Génération procédurale

La galaxie est générée à partir d'un **seed global fixe**. Tous les joueurs voient la même galaxie. Les systèmes sont générés à la demande (lazy generation) lors de la première visite ou de l'approche.

```
seed("LACUNA-GALAXY-V1") → structure galactique reproductible
seed(systemId) → propriétés du système reproductibles
```

---

*LACUNA — GDD v0.3 — Mars 2026 — Confidentiel*
