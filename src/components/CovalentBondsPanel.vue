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

function addBondRow() {
  activeQuery.value?.covalentBonds.push({
    chain1: '',
    residue1: '',
    atom1: '',
    chain2: '',
    residue2: '',
    atom2: '',
  })
}
function removeBondRow(index: number) {
  activeQuery.value?.covalentBonds.splice(index, 1)
}
</script>

<template>
  <CollapsibleSection v-if="activeQuery" :title="t('covalentBonds.title')" default-collapsed>
    <span class="chip">{{ activeQuery.key }}</span>
    <p class="hint">{{ t('covalentBonds.hint') }}</p>

    <div class="repeatable">
      <div v-for="(row, index) in activeQuery.covalentBonds" :key="index" class="bond-row">
        <div class="atom-group">
          <span class="atom-label">{{ t('covalentBonds.atomLabel', { n: 1 }) }}</span>
          <input type="text" v-model="row.chain1" :placeholder="t('covalentBonds.chainIdLabel')" class="narrow" />
          <input type="text" v-model="row.residue1" :placeholder="t('covalentBonds.residueIdLabel')" class="narrow" />
          <input type="text" v-model="row.atom1" :placeholder="t('covalentBonds.atomIdLabel')" class="narrow" />
        </div>
        <div class="atom-group">
          <span class="atom-label">{{ t('covalentBonds.atomLabel', { n: 2 }) }}</span>
          <input type="text" v-model="row.chain2" :placeholder="t('covalentBonds.chainIdLabel')" class="narrow" />
          <input type="text" v-model="row.residue2" :placeholder="t('covalentBonds.residueIdLabel')" class="narrow" />
          <input type="text" v-model="row.atom2" :placeholder="t('covalentBonds.atomIdLabel')" class="narrow" />
        </div>
        <button type="button" class="btn btn-sm btn-danger" @click="removeBondRow(index)">
          <IconTrash />
        </button>
      </div>
      <div class="toolbar">
        <button type="button" class="btn btn-sm" @click="addBondRow">+ {{ t('covalentBonds.addBond') }}</button>
      </div>
    </div>
  </CollapsibleSection>
</template>

<style scoped>
.bond-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

.atom-group {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.atom-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  white-space: nowrap;
}
</style>
