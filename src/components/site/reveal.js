/**
 * Directive v-reveal — fait apparaître un bloc du site public quand il entre à l'écran (une fois).
 * Délai facultatif en ms : v-reveal="200". Sans IntersectionObserver, le bloc est visible d'emblée.
 */

let observer = null

function getObserver() {
  if (observer) return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
  )
  return observer
}

export const vReveal = {
  mounted(el, binding) {
    el.classList.add('site-reveal')
    if (binding.value) el.style.transitionDelay = `${binding.value}ms`
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible')
      return
    }
    getObserver().observe(el)
  },
  beforeUnmount(el) {
    observer?.unobserve(el)
  },
}
