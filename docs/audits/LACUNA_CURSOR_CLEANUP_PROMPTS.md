# LACUNA — Prompts de nettoyage Cursor
*Stack : Vue 3 Composition API · Pinia · Vite · Supabase*
*Mars 2026*

---

## Séquence recommandée

Les prompts d'audit (étape 1) ne modifient aucun fichier source — ils écrivent uniquement dans `docs/audits/`. Valider ce qu'ils ont trouvé avant de laisser Cursor toucher le code. Les corrections (étape 2) relisent ces fichiers au lieu de refaire l'analyse.

### Convention de nommage des fichiers d'audit

```
docs/audits/
  AUDIT_imports.md       ← résultat 1A
  AUDIT_composables.md   ← résultat 1B
  AUDIT_doublons.md      ← résultat 1C
  AUDIT_code_mort.md     ← résultat 1D
  AUDIT_css.md           ← résultats 3A et 3B
```

Chaque fichier est **écrasé à chaque nouvel audit** — pas d'accumulation. La date figure en en-tête du fichier. Un audit périmé est plus dangereux qu'utile.

---

## Étape 1 — Audit (lecture seule, aucune modification)

### 1A — Cartographie des imports inutilisés

```
Mode : audit uniquement — ne touche à aucun fichier source.

Parcoure tous les fichiers dans src/ (composants, composables, stores, lib, constants, views).

Pour chaque fichier, liste :
- Les imports déclarés mais jamais utilisés dans le fichier
- Les variables, fonctions ou refs déclarées mais jamais utilisées
- Les props déclarées mais jamais lues dans le template ou le script

Format de sortie :
FICHIER : src/components/SkyCanvas.vue
  → Import inutilisé : useRoute (importé, jamais appelé)
  → Variable inutilisée : localCount (déclarée, jamais lue)

Écris le résultat complet dans docs/audits/AUDIT_imports.md.
En-tête du fichier : date du jour + "Audit imports inutilisés".
Écrase le fichier s'il existe déjà.
Ne propose aucune correction. Confirme quand le fichier est écrit.
```

---

### 1B — Fonctions hors composables

```
Mode : audit uniquement — ne touche à aucun fichier source.

Parcoure tous les fichiers dans src/components/ et src/views/.

Identifie toutes les fonctions définies dans un <script setup> qui :
- Ne manipulent pas directement le DOM ou le template du composant
- Ne dépendent pas de refs locales au composant
- Pourraient être déplacées dans un composable (src/composables/) ou dans src/lib/

Format de sortie :
FICHIER : src/components/ObservationCard.vue
  → Fonction : formatDistance(d) — calcul pur, appartient à lib/formatUtils.js
  → Fonction : buildLabel(system) — logique partageable, appartient à un composable

Écris le résultat complet dans docs/audits/AUDIT_composables.md.
En-tête du fichier : date du jour + "Audit fonctions hors composables".
Écrase le fichier s'il existe déjà.
Ne propose aucune correction. Confirme quand le fichier est écrit.
```

---

### 1C — Doublons entre fichiers

```
Mode : audit uniquement — ne touche à aucun fichier source.

Parcoure l'ensemble de src/. Cherche les fonctions ou blocs de logique qui font 
la même chose dans plusieurs fichiers différents — même logique, noms différents, 
ou copier-coller légèrement modifié.

Exemples typiques à détecter :
- Formatage de distances ou de dates recalculé dans plusieurs composants
- Requêtes Supabase identiques dans plusieurs stores ou composables
- Calculs de couleur ou de taille d'étoile répétés dans skyRenderers.js et ailleurs

Format de sortie :
DOUBLON détecté :
  → src/lib/formatUtils.js : formatDistance(d)
  → src/components/StarTooltip.vue : getDistanceLabel(d) (logique identique)
  Recommandation : consolider dans formatUtils.js

Écris le résultat complet dans docs/audits/AUDIT_doublons.md.
En-tête du fichier : date du jour + "Audit doublons".
Écrase le fichier s'il existe déjà.
Ne propose aucune correction. Confirme quand le fichier est écrit.
```

---

### 1D — Composants legacy et code mort

```
Mode : audit uniquement — ne touche à aucun fichier source.

Le dossier src/components/panels/ est marqué "legacy" dans la documentation.

Vérifie :
1. Quels fichiers dans panels/ sont encore importés quelque part dans src/
2. Quels fichiers dans panels/ ne sont référencés nulle part (code mort)
3. Y a-t-il d'autres fichiers dans src/ — hors panels/ — qui ne sont importés 
   nulle part et ne sont pas des points d'entrée (main.js, router/index.js) ?

Format de sortie :
src/components/panels/PanelObservateur.vue
  → Importé dans : [aucun] → PEUT ÊTRE SUPPRIMÉ

Écris le résultat complet dans docs/audits/AUDIT_code_mort.md.
En-tête du fichier : date du jour + "Audit code mort et legacy".
Écrase le fichier s'il existe déjà.
Ne propose aucune correction. Confirme quand le fichier est écrit.
```

