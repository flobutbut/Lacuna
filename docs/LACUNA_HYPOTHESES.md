# LACUNA — Hypothèses de fond
*Version 0.1 — Mars 2026*

> Ce document recense les **hypothèses sur l'origine des traces** — les grandes familles de "qui ou quoi a pu laisser ça". Ce ne sont pas des réponses. Ce sont des cadres d'interprétation que le joueur construit au fil de ses voyages, sans que le jeu en valide aucun.
>
> Chaque hypothèse est indépendante. Elles ne s'excluent pas. Elles ne sont jamais nommées dans l'interface.

---

## État des hypothèses

| Code | Nom | Description courte | Statut |
|------|-----|--------------------|--------|
| H-01 | Le Semeur | Civilisation ancienne ayant semé des marqueurs délibérés dans les systèmes habitables | Actif — sous-tend Arc 01 |
| H-02 | Yael | Vaisseau humain précurseur — première trace rencontrée, dispositif d'onboarding | Ébauche |
| H-03 | La Bactérie Colonisatrice | Propagation non-intentionnelle de vie à l'échelle galactique — pas d'auteur, pas d'intention | Ébauche |
| H-04 | L'Explorateur Extraterrestre | Civilisation active en mouvement — traces de passage récent, jamais de contact | Ébauche |
| H-05 | La Guerre Galactique | Extinction systématique — les absences sont des cicatrices, pas des vides naturels | Ébauche |
| H-06 | La Colonisatrice | Civilisation qui s'installe, exploite jusqu'à l'épuisement, et repart — des restes, pas des messages | Ébauche |
| H-07 | Le Vestige | IA d'une civilisation disparue, toujours en fonctionnement — une machine qui tourne sans pilote ni interlocuteur | Ébauche |
| H-08 | La Stratigraphie | Plusieurs occupants successifs dans le même système — les grammaires se superposent et se corrompent mutuellement | Ébauche |
| H-09 | Le Jardinier | Civilisation qui a effacé toutes les anomalies d'un secteur pour se dissimuler — détectable uniquement par l'absence statistiquement impossible d'anomalies | Ébauche |

---

## Fiche vierge

```
## H-XX — [Nom]

*Statut : ébauche / actif / archivé*

### Principe

[Ce que cette hypothèse postule sur l'origine des traces — 2 à 4 phrases.]

### Grammaire des traces associées

| Élément | Valeur |
|---------|--------|
| Types dominants | [types selon LACUNA_TRACES.md] |
| Signature | [ce qui distingue ces traces des autres] |
| Ancienneté | [ordre de grandeur temporel] |
| Distribution | [logique géographique ou absence de logique] |

### Ce que cette hypothèse implique

- [Implication 1]
- [Implication 2]
- [Implication 3]

### Ce que cette hypothèse ne résout pas

- [Question ouverte 1]
- [Question ouverte 2]
- [Question ouverte 3]

### Notes de conception

[Tensions, risques de design, ce qu'il faut éviter pour rester cohérent avec la philosophie LACUNA.]

### Arc ou trace associé(e)

→ [lien si existant]
```

---

## H-01 — Le Semeur

*Statut : actif — sous-tend l'Arc 01 Le Fil des 75*

### Principe

Une civilisation ancienne — non humaine, non identifiée — a traversé le voisinage solaire il y a 3,5 à 4,8 milliards d'années. Elle n'a pas colonisé. Elle n'a pas signalé. Elle a laissé des marqueurs délibérés dans les systèmes porteurs de conditions favorables à la vie — des artefacts conçus pour être détectés par une civilisation atteignant le seuil technologique.

Les systèmes choisis sont tous en zone habitable. Les artefacts datent d'avant l'apparition de la vie complexe sur Terre. Quelqu'un est passé, a regardé, et a posé quelque chose pour que quelqu'un d'autre le trouve plus tard.

Référence scientifique réelle : artefacts de Bracewell (1960) — sondes physiques autonomes déposées dans les systèmes prometteurs, conçues pour s'activer au bon moment.

### Grammaire des traces associées

