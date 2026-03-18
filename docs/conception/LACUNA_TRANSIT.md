*Dernière modification : 2026-03-18*

# LACUNA — Le Transit
*Version 0.1 — Mars 2026*

> Spécification complète du transit : définition, physique, états d'interface, détection, déviation, animation de dérive stellaire, modèle de données. Ce document consolide et centralise tout ce qui concerne le voyage interstellaire de l'ARCA entre deux systèmes.
>
> Documents liés : `LACUNA_PHYSICS.md` (physique du voyage, profil d'accélération, carburant) · `LACUNA_UI.md` (interface générale, modules) · `LACUNA_NOTIFICATIONS.md` (famille Voyage) · `LACUNA_PROCEDURAL_DATA_MODEL.md` (schéma `travelState`)

*Confidentiel — Antigravity*

---

## Table des matières

1. [Définition](#1-définition)
2. [Physique du transit](#2-physique-du-transit)
3. [Les quatre phases](#3-les-quatre-phases)
4. [Interface pendant le transit](#4-interface-pendant-le-transit)
5. [Détection en transit](#5-détection-en-transit)
6. [Déviation de trajectoire](#6-déviation-de-trajectoire)
7. [Animation — dérive stellaire](#7-animation--dérive-stellaire)
8. [Population pendant le transit](#8-population-pendant-le-transit)
9. [Modèle de données](#9-modèle-de-données)
10. [Questions ouvertes](#10-questions-ouvertes)

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 0.1 | Mars 2026 | Document initial — consolidation depuis `LACUNA_UI.md`, `LACUNA_PHYSICS.md`, `LACUNA_NOTIFICATIONS.md`, `LACUNA_PROCEDURAL_DATA_MODEL.md`, `LACUNA_ARCS.md` |

---

## 1. Définition

Le transit désigne le voyage interstellaire de l'ARCA entre deux systèmes stellaires — depuis la confirmation du cap jusqu'à l'arrivée à vitesse quasi nulle à destination. C'est l'état `IN_TRANSIT` du vaisseau.

Le transit n'est pas une pause dans le jeu. C'est une phase de jeu distincte, avec ses propres possibilités et ses propres contraintes. La richesse du jeu ne réside pas dans le déplacement mais dans l'interprétation des traces — le transit doit créer les conditions de cette interprétation, pas les écraser.

---

## 2. Physique du transit

### Paramètres nominaux

```
vitesse_croisiere   = 4,8% c = 14 388 km/s
acceleration_max    = 0,12g = 1,177 m/s²
```

Ces valeurs correspondent à l'ARCA en état nominal. Un vaisseau dégradé ne peut pas les atteindre — voir `LACUNA_PHYSICS.md` §5–6.

### Durées de référence

| Destination | Distance | Durée physique | Durée joueur |
|-------------|----------|---------------|-------------|
| Proxima Centauri | 4,24 al | 88 ans | **1h** |
| Tau Ceti | 11,9 al | 248 ans | **2h24** |
| Gliese 667C | 22 al | 458 ans | **3h54** |
| Étoile de Tabby | 1 280 al | 26 600 ans | **1,7 jours** |
| Centre galactique | 26 000 al | 541 000 ans | **14 jours** |
| Bord opposé | 100 000 al | 2 083 333 ans | **90 jours** |

### Compression temporelle

La durée joueur est obtenue par fonction puissance sur la durée physique :

```
t_joueur = K × t_physique ^ 0.762
```

Calibration : Proxima = 1h joueur / bord opposé = 90 jours joueur. Les destinations proches ont une vitesse moyenne très basse — le vaisseau passe presque tout son temps à accélérer et décélérer. Les longues destinations atteignent pleinement les 4,8% c.

### Zones de jeu

| Zone | Distance | Durée joueur | Rythme |
|------|----------|-------------|--------|
| Voisinage | < 25 al | 1h – 4h | Explorable en une session |
| Zone intermédiaire | 25 – 500 al | 4h – 18h | Une nuit de voyage |
| Zone profonde | 500 – 10 000 al | 18h – 10 jours | Expédition |
| Destinations mythiques | > 10 000 al | 10 – 90 jours | Odyssée |

### Dilatation par la vitesse

Ignorée. À 4,8% c, γ_v ≈ 1,001 — soit ~9h de décalage par an de transit, sans gain narratif suffisant. La dilatation gravitationnelle, elle, s'applique en orbite proche d'objets massifs (voir `LACUNA_PHYSICS.md` §3).

---

## 3. Les quatre phases

### Phase 1 — Accélération (`ACCELERATING`)

Moteur MTF allumé à poussée constante depuis l'arrêt jusqu'à la vitesse de croisière. Consomme du carburant He³. Interface réduite — le voyage est lancé, rien ne peut l'arrêter.

Sur les voyages courts (< ~100 al), le vaisseau n'atteint pas sa vitesse de croisière nominale — il accélère jusqu'au point médian puis décélère directement. Il n'y a pas de phase d'inertie.

### Phase 2 — Inertie (`COASTING`)

Moteur éteint. Vitesse constante. Aucun carburant consommé. C'est la phase la plus longue sur les grands voyages et la plus riche en jeu : l'observatoire tourne en continu, les anomalies latérales apparaissent progressivement dans le champ de détection, des notifications arrivent, une déviation est possible.

Les voyages vers le voisinage (< 25 al) ont une phase d'inertie très courte ou inexistante — le vaisseau est presque immédiatement en décélération. La détection latérale est pratiquement impossible sur ces distances.

### Phase 3 — Retournement (`TURNING`)

Le vaisseau se retourne sur son axe pour présenter ses moteurs dans le sens du voyage. Manœuvre délicate, coût carburant mineur. La destination apparaît pour la première fois dans le champ visuel avant. Une entrée automatique est créée dans le journal.

### Phase 4 — Décélération (`DECELERATING`)

Moteur rallumé, même poussée qu'en phase 1, appliquée en sens inverse. Consomme autant de carburant que la phase d'accélération. Le vaisseau arrive à vitesse quasi nulle à destination.

---

## 4. Interface pendant le transit

### Tableau de disponibilité

| Module | Accélération | Inertie | Retournement | Décélération |
|---|---|---|---|---|
| Journal de bord | ✓ | ✓ | ✓ | ✓ |
| Collection traces | ✓ | ✓ | ✓ | ✓ |
| Équation de Drake | ✓ | ✓ | ✓ | ✓ |
| Population | ✓ | ✓ | ✓ | ✓ |
| Systèmes vaisseau | ✓ | ✓ | ✓ | ✓ |
| Carte | ✓ | ✓ | ✓ | ✓ |
| Observatoire (passif) | — | ✓ | — | — |
| Laboratoire | — | ✓ | — | — |
| Navigation / Déviation | — | ✓ | — | — |

### Accélération et décélération

Interface réduite. Le ciel reste visible mais non interactif. Le panel gauche affiche la vitesse et la progression. Clic sur une étoile : sélection uniquement — modale sans bouton `[FIXER CAP]`.

### Inertie

Phase la plus riche. Le ciel redevient interactif pour la déviation uniquement. L'Observatoire passe en mode passif. Le Laboratoire est disponible pour analyser les signaux déjà captés. Une déviation peut être initiée.

### Retournement

Interface réduite au Journal uniquement. Moment narratif court.

### Tokens visuels pendant le transit

| Élément | Rendu |
|---------|-------|
| Destination | Ligne de trajectoire cyan, opacity 0.3 |
| Progression | Panel gauche — barre + vitesse courante |
| Phase courante | Affiché dans le header (`TRANSIT — J+N`) |

---

## 5. Détection en transit

### Principe

Pendant la phase d'inertie, l'Observatoire passif balaye l'espace latéral. Des systèmes hors trajectoire peuvent entrer dans le champ de résolution et déclencher une notification de détection. Ces détections alimentent le tableau `detectedInTransit[]` du modèle de données.

### Conditions

La détection latérale n'est pertinente qu'à partir de la zone intermédiaire (voyages > 4h joueur). Sur les voyages du voisinage (1h–4h), la fenêtre est trop courte pour qu'une déviation soit envisageable dans la majorité des cas.

### Types de détection

**Anomalie système** — Un système hors trajectoire présente une anomalie suspectée.

```
TRANSIT — J+3 — 14h22
Système non catalogué détecté — 8,3 al — tribord
Type spectral estimé : K2V
Anomalie suspectée — niveau 1
Déviation possible — coût carburant estimé : 9%
```

**Trace de joueur** — Un système récemment visité par un autre vaisseau entre dans le champ.

```
TRANSIT — J+7 — 09h41
Signal de balisage détecté — HD 156026 — 12,1 al — bâbord
Origine : vaisseau en transit — génération 4
Trace déposée il y a 23 jours simulés
Déviation possible — coût carburant estimé : 14%
```

**Alerte destination** — Le recalcul en cours de voyage révèle que la destination a peut-être évolué.

```
TRANSIT — J+12 — 06h03
Alerte destination — Zeta Puppis — 1 100 al
Réévaluation spectrale en cours.
Type O5 — durée de vie estimée : 3 Ma.
Statut actuel : INCONNU.
```

### Niveau d'observation en transit

La position "observation lointaine" (vaisseau en transit, télescope pointé vers une étoile) est l'un des cinq niveaux d'observation définis. Elle donne accès au type spectral, à la courbe de luminosité et aux corps détectables — pas à l'orbitographie fine ni à l'atmosphère.

```
Passif              → signal reçu sans manœuvre
Observation lointaine → en transit — type spectral, courbe de luminosité
Observation système → en orbite stellaire — orbitographie, résonances
Orbite proche       → atmosphère, surface, magnétisme
Contact             → composition fine, datation, observation directe
```

Un rapport produit depuis une observation lointaine a une fiabilité réduite. Il n'est pas inutile — ses données ont moins de poids dans le mécanisme Drake, mais il peut orienter une déviation ou confirmer un fil.

---

## 6. Déviation de trajectoire

### Principe

À tout moment pendant la phase d'inertie, le joueur peut dérouter vers un système détecté en chemin. La déviation est irréversible — le cap original est abandonné.

### Coût

| Facteur | Effet |
|---------|-------|
| Carburant | Consommé pour le changement de vecteur — non récupérable |
| Temps | Allongement du voyage selon l'angle de déviation |
| Journal | Entrée automatique : *"Déviation — cap abandonné : [système original]"* |
| Destination originale | Ne sera peut-être jamais atteinte |

L'abandon d'une destination est lui-même une donnée narrative. La trace qu'elle contenait existait. Ce que ça signifie appartient au joueur.

### Calcul balistique

La déviation est calculée depuis la position courante du vaisseau, sa vitesse instantanée et le vecteur vers la nouvelle destination. La courbe de trajectoire résultante est affichée dans le ciel avant confirmation. Le coût carburant est calculé et affiché avant toute action irréversible.

---

## 7. Animation — dérive stellaire

> *Spécification partielle — v0.1. Questions ouvertes documentées en §10.*

### Principe

Pendant le transit, le ciel de l'Observatoire n'est pas statique. Les étoiles dérivent lentement selon leur parallaxe apparente depuis la position courante du vaisseau. Les étoiles proches se déplacent visiblement par rapport au fond galactique ; les lointaines restent quasi fixes.

L'animation est un rendu honnête — pas une illustration métaphorique du voyage. Elle est calculée depuis les coordonnées HYG (ra, dec, distance en parsecs) et la position interpolée du vaisseau sur sa trajectoire balistique. Un joueur qui connaît le ciel peut identifier sa progression par la géométrie des étoiles proches.

### Calcul de position

La position du vaisseau à chaque instant est dérivée du profil en quatre phases défini dans `LACUNA_PHYSICS.md`. La vitesse instantanée et la distance parcourue sont connues à chaque frame — la parallaxe stellaire s'en déduit directement.

### Vitesse de dérive et compression temporelle

La vitesse de dérive est proportionnelle à la vitesse de déplacement réelle du vaisseau, normalisée par la durée joueur du voyage. Il n'y a pas de seuil franc — la vitesse est un continuum :

- Voisinage (1h–4h joueur) : dérive lente, perceptible, présence contemplative.
- Zone intermédiaire et au-delà : dérive accélérée proportionnellement à la compression temporelle — le ciel se réorganise plus vite, signalant l'échelle du saut sans l'expliciter.

### Disponibilité

L'animation est active pendant les phases d'accélération, d'inertie et de décélération. Elle s'arrête à l'arrivée — le ciel se fige sur la nouvelle position. En retournement, le comportement est à définir (changement d'axe visuel brutal ou fondu).

### Lien avec les scénarios

Un usage narratif est envisagé mais non encore défini : une étoile dont la parallaxe observée pendant le transit ne correspond pas à sa distance cataloguée pourrait constituer une trace déclenchée par le mouvement lui-même. À développer à l'élaboration des arcs.

---

## 8. Population pendant le transit

### Échelle générationnelle

Sur les transits du voisinage (88–460 ans simulés), plusieurs générations passent pendant que le joueur attend. La génération qui a vu le départ n'est pas celle qui verra l'arrivée. Ce fait n'est jamais formulé explicitement par l'interface — il se déduit de l'arithmétique.

À 25 ans par génération :
- Proxima (88 ans simulés) : ~3–4 générations
- Tau Ceti (248 ans simulés) : ~10 générations
- Centre galactique (541 000 ans simulés) : ~21 600 générations

Sur l'échelle des transits normaux (quelques milliers d'années), la population reste génétiquement *Homo sapiens*. Les dérives biologiques significatives n'apparaissent qu'à des échelles de stationnement dilatant prolongé — voir `LACUNA_ARCS.md`.

### Effets culturels

Un transit long sans capitaine produit un effet documenté : +400 ans de dérive culturelle, avec une crise à bord et une figure mythologique au retour.

L'asymétrie fondamentale : pendant un transit long, des générations passent pendant que le joueur attend. Pendant un stationnement dilatant long, des générations passent pendant que le joueur est immobile. Dans le premier cas, le temps passe malgré lui. Dans le second, il a délibérément choisi la rupture.

---

## 9. Modèle de données

Champ `travelState` du schéma vaisseau (`LACUNA_PROCEDURAL_DATA_MODEL.md`) :

```json
"travelState": {
  "inTransit": false,
  "destination": null,
  "departureTime": null,
  "arrivalTime": null,
  "phase": null,
  "distanceTotal": 0.0,
  "fuelBudgeted": 0.0,
  "detectedInTransit": [],
  "diversionAvailable": false,
  "originalDestination": null
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `inTransit` | bool | Vrai pendant toute la durée du transit |
| `destination` | string | ID du système cible |
| `departureTime` | datetime | Horodatage réel du départ |
| `arrivalTime` | datetime | Horodatage réel estimé d'arrivée |
| `phase` | enum | `ACCELERATING` / `COASTING` / `TURNING` / `DECELERATING` |
| `distanceTotal` | float | Distance totale en années-lumière |
| `fuelBudgeted` | float | Carburant alloué au voyage |
| `detectedInTransit` | array | Systèmes détectés en chemin (ID + distance + anomaly_level) |
| `diversionAvailable` | bool | Vrai uniquement pendant `COASTING` |
| `originalDestination` | string | ID du système initial si déviation en cours |

---

## 10. Questions ouvertes

**Animation — dérive stellaire**
- Seuil perceptible minimal : en dessous de quelle distance la dérive est-elle trop lente pour être remarquée ? À calibrer à l'implémentation.
- La ligne de trajectoire cyan reste-t-elle affichée pendant la dérive, ou disparaît-elle pour laisser le ciel seul ?
- Comportement en retournement : la dérive change-t-elle d'axe visuellement ? Fondu ? Instantané ?
- Si le joueur dévie en phase d'inertie, la dérive change-t-elle de direction progressivement (courbe balistique) ou instantanément ?
- Usage narratif dans les scénarios : étoile dont la parallaxe ne correspond pas à sa distance cataloguée — à définir à l'élaboration des arcs.

**Détection et déviation**
- Volume maximum de `detectedInTransit[]` : toutes les détections sont-elles conservées ou seulement les actionnables ?
- Le joueur peut-il consulter les systèmes détectés mais non déviés après l'arrivée ? (Traces d'une route non prise.)
- Comportement si deux détections arrivent simultanément en phase d'inertie courte.

**Population**
- Le journal de bord reçoit-il des entrées automatiques sur les naissances et morts pendant un long transit ? À quel rythme ?
- Une faction peut-elle rejoindre le vaisseau en transit si une colonie échoue ? (Réponse probable : non — cohérent avec la physique et la solitude réelle.)

---

*LACUNA — Le Transit v0.1 — Mars 2026 — Confidentiel*
