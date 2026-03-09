# LACUNA — Interface

**v1.2 — Mars 2026**
Spécification de l'interface joueur — structure, modules, états, tokens visuels, onboarding UX, interactions sociales.

> Contenu narratif onboarding → `LACUNA_LORE.md` §3 · Système social complet → `LACUNA_GDD.md` §5

*Confidentiel — Antigravity*

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 0.1 | Mars 2026 | Document initial |
| 0.2 | Mars 2026 | Structure générale, modules, états, flux, tokens visuels |
| 0.3 | Mars 2026 | Notifications, widget voyage, onboarding UX |
| 0.4 | Mars 2026 | Système social — points de contact UI |
| 0.5 | Mars 2026 | Alignement complet avec GDD, Arcs, Lore, Scenarios, Simulation Phase 1 — ajout coût générationnel widget voyage · Registre des Raisons dans Population · points de contact UI Arc Colonies · comportement Observatoire Sol · rendu traces d'arc dans Artefacts · rendu système sans trace dans le ciel · spécification dimension générationnelle module Population |
| 0.6 | Mars 2026 | Système de dossiers — espace de classement personnel privé dans Artefacts · document de notes attaché à chaque dossier · traces liables à plusieurs dossiers simultanément · Atelier de création de traces joueur |
| 0.7 | Mars 2026 | Renommage modules : Collection → Artefacts · Journal de bord → Journal · Systèmes vaisseau → Systèmes · Refonte module Population (historique générations / santé génération actuelle / Registre) · Laboratoire : retrait 3D, tableau visualisations 2D par type |
| 0.8 | Mars 2026 | Enrichissement module Drake — tableau complet des 7 termes avec valeurs et sources · plage d'incertitude par terme variable (rétrécissement par convergence collective) · tensions entre termes · historique géographique des variations |
| 0.9 | Mars 2026 | Modules en pages dédiées — suppression du modèle overlay · mise à jour zones/interactions/légende · principe clé ciel révisé |
| 1.0 | Mars 2026 | Refonte module Systèmes — identité vaisseau (âge relatif/réel, capacité, population) · section Propulsion & Structure · section Survie séparée · historique technique |
| 1.1 | Mars 2026 | Modèle carburant — boucle fermée pour la survie, He³/deutérium non régénérables · masse sèche 800 000 t · seuils carburant · ravitaillement géantes gazeuses · systèmes de survie = efficacité pas stock |
| 1.2 | Mars 2026 | Nomenclature SVG — correspondance `id` groupes ARCA_blueprint_grouped.svg · tableaux système → SVG id · table de correspondance complète |

---

## Table des matières

