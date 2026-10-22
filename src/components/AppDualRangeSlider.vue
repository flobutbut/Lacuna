<script setup>
/**
 * AppDualRangeSlider — deux curseurs sur une même piste (plage sélectionnée visible)
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'

const rootRef = ref(null)

const props = defineProps({
  low: { type: Number, required: true },
  high: { type: Number, required: true },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  trackWidth: { type: String, default: '92px' },
  ariaLabelLow: { type: String, default: undefined },
  ariaLabelHigh: { type: String, default: undefined },
})

const emit = defineEmits(['update:low', 'update:high'])

const dragThumb = ref(null)
/** Quel curseur doit être au-dessus quand le pointeur n’est pas sur la barre (voir preferStack) */
const hoverStack = ref(null)

const span = computed(() => Math.max(props.max - props.min, 1e-9))

const fillStyle = computed(() => {
  const t = span.value
  const leftPct = ((props.low - props.min) / t) * 100
  const widthPct = ((props.high - props.low) / t) * 100
  return {
    left: `${leftPct}%`,
    width: `${Math.max(0, widthPct)}%`,
  }
})

/** Sans pointeur : préfère le curseur le plus à droite si la plage est dans la moitié droite (évite le blocage du pouce droit). */
const preferStack = computed(() => {
  if (hoverStack.value) return hoverStack.value
  const rangeMid = (props.min + props.max) / 2
  const bandMid = (props.low + props.high) / 2
  return bandMid >= rangeMid ? 'high' : 'low'
})

const zLow = computed(() => {
  if (dragThumb.value === 'low') return 5
  if (dragThumb.value === 'high') return 2
  return preferStack.value === 'low' ? 4 : 2
})

const zHigh = computed(() => {
  if (dragThumb.value === 'high') return 5
  if (dragThumb.value === 'low') return 2
  return preferStack.value === 'high' ? 4 : 2
})

function updateStackFromClientX(clientX) {
  const el = rootRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  if (rect.width <= 0) return
  const cx = clientX - rect.left
  const t = span.value
  const xLow = ((props.low - props.min) / t) * rect.width
  const xHigh = ((props.high - props.min) / t) * rect.width
  const midPx = (xLow + xHigh) / 2
  hoverStack.value = cx <= midPx ? 'low' : 'high'
}

function clearDragging() {
  dragThumb.value = null
}

function onDualPointerLeave() {
  hoverStack.value = null
}

onMounted(() => {
  window.addEventListener('pointerup', clearDragging)
  window.addEventListener('pointercancel', clearDragging)
})
onUnmounted(() => {
  window.removeEventListener('pointerup', clearDragging)
  window.removeEventListener('pointercancel', clearDragging)
})

function onLowPointerDown() {
  dragThumb.value = 'low'
}
function onHighPointerDown() {
  dragThumb.value = 'high'
}

function onLowInput(e) {
  emit('update:low', parseFloat(e.target.value))
}
function onHighInput(e) {
  emit('update:high', parseFloat(e.target.value))
}
</script>

<template>
  <div
    ref="rootRef"
    class="dual-range"
    :style="{ width: trackWidth }"
    @pointerenter="updateStackFromClientX($event.clientX)"
    @pointermove="updateStackFromClientX($event.clientX)"
    @pointerleave="onDualPointerLeave"
  >
    <div
      class="dual-range__rail"
      aria-hidden="true"
    />
    <div
      class="dual-range__fill"
      :style="fillStyle"
      aria-hidden="true"
    />
    <input
      type="range"
      class="dual-range__input dual-range__input--low"
      :min="min"
      :max="max"
      :step="step"
      :value="low"
      :aria-label="ariaLabelLow"
      :style="{ zIndex: zLow }"
      @pointerdown="onLowPointerDown"
      @input="onLowInput"
    />
    <input
      type="range"
      class="dual-range__input dual-range__input--high"
      :min="min"
      :max="max"
      :step="step"
      :value="high"
      :aria-label="ariaLabelHigh"
      :style="{ zIndex: zHigh }"
      @pointerdown="onHighPointerDown"
      @input="onHighInput"
    />
  </div>
</template>

<style scoped>
.dual-range {
  position: relative;
  flex-shrink: 0;
  height: 4px;
  overflow: visible;
  box-sizing: border-box;
  touch-action: none;
}
.dual-range__rail {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 4px;
  background: var(--border-default);
  border-radius: var(--border-radius-sm);
  pointer-events: none;
}
.dual-range__fill {
  position: absolute;
  top: 0;
  height: 4px;
  border-radius: var(--border-radius-sm);
  pointer-events: none;
  background: color-mix(in srgb, var(--color-cyan) 48%, transparent);
  box-shadow: 0 0 8px color-mix(in srgb, var(--color-cyan) 40%, transparent);
}
.dual-range__input {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 4px;
  margin: 0;
  padding: 0;
  cursor: pointer;
  background: transparent;
  -webkit-appearance: none;
  appearance: none;
}
.dual-range__input:focus {
  outline: none;
}

.dual-range__input::-webkit-slider-runnable-track {
  height: 4px;
  background: transparent;
  border-radius: var(--border-radius-sm);
}
.dual-range__input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  margin-top: -3px;
  border-radius: var(--border-radius-full);
  background: var(--color-muted);
  border: 1px solid var(--border-bright);
  box-sizing: border-box;
  transition:
    background-color var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base);
}

.dual-range__input::-moz-range-track {
  height: 4px;
  background: transparent;
  border-radius: var(--border-radius-sm);
}
.dual-range__input::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border-radius: var(--border-radius-full);
  background: var(--color-muted);
  border: 1px solid var(--border-bright);
  box-sizing: border-box;
  transition:
    background-color var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base);
}
</style>
