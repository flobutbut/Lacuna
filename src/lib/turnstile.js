/**
 * CAPTCHA Cloudflare Turnstile — LACUNA
 * Quand le CAPTCHA est activé dans Supabase (Authentication → Attack Protection), inscription,
 * connexion et mot de passe oublié exigent un jeton : sans clé de site, aucun widget (développement).
 */

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/** Clé de site publique (Cloudflare → Turnstile) ; vide = CAPTCHA désactivé côté app */
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''

export function captchaEnabled(siteKey = TURNSTILE_SITE_KEY) {
  return Boolean(siteKey)
}

let loading = null

/**
 * Charge le script Turnstile une seule fois.
 * @returns {Promise<object>} window.turnstile
 */
export function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile indisponible')))
    script.onerror = () => {
      loading = null
      script.remove()
      reject(new Error('Turnstile indisponible'))
    }
    document.head.appendChild(script)
  })
  return loading
}
