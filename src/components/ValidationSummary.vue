<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useOf3BuilderStore } from '@/stores/of3Builder'
import type { Issue } from '@/utils/of3Validate'

const { t } = useI18n()
const store = useOf3BuilderStore()

function context(issue: Issue): string {
  if (issue.chainLabel)
    return t('validation.contextChain', { queryKey: issue.queryKey, chainLabel: issue.chainLabel })
  if (issue.queryKey !== undefined) return t('validation.context', { queryKey: issue.queryKey })
  return ''
}

function message(issue: Issue): string {
  return t(`validation.${issue.code}`, issue.params ?? {})
}
</script>

<template>
  <section class="panel section validation-panel">
    <h2>{{ t('validation.title') }}</h2>
    <p v-if="store.issues.length === 0" class="hint success">{{ t('validation.noIssues') }}</p>
    <div v-else class="issue-list">
      <div v-for="(issue, index) in store.issues" :key="index" class="issue" :class="issue.level">
        <span>
          <strong>{{
            issue.level === 'error' ? t('validation.errorLabel') : t('validation.warningLabel')
          }}</strong>
          — {{ message(issue) }}
          <span v-if="context(issue)" class="issue-context">{{ context(issue) }}</span>
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.validation-panel {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.validation-panel h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}
</style>
