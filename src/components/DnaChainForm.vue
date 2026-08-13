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
  <div class="field">
    <label>{{ t('chain.sequenceLabel') }}</label>
    <textarea v-model="chain.sequence" rows="3" placeholder="GACCTCT"></textarea>
    <p class="hint">{{ t('chain.sequenceHintDna') }}</p>
  </div>
</template>
