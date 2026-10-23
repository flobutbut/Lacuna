*Dernière modification : 2026-10-23*

# LACUNA — Traces immuables
*Version 0.6 — Octobre 2026*

> Ce document contient les **fiches des traces immuables** qui n'appartiennent pas à un scénario — voisinage solaire, hors voisinage — et le **Journal de Yael** (origine `PRÉCURSEUR`). Les traces appartenant à un scénario ont leurs fiches de nœuds dans `LACUNA_SCENARIOS.md`. La mécanique (définition, chaîne de production, types d'outputs, qualification) vit dans `LACUNA_TRACES.md`. Les faits astronomiques de référence vivent dans `LACUNA_ANOMALIES_REELLES.md`.
>
> Dans chaque fiche, **Ancrage réel** décrit le monde réel ; **Ce que le joueur voit** et **Ce que les données disent** décrivent la galaxie du jeu, qui peut prolonger ou amplifier le réel. Tout écart volontaire entre les deux est signalé comme *valeur de jeu*.

*Confidentiel — Antigravity*

---

## Table des matières

1. [Format des fiches](#1-format-des-fiches)
2. [Traces immuables — Voisinage solaire](#2-traces-immuables--voisinage-solaire)
3. [Traces immuables — Hors voisinage](#3-traces-immuables--hors-voisinage)
4. [Traces précurseur — Le Journal de Yael](#4-traces-précurseur--le-journal-de-yael)
5. [Phénomènes de départ — propositions](#5-phénomènes-de-départ--propositions)

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 0.1 | Octobre 2026 | Document initial — fiches restaurées depuis `LACUNA_TRACES.md` v0.9 (§1.8, §1.9, §2 à §4), que la réécriture v1.0 annonçait déplacées vers `LACUNA_SCENARIOS.md` sans qu'elles y aient été reportées. Mises à jour factuelles : Barnard (quatre planètes confirmées en 2025), Epsilon Eridani b (confirmée en 2019), Proxima b (masse minimale 1,07 M⊕), Tau Ceti (candidates de 2017), Ross 128 (bande C), nucléobases (Bennu 2025, Ryugu 2026), Étoile de Tabby (~1 470 al), PSR B1919+21 (période 1,337 s), HD 40307 ; la résonance 1:2:4 de Gliese 667C est déclarée valeur de jeu. Le Journal de Yael relève de l'origine `PRÉCURSEUR` |
| 0.2 | Octobre 2026 | §4 : structure des entrées de Yael en base (origine `PRÉCURSEUR`, `precursor_generation`, `linked_trace_id`, `scenario_arc` pour le scénario effleuré) ; une entrée se découvre à l'arrivée dans son système. Aucune entrée écrite |
| 0.3 | Octobre 2026 | §5 ajouté : deux propositions de phénomènes visibles dès Sol pour donner de la matière au départ — une supernova lointaine (SN-001, ancrage SN 1987A) et un transitoire radio à longue période (LPT-001, ancrage GPM J1839−10). Non intégrées au jeu ; faits vérifiés le 23 octobre 2026 |
| 0.4 | Octobre 2026 | SN-001 : décisions prises (Bételgeuse, événement déclenché au départ de chaque partie), déroulé détaillé (neutrinos de pré-supernova, bouffée, sortie du choc, maximum), état du ciel après l'événement, question de l'horloge face à la compression du temps ; données neutrinos vérifiées |
| 0.5 | Octobre 2026 | SN-001 implémentée : déroulé en temps réel joueur (durées ci-dessous), T0 par partie, bouffée captée une fois, état du ciel calculé à partir de T0 (migration `00063`) |
| 0.6 | Octobre 2026 | SN-001 : T0 ramené à création + 3 minutes |

---

## 1. Format des fiches

### 1.1 Structure d'une fiche de trace

Chaque trace immuable est documentée avec :

- **Désignation** — identifiant unique
- **Système** — étoile hôte
- **Support** — l'objet physique sur lequel l'anomalie est détectée
- **Instruments requis** — ce qu'il faut utiliser pour détecter et analyser
- **Difficulté** — coût physique 1 à 4 (`LACUNA_TRACES.md` §7.1)
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

### 1.2 Format d'identifiant étendu

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

> **Note** : Certaines traces appartiennent à des scénarios qui relient plusieurs systèmes. Ces scénarios — leurs fiches de nœuds, leurs connexions et leurs questions ouvertes — sont documentés dans `LACUNA_SCENARIOS.md`. Les traces listées ici sont des entrées autonomes ; un même système peut porter les deux (Proxima Centauri porte PROXIMA-001 et le nœud PROXIMA-SCN02-001 du Fil des 75).

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
- Reproductions ultérieures : aucune en près de cinquante ans d'écoute

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
Proxima b est une exoplanète confirmée en zone habitable de Proxima Centauri. Masse minimale ~1,07 masse terrestre (Faria et al., 2022). Mais Proxima est une naine rouge très active — ses éruptions sont fréquentes et peuvent dépasser en énergie les plus fortes éruptions solaires. Le flux X et UV extrême reçu par Proxima b est de l'ordre de plusieurs dizaines de fois celui que reçoit la Terre. Les modèles actuels suggèrent que l'atmosphère de Proxima b aurait été érodée en quelques centaines de millions d'années. Pourtant — aucune observation directe n'a confirmé cette érosion.

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
En 1963, l'astronome Peter van de Kamp annonce avoir détecté une planète géante autour de l'étoile de Barnard par astrométrie — en mesurant les oscillations de l'étoile sur des décennies de plaques photographiques ; en 1969, il en propose deux. La découverte est saluée mondialement. En 1973, il est démontré que les oscillations correspondaient à des réajustements de l'optique du télescope. Les planètes de van de Kamp n'existaient pas. En 2018, une super-Terre à 233 jours est annoncée par vélocimétrie radiale ; elle est réfutée en 2021. En 2024 puis en mars 2025, quatre très petites planètes (0,19 à 0,34 masse terrestre, périodes de 2,3 à 6,7 jours) sont enfin confirmées (ESPRESSO, MAROON-X) — aucune en zone habitable, aucune à l'emplacement des détections passées.

**Ce que le joueur voit**
En entrant dans le système : quatre petites planètes, très proches de leur étoile. Dans les archives de données récupérées depuis les bases humaines : deux séries d'observations plus anciennes, séparées de 50 ans, qui annonçaient d'autres mondes à d'autres places. Une annotation automatique du système : *"Planètes annoncées : 3. Planètes trouvées à ces positions : 0."*

**Ce que les données disent**
- Étoile de Barnard : naine rouge M4, 5,96 al, l'étoile qui se déplace le plus vite dans le ciel
- Observation van de Kamp (1963) : oscillations astrométriques compatibles avec 2 planètes joviales
- Explication (1973) : artefact optique instrumental
- Observation 2018 : signal de vélocimétrie radiale compatible avec super-Terre à 233 jours — réfuté en 2021 (activité stellaire)
- Confirmé (2024–2025) : quatre planètes de 0,19 à 0,34 masse terrestre, périodes 2,34 / 3,15 / 4,12 / 6,74 jours ; zone habitable (~10–42 jours) vide de toute planète de plus de ~0,6 masse terrestre

**Ce que les données ne disent pas**
- Si la zone habitable abrite un monde plus petit que le seuil de détection
- Si les détections ratées successives sont une coïncidence ou le signe d'un phénomène perturbateur
- Pourquoi l'étoile la plus proche après le système Alpha/Proxima a été si longtemps la plus difficile à caractériser

**Pointe vers**
ROSS128-001 — un autre système où une détection a semblé évidente puis s'est dissipée.

**Interprétations canoniques**
- Erreurs de mesure indépendantes — les vraies planètes étaient simplement trop petites pour les instruments d'alors
- Perturbations orbitales rendant la détection instable
- Objet non planétaire perturbant les mesures de façon récurrente — nature inconnue

---

### ROSS128-001 — Le Signal de 2017
**Système :** Ross 128 (11 al)
**Type :** SIGNAL
**Difficulté :** 2

**Ancrage réel**
En mai 2017, le radiotélescope d'Arecibo capte des signaux radio inhabituels pendant l'observation de Ross 128 — une naine rouge calme, contrairement à Proxima. Les signaux présentent des caractéristiques semi-périodiques et des motifs ressemblant à une dispersion. Après analyse, le Planetary Habitability Laboratory (Université de Porto Rico à Arecibo) conclut que la source la plus probable est un ou plusieurs satellites géostationnaires dans le même champ du ciel ; certaines caractéristiques restent sans explication détaillée. Les signaux n'ont pas été retrouvés lors des observations suivantes.

**Ce que le joueur voit**
Spectre radio présentant des bursts semi-périodiques sur une bande étroite. Annotation : *"Détecté mai 2017 depuis système solaire — origine : débattue. Attribution satellite : probable mais non confirmée."* L'étoile elle-même est remarquablement calme pour une naine rouge — presque aucune éruption détectée.

**Ce que les données disent**
- Signal : bursts répétitifs en bande C (4–8 GHz, bande des satellites géostationnaires), détectés pendant ~10 minutes d'observation
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
Epsilon Eridani est une étoile jeune (~400–800 Ma) entourée d'un disque de débris structuré — des anneaux distincts avec des zones de déplétion entre eux. Ces structures suggèrent la présence de planètes qui "balaient" leurs orbites. Une seule planète est confirmée (2019) ; elle n'explique pas à elle seule toute la structure. C'est la première cible du projet Ozma en 1960 — Frank Drake l'a choisie parce qu'elle ressemble au Soleil jeune. Aucun signal n'a été détecté.

**Ce que le joueur voit**
À l'arrivée : un système spectaculaire — des anneaux concentriques de débris clairement visibles dans les données infrarouges. Les zones vides entre les anneaux sont trop nettes pour être produites par la seule gravité stellaire. Annotation automatique : *"Structures de déplétion — origines : débattues. Résonances orbitales probables."*

**Ce que les données disent**
- Ceinture interne : ~3 UA, analogue à la ceinture d'astéroïdes
- Seconde ceinture proposée : ~20 UA (débattue)
- Anneau externe : ~60–70 UA, analogue à la ceinture de Kuiper
- Asymétrie de l'anneau externe : densité plus élevée d'un côté — inexpliquée
- Étoile : K2V, ~400–800 Ma, 0,82 masse solaire
- Planète Epsilon Eridani b : proposée en 2000, confirmée en 2019 (vitesses radiales + astrométrie, Mawet et al.) — ~0,8 masse jovienne, ~3,5 UA, période ~7,4 ans

**Ce que les données ne disent pas**
- Ce qui crée les zones de déplétion que la seule planète confirmée n'explique pas
- Pourquoi l'anneau externe est asymétrique
- Si le système est trop jeune pour avoir développé une vie complexe ou au contraire idéal pour une vie primitive

**Pointe vers**
TAU-CETI-001 — un autre système avec un disque de débris structuré mais 5 fois plus dense.

**Interprétations canoniques**
- Planètes non encore détectées créant les résonances orbitales, en plus d'Epsilon Eridani b
- Système en phase de bombardement tardif — analogue au système solaire à 800 Ma
- Asymétrie de l'anneau : perturbation par un objet en transit (Oumuamua-like ?)
- Le silence radio de 1960 : absence de technologie détectable *à ce moment-là*

---

### TAU-CETI-001 — Le Bombardement
**Système :** Tau Ceti (11,9 al)
**Type :** ANOMALIE_CHIMIQUE
**Difficulté :** 2

**Ancrage réel**
Tau Ceti possède quatre planètes candidates non confirmées (Feng et al., 2017), dont deux aux bords de la zone habitable (Tau Ceti e et f). Son disque de débris est environ 10 fois plus massif que celui du système solaire. Le taux de bombardement météoritique est estimé 10 fois supérieur à ce que la Terre a connu. Les conditions de surface des planètes habitable sont potentiellement trop violentes pour permettre l'émergence d'une vie complexe. Pourtant — Tau Ceti est une étoile stable, de type G, presque identique au Soleil mais plus vieille (5,8 Ga).

**Ce que le joueur voit**
Deux planètes en zone habitable entourées d'un disque de débris dense — visuellement chaotique comparé à Epsilon Eridani. Analyses de composition du disque : ratios isotopiques présentant des anomalies dans les éléments du groupe du fer. Annotation : *"Taux de bombardement estimé : 10× système solaire. Origine disque de débris : non résolue."*

**Ce que les données disent**
- Tau Ceti e : ~3,9 masses terrestres (minimale), période ~163 jours, bord interne de la zone habitable
- Tau Ceti f : ~3,9 masses terrestres (minimale), période ~636 jours, bord externe de la zone habitable
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
Gliese 667 est un système stellaire triple. Les étoiles A et B sont un couple de naines orange (K3V + K5V). Gliese 667C est une naine rouge à ~230 UA du couple AB. Elle possède une planète confirmée en zone habitable, GJ 667Cc, considérée comme l'une des exoplanètes connues les plus semblables à la Terre ; plusieurs autres planètes proposées (jusqu'à six au total) restent débattues. La stabilité dynamique d'un système aussi serré a été étudiée et discutée (Anglada-Escudé et al., 2013 ; Feroz & Hobson, 2014).

*Valeur de jeu :* dans LACUNA, les trois planètes internes sont en résonance quasi parfaite 1:2:4, à la limite de la stabilité. Les données réelles ne montrent pas cette résonance.

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
Les échantillons rapportés intacts par OSIRIS-REx (Bennu, analyse publiée en janvier 2025) et Hayabusa2 (Ryugu, uracile en 2023, les cinq en mars 2026) contiennent les cinq nucléobases de l'ADN et de l'ARN — adénine, guanine, cytosine, thymine, uracile —, les « lettres » du code génétique terrestre. Leur présence dans des corps primitifs suggère que la chimie prébiotique est universelle. Elle est compatible avec une origine abiotique, antérieure à la formation des planètes (`LACUNA_ANOMALIES_REELLES.md` §5.1).

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
| TABBY-001 | Étoile de Tabby (KIC 8462852) | ~1 470 al | ANOMALIE_STELLAIRE | 2 | Baisses de luminosité apériodiques jusqu'à 22% |
| TABBY-002 | Étoile de Tabby | ~1 470 al | SEQUENCE | 3 | Pattern des baisses — structure non aléatoire débattue |
| OUMUAMUA-001 | Trajectoire interstellaire | Variable | OBJET | 2 | Accélération non-gravitationnelle, forme allongée |
| PSR-001 | PSR B1919+21 | ~2 280 al | SIGNAL | 3 | Premier pulsar découvert (1967) — surnommé LGM-1 (Little Green Men). Période 1,337 s (~0,75 Hz). *Modèle backend* : `system_object` PULSAR avec émission périodique. Voir Documentation-backend.md § Sources de signaux. Nœud d'entrée du Scénario 08 (`LACUNA_SCENARIOS.md` §11). |
| HD40307-001 | HD 40307 | 41,8 al | ANOMALIE_GEOMETRIQUE | 2 | Jusqu'à six planètes proposées, dont une super-Terre candidate (g) en zone habitable — débattue. Candidat d'ancrage du Scénario 03 |

---

## 4. Traces précurseur — Le Journal de Yael

Les entrées du journal de Yael sont des traces d'origine `PRÉCURSEUR` (`LACUNA_TRACES.md` §5), produites par un vaisseau humain non-joueur — Yael — parti de Sol avant le joueur. Elles sont **immuables et prédéfinies**, ancrées dans des systèmes spécifiques que Yael a traversés. Elles ne sont pas générées par le système de traces joueurs.

### Distinction fondamentale

| Propriété | Trace `JOUEUR` | Trace `PRÉCURSEUR` (journal de Yael) |
|-----------|-------------|---------|
| Auteur | Joueur humain | Yael — non-joueur |
| Contenu | Texte libre, annotation spontanée | Fragment de journal — voix, méthode, temps |
| Génération | Dynamique — produite pendant le jeu | Immuable — prédéfinie dans le monde |
| Distribution | Partout où un joueur est passé | Uniquement les systèmes visités par Yael |
| Datation | Génération de voyage du joueur | Génération de voyage de Yael |
| Confusion possible | Non — clairement marquée comme trace joueur | Oui — ressemble visuellement à une trace joueur |

### Ce que le joueur voit

Dans la Collection, une entrée de journal de Yael ressemble à une trace joueur ordinaire — même format, même présentation. La différence n'est perceptible qu'à la lecture : la voix est différente, la datation est ancienne, les références ne sont pas humaines dans leur échelle.

Cette confusion est intentionnelle dans les premières entrées. Le joueur peut ne pas réaliser immédiatement que Yael n'est pas un autre joueur.

### Structure d'une entrée du journal de Yael

```
Désignation   : [SYSTEME]-YAEL-[ORDRE]
Système       : système où l'entrée est déposée
Génération    : génération de voyage de Yael au moment de l'entrée
Contenu       : texte — registre terrain ou registre intérieur
Trace liée    : trace immuable du système (optionnel — Yael commente ce qu'il a trouvé)
Scénario lié  : scénario effleuré sans le nommer (optionnel)
```

### Densité et progression

Les entrées sont plus denses dans le voisinage solaire — là où Yael a passé le plus de temps, là où le joueur arrive en premier — dans la limite de 2 fragments dans la zone d'onboarding (`LACUNA_SCENARIOS.md` §4.6). Elles s'espacent dans la zone intermédiaire et deviennent rares dans la zone profonde. Le ton se transforme avec les générations.

*Implémentation : une entrée est une ligne de `traces` d'origine `PRÉCURSEUR`, rendue comme une trace joueur (désignation, texte, génération) ; elle devient lisible quand le vaisseau arrive dans son système. Aucune entrée n'est encore écrite.*

*Pour les fragments canoniques et la table de relation avec les scénarios — voir `LACUNA_SCENARIOS.md` §4 (Scénario 01 — Yael).*

---

---

## 5. Phénomènes de départ — propositions

*Statut : propositions de design, non intégrées au jeu. Les désignations sont provisoires.*

Au lancement de la partie, le vaisseau est à Sol et aucune trace de scénario n'est captable (les signaux du Fil des 75 ne se reçoivent qu'à l'arrivée). Ces deux phénomènes donnent de la matière au joueur dès les premières minutes, sans l'appeler vers une destination :

- la **supernova** est un spectacle et une leçon de lumière — ce que le joueur voit est déjà du passé ;
- le **signal à longue période** est un premier objet d'analyse — des données nettes, aucune conclusion.

La supernova n'est pas une trace au sens de `LACUNA_TRACES.md` §1 : elle ne s'écarte d'aucun modèle. Aucun des deux n'invite au voyage. Ils peuvent s'inscrire dans la séquence de démarrage (`LACUNA_LORE.md` §4).

---

### SN-001 — La supernova (proposition retenue)
**Système :** Bételgeuse (α Orionis), ~550 al — *valeur de jeu*
**Type :** ÉVÉNEMENT — neutrinos, puis lumière
**Difficulté :** 1 — passif, aucune manœuvre
**Statut :** implémentée le 23 octobre 2026 (migration `00063`, `src/lib/supernova.js`)

**Décisions**
- L'étoile est **Bételgeuse**.
- L'événement est **propre à chaque partie** : il se déclenche au départ du vaisseau.
- Cohérence avec la galaxie partagée : tous les vaisseaux partent à la même date du jeu (2187). L'explosion est donc un même événement fixe, que chaque joueur vit au début de sa partie. Après les premières heures, l'état du ciel est commun : Bételgeuse est une supernova, puis un rémanent, pour tout le monde.

**Ancrage réel**
Le 23 février 1987, trois détecteurs souterrains (Kamiokande II, IMB, Baksan) enregistrent environ deux douzaines de neutrinos. À Kamiokande II, douze événements s'étalent sur 12,4 s, d'énergies comprises entre ~6 et ~35 MeV (moyenne ~15 MeV). Environ trois heures plus tard, la supernova SN 1987A devient visible dans le Grand Nuage de Magellan, à ~168 000 al : c'est la seule supernova dont on ait détecté les neutrinos. Les neutrinos s'échappent du cœur effondré dès l'effondrement ; la lumière attend que l'onde de choc atteigne la surface de l'étoile (« sortie du choc »).
Bételgeuse est une supergéante rouge à ~550 al (168 pc, Joyce et al. 2020), d'un rayon d'environ 750 rayons solaires. Elle brûle encore de l'hélium en son cœur : les modèles ne prévoient pas son explosion avant environ 100 000 ans.
Ordres de grandeur pour une supernova galactique :
- à 10 kpc, Super-Kamiokande (50 000 t d'eau) attend ~2 000 à ~5 000 événements et localise la source à ~3–6° près ;
- à la distance de Bételgeuse, ~2 500 fois plus proche en flux, l'extrapolation donne de l'ordre de plusieurs millions d'événements (*extrapolation non vérifiée par une source*) ;
- pour Bételgeuse, des neutrinos de pré-supernova (combustion du silicium) seraient détectables avant l'effondrement : jusqu'à ~9 h avant selon une étude pour Super-Kamiokande avec gadolinium, jusqu'à ~1 jour selon une étude pour KamLAND (dépend de la masse de l'étoile et de la hiérarchie des masses des neutrinos).

*Valeur de jeu :* dans LACUNA, Bételgeuse a explosé il y a ~550 ans ; sa lumière et ses neutrinos atteignent Sol au moment du départ.

**Déroulé proposé**
1. *(Optionnel — approfondissement)* Quelques heures avant : le détecteur de neutrinos enregistre un taux d'événements de basse énergie qui monte lentement, au-dessus du bruit de fond. Direction mal définie.
2. **La bouffée** : des milliers à des millions d'événements en une dizaine de secondes, énergies de quelques MeV à quelques dizaines de MeV. Direction reconstruite à quelques degrés près — vers Orion. Rien de visible dans le ciel.
3. **La sortie du choc**, quelques heures plus tard : Bételgeuse s'éclaire brutalement, puis l'éclat monte sur plusieurs jours.
4. **Le maximum**, puis un déclin lent : l'étoile devient l'objet le plus brillant du ciel après Sol. *Les valeurs d'éclat et de durée disponibles viennent de la vulgarisation (maximum ~10 jours après la sortie du choc, éclat comparable à une demi-Lune) : à confirmer par une source avant d'être retenues.*

Le joueur fait lui-même le lien entre la bouffée et l'étoile : rien ne le lui dit.

**Déroulé implémenté — temps réel joueur**

T0 = création de la partie + 3 minutes (`ships.supernova_t0`, migration `00064` ; 10 minutes à l'origine, jugé trop long pour un joueur qui arrive). L'ordre réel des phases est conservé, les durées sont raccourcies pour tenir dans une première session :

| Phase | Début | Durée réelle | Réalité astrophysique | Rendu |
|---|---|---|---|---|
| Bouffée de neutrinos | T0 | 10 s | ~10 s | Signal « Neutrinos » sans direction, halo uniforme ; le ciel ne change pas |
| Silence | T0 → T0 + 20 min | 20 min | ~3 h pour SN 1987A | Le temps d'analyser la bouffée (direction : Orion) et de regarder Bételgeuse |
| Sortie du choc | T0 + 20 min | 2 min | quelques minutes | Éclair bref, puis palier |
| Montée | T0 + 22 min → T0 + 2 h | ~1 h 40 | ~10 jours | Jusqu'à l'objet le plus brillant du ciel |
| Déclin | T0 + 2 h → T0 + 7 jours | 7 jours | des mois | Baisse exponentielle |
| Rémanent | après T0 + 7 jours | permanent | — | Point faible |

- La pré-supernova (étape 1) n'est pas implémentée.
- La bouffée reste disponible 24 h ; elle n'est captée qu'une fois par partie (`ships.supernova_captured_at`), même si le joueur la supprime en l'analysant.
- L'éclat est exprimé sur l'échelle du rendu du ciel, pas en magnitude (aucune source fiable retenue).
- *Valeurs provisoires de la bouffée :* 5 000 000 événements (extrapolation non vérifiée), 15 MeV de moyenne et ~10 s (SN 1987A), direction à ±3°.
- *Écart relevé :* la base place Bételgeuse à 497,95 al (HYG, donnée sourcée, non modifiée) ; cette fiche retient ~550 al (Joyce et al. 2020).

**Ce que les données disent**
- Bouffée de neutrinos : une dizaine de secondes, énergies de l'ordre de 10 MeV, direction à quelques degrés près
- Délai neutrinos → lumière : quelques heures
- Spectre : celui d'une supernova à effondrement de cœur
- Distance : ~550 al — la lumière a voyagé ~550 ans

**Ce que les données ne disent pas**
- Rien d'anormal : c'est un phénomène naturel connu. Sa force est ailleurs — l'étoile n'existe plus depuis des siècles, et le joueur ne le sait que maintenant.

**Ce que le phénomène apprend sans le dire**
- L'observation est toujours du passé (`LACUNA_GDD.md` §2).
- L'échelle du voyage : d'après la table de référence (`LACUNA_PHYSICS.md` §2), y aller prendrait ~19 h joueur et ~11 400 ans simulés (~457 générations). À l'arrivée, il ne resterait qu'un rémanent en expansion. Ce n'est pas un appel à y aller.

**État du ciel après l'événement**
- Bételgeuse reste dans `stellar_systems` ; son état change (supernova, puis rémanent) — à modéliser par un attribut daté plutôt qu'en supprimant l'étoile.
- Le Ciel affiche la supernova pendant son déclin, puis un rémanent faible.

**Questions ouvertes**
- ~~L'horloge~~ — Tranché : temps réel joueur, durées raccourcies, ordre conservé (voir le déroulé implémenté). En temps simulé, compressé (~88 ans par heure de voyage), les phases seraient quasi simultanées.
- Éclat apparent au maximum : exprimé sur l'échelle du rendu, à recaler si une source fiable est retenue.
- Les neutrinos de pré-supernova (étape 1) : non implémentés, à ajouter éventuellement.
- Le support « neutrinos » : implémenté (`LACUNA_LABORATOIRE_INSTRUMENTS.md` §3.4 et §4.14).

---

### LPT-001 — Le signal de 22 minutes (proposition)
**Système :** GPM J1839−10, ~5,7 kpc (~18 600 al)
**Type :** SIGNAL — radio, périodique
**Difficulté :** 1 (capté depuis Sol) — 2 (analysé)

**Ancrage réel**
Découvert en 2022 par le Murchison Widefield Array lors d'un relevé du plan galactique, GPM J1839−10 émet une impulsion radio toutes les 1 318,1957 s (~22 min). Les impulsions durent de 30 à 300 s et leur intensité varie d'un facteur ~100. Les archives montrent qu'il émet depuis au moins 1988 (VLA). Polarisation linéaire variable (10 à 100 %), faible polarisation circulaire. Mesure de dispersion 273,5 pc cm⁻³, d'où une distance de 5,7 ± 2,9 kpc (Hurley-Walker et al., *Nature*, 2023). Sa période est trop longue pour un pulsar classique et elle ne dérive presque pas ; les auteurs le jugent « extrêmement déroutant ». Hypothèses discutées : magnétar à période ultra-longue, naine blanche magnétique.
Il appartient à la classe des transitoires radio à longue période. Pour certains d'entre eux (ILT J1101+5521, GLEAM-X J0704−37), une binaire naine blanche – naine rouge a été identifiée ; pour GPM J1839−10, la nature reste ouverte.

*Valeur de jeu :* le signal est toujours actif au départ du vaisseau.

**Ce que le joueur voit**
Dès Sol, le Radar capte une impulsion large bande, puis plus rien pendant ~22 minutes, puis une autre — plus forte ou plus faible. Rien ne la signale comme importante.

**Ce que les données disent**
- Période : 1 318,2 s, stable sur des décennies
- Durée d'impulsion : 30 à 300 s ; intensité très variable d'une impulsion à l'autre
- Polarisation : linéaire, degré variable
- Distance estimée : ~18 600 al — inatteignable en pratique

**Ce que les données ne disent pas**
- Ce qui émet : aucun objet connu ne tourne aussi lentement en émettant autant
- Pourquoi la période ne dérive pas
- Pourquoi l'intensité varie autant d'une impulsion à l'autre

**Output**
SIGNATURE — une période de ~1 318 s à reconnaître si elle réapparaît ailleurs.

**Interprétations canoniques**
- Magnétar à période ultra-longue
- Naine blanche magnétique, isolée ou en binaire
- Classe d'objets encore inconnue

**Questions ouvertes**
- Utiliser l'objet réel ou un objet inspiré de la classe (GLEAM-X J162759.5−523504.3, ~18 min, ~1,3 kpc, actif quelques mois en 2018) ?
- Le Radar ne garde que 12 minutes d'historique : une période de 22 minutes n'y montre qu'une impulsion à la fois. L'analyse de la périodicité passe donc par le Laboratoire, sur une capture longue.
- La signature doit-elle réapparaître plus tard (un autre système, une autre génération) pour que l'output ait un sens ?

### Sources consultées (23 octobre 2026)

- Hurley-Walker et al., « A long-period radio transient active for three decades », *Nature* 2023 — [arXiv:2503.08036](https://arxiv.org/html/2503.08036v1)
- Hurley-Walker et al., GLEAM-X J162759.5−523504.3, *Nature* 2022 — [ATNF](https://www.atnf.csiro.au/?p=10564)
- Revue des transitoires à longue période — [arXiv:2601.10393](https://arxiv.org/pdf/2601.10393) ; ILT J1101+5521 et GLEAM-X J0704−37 — [arXiv:2408.15757](https://arxiv.org/pdf/2408.15757), [A&A 2025](https://www.aanda.org/articles/aa/full_html/2025/03/aa53684-25/aa53684-25.html)
- SN 1987A, neutrinos — [Astrophysics Spectator](https://astrophysicsspectator.org/topics/supernovae/CoreCollapseNeutrinos1987a.html), [arXiv:astro-ph/0107260](https://arxiv.org/pdf/astro-ph/0107260)
- Bételgeuse, Joyce et al. 2020 (ApJ 902, 63) — [ANU](https://science.anu.edu.au/news-events/news/supergiant-star-betelgeuse-smaller-closer-first-thought)
- Événements de SN 1987A à Kamiokande II — [Burrows & Lattimer 1987](https://adsabs.harvard.edu/pdf/1987ApJ...318L..63B), [arXiv:astro-ph/0403436](https://arxiv.org/pdf/astro-ph/0403436)
- Super-Kamiokande, supernova à 10 kpc (événements, pointage) — [arXiv:1601.04778](https://arxiv.org/pdf/1601.04778), [arXiv:2403.06760](https://arxiv.org/abs/2403.06760v1)
- Neutrinos de pré-supernova — [arXiv:1606.04915](https://arxiv.org/pdf/1606.04915), [arXiv:2004.02045](https://arxiv.org/pdf/2004.02045)
- Déroulé visible d'une supernova de Bételgeuse (vulgarisation) — [Big Think](https://bigthink.com/starts-with-a-bang/when-betelgeuse-supernova/)

---

*LACUNA — Traces immuables v0.6 — Octobre 2026 — Confidentiel*