---

## Étape 2 — Corrections ciblées (un domaine à la fois)

> Avant de commencer une correction, demande à Cursor de lire le fichier d'audit correspondant dans `docs/audits/`. Il n'a pas besoin de refaire l'analyse.

### 2A — Nettoyer les imports inutilisés

```
Lis docs/audits/AUDIT_imports.md.

À partir de ce fichier, supprime les imports et variables inutilisés.

Règles strictes :
- Ne modifier QUE les lignes d'import et les déclarations listées dans l'audit
- Ne pas réécrire la logique existante
- Ne pas reformater le fichier
- Ne pas déplacer de fonctions

Pour chaque fichier modifié, affiche le diff exact (lignes supprimées uniquement).

⛔ STOP OBLIGATOIRE après chaque diff — n'écris rien, n'ouvre aucun fichier, 
n'enchaîne pas sur le suivant. Attends le mot "valide" ou "go" avant de continuer.
```

*Commencer par les fichiers avec le plus d'imports inutilisés.*

---

### 2B — Consolider un doublon (un seul à la fois)

```
Lis docs/audits/AUDIT_doublons.md.

Traite UN SEUL doublon à la fois.

Commence par : [NOM DU DOUBLON — issu du fichier d'audit]

Plan à valider avant toute modification :
1. Quelle version de la fonction est la plus complète / robuste ?
2. Où sera la version canonique (lib/ ou composable/) ?
3. Quels fichiers devront importer la version canonique ?
4. Y a-t-il un risque de régression à signaler ?

Présente le plan uniquement.

⛔ STOP OBLIGATOIRE — n'écris aucun code, n'ouvre aucun fichier, n'applique 
aucune modification tant que tu n'as pas reçu le mot "valide" ou "go".
```

---

### 2C — Extraire une fonction vers lib/ ou composable/

```
Lis docs/audits/AUDIT_composables.md.

Déplace UNE SEULE fonction identifiée dans ce fichier.

Fonction à déplacer : [NOM — issu du fichier d'audit]
Fichier source : [CHEMIN]
Destination proposée : [lib/xxx.js ou composables/useXxx.js]

Avant de modifier quoi que ce soit, confirme :
1. La fonction n'a pas de dépendance sur une ref ou un composant local ?
2. Le fichier de destination existe déjà — dois-je y ajouter l'export, ou créer le fichier ?
3. Quels fichiers importent actuellement la version locale — devront être mis à jour ?

Présente le plan complet uniquement.

⛔ STOP OBLIGATOIRE — n'écris aucun code, n'ouvre aucun fichier, n'applique 
aucune modification tant que tu n'as pas reçu le mot "valide" ou "go".

Une fois validé : modifier la source, modifier la destination, mettre à jour les imports.
Un seul fichier à la fois, diff visible avant chaque écriture.
```

---

## Étape 3 — Refactoring CSS

### 3A — Valeurs hors tokens

```
Mode : audit uniquement — ne touche à aucun fichier source.

Parcoure tous les fichiers .vue dans src/ et tous les fichiers dans src/assets/.

Identifie toutes les valeurs CSS hardcodées qui devraient utiliser un token de 
tokens.css à la place :
- Couleurs hexadécimales (#03060d, #00e5ff, etc.) utilisées dans <style> ou style=""
- Valeurs de font-family écrites en dur (Share Tech Mono, Syne, monospace)
- Espacements récurrents (ex: padding: 12px répété dans 8 fichiers)

Format de sortie :
FICHIER : src/components/TravelWidget.vue
  → color: #00e5ff → devrait être var(--color-cyan)
  → font-family: 'Share Tech Mono' → devrait être var(--font-mono)

Écris le résultat dans docs/audits/AUDIT_css.md, section "Valeurs hors tokens".
En-tête du fichier : date du jour + "Audit CSS".
Crée ou écrase le fichier.
Ne propose aucune correction. Confirme quand le fichier est écrit.
```

---

### 3B — Styles inline à extraire

