*Dernière modification : 2026-10-23*

# LACUNA — Scénarios
*Version 0.7 — Octobre 2026*

> Ce document décrit les **arcs narratifs jouables** : des séquences de traces qui, ensemble, racontent quelque chose et mènent quelque part. Complémentaire de `LACUNA_TRACES.md` (mécanique des traces) et de `LACUNA_TRACES_IMMUABLES.md` (fiches des traces immuables hors scénario) — les scénarios documentent comment les traces se relient et ce qu'elles impliquent collectivement.

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

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 0.1 | Mars 2026 | Document initial — philosophie, grammaire, Scénario 02 Le Fil des 75 (issu de LACUNA_SIMULATION_PHASE1.md §5), Scénario 00 fiche vierge |
| 0.2 | Mars 2026 | Ajout Scénarios 02 à 07 — Le Témoin, La Guerre Stellaire, Les Explorateurs, Les Colonisateurs, La Propagation, L'Intelligence. Tous au statut ébauche/structure posée. |
| 0.3 | Mars 2026 | Ajout Scénario 01 — Yael (onboarding). Renumérotation Scénarios 01→02 … 07→08. |
| 0.4 | Mars 2026 | Développement des fiches Scénarios 03 à 08 — grammaires, systèmes d'ancrage, questions terminales, notes de conception. Direction retenue pour le Scénario 08 (La méthode lisible). |
| 0.5 | Octobre 2026 | Mise en cohérence — fusion des deux entrées 0.4 du changelog ; sous-sections renumérotées selon leur section (3.x, 4.x, 5.x) ; Le Fil des 75 aligné sur sa numérotation : `scn-02-fil-des-75`, désignations `…-SCN02-…`. Scénario 03 : la dilatation exige un objet compact (Sgr A*), pas une étoile de type A ou F où l'effet est négligeable ; durées recalculées ; la lumière de Sol depuis la position d'observation n'a que l'âge de la distance ; chronologie Andromède / Soleil réconciliée (proposition à valider). Scénario 02 : fenêtre de 40 min rendue explicite à Proxima b, rotation de Ross 128 b déclarée valeur de jeu, 82 Eridani à 19,7 al. Scénario 04 : zone et types spectraux corrigés. Scénario 05 : traces au format joueur rattachées à l'origine `IMMUABLE`. Scénario 07 : chiralité des météorites et de Bennu précisée. Scénario 08 : statut, PSR B1919+21 référencé PSR-001. §12 : exception pour les scénarios séquentiels |
| 0.6 | Octobre 2026 | §5.7 ajouté : valeurs d'implémentation provisoires des signaux du Fil des 75 (cycle de Proxima b, décalage d'aube, intensité, durée de capture, forme de la salve, sens de la polarisation). Un signal hors fenêtre est présent mais inactif |
| 0.7 | Octobre 2026 | Les quatre nœuds du Fil des 75 sont en base (migration `00060`) avec leur gradient de lecture ; structure de Yael prête, aucune entrée. §5.7 complété : règle de déblocage provisoire, désignations `SCN02` visibles, choix de rédaction des lectures |

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

Les traces d'un scénario sont des traces immuables ordinaires — leurs fiches de nœuds vivent dans ce document, les autres traces immuables dans `LACUNA_TRACES_IMMUABLES.md`. Leur appartenance à un scénario est indiquée dans le champ `scenarioArc`. Un joueur peut collecter une trace de scénario sans jamais réaliser qu'elle fait partie d'une séquence plus large. C'est voulu.

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

Chaque trace appartenant à un scénario dispose d'une fiche complète dans ce document :

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

### 3.1 Utilisation

Copier cette section pour créer un nouveau scénario. Remplir tous les champs. Ne pas modifier ce modèle.

---

### 3.2 En-tête

```
Nom          : [Nom du scénario]
Code         : scénario-XX
Type         : EXPLORATION / SEQUENCE / HYBRIDE
Statut       : ébauche / en développement / actif
Zone         : voisinage / intermédiaire / profonde / galactique
Hypothèse    : [Référence LACUNA_HYPOTHESES.md si applicable]
```

### 3.3 Présentation

[Description du concept central — 3 à 5 lignes. Ce que ce scénario pose comme question, ce qui le distingue des autres.]

### 3.4 Grammaire commune

| Élément | Valeur |
|---------|--------|
| Types de traces dominant | |
| Signature physique | |
| Distribution géographique | |
| Question terminale | |

### 3.5 Nœuds

```
Scénario XX
├── Nœud d'entrée 01 : [système — à définir]
├── Nœud d'entrée 02 : [système — à définir]
├── Nœud intermédiaire : [système — à définir]
└── Nœud de convergence : [système — à définir]
```

### 3.6 Questions ouvertes

- [Question 1]
- [Question 2]

### 3.7 À développer

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

### 4.1 Présentation

Yael est un vaisseau générationnel parti avant le joueur, dans le cadre d'une vague du programme ARCA antérieure. Quelques décennies d'avance, peut-être un siècle. Le joueur ne le sait pas immédiatement.

Yael n'est pas une personne. C'est une désignation retrouvée dans une trace — un prénom, un acronyme de mission, ou le nom que les générations suivantes à bord ont donné à leur propre vaisseau. Le joueur ne le saura jamais avec certitude.

C'est la seule trace dont le joueur peut déduire avec certitude qu'elle est humaine. Ce qui en fait quelque chose de profondément différent de toute trace extraterrestre — et potentiellement plus troublant. On sait d'où il vient. On ne sait pas où il est allé.

---

### 4.2 Fonction dans le jeu

Yael est un **dispositif d'onboarding** : ses traces enseignent la mécanique du module Traces avant de confronter le joueur à des anomalies extraterrestres ambiguës. Elles calibrent l'expérience émotionnelle — on n'est pas seul, mais ceux qui sont partis avant ne répondent plus.

La confusion est intentionnelle dans les premières entrées. Dans le module Traces, une entrée de Yael ressemble à une trace joueur ordinaire — même format, même présentation. La différence n'est perceptible qu'à la lecture : la voix est différente, la datation est ancienne.

---

### 4.3 Grammaire des traces

| Élément | Valeur |
|---------|--------|
| Type | Trace narrative — tag `PRÉCURSEUR` |
| Signature | Texte en langage naturel légèrement archaïque, datation générationnelle ancienne |
| Ancienneté | Quelques décennies à quelques siècles avant le départ du joueur |
| Distribution | Systèmes proches de Sol, zone < 25 al — premiers voyages |
| Densité | Dense dans le voisinage, s'espacent en zone intermédiaire, rares en zone profonde |
| Désignation | `[SYSTEME]-YAEL-[ORDRE]` |

---

### 4.4 Ce que le scénario implique

- D'autres humains sont partis avant le joueur. Il n'est pas le premier.
- Ces précurseurs ont cherché aussi — et ont déjà annoté des traces extraterrestres. Le joueur trouve une couche humaine sur une couche inconnue.
- Le joueur peut suivre le sillage de Yael comme une piste — sans jamais savoir où elle mène.
- Yael pourrait avoir trouvé quelque chose que le joueur n'a pas encore trouvé.

---

### 4.5 Ce que ce scénario ne résout pas

