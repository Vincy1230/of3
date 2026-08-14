<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOf3BuilderStore } from '@/stores/of3Builder'
import { highlightJson } from '@/utils/jsonHighlight'
import SegmentedControl from '@/components/SegmentedControl.vue'
import type { UnknownFieldWarning } from '@/utils/of3Draft'

const { t } = useI18n()
const store = useOf3BuilderStore()

function warningMessage(warning: UnknownFieldWarning): string {
  if (warning.reason === 'seeds') return t('jsonPreview.seedsFieldWarning')
  return t('jsonPreview.unknownFieldIgnored', { key: warning.key, path: warning.path })
}

const jsonText = computed(() => JSON.stringify(store.output, null, 2))
const highlighted = computed(() => highlightJson(jsonText.value))
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const mode = ref<'view' | 'edit'>('view')
const draftText = ref(jsonText.value)
const parseError = ref<string | null>(null)
const dirty = ref(false)
let applyTimer: ReturnType<typeof setTimeout> | undefined

// Only follow store changes while the draft has no unapplied edits, so the
// user's in-progress typing (or an unresolved parse error) is never clobbered.
watch(jsonText, (value) => {
  if (!dirty.value) draftText.value = value
})

function applyDraft() {
  clearTimeout(applyTimer)
  try {
    store.loadFromJson(draftText.value)
    parseError.value = null
    dirty.value = false
  } catch (err) {
    parseError.value = err instanceof Error ? err.message : String(err)
    store.clearImportWarnings()
  }
}

function onDraftInput(event: Event) {
  dirty.value = true
  const inputType = (event as InputEvent).inputType
  clearTimeout(applyTimer)
  if (inputType === 'insertFromPaste') {
    applyDraft()
  } else {
    applyTimer = setTimeout(applyDraft, 450)
  }
}

function onDraftBlur() {
  if (dirty.value) applyDraft()
}

function setMode(next: 'view' | 'edit') {
  if (next === 'edit') {
    draftText.value = jsonText.value
    parseError.value = null
    dirty.value = false
  } else if (dirty.value) {
    applyDraft()
  }
  mode.value = next
}

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
        <SegmentedControl
          class="mode-toggle"
          :model-value="mode"
          :options="[
            { value: 'view', label: t('jsonPreview.previewMode') },
            { value: 'edit', label: t('jsonPreview.editMode') },
          ]"
          @update:model-value="setMode"
        />
        <button type="button" class="btn btn-sm" @click="copyJson">
          {{ copied ? t('jsonPreview.copied') : t('jsonPreview.copy') }}
        </button>
        <button type="button" class="btn btn-sm" @click="downloadJson">
          {{ t('jsonPreview.download') }}
        </button>
        <button type="button" class="btn btn-sm btn-danger" @click="resetAll">
          {{ t('jsonPreview.reset') }}
        </button>
      </div>
    </div>

    <template v-if="mode === 'edit'">
      <textarea
        class="json-editor"
        :class="{ invalid: parseError }"
        v-model="draftText"
        spellcheck="false"
        autocapitalize="off"
        autocorrect="off"
        @input="onDraftInput"
        @blur="onDraftBlur"
      ></textarea>
      <p v-if="parseError" class="hint json-error">
        {{ t('jsonPreview.parseError', { message: parseError }) }}
      </p>
      <ul v-else-if="store.importWarnings.length > 0" class="hint json-warning-list">
        <li v-for="(warning, index) in store.importWarnings" :key="index">
          {{ warningMessage(warning) }}
        </li>
      </ul>
    </template>
    <pre v-else class="json-view"><code v-html="highlighted"></code></pre>
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
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.mode-toggle {
  padding: 2px;
}

.mode-toggle :deep(.segment) {
  padding: 0.3rem 0.6rem;
  font-size: 0.78rem;
  border-radius: 8px;
}

.json-view,
.json-editor {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0.9rem 1rem;
  border-radius: var(--radius-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  font-family: var(--font-mono);
  font-size: 0.82rem;
  line-height: 1.5;
}

.json-view {
  overflow: auto;
}

.json-editor {
  overflow: auto;
  background: var(--color-bg-elevated);
  color: var(--color-text);
  resize: none;
  white-space: pre;
}

.json-editor:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

.json-editor.invalid {
  border-color: var(--color-danger);
}

.json-error {
  flex-shrink: 0;
  margin: 0;
  color: var(--color-danger);
}

.json-warning-list {
  flex-shrink: 0;
  margin: 0;
  padding-left: 1.1rem;
  color: var(--color-active);
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
