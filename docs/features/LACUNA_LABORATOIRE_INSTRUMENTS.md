*Dernière modification : 2026-10-23*

# LACUNA — Instruments du Laboratoire
*Version 0.5 — Octobre 2026*

> Référence croisée des outils d'analyse du Laboratoire avec les types d'objets, les familles d'anomalies et leur ancrage scientifique.  
> Documents sources : `LACUNA_TRACES.md` §1, `LACUNA_UI.md` §3.

## Avancement implémentation des instruments

| Instrument | Sortie prévue (§5) | Implémentation | Notes |
|------------|--------------------|----------------|-------|
| **Analyseur spectral** | Spectrogramme (fréquence × temps) | ✅ Complète | `LabReportSpectrogram.vue`, spectrogram-js, viridis |
| **Analyseur structure temporelle** | Forme d'onde + autocorrélation | ✅ Complète | `LabReportStructureTemporelle.vue`, D3, modulation pulsée optionnelle |
| **Analyseur polarisation** | Diagramme Stokes / ellipse | ✅ Complète | `LabReportPolarisation.vue`, ellipse + I/Q/U/V |
| **Analyseur spectre énergétique** | Spectre énergétique | ✅ Complète | `LabReportSpectreEnergetique.vue`, D3, énergie keV × comptage |
| **Analyseur gravimétrique** | Modèle sources + résidus | ✅ Complète | `LabReportGravimetrique.vue`, D3, schéma sources + courbe résidus |
| **Spectromètre stellaire** | Spectre + courbe luminosité | ✅ Complète | `LabReportSpectreStellaire.vue`, spectreStellaireData.js, D3 |
| **Analyseur orbital** | Diagramme orbital + paramètres | ✅ Complète | `LabReportOrbital.vue`, orbitalData.js, D3, orbites (a, e, i, P), résonances |
| **Spectromètre atmosphérique** | Profil moléculaire | ✅ Complète | `LabReportAtmosphere.vue`, atmosphereData.js, D3, barres H₂O/CO₂/CH₄/O₂… |
| **Analyseur volumétrique** | Cartes densité 3D | ✅ Complète | `LabReportVolumetrique.vue`, volumetricData.js, D3, heatmap + coupe |
| **Scanner morphologique** | Modèle surface / heatmap | ✅ Complète | `LabReportMorpho.vue`, morphoData.js, D3, silhouette + carte thermique |
| **Magnétomètre** | Champ magnétique | ✅ Complète | `LabReportMagneto.vue`, magnetoData.js, D3, carte champ + profil |
| **Analyseur de neutrinos** | Chronologie des événements + spectre en énergie + cône de direction | ✅ Complète | `LabReportNeutrinos.vue`, neutrinoData.js, D3 ; mesures lues dans `observations.attributes` |
| **Spectromètre de contact** | Spectre éléments | ⏳ Texte | — |
| **Analyseur d'échantillon** | Molécules / datation | ⏳ Texte | — |

*Légende : ✅ Complète = sortie visuelle conforme à la spec ; ⏳ Texte = rapport texte uniquement.*

---

## Table des matières

