<script setup>
import { computed } from 'vue'
import starO from '@/assets/illustrations/stars/star-O.svg?raw'
import starB from '@/assets/illustrations/stars/star-B.svg?raw'
import starA from '@/assets/illustrations/stars/star-A.svg?raw'
import starF from '@/assets/illustrations/stars/star-F.svg?raw'
import starG from '@/assets/illustrations/stars/star-G.svg?raw'
import starK from '@/assets/illustrations/stars/star-K.svg?raw'
import starM from '@/assets/illustrations/stars/star-M.svg?raw'
import starL from '@/assets/illustrations/stars/star-L.svg?raw'
import starT from '@/assets/illustrations/stars/star-T.svg?raw'
import starY from '@/assets/illustrations/stars/star-Y.svg?raw'
import starD from '@/assets/illustrations/stars/star-D.svg?raw'
import starPulsar from '@/assets/illustrations/stars/star-pulsar.svg?raw'

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
