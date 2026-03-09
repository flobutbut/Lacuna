/**
 * Store Pinia pour Supabase — LACUNA
 * Client Supabase partagé et helpers
 */
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useSupabaseStore = defineStore('supabase', () => {
  const isConfigured = () => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    return !!(url && key && !url.includes('placeholder'))
  }

  return {
    client: supabase,
    isConfigured,
  }
})
