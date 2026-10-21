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

**Voiles sombres** — fonds de cartes, overlays de modales, ombres portées :

| Token | Valeur | Usage |
|-------|--------|-------|
| `--color-shade-15` | `rgba(0, 0, 0, 0.15)` | Fond de bloc très léger (lab, artefacts, population) |
| `--color-shade-20` | `rgba(0, 0, 0, 0.2)` | Fond de bloc léger (carte) |
| `--color-shade-25` | `rgba(0, 0, 0, 0.25)` | Cellules de modale |
| `--color-shade-30` | `rgba(0, 0, 0, 0.3)` | Fond de carte, item de menu |
| `--color-shade-40` | `rgba(0, 0, 0, 0.4)` | Ombre de dropdown, bloc appuyé |
| `--color-shade-60` | `rgba(0, 0, 0, 0.6)` | Overlay de modale |
| `--color-shade-90` | `rgba(0, 0, 0, 0.9)` | Ombre de texte sur le ciel |

**Variantes transparentes** — pour une couleur du design system avec une opacité qui n'a pas de token, utiliser `color-mix()` plutôt qu'un `rgba()` recopié :

```css
background: color-mix(in srgb, var(--color-bg) 95%, transparent);
background: color-mix(in srgb, var(--color-green) 12%, transparent);
```

**Exceptions assumées** : la palette d'illustration des étoiles par classe spectrale et des anneaux (`SystemView.vue`), les scanlines (`layers.css`) et la grille blueprint (`systems.css`) gardent leurs valeurs propres.

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

### 3.13 bis AppCard

**Fichier** : `src/components/AppCard.vue` (styles scopés, tokens uniquement)

Card de liste : icône, titre, statut, sous-titre et actions. Peut être cliquable (clavier compris : Entrée / Espace), sélectionnée, retirable (×) et porter un badge.

**Props** :
- `title`, `subtitle`, `status` : textes (remplaçables par les slots du même nom)
- `badge` : texte ou nombre affiché en haut à droite
- `dismissable` : affiche le bouton × (`aria-label="Retirer de la liste"`)
- `clickable` : rend la card focusable (`role="button"`) et émet `@click`
- `selected` : état sélectionné (bordure et fond accentués)

**Slots** : `#icon`, `#title`, `#status`, `#subtitle`, `#actions`

**Events** : `@click`, `@dismiss`

**Exemple** :
```vue
<AppCard
  :title="node.name"
  :subtitle="`${node.exoplanetCount} exoplanètes`"
  :badge="node.tracesFound || ''"
  dismissable
  clickable
  :selected="selectedSystemId === node.systemId"
  @click="selectSystem(node.systemId)"
  @dismiss="removeFromMap(node.systemId)"
/>
```

**Utilisation** : PageCarte (liste des systèmes)

---

### 3.13 ter AppDualRangeSlider

**Fichier** : `src/components/AppDualRangeSlider.vue`

Deux curseurs sur une même piste pour choisir une plage ; la portion sélectionnée est remplie en cyan. Le curseur actif passe au premier plan pendant le glisser.

**Props** :
- `low`, `high` (requis) : bornes de la plage
- `min` (défaut `0`), `max` (défaut `100`), `step` (défaut `1`)
- `trackWidth` : largeur de la piste (défaut `'92px'`)
- `ariaLabelLow`, `ariaLabelHigh` : libellés accessibles des deux curseurs

**Events** : `@update:low`, `@update:high`

**Exemple** :
```vue
<AppDualRangeSlider
  :low="radarFreqLow"
  :high="radarFreqHigh"
  :min="0"
  :max="125"
  aria-label-low="Borne basse du filtre fréquentiel (Hz)"
  aria-label-high="Borne haute du filtre fréquentiel (Hz)"
  @update:low="ui.setRadarFreqLow"
  @update:high="ui.setRadarFreqHigh"
/>
```

**Utilisation** : ObservatoireRadarFilters (filtre fréquentiel)

---

### 3.13 quater RadarMiniature

**Fichier** : `src/components/RadarMiniature.vue`

Spectrogramme miniature (120 px de haut) qui relit le même buffer de colonnes que `RadarView`. Sans props : il reçoit `radarSpectrogram` et `radarColumnBuffer` par `inject` et lit les réglages radar dans le store UI (seuil, bornes de fréquence, échelle de temps, radar actif). Couleurs : échelle Viridis sur fond `--color-bg`.

