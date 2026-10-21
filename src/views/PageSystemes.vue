<script setup>
import '@/assets/components/systems.css'
import { ref, watch, nextTick, onBeforeUnmount, onMounted, computed } from 'vue'
import { useShipStore } from '@/stores/ship'
import { ensureStoresLoaded } from '@/composables/useStoreReady'
import { SYSTEMS_MENU_ITEMS } from '@/constants/menus'
import NavMenuItem from '@/components/NavMenuItem.vue'
import AppModal from '@/components/AppModal.vue'
import Divider from '@/components/Divider.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import { formatNumber } from '@/lib/formatUtils'

const shipStore = useShipStore()
const activeSection = ref(null)
const overlayVisible = ref(false)
const blueprintRef = ref(null)
const blueprintCleanups = []

const ALL_GROUP_IDS = ['plasma-shield', 'bumper-shield', 'population-quarters', 'fission-reactors', 'thermal-radiators', 'fuel-tanks', 'propulsion', 'comms', 'navigation']

function updateBlueprintHighlight() {
  const obj = blueprintRef.value
  if (!obj?.contentDocument) return
  const doc = obj.contentDocument
  const item = SYSTEMS_MENU_ITEMS.find((m) => m.id === activeSection.value)
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
  await ensureStoresLoaded(shipStore)
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

const modalTitle = computed(() => {
  const item = SYSTEMS_MENU_ITEMS.find((m) => m.id === activeSection.value)
  return item?.label ?? ''
})

function closeOverlay() {
  overlayVisible.value = false
  activeSection.value = null
}
</script>

<template>
  <div class="page-full page-full--spread page-full--systems">
    <div class="sys-layout">
      <!-- Colonne gauche : menu -->
      <div class="sys-menu-col">
        <h1 class="page-title">Systèmes</h1>
        <div class="panel-section-title mb-6">
          Tableau de bord ARCA
        </div>
        <NavMenuItem
          v-for="item in SYSTEMS_MENU_ITEMS"
          :key="item.id"
          variant="menu"
          :icon="item.icon"
          :label="item.label"
          :icon-color="item.legendColor || ''"
          :selected="overlayVisible && activeSection === item.id"
          @click="activeSection = item.id; overlayVisible = true"
        />
      </div>

      <!-- Colonne droite : plan + modale -->
      <div class="sys-ship-col">
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

        <!-- Modale infos (AppModal, position top-right) -->
        <AppModal
          v-if="overlayVisible"
          :title="modalTitle"
          position="top-right"
          :overlay="false"
          @close="closeOverlay"
        >
          <!-- Identité -->
          <div v-show="activeSection === 'identity'" class="sys-modal-content">
            <p class="sys-modal-subtitle">{{ ship.name }} — {{ ship.class }}</p>
            <div class="sw-row"><span class="sw-key">Construit</span><span class="sw-val">{{ ship.builtYear }}</span></div>
            <Divider variant="solid" tight />
            <div class="sw-row"><span class="sw-key">Âge relatif</span><span class="sw-val">{{ ship.ageRelative }} ans</span></div>
            <Divider variant="solid" tight />
            <div class="sw-row"><span class="sw-key">Âge réel</span><span class="sw-val">{{ ship.ageReal }} ans</span></div>
            <Divider variant="solid" tight />
            <div class="sw-row"><span class="sw-key">Écart</span><span class="sw-val">+{{ ship.ageGap }} ans</span></div>
            <Divider variant="solid" tight />
            <div class="sw-row"><span class="sw-key">Masse sèche</span><span class="sw-val">{{ formatNumber(ship.dryMass) }} t</span></div>
            <Divider variant="solid" tight />
            <div class="sw-row"><span class="sw-key">Capacité</span><span class="sw-val">{{ formatNumber(ship.capacity) }} personnes</span></div>
            <Divider variant="solid" tight />
            <div class="sw-row"><span class="sw-key">Population actuelle</span><span class="sw-val">{{ formatNumber(ship.population) }}</span></div>
            <Divider variant="solid" tight />
            <div class="sw-row"><span class="sw-key">Génération</span><span class="sw-val">{{ ship.generation }}</span></div>
          </div>

          <!-- Bouclier plasma -->
          <div v-show="activeSection === 'plasma-shield'" class="sys-modal-content">
            <div class="sys-indicator-block">
              <div class="sw-row"><span class="sw-key">Bouclier plasma</span><span class="sw-val">{{ plasmaShield.value.toFixed(2) }}</span></div>
              <p class="sys-value-desc">{{ plasmaShield.desc }}</p>
              <p class="sys-value-desc">{{ plasmaShield.state }}</p>
              <ProgressBar :value="plasmaShield.value" color="cyan" />
            </div>
          </div>

          <!-- Pare-chocs ablatif -->
          <div v-show="activeSection === 'bumper-shield'" class="sys-modal-content">
            <div class="sys-indicator-block">
              <div class="sw-row"><span class="sw-key">Coque</span><span class="sw-val">{{ hull.value.toFixed(2) }}</span></div>
              <p class="sys-value-desc">{{ hull.desc }}</p>
              <ProgressBar :value="hull.value" color="cyan" />
            </div>
          </div>

          <!-- Anneaux habitat -->
          <div v-show="activeSection === 'population-quarters'" class="sys-modal-content">
            <p class="sw-desc">Efficacité des systèmes de survie (boucle fermée).</p>
            <Divider variant="solid" tight />
            <template
v-for="(ind, i) in [
              { key: 'Réservoir', val: reservoir.value.toFixed(2), desc: reservoir.desc, bar: reservoir.value },
              { key: 'Alimentation', val: alimentation.value.toFixed(2), desc: alimentation.desc, bar: alimentation.value },
              { key: 'Atmosphère', val: atmosphere.value.toFixed(2), desc: atmosphere.desc, bar: atmosphere.value },
              { key: 'Médical', val: medical.value.toFixed(2), desc: medical.desc, bar: medical.value },
            ]" :key="ind.key">
              <Divider v-if="i > 0" variant="solid" tight />
              <div class="sys-indicator-block">
                <div class="sw-row"><span class="sw-key">{{ ind.key }}</span><span class="sw-val">{{ ind.val }}</span></div>
                <p class="sys-value-desc">{{ ind.desc }}</p>
                <ProgressBar :value="ind.bar" color="cyan" />
              </div>
            </template>
          </div>

          <!-- Réacteurs & Cargaison -->
          <div v-show="activeSection === 'fission-reactors'" class="sys-modal-content">
            <p class="sw-desc">SAFE-400 × 12 — 800 MW électriques — triple redondance. Banque génomique, embryons, semences.</p>
          </div>

          <!-- Radiateurs thermiques -->
          <div v-show="activeSection === 'thermal-radiators'" class="sys-modal-content">
            <p class="sw-desc">Graphite pyrolytique — ~40 km² — perpendiculaires à l'axe de vol.</p>
          </div>

          <!-- Réservoirs cryogéniques -->
          <div v-show="activeSection === 'fuel-tanks'" class="sys-modal-content">
            <p class="sw-desc">He³ et deutérium ne sont pas en boucle fermée — consommation par voyage (Tsiolkovsky).</p>
            <Divider variant="solid" tight />
            <div class="sys-indicator-block">
              <div class="sw-row"><span class="sw-key">He³</span><span class="sw-val">{{ formatNumber(he3.current) }} t / {{ formatNumber(he3.max) }} t · {{ (he3.pct * 100).toFixed(1) }}%</span></div>
              <ProgressBar :value="he3.pct" color="cyan" />
            </div>
            <Divider variant="solid" tight />
            <div class="sys-indicator-block">
              <div class="sw-row"><span class="sw-key">Deutérium</span><span class="sw-val">{{ formatNumber(deuterium.current) }} t / {{ formatNumber(deuterium.max) }} t · {{ (deuterium.pct * 100).toFixed(1) }}%</span></div>
              <ProgressBar :value="deuterium.pct" color="cyan" />
            </div>
            <Divider variant="solid" tight />
            <div class="sw-row"><span class="sw-key">Vitesse actuelle</span><span class="sw-val">{{ fuel.speed }}</span></div>
            <div class="sw-row"><span class="sw-key">Autonomie estimée</span><span class="sw-val">{{ fuel.autonomy }}</span></div>
          </div>

          <!-- Moteur fusion MTF -->
          <div v-show="activeSection === 'propulsion'" class="sys-modal-content">
            <div class="sys-indicator-block">
              <div class="sw-row"><span class="sw-key">Propulsion</span><span class="sw-val">{{ propulsion.value.toFixed(2) }}</span></div>
              <p class="sys-value-desc">{{ propulsion.desc }}</p>
              <p class="sys-value-desc">État actuel : {{ propulsion.state }}</p>
              <ProgressBar :value="propulsion.value" color="cyan" />
            </div>
          </div>

          <!-- Laser comms -->
          <div v-show="activeSection === 'comms'" class="sys-modal-content">
            <div class="sys-indicator-block">
              <div class="sw-row"><span class="sw-key">Observatoire</span><span class="sw-val">{{ observatoire.value.toFixed(2) }}</span></div>
              <p class="sys-value-desc">{{ observatoire.desc }}</p>
              <p class="sys-value-desc">1 Gbps — délai 4.24 ans</p>
              <ProgressBar :value="observatoire.value" color="cyan" />
            </div>
          </div>

          <!-- Navigation pulsar -->
          <div v-show="activeSection === 'navigation'" class="sys-modal-content">
            <p class="sw-desc">Pulsar MSP pour localisation et orientation en transit interstellaire.</p>
          </div>

          <!-- Historique -->
          <div v-show="activeSection === 'history'" class="sys-modal-content">
            <template v-for="(h, i) in history" :key="i">
              <Divider v-if="i > 0" variant="solid" tight />
              <div class="sys-history-item">
                <div class="sw-key sys-history-item__meta">GÉN. {{ h.gen }} — {{ h.date }}</div>
                <div class="sys-history-item__event">
                  {{ h.event }}
                  <span class="sw-val ml-2" :class="h.delta > 0 ? 'ok' : 'warn'">
                    {{ h.delta > 0 ? '+' : '' }}{{ h.delta }} {{ h.system }}
                  </span>
                </div>
              </div>
            </template>
          </div>
        </AppModal>
      </div>
    </div>
  </div>
</template>
