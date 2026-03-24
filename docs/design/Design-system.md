*Dernière modification : 2026-03-18*

# LACUNA — Design System

*Documentation du design system — Mars 2026*

---

## 1. Vue d'ensemble

Le design system LACUNA repose sur :
- **Tokens** : variables CSS (`tokens.css`) pour couleurs, typographie, espacements
- **Composants** : AppModal, Divider, ModalCell, NavMenuItem, NavTabButton, InstrumentButton, ObservationCard, etc.
- **Constantes** : `menus.js` (SYSTEMS_MENU_ITEMS, INSTRUMENTS, TRACE_ICONS)
- **Utilitaires** : classes `.sw-row`, `.sw-cell`, `.sw-key`, `.sw-val` pour les données key/value

**Principe** : Tous les styles utilisent les tokens. Aucune couleur ou valeur en dur.

---

## 2. Tokens (`tokens.css`)

### 2.1 Couleurs

| Token | Valeur | Usage |
|-------|--------|-------|
| `--color-bg` | `#03060d` | Fond principal |
| `--color-bg-alt` | `#060c18` | Fond alternatif |
| `--color-panel` | `rgba(6, 14, 28, 0.92)` | Fond des panels / modales |
| `--color-panel-solid` | `#060e1c` | Panel opaque |
| `--color-cyan` | `#00b4c8` | Accent principal, titres |
| `--color-cyan-dim` | `rgba(0, 180, 200, 0.5)` | Accent atténué |
| `--color-cyan-muted` | `#5eb8c4` | Accent discret |
| `--color-cyan-glow` | `rgba(0, 180, 200, 0.15)` | Hover boutons / select |
| `--color-cyan-subtle` | `rgba(0, 180, 200, 0.05)` | Hover très léger |
| `--color-cyan-hz-band` | `rgba(0, 180, 200, 0.2)` | Zone habitable (bande SVG) |
| `--color-cyan-hover` | `rgba(0, 180, 200, 0.08)` | :active (clic) |
| `--color-cyan-active` | `rgba(0, 180, 200, 0.22)` | Toggle sélectionné (.is-active) |
| `--color-amber` | `#e8a020` | Alertes, anomalies |
| `--color-amber-dim` | `rgba(232, 160, 32, 0.4)` | Amber atténué |
| `--color-green` | `#40a870` | Succès, valeurs OK |
| `--color-red` | `#c84040` | Erreurs, valeurs critiques |
| `--color-violet` | `#a855f7` | Signaux, notifications |
| `--color-signal` | `#a855f7` | Indicateurs signaux |
| `--color-white` | `#e2eaef` | Texte principal |
| `--color-muted` | `#7d92a3` | Texte secondaire |
| `--color-ghost` | `rgba(255, 255, 255, 0.05)` | Éléments discrets |

### 2.2 Bordures

| Token | Valeur | Usage |
|-------|--------|-------|
| `--border-default` | `rgba(0, 180, 200, 0.15)` | Bordures standard |
| `--border-bright` | `rgba(0, 180, 200, 0.4)` | Bordures accentuées |
| `--border-width` | `1px` | Épaisseur par défaut |
| `--border-radius-sm` | `2px` | Petit rayon |
| `--border-radius-md` | `4px` | Rayon moyen |
| `--border-radius-full` | `50%` | Cercle |

### 2.3 Typographie

| Token | Valeur | Usage |
|-------|--------|-------|
| `--font-mono` | `'Share Tech Mono', monospace` | Données, valeurs |
| `--font-sans` | `'Syne', sans-serif` | Titres, UI |
| `--text-2xs` | `8px` | Très petit |
| `--text-xs` | `9px` | Petit |
| `--text-sm` | `10px` | Sous-titres |
| `--text-base` | `11px` | Corps de texte |
| `--text-md` | `12px` | Labels, valeurs |
| `--text-lg` | `14px` | Titres secondaires |
| `--text-xl` | `15px` | Titres |
| `--text-2xl` | `19px` | Grands titres |
| `--weight-regular` | `400` | Texte normal |
| `--weight-semibold` | `600` | Semi-gras |
| `--weight-bold` | `800` | Gras |
| `--tracking-tight` | `0.5px` | Serré |
| `--tracking-normal` | `1px` | Normal |
| `--tracking-wide` | `2px` | Large (labels) |
| `--tracking-wider` | `4px` | Très large |
| `--leading-none` | `1` | Interligne serré |
| `--leading-normal` | `1.5` | Interligne standard |

