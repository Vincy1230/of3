// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import zhHK from './zh-HK'
import en from './en'

export const SUPPORTED_LOCALES = ['en', 'zh-CN', 'zh-HK'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

const DEFAULT_LOCALE: SupportedLocale = 'en'

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
