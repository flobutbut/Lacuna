# Diagnostic — Scroll inversé et zone de sélection spectrogramme

**Date** : 2025-03  
**Contexte** : Scroll horizontal inversé en pause ; zone de sélection sur le spectrogramme inversée ; question sur une éventuelle inversion du graphique lui-même.

---

## 1. Scroll horizontal — correction appliquée

### Problème

Le sens du scroll était inversé par rapport à l’attente utilisateur.

### Cause

`targetScrollOffset += delta` : une molette vers le bas (deltaY > 0) ou un trackpad vers la droite (deltaX > 0) augmentait l’offset, alors que l’utilisateur s’attend plutôt à :
- **Scroll down / droite** → voir du contenu **plus récent** (se rapprocher du live)
- **Scroll up / gauche** → voir du contenu **plus ancien** (remonter dans l’historique)

Avec `+=`, scroll down augmentait `scrollOffset`, donc on affichait des données plus anciennes (comportement inverse).

### Correction

`targetScrollOffset -= delta` pour aligner le scroll avec l’intuition :
- Scroll down / droite → `scrollOffset` diminue → vue plus récente
- Scroll up / gauche → `scrollOffset` augmente → vue plus ancienne

---

## 2. Système de coordonnées — référence

### Axe X (temps)

- **Gauche** = passé (données anciennes)
- **Droite** = présent (données récentes)
- `srcX` = colonne de l’offscreen à gauche du viewport
- `colsToPx(col)` : `rel = (col - srcX + HISTORY_SIZE) % HISTORY_SIZE` → `margin.left + rel`
- Colonne plus grande → pixel plus à droite (si dans la fenêtre visible)

### Axe Y (fréquence) du spectrogramme

**spectrogramData.js** (ligne 224) :
```js
for (let r = freqBins - 1; r >= 0; r--) row.push(fftRow[r])
```
Les bins FFT sont inversés : `magnitudes[0]` = haute fréquence, `magnitudes[127]` = basse fréquence.

**RadarView** :
```js
specCtx.fillRect(col, margin.top + row * (innerH / FREQ_BINS), 1, ...)
```
- `row = 0` → dessin en haut → haute fréquence
- `row = 127` → dessin en bas → basse fréquence

**Axe Y des labels** :
```js
yScaleSpec(f) = specInnerH * (1 - (f - fDomain[0]) / (fDomain[1] - fDomain[0]))
```
- `f` max → `y = 0` (haut)
- `f` min → `y = specInnerH` (bas)

Donc : **haut = haute fréquence**, **bas = basse fréquence** (convention spectrogramme classique).

---

## 3. Sélection — mapping pixel ↔ colonne/bin

### pxToCol (axe X)

```js
rel = Math.floor(px - margin.left)
return (srcX + rel) % HISTORY_SIZE
```
- Pixel gauche → colonne plus petite (passé)
- Pixel droite → colonne plus grande (futur)
- Cohérent avec l’affichage.

### pxToBin (axe Y)

```js
rel = py - margin.top
bin = Math.floor((1 - rel / innerH) * FREQ_BINS)
```
- `py` en haut (`rel ≈ 0`) → `bin ≈ 127` (haute fréquence)
- `py` en bas (`rel ≈ innerH`) → `bin ≈ 0` (basse fréquence)

Donc **pxToBin est aligné** avec le spectrogramme (haut = haute fréquence).

### colsToPx (sélection)

```js
rel = (col - srcX + HISTORY_SIZE) % HISTORY_SIZE
return margin.left + rel  // si rel < innerW
```

Cohérent pour des colonnes dans la fenêtre visible. En revanche, si la sélection dépasse le wrap du buffer circulaire, `rel` peut sortir de `[0, innerW)` et `colsToPx` renvoie `null` → la sélection peut être tronquée ou absente.

### Dessin de la zone (drawSelection)

```js
b0 = Math.min(selectionStartBin, selectionEndBin)
b1 = Math.max(selectionStartBin, selectionEndBin)
top = margin.top + (b0 / FREQ_BINS) * specInnerH
h = ((b1 - b0 + 1) / FREQ_BINS) * specInnerH
```

- `b0` = bin le plus petit (= basse fréquence = bas du spectrogramme)
- `b1` = bin le plus grand (= haute fréquence = haut du spectrogramme)

Actuellement, `top` est calculé avec `b0` : la zone part du **haut** quand on prend le bin minimum. Or le bin minimum correspond au **bas** du spectrogramme. Il y a donc une inversion verticale de la zone de sélection.

---

## 4. Inversion de la zone de sélection (Y)

### Problème

Le mapping actuel place :
- `b0` (basse fréquence) en `top` → zone qui commence en haut
- `b1` (haute fréquence) en `top + h` → zone qui se termine en bas

Alors que dans le spectrogramme :
- Basse fréquence = bas (`row` grand)
- Haute fréquence = haut (`row` petit)

Donc `b0` devrait être en bas, pas en haut.

### Correction à apporter

Inverser le calcul de `top` et de la hauteur pour la sélection :

```js
// b0 = basse fréquence = bas du graphique
// b1 = haute fréquence = haut du graphique
top = margin.top + (1 - (b1 + 1) / FREQ_BINS) * specInnerH   // haut = b1
height = ((b1 - b0 + 1) / FREQ_BINS) * specInnerH
```

Ou, avec la convention actuelle du dessin (row = bin) :
```js
top = margin.top + (FREQ_BINS - 1 - b1) / FREQ_BINS * specInnerH
height = (b1 - b0 + 1) / FREQ_BINS * specInnerH
```

(Car dans le dessin, `row` est utilisé tel quel : row 0 = haut, row 127 = bas. Et row 0 = haute freq, row 127 = basse freq. Donc bin 0 = bas, bin 127 = haut. Pour la sélection : `top` doit être la position du bin le plus grand (haut), `top + height` celle du bin le plus petit (bas).)

---

## 5. Graphique inversé ?

### État actuel

- **Haut** = haute fréquence
- **Bas** = basse fréquence
- Aligné avec les labels d’axe (f max en haut, f min en bas)

C’est une convention courante (comme un clavier piano). Une autre convention met la basse fréquence en bas (temps qui monte).

Sans demande explicite, on garde la convention actuelle. Le problème signalé concerne plutôt la **zone de sélection** (position verticale), pas l’orientation globale du spectrogramme.

---

## 6. Synthèse

| Élément                    | État                               | Action                      |
|---------------------------|------------------------------------|-----------------------------|
| Scroll horizontal         | Inversé                            | Corrigé : `targetScrollOffset -= delta` |
| Zone de sélection (Y)     | pxToBin inversé (haut→127, bas→0)  | Corrigé : `rel/innerH` au lieu de `1-rel/innerH` |
| Spectrogramme (orientation)| Haut = haute freq                | Pas de changement prévu     |
| colsToPx / pxToCol        | OK                                 | —                           |
| pxToBin                   | Corrigé                            | Aligné avec le spectrogramme |

---

## 7. Correction appliquée pour la sélection (Y)

La cause était **pxToBin** : il renvoyait 127 pour le haut et 0 pour le bas, alors que le spectrogramme a row 0 (haute fréquence) en haut et row 127 (basse fréquence) en bas.

**Correction** : `bin = Math.floor((rel / innerH) * FREQ_BINS)` au lieu de `(1 - rel / innerH)`.
- Clic en haut → bin 0 (haute fréquence)
- Clic en bas → bin 127 (basse fréquence)

Cohérent avec le dessin du spectrogramme.
