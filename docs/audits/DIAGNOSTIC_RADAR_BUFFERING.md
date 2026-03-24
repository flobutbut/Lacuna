# Diagnostic — Écran noir entre overlay buffering et affichage des graphiques

**Date** : 2025-03  
**Contexte** : L'overlay "INITIALISATION DU RÉCEPTEUR" s'affiche puis disparaît. Entre sa disparition et l'apparition des graphiques, l'utilisateur voit un écran noir pendant une durée variable.

---

## 1. Symptôme observé

1. **Overlay visible** : "INITIALISATION DU RÉCEPTEUR" + barre de progression + pourcentage
2. **Overlay disparaît** : `isBuffering` passe à `false`
3. **Écran noir** : période de X ms à Y secondes
4. **Graphiques apparaissent** : spectrogramme et courbe d'intensité s'affichent

---

## 2. Chaîne de montage et flux actuel

- **PageObservatoire** : RadarView avec `v-if="isRadarMode"`. Au clic sur "Radar", le composant monte.
- **Ordre onMounted** : nextTick → rAF → initSpectrogram → tick interval → waitForLayout → initCanvases (fillInitialColumns + 600ms + drawViewport + double rAF) → isBuffering=false → renderLoop → rAF (updateContainerWidth, updateHeights, scroll)
- **ResizeObserver** : attaché à `containerRef` et `chartsWrapRef` juste après.

---

## 3. Cause principale : ResizeObserver efface les canvases

### Comportement HTML5 Canvas

**Assigner `canvas.width` ou `canvas.height` réinitialise le canvas et efface tout son contenu.** C'est un comportement standard de la spec.

### Ce que fait le ResizeObserver

```javascript
resizeObserver = new ResizeObserver(() => {
  // ...
  spectrogramCanvasRef.value.width = contentWidthPx.value
  spectrogramCanvasRef.value.height = spectrogramHeight.value
  intensityCanvasRef.value.width = contentWidthPx.value
  intensityCanvasRef.value.height = intensityHeight.value
  // ...
})
```

Chaque fois que le callback s'exécute, il **efface les canvases visibles**.

### Séquence qui provoque l'écran noir

1. `initCanvases` : `drawViewport()` dessine correctement sur les canvases.
2. Double rAF, puis `isBuffering = false` → l'overlay disparaît.
3. **Immédiatement après** : `resizeObserver.observe(containerRef)` et `observe(chartsWrapRef)`.
4. **Le ResizeObserver déclenche quasi systématiquement** au premier `observe()` avec la taille courante.
5. Le callback du ResizeObserver s'exécute : `canvas.width = ...` et `canvas.height = ...` → **contenu des canvases effacé**.
6. L'utilisateur voit : overlay parti, canvases vides (noir/fond).
7. Les graphiques ne réapparaissent qu'au prochain `drawViewport()` : lorsque `tickCount` change ou qu'un autre événement déclenche un redraw.

---

## 4. Cause secondaire : callback rAF + watch → recréation des offscreens

### Ordre d'exécution

Après `renderLoop()`, un `requestAnimationFrame` lance :

```javascript
updateContainerWidth()
updateHeights()  // peut modifier spectrogramHeight, intensityHeight
nextTick(() => { scroll... })
```

### Effet de `updateHeights()`

Si `updateHeights()` change `spectrogramHeight` ou `intensityHeight` (par rapport aux valeurs utilisées dans `waitForLayout`), le **watch** se déclenche :

```javascript
watch([radarFrequencyBand, spectrogramHeight, intensityHeight], () => {
  specOffscreen = new OffscreenCanvas(...)  // recréation
  intOffscreen = new OffscreenCanvas(...)
  fillInitialColumns()  // async, non awaited
})
```

- Les **offscreens sont recréés** (nouveaux canvases vides).
- `fillInitialColumns()` est lancé en async, sans `await`.
- Pendant ce temps, le contenu des canvases visibles a déjà pu être effacé par le ResizeObserver.
- Les graphiques ne reviennent qu'une fois `fillInitialColumns` terminé **et** un nouveau `drawViewport()` exécuté (via `tickCount` ou autre).

---

## 5. Autres facteurs aggravants

### ResizeObserver au premier observe

Au moment de `observe()`, le ResizeObserver envoie en général un premier callback avec la taille actuelle. Donc même sans vrai redimensionnement, le callback peut s'exécuter **juste après** notre premier draw, et effacer les canvases.

### Cohérence des dimensions

Les canvases ont `:width="contentWidthPx"` et `:height="spectrogramHeight"` dans le template. Le ResizeObserver réassigne `width` et `height` en JavaScript. Si les valeurs sont identiques, l’assignation efface quand même le canvas. Le problème n’est pas l’incohérence, mais **l’assignation elle-même**, qui provoque un clear.

### Timing Vue / rAF / ResizeObserver

L’ordre exact des callbacks (rAF, ResizeObserver, microtasks Vue) varie selon le navigateur et la charge. Selon le timing, le ResizeObserver peut s’exécuter avant ou après la suppression de l’overlay, mais dans tous les cas il efface le contenu des canvases à un moment critique.

---

## 6. Synthèse des causes

| Cause | Probabilité | Mécanisme |
|-------|-------------|-----------|
| **ResizeObserver efface les canvases** | Très haute | Assignation `canvas.width/height` → clear. Déclenchement au premier `observe()` ou lors de changements de layout. |
| Callback rAF + `updateHeights` | Moyenne | Change `spectrogramHeight`/`intensityHeight` → watch recrée les offscreens, `fillInitialColumns` async → délai avant nouveau draw. |
| Ordre Vue / rAF / ResizeObserver | Moyenne | L’overlay part, le ResizeObserver efface, l’utilisateur voit le noir avant le prochain `drawViewport`. |

---

## 7. Pistes de correction (sans code)

1. **Ne pas effacer les canvases dans le ResizeObserver**  
   Vérifier si les dimensions ont réellement changé avant d’assigner `width`/`height`. Si oui, redimensionner puis **redessiner immédiatement** avec `drawViewport()` au lieu de laisser les canvases vides.

2. **Déplacer l’attachement du ResizeObserver**  
   Attacher le ResizeObserver **avant** le premier `drawViewport`, et gérer le premier callback de façon à ne pas effacer après notre draw initial (ex. flag « init faite », ou ne pas toucher aux dimensions tant que `isBuffering` est true).

3. **Redessiner après chaque modification de dimensions**  
   Dans le callback du ResizeObserver, après toute modification de `width`/`height`, appeler systématiquement `drawViewport()` pour réafficher le contenu.

4. **Éviter les assignations redondantes**  
   Comparer les nouvelles dimensions aux dimensions actuelles des canvases avant d’assigner. Si identiques, ne pas assigner (et donc ne pas provoquer de clear).

5. **Reporter la mise à jour de layout post-init**  
   Le rAF qui appelle `updateHeights()` peut changer les hauteurs après l’init. Soit le déplacer avant `initCanvases`, soit faire en sorte que ces changements ne déclenchent pas d’effacement (ou déclenchent un redraw immédiat).

6. **Garde sur le watch spectrogramHeight / intensityHeight**  
   Éviter de recréer les offscreens pendant la phase de buffering initial, ou s’assurer qu’un redraw a lieu dès que `fillInitialColumns` est terminé.