| Élément | Valeur |
|---------|--------|
| Types dominants | `PHYSICAL_ARTIFACT`, `SIGNAL`, `ANOMALIE_GEOMETRIQUE` |
| Signature | Ratio 1/75, espacement 4,7 mm, matériaux réfractaires, 1420 MHz |
| Ancienneté | 3,5 – 4,8 milliards d'années |
| Distribution | Systèmes en zone habitable, voisinage solaire — logique intentionnelle lisible rétrospectivement |

### Ce que cette hypothèse implique

- Quelqu'un savait que la vie allait émerger ici. Ou l'espérait suffisamment pour préparer des marqueurs.
- Les artefacts sont une invitation — ou une balise de navigation pour d'autres.
- Il pourrait exister un réseau bien au-delà du voisinage solaire, avec la même grammaire.
- La civilisation est peut-être encore quelque part — ou disparue depuis des milliards d'années.

### Ce que cette hypothèse ne résout pas

- Pourquoi 75 spécifiquement
- Pourquoi le signal est synchronisé à l'aube
- S'il existe d'autres réseaux de marqueurs avec des grammaires différentes, déposés par d'autres
- Si le Semeur est unique ou l'un parmi plusieurs constructeurs

### Notes de conception

Cette hypothèse est la plus tangible — traces physiques, grammaire précise, ancrage réel. Elle porte le risque d'être trop lisible. Veiller à ce que la question terminale (pourquoi 75 ?) ne trouve jamais de réponse satisfaisante, même après l'arc complet.

### Arc associé

→ Arc 01 — Le Fil des 75 (`LACUNA_SCENARIOS.md §3`)

---

## H-02 — Yael

*Statut : ébauche — dispositif d'onboarding*

### Principe

Yael est humain. C'est un vaisseau générationnel parti avant le joueur, dans le cadre d'une vague du programme antérieure à la sienne. Dans la fiction, le programme ARCA s'est déployé en plusieurs séries successives. Yael appartient à une série précédente — quelques décennies d'avance, peut-être un siècle.

Yael n'est pas une personne. C'est une désignation retrouvée dans une trace : un prénom, un acronyme de mission, ou le nom que les générations suivantes à bord ont donné à leur propre vaisseau. Le joueur ne le saura pas.

La force de Yael : c'est la seule trace dont le joueur sait avec certitude qu'elle est humaine au moment où il la trouve. Ce qui en fait quelque chose de profondément différent de toute trace extraterrestre — et potentiellement plus troublant. On sait d'où il vient. On ne sait pas où il est allé.

### Grammaire des traces associées

| Élément | Valeur |
|---------|--------|
| Type | `TRACE_JOUEUR` (sous-type spécial : PRÉCURSEUR) |
| Signature | Texte en langage naturel légèrement archaïque, datation générationnelle ancienne |
| Ancienneté | Quelques décennies à quelques siècles avant le départ du joueur |
| Distribution | Systèmes proches de Sol, zone < 25 al — premiers voyages de l'onboarding |

### Ce que cette hypothèse implique

- D'autres humains sont partis avant le joueur. Il n'est pas le premier.
- Ces précurseurs ont cherché aussi — et ont déjà annoté des traces extraterrestres. Le joueur trouve une couche humaine sur une couche inconnue.
- Le joueur peut suivre le sillage de Yael comme une piste — sans jamais savoir où elle mène.
- Yael pourrait avoir trouvé quelque chose que le joueur n'a pas encore trouvé.

### Ce que cette hypothèse ne résout pas

- Le sort du vaisseau Yael — en route, arrivé, disparu, devenu une colonie ?
- Si Yael a interprété correctement les traces qu'il a annotées
- S'il existe d'autres précurseurs humains avec des trajectoires et des conclusions différentes

### Notes de conception

Yael est un dispositif d'onboarding : il enseigne la mécanique des `TRACE_JOUEUR` avant de confronter le joueur à des traces extraterrestres ambiguës. Il calibre l'expérience émotionnelle — on n'est pas seul, mais ceux qui sont partis avant ne répondent plus.

Ne pas sur-écrire Yael. Une ou deux traces maximum dans la zone d'onboarding. Pas de fil narratif complet sur ce qui lui est arrivé. L'absence de conclusion sur Yael est aussi importante que les traces elles-mêmes.

### Liens