### 2.4 Espacements

| Token | Valeur | Usage |
|-------|--------|-------|
| `--space-1` | `2px` | Gaps minimaux |
| `--space-2` | `4px` | Petit |
| `--space-3` | `6px` | Moyen-petit |
| `--space-4` | `8px` | Moyen |
| `--space-5` | `10px` | |
| `--space-6` | `12px` | Padding modales |
| `--space-7` | `14px` | |
| `--space-8` | `18px` | **Padding global modales** |
| `--space-9` | `20px` | |
| `--space-10` | `24px` | |
| `--space-12` | `32px` | |
| `--space-14` | `48px` | |

### 2.5 Transitions

| Token | Valeur |
|-------|--------|
| `--transition-fast` | `0.15s ease` |
| `--transition-base` | `0.2s ease` |
| `--transition-smooth` | `0.3s ease` |
| `--transition-slow` | `0.4s ease` |
| `--transition-bar` | `1s ease` |
| `--transition-bar-slow` | `1.5s ease` |

### 2.6 Z-index (layers)

| Token | Valeur | Usage |
|-------|--------|-------|
| `--z-sky` | `0` | Arrière-plan |
| `--z-vignette` | `1` | Effets |
| `--z-scanlines` | `2` | Overlays |
| `--z-ui` | `10` | Interface |
| `--z-reticule` | `20` | Curseur |
| `--z-tooltip` | `30` | Tooltips |
| `--z-panel` | `40` | Panels |
| `--z-notification` | `50` | Notifications |
| `--z-modal` | `60` | Modales |

### 2.7 Layout

| Token | Valeur |
|-------|--------|
| `--header-height` | `48px` |
| `--instruments-height` | `52px` |
| `--sidebar-width` | `312px` |
| `--sidebar-offset` | `20px` |
| `--panel-width` | `360px` |
| `--panel-width-lg` | `400px` |

---

## 3. Composants

### 3.1 AppModal

**Fichier** : `src/components/AppModal.vue`

Modal réutilisable avec structure header / content / footer. Toutes les modales l'utilisent.

**Structure** :
- **Header** : slot `#header` ou prop `title` + bouton fermer — padding `--space-8`
- **Content** : slot par défaut — padding `--space-8`
- **Footer** : slot `#footer` (optionnel) — padding `--space-8`, boutons en flex

**Props** :
- `title` (String) : Titre affiché dans le header
- `position` (String) : `'center'` | `'top-right'` — position du box (défaut : center)
- `overlay` (Boolean) : afficher le backdrop (défaut : true). Si false, interaction possible avec le reste de l'interface.

**Events** :
- `@close` : Clic sur backdrop ou bouton fermer

**Exemple** :
```vue
<AppModal title="Signal · 1420 MHz" @close="close">
  <div>Contenu...</div>
  <template #footer>
    <button class="btn btn-primary">Action</button>
  </template>
</AppModal>
```

**Utilisation** : SignalModal, TravelWidget, ObservatoirePanel, PageSystemes (position `top-right`), DepartureConfirmation (vue confirmation départ — titre dynamique, footer btn-ghost + btn-primary)

---

### 3.2 ModalCell

**Fichier** : `src/components/ModalCell.vue`

Cellule à bordure solid pour le contenu des modales (grilles, cards).

**Props** :
- `variant` : `'default'` | `'compact'`
  - `default` : padding `--space-4`, background 0.3 (corps observatoire)
  - `compact` : padding `--space-3` `--space-5`, background 0.25 (phases transit)

**Exemple** :
```vue
<ModalCell variant="compact">
  <span class="sw-key">Label</span>
  <span class="sw-val">Valeur</span>
</ModalCell>
```

**Utilisation** : Transit phases (TravelWidget), corps détectables (ObservatoirePanel)

---

### 3.3 Divider

**Fichier** : `src/components/Divider.vue`

