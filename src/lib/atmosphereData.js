/**
 * Génération de données pour le Spectromètre atmosphérique
 * Profil moléculaire (H₂O, CO₂, CH₄, O₂, etc.) — spectroscopie de transmission/émission
 * Réf. LACUNA_LABORATOIRE_INSTRUMENTS.md §4.8, §5 — JWST, biosignatures O₂+CH₄
 */
import { seedFromObsId } from './spectrogramData'

const MOLECULES = [
  { formula: 'H₂O', name: 'Eau' },
  { formula: 'CO₂', name: 'Dioxyde de carbone' },
  { formula: 'N₂', name: 'Diazote' },
  { formula: 'O₂', name: 'Dioxygène' },
  { formula: 'CH₄', name: 'Méthane' },
  { formula: 'SO₂', name: 'Dioxyde de soufre' },
  { formula: 'He', name: 'Hélium' },
  { formula: 'Ar', name: 'Argon' },
  { formula: 'CO', name: 'Monoxyde de carbone' },
]

function seededRandom(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FORMULA_MAP = { CO2: 'CO₂', H2O: 'H₂O', N2: 'N₂', O2: 'O₂', CH4: 'CH₄', SO2: 'SO₂' }

/**
 * Parse atmosphere_notes pour extraire des abondances (ex. "CO₂ 96.5 %", "N₂ 78 %")
 */
function parseAtmosphereNotes(notes) {
  if (!notes || typeof notes !== 'string') return null
  const out = {}
  const re = /(CO₂|CO2|H₂O|H2O|N₂|N2|O₂|O2|CH₄|CH4|SO₂|SO2|He|Ar|CO)\s*[:\s]*([\d.,]+)\s*%?/gi
  let m
  while ((m = re.exec(notes)) !== null) {
    const raw = m[1]
    const formula = FORMULA_MAP[raw.toUpperCase()] || raw
    const val = parseFloat(m[2].replace(',', '.'))
    if (!isNaN(val) && val >= 0 && val <= 100) out[formula] = val / 100
  }
  if (Object.keys(out).length === 0) return null
  return out
}

/**
 * Génère un profil atmosphérique
 * @param {Object} opts
 * @param {string} [opts.obsId] - ID observation (seed)
 * @param {string} [opts.systemId] - ID système
 * @param {Object} [opts.body] - system_object avec atmosphere_notes
 * @param {number} [opts.fiability] - 0–100, bruit
 * @param {boolean} [opts.anomalous] - O₂+CH₄ (biosignature), molécules atypiques
 */
export function generateAtmosphereData(opts = {}) {
  const { obsId, systemId, body, fiability = 80, anomalous = false } = opts
  const seed = seedFromObsId(String(obsId || '') + String(systemId || ''))
  const rng = seededRandom(seed)
  const noiseLevel = Math.max(0.02, (1 - fiability / 100) * 0.15)

  const parsed = body?.atmosphere_notes ? parseAtmosphereNotes(body.atmosphere_notes) : null

  if (parsed && Object.keys(parsed).length >= 2) {
    const molecules = []
    let remaining = 1
    const entries = Object.entries(parsed).sort((a, b) => b[1] - a[1])
    entries.forEach(([formula, frac], i) => {
      const mol = MOLECULES.find((m) => m.formula === formula) || { formula, name: formula }
      let v = frac + (rng() - 0.5) * noiseLevel
      v = Math.max(0, Math.min(1, v))
      remaining -= v
      molecules.push({ ...mol, abundance: v })
    })
    if (remaining > 0.01) {
      molecules.push({ formula: 'Autres', name: 'Autres', abundance: remaining })
    }
    return {
      molecules: molecules.filter((m) => m.abundance > 0.001),
      pressureBar: body.atmosphere_pressure_bar != null ? Number(body.atmosphere_pressure_bar) : null,
      temperatureK: null,
    }
  }

  const nActive = 3 + (seed % 4)
  const selected = [...MOLECULES].sort(() => rng() - 0.5).slice(0, nActive)
  let total = 0
  const molecules = selected.map((mol, i) => {
    const base = i === 0 ? 0.3 + rng() * 0.5 : (1 - total) * (0.1 + rng() * 0.4)
    let v = base + (rng() - 0.5) * noiseLevel
    v = Math.max(0.02, Math.min(0.95, v))
    total += v
    return { ...mol, abundance: v }
  })
  if (total < 0.99) molecules[molecules.length - 1].abundance += 1 - total
  else if (total > 1.01) molecules[molecules.length - 1].abundance -= total - 1

  if (anomalous) {
    const hasO2 = molecules.find((m) => m.formula === 'O₂')
    const hasCH4 = molecules.find((m) => m.formula === 'CH₄')
    if (!hasO2) molecules.push({ formula: 'O₂', name: 'Dioxygène', abundance: 0.08 + rng() * 0.1 })
    if (!hasCH4) molecules.push({ formula: 'CH₄', name: 'Méthane', abundance: 0.003 + rng() * 0.008 })
  }

  molecules.sort((a, b) => b.abundance - a.abundance)

  return {
    molecules: molecules.filter((m) => m.abundance > 0.001),
    pressureBar: 0.5 + rng() * 2,
    temperatureK: 250 + rng() * 100,
  }
}
