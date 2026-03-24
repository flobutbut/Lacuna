# Diagnostic — État actuel de la vue Radar (toujours pas de défilement)

**Date** : 2025-03  
**Contexte** : Après toutes les corrections, le comportement reste incorrect (« toujours pas »). Diagnostic sans modification de code.

---

## 1. Architecture actuelle

### Flux de données

```
PageObservatoire (onMounted)
  └── radarSpectrogram.start()  → setInterval(tick, 100)
        └── tick() : tickCount++, writeToBuffer(chunk)

RadarView (v-if="isRadarMode")
  └── renderLoop (rAF)
        └── si tickCount !== lastRenderedTick :
              appendColumn()  → writeCol++
              drawViewport()
```

### Points clés

- **Composable** : tourne dès le montage de PageObservatoire, même si l'utilisateur est en mode Sky.
- **RadarView** : monté uniquement en mode Radar (`v-if`).
- **tickCount** : incrémenté toutes les 100 ms par le composable.
- **appendColumn** : appelé uniquement quand `tickCount !== lastRenderedTick` dans le renderLoop.
- **writeCol** : position d'écriture dans l'offscreen circulaire (avance de 1 à chaque appendColumn).

---

## 2. Chaîne de dessin (drawViewport)

### Formules actuelles

- `innerW` = `specCanvas.width - margin.left - margin.right`
- `srcW` = `innerW` (toujours)
- `srcX` = si pause : `((writeCol - innerW - scrollOffset) + HISTORY_SIZE * 2) % HISTORY_SIZE`  
          sinon : `((writeCol - innerW) + HISTORY_SIZE) % HISTORY_SIZE`

### Comportement attendu

- On lit `srcW` colonnes depuis l'offscreen à partir de `srcX`.
- On les dessine sur `innerW` pixels → rapport 1:1.
- À chaque tick, `writeCol` avance → `srcX` avance → fenêtre glissante vers la droite (nouveau à droite, ancien sort à gauche).

---

## 3. Hypothèses de dysfonctionnement

### A) Désynchronisation tickCount / writeCol au premier affichage

Quand l'utilisateur passe en mode Radar :

- Le composable a déjà tourné (ex. tickCount = 5000).
- `prefillOffscreens()` remplit l'offscreen avec l'historique du buffer.
- `writeCol` est initialisé à `numCols % HISTORY_SIZE`.
- `lastRenderedTick` est mis à `tickCount.value` avant le premier `renderLoop`.

Risque : si `prefillOffscreens` et `writeCol` ne sont pas alignés avec `tickCount`, la fenêtre affichée peut être décalée ou vide au démarrage.

### B) BUFFER_DURATION_SEC = 300 (5 min)

Dans `useRadarSpectrogram.js`, `tick()` fait :

```js
if (currentDurationSec >= BUFFER_DURATION_SEC) return
```

Après 5 minutes, le composable arrête d'écrire dans le buffer **et** ne touche plus à `tickCount`. Résultat : plus de nouveaux ticks, plus d’`appendColumn`, plus de défilement. Si l’utilisateur observe après être resté longtemps sur la page, le radar peut sembler figé.

### C) Log du canvas (ligne 194)

Le `console.log('spec canvas', specCanvas.width, specCanvas.getBoundingClientRect().width)` est toujours présent. À vérifier : ces deux valeurs sont-elles identiques ? Si non, il y a scaling/compression.

### D) Rapport 1 colonne = 1 pixel

L’axe X utilise `xPos = margin.left + innerW - i` avec `i` en colonnes. On suppose 1 colonne = 1 pixel. Si ce n’est pas le cas (ex. devicePixelRatio, scaling), les labels et le contenu peuvent être décalés.

### E) Vitesse perçue

- 1 tick = 100 ms → 10 colonnes/s.
- Pour innerW ≈ 1100 px, un renouvellement complet prend ~110 s.
- Le défilement peut sembler très lent si l’utilisateur ne regarde que quelques secondes.

### F) Montage/démontage RadarView

À chaque changement de vue (Sky ↔ Radar), RadarView est démonté puis remonté. Les refs (canvas, offscreen) sont recréés. Si `prefillOffscreens` ou `initCanvases` sont appelés alors que le layout n’est pas stable, les dimensions peuvent être incorrectes.

### G) writeCol après prefillOffscreens

Dans `prefillOffscreens` :

```js
writeCol = Math.min(numCols, HISTORY_SIZE) % HISTORY_SIZE
```

`numCols` = `Math.min(total - WINDOW_SIZE + 1, HISTORY_SIZE)`. Si `total` est petit au démarrage, `writeCol` peut être 0 ou proche de 0. Ensuite `srcX = ((writeCol - innerW) + HISTORY_SIZE) % HISTORY_SIZE` peut donner un index négatif modulo, avec un comportement de fenêtre glissante potentiellement incorrect au tout début.

### H) Composable : tick n’écrit pas à chaque appel

Dans `tick()`, des samples ne sont ajoutés que si `targetSamples > totalSamplesWritten`. `tickCount` est quand même incrémenté à chaque appel. Donc `tickCount` avance même quand il n’y a pas de nouvelles données. `appendColumn` utilise `getBufferSnapshot(WINDOW_SIZE)` (les 256 derniers samples). Si le buffer n’a pas beaucoup changé, on redessine la même colonne. Pas forcément un bug, mais à garder en tête.

---

## 4. Vérifications à faire dans le navigateur

1. **Canvas**  
   - Inspecter le canvas du spectrogramme.  
   - Vérifier : `specCanvas.width` vs `specCanvas.getBoundingClientRect().width`.  
   - Si différents → scaling/compression.

2. **Console**  
   - Regarder la sortie du `console.log` ligne 194.  
   - Vérifier que les valeurs restent cohérentes dans le temps.

3. **tickCount**  
   - Dans la console : `$vm.tickCount` (ou via Vue DevTools) pour voir s’il augmente bien.

4. **Durée d’observation**  
   - Si la page est ouverte depuis plus de 5 min, le défilement peut s’être arrêté (BUFFER_DURATION_SEC).

5. **Scroll en pause**  
   - En mode pause, le scroll horizontal doit déplacer la vue. Si ce n’est pas le cas, vérifier le listener `wheel` et `scrollOffset`.

---

## 5. Synthèse des points sensibles

| Zone | Risque |
|------|--------|
| tickCount vs writeCol | Désynchronisation au premier affichage ou après changement de vue |
| BUFFER_DURATION_SEC | Arrêt du défilement après 5 min |
| Canvas scaling | `width` ≠ `getBoundingClientRect().width` → compression visuelle |
| Vitesse | 10 colonnes/s → défilement lent |
| writeCol / srcX au démarrage | Comportement quand `numCols < innerW` |
| RadarView v-if | Montage/démontage et recréation des ressources à chaque changement de vue |

---

## 6. État du code (référence)

- `srcX` : tient compte de `scrollOffset` en pause.
- `srcW` : toujours égal à `innerW`.
- `canvas.style.width` et `canvas.style.height` : définis en JS après `initCanvases` et dans le ResizeObserver.
- Dimensions : mesurées via `specCanvas.parentElement.clientWidth/Height`.
- Axe X : intervalles de 30 s (INTERVAL_TICKS = 300).
