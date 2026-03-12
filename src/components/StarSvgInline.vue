<script setup>
import { computed } from 'vue'
import starO from '@/assets/stars/star-O.svg?raw'
import starB from '@/assets/stars/star-B.svg?raw'
import starA from '@/assets/stars/star-A.svg?raw'
import starF from '@/assets/stars/star-F.svg?raw'
import starG from '@/assets/stars/star-G.svg?raw'
import starK from '@/assets/stars/star-K.svg?raw'
import starM from '@/assets/stars/star-M.svg?raw'
import starL from '@/assets/stars/star-L.svg?raw'
import starT from '@/assets/stars/star-T.svg?raw'
import starY from '@/assets/stars/star-Y.svg?raw'
import starD from '@/assets/stars/star-D.svg?raw'
import starPulsar from '@/assets/stars/star-pulsar.svg?raw'

const SVGS = {
  O: starO,
  B: starB,
  A: starA,
  F: starF,
  G: starG,
  K: starK,
  M: starM,
  L: starL,
  T: starT,
  Y: starY,
  D: starD,
  PULSAR: starPulsar,
}

const props = defineProps({
  spectralType: { type: String, default: 'G2V' },
})

function getLetter(st) {
  if (!st || typeof st !== 'string') return 'M'
  const u = st.toUpperCase()
  if (u.startsWith('PSR') || u.includes('PULSAR')) return 'PULSAR'
  return SVGS[u[0]] ? u[0] : 'M'
}

const svgContent = computed(() => {
  const letter = getLetter(props.spectralType)
  return SVGS[letter] ?? starM
})
</script>

<template>
  <span class="star-svg-inline" v-html="svgContent" />
</template>

<style scoped>
.star-svg-inline {
  display: block;
  height: 100%;
  width: auto;
  aspect-ratio: 1;
  flex-shrink: 0;
}
.star-svg-inline :deep(svg) {
  display: block;
  height: 100%;
  width: auto;
}
</style>