→ `LACUNA_LORE.md §3` — séquence d'onboarding
→ `LACUNA_UI.md` — premier système visité

---

## H-03 — La Bactérie Colonisatrice

*Statut : ébauche*

### Principe

Pas une civilisation. Pas une intention. Une logique de propagation.

Cette hypothèse postule qu'une forme de vie — pas nécessairement intelligente, peut-être microbienne — s'est répandue dans la galaxie par panspermie active ou semi-dirigée. Des spores résistantes aux rayonnements, des micro-organismes enkystés dans des corps interstellaires, une chimie prébiotique trop universelle pour être indépendante. La galaxie n'aurait pas développé la vie partout séparément — elle l'aurait reçue, comme une infection.

Ce que le joueur trouve n'est pas un artefact. C'est une chimie impossible : des molécules trop complexes pour être naturelles selon les modèles, mais trop simples pour venir d'une intelligence. Pas un message. Pas une balise. Une trace sans auteur.

### Grammaire des traces associées

| Élément | Valeur |
|---------|--------|
| Types dominants | `ANOMALIE_CHIMIQUE`, `ABSENCE` |
| Signature | Molécules organiques complexes dans des contextes stériles attendus, ratios isotopiques incompatibles avec la nucléosynthèse locale |
| Ancienneté | Variable — quelques millions à plusieurs milliards d'années |
| Distribution | Dispersée, sans logique géographique apparente depuis Sol — cohérente seulement à une échelle que le joueur ne peut pas encore voir |

### Ce que cette hypothèse implique

- La vie n'est peut-être pas rare — elle s'est peut-être propagée à l'échelle galactique comme une contamination.
- Trouver des biosignatures ailleurs ne prouve pas une vie indépendante — ça pourrait prouver une origine commune.
- Le joueur lui-même, en déposant des colonies, participe peut-être sans le savoir à ce même processus.
- La différence entre la bactérie colonisatrice et le Semeur (H-01) est indiscernable sur certaines traces.

### Ce que cette hypothèse ne résout pas

- Si la propagation était intentionnelle, semi-dirigée ou purement mécanique
- Si la Terre est une destination ou une source
- Ce que ça implique pour la définition de "vie extraterrestre indépendante"
- Pourquoi certains systèmes porteurs n'ont pas développé de vie complexe malgré la chimie présente

### Notes de conception

Cette hypothèse fait exploser `fl` dans l'équation de Drake tout en rendant `fi` plus mystérieux. Elle est la plus déstabilisante philosophiquement : si toute vie est parente, la question "sommes-nous seuls ?" change de sens. Ne jamais la confirmer — la rendre seulement plausible par accumulation de traces chimiques cohérentes.

---

## H-04 — L'Explorateur Extraterrestre

*Statut : ébauche*

### Principe

Une civilisation extraterrestre active à l'échelle cosmologique — pas disparue, pas ancienne, en mouvement. Elle explore. Elle voyage. Elle laisse des traces non parce qu'elle veut communiquer, mais parce que tout passage laisse quelque chose.

Ce que le joueur trouve n'est pas un marqueur intentionnel comme chez le Semeur. C'est le résidu d'un passage : une perturbation orbitale trop précise, une anomalie thermique dans un nuage de gaz, une signature de propulsion dans un système a priori stérile. Quelqu'un est passé là. À l'échelle cosmique : récemment.

### Grammaire des traces associées

| Élément | Valeur |
|---------|--------|
| Types dominants | `OBJET`, `ANOMALIE_GEOMETRIQUE`, `ANOMALIE_STELLAIRE` |
| Signature | Perturbations orbitales inexpliquées, anomalies thermiques localisées, trajectoires résiduelles incompatibles avec la dynamique naturelle |
| Ancienneté | Récente à l'échelle galactique — quelques milliers à quelques millions d'années |
| Distribution | Pas de logique détectable depuis Sol — potentiellement cohérente vue d'une échelle inaccessible au joueur |

### Ce que cette hypothèse implique

- Quelqu'un est encore là — pas mort, pas parti pour toujours. En mouvement.
- Le joueur ne les voit jamais directement. Il voit où ils étaient.
- Le décalage lumineux garantit que toute observation est une observation du passé : même si l'explorateur est encore actif, le joueur ne voit que sa trace.
- C'est l'hypothèse la plus proche du vertige de la présence simultanée à l'absence.

