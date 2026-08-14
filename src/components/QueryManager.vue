<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useOf3BuilderStore } from '@/stores/of3Builder'
import CollapsibleSection from './CollapsibleSection.vue'
import IconCopy from './icons/IconCopy.vue'
import IconTrash from './icons/IconTrash.vue'

const { t } = useI18n()
const store = useOf3BuilderStore()

function onRemove(uiId: string) {
  if (store.queries.length <= 1) return
  if (confirm(t('query.removeConfirm'))) store.removeQuery(uiId)
}
</script>

<template>
  <CollapsibleSection :title="t('query.title')">
    <div class="card-list">
      <div
        v-for="query in store.queries"
        :key="query.uiId"
        class="card"
        :class="{ active: query.uiId === store.activeQueryUiId }"
        role="button"
        tabindex="0"
        @click="store.setActiveQuery(query.uiId)"
      >
        <div class="card-main">
          <input
            class="query-key-input"
            :value="query.key"
            @click.stop
            @input="store.renameQueryKey(query.uiId, ($event.target as HTMLInputElement).value)"
          />
          <span class="card-meta">{{ t('query.chainsCount', { n: query.chains.length }) }}</span>
        </div>
        <div class="card-actions">
          <button
            type="button"
            class="btn btn-sm btn-ghost"
            :title="t('query.duplicateQuery')"
            :aria-label="t('query.duplicateQuery')"
            @click.stop="store.duplicateQuery(query.uiId)"
          >
            <IconCopy />
          </button>
          <button
            type="button"
            class="btn btn-sm btn-danger"
            :disabled="store.queries.length <= 1"
            :title="t('query.removeQuery')"
            :aria-label="t('query.removeQuery')"
            @click.stop="onRemove(query.uiId)"
          >
            <IconTrash />
          </button>
        </div>
      </div>
    </div>

    <div class="toolbar">
      <button type="button" class="btn btn-sm" @click="store.addQuery()">
        + {{ t('query.addQuery') }}
      </button>
    </div>
  </CollapsibleSection>
</template>

<style scoped>
.card {
  cursor: pointer;
  border-color: transparent;
}

.card.active {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}

.query-key-input {
  font: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  background: transparent;
  color: inherit;
  padding: 0;
  align-self: flex-start;
  field-sizing: content;
  min-width: 1ch;
  max-width: 100%;
}

.query-key-input:focus {
  outline: none;
  text-decoration: underline;
}
</style>
