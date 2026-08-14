// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { ref, watchEffect } from 'vue'

export type ThemeMode = 'auto' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'of3:theme'
const media = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : null

function readStored(): ThemeMode {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  return raw === 'light' || raw === 'dark' ? raw : 'auto'
}

export const themeMode = ref<ThemeMode>(readStored())
const systemPrefersDark = ref(media?.matches ?? false)

media?.addEventListener('change', (e) => {
  systemPrefersDark.value = e.matches
})

export function setThemeMode(mode: ThemeMode) {
  themeMode.value = mode
  if (typeof localStorage === 'undefined') return
  if (mode === 'auto') localStorage.removeItem(STORAGE_KEY)
  else localStorage.setItem(STORAGE_KEY, mode)
}

watchEffect(() => {
  if (typeof document === 'undefined') return
  const resolved: ResolvedTheme =
    themeMode.value === 'auto' ? (systemPrefersDark.value ? 'dark' : 'light') : themeMode.value
  document.documentElement.dataset.theme = resolved
})
