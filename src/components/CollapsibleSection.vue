<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{ title: string; defaultCollapsed?: boolean }>(), { defaultCollapsed: false })
const collapsed = ref(props.defaultCollapsed)
</script>

<template>
  <section class="panel section">
    <button type="button" class="section-header" @click="collapsed = !collapsed">
      <h2>{{ title }}</h2>
      <svg class="chevron" :class="{ collapsed }" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <div v-show="!collapsed" class="section-body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.section {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
}

.section-header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.chevron {
  flex-shrink: 0;
  color: var(--color-text-muted);
  transition: transform 0.2s ease;
}

.chevron.collapsed {
  transform: rotate(-90deg);
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
