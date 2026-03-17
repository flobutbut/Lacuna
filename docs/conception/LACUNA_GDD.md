*Dernière modification : 2026-03-16*

# LACUNA — Game Design Document
*Version 0.4 — Mars 2026*

---

## Table des matières

1. [Concept](#1-concept)
2. [Univers](#2-univers)
3. [Objets du jeu](#3-objets-du-jeu)
4. [Mécanique de jeu](#4-mécanique-de-jeu)
5. [Système social](#5-système-social)
6. [La séquence secrète](#6-la-séquence-secrète)
7. [Équation de Drake](#7-équation-de-drake)
8. [Références croisées](#8-références-croisées)
9. [État d'implémentation (référence projet actuel)](#9-état-dimplémentation-référence-projet-actuel)

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 0.1 | Mars 2026 | Document initial |
| 0.2 | Mars 2026 | Physique du voyage — profil d'accélération réaliste, observation décalée dans le temps, détection en transit, mécanique de déroute |
| 0.3 | Mars 2026 | Calibration temporelle — compression non-linéaire, paramètres physiques ARCA définitifs, table de référence complète, analyse gameplay |
| 0.4 | Mars 2026 | Restructuration — physique extraite vers `LACUNA_PHYSICS.md`, schémas JSON extraits vers `LACUNA_PROCEDURAL_DATA_MODEL.md` §9, UI renvoyée vers `LACUNA_UI.md`, onboarding renvoyé vers `LACUNA_LORE.md` |

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

### Temps et voyages — résumé

La durée d'un voyage découle de la physique newtonienne, compressée par une fonction puissance calibrée sur deux contraintes fixes : Proxima Centauri = 1h joueur, bord opposé = 90 jours joueur.

| Zone | Distance | Durée joueur |
|------|----------|-------------|
| Voisinage | < 25 al | 1h – 4h |
| Zone intermédiaire | 25 – 500 al | 4h – 18h |
| Zone profonde | 500 – 10 000 al | 18h – 10 jours |
| Destinations mythiques | > 10 000 al | 10 – 90 jours |

La dilatation gravitationnelle s'applique lors des stationnements près d'objets compacts — orbiter près de Sgr A* fait passer ~1 086 ans galactiques par an vaisseau.

> Référence complète : **`LACUNA_PHYSICS.md`** — paramètres ARCA, compression temporelle, dilatation gravitationnelle, profil de voyage, calculs.

### L'observation est toujours du passé

Quand le joueur observe un système à 500 al, il voit son état d'il y a 500 ans. Le système actuel est inconnu. L'interface le signale systématiquement. À l'arrivée, un système peut être `CONFORME`, `ÉVOLUÉ` ou `DISPARU`.

---

## 3. Objets du jeu

Les objets fondamentaux du jeu sont : le **Vaisseau**, la **Population**, les **Traces**, les **Interprétations**, le **Carnet de Bord**, la **Carte** et l'**Équation de Drake**.

> Schémas JSON complets, types énumérés et règles de stockage : **`LACUNA_PROCEDURAL_DATA_MODEL.md`** §9.

### Le Vaisseau

Objet central, persistant, appartenant au joueur. Porte l'état de transit, les systèmes techniques (propulsion, coque, bouclier, observatoire, survie), le carburant (He³ + deutérium), et les références vers la population, le journal, la collection et la carte. États : `IDLE`, `IN_TRANSIT`, `ARRIVED`, `DAMAGED`.

### La Population

10 247 personnes. Ce n'est pas un chiffre à optimiser — c'est une **texture narrative**. La variable clé est la **Volonté** (`will`, 0–1) : elle influence la capacité à interpréter des traces complexes et la tolérance aux voyages longs. Des événements rares et imprévisibles la font évoluer (schisme, épidémie, renaissance culturelle).

> Dynamiques de long terme : **`LACUNA_ARCS.md`** — arc générationnel, dérive culturelle, arc colonies.

### Les Traces

Objet fondamental. Tout ce que le joueur trouve, collecte, interprète et dépose. Trois origines : `IMMUABLE` (créée par les développeurs, ancrée dans la vraie science), `GENERÉE` (procédurale à la première visite), `JOUEUR` (déposée par un autre joueur).

> Grammaire complète, catalogue, règles de conception : **`LACUNA_TRACES.md`**.

### Les Interprétations

Chaque trace accumule des interprétations de joueurs. Anonymes — pas de pseudo. Datées par la génération de voyage. Niveaux de confiance : `OBSERVATION`, `HYPOTHÈSE`, `CONVICTION`, `CERTITUDE`. Aucune n'est validée par le jeu.

### Le Carnet de Bord

Objet persistant, unique par vaisseau. Mélange d'entrées manuelles (joueur), automatiques (système) et générationnelles. Les entrées manuelles influencent la demi-vie culturelle à bord.

### La Carte

Construite progressivement. Subjective — uniquement les systèmes visités par ce vaisseau. Ne se met pas à jour automatiquement : un nœud visité il y a 200 000 ans simulés peut pointer vers une étoile qui n'existe plus. C'est voulu.

---

## 4. Mécanique de jeu

### Flux principal

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

### Le Voyage

Quatre phases : accélération, inertie, retournement, décélération. Pendant la phase d'inertie, l'observatoire scanne en continu — c'est là que les découvertes non planifiées arrivent, et que les déroutes sont possibles.

La durée dépend de l'état du vaisseau : un moteur dégradé voyage plus lentement, un bouclier abîmé limite la vitesse maximale safe.

> Calculs complets, profil de voyage, déviation de trajectoire : **`LACUNA_PHYSICS.md`**.

### Les Générations

Une génération passe quand le vaisseau a accumulé suffisamment de distance et de temps simulé — ce n'est pas un timer fixe. Chaque passage ajoute une entrée générationnelle au journal, conserve l'héritage complet, et peut modifier la culture à bord. La génération en cours **colore** les nouvelles interprétations.

### Laisser une trace

À tout moment dans un système visité, le joueur peut déposer une `PLAYER_TRACE` (sous-types : `ANNOTATION`, `WARNING`, `DIRECTION`, `DISCOVERY`). La trace est **permanente** — elle ne peut pas être supprimée. Elle fait partie du réseau.

### Interface

> Architecture complète, modules, comportement du ciel, indicateurs : **`LACUNA_UI.md`**.

### Onboarding

> Séquence complète, flux de démarrage, traces embarquées : **`LACUNA_LORE.md`** §3–4.

---

## 5. Système social

### Pas de communication directe

Les joueurs n'ont aucun moyen de se contacter hors du jeu via la plateforme. Pas de chat, pas de profil, pas de liste d'amis, pas de forum intégré.

### La communication par les traces

La seule façon d'interagir avec d'autres joueurs est de **déposer des traces**. Ce que les joueurs ne peuvent pas faire : voir qui a laissé une trace (anonymat total), répondre directement, se coordonner en temps réel.

### Profils émergents (non nommés dans le jeu)

| Profil | Comportement observé |
|--------|---------------------|
| **L'archéologue** | Suit les traces des autres, accumule les interprétations existantes |
| **L'intuitif** | Choisit des destinations selon des patterns esthétiques ou symboliques |
| **Le scientifique** | Analyse méthodiquement, cherche des signatures mathématiques |
| **L'explorateur du vide** | Va délibérément là où personne n'est allé |

Ces profils ne sont jamais mentionnés dans l'interface. Ils émergent des comportements.

### Convergence indépendante

La séquence secrète ne peut pas être résolue par coordination explicite. Elle est conçue pour que des joueurs de profils différents, arrivant par des chemins différents, convergent vers les mêmes conclusions de façon indépendante.

---

## 6. La Séquence Secrète

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

## 7. Équation de Drake

### Termes fixes

| Terme | Valeur | Source |
|-------|--------|--------|
| R* | 3.0 /an | Astronomie observationnelle |
| fp | 1.0 | Missions Kepler/TESS |
| ne | 0.40 | Données Kepler 2013 |

### Termes variables (influencés par les découvertes collectives)

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

Recalculé automatiquement lors de chaque variation. Mis à jour pour tous les joueurs actifs. La variation est visible dans le header (N= + delta) sans explication immédiate.

> Schéma JSON complet : **`LACUNA_PROCEDURAL_DATA_MODEL.md`** §9.7.

---

## 8. Références croisées

| Sujet | Document |
|-------|---------|
| Physique du voyage, compression temporelle, dilatation | `LACUNA_PHYSICS.md` |
| Schémas JSON, modèle de données, génération procédurale | `LACUNA_PROCEDURAL_DATA_MODEL.md` |
| Interface utilisateur, modules, Observatoire | `LACUNA_UI.md` |
| Lore, onboarding, séquence de départ | `LACUNA_LORE.md` |
| Traces — grammaire, catalogue, règles de conception | `LACUNA_TRACES.md` |
| Arcs narratifs jouables, scénarios | `LACUNA_SCENARIOS.md` |
| Arc générationnel, arc colonies, dérive culturelle | `LACUNA_ARCS.md` |
| Backoffice, architecture admin | `LACUNA_BACKOFFICE_SPEC.md` |

---

## 9. État d'implémentation (référence projet actuel)

*La réalité du projet prime sur ce document. Cette section décrit ce qui est implémenté à ce jour et les écarts avec le design cible.*

### Implémenté

| Domaine | Réalité projet |
|---------|----------------|
| **Vaisseau** | Table `ships` + `ship_systems`. `current_system_id` (position = système courant), `travel_state`, `voyage`, `generation`, `travel_destination`, `travel_departure_at`, `travel_arrival_at`. Systèmes : propulsion, hull, plasma_shield, observatory, reservoir, alimentation, atmosphere, medical. Carburant He³/deutérium en tonnes (he3_current/max, deuterium_current/max). Pas de `position {x,y,z}` — dérivé du système courant. |
| **Calcul transit** | `src/lib/transit.js` — durées physiques et joueur par interpolation (table réf. Proxima 1h, bord 90j). Affichage générations = t_physique / **80 ans** (constante projet). Carburant % estimé. Pas de simulation en temps réel du voyage. |
| **Carte** | `map_nodes`, `map_edges` (Supabase). Nœuds : system_id, name, visited_at, generation, traces_found. Arêtes : from_system, to_system, travel_time, generation. Ajout depuis Observatoire / Laboratoire. |
| **Observatoire** | Ciel (stellar_systems, coordonnées x/y/z), TravelWidget (distance, durée, carburant, [FIXER CAP]), vue Système (planètes, zone habitable). Pas de fixation de cap ni voyage simulé. |
| **Signaux** | Table `signals`, sources `system_objects` (PULSAR, etc.) ou `signal_events`. Store signaux, durée de vie temps joueur, modale, [ANALYSER AU LABO]. |
| **Laboratoire** | File d'observations (observations Supabase), instruments (spectral, structure temporelle, polarisation, spectre énergétique, gravimétrique, stellaire, orbital, atmosphère, morpho, volumétrique, magnétomètre), rapports + [GARDER UNE TRACE]. |
| **Artefacts / Traces** | Traces Supabase, interprétations (anonymes), suppression. |
| **Population** | Table `populations` (total, generation, will, social_cohesion, etc.). Page 3 onglets (Générations, Génération actuelle, Registre des Raisons). Données lues en base. |
| **Drake** | Table `drake_equation`, affichage Header + Page Drake. |
| **Pages** | Observatoire, Carte, Artefacts, Laboratoire, Journal, Drake, Population, Systèmes (plan ARCA, 9 groupes). |

### Non implémenté (design cible uniquement)

| Domaine | Décrit dans le GDD / docs liées |
|---------|----------------------------------|
| **Onboarding** | LACUNA_LORE §3 — 5 écrans. Aucun écran actuellement. |
| **Voyage** | LACUNA_PHYSICS — Fixation cap, 4 phases, détection en transit, déroute. Seul `travel_state` existe en base ; pas de simulation ni countdown. |
| **Générations dynamiques** | §4 — Passage de génération contextuel (distance + temps), entrée GENERATIONNEL journal. Le compteur `generation` est affiché mais pas recalculé par le jeu. |
| **Journal de bord** | Entrées MANUEL/AUTO/GENERATIONNEL. Page Journal existe ; contenu et persistance à brancher. |
| **Dilatation gravitationnelle** | LACUNA_PHYSICS — γ_rel, stationnement près objets compacts. Non calculé ni affiché. |
| **Galaxie procédurale** | Génération lazy, seed global. Ciel alimenté par stellar_systems (HYG/NASA/seed), pas de procédural à la visite. |

### Mapping objet Vaisseau (GDD §3) ↔ schéma actuel

| GDD (concept) | Projet (tables / store) |
|---------------|-------------------------|
| Position | `current_system_id` ; coordonnées dérivées de `stellar_systems.coordinates`. |
| Systèmes « survie » | `ship_systems.reservoir`, `.alimentation`, `.atmosphere`, `.medical`. |
| travelState, destination, dates | `ships.travel_state`, `.travel_destination`, `.travel_departure_at`, `.travel_arrival_at`. |
| Génération (affichage transit) | Constante 80 ans par génération dans `transit.js` (ANNEES_PAR_GENERATION). |

---

*LACUNA — GDD v0.4 — Mars 2026 — Confidentiel*
