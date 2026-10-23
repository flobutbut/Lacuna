*Dernière modification : 2026-10-23*

# LACUNA — Interface

**v0.7 — Mars 2026**
Spécification de l'interface joueur — structure, modules, états, tokens visuels, onboarding UX, interactions sociales.

> Contenu narratif onboarding → `LACUNA_LORE.md` §3 · Système social complet → `LACUNA_GDD.md` §5

*Confidentiel — Antigravity*

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

---

## 1. Vue générale — Structure de l'écran

Le ciel interactif et ses deux panels permanents constituent ensemble l'**Observatoire** — le tableau de bord principal du joueur. Ce n'est pas un module overlay parmi les autres. C'est l'état de base de l'interface, toujours présent, depuis lequel tout part.

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER  Logo · Nom vaisseau + voyage · Coords · Génération · N= │
├──────────┬───────────────────────────────────────┬───────────────┤
│          │                                       │               │
│  PANEL   │                                       │  PANEL        │
│  GAUCHE  │         CIEL INTERACTIF               │  DROIT        │
│          │                                       │               │
│ Vaisseau │   étoiles · hover · clic · signaux    │ Civilisation  │
│ Signaux  │                                       │ Traces        │
│ captés   │                                       │               │
│          │                                       │               │
├──────────┴───────────────────────────────────────┴───────────────┤
│  BARRE INSTRUMENTS — 8 boutons d'accès aux modules               │
└──────────────────────────────────────────────────────────────────┘
```

### Zones et interactions

| Zone | Type | Contenu | Interaction |
|---|---|---|---|
| Header | Permanent | Logo · Nom vaisseau + voyage · Coordonnées galactiques · Génération · N= Drake · État transit | Lecture seule. N= cliquable → ouvre module Drake |
| Ciel interactif | Permanent | Canvas étoiles procédural. Toujours visible sous les panels. Étoiles visitées / probabilités d'anomalie / trajectoire active / pulse signal | Hover → tooltip · Clic → modale système flottante |
| Panel gauche | Permanent | Indicateurs vaisseau + zone signaux captés | Clic indicateur → ouvre Systèmes · Clic signal → ouvre Laboratoire |
| Panel droit | Permanent | Snapshot civilisation + dernières traces formalisées | Clic → ouvre Population ou Collection |
| Barre instruments | Permanent | 8 boutons d'accès aux modules. Indicateur visuel si données non lues | Clic → ouvre le module en overlay |
| Panels overlay | Overlay | Modules métier (voir section 3). S'ouvrent sur le ciel sans l'occulter complètement | Fermables. Ciel toujours cliquable en arrière-plan |
| Modale système | Contextuel | Apparaît après clic sur étoile : données système, durée voyage, carburant estimé, boutons action | Disparaît au clic ailleurs ou à la confirmation |
| Fil de notifications | Contextuel | Notifications temps réel. Superposées au ciel, disparaissent après lecture | Clic → ouvre module lié ou détail |

### Légende

- **Permanent** — toujours visible, fait partie du chrome de l'interface
- **Overlay** — s'ouvre sur le ciel, ciel toujours visible en arrière-plan
- **Contextuel** — apparaît selon l'action du joueur ou un événement

---

## 2. Le Ciel — comportement détaillé

Le ciel est la carte stellaire interactive. Il est toujours présent — sous les panels permanents, sous les overlays des modules. C'est l'espace de référence constant.

### États des étoiles

| État | Rendu visuel |
|---|---|
| Non visitée | Point blanc, opacité proportionnelle à la magnitude |
| Visitée | Anneau cyan fin (1px), opacity 0.6 |
| Probabilité faible (< 40%) | Teinte ambre légère |
| Probabilité moyenne (40–70%) | Pulse ambré lent (3s) |
| Probabilité haute (> 70%) | Pulse fort + halo diffus |
| Destination en transit | Ligne de trajectoire cyan, opacity 0.3 |
| Sélectionnée | Réticule carré + surbrillance |
| Marqueur signal capté | Indicateur discret sur le bord du ciel · direction approximative du signal |

### Réception d'un signal — effets visuels

Quand le vaisseau capte un signal, deux effets cohabitent simultanément :

**Halo de signal** *(précise l'ancien « pulse de bord » — octobre 2026 ; implémenté : `SignalHalo.vue`, `lib/signalHalo.js`)* — un halo violet (`--color-signal`) borde **toute l'application**, y compris le Laboratoire, la Collection ou le Journal : l'overlay laisse passer l'effet sur les bords. Il signale une présence, sans urgence et sans hiérarchie : il ne distingue jamais un signal « important » d'un signal ordinaire.

- **Orientation** — le halo est plus intense sur le bord qui fait face à la direction du signal, par rapport à la direction de vue actuelle de l'Observatoire. Son intensité globale augmente quand le joueur tourne la vue vers le signal (gain calculé comme pour le faisceau du Radar). Il aide à s'orienter sans pointer précisément.
- **Sans direction** — un émetteur du système où se trouve le vaisseau, ou un signal à direction mal définie (bouffée de neutrinos), donne un halo uniforme sur tous les bords.
- **Déclencheurs** — le *début* d'un signal seulement : nouvelle capture, ouverture d'une fenêtre d'émission, impulsion d'un signal lent (période de l'ordre de la minute ou plus, comme LPT-001), et l'arrivée de la lumière d'une supernova (sortie du choc de SN-001, orientée vers l'étoile). Un train d'impulsions rapide (pulsar) ne le rallume pas en continu — sinon le halo devient un tic d'interface et perd son sens.
- **Durée** — montée en fondu, puis extinction progressive en quelques secondes.
- **Rôle face au Radar** — le Radar ne garde que 12 minutes d'historique. Pour un signal dont la période dépasse cette durée, le halo qui revient à chaque impulsion est ce qui permet au joueur de remarquer la récurrence.
- **Accessibilité** — la couleur n'est jamais le seul indice : le signal apparaît aussi dans la zone signaux et sur le ciel. Avec `prefers-reduced-motion`, le halo s'affiche sans animation et s'efface sans fondu.

**Tuile Neutrinos** *(octobre 2026, implémentée : `NeutrinoMonitor.vue`)* — sous le Radar, dans le panneau gauche, avec son interrupteur. Courbe du taux d'événements par seconde sur les 10 dernières minutes, en échelle logarithmique, et taux courant. Aucune direction : seulement « combien, et quand ».

**Pulse sur le ciel** — un gradient radial diffus apparaît directement sur la carte stellaire, centré sur la direction estimée du signal. Visible uniquement depuis le ciel (Observatoire). Plus précis que le halo — il indique approximativement d'où vient le signal dans l'espace.

Le pulse sur le ciel s'estompe en quelques secondes et ne se répète pas. Le signal est ensuite représenté dans la zone signaux captés du panel gauche.

### Actions joueur

| Action | Résultat |
|---|---|
| Hover étoile | Réticule + tooltip |
| Clic simple étoile | Modale système flottante |
| Hover marqueur signal | Tooltip signal (fréquence, direction, distance, date) |
| Clic marqueur signal | Modale signal flottante |
| Drag | Pan — rotation de la vue (direction ra/dec) |
| Flèches clavier | Pan — même effet, interpolé |
| Clic pendant transit | Sélection uniquement — modale sans bouton cap |

### Tooltip (exemple)

```
HD 44594
Distance        11,4 al
Type spectral   G2V
Durée voyage    ~2h16
Observé il y a  11 ans
Anomalie        Probabilité 61%
```

> **Principe clé —** Le ciel ne disparaît jamais. Tous les panels s'ouvrent en overlay semi-transparent dessus. Le joueur voit toujours les étoiles derrière ce qu'il lit. L'espace est la constante. L'interface est l'outil.

---

## 3. L'Observatoire — tableau de bord permanent

L'Observatoire n'est pas un module overlay. C'est l'état de base de l'interface : le ciel interactif encadré par les deux panels permanents. Tout ce que le joueur voit sans ouvrir aucun module.

### Ciel interactif — spécifications techniques

#### FOV et projection

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| **FOV** | 120° | Champ de vision en cône — seuls les systèmes dans ce cône sont affichés |
| **Projection** | Stéréographique | Systèmes projetés sur un plan tangent au centre de la vue |
| **Direction de vue** | `{ ra, dec }` | Ascension droite (0–360°) et déclinaison (-89° à 89°) — définit le centre du champ |

Les systèmes hors du FOV ne sont pas visibles ; le joueur doit pan pour les découvrir.

#### Filtre de visibilité (backend)

**Règle d'affichage selon le stationnement** — Le système où stationne le vaisseau (`current_system_id`) n'est jamais affiché dans le ciel : on ne voit pas l'étoile sur laquelle on se trouve. Si le joueur est à Sol, Sol n'apparaît pas ; s'il se déplace à Proxima, Proxima disparaît du ciel et Sol devient visible.

Les systèmes affichés sont pré-filtrés par magnitude apparente depuis la position du vaisseau. RPC `get_visible_systems` : exclusion de `p_viewer_system_id`, estimation M_abs depuis `spectral_type`, distance 3D, m_app ≤ 18. Systèmes trop faibles ou trop lointains exclus.

#### Pan — déplacement de la vue

| Contrôle | Action |
|----------|--------|
| **Drag souris** | Modifie la direction de vue (ra, dec). Seuil 5 px pour distinguer clic et pan. |
| **Flèches clavier** | ↑ ↓ ← → déplacent la vue (8° par appui). Pas de capture si un input a le focus. |

Le pan au clavier est **interpolé** : la vue converge vers une cible avec un lerp (~5 % par frame). Le drag met à jour instantanément.

#### Éléments fixes vs mobiles

| Élément | Comportement |
|---------|--------------|
| **Grille courbe** | Fixe — lignes horizontales courbes (effet dôme céleste) |
| **Flare / Voie lactée** | Fixe — flou gaussien, centre de l'écran |
| **Signaux (marqueurs)** | Fixes — direction azimuth |
| **Systèmes stellaires** | Mobiles — seuls éléments qui bougent avec le pan |

#### Grille et flare

- **Grille** : 6 lignes horizontales en `quadraticCurveTo`. Opacité réduite progressivement vers le centre (alpha 0,02 au centre, ~0,22 en haut/bas). Couleur `rgba(100, 130, 180)`.
- **Flare** : ellipse avec dégradé linéaire, `blur(35px)`, suggère la Voie lactée.

#### Interactions

| Action | Résultat |
|--------|----------|
| Hover étoile | Tooltip (nom, distance, type spectral, anomalie) |
| Clic simple | Modale système (TravelWidget) |
| Double-clic | Panel Observatoire (corps détectables) |
| Pan (drag / flèches) | Rotation de la vue — découvrir d'autres régions du ciel |

#### Indicateur d'azimut (direction de vue)

Un indicateur en **bas au centre** du ciel affiche la direction du centre du FOV au format **α HHh MMm SSs  δ ±DD° MM′** (ascension droite, déclinaison). Référence ICRS.

| Élément | Détail |
|---------|--------|
| **Position** | Centré en bas, au-dessus des contrôles |
| **Clic** | Ramène la vue à l'origine (α 12h, δ +0°) avec interpolation fluide |
| **Tooltip** | *Direction de vue · Clic : revenir à la vue d'origine* |

**Origine et référence** — En espace interstellaire, il n'y a pas d'origine physique fixe. L'Observatoire utilise la convention **ICRS** (International Celestial Reference System) : l'ascension droite 0h correspond à la direction du point vernal (équinoxe de mars), définie par l'orbite terrestre et calibrée sur des quasars lointains. Le vaisseau embarque des catalogues stellaires établis avant le départ ; le cadre de référence est conventionnel mais stable — les directions (α, δ) restent cohérentes où que soit le vaisseau.

#### Vue Ciel profond / Système (implémenté)

Onglets **Ciel profond** | **Système** en haut. En mode Ciel profond : filtres spectraux + recherche. En mode Système : vue détaillée du système stellaire courant (voir ci-dessous).

---

#### Vue Système — détail (implémenté)

Vue du système où stationne le vaisseau (`ships.current_system_id`). Affiche l'étoile et les planètes avec leurs distances et tailles à l'échelle.

##### Structure visuelle

| Élément | Contenu |
|---------|---------|
| **Étoile (Soleil)** | À gauche. SVG selon type spectral (O, B, A, F, G, K, M, L, T, Y, D, Pulsar). Taille à l'échelle réelle (R⊕ → px, même échelle que les planètes). Disque plein (viewBox 64×64, cercles r=32). |
| **Orbites + zone habitable** | Calque SVG en arrière-plan. Cercles orbitaux centrés sur l'étoile. Bande zone habitable (Kopparapu) en bleu translucide entre inner et outer. |
| **Planètes** | Positionnées sur orbites (échelle logarithmique) ou en grille 3 colonnes si pas de données orbitales. Point coloré (cyan si dans zone habitable). Label (désignation ou nom). Anneaux si `has_rings`. Tooltip : nom, distance UA, rayon R⊕, anneaux. |
| **Échelle des distances** | En bas (bottom: 128px), position absolute. Alignée sur la tangente droite du Soleil (0 UA = surface). Graduations : 0, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100 UA. Suit le scroll horizontal. |

##### Données et calculs

| Donnée | Source |
|--------|--------|
| Objets du système | `system_objects` (STAR, PLANET, MOON, MINOR_BODY) |
| Distances orbitales | `orbital_semi_major_axis_au` ou calcul depuis `orbital_period_days` (Kepler) |
| Tailles (R⊕) | `radius_earth` ou inférence depuis `mass_earth` |
| Zone habitable | Kopparapu 2013 depuis luminosité stellaire (spectral_type, mass_stellar) |
| In zone habitable | `in_habitable_zone` par planète |

##### Comportement

| Aspect | Détail |
|--------|--------|
| **Scroll** | Horizontal uniquement. Pas de scroll vertical. Contenu aligné à gauche (Soleil accessible à scrollLeft=0). |
| **Représentation** | Si données orbitales : vue orbitale (échelle log). Sinon : grille 3 colonnes (fallback). |
| **Message vide** | "Aucune donnée pour ce système" si pas d'étoile. "Aucune planète connue dans ce système" si étoile sans planètes. |

##### Référence technique

- Composant : `src/components/SystemView.vue`
- Convertisseurs : `src/lib/systemObjectConverters.js` (toPhysicalUnits, toVisualParams, toLuminosityAndHz)
- SVG étoiles : `src/assets/illustrations/stars/star-*.svg`

#### Filtres spectraux (implémenté)

Boutons flottants **sous les onglets** (mode Ciel profond uniquement). Quatre modes : **Visuel**, **IR**, **UV**, **R**.

| Filtre | Effet visuel | Filtrage astres |
|--------|--------------|-----------------|
| **Visuel** | Blanc/gris (défaut) | Tous (m_V ≤ 12) |
| **IR** | Teinte orangée | m_I ≤ 12 — naines M/K plus brillantes, O/B masquées |
| **UV** | Teinte bleue | m_U ≤ 12 — étoiles O/B/A favorisées, M masquées |
| **R** | Teinte rouge légère | m_R ≤ 12 — intermédiaire |

**Implémentation** : `src/lib/spectralBands.js` — indices V-I et U-V par type spectral (Johnson-Cousins) ; post-filtrage front sur les systèmes retournés par `get_visible_systems` (limite 14 pour pool) ; teinte via `ctx.globalCompositeOperation = 'overlay'`. Store UI : `spectralFilter`, `setSpectralFilter`.

---

### Panel gauche — Vaisseau & Signaux

#### Bloc vaisseau

| Indicateur | Source | Seuils couleur |
|---|---|---|
| Propulsion | `systems.propulsion` | > 0.7 vert / 0.4–0.7 ambré / < 0.4 rouge |
| Carburant He³ | `fuel.he3` | > 0.5 vert / 0.2–0.5 ambré / < 0.2 rouge |
| Intégrité coque | `systems.hull` | > 0.8 vert / 0.5–0.8 ambré / < 0.5 rouge |
| Bouclier plasma | `systems.plasmaShield` | Actif vert / Inactif rouge |
| État | `travelState` | IDLE / ACCÉLÉRATION / INERTIE / DÉCÉLÉRATION |

#### Bloc signaux captés

Zone de stockage visuel des signaux reçus non encore traités. Chaque signal est représenté par une **card** empilée verticalement sous les indicateurs vaisseau.

Le pattern d'interaction est identique à celui des étoiles sur le ciel : hover → tooltip · clic → modale.

**Card signal — état au repos (succinct) :**

```
┌──────────────────────────────┐
│ 1420 MHz  ·  azimut 217°     │
│ Reçu il y a 2h               │  ←  barre de durée de vie
└──────────────────────────────┘
```

Seuls les deux champs essentiels sont visibles au repos — fréquence et direction. Assez pour identifier le signal d'un coup d'œil. Rien de plus.

**Tooltip au hover :**

```
Signal capté
Fréquence       1420 MHz
Direction       azimut 217° · plan +12°
Distance est.   ~340 al
Reçu le         2187-04-12
```

**Comportement des cards :**
- Pas de limite de nombre — les cards s'accumulent
- Chaque card a une barre de durée de vie qui s'écoule silencieusement en **temps joueur** — indépendant du temps simulé, pour ne pas pénaliser les longs voyages
- À la reconnexion, les cards encore vivantes sont présentes — le joueur retrouve les signaux captés pendant son absence
- Bouton `[×]` au hover sur la card — ignorer manuellement, suppression immédiate et définitive

**Représentation sur le ciel :**

Un signal capté a aussi une présence sur la carte stellaire — un **marqueur directionnel** sur le bord du ciel correspondant à l'azimut du signal. Discret, pas une étoile. Le même hover/clic que pour les étoiles fonctionne dessus.

---

### Modale signal — clic sur une card ou sur le marqueur directionnel

Même pattern que la modale système. Flottante, centrée dans l'interface. Disparaît au clic ailleurs ou à la confirmation.

```
┌─────────────────────────────────┐
│ Signal · 1420 MHz           [×] │
├──────────────┬──────────────────┤
│ FRÉQUENCE    │ DIRECTION        │
│ 1420 MHz     │ azimut 217°      │
├──────────────┼──────────────────┤
│ DISTANCE EST.│ REÇU LE          │
│ ~340 al      │ 2187-04-12       │
├──────────────┴──────────────────┤
│ Durée du signal   72 secondes   │
│ Polarisation      circulaire    │
│ Structure         non uniforme  │
│                                 │
│          [ANALYSER AU LABO →]   │
└─────────────────────────────────┘
```

| Champ | Source |
|---|---|
| Fréquence | Donnée brute du récepteur radio |
| Direction | Azimut galactique calculé à la réception |
| Distance estimée | Parallaxe ou décalage Doppler si calculable — sinon absent |
| Reçu le | Date simulée de la capture |
| Durée du signal | Durée de l'émission captée |
| Polarisation | Donnée brute — linéaire / circulaire / non déterminée |
| Structure | Caractérisation grossière de la forme d'onde — uniforme / non uniforme / pulsé |

**[ANALYSER AU LABO →]** → ajoute le signal à la file d'observations du Laboratoire et ouvre le Laboratoire. La card disparaît du panel gauche — le signal est maintenant dans le labo.

> La modale signal n'interprète rien. Durée, polarisation, structure — ce sont des données brutes. Elles sont là pour que le joueur décide s'il veut aller plus loin, pas pour lui souffler la réponse.

---

### Panel droit — Civilisation & Traces

#### Bloc civilisation

| Indicateur | Source |
|---|---|
| Effectif | `population.total` + tendance (↑ ↓) |
| Volonté | `population.will` — barre + valeur |
| Cohésion | `population.socialCohesion` — barre |
| Génération | `population.generation` + âge moyen |
| Statut culturel | `population.culture` — label court |

#### Bloc dernières traces formalisées

Liste des 5 dernières traces ajoutées à la Collection, dans l'ordre antéchronologique.

Chaque entrée affiche :

| Champ | Contenu |
|---|---|
| Désignation | Nom de la trace — ex. `HD44594-021` |
| Système | Étoile hôte |
| Date | Date simulée de formalisation |
| Fiabilité moyenne | Score % de la trace |
| Badge | `ARCHIVE` si trace terrestre pré-chargée |

Clic sur une entrée → ouvre la trace dans la Collection.

---

### Modale système — clic sur une étoile

Apparaît au clic simple sur une étoile. Flottante, centrée dans l'interface. Disparaît au clic ailleurs ou à la confirmation d'une action.

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
│ Observé il y a 11 ans           │
│ Probabilité d'anomalie : 61%    │
│                                 │
│     [ANALYSER]   [FIXER CAP →]  │
└─────────────────────────────────┘
```