- Le sort du vaisseau Yael — en route, arrivé, disparu, devenu une colonie ?
- Si Yael a interprété correctement les traces qu'il a annotées
- S'il existe d'autres précurseurs humains avec des trajectoires différentes
- Si le silence de Yael dans la zone profonde signifie qu'il a cessé d'écrire, ou qu'il n'est plus

---

### 4.6 Règles de conception

- **Maximum 2 traces** dans la zone d'onboarding — ne pas sur-écrire
- **Pas de conclusion** sur ce qui lui est arrivé — l'absence est aussi importante que les traces
- **Ton évolutif** — les premières entrées sont proches, humaines, reconnaissables ; les dernières sont distantes, peut-être méconnaissables
- Le scénario ne se referme jamais — Yael reste une question ouverte pour toute la durée du jeu

---

### 4.7 À développer

- [x] Structure prête à les recevoir : origine `PRÉCURSEUR`, génération de Yael, trace liée, découverte à l'arrivée dans le système (migrations `00054`, `00055`, `00060`)
- [ ] Écrire les 2 fragments canoniques du voisinage (maximum fixé en §4.6)
- [ ] Définir les systèmes d'ancrage
- [ ] Définir le ton des premières entrées vs les dernières
- [ ] Table de relation entre les entrées de Yael et les scénarios extraterrestres qu'il effleure

---

## 5. Scénario 02 — Le Fil des 75

*Statut : actif — en développement*
*Zone principale : voisinage solaire (< 25 al) + extensions vers zone intermédiaire*
*Origine : émergé de la simulation de jeu Phase 1 — voir `LACUNA_SIMULATION_PHASE1.md` §5*

---

### 5.1 Présentation

Un constructeur inconnu a laissé des artefacts dans au moins quatre sites du voisinage solaire. Tous partagent une grammaire commune : matériaux réfractaires, espacement de gravures à 4,7 mm, ratio d'interruption 1/75. Tous datent d'au moins 3,5 milliards d'années.

La question n'est pas *qui*. C'est *pourquoi 75*.

Le constructeur n'est pas nommé dans le jeu. Il n'a pas de nom, pas de civilisation, pas d'histoire fournie. Il n'existe que par ses artefacts — et par les questions qu'ils posent.

Ce que ce scénario ne fait pas : il ne révèle pas l'identité du constructeur. Il ne confirme pas ses intentions. Il approfondit la question jusqu'à ce qu'elle devienne irréductible.

---

### 5.2 Grammaire commune

