*Dernière modification : 2026-10-22*

# LACUNA — Système de Notifications
*Version 0.5 — Octobre 2026*

---

## Table des matières

1. [Philosophie](#1-philosophie)
2. [Format général](#2-format-général)
3. [Famille 1 — Voyage](#3-famille-1--voyage)
4. [Famille 2 — Traces](#4-famille-2--traces)
5. [Famille 3 — Population](#5-famille-3--population)
6. [Famille 4 — Vaisseau](#6-famille-4--vaisseau)
7. [Famille 5 — Galactique](#7-famille-5--galactique)
8. [Famille 6 — Temporelle](#8-famille-6--temporelle)
8 bis. [Famille 7 — Ciel de départ](#8-bis-famille-7--ciel-de-départ)
9. [Règles globales](#9-règles-globales)
10. [Schéma JSON](#10-schéma-json)

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 0.1 | Mars 2026 | Document initial |
| 0.2 | Mars 2026 | Corrections — VOY-002 vitesse croisière (3,2%c → 4,8%c), VOY-007 durée HD 40307 (5h12 → 5h44) |
| 0.3 | Octobre 2026 | Mise en cohérence — population de départ 15 000 (POP-001, TEM-005) ; VOY-005 : Zeta Puppis de type O4 ; TEM-001 : la dernière signature radio est datée *après* le départ ; TEM-002 : exemple remplacé (une étoile G2V ne devient pas subgéante en 847 000 ans) ; TRA-004 : Epsilon Eridani ne peut pas devenir subgéante en 847 ans — l'évolution porte sur son disque de débris (période orbitale de ~500 ans à 60 UA) ; TEM-005 : à 4,8 % c, 100 ans simulés couvrent au plus ~4,8 al, et 100 ans font 4 générations. *Point ouvert : les dates d'exemple (2187 à 2891) ne suivent aucun calendrier défini — à fixer avec la date de départ (`LACUNA_LORE.md`)* |
| 0.4 | Octobre 2026 | Calendrier fixé (départ le 1er janvier 2187, `LACUNA_GDD.md` §2) — point ouvert de la v0.3 résolu, exemples annotés ; famille 7 « Ciel de départ » (CIE-001 à CIE-004) ; VOY-001 et VOY-007 écrits au journal |
| 0.5 | Octobre 2026 | POP-001 : écrit au journal au premier passage seulement, sans la ligne d'effectif |

---

## 1. Philosophie

### Le registre de LACUNA

La plupart des jeux utilisent les notifications pour créer de l'urgence — *quelque chose à faire maintenant*. LACUNA est l'inverse. Le rythme est lent, asynchrone, contemplatif. Une notification qui crée de la pression casse le registre du jeu.

Les notifications de LACUNA ne disent jamais *fais quelque chose*. Elles disent *il s'est passé quelque chose que tu pourrais vouloir voir*. La nuance est fondamentale.

### Les trois fonctions

**Maintenir le lien pendant les voyages longs.** Un joueur qui a programmé un cap vers le centre galactique pour 14 jours ne doit pas disparaître. Les notifications lui donnent des raisons de revenir voir — pas de l'anxiété, de la curiosité.

**Rythmer sans interrompre.** Une notification bien calibrée s'insère dans la vie du joueur comme un message d'un ami lointain — on y répond quand on peut, pas immédiatement. Elle ne demande pas d'action urgente.

**Raconter sans expliquer.** Les meilleures notifications de LACUNA sont celles qui posent une question plutôt que d'annoncer un événement. Elles laissent le joueur construire le sens.

### La règle de la séquence secrète

Les traces appartenant à la séquence secrète (niveau 4) se notifient exactement comme les traces ordinaires. Même format, même ton, même priorité visuelle. L'interface ne sait pas que c'est important. Seul le joueur peut faire ce déclic — et il ne peut le faire que par l'exploration et l'interprétation accumulées.

---

## 2. Format général

### Anatomie d'une notification

```
[FAMILLE] — [CONTEXTE TEMPOREL]
[TITRE COURT]
[CORPS — 1 à 3 lignes maximum]
[ACTION OPTIONNELLE]
```

### Niveaux de priorité

| Niveau | Usage | Comportement |
|--------|-------|-------------|
| `INFO` | Événement neutre, informatif | Apparaît dans le fil, pas d'alerte sonore |
| `NOTABLE` | Événement significatif, mérite attention | Légère pulsation de l'icône famille |
| `RARE` | Événement exceptionnel, peu fréquent | Notification persistante jusqu'à lecture |

Il n'y a pas de niveau `URGENT`. LACUNA n'a pas d'urgences.

### Ton

- Phrases courtes, souvent sans verbe
- Pas de point d'exclamation
- Vocabulaire technique mais accessible
- Jamais de jugement de valeur ("impressionnant", "incroyable")
- Le doute est explicitement formulé quand il existe

### Horodatage

Toutes les notifications sont datées doublement :
- **Date galactique simulée** — la date du vaisseau (`LACUNA_GDD.md` §2, Calendrier du vaisseau : départ le 1er janvier 2187)
- **Contexte de voyage** — "En orbite — [système]" ou "En transit vers [système]"

*Les dates des exemples ci-dessous (2341…) sont antérieures à ce calendrier : elles illustrent le format, pas la chronologie.*

---

## 3. Famille 1 — Voyage

Notifications générées pendant un transit. Les plus fréquentes. Elles maintiennent l'engagement entre les sessions.

---

### VOY-001 — Départ

**Déclencheur** : Le joueur confirme un cap et le voyage commence.
**Priorité** : INFO
**Fréquence** : À chaque voyage

```
VOYAGE — 2341-03-15
Cap fixé — Tau Ceti — 11,9 al
Durée estimée : 2h24. Phase d'accélération en cours.
Moteurs allumés.
```

*Note : sobre, factuel. Pas d'émotion forcée. L'émotion vient du joueur.*

*Journal (migration `00068`) : entrée `AUTO` « VOYAGE », titre « Cap fixé — [destination] — [distance] al », corps « Durée estimée : [durée joueur]. Phase d'accélération en cours. » puis « Moteurs allumés. »*

---

### VOY-002 — Entrée en phase d'inertie

**Déclencheur** : Le vaisseau atteint sa vitesse de croisière, moteur éteint.
**Priorité** : INFO
**Fréquence** : À chaque voyage avec phase d'inertie (> ~100 al)

```
VOYAGE — J+0 — 14h après départ
Phase d'inertie — vitesse stabilisée à 4,8% c
Observatoire actif. Détection latérale en cours.
Prochain événement estimé : inconnu.
```

*"Prochain événement estimé : inconnu" — le joueur sait que quelque chose peut arriver, pas quand.*

---

### VOY-003 — Détection latérale — anomalie

**Déclencheur** : Un système latéral entre dans la fenêtre de résolution avec une anomalie détectée.
**Priorité** : NOTABLE
**Fréquence** : Variable — dépend de la trajectoire et de la densité stellaire

```
TRANSIT — J+3 — 14h22
Système non catalogué détecté — 8,3 al — tribord
Type spectral estimé : K2V
Anomalie suspectée — niveau 1
Déviation possible — coût carburant estimé : 9%
```

*Le joueur voit le coût immédiatement. La décision de dévier ou non est posée sans pression.*

---

### VOY-004 — Détection latérale — trace de joueur

**Déclencheur** : Un système récemment visité par un autre joueur entre dans le champ de détection.
**Priorité** : NOTABLE
**Fréquence** : Rare en début de jeu, plus fréquent avec la maturité de la communauté

```
TRANSIT — J+7 — 09h41
Signal de balisage détecté — HD 156026 — 12,1 al — bâbord
Origine : vaisseau en transit — génération 4
Trace déposée il y a 23 jours simulés
Déviation possible — coût carburant estimé : 14%
```

*Le joueur sait qu'un autre est passé. Il ne sait pas ce qu'il a trouvé.*

---

### VOY-005 — Alerte destination

**Déclencheur** : Le recalcul en cours de voyage révèle que la destination a peut-être évolué depuis l'observation.
**Priorité** : NOTABLE
**Fréquence** : Rare — surtout sur les longs voyages vers des étoiles massives

```
TRANSIT — J+12 — 06h03
Alerte destination — Zeta Puppis — 1 100 al
Réévaluation spectrale en cours.
Type O4 — âge estimé : ~3 Ma.
Distance-temps observée : 1 100 ans.
Statut actuel : INCONNU.
```

*Le joueur comprend que ce qu'il a vu n'est peut-être plus là. Il ne peut rien faire — sinon accepter l'incertitude.*

---

### VOY-006 — Retournement

**Déclencheur** : Le vaisseau commence sa manœuvre de retournement.
**Priorité** : INFO
**Fréquence** : À chaque voyage avec phase d'inertie

```
VOYAGE — J+14 — 02h17
Retournement en cours.
La destination apparaît devant pour la première fois.
Décélération dans 47 minutes.
```

*Court. Presque poétique. "La destination apparaît devant pour la première fois" — moment narratif.*

---

### VOY-007 — Arrivée

**Déclencheur** : Le vaisseau atteint sa destination et entre en orbite.
**Priorité** : NOTABLE
**Fréquence** : À chaque voyage

```
ARRIVÉE — 2341-05-22
HD 40307 — 41,8 al
Scan automatique en cours.
Durée du voyage : 5h12. Distance totale cumulée : 87,4 al.
```

*Suivi immédiatement par les notifications de scan et de traces éventuelles.*

*Journal (migration `00068`) : entrée `AUTO` « ARRIVÉE », titre « [système] — [distance] al », corps « Durée du voyage : [durée joueur]. Distance totale cumulée : [distance] al. » La ligne « Scan automatique en cours. » est omise tant que le scan automatique n'existe pas.*

---

### VOY-008 — Déviation enregistrée

**Déclencheur** : Le joueur confirme une déviation de trajectoire.
**Priorité** : INFO
**Fréquence** : À chaque déviation

```
VOYAGE — J+3 — 16h55
Déviation confirmée — cap modifié.
Destination originale : Gliese 667C — abandonnée.
Destination nouvelle : Wolf 359 — 7,8 al.
Carburant consommé pour la manœuvre : 8%.
Nouvelle durée estimée : +4h11.
```

---

### VOY-009 — Notification de longue durée (rappel périodique)

**Déclencheur** : Voyage dépassant 24h sans autre notification. Envoyé toutes les 24h.
**Priorité** : INFO
**Fréquence** : Quotidienne sur les longs voyages

```
VOYAGE — J+6
En route vers le centre galactique — 26 000 al.
Distance parcourue : 4 200 al — 16% du trajet.
Vitesse actuelle : 4,8% c.
Observatoire actif. Aucune anomalie détectée depuis J+4.
```

*Le silence fait partie du voyage. Le rappeler sans dramaturgie est honnête.*

---

## 4. Famille 2 — Traces

Notifications liées à la découverte, l'analyse et l'enrichissement des traces.
Les traces de la séquence secrète (niveau 4) utilisent exactement ce même format — aucun traitement différencié.

---

### TRA-001 — Trace découverte à l'arrivée

**Déclencheur** : Scan automatique à l'arrivée dans un système révèle une trace de niveau 1 ou 2.
**Priorité** : NOTABLE
**Fréquence** : ~80% des arrivées dans le voisinage, moins fréquent en zone profonde

```
SCAN — 2341-05-22 — HD 40307
Anomalie détectée — niveau 1
Type : ANOMALIE_GEOMETRIQUE
Désignation provisoire : HD40307-001
6 planètes confirmées. Configuration orbitale inhabituelle.
Laboratoire disponible pour analyse approfondie.
```

---

### TRA-002 — Trace de niveau 3+ déverrouillée

**Déclencheur** : Le joueur a rempli la condition de déverrouillage d'une trace cachée (scan approfondi après interprétation d'une trace liée).
**Priorité** : NOTABLE
**Fréquence** : Rare

```
SCAN APPROFONDI — 2341-05-22 — Gliese 667C
Données supplémentaires disponibles.
Composition du disque de débris : signatures organiques complexes.
Désignation : GLIESE667-002
Corrélation possible avec GLIESE667-001.
```

*Pas de fanfare. "Données supplémentaires disponibles" — discret, curieux.*

---

### TRA-003 — Nouvelle interprétation sur une trace visitée

**Déclencheur** : Un autre joueur a écrit une interprétation sur une trace que le joueur a lui-même interprétée.
**Priorité** : INFO
**Fréquence** : Variable selon la maturité de la communauté

```
RÉSEAU — 2341-06-14
Nouvelle lecture — SOL-001 (Signal WOW!)
Génération 7 — vaisseau inconnu
"La durée de 72 secondes n'est pas la durée du signal.
C'est la durée pendant laquelle nous pouvions l'entendre."
```

*Le contenu de l'interprétation est cité directement. Le joueur lit la pensée de quelqu'un d'autre.*

---

### TRA-004 — Trace visitée mise à jour (statut système)

**Déclencheur** : Le joueur revient dans un système qu'il a déjà visité et dont le statut a changé.
**Priorité** : INFO
**Fréquence** : Rare — seulement sur les revisites après de longs voyages

```
ARRIVÉE — 2341-08-03 — Epsilon Eridani (2ème visite)
Dernière visite : génération 1 — il y a 847 ans simulés.
Statut système : ÉVOLUÉ.
L'asymétrie de l'anneau externe s'est déplacée.
Les données de votre première visite ne correspondent plus au système actuel.
```

---

### TRA-005 — Première interprétation collective — seuil Drake

**Déclencheur** : Le nombre d'interprétations d'une trace atteint un seuil déclenchant une mise à jour de l'équation de Drake.
**Priorité** : RARE
**Fréquence** : Très rare — quelques fois dans la vie d'un jeu mature

```
GALACTIQUE — 2341-09-01
Mise à jour — Équation de Drake
Terme fl modifié : 0,31 → 0,34
Source : seuil d'interprétations atteint — GLIESE667-002
N = 13,7 (+0,3)
```

*Cette notification est dans la famille Traces ET Galactique. Elle apparaît dans les deux fils.*

---

## 5. Famille 3 — Population

Notifications liées à l'état de la civilisation embarquée. Rares, non annoncées, jamais mécaniques. Elles arrivent comme des nouvelles — pas comme des alertes de système.

---

### POP-001 — Passage de génération

**Déclencheur** : La génération courante laisse place à la suivante.
**Priorité** : RARE
**Fréquence** : Quelques fois par campagne

```
MÉMOIRE — 2341-11-12
Passage de génération — Génération 2
15 000 âmes ont quitté Sol. 14 479 sont en vie aujourd'hui.
La génération qui a regardé la Terre disparaître n'est plus.
Leurs journaux sont préservés.
```

*"La génération qui a regardé la Terre disparaître n'est plus." — pas d'instruction, pas de mécanique. Juste le poids du temps.*

*Journal (migration `00069`) : entrée `GENERATIONNEL` « MÉMOIRE », au premier passage seulement (`LACUNA_GDD.md` §4), titre « Passage de génération — Génération 2 », corps « La génération qui a regardé la Terre disparaître n'est plus. » puis « Leurs journaux sont préservés. » La ligne d'effectif (« 15 000 âmes ont quitté Sol. 14 479 sont en vie aujourd'hui. ») est omise tant qu'aucune règle démographique n'existe.*

---

### POP-002 — Événement populationnel — neutre

**Déclencheur** : Un événement interne survient (naissance d'un prodige, festival culturel, découverte scientifique interne).
**Priorité** : INFO
**Fréquence** : Occasionnelle

```
CIVILISATION — J+34
Naissance remarquée — Mira Osei, section 7
Aptitudes analytiques inhabituelles signalées dès l'enfance.
Aucune action requise.
```

*"Aucune action requise" — ironique et rassurant. On signale, on n'ordonne pas.*

---

### POP-003 — Événement populationnel — tension

**Déclencheur** : La cohésion sociale passe sous un seuil critique ou un événement déstabilisant survient.
**Priorité** : NOTABLE
**Fréquence** : Rare

```
CIVILISATION — J+112
Tensions — section 3 et section 9
Divergences d'interprétation sur la trace GLIESE667-001.
Deux lectures incompatibles circulent.
Cohésion sociale : 0,41 → 0,34
```

*Les traces causent des tensions dans la population. Le jeu et la narration sont liés.*

---

### POP-004 — Schisme

**Déclencheur** : Cohésion sociale < 0.3 et événement déclencheur.
**Priorité** : RARE
**Fréquence** : Très rare — événement majeur irréversible

```
CIVILISATION — 2342-03-08
Schisme — deux factions formalisées.
Les Cartographes : priorité à l'exploration et à la documentation.
Les Gardiens : retour vers une zone habitable, établissement.
Les interprétations des deux factions divergeront désormais.
```

*Le schisme n'est pas un échec. C'est une nouvelle condition narrative. Les interprétations futures porteront la couleur de la faction dominante.*

---

### POP-005 — Effondrement de la volonté

**Déclencheur** : `will` passe sous 0.2.
**Priorité** : NOTABLE
**Fréquence** : Rare

```
CIVILISATION — J+67
Fatigue du voyage — signal faible mais persistant.
Plusieurs secteurs rapportent une désorientation temporelle.
Volonté collective : 0,21
Les prochaines interprétations de traces refléteront cet état.
```

*Pas d'"alerte rouge". Pas de solution proposée. Le joueur comprend que ses prochaines interprétations seront teintées par cet état.*

---

### POP-006 — Renaissance culturelle

**Déclencheur** : Découverte majeure + `will` > 0.7 + `culture` = ACTIVE.
**Priorité** : RARE
**Fréquence** : Très rare

```
CIVILISATION — 2343-07-19
Renaissance — section artistique
Une nouvelle forme d'expression est née de la trace TABBY-001.
Ni musique, ni texte. Quelque chose entre les deux.
Volonté collective : 0,71 → 0,84
```

---

## 6. Famille 4 — Vaisseau

Notifications techniques. Sobres, fonctionnelles. Jamais dramatiques sauf si l'état est réellement critique.

---

### VAI-001 — Dégradation système

**Déclencheur** : Un système passe sous un seuil d'alerte.
**Priorité** : INFO (> 0.4) / NOTABLE (< 0.4)
**Fréquence** : Occasionnelle

```
SYSTÈMES — 2341-05-30
Propulsion — dégradation progressive détectée.
État actuel : 0,74 → impact sur vitesse de croisière : −6%
Cause probable : usure des injecteurs He³.
Prochain voyage affecté.
```

---

### VAI-002 — Alerte carburant

**Déclencheur** : He³ < 0.2 ou deutérium < 0.2.
**Priorité** : NOTABLE
**Fréquence** : Rare si le joueur gère bien, plus fréquente après des déviations multiples

```
SYSTÈMES — J+22
Réserves He³ : 18%
Autonomie estimée : 340 al à vitesse nominale.
Les déviations supplémentaires réduiront cette autonomie.
Sources de ravitaillement : non identifiées sur la trajectoire actuelle.
```

*Pas de solution proposée. Le joueur doit chercher. Les sources de carburant sont une mécanique de navigation à part entière.*

---

### VAI-003 — Panne critique

**Déclencheur** : Un système tombe à 0 ou un événement catastrophique survient.
**Priorité** : RARE
**Fréquence** : Très rare

```
SYSTÈMES — J+89 — 03h44
Bouclier plasma — défaillance partielle.
État : 0,31
Vitesse maximale safe réduite à 0,8% c.
Voyage en cours non interrompu — décélération adaptée.
Risque coque si vitesse maintenue.
```

*Le système s'adapte automatiquement. La notification informe, ne panique pas.*

---

### VAI-004 — Seuil de vitesse dépassé volontairement

**Déclencheur** : Le joueur choisit de dépasser la vitesse safe.
**Priorité** : INFO
**Fréquence** : Occasionnelle si le joueur prend des risques

```
SYSTÈMES — J+2 — 11h12
Vitesse actuelle : 4,1% c — au-delà du seuil safe (bouclier : 0,71)
Risque d'impact progressif sur l'intégrité de la coque.
Aucune action automatique — décision du joueur maintenue.
```

*Le système ne surprotège pas. Le joueur a choisi, le système enregistre.*

---

## 7. Famille 5 — Galactique

Notifications liées à l'état partagé par tous les joueurs. Rares, sobres, sans explication immédiate.

---

### GAL-001 — Variation de N=

**Déclencheur** : L'équation de Drake est mise à jour globalement.
**Priorité** : INFO (variation faible) / NOTABLE (variation > 0.5)
**Fréquence** : Toutes les ~10 minutes dans le header, notification dans le fil seulement si variation significative

```
GALACTIQUE — 2341-06-01
N = 13,4 → 13,7
Terme modifié : fl (+0,03)
Source : système Gliese 667C
```

*Court. Pas d'explication sur pourquoi fl a changé — le joueur doit aller voir la trace pour comprendre.*

---

### GAL-002 — Premier joueur dans un système

**Déclencheur** : Le joueur est le premier à visiter un système.
**Priorité** : INFO
**Fréquence** : Fréquente en début de jeu, de plus en plus rare

```
EXPLORATION — 2341-05-22 — HD 40307
Premier vaisseau à atteindre ce système.
Les traces que vous y trouverez seront les premières interprétées.
```

*Sobre. Pas de fanfare. Mais le joueur sait qu'il est seul ici — pour l'instant.*

---

### GAL-003 — Seuil collectif atteint

**Déclencheur** : L'ensemble des joueurs a collectivement franchi un seuil significatif (nombre de traces interprétées, distance totale parcourue, systèmes visités).
**Priorité** : RARE
**Fréquence** : Très rare — jalons de la communauté

```
GALACTIQUE — 2342-01-01
10 000 interprétations déposées dans le réseau.
La cosmologie collective commence à prendre forme.
Elle n'appartient à personne.
Elle appartient au voyage.
```

---

### GAL-004 — Trace de joueur dans un système destination

**Déclencheur** : Un autre joueur a déposé une trace dans le système vers lequel le vaisseau est en route.
**Priorité** : INFO
**Fréquence** : Occasionnelle selon la maturité de la communauté

```
TRANSIT — J+5
Signal de balisage — destination : Tau Ceti
Un vaisseau est passé il y a 12 jours simulés.
Une trace a été déposée.
```

---

## 8. Famille 6 — Temporelle

Notifications liées au passage du temps simulé et à ses conséquences astronomiques. Parmi les plus rares et les plus chargées émotionnellement.

---

### TEM-001 — Silence radio de Sol

**Déclencheur** : La distance parcourue est telle que les émissions radio humaines détectées correspondent à une période où elles ont cessé ou changé radicalement.
**Priorité** : RARE
**Fréquence** : Une fois par partie — moment fondateur

```
OBSERVATOIRE — 2389-03-12
Analyse du spectre radio — direction Sol
Les émissions caractéristiques de la civilisation humaine
ne sont plus détectables dans cette bande.
Dernière signature reçue : émise environ 10 400 ans après notre départ.
Ce que ça signifie : inconnu.
```

*Pas d'explication. Pas de conclusion. Le joueur reçoit ce fait brut et construit ce qu'il veut en faire.*

---

### TEM-002 — Système de la carte devenu obsolète

**Déclencheur** : Un système visité et marqué sur la carte a un statut recalculé comme potentiellement ÉVOLUÉ ou DISPARU compte tenu du temps écoulé depuis la visite.
**Priorité** : INFO
**Fréquence** : Occasionnelle sur les longues campagnes

```
CARTE — 2391-07-04
Spica — visite : génération 1
Temps simulé écoulé depuis la visite : 847 000 ans.
Statut recalculé : ÉVOLUÉ probable (type B1 — sortie de séquence principale possible)
Les données de votre carte reflètent un passé inaccessible.
```

*"Les données de votre carte reflètent un passé inaccessible." — la carte comme objet tragique.*

---

### TEM-003 — Observation de Sol en évolution

**Déclencheur** : L'observatoire peut détecter Sol à la distance actuelle, et la lumière reçue date d'une période significative.
**Priorité** : NOTABLE
**Fréquence** : Rare — seulement à certaines distances clés

```
OBSERVATOIRE — 2412-09-18
Sol — observé tel qu'il était il y a 4 200 ans.
Spectre : G2V — conforme.
Aucune anomalie détectée à cette époque.
Ce que Sol est aujourd'hui : inconnu depuis cette position.
```

---

### TEM-004 — Jalon cosmique

**Déclencheur** : Le temps simulé total depuis le départ franchit un seuil cosmique significatif.
**Priorité** : RARE
**Fréquence** : Très rare — seulement sur les très longues campagnes

```
MÉMOIRE — 2891-01-01
Temps simulé depuis le départ de Sol : 1 200 000 ans.
À cette échelle, les civilisations naissent et meurent.
Les étoiles que vous avez visitées en génération 1
ont peut-être changé de visage.
Votre carte est un document historique.
```

---

### TEM-005 — Anniversaire du départ

**Déclencheur** : Chaque anniversaire simulé du départ de Sol (100 ans, 1 000 ans, 10 000 ans…).
**Priorité** : INFO
**Fréquence** : Périodique selon l'échelle

```
MÉMOIRE — 2287-01-01
100 ans simulés depuis le départ de Sol.
Génération 1 au départ : 15 000 âmes.
Génération actuelle : 5
Distance parcourue : 4,24 al.
Journal de bord : 847 entrées.
```

---

## 8 bis. Famille 7 — Ciel de départ

Événements du début de partie (`LACUNA_TRACES_IMMUABLES.md` §5). *Implémentés comme entrées `AUTO` du journal seulement (migration `00068`) : le fil de notifications n'existe pas encore.* Uniquement des mesures, aucune interprétation.

### CIE-001 — Montée des neutrinos (SN-001)

```
DÉTECTEUR — [date]
Montée du taux de neutrinos
~200 événements en 5 min. Énergie moyenne ~3 MeV. Direction non reconstruite.
```

### CIE-002 — Bouffée de neutrinos (SN-001)

```
DÉTECTEUR — [date]
Bouffée de neutrinos
~5 000 000 événements en 10 s. Énergie moyenne ~15 MeV. Direction reconstruite à ±3°.
```

### CIE-003 — Sortie du choc (SN-001)

```
OBSERVATOIRE — [date]
Nouvelle source lumineuse
Direction : Orion (5h55m, +7,4°). Éclat en hausse.
```

### CIE-004 — Première impulsion de LPT-001

```
RADAR — [date]
Impulsion radio large bande
Direction : Écu (18h39m, −10,5°). Durée : [N] s.
```

---

## 9. Règles globales

### Fréquence et saturation

Le joueur ne doit jamais recevoir plus de **3 notifications en attente** à son retour sur l'interface après une absence courte (< 1h). Si plusieurs événements se sont produits, les moins importants sont agrégés.

```
RÉSUMÉ — pendant votre absence (2h14)
· Voyage : phase d'inertie atteinte
· 2 détections latérales (voir détails)
· Population : événement mineur — section 4
```

### Notifications pendant le sommeil du joueur

Les notifications générées pendant une longue absence (> 8h) sont regroupées en un résumé de voyage affiché à l'ouverture de l'interface :

```
RÉSUMÉ DE VOYAGE — 14h d'absence
Vous étiez en route vers Étoile de Tabby.
Distance parcourue : 340 al supplémentaires.
3 systèmes latéraux détectés — dont 1 avec anomalie de niveau 2.
Arrivée estimée : dans 9h41.
```

### Pas de notification sans contenu

Une notification qui n'apporte pas d'information nouvelle ou de question nouvelle est supprimée. Il vaut mieux le silence qu'un bruit de fond qui anesthésie l'attention.

### Archivage

Toutes les notifications sont archivées dans le journal de bord sous forme d'entrées `AUTO`. Le joueur peut retrouver n'importe quelle notification passée en remontant le fil du journal.

### Ton selon l'état de la population

L'état de la population colore subtilement le ton des notifications automatiques générées par le système du vaisseau — pas les notifications galactiques qui sont globales.

| État population | Ton des notifications vaisseau |
|----------------|-------------------------------|
| Volonté > 0,7 | Factuel, légèrement optimiste |
| Volonté 0,4–0,7 | Neutre, sobre |
| Volonté < 0,4 | Laconique, parfois fragmenté |
| Schisme actif | Deux versions de certaines notifications (une par faction) |

---

## 10. Schéma JSON

```json
{
  "id": "notif-00847",
  "family": "VOYAGE",
  "code": "VOY-003",
  "priority": "NOTABLE",

  "galacticDate": "2341-05-19",
  "travelContext": "J+3 — En transit vers Tau Ceti",
  "realTimestamp": "2026-03-05T14:22:00Z",

  "title": "Système non catalogué détecté — tribord",
  "body": "Type spectral estimé : K2V\nAnomalie suspectée — niveau 1\nDéviation possible — coût carburant estimé : 9%",

  "action": {
    "available": true,
    "label": "Évaluer la déviation",
    "module": "NAVIGATION",
    "target": "system-unknown-K2V-transit-J3"
  },

  "read": false,
  "archived": false,
  "linkedTrace": null,
  "linkedSystem": "system-unknown-K2V-transit-J3",

  "populationToneModifier": "neutral",
  "secretSequenceNode": false
}
```

---

*LACUNA — Système de Notifications v0.5 — Octobre 2026 — Confidentiel*