| Champ | Source |
|---|---|
| Distance | Calculée depuis position actuelle |
| Durée estimée | Compression non-linéaire (fonction puissance) |
| Carburant | Tsiolkovsky · état propulsion · masse actuelle |
| Type spectral | Observation depuis position (décalé dans le temps) |
| Observé il y a | Distance en al = délai en années |
| Probabilité d'anomalie | Calculée par scan passif depuis position actuelle |

**[ANALYSER]** → ajoute le système à la file d'observations du Laboratoire et ouvre le Laboratoire.
**[FIXER CAP →]** → déclenche le voyage. Action irréversible — poids visuel plus fort.

En transit, la modale s'affiche sans bouton [FIXER CAP] — navigation désactivée.

---

## 4. Les 8 Modules — accès et contenu

**Disponibilité :**
- `[Toujours]` — accessible en toutes circonstances
- `[Transit : inertie]` — accessible uniquement pendant la phase d'inertie du voyage

| # | Module | Accès | Disponibilité |
|---|---|---|---|
| 01 | **Carte** | Barre instruments | Toujours |
| 02 | **Collection** | Barre instruments | Toujours |
| 03 | **Laboratoire** | Barre instruments · Capsule signal (panel gauche) · Modale système | Toujours |
| 04 | **Journal de bord** | Barre instruments | Toujours |
| 05 | **Équation de Drake** | N= dans le header · Barre instruments | Toujours |
| 06 | **Population** | Panel droit · Barre instruments | Toujours |
| 07 | **Systèmes vaisseau** | Panel gauche · Barre instruments | Toujours |
| 08 | **Système social** | Barre instruments | Toujours |