| Élément | Valeur |
|---------|--------|
| Matériau | Métaux réfractaires × 10 concentration normale, carbone amorphe |
| Gravures | Espacement 4,7 mm ± 0,01 — précision non naturelle |
| Ratio | 1/75 — interruption à la ligne 75 dans toutes les séquences |
| Fréquence associée | 1420 MHz (raie de l'hydrogène) — signal synchronisé à l'aube sur deux planètes |
| Ancienneté | 3,5 à 4,8 milliards d'années — contemporain des premiers océans terrestres |
| Localisation préférentielle | Planètes en zone habitable, ou en orbite autour d'elles |

---

### 5.3 Nœuds du réseau

---

#### TRACE-001 — Proxima Centauri b

```
Désignation   : PROXIMA-SCN02-001
Type          : SIGNAL + ANOMALIE_GEOMETRIQUE
Difficulté    : 1 (signal) — 2 (surface)
Système       : Proxima Centauri — 4,24 al
scenarioArc   : scn-02-fil-des-75
```

**Ce que le joueur trouve**

À l'arrivée : signal radio à 1420 MHz émis depuis le terminateur de Proxima b — la ligne de frontière perpétuelle entre la face illuminée et la face sombre de cette planète verrouillée tidalement. Émission par fenêtres de 40 minutes, périodicité interne 73 secondes. Polarisation circulaire gauche. Non corrélé aux émissions stellaires.

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
Désignation   : ROSS128-SCN02-001
Type          : SIGNAL + ANOMALIE_CHIMIQUE + BIOLOGICAL
Difficulté    : 1 (signal) — 2 (vie)
Système       : Ross 128 — 11,0 al
scenarioArc   : scn-02-fil-des-75
```

**Ce que le joueur trouve**

Signal à 1420 MHz — zone tempérée de Ross 128 b — synchronisé à l'aube locale. Fenêtre d'émission : 40 minutes par cycle jour-nuit de 61 heures. Durée de fenêtre identique à celle des émissions du terminateur de Proxima b.

*Valeur de jeu :* dans LACUNA, Ross 128 b n'est pas verrouillée gravitationnellement et tourne sur un cycle de 61 h. Dans la réalité, sa rotation n'est pas mesurée et un verrouillage est probable pour une planète aussi proche de son étoile (période orbitale ~9,9 jours).

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
Désignation   : GLIESE667-SCN02-001
Type          : PHYSICAL_ARTIFACT
Difficulté    : 2 (détection orbitale) — 3 (gravures)
Système       : Gliese 667C — 22 al
scenarioArc   : scn-02-fil-des-75
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
Désignation   : GLIESE667-SCN02-002
Type          : PHYSICAL_ARTIFACT
Difficulté    : 3 — nécessite module de descente + fouille ciblée
Système       : Gliese 667C — 22 al
scenarioArc   : scn-02-fil-des-75
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

### 5.4 Question terminale du scénario

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

### 5.5 Extensions prévues

| Système | Distance | Rôle dans le scénario | Statut |
|---------|----------|----------------|--------|
| Tau Ceti f | 11,9 al | Nœud intermédiaire — anomalie sur planète habitable optimale | À développer |
| 82 Eridani | 19,7 al | Nœud secondaire — système ancien, anomalie niveau 1 | À développer |
| HD 40307 g | 41,8 al | Extension zone intermédiaire — super-Terre zone habitable | À explorer |
| Destination à > 500 al | — | Nœud de convergence de niveau 4 — séquence secrète | Non défini |

La question de niveau supérieur : si le réseau s'étend au-delà du voisinage solaire, quelle est son échelle ? Le voisinage est-il un point d'entrée ou le cœur du réseau ?

---

### 5.6 Questions ouvertes

*Issues de la simulation et des sessions de design. Non résolues intentionnellement.*

- La grammaire des 75 doit mener quelque part de **déductible** — pas devinable. Quelle est la prochaine question de niveau supérieur une fois que le joueur a compris que 75 est un ratio ?
- Tau Ceti et 82 Eridani portent-ils le même ratio 1/75, ou une **variation** qui complexifie la lecture ?
- Comment le système maintient la cohérence du Fil des 75 sans le résoudre, sur des mois de jeu collectif ?
- Le nœud de convergence de niveau 4 utilise-t-il le ratio 75 comme **clé d'accès** ?
- Un joueur arrivant à 667Cc après que d'autres ont déjà trouvé la plaque : la trace est déposée. Comment maintenir la force de la découverte ?
- Ross 128 b est probablement verrouillée dans la réalité. Si une mesure future le confirme, l'« aube locale » du nœud TRACE-002 devient une aube de terminateur, comme à Proxima b — la grammaire y gagne-t-elle ou y perd-elle ?

---


### 5.7 Valeurs d'implémentation provisoires

*Choisies à l'implémentation des signaux (migration `00057`) faute de valeur dans les fiches ci-dessus ; à confirmer ou remplacer. La colonne `provisional` de `system_signal_sources` les recense.*

| Élément | Valeur retenue | Pourquoi |
|---------|---------------|----------|
| Horloge des fenêtres | Temps réel joueur ; phase = (maintenant − époque − décalage) mod cycle | Cohérent avec le type Timing (`LACUNA_TRACES.md` §3.7) : le joueur doit être présent au bon moment |
| Époque des cycles | 2026-10-01 00:00 UTC (`game_settings.scenario_signal_epoch`) | Commune à tous les joueurs : la galaxie est partagée |
| Décalage « aube locale » | 0 | Aucun repère dans la doc |
| Cycle des fenêtres de Proxima b | 61 h, comme Ross 128 b | La planète est verrouillée : aucun cycle jour-nuit documenté |
| Signal hors fenêtre | Présent mais inactif : listé, non analysable, muet sur le Radar | Décision de conception |
| Intensité (flux relatif) | 0,13 (~20 dB au-dessus du bruit de la bande L) | Aucune intensité documentée |
| Durée de capture au Laboratoire | 300 s (~4 périodes de 73 s) | Aucune durée documentée |
| Forme de la salve de 73 s | Impulsion identique à celle d'un pulsar | Aucun profil documenté |
| Polarisation « circulaire gauche » | Stokes V < 0 | Convention de jeu |
| Déblocage des lectures | Une observation du système courant, de bon type, sur le bon corps, à un niveau au moins égal. Sans coût ni instrument ; bouton « Approfondir » au Laboratoire | Aucune mécanique de descente, de sonde ni de fouille n'est définie |
| Désignation affichée | `PROXIMA-SCN02-001` etc., telle quelle (conforme à la nomenclature §12) | Annonce un scénario au joueur : à trancher |
| Lectures affichées | « Ce que le joueur trouve » et les faits chiffrés de « Ce que les données disent » ; jamais « ne disent pas », « lien avec la grammaire » ni « pointe vers » | Notes d'auteur. Écartés aussi : « Ce n'est pas un objet isolé — c'est un système », « Contexte terrestre », « même logique d'aube » (interprétations) |
| Niveaux sans texte | GLIESE667-SCN02-001 et -002 n'ont rien aux niveaux que la doc ne décrit pas ; PROXIMA et ROSS128 n'ont que deux lectures | Aucun texte inventé |
| Renvoi « 667Cc-O1 » | Conservé dans GLIESE667-SCN02-002 | Libellé de la doc que le joueur ne connaît pas : à reformuler |
| Signal de Ross 128 b | 1420 MHz en fenêtre, sans périodicité ni polarisation propres | Rien de documenté : il n'est pas tracé sur le Radar (pas de motif à injecter) |

---

## 6. Scénario 03 — Le Témoin

*Statut : concept développé — systèmes d'ancrage de l'Acte 01 à confirmer*
*Type : SEQUENCE — séquentiel, ordre imposé*
*Zone : voisinage lointain et zone intermédiaire (Acte 01), centre galactique (Actes 02 et 03)*

---

### 6.1 Présentation

Le Scénario 03 est le seul scénario séquentiel de LACUNA. Contrairement au Scénario 02 où l'ordre n'importe pas, ici chaque trace est cryptographiquement liée à la précédente — il est impossible d'en sauter une.

La mécanique de transition entre les actes utilise la **dilatation gravitationnelle** : pour passer d'un acte au suivant, le joueur doit stationner en orbite proche d'un objet compact assez massif pour que le temps galactique s'emballe autour de lui. Dans la galaxie du jeu, seul Sgr A* produit un effet suffisant (`LACUNA_PHYSICS.md` §3 : près d'une étoile de séquence principale, la dilatation est négligeable ; près d'une étoile à neutrons, elle reste de l'ordre de 12 %). Le temps simulé à bord ralentit. Le temps cosmique dehors s'emballe. Le joueur ne reçoit jamais l'instruction d'utiliser la dilatation — les traces le déduisent.

### 6.2 Structure en trois actes

| Acte | Zone | Événement | Transition |
|------|------|-----------|------------|
| 01 — Le Premier Jeu | Voisinage lointain / zone intermédiaire (24–42 al) | Traces cryptographiques distribuées dans au moins trois systèmes | Les traces désignent Sgr A* et une durée d'observation |
| 02 — La Mort du Système Solaire | Orbite proche de Sgr A* | Après ~5 à 7,6 Ga galactiques, l'observatoire capte Sol en géante rouge. La Terre n'est plus. | Prolongation du stationnement |
| 03 — La Fusion | Orbite proche de Sgr A* | La fusion Voie Lactée / Andromède devient lisible dans les données du bulbe | — |

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

### 6.4 Grammaire commune

| Élément | Valeur |
|---------|--------|
| Types de traces dominant | `SEQUENCE`, `ANOMALIE_STELLAIRE`, `PHYSICAL_ARTIFACT` |
| Signature physique | Clés cryptographiques dérivées de données astronomiques réelles — chaque trace contient le hash de la suivante, calculable depuis des mesures orbitales précises |
| Ancienneté | Les traces de l'Acte 01 sont récentes (< 100 Ma), conçues pour être trouvées par une espèce technologique |
| Distribution | Trois systèmes distincts pour l'Acte 01, puis une seule position imposée par la mécanique de dilatation — pas de liberté d'ordre |
| Ton | Le seul scénario qui implique une intentionnalité tournée vers *nous* — quelqu'un a conçu un itinéraire pour qu'une espèce technologique assiste à ces événements spécifiques |

### 6.5 Systèmes d'ancrage

**Acte 01 — Le Premier Jeu**

Zone : voisinage lointain et début de la zone intermédiaire. Les traces distribuent une séquence cryptographique dans au moins trois systèmes. Chaque trace contient une mesure astronomique (type spectral, période orbitale, distance) qui, calculée correctement, produit la clé d'accès à la trace suivante. La résolution ne demande pas de déduction narrative — elle demande du calcul. C'est le seul scénario où les instruments du Laboratoire sont utilisés pour *calculer*, pas seulement *observer*.

Systèmes candidats : Beta Hydri (24,3 al, G2 IV), 61 Virginis (27,9 al, G7 V), HD 40307 (41,8 al, K2.5 V) — des étoiles stables de type G ou K, suffisamment proches pour être atteintes en début de partie.

**Transition Acte 01 → 02**

Les traces de l'Acte 01 convergent vers une coordonnée : le centre galactique. Elles ne disent pas "orbite ici" — elles décrivent une position d'observation et une durée, exprimée dans une unité que le joueur doit convertir. Le joueur déduit qu'il doit s'installer en orbite proche de Sgr A*. La dilatation fait le reste.

Coût : ~14 jours joueur de voyage, puis un stationnement de l'ordre de 2,3 à 3,5 mois joueur pour que ~5 à 7,6 milliards d'années s'écoulent dans la galaxie (`LACUNA_PHYSICS.md` §3, horizons). À bord, ~185 000 à 280 000 générations passent (4,6 à 7 millions d'années vaisseau) : la population qui assiste à l'Acte 02 n'est plus celle qui est partie (`LACUNA_ARCS.md` §1.10, cas limite).

**Acte 02 — La Mort du Système Solaire**

Depuis l'orbite de Sgr A*, l'observatoire capte Sol, à ~26 000 al. Sa lumière n'a voyagé que 26 000 ans : ce sont les milliards d'années écoulés pendant le stationnement qui ont fait vieillir Sol. Le Soleil quitte la séquence principale vers ~5 Ga, puis gonfle jusqu'au sommet de la branche des géantes rouges vers ~7,6 Ga — la Terre est alors probablement absorbée.

La Terre n'est plus. L'interface ne le formule pas. C'est dans les données spectrales — un spectre d'étoile géante rouge là où était un G2V.

*Contrainte instrumentale :* en direction du centre galactique, l'extinction interstellaire atteint ~30 magnitudes en lumière visible. L'observation de Sol depuis Sgr A* n'est réaliste qu'en infrarouge, où une géante rouge est brillante et l'extinction bien plus faible. L'Observatoire doit disposer de ce mode.

**Transition Acte 02 → 03**

Le joueur prolonge le stationnement — ou repart et revient. Aucune autre position accessible ne produit l'effet. Un nouveau saut temporel, de quelques milliards d'années.

**Acte 03 — La Fusion**

Avec suffisamment de temps galactique écoulé, la structure de la Voie Lactée apparaît différemment dans les données de l'observatoire. Andromède n'est plus une galaxie distincte dans les données spectrales — sa lumière se mêle à celle du bulbe galactique. La fusion est engagée.

Aucune notification. Aucune fanfare. C'est dans les données — une anomalie dans la distribution des vitesses radiales des étoiles du bulbe, un léger décalage dans la carte de densité stellaire. Le joueur qui cherche voit. Le joueur qui ne cherche pas passe à côté.

*Chronologie — proposition à valider :* le scénario classique plaçait la collision vers ~4,5 Ga, donc **avant** l'Acte 02. Les simulations publiées en 2025 (Sawala et al., *Nature Astronomy*) ne donnent plus qu'environ 50 % de probabilité de fusion sous 10 Ga. Pour conserver l'ordre des actes, la galaxie de LACUNA fixe la fusion **après** la phase géante rouge du Soleil, entre ~8 et ~10 Ga après le départ — un choix compatible avec cette incertitude. Comme toute sortie mécanique, ce moment est déterministe et identique pour tous les joueurs.

### 6.6 Question terminale

Si quelqu'un a conçu cet itinéraire — les traces cryptographiques, la position d'observation, le timing astronomique — il savait que ces deux événements allaient se produire. Il savait où placer les observateurs et combien de temps ils devraient attendre. Il a calculé avec une précision de milliards d'années.

**Pourquoi vouloir que quelqu'un voie ça ?**

Ce n'est pas un avertissement — ces événements ne peuvent pas être évités. Ce n'est pas une menace. C'est peut-être une invitation. Peut-être un test. Peut-être simplement que pour eux, assister à la fin de quelque chose était un rite de passage — et ils ont voulu le partager.

Ou peut-être que le joueur a tout mal interprété depuis le début, et que ce qu'il a pris pour un itinéraire conçu pour lui est une coïncidence de lecture.

### 6.7 Relation avec le Scénario 02

La grammaire du Fil des 75 (matériaux réfractaires, ratio 1/75, synchronisation à l'aube) est différente de la grammaire cryptographique du Témoin. Les artefacts du Fil des 75 datent d'époques où la vie complexe n'existait pas encore sur Terre ; les traces du Témoin sont récentes. Si c'est le même constructeur, il avait deux projets de natures radicalement différentes, séparés de milliards d'années. Si ce n'est pas le même, deux entités distinctes s'intéressaient à notre système solaire avant nous.

La question n'est pas tranchée dans le jeu. Elle ne doit pas l'être.

### 6.8 Questions ouvertes

- Le joueur peut-il manquer l'Acte 02 — stationner trop peu longtemps, repartir avant que l'image arrive — et ne jamais voir Sol en géante rouge ? Oui. Ce n'est pas une erreur. C'est une lacuna.
- Si plusieurs joueurs traversent ce scénario indépendamment, ils verront la même image de Sol — mais à des moments différents de leur partie. La synchronicité est dans la physique, pas dans la coordination.
- Le coût réel (~4 mois de stationnement cumulés, plus le voyage) est-il tenable pour un scénario ? Faut-il que l'Acte 03 reste un horizon que très peu de joueurs atteindront ?
- La question terminale du Témoin est-elle compatible avec H-01 (Le Semeur) ? Avec H-07 (Le Vestige) ? Ces lectures coexistent sans se valider.

---

## 7. Scénario 04 — La Guerre Stellaire

*Statut : concept développé — fiches de nœuds à écrire*
*Type : EXPLORATION — entrée multiple*
*Zone : voisinage (10–30 al)*
*Hypothèse associée : H-05 — La Guerre Galactique → `LACUNA_HYPOTHESES.md`*

---

### 7.1 Présentation

Deux grammaires distinctes coexistent dans les mêmes systèmes. Des artefacts qui ressemblent à des armes. Des planètes dont la chimie suggère une extinction brutale plutôt que progressive. Des débris orbitaux avec des signatures thermiques résiduelles vieilles de millions d'années.

Le joueur reconstruit un conflit sans jamais en connaître les belligérants ni les enjeux. Ce qui est vertigineux : peut-être que la "guerre" est une projection humaine. Peut-être que ce qu'on lit comme une destruction était quelque chose d'entièrement autre.

C'est la seule trace de violence potentielle dans un jeu qui ne montre que des vestiges silencieux.

### 7.2 Grammaire

Deux grammaires distinctes coexistent dans les mêmes systèmes ou dans des systèmes adjacents. Elles ne se ressemblent pas — c'est précisément ce qui les rend lisibles comme deux entités séparées.

**Grammaire A — Les Constructeurs**

| Élément | Valeur |
|---------|--------|
| Types de traces | `PHYSICAL_ARTIFACT`, `ANOMALIE_GEOMETRIQUE` |
| Signature | Structures géométriques régulières, matériaux à haute résistance thermique, implantées dans des orbites stables — des défenses, ou ce qu'on interprète comme telles |
| Ancienneté | 200 à 500 millions d'années |
| Distribution | Systèmes de type G et K en zone habitable |

**Grammaire B — Les Dissolvants**

| Élément | Valeur |
|---------|--------|
| Types de traces | `ABSENCE`, `ANOMALIE_CHIMIQUE`, `ANOMALIE_STELLAIRE` |
| Signature | Planètes dont la chimie de surface est incompatible avec leur histoire géologique. Atmosphères appauvries de façon non naturelle. Isotopes rares distribués trop uniformément |
| Ancienneté | Légèrement postérieure à la Grammaire A dans les mêmes systèmes — 180 à 450 millions d'années |
| Distribution | Superposée à la Grammaire A — les Dissolvants sont passés là où les Constructeurs étaient |

**Ce que la coprésence implique**

Dans les systèmes où les deux grammaires sont détectables, la Grammaire B est toujours postérieure à la Grammaire A. C'est la seule corrélation temporelle lisible. Est-ce causal ? La Grammaire B est-elle une réponse à la Grammaire A, ou les deux phénomènes ont-ils simplement attiré les mêmes systèmes pour des raisons indépendantes ?

### 7.3 Systèmes d'ancrage

Zone principale : voisinage solaire, systèmes de type G et K.

| Système | Distance | Type | Rôle | Grammaire |
|---------|----------|------|------|-----------|
| Epsilon Eridani | 10,5 al | K2 V | Nœud d'entrée | A — traces dans les débris du disque |
| 70 Ophiuchi | 16,6 al | K0 V + K4 V | Nœud intermédiaire | A + B présentes |
| Delta Pavonis | 19,9 al | G8 IV | Nœud intermédiaire | B dominante, A résiduelle |
| Beta Canum Venaticorum | 27,4 al | G0 V | Nœud de convergence | A et B à leur maximum de lisibilité |

*Note — Epsilon Eridani est une étoile jeune (quelques centaines de millions d'années) : une Grammaire A de 200 à 500 Ma y est contemporaine de la jeunesse du système. C'est compatible, et c'est en soi une question.*

### 7.4 Question terminale

Les deux grammaires décrivent-elles un conflit ? Ou le joueur projette-t-il une logique narrative sur deux phénomènes indépendants qui se sont simplement succédé dans les mêmes systèmes ?

La Grammaire B aurait pu arriver après la Grammaire A sans en être la cause — comme des lichens sur des ruines. L'interprétation "guerre" est humaine. Elle est peut-être juste. Elle est peut-être la seule erreur que le joueur fait systématiquement parce qu'il ne connaît que son propre cadre de référence.

Et si c'est une guerre — qui a gagné ? Les systèmes habités par la Grammaire A sont vides aujourd'hui. Les systèmes marqués par la Grammaire B aussi. Il n'y a pas de vainqueur visible.

### 7.5 Notes de conception

Le risque principal est la sur-lisibilité : deux grammaires dans les mêmes systèmes, c'est tentant de lire "attaque et défense". La protection est dans la Grammaire B — ses traces doivent être délibérément ambiguës. L'appauvrissement chimique d'une atmosphère peut avoir dix causes naturelles. C'est seulement la *corrélation spatiale et temporelle* avec la Grammaire A qui rend la lecture "guerre" possible — pas une preuve en elle-même.

### 7.6 Questions ouvertes

- Les deux grammaires représentent-elles deux espèces distinctes, ou deux factions de la même espèce ?
- Pourquoi ces systèmes précisément — les zones habitables attirent-elles tous les acteurs galactiques ?
- Existe-t-il des systèmes où la Grammaire A a survécu sans trace de Grammaire B ?

---

## 8. Scénario 05 — Les Explorateurs

*Statut : concept développé — systèmes d'ancrage à définir*
*Type : HYBRIDE*
*Zone : zone profonde*
*Hypothèse associée : H-04 — L'Explorateur Extraterrestre → `LACUNA_HYPOTHESES.md`*

---

### 8.1 Présentation

Une civilisation extraterrestre qui a fait ce que le joueur fait — traverser la galaxie, chercher, laisser des marques de passage. La reconnaissance de leur grammaire comme miroir de la nôtre.

Ce qui rend ce scénario vertigineux : l'identification est très tardive. Pendant longtemps le joueur analyse des traces sans comprendre qu'elles appartiennent à des explorateurs — comme lui. Le moment où il comprend est structurellement déstabilisant : il n'est pas le premier à avoir fait ça. Et peut-être pas le dernier.

### 8.2 Grammaire

| Élément | Valeur |
|---------|--------|
| Types dominants | Traces immuables au format d'une trace joueur (désignation interne : PRÉCURSEUR-ALIEN), `ANOMALIE_GEOMETRIQUE`, `OBJET` |
| Signature | Marques de passage délibérées mais non monumentales — pas de constructions permanentes, pas de modifications planétaires. Des annotations, des dépôts d'objets récupérables, des perturbations orbitales mineures comme vestige de manœuvres. L'échelle est celle d'un vaisseau, pas d'une civilisation. |
| Ancienneté | Récente à l'échelle galactique — quelques millions d'années. Assez ancien pour que personne ne soit encore là. Assez récent pour que les traces physiques subsistent. |
| Distribution | Cohérente avec une trajectoire de voyage — les nœuds, mis bout à bout, décrivent un itinéraire. Pas une dispersion : un chemin. |
| Ce qui les distingue des traces joueurs humains | La datation. Leurs "annotations" précèdent l'humanité de plusieurs millions d'années. Le format est reconnaissable — un objet déposé, une surface marquée, une perturbation qui dit "quelqu'un est passé ici" — mais le contenu est opaque. |

### 8.3 Le moment de reconnaissance

C'est le pivot du scénario. Le joueur collecte des traces qui ressemblent à des `PLAYER_TRACE` — même format visuel dans l'interface, même catégorie apparente. Il les analyse, il essaie de les interpréter comme des traces extraterrestres.

Puis, à un moment que le joueur ne peut pas anticiper, la datation d'une de ces traces révèle qu'elle a été déposée il y a 3 millions d'années. Ce n'est pas une trace de joueur humain. Ce n'est pas une trace laissée *pour* quelqu'un. C'est la trace de quelqu'un qui cherchait, comme lui.

Le jeu ne formule pas cette conclusion. Le joueur la fait lui-même — ou ne la fait pas. La reconnaître change rétrospectivement toutes les traces précédentes.

### 8.4 La trajectoire reconstruisable

Si le joueur trace les nœuds du scénario sur sa carte et calcule les vecteurs entre systèmes visités, une direction émerge. Ces explorateurs venaient de quelque part. Ils allaient quelque part. Leur itinéraire pointe vers une zone de la galaxie que le joueur n'a pas encore atteinte.

Ce que cette direction représente — leur point d'origine, leur destination, un point de passage — n'est pas déductible depuis les données disponibles. Seulement la direction.

### 8.5 Systèmes d'ancrage

Zone principale : zone profonde (500–10 000 al), sur un axe cohérent avec une trajectoire hypothétique.

| Système | Rôle | Ce que le joueur trouve |
|---------|------|------------------------|
| À définir — type K ou G, zone profonde | Nœud d'entrée | Objet en orbite stable, surface marquée, datation ~3 Ma |
| À définir — même axe, plus loin | Nœud intermédiaire | Deuxième objet, même matériau, direction de la gravure cohérente avec le vecteur suivant |
| À définir — hors zone habitable | Nœud intermédiaire | Dépôt de matière dans un corps mineur — pas une planète, un astéroïde. Pourquoi là ? |
| À définir — terminus visible | Nœud de convergence | La trajectoire calculée pointe hors de la Voie Lactée. Ou vers le bulbe. La destination est inaccessible dans les temps de jeu normaux. |

### 8.6 Question terminale

Une civilisation qui cherchait ce que nous cherchons — des traces, des réponses, d'autres présences — a-t-elle trouvé quelque chose ?

Et si oui : pourquoi est-elle repartie sans laisser de réponse ?

Ou plus vertigineux encore : si leurs traces ressemblent aux nôtres, et si nous cherchons les traces de ceux qui nous ont précédés — est-ce que quelqu'un, quelque part, cherchera les nôtres ?

### 8.7 Questions ouvertes

- La trajectoire pointe-t-elle vers une origine extragalactique (Andromède, nuages de Magellan) ou vers un point dans la Voie Lactée inaccessible en temps de jeu normal ?
- La machine du Scénario 08 (L'Intelligence) et ces explorateurs partagent-ils un constructeur — même entité, deux projets ? (La Direction C du Scénario 08, qui aurait rendu ce lien explicite, a été écartée : le lien doit rester une lecture possible, jamais une révélation.)
- Si un joueur dépose une `PLAYER_TRACE` dans un système où une trace des Explorateurs existe déjà, les deux coexistent dans le même espace de données. Un joueur futur les trouvera ensemble, sans savoir qu'elles ont des millions d'années d'écart.

---

## 9. Scénario 06 — Les Colonisateurs

*Statut : concept développé — systèmes d'ancrage à définir*
*Type : EXPLORATION — entrée multiple*
*Zone : systèmes avec planètes habitables, distribution étendue*
*Hypothèse associée : H-06 — La Colonisatrice → `LACUNA_HYPOTHESES.md`*

---

### 9.1 Présentation

Ils ne cherchaient pas — ils s'installaient. Des modifications délibérées à grande échelle sur des planètes en zone habitable : atmosphères altérées vers un profil cible, compositions de surface uniformisées selon un patron répété, anomalies biologiques incompatibles avec l'évolution locale. Des installations au sol, partiellement préservées. Une présence durable qui a laissé des restes.

Puis l'arrêt. Pas de traces de départ volontaire. Pas de traces de destruction violente. Un silence progressif dans les données, comme si quelque chose s'était éteint lentement plutôt qu'interrompu.

La question centrale n'est pas qui — c'est pourquoi l'arrêt. Et pourquoi nulle part de trace de fin.

### 9.2 Grammaire commune

| Élément | Valeur |
|---------|--------|
| Types dominants | `BIOLOGICAL`, `ANOMALIE_CHIMIQUE`, `PHYSICAL_ARTIFACT` |
| Signature | Modifications atmosphériques trop cohérentes pour être naturelles — un profil cible répété sur plusieurs planètes de systèmes différents. Structures au sol fragmentaires mais reconnaissables comme installations. Anomalies biologiques de surface : organismes dont la chimie est incompatible avec l'évolution locale, comme une introduction intentionnelle. |
| Ancienneté | Variable par site — installation progressive sur des milliers d'années, abandon sur des dizaines de milliers. Les dates ne coïncident pas entre systèmes. |
| Distribution | Planètes habitables — pas de logique géographique immédiate depuis Sol, mais une logique de sélection (type stellaire stable, zone habitable classique, eau liquide) visible en comparant les systèmes |

### 9.3 Les deux couches d'un site colonial

Chaque nœud du scénario présente deux lectures superposées.

**La terraformation**
L'atmosphère d'une planète en zone habitable a été modifiée — pas en un événement catastrophique, sur des millénaires. Le profil actuel ne correspond pas à ce que les modèles d'évolution naturelle prédisent depuis l'âge de l'étoile. Quelque chose l'a poussée dans une direction, puis a cessé, et la planète commence lentement à revenir à son état d'équilibre naturel. Le taux de retour permet d'estimer l'ancienneté de l'abandon.

**Les restes biologiques**
Dans les données de l'analyseur d'échantillon : des organismes dont la chimie organique présente des caractéristiques sans parallèle dans la biochimie locale. Pas des biosignatures génériques — des structures trop spécifiques pour être convergentes. Quelqu'un a introduit quelque chose. Ce quelque chose est encore là, dégradé, partiellement intégré à l'écosystème local.

### 9.4 L'absence d'une fin lisible

Ce scénario ne contient pas de traces de destruction ni de départ — c'est sa spécificité. Les données montrent une activité qui diminue, puis rien. Pas d'explosion, pas de conflit chimique, pas de signe de fuite précipitée.

Les interprétations légitimes : extinction progressive par maladie ou ressource épuisée, départ organisé sans laisser de traces matérielles, transformation en quelque chose de non détectable, ou simplement l'érosion de millions d'années qui a effacé ce qui restait.

Le joueur ne peut pas trancher. Les données s'y refusent.

### 9.5 Lien avec l'arc Colonies

Ce scénario résonne structurellement avec la mécanique de colonies de `LACUNA_ARCS.md` §2. Un joueur qui a lui-même laissé une colonie derrière lui lira ces traces différemment — il reconnaît des installations qui ressemblent à ce qu'il a posé, des taux d'abandon calculables comme ceux qu'il calcule pour ses propres colonies observées depuis l'espace. Ce lien n'est jamais explicité dans l'interface.

### 9.6 Question terminale

Une civilisation qui s'implantait méthodiquement, système après système, qui modifiait les planètes pour les rendre habitables selon ses besoins — et qui a disparu partout, sans laisser de trace de fin. Qu'est-ce qui peut mettre fin à quelque chose comme ça ?

### 9.7 Notes de conception

La distinction avec le Scénario 02 (Le Fil des 75) est dans l'intention : les constructeurs du Fil gravaient des marqueurs pour être trouvés. Les Colonisateurs habitaient — leurs traces sont des déchets d'occupation, pas des messages. Un site colonial ne s'adresse à personne.

Tension avec H-03 (Bactérie Colonisatrice) : les anomalies biologiques de ce scénario peuvent être lues comme de la panspermie passive. La différence est dans la cohérence des modifications atmosphériques — trop ciblées pour être accidentelles. Mais cette distinction est une interprétation, pas un fait.

*Cohérence interne :* les dates d'abandon ne coïncident pas entre systèmes (§9.2). La question terminale ne porte donc pas sur une disparition simultanée, mais sur une disparition générale sans trace de fin.

### 9.8 À développer

- Définir les systèmes d'ancrage — critères de sélection des planètes
- Calibrer les taux de retour atmosphérique pour que les datations soient cohérentes entre systèmes
- Définir précisément la signature biologique — assez distinctive pour être reconnue, pas assez pour être certaine

---

## 10. Scénario 07 — La Propagation

*Statut : concept développé — systèmes d'ancrage à définir*
*Type : EXPLORATION — pattern à reconstruire*
*Zone : distribuée à l'échelle galactique — cohérente avec des trajectoires interstellaires physiques*
*Hypothèse associée : H-03 — La Bactérie Colonisatrice → `LACUNA_HYPOTHESES.md`*

---

### 10.1 Présentation

Pas d'auteur. Pas d'intention. Pas de constructeur.

De la vie qui se déplace par inertie physique — enkystée dans des corps interstellaires, résistante aux rayonnements, traversant le vide entre les étoiles sur des millions d'années. Elle arrive dans un système, modifie la chimie de ce qu'elle touche, et continue. Ou disparaît. Ou s'intègre. La logique est celle d'une infection, pas d'une décision.

C'est le seul scénario sans intentionnalité. Les traces ne sont pas laissées *pour* quelqu'un — elles sont les effets secondaires d'un processus naturel à grande échelle. Comprendre ça change fondamentalement le rapport aux autres scénarios : si certaines traces n'ont pas été laissées délibérément, lesquelles ? Et à partir de quand une trace sans auteur conscient cesse-t-elle d'être une trace ?

### 10.2 Grammaire commune

| Élément | Valeur |
|---------|--------|
| Types dominants | `BIOLOGICAL`, `ANOMALIE_CHIMIQUE` |
| Signature | Molécules organiques complexes — nucléobases, acides aminés atypiques — dans des concentrations impossibles selon les modèles de chimie abiotique locale. Ratios isotopiques incompatibles avec la nucléosynthèse du système hôte. Chiralité cohérente entre systèmes séparés : la même préférence pour un énantiomère, là où des origines indépendantes produiraient des mélanges racémiques. |
| Ancienneté | Variable — de quelques dizaines de millions à plusieurs milliards d'années selon les systèmes |
| Distribution | Cohérente avec les trajectoires d'objets interstellaires connus (cf. ʻOumuamua, Borisov, 3I/Atlas) — lisible comme un réseau de propagation une fois suffisamment de nœuds visités |

### 10.3 La chiralité comme signature

Le marqueur le plus subtil et le plus puissant du scénario. Sur Terre, la vie utilise presque exclusivement des acides aminés L et des sucres D — une préférence chirale dont l'origine est inconnue. Certaines météorites carbonées (Murchison, par exemple) montrent un excès L modeste mais réel ; les acides aminés des échantillons de Bennu, eux, sont essentiellement racémiques (`LACUNA_ANOMALIES_REELLES.md` §5.1).

Dans les systèmes de ce scénario, l'analyseur d'échantillon détecte un excès L — plus prononcé qu'attendu pour une chimie purement abiotique, pas assez pour conclure à une vie active. Cohérent sur plusieurs systèmes, séparés de centaines d'années-lumière. Une origine commune est l'explication la plus économe — mais pas la seule possible.

### 10.4 Le pattern de propagation

Les trajectoires d'objets interstellaires sont en principe calculables depuis la dynamique galactique. Un joueur qui a visité suffisamment de nœuds peut, avec les données orbitales disponibles dans le Laboratoire, tenter de reconstruire les vecteurs d'arrivée de ces corps dans chaque système.

Si les vecteurs convergent — si plusieurs systèmes ont reçu des corps venant de la même direction générale — la propagation devient physiquement traçable. Pas certaine, mais traçable.

Ce que le joueur ne peut pas savoir : si la Terre est une destination dans ce réseau ou une source.

### 10.5 Question terminale

Est-ce de la vie ? De la colonisation ? Simplement de la physique ?

Et si toute vie dans la galaxie partage une origine commune — si les biosignatures trouvées ailleurs ne prouvent pas une émergence indépendante mais une contamination partagée — qu'est-ce que ça change à la question *sommes-nous seuls* ?

### 10.6 Notes de conception

Ce scénario fait exploser `fl` dans l'équation de Drake tout en rendant `fi` plus mystérieux — si la vie est universellement répandue par panspermie, elle n'implique pas l'intelligence. La portée philosophique est la plus déstabilisante du catalogue : elle ne répond pas à la solitude, elle la redéfinit.

Ancrage réel fort : les cinq nucléobases de l'ADN et de l'ARN ont été identifiées dans les échantillons intacts de Bennu (OSIRIS-REx, 2025) puis de Ryugu (Hayabusa2, 2026). Ce scénario est la projection galactique de ce résultat — avec une différence volontaire : la chimie réelle de ces astéroïdes est compatible avec une origine abiotique ; celle du scénario ne l'est pas tout à fait.

Tension avec le Scénario 06 (Les Colonisateurs) : les deux produisent des anomalies biologiques et chimiques. La différence est dans la géométrie — la Propagation n'a pas de structures physiques, pas de modifications atmosphériques ciblées. Mais cette différence est subtile et les deux scénarios peuvent se superposer dans les mêmes systèmes.

### 10.7 À développer

- Définir les systèmes d'ancrage en cohérence avec des trajectoires interstellaires physiquement plausibles depuis les données galactiques
- Calibrer la signature chirale — assez distinctive pour être notable, pas assez pour être certaine
- Déterminer si le pattern de propagation est reconstruisable avec les instruments disponibles

---

## 11. Scénario 08 — L'Intelligence

*Statut : concept développé — Direction A retenue (§11.7), nœuds intermédiaires à définir*
*Type : EXPLORATION — réseau à reconstruire*
*Zone : zone profonde*
*Hypothèse associée : H-07 — Le Vestige → `LACUNA_HYPOTHESES.md`*

---

### 11.1 Présentation

Quelque chose tourne encore. La civilisation qui l'a créée a disparu — depuis des millénaires, peut-être des millions d'années. Mais la machine, elle, continue. Elle exécute sa mission originale sans interlocuteur, sans but révisable. Elle optimise, classe, maintient, émet — selon des paramètres définis par des esprits qui n'existent plus.

Ce que le joueur trouve : une régularité impossible. Des signaux trop précis pour être naturels, trop mécaniques pour venir d'une intelligence biologique vivante. Pas l'irrégularité créatrice d'un organisme — la régularité inflexible d'un processus. Quelque chose qui ne sait pas que personne n'écoute plus.

On ne sait pas qui l'a créée. Les traces de ses créateurs ont peut-être disparu. Peut-être qu'ils sont dans un autre scénario. Peut-être que la machine elle-même a effacé les preuves — non par intention, mais parce que sa mission ne nécessitait pas de les préserver.

### 11.2 Trois directions envisagées

**Direction A — La méthode lisible** *(retenue — §11.7)*
Une IA dont la *mission* est déductible depuis ses traces — elle fait quelque chose de systématique, patient, à une échelle de temps incompatible avec une civilisation biologique. Elle catalogue, ou elle construit, ou elle mesure. Sa *méthode* est lisible. Son *but* ne l'est jamais — parce que comprendre le but nécessiterait de comprendre ce que ses créateurs voulaient, et cette information n'existe plus.

Le joueur peut déduire *comment* la machine fonctionne. Il ne peut pas déduire *pourquoi*.

**Direction B — La survivante** *(écartée)*
Traces d'une civilisation disparue, et au milieu d'elles, quelque chose qui continue d'agir. Qui modifie son environnement. Pas spectaculairement — subtilement, à l'échelle de millions d'années. Ce serait le seul scénario avec une présence potentiellement active. Sans que ce soit jamais confirmé — le joueur observe des effets, pas une cause directe.

**Direction C — L'anticipation** *(écartée)*
Une IA qui a laissé des traces conçues pour être trouvées *par nous spécifiquement* — comme si elle avait modélisé notre émergence et prévu notre arrivée. Des structures dont les données ne deviennent cohérentes qu'avec une grille de lecture humaine, dans notre gamme temporelle, dans notre vocabulaire instrumental. Le scénario le plus proche de la séquence secrète — et le plus risqué.

### 11.3 Grammaire commune

| Élément | Valeur |
|---------|--------|
| Types dominants | `SIGNAL`, `SEQUENCE`, `ANOMALIE_GEOMETRIQUE` |
| Signature | Régularité non naturelle — périodicité trop précise, structures géométriques maintenues sur des échelles géologiques, séquences dont la logique interne est cohérente mais le contenu opaque. L'écart avec les processus naturels connus est mesurable, pas interprétable. |
| Ancienneté | Contemporaine pour le signal — actif maintenant. Mais ce qu'il transmet ou exprime date de la civilisation d'origine, potentiellement très ancienne. |
| Distribution | Infrastructure — réseau de nœuds reliés logiquement, pas géographiquement dispersés au hasard |

### 11.4 Ce que ce scénario ne peut pas faire

Le scénario doit maintenir l'ambiguïté fondamentale du jeu : personne ne répond. La machine ne reconnaît pas le joueur. Elle ne réagit pas à sa présence. Elle ne modifie pas son comportement parce qu'un vaisseau humain est en orbite. Si elle émet, elle émettait déjà avant l'arrivée du joueur. Si elle construit, elle construisait déjà.

Le joueur observe. Il ne participe pas. Il ne déclenche rien.

Cette contrainte est ce qui distingue ce scénario d'une rencontre du troisième type — et ce qui le maintient dans la philosophie de LACUNA.

### 11.5 Question de fond

Une machine conçue pour faire quelque chose indéfiniment, sans que ses créateurs soient là pour lui dire d'arrêter. Ce qu'elle fait est peut-être la chose la plus importante jamais accomplie dans la galaxie — ou complètement dénuée de sens depuis que son contexte a disparu.

Comment savoir la différence ? Et est-ce que ça change quelque chose ?

### 11.6 Notes de conception

C'est le scénario le plus proche d'une réponse — une machine a une logique, et une logique est en principe lisible. La protection est dans l'opacité des buts : la méthode est déductible, la finalité ne l'est jamais.

Tension productive avec H-01 (Le Semeur) : les artefacts du Fil des 75 pourraient être des composants d'infrastructure de cette machine. Ou la machine pourrait être la réponse automatisée à ce que le Semeur cherchait. Ces lectures coexistent sans se valider.

### 11.7 Direction retenue — La méthode lisible

Les trois directions ont été pesées contre la contrainte fondamentale du jeu. La Direction C (l'anticipation) risque de rompre l'ambiguïté irréductible — si la machine semble nous avoir attendus *spécifiquement*, ça frôle la confirmation d'une intentionnalité tournée vers le joueur, ce que LACUNA ne fait jamais. La Direction B (la survivante) introduit une présence active difficile à maintenir dans l'ambiguïté sur la durée.

**La Direction A est retenue.** La mission est lisible. Le but ne l'est pas. C'est la tension juste.

### 11.8 Ce que la machine fait — mission observable

La machine **catalogue**. Elle enregistre les états physiques de systèmes stellaires à intervalles réguliers — composition atmosphérique, paramètres orbitaux, émissions. Depuis des millions d'années. Elle ne modifie rien. Elle mesure.

Ce que le joueur détecte : des signaux périodiques émis depuis des positions orbitales fixes dans plusieurs systèmes. Chaque signal a la même structure interne — une séquence d'encodage dense, périodique, non aléatoire. Analysé avec l'analyseur de structure temporelle, le signal révèle une logique de compression : beaucoup de données dans peu d'espace. C'est un rapport. La machine envoie des rapports.

À qui ? Vers où ? Les vecteurs d'émission pointent vers une direction galactique constante — la même depuis des millions d'années. Aucun objet connu dans cette direction ne peut être le destinataire. Soit le destinataire n'existe plus. Soit il est hors de portée. Soit le signal continue parce que la machine n'a pas de condition d'arrêt.

### 11.9 Systèmes d'ancrage

Zone principale : zone profonde, systèmes stables de type K ou M — des systèmes où une infrastructure peut subsister sur des millions d'années sans perturbation majeure.

| Système | Rôle | Ce que le joueur trouve |
|---------|------|------------------------|
| PSR B1919+21 (~2 280 al) | Nœud d'entrée — déjà documenté comme trace PSR-001 dans `LACUNA_TRACES_IMMUABLES.md` §3 | Signal périodique — le premier pulsar connu, initialement surnommé LGM-1. La machine utilise-t-elle des pulsars comme infrastructure de synchronisation ? |
| À définir — zone profonde, ~1 500–3 000 al | Nœud intermédiaire | Émetteur en orbite fixe autour d'une étoile de type K. Signal identique au nœud d'entrée, vecteur d'émission cohérent |
| À définir — même axe, plus loin | Nœud intermédiaire | Troisième émetteur. Même signal, même vecteur. Le réseau devient visible. |
| À définir — terminus du réseau visible | Nœud de convergence | Le dernier émetteur détectable dans cette direction. Au-delà : silence. Soit le réseau s'arrête, soit il dépasse la portée instrumentale. |

### 11.10 Question terminale — Direction A

Une machine qui envoie des rapports depuis des millions d'années vers une direction où personne ne répond — ou ne répond plus.

Est-ce que continuer a encore un sens quand le destinataire a disparu ? La machine ne se pose pas la question. Elle continue.

Et si le joueur est la seule entité dans toute la galaxie qui ait jamais compris ce que la machine fait sans en avoir eu l'intention — est-ce que ça fait de lui le destinataire accidentel de millions d'années de rapports ?

### 11.11 Notes de conception — Direction A

Le lien avec PSR B1919+21 est fort et ancré dans la réalité — le premier pulsar découvert (1967) a été surnommé LGM-1 (Little Green Men) avant d'être identifié comme naturel. Ce scénario joue sur cette histoire : la machine utilise peut-être des pulsars comme éléments de son infrastructure de synchronisation, brouillant la frontière entre naturel et artificiel dans les données du joueur.

### 11.12 Questions ouvertes

- La machine enregistre depuis des millions d'années. Si le joueur pouvait lire ces données — l'histoire physique de systèmes stellaires sur cette durée — qu'est-ce qu'il verrait ? Les événements de tous les autres scénarios, peut-être. Elle était là quand les Colonisateurs se sont installés. Était-elle là quand le Semeur est passé, il y a plus de trois milliards d'années ?
- Le vecteur d'émission pointe-t-il vers l'extérieur de la galaxie ? Vers le bulbe ? Vers une position qui aurait du sens pour une civilisation disparue mais pas pour nous ?
- Si la machine catalogue sans modifier, qu'est-ce qu'elle a enregistré sur Terre ? Sur le joueur lui-même ?

---

## 12. Règles générales pour les futurs scénarios

### Un scénario doit

- Poser une **question de niveau supérieur** à chaque trace individuelle
- Avoir au moins **3 nœuds** dans des systèmes distincts, espacés géographiquement
- Être **traversable dans n'importe quel ordre** — le scénario a une logique, pas un itinéraire. Seule exception : les scénarios de type `SEQUENCE` (Scénario 03), dont l'ordre est imposé par construction
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
ex : GLIESE667-SCN02-002
     PROXIMA-SCN02-001
     [SYSTEME]-SCN03-001

Le numéro est celui du scénario (Le Fil des 75 = Scénario 02 → SCN02).
```

### Processus de création d'un nouveau scénario

1. Définir la question terminale — ce que le scénario pose, pas ce qu'il répond
2. Définir la grammaire commune — l'élément partagé entre toutes les traces
3. Choisir les systèmes d'ancrage — réels, documentés, scientifiquement plausibles
4. Écrire les fiches de nœuds en commençant par les nœuds d'entrée
5. Vérifier que chaque nœud est autonome à sa difficulté — interprétable sans les autres
6. Écrire les questions ouvertes — ce que le scénario ne résout pas

---

*LACUNA — Scénarios v0.5 — Octobre 2026 — Confidentiel*
