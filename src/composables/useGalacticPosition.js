import { computed } from 'vue'
import { useShipStore } from '@/stores/ship'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { getSystemXyz } from '@/lib/stellarCoordinates'

export function useGalacticPosition() {
  const shipStore = useShipStore()
  const stellarStore = useStellarSystemsStore()

  const galacticLatitude = computed(() => {
    const systemId = shipStore.currentSystemId
    if (!systemId) return 0

    const system = stellarStore.list?.find(s => s.id === systemId)
    if (!system) return 0

    const { x, y, z } = getSystemXyz(system)
    const r = Math.sqrt(x * x + y * y + z * z)
    if (r === 0) return 0

    return Math.asin(z / r) * 180 / Math.PI
  })

  return { galacticLatitude }
}
