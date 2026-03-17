# LACUNA — Génération procédurale des anomalies et traces
*Version 0.1 — Mars 2026*

> Stratégie pour générer des anomalies et traces procédurales cohérentes avec
> la grammaire scientifique de LACUNA et détectables via les instruments du Laboratoire.
> Complément de `LACUNA_PROCEDURAL_PLANETS.md`.

---

## 1. Architecture en trois couches

```
COUCHE 1 — Anomalie système          → stellar_systems.anomaly_level (0–3)
           Calculée depuis les        → Visible dans le ciel (pulse ambré)
           propriétés physiques        → Pas de rédaction — règles pures

COUCHE 2 — Trace générée             → table traces, origin = 'GÉNÉRÉE'
           Gabarit pré-rédigé +        → Détectable via instruments
           variables calculées         → Ambiguïté maintenue par le gabarit

COUCHE 3 — Trace immuable            → table traces, origin = 'IMMUABLE'
           100% éditoriale             → Ancrée dans la vraie science
           Indiscernable en interface  → Sous-tend les arcs narratifs
```

**Règle fondamentale** : la couche 1 génère des signaux visuels. Les couches 2 et 3 génèrent des questions. Une trace procédurale ne doit jamais apporter une réponse — elle doit poser une question que les instruments rendent explorable sans la résoudre.

---

## 2. Couche 1 — Calcul de anomaly_level

`anomaly_level` (0 à 3) est calculé depuis les propriétés physiques du système au moment de la génération des planètes (lazy, à la première visite). Il pilote le rendu visuel dans le ciel et décide si une trace de couche 2 est générée.

### Règles de calcul

Chaque condition ajoute des points. Le score total détermine le niveau.

```
Score → anomaly_level
0     → 0  (aucun signal)
1–2   → 1  (teinte ambre légère)
3–4   → 2  (pulse ambré lent)
5+    → 3  (pulse fort + halo)
```

### Table des conditions

| Condition | Points | Famille d'anomalie | Instrument révélateur |
|-----------|--------|-------------------|----------------------|
| Étoile variable connue (spectral_type contient 'V' ou 'var') | +2 | Électromagnétique | Spectromètre stellaire |
| Étoile très ancienne (age > 8 Ga) | +1 | Absence | Spectromètre stellaire |
| Étoile très jeune (age < 0.5 Ga) | +1 | Électromagnétique | Analyseur spectral |
| Planète en zone habitable (in_habitable_zone = true) | +1 | Chimique | Spectromètre atmosphérique |
| Résonance orbitale proche de 1:2, 1:3, 2:3, 1:2:4 | +2 | Orbitale | Analyseur orbital |
| Excentricité > 0.4 sur planète en ZH | +2 | Orbitale / gravitationnelle | Analyseur orbital + Gravimétrique |
| Planète avec surface_temperature_k dans [260, 320] K | +1 | Chimique | Spectromètre atmosphérique |
| Système avec ≥ 5 planètes | +1 | Orbitale | Analyseur orbital |
| Étoile naine M avec planète en ZH (type TRAPPIST) | +2 | Chimique + Électromagnétique | Spectromètre atm. + Analyseur spectral |
| Étoile de type O ou B avec planète confirmée | +2 | Orbitale | Analyseur orbital |
| Luminosité anormalement basse pour le type spectral | +1 | Électromagnétique | Spectromètre stellaire |

### Règle de plafonnement

Un système sans planètes ne peut pas dépasser `anomaly_level = 1`.
Les traces immuables (couche 3) peuvent forcer `anomaly_level` à n'importe quelle valeur indépendamment du calcul.

---

## 3. Couche 2 — Traces générées par gabarits

### Principe des gabarits

Un gabarit est un texte de trace pré-rédigé avec des **variables** substituables calculées depuis le seed du système. Le texte est cohérent, scientifiquement plausible, et maintient l'ambiguïté. Les variables sont encadrées `{variable}`.

