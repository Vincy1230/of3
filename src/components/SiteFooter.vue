<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import beianIcon from '@/assets/beian.png'

// 备案号与对应链接都不写死在代码里，构建时通过环境变量整体注入
// （见 .github/workflows/deploy.yml），本地开发未设置时不显示，不
// 影响其他功能。每个备案号可以只给编号不给链接（退化为纯文本），
// 但不能只给链接不给编号。版权文字不受这些变量影响，始终显示。
const icpCode = import.meta.env.VITE_ICP_CODE
const icpUrl = import.meta.env.VITE_ICP_URL
const mpsCode = import.meta.env.VITE_MPS_CODE
const mpsUrl = import.meta.env.VITE_MPS_URL

// ICP/公安备案是中国大陆法规要求，仅在简体中文页面展示；
// 切换到繁体中文或英文时自动隐藏，避免向海外/港澳台用户展示无关信息。
const { locale, t } = useI18n()
const showFilings = computed(() => locale.value === 'zh-CN' && !!(icpCode || mpsCode))

const copyrightText = computed(() => {
  const currentYear = new Date().getFullYear()
  return t('footer.copyright', { year: currentYear <= 2026 ? '2026' : `2026-${currentYear}` })
})
</script>

<template>
  <footer class="site-footer">
    <span class="copyright">{{ copyrightText }}</span>

    <div v-if="showFilings" class="filings">
      <template v-if="icpCode">
        <a v-if="icpUrl" :href="icpUrl" target="_blank" rel="noopener noreferrer">{{ icpCode }}</a>
        <span v-else>{{ icpCode }}</span>
      </template>

      <template v-if="mpsCode">
        <a v-if="mpsUrl" class="mps-item" :href="mpsUrl" target="_blank" rel="noopener noreferrer">
          <img :src="beianIcon" alt="" width="14" height="14" />
          {{ mpsCode }}
        </a>
        <span v-else class="mps-item">
          <img :src="beianIcon" alt="" width="14" height="14" />
          {{ mpsCode }}
        </span>
      </template>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  /* 默认（有备案信息且一行放得下）：版权居左、备案信息居右。 */
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
  flex-wrap: wrap;
  padding: 0.35rem 1.5rem;
  font-size: 0.72rem;
  color: var(--color-text-muted);
  border-top: 1px solid var(--color-border);
}

/* 没有任何备案信息时，只剩版权一项，space-between 会把它顶到最左边；
   这种情况下改成整体居右。 */
.site-footer:not(:has(.filings)) {
  justify-content: flex-end;
}

/* 宽度不够、两部分被迫各占一行时，space-between 会让第二行也贴左，
   这里统一强制两行都靠右对齐；同时把行间距收紧，让底栏尽量矮。 */
@media (max-width: 600px) {
  .site-footer {
    justify-content: flex-end;
    gap: 0.2rem 1.5rem;
    padding-block: 0.25rem;
  }
}

.copyright {
  white-space: nowrap;
}

.filings {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.4rem 1.25rem;
}

.filings a,
.filings .mps-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: inherit;
  text-decoration: none;
}

.filings a:hover {
  color: var(--color-text);
}
</style>
