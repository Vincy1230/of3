<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOf3BuilderStore } from '@/stores/of3Builder'
import type { ChainDraft } from '@/types/draft'
import type { MoleculeType } from '@/types/of3'
import CollapsibleSection from './CollapsibleSection.vue'
import ChainEditorModal from './ChainEditorModal.vue'
import IconTrash from './icons/IconTrash.vue'

const { t } = useI18n()
const store = useOf3BuilderStore()

const MOLECULE_TYPES: MoleculeType[] = ['protein', 'rna', 'dna', 'ligand']

const activeQuery = computed(() => store.activeQuery)
const editingChain = ref<ChainDraft | null>(null)
const modalOpen = ref(false)

function summary(chain: ChainDraft): string {
  if (chain.moleculeType === 'ligand') {
    return chain.ligandMode === 'smiles'
      ? t('chain.summaryLigandSmiles')
      : t('chain.summaryLigandCcd', { codes: chain.ccdCodes || '—' })
  }
  return t('chain.summarySequence', { n: chain.sequence.trim().length })
}

function addChain(type: MoleculeType) {
  if (!activeQuery.value) return
  const chain = store.addChain(activeQuery.value.uiId, type)
  if (chain) {
    editingChain.value = chain
    modalOpen.value = true
  }
}

function editChain(chain: ChainDraft) {
  editingChain.value = chain
  modalOpen.value = true
}

function removeChain(chain: ChainDraft) {
  if (!activeQuery.value) return
  if (confirm(t('chain.removeConfirm'))) store.removeChain(activeQuery.value.uiId, chain.uiId)
}
</script>

<template>
  <CollapsibleSection v-if="activeQuery" :title="t('chain.title')">
    <span class="chip">{{ activeQuery.key }}</span>

    <div class="add-chain-row">
      <button v-for="type in MOLECULE_TYPES" :key="type" type="button" class="btn btn-sm" @click="addChain(type)">
        + {{ t(`common.${type}`) }}
      </button>
    </div>

    <p v-if="activeQuery.chains.length === 0" class="hint">{{ t('chain.emptyHint') }}</p>

    <div v-else class="card-list">
      <div
        v-for="chain in activeQuery.chains"
        :key="chain.uiId"
        class="card chain-card"
        role="button"
        tabindex="0"
        @click="editChain(chain)"
      >
        <div class="card-main">
          <span class="card-title">{{ chain.chainIds || '—' }}</span>
          <span class="card-meta">
            <span class="chip">{{ t(`common.${chain.moleculeType}`) }}</span>
            {{ summary(chain) }}
          </span>
        </div>
        <div class="card-actions">
          <button
            type="button"
            class="btn btn-sm btn-danger"
            :title="t('chain.removeChain')"
            :aria-label="t('chain.removeChain')"
            @click.stop="removeChain(chain)"
          >
            <IconTrash />
          </button>
        </div>
      </div>
    </div>

    <ChainEditorModal :open="modalOpen" :chain="editingChain" @close="modalOpen = false" />
  </CollapsibleSection>
</template>

<style scoped>
.add-chain-row {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.chain-card {
  cursor: pointer;
}

.chain-card:hover {
  border-color: var(--color-accent);
}
</style>