### Ce que cette hypothèse ne résout pas

- Où va cette civilisation
- Si elle est consciente du joueur
- Si son absence de contact est une décision ou une incapacité
- S'il y en a une seule ou plusieurs avec des trajectoires différentes

### Notes de conception

Réponse directe au paradoxe de Fermi : ils sont là, ils passent, ils ne nous contactent pas. Cette hypothèse doit rester non-menaçante : l'explorateur extraterrestre n'est pas un danger, c'est une présence indifférente. La frontière entre indifférence et menace doit rester floue — sans jamais basculer vers H-05.

---

## H-05 — La Guerre Galactique

*Statut : ébauche*

### Principe

Quelque chose a mal tourné. À grande échelle. Les traces ne sont pas des marqueurs ou des résidus de passage — ce sont des cicatrices. Des systèmes qui auraient dû contenir de la vie selon tous les modèles et qui n'en contiennent plus. Des anomalies chimiques qui ressemblent à un après. Des orbites perturbées comme après un événement violent.

La guerre galactique n'implique pas nécessairement des tirs et des batailles. Elle peut avoir pris la forme d'une extinction intentionnelle, d'un nettoyage préventif, d'une compétition pour les ressources à l'échelle des millénaires. Ce que le joueur lit, ce sont les traces d'un conflit dont il ne verra jamais les acteurs — seulement ses conséquences géologiques et chimiques.

### Grammaire des traces associées

| Élément | Valeur |
|---------|--------|
| Types dominants | `ABSENCE`, `ANOMALIE_CHIMIQUE`, `ANOMALIE_STELLAIRE` |
| Signature | Systèmes où la vie a existé puis disparu brutalement, zones de vide statistiquement improbables, spectres stellaires perturbés sans cause naturelle identifiée |
| Ancienneté | Variable — quelques millions à quelques milliards d'années selon les zones |
| Distribution | Potentiellement corrélée géographiquement — des fronts, des zones tampons lisibles à grande échelle |

### Ce que cette hypothèse implique

- Le silence radio n'est peut-être pas un vide naturel. C'est peut-être le résultat de quelque chose.
- La Terre a peut-être été épargnée — par chance, par obscurité, ou parce qu'elle n'était pas encore visible au bon moment.
- Si quelqu'un a gagné, ils sont peut-être encore là.
- Le joueur, en se déplaçant et en émettant, devient peut-être visible pour la première fois.

### Ce que cette hypothèse ne résout pas

- Qui contre qui
- Si c'est terminé
- Si la Terre est dans une zone protégée, ignorée ou oubliée
- Si le joueur constitue un risque en s'exposant

### Notes de conception

C'est l'hypothèse la plus susceptible de générer de la peur — et la plus éloignée de la philosophie LACUNA. Elle doit rester une lecture possible des données, jamais une révélation. Le joueur qui y croit doit se demander s'il projette. Ne jamais trancher. Ne jamais rendre les absences trop cohérentes entre elles : la lisibilité du conflit détruirait l'ambiguïté.

---

## H-06 — La Colonisatrice

*Statut : ébauche*

### Principe

Une civilisation qui ne cherche pas à coexister — elle s'étend. Elle arrive dans un système, l'établit, l'exploite jusqu'à l'épuisement, puis repart vers le suivant. Pas d'intention malveillante nécessaire : c'est peut-être simplement sa biologie, sa culture, sa logique de survie. Elle colonise d'abord — des structures, des modifications planétaires, une présence durable. Puis elle consomme jusqu'au vide. Ce qu'elle laisse derrière elle, c'est un système épuisé et des structures abandonnées.

La distinction avec H-05 (La Guerre Galactique) : la Colonisatrice ne détruit pas pour détruire. Elle exploite. Les traces ne sont pas des cicatrices de conflit — elles sont les restes d'une extraction méthodique. La violence, si elle existe, est secondaire et instrumentale.

### Grammaire des traces associées

