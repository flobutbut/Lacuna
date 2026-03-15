<script setup>
import { computed } from 'vue'
import { getPlanetSvgPathForObject } from '@/assets/illustrations/planets'

const props = defineProps({
  /** system_object (planète) — utilisé pour composition, system_id, designation, name */
  planet: { type: Object, default: null },
  /** Diamètre en px — taille d'affichage */
  diameter: { type: Number, required: true },
})

const svgSrc = computed(() => {
  return getPlanetSvgPathForObject(props.planet)
})
</script>

<template>
  <img
    :src="svgSrc"
    class="planet-svg-inline"
    :style="{ width: diameter + 'px', height: diameter + 'px' }"
    alt=""
    draggable="false"
  />
</template>

<style scoped>
.planet-svg-inline {
  display: block;
  flex-shrink: 0;
  object-fit: contain;
  object-position: center;
  aspect-ratio: 1;
}
</style>
