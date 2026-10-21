import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'stellar_import/**', '.venv_stellar/**', 'Ressources/**', 'backups/**', 'docs/**'],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    // SVG locaux importés en ?raw : contenu statique, pas de risque XSS
    files: ['src/components/icons/ObservationTypeIcon.vue', 'src/components/icons/SignalTypeIcon.vue', 'src/components/illustrations/StarSvgInline.vue'],
    rules: { 'vue/no-v-html': 'off' },
  },
  {
    files: ['scripts/**/*.js', 'vite.config.js', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Edge Functions Supabase : runtime Deno
    files: ['supabase/functions/**/*.{js,ts}'],
    languageOptions: { globals: { Deno: 'readonly' } },
  },
  {
    files: ['**/*.test.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  // Désactive les règles de mise en forme : Prettier s'en charge
  prettier,
]
