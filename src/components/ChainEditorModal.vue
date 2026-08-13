<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ChainDraft } from '@/types/draft'
import ModalDialog from './ModalDialog.vue'
import ProteinChainForm from './ProteinChainForm.vue'
import RnaChainForm from './RnaChainForm.vue'
import DnaChainForm from './DnaChainForm.vue'
import LigandChainForm from './LigandChainForm.vue'

defineProps<{ open: boolean; chain: ChainDraft | null }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
</script>

<template>
  <ModalDialog :open="open" :title-text="t('chain.editChain')" @close="emit('close')">
    <div v-if="chain" class="editor">
      <div class="field">
        <label>{{ t('chain.chainIdsLabel') }}</label>
        <input type="text" v-model="chain.chainIds" placeholder="A, B, C" />
        <p class="hint">{{ t('chain.chainIdsHint') }}</p>
      </div>

      <ProteinChainForm v-if="chain.moleculeType === 'protein'" :chain="chain" />
      <RnaChainForm v-else-if="chain.moleculeType === 'rna'" :chain="chain" />
      <DnaChainForm v-else-if="chain.moleculeType === 'dna'" :chain="chain" />
      <LigandChainForm v-else-if="chain.moleculeType === 'ligand'" :chain="chain" />
    </div>
  </ModalDialog>
</template>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
</style>