Chaque gabarit a :
- Un **type** (`SIGNAL`, `ANOMALIE_STELLAIRE`, `ANOMALIE_CHIMIQUE`, etc.)
- Une **famille d'anomalie** (de la matrice instruments)
- Un **instrument révélateur principal** (instrument qui déclenche la détection)
- Un ou plusieurs **instruments d'approfondissement** (qui enrichissent sans résoudre)
- Une **difficulté** (1 à 3 — jamais 4, réservé aux traces immuables)
- Des **conditions de génération** (quand ce gabarit peut s'appliquer)

### Règle de densité

```
anomaly_level 0 → 0 traces générées
anomaly_level 1 → 1 trace, difficulté 1
anomaly_level 2 → 1–2 traces, difficulté 1–2
anomaly_level 3 → 2–3 traces, difficulté 1–3
```

La densité est volontairement faible. Un système vide est une réponse, pas un bug.

---

## 4. Catalogue des gabarits

### G-01 — Signal radio étroit

```
Type             : SIGNAL
Famille anomalie : Électromagnétique
Condition        : Étoile de type K ou M, planète en ZH
Difficulté       : 1
Instrument révélateur   : Récepteur radio (passif)
Instruments d'approf.   : Analyseur spectral, Analyseur structure temporelle,
                          Analyseur polarisation

Variables :
  {freq_mhz}     : fréquence en MHz — tiré dans [1400, 1430] avec biais sur 1420.4556
  {duree_s}      : durée en secondes — tiré dans [40, 300]
  {direction}    : direction textuelle — 'hémisphère nord', 'plan équatorial', 
                   'terminateur', 'face nuit'
  {phase}        : 'aube', 'midi', 'crépuscule' (si planète synchrone : 'terminateur permanent')

Texte gabarit :
"Signal radio capté à {freq_mhz} MHz. Durée : {duree_s} secondes.
Émission depuis {direction} — phase estimée : {phase}.
Largeur de bande < 0,3 Hz. Aucune répétition enregistrée sur la période d'observation.
Source : non identifiée."
```

---

### G-02 — Résonance orbitale suspecte

```
Type             : ANOMALIE_GEOMETRIQUE
Famille anomalie : Orbitale
Condition        : ≥ 3 planètes avec ratio de périodes proche de 1:2:4 ou 1:2:3
                   (tolérance ±5%)
Difficulté       : 2
Instrument révélateur   : Analyseur orbital (observation système)
Instruments d'approf.   : Analyseur gravimétrique

Variables :
  {ratio}        : ratio textuel — '1:2:4', '1:2:3', '2:3:5'
  {planetes}     : désignations des planètes — 'b, c, d'
  {prob_nat}     : probabilité naturelle estimée — tiré dans [1.2, 4.8] %
  {stabilite}    : 'stable sur 1 Ga' ou 'sensible aux perturbations'

Texte gabarit :
"Configuration orbitale {planetes} en résonance quasi {ratio}.
Probabilité d'occurrence naturelle estimée : {prob_nat} %.
Stabilité dynamique : {stabilite}.
Les modèles de formation planétaire standard ne favorisent pas cette configuration."
```

---

### G-03 — Variation de luminosité apériodique

```
Type             : ANOMALIE_STELLAIRE
Famille anomalie : Électromagnétique
Condition        : Étoile variable ou age > 6 Ga, luminosity connue
Difficulté       : 1
Instrument révélateur   : Spectromètre stellaire (observation lointaine)
Instruments d'approf.   : Analyseur structure temporelle, Analyseur spectral

Variables :
  {pct_baisse}   : pourcentage de baisse — tiré dans [3, 22] %
  {duree_obs}    : durée sur laquelle observé — tiré dans [12, 840] heures
  {periodicite}  : 'aucune périodicité détectée' ou 'période estimée ~{n} jours'
  {comparaison}  : 'comparable à KIC 8462852' ou 'sans parallèle catalogué'

Texte gabarit :
"Baisse de luminosité de {pct_baisse} % observée sur {duree_obs} heures.
{periodicite}.
Les transits planétaires standard produisent des baisses < 2 % avec profil régulier.
{comparaison}."
```

---

### G-04 — Déséquilibre atmosphérique

```
Type             : ANOMALIE_CHIMIQUE
Famille anomalie : Chimique
Condition        : Planète en ZH avec atmosphère détectable (has_atmosphere = true
                   ou surface_temperature_k dans [220, 340])
Difficulté       : 2
Instrument révélateur   : Spectromètre atmosphérique (orbite proche)
Instruments d'approf.   : Analyseur d'échantillon (si contact)

Variables :
  {molecule_a}   : première molécule — 'O₂', 'CH₄', 'N₂O'
  {molecule_b}   : molécule contradictoire — 'CH₄' si O₂, 'O₂' si CH₄
  {ratio_obs}    : ratio observé — tiré dans [10, 200] × ratio d'équilibre
  {temps_vie}    : temps de vie chimique estimé — '{n} années' ou '{n} siècles'

Texte gabarit :
"Détection simultanée de {molecule_a} et {molecule_b} dans l'atmosphère.
Ratio {molecule_a}/{molecule_b} : {ratio_obs}× les valeurs d'équilibre thermochimique.
Temps de vie chimique de {molecule_b} en présence de {molecule_a} : {temps_vie}.
Un renouvellement actif est requis pour maintenir cette concentration."
```

---

### G-05 — Corps à masse incompatible

```
Type             : OBJET
Famille anomalie : Gravitationnelle
Condition        : Planète avec masse_earth et radius_earth connus,
                   densité calculée hors des plages connues
Difficulté       : 2
Instrument révélateur   : Analyseur gravimétrique
Instruments d'approf.   : Scanner morphologique, Analyseur volumétrique

Variables :
  {densite}      : densité calculée en g/cm³
  {ref_min}      : densité minimale de référence pour ce type — ex: '0.7' (Jupiter)
  {ref_max}      : densité maximale — ex: '5.5' (Terre)
  {ecart_sigma}  : écart en sigmas — tiré dans [2.1, 4.8]

Texte gabarit :
"Densité déduite : {densite} g/cm³.
Plage de référence pour ce type de corps : {ref_min}–{ref_max} g/cm³.
Écart : {ecart_sigma}σ des distributions connues.
Composition interne non contrainte par les données actuelles."
```

---

### G-06 — Accélération résiduelle non gravitationnelle

```
Type             : OBJET
Famille anomalie : Orbitale / cinétique
Condition        : Corps mineur dans le système (astéroïde, comète) OU
                   planète avec excentricité > 0.35
Difficulté       : 2
Instrument révélateur   : Analyseur orbital (observation système)
Instruments d'approf.   : Analyseur gravimétrique, Scanner morphologique

Variables :
  {corps}        : désignation du corps — '{system_id}-MIN-01'
  {acceleration} : accélération résiduelle — tiré dans [2.5e-6, 8.0e-5] m/s²
  {explication}  : 'dégazage asymétrique' ou 'pression de radiation' ou 
                   'non modélisée'

Texte gabarit :
"Corps {corps} — accélération résiduelle mesurée : {acceleration} m/s².
Les sources gravitationnelles connues du système ne l'expliquent pas entièrement.
Hypothèse naturelle la plus probable : {explication}.
Précision insuffisante pour exclure d'autres mécanismes."
```

---

### G-07 — Absence de corps prédit

```
Type             : ABSENCE
Famille anomalie : Absence
Condition        : Lacune orbitale statistiquement significative entre deux planètes
                   (ratio > 3× le ratio de Hill minimum sans planète intermédiaire)
Difficulté       : 3
Instrument révélateur   : Analyseur orbital + Analyseur gravimétrique
Instruments d'approf.   : Tous (la trace ne se résout pas — elle s'approfondit)

Variables :
  {zone_au}      : zone vide en UA — ex: '2.4–6.1'
  {masse_pred}   : masse prédite d'un corps attendu — '{n} masses terrestres'
  {conf_absence} : niveau de confiance de l'absence — tiré dans [76, 94] %

Texte gabarit :
"Zone {zone_au} UA : lacune orbitale. Modèles de formation : un corps de {masse_pred}
est statistiquement attendu à cette position.
Confiance d'absence : {conf_absence} % sur la période d'observation.
Hypothèses : éjection, collision, non-formation, ou corps sous le seuil de détection."
```

---

### G-08 — Anomalie magnétique localisée

```
Type             : ANOMALIE_CHIMIQUE (par défaut) ou PHYSICAL_ARTIFACT (si score élevé)
Famille anomalie : Gravitationnelle + Morphologique
Condition        : Planète rocheuse en ZH, has_atmosphere = true
Difficulté       : 2–3
Instrument révélateur   : Magnétomètre (orbite proche)
Instruments d'approf.   : Analyseur volumétrique, Scanner morphologique

Variables :
  {intensite}    : intensité × la valeur globale — tiré dans [8, 120]
  {surface_pct}  : % de la surface concernée — tiré dans [0.3, 4.2] %
  {forme}        : 'circulaire' ou 'linéaire' ou 'polygonale'
  {profondeur}   : 'subsurfacique (~{n} m)' ou 'surfacique'

Texte gabarit :
"Anomalie magnétique {forme} détectée. Intensité locale : {intensite}× la valeur globale.
Surface concernée : {surface_pct} % de la surface totale.
Source estimée : {profondeur}.
Les processus géologiques standard produisent des anomalies diffuses, non localisées."
```

---

## 5. Pipeline de génération des traces

```
Pour chaque système à la première visite :

1. Calculer anomaly_level depuis les propriétés physiques (§2)
2. Si anomaly_level = 0 → fin, pas de trace
3. Sélectionner les gabarits applicables selon les conditions du système
4. Tirer le nombre de traces selon la table de densité (§3)
5. Pour chaque trace :
   a. Sélectionner un gabarit (priorité : gabarits dont les conditions matchent le mieux)
   b. Calculer les variables depuis seed_système
   c. Substituer les variables dans le texte
   d. Écrire dans table traces (origin='GÉNÉRÉE', difficulty selon gabarit)
   e. Écrire dans system_objects si la trace est liée à un objet spécifique
6. Mettre à jour stellar_systems.anomaly_level
```

---

## 6. Cohérence avec les instruments

Chaque gabarit est conçu pour être **détectable uniquement avec l'instrument approprié** et au **bon niveau d'observation**. La progression est :

```
Niveau PASSIF          → G-01 (signal radio capté spontanément)
Niveau LOINTAIN        → G-03 (variation de luminosité depuis le transit)
Niveau SYSTÈME         → G-02, G-06, G-07 (analyse orbitale)
Niveau ORBITE PROCHE   → G-04, G-05, G-08 (atmosphère, densité, magnétisme)
Niveau CONTACT         → Approfondissement de G-04, G-05, G-08
```

Aucune trace de couche 2 n'est accessible en une seule étape. Le joueur doit toujours faire un choix — aller plus près, changer d'instrument, croiser les données.

---

## 7. Ce que cette stratégie ne fait pas

- **Pas de PHYSICAL_ARTIFACT procédural** — le type le plus direct d'une présence passée reste éditorial. Un artefact physique généré mécaniquement tuerait l'ambiguïté.
- **Pas de SEQUENCE procédurale** — les séquences encodées nécessitent une cohérence inter-systèmes que seule la couche éditoriale peut garantir.
- **Pas de traces de difficulté 4** — réservé aux arcs narratifs immuables.
- **Pas de corrélation inter-systèmes** — les traces générées sont indépendantes les unes des autres. Les corrélations émergent des traces immuables et du travail des joueurs.

---

## 8. Relation avec l'Équation de Drake

Les traces générées **ne modifient pas N** directement. Seules les traces immuables et les interprétations collectives des joueurs impactent les termes de Drake. Une trace procédurale peut être interprétée par un joueur, mais son interprétation reste dans le champ de l'hypothèse personnelle — elle ne fait pas consensus automatiquement.

---

## 9. Implémentation technique

### Migration SQL

> Toutes les migrations sont centralisées dans `LACUNA_PROCEDURAL_DATA_MODEL.md` §8. Exécuter §8.3 avant ce script.

### Script Python — `stellar_import/generate_traces.py`

```python
def select_templates(system: dict, planets: list, rng: random.Random) -> list:
    """Retourne les gabarits applicables triés par pertinence."""
    candidates = []
    
    # G-01 : signal radio
    hz_planets = [p for p in planets if p.get('in_habitable_zone')]
    if hz_planets and system.get('spectral_type', 'G')[0] in ('K', 'M'):
        candidates.append(('G-01', 2))
    
    # G-02 : résonance orbitale
    if has_resonance(planets):
        candidates.append(('G-02', 3))
    
    # G-03 : variation luminosité
    spect = system.get('spectral_type', '')
    if 'V' in spect or (system.get('age') or 0) > 6:
        candidates.append(('G-03', 1))
    
    # ... autres gabarits
    
    candidates.sort(key=lambda x: x[1], reverse=True)
    return candidates

def generate_trace(template_id: str, system: dict, planets: list, 
                   rng: random.Random) -> dict:
    """Génère une trace depuis un gabarit avec variables calculées."""
    variables = compute_variables(template_id, system, planets, rng)
    text = substitute_template(TEMPLATES[template_id]['text'], variables)
    
    return {
        'designation': f"{system['id']}-PROC-{template_id}",
        'type': TEMPLATES[template_id]['type'],
        'origin': 'GÉNÉRÉE',
        'system_id': system['id'],
        'difficulty': TEMPLATES[template_id]['difficulty'],
        'description': text,
        'template_id': template_id,
        'template_variables': variables,
        'real_reference': False,
    }
```

---

*LACUNA — Génération procédurale anomalies et traces v0.1 — Mars 2026 — Confidentiel*
