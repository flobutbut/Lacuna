*Dernière modification : 2026-03-15 15:11*

# LACUNA — Documentation fonctionnelle

*Synthèse des règles métier — Référence : GDD v0.1*

---

## Concept

LACUNA est une simulation d'exploration galactique **persistante, asynchrone et sans fin**. Le joueur incarne une civilisation à bord d'un vaisseau générationnel qui navigue, collecte des traces et les interprète.

### Piliers
- **Solitude réelle** — Pas de communication directe entre joueurs
- **Ambiguïté irréductible** — Pas de bonne réponse unique
- **Science ancrée** — Références réelles (WOW!, Oumuamua, Bennu...)
- **Temps long** — Voyages en temps réel (1 al = 1 seconde)
- **Émergence** — Cosmologie construite par les joueurs

---

## Objets principaux

### Vaisseau
- 1 par joueur, persistant
- États : `IDLE`, `IN_TRANSIT`, `ARRIVED`, `DAMAGED`
- Systèmes : propulsion, coque, bouclier, observatoire, survie
- Carburant : He³, deutérium

### Population
- Effectif, génération, âge moyen
- **Volonté** (0–1) : influence interprétations et tolérance aux voyages
- Barres : cohésion, alimentation, soins
- Événements rares : épidémie, schisme, renaissance...

### Traces
- Types : Signal radio, Objet interstellaire, Anomalie chimique, Anomalie stellaire, Séquence codée, Artefact, Trace joueur
- Origines : `IMMUABLE` (créateurs), `GENERÉE` (procédural), `JOUEUR`
- Difficulté : 1 (évidente) à 4 (secrète)

### Interprétations
- Texte libre, anonyme
- Niveaux : OBSERVATION, HYPOTHÈSE, CONVICTION, CERTITUDE

### Équation de Drake
- Globale, partagée par tous
- N = R* × fp × ne × fl × fi × fc × L
- Recalculée selon découvertes collectives

---

## Flux principal

```
Observer le ciel → Sélectionner un système → Analyser (optionnel) 
→ Décider de voyager → Voyage (temps réel) → Arrivée 
→ Scan automatique → Traces détectées → Interpréter 
→ Décider : repartir / laisser trace / rester
```

---

## Interface

### Layout
- **Header** : Logo, nom vaisseau, coordonnées, génération, N=
- **Ciel** : Interface principale (étoiles, hover, clic)
- **Indicateurs gauche** : Systèmes vaisseau (propulsion, carburant, coque...)
- **Indicateurs droite** : Population, dernière trace
- **Barre instruments** : 8 modules (Observatoire, Carte, Artefacts, Laboratoire, Journal, Drake, Population, Systèmes)

### Modules (panels overlay)
| Module | Contenu |
|--------|---------|
| Observatoire | Détail système, traces, scan, fixer cap |
| Carte | Systèmes visités, routes parcourues |
| Artefacts | Grille traces collectées |
| Laboratoire | Analyse données brutes |
| Journal | Fil chronologique, écriture |
| Drake | Termes, historique N |
| Population | État civilisation |
| Systèmes | État technique vaisseau |

---

## Règles métier clés

### Voyage
- Durée = distance en al (en secondes réelles)
- Pendant le voyage : journal, artefacts, Drake en lecture — pas d'observatoire, pas de navigation
- À l'arrivée : scan automatique, traces selon difficulté + contexte

### Générations
- Passage après distance parcourue + temps simulé
- Entrée GENERATIONNEL dans le journal
- Héritage conservé, propriétés population modifiées

### Laisser une trace
- Type `PLAYER_TRACE`, permanente
- Sous-types : ANNOTATION, WARNING, DIRECTION, DISCOVERY

---

## Référence complète

Voir `docs/conception/LACUNA_GDD.md` pour les spécifications détaillées (structures JSON, onboarding, séquence secrète, etc.).
