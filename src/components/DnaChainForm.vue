<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ChainDraft } from '@/types/draft'

defineProps<{ chain: ChainDraft }>()
const { t } = useI18n()
</script>

<template>
  <div class="chain-form">
    <div class="field">
      <label>{{ t('chain.sequenceLabel') }}</label>
      <textarea v-model="chain.sequence" rows="3" placeholder="GACCTCT"></textarea>
      <p class="hint">{{ t('chain.sequenceHintDna') }}</p>
    </div>
    <label class="checkbox-field"><input type="checkbox" v-model="chain.cyclic" /> {{ t('chain.cyclic') }}</label>
  </div>
</template>

<style scoped>
.chain-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
</style>