Ligne de séparation horizontale. Remplace les `border-top`/`border-bottom` dans les modales et le contenu.

**Props** :
- `variant` : `'dashed'` | `'solid'` (continu)
- `tight` (Boolean) : espacement réduit (entre lignes de données)

**Exemple** :
```vue
<Divider variant="dashed" />
<Divider variant="solid" tight />
```

**Utilisation** : AppModal (header/footer), SignalModal, TravelWidget, PageSystemes (identité)

**Styles** : `divider.css`

---

### 3.4 NavMenuItem

**Fichier** : `src/components/NavMenuItem.vue`

Composant pour items de menu (Systèmes, Population) et slots grille (Artefacts). Icône + libellé + badge optionnel.

**Variants** :
- `menu` : Menu latéral — icône à gauche, libellé à droite, **pleine largeur** du conteneur
- `slot` : Grille (Artefacts) — icône au-dessus du libellé, aspect carré

**Props** :
- `variant` : `'menu'` | `'slot'`
- `icon`, `label`, `selected`, `badge`
- `iconColor` (String) : `cyan` | `green` | `amber` | `signal` | `bumper` | `comms` | `nav` (menu Systèmes)

**Events** : `@click`

**Utilisation** :
- **PageSystemes** : menu latéral (SYSTEMS_MENU_ITEMS)
- **PagePopulation** : menu latéral (POPULATION_MENU_ITEMS)
- **PageArtefacts** : grille de traces (variant slot)

**Constantes** (`src/constants/menus.js`) :
- `SYSTEMS_MENU_ITEMS`, `POPULATION_MENU_ITEMS`, `TRACE_ICONS`

---

### 3.5 NavTabButton

**Fichier** : `src/components/NavTabButton.vue`

Onglet de la barre de navigation principale (menu du bas). RouterLink avec icône, libellé, badge optionnel.

**Props** : `icon`, `label`, `to` (path), `active`, `badge`

**Utilisation** : **InstrumentsBar** — barre des 8 modules (Observatoire, Carte, Laboratoire, etc.)

**Styles** : `instruments.css` — `.nav-tab-btn`

**Constantes** : `INSTRUMENTS` (`src/constants/menus.js`)

---

### 3.6 InstrumentButton

**Fichier** : `src/components/InstrumentButton.vue`

Bouton d'instrument en grille (3×N, **carrés**). Réutilisable. Utilisé par le Laboratoire, extensible ailleurs.

**Props** :
- `instrument` (Object) : `{ id, name, ... }`
- `state` : `'available'` | `'disabled'` | `'running'` | `'done'`
- `progress` (Number, 0–100) : barre de progression en cours
- `disabledReason` (String) : message quand disabled

**Events** : `@click`

**Utilisation** : **PageLaboratoire** — grille d'instruments d'analyse (analyseur spectral, spectromètre, etc.)

**Styles** : `lab.css` — `.lab-instruments-grid` (3 colonnes), `.instrument-btn` (carré)

---

### 3.7 Utilitaires key/value (widget.css)

| Classe | Usage |
|--------|-------|
| `.sw-cell` | Cellule grille : flex column, key au-dessus de val |
| `.sw-row` | Ligne key/value : flex space-between |
| `.sw-key` | Label : `--text-md`, `--color-muted` |
| `.sw-val` | Valeur : `--text-md`, `--color-white`, `--font-mono` |
| `.sw-val.ok` | Valeur positive (vert) |
| `.sw-val.warn` | Valeur attention (ambre) |
| `.sw-val.err` | Valeur erreur (rouge) |
| `.sw-desc` | Paragraphe description (muted) |
| `.sw-title` | Titre widget : uppercase, muted, border-bottom |
| `.sw-title--no-divider` | Titre sans bordure |

**Exemple** :
```html
<div class="sw-row">
  <span class="sw-key">Distance</span>
  <span class="sw-val">12.4 al</span>
</div>
```

---

### 3.8 Boutons (button.css)

| Classe | Usage |
|--------|-------|
| `.btn-primary` | Action principale (cyan) |
| `.btn-secondary` | Action secondaire |
| `.btn-ghost` | Action discrète |
| `.btn-amber` | Action warning |
| `.btn-instrument` | Bouton barre instruments |
| `.btn-close` | Fermeture panel |

