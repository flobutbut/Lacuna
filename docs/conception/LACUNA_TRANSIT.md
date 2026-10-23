*Dernière modification : 2026-10-22*

# LACUNA — Le Transit
*Version 0.4 — Octobre 2026*

> Spécification complète du transit : définition, physique, états d'interface, vue de confirmation du départ, détection, déviation, animation de dérive stellaire, modèle de données. Ce document consolide et centralise tout ce qui concerne le voyage interstellaire de l'ARCA entre deux systèmes.
>
> Documents liés : `LACUNA_PHYSICS.md` (physique du voyage, profil d'accélération, carburant) · `LACUNA_UI.md` (interface générale, modules) · `LACUNA_NOTIFICATIONS.md` (famille Voyage) · `LACUNA_PROCEDURAL_DATA_MODEL.md` (schéma `travelState`)

*Confidentiel — Antigravity*

---

## Table des matières

1. [Définition](#1-définition)
2. [Physique du transit](#2-physique-du-transit)
3. [Les quatre phases](#3-les-quatre-phases)
4. [Vue de confirmation du départ](#4-vue-de-confirmation-du-départ)
5. [Interface pendant le transit](#5-interface-pendant-le-transit)
6. [Détection en transit](#6-détection-en-transit)
7. [Déviation de trajectoire](#7-déviation-de-trajectoire)
8. [Animation — dérive stellaire](#8-animation--dérive-stellaire)
9. [Population pendant le transit](#9-population-pendant-le-transit)
10. [Modèle de données et implémentation actuelle](#10-modèle-de-données-et-implémentation-actuelle)
11. [Questions ouvertes](#11-questions-ouvertes)

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 0.1 | Mars 2026 | Document initial — consolidation depuis `LACUNA_UI.md`, `LACUNA_PHYSICS.md`, `LACUNA_NOTIFICATIONS.md`, `LACUNA_PROCEDURAL_DATA_MODEL.md`, `LACUNA_ARCS.md` |
| 0.2 | Mars 2026 | Ajout §4 — Vue de confirmation du départ : séparation sémantique cap / moteurs, structure de la vue, phrases contextuelles, règle d'affichage du coût générationnel |
| 0.3 | Mars 2026 | §10 Modèle de données — alignement sur schéma SQL réel (colonnes `ships`), architecture retenue pour les phases (timestamps JSONB + computed client), champs non encore implémentés documentés. §11 questions ouvertes : vue de confirmation résolue |
| 0.4 | Octobre 2026 | Mise en cohérence avec `LACUNA_PHYSICS.md` v0.2 et le code. §2 : table de référence seule source des durées joueur, Étoile de Tabby à ~1 470 al, zone profonde 18 h – 6 jours. §3 : correction physique (la croisière est atteinte en ~0,39 an, y compris sur les voyages courts) ; la répartition des phases en temps joueur devient une convention explicite. §4 : seuils générationnels rendus continus (le seuil 1–2 / 3–10 laissait un trou), exemples Proxima et Gliese 667C corrigés. §5 : retournement réduit au Journal, comme le texte l'indiquait. §6 : Zeta Puppis de type O4. §10 : implémentation actuelle (transit décidé par le serveur, `ship_travels`, mode test). §11 : questions résolues et nouvelles |

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

À 0,12 g, la vitesse de croisière est atteinte en ~0,39 an, sur ~0,009 al. Tous les voyages, même les plus courts, sont donc parcourus physiquement à ~4,8 % c.

### Durées de référence

| Destination | Distance | Durée physique | Durée joueur |
|-------------|----------|---------------|-------------|
| Proxima Centauri | 4,24 al | 88 ans | **1h** |
| Tau Ceti | 11,9 al | 248 ans | **2h24** |
| Gliese 667C | 22 al | 458 ans | **3h54** |
| Point d'étalonnage — zone profonde | 1 280 al | 26 600 ans | **1,7 jours** |
| Centre galactique | 26 000 al | 541 000 ans | **14 jours** |
| Bord opposé | 100 000 al | 2 083 333 ans | **90 jours** |
| *Étoile de Tabby (interpolée)* | *~1 470 al* | *~30 600 ans* | ***~1,8 jours*** |

### Compression temporelle

La durée joueur est obtenue par **interpolation linéaire par morceaux** entre les points de la table de référence — c'est la règle implémentée côté client (`src/lib/transit.js`) et côté serveur (`transit_player_seconds`). Elle est calibrée sur deux contraintes fixes : Proxima = 1h joueur / bord opposé = 90 jours joueur.

La vitesse physique est la même pour toutes les destinations ; c'est le taux de compression qui varie (88 ans simulés par heure pour Proxima, ~960 ans par heure pour le bord opposé). Aller loin coûte proportionnellement moins de temps joueur : c'est une convention de jeu assumée, pas un effet physique. Détail et historique (loi puissance abandonnée) : `LACUNA_PHYSICS.md` §2.

### Zones de jeu

| Zone | Distance | Durée joueur | Rythme |
|------|----------|-------------|--------|
| Voisinage | < 25 al | 1h – 4h | Explorable en une session |
| Zone intermédiaire | 25 – 500 al | 4h – 18h | Une nuit de voyage |
| Zone profonde | 500 – 10 000 al | 18h – 6 jours | Expédition |
| Destinations mythiques | > 10 000 al | 6 – 90 jours | Odyssée |

### Dilatation par la vitesse

Ignorée. À 4,8% c, γ_v ≈ 1,0012 — soit ~10h de décalage par an de transit, sans gain narratif suffisant. La dilatation gravitationnelle, elle, s'applique en orbite proche d'objets massifs (voir `LACUNA_PHYSICS.md` §3).

---

## 3. Les quatre phases

### Répartition en temps joueur — convention

Physiquement, l'accélération et la décélération durent chacune ~0,39 an : sur un voyage vers Proxima (88 ans, 1h joueur), cela représenterait une quinzaine de secondes. Pour que chaque phase soit perceptible et jouable, la durée des phases **en temps joueur** est une convention d'interface, indépendante de leur durée physique.

Implémentation actuelle (`src/stores/ship.js`, provisoire) : accélération 0–40 % de la durée joueur, inertie 40–60 %, retournement 60–70 %, décélération 70–100 %. Calibration à revoir (§11).

### Phase 1 — Accélération (`ACCELERATING`)

Moteur MTF allumé à poussée constante depuis l'arrêt jusqu'à la vitesse de croisière. Consomme du carburant He³. Interface réduite — le voyage est lancé, rien ne peut l'arrêter.

### Phase 2 — Inertie (`COASTING`)

Moteur éteint. Vitesse constante. Aucun carburant consommé. C'est physiquement la phase la plus longue de tout voyage, et la plus riche en jeu : l'observatoire tourne en continu, les anomalies latérales apparaissent progressivement dans le champ de détection, des notifications arrivent, une déviation est possible.

Sur les voyages du voisinage (< 25 al), la fenêtre d'inertie ne dure que quelques minutes de temps joueur. La détection latérale y est pratiquement sans objet — non pour une raison physique, mais parce que le joueur n'a pas le temps d'une décision.

### Phase 3 — Retournement (`TURNING`)

Le vaisseau se retourne sur son axe pour présenter ses moteurs dans le sens du voyage. Manœuvre délicate, coût carburant mineur. La destination apparaît pour la première fois dans le champ visuel avant. Une entrée automatique est créée dans le journal.

### Phase 4 — Décélération (`DECELERATING`)

Moteur rallumé, même poussée qu'en phase 1, appliquée en sens inverse. Consomme autant de carburant que la phase d'accélération. Le vaisseau arrive à vitesse quasi nulle à destination.

---

## 4. Vue de confirmation du départ

### Principe

Fixer un cap et lancer les moteurs sont deux actes distincts. L'un est une décision de navigation — choisir une direction. L'autre est un ordre aux machines — déclencher une séquence irréversible qui engagera plusieurs générations. La vue de confirmation matérialise cette séparation.

Ce n'est pas un écran de vérification technique. Ce n'est pas une liste de jauges ni un avertissement. C'est un moment — sobre, presque vide — entre la décision et ses conséquences.

### Structure

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Cap fixé — [Nom du système] — [Distance] al       │
│                                                     │
│   [Durée estimée] — [Durée physique] — [N] gén.    │
│                                                     │
│   [Phrase contextuelle]                             │
│                                                     │
│                  [ ALLUMER LES MOTEURS ]            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Le ciel reste visible en arrière-plan. La destination est identifiée dans le ciel. Aucune autre action disponible — le joueur peut fermer la vue (`[ANNULER]`) pour revenir à l'Observatoire sans partir.

### Coût générationnel — règle d'affichage

Le coût générationnel est toujours affiché sous forme de donnée brute :

```
[Durée estimée] — [Durée physique] — [N] générations
```

Cette ligne est systématique, quel que soit le voyage. C'est de l'information. `N` = durée physique / 25 ans, arrondi à l'entier inférieur.

Une phrase contextuelle s'y ajoute uniquement au-delà d'un seuil significatif. C'est du poids. Elle apparaît sur une ligne séparée, dans le même registre factuel que le reste — pas de mise en forme spéciale.

**Seuils et phrases** — les seuils suivent la durée physique ; le seuil de 100 ans correspond à la limite d'une vie humaine, ce qui rend chaque phrase factuellement exacte.

| Durée physique | Générations (25 ans) | Phrase |
|---------------|-----------|--------|
| < 25 ans | < 1 | *(silence)* |
| 25 – 100 ans | 1 – 3 | `La génération actuelle ne verra pas l'arrivée.` |
| 100 – 250 ans | 4 – 9 | `Personne vivant à bord aujourd'hui ne sera en vie à l'arrivée.` |
| 250 – 25 000 ans | 10 – 999 | `[N] générations naîtront et mourront avant l'arrivée.` |
| ≥ 25 000 ans | ≥ 1 000 | `L'arrivée est une abstraction pour les personnes qui partent aujourd'hui.` |

Le silence sur les voyages très courts est une décision. Si la phrase apparaît à chaque départ, elle devient un tic d'interface et perd son poids. La première fois que le joueur lit "personne vivant à bord aujourd'hui ne sera en vie à l'arrivée", ce doit être une rupture — pas une habitude.

*Note — à 4,8 % c, toute destination au-delà de ~1,2 al dépasse 25 ans : en pratique, seul un saut très court reste silencieux. Le seuil du silence est à reconsidérer si la phrase « La génération actuelle ne verra pas l'arrivée » apparaît trop souvent dans le voisinage (§11).*

### Phrases supplémentaires — conditions contextuelles

Ces phrases s'ajoutent à la phrase générationnelle si la condition est remplie. Une seule phrase supplémentaire à la fois, par ordre de priorité décroissante.

| Condition | Phrase |
|-----------|--------|
| Premier transit depuis Sol | `Sol restera visible depuis la destination.` ¹ |
| Destination jamais visitée | `Aucun vaisseau n'a encore atteint ce système.` |
| Destination visitée — trace connue | `Une trace a été déposée dans ce système. Génération [N] — vaisseau inconnu.` |
| Destination précédemment abandonnée | `Cap original. Ce système avait été abandonné lors du transit [date simulée].` |
| Bouclier plasma dégradé (< 0.7) | `Bouclier plasma dégradé. Vitesse de croisière réduite à [X]% c.` |
| Carburant insuffisant pour le retour | `Carburant disponible : aller simple.` |
| Étoile de type O ou B | `Type [spectral]. Statut à l'arrivée : inconnu.` |

¹ Factuellement vrai uniquement pour les destinations proches où Sol reste dans le champ de résolution visuelle. Désactivé automatiquement au-delà.

### Exemple complet — Proxima Centauri, premier transit

```
Cap fixé — Proxima Centauri — 4,24 al

1h estimée — 88 ans simulés — 3 générations

La génération actuelle ne verra pas l'arrivée.
Sol restera visible depuis la destination.

                    [ ALLUMER LES MOTEURS ]
```

### Exemple — Gliese 667C, carburant limité

```
Cap fixé — Gliese 667C — 22 al

3h54 estimées — 458 ans simulés — 18 générations

18 générations naîtront et mourront avant l'arrivée.
Carburant disponible : aller simple.

                    [ ALLUMER LES MOTEURS ]
```

---

## 5. Interface pendant le transit

### Tableau de disponibilité

| Module | Accélération | Inertie | Retournement | Décélération |
|---|---|---|---|---|
| Journal de bord | ✓ | ✓ | ✓ | ✓ |
| Collection traces | ✓ | ✓ | — | ✓ |
| Équation de Drake | ✓ | ✓ | — | ✓ |
| Population | ✓ | ✓ | — | ✓ |
| Systèmes vaisseau | ✓ | ✓ | — | ✓ |
| Carte | ✓ | ✓ | — | ✓ |
| Observatoire (passif) | — | ✓ | — | — |
| Laboratoire | — | ✓ | — | — |
| Navigation / Déviation | — | ✓ | — | — |

Ce tableau fait référence ; `LACUNA_PHYSICS.md` §4 y renvoie.

### Accélération et décélération

Interface réduite. Le ciel reste visible mais non interactif. Le panel gauche affiche la vitesse et la progression. Clic sur une étoile : sélection uniquement — modale sans bouton `[FIXER CAP]`.

### Inertie

Phase la plus riche. Le ciel redevient interactif pour la déviation uniquement. L'Observatoire passe en mode passif. Le Laboratoire est disponible pour analyser les signaux déjà captés. Une déviation peut être initiée.

### Retournement

Interface réduite au Journal uniquement. Moment narratif court.

### Tokens visuels pendant le transit

| Élément | Rendu |
|---------|-------|
| Destination | Ligne de trajectoire cyan, opacity 0.3 — cible du cap en ambre |
| Progression | Panel gauche — barre + vitesse courante |
| Phase courante | Affiché dans le header (`TRANSIT — J+N`) |

---

## 6. Détection en transit

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
Type O4 — âge estimé : ~3 Ma.
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

## 7. Déviation de trajectoire

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

## 8. Animation — dérive stellaire

> *Implémentée (position du vaisseau interpolée via `Date.now()`). Questions ouvertes documentées en §11.*

### Principe

Pendant le transit, le ciel de l'Observatoire n'est pas statique. Les étoiles dérivent lentement selon leur parallaxe apparente depuis la position courante du vaisseau. Les étoiles proches se déplacent visiblement par rapport au fond galactique ; les lointaines restent quasi fixes.

L'animation est un rendu honnête — pas une illustration métaphorique du voyage. Elle est calculée depuis les coordonnées HYG (ra, dec, distance en parsecs) et la position interpolée du vaisseau sur sa trajectoire balistique. Un joueur qui connaît le ciel peut identifier sa progression par la géométrie des étoiles proches.

### Calcul de position

La position du vaisseau à chaque instant est dérivée de la progression du transit en temps joueur. La parallaxe stellaire s'en déduit directement.

### Vitesse de dérive et compression temporelle

La vitesse de dérive est proportionnelle à la vitesse de déplacement réelle du vaisseau, normalisée par la durée joueur du voyage. Il n'y a pas de seuil franc — la vitesse est un continuum :

- Voisinage (1h–4h joueur) : dérive lente, perceptible, présence contemplative.
- Zone intermédiaire et au-delà : dérive accélérée proportionnellement à la compression temporelle — le ciel se réorganise plus vite, signalant l'échelle du saut sans l'expliciter.

### Disponibilité

L'animation est active pendant les phases d'accélération, d'inertie et de décélération. Elle s'arrête à l'arrivée — le ciel se fige sur la nouvelle position. En retournement, le comportement est à définir (changement d'axe visuel brutal ou fondu).

### Lien avec les scénarios

Un usage narratif est envisagé mais non encore défini : une étoile dont la parallaxe observée pendant le transit ne correspond pas à sa distance cataloguée pourrait constituer une trace déclenchée par le mouvement lui-même. À développer à l'élaboration des scénarios.

---

## 9. Population pendant le transit

### Échelle générationnelle

Sur les transits du voisinage (88–460 ans simulés), plusieurs générations passent pendant que le joueur attend. La génération qui a vu le départ n'est pas celle qui verra l'arrivée. Ce fait n'est jamais formulé explicitement par l'interface — il se déduit de l'arithmétique.

À 25 ans par génération :
- Proxima (88 ans simulés) : ~3–4 générations
- Tau Ceti (248 ans simulés) : ~10 générations
- Centre galactique (541 000 ans simulés) : ~21 600 générations

Sur l'échelle des transits normaux (quelques milliers d'années), la population reste génétiquement *Homo sapiens*. Les dérives biologiques significatives n'apparaissent qu'à des échelles de stationnement dilatant prolongé — voir `LACUNA_ARCS.md`.

### Effets culturels

Un transit long sans capitaine produit un effet documenté : +400 ans de demi-vie culturelle, avec une crise à bord et une figure mythologique au retour (`LACUNA_ARCS.md` §1.10, levier 3).

L'asymétrie fondamentale : pendant un transit long, des générations passent pendant que le joueur attend. Pendant un stationnement dilatant long, des générations passent pendant que le joueur est immobile. Dans le premier cas, le temps passe malgré lui. Dans le second, il a délibérément choisi la rupture.

---

## 10. Modèle de données et implémentation actuelle

### Schéma SQL actuel — table `ships`

Le transit est stocké en colonnes dédiées, pas dans un JSONB `travelState`. `travel_state` est un ENUM PostgreSQL.

| Colonne | Type SQL | Description |
|---------|----------|-------------|
| `travel_state` | ENUM `ship_travel_state` | `IDLE` / `IN_TRANSIT` / `ARRIVED` / `DAMAGED` |
| `travel_destination` | TEXT FK → `stellar_systems(id)` | Système cible |
| `travel_departure_at` | TIMESTAMPTZ | Horodatage réel du départ |
| `travel_arrival_at` | TIMESTAMPTZ | Horodatage réel estimé d'arrivée |
| `voyage` | INT | Numéro de voyage — incrémenté à chaque arrivée |

### Implémentation actuelle (octobre 2026)

- **Transit décidé par le serveur** (migration `00050_transit_rpc.sql`) : `start_transit(destination)` calcule la distance et la durée joueur, fixe l'heure d'arrivée ; `complete_transit()` valide l'arrivée quand l'horloge du serveur l'atteint. Le client n'écrit plus lui-même l'état du transit.
- **Historique des voyages** : table `ship_travels`, une ligne par arrivée (`origin_system_id`, `destination_system_id`, `departure_at`, `arrival_at`, `distance_al`, `voyage_number`), écrite par le serveur. Elle alimente les arêtes de la Carte (`LACUNA_CARTE_MAP.md`).
- **Mode test** : réglage `transit_time_scale` dans `game_settings` (valeur actuelle : 5 s pour 1 h joueur). Remis à 1 pour le jeu réel.
- **Phases** : calculées côté client par ratio de la progression (§3) ; `[FIXER CAP]` verrouillé hors `COASTING`.
- **Interface** : cartouche « IN TRANSIT » au-dessus du réticule (clic → recentrage animé), header « origine → cible — XX % », cible du cap en ambre, dérive stellaire.
- **Reprise après rechargement** : le transit reprend depuis les horodatages en base.

### Colonne prévue — `travel_phase_timestamps`

Pour figer les phases (et permettre la déviation), une colonne JSONB est prévue :

```sql
ALTER TABLE ships ADD COLUMN travel_phase_timestamps JSONB;
```

Structure de la valeur :

```json
{
  "acceleratingEnd": "2026-03-19T14:12:00Z",
  "coastingEnd":     "2026-03-19T14:48:00Z",
  "turningEnd":      "2026-03-19T14:50:00Z",
  "deceleratingEnd": "2026-03-19T15:00:00Z"
}
```

Calculé une seule fois à la confirmation du départ. Ne change plus sauf en cas de déviation. **Non implémentée à ce jour.**

### Logique de phase — architecture retenue

La phase courante n'est **pas persistée** en base sous forme d'enum. Elle est **calculée côté client** :

```
phase courante = f(travel_phase_timestamps, Date.now())
```

Tant que `travel_phase_timestamps` n'existe pas, elle est dérivée du ratio de progression (`currentTransitPhase` dans `ship.js`). `travel_state` (ENUM) reste : `IDLE` / `IN_TRANSIT` / `ARRIVED` / `DAMAGED`.

`diversionAvailable` est un computed Pinia dérivé de la phase courante — `true` uniquement pendant `COASTING`. Non persisté en base.

### Champs documentés non encore implémentés

| Champ | État | Note |
|-------|------|------|
| `distanceTotal` | Persisté dans `ship_travels.distance_al` à l'arrivée | Recalculé à la demande pendant le transit |
| `fuelBudgeted` | Non implémenté | En attente de la mécanique carburant |
| `detectedInTransit` | Non implémenté | En attente de la mécanique de déviation |
| `originalDestination` | Non implémenté | En attente de la mécanique de déviation |

---

## 11. Questions ouvertes

**Vue de confirmation du départ**
- ~~Le joueur peut-il fermer la vue et revenir à l'Observatoire sans partir ?~~ — Résolu : oui, bouton `[ANNULER]` implémenté, annule le cap.
- Sol visible depuis la destination : calculer dynamiquement depuis la magnitude limite de l'Observatoire, ou seuil fixe en distance ?
- Priorité d'affichage si plusieurs phrases contextuelles sont simultanément valides — la table en §4 définit un ordre, à confirmer à l'implémentation.
- Seuil du silence : à 4,8 % c, presque tous les voyages dépassent 25 ans. Faut-il relever le seuil (par exemple sous 100 ans) pour préserver la rareté de la première phrase ?

**Phases de transit**
- Répartition des phases en temps joueur (§3) : la convention actuelle 40/20/10/30 donne une inertie courte. Calibration à décider — l'inertie est la phase de jeu (détection, déviation), elle devrait probablement dominer sur les longs voyages.
- `TURNING_DURATION_MS` : durée fixe du retournement en temps réel joueur — valeur à calibrer (proposition initiale : 2 minutes réelles).
- ~~La formule `t_joueur = K × t_physique ^ 0.762` est documentée mais non implémentée~~ — Résolu en v0.4 : la table de référence est la seule règle (`LACUNA_PHYSICS.md` §2).

**Écart code / design**
- Le code compte une génération pour **80 ans** (`ANNEES_PAR_GENERATION` dans `src/lib/transit.js`) ; tous les documents de design utilisent **25 ans**. Proxima affiche donc « 1,1 génération » au lieu de 3. À aligner dans le code.

**Animation — dérive stellaire**
- Seuil perceptible minimal : en dessous de quelle distance la dérive est-elle trop lente pour être remarquée ? À calibrer.
- La ligne de trajectoire cyan reste-t-elle affichée pendant la dérive, ou disparaît-elle pour laisser le ciel seul ?
- Comportement en retournement : la dérive change-t-elle d'axe visuellement ? Fondu ? Instantané ?
- Si le joueur dévie en phase d'inertie, la dérive change-t-elle de direction progressivement (courbe balistique) ou instantanément ?
- Usage narratif dans les scénarios : étoile dont la parallaxe ne correspond pas à sa distance cataloguée — à définir.

**Détection et déviation**
- Volume maximum de `detectedInTransit[]` : toutes les détections sont-elles conservées ou seulement les actionnables ?
- Le joueur peut-il consulter les systèmes détectés mais non déviés après l'arrivée ? (Traces d'une route non prise.)
- Comportement si deux détections arrivent simultanément en phase d'inertie courte.

**Population**
- Le journal de bord reçoit-il des entrées automatiques sur les naissances et morts pendant un long transit ? À quel rythme ?
- Une faction peut-elle rejoindre le vaisseau en transit si une colonie échoue ? (Réponse probable : non — cohérent avec la physique et la solitude réelle.)

---

*LACUNA — Le Transit v0.4 — Octobre 2026 — Confidentiel*