### Contenu détaillé par module

| Module | Éléments UI clés | Actions disponibles |
|---|---|---|
| Carte | Graphe nœuds/arêtes · Couleur par ancienneté · Compteur traces formalisées par système · Stats totales | Clic nœud → modale système · Survol → infos visite |
| Collection | Grille des traces formalisées · Filtre système/date/fiabilité · Badge "nouvelles interprétations" | Clic → détail trace (données brutes + rapports + métadonnées) · Écriture/modification d'interprétation · Assignation classe |
| Laboratoire | File d'observations · Observation sélectionnée + données brutes + rapports · Grille instruments d'analyse | Ajouter observation · Lancer analyse · Ignorer · [Garder une trace] |
| Journal | Fil chronologique · Types : MANUEL / AUTO / GENERATIONNEL / DOCUMENT TROUVÉ · Mémoire générationnelle | Écriture entrée manuelle · Filtre par type · Lecture fragments Yael |
| Drake | 7 termes avec barres visuelles · Graphe historique N · Trace source des variations | Lecture seule. Clic sur variation → trace responsable |
| Population | Effectif + tendance · Barres volonté/cohésion/alim/soins · Statuts culturels · Historique événements | Lecture seule. Événements passés consultables |
| Systèmes | État par système · Niveaux He³/deutérium · Autonomie estimée · Alertes actives | Lecture seule. Historique pannes consultable |
| Système social | Courants actifs · Registre des Raisons · Événements en cours | Lecture seule |

