*Dernière modification : 2026-03-12 15:11*

# Analyse — Éléments répétés et composables potentiels

*Mars 2026 — Audit projet Lacuna*

---

## 1. Classement par criticité et facilité

| Élément | Criticité | Facilité | Priorité | Statut |
|---------|-----------|----------|----------|--------|
| **barWidth** | Moyenne | Facile | 1 | ✅ Fait |
| **formatDate** | Basse | Facile | 2 | ✅ Fait |
| **formatRelativeTime** | Moyenne | Moyenne | 3 | ✅ Fait |
| **OBJECT_TYPES** | Haute | Moyenne | 4 | ✅ Fait |
| **barClass/valClass** | Basse | Facile | 5 | ✅ Fait |
| **formatRaDec** | Basse | Facile | 6 | ✅ Fait |
| **Pattern store.fetch()** | Moyenne | Difficile | 7 | ✅ Fait |

### Légende

**Criticité**
- **Haute** — Risque d’incohérence UX (labels différents selon la page), maintenance pénible, sources multiples à garder alignées
- **Moyenne** — Duplication avérée, maintenance plus lourde, risque de divergence à moyen terme
- **Basse** — Un seul usage ou impact limité, pas de doublon critique

**Facilité**
- **Facile** — 1 fichier à créer, 1–2 lignes à modifier par fichier, logique simple
- **Moyenne** — Plusieurs fichiers, logique à unifier (variantes, options), mapping à comprendre
- **Difficile** — Refactoring large, 6+ composants, APIs hétérogènes, risque de régression

### Matrice visuelle

```
                    Facilité
            Facile    Moyenne   Difficile
         ┌──────────┬──────────┬──────────┐
Haute    │          │ OBJECT_  │          │
Criticité│          │ TYPES    │          │
Moyenne  │ barWidth │ format   │ store.   │
         │ formatDate│ Relative │ fetch()  │
Basse    │ barClass │ Time     │          │
         │ formatRaDec          │          │
         └──────────┴──────────┴──────────┘
```

---

## 2. Résumé des doublons

| Élément | Fichiers concernés | Recommandation |
|--------|--------------------|----------------|
| **barWidth** | PageSystemes, PagePopulation | Lib partagée |
| **barClass / valClass** | SideLeft (pour l’instant) | Composable si réutilisé |
| **OBJECT_TYPES (labels)** | ObservatoirePanel, PageLaboratoire, systemObjects | Constantes partagées |
| **formatRaDec** | ObservatoireAzimuth | Lib si réutilisé |
| **Temps relatif (ago)** | SideLeft (receivedAgo), PageDrake (formatLastUpdated) | Lib formatRelativeTime |
| **formatDate (fr-FR)** | PageArtefacts (formatInterpretationDate) | Lib formatUtils |
| **Pattern store.fetch()** | 6+ composants | Composable useStoreReady (optionnel) |

---

## 3. Détail des doublons

### 3.1 `barWidth(val)` — identique à deux endroits

**Code actuel (identique) :**
```js
function barWidth(val) {
  return Math.round((val || 0) * 100) + '%'
}
```

| Fichier | Usage |
|---------|--------|
| `src/views/PageSystemes.vue` | Barres indicateurs (plasmaShield, hull, reservoir, etc.) |
| `src/views/PagePopulation.vue` | Barres (will, cohesion, food, care) |

**Recommandation :** Créer `src/lib/formatUtils.js` (ou étendre un fichier existant) et exporter `barWidth(val)`. Import dans les deux vues.

---

### 3.2 `barClass(pct)` / `valClass(pct)` — seuils 0.8 / 0.5

**Code actuel (SideLeft.vue) :**
```js
function barClass(pct) {
  if (pct >= 0.8) return 'bar-green'
  if (pct >= 0.5) return 'bar-amber'
  return 'bar-red'
}
function valClass(pct) {
  if (pct >= 0.8) return 'ok'
  if (pct >= 0.5) return 'warn'
  return 'err'
}
```

Pour l’instant utilisé uniquement dans **SideLeft**. Si d’autres écrans (ex. PageSystemes) affichent des barres avec les mêmes seuils couleur, extraire dans un composable `useBarStatus(pct)` retournant `{ barClass, valClass }` ou dans la même lib `formatUtils` / `uiUtils`.

---

### 3.3 Labels de types d’objets (OBJECT_TYPES)

**Trois sources actuelles :**

| Fichier | Clés | Usage |
|---------|------|--------|
| `ObservatoirePanel.vue` | SIGNAL, PLANETE, MINEUR, ATMOSPHERE, ETOILE | Corps détectables, libellés affichés |
| `PageLaboratoire.vue` | SIGNAL, PLANETE, MINEUR, OBJET, ATMOSPHERE, ETOILE | Meta des observations |
| `stores/systemObjects.js` | OBJECT_TYPE_LABELS : STAR, PLANET, MOON, MINOR_BODY, DEBRIS_DISK | Store + toBodyFormat (typeMap STAR→ETOILE, etc.) |

Les types “affichage” (ETOILE, PLANETE, etc.) sont le résultat du mapping `toBodyFormat` dans systemObjects. Les libellés français sont dupliqués entre ObservatoirePanel et PageLaboratoire (avec OBJET en plus dans Laboratoire).

