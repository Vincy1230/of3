// Author: Vincy SHI
// Email: vincy@vincy1230.net

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const TOKEN_PATTERN =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g

export function highlightJson(json: string): string {
  const escaped = escapeHtml(json)
  return escaped.replace(TOKEN_PATTERN, (match) => {
    let cls = 'json-number'
    if (match.startsWith('"')) {
      cls = /:\s*$/.test(match) ? 'json-key' : 'json-string'
    } else if (match === 'true' || match === 'false') {
      cls = 'json-boolean'
    } else if (match === 'null') {
      cls = 'json-null'
    }
    return `<span class="${cls}">${match}</span>`
  })
}
