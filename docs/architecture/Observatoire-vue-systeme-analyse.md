*Dernière modification : 2026-03-13 15:11*

# Observatoire — Vue Système — Analyse

*Mars 2026 — Spécification avant implémentation*

---

## 1. Décisions validées

| Point | Décision |
|-------|----------|
| Recherche en mode Système | Pas pour le moment |
| Ordre des planètes | Idéalement par ordre réel (semi-major axis). Si donnée indisponible : **grille** à la place de la représentation orbitale |
| Zone habitable | Données en DB si dispo, sinon **calcul approché** |
| Interactions planètes | À prévoir plus tard |
| Fallback sans données | Affichage étoile seule + message explicatif |
| Illustrations étoiles | **SVG par type spectral** à prévoir |

---

## 2. État de la base de données

### 2.1 Tables utilisées

- **`stellar_systems`** : infos système (id, name, spectral_type, habitable_zone boolean)
- **`system_objects`** : objets du système (STAR, PLANET, MOON, MINOR_BODY, DEBRIS_DISK)
- **`ships.current_system_id`** : système où stationne le vaisseau

### 2.2 Données disponibles — system_objects

| Champ | Présent en base ? | Exemple (SOL) |
|-------|-------------------|---------------|
| `orbital_semi_major_axis_au` | **Non** — colonne existe mais jamais renseignée | — |
| `orbital_period_days` | **Oui** — utilisé partout | Mercure 87.97, Terre 365.25, Neptune 60182 |
| `sort_order` | **Oui** — ordre d'affichage | 0=étoile, 1–8=planètes |
| `in_habitable_zone` | **Oui** — par planète | Terre: true |
| `habitable_zone_type` | **Oui** — quand in_habitable_zone | INTERNAL, EXTERNAL, TEMPERATE |
| `spectral_type` | **Oui** — pour STAR | G2V, M5.5V, etc. |
| `mass_earth` | **Oui** — planètes | 0.055 (Mercure) … 317.8 (Jupiter) |
| `mass_stellar` | **Oui** — étoiles | 1.0 (Soleil) |
| `radius_earth` | **Parfois** — peu renseigné | — |
| `type` | **Oui** | STAR, PLANET, MOON, DEBRIS_DISK |
| `name`, `designation` | **Oui** | Soleil, Mercure, b, c, etc. |

### 2.3 Données disponibles — stellar_systems

| Champ | Présent | Limites zone habitable |
|-------|---------|-------------------------|
| `habitable_zone` | Oui (boolean) | Pas de bornes (inner/outer AU) en DB |

### 2.4 Couverture des systèmes

- **seed.sql** : SOL, PROXIMA, BARNARD, ROSS128, EPSILON_ERIDANI, TAU_CETI, GLIESE667, HD44594, PSR_B1919, LUHMAN16, WISE0855
- **seed_extended_systems.sql** : ~90 systèmes supplémentaires avec `system_objects` (étoiles + planètes, `orbital_period_days`, `in_habitable_zone`, `sort_order`)

---

## 3. Stratégies techniques

### 3.1 Ordre des planètes (représentation)

- **Si `orbital_semi_major_axis_au` présent** : tri par cette valeur.
- **Sinon (cas actuel)** : calcul depuis `orbital_period_days` via **Kepler 3** :
  - \( a = (T/365{,}25)^{2/3} \) UA (T en jours)
- **Si aucune donnée orbitale** : usage de `sort_order` + **grille** (pas de position orbitale réelle) :
  - Étoile à gauche, planètes alignées à droite.
  - **Grille fallback** : **3 colonnes** comme la vue Artefacts (`grid-template-columns: repeat(3, 1fr)`).

### 3.2 Zone habitable (bande bleue) — Formule validée

**Référence** : Kopparapu et al. 2013 (ApJ 765, 131) — modèle standard utilisé par la NASA/VPL.

