*Dernière modification : 2026-03-15 20:35*

# LACUNA — Scénarios
*Version 0.3 — Mars 2026*

> Ce document décrit les **arcs narratifs jouables** : des séquences de traces qui, ensemble, racontent quelque chose et mènent quelque part. Complémentaire de `LACUNA_TRACES.md` — le catalogue documente chaque trace individuellement, les scénarios documentent comment elles se relient et ce qu'elles impliquent collectivement.

---

## Table des matières

1. [Philosophie des scénarios](#1-philosophie-des-scénarios)
2. [Grammaire d'un scénario](#2-grammaire-dun-scénario)
3. [Scénario 00 — Modèle de fiche vierge](#3-scénario-00--modèle-de-fiche-vierge)
4. [Scénario 01 — Yael](#4-scénario-01--yael)
5. [Scénario 02 — Le Fil des 75](#5-scénario-02--le-fil-des-75)
6. [Scénario 03 — Le Témoin](#6-scénario-03--le-témoin)
7. [Scénario 04 — La Guerre Stellaire](#7-scénario-04--la-guerre-stellaire)
8. [Scénario 05 — Les Explorateurs](#8-scénario-05--les-explorateurs)
9. [Scénario 06 — Les Colonisateurs](#9-scénario-06--les-colonisateurs)
10. [Scénario 07 — La Propagation](#10-scénario-07--la-propagation)
11. [Scénario 08 — L'Intelligence](#11-scénario-08--lintelligence)
12. [Règles générales pour les futurs scénarios](#12-règles-générales-pour-les-futurs-scénarios)
## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 0.1 | Mars 2026 | Document initial — philosophie, grammaire, Scénario 02 Le Fil des 75 (issu de LACUNA_SIMULATION_PHASE1.md §5), Scénario 00 fiche vierge |
| 0.2 | Mars 2026 | Ajout Scénarios 02 à 07 — Le Témoin, La Guerre Stellaire, Les Explorateurs, Les Colonisateurs, La Propagation, L'Intelligence. Tous au statut ébauche/structure posée. |
| 0.3 | Mars 2026 | Ajout Scénario 01 — Yael (onboarding). Renumérotation Scénarios 01→02 … 07→08. |

---

## 1. Philosophie des scénarios

### Ce qu'un scénario est

Un scénario dans LACUNA est une **séquence de traces distribuées géographiquement** qui partagent une grammaire commune — un matériau, une fréquence, un ratio, un pattern — et qui convergent vers une question de niveau supérieur à chacune des traces prises isolément.

Un scénario ne se raconte pas. Il se découvre. Il ne s'explique pas. Il s'accumule.

Le joueur n'est jamais informé qu'il suit un scénario. Il le reconstruit lui-même, par ses interprétations et ses croisements. La cohérence est dedans — pas dans une progression balisée.

### Ce qu'un scénario n'est pas

- Ce n'est pas une quête avec des étapes cochables
- Ce n'est pas une histoire avec un début, un milieu et une fin définis
- Ce n'est pas un contenu exclusif — plusieurs joueurs indépendants peuvent traverser le même scénario sans jamais interagir
- Ce n'est pas résolu : même à l'issue d'un scénario, la question finale reste ouverte

### Relation avec les traces immuables

Les traces d'un scénario sont des traces immuables ordinaires — elles figurent dans `LACUNA_TRACES.md` comme toutes les autres. Leur appartenance à un scénario est indiquée dans le champ `scenarioArc`. Un joueur peut collecter une trace de scénario sans jamais réaliser qu'elle fait partie d'une séquence plus large. C'est voulu.

### Relation avec la séquence secrète

Certains scénarios peuvent avoir un nœud de convergence de niveau 4 — une trace secrète qui ne devient accessible qu'une fois plusieurs traces du même scénario collectées. Ce nœud fait le lien avec la séquence secrète telle que définie dans `LACUNA_GDD.md` §6.

### Multiplicité

Il n'y a pas un seul scénario. Il peut y en avoir plusieurs actifs simultanément, dans des zones géographiques différentes, avec des grammaires différentes. Un joueur n'en traversera peut-être qu'un ou deux dans sa campagne. D'autres seront découverts par d'autres joueurs, d'autres vaisseaux, d'autres générations.

---

## 2. Grammaire d'un scénario

### Structure type

```
SCN
├── Nom et résumé narratif
├── Zone géographique principale
├── Grammaire commune (ce qui relie les traces entre elles)
│
├── Nœuds d'entrée (traces de difficulté 1–2, accessibles sans prérequis)
├── Nœuds intermédiaires (difficulté 2–3, enrichis par les nœuds d'entrée)
├── Nœud de convergence (difficulté 3–4, accessible seulement avec contexte accumulé)
│
├── Question terminale (ce que le scénario pose — jamais une réponse)
└── Extensions possibles (pistes vers d'autres zones, d'autres systèmes)
```

### Propriétés d'un scénario bien conçu

| Propriété | Description |
|-----------|-------------|
| **Entrée multiple** | Le joueur peut entrer dans le scénario par n'importe quel nœud d'entrée — pas d'ordre obligatoire |
| **Cohérence progressive** | Chaque trace supplémentaire enrichit les précédentes rétrospectivement |
| **Question déductible** | La question terminale doit être atteignable par déduction — pas par devinette |
| **Résistance à la résolution** | Le scénario ne se referme jamais complètement — il ouvre toujours sur une question de niveau supérieur |
| **Distribution géographique** | Les nœuds sont espacés — traverser le scénario implique des voyages, des générations |
| **Ambiguïté de la grammaire** | Le lien entre les traces n'est pas évident immédiatement — il se révèle par accumulation |

### Fiche de nœud

Chaque trace appartenant à un scénario dispose d'une fiche complète dans ce document, en plus de son entrée dans `LACUNA_TRACES.md` :

```
Désignation
Type de trace
Difficulté
Système et distance depuis Sol

Ce que le joueur trouve
  [description détaillée des données brutes]

Ce que les données disent
  [faits établis avec degré de confiance]

Ce que les données ne disent pas
  [les questions ouvertes — jamais comblées par le document]

Lien avec la grammaire du scénario
  [comment cette trace s'inscrit dans la séquence — visible rétrospectivement]

Pointe vers
  [autres nœuds que cette trace rend plus lisibles]
```

---

## 3. Scénario 00 — Modèle de fiche vierge

*Statut : modèle de référence — fiche vierge à copier pour tout nouveau scénario*

---

### 5.1 Utilisation

Copier cette section pour créer un nouveau scénario. Remplir tous les champs. Ne pas modifier ce modèle.

---

### 5.2 En-tête

```
Nom          : [Nom du scénario]
Code         : scénario-XX
Type         : EXPLORATION / SEQUENCE / HYBRIDE
Statut       : ébauche / en développement / actif
Zone         : voisinage / intermédiaire / profonde / galactique
Hypothèse    : [Référence LACUNA_HYPOTHESES.md si applicable]
```

### 5.3 Présentation

[Description du concept central — 3 à 5 lignes. Ce que ce scénario pose comme question, ce qui le distingue des autres.]

### 5.4 Grammaire commune

| Élément | Valeur |
|---------|--------|
| Types de traces dominant | |
| Signature physique | |
| Distribution géographique | |
| Question terminale | |

### 5.5 Nœuds

```
Scénario XX
├── Nœud d'entrée 01 : [système — à définir]
├── Nœud d'entrée 02 : [système — à définir]
├── Nœud intermédiaire : [système — à définir]
└── Nœud de convergence : [système — à définir]
```

### 5.6 Questions ouvertes

- [Question 1]
- [Question 2]

### 5.7 À développer

- [ ] Grammaire commune
- [ ] Systèmes d'ancrage
- [ ] Fiches de nœuds
- [ ] Question terminale

---

## 4. Scénario 01 — Yael

*Statut : ébauche — dispositif d'onboarding*
*Type : ONBOARDING — séquence d'entrée dans le jeu*
*Zone : voisinage solaire — < 25 al*
*Hypothèse associée : H-02 — Yael → `LACUNA_HYPOTHESES.md`*

---

### 1.1 Présentation

Yael est un vaisseau générationnel parti avant le joueur, dans le cadre d'une vague du programme ARCA antérieure. Quelques décennies d'avance, peut-être un siècle. Le joueur ne le sait pas immédiatement.

Yael n'est pas une personne. C'est une désignation retrouvée dans une trace — un prénom, un acronyme de mission, ou le nom que les générations suivantes à bord ont donné à leur propre vaisseau. Le joueur ne le saura jamais avec certitude.

C'est la seule trace dont le joueur peut déduire avec certitude qu'elle est humaine. Ce qui en fait quelque chose de profondément différent de toute trace extraterrestre — et potentiellement plus troublant. On sait d'où il vient. On ne sait pas où il est allé.

---

### 1.2 Fonction dans le jeu

Yael est un **dispositif d'onboarding** : ses traces enseignent la mécanique du module Traces avant de confronter le joueur à des anomalies extraterrestres ambiguës. Elles calibrent l'expérience émotionnelle — on n'est pas seul, mais ceux qui sont partis avant ne répondent plus.

La confusion est intentionnelle dans les premières entrées. Dans le module Traces, une entrée de Yael ressemble à une trace joueur ordinaire — même format, même présentation. La différence n'est perceptible qu'à la lecture : la voix est différente, la datation est ancienne.

---

### 1.3 Grammaire des traces

| Élément | Valeur |
|---------|--------|
| Type | Trace narrative — tag `PRÉCURSEUR` |
| Signature | Texte en langage naturel légèrement archaïque, datation générationnelle ancienne |
| Ancienneté | Quelques décennies à quelques siècles avant le départ du joueur |
| Distribution | Systèmes proches de Sol, zone < 25 al — premiers voyages |
| Densité | Dense dans le voisinage, s'espacent en zone intermédiaire, rares en zone profonde |
| Désignation | `[SYSTEME]-YAEL-[ORDRE]` |

---

### 1.4 Ce que le scénario implique

- D'autres humains sont partis avant le joueur. Il n'est pas le premier.
- Ces précurseurs ont cherché aussi — et ont déjà annoté des traces extraterrestres. Le joueur trouve une couche humaine sur une couche inconnue.
- Le joueur peut suivre le sillage de Yael comme une piste — sans jamais savoir où elle mène.
- Yael pourrait avoir trouvé quelque chose que le joueur n'a pas encore trouvé.

---

### 1.5 Ce que ce scénario ne résout pas

- Le sort du vaisseau Yael — en route, arrivé, disparu, devenu une colonie ?
- Si Yael a interprété correctement les traces qu'il a annotées
- S'il existe d'autres précurseurs humains avec des trajectoires différentes
- Si le silence de Yael dans la zone profonde signifie qu'il a cessé d'écrire, ou qu'il n'est plus

---

### 1.6 Règles de conception

- **Maximum 2 traces** dans la zone d'onboarding — ne pas sur-écrire
- **Pas de conclusion** sur ce qui lui est arrivé — l'absence est aussi importante que les traces
- **Ton évolutif** — les premières entrées sont proches, humaines, reconnaissables ; les dernières sont distantes, peut-être méconnaissables
- Le scénario ne se referme jamais — Yael reste une question ouverte pour toute la durée du jeu

---

### 1.7 À développer

- [ ] Écrire les fragments canoniques (2 minimum dans le voisinage)
- [ ] Définir les systèmes d'ancrage
- [ ] Définir le ton des premières entrées vs les dernières
- [ ] Table de relation entre les entrées de Yael et les scénarios extraterrestres qu'il effleure

---

## 5. Scénario 02 — Le Fil des 75

*Statut : actif — en développement*
*Zone principale : voisinage solaire (< 25 al) + extensions vers zone intermédiaire*
*Origine : émergé de la simulation de jeu Phase 1 — voir `LACUNA_SIMULATION_PHASE1.md` §5*

---

### 3.1 Présentation

Un constructeur inconnu a laissé des artefacts dans au moins quatre sites du voisinage solaire. Tous partagent une grammaire commune : matériaux réfractaires, espacement de gravures à 4,7 mm, ratio d'interruption 1/75. Tous datent d'au moins 3,5 milliards d'années.

La question n'est pas *qui*. C'est *pourquoi 75*.

Le constructeur n'est pas nommé dans le jeu. Il n'a pas de nom, pas de civilisation, pas d'histoire fournie. Il n'existe que par ses artefacts — et par les questions qu'ils posent.

Ce que ce scénario ne fait pas : il ne révèle pas l'identité du constructeur. Il ne confirme pas ses intentions. Il approfondit la question jusqu'à ce qu'elle devienne irréductible.

---

### 3.2 Grammaire commune

| Élément | Valeur |
|---------|--------|
| Matériau | Métaux réfractaires × 10 concentration normale, carbone amorphe |
| Gravures | Espacement 4,7 mm ± 0,01 — précision non naturelle |
| Ratio | 1/75 — interruption à la ligne 75 dans toutes les séquences |
| Fréquence associée | 1420 MHz (raie de l'hydrogène) — signal synchronisé à l'aube sur deux planètes |
| Ancienneté | 3,5 à 4,8 milliards d'années — contemporain des premiers océans terrestres |
| Localisation préférentielle | Planètes en zone habitable, ou en orbite autour d'elles |

---

### 3.3 Nœuds du réseau

---

#### TRACE-001 — Proxima Centauri b

```
Désignation   : PROXIMA-SCN01-001
Type          : SIGNAL + ANOMALIE_GEOMETRIQUE
Difficulté    : 1 (signal) — 2 (surface)
Système       : Proxima Centauri — 4,24 al
scenarioArc   : scn-01-fil-des-75
```

**Ce que le joueur trouve**

À l'arrivée : signal radio à 1420 MHz émis depuis le terminateur de Proxima b — la ligne de frontière perpétuelle entre la face illuminée et la face sombre de cette planète verrouillée tidalement. Périodicité 73 secondes. Polarisation circulaire gauche. Non corrélé aux émissions stellaires.

Scan approfondi du terminateur : surface polie sur ~3 m², érosion insuffisante pour l'âge du site. Sous la surface — cavité souterraine, écho radar anormal, géométrie non naturelle.

**Ce que les données disent**

- Signal à fréquence raie hydrogène : corrélation avec activité stellaire < 3%
- Surface polie : taux d'érosion incompatible avec l'âge estimé du sol environnant
- Cavité : dimensions non mesurables depuis la surface

**Ce que les données ne disent pas**

- Origine du signal — naturel ou émis ?
- Nature et contenu de la cavité
- Lien entre le signal et la surface polie
- Pourquoi le terminateur spécifiquement

**Lien avec la grammaire du scénario**

Le terminateur de Proxima b est une aube permanente. Le signal est synchronisé à cette aube — ou plutôt, à la condition de l'aube : frontière lumière/obscurité. Cette lecture ne devient évidente qu'après Ross 128 b.

**Pointe vers**

- Systèmes avec planètes en zone habitable + signal 1420 MHz
- Ross 128 b — même fréquence, même synchronisation à l'aube, planète différente

---

#### TRACE-002 — Ross 128 b

```
Désignation   : ROSS128-SCN01-001
Type          : SIGNAL + ANOMALIE_CHIMIQUE + BIOLOGICAL
Difficulté    : 1 (signal) — 2 (vie)
Système       : Ross 128 — 11,0 al
scenarioArc   : scn-01-fil-des-75
```

**Ce que le joueur trouve**

Signal à 1420 MHz — zone tempérée de Ross 128 b — synchronisé à l'aube locale. Fenêtre d'émission : 40 minutes par cycle de 61 heures. Durée de fenêtre identique à la durée d'exposition du terminateur de Proxima b.

Module récupérable déployé sur tapis organique en zone tempérée : réponse lumineuse à l'exposition. Acides aminés identifiés — dont deux sans équivalent terrestre connu. Analyse laboratoire : vie multicellulaire confirmée, ancienneté estimée 40 000 ans sur site.

**Ce que les données disent**

- Signal : temporellement corrélé à l'aube locale — probabilité de coïncidence < 1%
- Fenêtre temporelle identique à Proxima b : même 40 minutes, même logique d'aube
- Vie multicellulaire : 91% de confiance — premier exemple extra-solaire confirmé

**Ce que les données ne disent pas**

- Lien entre le signal et la vie présente
- Pourquoi l'aube spécifiquement — condition ou conséquence ?
- Si l'organisme produit le signal, le reçoit, ou les deux
- Si la vie est liée au constructeur ou antérieure à lui

**Lien avec la grammaire du scénario**

Deux planètes différentes — même signal, même fréquence, même fenêtre temporelle liée à l'aube. L'aube n'est pas une coïncidence. C'est une condition du signal. Le constructeur a choisi des planètes avec une aube — ou a créé les conditions pour qu'une aube existe.

**Pointe vers**

- Systèmes avec planètes habitables + anomalie orbitale non caractérisée
- Gliese 667C — système triple, plusieurs zones habitables, anomalie orbitale signalée

---

#### TRACE-003 — Gliese 667Cc — Objet orbital (667Cc-O1)

```
Désignation   : GLIESE667-SCN01-001
Type          : PHYSICAL_ARTIFACT
Difficulté    : 2 (détection orbitale) — 3 (gravures)
Système       : Gliese 667C — 22 al
scenarioArc   : scn-01-fil-des-75
```

**Ce que le joueur trouve**

Perturbation gravitationnelle sur l'orbite de 667Cc — anomalie détectable depuis l'orbite. Six semaines d'analyse : objet 1 400 m × 200 m en orbite intentionnelle autour de 667Cc. Aucune rotation. Température 2,7 K — fond cosmologique, pas de dissipation thermique interne. Composition : métaux réfractaires × 10, carbone amorphe. Aucune dérive orbitale mesurée sur 293 orbites consécutives.

Sonde déployée : surface couverte de gravures. 10 800 lignes. Espacement 4,7 mm ± 0,01. Régularité non atteignable par des processus géologiques connus. Datation : 4,2 à 4,8 milliards d'années.

Contenu des gravures : ratio d'interruption 1/75 — une interruption complète toutes les 75 lignes. Signification indéterminée.

**Ce que les données disent**

- Orbite : stabilité sur 293 mesures = intentionnelle à 99,7% de confiance
- Composition : concentration × 10 = artificielle à 97% de confiance
- Gravures : espacement régulier = non naturel à 99,9% de confiance
- Datation : 4,2–4,8 Ga = antérieur à toute vie complexe sur Terre

**Ce que les données ne disent pas**

- Provenance
- Fonction — marqueur ? Message ? Outil ?
- Signification du ratio 75
- S'il existe d'autres objets du même type

**Lien avec la grammaire du scénario**

Premier artefact physique. La grammaire matérielle — métaux réfractaires, espacement 4,7 mm, ratio 1/75 — n'a pas encore d'écho. Elle le trouvera à la surface de la planète.

**Pointe vers**

- Surface de 667Cc — même grammaire, même matériau, même constructeur ?
- Systèmes anciens > 5 Ga avec anomalies orbitales — Tau Ceti, 82 Eridani

---

#### TRACE-004 — Gliese 667Cc — Plaque au sol (667Cc-SOL-01)

```
Désignation   : GLIESE667-SCN01-002
Type          : PHYSICAL_ARTIFACT
Difficulté    : 3 — nécessite module de descente + fouille ciblée
Système       : Gliese 667C — 22 al
scenarioArc   : scn-01-fil-des-75
```

**Ce que le joueur trouve**

Concentration anormale de métaux réfractaires détectée au sol — craton équatorial, zone tectoniquement stable. Module déployé. Fouille à 60 cm de profondeur sous basalte daté > 3,5 Ga : plaque du même matériau que 667Cc-O1.

128 lignes de gravures. Espacement 4,7 mm. Une interruption à la ligne 75. Ratio 1/75 — identique à l'objet orbital.

**Ce que les données disent**

- Même constructeur que 667Cc-O1 : confiance 94%
- Présence confirmée sur la planète ET en orbite autour d'elle
- Ce n'est pas un objet isolé — c'est un système

Contexte terrestre : à 3,5 milliards d'années, sur Terre — premiers micro-organismes, aucun eucaryote, aucune cellule complexe. L'objet était enterré sous ce basalte avant que la vie complexe existe sur Terre.

**Ce que les données ne disent pas**

- Étendue du système — combien d'artefacts au total ?
- Ce qui était là avant que le basalte recouvre tout
- Signification de 75 — base numérique ? Période ? Distance ?
- Pourquoi cette planète, cette orbite, ce système

**Lien avec la grammaire du scénario**

Le ratio 1/75 est maintenant confirmé sur deux artefacts dans le même système — un en orbite, un au sol. Ce n'est pas une coïncidence : c'est une grammaire. Le constructeur a laissé le même marqueur dans deux emplacements délibérément différents sur le même corps céleste.

**Pointe vers**

- Tau Ceti f — anomalie sur planète habitable optimale, système ancien
- 82 Eridani — système ancien — anomalie de niveau 1 signalée
- La question : quel est le réseau complet ?

---

### 3.4 Question terminale du scénario

**Que signifie 75 ?**

Trois pistes légitimes et non exclusives :

```
Piste mathématique
  75 = 3 × 25 = 3 × 5²
  Propriété dans une base numérique particulière ?
  Ratio géométrique intrinsèque à la structure ?

Piste astronomique
  Distance en années-lumière entre deux nœuds du réseau ?
  Période orbitale d'un corps non identifié ?
  Angle de résonance entre systèmes ?

Piste fonctionnelle
  75 comme délimiteur de section dans un langage inconnu
  Unité de mesure propre au constructeur
  Instruction — "arrêtez-vous à la ligne 75"
```

**Pourquoi l'aube ?**

Le signal 1420 MHz synchronisé à l'aube sur deux planètes différentes. L'aube comme condition — de quoi ? Proxima b n'a pas d'aube classique — sauf au terminateur, qui est une aube permanente. Le constructeur a choisi des conditions d'aube, pas des planètes.

**Pourquoi ces planètes précisément ?**

Proxima b, Ross 128 b, 667Cc — toutes en zone habitable au moment des artefacts. Le constructeur cherchait-il la vie ? La créait-il ? Ou laissait-il ces marques pour quelqu'un qui chercherait la vie — c'est-à-dire, pour nous ?

---

### 3.5 Extensions prévues

| Système | Distance | Rôle dans le scénario | Statut |
|---------|----------|----------------|--------|
| Tau Ceti f | 11,9 al | Nœud intermédiaire — anomalie sur planète habitable optimale | À développer |
| 82 Eridani | 20,2 al | Nœud secondaire — système ancien, anomalie niveau 1 | À développer |
| HD 40307 g | 41,8 al | Extension zone intermédiaire — super-Terre zone habitable | À explorer |
| Destination à > 500 al | — | Nœud de convergence de niveau 4 — séquence secrète | Non défini |

La question de niveau supérieur : si le réseau s'étend au-delà du voisinage solaire, quelle est son échelle ? Le voisinage est-il un point d'entrée ou le cœur du réseau ?

---

### 3.6 Questions ouvertes

*Issues de la simulation et des sessions de design. Non résolues intentionnellement.*

- La grammaire des 75 doit mener quelque part de **déductible** — pas devinable. Quelle est la prochaine question de niveau supérieur une fois que le joueur a compris que 75 est un ratio ?
- Tau Ceti et 82 Eridani portent-ils le même ratio 1/75, ou une **variation** qui complexifie la lecture ?
- Comment le système maintient la cohérence du Fil des 75 sans le résoudre, sur des mois de jeu collectif ?
- Le nœud de convergence de niveau 4 utilise-t-il le ratio 75 comme **clé d'accès** ?
- Un joueur arrivant à 667Cc après que d'autres ont déjà trouvé la plaque : la trace est déposée. Comment maintenir la force de la découverte ?

---


## 6. Scénario 03 — Le Témoin

*Statut : structure posée — contenu à développer*
*Type : SEQUENCE — séquentiel, ordre imposé*
*Zone : galactique — trois zones impliquées*

---

### 6.1 Présentation

Le Scénario 03 est le seul scénario séquentiel de LACUNA. Contrairement au Scénario 02 où l'ordre n'importe pas, ici chaque trace est cryptographiquement liée à la précédente — il est impossible d'en sauter une.

La mécanique de transition entre les actes utilise la **dilatation gravitationnelle** : pour passer d'un acte au suivant, le joueur doit se positionner en orbite proche d'une étoile massive. Le temps simulé à bord ralentit. Le temps cosmique dehors s'emballe. Le joueur ne reçoit jamais l'instruction d'utiliser la dilatation — les traces le déduisent.

### 6.2 Structure en trois actes

| Acte | Zone | Événement | Transition |
|------|------|-----------|------------|
| 01 — Le Premier Jeu | À définir | Traces distribuées, grammaire à définir | Orbite proche d'une étoile massive identifiée par les traces |
| 02 — La Mort du Système Solaire | Position gravitationnelle spécifique | L'observatoire capte Sol en géante rouge. La Terre n'est plus. | Deuxième étoile massive |
| 03 — La Fusion | Zone galactique profonde | Depuis la position atteinte : la fusion Voie Lactée/Andromède observable en temps réel | — |

L'Acte 02 n'est pas annoncé. Il arrive parce que la physique du jeu — vitesse de la lumière, distance, dilatation — produit exactement cette image au moment exact où le joueur a la capacité de la recevoir.

### 6.3 Mécanique cryptographique

Les traces de ce scénario utilisent un format d'identifiant étendu avec clé évolutive :

```
Xx-xxx-xxx-xx
│   │    │   └── Clé — dérive de la trace précédente (hash)
│   │    └────── Problème — données encodées de la trace
│   └─────────── Position dans la séquence
└─────────────── Préfixe système
```

Chaque trace contient une clé qui est le hash d'une donnée résoluble dans la trace précédente. Sans la résolution de N, la trace N+1 est muette. Le jeu ne confirme jamais "correct" — le joueur sait qu'il a juste parce que la clé correspond.

### 6.4 Question terminale

À formuler. Piste : si une civilisation a voulu que quelqu'un assiste à ces trois moments — la mort d'un soleil, la dissolution d'une galaxie, et ce qui suit — pourquoi ? Et pour qui ?

### 6.5 À développer

- Grammaire commune des traces de l'Acte 01
- Systèmes d'ancrage des trois actes
- Fiches de nœuds individuelles
- Relation avec le Scénario 02 — même constructeur ?

---

## 7. Scénario 04 — La Guerre Stellaire

*Statut : ébauche — concept posé*
*Type : EXPLORATION — entrée multiple*
*Zone : à définir*
*Hypothèse associée : H-05 — La Guerre Galactique → `LACUNA_HYPOTHESES.md`*

---

### 7.1 Présentation

Deux grammaires distinctes coexistent dans les mêmes systèmes. Des artefacts qui ressemblent à des armes. Des planètes dont la chimie suggère une extinction brutale plutôt que progressive. Des débris orbitaux avec des signatures thermiques résiduelles vieilles de millions d'années.

Le joueur reconstruit un conflit sans jamais en connaître les belligérants ni les enjeux. Ce qui est vertigineux : peut-être que la "guerre" est une projection humaine. Peut-être que ce qu'on lit comme une destruction était quelque chose d'entièrement autre.

C'est la seule trace de violence potentielle dans un jeu qui ne montre que des vestiges silencieux.

### 7.2 Grammaire (à définir)

| Élément | Direction |
|---------|-----------|
| Type de traces dominant | À définir — deux familles distinctes dans les mêmes systèmes |
| Signature physique | Destruction ambiguë — extinction chimique brutale ? Débris orbitaux anormaux ? |
| Distribution | Systèmes contigus — les deux "camps" lisibles indépendamment |
| Question terminale | Ce qu'on lit comme une guerre l'était-il vraiment ? |

### 7.3 À développer

- Définir les deux grammaires et leurs signatures physiques distinctes
- Choisir les systèmes d'ancrage
- Déterminer si les deux "camps" sont des espèces différentes ou la même

---

## 8. Scénario 05 — Les Explorateurs

*Statut : ébauche — concept posé*
*Type : HYBRIDE*
*Zone : à définir — probablement galactique profonde*
*Hypothèse associée : H-04 — L'Explorateur Extraterrestre → `LACUNA_HYPOTHESES.md`*

---

### 8.1 Présentation

Une civilisation extraterrestre qui a fait ce que le joueur fait — traverser la galaxie, chercher, laisser des marques de passage. La reconnaissance de leur grammaire comme miroir de la nôtre.

Ce qui rend ce scénario vertigineux : l'identification est très tardive. Pendant longtemps le joueur analyse des traces sans comprendre qu'elles appartiennent à des explorateurs — comme lui. Le moment où il comprend est structurellement déstabilisant : il n'est pas le premier à avoir fait ça. Et peut-être pas le dernier.

### 8.2 Grammaire (à définir)

| Élément | Direction |
|---------|-----------|
| Type de traces dominant | À définir — ressemble à ce que les joueurs humains laissent, mais antérieur et non-humain |
| Signature physique | Marques de passage délibérées, non monumentales — explorateurs, pas constructeurs |
| Distribution | Géographiquement cohérente avec une trajectoire de voyage |
| Question terminale | Une civilisation qui cherchait ce que nous cherchons — a-t-elle trouvé quelque chose ? |

### 8.3 À développer

- Définir ce qui distingue leurs traces des traces joueurs humains
- Définir le moment de reconnaissance — comment le joueur comprend sans que le jeu le lui dise
- Déterminer si leur trajectoire peut être reconstruite

---

## 9. Scénario 06 — Les Colonisateurs

*Statut : ébauche — concept posé*
*Type : EXPLORATION*
*Zone : à définir — systèmes avec planètes habitables*
*Hypothèse associée : H-06 — La Colonisatrice → `LACUNA_HYPOTHESES.md`*

---

### 9.1 Présentation

Distinct des explorateurs — ils ne cherchaient pas, ils s'installaient. Des traces d'implantation délibérée sur des planètes habitables : modifications chimiques à grande échelle, structures au sol, anomalies biologiques incompatibles avec l'évolution locale.

La question centrale : pourquoi ont-ils disparu de là où ils s'étaient installés ? Pas de traces de départ. Pas de traces de destruction. Juste une installation qui s'est arrêtée, et une planète qui a continué sans eux.

### 9.2 Grammaire (à définir)

| Élément | Direction |
|---------|-----------|
| Type de traces dominant | `BIOLOGICAL`, `ANOMALIE_CHIMIQUE`, `PHYSICAL_ARTIFACT` |
| Signature physique | Modifications délibérées à grande échelle — terraformation partielle ? Introduction d'espèces ? |
| Distribution | Planètes habitables — pas nécessairement contiguës géographiquement |
| Question terminale | Une civilisation qui s'installait — qu'est-il arrivé, et pourquoi nulle part de trace de fin ? |

### 9.3 Lien avec l'arc Colonies (LACUNA_ARCS.md)

Ce scénario résonne avec la mécanique de colonies du jeu. Un joueur qui a lui-même laissé une colonie derrière lui lira ces traces différemment. Ce lien n'est jamais explicité dans l'interface.

### 9.4 À développer

- Définir les systèmes d'ancrage
- Distinguer clairement du Scénario 02 (constructeur) — les colonisateurs habitaient, ils ne gravaient pas
- Définir ce qui constitue la "disparition" dans les données physiques

---

## 10. Scénario 07 — La Propagation

*Statut : ébauche — concept posé*
*Type : EXPLORATION*
*Zone : distribuée — pattern de propagation à reconstruire*
*Hypothèse associée : H-03 — La Bactérie Colonisatrice → `LACUNA_HYPOTHESES.md`*

---

### 10.1 Présentation

Vie qui se propage par astéroïdes interstellaires, modifie la chimie des planètes qu'elle atteint. Pas intentionnelle. Aucune civilisation derrière — juste de la vie qui se déplace par inertie physique.

C'est le seul scénario sans intentionnalité. Les traces ne sont pas *laissées pour* quelqu'un — elles sont les effets secondaires d'un processus naturel à grande échelle. Si le joueur comprend que certaines traces n'ont pas été laissées délibérément, ça change fondamentalement le rapport aux autres scénarios.

### 10.2 Grammaire (à définir)

| Élément | Direction |
|---------|-----------|
| Type de traces dominant | `BIOLOGICAL`, `ANOMALIE_CHIMIQUE` |
| Signature physique | Molécules organiques complexes, acides aminés atypiques, modifications chimiques cohérentes avec une origine commune |
| Distribution | Pattern de propagation déductible depuis les trajectoires d'astéroïdes interstellaires — cf. Oumuamua |
| Question terminale | Est-ce de la vie, de la colonisation, ou simplement de la physique ? |

### 10.4 À développer

- Définir les systèmes d'ancrage en cohérence avec les trajectoires interstellaires connues
- Définir ce qui rend les traces biologiques "impossibles à expliquer localement"
- Déterminer si le pattern de propagation est reconstruisable par le joueur

---

## 11. Scénario 08 — L'Intelligence

*Statut : ébauche — concept posé, à cadrer précisément*
*Type : À définir — le plus risqué philosophiquement*
*Zone : à définir*

---

### 11.1 Présentation

Présence active ou vestige actif. Méthode déductible, but jamais nommé. Potentiellement le seul scénario avec quelque chose qui *continue* d'agir.

C'est le scénario le plus difficile à cadrer. Une IA active frôle la rupture du contrat de base du jeu ("personne ne répond jamais"). Il faudra le définir très précisément pour maintenir l'ambiguïté irréductible.

### 11.2 Directions possibles (à trancher)

**Direction A — La méthode lisible**
Une IA dont la *mission* est lisible dans ses traces — elle fait quelque chose de systématique, patient, à une échelle de temps incompatible avec une civilisation biologique. Elle catalogue, ou elle construit, ou elle attend. Son but n'est jamais nommé mais sa *méthode* est déductible.

**Direction B — La survivante**
Traces d'une civilisation disparue, et au milieu d'elles, quelque chose qui continue. Qui agit encore. Ce serait le seul scénario avec une présence potentiellement active — sans que ce soit jamais confirmé.

**Direction C — L'anticipation**
Une IA qui a laissé des traces conçues pour être trouvées *par nous spécifiquement* — comme si elle avait prévu notre arrivée. Le scénario le plus proche de la séquence secrète.

### 11.3 Contrainte de conception

Quelle que soit la direction choisie, le scénario doit maintenir l'ambiguïté : le joueur ne doit jamais avoir la certitude qu'il s'agit d'une IA, ni que quelque chose est encore actif. C'est une interprétation parmi d'autres — la plus déstabilisante, mais pas la seule possible.

### 11.4 À développer

- Trancher entre les trois directions
- Définir la grammaire des traces
- Vérifier que le scénario ne rompt pas le contrat "personne ne répond"

---

## 12. Règles générales pour les futurs scénarios

### Un scénario doit

- Poser une **question de niveau supérieur** à chaque trace individuelle
- Avoir au moins **3 nœuds** dans des systèmes distincts, espacés géographiquement
- Être **traversable dans n'importe quel ordre** — le scénario a une logique, pas un itinéraire
- Rester **ouvert** à l'issue — la question terminale est plus profonde que les questions d'entrée
- Être **cohérent avec la physique** du jeu — les datations, les distances, les compositions sont plausibles

### Un scénario ne doit pas

- Avoir une réponse correcte que le joueur "débloque"
- Dépendre d'une coordination explicite entre joueurs
- Être résolu par un seul vaisseau en une seule campagne
- Pointer explicitement vers lui-même dans l'interface

### Nomenclature des traces de scénario

```
[SYSTEME]-SCN[NUM]-[ORDRE]
ex : GLIESE667-SCN01-002
     PROXIMA-SCN01-001
     [SYSTEME]-SCN02-001
```

### Processus de création d'un nouveau scénario

1. Définir la question terminale — ce que le scénario pose, pas ce qu'il répond
2. Définir la grammaire commune — l'élément partagé entre toutes les traces
3. Choisir les systèmes d'ancrage — réels, documentés, scientifiquement plausibles
4. Écrire les fiches de nœuds en commençant par les nœuds d'entrée
5. Vérifier que chaque nœud est autonome à sa difficulté — interprétable sans les autres
6. Écrire les questions ouvertes — ce que le scénario ne résout pas

---

*LACUNA — Scénarios v0.2 — Mars 2026 — Confidentiel*