---

### Détail — Module Laboratoire

> **Capteurs vs instruments** : Les signaux sont *captés* par les capteurs à bord (récepteur radio, détecteur énergétique, détecteur gravitationnel). Le Laboratoire contient des *instruments d'analyse* qui travaillent sur les données capturées. Réf. `LACUNA_LABORATOIRE_INSTRUMENTS.md`.

Le Laboratoire est l'espace de travail scientifique du vaisseau. C'est un espace persistant — il conserve une file d'observations en attente que le joueur alimente au fil de son voyage. Il peut être ouvert à tout moment depuis la barre d'instruments.

#### Structure — trois colonnes

```
┌─────────────────┬──────────────────────────────┬─────────────────────┐
│  OBSERVATIONS   │  OBSERVATION SÉLECTIONNÉE    │  INSTRUMENTS        │
│                 │                              │                     │
│  [obs 1]        │  Nom de l'observation        │  [outil] [outil]    │
│  [obs 2]        │  Métadonnées                 │  terminé  en cours  │
│  [obs 3]        │                [Garder trace]│  [outil] [outil]    │
│  [obs 4]        │  ┌──────────────────────┐   │  grisé    grisé     │
│                 │  │ Données brutes        │   │  [outil] [outil]    │
│                 │  └──────────────────────┘   │  disponible         │
│                 │                              │                     │
│                 │  Rapport d'analyse           │                     │
│                 │  Nom de l'analyse  Fiab. 74% │                     │
│                 │  [texte du rapport]          │                     │
│                 │                              │                     │
│                 │  Rapport d'analyse           │                     │
│                 │  Nom de l'analyse  Fiab. 61% │                     │
│                 │  [texte du rapport]          │                     │
└─────────────────┴──────────────────────────────┴─────────────────────┘
```