**Recommandation :**  
- Créer `src/constants/objectTypes.js` (ou `src/lib/objectTypes.js`) qui exporte :  
  - `OBJECT_TYPE_LABELS` (clés type “body” : ETOILE, PLANETE, MINEUR, ATMOSPHERE, SIGNAL, OBJET) pour l’affichage.  
- Le store `systemObjects` peut importer ces libellés et exposer `OBJECT_TYPE_LABELS` pour cohérence, ou garder son propre mapping DB → type body et utiliser la constante partagée pour les labels.  
- ObservatoirePanel et PageLaboratoire importent la même constante.

---

### 3.4 Format temps relatif (“il y a X”)

**SideLeft.vue — `receivedAgo(createdAt)` :**
```js
const min = Math.floor((Date.now() - createdAt) / 60000)
if (min < 60) return `Reçu il y a ${min} min`
if (h < 24) return `Reçu il y a ${h}h`
return `Reçu il y a ${d}j`
```

**PageDrake.vue — `formatLastUpdated(ts)` :**
```js
const diffMs = now - d
const h = Math.floor(diffMs / 3600000)
if (h < 1) return 'il y a < 1h'
if (h < 24) return `il y a ${h}h`
return `il y a ${j}j`
```

Logique très proche : durée écoulée → chaîne en français.

**Recommandation :** Créer dans `src/lib/formatUtils.js` (ou `dateTime.js`) une fonction du type `formatRelativeTime(ts, options)` avec options pour le préfixe (`Reçu ` ou vide) et les seuils (min, h, j). Les deux composants l’utilisent.

---

### 3.5 Format date locale (fr-FR)

**PageArtefacts.vue — `formatInterpretationDate(iso)` :**
```js
const d = new Date(iso)
return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
```

Un seul usage pour l’instant, mais pattern classique.

**Recommandation :** Exporter dans la même lib (ex. `formatUtils.js`) une fonction `formatDate(iso, options)` (options pour locale et style). Réutilisable pour toute date d’interface.

---

### 3.6 `formatRaDec(ra, dec)` — ObservatoireAzimuth

Utilisé uniquement dans **ObservatoireAzimuth.vue** pour afficher α/δ en h m s et ° ′.

Pas de doublon actuel. Si un autre composant (tooltip, export, rapport) doit afficher des coordonnées équatoriales, déplacer dans `src/lib/formatUtils.js` ou `src/lib/astroFormat.js`.

---

### 3.7 Pattern “fetch store si pas chargé”

Répété dans plusieurs composants :
```js
if (!shipStore.loaded) await shipStore.fetch()
if (!stellarStore.loaded) await stellarStore.fetch()
// etc.
```

**Fichiers :** AppHeader, SideLeft, SkyCanvas, SystemView, PageSystemes, PageDrake, PageLaboratoire.

**Recommandation :** Optionnel. Un composable `useStoreReady(stores)` qui appelle `fetch()` pour chaque store si `!loaded` peut centraliser la logique et éviter les oublis. Pas strictement nécessaire si on préfère garder l’appel explicite dans chaque écran.

---

## 4. Fichiers à créer / modifier (recommandations)

| Action | Fichier | Contenu |
|--------|---------|--------|
| Créer / compléter | `src/lib/formatUtils.js` | `barWidth`, `formatRelativeTime`, `formatDate` (fr-FR) |
| Créer | `src/constants/objectTypes.js` | OBJECT_TYPE_LABELS (affichage) partagé Observatoire + Labo |
| Modifier | `PageSystemes.vue`, `PagePopulation.vue` | Importer `barWidth` depuis formatUtils |
| Modifier | `SideLeft.vue`, `PageDrake.vue` | Utiliser `formatRelativeTime` depuis formatUtils |
| Modifier | `PageArtefacts.vue` | Utiliser `formatDate` depuis formatUtils |
| Modifier | `ObservatoirePanel.vue`, `PageLaboratoire.vue`, `systemObjects.js` | Importer / exposer labels depuis constants/objectTypes |

---

## 5. Non retenu comme doublon

- **getFallbackBodies** (ObservatoirePanel) : logique métier spécifique au panel, pas réutilisée ailleurs.
- **formatNum** (PageSystemes) : `Intl.NumberFormat('fr-FR')` — un seul usage ; peut rejoindre formatUtils si d’autres pages formatent des nombres de la même façon.
- **NIVEAUX / SIGNAL_SUPPORTS** (PageLaboratoire) : constantes métier Laboratoire, pas dupliquées ailleurs.

---

## 6. Ordre de priorité suggéré (aligné sur §1)

1. **barWidth** — 2 fichiers, changement minimal, gain immédiat.
2. **OBJECT_TYPES / objectTypes** — évite la divergence entre Observatoire, Labo et store.
3. **formatRelativeTime** — unifie SideLeft et PageDrake.
4. **formatDate** — prépare la réutilisation pour d’autres dates.
5. **barClass/valClass** — à extraire dès qu’un deuxième consommateur apparaît.
6. **formatRaDec** — à déplacer en lib si réutilisation (tooltip, export, etc.).