```
Mode : audit uniquement — ne touche à aucun fichier source.

Dans les templates .vue, identifie les attributs style="" complexes (plus de 
2 propriétés, ou répétés dans plusieurs éléments) qui devraient être des classes CSS.

Rappel des règles du projet :
- Les fichiers CSS sont importés dans main.js (pas de @import entre fichiers CSS)
- Un nouveau fichier CSS doit être ajouté dans main.js après les imports existants
- Les tokens sont dans tokens.css et doivent être utilisés via var(--...)

Format de sortie :
FICHIER : src/components/SideLeft.vue
  → style="display: flex; flex-direction: column; gap: 8px; padding: 12px"
     répété 3 fois → extraire en classe utilitaire

Ajoute le résultat dans docs/audits/AUDIT_css.md, section "Styles inline à extraire".
(Le fichier a été créé par le prompt 3A — ajoute la section sans écraser le reste.)
Ne propose aucune correction. Confirme quand la section est ajoutée.
```

---

### 3C — Remplacer les valeurs hors tokens

```
Lis docs/audits/AUDIT_css.md, section "Valeurs hors tokens".

Traite UN SEUL fichier à la fois.

Commence par le fichier avec le plus d'occurrences.

Pour chaque occurrence identifiée dans l'audit :
- Remplace la valeur hardcodée par la variable CSS correspondante (var(--...))
- Ne touche qu'aux lignes listées dans l'audit
- Ne reformate pas le fichier
- Ne modifie pas la logique ou la structure des règles CSS

Affiche le diff exact avant d'écrire.

⛔ STOP OBLIGATOIRE après chaque diff — n'écris rien, n'ouvre aucun fichier,
n'enchaîne pas sur le suivant. Attends le mot "valide" ou "go" avant de continuer.

Une fois la correction appliquée et confirmée, marque le fichier correspondant
dans docs/audits/AUDIT_css.md avec ✅ en début de ligne.
```

---

### 3D — Extraire les styles inline vers des classes CSS

```
Lis docs/audits/AUDIT_css.md, section "Styles inline à extraire".

Traite UN SEUL cas à la fois.

Commence par le style inline le plus répété.

Plan à valider avant toute modification :
1. Quel nom de classe CSS donner à ce style ? (convention kebab-case, préfixe du composant)
2. Dans quel fichier CSS existant l'ajouter — ou faut-il créer un nouveau fichier ?
   Rappel : tout nouveau fichier CSS doit être ajouté dans main.js après les imports existants.
3. Combien d'occurrences du style inline seront remplacées et dans quels fichiers ?

Présente le plan uniquement.

⛔ STOP OBLIGATOIRE — n'écris aucun code, n'ouvre aucun fichier, n'applique
aucune modification tant que tu n'as pas reçu le mot "valide" ou "go".

Une fois validé :
- Ajouter la classe dans le fichier CSS cible (et main.js si nouveau fichier)
- Remplacer les occurrences style="" dans les templates
- Un fichier à la fois, diff visible avant chaque écriture

Une fois la correction appliquée et confirmée, marque le cas correspondant
dans docs/audits/AUDIT_css.md avec ✅ en début de ligne.
```

---

### 4A — Clôture de session

*Coller à la fin de chaque session Cursor.*

```
Avant de terminer cette session :

Liste les fichiers que tu as modifiés ou créés aujourd'hui.

Pour chacun, réponds à ces trois questions :
1. Y a-t-il une fonction que tu as créée qui devrait aller dans un composable 
   ou dans lib/ plutôt que dans ce fichier ?
2. Y a-t-il un import que tu as ajouté qui duplique quelque chose d'existant ?
3. Y a-t-il une valeur CSS que tu as écrite en dur au lieu d'utiliser un token ?

Si oui pour l'un de ces points, note-le dans TODO_REFACTO.md (crée le fichier 
à la racine s'il n'existe pas) avec le fichier et la ligne concernés.
Ne corrige rien maintenant.
```

---

### 4B — Amorçage de session

*Coller au début de chaque nouvelle session Cursor.*

```
Avant d'écrire du code aujourd'hui, lis les fichiers suivants :
- docs/reference/Documentation-technique.md (structure du projet, conventions)
- docs/design/Design-system.md (tokens, composants, règles CSS)

Règles à respecter impérativement :
- Toute logique réutilisable → composable (src/composables/useXxx.js) ou lib/
- Toute couleur, font, espacement → token CSS via var(--...)
- Aucun @import dans un fichier CSS (tout passe par main.js)
- Si tu vois du code qui devrait être ailleurs, note-le dans TODO_REFACTO.md 
  sans le corriger — sauf si je te le demande explicitement

Composables existants à vérifier avant d'en créer un nouveau :
useSkyStars, useStars3DConception, useStellarSearch, useStarTooltipData, 
useStarSelection, useStoreReady
```

---

## Étape 5 — Mise à jour de la documentation après corrections

À faire en fin de session de nettoyage, une fois toutes les corrections validées.

### 5A — Mises à jour structurelles (Cursor écrit directement)

*Ce que Cursor peut mettre à jour sans validation : structure de fichiers, listes de composables, stores, constantes.*

