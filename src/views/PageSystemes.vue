<script setup>
import { ref } from 'vue'

const activeSection = ref('identity')
const overlayVisible = ref(true)

// Données vaisseau (mock — à connecter Supabase plus tard)
const ship = ref({
  name: 'ARCA',
  class: 'Vaisseau générationnel de classe I',
  builtYear: 2187,
  ageRelative: 47,
  ageReal: 53,
  ageGap: 6,
  dryMass: 800000,
  capacity: 12000,
  population: 10247,
  generation: 1,
})

const propulsion = ref({ value: 0.88, desc: 'Moteur MTF — poussée nominale 0,12g', state: 'accélération max 0,106g', consequence: 'vitesse croisière atteinte plus lentement' })
const hull = ref({ value: 0.97, desc: 'Résistance aux impacts et contraintes structurelles', state: 'nominal', consequence: '' })
const plasmaShield = ref({ value: 1, desc: 'Protection contre poussière interstellaire à haute vitesse', state: 'vitesse safe 4,8%c (nominal)', consequence: 'Si dégradé : vitesse safe réduite' })

const he3 = ref({ current: 1484000, max: 2000000, pct: 0.742 })
const deuterium = ref({ current: 972000, max: 1200000, pct: 0.81 })
const fuel = ref({ speed: '4,8%c', consumption: '~61,7% masse actuelle', autonomy: '1 voyage pleine vitesse · 4 voyages à 2,0%c' })

const reservoir = ref({ value: 0.84, desc: 'recyclage eau et matières premières' })
const alimentation = ref({ value: 0.71, desc: 'production et distribution alimentaire' })
const atmosphere = ref({ value: 0.96, desc: 'O₂, CO₂, pression, température' })
const medical = ref({ value: 0.95, desc: 'soins, épidémiologie, pharmacopée' })
const observatoire = ref({ value: 1, desc: 'instruments de détection et d\'analyse' })

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
          class="sys-menu-item"
          :class="{ selected: overlayVisible && activeSection === 'identity' }"
          @click="activeSection = 'identity'; overlayVisible = true"
        >
          <span class="sys-menu-item__icon">◈</span>
          Identité
        </div>
        <div
          class="sys-menu-item"
          :class="{ selected: overlayVisible && activeSection === 'propulsion' }"
          @click="activeSection = 'propulsion'; overlayVisible = true"
        >
          <span class="sys-menu-item__icon">≋</span>
          Propulsion & Structure
        </div>
        <div
          class="sys-menu-item"
          :class="{ selected: overlayVisible && activeSection === 'fuel' }"
          @click="activeSection = 'fuel'; overlayVisible = true"
        >
          <span class="sys-menu-item__icon">◉</span>
          Carburant
        </div>
        <div
          class="sys-menu-item"
          :class="{ selected: overlayVisible && activeSection === 'survie' }"
          @click="activeSection = 'survie'; overlayVisible = true"
        >
          <span class="sys-menu-item__icon">⊕</span>
          Survie
        </div>
        <div
          class="sys-menu-item"
          :class="{ selected: overlayVisible && activeSection === 'history' }"
          @click="activeSection = 'history'; overlayVisible = true"
        >
          <span class="sys-menu-item__icon">≡</span>
          Historique
        </div>
      </div>

      <!-- Colonne droite : plan + overlay -->
      <div class="sys-ship-col">
        <!-- Plan SVG — pleine largeur, ratio conservé -->
        <div class="sys-blueprint-wrap">
          <img src="/ARCA_blueprint_grouped.svg" alt="Plan du vaisseau ARCA" />
        </div>

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

        <!-- Propulsion & Structure -->
        <div v-show="activeSection === 'propulsion'">
          <div class="sys-section-title">Propulsion & Structure</div>
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

        <!-- Carburant -->
        <div v-show="activeSection === 'fuel'">
          <div class="sys-section-title">Carburant</div>
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

        <!-- Survie -->
        <div v-show="activeSection === 'survie'">
          <div class="sys-section-title">Systèmes de survie</div>
          <p class="sys-indicator__desc" style="margin-bottom: var(--space-5)">
            Efficacité des systèmes (boucle fermée) — pas un niveau de stock.
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
          <div class="sys-indicator">
            <div class="sys-indicator__row">
              <span class="sys-indicator__label">OBSERVATOIRE</span>
              <span class="sys-indicator__val">{{ observatoire.value.toFixed(2) }}</span>
            </div>
            <div class="bar-wrap">
              <div class="bar-fill bar-cyan" :style="{ width: barWidth(observatoire.value) }" />
            </div>
            <div class="sys-indicator__desc">{{ observatoire.desc }}</div>
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
