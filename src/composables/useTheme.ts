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

// 单例副作用：把"实际生效"的主题（auto 时跟随系统解析出的结果）同步到
// <html data-theme>。main.css 只需针对 [data-theme="dark"] 写一份深色
// 变量，不必再用 @media (prefers-color-scheme) 重复一份，避免两处
// 同时维护、容易漏改的问题。index.html 里另有一段内联脚本做首屏同步，
// 避免刷新时先出现错误主题再跳变的闪烁。
watchEffect(() => {
  if (typeof document === 'undefined') return
  const resolved: ResolvedTheme = themeMode.value === 'auto' ? (systemPrefersDark.value ? 'dark' : 'light') : themeMode.value
  document.documentElement.dataset.theme = resolved
})
