<script setup>
import { ref, watch, nextTick, onBeforeUnmount, onMounted, computed } from 'vue'
import { useShipStore } from '@/stores/ship'

const shipStore = useShipStore()
const activeSection = ref(null)
const overlayVisible = ref(false)
const blueprintRef = ref(null)
const blueprintCleanups = []

// Menu = 1 item par groupe SVG + Identité + Historique
// legendColor = couleur de la légende pour les icônes (green, cyan, amber, signal)
const MENU_ITEMS = [
  { id: 'identity', label: 'Identité', icon: '◈', groupIds: [] },
  { id: 'plasma-shield', label: 'Bouclier plasma', icon: '◎', groupIds: ['plasma-shield'], legendColor: 'cyan' },
  { id: 'bumper-shield', label: 'Pare-chocs ablatif', icon: '⬡', groupIds: ['bumper-shield'], legendColor: 'bumper' },
  { id: 'population-quarters', label: 'Anneaux habitat', icon: '⊕', groupIds: ['population-quarters'], legendColor: 'green' },
  { id: 'fission-reactors', label: 'Réacteurs & Cargaison', icon: '⌬', groupIds: ['fission-reactors'], legendColor: 'cyan' },
  { id: 'thermal-radiators', label: 'Radiateurs thermiques', icon: '☰', groupIds: ['thermal-radiators'], legendColor: 'amber' },
  { id: 'fuel-tanks', label: 'Réservoirs cryogéniques', icon: '◉', groupIds: ['fuel-tanks'], legendColor: 'cyan' },
  { id: 'propulsion', label: 'Moteur fusion MTF', icon: '≋', groupIds: ['propulsion'], legendColor: 'signal' },
  { id: 'comms', label: 'Laser comms', icon: '↕', groupIds: ['comms'], legendColor: 'comms' },
  { id: 'navigation', label: 'Navigation pulsar', icon: '✧', groupIds: ['navigation'], legendColor: 'nav' },
  { id: 'history', label: 'Historique', icon: '≡', groupIds: [] },
]

const ALL_GROUP_IDS = ['plasma-shield', 'bumper-shield', 'population-quarters', 'fission-reactors', 'thermal-radiators', 'fuel-tanks', 'propulsion', 'comms', 'navigation']

function updateBlueprintHighlight() {
  const obj = blueprintRef.value
  if (!obj?.contentDocument) return
  const doc = obj.contentDocument
  const item = MENU_ITEMS.find((m) => m.id === activeSection.value)
  const idsToHighlight = overlayVisible.value && item ? item.groupIds : []
  ALL_GROUP_IDS.forEach((id) => {
    const el = doc.getElementById(id)
    if (el) {
      el.classList.toggle('sys-highlight', idsToHighlight.includes(id))
      el.classList.toggle('sys-dimmed', idsToHighlight.length > 0 && !idsToHighlight.includes(id))
    }
  })
}

function setupBlueprintInteractivity() {
  const obj = blueprintRef.value
  if (!obj?.contentDocument) return
  const doc = obj.contentDocument

  blueprintCleanups.length = 0
  ALL_GROUP_IDS.forEach((groupId) => {
    const el = doc.getElementById(groupId)
    if (!el) return

    const onGroupClick = () => {
      activeSection.value = groupId
      overlayVisible.value = true
    }
    const onGroupEnter = () => el.classList.add('sys-hover')
    const onGroupLeave = () => el.classList.remove('sys-hover')

    el.style.cursor = 'pointer'
    el.addEventListener('click', onGroupClick)
    el.addEventListener('mouseenter', onGroupEnter)
    el.addEventListener('mouseleave', onGroupLeave)

    blueprintCleanups.push(() => {
      el.style.cursor = ''
      el.classList.remove('sys-hover')
      el.removeEventListener('click', onGroupClick)
      el.removeEventListener('mouseenter', onGroupEnter)
      el.removeEventListener('mouseleave', onGroupLeave)
    })
  })

  // Clic en zone vide → désélection
  const svgRoot = doc.documentElement
  const onSvgClick = (e) => {
    const g = e.target.closest?.('g[id]')
    if (g && ALL_GROUP_IDS.includes(g.id)) return // clic sur un groupe, ne pas désélectionner
    activeSection.value = null
    overlayVisible.value = false
  }
  svgRoot.addEventListener('click', onSvgClick)
  blueprintCleanups.push(() => svgRoot.removeEventListener('click', onSvgClick))
}

function onPlanContainerClick(e) {
  if (e.target.closest('.sys-overlay')) return // ne pas désélectionner si clic sur l'overlay
  activeSection.value = null
  overlayVisible.value = false
}