**Formule** :
```
d (AU) = √(L/L☉ / S_eff)
```
- **d** = distance au centre de l'étoile
- **L/L☉** = luminosité stellaire en unités solaires
- **S_eff** = flux stellaire effectif à la frontière

**Limites conservatrices (Kopparapu 2013)** :

| Frontière | Critère | S_eff | Pour le Soleil (L=1) |
|-----------|---------|-------|----------------------|
| Intérieure | Runaway greenhouse | 1.04 | ~0.98 AU |
| Extérieure | Maximum greenhouse | 0.35 | ~1.69 AU |

**Limites optimistes** : Recent Venus (inner, S≈1.78), Early Mars (outer, S≈0.32).

**Luminosité depuis spectral_type** : on utilise `mass_stellar` (M☉) si dispo, sinon table L/L☉ par type (G2≈1, M5≈0.01, K5≈0.17, etc.). Formule masse–luminosité pour séquence principale : L/L☉ ≈ (M/M☉)^3.5 à ^4.

**Alternatives si données manquantes** :
- **Inférence** : min/max des `orbital_semi_major_axis_au` ou distances dérivées des planètes avec `in_habitable_zone = true`.
- **Formule simplifiée** (ordre de grandeur) : inner = √(L/1.1), outer = √(L/0.53) AU.

### 3.3 Illustrations SVG pour les étoiles

Types spectraux à couvrir (ordre de priorité) :

- **G2V** (Soleil)
- **M5.5V** (Proxima)
- **M4V**, **M3V**, **M2V**, **M1V** (naines rouges)
- **K2V**, **K5V** (orange)
- **F8V**, **G8V** (jaune/blanc)
- **L7.5**, **Y4** (naines brunes)
- **Pulsar / neutron** (PSR_B1919)

Proposition : un SVG par lettre principale (O, B, A, F, G, K, M, L, T, Y) + cas spéciaux (pulsar, naine blanche), couleur/teinte selon type.

**Implémenté** : `src/assets/illustrations/stars/` — 13 SVG créés (O, B, A, F, G, K, M, L, T, Y, D, pulsar) + `index.js` avec `getStarSvgPath(spectralType)`.

---

## 4. Structure UI (rappel)

```
[ Ciel profond | Système ]     ← Onglets (remplacent l’emplacement des filtres)
[ Visuel | IR | UV | R ]       ← Mode Ciel profond uniquement
[ Recherche… ]                 ← Mode Ciel profond uniquement (pas en Système)
```

En mode **Système** : pas de filtres, pas d’azimut, pas de recherche.

---

## 5. Récapitulatif backend

| Besoin | Source actuelle | Action |
|--------|-----------------|--------|
| Système courant | `ships.current_system_id` | Utiliser tel quel |
| Objets du système | `system_objects` (fetch par system_id) | `systemObjectsStore.fetchForSystem()` |
| Ordre planètes | `sort_order` + `orbital_period_days` | Calculer a (UA) si besoin |
| Zone habitable | `in_habitable_zone` par planète | Inférence ou calcul approché |
| Limites zone (AU) | Absent en DB | Calcul depuis spectral_type ou planètes |

**Pas de migration backend nécessaire** pour une première version : les données existantes suffisent.

---

## 6. Refactoring effectué (Mars 2026)

- **lib/stellarProjection.js** — Projection stéréographique (raDecToVector, projectStarInFov, projectNebulaShape, signalPosition)
- **lib/skyRenderers.js** — Rendu canvas (drawMilkyWay, drawCurvedGrid, drawNebulas, drawStars, drawSignals, drawSpectralBorder)
- **composables/useSkyStars.js** — Construction liste étoiles (DB + fallback procédural)
- **views/observatoire/PageObservatoire.vue** — Page déplacée dans dossier dédié

---

## 7. Prochaines étapes (avant code)

1. ~~Créer les **SVG étoiles**~~ — Fait.
2. ~~Valider la formule de **zone habitable**~~ — Kopparapu 2013 documenté.
3. ~~Spécifier la **grille** en fallback~~ — 3 colonnes (référence : vue Artefacts).
