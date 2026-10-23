*Dernière modification : 2026-10-23*

# LACUNA — Game Design Document
*Version 0.14 — Octobre 2026*

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
| 0.5 | Octobre 2026 | Mise en cohérence — population de référence 15 000 (alignée sur les principes du projet et `LACUNA_ARCS.md` §1.10) ; quatrième origine de trace `PRÉCURSEUR` (Yael) ; zone profonde 18 h – 6 jours ; références croisées complétées ; §9 État d'implémentation mis à jour (transit serveur, comptes joueurs) et versé dans les deux copies du document |
| 0.6 | Octobre 2026 | §9 : écarts population de départ (15 000) et durée de génération (25 ans) corrigés dans le code ; écarts restants : répartition des phases, Équation de Drake (valeurs de référence en base, migration `00053` à appliquer) |
| 0.7 | Octobre 2026 | §9 : émetteurs de système (signaux à fenêtres du Fil des 75, Radar et Laboratoire) ; migrations `00054`–`00058` écrites, non appliquées |
| 0.8 | Octobre 2026 | §9 : traces de scénario en base (Fil des 75, gradient de lecture, découverte côté serveur) ; Yael : structure sans entrée ; migrations `00059`, `00060` |
| 0.9 | Octobre 2026 | §9 : paramètres d'administration — accélération des voyages réservée aux admins, réinitialisation de la partie (migration `00061`) |
| 0.10 | Octobre 2026 | §9 : statut des migrations corrigé — `00052` à `00065` appliquées en production |
| 0.11 | Octobre 2026 | §2 : calendrier du vaisseau (départ le 1er janvier 2187, temps physique des voyages, temps réel en orbite) ; §3 et §9 : journal de bord implémenté (migration `00068`) |
| 0.12 | Octobre 2026 | §4 : règle des générations (1 + années simulées ÷ 25, mise à jour à l'arrivée) ; une seule entrée au journal, au premier passage — contradiction entre « une entrée par passage », POP-001 et `LACUNA_ARCS.md` §1.7 tranchée ; §9 mis à jour |
| 0.13 | Octobre 2026 | §9 : onboarding implémenté (migration `00071`) |
| 0.14 | Octobre 2026 | §2 : départ ramené au 1er janvier 2041 (`LACUNA_LORE.md` §2) — 2187 contredisait le lore ; année de construction alignée (2041) |

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

La durée physique d'un voyage découle de la physique newtonienne (croisière à 4,8 % c). La durée joueur en est tirée par une table de référence non linéaire, calibrée sur deux contraintes fixes : Proxima Centauri = 1h joueur, bord opposé = 90 jours joueur.

| Zone | Distance | Durée joueur |
|------|----------|-------------|
| Voisinage | < 25 al | 1h – 4h |
| Zone intermédiaire | 25 – 500 al | 4h – 18h |
| Zone profonde | 500 – 10 000 al | 18h – 6 jours |
| Destinations mythiques | > 10 000 al | 6 – 90 jours |

La dilatation gravitationnelle s'applique lors des stationnements près d'objets compacts — orbiter près de Sgr A* fait passer ~1 086 ans galactiques par an vaisseau.

> Référence complète : **`LACUNA_PHYSICS.md`** — paramètres ARCA, compression temporelle, dilatation gravitationnelle, profil de voyage, calculs.

### Calendrier du vaisseau

Tous les vaisseaux partent le **1er janvier 2041**, année où le premier vaisseau de classe ARCA devient opérationnel (`LACUNA_LORE.md` §2). *Corrigé en octobre 2026 : le départ était fixé en 2187, ce qui contredisait le lore — volontaires sélectionnés entre 2036 et 2040, vaisseau opérationnel en 2041.* La date du vaisseau est la date de départ, plus :
- la durée **physique** de chaque voyage (table de référence de `LACUNA_PHYSICS.md` §2 ; un voyage en cours compte au prorata de sa progression) ;
- le temps **réel** passé en orbite (une journée en orbite est une journée de bord).

Format : `AAAA-MM-JJ` (année de 365 jours). Chaque entrée de journal et chaque notification porte cette date, avec un contexte : « En orbite — [système] » ou « En transit vers [système] ». La dilatation gravitationnelle n'y est pas encore comptée.

### L'observation est toujours du passé

Quand le joueur observe un système à 500 al, il voit son état d'il y a 500 ans. Le système actuel est inconnu. L'interface le signale systématiquement. À l'arrivée, un système peut être `CONFORME`, `ÉVOLUÉ` ou `DISPARU`.

---

## 3. Objets du jeu

Les objets fondamentaux du jeu sont : le **Vaisseau**, la **Population**, les **Traces**, les **Interprétations**, le **Carnet de Bord**, la **Carte** et l'**Équation de Drake**.

> Schémas JSON complets, types énumérés et règles de stockage : **`LACUNA_PROCEDURAL_DATA_MODEL.md`** §9.

### Le Vaisseau

Objet central, persistant, appartenant au joueur. Porte l'état de transit, les systèmes techniques (propulsion, coque, bouclier, observatoire, survie), le carburant (He³ + deutérium), et les références vers la population, le journal, la collection et la carte. États : `IDLE`, `IN_TRANSIT`, `ARRIVED`, `DAMAGED`.

### La Population

15 000 personnes au départ. Ce n'est pas un chiffre à optimiser — c'est une **texture narrative**. La variable clé est la **Volonté** (`will`, 0–1) : elle influence la capacité à interpréter des traces complexes et la tolérance aux voyages longs. Des événements rares et imprévisibles la font évoluer (schisme, épidémie, renaissance culturelle).

> Dynamiques de long terme : **`LACUNA_ARCS.md`** — arc générationnel, dérive culturelle, arc colonies.

### Les Traces

Objet fondamental. Tout ce que le joueur trouve, collecte, interprète et dépose. Quatre origines : `IMMUABLE` (créée par les développeurs, ancrée dans la vraie science), `GÉNÉRÉE` (procédurale à la première visite), `JOUEUR` (déposée par un autre joueur), `PRÉCURSEUR` (Yael — vaisseau humain parti avant le joueur, traces prédéfinies au format d'une trace joueur).

> Mécanique des traces et règles de conception : **`LACUNA_TRACES.md`**. Fiches des traces immuables : **`LACUNA_TRACES_IMMUABLES.md`** et **`LACUNA_SCENARIOS.md`**.

### Les Interprétations

Chaque trace accumule des interprétations de joueurs. Anonymes — pas de pseudo. Datées par la génération de voyage. Niveaux de confiance : `OBSERVATION`, `HYPOTHÈSE`, `CONVICTION`, `CERTITUDE`. Aucune n'est validée par le jeu.

### Le Carnet de Bord

Objet persistant, unique par vaisseau. Mélange d'entrées manuelles (joueur), automatiques (système) et générationnelles. Les entrées manuelles influencent la demi-vie culturelle à bord. Le serveur écrit seul les entrées automatiques et générationnelles ; le joueur n'écrit que les siennes (`LACUNA_UI.md`, module Journal de bord).

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

Une génération passe quand le vaisseau a accumulé suffisamment de distance et de temps simulé — ce n'est pas un timer fixe. Chaque passage conserve l'héritage complet et peut modifier la culture à bord. La génération en cours **colore** les nouvelles interprétations.

**Règle retenue (octobre 2026, migration `00069`)** — génération = 1 + (années du calendrier du vaisseau ÷ 25), à l'entier inférieur : la même règle que le coût générationnel de la vue de départ (`LACUNA_TRANSIT.md` §4). Le temps simulé vient des voyages, donc de la distance. Le serveur met le compteur à jour à l'arrivée de chaque voyage (`ships.generation`, `populations.generation`) ; il ne bouge pas pendant le transit.

**Entrées au journal** — à 25 ans par génération, un voyage vers Proxima en fait passer trois, et une semaine de jeu des milliers (`LACUNA_ARCS.md` §1.6). Une entrée par passage contredirait POP-001 (« quelques fois par campagne ») et `LACUNA_ARCS.md` §1.7 (pas de série d'événements notifiés). Seul le **premier passage** (génération 1 → 2) écrit une entrée `GENERATIONNEL`, datée de l'instant où le vaisseau franchit 25 ans, en transit (texte : `LACUNA_NOTIFICATIONS.md`, POP-001). Les passages suivants ne changent que le compteur, jusqu'à ce que d'autres entrées soient écrites (jalons, mythification).

**Population** — l'effectif reste à 15 000 : aucune règle démographique n'est définie. *Non implémenté : la coloration des interprétations par la génération.*

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
| Transit — phases, confirmation du départ, détection, déviation | `LACUNA_TRANSIT.md` |
| Traces — mécanique, types d'outputs, règles de conception | `LACUNA_TRACES.md` |
| Traces immuables — fiches système, Journal de Yael | `LACUNA_TRACES_IMMUABLES.md` |
| Anomalies astronomiques réelles — faits de référence | `LACUNA_ANOMALIES_REELLES.md` |
| Scénarios jouables | `LACUNA_SCENARIOS.md` |
| Hypothèses de fond (origine des traces) | `LACUNA_HYPOTHESES.md` |
| Arc générationnel, arc colonies, dérive culturelle | `LACUNA_ARCS.md` |
| Notifications | `LACUNA_NOTIFICATIONS.md` |
| Backoffice, architecture admin | `LACUNA_BACKOFFICE_SPEC.md` |

---

## 9. État d'implémentation (référence projet actuel)

*Cette section décrit ce qui est implémenté au 22 octobre 2026 et les écarts avec le design cible. Elle décrit la réalité du code ; le design des sections 1 à 8 reste la cible. Détail technique : `docs/reference/Documentation-fonctionnelle.md` et `Documentation-technique.md` (dépôt de développement).*

### Implémenté

| Domaine | Réalité projet |
|---------|----------------|
| **Comptes joueurs** | Email + mot de passe, email confirmé obligatoire. Écran « Bienvenue à bord » : pseudo (nom de commandant) et nom du vaisseau, privés et non uniques ; la partie démarre à Sol. Suppression de compte. Paramètres d'administration (admins) : accélération des voyages, réinitialisation de la partie. Site public (landing, pages légales, crédits). |
| **Vaisseau** | Tables `ships` + `ship_systems`. `current_system_id` (position = système courant), `travel_state`, `voyage`, `generation`, `travel_destination`, `travel_departure_at`, `travel_arrival_at`. Systèmes : propulsion, hull, plasma_shield, observatory, reservoir, alimentation, atmosphere, medical. Carburant He³/deutérium en tonnes. Pas de `position {x,y,z}` — dérivée du système courant. |
| **Transit** | Décidé par le serveur : RPC `start_transit` / `complete_transit` (migration `00050`), durée joueur par la table de référence (`LACUNA_PHYSICS.md` §2), mode test `transit_time_scale` réservé aux admins (interrupteur dans les paramètres, migration `00061`). Quatre phases calculées côté client, `[FIXER CAP]` verrouillé hors `COASTING`, vue de confirmation du départ, dérive stellaire, reprise après rechargement. Historique `ship_travels`. Détail : `LACUNA_TRANSIT.md` §10. |
| **Carte** | `map_nodes` ; onglets System / Map ; arêtes de la Map dérivées de `ship_travels` (visité = au moins une arête, observé = aucune). |
| **Observatoire** | Ciel (stellar_systems, coordonnées x/y/z), vue Système (planètes, zone habitable), vue Radar (spectrogramme temps réel, bruit de fond physique, pulsars, sélecteur de bande — `LACUNA_RECEPTION_MODULE.md`). |
| **Signaux** | Table `signals`, sources `system_objects` (PULSAR, etc.) ou `signal_events`. Durée de vie en temps joueur, [ANALYSER AU LABO]. Émetteurs du système courant (`EMITTER`, migration `00057`) : présents tant que le vaisseau y est, actifs seulement pendant leur fenêtre d'émission (temps réel), tracés sur le Radar. |
| **Laboratoire** | File d'observations, instruments (spectral, structure temporelle, polarisation, spectre énergétique, gravimétrique, stellaire, orbital, atmosphère, morpho, volumétrique, magnétomètre), rapports + Créer un artefact. |
| **Artefacts / Traces** | Traces Supabase, interprétations anonymes. |
| **Population** | Table `populations` (total, generation, will, social_cohesion…). Page à 3 onglets (Générations, Génération actuelle, Registre des Raisons). |
| **Drake** | Table `drake_equation`, affichage Header + Page Drake. |
| **Journal de bord** | Table `logbook_entries` (migration `00068`) : entrée fondatrice, départ et arrivée, événements du ciel de départ (SN-001, LPT-001) écrits par le serveur ; entrées du joueur ; filtre par type. Date du vaisseau (§2, Calendrier). Pas encore : notifications archivées, documents trouvés. |
| **Onboarding** | Écrans 1 à 4 avant le nommage « Bienvenue à bord », écran 5 en visite de sept étapes sur le ciel, traces embarquées (WOW, Oumuamua, Bennu) et message du premier départ (migration `00071`) — `LACUNA_LORE.md` §3–5. Notice de bord en tête du journal. |
| **Générations** | Compteur recalculé à l'arrivée de chaque voyage (1 + années simulées ÷ 25) ; entrée `GENERATIONNEL` au premier passage (migration `00069`). |

### Non implémenté (design cible uniquement)

| Domaine | Décrit dans |
|---------|-------------|
| **Détection en transit, déviation, carburant consommé** | `LACUNA_TRANSIT.md` §6–7, `LACUNA_PHYSICS.md` §5. |
| **Générations — suite** | §4 — effectif qui évolue, coloration des interprétations, entrées au-delà du premier passage. |
| **Dilatation gravitationnelle** | `LACUNA_PHYSICS.md` §3. Non calculée ni affichée. |
| **Traces immuables hors scénario, scénarios 03 à 08, entrées de Yael** | `LACUNA_TRACES_IMMUABLES.md`, `LACUNA_SCENARIOS.md`. Seuls le Fil des 75 (migration `00060`) et la structure de Yael (sans entrée) sont en base ; les 9 traces du seed sont visibles de tous. |
| **Galaxie procédurale à la visite** | Ciel alimenté par stellar_systems (HYG/NASA/seed). |

### Écarts code / design à corriger dans le code

*Corrigés dans le code (octobre 2026) : population de départ 15 000 (constante `INITIAL_POPULATION`, migration `00052` appliquée pour le défaut SQL) et génération de 25 ans (`ANNEES_PAR_GENERATION`). Équation de Drake alignée (`fl` = 0,30, N = 72, migration `00053` appliquée).*

| Écart | Design | Code actuel |
|-------|--------|-------------|
| Répartition des phases en temps joueur | À calibrer (`LACUNA_TRANSIT.md` §3, §11) | 40 / 20 / 10 / 30 % (`ship.js`) |

### Mapping objet Vaisseau (GDD §3) ↔ schéma actuel

| GDD (concept) | Projet (tables / store) |
|---------------|-------------------------|
| Position | `current_system_id` ; coordonnées dérivées de `stellar_systems.coordinates`. |
| Systèmes « survie » | `ship_systems.reservoir`, `.alimentation`, `.atmosphere`, `.medical`. |
| travelState, destination, dates | `ships.travel_state`, `.travel_destination`, `.travel_departure_at`, `.travel_arrival_at`. |
| Historique des voyages | `ship_travels` (une ligne par arrivée). |

---

*LACUNA — GDD v0.5 — Octobre 2026 — Confidentiel*