function onBlueprintLoad() {
  updateBlueprintHighlight()
  setupBlueprintInteractivity()
}

onBeforeUnmount(() => {
  blueprintCleanups.forEach((fn) => fn())
})

watch([activeSection, overlayVisible], () => {
  nextTick(updateBlueprintHighlight)
})

// Données vaisseau (store Supabase + placeholders âge relatif/réel/écart)
const ship = computed(() => ({
  name: shipStore.name,
  fullName: 'A R C A — AUTONOMOUS RELATIVISTIC COLONY ARK',
  planDesc: 'VUE LATÉRALE — ÉCHELLE 1:8000 — LONGUEUR ~20 KM',
  class: shipStore.classe,
  builtYear: shipStore.builtYear ?? 2187,
  ageRelative: 47,   // TODO: calculé depuis voyages (stationnement étoiles massives)
  ageReal: 53,       // TODO: temps simulé joueur
  ageGap: 6,         // TODO: ageReal - ageRelative
  dryMass: shipStore.dryMass,
  capacity: shipStore.capacity,
  population: shipStore.population?.total ?? 10247,
  generation: shipStore.generation,
}))

onMounted(async () => {
  if (!shipStore.loaded) await shipStore.fetch()
})

// Légende du plan (extrait du SVG)
const blueprintLegend = ref({
  items: [
    { type: 'rect', color: 'green', label: 'HABITATS ROTATIFS' },
    { type: 'rect', color: 'cyan', label: 'RÉSERVOIRS CRYOGÉNIQUES' },
    { type: 'rect', color: 'amber', label: 'RADIATEURS THERMIQUES' },
    { type: 'circle', color: 'cyan', label: 'RÉACTEURS FISSION' },
    { type: 'rect', color: 'signal', label: 'CHAMBRE FUSION MTF' },
    { type: 'line', color: 'cyan', label: 'BOUCLIER PLASMA MAGNÉTIQUE' },
  ],
  systems: [
    'Propulsion : fusion D+He³ — Δv ~12%c',
    'Vitesse croisière : 4.8%c (~14 400 km/s)',
    'Durée : ~160 ans',
    'Masse départ : ~4.5 Mt',
    'Population : 10 000 âmes',
    'Destination : Proxima Centauri b — 4.24 al',
  ],
})

const propulsion = computed(() => ({ value: shipStore.systems.propulsion ?? 0.88, desc: 'Moteur MTF — poussée nominale 0,12g', state: 'accélération max 0,106g', consequence: 'vitesse croisière atteinte plus lentement' }))
const hull = computed(() => ({ value: shipStore.systems.hull ?? 0.97, desc: 'Résistance aux impacts et contraintes structurelles', state: 'nominal', consequence: '' }))
const plasmaShield = computed(() => ({ value: shipStore.systems.plasmaShield ?? 1, desc: 'Protection contre poussière interstellaire à haute vitesse', state: 'vitesse safe 4,8%c (nominal)', consequence: 'Si dégradé : vitesse safe réduite' }))

const he3 = computed(() => {
  const s = shipStore.shipSystems
  const curr = s?.he3_current ?? 1484000
  const max = s?.he3_max ?? 2000000
  return { current: curr, max, pct: max ? Number(curr) / Number(max) : 0.742 }
})
const deuterium = computed(() => {
  const s = shipStore.shipSystems
  const curr = s?.deuterium_current ?? 972000
  const max = s?.deuterium_max ?? 1200000
  return { current: curr, max, pct: max ? Number(curr) / Number(max) : 0.81 }
})
const fuel = ref({ speed: '4,8%c', consumption: '~61,7% masse actuelle', autonomy: '1 voyage pleine vitesse · 4 voyages à 2,0%c' })

const reservoir = computed(() => ({ value: shipStore.systems.reservoir ?? 0.84, desc: 'recyclage eau et matières premières' }))
const alimentation = computed(() => ({ value: shipStore.systems.alimentation ?? 0.71, desc: 'production et distribution alimentaire' }))
const atmosphere = computed(() => ({ value: shipStore.systems.atmosphere ?? 0.96, desc: 'O₂, CO₂, pression, température' }))
const medical = computed(() => ({ value: shipStore.systems.medical ?? 0.95, desc: 'soins, épidémiologie, pharmacopée' }))
const observatoire = computed(() => ({ value: shipStore.systems.observatory ?? 1, desc: 'instruments de détection et d\'analyse' }))