**États** : `:hover`, `:active`, `:disabled`, `.is-active` (toggle sélectionné — secondary/ghost), `.active` (instrument)

---

### 3.9 ObservationCard

**Fichier** : `src/components/ObservationCard.vue`

Card cliquable pour signaux et observations.

**Props** :
- `iconType` : `'signal'` | `'observation'`
- `iconValue` : structure (sursaut, pulse…) ou type (ETOILE, PLANETE…)
- `title`, `titleVariant`, `rows`, `badge`
- `progress` : `{ pct, variant?: 'amber'|'cyan' }`
- `state` : `idle` | `selected` | `running` | `done` | `expired` | `highlight`
- `stateText`, `dismissable`

---

### 3.10 ObservatoireTooltip

**Fichier** : `src/components/observatoire/ObservatoireTooltip.vue`

Tooltip unifié pour étoiles, signaux, corps.

**Props** : `visible`, `position`, `title`, `rows` (array `{ key, value, icon?, structure? }`), `status`, `actionLabel`, `offset`

---

### 3.11 Barres de progression (bar.css)

**Composant** : `ProgressBar.vue` — barre de progression avec `margin-bottom: var(--space-1)` pour harmoniser l’espacement entre lignes.

| Prop | Type | Description |
|------|------|-------------|
| `value` | Number | Valeur 0–1 ou 0–100 (si `pct`) |
| `pct` | Boolean | Si `true`, `value` est en 0–100 |
| `color` | String | `'cyan'` \| `'amber'` \| `'green'` \| `'red'` — si absent, `barClass(value)` |
| `noMargin` | Boolean | Supprime margin-top/bottom (ex. Drake, barre inline) |

```vue
<ProgressBar :value="0.82" color="cyan" />
<ProgressBar :value="82" color="green" pct />
<ProgressBar :value="31" :color="amber ? 'amber' : 'cyan'" pct no-margin class="dt-bar" />
```

| Classe (legacy) | Usage |
|-----------------|-------|
| `.bar-wrap` | Conteneur barre (préférer ProgressBar) |
| `.bar-fill` | Remplissage |
| `.bar-cyan` / `.bar-amber` / `.bar-green` / `.bar-red` | Couleurs |

---

### 3.12 NotificationToast

**Classe** : `.notification-toast`  
**Variantes** : `--default`, `--info`, `--warn`, `--error`, `--success`

---

### 3.13 AppSelect (Select / Dropdown)

**Fichier** : `src/components/AppSelect.vue`  
**Styles** : `select.css` — classe `.ds-select`

Liste déroulante native stylée avec les tokens du design system (couleurs, bordures, typo mono, états hover/focus). La dropdown (options) utilise `--color-panel-solid` et `--color-white`.

**Props** :
- `modelValue` : valeur sélectionnée (v-model)
- `options` : tableau d’objets (ex. `[{ id, label, title? }]`)
- `valueKey` : clé de la valeur (défaut : `'id'`)
- `labelKey` : clé du libellé (défaut : `'label'`)
- `name`, `ariaLabel`, `title`, `disabled`

**Events** : `@update:modelValue`

**Exemple** :
```vue
<AppSelect
  :model-value="ui.spectralFilter"
  :options="FILTERS"
  value-key="id"
  label-key="label"
  aria-label="Filtre spectral"
  @update:model-value="ui.setSpectralFilter"
/>
```

**Utilisation** : ObservatoireSpectralFilters (filtre bande spectrale)

---

### 3.14 Widgets latéraux (widget.css)

| Classe | Usage |
|--------|-------|
| `.side-left` | Colonne gauche |
| `.side-right` | Colonne droite |
| `.side-widget` | Boîte widget (panel, border) |

---

### 3.15 Classes utilitaires (utilities.css)

Fichier : `src/assets/utilities.css` — classes réutilisables (marges, couleurs texte, typo). À privilégier pour éviter les styles inline.

