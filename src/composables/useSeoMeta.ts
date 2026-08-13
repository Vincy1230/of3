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

/**
 * 纯静态托管（GitHub Pages）没有服务端渲染：首屏 SEO 内容由构建期的
 * scripts/prerender-locales.mjs 直接烘焙进各语言路径各自的静态
 * index.html（title/description/OG/Twitter Card/canonical/hreflang
 * 全部在原始 HTML 里，不依赖 JS 执行，因此不会执行 JS 的爬虫/抓取
 * 工具也能看到正确内容）。这个函数负责的是应用启动之后、纯客户端路由
 * 切换语言时同步更新这些标签——这种情况下不会有新的 HTTP 请求去拿到
 * 对应语言预渲染好的 HTML，所以仍然需要在这里用 JS 改写一次。
 */
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