1. [Vue générale — Structure de l'écran](#1-vue-générale--structure-de-lécran)
2. [Le Ciel — comportement détaillé](#2-le-ciel--comportement-détaillé)
3. [Les 8 Modules — accès et contenu](#3-les-8-modules--accès-et-contenu)
4. [États de l'interface selon l'état du vaisseau](#4-états-de-linterface-selon-létat-du-vaisseau)
5. [Flux principal — parcours joueur type](#5-flux-principal--parcours-joueur-type)
6. [Notifications — format et intégration UI](#6-notifications--format-et-intégration-ui)
7. [Widget Voyage — interaction de sélection](#7-widget-voyage--interaction-de-sélection)
8. [Tokens visuels & Langage de conception](#8-tokens-visuels--langage-de-conception)
9. [Onboarding — La séquence fondatrice](#9-onboarding--la-séquence-fondatrice)
10. [Système social — traces et interactions indirectes](#10-système-social--traces-et-interactions-indirectes)
11. [Outil de création de traces — Atelier](#11-outil-de-création-de-traces--atelier)

---

## 1. Vue générale — Structure de l'écran

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER  Logo · Nom vaisseau + voyage · Coords · Génération · N= │
├──────────┬───────────────────────────────────────┬───────────────┤
│          │                                       │               │
│  PANEL   │                                       │  PANEL        │
│  GAUCHE  │         CIEL INTERACTIF               │  DROIT        │
│          │         (interface principale)        │               │
│ Systèmes │   étoiles · hover · clic · anomalies  │ Civilisation  │
│ vaisseau │                                       │ Population    │
│          │                                       │ Dernière trace│
│          │                                       │               │
├──────────┴───────────────────────────────────────┴───────────────┤
│  BARRE INSTRUMENTS — 8 boutons d'accès aux modules               │
└──────────────────────────────────────────────────────────────────┘
```

### Zones et interactions

| Zone | Type | Contenu | Interaction |
|---|---|---|---|
| Header | Permanent | Logo · Nom vaisseau + voyage · Coordonnées galactiques · Génération · N= Drake · État transit | Lecture seule. N= cliquable → ouvre module Drake |
| Ciel interactif | Permanent | Canvas étoiles procédural. Toujours visible sous les panels. Étoiles visitées / anomalies / trajectoire active | Hover → tooltip · Clic → widget voyage · Double-clic → Observatoire |
| Panel gauche | Permanent | Indicateurs vaisseau : propulsion, He³, coque, bouclier plasma. État courant (IDLE / IN_TRANSIT…) | Lecture seule. Clic sur indicateur → ouvre Systèmes |
| Panel droit | Permanent | Snapshot civilisation : effectif, volonté, dernière trace collectée | Lecture seule. Clic → ouvre Population |
| Barre instruments | Permanent | 8 boutons d'accès aux modules. Indicateur visuel si données non lues | Clic → ouvre le module en page dédiée |
| Pages modules | Page dédiée | Modules métier (voir section 3). Chaque module s'ouvre en page à part entière — le ciel n'est plus visible | Navigation retour vers le ciel via la barre instruments |
| Widget voyage | Contextuel | Apparaît après clic sur étoile : données système, durée voyage, carburant estimé, coût générationnel, bouton "Fixer cap" | Disparaît au clic ailleurs ou à la confirmation du cap |
| Fil de notifications | Contextuel | Notifications temps réel (voyage, traces, population, galactique). Superposées au ciel, disparaissent après lecture | Clic → ouvre module lié ou détail |

### Légende

- **Permanent** — toujours visible, fait partie du chrome de l'interface
- **Page dédiée** — le module s'ouvre en page à part entière, structure codée et évolutive
- **Contextuel** — apparaît selon l'action du joueur ou un événement

---

## 2. Le Ciel — comportement détaillé

### États des étoiles

| État | Rendu visuel |
|---|---|
| Non visitée | Point blanc, opacité proportionnelle à la magnitude |
| Visitée | Anneau cyan fin (1px), opacity 0.6 |
| Visitée par d'autres vaisseaux | Légère variation de teinte de l'anneau cyan — pas de chiffre affiché |
| Sans trace connue | Aucun marqueur supplémentaire — le vide fait partie du ciel |
| Anomalie niv. 1 | Teinte ambre légère |
| Anomalie niv. 2 | Pulse ambré lent (3s) |
| Anomalie niv. 3 | Pulse fort + halo diffus |
| Destination en transit | Ligne de trajectoire cyan, opacity 0.3 |
| Sélectionnée | Réticule carré + surbrillance |

> **Règle systèmes sans trace —** Un système sans anomalie détectable ne porte aucun marqueur visuel particulier. Il est une étoile parmi d'autres. Le joueur peut y aller. Il peut n'y trouver rien. Le vide entre les traces est une donnée, pas un défaut graphique. L'interface ne compense pas ce vide — elle l'assume.

### Actions joueur

| Action | Résultat |
|---|---|
| Hover étoile | Réticule + tooltip (nom, distance, type spectral, durée voyage, délai d'observation) |
| Clic simple | Sélection + widget de voyage |
| Double-clic | Ouvre Observatoire sur ce système |
| Scroll / pinch | Zoom sur la zone |
| Drag | Pan dans le ciel |
| Clic pendant transit | Sélection uniquement — widget voyage désactivé |

### Tooltip (exemple)

```
HD 44594
Distance        11,4 al
Type spectral   G2V
Durée voyage    ~2h16
Observé il y a  11 ans
Anomalie        Niv. 1
```

> **Principe clé —** Le ciel est la vue principale. Les modules s'ouvrent en pages dédiées — le ciel n'est plus visible pendant la consultation d'un module. La barre instruments reste accessible depuis toutes les pages et permet le retour au ciel à tout moment. L'espace est la constante. L'interface est l'outil.

---

## 3. Les 8 Modules — accès et contenu

**Disponibilité :**
- `[Toujours]` — accessible en toutes circonstances
- `[Transit : inertie]` — accessible uniquement pendant la phase d'inertie du voyage

### Grille des modules

| # | Module | Accès | Disponibilité |
|---|---|---|---|
| 01 | **Observatoire** | Double-clic étoile ou barre instruments | Toujours · Transit : inertie (passif) |
| 02 | **Carte** | Barre instruments | Toujours |
| 03 | **Artefacts** | Barre instruments | Toujours |
| 04 | **Laboratoire** | Barre instruments ou depuis Artefacts | Toujours · Transit : inertie |
| 05 | **Journal** | Barre instruments | Toujours |
| 06 | **Équation de Drake** | N= dans le header ou barre | Toujours |
| 07 | **Population** | Panel droit ou barre | Toujours |
| 08 | **Systèmes** | Panel gauche ou barre | Toujours |

### Contenu détaillé par module

---

#### MODULE — Observatoire

Analyse d'un système stellaire ciblé. Accessible en orbite (mode actif) ou en transit (mode passif — données limitées à ce qui est détectable à distance).

**Contenu :**
- Carte du système · Liste des corps · Niveau anomalie + description · Traces listées
- Délai d'observation affiché en permanence : *"Observé tel qu'il était il y a N ans"*
- Statut du système : CONFORME / ÉVOLUÉ / DISPARU (calculé à l'arrivée)

**Cas spécial — Observation de Sol**

Quand le joueur oriente l'Observatoire vers Sol depuis sa position actuelle :

```
SOL — observé tel qu'il était il y a [distance en al] ans
Type spectral : G2V (à cette époque)
Émissions radio : [ACTIVES / MODIFIÉES / ABSENTES selon l'époque observable]
Statut actuel : INCONNU depuis cette position.
```

Le spectre radio évolue selon la distance :
- < 100 al : émissions humaines caractéristiques encore présentes dans les données
- ~1 000 al : spectre modifié — émissions changées ou réduites (raison inconnue)
- > 5 000 al : silence radio ou signal non classifiable
- À la bonne distance et avec le bon angle : Sol en stade subgéant observable en temps réel

L'interface ne commente pas ces observations. Elle les affiche. Le joueur construit le sens.

**Cas spécial — Observation d'une planète-colonie**

Si le joueur a laissé une faction dans un système et l'observe depuis une distance D :

```
[SYSTÈME] — observé tel qu'il était il y a [D] ans
Anomalie détectée — niveau [1–3 selon jalon colonie]
Type : [THERMIQUE / SPECTRALE / SIGNAL selon jalon]
```

La colonie est traitée comme une anomalie ordinaire. Aucun lien n'est établi automatiquement avec la séparation. Le joueur peut ne jamais faire le rapprochement. C'est voulu.

**Actions disponibles :**
- "Lancer scan approfondi" (mode actif uniquement)
- "Fixer cap" → widget voyage
- Accès Laboratoire sur une trace
- "Créer une trace" → ouvre l'Atelier (mode actif, état IDLE uniquement)

---

#### MODULE — Carte

Carte personnelle du joueur, construite voyage après voyage. Subjective, irremplaçable, progressivement obsolète.

**Contenu :**
- Graphe nœuds/arêtes · Couleur par ancienneté de visite · Badge traces/système · Stats totales
- Nœuds colonie marqués distinctement (COLONIE — Génération N) mais vieillissant comme les autres
- Sur les longues campagnes, certains nœuds portent un statut recalculé : ÉVOLUÉ probable / DISPARU probable

> **Principe clé —** La carte ne se met pas à jour automatiquement. Elle conserve l'état au moment de la visite. Un système visité il y a 200 000 ans simulés y figure encore avec ses données d'époque. La carte est un document historique, pas une carte de navigation à jour. Ce n'est pas un bug.

**Actions disponibles :**
- Clic nœud → Observatoire du système
- Survol → infos visite (date, génération, statut recalculé si disponible)

---

#### MODULE — Artefacts

Grille de toutes les traces collectées. Point d'entrée vers le travail d'interprétation et l'organisation personnelle.

La Collection est structurée en deux espaces : la **vue globale** (toutes les traces) et les **dossiers** (classement libre du joueur).

---

##### Vue globale — Toutes les traces

- Grille N×N · Icône par type · Badge "non lu" · Filtre type / difficulté / statut / système
- Chaque trace affichée sans référence à un arc — l'appartenance à un arc n'est jamais signalée par l'interface
- Une trace peut apparaître dans plusieurs dossiers sans que cela soit visible ici

**Actions disponibles :**
- Clic → détail trace + interprétations anonymes existantes + écriture interprétation
- Filtre type / difficulté / statut / système
- Depuis le détail d'une trace : bouton "Ajouter à un dossier"

---

##### Système de dossiers

Le joueur peut créer des dossiers pour organiser ses hypothèses de travail. C'est son espace de pensée privé — personne d'autre ne le voit jamais, ni les autres joueurs, ni le système de traces partagé.

**Structure**

```
Artefacts
├── Toutes les traces          ← dossier permanent, non modifiable
├── [Dossier joueur 1]
├── [Dossier joueur 2]
└── + Nouveau dossier
```

- Un seul niveau de profondeur — pas de sous-dossiers
- Le dossier "Toutes les traces" est permanent et non renommable
- Le joueur peut créer, renommer et supprimer ses dossiers librement
- Une trace peut appartenir à plusieurs dossiers simultanément

**Ajouter une trace à un dossier**

Depuis le détail d'une trace, un bouton "Ajouter à un dossier" ouvre un sélecteur listant les dossiers existants + l'option "Nouveau dossier". La trace est ajoutée sans en être retirée d'aucun autre dossier.

Un badge discret sur l'icône de la trace dans la vue globale indique qu'elle est classée dans au moins un dossier — sans préciser lequel.

**Contenu d'un dossier**

Chaque dossier contient deux éléments :

*1. Liste des traces*
Liste des traces ajoutées par le joueur, dans l'ordre d'ajout. Chaque entrée affiche : icône type · désignation · système · date de collecte. Clic → détail de la trace.

*2. Document de notes*
Un document texte libre attaché au dossier. Le joueur y écrit ce qu'il veut — hypothèse, question, récapitulatif, schéma textuel. Aucune structure imposée.

La liste des traces liées est affichée automatiquement en bas du document, mise à jour à chaque ajout ou retrait. Elle ne peut pas être éditée directement — elle reflète le contenu du dossier.

```
┌─────────────────────────────────────────────┐
│ [Nom du dossier]                    [···]   │
├─────────────────────────────────────────────┤
│                                             │
│  [Zone de texte libre — notes du joueur]    │
│                                             │
│  _                                          │
│                                             │
├─────────────────────────────────────────────┤
│ TRACES LIÉES (3)                            │
│ ≋  PROXIMA-001   Proxima Centauri   2341    │
│ ⌇  ROSS128-001   Ross 128           2341    │
│ ◈  GLIESE667-001 Gliese 667C        2342    │
└─────────────────────────────────────────────┘
```

> **Principe —** L'interface ne sait pas ce que le joueur cherche. Elle lui donne un outil pour l'organiser. Les connexions entre traces — les grammaires communes, les fils conducteurs, les hypothèses — appartiennent entièrement au joueur. Le dossier est le carnet de l'archéologue, pas un système de quêtes.

**Suppression d'un dossier**

La suppression d'un dossier efface le dossier et ses notes. Les traces elles-mêmes ne sont pas affectées — elles restent dans les Artefacts globale et dans les autres dossiers auxquels elles appartiennent.

**Actions disponibles :**
- Créer un dossier · Renommer · Supprimer
- Ajouter / retirer des traces
- Écriture libre dans le document de notes

---

#### MODULE — Laboratoire

Espace d'analyse des données brutes d'une trace. Le joueur y accède depuis une trace dans Artefacts, ou directement depuis la barre instruments.

L'objectif du Laboratoire est de donner accès à des outils de mesure et d'analyse sur les données brutes de chaque trace — pas d'interpréter à la place du joueur, mais de lui permettre de creuser.

**Visualisation selon le type de trace**

| Type | Visualisation |
|---|---|
| SIGNAL | Forme d'onde · spectrogramme · axe fréquence/temps |
| OBJET | Courbe orbitale · vecteur de vitesse · profil d'accélération |
| ANOMALIE_CHIMIQUE | Spectre de masse · tableau de composition · ratios isotopiques |
| ANOMALIE_STELLAIRE | Courbe de lumière · spectre comparatif · historique des variations |
| ANOMALIE_GEOMETRIQUE | Carte orbitale 2D · diagramme de résonance · paramètres orbitaux |
| SEQUENCE | Matrice de symboles · arbre de patterns · intervalles |
| ABSENCE | Carte de densité · comparaison modèle/observation |
| PHYSICAL_ARTIFACT | Spectrogramme de composition · dimensions · position orbitale ou géologique |

Pas de rendu 3D. Toutes les visualisations sont 2D — courbes, spectres, cartes planes, matrices.

**Outils disponibles**

- Zoom sur la visualisation
- Mesure manuelle (distance, fréquence, ratio, intervalle) — curseur positionnable par le joueur
- Comparaison avec la base de données embarquée (phénomènes naturels connus)
- Calcul de fréquence / distance / période
- "Générer rapport" — produit une entrée AUTO dans le Journal avec les mesures effectuées

**Actions disponibles :**
- Zoom · Mesure · Comparaison DB · Calcul · Générer rapport

---

#### MODULE — Journal

Fil chronologique de tout ce qui s'est passé depuis le départ.

**Contenu :**
- Fil chronologique · Types : MANUEL / AUTO / GENERATIONNEL
- Onglet **Mémoire générationnelle** — entrées des générations passées, ton et langage qui dérivent progressivement

**Sur la dérive générationnelle**

Les entrées AUTO générées par le système évoluent subtilement sur les très longues campagnes. Ce que la génération 1 a formulé comme constat factuel peut être reformulé par les systèmes narratifs du vaisseau en quelque chose de plus chargé, plus archaïque. Le joueur voit sa propre parole devenir mythe. Ce n'est jamais formulé explicitement.

**Actions disponibles :**
- Écriture entrée manuelle · Liaison trace/système · Filtre par type
- Consultation mémoire générationnelle en lecture seule

---

#### MODULE — Équation de Drake

État galactique partagé par tous les joueurs. Pas un score — une lecture collective de ce que l'humanité sait, et de ce qu'elle ne sait toujours pas.

```
N = R* × fp × ne × fl × fi × fc × L
```

---

##### Les 7 termes

**Termes fixes** — ancrés dans les données astronomiques actuelles. Ils ne varient pas en cours de jeu. Leur valeur est établie, leur source est citée.

| Terme | Nom | Valeur | Source |
|---|---|---|---|
| R* | Taux de formation stellaire | 3,0 /an | Astronomie observationnelle |
| fp | Fraction d'étoiles avec planètes | 1,0 | Missions Kepler / TESS |
| ne | Planètes en zone habitable / système | 0,40 | Données Kepler 2013 |

Ces trois termes sont affichés avec leur valeur fixe, sans barre d'incertitude. Ils sont ce qu'on sait.

**Termes variables** — influencés par les découvertes collectives des joueurs. Chacun a une valeur courante et une plage d'incertitude.

| Terme | Nom | Valeur initiale | Varie si… |
|---|---|---|---|
| fl | Fraction où la vie apparaît | 0,30 | Traces chimiques ou biologiques découvertes |
| fi | Fraction où l'intelligence émerge | 0,10 | Artefacts complexes ou mathématiques |
| fc | Fraction qui communique | 0,20 | Signaux technologiques détectés |
| L | Durée de vie d'une civilisation (ans) | 10 000 | Civilisations disparues ou actives identifiées |

---

##### Affichage des termes variables — plage d'incertitude

Chaque terme variable est affiché avec sa valeur courante et sa plage estimée :

```
fl  — Probabilité d'apparition de la vie
      [——————●————————————]
      0,10              0,80
      Valeur courante : 0,34
      Incertitude : ± 0,22

fi  — Probabilité d'émergence de l'intelligence
      [●———————————————————]
      0,01              0,60
      Valeur courante : 0,10
      Incertitude : ± 0,28
```

**La plage ne se rétrécit pas automatiquement à chaque découverte.** Elle se rétrécit uniquement quand plusieurs joueurs convergent vers la même interprétation d'une trace liée à ce terme — de façon indépendante, sans coordination explicite. C'est la convergence qui constitue le consensus, pas la découverte seule.

Un terme dont la plage est large dit : *on ne sait pas encore*. Un terme dont la plage s'est resserrée dit : *plusieurs vaisseaux indépendants ont conclu la même chose*. Aucun de ces états n'est commenté par l'interface.

---

##### Tensions entre termes

Le module affiche les tensions lisibles entre termes variables — sans les interpréter.

Exemples de tensions affichées :

```
fl monte   +   L s'effondre
→ La vie est fréquente. Les civilisations ne durent pas.

fi monte   +   fc stagne
→ L'intelligence émerge. Mais elle ne cherche pas à communiquer — ou pas comme on l'attendait.

fl stagne  +   fi monte
→ La vie complexe est rare. Mais quand elle émerge, elle atteint l'intelligence.
```

Ces tensions sont affichées sous les termes comme des paires de faits bruts — deux lignes, aucun commentaire. Le joueur construit le sens.

---

##### Historique géographique des variations

Chaque variation d'un terme est liée à une trace dans un système précis. Le module propose une vue historique qui montre non seulement *quand* un terme a varié, mais *où*.

```
fl  — 4 variations
  +0,03  Gliese 667C     — 22 al    — Génération 7
  +0,02  Ross 128 b      — 11 al    — Génération 4
  +0,05  Tau Ceti f      — 11,9 al  — Génération 12
  −0,01  HD 40307        — 41,8 al  — Génération 18

fc  — 1 variation
  +0,11  Étoile de Tabby — 1 280 al — Génération 31
```

Cette vue révèle des patterns géographiques que la vue chronologique seule ne donne pas : fl n'a bougé que dans le voisinage solaire, fc une seule fois à grande distance. Ce n'est pas expliqué. C'est montré.

Clic sur une entrée → trace responsable dans Artefacts.

---

##### N — valeur globale

```
N = 14,2
△ +0,8 depuis hier
Dernière mise à jour : 2341-06-01
```

N est affiché en grand, sobre. Pas de couleur d'alerte selon la valeur — 14 n'est pas "bon", 7 n'est pas "mauvais". C'est une estimation collective de civilisations communicantes actuellement dans la galaxie. Ce que ça signifie appartient au joueur.

**Actions disponibles :**
- Lecture seule
- Clic sur une variation → trace responsable dans Artefacts
- Bascule entre vue termes / vue historique géographique

---

#### MODULE — Population

Mémoire vivante de la civilisation embarquée. Trois onglets : l'historique des générations, l'état de la génération actuelle, le Registre des Raisons.

---

*Onglet Générations*

Vue chronologique de toutes les générations depuis le départ. Chaque génération est une entrée : numéro, années simulées de début et de fin, systèmes visités pendant sa vie, événements majeurs survenus (découverte, séparation, crise, silence radio).

Le joueur peut remonter jusqu'à la génération 1 et lire ce qui a été transmis. Les entrées les plus anciennes ont un ton qui dérive — les faits deviennent des formules, les formules deviennent des mythes. Ce glissement n'est jamais signalé explicitement.

Les séparations (Arc Colonies) figurent ici comme événements générationnels : faction partie, système, génération de départ. Transmis de génération en génération comme n'importe quel autre événement fondateur.

---

*Onglet Génération actuelle*

État de santé et de motivation de la génération en cours.

```
GÉNÉRATION 4 — en cours
Effectif        : 9 847  ↘
Volonté         : ████░░░░  0.52
Cohésion        : ██████░░  0.71
Alimentation    : ███████░  0.84
Soins           : █████░░░  0.61

Courant dominant : COMPRENDRE
```

- Effectif total + tendance (croissance / déclin)
- Quatre indicateurs : Volonté, Cohésion, Alimentation, Soins — valeurs 0 à 1, sans seuils d'alerte colorés
- Courant social dominant parmi les trois (CONTINUER / RESTER / COMPRENDRE) — affiché comme donnée, pas comme alerte
- Résumé de l'héritage reçu de la génération précédente — texte court, généré automatiquement

---

*Onglet Registre des Raisons*

Liste de réponses à la question *"pourquoi continuons-nous ?"*, déposées spontanément par la population à chaque découverte majeure ou moment de tension. Lecture seule. Mémoire, pas ressource.

```
ENTRÉE 001 — Génération 1 — Jour 0
"Parce que la réponse à cette question justifie
qu'on ne reviendra jamais."

ENTRÉE 047 — Génération 2 — Proxima Centauri b
"Parce qu'il y a quelque chose ici qui attendait qu'on arrive."

ENTRÉE 293 — Génération 4 — Ross 128 b
"Parce que la vie que nous avons trouvée ne sait pas encore
que quelqu'un est venu la voir."

ENTRÉE 847 — Génération 7 — Gliese 667C
"Nous ne sommes pas seuls."
— déposée par 847 personnes simultanément
```

Le Registre grossit après chaque trace complexe, vie détectée, artefact physique, crise populationnelle. Sur les très longues campagnes, les entrées anciennes deviennent étranges — vocabulaire, ton, référents changent. Aucun compteur, aucun indicateur mis en avant.

**Actions disponibles :**
- Lecture seule. Navigation chronologique dans les trois onglets.

---

#### MODULE — Systèmes

Tableau de bord technique du vaisseau ARCA. Trois sections : identité du vaisseau, systèmes propulsion et structure, systèmes de survie.

Le schéma SVG du vaisseau (`ARCA_blueprint_grouped.svg`) est affiché en haut de page. Chaque zone du schéma correspond à un groupe `id` nommé — le highlighting d'un système en jeu cible directement ce groupe.

---

##### Identité du vaisseau

Métadonnées fixes et évolutives du vaisseau. Lecture seule.

```
ARCA — Vaisseau générationnel de classe I

Construit          : 2187
Âge relatif        : 47 ans        ← temps vécu à bord
Âge réel           : 53 ans        ← temps écoulé depuis Sol
Écart              : +6 ans        ← effet cumulé des dilatations temporelles

Masse sèche        : 800 000 t     (structure, équipements, population)
Capacité           : 12 000 personnes
Population actuelle: 10 247
Génération         : 1
```

L'écart entre âge relatif et âge réel s'accumule à chaque passage à proximité d'une étoile massive ou lors de voyages à haute vitesse. Il est affiché sans explication — le joueur constate l'écart, lit ce qu'il veut dans cet écart. Sur les très longues campagnes, l'écart peut devenir considérable.

---

##### Systèmes — Propulsion & Structure

| Système | SVG `id` | Valeur | Conséquence si dégradé |
|---|---|---|---|
| Moteur MTF | `propulsion` | 0.88 | Accélération réduite — voyages plus longs |
| Coque | `bumper-shield` + hull | 0.97 | Vitesse safe réduite |
| Bouclier plasma | `plasma-shield` | 1.00 | Vitesse safe réduite — risque dégradation coque |
| Radiateurs thermiques | `thermal-radiators` | 1.00 | Surchauffe moteur — puissance réduite |

```
PROPULSION    ████████░░  0.88
  Moteur MTF — poussée nominale 0,12g
  État actuel  : accélération max 0,106g
  Conséquence  : vitesse croisière atteinte plus lentement

COQUE         █████████░  0.97
  Résistance aux impacts et contraintes structurelles
  État actuel  : nominal

BOUCLIER PLASMA  ██████████  1.00
  Protection contre poussière interstellaire à haute vitesse
  Vitesse safe actuelle : 4,8%c (nominal)
  Si dégradé : vitesse safe réduite — voyages longs risqués
```

**Carburant** — SVG `id` : `fuel-tanks`

He³ et deutérium ne sont pas en boucle fermée — ils se consomment à chaque voyage et ne peuvent pas être produits à bord. La consommation suit l'équation de Tsiolkovsky : elle dépend de la vitesse de croisière choisie et de la masse actuelle du vaisseau, pas de la distance parcourue.

```
He³          ████████░░░░░░░░  0.742   (1 484 000 t / 2 000 000 t)
Deutérium    █████████░░░░░░░  0.810   (  972 000 t / 1 200 000 t)

Vitesse actuelle     : 4,8%c
Consommation/voyage  : ~61,7% de la masse actuelle
Autonomie estimée    : 1 voyage pleine vitesse · 4 voyages à 2,0%c
```

| Réserves | État | Conséquence |
|---|---|---|
| 75–100% | Plein | Aucune contrainte |
| 50–75% | Suffisant | Autonomie confortable |
| 25–50% | Attention | Planifier un ravitaillement |
| 10–25% | Critique | Chercher une géante gazeuse |
| < 10% | Danger | Immobilisation risquée |

Ravitaillement possible en orbite de géante gazeuse — He³ et deutérium. Opération longue en temps simulé. Collecte passive de deutérium pendant la phase d'inertie (traces dans le milieu interstellaire) — ne compense pas la consommation.

---

##### Systèmes — Survie

Le vaisseau fonctionne en boucle fermée. L'eau est recyclée, l'air est régénéré, la nourriture est produite à bord. Les valeurs ci-dessous représentent l'**efficacité** de chaque système, pas un niveau de stock. Un système à 0,71 ne signifie pas "il reste 71% de nourriture" — il signifie que le système de production alimentaire fonctionne à 71% de sa capacité nominale.

| Système | SVG `id` | Valeur | Conséquence si dégradé |
|---|---|---|---|
| Réservoir (eau, matières premières) | `population-quarters` | 0.84 | Alimentation et atmosphère fragilisées |
| Production alimentaire | `population-quarters` | 0.71 | Baisse volonté et cohésion population |
| Atmosphère (O₂, CO₂, pression) | `population-quarters` | 0.96 | Santé populationnelle dégradée |
| Médical | `fission-reactors` | 0.95 | Mortalité accrue, baisse effectif |
| Observatoire | `navigation` + `comms` | 1.00 | Scan approfondi désactivé si < 0,50 |

```
RÉSERVOIR          ████████░░  0.84   recyclage eau et matières premières
ALIMENTATION       ███████░░░  0.71   production et distribution alimentaire
ATMOSPHÈRE         █████████░  0.96   O₂, CO₂, pression, température
MÉDICAL            █████████░  0.95   soins, épidémiologie, pharmacopée
OBSERVATOIRE       ██████████  1.00   instruments de détection et d'analyse
```

La dégradation est lente et silencieuse. Pas d'alerte sauf seuil critique. Le joueur qui consulte régulièrement voit la dérive. Celui qui ne consulte pas peut ne pas la voir venir.

Conséquences sur la population : un système de survie dégradé affecte la volonté, la cohésion, et sur le long terme l'effectif — visible dans le module Population, pas ici.

Si l'observatoire passe sous 0,50 : scan approfondi désactivé.

---

##### Correspondance SVG complète

| SVG `id` | Zone physique | Systèmes associés |
|---|---|---|
| `plasma-shield` | Bouclier magnétique toroïdal | Bouclier plasma |
| `bumper-shield` | Pare-chocs ablatif — proue | Intégrité coque (avant) |
| `population-quarters` | Anneaux habitat rotatifs × 4 | Réservoir · Alimentation · Atmosphère · Survie |
| `fission-reactors` | Cargaison + réacteurs fission | Alimentation électrique · Médical |
| `thermal-radiators` | Panneaux radiateurs thermiques | Gestion thermique moteur |
| `fuel-tanks` | Réservoirs cryogéniques D₂ + He³ | Carburant He³ · Carburant deutérium |
| `propulsion` | Moteur MTF + tuyère | Propulsion |
| `comms` | Antenne laser communications | Observatoire (comms) |
| `navigation` | Navigation pulsar MSP | Observatoire (navigation) |

---

##### Historique

Fil des événements techniques depuis le départ — pannes, dégradations, réparations. Datés par génération et date simulée.

```
GÉN. 1 — 2189-03-14   Micro-impact coque — secteur 7     −0.03 hull
GÉN. 1 — 2191-07-02   Réparation partielle coque          +0.01 hull
GÉN. 1 — 2194-11-19   Dégradation propulsion — usure MTF  −0.12 propulsion
```

**Actions disponibles :**
- Lecture seule
- Clic sur un événement → entrée liée dans le Journal si elle existe

## 4. États de l'interface selon l'état du vaisseau

### IDLE — En orbite / stationnaire

Toutes les fonctions disponibles.

- Ciel pleinement interactif
- Widget voyage disponible
- Scan approfondi disponible
- Tous les modules accessibles
- Dépôt de trace possible

### IN_TRANSIT — Accélération

Moteur allumé. Interface réduite. Le voyage est lancé.

- Ciel visible, non interactif
- Panel vitesse + progression affiché
- Journal · Artefacts · Drake accessibles
- Observatoire désactivé
- Déviation non disponible

### IN_TRANSIT — Inertie

Phase la plus riche. Moteur éteint. Détection et déviation possibles.

- Ciel interactif (pour déviation uniquement)
- Observatoire passif actif
- Laboratoire disponible
- Déviation de trajectoire possible
- Tous les modules ouverts

### IN_TRANSIT — Décélération

Moteur rallumé. La destination est devant. Mêmes restrictions qu'accélération.

- Ciel visible, non interactif
- Destination visible et annotée
- Journal · Artefacts · Drake accessibles
- Observatoire désactivé
- Déviation non disponible

### ARRIVED — Vient d'arriver

Scan automatique en cours. Interface en mode découverte.

- Scan automatique lancé (pas d'action requise)
- Notification ARRIVÉE affichée
- Observatoire ouvert automatiquement si anomalie détectée
- Traces potentielles révélées progressivement
- Dépôt de trace disponible après scan complet
- Tous les modules accessibles

### DAMAGED — Système en panne

Un ou plusieurs systèmes défaillants. Conséquences différenciées selon la nature des dégâts.

- Indicateur rouge dans le panel gauche
- Notification VAISSEAU — panne active
- Module Systèmes accessible (lecture des dégâts)
- Si propulsion touchée : vitesse max réduite, voyages longs risqués
- Si observatoire touché : scan approfondi désactivé
- Si bouclier touché : vitesse safe réduite drastiquement

### Tableau de disponibilité par module

| Module | IDLE | Accélération | Inertie | Décélération |
|---|---|---|---|---|
| Journal | ✓ | ✓ | ✓ | ✓ |
| Artefacts | ✓ | ✓ | ✓ | ✓ |
| Équation de Drake | ✓ | ✓ | ✓ | ✓ |
| Population | ✓ | ✓ | ✓ | ✓ |
| Systèmes | ✓ | ✓ | ✓ | ✓ |
| Carte | ✓ | ✓ | ✓ | ✓ |
| Observatoire (actif) | ✓ | — | Passif | — |
| Laboratoire | ✓ | — | ✓ | — |
| Navigation / Déviation | ✓ | — | ✓ | — |

---

## 5. Flux principal — parcours joueur type

```
01 Observer le ciel
   Hover étoiles. Anomalies repérables visuellement (pulse ambré).
        ↓
02 Sélectionner
   Clic → widget voyage. Double-clic → Observatoire complet.
        ↓
03 Analyser
   Observatoire + Laboratoire. Scan approfondi optionnel (coûte du temps simulé).
        ↓
04 Fixer cap
   Confirmation dans le widget. Le voyage commence.
        ↓
05 Voyage
   Temps réel. Journal, Artefacts, notifications en chemin.
   Déviation possible en phase d'inertie.
        ↓
06 Arrivée
   Scan automatique. Traces potentielles. Notification ARRIVÉE.
        ↓
07 Interpréter
   Artefacts → trace → champ libre. Niveau de confiance.
   Optionnel : déposer une trace joueur.
        ↓
08 Décider
   Repartir / rester analyser / laisser une trace / suivre une piste.
```

---

## 6. Notifications — format et intégration UI

Les notifications s'affichent en superposition bas-droite du ciel. Elles ne créent jamais d'urgence — elles signalent quelque chose à voir. Le joueur y répond quand il veut.

### Familles et couleurs

| Famille | Couleur | Priorité max |
|---|---|---|
| VOYAGE | Amber | NOTABLE |
| TRACES | Cyan | NOTABLE |
| POPULATION | Muted | RARE |
| VAISSEAU | Rouge | RARE (panne) |
| GALACTIQUE | Blanc | RARE |
| TEMPORELLE | Muted | RARE |

### Exemples de notifications

```
TRANSIT — J+3 — 14h22
Système non catalogué détecté — 8,3 al — tribord
Type spectral estimé : K2V
Anomalie suspectée — niveau 1
Déviation possible — coût carburant : 9%
```

```
SCAN — 2341-05-22 — HD 40307
Anomalie détectée — niveau 1
Type : ANOMALIE_GEOMETRIQUE
Désignation provisoire : HD40307-001
6 planètes confirmées. Configuration orbitale inhabituelle.
```

```
MÉMOIRE — 2341-11-12
Passage de génération — Génération 2
La génération qui a regardé la Terre disparaître n'est plus.
Leurs journaux sont préservés.
```

> **Règle agrégation —** Si le joueur revient après >1h d'absence avec plus de 3 notifications en attente, elles sont agrégées en un résumé de voyage. Pas de pile infinie. Pas de badge rouge qui panique.

---

## 7. Widget Voyage — interaction de sélection

Apparaît après clic simple sur une étoile. Flottant, positionné au plus près de l'étoile sans déborder. Disparaît au clic ailleurs ou à la confirmation.

### Exemple

```
┌─────────────────────────────────┐
│ HD 44594                    [×] │
├──────────────┬──────────────────┤
│ DISTANCE     │ DURÉE ESTIMÉE    │
│ 11,4 al      │ 2h16             │
├──────────────┼──────────────────┤
│ CARBURANT    │ TYPE             │
│ −3,2%        │ G2V              │
├──────────────┴──────────────────┤
│ Observé il y a 11 ans · Anomalie niv. 1
├─────────────────────────────────┤
│ COÛT GÉNÉRATIONNEL              │
│ ~3 générations — G2 → G5        │
├─────────────────────────────────┤
│ [OUVRIR OBSERVATOIRE] [FIXER CAP →] │
└─────────────────────────────────┘
```

### Champ Coût générationnel

Le coût générationnel est affiché à titre informatif, sans dramatisation. Il est calculé depuis la durée physique du voyage et l'espérance de vie générationnelle embarquée.

```
Durée joueur      : 2h16
Durée physique    : ~230 ans simulés
Coût générationnel: ~3 générations — G2 → G5
```

Ce champ ne porte pas de couleur d'alerte. Il ne change pas quand la durée est courte (< 1 génération, il affiche simplement *"< 1 génération"*). Il est là pour que le joueur sente le temps, pas pour qu'il optimise.

> **Principe —** L'affichage simultané durée joueur / coût générationnel produit une tension émotionnelle réelle et non artificielle. Le joueur ressent la responsabilité envers la population sans qu'elle lui soit imposée. Ne jamais réduire ce champ à un simple nombre — le format *"G2 → G5"* donne une direction, pas seulement un coût.

### Source des données

| Champ | Source |
|---|---|
| Distance | Calculée depuis position actuelle |
| Durée estimée | Compression non-linéaire (fonction puissance) |
| Carburant | Tsiolkovsky · état propulsion · masse actuelle |
| Type spectral | Observation depuis position (peut être décalé dans le temps) |
| Observé il y a | Distance en al = délai en années |
| Anomalie | Visible depuis position actuelle (niv. 1–2 max à distance) |
| Coût générationnel | Durée physique / espérance de vie générationnelle embarquée |

Le bouton "Fixer cap" est la seule action irréversible directement accessible depuis le ciel. Les deux boutons ont un poids visuel différent — le cap est plus présent mais pas alarmant.

---

## 8. Tokens visuels & Langage de conception

### Couleurs

| Token | Valeur | Usage |
|---|---|---|
| Cyan | `#00B4C8` | Données, valeurs, liens, sélection |
| Amber | `#E8A020` | Anomalies, alertes douces, labels de section |
| White | `#CCDDE8` | Texte principal |
| Muted | `#3A5464` | Labels secondaires, descriptions |
| Green | `#40C870` | État nominal, confirmations |
| Red | `#C84040` | Seuil critique, pannes |
| Background | `#03060D` | Fond principal — noir spatial profond |
| Panel | `#0A1828` | Surfaces de panels |

### Typographie

| Police | Usage |
|---|---|
| **Syne 800** | Titres, logo, noms de modules |
| Share Tech Mono | Données, valeurs, toute l'UI fonctionnelle |
| Mono 9px / 3px tracking | Labels secondaires, en-têtes de colonnes |

### Principes visuels

- Fond `#03060D` — noir spatial profond, pas de texture
- Panels semi-transparents avec `backdrop-filter: blur`
- Bordures : 1px, opacity 0.15–0.5
- Animations : lentes, organiques — jamais de flash
- Pulse anomalie : 3–5s, opacity 0.3–0.8
- Pas de gradients violets
- Pas de glassmorphism générique
- L'espace est le seul décor

---

## 9. Onboarding — Règles UX

> Texte narratif complet des 5 écrans → `LACUNA_LORE.md` §3

5 écrans. Fond noir total. Pas de chrome d'interface. Pas de flèche. Pas d'objectif affiché. Pas de barre de progression.

### Comportement de la séquence

| Règle | Détail |
|-------|--------|
| Durée maximale | 3 minutes — le joueur avance à son rythme, clic ou touche |
| Premier lancement | Séquence complète — non sautée |
| Lancements suivants | Arrivée directe sur le ciel — vaisseau là où il a été laissé |
| Transition finale | Fade-in progressif : header → panels latéraux → barre instruments |

### Structure des 5 écrans

| Écran | Titre | Nature |
|-------|-------|--------|
| 01 | Le catalogue | Données chiffrées — fond noir, texte centré |
| 02 | Les trois questions | Texte narratif — 3 anomalies sans conclusion (WOW!, Oumuamua, Bennu) |
| 03 | Le pari | Décision collective — population initiale affichée (10 247) |
| 04 | Le départ | Texte court — ce qui a été laissé derrière · décalage lumineux de la Terre |
| 05 | Le premier choix | Le ciel s'ouvre — 12 anomalies visibles — aucune instruction |

L'écran 05 est la transition vers le jeu. Il n'y a pas de bouton "commencer". Le joueur est déjà dedans.

### Séquence des premières minutes

Dès le départ (phase d'accélération), une notification apparaît :

```
3 traces sont embarquées à bord.
Elles ont motivé ce voyage.
Vous avez le temps de les lire.
```

Le joueur ouvre ses Artefacts — WOW! (1977), Oumuamua (2017), Nucléobases Bennu (2023) — et découvre naturellement le Laboratoire, le Journal, la mécanique d'ambiguïté, sans tutoriel explicite.

---

## 10. Système social — points de contact UI

> Principes du système social (anonymat, traces, profils émergents) → `LACUNA_GDD.md` §5

Ce qui est spécifique à l'interface :

### Points de contact dans l'interface

| Élément UI | Données joueurs visibles | Format |
|---|---|---|
| Artefacts → trace détail | Interprétations anonymes. Génération du vaisseau d'origine. Niveau de confiance. Texte libre. | Fil vertical, par date simulée de dépôt |
| Carte → nœud système | Nombre de vaisseaux ayant visité ce système. Pas de noms. | Badge numérique discret sur le nœud |
| Ciel — étoile visitée par d'autres | Légère variation de l'anneau cyan si d'autres vaisseaux y sont allés | Visuel subtil — pas de chiffre affiché dans le ciel |
| Notification TRA-003 | Extrait d'une nouvelle interprétation sur une trace connue | Famille Traces (cyan) — bas-droite |
| Notification GAL-004 | Signal de balisage : vaisseau passé récemment dans la destination en cours | Famille Voyage (amber) — en transit |

> **Règle d'anonymat —** Aucune interprétation n'est signée. Elle est datée par la génération de voyage du vaisseau d'origine ("Génération 7 — vaisseau inconnu"). Jamais de pseudo, jamais d'identifiant.

---

## 11. Outil de création de traces — Atelier

Le joueur peut créer ses propres traces et les déposer dans le système où il se trouve. Il devient lui-même un constructeur — capable de laisser derrière lui quelque chose d'énigmatique, d'ambigu, de délibérément difficile à interpréter.

L'outil est accessible depuis l'Observatoire, uniquement en état IDLE (en orbite). Il n'est pas accessible en transit.

> **Principe —** La trace joueur n'est pas une annotation. C'est une vraie trace — elle entre dans le catalogue partagé exactement comme une trace immuable. Elle sera trouvée, analysée, interprétée par d'autres joueurs qui ne sauront pas si elle est artificielle ou naturelle. Le joueur qui la crée porte cette responsabilité.

---

### 11.1 Choix du support

Avant de créer sa trace, le joueur choisit un support parmi ceux disponibles dans le système courant. Les supports disponibles dépendent de ce que le système contient physiquement.

| Support | Disponible si… | Type de trace possible | Durée de vie |
|---|---|---|---|
| **Objet en orbite** | Toujours (le vaisseau peut placer un objet) | PHYSICAL_ARTIFACT · SEQUENCE · ANOMALIE_GEOMETRIQUE | **Immuable** — persiste indéfiniment |
| **Surface planète solide** | Planète tellurique présente dans le système | PHYSICAL_ARTIFACT · SEQUENCE | **Dégradation lente** — selon activité géologique, érosion, bombardement. Peut être ÉVOLUÉ ou DISPARU après des millions d'années simulées |
| **Émission radio** | Corps céleste avec énergie disponible (planète, lune, astéroïde riche) | SIGNAL · SEQUENCE | **Durée limitée** — calculée depuis la source d'énergie disponible. La trace devient inactive quand la source s'épuise |

Le joueur voit pour chaque support disponible : sa description physique, le type de trace possible, et une estimation de durée de vie en années simulées.

```
┌─────────────────────────────────────────────┐
│ CHOISIR UN SUPPORT                          │
├─────────────────────────────────────────────┤
│ ◉  OBJET EN ORBITE                          │
│    Placer un objet manufacturé en orbite    │
│    stable autour de GJ 667C                 │
│    Durée : immuable                         │
│    Types : PHYSICAL_ARTIFACT · SEQUENCE     │
├─────────────────────────────────────────────┤
│ ○  SURFACE — GJ 667Cc                       │
│    Déposer sur la surface de la planète     │
│    Activité géologique : modérée            │
│    Durée estimée : ~200–800 Ma simulés      │
│    Types : PHYSICAL_ARTIFACT · SEQUENCE     │
├─────────────────────────────────────────────┤
│ ○  ÉMISSION RADIO — GJ 667Cc                │
│    Émettre depuis la surface de la planète  │
│    Source d'énergie estimée : 40 000 ans    │
│    Types : SIGNAL · SEQUENCE                │
└─────────────────────────────────────────────┘
```

---

### 11.2 Création de la trace

Une fois le support choisi, le joueur accède à l'outil de création correspondant au type de trace.

#### PHYSICAL_ARTIFACT

Le joueur définit :
- **Matériau apparent** — parmi les matériaux disponibles dans le système (extraits des données de scan)
- **Géométrie** — dimensions et forme (longueur, largeur, ratio) dans les limites physiques du vaisseau
- **Gravures** — optionnel. Le joueur peut définir un pattern : séquence de lignes, espacement, ratio d'interruption

L'interface génère une description brute telle qu'elle apparaîtra dans l'Observatoire d'un autre joueur — le joueur voit exactement ce qu'il laisse avant de confirmer.

#### SIGNAL

Le joueur définit :
- **Fréquence** — en MHz, saisie libre
- **Structure temporelle** — durée d'émission, périodicité, forme de l'impulsion (continu / pulsé / modulé)
- **Polarisation** — optionnel (circulaire gauche / droite / linéaire / non définie)

#### SEQUENCE

Le joueur saisit une séquence numérique ou symbolique libre. Elle sera présentée dans le Laboratoire d'un autre joueur comme une matrice de symboles ou un arbre de patterns, selon sa structure.

---

### 11.3 Coût du dépôt

Le coût est calculé selon le support et la nature de la trace. Il est affiché avant confirmation — le joueur ne peut pas être surpris.

| Support | Coût |
|---|---|
| Objet en orbite | Module consommé (déduit de l'inventaire vaisseau) |
| Surface planète solide | Module consommé + carburant sonde (descente atmosphérique) |
| Émission radio | Énergie embarquée (déduite des réserves He³ / deutérium) |

> Le coût est réel mais non prohibitif. Déposer une trace immuable dans l'espace est le geste le plus coûteux et le plus durable. Déposer un signal radio est le moins coûteux et le plus éphémère. Le joueur choisit son rapport au temps.

---

### 11.4 Aperçu et confirmation

Avant de confirmer, le joueur voit la fiche complète de sa trace — telle qu'elle sera présentée à un autre joueur qui la découvrira.

```
APERÇU — CE QU'UN AUTRE JOUEUR VERRA

PHYSICAL_ARTIFACT — Gliese 667C
Difficulté estimée : 2

Objet en orbite stable — 1 200m × 180m
Matériau : alliage réfractaire — concentration ×8 valeurs nominales
Géométrie : cylindrique allongée — ratio 1:6,7
Gravures : espacement 4,7mm — 84 lignes — interruption à la ligne 12
Température de surface : 2,7K
Dérive orbitale mesurée : nulle sur [N] orbites

Origine : inconnue
Datation : impossible depuis l'extérieur

[CONFIRMER LE DÉPÔT]   [MODIFIER]   [ANNULER]
```

La datation est toujours marquée "impossible depuis l'extérieur" — le joueur ne peut pas ancrer sa trace dans le temps de façon vérifiable. C'est voulu : cela maintient l'ambiguïté pour les joueurs qui la trouveront.

---

### 11.5 Règles d'anonymat et de cohérence

- La trace est déposée de façon anonyme — aucun identifiant, aucun pseudo, aucune génération affichée à son sujet
- Elle entre dans le catalogue partagé avec le type `TRACE_JOUEUR` en interne, mais ce type n'est **jamais affiché** aux autres joueurs — elle apparaît exactement comme une trace ordinaire
- Elle est datée par la génération du vaisseau déposant, **visible uniquement** dans les métadonnées internes. Ce champ n'est jamais montré à un autre joueur
- Une trace déposée ne peut pas être modifiée après confirmation. Elle peut être déclarée inactive par le joueur (si c'est une émission radio qu'il souhaite couper manuellement), mais ne peut pas être effacée

---

*LACUNA — Interface v1.1 — Mars 2026 — Confidentiel — Antigravity*
