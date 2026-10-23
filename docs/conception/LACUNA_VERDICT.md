*Dernière modification : 2026-10-23*

# LACUNA — Écarts et verdict
*Version 0.5 — Octobre 2026*

> Spécification de la boucle d'analyse : ce que le Laboratoire fait apparaître (les écarts entre attendu et mesuré), la décision que le joueur prend (le verdict), et ce que cette décision déclenche (voyage, journal, traces, équation de Drake). Ce document comble l'étape « ANALYSER → DÉCIDER » du flux principal (`LACUNA_GDD.md` §4), aujourd'hui absente de l'interface.
>
> Documents liés : `LACUNA_GDD.md` (§4 flux principal, §7 équation de Drake) · `LACUNA_LABORATOIRE_INSTRUMENTS.md` (§8 familles d'anomalies, croisement multi-instruments) · `LACUNA_INSTRUMENTAL_EXTRAPOLATION.md` (données procédurales) · `LACUNA_TRANSIT.md` (départ, arrivée) · `LACUNA_TRACES.md` (traces `JOUEUR`, interprétations) · `LACUNA_ARCS.md` §1.7 (ce qu'il ne faut pas construire)

*Confidentiel — Antigravity*

---

## Table des matières

1. [Constat](#1-constat)
2. [Principes](#2-principes)
3. [La boucle cible](#3-la-boucle-cible)
4. [Les écarts](#4-les-écarts)
5. [Le verdict](#5-le-verdict)
6. [Conséquences du verdict](#6-conséquences-du-verdict)
7. [L'équation de Drake](#7-léquation-de-drake)
8. [Fil conducteur](#8-fil-conducteur)
9. [Modèle de données](#9-modèle-de-données)
10. [Découpage de l'implémentation](#10-découpage-de-limplémentation)
11. [Questions ouvertes](#11-questions-ouvertes)

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 0.1 | Octobre 2026 | Document initial — écarts attendu/mesuré, verdict, liens voyage/journal/traces, Drake de bord et Drake collectif |
| 0.2 | Octobre 2026 | Lot 1 implémenté (§10) ; §4.2 : instruments par famille alignés sur le code ; §9.1 : `deviations` nullable (rapports antérieurs recalculés), corroboration calculée à l'affichage |
| 0.3 | Octobre 2026 | Lot 2 implémenté (§10) ; §5.6 : la case « Consigner au journal » arrive avec le lot 3 ; §9.4 : `record_verdict` sans écriture au journal ni Drake pour l'instant, famille vérifiée contre les écarts mesurés |
| 0.4 | Octobre 2026 | Lot 3 implémenté (§10) ; §6.2 : texte de l'entrée « Écart principal (famille), mesuré par N rapports » ; §6.3 : un seul artefact par verdict, depuis le verdict courant, désignation rendue unique par un suffixe |
| 0.5 | Octobre 2026 | Lot 4 implémenté (§10) ; §6.1 : « Préparer le voyage » ouvre la Carte sur le système, la confirmation du départ reste derrière « Fixer le cap » ; un instrument déjà utilisé peut être relancé quand le niveau atteint permet de mesurer le doute qu'il avait deviné |

---

## 1. Constat

Le flux principal du GDD (observer → analyser → décider → voyager → interpréter → laisser une trace) est lisible sur le papier, pas dans l'interface. Chaque étape a sa page ; aucune ne mène à la suivante. État du code au 23 octobre 2026 :

| Étape | Réalité | Conséquence |
|-------|---------|-------------|
| **Anomalie** | `observations.anomalous` est un booléen fixé à la création, pour les signaux uniquement. Il s'affiche en badge « Signal atypique » sur chaque rapport. Les corps (planètes, étoiles, atmosphères) n'ont jamais d'anomalie. | Le joueur ne découvre rien : l'anomalie est donnée, pas trouvée. Il lance des instruments sans savoir ce qu'il cherche. |
| **Conclusion** | `getAnalysisConclusion` (`src/constants/lab.js`) ne traite que les signaux et nomme le phénomène *connu* (« Probablement un pulsar »). | Le labo dit ce qui est normal, pas ce qui ne l'est pas. |
| **Familles d'anomalies** | Les 8 familles de `LACUNA_LABORATOIRE_INSTRUMENTS.md` §8 ne sont pas implémentées. Les générateurs de données savent pourtant produire des résidus (`gravimetriqueData.js` : « observed − model » ; `orbitalData.js` : résonances suspectes). | La matière existe, elle n'est pas montrée comme un écart. |
| **Décision** | Aucune. « Créer un artefact » recopie le texte des rapports dans une trace gardée en mémoire côté client (`tracesStore.addTrace`, non persistée). | Pas d'interprétation, alors que le GDD (§3) en fait un objet central avec quatre niveaux de confiance. |
| **Voyage** | « Niveau insuffisant » grise un instrument, sans dire comment lever la limite. | Le voyage n'a pas de raison venant de l'analyse. |
| **Drake** | `drake_equation` n'est modifiée que par des migrations (`00001`, `00053`) ; le store se contente de la lire. | Le N= de l'en-tête ne bouge jamais : décor. |

---

## 2. Principes

Les piliers du GDD (§1) s'appliquent sans exception :

1. **Le jeu ne valide jamais.** Il mesure, il compare à un modèle, il montre l'écart. Il ne dit jamais « artificiel », « vie », « vrai » ou « faux ». Le verdict appartient au joueur.
2. **Rien à optimiser.** Aucun verdict ne rapporte de points, de ressources ou de progression. Un verdict change la manière dont le vaisseau voit la galaxie (Drake de bord, journal), pas sa puissance.
3. **Ambiguïté irréductible.** Un écart peut venir du bruit, d'un instrument peu fiable, d'un phénomène naturel rare ou d'autre chose. Le jeu produit aussi des écarts qui ne signifient rien (§4.6).
4. **Décider coûte peu, décider compte.** Le verdict prend quelques secondes (deux choix et une phrase facultative). Ce qu'il déclenche est durable : il est daté par la génération, il reste au journal, il peut nourrir une trace permanente.
5. **Sobriété.** Pas de série d'événements notifiés (`LACUNA_ARCS.md` §1.7). Un verdict produit au plus une variation visible de Drake et au plus une entrée au journal.

---

## 3. La boucle cible

```
OBSERVER (Observatoire, Radar)
      ↓  « Analyser au labo »
ANALYSER (instruments)
      ↓  les rapports font apparaître des ÉCARTS (§4)
DÉCIDER — VERDICT (§5)
      ├─→ JOURNAL : entrée proposée, validée par le joueur (§6.2)
      ├─→ DRAKE DE BORD : variation d'un terme (§7)
      ├─→ TRACE : « Créer un artefact » prérempli (§6.3)
      └─→ VOYAGE : « Lever le doute » si l'écart demande un niveau supérieur (§6.1)
              ↓
          ARRIVÉE — niveau d'observation relevé, nouveaux instruments
              ↓
          RÉVISER LE VERDICT (§5.5)
```

Le verdict est le nœud central : sans lui, journal, traces, voyage et Drake n'ont rien sur quoi s'appuyer.

---

## 4. Les écarts

### 4.1 Définition

Un **écart** est la différence entre ce qu'un modèle physique prédit pour un objet et ce que l'instrument mesure. C'est la seule forme sous laquelle le Laboratoire présente une anomalie.

> *« Résidu gravitationnel non expliqué — attendu : 0, mesuré : 0,3 M⊕ équivalent, période 41 j. »*
> *« Absence — raie de l'eau attendue à 1,4 µm (zone habitable, T_eq 268 K), non détectée. »*

L'écart ne dit pas ce qu'il signifie. Il dit seulement que le modèle ne suffit pas.

### 4.2 Familles

Les familles sont celles de `LACUNA_LABORATOIRE_INSTRUMENTS.md` §8, chacune liée à ses instruments (liste exacte : `DEVIATION_FAMILIES`, `src/lib/deviations.js`). Deux ajouts au §8 : l'analyseur gravimétrique relève aussi les écarts orbitaux (accélération sans source), ce qui rend la famille corroborable ; le magnétomètre relève les écarts morphologiques (structure interne) et d'absence (champ attendu, absent). L'analyseur de neutrinos relève les écarts temporels.

| Famille | Exemple d'écart | Terme de Drake (§7.2) |
|---------|-----------------|------------------------|
| Électromagnétique | Structure non aléatoire dans un bruit attendu blanc ; polarisation circulaire inattendue | `fc` |
| Orbitale / cinétique | Résonance exacte à 10⁻⁴ près ; accélération sans source | `fi` |
| Chimique | Ratio isotopique incohérent ; molécule en déséquilibre (O₂ + CH₄) | `fl` |
| Morphologique | Symétrie régulière ; arête rectiligne à l'échelle kilométrique | `fi` |
| Thermique | Source de chaleur sans contrepartie | `fc` |
| Temporelle | Changement entre deux observations ; périodicité trop stable | `fc` |
| Gravitationnelle | Masse incompatible avec le volume ; corps invisible | `fi` |
| Absence | Ce qui manque là où le modèle prédit une présence | `L` |

### 4.3 Origine des écarts

Les écarts sont **déterminés par l'objet**, pas tirés à chaque analyse. Deux joueurs qui analysent le même objet au même niveau voient les mêmes écarts (convergence indépendante, GDD §5).

- **Objets scénarisés** (traces immuables, Fil des 75, émetteurs) : les écarts sont écrits dans les fiches (`LACUNA_TRACES_IMMUABLES.md`, `LACUNA_SCENARIOS.md`). Une fiche déclare pour chaque écart sa famille, son instrument, son niveau minimal et son texte.
- **Objets procéduraux** : une graine dérivée de l'identifiant de l'objet (déjà utilisée par `seedFromObsId`) décide s'il porte un écart, de quelle famille et de quelle ampleur. La rareté est calibrée pour que la plupart des objets n'en aient aucun (ordre de grandeur : moins d'un objet sur dix, à régler).
- **Signaux existants** : le booléen `anomalous` devient un cas particulier — un signal `anomalous` porte un écart de famille électromagnétique ou temporelle, selon son support.

Les générateurs actuels (`gravimetriqueData.js`, `orbitalData.js`…) restent la source des graphes ; ils doivent produire leurs résidus **à partir de l'écart déclaré**, et non d'un `anomalous` global.

### 4.4 Affichage dans le rapport

Chaque rapport d'instrument se termine par une section **Écarts** :

```
ÉCARTS
  ▲ Gravitationnelle — résidu non expliqué
    attendu 0 · mesuré 0,3 M⊕ éq. · période 41 j        [corroboré]
  · Aucun autre écart au-delà du bruit (fiabilité 64 %)
```

- Un écart affiche sa famille, un intitulé court, l'attendu, le mesuré.
- Sans écart, la section le dit explicitement (« aucun écart au-delà du bruit ») : un résultat négatif est une information.
- La couleur ambre (`--color-amber`, réservée aux anomalies dans `LACUNA_LABORATOIRE_INSTRUMENTS.md`) marque l'écart ; le badge « Signal atypique » disparaît.
- La conclusion de `getAnalysisConclusion` est conservée comme **hypothèse naturelle de référence** (« Modèle de référence : pulsar »), pour que l'écart se lise par rapport à elle.

### 4.5 Corroboration

Un écart relevé par un instrument est **isolé**. S'il est relevé par un deuxième instrument de la même famille (ou de familles déclarées compatibles dans la fiche), il devient **corroboré**. Le croisement multi-instruments de `LACUNA_LABORATOIRE_INSTRUMENTS.md` §8 (difficultés 1 à 4) donne le nombre d'instruments nécessaires.

La corroboration ne change pas ce que l'écart veut dire. Elle change la confiance que le joueur peut raisonnablement y mettre.

### 4.6 Écarts sans signification

Pour que le verdict ne soit pas trivial, une partie des écarts isolés **disparaît** quand on les recoupe : ce sont des artefacts de mesure (fiabilité basse, bruit). Règle : un écart isolé relevé avec une fiabilité inférieure à 60 % a une probabilité (déterminée par la graine) de ne pas être confirmé par le second instrument. Le jeu ne l'annonce pas : le second rapport n'affiche simplement pas l'écart.

### 4.7 Écart hors de portée

Certains écarts ne sont visibles qu'à partir d'un niveau d'observation (`PASSIF`, `SYSTEME`, `ORBITE`, `CONTACT`). Au niveau inférieur, le rapport en montre l'**ombre** :

> *« Résidu au-delà de la résolution à cette distance — niveau Orbite requis pour le caractériser. »*

C'est le lien principal entre l'analyse et le voyage (§6.1).

---

## 5. Le verdict

### 5.1 Quand

Le panneau **Verdict** apparaît sous les rapports dès que l'observation a au moins un rapport. Il est mis en avant (bordure ambre) quand au moins un écart a été relevé. Il n'est jamais obligatoire : une observation peut rester sans verdict.

### 5.2 Lecture

Le joueur choisit une lecture :

| Lecture | Sens | Exemple |
|---------|------|---------|
| **Naturel connu** | Le modèle de référence suffit, l'écart est expliqué ou négligeable. | « Pulsar ordinaire, le résidu est du bruit. » |
| **Naturel inexpliqué** | Un phénomène naturel, mais que le modèle ne décrit pas. | « Un corps invisible, probablement une naine brune. » |
| **Origine artificielle possible** | L'écart est compatible avec une intervention. Le mot est « possible », jamais plus. | « Résonance trop parfaite pour être dynamique. » |
| **Indéterminé** | Le joueur refuse de trancher. C'est une décision, pas une absence de décision. | « Rien ne permet de choisir. » |

### 5.3 Confiance

Le joueur choisit un niveau parmi les quatre du GDD (enum SQL `confidence_level` existant) : `OBSERVATION`, `HYPOTHÈSE`, `CONVICTION`, `CERTITUDE`. Aucun niveau n'est verrouillé par le nombre de rapports : on peut être certain sur un seul rapport. Le jeu n'en tire aucune conclusion ; Drake, si (§7.3).

### 5.4 Note

Une phrase libre, facultative (280 caractères au plus). Elle alimente le brouillon du journal (§6.2) et la trace éventuelle (§6.3).

### 5.5 Révision

Un verdict n'est pas définitif. Après un voyage (niveau relevé, nouveaux rapports), le joueur peut en rendre un nouveau. L'ancien reste dans l'historique de l'observation, daté par sa génération : *« Génération 2 : naturel inexpliqué, conviction. Génération 5 : origine artificielle possible, hypothèse. »* Le Drake de bord ne compte que le verdict le plus récent de chaque observation.

### 5.6 Interface

```
VERDICT
  Lecture     ( ) Naturel connu  ( ) Naturel inexpliqué
              ( ) Origine artificielle possible  ( ) Indéterminé
  Confiance   [OBSERVATION | HYPOTHÈSE | CONVICTION | CERTITUDE]
  Note        [______________________________________________]
  [x] Consigner au journal
                                              [Rendre le verdict]
```

- Dans la file d'observations, la carte affiche l'état : « En attente », « 2 analyses », puis « Verdict : naturel inexpliqué ».
- Après le verdict, le panneau se replie en une ligne (lecture, confiance, génération) avec « Réviser ».

---

## 6. Conséquences du verdict

### 6.1 Voyage — « Lever le doute »

Quand une observation porte un écart hors de portée (§4.7), son panneau affiche, après le verdict ou à sa place :

> *Pour caractériser ce résidu : niveau Orbite requis.*
> *Ross 128 — 11,0 al — environ 3 générations.* **[Préparer le voyage]**

- Le bouton ouvre la Carte sur le système, avec la vue de confirmation du départ (`LACUNA_TRANSIT.md` §4). Le labo ne lance jamais le transit lui-même.
- À l'arrivée, `canDeepen` (déjà en place) permet de relever le niveau ; les écarts jusque-là hors de portée deviennent mesurables.
- Si le vaisseau est déjà dans le système, le bouton est « Approfondir » (existant).

C'est la raison de partir que la boucle actuelle ne donne pas : on voyage pour lever un doute qu'on a soi-même formulé.

### 6.2 Journal

Si « Consigner au journal » est coché (par défaut), le verdict crée une entrée `MANUEL` au nom du joueur :

```
Titre : Verdict — Ross 128 b
Texte : Naturel inexpliqué (conviction). Résidu gravitationnel corroboré
        par deux instruments. « <note du joueur> »
linked_systems : ['ross-128']
```

- L'entrée est `MANUEL` et non `AUTO` : c'est la décision du joueur, rédigée avec lui (GDD §3 : le serveur n'écrit que les entrées automatiques et générationnelles).
- Sans note, le texte est généré à partir de la lecture et des écarts ; le joueur peut le modifier depuis le journal.
- Une révision crée une nouvelle entrée, l'ancienne reste.

### 6.3 Traces — « Créer un artefact »

« Créer un artefact » n'est plus actif dès le premier rapport mais **après un verdict**. Il ouvre un formulaire prérempli :

| Champ | Prérempli avec |
|-------|----------------|
| Désignation | Nom de l'observation (modifiable) |
| Sous-type (`LACUNA_GDD.md` §4) | Suggestion d'après la lecture : naturel connu → `ANNOTATION` ; naturel inexpliqué → `DISCOVERY` ; origine artificielle possible → `DISCOVERY` ; indéterminé → `ANNOTATION`. `WARNING` et `DIRECTION` restent au choix du joueur. |
| Interprétation | La note du verdict, avec sa confiance (ligne `interpretations`) |
| Données | Les écarts relevés (pas le texte brut des rapports) |

- La trace est **persistée en base** et **permanente** (GDD §4) ; elle remplace l'actuel `addTrace` local. Le formulaire le rappelle avant validation : *« Cette trace sera visible des autres vaisseaux et ne pourra pas être retirée. »*
- La trace porte l'interprétation, pas le verdict : les autres joueurs lisent une lecture, jamais une vérité.

---

## 7. L'équation de Drake

### 7.1 Deux valeurs

| Valeur | Sens | Où |
|--------|------|-----|
| **N de bord** | Ce que *ce* vaisseau croit, d'après ses verdicts. | Page Drake, et en-tête au survol du N= |
| **N collectif** | Ce que la galaxie des joueurs croit, agrégé. | En-tête (N= actuel), page Drake |

L'écart entre les deux est l'information intéressante : *« Votre civilisation croit davantage à la vie que les autres. »* Le jeu ne dit pas laquelle a raison.

### 7.2 Correspondance familles → termes

Les termes fixes (`R*`, `fp`, `ne`) ne bougent pas (GDD §7). Les termes variables suivent les familles d'écart (§4.2) :

| Terme | Familles | Lecture du GDD §7 |
|-------|----------|-------------------|
| `fl` | Chimique | Traces chimiques / biologiques |
| `fi` | Orbitale, Morphologique, Gravitationnelle | Artefacts complexes / mathématiques |
| `fc` | Électromagnétique, Thermique, Temporelle | Signaux technologiques |
| `L` | Absence | Civilisations disparues |

Un verdict sans écart (observation analysée, rien relevé) ne touche aucun terme.

### 7.3 Contribution d'un verdict (N de bord)

Chaque verdict contribue au terme `T` de la famille de son écart principal :

```
contribution = s(lecture) × w(confiance)

s : origine artificielle possible +1 · naturel inexpliqué +0,3
    naturel connu −0,3 · indéterminé 0
w : OBSERVATION 0,25 · HYPOTHÈSE 0,5 · CONVICTION 1 · CERTITUDE 1,5

T_bord = T_référence × 10^(k × Σ contributions)     k = 0,05 (à calibrer)
```

- Bornes : `fl`, `fi`, `fc` restent dans `[T_réf ÷ 10 ; min(T_réf × 10 ; 1)]` ; `L` dans `[100 ; 10⁷]` ans.
- « Naturel connu » fait baisser le terme : expliquer un écart rend l'univers un peu plus vide.
- Seul le verdict le plus récent de chaque observation compte (§5.5).
- Variation visible : une ligne discrète dans le panneau du verdict après validation (*« fi de bord : 0,10 → 0,11 »*), et le delta du N de bord sur la page Drake. Pas de notification.

### 7.4 N collectif

- Recalculé par le serveur une fois par jour réel (et non à chaque verdict), pour respecter « sans explication immédiate » (GDD §7).
- Chaque terme collectif est la **moyenne géométrique** des termes de bord des vaisseaux ayant au moins un verdict sur ce terme, pondérée par le nombre de verdicts (plafonné à 20 par vaisseau, pour qu'un joueur très actif ne pèse pas seul).
- Le résultat est écrit dans `drake_equation` (`n`, `last_delta`) et dans `drake_history` (`changed_term`, `reason` = « recalcul collectif »). Le header affiche déjà `N=` et le delta : il suffit que la valeur bouge.

### 7.5 Page Drake

La page actuelle (affichage seul) devient :

- les deux N côte à côte, avec leur écart ;
- par terme : valeur de référence, valeur de bord, valeur collective ;
- sous chaque terme : la liste des verdicts du vaisseau qui l'ont fait bouger (observation, lecture, confiance, génération), chacun menant à l'observation dans le labo.

C'est le bilan des interprétations du vaisseau, lisible d'un coup d'œil.

---

## 8. Fil conducteur

Chaque écran indique discrètement l'étape suivante, en une ligne, sans notification :

| Où | Quand | Ligne |
|----|-------|-------|
| Observatoire | Observations sans rapport | « 2 observations en attente d'analyse → Laboratoire » |
| Laboratoire | Écart relevé, pas de verdict | Panneau Verdict mis en avant (§5.1) |
| Laboratoire | Écart hors de portée | « Lever le doute » (§6.1) |
| Carte | Système visé par un verdict à lever | Le nœud porte une marque ambre |
| Journal | Verdict sans trace | « Créer un artefact » sur l'entrée de verdict |

L'onboarding (`LACUNA_LORE.md` §3–5) pourrait faire parcourir une boucle complète sur une observation scriptée (par exemple le signal WOW embarqué) : un écart, un verdict, une entrée au journal.

---

## 9. Modèle de données

*Proposition, à valider. Migrations à partir de `00074`.*

### 9.1 Écarts

Les écarts d'un rapport sont figés au moment de l'analyse dans `lab_reports` :

```sql
ALTER TABLE lab_reports ADD COLUMN deviations JSONB;   -- migration 00074
-- [{ "id": "objet-0", "family": "GRAVITATIONNELLE", "label": "Résidu non expliqué",
--    "expected": "0", "measured": "0,3 M⊕ éq.", "requiresNiveau": null }]
```

- `requiresNiveau` non nul signale une ombre (§4.7), sans valeurs.
- `NULL` : rapport antérieur à la colonne. Les écarts étant déterminés par l'objet, le client les recalcule.
- La corroboration n'est pas stockée : elle se calcule à l'affichage (même `id` mesuré par au moins deux rapports).
- `lab_reports.anomalous` reste, dérivé des écarts mesurés : il pilote les résidus des graphes.

### 9.2 Verdicts

```sql
CREATE TYPE verdict_reading AS ENUM
  ('NATUREL_CONNU', 'NATUREL_INEXPLIQUE', 'ARTIFICIEL_POSSIBLE', 'INDETERMINE');

CREATE TABLE lab_verdicts (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  observation_id UUID NOT NULL REFERENCES observations(id) ON DELETE CASCADE,
  ship_id UUID NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
  reading verdict_reading NOT NULL,
  confidence confidence_level NOT NULL,
  note TEXT CHECK (char_length(note) <= 280),
  family TEXT,                 -- famille de l'écart principal, NULL si aucun écart
  generation INT NOT NULL,
  ship_date TEXT NOT NULL,     -- date du calendrier du vaisseau
  logbook_entry_id UUID REFERENCES logbook_entries(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Le verdict courant d'une observation est le plus récent ; les précédents forment l'historique (§5.5).

### 9.3 Drake de bord

```sql
CREATE TABLE ship_drake (
  ship_id UUID PRIMARY KEY REFERENCES ships(id) ON DELETE CASCADE,
  fl DECIMAL, fi DECIMAL, fc DECIMAL, l_val DECIMAL, n DECIMAL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9.4 Écriture

Une RPC `record_verdict(observation_id, reading, confidence, note, log_to_journal)` fait tout côté serveur, dans une transaction : insère le verdict, écrit l'entrée `MANUEL` si demandé, recalcule `ship_drake`. Le client ne calcule pas Drake. Le N collectif est recalculé par une tâche planifiée (§7.4).

---

## 10. Découpage de l'implémentation

Chaque lot est jouable seul et améliore la boucle sans attendre les suivants.

| Lot | Contenu | Dépend de |
|-----|---------|-----------|
| **1 — Écarts** | Section Écarts dans les rapports, écarts déterminés par l'objet (graine, puis fiches scénarisées), `lab_reports.deviations`, modèle de référence affiché | — |
| **2 — Verdict** | Panneau, table `lab_verdicts`, RPC, état dans la file d'observations, historique | 1 |
| **3 — Journal et traces** | Entrée `MANUEL` à la validation ; « Créer un artefact » après verdict, prérempli, persisté | 2 |
| **4 — Voyage** | Ombres d'écart (§4.7), « Lever le doute », marque sur la Carte | 1 |
| **5 — Drake de bord** | `ship_drake`, contribution des verdicts, page Drake à deux valeurs | 2 |
| **6 — Drake collectif** | Tâche planifiée, agrégation, `drake_history` | 5 |
| **7 — Fil conducteur** | Lignes d'étape suivante (§8), boucle dans l'onboarding | 2, 4 |

Les lots 1 et 2 forment le minimum qui rend la boucle compréhensible.

### État (23 octobre 2026)

**Lot 1 — implémenté.** `src/lib/deviations.js` (familles, gabarits, graine par objet, écart parasite, ombres, corroboration), tests `src/lib/deviations.test.js`. Section Écarts à la fin de chaque rapport, badge « Signal atypique » retiré, modèle de référence affiché (« modèle de référence : pulsar »). Écarts scénarisés : lus dans `observations.attributes.deviations` (`{ id, family, label, expected, measured, instruments?, min_niveau? }`) ; aucune fiche ne les déclare encore. Migration 00074 appliquée en production le 23 octobre 2026.

**Lot 2 — implémenté.** Panneau `LabVerdictPanel` sous les rapports dès le premier rapport, encadré d'ambre quand un écart est mesuré et qu'il n'y a pas encore de verdict ; lecture, confiance (« hypothèse » par défaut), note de 280 caractères au plus. Après le verdict : une ligne (lecture, confiance, génération, date du vaisseau) et « Réviser » (formulaire prérempli) ; les verdicts précédents s'affichent dessous. La carte de la file affiche « Verdict : naturel inexpliqué ». Famille de l'écart principal : celle que mesurent le plus de rapports (`getMainDeviationFamily`, `src/lib/verdicts.js`). Store `src/stores/verdicts.js` (en mémoire hors ligne). Migration 00075 (`lab_verdicts`, `verdict_reading`, RPC `record_verdict`) appliquée en production le 23 octobre 2026. 

**Lot 3 — implémenté.** Case « Consigner au journal », cochée par défaut : `record_verdict(…, p_log_to_journal)` écrit l'entrée `MANUEL` « Verdict — [observation] » (texte : « Naturel inexpliqué (conviction). Écart principal (gravitationnelle), mesuré par 2 rapports. » puis la note), le panneau indique « Consigné au journal ». « Créer un artefact » ne s'active qu'après un verdict ; la modale `LabArtifactModal` préremplit la désignation (nom de l'objet, « PROXIMA-C »), le sous-type suggéré, l'interprétation (note du verdict, avec sa confiance) et montre les écarts déposés et l'avertissement de permanence. RPC `create_artifact` : trace `JOUEUR` persistée, reliée au vaisseau, interprétation ajoutée ; le bouton devient « Artefact déposé » (un seul par verdict ; réviser le verdict pour en déposer un autre). Les artefacts du vaisseau apparaissent dans Artefacts avec leur sous-type. Migration 00076 appliquée en production le 24 octobre 2026.

**Lot 4 — implémenté.** Un doute est un écart resté à l'état d'ombre qu'aucun rapport n'a mesuré (`getOpenDoubts`, `src/lib/doubts.js`). Le panneau `LabDoubtPanel` (« Lever le doute ») s'affiche au-dessus du verdict et dit comment l'atteindre :
- hors du système : nom du système, distance, générations (`computeTransit`), « Préparer le voyage » ouvre la Carte sur le système (`/carte?select=…`, nœud ajouté au besoin) ; le départ reste confirmé par « Fixer le cap », comme partout ailleurs ;
- dans le système, niveau encore insuffisant (Contact) : « Approfondir » ;
- niveau atteint : l'instrument qui avait deviné l'écart redevient disponible (« Niveau atteint — relancer ») ; le nouveau rapport mesure l'écart et le doute disparaît.

Sur la Carte, un système dont une observation porte un doute hors de portée affiche « Doute à lever » dans la liste et le détail du doute au-dessus de « Fixer le cap ». Hors ligne, les rapports sont gardés en mémoire dans le store pour que la Carte les voie. Aucune migration.

---

## 11. Questions ouvertes

- **Rareté des écarts procéduraux** : quelle proportion d'objets en porte ? Trop rare, le labo reste muet ; trop fréquent, l'écart se banalise.
- **Calibration de Drake** : `k`, poids et bornes (§7.3) sont des valeurs de départ. Faut-il qu'un seul verdict « certitude » soit perceptible, ou seulement une accumulation ?
- **Verdict sur les traces trouvées** : les traces découvertes à l'arrivée (immuables, générées, joueurs) reçoivent déjà des interprétations. Le verdict doit-il s'y appliquer aussi, ou rester propre au labo ?
- **Génération et verdict** : la génération en cours doit « colorer » les interprétations (GDD §4, non implémenté). Le verdict est-il le bon point d'entrée (par exemple une génération sceptique qui propose « indéterminé » par défaut) ?
- **Population** : le N de bord doit-il agir sur la culture à bord (`populations.will`, `social_cohesion`) ? Risque : en faire un levier à optimiser, contraire au §2.
- **Visibilité du N de bord des autres** : les autres vaisseaux ne voient que le N collectif. Faut-il exposer la dispersion (« les vaisseaux sont très divisés sur `fi` ») sans révéler d'individus ?
