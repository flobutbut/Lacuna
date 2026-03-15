<script setup>
/**
 * AppSelect — Select design system (dropdown)
 * Trigger + liste déroulante custom stylée avec les tokens du design system.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  /** Valeur sélectionnée (v-model) */
  modelValue: { type: [String, Number], default: '' },
  /** Options : tableau de { value, label } ou { id, label } (voir valueKey/labelKey) */
  options: { type: Array, default: () => [] },
  /** Clé de la valeur dans chaque option (ex: 'id', 'value') */
  valueKey: { type: String, default: 'id' },
  /** Clé du libellé dans chaque option */
  labelKey: { type: String, default: 'label' },
  /** Attribut name du select (input hidden pour formulaires) */
  name: { type: String, default: undefined },
  /** Attribut aria-label */
  ariaLabel: { type: String, default: undefined },
  /** Titre / tooltip */
  title: { type: String, default: undefined },
  /** Désactivé */
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const wrapRef = ref(null)
const dropdownRef = ref(null)
/** Ignorer le prochain clic document (celui qui a ouvert le menu) */
let ignoreNextDocumentClick = false

const selectedOption = computed(() =>
  props.options.find((o) => (o[props.valueKey] ?? o) === props.modelValue)
)
const selectedLabel = computed(() =>
  selectedOption.value ? (selectedOption.value[props.labelKey] ?? selectedOption.value) : ''
)

function getValue(opt) {
  return opt[props.valueKey] ?? opt
}

function getLabel(opt) {
  return opt[props.labelKey] ?? opt
}

function open() {
  if (props.disabled) return
  isOpen.value = true
  ignoreNextDocumentClick = true
}

function close() {
  isOpen.value = false
}

function toggle() {
  if (props.disabled) return
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

function select(opt) {
  emit('update:modelValue', getValue(opt))
  close()
}

function onDocumentClick(e) {
  if (ignoreNextDocumentClick) {
    ignoreNextDocumentClick = false
    return
  }
  if (!isOpen.value) return
  const wrap = wrapRef.value
  if (wrap && wrap.contains(e.target)) return
  close()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <div class="ds-select-wrap" ref="wrapRef">
    <button
      type="button"
      class="ds-select"
      :aria-label="ariaLabel"
      :title="title"
      :disabled="disabled"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span class="ds-select__label">{{ selectedLabel }}</span>
      <span class="ds-select__arrow" aria-hidden="true" />
    </button>
    <input v-if="name" type="hidden" :name="name" :value="modelValue" />
    <Transition name="ds-select-drop">
      <div
        v-show="isOpen"
        ref="dropdownRef"
        class="ds-select-dropdown"
        role="listbox"
      >
        <button
          v-for="opt in options"
          :key="getValue(opt)"
          type="button"
          role="option"
          :aria-selected="getValue(opt) === modelValue"
          :title="opt.title"
          class="ds-select-option"
          :class="{ 'ds-select-option--selected': getValue(opt) === modelValue }"
          @click="select(opt)"
        >
          {{ getLabel(opt) }}
        </button>
      </div>
    </Transition>
  </div>
</template>
