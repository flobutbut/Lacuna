*Dernière modification : 2026-10-23*

# LACUNA — Les Traces
*Version 1.5 — Octobre 2026*

> Ce document définit ce qu'est une trace dans LACUNA, comment elle est produite, et quels types de résultats elle peut donner. Il ne catalogue pas les traces immuables — leurs fiches vivent dans `LACUNA_TRACES_IMMUABLES.md` (traces hors scénario, Journal de Yael) et dans `LACUNA_SCENARIOS.md` (nœuds des scénarios). Il ne documente pas les instruments — ceux-ci vivent dans `LACUNA_LABORATOIRE_INSTRUMENTS.md`.
>
> Sa responsabilité est unique : définir la mécanique.

---

## Table des matières

1. [Définition](#1-définition)
2. [La chaîne de production](#2-la-chaîne-de-production)
3. [Les types de traces](#3-les-types-de-traces)
4. [Le gradient d'approfondissement](#4-le-gradient-dapprofondissement)
5. [Origines des traces](#5-origines-des-traces)
6. [Règles de conception](#6-règles-de-conception)
7. [Qualification des traces — difficulté et complexité](#7-qualification-des-traces--difficulté-et-complexité)

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 0.1–0.9 | Mars 2026 | Versions initiales — mélange grammaire, fiches système, règles de conception. La v0.9 est archivée dans le dépôt de développement (`docs/archive/LACUNA_TRACES_v0.9.md`) |
| 1.0 | Mars 2026 | Réécriture complète — centré sur la mécanique. Fiches système retirées du document. Définition clarifiée : une trace est un output actionnable, pas une anomalie. |
| 1.1 | Mars 2026 | Ajout §7 — qualification des traces : coût physique (1→4), coût intellectuel (A→D), multi-output. |
| 1.2 | Mars 2026 | Refonte §3 — 9 types de traces (ajout Timing, Comparaison, Référence externe). Questions ouvertes posées pour les 3 nouveaux types. |
| 1.3 | Octobre 2026 | Mise en cohérence — les fiches retirées en v1.0 n'avaient pas été reportées dans `LACUNA_SCENARIOS.md` comme annoncé : elles sont restaurées dans le nouveau `LACUNA_TRACES_IMMUABLES.md`, et les renvois sont corrigés. Désignations du Fil des 75 alignées sur le Scénario 02 (`…-SCN02-…`). Exemple Timing : Ross 128 b n'est pas verrouillée gravitationnellement dans le jeu (une planète verrouillée n'a pas de cycle d'aube). Exemple Signature : `ROSS128-YAEL-002` (2 fragments maximum dans la zone d'onboarding) et chiralité reportée sur les acides aminés (une nucléobase n'est pas chirale). Exemple Désignation : fondé sur le nœud `GLIESE667-SCN02-001` |
| 1.4 | Octobre 2026 | §3.7 Timing : un signal hors fenêtre est présent mais inactif (implémentation provisoire, `LACUNA_SCENARIOS.md` §5.7) |
| 1.5 | Octobre 2026 | §4 : le gradient est implémenté pour les traces de scénario (table `trace_levels`, lectures débloquées par les observations du système courant) |

---

## 1. Définition

### Ce qu'est une trace

Une trace est un **output actionnable** que le joueur produit à partir de l'analyse d'une ou plusieurs anomalies détectées par les instruments.

Ce n'est pas une donnée brute — les données brutes sont ce que les capteurs enregistrent et ce que les instruments analysent.

Ce n'est pas une interprétation libre — l'interprétation est ce que le joueur *pense* que la trace signifie.

Une trace est ce qui se situe entre les deux : la conclusion opérationnelle que le joueur tire de son analyse, qui lui indique **quoi chercher ensuite**. Des coordonnées. Une signature à retrouver. Un objet à récupérer. Un vecteur à suivre.

> Une trace sans output actionnable n'est pas une trace — c'est une note.

### Ce qu'une trace n'est pas

Une trace n'est pas une réponse. Elle ne confirme rien sur ce qui l'a produite. Elle ne valide aucune interprétation. Elle indique une direction — pas une vérité.

Deux joueurs peuvent produire des traces différentes depuis les mêmes anomalies, avec des outputs actionnables différents, tous deux légitimes. Le jeu ne tranche pas.

### Le cas particulier de l'artefact physique

Un objet physique dont les anomalies morphologiques, chimiques et orbitales convergent vers une fabrication est lui-même une trace — l'objet est l'output. Sa récupération ou son approche est l'action qu'il déclenche. Voir §3.6.

---

## 2. La chaîne de production

```
OBSERVATION
     │
     │  Le joueur pointe un instrument sur un objet physique
     │  ou un signal atteint les capteurs du vaisseau
     ▼
DONNÉES BRUTES
     │
     │  L'instrument analyse et produit un rapport structuré
     │  (spectre, courbe, carte, tableau — jamais une conclusion)
     ▼
ANOMALIE
     │
     │  Le joueur repère un écart entre les données
     │  et ce que les modèles prédisent
     │  Quantifiable : "3,2 sigma hors des distributions connues"
     ▼
ANALYSE CROISÉE  ←──── optionnel : croisement avec d'autres anomalies
     │                  du même système ou de systèmes différents
     │
     ▼
TRACE
     │
     │  Le joueur formule un output actionnable
     │  et l'inscrit dans son journal ou sa collection
     ▼
INTERPRÉTATION
     │
     │  Le joueur (et les autres joueurs qui passent après)
     │  proposent une lecture de ce que la trace signifie
     │  Le jeu ne valide aucune interprétation
     ▼
ACTION
     │  Voyage vers des coordonnées
     │  Écoute d'une fréquence
     │  Récupération d'un objet
     │  Recherche d'une signature dans un autre système
     ▼
NOUVELLE OBSERVATION
```

### Ce que le jeu valide — et ce qu'il ne valide pas

**Le jeu valide la méthode.** Un instrument compatible avec un type d'objet et un niveau d'observation produit toujours des données. Un instrument incompatible ne produit rien. Les niveaux d'approfondissement sont accessibles si les conditions physiques sont remplies. C'est la progression mécanique — elle est objective.

**Le jeu ne valide pas le sens.** Deux anomalies qui convergent peuvent signifier dix choses différentes. L'interprétation que le joueur formule dans son journal n'est jamais confirmée ni infirmée. Ce qu'une trace signifie appartient entièrement au joueur.

### La contribution des autres joueurs

Les interprétations déposées par d'autres joueurs sur la même anomalie ou la même trace sont visibles dans la collection. Elles ne sont pas une validation — elles sont une boussole qualitative. Voir que d'autres joueurs ont proposé des lectures différentes confirme que l'anomalie est réelle et qu'elle résiste à une lecture unique. Ce n'est pas un indice vers la bonne réponse. C'est la confirmation que la question est digne d'être posée.

---

## 3. Les types de traces

Un output de trace est toujours une **instruction d'observation** — quelque chose à chercher dans l'observatoire, depuis la position actuelle ou depuis une position désignée. La variété vient de *comment* on y arrive et de *ce qu'on cherche* une fois là.

Il existe neuf types d'outputs identifiés. Les six premiers sont mécaniquement définis. Les trois derniers sont posés comme directions — leurs mécaniques précises restent à développer.

---

### 3.1 Coordonnées

**Ce que c'est** : l'identifiant d'un système stellaire ou d'une position dans l'espace à visiter.

**Comment ça se produit** : une anomalie pointe vers l'origine probable d'un signal, une direction de trajectoire, ou un système corrélé statistiquement. Le joueur formule les coordonnées comme output.

**Ce que ça déclenche** : un voyage. Le joueur fixe un cap.

**Exemple** : une fréquence radio captée passivement dont la direction angulaire est calculable.

```
Type     : COORDONNÉES
Output   : SOL → Sagittarius — axe galactique central
Confiance: HYPOTHÈSE
Fondé sur: SOL-001 — direction Sagittaire, fréquence 1420 MHz
```

*Question ouverte : le vecteur (3.4) est-il un sous-type de coordonnées, ou un type distinct ? Une trajectoire reconstruite débouche toujours sur "aller là-bas" — la distinction est dans la méthode de calcul, pas dans la nature de l'output.*

---

### 3.2 Signature

**Ce que c'est** : un pattern mesurable — fréquence, profil chimique, ratio isotopique, pattern orbital — à retrouver dans d'autres systèmes.

**Comment ça se produit** : le joueur identifie une caractéristique suffisamment spécifique pour être reconnaissable si elle réapparaît ailleurs. Il la formule comme signature de recherche active.

**Ce que ça déclenche** : une lecture active des données instrumentales dans les systèmes suivants. Le joueur sait quoi chercher.

**Exemple** : 5 nucléobases, concentration 40× nominale, acides aminés associés à excès L — retrouver cette combinaison ailleurs. (Les nucléobases elles-mêmes ne sont pas chirales : la chiralité porte sur les acides aminés et les sucres.)

```
Type     : SIGNATURE
Output   : Nucléobases — concentration > 30× nominale — acides aminés à excès L
Confiance: OBSERVATION
Fondé sur: GLIESE667-002, ROSS128-YAEL-002
```

---

### 3.3 Désignation

**Ce que c'est** : l'identifiant d'un objet physique spécifique à approcher, orbiter ou récupérer.

**Comment ça se produit** : une anomalie orbitale ou gravitationnelle révèle un objet non catalogué. Le joueur lui assigne une désignation et formule l'approche.

**Ce que ça déclenche** : une manœuvre d'approche. Ouvre les instruments d'orbite proche et de contact.

**Exemple** : perturbation gravitationnelle sur Gliese 667Cc — un objet non visible perturbe l'orbite.

```
Type     : DÉSIGNATION
Output   : GLIESE667C-OBJ-01 — orbite calculée, approche possible
Confiance: CONVICTION
Fondé sur: GLIESE667-SCN02-001 (perturbation orbitale)
```

---

### 3.4 Vecteur

**Ce que c'est** : la trajectoire reconstituée d'un objet en transit — son origine et sa direction.

**Comment ça se produit** : les anomalies cinétiques d'un objet interstellaire permettent de calculer d'où il vient et où il va.

**Ce que ça déclenche** : un voyage vers l'origine si atteignable, ou une mise en surveillance de la direction d'arrivée.

**Exemple** : accélération non-gravitationnelle d'un objet en transit — son vecteur d'origine est calculable.

```
Type     : VECTEUR
Output   : Origine estimée — bras de Persée, ~8 000 al — direction : sortie galactique
Confiance: HYPOTHÈSE
Fondé sur: données orbitales de l'objet en transit
```

---

### 3.5 Séquence

**Ce que c'est** : un pattern encodé lisible uniquement avec une clé déduite d'autres traces du même scénario.

**Comment ça se produit** : l'analyseur de structure temporelle ou l'analyseur d'échantillon révèle une structure non aléatoire — cohérente dans sa logique interne, opaque sans contexte.

**Ce que ça déclenche** : une recherche de clé dans les traces antérieures. Une fois décodée, la séquence produit un autre type d'output (coordonnées, signature, désignation).

**Exemple** : 10 800 lignes de gravures, ratio d'interruption 1/75 récurrent — structure déductible, signification non.

```
Type     : SÉQUENCE
Output   : Pattern 1/75 — clé partielle depuis PROXIMA-SCN02-001
Confiance: OBSERVATION
Fondé sur: GLIESE667-SCN02-001 (gravures de l'artefact orbital)
```

---

### 3.6 Artefact physique

**Ce que c'est** : un objet dont la convergence d'anomalies morphologiques, chimiques et orbitales indique une fabrication. L'objet lui-même est la trace.

**Comment ça se produit** : scanner morphologique + spectromètre de contact + analyseur volumétrique convergent. Aucun processus naturel connu ne produit cette combinaison.

**Ce que ça déclenche** : récupération ou étude approfondie au contact.

**Exemple** : objet 1 400 m × 200 m, sans rotation, 2,7 K, composition réfractaire × 10, gravures régulières.

```
Type     : ARTEFACT PHYSIQUE
Output   : GLIESE667C-OBJ-01 — récupération ou approche au contact
Confiance: CERTITUDE (fabrication) / HYPOTHÈSE (origine et fonction)
Fondé sur: anomalies morphologique + chimique + orbitale convergentes
```

---

### 3.7 Timing

**Ce que c'est** : une condition d'observation temporelle — être au bon endroit au bon moment simulé pour capter un phénomène qui n'existe que dans une fenêtre précise.

**Comment ça se produit** : l'analyseur de structure temporelle révèle une périodicité dans un signal ou un phénomène. Le joueur calcule la prochaine occurrence et formule une condition d'attente ou de positionnement.

**Ce que ça déclenche** : une attente active, un positionnement orbital calculé, ou une surveillance différée. Le joueur doit être présent au bon moment — pas seulement au bon endroit.

**Exemples** : signal synchronisé à l'aube locale d'une planète en rotation (Ross 128 b dans le jeu : fenêtre de 40 minutes par cycle jour-nuit de 61 heures) — ou configuration orbitale rare qui ne se reproduit que tous les N millénaires simulés.

```
Type     : TIMING
Output   : Signal ROSS128-b — fenêtre : aube locale, durée 40 min, cycle 61h
Confiance: CONVICTION
Fondé sur: ROSS128-SCN02-001 — corrélation signal / position orbitale
```

*Décision d'implémentation : un signal hors fenêtre reste présent mais inactif ; le jeu n'annonce pas la prochaine fenêtre, le joueur la déduit de la périodicité (cycle rattrapable au suivant).*

*Question ouverte : comment le jeu notifie-t-il le joueur d'une fenêtre temporelle imminente ? Est-ce que le timing peut être manqué définitivement ou toujours rattrapable au cycle suivant ? Un timing raté doit-il avoir des conséquences narratives ?*

---

### 3.8 Comparaison

**Ce que c'est** : une instruction de retour — revisiter une observation passée et la croiser avec ce qu'on vient de trouver. L'output n'est lisible qu'en superposant deux états séparés dans le temps ou l'espace.

**Comment ça se produit** : une anomalie dans un système actuel ne prend sens qu'au regard d'une donnée déjà collectée ailleurs ou plus tôt. Le joueur formule la comparaison comme instruction.

**Ce que ça déclenche** : une relecture de données archivées, ou un retour physique dans un système déjà visité pour observer son évolution.

**Exemples** : deux visites du même système à des générations d'écart révèlent une modification que ni l'une ni l'autre ne montrait isolément — la carte comme document historique qui se lit dans la durée.

```
Type     : COMPARAISON
Output   : Revisiter EPSILON-001 — comparer spectre stellaire actuel / archivé G+14
Confiance: HYPOTHÈSE
Fondé sur: TAU-CETI-001 — même anomalie isotopique Fe-60, même âge estimé
```

*Question ouverte : comment l'interface expose-t-elle les données archivées d'une visite passée pour les rendre comparables ? La comparaison implique-t-elle que le joueur se souvienne de ce qu'il a vu — ou le système l'aide-t-il ? Quel niveau d'évolution d'un système est simulé entre deux visites ?*

---

### 3.9 Référence externe

**Ce que c'est** : une instruction qui sort du jeu — un document réel, un signal archivé, un film, un papier scientifique — que le joueur doit retrouver dans le monde réel et croiser avec une trace pour produire un output dans l'observatoire.

**Comment ça se produit** : une trace de Yael mentionne quelque chose de précis — un titre, une date, une fréquence — qui correspond à un contenu réel existant hors du jeu. Le joueur doit trouver ce contenu et en extraire une donnée utilisable dans le laboratoire.

**Ce que ça déclenche** : une sortie du jeu (recherche externe), suivie d'un retour avec une clé ou une donnée qui débloque un output dans l'observatoire.

**Exemples** : Yael mentionne le papier de Bracewell (1960) sur les sondes interstellaires autonomes — le joueur doit le lire pour comprendre ce que les coordonnées qu'il a trouvées impliquent. Ou une fréquence audio encodée dans les métadonnées d'une image publique.

```
Type     : RÉFÉRENCE EXTERNE
Output   : [dépend du contenu externe retrouvé]
Confiance: variable
Fondé sur: trace Yael — mention explicite d'une référence hors-jeu
```

*Question ouverte : comment garantir la pérennité des références externes (un lien peut mourir, un film peut devenir inaccessible) ? Ce type de trace est-il réservé aux scénarios de difficulté 4 et à la séquence secrète, ou peut-il apparaître à des niveaux inférieurs ? Quel est le contrat avec le joueur sur ce qui sort du jeu — doit-il être signalé explicitement ou reste-t-il ambigu ?*

---

## 4. Le gradient d'approfondissement

### Principe

Toute anomalie immuable doit avoir **trois niveaux de lecture** selon la distance d'observation. Le joueur sait toujours qu'il peut creuser plus. Creuser plus donne toujours davantage de matière — jamais une réponse, mais une question plus précise.

```
LOINTAIN ──────────────────────────────────── CONTACT
   │                    │                        │
Signal visible      Données système          Composition fine
Spectre stellaire   Orbites précises         Structure interne
Output : minimal    Output : précisé         Output : dense
```

### Ce que chaque niveau apporte

| Niveau | Ce que le joueur trouve | Ce que ça ouvre |
|--------|------------------------|-----------------|
| **Lointain** | Un écart statistique dans les données stellaires ou un signal capté passif. La question : est-ce que ça mérite un changement de cap ? | Le voyage vers le système |
| **Système** | L'orbitographie précise, les résonances, les corps anormaux. La question se précise : qu'est-ce qui ne devrait pas être là ? | L'approche d'un objet spécifique |
| **Orbite proche** | L'atmosphère, la surface, le champ magnétique. La question devient concrète : est-ce que quelque chose a agi sur cet objet ? | Le contact |
| **Contact** | La composition fine, la datation, les molécules. La question devient irréductible : d'où vient ça, et qu'est-ce que ça implique ? | Une trace de type séquence ou artefact |

### Règle de conception

*Implémentation : chaque lecture d'une trace de scénario est une ligne de `trace_levels` (niveau PASSIF, SYSTEME, ORBITE ou CONTACT) ; le serveur la débloque quand une observation du système courant l'atteint (`LACUNA_SCENARIOS.md` §5.7).*

Chaque trace immuable documentée dans `LACUNA_TRACES_IMMUABLES.md` ou `LACUNA_SCENARIOS.md` doit spécifier explicitement ce que le joueur trouve à chaque niveau. Une trace qui donne tout au niveau lointain ne respecte pas ce gradient. Une trace qui ne révèle rien avant le contact est injouable.

---

## 5. Origines des traces

Toute trace a une origine qui détermine sa nature et son mode de production.

| Origine | Qui la produit | Nature | Modifiable |
|---------|---------------|--------|------------|
| `IMMUABLE` | Les développeurs — ancrée dans un phénomène scientifique réel non résolu | Fixe, identique pour tous les joueurs | Non |
| `GÉNÉRÉE` | Le système procédural — à la première visite du système | Plausible scientifiquement, déterministe selon le seed | Non |
| `JOUEUR` | Un joueur lors de son passage | Texte libre, output de son analyse personnelle | Non — permanente une fois déposée |
| `PRÉCURSEUR` | Yael — vaisseau humain précédant le joueur | Format trace joueur, mais prédéfini et immuable | Non |

Les traces `IMMUABLE` sont documentées dans `LACUNA_TRACES_IMMUABLES.md` (hors scénario) et dans `LACUNA_SCENARIOS.md` (nœuds de scénario). Les traces `PRÉCURSEUR` sont documentées dans `LACUNA_TRACES_IMMUABLES.md` §4 et `LACUNA_SCENARIOS.md` §4.

Les traces `GÉNÉRÉE` suivent les gabarits de `LACUNA_PROCEDURAL_TRACES.md`.

Les traces `JOUEUR` sont produites par les joueurs dans l'interface Journal. Leur format et leurs sous-types (`ANNOTATION`, `WARNING`, `DIRECTION`, `DISCOVERY`) sont définis dans `LACUNA_GDD.md` §4. Elles sont anonymes (`LACUNA_GDD.md` §5).

---

## 6. Règles de conception

Ces règles s'appliquent à toute trace `IMMUABLE` conçue pour le jeu.

### Ce qu'une trace doit faire

- Produire au moins un **output actionnable** clair — coordonnées, signature, désignation, vecteur, séquence ou artefact
- Laisser **au moins deux interprétations légitimes** de ce que l'output signifie, sans en valider aucune
- Contenir **une anomalie ancrée dans un phénomène scientifique réel** non résolu
- Respecter le **gradient d'approfondissement** — trois niveaux de lecture selon la distance
- Être **autonome au niveau lointain** — le joueur peut produire un output minimal sans aller au contact
- Être **enrichie par le contexte** — d'autres traces du même scénario précisent la question sans la résoudre

### Ce qu'une trace ne doit pas faire

- Avoir une réponse correcte cachée que le joueur "débloque"
- Pointer vers une seule interprétation de façon évidente
- Être décorative — chaque trace doit créer une décision (voyage, approche, récupération)
- Donner tout son contenu au premier niveau d'observation
- Exister sans connexion possible à d'autres traces — une trace immuable isolée est une impasse

### Règles spécifiques aux artefacts-journaux

Un `ARTEFACT_JOURNAL` est un objet physique contenant une archive encodée. Il obéit à des règles supplémentaires :

- Toujours placé **en aval d'au moins 3 traces résolues** du même scénario
- Contient des **lacunes structurelles** — entrées manquantes, passages corrompus, références à des événements jamais expliqués
- Laisse une **zone d'ombre irréductible** même après décodage complet
- Ne résout pas le scénario — approfondit la question terminale
- Décoder ≠ comprendre : la distance culturelle reste irréductible même avec la clé

### Densité par zone géographique

| Zone | Distance | Traces immuables | Traces générées | Traces joueurs (mature) |
|------|----------|-----------------|----------------|------------------------|
| Voisinage | < 25 al | 8–12 | 1 par système | 5–20 par trace immuable |
| Intermédiaire | 25–500 al | 3–5 | 0,3 par système | 1–5 par trace immuable |
| Profonde | 500–10 000 al | 1–2 | 0,1 par système | Rare |
| Mythique | > 10 000 al | < 1 (séquence secrète) | 0,05 par système | Quasi absente |

### Règle des 50 premiers systèmes

Les 50 premiers systèmes accessibles depuis Sol doivent contenir au minimum :

- **3 traces immuables de niveau lointain** — visibles sans manœuvre, output immédiat
- **5 traces immuables de niveau système ou orbite** — nécessitent un scan ou un contexte
- **1 paire de traces liées** — deux traces dans deux systèmes différents dont les outputs se répondent
- **Jamais plus de 2 systèmes consécutifs sans aucune trace**

L'objectif : dans ses 4 premières heures de jeu, le joueur doit avoir produit au moins 2 traces avec des outputs actionnables différents et une question qu'il veut poursuivre.

---

## 7. Qualification des traces — difficulté et complexité

Toute trace immuable est qualifiée sur deux dimensions indépendantes. Ces deux dimensions sont orthogonales — une trace peut avoir n'importe quelle combinaison des deux.

---

### 7.1 Coût physique (1 → 4)

Ce qu'il faut faire mécaniquement pour produire l'output. Objectif, calculable à la conception, identique pour tous les joueurs.

| Niveau | Définition | Conditions typiques |
|--------|-----------|---------------------|
| **1** | Un instrument, un objet, niveau passif ou lointain. L'output est immédiat. | Signal capté passivement, spectre stellaire visible depuis le transit |
| **2** | Deux instruments sur le même objet, ou un instrument à un niveau supérieur (orbite proche). L'output nécessite d'affiner. | Scan approfondi d'une planète, croisement spectral + orbital dans le même système |
| **3** | Deux à trois instruments, convergence requise, contact possible. L'output n'existe qu'à l'intersection. | Anomalie morphologique + chimique + orbitale sur le même objet |
| **4** | Croisement inter-systèmes. L'output n'est lisible qu'en comparant des données de plusieurs systèmes différents, impliquant des voyages. | Signature vue dans deux systèmes séparés qui devient une séquence par accumulation |

---

### 7.2 Coût intellectuel (A → D)

Ce que le joueur doit reconnaître mentalement pour comprendre ce qu'il regarde. Subjectif — variable selon le bagage du joueur. Non calculable à la conception, estimable.

| Niveau | Définition | Exemple |
|--------|-----------|---------|
| **A** | L'anomalie est immédiatement lisible. L'écart avec le modèle est explicite dans les données, l'output s'impose. | Déséquilibre O₂ + CH₄ — le spectromètre sort les molécules, l'anomalie est nommée |
| **B** | L'anomalie nécessite une connaissance de référence pour être reconnue. Un joueur informé voit, un joueur non informé voit des données. | Signal à 1420 MHz — significatif pour qui connaît la raie de l'hydrogène, neutre sinon |
| **C** | L'anomalie est visible mais l'output n'est pas évident. Le joueur voit que quelque chose ne va pas — il ne voit pas ce que ça implique sans réflexion ou croisement. | Résonance orbitale 1:2:4 — l'écart statistique est là, mais pourquoi c'est important demande un pas supplémentaire |
| **D** | L'anomalie est dans les données mais le joueur doit activement la chercher. Rien ne la signale. Elle n'est visible qu'à celui qui sait quoi regarder — ou qui a assez de recul sur l'ensemble. | Absence statistique dans une zone — aucun instrument ne la signale, elle n'est visible que depuis la carte accumulée |

---

### 7.3 Multi-output

Certaines anomalies peuvent produire plusieurs types d'outputs différents selon la façon dont le joueur les travaille. Cette propriété est partiellement liée à l'anomalie, partiellement au joueur.

**Output forcé** — L'anomalie ne peut produire qu'un seul type d'output. Une trajectoire hyperbolique ne peut être que vecteur. Un objet physique récupéré avec convergence morphologique + chimique + orbitale ne peut être qu'artefact physique.

**Output ouvert** — L'anomalie peut produire plusieurs types d'outputs selon l'intention du joueur. Un déséquilibre atmosphérique peut devenir une signature chimique à retrouver ailleurs, ou des coordonnées de planète à revisiter au contact, ou les deux simultanément. C'est le joueur qui choisit ce qu'il formule dans son journal.

La règle de conception : une trace de coût intellectuel D est souvent à output ouvert — le joueur qui la reconnaît peut l'exploiter de plusieurs façons. Une trace de coût intellectuel A est souvent à output forcé — l'anomalie est si explicite qu'elle ne laisse qu'une lecture raisonnable.

---

### 7.4 Tableau de qualification — exemples

| Anomalie | Coût physique | Coût intellectuel | Output | Multi-output |
|----------|:---:|:---:|--------|:---:|
| Signal WOW! (1420 MHz, 72s) | 1 | B | Coordonnées (direction Sagittaire) | Non |
| Résonance orbitale 1:2:4 | 2 | C | Coordonnées (objet perturbateur) ou Signature | Oui |
| Déséquilibre O₂ + CH₄ | 2 | A | Signature biosignature ou Coordonnées contact | Oui |
| Artefact orbital (géométrie + composition) | 3 | A | Désignation artefact physique | Non |
| Signature fréquentielle dans deux systèmes | 4 | B–C | Séquence | Non |
| Zone d'absence statistique galactique | 4 | D | Signature (zone à cartographier) | Non |

---

*LACUNA — Les Traces v1.3 — Octobre 2026 — Confidentiel*