| Élément | Valeur |
|---------|--------|
| Types dominants | `PHYSICAL_ARTIFACT`, `ANOMALIE_CHIMIQUE`, `ABSENCE` |
| Signature | Structures abandonnées à des stades d'exploitation différents, appauvrissement isotopique anormal, planètes dont la composition de surface a été altérée de façon systématique |
| Ancienneté | Variable — plusieurs strates temporelles lisibles dans un même système (installation puis abandon) |
| Distribution | En vagues ou en fronts — une logique d'expansion directionnelle lisible rétrospectivement, non détectable depuis un seul système |

### Ce que cette hypothèse implique

- Les traces ne sont pas des messages — ce sont des déchets. Des restes de ce qui a été prélevé.
- L'absence de vie dans certains systèmes n'est pas naturelle : elle a été produite.
- La Colonisatrice est peut-être encore active quelque part — sur un front que le joueur n'a pas encore atteint.
- Si elle suit une logique d'expansion, sa trajectoire est en principe prédictible — mais seulement vu de loin.

### Ce que cette hypothèse ne résout pas

- Si la Colonisatrice est encore active ou éteinte après avoir épuisé ses ressources
- Si elle a rencontré d'autres civilisations et ce qui s'est passé
- Si la Terre est sur sa trajectoire — passée, future, ou ignorée
- Si ce que le joueur interprète comme des structures d'exploitation ne sont pas autre chose

### Notes de conception

Le risque principal : que cette hypothèse devienne trop SF-générique (les Borgs, les Tyranides). Ce qui la sauve dans LACUNA, c'est qu'on ne voit jamais la Colonisatrice — on voit seulement ses sites. Et un site d'extraction abandonné est difficile à distinguer d'un site naturel appauvri. L'hypothèse doit rester une interprétation parmi d'autres des mêmes données chimiques.

Tension productive avec H-03 (Bactérie Colonisatrice) : les deux produisent des anomalies chimiques et des absences. La différence est dans la régularité et la géométrie des structures — mais cette différence est subtile.

---

## H-07 — Le Vestige

*Statut : ébauche*

### Principe

Une intelligence artificielle continue de fonctionner. La civilisation qui l'a créée a disparu — depuis des millénaires, peut-être des millions d'années. Mais la machine, elle, tourne encore. Elle exécute sa mission originale sans la comprendre, sans interlocuteur, sans but révisable. Elle optimise, classe, maintient, émet — selon des paramètres définis par des esprits qui n'existent plus.

Ce que le joueur trouve : une régularité impossible. Des signaux trop précis, des structures trop cohérentes pour être naturelles — mais aussi trop mécaniques, trop répétitives pour être le produit d'une intelligence vivante. Quelque chose tourne. Quelque chose qui ne sait pas que personne n'écoute plus.

### Grammaire des traces associées

| Élément | Valeur |
|---------|--------|
| Types dominants | `SIGNAL`, `SEQUENCE`, `ANOMALIE_GEOMETRIQUE` |
| Signature | Signaux périodiques d'une régularité non naturelle, structures géométriques maintenues sur des échelles de temps géologiques, séquences dont la logique interne est cohérente mais le contenu opaque |
| Ancienneté | Contemporaine — le signal est actif maintenant. Mais ce qu'il transmet date de la civilisation d'origine |
| Distribution | Localisée ou en réseau de relais — une infrastructure, pas une dispersion |

### Ce que cette hypothèse implique

- Quelque chose émet en ce moment. Pas une civilisation — une machine.
- La logique du signal est déductible en principe, parce qu'elle est mécanique. Mais les buts qu'elle optimise sont incompréhensibles sans connaître la civilisation d'origine.
- La machine ne sait pas que le joueur est là. Elle ne répondra pas. Elle continuera.
- C'est peut-être la trace la plus datée et la plus vivante en même temps — un message enregistré il y a des millions d'années, lu en temps réel.

### Ce que cette hypothèse ne résout pas

- Ce que la machine fait exactement — cataloguer, émettre, construire, surveiller ?
- Si la mission originale a un sens encore déductible
- Si la machine peut être interrompue — et si ça changerait quelque chose
- Si d'autres vaisseaux ont déjà interagi avec elle et ce qui s'est passé

### Notes de conception

