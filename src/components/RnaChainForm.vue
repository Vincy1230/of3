<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ChainDraft } from '@/types/draft'
import CollapsibleSection from './CollapsibleSection.vue'

defineProps<{ chain: ChainDraft }>()
const { t } = useI18n()
</script>

<template>
  <div class="chain-form">
    <div class="field">
      <label>{{ t('chain.sequenceLabel') }}</label>
      <textarea v-model="chain.sequence" rows="3" placeholder="AGCU"></textarea>
      <p class="hint">{{ t('chain.sequenceHintRna') }}</p>
    </div>

    <CollapsibleSection :title="t('chain.advancedTitle')" default-collapsed>
      <label class="checkbox-field"><input type="checkbox" v-model="chain.cyclic" /> {{ t('chain.cyclic') }}</label>

      <div class="field">
        <label>{{ t('chain.mainMsaPathsLabel') }}</label>
        <textarea v-model="chain.mainMsaFilePaths" rows="2"></textarea>
      </div>
    </CollapsibleSection>
  </div>
</template>

<style scoped>
.chain-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
</style>
