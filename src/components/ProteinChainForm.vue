<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ChainDraft } from '@/types/draft'
import CollapsibleSection from './CollapsibleSection.vue'
import IconTrash from './icons/IconTrash.vue'

const props = defineProps<{ chain: ChainDraft }>()
const { t } = useI18n()

function addTemplateCifRow() {
  props.chain.templateCifRows.push({ path: '', chainId: '' })
}
function removeTemplateCifRow(i: number) {
  props.chain.templateCifRows.splice(i, 1)
}
function addNonCanonicalRow() {
  props.chain.nonCanonicalResidues.push({ index: '', code: '' })
}
function removeNonCanonicalRow(i: number) {
  props.chain.nonCanonicalResidues.splice(i, 1)
}
</script>

<template>
  <div class="chain-form">
    <div class="field">
      <label>{{ t('chain.sequenceLabel') }}</label>
      <textarea v-model="chain.sequence" rows="3" placeholder="PVLSCGEWQCL"></textarea>
      <p class="hint">{{ t('chain.sequenceHintProtein') }}</p>
    </div>
    <div class="field">
      <label>{{ t('chain.descriptionLabel') }} ({{ t('common.optional') }})</label>
      <input type="text" v-model="chain.description" />
    </div>

    <label class="checkbox-field"><input type="checkbox" v-model="chain.cyclic" /> {{ t('chain.cyclic') }}</label>

    <CollapsibleSection :title="t('chain.advancedTitle')" default-collapsed>
      <div class="field">
        <label>{{ t('chain.mainMsaPathsLabel') }}</label>
        <textarea v-model="chain.mainMsaFilePaths" rows="2"></textarea>
      </div>
      <div class="field">
        <label>{{ t('chain.pairedMsaPathsLabel') }}</label>
        <textarea v-model="chain.pairedMsaFilePaths" rows="2"></textarea>
      </div>
      <div class="field">
        <label>{{ t('chain.templateAlignmentPathLabel') }}</label>
        <input type="text" v-model="chain.templateAlignmentFilePath" />
      </div>

      <div class="repeatable">
        <h3>{{ t('chain.templateCifTitle') }}</h3>
        <div v-for="(row, i) in chain.templateCifRows" :key="i" class="repeatable-row">
          <input type="text" v-model="row.path" :placeholder="t('chain.templateCifPathLabel')" />
          <input
            type="text"
            v-model="row.chainId"
            :placeholder="t('chain.templateCifChainIdLabel')"
            class="cif-chain-id"
          />
          <button type="button" class="btn btn-sm btn-danger" @click="removeTemplateCifRow(i)">
            <IconTrash />
          </button>
        </div>
        <div class="toolbar">
          <button type="button" class="btn btn-sm" @click="addTemplateCifRow">+ {{ t('chain.addTemplateCifRow') }}</button>
        </div>
      </div>

      <div class="repeatable">
        <h3>{{ t('chain.nonCanonicalTitle') }}</h3>
        <div v-for="(row, i) in chain.nonCanonicalResidues" :key="i" class="repeatable-row">
          <input type="text" v-model="row.index" :placeholder="t('chain.nonCanonicalIndexLabel')" class="narrow" />
          <input type="text" v-model="row.code" :placeholder="t('chain.nonCanonicalCodeLabel')" class="narrow" />
          <button type="button" class="btn btn-sm btn-danger" @click="removeNonCanonicalRow(i)">
            <IconTrash />
          </button>
        </div>
        <div class="toolbar">
          <button type="button" class="btn btn-sm" @click="addNonCanonicalRow">
            + {{ t('chain.addNonCanonicalRow') }}
          </button>
        </div>
      </div>
    </CollapsibleSection>
  </div>
</template>

<style scoped>
.cif-chain-id {
  flex: 0 0 200px;
}

.chain-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
</style>