**Utilisation** : SideLeft (tuile radar de l'Observatoire)

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

### 3.16 Placeholder « radar off » (Observatoire)

**Fichiers** : `RadarView.vue`, `RadarMiniature.vue` — affichés quand `ui.radarEnabled === false`.

**Contenu** :
- **Radar off** : les canvas spectrogramme et intensité ne sont pas affichés ; seul un bloc texte (titre + consigne) est centré sur la zone spectrogramme.
- **Titre** : « Radar désactivé » — libellé secondaire, uppercase.
- **Corps** : « Activez l’acquisition pour écouter le spectre radio » — consigne utilisateur (lien sémantique avec l’acquisition spectrale, sans renvoyer au libellé du header).

**Styles (tokens uniquement)** :
| Élément | Tokens |
|--------|--------|
| Conteneur (spectrogramme / miniature) | Fond **transparent**, sans bordure ; `--space-*` pour le padding ; `pointer-events: auto` sur la vue pleine pour capter le scroll |
| Graph d’intensité (vue radar) | Aucun placeholder radar off ; les deux canvas (spectrogramme + intensité) sont masqués (`v-show`) — rien n’est dessiné tant que l’acquisition est coupée |
| Titre | `--font-mono`, `--text-base` (vue pleine) ou `--text-sm` (miniature), `--weight-semibold`, `--tracking-wide`, `--color-muted`, uppercase |
| Consigne | `--font-mono`, `--text-sm` ou `--text-xs` (miniature), `--weight-regular`, `--tracking-tight`, `--leading-normal`, `--color-cyan-muted` |

Ne pas utiliser de `color-mix` ni de tailles en dur pour ces blocs — rester aligné sur §2 (tokens).

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
- Canvas et Three.js : lire les tokens avec `getCssVar('--color-…')` (`src/lib/cssVars.js`) plutôt que de recopier la valeur hex

### 4.5 CSS

- **Import** : Les CSS partagés sont importés dans `main.js` ; les CSS propres à une page sont importés par leur vue (voir §5). Ne pas utiliser `@import` vers d'**autres fichiers CSS locaux** (HMR cassé). Les `@import` vers des URLs externes (ex. polices dans `base.css`) sont admis.
- **Nouveau fichier** : partagé → `main.js` ; propre à une page → import dans la vue, avec **toutes** les règles préfixées par la page (un CSS de route reste chargé après navigation)
- **Tokens** : Toujours utiliser les variables, jamais de valeurs en dur
- **Mouvement réduit** : `animations.css` coupe animations et transitions sous `prefers-reduced-motion: reduce`. Une nouvelle animation CSS en hérite automatiquement ; une animation canvas doit vérifier `matchMedia('(prefers-reduced-motion: reduce)')` elle-même

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
| `observatoire.css` | Sections modales, signal-modal, observatoire-body ; placeholders radar (styles scoped dans RadarView / RadarMiniature, tokens §3.16) |
| `notification.css` | Toast, travel-widget content |
| `bar.css` | Barres de progression |
| `panel.css` | Panels génériques ; variantes de positionnement (.panel-overlay--right, --left, --center) ; .panel-section-wrap |

**Chargés par leur page** (import dans la vue, pas dans `main.js`) :

| Fichier | Vue |
|---------|-----|
| `lab.css` | PageLaboratoire (+ InstrumentButton, LabReport*) |
| `carte.css` | PageCarte (+ CarteMap3D, CarteOrbitalView) |
| `population.css` | PagePopulation |
| `journal.css` | PageJournal |
| `artifact.css` | PageArtefacts |
| `systems.css` | PageSystemes |

---

## 6. Référence rapide

**Padding modales** : `--space-8`  
**Dividers** : composant `<Divider variant="dashed" />` ou `variant="solid"` — remplacer les border  
**Cellules (ModalCell)** : `solid`  
**Key/val** : `.sw-row` + `.sw-key` / `.sw-val`  
**Valeurs dynamiques** : `valClass()`, `barClass()`  
**Couleur accent** : `--color-cyan`  
**Couleur alertes** : `--color-amber`  
