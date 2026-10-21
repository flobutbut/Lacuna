# Diagnostic — Désynchronisation apparente RadarView vs RadarMiniature

**Date** : 2026-03  
**Fichiers** : `src/views/observatoire/RadarView.vue`, `src/components/RadarMiniature.vue`  
**Correction** : le sujet n’est **pas** le spectrogramme vs intensité *dans* RadarView, mais la **vue radar pleine page** vs la **miniature** dans la colonne latérale.  
**Analyse uniquement** — pas de modification de code dans ce document.

> **Mise à jour 21/10/2026** — Ce diagnostic décrit l'état de mars (miniature à 220 colonnes fixes), qui n'existe plus : la miniature lit une colonne par pixel CSS. Tests dans le navigateur et corrections :
>
> - **Buffer effacé et reconstruit** au premier affichage de la vue Radar et à chaque redimensionnement, avec un pas d'un échantillon (4 ms) au lieu d'un tick (100 ms) et sans pulsars : ~17 s affichées comme ~1 min 30, contenu de la miniature changé. **Corrigé** : buffer créé une fois (`useRadarColumnBuffer`), jamais vidé ; une colonne par tick, rattrapage tick par tick.
> - **Redessin continu même masqué** : vue ciel à ~19 images/s radar actif. **Corrigé** : dessin seulement quand la vue Radar est affichée et que l'image change ; rendu par `ImageData` (2–4 ms au lieu de 51 ms).
> - **Échelles 1 s / 10 s** au-delà de l'historique : rebouclage sur le buffer circulaire, données mélangées, repères de temps absents. **Corrigé** : maximum par pixel, rien au-delà de l'historique.
> - **Sélection de zone** : fréquences inversées et zoom ignoré (zone 94→63 Hz émise 30→61 Hz). **Corrigé** (61,5→94,7 Hz).
> - **Radar coupé puis rallumé** : plus d'échantillons tant que le temps n'avait pas rattrapé la session précédente. **Corrigé** (`start()`).
>
> - **Réglages sans effet** (second passage) : 10 ms identique à 100 ms, seuil INT. sans effet jusqu'à ~30 puis tout masqué vers 75, affichage presque noir (normalisation sur le maximum absolu, dominé par les pulsars), bandes quasi identiques (niveau de bruit annulé par la normalisation, mêmes 32 pulsars dans toutes les bandes), bouton bruit sans effet visible, spectre du bruit affiché à l'envers (raie de 12,5 Hz vers 111 Hz). **Corrigé** : échelle en dB sur la fenêtre visible (vue et miniature), bruit par bande, pulsars de la bande active calibrés sur le bruit, 10 ms = zoom ×10, seuil linéaire sur l'échelle dB, ordre des fréquences de la FFT rétabli.
>
> - **Pulsations invisibles** après ce second passage : les pulsars étaient dessinés après la FFT, à la hauteur de leur fréquence de rotation ; les lents (seuls à pouvoir « battre ») tombaient dans les bins 1 à 3, sous le bruit basse fréquence. **Corrigé** : impulsions ajoutées au signal temporel avant la FFT, fenêtre de 256 ms (Hann) : barre verticale par impulsion, raies et harmoniques pour les pulsars rapides, courbe d'intensité au niveau moyen.
>
> **Toujours ouvert** : la miniature affiche les dernières colonnes en direct (sa largeur en pixels), sans la fenêtre ni le défilement de la vue Radar — comportement à décider.

---

## 1. Ce qui est identique entre les deux

| Élément | RadarView | RadarMiniature |
|---------|-----------|----------------|
| Buffer | `inject('radarColumnBuffer')` — `writeCol`, `columnBuffer`, `specMaxVal` | idem |
| `ticksPerPx` | `getTicksPerPx()` → `max(1, round(radarTimeScale / TICK_MS))` avec `TICK_MS = 100` | **même formule** (l.84–85) |
| Pas en **colonnes buffer** entre deux indices horizontaux consécutifs | Entre `px` et `px+1` : Δ`colOffset` = `ticksPerPx` | Entre `px` et `px+1` : Δ`colOffset` = `ticksPerPx` |

Donc **une unité d’index horizontal** (`px`) avance de **`ticksPerPx` colonnes logiques** dans le buffer, des deux côtés — la définition de « une case temps » par pas est la même.

---

## 2. Écart 1 — Nombre de colonnes d’échantillonnage horizontal : `innerW` vs `COL_COUNT`

### RadarView

