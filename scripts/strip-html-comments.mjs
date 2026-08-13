// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { readFile, writeFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')
const AUTHOR_MARKER = 'Author: Vincy SHI'

function stripComments(html) {
  let out = html.replace(/[ \t]*<!--[\s\S]*?-->\n?/g, (match) =>
    match.includes(AUTHOR_MARKER) ? match : '',
  )
  out = out
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n')
  return out
}

async function main() {
  const entries = await readdir(distDir, { withFileTypes: true, recursive: true })
  const htmlFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => path.join(entry.parentPath, entry.name))

  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf-8')
    const stripped = stripComments(html)
    if (stripped !== html) {
      await writeFile(file, stripped, 'utf-8')
      console.log(`strip-html-comments: cleaned ${path.relative(distDir, file)}`)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
