<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOf3BuilderStore } from '@/stores/of3Builder'
import { highlightJson } from '@/utils/jsonHighlight'
import { stringifyOrdered } from '@/utils/orderedJson'
import SegmentedControl from '@/components/SegmentedControl.vue'

const { t } = useI18n()
const store = useOf3BuilderStore()

const jsonText = computed(() => stringifyOrdered(store.output, 2))
const highlighted = computed(() => highlightJson(jsonText.value))
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const mode = ref<'view' | 'edit'>('view')
const draftText = ref(jsonText.value)
const parseError = ref<string | null>(null)
const dirty = ref(false)
let applyTimer: ReturnType<typeof setTimeout> | undefined
// Set for the one store update that applyDraft() itself causes, so the watcher below doesn't
// turn around and rewrite the textarea the user is typing in with the re-serialized form of what
// they just typed (different formatting, key order left as-is, etc. would otherwise yank their
// cursor). Store updates from anywhere else (a UI field edit, loading a preset, reset) are exactly
// what should flow into the textarea, so those still go through untouched.
let applyingFromDraft = false

watch(jsonText, (value) => {
  if (applyingFromDraft) return
  if (!dirty.value) draftText.value = value
})

function applyDraft() {
  clearTimeout(applyTimer)
  try {
    applyingFromDraft = true
    store.loadFromJson(draftText.value)
    parseError.value = null
    dirty.value = false
    void nextTick(() => {
      applyingFromDraft = false
    })
  } catch (err) {
    applyingFromDraft = false
    parseError.value = err instanceof Error ? err.message : String(err)
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
