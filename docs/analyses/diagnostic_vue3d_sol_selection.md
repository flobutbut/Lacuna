# Diagnostic — Vue 3D : étoile sélectionnée par défaut non highlightée / doublon Sol

*Date : 2026-03*

## Contexte

1. L'étoile sélectionnée par défaut (système courant) n'est pas highlightée dans la Vue 3D.
2. Hypothèse : existence de deux étoiles nommées "Sol" dans les données.

---

## 1. Pourquoi l'étoile par défaut (SOL) n'est pas highlightée

### Chaîne d'exclusion

| Étape | Fichier | Explication |
|-------|---------|-------------|
| `forSky()` | `stellarSystems.js` | `excludeSol = true` par défaut → SOL exclu de la liste projetée |
| `buildStarsFromDb` | `useSkyStars.js` | Utilise `forSky()` → SOL jamais dans les entrées |
| `projectStarsFromDb` | `useSkyStars.js` | `if (s.id === 'SOL') return null` → SOL explicitement filtré |
| `points` | `useStars3DConception.js` | Résultat de buildStarsFromDb → **SOL n'est jamais dans `points`** |

### Conséquences

- `Stars3DCanvas` reçoit `focusStarId = 'SOL'`
- `buildHighlightMesh()` cherche `points.value.find(s => s.id === 'SOL')` → **aucun point**
- `getStarPositionById('SOL')` retourne `null` → `focusOnStar` ne fait rien
- **Aucun highlight ni animation caméra** pour SOL

### Origine de l'exclusion

SOL est à l'origine du référentiel galactique (0,0,0). Il est exclu du ciel pour :
- éviter de l'afficher quand le joueur est *dans* le système solaire (règle UI : masquer le système courant)
- `get_visible_systems` exclut le système du viewer (on ne voit pas "son" étoile)

En Vue 3D conception, l'origine est le **barycentre** des étoiles (sans SOL). SOL pourrait théoriquement être ajouté à (dx, dy, dz) = (-bc.x, -bc.y, -bc.z), mais il n'est pas inclus dans le pipeline actuel.

---

## 2. Doublon "Sol" — analyse des sources

### Import HYG

| Fichier | Comportement |
|---------|--------------|
| `parse_hyg.py` | `df["dist"] > 0` → Soleil (dist=0) exclu |
| `iter_hyg_rows` | `if float(dist_pc) <= 0: continue` → Soleil jamais yield |
| `complete_hyg_fields.py` | `if proper.lower() == "sol": continue` → Sol ignoré |
| `build_system_id` | `if proper.lower() != "sol"` → évite d'utiliser "sol" comme id |

**Conclusion** : le Soleil n'est **pas** importé depuis HYG. Un seul SOL vient du seed LACUNA.

### Seed et migrations

- `seed.sql` : un seul `INSERT` avec `id = 'SOL'`, `name = 'Sol'`
- `00020_fix_sol_hyg_fields.sql` : mise à jour de SOL existant (pas d'insert)
- `LACUNA_ID_MAP` : `"sol" → "SOL"` — un éventuel id "sol" (HYG) serait mappé sur SOL, pas dupliqué

### Vérification base de données

Pour confirmer l'absence de doublon :

```sql
SELECT id, name, distance, coordinates
FROM stellar_systems
WHERE LOWER(id) LIKE '%sol%' OR LOWER(name) LIKE '%sol%'
ORDER BY id;
```

Si un doublon existe (ex. `sol` vs `SOL`, ou `hyg-0` avec name "Sol"), il apparaîtra ici.

---

## 3. Pistes de correction

### A. Système courant = SOL

Quand `currentSystemId === 'SOL'` :
- **Option 1** : Ne pas sélectionner d'étoile par défaut (rien à highlight).
- **Option 2** : Sélectionner l'étoile la plus proche (ex. Proxima Centauri).
- **Option 3** : Inclure SOL dans les points 3D (modif de `useSkyStars` / `useStars3DConception`).

### B. Système courant ≠ SOL

Quand le joueur est ailleurs (ex. PROXIMA), le système courant est dans `visibleForSky` et donc dans `points`. La sélection par défaut devrait fonctionner. Si ce n'est pas le cas, le souci peut venir de :
- ordre de chargement (sélection avant que les points soient prêts),
- filtre exoplanètes qui retire le système.

### C. Doublon Sol

Si la requête SQL ci-dessus trouve un doublon :
- migration pour supprimer ou fusionner le doublon,
- revue de l’import HYG / seed pour éviter une réintroduction.

---

## 4. Recommandation immédiate

1. **Exécuter la requête SQL** pour confirmer s'il existe un doublon Sol.
2. **Adapter la sélection par défaut** : si `currentSystemId === 'SOL'`, ne pas appeler `selectStar` (ou sélectionner Proxima).
3. **Si doublon trouvé** : ajouter une migration de nettoyage et documenter la cause.
