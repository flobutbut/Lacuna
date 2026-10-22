<script setup>
/**
 * SettingsModal — paramètres du joueur (ouverte depuis le header).
 * Une entrée de menu par section (SETTINGS_SECTIONS) ; chaque section est un composant.
 */
import '@/assets/components/settings.css'
import { ref } from 'vue'
import { SETTINGS_SECTIONS } from '@/constants/menus'
import AppModal from '@/components/AppModal.vue'
import NavMenuItem from '@/components/NavMenuItem.vue'
import SettingsAccount from '@/components/settings/SettingsAccount.vue'

defineEmits(['close'])

const SECTION_COMPONENTS = { account: SettingsAccount }

const activeId = ref(SETTINGS_SECTIONS[0].id)
</script>

<template>
  <AppModal title="Paramètres" size="large" @close="$emit('close')">
    <div class="settings">
      <nav class="settings__nav" aria-label="Sections des paramètres">
        <NavMenuItem
          v-for="section in SETTINGS_SECTIONS"
          :key="section.id"
          :icon="section.icon"
          :label="section.label"
          :selected="section.id === activeId"
          @click="activeId = section.id"
        />
      </nav>
      <section class="settings__section">
        <component :is="SECTION_COMPONENTS[activeId]" />
      </section>
    </div>
  </AppModal>
</template>