---

#### Colonne gauche — File d'observations

Liste persistante des observations que le joueur a décidé de traiter. Elle s'alimente depuis l'Observatoire ("Ajouter au laboratoire"), depuis une notification ("Analyser"), ou depuis n'importe quel système déjà visité.

Chaque entrée dans la liste affiche :

| Champ | Contenu |
|-------|---------|
| Nom | Désignation automatique — ex. `HD44594-b · Atmosphère` |
| Type d'objet | Signal reçu / Corps planétaire / Corps mineur / Objet récupéré / Atmosphère / Étoile |
| Système d'origine | Étoile hôte |
| Date d'ajout | Date simulée au moment de l'ajout |
| État | En attente / Analyse en cours / Analysé |

La file ne se vide pas automatiquement. Le joueur décide quand retirer une observation — après formalisation, ou simplement parce qu'elle ne l'intéresse plus. Une observation peut rester des générations dans le labo sans être traitée.

---

#### Colonne centrale — Observation sélectionnée

##### En-tête

| Champ | Contenu |
|-------|---------|
| Nom | Désignation de l'observation |
| Système | Étoile hôte + distance au moment de la détection |
| Coordonnées galactiques | Position au moment de la détection |
| Date de détection | Date simulée |
| Niveau d'observation | Passif / Système / Orbite proche / Contact — au moment de la détection |
| État de l'instrument détecteur | Intégrité au moment de la détection |
| Bouton `[Garder une trace]` | Accessible dès qu'au moins un rapport d'analyse existe |