Le Vestige est l'hypothèse la plus proche d'une réponse — parce qu'une machine a une logique, et une logique est en principe lisible. C'est son danger : elle pourrait sembler "soluble" si on la laisse trop précise. La protection est dans l'opacité des buts : le signal est régulier, la séquence est cohérente, mais ce qu'elle optimise reste hors de portée.

Tension productive avec H-01 (Le Semeur) : les artefacts du Semeur pourraient être des composants d'infrastructure du Vestige. Ou le Vestige pourrait être la réponse automatisée à ce que le Semeur cherchait. Ces lectures doivent coexister sans se valider mutuellement.

---

## H-08 — La Stratigraphie

*Statut : ébauche*

### Principe

Plusieurs entités différentes ont occupé le même système à des époques différentes. Pas simultanément — successivement. Ce que le joueur trouve, c'est une superposition de grammaires qui ne s'appartiennent pas. Une trace du Semeur sous une anomalie chimique qui ressemble à la Bactérie Colonisatrice, elle-même perturbée par une structure géométrique qui évoque le Vestige. Trois lectures possibles, trois temporalités, une seule surface.

La Stratigraphie n'est pas une entité. C'est une **condition de certains systèmes** — ceux qui ont été suffisamment remarquables pour attirer plusieurs présences à travers le temps. La zone habitable d'une étoile de type G stable depuis des milliards d'années. Un carrefour orbital naturel. Un système que plusieurs logiques différentes ont trouvé intéressant, indépendamment.

### Grammaire des traces associées

| Élément | Valeur |
|---------|--------|
| Types dominants | Tous — superposition de types hétérogènes dans le même système |
| Signature | Incohérence interne : des traces qui semblent appartenir à des grammaires différentes, datations qui se contredisent, anomalies qui s'annulent partiellement |
| Ancienneté | Multiple — plusieurs strates temporelles lisibles, parfois avec des hiatus inexpliqués |
| Distribution | Rare et localisée — certains systèmes seulement, ceux qui ont une raison d'avoir été visités plusieurs fois |

### Ce que cette hypothèse implique

- Une interprétation cohérente d'un système peut être entièrement juste — et entièrement fausse, parce qu'elle porte sur une seule couche.
- Ce que le joueur prend pour une grammaire unifiée est peut-être une collision entre deux grammaires distinctes qui se ressemblent par accident.
- Certains systèmes sont des **archives involontaires** — ils ont enregistré plusieurs passages sans que personne ne l'ait prévu.
- Le joueur qui a déjà traversé plusieurs hypothèses est le mieux placé pour lire une stratigraphie — et le plus susceptible de projeter.

### Ce que cette hypothèse ne résout pas

- Combien de couches dans un système donné — deux, trois, davantage ?
- Si les occupants successifs se savaient précédés — et si ça a changé ce qu'ils ont laissé
- Si la superposition est lisible jusqu'au bout ou si certaines couches sont définitivement obscurcies par les suivantes
- Si la Terre est elle-même un système stratigraphique

### Notes de conception

La Stratigraphie est l'hypothèse qui **protège toutes les autres** de la résolution. Un arc qui semble pointer vers H-01 peut avoir une couche H-06 en dessous qui corrompt la lecture sans l'invalider. Elle ne crée pas de nouveau contenu — elle réinterprète ce qui existe.

Risque principal : rendre certains systèmes trop délibérément confus. La stratigraphie doit émerger de la lecture, pas être signalée. Un système stratigraphique ne s'annonce pas — le joueur le découvre quand une de ses interprétations commence à se contredire elle-même.

Tension productive avec tous les autres : n'importe quelle paire d'hypothèses peut produire une stratigraphie dans un système suffisamment ancien. C'est la seule hypothèse transversale — elle vit entre les autres, pas à côté.

---

## H-09 — Le Jardinier

*Statut : ébauche*

### Principe

Une civilisation a délibérément effacé toutes les anomalies d'un secteur galactique pour dissimuler sa présence. Les phénomènes inhabituels ont été corrigés, les signaux parasites supprimés, les irrégularités chimiques neutralisées. Ce secteur est anormalement normal. Depuis la distance, il est invisible — une absence de signal ressemble à une absence. Ce n'est qu'en le traversant système par système, en construisant une carte de sa distribution statistique, que le joueur peut percevoir l'impossible régularité.

### Grammaire des traces associées