const history = ref([
  { gen: 1, date: '2189-03-14', event: 'Micro-impact coque — secteur 7', delta: -0.03, system: 'hull' },
  { gen: 1, date: '2191-07-02', event: 'Réparation partielle coque', delta: 0.01, system: 'hull' },
  { gen: 1, date: '2194-11-19', event: 'Dégradation propulsion — usure MTF', delta: -0.12, system: 'propulsion' },
])

function barWidth(val) {
  return Math.round((val || 0) * 100) + '%'
}

function formatNum(n) {
  return new Intl.NumberFormat('fr-FR').format(n)
}
</script>

<template>
  <div class="page-full page-full--spread page-full--systems">
    <div class="sys-layout">
      <!-- Colonne gauche : menu -->
      <div class="sys-menu-col">
        <h1 class="page-title">Systèmes</h1>
        <div class="panel-section-title" style="margin-bottom: var(--space-6)">
          Tableau de bord ARCA
        </div>
        <div
          v-for="item in MENU_ITEMS"
          :key="item.id"
          class="sys-menu-item"
          :class="{ selected: overlayVisible && activeSection === item.id }"
          @click="activeSection = item.id; overlayVisible = true"
        >
          <span
            class="sys-menu-item__icon"
            :class="item.legendColor && `sys-menu-item__icon--${item.legendColor}`"
          >{{ item.icon }}</span>
          {{ item.label }}
        </div>
      </div>

      <!-- Colonne droite : plan + overlay -->
      <div class="sys-ship-col" @click="onPlanContainerClick">
        <!-- Header du plan (extrait du SVG) -->
        <header class="sys-blueprint-header">
          <h2 class="sys-blueprint-header__title">{{ ship.fullName }}</h2>
          <p class="sys-blueprint-header__desc">{{ ship.planDesc }}</p>
        </header>
        <!-- Plan SVG — pleine largeur, ratio conservé -->
        <div class="sys-blueprint-wrap">
          <object
            ref="blueprintRef"
            type="image/svg+xml"
            data="/ARCA_blueprint_grouped.svg"
            class="sys-blueprint-svg"
            title="Plan du vaisseau ARCA"
            @load="onBlueprintLoad"
          />
        </div>

        <!-- Footer du plan — légende (extrait du SVG) -->
        <footer class="sys-blueprint-footer">
          <div class="sys-blueprint-legend">
            <span class="sys-blueprint-legend__label">LÉGENDE :</span>
            <template v-for="item in blueprintLegend.items" :key="item.label">
              <span class="sys-blueprint-legend__item">
                <span
                  class="sys-blueprint-legend__swatch"
                  :class="[`sys-blueprint-legend__swatch--${item.type}`, `sys-blueprint-legend__swatch--${item.color}`]"
                />
                {{ item.label }}
              </span>
            </template>
          </div>
          <div class="sys-blueprint-systems">
            <span class="sys-blueprint-systems__label">SYSTÈMES :</span>
            <span
              v-for="(spec, i) in blueprintLegend.systems"
              :key="i"
              class="sys-blueprint-systems__spec"
            >
              <template v-if="i > 0"> | </template>{{ spec }}
            </span>
          </div>
        </footer>

        <!-- Overlay infos de l'onglet sélectionné (fermable, hug content) -->
        <div v-if="overlayVisible" class="sys-overlay">
          <button type="button" class="sys-overlay__close" title="Fermer" @click="overlayVisible = false; activeSection = null">×</button>
        <!-- Identité -->
        <div v-show="activeSection === 'identity'" class="sys-identity">
          <div class="sys-identity__title">{{ ship.name }} — {{ ship.class }}</div>
          <div class="sys-identity__row">
            <span class="sys-identity__key">Construit</span>
            <span class="sys-identity__val">{{ ship.builtYear }}</span>
          </div>
          <div class="sys-identity__row">
            <span class="sys-identity__key">Âge relatif</span>
            <span class="sys-identity__val">{{ ship.ageRelative }} ans</span>
          </div>
          <div class="sys-identity__row">
            <span class="sys-identity__key">Âge réel</span>
            <span class="sys-identity__val">{{ ship.ageReal }} ans</span>
          </div>
          <div class="sys-identity__row">
            <span class="sys-identity__key">Écart</span>
            <span class="sys-identity__val">+{{ ship.ageGap }} ans</span>
          </div>
          <div class="sys-identity__row">
            <span class="sys-identity__key">Masse sèche</span>
            <span class="sys-identity__val">{{ formatNum(ship.dryMass) }} t</span>
          </div>
          <div class="sys-identity__row">
            <span class="sys-identity__key">Capacité</span>
            <span class="sys-identity__val">{{ formatNum(ship.capacity) }} personnes</span>
          </div>
          <div class="sys-identity__row">
            <span class="sys-identity__key">Population actuelle</span>
            <span class="sys-identity__val">{{ formatNum(ship.population) }}</span>
          </div>
          <div class="sys-identity__row">
            <span class="sys-identity__key">Génération</span>
            <span class="sys-identity__val">{{ ship.generation }}</span>
          </div>
        </div>

        <!-- Bouclier plasma -->
        <div v-show="activeSection === 'plasma-shield'">
          <div class="sys-section-title">Bouclier plasma</div>
          <div class="sys-indicator">
            <div class="sys-indicator__name">BOUCLIER PLASMA</div>
            <div class="sys-indicator__row">
              <span class="sys-indicator__label">{{ plasmaShield.value.toFixed(2) }}</span>
            </div>
            <div class="bar-wrap">
              <div class="bar-fill bar-cyan" :style="{ width: barWidth(plasmaShield.value) }" />
            </div>
            <div class="sys-indicator__desc">{{ plasmaShield.desc }}</div>
            <div class="sys-indicator__desc">{{ plasmaShield.state }}</div>
          </div>
        </div>

        <!-- Pare-chocs ablatif -->
        <div v-show="activeSection === 'bumper-shield'">
          <div class="sys-section-title">Pare-chocs ablatif</div>
          <div class="sys-indicator">
            <div class="sys-indicator__name">COQUE</div>
            <div class="sys-indicator__row">
              <span class="sys-indicator__label">{{ hull.value.toFixed(2) }}</span>
            </div>
            <div class="bar-wrap">
              <div class="bar-fill bar-cyan" :style="{ width: barWidth(hull.value) }" />
            </div>
            <div class="sys-indicator__desc">{{ hull.desc }}</div>
          </div>
        </div>

        <!-- Anneaux habitat -->
        <div v-show="activeSection === 'population-quarters'">
          <div class="sys-section-title">Anneaux habitat rotatifs</div>
          <p class="sys-indicator__desc" style="margin-bottom: var(--space-5)">
            Efficacité des systèmes de survie (boucle fermée).
          </p>
          <div class="sys-indicator">
            <div class="sys-indicator__row">
              <span class="sys-indicator__label">RÉSERVOIR</span>
              <span class="sys-indicator__val">{{ reservoir.value.toFixed(2) }}</span>
            </div>
            <div class="bar-wrap">
              <div class="bar-fill bar-cyan" :style="{ width: barWidth(reservoir.value) }" />
            </div>
            <div class="sys-indicator__desc">{{ reservoir.desc }}</div>
          </div>
          <div class="sys-indicator">
            <div class="sys-indicator__row">
              <span class="sys-indicator__label">ALIMENTATION</span>
              <span class="sys-indicator__val">{{ alimentation.value.toFixed(2) }}</span>
            </div>
            <div class="bar-wrap">
              <div class="bar-fill bar-cyan" :style="{ width: barWidth(alimentation.value) }" />
            </div>
            <div class="sys-indicator__desc">{{ alimentation.desc }}</div>
          </div>
          <div class="sys-indicator">
            <div class="sys-indicator__row">
              <span class="sys-indicator__label">ATMOSPHÈRE</span>
              <span class="sys-indicator__val">{{ atmosphere.value.toFixed(2) }}</span>
            </div>
            <div class="bar-wrap">
              <div class="bar-fill bar-cyan" :style="{ width: barWidth(atmosphere.value) }" />
            </div>
            <div class="sys-indicator__desc">{{ atmosphere.desc }}</div>
          </div>
          <div class="sys-indicator">
            <div class="sys-indicator__row">
              <span class="sys-indicator__label">MÉDICAL</span>
              <span class="sys-indicator__val">{{ medical.value.toFixed(2) }}</span>
            </div>
            <div class="bar-wrap">
              <div class="bar-fill bar-cyan" :style="{ width: barWidth(medical.value) }" />
            </div>
            <div class="sys-indicator__desc">{{ medical.desc }}</div>
          </div>
        </div>

        <!-- Réacteurs & Cargaison -->
        <div v-show="activeSection === 'fission-reactors'">
          <div class="sys-section-title">Réacteurs fission & Cargaison</div>
          <div class="sys-indicator__desc">
            SAFE-400 × 12 — 800 MW électriques — triple redondance. Banque génomique, embryons, semences.
          </div>
        </div>

        <!-- Radiateurs thermiques -->
        <div v-show="activeSection === 'thermal-radiators'">
          <div class="sys-section-title">Radiateurs thermiques</div>
          <div class="sys-indicator__desc">
            Graphite pyrolytique — ~40 km² — perpendiculaires à l'axe de vol.
          </div>
        </div>

        <!-- Réservoirs cryogéniques -->
        <div v-show="activeSection === 'fuel-tanks'">
          <div class="sys-section-title">Réservoirs cryogéniques</div>
          <p class="sys-indicator__desc" style="margin-bottom: var(--space-5)">
            He³ et deutérium ne sont pas en boucle fermée — consommation par voyage (Tsiolkovsky).
          </p>
          <div class="sys-indicator">
            <div class="sys-indicator__name">He³</div>
            <div class="sys-indicator__row">
              <span class="sys-indicator__label">{{ formatNum(he3.current) }} t / {{ formatNum(he3.max) }} t</span>
              <span class="sys-indicator__val">{{ (he3.pct * 100).toFixed(1) }}%</span>
            </div>
            <div class="bar-wrap">
              <div class="bar-fill bar-cyan" :style="{ width: barWidth(he3.pct) }" />
            </div>
          </div>
          <div class="sys-indicator">
            <div class="sys-indicator__name">Deutérium</div>
            <div class="sys-indicator__row">
              <span class="sys-indicator__label">{{ formatNum(deuterium.current) }} t / {{ formatNum(deuterium.max) }} t</span>
              <span class="sys-indicator__val">{{ (deuterium.pct * 100).toFixed(1) }}%</span>
            </div>
            <div class="bar-wrap">
              <div class="bar-fill bar-cyan" :style="{ width: barWidth(deuterium.pct) }" />
            </div>
          </div>
          <div class="sys-identity" style="margin-top: var(--space-6)">
            <div class="sys-identity__row">
              <span class="sys-identity__key">Vitesse actuelle</span>
              <span class="sys-identity__val">{{ fuel.speed }}</span>
            </div>
            <div class="sys-identity__row">
              <span class="sys-identity__key">Autonomie estimée</span>
              <span class="sys-identity__val">{{ fuel.autonomy }}</span>
            </div>
          </div>
        </div>

        <!-- Moteur fusion MTF -->
        <div v-show="activeSection === 'propulsion'">
          <div class="sys-section-title">Moteur fusion MTF</div>
          <div class="sys-indicator">
            <div class="sys-indicator__name">PROPULSION</div>
            <div class="sys-indicator__row">
              <span class="sys-indicator__label">{{ propulsion.value.toFixed(2) }}</span>
            </div>
            <div class="bar-wrap">
              <div class="bar-fill bar-cyan" :style="{ width: barWidth(propulsion.value) }" />
            </div>
            <div class="sys-indicator__desc">{{ propulsion.desc }}</div>
            <div class="sys-indicator__desc">État actuel : {{ propulsion.state }}</div>
          </div>
        </div>

        <!-- Laser comms -->
        <div v-show="activeSection === 'comms'">
          <div class="sys-section-title">Laser comms</div>
          <div class="sys-indicator">
            <div class="sys-indicator__row">
              <span class="sys-indicator__label">OBSERVATOIRE</span>
              <span class="sys-indicator__val">{{ observatoire.value.toFixed(2) }}</span>
            </div>
            <div class="bar-wrap">
              <div class="bar-fill bar-cyan" :style="{ width: barWidth(observatoire.value) }" />
            </div>
            <div class="sys-indicator__desc">{{ observatoire.desc }}</div>
            <div class="sys-indicator__desc">1 Gbps — délai 4.24 ans</div>
          </div>
        </div>

        <!-- Navigation pulsar -->
        <div v-show="activeSection === 'navigation'">
          <div class="sys-section-title">Navigation pulsar</div>
          <div class="sys-indicator__desc">
            Pulsar MSP pour localisation et orientation en transit interstellaire.
          </div>
        </div>

        <!-- Historique -->
        <div v-show="activeSection === 'history'">
          <div class="sys-section-title">Historique technique</div>
          <div
            v-for="(h, i) in history"
            :key="i"
            class="sys-history-item"
          >
            <div class="sys-history-item__meta">GÉN. {{ h.gen }} — {{ h.date }}</div>
            <div>
              {{ h.event }}
              <span
                class="sys-history-item__delta"
                :class="{ positive: h.delta > 0 }"
              >
                {{ h.delta > 0 ? '+' : '' }}{{ h.delta }} {{ h.system }}
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>
