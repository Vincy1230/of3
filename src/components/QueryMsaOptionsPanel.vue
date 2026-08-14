<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOf3BuilderStore } from '@/stores/of3Builder'
import CollapsibleSection from './CollapsibleSection.vue'

const { t } = useI18n()
const store = useOf3BuilderStore()

const activeQuery = computed(() => store.activeQuery)

function toggle(field: 'useMsas' | 'useMainMsas' | 'usePairedMsas', checked: boolean) {
  if (activeQuery.value) store.setQueryMsaOptions(activeQuery.value.uiId, { [field]: checked })
}
</script>

<template>
  <CollapsibleSection v-if="activeQuery" :title="t('queryOptions.title')" default-collapsed>
    <span class="chip">{{ activeQuery.key }}</span>
    <p class="hint">{{ t('queryOptions.hint') }}</p>

    <label class="checkbox-field">
      <input
        type="checkbox"
        :checked="activeQuery.useMsas"
        @change="toggle('useMsas', ($event.target as HTMLInputElement).checked)"
      />
      {{ t('queryOptions.useMsas') }}
    </label>
    <label class="checkbox-field">
      <input
        type="checkbox"
        :checked="activeQuery.useMainMsas"
        @change="toggle('useMainMsas', ($event.target as HTMLInputElement).checked)"
      />
      {{ t('queryOptions.useMainMsas') }}
    </label>
    <label class="checkbox-field">
      <input
        type="checkbox"
        :checked="activeQuery.usePairedMsas"
        @change="toggle('usePairedMsas', ($event.target as HTMLInputElement).checked)"
      />
      {{ t('queryOptions.usePairedMsas') }}
    </label>
  </CollapsibleSection>
</template>