```
Les corrections de cette session sont terminées. Mets à jour la documentation 
technique pour qu'elle reflète l'état actuel du code.

Lis d'abord :
- docs/reference/Documentation-technique.md
- docs/audits/ (tous les fichiers présents)

Mets à jour uniquement les sections suivantes de Documentation-technique.md :

1. Structure du projet (arbre src/) :
   - Ajouter les fichiers créés pendant la session
   - Supprimer les fichiers supprimés (code mort, legacy vidé)
   - Corriger les descriptions si un fichier a changé de rôle

2. Liste des composables dans src/composables/ :
   - Ajouter les nouveaux composables créés
   - Mettre à jour la description si le rôle a évolué

3. Liste des fichiers dans src/lib/ :
   - Même chose — ajouter, supprimer, corriger

4. Liste des stores dans src/stores/ :
   - Même chose

Pour chaque modification, affiche le diff avant d'écrire.

⛔ STOP OBLIGATOIRE après chaque diff — n'écris rien tant que tu n'as pas 
reçu le mot "valide" ou "go". Traite une section à la fois.

Ne touche pas aux sections Architecture, Stack technique, Base de données, 
Design system, ou Import stellaires — celles-ci nécessitent une validation manuelle.
```

---

### 5A bis — Détection des informations obsolètes (audit, lecture seule)

*Ce que Cursor repère mais ne corrige pas : règles, conventions ou descriptions qui ne correspondent plus au code réel.*

```
Mode : audit uniquement — ne touche à aucun fichier.

Lis docs/reference/Documentation-technique.md dans son intégralité.

Pour chaque section, vérifie si les affirmations du document correspondent 
encore au code réel dans src/. Signale tout passage qui :

- Décrit une règle qui n'est plus respectée dans le code
  (ex. "tous les CSS sont importés dans main.js" — est-ce encore vrai ?)
- Mentionne un fichier, une fonction ou une convention qui a disparu ou changé
- Décrit un comportement que le code implémente différemment aujourd'hui
- Contient une information qui était vraie avant cette session mais ne l'est plus

Format de sortie :
SECTION : Design system et CSS
PASSAGE : "Règle impérative : tous les fichiers CSS sont importés directement dans main.js"
OBSOLÈTE : src/components/XxxYyy.vue contient un @import en ligne depuis cette session
PROPOSITION : [texte de remplacement suggéré, ou "à supprimer"]

Ne modifie aucun fichier. Produis uniquement la liste des écarts.
Écris le résultat dans docs/audits/AUDIT_doc_technique.md.
En-tête : date du jour + "Audit obsolescence Documentation-technique.md".
Confirme quand le fichier est écrit.
```

---

*Ce que Cursor ne peut pas décider seul : règles métier, conventions d'architecture, design system.*

```
Sur la base des corrections effectuées cette session, identifie les passages 
des documents suivants qui ne correspondent plus au code réel :

- docs/reference/Documentation-fonctionnelle.md
- docs/reference/Documentation-technique.md (sections non couvertes par 5A)
- docs/design/Design-system.md

Pour chaque écart détecté, présente :

DOCUMENT : docs/reference/Documentation-fonctionnelle.md
SECTION : Interface > Modules
ÉCART : Le document liste 8 modules mais NavTabButton gère désormais X onglets
PROPOSITION : [texte de remplacement suggéré]
ACTION REQUISE : validation avant modification

Ne modifie aucun fichier. Produis uniquement la liste des écarts et propositions.
```

---

### 5C — Mise à jour du prompt d'amorçage (4B)

*À faire si de nouveaux composables ont été créés pendant la session.*

```
Le prompt d'amorçage de session (dans docs/reference/LACUNA_CURSOR_CLEANUP_PROMPTS.md, 
section 4B) liste les composables existants. 

Compare cette liste avec le contenu actuel de src/composables/.
Si des composables ont été ajoutés ou supprimés, propose la ligne mise à jour.

Ne modifie pas le fichier. Affiche uniquement la correction à apporter.
```

---

Pour les prompts **2B et 2C**, remplacer les crochets `[NOM — issu du fichier d'audit]` par ce que les fichiers `docs/audits/` contiennent. Ce sont des prompts à compléter avant de les coller.

Le fichier `TODO_REFACTO.md` généré par les prompts 4A et 4B devient la file d'attente pour les sessions de refactoring. Le vider lors de chaque session de nettoyage.

Les fichiers dans `docs/audits/` sont **écrasés à chaque nouvel audit** — ils reflètent toujours l'état courant du code, jamais un état passé. Ne pas les versionner comme documentation permanente.

L'ordre étapes 1A → 1D avant toute correction est important : Cursor voit mieux ce qu'il y a à nettoyer en mode lecture seule qu'en mode correction.
