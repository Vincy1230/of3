// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { SITE_URL, LOCALE_PATHS, SUPPORTED_LOCALES, HREFLANG, DEFAULT_LOCALE } from '../src/seo/meta.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')

function buildSitemap() {
  const lastmod = new Date().toISOString().slice(0, 10)

  const alternates = SUPPORTED_LOCALES.map(
    (l) => `      <xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${SITE_URL}${LOCALE_PATHS[l]}" />`,
  ).join('\n')
  const xDefault = `      <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${LOCALE_PATHS[DEFAULT_LOCALE]}" />`

  const urls = SUPPORTED_LOCALES.map(
    (l) => `  <url>
    <loc>${SITE_URL}${LOCALE_PATHS[l]}</loc>
    <lastmod>${lastmod}</lastmod>
${alternates}
${xDefault}
  </url>`,
  ).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`
}

async function main() {
  const xml = buildSitemap()
  await writeFile(path.join(distDir, 'sitemap.xml'), xml, 'utf-8')
  console.log('generate-sitemap: wrote dist/sitemap.xml')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
