# Diagnostic — Les graphiques se compressent plutôt que de défiler

**Date** : 2025-03  
**Contexte** : Après le refactoring, le spectrogramme et la courbe d'intensité semblent se compresser horizontalement au lieu de défiler (nouveau à droite, ancien à gauche).

---

## 1. Cause racine : CSS `width: 100%` sur le canvas

### Règle concernée

```css
.radar-view__canvas {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--color-bg);
}
```

### Effet

- Le canvas a **:width="contentWidthPx"** (attribut HTML), qui augmente avec `tickCount` : 500, 1000, 2000, 3600 px…
- En parallèle, **width: 100%** le rend à 100 % de la largeur du parent (`.radar-view__spectrogram`).
- Le parent est contraint par le viewport (ex. ~1200 px).

Résultat : un buffer dessiné de 3000 px est affiché dans ~1200 px. Le navigateur **réduit** l’image pour qu’elle tienne dans le conteneur.

### Conséquence au fil du temps

- `contentWidthPx` augmente à chaque tick.
- La zone dessinée grandit (3000 → 4000 → 5000 px…).
- La largeur affichée reste ~1200 px (taille du conteneur).
- Plus le temps passe, plus la même largeur affichée représente de données → sensation de **compression**.

---

## 2. Comportement attendu vs réel

### Attendu (défilement)

- Largeur visible fixe (ex. 1200 px).
- Affichage 1 px = 1 colonne (ou rapport fixe).
- Les nouvelles colonnes apparaissent à droite.
- L’ancien contenu “sort” à gauche, comme un ruban qui défile.

### Réel (compression)

- La zone dessinée grandit avec `contentWidthPx`.
- Le canvas est forcé à `width: 100%` du conteneur.
- Tout le contenu est redimensionné pour tenir dans la fenêtre.
- L’utilisateur voit l’intégralité de l’historique comprimé dans la même largeur.

---

## 3. Logique actuelle de `contentWidthPx`

```javascript
contentWidthPx = max(containerWidth, tickCount)
```

- Le canvas et la div `.radar-view__content` ont une largeur = `contentWidthPx`.
- L’idée est d’avoir une zone scrollable horizontale dont la largeur augmente avec le temps.

Mais `width: 100%` sur le canvas contredit cela : le canvas ne garde pas sa taille intrinsèque, il est étiré/compressé pour remplir le parent. Comme le parent est en flex et limité par le viewport, on obtient la compression.

---

## 4. Rôle du conteneur flex

```
.radar-view__content  (width: contentWidthPx)
  └── .radar-view__charts  (flex: 1, min-width: 0)
        └── .radar-view__spectrogram  (flex: 2)
              └── canvas  (width: 100%)
```

- `.radar-view__content` a `min-width: 100%`, donc elle s’étire au moins à la largeur du scroll.
- `.radar-view__charts` a `flex: 1` et `min-width: 0`, ce qui le fait se redimensionner selon l’espace disponible.
- En pratique, la zone des graphiques reste proche de la largeur du viewport.
- Le canvas en `width: 100%` occupe toute cette largeur et voit son contenu scalé en conséquence.

---

## 5. Pistes de correction

1. **Supprimer `width: 100%` sur le canvas**  
   Laisser le canvas à sa largeur intrinsèque (`contentWidthPx`).  
   Risque : dépassement horizontal si le parent ne gère pas bien l’overflow.

2. **Wrapper avec overflow**  
   Mettre le canvas dans un conteneur en `overflow-x: auto` (ou similaire) avec une largeur minimale = `contentWidthPx`, sans `width: 100%` sur le canvas.

3. **Ne pas dessiner sur toute la timeline**  
   Adopter une largeur de dessin fixe (ex. largeur du viewport) et faire défiler uniquement les données affichées (fenêtre glissante), sans augmenter `contentWidthPx` indéfiniment.

4. **Modifier la structure CSS**  
   S’assurer que le parent du canvas a une largeur explicite = `contentWidthPx` et que le canvas n’est pas redimensionné par un `width: 100%` ou autre règle qui l’adapte au viewport.

---

## 6. Synthèse

| Élément                         | Effet sur l’affichage                    |
|---------------------------------|------------------------------------------|
| `contentWidthPx` croissant      | Zone dessinée de plus en plus large      |
| `width: 100%` sur le canvas     | Affichage forcé à la largeur du parent   |
| Parent limité au viewport       | Compression du contenu dessiné           |
| Résultat                        | Compression au lieu de défilement        |

La cause directe est le **CSS `width: 100%`** qui annule l’intention de zone scrollable large et provoque un redimensionnement du canvas à la taille du viewport.
