// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  SITE_URL,
  LOCALE_PATHS,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  TITLES,
  DESCRIPTIONS,
  KEYWORDS,
  OG_LOCALE,
  HREFLANG,
  HTML_LANG,
} from '../src/seo/meta.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function replaceOrThrow(html, pattern, replacement, label) {
  if (!pattern.test(html)) {
    throw new Error(
      `prerender-locales: Failed to find the tag to be replaced (${label}) in index.html`,
    )
  }
  return html.replace(pattern, replacement)
}

function renderForLocale(template, locale) {
  const title = TITLES[locale]
  const description = DESCRIPTIONS[locale]
  const url = `${SITE_URL}${LOCALE_PATHS[locale]}`

  let html = template
  html = replaceOrThrow(
    html,
    /<html lang="[^"]*"/,
    `<html lang="${HTML_LANG[locale]}"`,
    'html lang',
  )
  html = replaceOrThrow(
    html,
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(title)}</title>`,
    'title',
  )
  html = replaceOrThrow(
    html,
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${escapeHtml(description)}">`,
    'meta description',
  )
  html = replaceOrThrow(
    html,
    /<meta name="keywords" content="[^"]*">/,
    `<meta name="keywords" content="${escapeHtml(KEYWORDS[locale])}">`,
    'meta keywords',
  )
  html = replaceOrThrow(
    html,
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    'og:title',
  )
  html = replaceOrThrow(
    html,
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    'og:description',
  )
  html = replaceOrThrow(
    html,
    /<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${url}">`,
    'og:url',
  )
  html = replaceOrThrow(
    html,
    /<meta property="og:locale" content="[^"]*">/,
    `<meta property="og:locale" content="${OG_LOCALE[locale]}">`,
    'og:locale',
  )
  html = replaceOrThrow(
    html,
    /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    'twitter:title',
  )
  html = replaceOrThrow(
    html,
    /<meta name="twitter:description" content="[^"]*">/,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    'twitter:description',
  )

  const canonical = `<link rel="canonical" href="${url}">`
  const alternates = SUPPORTED_LOCALES.map(
    (l) => `<link rel="alternate" href="${SITE_URL}${LOCALE_PATHS[l]}" hreflang="${HREFLANG[l]}">`,
  ).join('\n    ')
  const xDefault = `<link rel="alternate" href="${SITE_URL}${LOCALE_PATHS[DEFAULT_LOCALE]}" hreflang="x-default">`

  html = replaceOrThrow(
    html,
    /<\/head>/,
    `    ${canonical}\n    ${alternates}\n    ${xDefault}\n  </head>`,
    '</head>',
  )

  return html
}

async function main() {
  const templatePath = path.join(distDir, 'index.html')
  const template = await readFile(templatePath, 'utf-8')

  for (const locale of SUPPORTED_LOCALES) {
    const html = renderForLocale(template, locale)
    const relDir = LOCALE_PATHS[locale].replace(/^\/|\/$/g, '')
    const outDir = path.join(distDir, relDir)
    await mkdir(outDir, { recursive: true })
    await writeFile(path.join(outDir, 'index.html'), html, 'utf-8')
    console.log(`prerender-locales: wrote dist/${relDir}/index.html`)
  }

  const rootHtml = renderForLocale(template, DEFAULT_LOCALE)
  await writeFile(templatePath, rootHtml, 'utf-8')
  console.log(`prerender-locales: rewrote dist/index.html (${DEFAULT_LOCALE}, canonical -> /en/)`)

  const zhAliasHtml = renderForLocale(template, 'zh-CN')
  const zhAliasDir = path.join(distDir, 'zh')
  await mkdir(zhAliasDir, { recursive: true })
  await writeFile(path.join(zhAliasDir, 'index.html'), zhAliasHtml, 'utf-8')
  console.log('prerender-locales: wrote dist/zh/index.html (zh-CN, canonical -> /zh-cn/)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