- [Avancement implémentation des instruments](#avancement-implémentation-des-instruments)
1. [Vue d'ensemble](#1-vue-densemble)
2. [Capteurs vs instruments — distinction fondamentale](#2-capteurs-vs-instruments--distinction-fondamentale)
3. [Capteurs (à bord)](#3-capteurs-à-bord)
4. [Instruments du laboratoire](#4-instruments-du-laboratoire)
5. [Formats de sortie — visualisations interprétables](#5-formats-de-sortie--visualisations-interprétables)
6. [Niveaux d'observation](#6-niveaux-dobservation)
7. [Matrice instrument × type d'objet](#7-matrice-instrument--type-dobjet)
8. [Matrice instrument × famille d'anomalie](#8-matrice-instrument--famille-danomalie)
9. [Objets narratifs spéciaux](#9-objets-narratifs-spéciaux)
10. [Références scientifiques](#10-références-scientifiques)
11. [Données nécessaires par instrument — correspondance base](#11-données-nécessaires-par-instrument--correspondance-base)

---

## 1. Vue d'ensemble

Le vaisseau dispose de **capteurs** qui enregistrent les signaux qui l'atteignent, et le Laboratoire dispose d'**instruments** qui analysent les données capturées. Cette distinction est essentielle : un capteur détecte, un instrument analyse.

### Principes

- **Une trace** = écart entre modèle attendu et données observées
- **Un capteur** = équipement à bord qui *capte* un signal (radio, gamma, gravitationnel) — il enregistre des données brutes
- **Un instrument** = outil du Laboratoire qui *analyse* les données déjà capturées — il produit un rapport structuré
- **Compatibilité** = l'instrument doit être adapté au support physique de l'observation ET au niveau atteint

---

## 2. Capteurs vs instruments — distinction fondamentale

```
SIGNAL ARRIVE                    LABORATOIRE
     │                                │
     ▼                                ▼
┌─────────────┐              ┌─────────────────┐
│  CAPTEUR    │  ──────────► │   INSTRUMENT    │
│  (à bord)   │  données     │   (analyse)     │
│             │  brutes      │                 │
└─────────────┘              └─────────────────┘
     │                                │
     │ Enregistre                     │ Produit un
     │ fréquence, durée,              │ rapport structuré :
     │ polarisation brute...          │ spectre détaillé,
     │                                │ structure temporelle,
     │                                │ modélisation...
```

| Rôle | Où | Exemple |
|------|-----|---------|
| **Capteur** | Vaisseau — toujours actif ou sur demande | Récepteur radio *capte* un signal à 1420 MHz |
| **Instrument** | Laboratoire — lancé sur une observation | Analyseur spectral *analyse* les données capturées (FFT, raies, patterns) |

Un signal capté devient une **observation** dans la file du Laboratoire. Le joueur y lance des **instruments d'analyse** pour approfondir les données — jamais le capteur lui-même.

---

## 3. Capteurs (à bord)

Les capteurs enregistrent les signaux qui atteignent le vaisseau. Ils produisent les **données brutes** affichées dans l'observation (fréquence, durée, polarisation, etc.). Ils ne figurent **pas** dans la grille d'instruments du Laboratoire.

### 3.1 Récepteur radio (capteur)

| Attribut | Valeur |
|----------|--------|
| **Rôle** | Capture les ondes électromagnétiques (radio, micro-ondes) |
| **Données capturées** | Fréquence centrale, durée, polarisation brute, forme d'onde enregistrée |

**Ancrage scientifique** — La raie à 1420 MHz (21 cm) correspond au spin-flip de l'hydrogène neutre. Frank Drake l'a choisie pour le projet Ozma (1960). Le signal WOW! (1977) fut détecté à cette fréquence. Allen Telescope Array, FAST.

### 3.2 Détecteur d'événements énergétiques (capteur)

| Attribut | Valeur |
|----------|--------|
| **Rôle** | Capture sursauts gamma, émissions X, UV extrême |
| **Données capturées** | Durée, intensité brute, spectre énergétique grossier |

**Ancrage scientifique** — Fermi, Swift, Integral. GRB, pulsars, magnétars.

### 3.3 Détecteur gravitationnel (capteur)

| Attribut | Valeur |
|----------|--------|
| **Rôle** | Capture les variations du champ gravitationnel local |
| **Données capturées** | Perturbations mesurées, direction, amplitude brute |

**Ancrage scientifique** — LIGO/Virgo, vélocimétrie radiale, astrométrie Gaia.

### 3.4 Détecteur de neutrinos (capteur)

*Spécifié et implémenté en octobre 2026 : support `NEUTRINO` (migration `00062`), mesures d'une bouffée dans `signals.attributes.neutrino`. Aucune source ne produit encore de bouffée (la supernova SN-001 est à venir).*

| Attribut | Valeur |
|----------|--------|
| **Rôle** | Capture les neutrinos : bouffées de supernova, flux de pré-supernova |
| **Données capturées** | Horodatage de chaque événement, énergie déposée, direction approximative, taux de bruit de fond |
| **Support** | `NEUTRINO` (nouveau, à ajouter à `signal_support`) |

**Ancrage scientifique** — Super-Kamiokande (50 000 t d'eau ultrapure, détection par lumière Tcherenkov), KamLAND, IceCube. Le 23 février 1987, Kamiokande II, IMB et Baksan ont enregistré environ deux douzaines de neutrinos de SN 1987A, quelques heures avant la lumière : la seule détection de neutrinos de supernova à ce jour. À 10 kpc, Super-Kamiokande attend quelques milliers d'événements et localise la source à quelques degrés près.

**Dans le jeu** — Un détecteur de cette échelle est plausible à bord : le vaisseau ARCA pèse ~4 millions de tonnes. Le capteur ne voit rien dans le ciel : il compte des événements. Une bouffée n'a pas de contrepartie visible au moment où elle arrive.

---

## 4. Instruments du laboratoire

Les instruments du Laboratoire **analysent** les données déjà capturées. Ils produisent des **rapports** structurés (spectre détaillé, modélisation, etc.).

### Instruments pour signaux captés (données des capteurs)

#### 4.1 Analyseur spectral

| Attribut | Valeur |
|----------|--------|
| **Type d'observation** | Signal reçu (support EM radio) |
| **Source des données** | Données du récepteur radio |
| **Données produites** | Spectre détaillé (FFT), résolution fréquentielle, raies, bande passante effective |

**Ancrage scientifique** — En radioastronomie, la FFT transforme le signal temps → fréquences. Un signal "narrowband" (bande étroite) sur la raie de l'hydrogène pose une question différente d'un bruit large. Recherche de signaux artificiels vs émissions naturelles.

**Usage** — Analyse un signal radio capté. Répond : cette fréquence exacte, cette largeur de bande — est-ce cohérent avec un processus naturel ?

---

#### 4.2 Analyseur de structure temporelle

| Attribut | Valeur |
|----------|--------|
| **Type d'observation** | Signal reçu (tous supports : EM, gamma/X, gravitationnel) |
| **Source des données** | Données du capteur concerné |
| **Données produites** | Périodicité, patterns, modulation, structure non aléatoire, entropy |

**Ancrage scientifique** — Recherche de répétitions, de séquences. Un signal ponctuel de 72 secondes (WOW!) vs une émission pulsée régulière (pulsar) vs une modulation complexe — la structure temporelle distingue les phénomènes.

**Usage** — Analyse tout signal capté. Répond : y a-t-il une structure dans le temps ? Périodique ? Modulée ?

---

#### 4.3 Analyseur de polarisation

| Attribut | Valeur |
|----------|--------|
| **Type d'observation** | Signal reçu (support EM uniquement) |
| **Source des données** | Données du récepteur radio |
| **Données produites** | État de polarisation complet (linéaire, circulaire, elliptique), angle, degré de polarisation |

**Ancrage scientifique** — L'antenne Big Ear (WOW!) ne mesurait pas la polarisation — elle reste inconnue. Une polarisation contrôlée peut distinguer une émission artificielle d'une source naturelle. SETI cherche des signaux avec polarisation caractéristique.

**Usage** — Analyse un signal EM capté. Répond : la polarisation est-elle cohérente avec une source astrophysique connue ?

---

#### 4.4 Analyseur de spectre énergétique

| Attribut | Valeur |
|----------|--------|
| **Type d'observation** | Signal reçu (support gamma/X) |
| **Source des données** | Données du détecteur d'événements énergétiques |
| **Données produites** | Spectre énergétique détaillé, pics, distribution, comparaison aux modèles GRB/pulsar |

**Ancrage scientifique** — Les GRB ont des spectres caractéristiques. Une émission X/gamma avec un spectre atypique — pics énergétiques inhabituels, distribution différente — pose question.

**Usage** — Analyse un signal gamma/X capté. Répond : ce spectre correspond-il à un phénomène astrophysique connu ?

---

#### 4.5 Analyseur gravimétrique

| Attribut | Valeur |
|----------|--------|
| **Type d'observation** | Signal reçu (support gravitationnel) OU données orbitales |
| **Source des données** | Détecteur gravitationnel ou analyseur orbital |
| **Données produites** | Modélisation des sources, masse déduite, position estimée, corps non visibles, perturbations résiduelles |

**Ancrage scientifique** — À partir des perturbations mesurées, on infère masse et position. Neptune prédite par Leverrier. Un corps dont la masse est incompatible avec le volume observable (trop dense) ou une perturbation sans source identifiée = anomalie.

**Usage** — Analyse une perturbation gravitationnelle ou des données orbitales. Répond : quelle est la source ? La masse est-elle cohérente ?

---

#### 4.14 Analyseur de neutrinos

*Implémenté en octobre 2026. Numéroté 4.14 pour ne pas décaler les références existantes.*

| Attribut | Valeur |
|----------|--------|
| **Type d'observation** | Signal reçu (support neutrinos) |
| **Source des données** | Données du détecteur de neutrinos |
| **Données produites** | Chronologie des événements (taux en fonction du temps), spectre en énergie (MeV), cône de direction reconstruit, nombre d'événements au-dessus du bruit de fond |

**Ancrage scientifique** — Pour SN 1987A, Kamiokande II a compté douze événements sur 12,4 s, d'énergies entre ~6 et ~35 MeV. La forme de la bouffée (montée rapide, décroissance sur une dizaine de secondes) et l'énergie moyenne (~10–15 MeV) sont la signature d'un effondrement de cœur. Une montée lente d'événements de basse énergie, des heures avant, est la signature attendue des neutrinos de pré-supernova.

**Usage** — Analyse une bouffée ou un flux de neutrinos. Répond : combien, quand, à quelle énergie, d'où approximativement ? Ne dit pas ce qui l'a produite : le joueur relie la direction à une étoile, ou attend de voir.

---

### Instruments pour observations actives (système, orbite, contact)

#### 4.6 Spectromètre stellaire

| Attribut | Valeur |
|----------|--------|
| **Niveau requis** | Observation lointaine |
| **Domaine** | Lumière visible et proche IR de l'étoile |
| **Données produites** | Type spectral, courbe de luminosité, variations, émissions anormales |

**Ancrage scientifique** — Classification MK (OBAFGKM), courbes de lumière Kepler/TESS. Étoile de Tabby (KIC 8462852) : baisses apériodiques ~22 %. Spectres = métallicité, âge, activité.

**Usage** — Étoile, disque circumstellaire. Variation de luminosité inexpliquée.

---

#### 4.7 Analyseur orbital

| Attribut | Valeur |
|----------|--------|
| **Niveau requis** | Observation système |
| **Domaine** | Dynamique du système planétaire |
| **Données produites** | Demi-grand axe, excentricité, inclinaison, résonances, anomalies de trajectoire |

**Ancrage scientifique** — Lois de Kepler, méthodes des transits et vélocimétrie radiale. Oumuamua a montré une accélération non-gravitationnelle — dégazage ou voile solaire ? Les résonances orbitales (Gliese 667C, 1:2:4) peuvent être trop parfaites pour être naturelles selon certains modèles.

**Usage** — Trajectoire impossible, résonance suspecte, accélération sans source, absence de corps prédit.

---

#### 4.8 Spectromètre atmosphérique

| Attribut | Valeur |
|----------|--------|
| **Niveau requis** | Orbite proche |
| **Domaine** | Composition gazeuse d'une atmosphère planétaire |
| **Données produites** | Profil moléculaire, déséquilibres chimiques, albédo, température |

**Ancrage scientifique** — Spectroscopie de transmission (transit) et d'émission. JWST détecte H₂O, CO₂, CH₄, SO₂ dans les atmosphères exoplanétaires. Un déséquilibre chimique (O₂ + CH₄ simultanés) serait une biosignature potentielle — sur Terre, l'un oxyde l'autre sans renouvellement biologique.

**Usage** — Atmosphère, corps planétaire. Molécules impossibles, ratios anormaux, signature de vie possible.

---

#### 4.9 Analyseur volumétrique

| Attribut | Valeur |
|----------|--------|
| **Niveau requis** | Orbite proche |
| **Domaine** | Distribution spatiale 3D d'un phénomène |
| **Données produites** | Cartes de densité, localisation d'anomalies, gradients, tomographie |

**Ancrage scientifique** — Tomographie sismique, cartographie radar (Magellan/Vénus). Permet de localiser des structures internes ou des distributions non homogènes — une concentration anormale dans un disque de débris, une asymétrie de surface.

**Usage** — Corps planétaire, disque de débris, objet. Distribution inattendue, zone de déplétion ou de surconcentration.

---

#### 4.10 Scanner morphologique

| Attribut | Valeur |
|----------|--------|
| **Niveau requis** | Orbite proche → Contact |
| **Domaine** | Forme, surface, structure géométrique |
| **Données produites** | Modèle de surface, carte thermique, géométrie, symétries |

**Ancrage scientifique** — Oumuamua : forme allongée (rapport 1:10) déduite des variations de luminosité. Hayabusa2 et OSIRIS-REx ont imagé Ryugu et Bennu. Une géométrie non naturelle (faces planes, symétries régulières) suggère fabrication.

**Usage** — Objet en orbite, surface planétaire, objet récupéré. Forme impossible pour un processus naturel.

---

#### 4.11 Magnétomètre

| Attribut | Valeur |
|----------|--------|
| **Niveau requis** | Orbite proche |
| **Domaine** | Champ magnétique d'un corps |
| **Données produites** | Intensité, orientation, anomalies sous-surfaciques |

**Ancrage scientifique** — Le champ magnétique terrestre protège la vie du vent solaire. Mars n'en a plus — son atmosphère a été érodée. La détection d'un champ sur une planète en zone habitable est une donnée clé. Des anomalies localisées peuvent révéler des structures internes ou des matériaux atypiques.

**Usage** — Corps planétaire, lune. Champ absent quand attendu, ou structure anormale.

---

#### 4.12 Spectromètre de contact

| Attribut | Valeur |
|----------|--------|
| **Niveau requis** | Contact |
| **Domaine** | Composition de surface (éléments) |
| **Données produites** | Éléments, ratios isotopiques, minéralogie, âge estimé |

**Ancrage scientifique** — Spectroscopie XRF, Raman, LIBS (Curiosity, Perseverance). Les ratios isotopiques (ex. fer-60) trahissent l'histoire du système — supernova voisine, âge de formation. Une datation incompatible avec le contexte orbital pose question.

**Usage** — Objet récupéré, surface en contact. Matériaux impossibles, âge incohérent.

---

#### 4.13 Analyseur d'échantillon

| Attribut | Valeur |
|----------|--------|
| **Niveau requis** | Contact |
| **Domaine** | Composition moléculaire fine |
| **Données produites** | Molécules complexes, structures organiques, datation radiométrique |

**Ancrage scientifique** — Hayabusa2 et OSIRIS-REx ont confirmé en 2023 la présence des 5 nucléobases de l'ARN (adénine, guanine, cytosine, thymine, uracile) dans des astéroïdes carbonés non contaminés. La chimie prébiotique semble universelle. Une concentration anormalement élevée ou une molécule chirale homogène serait une biosignature.

**Usage** — Échantillon, objet récupéré. Molécules organiques, structures suggérant une origine biologique ou artificielle.

---

## 5. Formats de sortie — visualisations interprétables

> **Principe** : Les instruments produisent des **visualisations de données**, pas des conclusions. Le joueur observe, compare, déduit des patterns. Le jeu n'interprète jamais — il affiche ce que l'instrument a mesuré. L'ambiguïté est jouable parce que la même image peut être lue différemment.

Chaque instrument renvoie un format de sortie spécifique. L'interface doit rendre ces données **visuellement interprétables** : le joueur doit pouvoir reconnaître une raie, une périodicité, une asymétrie — et en tirer ses propres conclusions.

### Instruments pour signaux

| Instrument | Format de sortie | Représentation | Ce que le joueur peut déduire |
|------------|------------------|----------------|-------------------------------|
| **Analyseur spectral** | Spectrogramme | Fréquence (axe X) × temps (axe Y), intensité en couleur/niveau de gris | Bande étroite vs large, raie à une fréquence précise (ex. 1420 MHz), stabilité ou drift |
| **Analyseur structure temporelle** | Forme d'onde + autocorrélation | Amplitude × temps ; pic de corrélation pour périodicité | Pulsation régulière, modulation, répétitions, structure vs bruit |
| **Analyseur de polarisation** | Diagramme de Stokes / ellipse de polarisation | Représentation 2D (angle, ellipticité) ou paramètres I/Q/U/V | Linéaire, circulaire, elliptique ; degré de polarisation ; cohérence avec source astrophysique |
| **Analyseur spectre énergétique** | Spectre énergétique | Énergie (keV/MeV) × comptage ; courbe ou histogramme | Pics, coupure, forme caractéristique (GRB vs pulsar vs inconnu) |
| **Analyseur gravimétrique** | Modèle de sources + résidus | Carte ou schéma des masses déduites ; courbe des perturbations résiduelles | Position de corps invisibles, masse incompatible, perturbation sans source identifiée |
| **Analyseur de neutrinos** | Chronologie + spectre en énergie + cône de direction | Histogramme des événements dans le temps ; histogramme en énergie (MeV) ; cône sur une projection du ciel | Bouffée brève vs montée lente ; énergie typique ; direction approximative à comparer au ciel |

### Instruments pour observations actives

| Instrument | Format de sortie | Représentation | Ce que le joueur peut déduire |
|------------|------------------|----------------|-------------------------------|
| **Spectromètre stellaire** | Spectre + courbe de lumière | Intensité × longueur d'onde ; luminosité × temps | Type spectral, raies d'absorption/émission, baisses apériodiques (Tabby), transit |
| **Analyseur orbital** | Diagramme orbital + paramètres | Vue plan/section des orbites ; tableau a, e, i, période | Résonances (1:2:4), excentricité anormale, corps manquant, accélération résiduelle |
| **Spectromètre atmosphérique** | Spectre de transmission/émission | Intensité × longueur d'onde ; barres ou courbes par molécule | H₂O, CO₂, CH₄, O₂ ; déséquilibre chimique (O₂+CH₄), biosignature possible |
| **Analyseur volumétrique** | Carte 2D/3D de densité | Carte en fausses couleurs, coupes, gradients | Zone de surconcentration, asymétrie, déplétion, structure interne |
| **Scanner morphologique** | Modèle 3D + carte thermique | Maillage ou rendu de surface ; carte température en couleurs | Forme allongée (Oumuamua), symétries, faces planes, gradient thermique anormal |
| **Magnétomètre** | Carte du champ + profils | Intensité × position ; lignes de champ ou vecteurs | Champ absent, anomalie locale, orientation atypique |
| **Spectromètre de contact** | Spectre de raies + tableau | Raies X/visibles par élément ; ratios isotopiques en tableau | Éléments anormaux, datation, matériaux impossibles |
| **Analyseur d'échantillon** | Spectre de masse / chromatogramme | Pics par masse molaire ; détection de molécules | Nucléobases, acides aminés, chiralité, concentration anormale |

### Règles de conception

1. **Pas de label interprétatif** — La visualisation ne dit jamais "Structure artificielle détectée" ou "Biosignature probable". Elle montre les données brutes.
2. **Comparabilité** — Le joueur doit pouvoir comparer deux rapports (même instrument, observations différentes) pour repérer des écarts.
3. **Fidélité au format** — Un spectrogramme ressemble à un spectrogramme ; une courbe de lumière à une courbe de lumière. Référence aux conventions scientifiques.
4. **Fiabilité visible** — Le bruit, la résolution, les artefacts peuvent varier selon la fiabilité du rapport. Un rapport à 40 % peut montrer des données plus bruitées qu'un rapport à 90 %.

---

## 6. Niveaux d'observation

| Niveau | Condition physique | Ce qui devient accessible |
|--------|-------------------|---------------------------|
| **Passif** | Signal atteint le vaisseau sans manœuvre | Capteurs enregistrent — observations "Signal reçu" |
| **Observation lointaine** | En transit — télescope pointé vers une étoile | Type spectral, courbe de luminosité, corps détectables |
| **Observation système** | Vaisseau en orbite du système stellaire | Orbitographie précise, résonances, anomalies de trajectoire |
| **Orbite proche** | Approche d'une planète, lune ou astéroïde | Atmosphère, surface, champ magnétique, distribution 3D |
| **Contact** | Atterrissage ou récupération d'objet | Composition fine, structure interne, datation, observation directe |

> **Note** : L'interface peut regrouper "Observation lointaine" et "Observation système" sous des libellés simplifiés.

---

## 7. Matrice instrument × type d'objet

Cette matrice indique si un instrument **peut produire des données pertinentes** sur un type d'objet donné. ✓ = adapté, △ = partiel, — = incompatible.

**Signal reçu** : le support du signal (EM radio, gamma/X, gravitationnel) détermine quels instruments s'appliquent.

| Instrument | Signal reçu | Étoile | Corps planétaire | Corps mineur | Atmosphère | Objet récupéré |
|------------|:-----------:|:------:|:----------------:|:------------:|:----------:|:--------------:|
| Analyseur spectral | ✓* | — | — | — | — | — |
| Analyseur structure temporelle | ✓ | — | — | — | — | — |
| Analyseur de polarisation | ✓* | — | — | — | — | — |
| Analyseur spectre énergétique | ✓** | — | — | — | — | — |
| Analyseur gravimétrique | ✓*** | △ | ✓ | ✓ | — | △ |
| Analyseur de neutrinos | ✓***** | — | — | — | — | — |
| Spectromètre stellaire | — | ✓ | △ | — | — | — |
| Analyseur orbital | — | △ | ✓ | ✓ | — | ✓**** |
| Spectromètre atmosphérique | — | — | ✓ | — | ✓ | — |
| Analyseur volumétrique | — | △ | ✓ | ✓ | — | ✓ |
| Scanner morphologique | — | — | ✓ | ✓ | — | ✓ |
| Magnétomètre | — | — | ✓ | ✓ | — | △ |
| Spectromètre de contact | — | — | — | — | — | ✓ |
| Analyseur d'échantillon | — | — | — | — | — | ✓ |

*\* Signal EM radio uniquement · \*\* Signal gamma/X uniquement · \*\*\* Signal gravitationnel ou données orbitales · \*\*\*\* Trajectoire avant capture · \*\*\*\*\* Signal neutrinos uniquement*

### Règles de compatibilité

1. **Signal reçu** — Les instruments d'analyse travaillent sur les données captées par les capteurs. Chaque support (EM radio, gamma/X, gravitationnel, neutrinos) a ses instruments dédiés. L'Analyseur de structure temporelle s'applique à tous.

2. **Étoile** — Spectromètre stellaire en priorité. Analyseur gravimétrique pour planètes non vues. Analyseur orbital pour le système.

3. **Corps planétaire / Atmosphère** — Instruments d'orbite proche et contact. L'atmosphère est un sous-ensemble du corps planétaire.

4. **Objet récupéré** — Contact obligatoire pour spectromètre de contact et analyseur d'échantillon. Scanner morphologique et analyseur volumétrique peuvent avoir été utilisés en orbite avant capture.

---

## 8. Matrice instrument × famille d'anomalie

Quelle famille d'anomalie chaque instrument peut-il révéler ?

| Famille | Instruments capables | Nature de l'écart détectable |
|---------|---------------------|------------------------------|
| **Électromagnétique** | Analyseur spectral, Analyseur polarisation, Analyseur spectre énergétique, Spectromètre stellaire | Fréquence inattendue, structure non aléatoire, polarisation atypique, intensité anormale |
| **Orbitale / cinétique** | Analyseur orbital | Trajectoire impossible, résonance trop parfaite, accélération sans source |
| **Chimique** | Spectromètre atmosphérique, Spectromètre de contact, Analyseur d'échantillon | Molécules impossibles, ratios isotopiques incohérents, abondances anormales |
| **Morphologique** | Scanner morphologique, Analyseur volumétrique | Géométrie non naturelle, symétries régulières, structure en couches délibérée |
| **Thermique** | Scanner morphologique, Spectromètre atmosphérique | Gradient incohérent, source de chaleur non identifiée |
| **Temporelle** | Analyseur structure temporelle, tous (comparaison revisites) | Structure temporelle atypique, changement entre deux observations |
| **Gravitationnelle** | Analyseur gravimétrique, Analyseur orbital | Masse incompatible, corps invisible, perturbation sans source |
| **Absence** | Analyseur orbital, Analyseur volumétrique, Spectromètre stellaire | Ce qui manque là où les modèles prédisent une présence |

### Croisement multi-instruments

| Difficulté trace | Combinaison typique |
|------------------|---------------------|
| 1 | Un instrument, signal fort (passif ou observation lointaine) |
| 2 | Un instrument attentif OU deux instruments (système ou orbite) |
| 3 | Deux à trois instruments croisés (orbite proche) |
| 4 | Combinaison complète, contact requis, ou croisement inter-systèmes |

---

## 9. Objets narratifs spéciaux

### PHYSICAL_ARTIFACT

Objet dont les anomalies morphologiques, chimiques et orbitales convergent vers une fabrication.

| Phase | Instruments |
|-------|-------------|
| Détection | Scanner morphologique (géométrie non naturelle) |
| Analyse | Spectromètre de contact (matériaux, datation) + Analyseur volumétrique (structure) |

### ARTEFACT_JOURNAL

Objet contenant une archive encodée (texte, séquences, enregistrements). Décodage via clé déduite de traces antérieures.

| Phase | Instruments |
|-------|-------------|
| Détection | Scanner morphologique + Analyseur d'échantillon (structure interne organisée) |
| Décodage | Clé calculée à partir de données du scénario — hors laboratoire |

---

## 10. Références scientifiques

| Domaine | Références |
|---------|------------|
| SETI / Radio | Projet Ozma (1960), signal WOW! (1420,4556 MHz), Allen Telescope Array, FAST |
| Exoplanètes | Kepler, TESS, JWST — transits, spectroscopie de transmission |
| Atmosphères | JWST NIRSpec (WASP-39b : H₂O, CO₂, CO), biosignatures (O₂+CH₄) |
| Objets interstellaires | Oumuamua (forme allongée, accélération non-gravitationnelle) |
| Échantillons | Hayabusa2 (Ryugu), OSIRIS-REx (Bennu) — nucléobases, acides aminés |
| Étoile de Tabby | KIC 8462852 — baisses de luminosité apériodiques ~22 % |
| Gravitation | LIGO/Virgo, vélocimétrie radiale, astrométrie (Gaia) |
| Neutrinos | SN 1987A (Kamiokande II, IMB, Baksan, 1987), Super-Kamiokande, KamLAND — bouffées de supernova, neutrinos de pré-supernova |

---

## 11. Données nécessaires par instrument — correspondance base

Pour chaque instrument, ce qu'il consomme en entrée et si la base de données (observations, system_objects, stellar_systems) fournit ces données.

### Instruments pour signaux

| Instrument | Données nécessaires | Source | Présent en base |
|------------|---------------------|--------|-----------------|
| **Analyseur spectral** | Fréquence, durée, structure du signal (ponctuel, pulsé…), forme d'onde brute | observation (SIGNAL) | ✅ `support`, `duration_sec`, `structure` — forme d'onde simulée via seed |
| **Analyseur structure temporelle** | Durée, structure, support | observation | ✅ `duration_sec`, `structure`, `support` |
| **Analyseur polarisation** | Signal EM capté | observation | ✅ `support` (EM_RADIO) — polarisation déduite du seed |
| **Analyseur spectre énergétique** | Support gamma/X, structure (sursaut…), durée | observation | ✅ `support`, `structure`, `duration_sec` |
| **Analyseur gravimétrique** | Pour SIGNAL : durée, structure. Pour corps : masses, orbites | observation + system_objects | ✅ Signal : `duration_sec`, `structure`. Corps : `mass_earth`, `orbital_*` (system_objects) |
| **Analyseur de neutrinos** | Support neutrinos, nombre d'événements, durée, énergie moyenne, direction et son incertitude | observation (SIGNAL) + `attributes` | ✅ `support` = NEUTRINO ; `attributes.event_count`, `duration_s`, `mean_energy_mev`, `direction`, `uncertainty_deg` (valeurs par défaut calées sur SN 1987A) |

### Instruments pour observations actives

| Instrument | Données nécessaires | Source | Présent en base |
|------------|---------------------|--------|-----------------|
| **Spectromètre stellaire** | Type spectral de l'étoile, luminosité | stellar_systems, system_objects | ✅ `stellar_systems.spectral_type`, `stellar_systems.luminosity` |
| **Analyseur orbital** | a (UA), e, i, P (jours), designation, zone habitable | system_objects | ✅ `orbital_semi_major_axis_au`, `orbital_eccentricity`, `orbital_inclination_deg`, `orbital_period_days`, `designation`, `in_habitable_zone` |
| **Spectromètre atmosphérique** | Composition (H₂O, CO₂, CH₄, O₂…), pression | system_objects | ✅ `atmosphere_notes` (texte parseable), `atmosphere_pressure_bar`, `atmosphere_composition` (JSONB) |
| **Analyseur volumétrique** | Distribution 3D (tomographie) | — | ❌ Aucun champ dédié — données **synthétiques** (seed obsId+systemId) |
| **Scanner morphologique** | Forme, symétries, carte thermique | — | ❌ Pas de champ forme/aspect_ratio — données **synthétiques** |
| **Magnétomètre** | Intensité champ, orientation, anomalies | system_objects | △ `magnetic_field_detected` (bool) — intensité/orientation **synthétiques** |
| **Spectromètre de contact** | Éléments, ratios isotopiques, datation | — | ❌ Non implémenté — prévoir `attributes` JSONB ou table dédiée |
| **Analyseur d'échantillon** | Molécules, chiralité, datation | — | ❌ Non implémenté |

### Légende

- **✅** Données présentes et utilisées par l'instrument
- **△** Données partielles (ex. booléen) — le reste est synthétisé
- **❌** Données absentes — génération synthétique ou à implémenter

### Tables et champs utilisés

**observations** (file Laboratoire)  
`id`, `type`, `system_id`, `name`, `support`, `structure`, `duration_sec`, `anomalous`, `niveau`

**system_objects** (corps du système)  
`orbital_semi_major_axis_au`, `orbital_period_days`, `orbital_eccentricity`, `orbital_inclination_deg`, `mass_earth`, `designation`, `in_habitable_zone`, `atmosphere_notes`, `atmosphere_pressure_bar`, `atmosphere_composition`, `spectral_type`, `composition`, `has_rings`, `rings_*`, `magnetic_field_detected`, `surface_temperature_k`

**stellar_systems**  
`id`, `name`, `spectral_type`, `luminosity`, `distance`, `has_magnetic_field`

### Évolutions possibles

Pour enrichir les instruments avec des données réelles :

| Champ à ajouter | Table | Instruments concernés |
|-----------------|-------|------------------------|
| `aspect_ratio` ou `shape_type` | system_objects | Scanner morphologique |
| `magnetic_field_intensity_nt` | system_objects | Magnétomètre |
| `density_map` ou `tomography_data` | attributes JSONB | Analyseur volumétrique |
| `surface_composition` JSONB | system_objects / artefacts | Spectromètre de contact |
| `sample_analysis` JSONB | — | Analyseur d'échantillon |

---

## Annexe — Notes d'implémentation

### Stack de visualisation

| Lib | Usage |
|-----|-------|
| D3.js | Spectres, courbes, diagrammes orbitaux, polarisation, heatmaps |
| spectrogram-js | Spectrogrammes (Analyseur spectral) |
| Three.js | Modèles 3D, Scanner morphologique |

### Thématisation — typos et couleurs

Toutes les visualisations doivent être adaptées au design system LACUNA (`tokens.css`). Pas de couleurs par défaut des librairies.

| Élément | Token CSS |
|---------|-----------|
| Fond | `--color-bg` (#03060d) |
| Données, axes, courbes | `--color-cyan` (#00b4c8) |
| Anomalies, seuils | `--color-amber` (#e8a020) |
| Labels, texte | `--color-white`, `--color-muted` |
| Police axes/labels | `--font-mono` (Share Tech Mono) |
| Spectrogramme colormap | Remplacer jet/viridis par gradient cyan→amber compatible fond sombre |

**D3** : appliquer les couleurs via `d3.scaleSequential()`, `.style()`, `.attr('fill')` — contrôle total.  
**spectrogram-js** : colormap personnalisé (voir API) — éviter les colormaps par défaut (jet, viridis) non adaptées au fond #03060d.

### Autres notes

- **Capteurs** : Les capteurs ne figurent pas dans la grille du Laboratoire. Ils sont à bord ; leurs données alimentent les observations "Signal reçu".
- **Support du signal** : Une observation Signal reçu doit stocker son support (EM_RADIO, GAMMA_X, GRAVITATIONNEL, NEUTRINO) pour filtrer les instruments disponibles (voir matrice §7). Les neutrinos n'apparaissent pas sur le Radar, qui reste un récepteur électromagnétique.
- **Scanner morphologique** : Une implémentation peut distinguer "Scanner morphologique" (orbite) et "Scanner morphologique précis" (contact).
- **Observation lointaine** : Si l'interface utilise 4 niveaux, le Spectromètre stellaire doit être mappé au niveau permettant d'observer une étoile — pas "Passif".
- **Compatibilité** : Griser les instruments inadaptés au type d'observation ET au support (pour les signaux).
- **Formats de sortie** : Voir §5 pour les visualisations à implémenter par instrument. Priorité : rendre les données interprétables sans label conclusif.

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 0.3 | Mars 2026 | Capteurs vs instruments, 13 instruments, formats de sortie |
| 0.4 | Octobre 2026 | Ajout du détecteur de neutrinos (capteur, §3.4) et de l'analyseur de neutrinos (§4.14) — spécifiés pour la supernova SN-001 (`LACUNA_TRACES_IMMUABLES.md` §5), non implémentés |
| 0.5 | Octobre 2026 | Détecteur et analyseur de neutrinos implémentés (support `NEUTRINO`, `LabReportNeutrinos.vue`). Une bouffée n'a pas de direction sur le ciel : elle apparaît dans « Signaux sans direction » et donne un halo uniforme ; sa direction se lit au Laboratoire |

---

*LACUNA — Instruments du Laboratoire v0.5 — Octobre 2026 — Réf. LACUNA_TRACES, LACUNA_UI*
