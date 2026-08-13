// Author: Vincy SHI
// Email: vincy@vincy1230.net
//
// 构建后处理：清理 dist/ 下所有 .html 文件里的注释（HTML 注释与内联
// <script> 里独占一行的 // 注释），确保最终发布出去的文件不带注释。
// 源码（index.html、public/404.html 等）里的说明性注释本身不受影响，
// 只在发布产物里去掉——这样既保留给后来维护者看的上下文，也不会把内部
// 讨论细节（比如为什么这么写、参考链接）暴露给最终用户和爬虫。
// 唯一的例外是署名注释（含 "Author: Vincy SHI" 的 HTML 注释块），特意
// 保留到发布产物里。

import { readFile, writeFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')
const AUTHOR_MARKER = 'Author: Vincy SHI'

function stripComments(html) {
  // <!-- ... --> 形式的 HTML 注释，可能跨多行；署名注释块除外
  let out = html.replace(/[ \t]*<!--[\s\S]*?-->\n?/g, (match) =>
    match.includes(AUTHOR_MARKER) ? match : '',
  )
  // 内联 <script> 里独占一行的 // 注释。本项目里这类注释都是单独成行
  // 写在代码上方，不会有 'https://foo' 这类字符串把 // 混进代码行本身，
  // 所以按“整行去掉”处理是安全的。
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
