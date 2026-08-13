<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { LOCALE_PATHS, SUPPORTED_LOCALES, type SupportedLocale } from '@/locales'
import { setThemeMode, themeMode, type ThemeMode } from '@/composables/useTheme'

const { t, locale } = useI18n()
const router = useRouter()

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'EN',
  'zh-CN': '简',
  'zh-HK': '繁',
}

const THEME_MODES: ThemeMode[] = ['auto', 'light', 'dark']
const THEME_ICONS: Record<ThemeMode, string> = { auto: '◐', light: '☀', dark: '☾' }
const THEME_LABEL_KEYS: Record<ThemeMode, string> = {
  auto: 'header.themeAuto',
  light: 'header.themeLight',
  dark: 'header.themeDark',
}

function switchLocale(l: SupportedLocale) {
  router.push(LOCALE_PATHS[l])
}
</script>

<template>
  <header class="app-header">
    <div class="titles">
      <h1>{{ t('app.title') }}</h1>
      <p>{{ t('app.subtitle') }}</p>
    </div>
    <div class="header-actions">
      <a
        class="github-link"
        href="https://github.com/Vincy1230/of3"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg class="github-icon" viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
          <path
            fill="currentColor"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
               0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
               -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07
               -1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82
               .64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12
               .51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48
               0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
          />
        </svg>
        <span>Star on GitHub</span>
      </a>

      <div class="pill-group" role="group" :aria-label="t('header.languageLabel')">
        <button
          v-for="l in SUPPORTED_LOCALES"
          :key="l"
          type="button"
          class="pill-btn"
          :class="{ active: locale === l }"
          @click="switchLocale(l)"
        >
          {{ LOCALE_LABELS[l] }}
        </button>
      </div>

      <div class="pill-group" role="group" :aria-label="t('header.themeLabel')">
        <button
          v-for="m in THEME_MODES"
          :key="m"
          type="button"
          class="pill-btn"
          :class="{ active: themeMode === m }"
          :title="t(THEME_LABEL_KEYS[m])"
          :aria-label="t(THEME_LABEL_KEYS[m])"
          @click="setThemeMode(m)"
        >
          {{ THEME_ICONS[m] }}
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem clamp(1rem, 4vw, 2.5rem);
  flex-shrink: 0;
  background: color-mix(in srgb, var(--color-bg) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-border);
}

.titles h1 {
  margin: 0;
  font-size: clamp(1.05rem, 1.4vw, 1.35rem);
  font-weight: 700;
  letter-spacing: -0.01em;
}

.titles p {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.6rem;
  flex-shrink: 0;
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.2s ease;
}

.github-link:hover {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.github-icon {
  flex-shrink: 0;
}

.pill-group {
  display: inline-flex;
  flex-shrink: 0;
  gap: 2px;
  padding: 3px;
  border-radius: 999px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
}

.pill-btn {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.pill-btn:hover {
  color: var(--color-text);
}

.pill-btn.active {
  background: var(--gradient-accent);
  color: var(--color-accent-contrast);
}

@media (max-width: 860px) {
  .app-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    justify-content: flex-start;
  }
}
</style>
