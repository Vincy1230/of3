<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ChainDraft } from '@/types/draft'
import SegmentedControl from './SegmentedControl.vue'

defineProps<{ chain: ChainDraft }>()
const { t } = useI18n()
</script>

<template>
  <div class="chain-form">
    <div class="field">
      <label>{{ t('chain.ligandModeLabel') }}</label>
      <SegmentedControl
        v-model="chain.ligandMode"
        :options="[
          { value: 'smiles', label: t('chain.ligandModeSmiles') },
          { value: 'ccd', label: t('chain.ligandModeCcd') },
          { value: 'sdf', label: t('chain.ligandModeSdf') },
        ]"
      />
    </div>

    <div v-if="chain.ligandMode === 'smiles'" class="field">
      <label>{{ t('chain.smilesLabel') }}</label>
      <input type="text" v-model="chain.smiles" placeholder="CC(=O)OC1C[NH+]2CCC1CC2" />
    </div>
    <div v-else-if="chain.ligandMode === 'ccd'" class="field">
      <label>{{ t('chain.ccdCodesLabel') }}</label>
      <input type="text" v-model="chain.ccdCodes" placeholder="NAG" />
      <p class="hint">{{ t('chain.ccdCodesHint') }}</p>
    </div>
    <div v-else class="field">
      <label>{{ t('chain.sdfFilePathLabel') }}</label>
      <input type="text" v-model="chain.sdfFilePath" placeholder="/path/to/ligand.sdf" />
    </div>
  </div>
</template>

<style scoped>
.chain-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
</style>
