// Author: Vincy SHI
// Email: vincy@vincy1230.net
//
// 构建后处理：GitHub Pages 是纯静态托管，没有 SSR，vite build 只产出
// 一份 dist/index.html。不执行 JS 的爬虫/抓取工具（很多社交平台的
// 链接预览机器人、部分搜索引擎的首轮抓取）看到的就是这份原始 HTML，
// 而 title/description/OG/canonical/hreflang 这些标签此前只在
// useSeoMeta.ts 里于路由切换时用 JS 写入——对这些工具等于形同虚设，
// 三种语言路径拿到的还是构建时写死在 index.html 里的同一份内容。
//
// 这里把同一份 dist/index.html 按语言复制成
// dist/{zh-cn,zh-hk,en}/index.html，并把 title/description/OG/
// Twitter Card/canonical/hreflang 换成各自语言的正确内容，
// 直接烘焙进原始 HTML，不依赖 JS 执行。根路径 dist/index.html 也一并
// 替换为默认语言（英文）版本，canonical 仍指向 /en/，避免与根路径
// 重复内容。
//
// 运行时（客户端路由切换语言）仍然依赖 useSeoMeta.ts 用 JS 更新这些
// 标签，两者并不冲突：一个负责"首次进入/爬虫看到的静态 HTML"，
// 一个负责"SPA 内切换语言时的动态更新"。

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
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function replaceOrThrow(html, pattern, replacement, label) {
  if (!pattern.test(html)) {
    throw new Error(`prerender-locales: 没能在 index.html 里找到需要替换的标签 (${label})`)
  }
  return html.replace(pattern, replacement)
}

function renderForLocale(template, locale) {
  const title = TITLES[locale]
  const description = DESCRIPTIONS[locale]
  const url = `${SITE_URL}${LOCALE_PATHS[locale]}`

  let html = template
  html = replaceOrThrow(html, /<html lang="[^"]*"/, `<html lang="${HTML_LANG[locale]}"`, 'html lang')
  html = replaceOrThrow(html, /<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`, 'title')
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

  // 根路径复用默认语言（英文）版本，避免和 /en/ 构成重复内容（两者内容
  // 一致，但都把 canonical 指向 /en/）。
  const rootHtml = renderForLocale(template, DEFAULT_LOCALE)
  await writeFile(templatePath, rootHtml, 'utf-8')
  console.log(`prerender-locales: rewrote dist/index.html (${DEFAULT_LOCALE}, canonical -> /en/)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