##### Données brutes

Bloc toujours présent — les données telles que détectées, sans traitement. Ce que le vaisseau a capté avant toute analyse. Exemples selon le type d'objet :

| Type d'objet | Données brutes typiques |
|---|---|
| Signal reçu | Fréquence, durée, polarisation, forme d'onde brute |
| Corps planétaire | Masse estimée, demi-grand axe, type orbital, albédo |
| Atmosphère | Pression estimée, température, spectre de réflexion grossier |
| Corps mineur | Trajectoire, vitesse, dimensions estimées |
| Objet récupéré | Dimensions, masse, température de surface |
| Étoile | Type spectral, luminosité, variations de courbe |

##### Rapports d'analyse

Chaque instrument lancé produit un rapport indépendant, ajouté à la liste dans l'ordre de complétion. Un rapport contient :

| Champ | Contenu |
|-------|---------|
| Instrument | Nom de l'instrument utilisé |
| **Fiabilité** | Score en % — qualité de la mesure selon distance, état de l'instrument, niveau d'observation. Ne dit rien sur la nature de l'anomalie. |
| Date d'analyse | Date simulée de complétion |
| Durée | Temps simulé consommé |
| Résultats | Données produites — texte factuel, sans interprétation |

La fiabilité reflète uniquement la qualité instrumentale de la mesure :
- Distance au corps au moment de l'analyse
- État de l'instrument (intégrité système)
- Niveau d'observation atteint (passif < orbite < contact)
- Conditions de détection (transit vs orbite stable)

Un rapport à 40% de fiabilité n'est pas inutile — mais ses données ont moins de poids, notamment pour le mécanisme Drake. Un joueur peut relancer la même analyse depuis une position plus proche pour obtenir un rapport de meilleure fiabilité sur la même observation.

---

#### Colonne droite — Instruments

Grille d'instruments disponibles sur le vaisseau. Chaque instrument est dans l'un de quatre états :

| État | Visuel | Signification |
|------|--------|---------------|
| **Disponible** | Nom seul, fond neutre | Peut être lancé sur l'observation sélectionnée |
| **Analyse en cours** | Nom + barre de progression cyan | Tournant en arrière-plan — arrivée progressive des données |
| **Terminé** | Nom + indicateur vert | Rapport disponible dans la colonne centrale |
| **Grisé** | Nom + condition manquante | Niveau d'observation insuffisant pour l'observation sélectionnée |

Le joueur lance une analyse par un simple clic sur un instrument disponible. Pas de drag & drop — le contexte (observation sélectionnée + instrument cliqué) suffit à définir la combinaison.

