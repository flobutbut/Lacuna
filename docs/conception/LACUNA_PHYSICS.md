*Dernière modification : 2026-03-16*

# LACUNA — Physique du voyage
*Version 0.1 — Mars 2026*

> Référence complète de la physique qui gouverne les voyages dans LACUNA : paramètres du vaisseau ARCA, compression temporelle, dilatation gravitationnelle, profil de voyage, calculs de durée et de carburant. Ce document est la source de vérité pour tout ce qui touche au temps et au mouvement.
>
> Documents liés : `LACUNA_GDD.md` (piliers de design, mécanique de jeu), `LACUNA_ARCS.md` (conséquences générationnelles des stationnements longs)

---

## Table des matières

1. [Paramètres du vaisseau ARCA](#1-paramètres-du-vaisseau-arca)
2. [Compression temporelle](#2-compression-temporelle)
3. [Dilatation gravitationnelle](#3-dilatation-gravitationnelle)
4. [Profil de voyage — quatre phases](#4-profil-de-voyage--quatre-phases)
5. [Calcul de durée et de carburant](#5-calcul-de-durée-et-de-carburant)
6. [Vitesse maximale safe](#6-vitesse-maximale-safe)
7. [Observation décalée dans le temps](#7-observation-décalée-dans-le-temps)
8. [États stellaires à l'arrivée](#8-états-stellaires-à-larrivée)

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 0.1 | Mars 2026 | Document initial — extrait et consolidé depuis `LACUNA_GDD.md` §2 et §5 |

---

## 1. Paramètres du vaisseau ARCA (état nominal)

```
masse_totale        = 4 000 000 t
acceleration_max    = 0,12g = 1,177 m/s²
vitesse_croisiere   = 4,8% c = 14 388 km/s
exhaust_velocity    = 0,1c (moteur MTF)
```

Ces valeurs correspondent au vaisseau en état nominal — bouclier plasma intact, propulsion à 1,0, carburant suffisant. Un vaisseau dégradé ne peut pas atteindre ces performances ; voir §5 et §6.

---

## 2. Compression temporelle

### Principe

La durée d'un voyage est calculée en deux étapes :

1. **Durée physique réelle** — calculée par la physique newtonienne du vaisseau (accélération, vitesse de croisière, Tsiolkovsky)
2. **Durée joueur** — obtenue par compression non-linéaire de la durée physique

### Compression non-linéaire — fonction puissance

Une compression linéaire écraserait les distances intermédiaires : les courtes distances ont une vitesse moyenne très basse (le vaisseau n'atteint jamais sa croisière), les longues distances atteignent 4,8% c.

On applique une **fonction puissance** calibrée sur deux contraintes fixes :
- Proxima Centauri (4,24 al) → **1 heure joueur**
- Bord opposé (100 000 al) → **90 jours joueur**

```
t_joueur = K × t_physique ^ 0.762

exposant = log(90 jours / 1h) / log(2 083 333 ans / 88 ans) ≈ 0,762
K        = calibré pour que Proxima = 1h
```

### Ratio de compression global

Le jeu applique un ratio de compression uniforme à tout le temps simulé — transits et orbites confondus. Ce ratio est dérivé du contrat fondamental : **1 mois joueur = traversée complète de la galaxie**.

```
1 an réel    = ~24 000 000 ans simulés
1 mois réel  = ~2 000 000 ans simulés
1 jour réel  = ~65 700 ans simulés
1 heure réel = ~2 740 ans simulés
1 minute réel = ~45 ans simulés
```

### Table de référence — durées de voyage

| Destination | Distance | Durée physique | Vitesse moyenne | Durée joueur |
|-------------|----------|---------------|----------------|-------------|
| Proxima Centauri | 4,24 al | 88 ans | 0,048% c | **1h** |
| Tau Ceti | 11,9 al | 248 ans | 0,048% c | **2h24** |
| Gliese 667C | 22 al | 458 ans | 0,048% c | **3h54** |
| Étoile de Tabby | 1 280 al | 26 600 ans | 2,4% c | **1,7 jours** |
| Centre galactique | 26 000 al | 541 000 ans | 4,6% c | **14 jours** |
| Bord opposé | 100 000 al | 2 083 333 ans | 4,8% c | **90 jours** |

Les destinations proches ont une vitesse moyenne très basse — le vaisseau passe tout son temps à accélérer et décélérer. C'est physiquement correct et crée une géographie de l'effort naturelle : aller loin est proportionnellement plus efficace qu'aller près.

### Géographie de jeu

| Zone | Distance | Durée joueur | Rythme |
|------|----------|-------------|--------|
| **Voisinage** | < 25 al | 1h – 4h | Explorable dans une session |
| **Zone intermédiaire** | 25 – 500 al | 4h – 18h | Une nuit de voyage |
| **Zone profonde** | 500 – 10 000 al | 18h – 10 jours | Expédition |
| **Destinations mythiques** | > 10 000 al | 10 – 90 jours | Odyssée |

### Analyse gameplay

**Ce qui fonctionne**

Le voisinage à 1h-4h est idéal pour l'onboarding — 2 à 3 systèmes explorables en une soirée. La zone intermédiaire à "une nuit de voyage" est le sweet spot du jeu asynchrone : on programme un cap le soir, on revient le lendemain. Le centre galactique à 14 jours et le bord opposé à 90 jours créent une vraie stratification de l'ambition entre joueurs.

**Point de vigilance — le voisinage**

À 1h-4h par voyage, la tentation d'enchaîner les systèmes sans s'arrêter interpréter est forte. La richesse du jeu est dans l'interprétation des traces — pas dans le déplacement. La solution n'est pas d'allonger les voyages courts mais de concevoir les traces du voisinage pour qu'elles **nécessitent** un temps d'analyse : scan de 2h, croisement avec une autre trace, écriture d'une interprétation comme prérequis au prochain cap.

**Point de vigilance — détection en transit**

Sur les voyages d'1h, la fenêtre de détection et de décision est courte. En pratique les déroutes ne seront pertinentes qu'à partir de la zone intermédiaire (> 4h).

**Enjeu critique — densité des traces dans le voisinage**

Le vrai risque n'est pas la durée des voyages — c'est le vide entre les traces. Un joueur qui arrive dans plusieurs systèmes consécutifs sans rien trouver de significatif abandonne. La densité et la qualité des traces dans les 50 premiers systèmes accessibles est critique pour l'accroche initiale.

---

## 3. Dilatation gravitationnelle

### Principe

Lorsque le vaisseau s'installe dans un système stellaire, le temps propre du vaisseau s'écoule plus lentement que dans le système solaire de référence. L'effet est calculé à partir de la masse de l'astre hôte — relativité générale.

### Référentiel

Le Soleil est le référentiel temporel du jeu. Tout joueur part de Sol — c'est l'étalon. La dilatation d'un système est toujours exprimée **par rapport au Soleil**, pas par rapport au vide interstellaire.

### Équation

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

### Convention d'orbite

Le vaisseau est considéré en orbite à **r_surface + 10 km** de l'astre hôte. Pour les objets compacts sans surface physique (trous noirs), r_surface = r_s. C'est une convention de jeu — le vaisseau ARCA maintient cette orbite par ses propres moyens.

### Table de référence

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

### Implémentation

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

### Seuil d'affichage

La dilatation est calculée pour tous les systèmes à la génération. Elle est affichée dans l'interface uniquement si γ_rel < 0,999 — en dessous de ce seuil l'effet est perceptible à l'échelle d'une session de jeu.

### Compression temporelle et dilatation combinées

L'effet galactique d'un stationnement s'obtient en combinant le ratio de compression et γ_rel :

```
années galactiques = temps_joueur_réel × ratio_compression / γ_rel
```

### Échelle de référence — orbite près de Sgr A*

| Durée joueur | Temps vaisseau | Temps galactique écoulé |
|-------------|---------------|------------------------|
| 30 minutes | ~80 ans | ~87 000 ans |
| 1 jour | ~65 700 ans | ~71 millions d'années |
| 2 semaines | ~919 800 ans | ~1 milliard d'années |
| 1 mois | ~2 000 000 ans | ~2,2 milliards d'années |
| 2 mois | ~4 000 000 ans | ~4,3 milliards d'années |
| 3 mois | ~6 000 000 ans | ~6,5 milliards d'années |

### Horizons atteignables et inaccessibles

| Événement | Distance temporelle | Coût près de Sgr A* | Accessible |
|-----------|--------------------|--------------------|-----------|
| Silence radio de la Terre | ~100 ans | quelques secondes | oui — déjà passé au départ |
| Fusion Andromède / Voie Lactée | ~4,6 Ga | ~2,1 mois joueur | oui — au prix fort |
| Mort du Soleil | ~5 Ga | ~2,3 mois joueur | oui — au prix fort |
| Dernière étoile de la galaxie | ~100 000 Ga | ~3 800 ans réels | non |
| Désintégration des protons | ~10³⁴ ans | ~10¹⁴ milliards d'années réelles | jamais |

La mort du Soleil et la fusion d'Andromède sont les **horizons ultimes atteignables** — au prix de deux mois réels de jeu, sans compression supplémentaire. Au-delà, l'inaccessibilité n'est pas une règle de jeu : c'est l'arithmétique elle-même qui l'interdit.

### Conséquences d'un stationnement long — note de conception

Un stationnement prolongé près d'un objet compact produit des conséquences qui dépassent la simple irréversibilité temporelle.

**Rupture généalogique.** À 25 ans par génération, 2 mois joueur près de Sgr A* représentent ~184 000 générations à bord. C'est 15 fois l'histoire humaine depuis l'écriture. Le fil générationnel est rompu de façon absolue.

**La population devient une trace.** À la sortie, le joueur ne retrouve pas "sa" population — il rencontre une civilisation qui a vécu 4 millions d'années dans un vaisseau fermé. Elle est à traiter comme une découverte, pas comme une continuité.

**Asymétrie radicale.** Pendant un transit long, des générations passent pendant que le joueur attend. Pendant un stationnement dilatant long, des générations passent pendant que le joueur est *immobile*. C'est le joueur qui a délibérément choisi la rupture.

**Inaccessibilité réciproque.** Ce qui s'est passé à bord pendant un stationnement de 4 millions d'années est la plus grande lacuna interne du jeu — inaccessible même au joueur lui-même.

### Ce qui est physiquement réel / ce qui est convention de jeu

**Réel :**
- L'équation de Schwarzschild est la formulation exacte de la relativité générale pour un corps massif non-rotatif
- La direction de l'effet est correcte : plus on est proche d'un objet massif, plus le temps propre ralentit
- La hiérarchie des objets est juste
- Le rayon de Schwarzschild est calculé avec les vraies constantes physiques
- L'étoile à neutrons plus dilatante que le trou noir stellaire est physiquement correct

**Conventions :**
- `r_orbite = r_surface + 10 km` pour les trous noirs — physiquement impossible (ISCO à 3×r_s), assumé pour une dilatation jouablement dramatique
- Le référentiel Soleil plutôt que le vide interstellaire — choix narratif, l'écart est de ~10⁻⁸
- La dilatation par la vitesse est ignorée — à 4,8% c, γ_v ≈ 1,001, soit ~9h de décalage par an de transit, sans gain narratif suffisant

---

## 4. Profil de voyage — quatre phases

### Phase 1 — Accélération

Le moteur MTF est allumé à poussée constante. Le vaisseau accélère depuis l'arrêt jusqu'à sa vitesse de croisière cible. Cette phase consomme du carburant He³.

```
acceleration = propulsion_state × thrust_nominal / total_mass
```

La durée et la distance d'accélération dépendent directement de l'état du système de propulsion — un moteur dégradé accélère moins fort, donc plus lentement.

### Phase 2 — Inertie

Moteur éteint. Vitesse constante. Le vaisseau glisse dans le vide. C'est la phase la plus longue sur les grands voyages, et la plus riche en jeu — l'observatoire tourne en continu, les anomalies et traces apparaissent progressivement dans le champ de détection, des notifications arrivent.

**Aucun carburant consommé pendant la phase d'inertie.**

### Phase 3 — Retournement

Le vaisseau se retourne sur son axe pour présenter ses moteurs dans le sens du voyage. Manœuvre délicate, coût carburant mineur. Moment narratif — la destination apparaît pour la première fois à travers les hublots avant. Une entrée automatique est créée dans le journal.

### Phase 4 — Décélération

Moteur rallumé, même poussée qu'en phase 1, appliquée en sens inverse. Consomme autant de carburant que la phase d'accélération. Le vaisseau arrive à vitesse quasi nulle à destination.

### États du vaisseau en transit

| État | Description | Accès interface |
|------|-------------|----------------|
| `ACCELERATING` | Phase 1 — moteur allumé | Journal, Artefacts, Drake |
| `COASTING` | Phase 2 — inertie | Journal, Artefacts, Drake, Observatoire (passif), Déviation possible |
| `TURNING` | Phase 3 — retournement | Journal uniquement |
| `DECELERATING` | Phase 4 — moteur allumé | Journal, Artefacts, Drake |

L'observatoire interactif (clic sur étoile, choix de cap) n'est disponible qu'à l'arrêt (`IDLE`) ou pendant la phase d'inertie pour initier une déviation.

---

## 5. Calcul de durée et de carburant

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

Un vaisseau dégradé ou à court de carburant ne peut pas atteindre sa vitesse de croisière nominale — le voyage prend plus de temps et coûte proportionnellement plus.

---

## 6. Vitesse maximale safe

Le bouclier plasma protège le vaisseau des impacts de poussière interstellaire. À haute vitesse, l'énergie cinétique de ces impacts devient destructrice.

| État bouclier plasma | Vitesse max | Remarque |
|---------------------|------------|---------|
| 1.0 (parfait) | 5% c | Vitesse nominale de croisière |
| 0.7 – 0.9 | 3% c | Prudence recommandée |
| 0.4 – 0.7 | 1.5% c | Voyages longs à risque |
| < 0.4 | 0.5% c | Danger — voyages courts uniquement |

Dépasser la vitesse safe est possible — c'est une décision du joueur, avec un risque croissant de dégradation de la coque à chaque heure de voyage.

### Déviation de trajectoire

À tout moment pendant la phase d'inertie, le joueur peut dérouter vers un système détecté en chemin. La déviation est irréversible — le cap original est abandonné.

| Facteur | Effet |
|---------|-------|
| Carburant | Consommé pour le changement de vecteur — non récupérable |
| Temps | Allongement du voyage selon l'angle de déviation |
| Journal | Entrée automatique "Déviation — cap abandonné : [système original]" |
| Destination originale | Ne sera peut-être jamais atteinte |

L'abandon d'une destination est lui-même une donnée narrative. Peut-être que la destination originale avait une trace que personne n'atteindra jamais.

---

## 7. Observation décalée dans le temps

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

---

## 8. États stellaires à l'arrivée

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

---

*LACUNA — Physique du voyage v0.1 — Mars 2026 — Confidentiel*
