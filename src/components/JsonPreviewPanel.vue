<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOf3BuilderStore } from '@/stores/of3Builder'
import { highlightJson } from '@/utils/jsonHighlight'

const { t } = useI18n()
const store = useOf3BuilderStore()

const jsonText = computed(() => JSON.stringify(store.output, null, 2))
const highlighted = computed(() => highlightJson(jsonText.value))
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copyJson() {
  await navigator.clipboard.writeText(jsonText.value)
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = false), 1500)
}

function downloadJson() {
  const blob = new Blob([jsonText.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'of3_input.json'
  link.click()
  URL.revokeObjectURL(url)
}

function resetAll() {
  if (confirm(t('jsonPreview.resetConfirm'))) store.reset()
}
</script>

<template>
  <section class="panel json-panel">
    <div class="json-header">
      <h2>{{ t('jsonPreview.title') }}</h2>
      <div class="json-actions">
        <button type="button" class="btn btn-sm" @click="copyJson">
          {{ copied ? t('jsonPreview.copied') : t('jsonPreview.copy') }}
        </button>
        <button type="button" class="btn btn-sm" @click="downloadJson">{{ t('jsonPreview.download') }}</button>
        <button type="button" class="btn btn-sm btn-danger" @click="resetAll">{{ t('jsonPreview.reset') }}</button>
      </div>
    </div>
    <pre class="json-view"><code v-html="highlighted"></code></pre>
  </section>
</template>

<style scoped>
.json-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 0.75rem;
}

.json-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex-shrink: 0;
}

.json-header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.json-actions {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.json-view {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0.9rem 1rem;
  overflow: auto;
  border-radius: var(--radius-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  font-family: var(--font-mono);
  font-size: 0.82rem;
  line-height: 1.5;
}

.json-view code {
  font-family: inherit;
}

.json-view :deep(.json-key) {
  color: var(--color-accent);
}

.json-view :deep(.json-string) {
  color: var(--color-success);
}

.json-view :deep(.json-number),
.json-view :deep(.json-boolean) {
  color: var(--color-active);
}

.json-view :deep(.json-null) {
  color: var(--color-text-muted);
}
</style>
