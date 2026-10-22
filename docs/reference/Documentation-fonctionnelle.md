*Dernière modification : 2026-03-25*

# LACUNA — Documentation fonctionnelle

*Synthèse des règles métier — Référence : GDD v0.3 — LACUNA_GDD.md, LACUNA_TRACES.md*

---

## Concept

LACUNA est une simulation d'exploration galactique **persistante, asynchrone et sans fin**. Le joueur incarne une civilisation à bord d'un vaisseau générationnel qui navigue, collecte des traces et les interprète.

### Piliers
- **Solitude réelle** — Pas de communication directe entre joueurs
- **Ambiguïté irréductible** — Pas de bonne réponse unique
- **Science ancrée** — Références réelles (WOW!, Oumuamua, Bennu...)
- **Temps long** — Voyages en temps réel ; durée joueur par compression non-linéaire (ex. Proxima 1 h, bord galaxie 90 j). Voir LACUNA_GDD §2 et §5, `transit.js`.
- **Émergence** — Cosmologie construite par les joueurs

---

## Objets principaux

### Joueur et compte
- Compte par **email + mot de passe**, email confirmé obligatoire avant de jouer (pages connexion, inscription, mot de passe oublié)
- Première connexion : écran **Bienvenue à bord** — le joueur choisit son **pseudo** (nom de commandant) et le **nom de son vaisseau** ; la partie démarre à Sol
- Pseudo et nom du vaisseau sont **privés** (jamais montrés aux autres joueurs, conformément à l'anonymat du GDD) et **non uniques** ; modifiables dans Systèmes → Identité
- Rôle `admin` (attribué à la main) : accès à la Vue 3D étoiles, outil de conception
- **Paramètres** (icône joueur du header, à côté de Quitter) : grande modale à sections, prévue pour accueillir les futurs réglages. Section Compte : email, **suppression du compte** (saisir « SUPPRIMER ») — compte, vaisseau, partie et interprétations effacés définitivement, retour à la connexion avec confirmation
- Évolution prévue : le pseudo pourra signer les traces déposées par le joueur — copie texte au moment du dépôt, sans lien vers le compte

### Vaisseau
- 1 par joueur, persistant (tables `ships`, `ship_systems`) ; nom choisi par le joueur, classe ARCA
- États : `IDLE`, `IN_TRANSIT`, `ARRIVED`, `DAMAGED` (champ `travel_state`)
- Systèmes : propulsion, coque, bouclier plasma, observatoire, réservoir, alimentation, atmosphère, médical
- Carburant : He³, deutérium (tonnes en base ; affichage en ratio)
- Position : système courant (`current_system_id`), pas de coordonnées x/y/z en base

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
- Texte libre, anonyme : datée par la génération du vaisseau d'origine, l'auteur n'est jamais exposé
- Niveaux : OBSERVATION, HYPOTHÈSE, CONVICTION, CERTITUDE

### Équation de Drake
- Globale, partagée par tous
- N = R* × fp × ne × fl × fi × fc × L
- Recalculée selon découvertes collectives

---

## Flux principal

```
Créer un compte → Confirmer l'email → Nommer commandant et vaisseau (Bienvenue à bord)
→ Observer le ciel → Sélectionner un système → Analyser (optionnel) 
→ Décider de voyager → Voyage (temps réel) → Arrivée 
→ Scan automatique → Traces détectées → Interpréter 
→ Décider : repartir / laisser trace / rester
```

---

## Interface

### Layout
- **Header** : Logo, nom vaisseau, coordonnées, bouton **RADAR ●/○** (acquisition buffer spectrogramme, `radarEnabled` dans le store `radar`, démarre/arrête `radarSpectrogram` depuis `PageObservatoire`), génération, N=
- **Ciel** : Interface principale (étoiles, hover, clic)
- **Indicateurs gauche** : Systèmes vaisseau (propulsion, carburant, coque...) — **Observatoire** : panneau gauche avec widget « Observatoire » (placeholders) et spectrogramme miniature (`RadarMiniature.vue` dans `SideLeft`) en vues ciel / radar (liste de signaux retirée de ce panneau)
- **Indicateurs droite** : Population, dernière trace
- **Barre instruments** : 8 modules (Observatoire, Carte, Laboratoire, Artefacts, Journal, Drake, Population, Systèmes), plus Vue 3D étoiles pour les comptes admin (outil de conception)

### Modules (contenu par route / page)
| Module | Contenu |
|--------|---------|
| Observatoire | Ciel / Système / Radar — Détail système, traces, scan, fixer cap. **Vue Radar** : spectrogramme temps réel + courbe d'intensité, pause (scroll + sélection zone), retour au live |
| Carte | Systèmes visités, routes parcourues |
| Laboratoire | Analyse données brutes |
| Artefacts | Grille traces collectées |
| Journal | Fil chronologique, écriture |
| Drake | Termes, historique N |
| Population | État civilisation |
| Systèmes | État technique vaisseau |
| Conception étoiles | Vue 3D étoiles (conception) |

---

## Vue Radar (Observatoire)

Mode alternatif au Ciel/Système — visualisation temps réel des signaux captés.

| Comportement | Description |
|--------------|-------------|
| **LIVE** | Défilement automatique, contenu le plus récent à droite |
| **Pause** | Défilement stoppé ; scroll horizontal (molette) pour parcourir l'historique ; sélection de zone (col×bin) pour analyse au Laboratoire |
| **Retour au LIVE** | Bouton affiché dès que l'utilisateur a scrollé — clic → easing vers le live |
| **Sélection** | En pause, glisser sur le spectrogramme pour délimiter une zone ; relâcher → émission `signal-selected` (startCol, endCol, startBin, endBin) |

Référence technique : `Documentation-technique.md` § Vue Radar.

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