- Boucle : `for (let px = 0; px < innerW; px++)`
- `innerW = specCanvas.width - margin.left - margin.right` (**dynamique**, ordre de grandeur ~centaines de px selon la fenêtre)
- `colOffset = (innerW - 1 - px) * ticksPerPx` puis soustraction du scroll dans `colIdx` (voir §3)

**Fenêtre temporelle couverte** (en « pas » de colonnes buffer entre bord gauche et bord droit du tracé utile) :

`≈ (innerW - 1) * ticksPerPx` (à l’offset de scroll près).

### RadarMiniature

- Boucle : `for (let px = 0; px < COL_COUNT; px++)` avec **`COL_COUNT = 220`** (valeur actuelle dans le dépôt — si tu avais « 40 » en tête, ce n’est pas ce que lit le code aujourd’hui)
- Largeur canvas : `w = wrap.clientWidth` ; chaque slot occupe `colW = w / COL_COUNT` pixels
- `colOffset = (COL_COUNT - 1 - px) * ticksPerPx`

**Fenêtre temporelle couverte** :

`≈ (COL_COUNT - 1) * ticksPerPx`.

### Conséquence

Pour un même `radarTimeScale` (donc un même `ticksPerPx`), **la durée d’histoire affichée** est proportionnelle au nombre de pas horizontaux :

`innerW` **≠** `COL_COUNT` ⇒ **les deux vues ne montrent pas la même échelle temps / la même « compression »**.

Exemple typique : `innerW ≈ 600–800`, `COL_COUNT = 220` ⇒ la vue principale couvre **~3× plus de colonnes buffer** que la miniature. Un même événement dans le buffer occupe une **largeur en pixels différente** : en miniature il est « tassé » sur moins de **slots** (220) qu’en vue pleine (**innerW** slots).

**Ce n’est pas deux vitesses de lecture du buffer** (le `writeCol` est partagé), mais **deux échelles spatiales différentes pour le même axe temps** → impression de défilement ou de « vitesse » différente à l’œil.

---

## 3. Écart 2 — Terme de scroll : présent dans RadarView, absent dans RadarMiniature

### Formule effective de `colIdx` (vue principale)

```text
colIdx = (writeCol - 1 - colOffset - round(currentScrollOffset * ticksPerPx) + …) % HISTORY_SIZE
```

avec `colOffset = (innerW - 1 - px) * ticksPerPx`.

### Formule miniature

```text
colIdx = (writeCol - 1 - colOffset + …) % HISTORY_SIZE
```

avec `colOffset = (COL_COUNT - 1 - px) * ticksPerPx` — **aucun** `currentScrollOffset`.

**Conséquence** : dès que l’utilisateur est en **pause** et **défile** (ou n’est pas au « live »), RadarView affiche une **fenêtre historique** ; RadarMiniature affiche **toujours le bord live** du buffer. Les deux graphes **ne montrent plus les mêmes colonnes** aux mêmes positions à l’écran — désynchronisation **totale** sur le contenu, pas seulement une différence d’échelle.

---

## 4. Synthèse « écart exact » sur `colOffset` / `ticksPerPx`

| Quantité | RadarView | RadarMiniature |
|----------|-----------|----------------|
| `ticksPerPx` | `round(radarTimeScale/100)` | **identique** |
| `colOffset` (sans scroll) | `(innerW - 1 - px) * ticksPerPx` | `(COL_COUNT - 1 - px) * ticksPerPx` |
| **Écart structurel** | Max `colOffset` ≈ `(innerW-1)*ticksPerPx` | Max `colOffset` ≈ `(COL_COUNT-1)*ticksPerPx` |
| Terme scroll dans `colIdx` | `- round(currentScrollOffset * ticksPerPx)` | **0** (jamais appliqué) |

- **Même `ticksPerPx`** ⇒ même **densité en colonnes buffer par pas d’index** `px`.
- **`innerW` vs `COL_COUNT`** ⇒ **longueur différente de la fenêtre temps** sur l’axe horizontal → échelle et vitesse **visuelle** différentes pour un même défilement du buffer.
- **`currentScrollOffset`** ⇒ miniature **figée sur le présent** du buffer ; la vue principale peut être **décalée** → contenu différent dès qu’on n’est pas en live aligné.

---

## 5. Ancienne section (hors sujet ici)

L’analyse « spectrogramme vs intensité **dans** RadarView » reste valable pour **un seul** `drawViewport()` : une boucle, un `innerW`, un scroll — pas deux vitesses internes. Elle ne répond pas à la comparaison **RadarView / RadarMiniature**.

---

*Document de diagnostic — analyse uniquement.*
