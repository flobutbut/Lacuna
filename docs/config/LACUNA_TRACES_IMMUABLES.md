*Dernière modification : 2026-10-22*

# LACUNA — Traces immuables
*Version 0.2 — Octobre 2026*

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

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 0.1 | Octobre 2026 | Document initial — fiches restaurées depuis `LACUNA_TRACES.md` v0.9 (§1.8, §1.9, §2 à §4), que la réécriture v1.0 annonçait déplacées vers `LACUNA_SCENARIOS.md` sans qu'elles y aient été reportées. Mises à jour factuelles : Barnard (quatre planètes confirmées en 2025), Epsilon Eridani b (confirmée en 2019), Proxima b (masse minimale 1,07 M⊕), Tau Ceti (candidates de 2017), Ross 128 (bande C), nucléobases (Bennu 2025, Ryugu 2026), Étoile de Tabby (~1 470 al), PSR B1919+21 (période 1,337 s), HD 40307 ; la résonance 1:2:4 de Gliese 667C est déclarée valeur de jeu. Le Journal de Yael relève de l'origine `PRÉCURSEUR` |
| 0.2 | Octobre 2026 | §4 : structure des entrées de Yael en base (origine `PRÉCURSEUR`, `precursor_generation`, `linked_trace_id`, `scenario_arc` pour le scénario effleuré) ; une entrée se découvre à l'arrivée dans son système. Aucune entrée écrite |

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

*LACUNA — Traces immuables v0.1 — Octobre 2026 — Confidentiel*
