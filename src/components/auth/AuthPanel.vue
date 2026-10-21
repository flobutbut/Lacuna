<script setup>
/**
 * AuthPanel — cadre des pages d'authentification (logo, titre, formulaire, liens).
 */
import '@/assets/components/auth.css'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <div class="auth-page">
    <section class="auth-panel" aria-labelledby="auth-title">
      <div class="auth-panel__logo" aria-hidden="true">
        LAC<span class="auth-panel__logo-accent">U</span>NA
      </div>
      <header class="auth-panel__header">
        <h1 id="auth-title" class="auth-panel__title">{{ title }}</h1>
        <p v-if="subtitle" class="auth-panel__subtitle">{{ subtitle }}</p>
      </header>
      <slot />
      <footer v-if="$slots.footer" class="auth-panel__footer">
        <slot name="footer" />
      </footer>
    </section>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: var(--space-10) var(--space-8);
  background:
    radial-gradient(ellipse at 50% 35%, var(--color-cyan-subtle) 0%, transparent 60%),
    var(--color-bg);
}

.auth-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
  width: 100%;
  max-width: 380px;
  padding: var(--space-12) var(--space-10);
  background: var(--color-panel);
  border: var(--border-width) solid var(--border-default);
}

.auth-panel__logo {
  text-align: center;
  font-family: var(--font-sans);
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-widest);
  color: var(--color-white);
}

.auth-panel__logo-accent {
  color: var(--color-cyan);
}

.auth-panel__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.auth-panel__title {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: normal;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-cyan);
}

.auth-panel__subtitle {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: 1.5;
  color: var(--color-muted);
}

.auth-panel__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-top: var(--space-8);
  border-top: var(--border-width) solid var(--border-default);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.auth-panel__footer :deep(a) {
  color: var(--color-cyan);
  text-decoration: none;
}

.auth-panel__footer :deep(a:hover) {
  color: var(--color-white);
  text-decoration: underline;
}
</style>
