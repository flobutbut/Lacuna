/**
 * Composable — chargement des stores au montage
 * Centralise le pattern "if (!store.loaded) await store.fetch()"
 *
 * @param {...object} stores - Instances de stores Pinia avec { loaded, fetch() }
 * @returns {Promise<void>}
 */
export async function ensureStoresLoaded(...stores) {
  await Promise.all(
    stores.map(async (store) => {
      if (!store || typeof store.fetch !== 'function') return
      const loaded = store.loaded?.value ?? store.loaded
      if (!loaded) await store.fetch()
    })
  )
}
