<script setup>
import StarSvgInline from '@/components/illustrations/StarSvgInline.vue'

const props = defineProps({
  /** ID du système */
  systemId: { type: String, default: '' },
  /** Nom du système */
  name: { type: String, default: '' },
  /** Type spectral pour l'illustration */
  spectralType: { type: String, default: 'G2V' },
  /** Nombre d'exoplanètes */
  exoplanetCount: { type: Number, default: 0 },
  /** État visuel : idle | selected */
  state: { type: String, default: 'idle' },
  /** Badge optionnel (ex. traces_found) */
  badge: { type: [String, Number], default: '' },
  /** Afficher le bouton supprimer */
  dismissable: { type: Boolean, default: true },
})

const emit = defineEmits(['click', 'dismiss'])

function onClick() {
  emit('click')
}

function onDismiss(e) {
  e.stopPropagation()
  emit('dismiss')
}
</script>

<template>
  <div
    class="carte-system-card"
    :class="[`carte-system-card--state-${state}`]"
    role="button"
    tabindex="0"
    @click="onClick"
    @keydown.enter.space.prevent="onClick"
  >
    <button
      v-if="dismissable"
      type="button"
      class="carte-system-card__dismiss"
      aria-label="Retirer de la carte"
      @click="onDismiss"
    >
      ×
    </button>
    <span v-if="badge" class="carte-system-card__badge" :title="String(badge)">{{ badge }}</span>
    <div class="carte-system-card__body">
      <span class="carte-system-card__icon">
        <StarSvgInline :spectral-type="spectralType" />
      </span>
      <div class="carte-system-card__main">
        <div class="carte-system-card__title">{{ name || systemId }}</div>
        <div class="carte-system-card__row">
          {{ exoplanetCount === 0 ? 'Aucune exoplanète' : exoplanetCount === 1 ? '1 exoplanète' : `${exoplanetCount} exoplanètes` }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.carte-system-card {
  position: relative;
  padding: var(--space-3) var(--space-4);
  padding-right: 28px;
  margin-bottom: var(--space-2);
  border: var(--border-width) solid var(--border-default);
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: border-color var(--transition-base), background var(--transition-base);
}

.carte-system-card:hover {
  border-color: var(--border-bright);
  background: var(--color-cyan-subtle);
}

.carte-system-card--state-selected {
  border-color: var(--color-cyan);
  background: var(--color-cyan-subtle);
}

.carte-system-card__dismiss {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-muted);
  font-size: var(--text-md);
  cursor: pointer;
  line-height: 1;
  border-radius: var(--border-radius-sm);
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carte-system-card__dismiss:hover {
  color: var(--color-white);
  background: rgba(200, 64, 64, 0.2);
}

.carte-system-card__badge {
  position: absolute;
  top: var(--space-2);
  right: 28px;
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  color: var(--color-muted);
}

.carte-system-card__body {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.carte-system-card__icon {
  flex-shrink: 0;
  min-width: 24px;
  min-height: 24px;
  width: 24px;
  height: 24px;
  opacity: 0.9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carte-system-card__icon :deep(svg),
.carte-system-card__icon :deep(img) {
  width: 100%;
  height: 100%;
  flex-shrink: 0;
}

.carte-system-card__main {
  padding-right: 4px;
  min-width: 0;
}

.carte-system-card__title {
  font-size: var(--text-md);
  color: var(--color-white);
  font-family: var(--font-mono);
  letter-spacing: var(--tracking-tight);
}

.carte-system-card__row {
  font-size: var(--text-md);
  color: var(--color-muted);
  margin-top: var(--space-1);
}
</style>
