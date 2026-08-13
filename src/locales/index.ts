// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import zhHK from './zh-HK'
import en from './en'

export const SUPPORTED_LOCALES = ['en', 'zh-CN', 'zh-HK'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

const DEFAULT_LOCALE: SupportedLocale = 'en'

// 三种语言各自使用独立的规范路径，方便 SEO 与分享时按语言索引到对应
// 页面。根路径 "/" 直接展示英文内容而不重定向（见 src/router），但不
// 计入 LOCALE_PATHS——它不参与 hreflang/sitemap，英文的规范路径始终是
// /en/。路由在每次导航时都会把 i18n 的 locale 设置为当前路径对应的
// 语言，因此这里的初始值只是应用挂载前的占位，实际生效的语言始终由
// URL 决定。
export const LOCALE_PATHS: Record<SupportedLocale, string> = {
  'zh-CN': '/zh-cn/',
  'zh-HK': '/zh-hk/',
  en: '/en/',
}

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    'zh-CN': zhCN,
    'zh-HK': zhHK,
    en,
  },
})
