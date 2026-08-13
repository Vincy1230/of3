<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOf3BuilderStore } from '@/stores/of3Builder'
import { OF3_EXAMPLES } from '@/data/examples'
import CollapsibleSection from './CollapsibleSection.vue'

const { t } = useI18n()
const store = useOf3BuilderStore()
const selected = ref('')

function onChange() {
  if (selected.value) {
    store.loadExample(selected.value)
    selected.value = ''
  }
}
</script>

<template>
  <CollapsibleSection :title="t('presets.title')">
    <select class="preset-select" v-model="selected" @change="onChange">
      <option value="" disabled>{{ t('presets.placeholder') }}</option>
      <option v-for="example in OF3_EXAMPLES" :key="example.id" :value="example.id">
        {{ t(`presets.${example.id}.name`) }}
      </option>
    </select>
    <p class="hint">{{ t('presets.hint') }}</p>
  </CollapsibleSection>
</template>

<style scoped>
.preset-select {
  font: inherit;
  padding: 0.55rem 0.7rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  max-width: 100%;
}

.preset-select:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}
</style>
