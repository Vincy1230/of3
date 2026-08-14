<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOf3BuilderStore } from '@/stores/of3Builder'
import CollapsibleSection from './CollapsibleSection.vue'
import IconTrash from './icons/IconTrash.vue'

const { t } = useI18n()
const store = useOf3BuilderStore()

const activeQuery = computed(() => store.activeQuery)

const ligandChainOptions = computed(() => {
  if (!activeQuery.value) return []
  const ids = activeQuery.value.chains
    .filter((chain) => chain.moleculeType === 'ligand')
    .flatMap((chain) =>
      chain.chainIds
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
    )
  return [...new Set(ids)]
})

const hasCustomValues = computed(() => !!activeQuery.value?.pocketConstraintEnabled)

function toggle(enabled: boolean) {
  if (activeQuery.value) store.setPocketConstraintEnabled(activeQuery.value.uiId, enabled)
}

function addResidueRow() {
  activeQuery.value?.pocketConstraint.residues.push({ chainId: '', residueId: '' })
}
function removeResidueRow(index: number) {
  activeQuery.value?.pocketConstraint.residues.splice(index, 1)
}
</script>

<template>
  <CollapsibleSection
    v-if="activeQuery"
    :title="t('pocketConstraint.title')"
    default-collapsed
    :has-custom-values="hasCustomValues"
  >
    <span class="chip">{{ activeQuery.key }}</span>

    <label class="checkbox-field">
      <input
        type="checkbox"
        :checked="activeQuery.pocketConstraintEnabled"
        @change="toggle(($event.target as HTMLInputElement).checked)"
      />
      {{ t('pocketConstraint.enable') }}
    </label>
    <p class="hint">{{ t('pocketConstraint.hint') }}</p>

    <template v-if="activeQuery.pocketConstraintEnabled">
      <div class="field">
        <label>{{ t('pocketConstraint.ligandChainLabel') }}</label>
        <select v-model="activeQuery.pocketConstraint.ligandChainId">
          <option value="" disabled>{{ t('pocketConstraint.ligandChainPlaceholder') }}</option>
          <option v-for="id in ligandChainOptions" :key="id" :value="id">{{ id }}</option>
        </select>
      </div>

      <div class="repeatable">
        <h3>{{ t('pocketConstraint.residuesTitle') }}</h3>
        <div
          v-for="(row, index) in activeQuery.pocketConstraint.residues"
          :key="index"
          class="repeatable-row"
        >
          <input
            type="text"
            v-model="row.chainId"
            :placeholder="t('pocketConstraint.residueChainLabel')"
            class="narrow"
          />
          <input
            type="text"
            v-model="row.residueId"
            :placeholder="t('pocketConstraint.residueIdLabel')"
            class="narrow"
          />
          <button type="button" class="btn btn-sm btn-danger" @click="removeResidueRow(index)">
            <IconTrash />
          </button>
        </div>
        <div class="toolbar">
          <button type="button" class="btn btn-sm" @click="addResidueRow">
            + {{ t('pocketConstraint.addResidueRow') }}
          </button>
        </div>
      </div>

      <div class="field">
        <label>{{ t('pocketConstraint.maxDistanceLabel') }}</label>
        <input type="text" v-model="activeQuery.pocketConstraint.maxDistance" placeholder="4.0" />
        <p class="hint">{{ t('pocketConstraint.maxDistanceHint') }}</p>
      </div>
    </template>
  </CollapsibleSection>
</template>
