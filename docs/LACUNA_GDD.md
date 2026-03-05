# LACUNA — Game Design Document
*Version 0.1 — Mars 2026*

---

## Table des matières

1. [Concept](#1-concept)
2. [Univers](#2-univers)
3. [Objets du jeu](#3-objets-du-jeu)
4. [Mécanique de jeu](#4-mécanique-de-jeu)
5. [Interface utilisateur](#5-interface-utilisateur)
6. [Système social](#6-système-social)
7. [La séquence secrète](#7-la-séquence-secrète)
8. [Équation de Drake](#8-équation-de-drake)
9. [Onboarding](#9-onboarding)
10. [Stack technique suggérée](#10-stack-technique-suggérée)

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

```
1 année-lumière = 1 seconde de temps réel
```

| Destination | Distance | Durée réelle |
|-------------|----------|-------------|
| Proxima Centauri | 4,24 al | ~4s |
| Tau Ceti | 11,9 al | ~12s |
| Centre galactique | 26 000 al | ~7h |
| Bord opposé | 100 000 al | ~28h |

Les voyages longs sont de vrais engagements. Personne ne va au centre galactique à la légère.

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
    "arrivalTime": null
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

Pendant un voyage, le joueur a accès à :
- Le journal de bord (lecture et écriture)
- La collection d'artefacts (consultation)
- La mémoire générationnelle
- L'équation de Drake (lecture)

Il n'a **pas** accès à :
- L'observatoire (pas de ciel interactif)
- La navigation (destination déjà fixée)
- Le laboratoire

La durée du voyage correspond à la distance en années-lumière convertie en secondes réelles. **Un voyage de 50 al dure 50 secondes.**

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

## 5. Interface utilisateur

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

## 6. Système social

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

## 7. La Séquence Secrète

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

## 8. Équation de Drake

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

## 9. Onboarding

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

## 10. Stack technique suggérée

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

*LACUNA — GDD v0.1 — Mars 2026 — Confidentiel*
