import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BAND_CONFIG = {
  P: { maxRange: 200, supports: ['EM_RADIO'] },
  L: { maxRange: 500, supports: ['EM_RADIO'] },
  X: { maxRange: 300, supports: ['EM_RADIO', 'GAMMA_X'] },
  G: { maxRange: 800, supports: ['GAMMA_X'] },
}

const BAND_FREQUENCY_HZ = {
  P: 300_000_000,
  L: 1_420_000_000,
  X: 5_000_000_000,
  G: null,
}

const DEFAULT_HALF_ANGLE_DEG = 5

function dot(a, b) {
  return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
}

function norm(v) {
  return Math.sqrt(dot(v, v))
}

function angleBetween(a, b) {
  const d = dot(a, b) / (norm(a) * norm(b))
  return Math.acos(Math.max(-1, Math.min(1, d))) * 180 / Math.PI
}

function getXyz(coordinates) {
  if (!coordinates) return null
  if (coordinates.x != null) {
    return [coordinates.x, coordinates.y, coordinates.z]
  }
  const { ra, dec, distance } = coordinates
  if (ra == null || dec == null || distance == null) return null
  const raRad = ra * Math.PI / 180
  const decRad = dec * Math.PI / 180
  return [
    distance * Math.cos(decRad) * Math.cos(raRad),
    distance * Math.cos(decRad) * Math.sin(raRad),
    distance * Math.sin(decRad),
  ]
}

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  )

  const { ship_id, band, session_id } = await req.json()

  if (!ship_id || !band || !session_id) {
    return new Response(
      JSON.stringify({ error: 'Paramètres manquants : ship_id, band, session_id requis' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const config = BAND_CONFIG[band]
  if (!config) {
    return new Response(
      JSON.stringify({ error: `Bande inconnue : ${band}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Étape 1 — Position du vaisseau
  const { data: ship, error: shipError } = await supabase
    .from('ships')
    .select('position, current_system_id')
    .eq('id', ship_id)
    .single()

  if (shipError || !ship) {
    return new Response(
      JSON.stringify({ error: 'Vaisseau introuvable' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const shipPos = getXyz(ship.position)
  if (!shipPos) {
    return new Response(
      JSON.stringify({ error: 'Position du vaisseau invalide' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Étape 2 — Pulsars émetteurs (RPC contourne limite max_rows)
  const { data: pulsars, error: pulsarError } = await supabase
    .rpc('get_pulsars_with_period')

  if (pulsarError) {
    return new Response(
      JSON.stringify({ error: pulsarError.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Étape 3 — Déduplication
  const { data: existing } = await supabase
    .from('signals')
    .select('source_system_id')
    .eq('session_id', session_id)
    .not('source_system_id', 'is', null)

  const existingIds = new Set(
    (existing ?? []).map(s => s.source_system_id)
  )

  const EARTH = [0, 0, 0]
  const toInsert = []

  for (const pulsar of pulsars ?? []) {
    const sys = pulsar
    if (!sys?.coordinates) continue

    const pulsarPos = getXyz(sys.coordinates)
    if (!pulsarPos) continue

    // Distance vaisseau → pulsar
    const delta = [
      pulsarPos[0] - shipPos[0],
      pulsarPos[1] - shipPos[1],
      pulsarPos[2] - shipPos[2],
    ]
    const distance = norm(delta)

    // Filtrage portée max
    if (distance > config.maxRange) continue

    // Déduplication
    if (existingIds.has(pulsar.id)) continue

    // Géométrie du cône d'émission
    const att = sys.attributes ?? {}
    const P0_ms = att.pulse_period_ms
      ?? (att.pulse_period_s ? att.pulse_period_s * 1000 : null)
    const W50_ms = att.emission_width_w50_ms ?? null

    let halfAngleDeg = DEFAULT_HALF_ANGLE_DEG
    if (P0_ms && W50_ms && P0_ms > 0) {
      halfAngleDeg = (W50_ms / P0_ms) * 180
    }

    // Axe d'émission : pulsar → Terre
    const axisToEarth = [
      EARTH[0] - pulsarPos[0],
      EARTH[1] - pulsarPos[1],
      EARTH[2] - pulsarPos[2],
    ]

    // Vecteur pulsar → vaisseau
    const axisToShip = [
      shipPos[0] - pulsarPos[0],
      shipPos[1] - pulsarPos[1],
      shipPos[2] - pulsarPos[2],
    ]

    const angle = angleBetween(axisToEarth, axisToShip)
    if (angle > halfAngleDeg) continue

    // flux_relative depuis distance
    const flux_relative = Math.min(1.0, 1.0 / Math.pow(distance / 100, 2))

    // Azimut et élévation depuis le vaisseau
    const dx = pulsarPos[0] - shipPos[0]
    const dy = pulsarPos[1] - shipPos[1]
    const dz = pulsarPos[2] - shipPos[2]
    const azimuth = Math.round(
      (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360
    )
    const elevation = Math.round(
      Math.asin(dz / distance) * 180 / Math.PI
    )

    const support = (band === 'X' || band === 'G') && att.has_gamma_emission === true
      ? 'GAMMA_X'
      : 'EM_RADIO'

    toInsert.push({
      session_id,
      ship_id,
      source_type: 'PULSAR',
      source_object_id: null,
      source_system_id: pulsar.id,
      frequency_hz: BAND_FREQUENCY_HZ[band] ?? 1_420_000_000,
      support,
      duration_sec: null,
      attributes: {
        band,
        azimuth,
        elevation,
        distance_al: Math.round(distance),
        flux_relative: Math.round(flux_relative * 100) / 100,
        pulse_period_s: att.pulse_period_s ?? null,
        is_periodic: true,
        source_system_id: sys.id,
      },
    })
  }

  // Insertion
  let inserted = 0
  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('signals')
      .insert(toInsert)

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    inserted = toInsert.length
  }

  return new Response(
    JSON.stringify({
      inserted,
      evaluated: pulsars?.length ?? 0,
      band,
      ship_id,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
