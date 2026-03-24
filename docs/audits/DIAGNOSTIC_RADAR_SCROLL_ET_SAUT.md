# Diagnostic complet — Scroll et saut du graphique Radar

**Date** : 2025-03  
**Contexte** : Scroll cassé après dernière modification ; graphique qui « saute » et avance d’un coup après un moment ; sélection OK. **Aucune modification de code.**

---

## 1. État actuel du scroll (ligne 334)

```js
targetScrollOffset -= delta
```

- **delta** : `e.deltaX` ou `e.deltaY` selon la composante dominante
- **Effet** : scroll vers le bas (deltaY > 0) → `targetScrollOffset` diminue → vue vers le live
- **Effet** : scroll vers le haut (deltaY < 0) → `targetScrollOffset` augmente → vue vers le passé

### Si le scroll semble inversé

Pour retrouver le comportement d’avant, remplacer par :

```js
targetScrollOffset += delta
```

---

## 2. Saut du graphique « au bout d’un moment »

### 2.1 Hypothèse principale : reprise du live après pause

**Scénario** :
- L’utilisateur met en pause → `frozenWriteCol = writeCol` (ex. 1000)
- Pendant la pause, `appendColumn()` continue → `writeCol` avance (1001, 1002, … 1500)
- L’utilisateur reprend le live → `viewWriteCol` repasse de `frozenWriteCol` à `writeCol`
- `srcX` change brutalement pour suivre `writeCol` (500 colonnes plus loin)
- La vue saute de plusieurs secondes vers le présent → effet de saut important

**Cause** : passage instantané de `frozenWriteCol` à `writeCol` sans transition.

---

### 2.2 Hypothèse : tickCount qui bondit (tab en arrière-plan)

**Mécanisme** :
- En arrière-plan, `setInterval(tick, 100)` peut être ralenti ou groupé
- Au retour au premier plan, plusieurs ticks s’exécutent d’un coup → `tickCount` augmente fortement (ex. +50)
- `appendColumn()` n’est appelée qu’**une seule fois** par changement de `tickCount` (une fois par frame)
- Conséquence : beaucoup de colonnes intermédiaires ne sont jamais écrites dans l’offscreen
- L’offscreen contient des « trous » (colonnes jamais remplies)
- À l’affichage, cela peut produire des zones vides ou des sauts visuels

---

### 2.3 Hypothèse : ResizeObserver

**Mécanisme** :
- Le ResizeObserver modifie `specCanvas.width/height` et recrée les offscreens
- Il appelle `prefillOffscreens()` qui remplit tout l’historique
- `writeCol` est réinitialisé à `numCols % HISTORY_SIZE`
- La vue passe à un nouvel état complet → impression de saut

---

### 2.4 Hypothèse : wrap du buffer circulaire

**Données** :
- `HISTORY_SIZE = 3600`
- `writeCol` fait un modulo à chaque colonne

**Risque** :
- Si la formule `srcX` ou la logique de wrap a un cas limite, un dépassement de `HISTORY_SIZE` peut provoquer un saut visuel.
- La formule actuelle :  
  `srcX = ((viewWriteCol - innerW - Math.round(currentScrollOffset)) + HISTORY_SIZE * 10) % HISTORY_SIZE`

---

### 2.5 Hypothèse : BUFFER_DURATION_SEC = 300 (5 min)

**Mécanisme** :
- Après 5 minutes, `tick()` retourne sans incrémenter `tickCount` ni écrire
- Le radar se fige
- Un changement de vue ou un remontage de `RadarView` peut réinitialiser ou recharger les données → possible saut au remontage

---

## 3. Sélection

- L’utilisateur indique que la sélection fonctionne correctement.
- Ne pas modifier `pxToBin` ni la logique de `drawSelection`.

---

## 4. Rappel des modifications récentes (à éviter si non validées)

1. **Scroll** : passage de `+= delta` à `-= delta` (ligne 334)
2. **pxToBin** : passage de `(1 - rel/innerH)` à `(rel/innerH)` (lignes 358–359)

---

## 5. Pistes de correction (pour plus tard)

### Scroll

- Si le scroll ne correspond pas à l’attente : réessayer `targetScrollOffset += delta` (annuler le `-=`).

### Saut à la reprise du live

- Introduire une transition progressive :  
  au lieu de repasser directement à `writeCol`, interpoler entre `frozenWriteCol` et `writeCol` sur quelques frames.
- Ou : réinitialiser `writeCol` à `frozenWriteCol` à la reprise, puis laisser le rattrapage se faire via l’easing (à préciser selon le comportement souhaité).

### Saut lié à tickCount

- Boucler sur les ticks manqués :  
  tant que `tickCount !== lastRenderedTick`, appeler `appendColumn()` en boucle (avec un seuil max pour éviter de bloquer).

---

## 6. Synthèse

| Problème           | Hypothèse principale                          | Piste de correction          |
|--------------------|-----------------------------------------------|------------------------------|
| Scroll inversé     | `-= delta` ne correspond pas à l’attente      | Revenir à `+= delta`         |
| Saut du graphique  | Passage brutal de `frozenWriteCol` à `writeCol` | Transition progressive       |
| Saut périodique    | ResizeObserver, ticks groupés, wrap           | À investiguer si persistant  |
