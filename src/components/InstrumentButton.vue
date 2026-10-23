<script setup>
import LabInstrumentIcon from '@/components/icons/LabInstrumentIcon.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

/**
 * InstrumentButton — Bouton d'instrument (tuile compacte d'une barre d'instruments).
 * Utilisé par le Laboratoire, réutilisable ailleurs.
 * États : available, disabled, running, done.
 */
const props = defineProps({
  instrument: { type: Object, required: true },
  state: { type: String, required: true }, // 'available' | 'disabled' | 'running' | 'done'
  progress: { type: Number, default: 0 },
  disabledReason: { type: String, default: '' },
})

const emit = defineEmits(['click'])

function handleClick() {
  if (props.state !== 'disabled' && props.state !== 'running') {
    emit('click')
  }
}
</script>

<template>
  <button
    type="button"
    class="instrument-btn card"
    :class="{
      'card--interactive': state === 'available' || state === 'done',
      'is-disabled': state === 'disabled',
      'instrument-btn--running': state === 'running',
      'is-done': state === 'done',
    }"
    :disabled="state === 'disabled' || state === 'running'"
    @click="handleClick"
  >
    <div
      v-if="state === 'running'"
      class="instrument-btn__progress-bg"
    >
      <div
        class="instrument-btn__progress-fill"
        :style="{ width: `${progress}%` }"
      />
    </div>
    <div class="instrument-btn__content">
      <div class="instrument-btn__icon-wrap">
        <LabInstrumentIcon :instrument-id="instrument.id" :size="24" />
        <span v-if="state === 'done'" class="instrument-btn__check"><AppIcon name="check" /></span>
      </div>
      <div class="instrument-btn__name">{{ instrument.name }}</div>
      <span v-if="state === 'disabled' && disabledReason" class="instrument-btn__reason">
        {{ disabledReason }}
      </span>
    </div>
  </button>
</template>