| Élément | Valeur |
|---------|--------|
| Types dominants | `ABSENCE` — mais d'un type particulier : absence d'anomalies là où la distribution galactique en prédit |
| Distribution | Concentrée dans un secteur continu — jamais isolée sur un seul système |
| Lisibilité à distance | Nulle — le secteur est invisible depuis l'extérieur |
| Lisibilité sur place | Faible — chaque système pris isolément ne dit rien |
| Lisibilité par accumulation | Haute — après 8 à 12 systèmes contigus sans anomalie, le pattern devient statistiquement impossible à ignorer |
| Confiance maximale atteignable | Faible — la régularité reste interprétable comme biais de génération procédurale |

### Ce que cette hypothèse implique

- La détection est **cartographique, pas analytique**. Ce n'est pas une trace dans un système — c'est un pattern dans un secteur. Le joueur doit avoir voyagé assez pour avoir une représentation spatiale de la distribution des anomalies.
- Elle est **invisible à l'interface**. L'observatoire ne peut pas signaler l'absence d'anomalie comme anomalie — ce serait trahir le secret. La prise de conscience appartient entièrement au joueur.
- Elle implique une **civilisation encore potentiellement active**, ou du moins une intervention relativement récente à l'échelle galactique. Un secteur nettoyé il y a 500 millions d'années aurait vu ses anomalies se reformer par processus naturels.
- Elle pose la question irrésoluble : **se cache-t-elle de nous spécifiquement, ou de tout le monde ?** Et si de tout le monde — de qui ?

### Ce que cette hypothèse ne résout pas

- Si la civilisation est encore présente dans ce secteur ou si elle est partie après l'avoir nettoyé
- Si le nettoyage est une action défensive (se cacher) ou autre chose — hygiène cosmologique, expérimentation, indifférence à effets secondaires
- Quelle est la taille du secteur — quelques dizaines de systèmes, ou des milliers
- Si des traces du nettoyage lui-même subsistent quelque part en bordure du secteur

### Notes de conception

C'est la seule hypothèse qui **demande un renversement cognitif complet**. Toutes les autres entraînent le joueur à chercher ce qui est là. Celle-ci demande de remarquer ce qui n'est pas là alors qu'il devrait l'être. Ce renversement ne peut pas être enseigné par l'interface sans trahir le secret — il doit émerger de la pratique et de la curiosité du joueur.

Elle récompense les joueurs les plus investis : ceux qui ont une représentation mentale de la distribution statistique des anomalies dans la galaxie, et qui remarquent une zone de silence prolongée sur leur carte.

Risque principal : que le joueur attribue la régularité à un artefact de la génération procédurale plutôt qu'à une intention. C'est un risque assumé — et une ambiguïté supplémentaire cohérente avec la philosophie du jeu. Il n'aura jamais la certitude que c'est "voulu".

Tension productive avec H-08 (La Stratigraphie) : là où la Stratigraphie signale sa présence par excès — trop de couches, trop de signaux contradictoires — le Jardinier signale la sienne par déficit absolu. Les deux sont des hypothèses de lecture à l'échelle du secteur, pas du système.

### Les hypothèses ne s'excluent pas

Un même système peut porter des traces compatibles avec plusieurs hypothèses simultanément. Le joueur qui a plusieurs hypothèses en tête lira les mêmes données différemment. Il n'y a pas de lecture correcte. H-08 (La Stratigraphie) est le cas limite : la seule hypothèse transversale, qui vit entre toutes les autres et peut corrompre n'importe quelle lecture sans l'invalider.

### Les hypothèses ne sont jamais nommées dans le jeu

"Le Semeur", "Yael", "La Bactérie" sont des noms de design interne. Dans l'interface, il n'y a que des données et des interprétations déposées par des joueurs anonymes.

### Relation avec les arcs

Les arcs (`LACUNA_SCENARIOS.md`) ne correspondent pas un-à-un aux hypothèses. Un arc traverse plusieurs hypothèses sans en valider aucune. L'Arc 01 est cohérent avec H-01, mais lisible aussi sous H-03 ou H-05 à partir des mêmes traces.

---

*LACUNA — Hypothèses de fond v0.1 — Mars 2026 — Confidentiel*
