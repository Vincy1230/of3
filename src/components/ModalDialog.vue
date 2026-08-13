<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{ open: boolean; titleText: string; size?: 'default' | 'full' }>(), {
  size: 'default',
})
const emit = defineEmits<{ close: [] }>()

const dialogRef = ref<HTMLDialogElement | null>(null)

watch(
  () => props.open,
  (isOpen) => {
    const el = dialogRef.value
    if (!el) return
    if (isOpen && !el.open) el.showModal()
    if (!isOpen && el.open) el.close()
  },
)

function onBackdropClick(event: MouseEvent) {
  if (event.target === dialogRef.value) emit('close')
}
</script>

<template>
  <dialog
    ref="dialogRef"
    class="modal"
    :class="`size-${props.size}`"
    @cancel.prevent="emit('close')"
    @close="emit('close')"
    @click="onBackdropClick"
  >
    <div class="modal-header">
      <h3>{{ titleText }}</h3>
      <button type="button" class="close-btn" :aria-label="titleText" @click="emit('close')">×</button>
    </div>
    <div class="modal-body">
      <slot />
    </div>
  </dialog>
</template>

<style scoped>
.modal {
  border: none;
  border-radius: var(--radius-lg);
  padding: 0;
  width: min(640px, 92vw);
  max-height: 85vh;
  box-shadow: var(--shadow-elevated);
  background: var(--color-bg-elevated);
  color: var(--color-text);
}

/* 必须限定 [open]：class 选择器优先级高于浏览器默认的
   `dialog:not([open]) { display: none }`，如果不加 [open] 限定，
   这条规则会在对话框关闭时也强制 display:flex，导致它一直可见。 */
.modal.size-full[open] {
  width: 96vw;
  height: 94vh;
  max-height: 94vh;
  display: flex;
  flex-direction: column;
}

.modal.size-full[open] .modal-body {
  flex: 1;
  min-height: 0;
  max-height: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal::backdrop {
  background: rgba(15, 15, 20, 0.5);
  backdrop-filter: blur(2px);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 0 0.25rem;
}

.close-btn:hover {
  color: var(--color-text);
}

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
  max-height: calc(85vh - 60px);
}
</style>
