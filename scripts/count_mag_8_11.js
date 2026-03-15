#!/usr/bin/env node
/** Compte les étoiles mag 8–11 pour vérifier taille page passe 2 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env')
try {
  const env = readFileSync(envPath, 'utf8')
  env.split('\n').forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim()
  })
} catch (_) {}

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis')
  process.exit(1)
}

const supabase = createClient(url, key)

const { count: count8_11, error: err1 } = await supabase
  .from('stellar_systems')
  .select('*', { count: 'exact', head: true })
  .gte('apparent_magnitude', 8)
  .lte('apparent_magnitude', 11)

const { count: count8_18, error: err2 } = await supabase
  .from('stellar_systems')
  .select('*', { count: 'exact', head: true })
  .gte('apparent_magnitude', 8)
  .lte('apparent_magnitude', 18)

if (err1 || err2) {
  console.error('Erreur:', err1?.message || err2?.message)
  process.exit(1)
}

console.log('Étoiles magnitude 8–11:', count8_11)
console.log('Étoiles magnitude 8–18 (passe 2):', count8_18)
console.log('15000 par page suffisant (mag 8–11):', count8_11 <= 15000 ? 'OUI' : 'NON')
console.log('15000 par page — nb pages pour mag 8–18:', Math.ceil((count8_18 || 0) / 15000))