| Classe | Usage |
|--------|-------|
| `.text-muted`, `.text-cyan`, `.text-amber`, `.text-green`, `.text-red`, `.text-white` | Couleur de texte |
| `.text-ok`, `.text-warn`, `.text-crit` | Statuts sémantiques (vert, ambre, rouge) |
| `.mb-4`, `.mb-6`, `.ml-2` | Marges (var(--space-*)) |
| `.font-mono`, `.text-upper`, `.text-xs` … `.text-4xl` | Typographie |
| `.gap-1` … `.gap-10` | Gap flex/grid |
| `.flex`, `.flex-col`, `.flex-center`, `.items-center` | Flexbox |

---

## 4. Règles d'usage

### 4.1 Modales

- **Padding global** : `--space-8` pour header, content, footer
- **Dividers dans le content** : `border-top: 1px dashed var(--border-default)` (pas solid)
- **Contours des cellules** : `border: solid` (pas dashed)
- **Structure** : Utiliser AppModal, placer les boutons dans le slot `#footer`

### 4.2 Données key/value

- Utiliser `.sw-row` pour les lignes (Total simulé, Carburant, etc.)
- Utiliser `.sw-cell` pour les cellules de grille (Distance, Type)
- Labels : `.sw-key` (ou équivalent local comme `signal-modal__key`)
- Valeurs : `.sw-val` + `valClass()` pour les états (ok, warn, err)

### 4.3 Valeurs dynamiques (formatUtils.js)

- `valClass(pct)` : retourne `'ok'` | `'warn'` | `'err'` selon pourcentage 0–1
- `barClass(pct)` : retourne classe barre (bar-green, bar-amber, bar-red)
- `formatDate(iso)` : date locale fr-FR
- `formatFrequency(hz)` : "1420 MHz", "50 keV"
- `formatRelativeTime(ts)` : "il y a X min/h/j"

```vue
<span class="sw-val" :class="valClass(fiabilite)">{{ value }}</span>
```

### 4.4 Thématisation visuelles (D3, etc.)

- Fond : `--color-bg`
- Données / axes : `--color-cyan`
- Alertes : `--color-amber`
- Texte : `--color-white`, `--color-muted`
- Police : `--font-mono`
- Pas de couleurs par défaut des librairies — override systématique

### 4.5 CSS

- **Import** : Tous les fichiers CSS **utilisés par l'app** sont importés dans `main.js`. Le fichier `main.css` (s'il existe) est une référence de convention uniquement et n'est pas chargé. Ne pas utiliser `@import` vers d'**autres fichiers CSS locaux** (HMR cassé). Les `@import` vers des URLs externes (ex. polices dans `base.css`) sont admis.
- **Nouveau fichier** : L'ajouter dans `main.js`
- **Tokens** : Toujours utiliser les variables, jamais de valeurs en dur

---

## 5. Fichiers CSS par rôle

| Fichier | Rôle |
|---------|------|
| `tokens.css` | Variables `:root` |
| `base.css` | Reset, fonts, scrollbar |
| `animations.css` | Animations keyframes |
| `layers.css` | Z-index / couches |
| `utilities.css` | Classes utilitaires (marges, couleurs texte, typo) |
| `app-modal.css` | AppModal, ModalCell |
| `divider.css` | Divider |
| `nav-menu-item.css` | NavMenuItem (menu, slot) |
| `instruments.css` | NavTabButton (barre nav) |
| `widget.css` | sw-row, sw-cell, sw-key, sw-val, side-widget |
| `button.css` | Boutons |
| `select.css` | AppSelect, dropdown (.ds-select) |
| `tooltip.css` | Tooltips, réticule |
| `observatoire.css` | Sections modales, signal-modal, observatoire-body |
| `notification.css` | Toast, travel-widget content |
| `bar.css` | Barres de progression |
| `panel.css` | Panels génériques ; variantes de positionnement (.panel-overlay--right, --left, --center) ; .panel-section-wrap |

---

## 6. Référence rapide

**Padding modales** : `--space-8`  
**Dividers** : composant `<Divider variant="dashed" />` ou `variant="solid"` — remplacer les border  
**Cellules (ModalCell)** : `solid`  
**Key/val** : `.sw-row` + `.sw-key` / `.sw-val`  
**Valeurs dynamiques** : `valClass()`, `barClass()`  
**Couleur accent** : `--color-cyan`  
**Couleur alertes** : `--color-amber`  
