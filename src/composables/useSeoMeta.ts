// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { i18n, LOCALE_PATHS, SUPPORTED_LOCALES, type SupportedLocale } from '@/locales'
import { SITE_URL, OG_IMAGE, TITLES, OG_LOCALE, HREFLANG, KEYWORDS, DEFAULT_LOCALE } from '@/seo/meta.mjs'

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    if (hreflang) el.setAttribute('hreflang', hreflang)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function applySeoMeta(locale: SupportedLocale) {
  const title = TITLES[locale]
  const description = i18n.global.t('app.subtitle')
  const url = `${SITE_URL}${LOCALE_PATHS[locale]}`

  document.title = title
  setMeta('name', 'description', description)
  setMeta('name', 'keywords', KEYWORDS[locale])

  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:url', url)
  setMeta('property', 'og:image', OG_IMAGE)
  setMeta('property', 'og:locale', OG_LOCALE[locale])
  setMeta('property', 'og:site_name', TITLES[DEFAULT_LOCALE as SupportedLocale])

  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', description)
  setMeta('name', 'twitter:image', OG_IMAGE)

  setLink('canonical', url)
  for (const l of SUPPORTED_LOCALES) {
    setLink('alternate', `${SITE_URL}${LOCALE_PATHS[l]}`, HREFLANG[l])
  }
  setLink('alternate', `${SITE_URL}${LOCALE_PATHS[DEFAULT_LOCALE as SupportedLocale]}`, 'x-default')
}