Plusieurs instruments peuvent tourner simultanément sur la même observation. Les rapports arrivent dans leur ordre de complétion — les instruments rapides (analyseur spectral, analyseur de structure temporelle, magnétomètre) terminent avant les instruments lents (analyseur d'échantillon, analyseur orbital).

La disponibilité des instruments dépend du niveau d'observation actuel du vaisseau par rapport à l'observation sélectionnée — pas de l'état général du vaisseau. Un instrument de contact est grisé si l'objet n'a pas été physiquement atteint, même si l'instrument est en parfait état.

---

#### Formalisation — "Garder une trace"

Le bouton `[Garder une trace]` devient actif dès qu'au moins un rapport d'analyse existe pour l'observation. Le joueur n'est pas obligé d'attendre tous les instruments.

```
[GARDER UNE TRACE]
  ↓
Nom de la trace     : [désignation automatique modifiable — ex. HD44594-021]
Système             : [prérempli]
Date simulée        : [préremplie]
Support             : [type d'objet — prérempli]
Instruments usés    : [listés automatiquement avec leurs fiabilités]
Fiabilité moyenne   : [calculée — pondérée par instrument]
Rapports conservés  : [sélection parmi les rapports — tout par défaut]
Interprétation      : [champ libre — optionnel]
Classe              : [naturel_connu / naturel_inconnu / biologique /
                       intentionnel / artificiel — optionnel]
  ↓
[CONFIRMER] → entrée créée dans la Collection
```

La fiabilité moyenne de la trace est calculée à partir des rapports conservés. Elle est visible dans la Collection et entre dans le mécanisme de pondération Drake — une convergence d'interprétations à haute fiabilité pèse plus qu'une convergence à faible fiabilité.

---

### Détail — Module Collection

La Collection contient uniquement les traces que le joueur a formalisées. Elle n'est jamais peuplée automatiquement par le système.

**Contenu au départ du jeu** : un ensemble de traces pré-chargées issues des archives terrestres — signaux historiques, objets catalogués avant le départ (WOW!, Oumuamua, Ross 128…). Ces traces sont déjà analysées, déjà nommées, mais leur interprétation reste ouverte. Elles servent de référence et de point de comparaison pour tout ce qui suit. Elles sont distinguées visuellement des traces collectées en voyage (badge `ARCHIVE`).

**En voyage** : chaque nouvelle trace est formalisée par le joueur depuis le Laboratoire. Le badge "nouvelles interprétations" signale uniquement les traces que d'autres joueurs ont commentées — pas des anomalies non analysées.

---

### Détail — Module Journal de bord

Le Journal contient quatre types d'entrées, distingués visuellement :

| Type | Origine | Description |
|---|---|---|
| `MANUEL` | Joueur | Entrée écrite librement. Peut être liée à un système ou une trace. |
| `AUTO` | Système | Événement de jeu automatique — arrivée, départ, panne, seuil Drake. |
| `GENERATIONNEL` | Système | Passage de génération, mythification d'une entrée ancienne, événement civilisationnel. |
| `DOCUMENT TROUVÉ` | Exploration | Fragment narratif découvert dans un système — entrée de Yael ou autre document non-joueur. Jamais créé par le joueur. |

Les fragments de Yael apparaissent comme `DOCUMENT TROUVÉ` avec l'indication du système de découverte et la génération de voyage au moment de la trouvaille. Ils ne sont pas des traces — ils ne figurent pas dans la Collection. Ils sont lus, pas analysés.

---

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
- Journal · Collection · Drake accessibles
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
- Journal · Collection · Drake accessibles
- Observatoire désactivé
- Déviation non disponible

### ARRIVED — Vient d'arriver

Scan passif automatique en cours. Interface en mode découverte.

- Scan passif lancé automatiquement (instruments passifs uniquement)
- Notification ARRIVÉE affichée
- Observatoire ouvert automatiquement — affiche les probabilités d'anomalie par corps
- Si probabilité > seuil : bouton [Analyser] mis en avant dans l'Observatoire
- Aucune trace créée automatiquement
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
| Journal de bord | ✓ | ✓ | ✓ | ✓ |
| Collection traces | ✓ | ✓ | ✓ | ✓ |
| Équation de Drake | ✓ | ✓ | ✓ | ✓ |
| Population | ✓ | ✓ | ✓ | ✓ |
| Systèmes vaisseau | ✓ | ✓ | ✓ | ✓ |
| Carte | ✓ | ✓ | ✓ | ✓ |
| Observatoire (actif) | ✓ | — | Passif | — |
| Laboratoire | ✓ | — | ✓ | — |
| Navigation / Déviation | ✓ | — | ✓ | — |

---

## 5. Flux principal — parcours joueur type

```
01 Observer le ciel
   Hover étoiles. Probabilités d'anomalie repérables visuellement (pulse ambré).
        ↓
02 Sélectionner
   Clic → widget voyage. Double-clic → Observatoire complet.
        ↓
03 Fixer cap
   Confirmation dans le widget. Le voyage commence.
        ↓
04 Voyage
   Temps réel. Journal, Collection, notifications en chemin.
   Déviation possible en phase d'inertie.
   Notification possible en transit : "Probabilité d'anomalie X% — [Analyser]"
        ↓
05 Arrivée
   Scan passif automatique. Observatoire s'ouvre.
   Probabilités d'anomalie affichées par corps — sans interprétation.
        ↓
06 Analyser (volontaire)
   L'Observatoire signale une probabilité sur un corps.
   Le joueur clique [Analyser] → Laboratoire s'ouvre.
   Il charge les instruments (suggestion vaisseau + drag & drop libre).
   Les analyses tournent — délai variable par instrument.
   Les données s'accumulent. Le joueur interprète.
        ↓
07 Formaliser (volontaire)
   Si le joueur considère l'anomalie confirmée :
   [FORMALISER EN TRACE] → nom + données + interprétation optionnelle.
   La trace entre dans la Collection.
   Sans cette action, l'anomalie n'existe nulle part.
        ↓
08 Décider
   Repartir / approfondir (instruments actifs ou contact) /
   déposer une trace joueur dans le système / suivre une piste.
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
Probabilité d'anomalie : 61%
Déviation possible — coût carburant : 9%
[ANALYSER]
```

```
SCAN — 2341-05-22 — HD 40307
Probabilité d'anomalie : 78%
6 planètes confirmées. Perturbation orbitale détectée.
[ANALYSER]
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
│ Observé il y a 11 ans           │
│ Probabilité d'anomalie : 61%    │
│                                 │
│ [OUVRIR OBSERVATOIRE] [FIXER CAP →] │
└─────────────────────────────────┘
```

### Source des données

| Champ | Source |
|---|---|
| Distance | Calculée depuis position actuelle |
| Durée estimée | Compression non-linéaire (fonction puissance) |
| Carburant | Tsiolkovsky · état propulsion · masse actuelle |
| Type spectral | Observation depuis position (peut être décalé dans le temps) |
| Observé il y a | Distance en al = délai en années |
| Anomalie | Visible depuis position actuelle (niv. 1–2 max à distance) |

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
| 02 | Les trois questions | Texte narratif — 3 questions sans réponse |
| 03 | Le pari | Décision collective — population initiale affichée (15 000) |
| 04 | Le départ | Texte court — ce qui a été laissé derrière |
| 05 | Le premier choix | Le ciel s'ouvre — 12 anomalies visibles — aucune instruction |

L'écran 05 est la transition vers le jeu. Il n'y a pas de bouton "commencer". Le joueur est déjà dedans.

---

## 10. Système social — points de contact UI

> Principes du système social (anonymat, traces, profils émergents) → `LACUNA_GDD.md` §5

Ce qui est spécifique à l'interface :

### Points de contact dans l'interface

| Élément UI | Données joueurs visibles | Format |
|---|---|---|
| Collection → trace détail | Interprétations anonymes. Génération du vaisseau d'origine. Niveau de confiance. Texte libre. | Fil vertical, par date simulée de dépôt |
| Carte → nœud système | Nombre de vaisseaux ayant visité ce système. Pas de noms. | Badge numérique discret sur le nœud |
| Ciel — étoile visitée par d'autres | Légère variation de l'anneau cyan si d'autres vaisseaux y sont allés | Visuel subtil — pas de chiffre affiché dans le ciel |
| Notification TRA-003 | Extrait d'une nouvelle interprétation sur une trace connue | Famille Traces (cyan) — bas-droite |
| Notification GAL-004 | Signal de balisage : vaisseau passé récemment dans la destination en cours | Famille Voyage (amber) — en transit |

> **Règle d'anonymat —** Aucune interprétation n'est signée. Elle est datée par la génération de voyage du vaisseau d'origine ("Génération 7 — vaisseau inconnu"). Jamais de pseudo, jamais d'identifiant.

---

## Changelog (depuis v0.7)

| Date | Modifications |
|------|---------------|
| 2026-10-22 | Écran 03 de l'onboarding : population initiale 15 000 (alignée sur `LACUNA_GDD.md` v0.5 et `LACUNA_LORE.md` v0.4). Disponibilité des modules pendant le transit : `LACUNA_TRANSIT.md` §5 fait référence |
| 2026-10-23 | §2 : le « pulse de bord » devient le halo de signal — violet, sur toute l'application, orienté selon la direction de vue, déclenché au début d'un signal (y compris chaque impulsion d'un signal lent), uniforme pour un signal sans direction ; règles d'accessibilité. Non implémenté |
| 2026-10-23 | §2 : halo de signal implémenté (`SignalHalo.vue`) ; les impulsions du Radar sont calées sur l'horloge murale pour tomber en même temps que le halo |
| 2026-10-23 | §2 : le halo s'allume aussi, orienté vers l'étoile, à la sortie du choc d'une supernova |
| 2026-10-23 | §2 : tuile Neutrinos, moniteur en direct du détecteur |

---

*LACUNA — Interface v0.7 — Mars 2026 (mise à jour octobre 2026) — Confidentiel — Antigravity*
