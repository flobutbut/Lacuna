*Dernière modification : 2026-03-11 15:11*

# LACUNA — Catalogue des Traces
*Version 0.9 — Mars 2026*

---

## Table des matières

1. [Grammaire des traces](#1-grammaire-des-traces)
2. [Traces immuables — Voisinage solaire](#2-traces-immuables--voisinage-solaire)
3. [Traces immuables — Hors voisinage](#3-traces-immuables--hors-voisinage)
4. [Traces non-joueur — Le Journal de Yael](#4-traces-non-joueur--le-journal-de-yael)
5. [Traces joueurs](#5-traces-joueurs)
6. [Règles de conception](#6-règles-de-conception)

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 0.1 | Mars 2026 | Document initial — grammaire, types, fiches voisinage solaire |
| 0.2 | Mars 2026 | Corrections — zones géographiques (Profonde 500–10 000 al, Mythique > 10 000 al), WOW! fréquence 1420.4556 MHz |
| 0.3 | Mars 2026 | Ajout type PHYSICAL_ARTIFACT à la grammaire, renvoi LACUNA_SCENARIOS.md pour les arcs narratifs, note de cross-référence §2 |
| 0.4 | Mars 2026 | Ajout type ARTEFACT_JOURNAL — objet narratif de convergence distinct de PHYSICAL_ARTIFACT. Introduction de la clé de décodage, du format d'identifiant étendu, et des règles de conception propres aux artefacts-journaux. Mise en cohérence avec LACUNA_SCENARIOS.md v0.3 |
| 0.5 | Mars 2026 | Ajout type BIOLOGICAL. Séparation structurelle traces immuables / JOURNAL / TRACE_JOUEUR. |
| 0.6 | Mars 2026 | Refonte §1 — grammaire reconstruite depuis les instruments. |
| 0.7 | Mars 2026 | Refonte complète §1 — définition reconstruite depuis l'expérience joueur. Trace = écart entre modèle et données. Deux modes d'accès (signal passif / observation active). Propriétés d'un signal (support, fréquence, contenu, durée de vie). Niveaux d'observation par coût physique. Anomalies comme familles de domaines physiques. Interprétations comme classes séparées des anomalies. Suppression des anciens "types" comme catégories assignées. |
| 0.8 | Mars 2026 | Distinction capteurs / instruments. Les capteurs (récepteur radio, détecteur énergétique, détecteur gravitationnel) capturent à bord ; les instruments du Laboratoire analysent. Ajout instruments d'analyse pour signaux : analyseur spectral, analyseur structure temporelle, analyseur polarisation, analyseur spectre énergétique, analyseur gravimétrique. Réf. LACUNA_LABORATOIRE_INSTRUMENTS.md. |
| 0.9 | Mars 2026 | Modèle Option A — sources de signaux : objets émetteurs permanents (pulsar, étoile à neutrons, magnétar) vs événements transients. PSR-001 modélisé comme system_object PULSAR. Réf. Documentation-backend.md. |

---

## 1. Grammaire des traces

### 1.1 Définition

Une trace est un **écart entre ce que les modèles prédisent et ce que les données montrent**, détecté lors de l'analyse d'un objet physique.

Ce n'est pas l'objet lui-même. Ce n'est pas le signal, la planète, l'astéroïde. C'est l'anomalie dans leur analyse — le moment où les données ne correspondent pas à ce qu'un processus naturel connu produirait.

Le jeu ne désigne jamais une trace. Il retourne des données. C'est le joueur qui détecte l'écart, qui décide qu'il mérite attention, et qui formule une interprétation. Cette interprétation n'est jamais certaine.

---

### 1.2 Les deux modes d'accès

Le joueur entre en contact avec une anomalie par deux chemins distincts.

**Mode passif — un signal arrive**
Quelque chose atteint les **capteurs** du vaisseau sans que le joueur l'ait cherché. Une fréquence radio, un sursaut gamma, une perturbation gravitationnelle. Les capteurs enregistrent des données brutes. Le joueur les envoie au Laboratoire pour analyse. Sa première décision : est-ce que ça mérite un changement de cap ?

Un signal est caractérisé par quatre propriétés indépendantes :

| Propriété | Ce qu'elle décrit | Ce qu'elle pose comme question |
|-----------|------------------|-------------------------------|
| **Support** | La nature physique de l'onde — électromagnétique (radio, X, gamma, visible), gravitationnelle, particulaire (neutrinos, rayons cosmiques) | Quel capteur le capture ? Quels instruments du Laboratoire l'analysent ? |
| **Fréquence** | La structure du signal dans son support — longueur d'onde, fréquence d'oscillation | Cette fréquence est-elle signature d'un processus naturel connu ? |
| **Contenu** | Ce qui est encodé dans le signal — émission brute, périodicité, pattern, séquence | Y a-t-il une structure qui résiste à une explication naturelle simple ? |
| **Durée de vie** | La temporalité du phénomène — ponctuel, périodique, continu, en déclin | Un signal ponctuel irreproduit et une émission stable depuis des millénaires posent des questions radicalement différentes |

La source — l'origine spatiale du signal — est souvent ce que le joueur doit déterminer en changeant de cap.

---

**Mode actif — le joueur observe un système**
Le joueur pointe ses instruments vers une étoile et descend progressivement vers le détail. Chaque niveau révèle ce que le précédent ne pouvait pas donner. Chaque niveau a un coût en temps et en ressources.

| Niveau | Condition | Ce qui devient accessible |
|--------|-----------|--------------------------|
| **Observation lointaine** | En transit — aucun déplacement | L'étoile : type spectral, courbe de luminosité, émissions. Le système : corps détectables, orbites grossières |
| **Observation du système** | Changement de cap vers l'étoile | Orbitographie précise, résonances, corps anormaux, ce qui manque là où les modèles prédisent quelque chose |
| **Orbite proche d'un corps** | Approche d'une planète, lune, astéroïde | Atmosphère, surface, champ magnétique, distribution volumétrique des anomalies |
| **Contact** | Atterrissage ou récupération d'objet | Composition fine, structure interne, datation, et — observation directe sans médiation instrumentale |

Le niveau contact est le seul où la médiation instrumentale peut disparaître partiellement. Le joueur peut voir quelque chose directement — une forme, une structure, un organisme — avant même de l'analyser.

---

### 1.3 Capteurs et instruments

> **Distinction fondamentale** : Un **capteur** est à bord et *capte* un signal (enregistrement). Un **instrument** est au Laboratoire et *analyse* les données capturées (rapport structuré). Voir `LACUNA_LABORATOIRE_INSTRUMENTS.md` pour la référence complète.

#### Capteurs (à bord — capture des signaux)

| Capteur | Support | Données capturées |
|---------|---------|-------------------|
| Récepteur radio | EM radio, micro-ondes | Fréquence, durée, polarisation brute, forme d'onde |
| Détecteur d'événements énergétiques | Gamma, X, UV extrême | Durée, intensité, spectre énergétique grossier |
| Détecteur gravitationnel | Ondes gravitationnelles, perturbations | Perturbations mesurées, direction, amplitude |

Les capteurs produisent les données brutes d'une observation "Signal reçu". Ils ne figurent pas dans la grille du Laboratoire.

#### Instruments du Laboratoire (analyse)

**Pour signaux captés** (travail sur les données des capteurs) :

| Instrument | Type d'observation | Données produites |
|------------|-------------------|-------------------|
| Analyseur spectral | Signal EM radio | Spectre détaillé (FFT), raies, bande passante |
| Analyseur de structure temporelle | Tout signal | Périodicité, patterns, modulation |
| Analyseur de polarisation | Signal EM | État de polarisation (linéaire, circulaire) |
| Analyseur de spectre énergétique | Signal gamma/X | Spectre énergétique détaillé, comparaison modèles |
| Analyseur gravimétrique | Signal gravitationnel, données orbitales | Modélisation sources, masse, corps invisibles |

**Pour observations actives** (système, orbite, contact) :

| Instrument | Niveau requis | Données produites |
|------------|---------------|-------------------|
| Spectromètre stellaire | Observation lointaine | Type spectral, courbe de luminosité, variations |
| Analyseur orbital | Observation système | Demi-grand axe, excentricité, résonances |
| Spectromètre atmosphérique | Orbite proche | Profil moléculaire, déséquilibres chimiques |
| Analyseur volumétrique | Orbite proche | Cartes densité 3D, gradients, tomographie |
| Scanner morphologique | Orbite proche → contact | Modèle de surface, géométrie, symétries |
| Magnétomètre | Orbite proche | Intensité, orientation du champ magnétique |
| Spectromètre de contact | Contact | Éléments, ratios isotopiques, minéralogie |
| Analyseur d'échantillon | Contact | Molécules complexes, structures organiques |

---

### 1.4 Les anomalies détectables

Une anomalie est un écart entre données observées et modèle attendu. Elle est détectée par un ou plusieurs instruments, sur un objet physique support. Ce tableau liste les familles d'anomalies — pas des types de traces, des domaines physiques où l'écart peut apparaître.

| Famille | Support typique | Instruments | Nature de l'écart |
|---------|----------------|-------------|-------------------|
| **Électromagnétique** | Signal reçu, étoile | Analyseur spectral, analyseur polarisation, analyseur spectre énergétique, spectromètre stellaire | Fréquence inattendue, structure non aléatoire, polarisation atypique, intensité anormale |
| **Orbitale / cinétique** | Corps planétaire, corps mineur, objet en transit | Analyseur orbital | Trajectoire impossible, résonance trop parfaite, accélération sans source |
| **Chimique** | Atmosphère, surface, corps mineur, échantillon | Spectromètre atmosphérique, spectromètre de contact, analyseur d'échantillon | Molécules impossibles, ratios isotopiques incohérents, abondances anormales |
| **Morphologique** | Objet en orbite, surface, objet récupéré | Scanner morphologique, analyseur volumétrique | Géométrie non naturelle, symétries régulières, structure en couches délibérée |
| **Thermique** | Surface, atmosphère, objet | Scanner morphologique, spectromètre atmosphérique | Gradient de température incohérent, source de chaleur non identifiée |
| **Temporelle** | Tout objet revisité | Analyseur structure temporelle, tout instrument — comparaison entre deux visites | Structure temporelle atypique, changement entre deux observations |
| **Gravitationnelle** | Système, corps | Analyseur gravimétrique, analyseur orbital | Masse incompatible avec le volume, corps non visible mais détectable, perturbation sans source |
| **Absence** | Système, zone | Analyseur orbital, analyseur volumétrique, spectromètre stellaire | Écart statistique — ce qui manque là où les modèles prédisent une présence |

---

### 1.5 Les classes d'interprétation

Après analyse d'une anomalie, le joueur peut formuler une interprétation. Le jeu ne valide aucune interprétation — il retourne des données, pas des conclusions.

| Classe | Ce qu'elle pose | Ce qui peut la soutenir |
|--------|----------------|------------------------|
| **Naturel connu** | Un processus physique connu suffit à expliquer l'anomalie | Modèles existants compatibles avec toutes les données |
| **Naturel inconnu** | Un processus physique non encore documenté pourrait expliquer l'anomalie | Données cohérentes mais sans modèle établi |
| **Biologique** | Une activité métabolique — passée ou présente — a produit ou transformé ce qu'on observe | Déséquilibres chimiques cohérents à plusieurs échelles, minéraux biogéniques, gradients isotopiques caractéristiques, ou observation directe d'organismes |
| **Intentionnel** | La structure ou la distribution de l'anomalie suggère une volonté — quelqu'un a fait ça délibérément | Pattern non aléatoire, fréquence choisie, emplacement délibéré, géométrie non naturelle |
| **Artificiel** | L'objet ou le phénomène a été fabriqué ou modifié par une intelligence | Matériaux impossibles naturellement, structure manufacturée, datation incompatible avec une origine naturelle |

Ces classes ne sont pas exclusives. Une anomalie peut être simultanément biologique et intentionnelle, ou naturelle inconnue et apparemment intentionnelle. L'ambiguïté entre les classes est structurelle — elle ne se résout pas.

---

### 1.6 Objets narratifs spéciaux

Deux objets cumulent plusieurs anomalies et portent une dimension narrative propre. Ils ne remplacent pas les anomalies — ils en sont une convergence.

#### PHYSICAL_ARTIFACT
Un objet dont l'ensemble des anomalies morphologiques, chimiques et orbitales converge vers une seule conclusion : il a été fabriqué. Il pose une question par ce qu'il *est* — sa forme, ses matériaux, sa position.

```
Détection       : scanner morphologique (géométrie non naturelle)
Analyse         : spectromètre de contact (matériaux, datation) + analyseur volumétrique (structure)
Question posée  : qui l'a fait, et pourquoi ici ?
```

#### ARTEFACT_JOURNAL
Un objet physique récupérable qui contient une archive encodée — texte dans une langue inconnue, séquences mathématiques, enregistrements structurés. Il se décode avec une clé déduite de traces antérieures. Décoder n'est pas comprendre — la distance culturelle reste irréductible.

```
Détection       : scanner morphologique + analyseur d'échantillon (structure interne organisée)
Décodage        : clé calculée à partir de données collectées dans le même scénario
Propriété       : les lacunes sont structurelles — elles font partie de ce que l'artefact est
```

Propriétés invariantes :
- Toujours en aval d'un scénario — jamais trouvé sans traces préalables résolues
- Ne résout pas le scénario — approfondit la question terminale
- Décoder ≠ comprendre — certains passages restent opaques par distance culturelle, pas par manque de clé

---

### 1.7 Niveaux de difficulté

| Niveau | Définition | Condition typique |
|--------|-----------|-------------------|
| 1 | Anomalie évidente — un instrument, signal fort | Passif ou observation lointaine |
| 2 | Anomalie subtile — un instrument attentif, ou deux instruments | Observation système ou orbite proche |
| 3 | Anomalie composite — deux ou trois instruments croisés | Orbite proche requise |
| 4 | Anomalie profonde — combinaison complète, contact requis, ou croisement inter-systèmes | Contact ou déplacement physique significatif |

---

### 1.8 Structure d'une fiche de trace

Chaque trace immuable est documentée avec :

- **Désignation** — identifiant unique
- **Système** — étoile hôte
- **Support** — l'objet physique sur lequel l'anomalie est détectée
- **Instruments requis** — ce qu'il faut utiliser pour détecter et analyser
- **Difficulté** — 1 à 4
- **Ancrage réel** — le phénomène scientifique de référence
- **Ce que le joueur voit** — description de la présentation dans l'interface
- **Ce que les données disent** — les faits bruts, sans interprétation
- **Ce que les données ne disent pas** — les questions ouvertes
- **Pointe vers** — système ou trace suivante (optionnel, pour les traces de difficulté 2+)
- **Interprétations canoniques** — les lectures légitimes possibles, sans en valider aucune

Les fiches `ARTEFACT_JOURNAL` comportent des champs supplémentaires :

- **Clé de décodage** — quelles traces antérieures permettent de la calculer
- **Langue** — caractérisation de la structure linguistique ou mathématique
- **Fragments** — nombre de fragments, distribution dans le scénario, lacunes connues
- **Ce que le décodage révèle** — ce qui devient lisible avec la clé
- **Ce que le décodage ne révèle pas** — ce qui reste opaque même après décodage

---

### 1.9 Format d'identifiant étendu

Les traces appartenant à un scénario SEQUENCE utilisent un format d'identifiant étendu qui encode leur position dans la séquence :

```
Xx-xxx-xxx-xx
│   │    │   └── Clé — hash dérivé de la résolution de la trace précédente
│   │    └────── Problème — données encodées propres à cette trace
│   └─────────── Position dans la séquence
└─────────────── Préfixe système
```

Ce format est identique visuellement aux identifiants ordinaires. La signification des champs n'est jamais expliquée dans l'interface. Elle est déduite.

---

## 2. Traces immuables — Voisinage solaire

*Systèmes à moins de 25 années-lumière du Soleil.*
*Toutes ancrées dans des phénomènes scientifiques réels et non résolus.*

> **Note** : Certaines traces appartiennent à des arcs narratifs qui relient plusieurs systèmes. Ces arcs — leurs fiches complètes, leurs connexions et leurs questions ouvertes — sont documentés dans `LACUNA_SCENARIOS.md`. Les traces listées ici sont des entrées autonomes du catalogue ; leur appartenance à un arc est indiquée dans le champ `scenarioArc`.

---

### SOL-001 — Signal WOW!
**Système :** Sagittarius (origine exacte inconnue)
**Type :** SIGNAL
**Difficulté :** 1 — visible dès l'arrivée en zone Sol, présenté dans l'onboarding

**Ancrage réel**
Le 15 août 1977, l'observatoire Big Ear de l'Ohio détecte un signal radio de 72 secondes à 1420,4556 MHz — exactement la fréquence de la raie de l'hydrogène. L'astronome Jerry Ehman encercle le relevé en écrivant "Wow!". Le signal n'a jamais été reproduit. Il n'a jamais été expliqué.

**Ce que le joueur voit**
Forme d'onde asymétrique caractéristique — montée progressive, pic, descente progressive. Signature typique d'une source ponctuelle traversant le lobe d'antenne. Durée exacte : 72 secondes. Fréquence annotée en rouge : 1420 MHz.

**Ce que les données disent**
- Fréquence : 1420,4556 MHz (raie de spin-flip de l'hydrogène neutre)
- Durée : 72 secondes — correspondant au passage dans le lobe d'antenne
- Intensité : 30 fois le bruit de fond
- Polarisation : inconnue (antenne non équipée pour la mesurer)
- Source : direction du Sagittaire, coordonnées débattues entre deux positions possibles
- Reproductions ultérieures : aucune en 47 ans d'écoute

**Ce que les données ne disent pas**
- Pourquoi cette fréquence exacte
- Pourquoi 72 secondes et pas plus
- Pourquoi jamais reproduit
- Si la source était fixe ou en mouvement
- Si c'était un signal ou une émission naturelle inconnue

**Interprétations canoniques**
- Émission naturelle d'un objet astrophysique inconnu (hydrogène interstellaire perturbé, comète — proposé en 2017, contesté)
- Balise volontaire choisissant la fréquence universelle de l'hydrogène
- Signal directif capté par coïncidence d'alignement
- Artefact instrumental — exclu par les vérifications successives

---

### PROXIMA-001 — Le Silence de Proxima b
**Système :** Proxima Centauri (4,24 al)
**Type :** ABSENCE
**Difficulté :** 1

**Ancrage réel**
Proxima b est une exoplanète confirmée en zone habitable de Proxima Centauri. Masse minimale 1,17 masse terrestre. Mais Proxima est une naine rouge ultra-active — elle produit des éruptions stellaires 10 à 100 fois plus énergétiques que le Soleil, plusieurs fois par jour. Le flux UV et X reçu par Proxima b est 100 fois supérieur à ce que reçoit la Terre. Les modèles actuels suggèrent que l'atmosphère de Proxima b aurait été érodée en quelques centaines de millions d'années. Pourtant — aucune observation directe n'a confirmé cette érosion.

**Ce que le joueur voit**
À l'arrivée dans le système : une naine rouge active, des éruptions visibles en temps réel dans les données UV, et une planète en zone habitable sans signature atmosphérique détectable. L'interface signale : *"Modèle atmosphérique attendu : absent des données."*

**Ce que les données disent**
- Proxima b : période orbitale 11,2 jours, zone habitable confirmée
- Activité stellaire : éruptions majeures détectées en continu
- Atmosphère de Proxima b : non détectée — en dessous du seuil de détection ou absente
- Biosignatures : aucune

**Ce que les données ne disent pas**
- Si l'absence d'atmosphère est due à l'érosion stellaire ou à une origine sans atmosphère
- Si une civilisation a pu s'y développer avant l'érosion
- Si une civilisation souterraine ou sous-marine pourrait subsister
- Pourquoi le taux d'éruptions semble légèrement plus irrégulier que les modèles stellaires ne le prévoient

**Pointe vers**
BARNARD-001 — la question de l'habitabilité des naines rouges, posée ici, trouve un écho différent à Barnard.

**Interprétations canoniques**
- Planète stérile par érosion atmosphérique — le scénario le plus probable selon les modèles
- Planète abritant une vie souterraine ou chimiotrophique non détectable à distance
- Civilisation passée ayant disparu avant le début des observations humaines
- Irrégularités d'éruptions : artefact statistique ou modulation externe inexpliquée

---

### BARNARD-001 — La Planète de van de Kamp
**Système :** Étoile de Barnard (5,96 al)
**Type :** ABSENCE
**Difficulté :** 2

**Ancrage réel**
En 1963, l'astronome Peter van de Kamp annonce avoir détecté deux planètes autour de l'étoile de Barnard par astrométrie — en mesurant les oscillations de l'étoile sur 25 ans de plaques photographiques. La découverte est saluée mondialement. En 1973, il est démontré que les oscillations correspondaient à des réajustements de l'optique du télescope. La découverte est retirée. Les planètes n'existaient pas — ou n'avaient pas été détectées correctement. En 2018, une potentielle super-Terre est annoncée par vélocimétrie radiale. Elle est contestée en 2021.

**Ce que le joueur voit**
En entrant dans le système : une étoile sans planète confirmée. Dans les archives de données récupérées depuis les bases humaines : deux séries d'observations contradictoires, séparées de 50 ans. Une annotation automatique du système : *"Statut orbital : débattu. Deux détections indépendantes non confirmées."*

**Ce que les données disent**
- Étoile de Barnard : naine rouge M4, 5,96 al, l'étoile qui se déplace le plus vite dans le ciel
- Observation van de Kamp (1963) : oscillations astrométriques compatibles avec 2 planètes joviales
- Explication (1973) : artefact optique instrumental
- Observation 2018 : signal de vélocimétrie radiale compatible avec super-Terre à 233 jours
- Confirmation : non obtenue — signal disparu dans les données ultérieures

**Ce que les données ne disent pas**
- S'il y a réellement des planètes ou non
- Si les deux détections ratées sont une coïncidence ou le signe d'un phénomène perturbateur
- Pourquoi l'étoile la plus proche après le système Alpha/Proxima est aussi la plus difficile à caractériser

**Pointe vers**
ROSS128-001 — un autre système où une détection a semblé évidente puis s'est dissipée.

**Interprétations canoniques**
- Système sans planètes — deux erreurs de mesure indépendantes
- Système avec planètes mais perturbations orbitales rendant la détection instable
- Objet non planétaire perturbant les mesures de façon récurrente — nature inconnue

---

### ROSS128-001 — Le Signal de 2017
**Système :** Ross 128 (11 al)
**Type :** SIGNAL
**Difficulté :** 2

**Ancrage réel**
En mai 2017, le radiotélescope d'Arecibo détecte un signal radio répétitif et inhabituel en provenance de la direction de Ross 128 — une naine rouge calme, contrairement à Proxima. Le signal présente des caractéristiques semi-périodiques dans une bande de fréquences intermédiaires. Après analyse, l'équipe de l'Observatoire de Puerto Rico conclut que la source la plus probable est un satellite géostationnaire de haute altitude. Mais cette explication ne satisfait pas tous les astronomes impliqués. Le signal n'a pas été reproduit depuis.

**Ce que le joueur voit**
Spectre radio présentant des bursts semi-périodiques sur une bande étroite. Annotation : *"Détecté mai 2017 depuis système solaire — origine : débattue. Attribution satellite : probable mais non confirmée."* L'étoile elle-même est remarquablement calme pour une naine rouge — presque aucune éruption détectée.

**Ce que les données disent**
- Signal : bursts répétitifs, bande 2,4 GHz, durée de détection ~10 minutes
- Caractéristique notable : modulation de fréquence inhabituelle pour un satellite
- Étoile Ross 128 : naine rouge M4, inhabituellement peu active
- Planète Ross 128 b : confirmée en 2017, zone tempérée (pas strictement habitable)
- Flux UV reçu par Ross 128 b : 4 fois inférieur à celui reçu par Proxima b

**Ce que les données ne disent pas**
- Si le signal venait réellement de Ross 128 ou d'un objet en avant-plan
- Pourquoi la modulation de fréquence ne correspond pas exactement aux satellites connus
- Si la faible activité de l'étoile est corrélée à autre chose

**Pointe vers**
EPSILON-001 — la question de la calme stellaire comme condition nécessaire à la persistance d'un signal.

**Interprétations canoniques**
- Satellite géostationnaire terrestre — explication officielle, probable
- Émission naturelle d'un objet solaire ou interstellaire en transit
- Signal de faible puissance depuis Ross 128 b — non exclu par les données

---

### EPSILON-001 — Le Disque d'Epsilon Eridani
**Système :** Epsilon Eridani (10,5 al)
**Type :** ANOMALIE_GEOMETRIQUE
**Difficulté :** 2

**Ancrage réel**
Epsilon Eridani est une étoile jeune (800 Ma) entourée d'un disque de débris structuré — des anneaux distincts avec des zones de déplétion entre eux. Ces structures suggèrent la présence de planètes qui "balaient" leurs orbites. Mais les candidats planétaires détectés sont débattus. C'est la première cible du projet Ozma en 1960 — Frank Drake l'a choisie parce qu'elle ressemble au Soleil jeune. Aucun signal n'a été détecté.

**Ce que le joueur voit**
À l'arrivée : un système spectaculaire — trois anneaux concentriques de débris clairement visibles dans les données infrarouges. Les zones vides entre les anneaux sont trop nettes pour être produites par la seule gravité stellaire. Annotation automatique : *"Structures de déplétion — origines : débattues. Résonances orbitales probables."*

**Ce que les données disent**
- Disque interne : rayon ~3 UA, analogue à la ceinture d'astéroïdes
- Zone de déplétion : 3-20 UA
- Anneau externe : pic à ~60 UA, analogue à la ceinture de Kuiper
- Asymétrie de l'anneau externe : densité plus élevée d'un côté — inexpliquée
- Étoile : K2V, 800 Ma, 0,82 masse solaire
- Planète Epsilon Eridani b : débattue depuis 2000, non confirmée

**Ce que les données ne disent pas**
- Ce qui crée les zones de déplétion si les planètes ne sont pas confirmées
- Pourquoi l'anneau externe est asymétrique
- Si le système est trop jeune pour avoir développé une vie complexe ou au contraire idéal pour une vie primitive

**Pointe vers**
TAU-CETI-001 — un autre système avec un disque de débris structuré mais 5 fois plus dense.

**Interprétations canoniques**
- Planètes non encore détectées créant les résonances orbitales
- Système en phase de bombardement tardif — analogue au système solaire à 800 Ma
- Asymétrie de l'anneau : perturbation par un objet en transit (Oumuamua-like ?)
- Le silence radio de 1960 : absence de technologie détectable *à ce moment-là*

---

### TAU-CETI-001 — Le Bombardement
**Système :** Tau Ceti (11,9 al)
**Type :** ANOMALIE_CHIMIQUE
**Difficulté :** 2

**Ancrage réel**
Tau Ceti possède 5 planètes candidates dont deux en zone habitable (Tau Ceti e et f). Mais son disque de débris est 10 fois plus dense que celui du système solaire. Le taux de bombardement météoritique est estimé 10 fois supérieur à ce que la Terre a connu. Les conditions de surface des planètes habitable sont potentiellement trop violentes pour permettre l'émergence d'une vie complexe. Pourtant — Tau Ceti est une étoile stable, de type G, presque identique au Soleil mais plus vieille (5,8 Ga).

**Ce que le joueur voit**
Deux planètes en zone habitable entourées d'un disque de débris dense — visuellement chaotique comparé à Epsilon Eridani. Analyses de composition du disque : ratios isotopiques présentant des anomalies dans les éléments du groupe du fer. Annotation : *"Taux de bombardement estimé : 10× système solaire. Origine disque de débris : non résolue."*

**Ce que les données disent**
- Tau Ceti e : 4,3 masses terrestres, période 168 jours, zone habitable interne
- Tau Ceti f : 3,9 masses terrestres, période 642 jours, zone habitable externe
- Disque de débris : masse totale 10× ceinture de Kuiper solaire
- Anomalie isotopique : ratios Fe-60/Fe-56 légèrement élevés par rapport aux modèles
- Âge estimé : 5,8 Ga — plus vieille que le système solaire

**Ce que les données ne disent pas**
- Pourquoi le disque est 10 fois plus dense — collision récente ou condition initiale ?
- Si les planètes en zone habitable ont une surface stable malgré le bombardement
- Ce que signifient les anomalies isotopiques du fer — supernova proche passée ?
- Si une vie enfouie (sous-surface) pourrait prospérer malgré le bombardement de surface

**Pointe vers**
GLIESE667-001 — la question de la vie sous conditions extrêmes trouve une réponse différente dans un système triple.

**Interprétations canoniques**
- Système inhospitalier malgré la zone habitable — le bombardement exclut la vie complexe de surface
- Vie souterraine protégée du bombardement — possible sur les deux planètes
- Anomalie Fe-60 : signature d'une supernova voisine il y a ~2 Ma — événement d'extinction potentiel
- Disque dense : vestige d'une collision planétaire récente qui aurait détruit une planète habitée

---

### GLIESE667-001 — Le Système Triple
**Système :** Gliese 667C (22 al)
**Type :** ANOMALIE_GEOMETRIQUE
**Difficulté :** 3

**Ancrage réel**
Gliese 667 est un système stellaire triple. Les étoiles A et B sont un couple de naines orange (K3V + K5V). Gliese 667C est une naine rouge à 230 UA du couple AB. Elle possède 2 à 3 planètes en zone habitable confirmées — dont GJ 667Cc, considérée comme l'une des exoplanètes les plus similaires à la Terre connues. La configuration orbitale de ces planètes est à la limite de la stabilité dynamique — elles sont en résonance orbitale quasi-parfaite. Trop parfaite selon certains modèles.

**Ce que le joueur voit**
À l'arrivée dans le système : trois étoiles. Le couple AB domine le ciel de 667C. Les planètes de 667C sont visibles dans les données orbitales — et leur configuration en résonance est immédiatement frappante dans la visualisation. Annotation : *"Résonance orbitale 1:2:4 — stabilité dynamique : limite. Probabilité naturelle : estimée < 2%."*

**Ce que les données disent**
- GJ 667Cc : 3,8 masses terrestres, période 28 jours, zone habitable confirmée
- Configuration résonante : quasi 1:2:4 entre les 3 planètes internes
- Stabilité dynamique : stable sur 1 Ga selon les simulations, mais sensible aux perturbations
- Étoile 667C : naine rouge calme (contrairement à Proxima)
- Nucléobases détectées dans le disque de débris résiduel — *voir trace GLIESE667-002*

**Ce que les données ne disent pas**
- Si la résonance orbitale est naturelle ou a été induite
- Ce qui maintient la configuration si proche de la limite de stabilité
- Si la faible probabilité de la configuration est une coïncidence ou un signal

**Pointe vers**
GLIESE667-002 (difficulté 3, nucléobases dans le disque) — nécessite d'avoir interprété GLIESE667-001 pour être détectable.

**Interprétations canoniques**
- Résonance naturelle — rare mais pas impossible, le système solaire a des exemples partiels
- Résonance induite par un corps non détecté en orbite externe
- Configuration initialement placée — hypothèse extraordinaire, requiert des données supplémentaires
- La "limite de stabilité" est un artefact des modèles, pas une propriété réelle du système

---

### GLIESE667-002 — Les Nucléobases du Disque
**Système :** Gliese 667C (22 al)
**Type :** ANOMALIE_CHIMIQUE
**Difficulté :** 3 — *détectable uniquement après interprétation de GLIESE667-001*

**Ancrage réel**
Les missions Hayabusa2 (Ryugu) et OSIRIS-REx (Bennu) ont confirmé en 2023 la présence des 5 nucléobases de l'ARN dans des astéroïdes carbonés primitifs non contaminés. Ces molécules — adénine, guanine, cytosine, thymine, uracile — sont les briques fondamentales du code génétique terrestre. Leur présence dans des corps non différenciés suggère que la chimie prébiotique est universelle.

**Ce que le joueur voit**
Visible uniquement si le joueur a lancé un scan approfondi du disque de débris après avoir interprété GLIESE667-001. Spectre de masse présentant des pics correspondant aux 5 nucléobases. Concentration anormalement élevée par rapport aux modèles de chimie abiogénique standard. Annotation : *"Signatures organiques complexes — concentrations : 40× valeurs nominales Bennu/Ryugu."*

**Ce que les données disent**
- Nucléobases détectées : adénine, guanine, cytosine, thymine, uracile — les 5 présentes
- Concentration : 40 fois supérieure aux valeurs mesurées sur Bennu et Ryugu
- Acides aminés associés : 12 sur 20 acides aminés protéiques détectés
- Distribution dans le disque : non uniforme — concentration plus élevée dans une zone spécifique
- Âge des corps porteurs estimé : 4,1 Ga

**Ce que les données ne disent pas**
- Pourquoi la concentration est 40 fois supérieure aux valeurs de référence
- Si la distribution non uniforme dans le disque est significative
- Si ces molécules ont joué un rôle dans l'origine de la vie sur GJ 667Cc
- Lien éventuel avec la résonance orbitale de GLIESE667-001

**Pointe vers**
La combinaison GLIESE667-001 + GLIESE667-002 est une clé d'accès à une trace de niveau 4 dans la séquence secrète. Non documenté ici.

**Interprétations canoniques**
- Chimie prébiotique universelle — même résultat que Bennu/Ryugu, simplement plus concentré
- Contamination du disque par un corps porteur externe (objet Oumuamua-like en transit passé)
- Vestige d'une biosphère détruite lors d'un événement catastrophique sur GJ 667Cc
- Concentration artificielle — sélection et dépôt intentionnel dans le disque

---

## 3. Traces immuables — Hors voisinage

*Systèmes au-delà de 25 al. Traces plus difficiles, voyages plus longs.*
*Section à développer.*

### Traces prévues

| Désignation | Système | Distance | Type | Difficulté | Ancrage réel |
|-------------|---------|----------|------|------------|-------------|
| TABBY-001 | Étoile de Tabby (KIC 8462852) | 1 280 al | ANOMALIE_STELLAIRE | 2 | Baisses de luminosité apériodiques jusqu'à 22% |
| TABBY-002 | Étoile de Tabby | 1 280 al | SEQUENCE | 3 | Pattern des baisses — structure non aléatoire débattue |
| OUMUAMUA-001 | Trajectoire interstellaire | Variable | OBJET | 2 | Accélération non-gravitationnelle, forme allongée |
| PSR-001 | PSR B1919+21 | 2 283 al | SIGNAL | 3 | Premier pulsar — initialement nommé LGM-1 (Little Green Men). *Modèle backend* : `system_object` PULSAR avec émission périodique (1,3 Hz). Voir Documentation-backend.md § Sources de signaux. |
| HD40307-001 | HD 40307 | 41,8 al | ANOMALIE_GEOMETRIQUE | 2 | Super-Terre en zone habitable, 6 planètes en résonance |

---

## 4. Traces non-joueur — Le Journal de Yael

Les traces de type `JOURNAL` sont produites par un explorateur humain non-joueur — Yael — dont le vaisseau a quitté Sol avant le joueur. Elles sont **immuables et prédéfinies**, ancrées dans des systèmes spécifiques que Yael a traversés. Elles ne sont pas générées par le système de traces joueurs.

### Distinction fondamentale

| Propriété | TRACE_JOUEUR | JOURNAL |
|-----------|-------------|---------|
| Auteur | Joueur humain | Yael — non-joueur |
| Contenu | Texte libre, annotation spontanée | Fragment de journal — voix, méthode, temps |
| Génération | Dynamique — produite pendant le jeu | Immuable — prédéfinie dans le monde |
| Distribution | Partout où un joueur est passé | Uniquement les systèmes visités par Yael |
| Datation | Génération de voyage du joueur | Génération de voyage de Yael |
| Confusion possible | Non — clairement marquée comme trace joueur | Oui — ressemble visuellement à une TRACE_JOUEUR |

### Ce que le joueur voit

Dans la Collection, une entrée de journal de Yael ressemble à une TRACE_JOUEUR ordinaire — même format, même présentation. La différence n'est perceptible qu'à la lecture : la voix est différente, la datation est ancienne, les références ne sont pas humaines dans leur échelle.

Cette confusion est intentionnelle dans les premières entrées. Le joueur peut ne pas réaliser immédiatement que Yael n'est pas un autre joueur.

### Structure d'une entrée JOURNAL

```
Désignation   : [SYSTEME]-YAEL-[ORDRE]
Système       : système où l'entrée est déposée
Génération    : génération de voyage de Yael au moment de l'entrée
Contenu       : texte — registre terrain ou registre intérieur
Trace liée    : trace immuable du système (optionnel — Yael commente ce qu'il a trouvé)
Scénario lié  : scénario effleuré sans le nommer (optionnel)
```

### Densité et progression

Les entrées sont plus denses dans le voisinage solaire — là où Yael a passé le plus de temps, là où le joueur arrive en premier. Elles s'espacent dans la zone intermédiaire et deviennent rares dans la zone profonde. Le ton se transforme avec les générations.

*Pour les fragments canoniques et la table de relation avec les scénarios — voir LACUNA_SCENARIOS.md §11.*

---

## 5. Traces joueurs

Une trace joueur est déposée par un vaisseau humain en jeu. C'est le seul type produit en temps réel par la communauté de joueurs — elle n'existait pas avant l'arrivée de ce joueur dans le système.

### Type TRACE_JOUEUR

```
Données       : texte libre
Sous-type     : ANNOTATION / WARNING / DIRECTION / DISCOVERY
Génération    : génération de voyage du joueur au moment du dépôt
Trace liée    : optionnel — pointe vers une trace immuable ou générée
```

Une TRACE_JOUEUR peut être aussi précieuse qu'une trace immuable pour un joueur qui arrive après. Elle peut aussi être fausse, incomplète, ou le reflet d'une interprétation erronée. Le jeu ne hiérarchise pas leur valeur.

---

## 6. Règles de conception

### Ce qu'une trace doit faire

- Poser **une question principale** claire
- Laisser **au moins deux interprétations légitimes** sans en valider aucune
- Contenir **une donnée réelle** non résolue par la science actuelle
- Être **autonome à difficulté 1** — interprétable sans contexte extérieur
- Être **enrichie par le contexte** à difficulté 2+ — une autre trace améliore la lecture

### Ce qu'une trace ne doit pas faire

- Avoir une réponse correcte cachée que le joueur "trouve"
- Être résoluble par la logique pure sans données supplémentaires
- Pointer vers une seule interprétation de façon évidente
- Être décorative — chaque trace doit créer une décision de navigation

### Règles spécifiques aux artefacts-journaux

Un artefact-journal est un objet narratif de convergence — il ne s'écrit pas comme une trace ordinaire et ne se conçoit pas isolément.

**Ce qu'un artefact-journal doit faire**
- Être placé en aval d'au moins 3 traces résolues du même scénario
- Contenir des lacunes structurelles — des entrées manquantes, des passages corrompus, des références à des événements jamais expliqués
- Laisser une zone d'ombre irréductible même après décodage complet
- Approfondir la question terminale du scénario sans la refermer
- Exister physiquement dans le monde du jeu — ruines, satellite silencieux, objet dérivant sans émission

**Ce qu'un artefact-journal ne doit pas faire**
- Révéler l'identité ou le nom de la civilisation qui l'a produit
- Fournir la clé de décodage directement — elle se déduit des traces antérieures
- Résoudre le scénario
- Être le seul fragment — un journal isolé perd sa dimension de reconstruction

**Sur la langue inconnue**
La langue d'un artefact-journal peut être partiellement décodée avec la clé — mais décoder n'est pas comprendre. La structure syntaxique peut devenir lisible sans que la signification culturelle le soit. Certains passages restent opaques non par manque de clé mais par distance culturelle irréductible.

### Densité recommandée par zone

| Zone | Distance | Traces immuables | Traces générées | Traces joueurs (mature) |
|------|----------|-----------------|----------------|------------------------|
| Voisinage | < 25 al | 8 – 12 | 1 par système | 5 – 20 par trace immuable |
| Intermédiaire | 25 – 500 al | 3 – 5 | 0,3 par système | 1 – 5 par trace immuable |
| Profonde | 500 – 10 000 al | 1 – 2 | 0,1 par système | Rare |
| Mythique | > 10 000 al | < 1 (séquence secrète) | 0,05 par système | Quasi absente |

### Règle des 50 premiers systèmes

Les 50 premiers systèmes accessibles depuis Sol doivent contenir au minimum :
- **3 traces immuables de difficulté 1** — visibles sans scan, interprétables immédiatement
- **5 traces immuables de difficulté 2** — nécessitent un scan ou un contexte
- **1 paire de traces liées** — deux traces dans deux systèmes différents qui se répondent
- **0 systèmes vides consécutifs** — jamais plus de 2 systèmes sans aucune trace

L'objectif : dans ses 4 premières heures de jeu, le joueur doit avoir trouvé au moins 2 traces qu'il ne sait pas expliquer et une question qu'il veut poursuivre.

---

*LACUNA — Catalogue des Traces v0.7 — Mars 2026 — Confidentiel*
