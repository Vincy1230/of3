<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useOf3BuilderStore } from '@/stores/of3Builder'
import CollapsibleSection from './CollapsibleSection.vue'

const { t } = useI18n()
const store = useOf3BuilderStore()
</script>

<template>
  <CollapsibleSection :title="t('globalOptions.title')" default-collapsed>
    <div class="field">
      <label>{{ t('globalOptions.ccdFilePathLabel') }} ({{ t('common.optional') }})</label>
      <input type="text" v-model="store.ccdFilePath" placeholder="/path/to/CCD/file.cif" />
      <p class="hint">{{ t('globalOptions.ccdFilePathHint') }}</p>
    </div>
  </CollapsibleSection>
</template>
