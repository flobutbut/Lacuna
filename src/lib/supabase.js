/**
 * Client Supabase pour LACUNA
 * Configuration centralisée du backend
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[LACUNA] Supabase non configuré. Définir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env'
  )
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
