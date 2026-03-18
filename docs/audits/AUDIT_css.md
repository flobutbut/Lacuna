# 18 mars 2025 — Audit CSS

Audit des valeurs CSS hardcodées dans `src/**/*.vue` et `src/assets/**` qui devraient utiliser un token de `tokens.css` à la place.

---

## Valeurs hors tokens

### ✅ FICHIER : src/components/conception/Stars3DCanvas.vue
  → script : `scene.background = new THREE.Color(0x03060d)` → devrait utiliser la valeur de `var(--color-bg)` (#03060d) ou un token exposé pour Three.js

### ✅ FICHIER : src/components/carte/CarteMap3D.vue
  → script : `color: 0xffffff` (ligne 182) → devrait être aligné sur un token blanc si disponible
  → script : `scene.background = new THREE.Color(0x03060d)` (ligne 243) → devrait être aligné sur `var(--color-bg)`

### ✅ FICHIER : src/components/carte/CarteOrbitalView.vue
  → `fill: rgba(0, 180, 200, 0.12)` → devrait être `var(--color-cyan-subtle)` ou token cyan équivalent

### ✅ FICHIER : src/components/SystemView.vue
  → template : `stroke="rgba(220, 190, 140, 0.2)"` → couleur en dur, pas de token équivalent explicite (à définir ou utiliser token existant)
  → `fill: rgba(0, 180, 200, 0.12)` → devrait être `var(--color-cyan-subtle)` ou équivalent
  → `filter: drop-shadow(...)` (lignes 719–755) : nombreuses couleurs rgba en dur pour glow spectral → pourraient être dérivées de tokens (--color-cyan, --color-amber, etc.) ou palette dédiée
  → `gap: 2px` → pourrait être `var(--space-1)`
  → `font-size: 10px` → pourrait être `var(--text-sm)` (10px)
  → `height: 8px` → pourrait être `var(--space-4)` (8px)
  → `margin-top: 2px` → pourrait être `var(--space-1)`

### ✅ FICHIER : src/components/SkyCanvas.vue
  → `bottom: 12px; left: 12px` → pourrait être `var(--space-6)`
  → `font-size: 9px` → pourrait être `var(--text-xs)` (9px)
  → `letter-spacing: 2px` → pourrait être `var(--tracking-wide)` (2px)
  → `text-shadow: 0 0 8px rgba(0, 0, 0, 0.9)` → noir en dur (pas de token ghost/shadow dédié actuellement)

### ✅ FICHIER : src/views/PageConceptionEtoiles.vue
  → `background: rgba(6, 14, 28, 0.85)` → devrait être `var(--color-panel)` (rgba(6, 14, 28, 0.92)) ou token panel avec opacité

### ✅ FICHIER : src/components/StarAutocompleteMenu.vue
  → `background: rgba(3, 6, 13, 0.98)` → devrait être `var(--color-bg)` avec opacité ou token dédié
  → `box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35)` → espacement 12px pourrait être `var(--space-6)` ; ombre noire en dur
  → `border-top: var(--border-width) solid rgba(255, 255, 255, 0.06)` → blanc transparent en dur (pas de token --color-ghost pour 6 %)
  → `top: calc(100% + 6px)` → 6px pourrait être `var(--space-3)`
  → `margin-top: 2px` → pourrait être `var(--space-1)`

### ✅ FICHIER : src/components/carte/CarteSystemCard.vue
  → `background: rgba(0, 0, 0, 0.3)` → fond noir transparent en dur
  → `background: rgba(200, 64, 64, 0.2)` → devrait être dérivé de `var(--color-red)` avec opacité
  → `padding-right: 4px` → pourrait être `var(--space-2)`

### ✅ FICHIER : src/components/ObservationCard.vue
  → `background: rgba(0, 0, 0, 0.3)` → fond noir transparent en dur
  → `box-shadow: 0 0 0 1px rgba(232, 160, 32, 0.4)` → devrait être `var(--color-amber)` / `var(--border-bright)` ou token amber
  → `background: rgba(200, 64, 64, 0.2)` → devrait être dérivé de `var(--color-red)` avec opacité
  → `padding-left: 28px; padding-right: 28px` → 28px récurrent, pas d’équivalent --space-* (--space-10 = 24px, --space-12 = 32px)

### ✅ FICHIER : src/components/lab/LabReportOrbital.vue
  → `border-color: rgba(255, 255, 255, 0.1)` → blanc transparent en dur

### ✅ FICHIER : src/components/ObservatoireAzimuth.vue
  → `font-family: var(--font-mono, 'Share Tech Mono', monospace)` → fallback en dur (token déjà utilisé, fallback redondant avec tokens.css)
  → `color: rgba(204, 221, 232, 0.75)` et `color: rgba(204, 221, 232, 1)` → proche de --color-white (#e2eaef), pourrait être var(--color-white) avec opacité si token prévu
  → `padding: 6px 12px` → pourrait être `var(--space-3) var(--space-6)`

### ✅ FICHIER : src/components/lab/LabReportMorpho.vue
  → script : `.attr('fill', 'rgba(0,180,200,0.15)')` → devrait utiliser équivalent `var(--color-cyan-dim)` (rgba(0,180,200,0.5) en token ; 0.15 pas défini, à ajouter ou utiliser cyan-subtle)
  → script : `.attr('font-size', '9px')` (plusieurs lignes) → pourrait être aligné sur `var(--text-xs)` (9px) si exposé en JS

### ✅ FICHIER : src/components/panels/PanelPopulation.vue
  → `style="margin-top: 12px; ... padding-top: 10px"` → 12px → `var(--space-6)`, 10px → `var(--space-5)` (classe .panel-section-wrap)
  → `style="margin-bottom: 8px"` → 8px → `var(--space-4)` (déjà dans .panel-section-title global)

### ✅ FICHIER : src/components/panels/PanelArtefacts.vue
  → `style="margin-bottom: 12px"` → 12px → `var(--space-6)`
  → `style="opacity: 0.2"` → pas de token d’opacité dans tokens.css

### ✅ FICHIER : src/assets/components/systems.css
  → `background-color: #04080f` (lignes 32, 64, 88) → proche de `--color-bg` (#03060d) / `--color-bg-alt` (#060c18) ; devrait être `var(--color-bg)` ou `var(--color-bg-alt)` selon intention

### ✅ FICHIER : src/assets/components/nav-menu-item.css
  → `.nav-menu-item__icon { color: #7ab0cc }` → devrait être var (ex. --color-cyan-muted ou token dédié icône)
  → `.nav-menu-item__icon { color: #4488aa }` → idem
  → `.nav-menu-item__icon { color: #336655 }` → idem (proche --color-green)

### ✅ FICHIER : src/assets/components/lab.css
  → `padding: 2px 6px` → pourrait être `var(--space-1) var(--space-3)`

### ✅ FICHIER : src/assets/components/notification.css
  → `top: calc(var(--header-height) + 10px)` → 10px pourrait être `var(--space-5)`

---

## Styles inline à extraire

### ✅ FICHIER : src/components/panels/PanelDrake.vue
  → `style="top: 60px; left: 50%; transform: translateX(-50%)"` — classe .panel-overlay--center

### ✅ FICHIER : src/components/panels/PanelPopulation.vue
  → `style="top: 60px; right: 220px"` — classe .panel-overlay--right
  → `style="margin-top: 12px; border-top: 1px solid var(--border-default); padding-top: 10px"` — classe .panel-section-wrap
  → `style="margin-bottom: 8px"` — .panel-section-title global (var(--space-4))
  → `style="color: var(--color-green)"` / `style="color: var(--color-amber)"` — classes .text-green, .text-amber

### ✅ FICHIER : src/components/panels/PanelArtefacts.vue
  → `style="top: 60px; right: 220px"` — classe .panel-overlay--right
  → ✅ `style="margin-bottom: 12px"` — répété concept (voir PanelPopulation) → classe .mb-6

### ✅ FICHIER : src/components/panels/PanelJournal.vue
  → `style="top: 60px; left: 220px"` — classe .panel-overlay--left

### FICHIER : src/views/PageArtefacts.vue
  → ✅ `style="margin-bottom: var(--space-6)"` sur .panel-section-title — répété dans 3 fichiers (PageArtefacts, PagePopulation, PageSystemes) → extraire en classe utilitaire ou ajouter à .panel-section-title dans le CSS global
  → ✅ `style="color: var(--color-muted)"` — répété 2 fois (l.208, 237) dans le même fichier ; même pattern dans PageConceptionEtoiles et PanelPlaceholder → extraire en classe (ex. .text-muted ou .color-muted)

### FICHIER : src/views/PagePopulation.vue
  → ✅ `style="margin-bottom: var(--space-6)"` sur .panel-section-title — idem PageArtefacts

### ✅ FICHIER : src/views/PageSystemes.vue
  → `style="margin-bottom: var(--space-6)"` sur .panel-section-title — classe .mb-6
  → `style="margin-left: var(--space-2)"` — classe .ml-2

### FICHIER : src/views/PageConceptionEtoiles.vue
  → ✅ `style="color: var(--color-muted)"` — idem PageArtefacts (pattern répété) → classe .text-muted

### FICHIER : src/components/panels/PanelPlaceholder.vue
  → ✅ `style="color: var(--color-muted)"` sur .panel-section-title — idem pattern répété → classe .text-muted

---

*Audit en lecture seule. Aucune modification des fichiers source.*
