// Author: Vincy SHI
// Email: vincy@vincy1230.net

/**
 * JavaScript objects (and therefore `JSON.stringify`) always enumerate integer-like string keys
 * in ascending numeric order first, no matter what order they were actually set in — this is an
 * ECMAScript spec rule (`OrdinaryOwnPropertyKeys`), not something callers can override through
 * insertion order. That silently reorders the two dictionaries in this app's output whose keys
 * can look like plain integers: the `queries` map (a query key like "1" or "2" is legal) and a
 * chain's `non_canonical_residues` map (keyed by residue index, which always looks like one).
 *
 * markOrdered attaches the real order as a hidden (non-enumerable) property, so every other
 * consumer of the object — tests, the `Of3Input` type contract, `Object.keys`, native
 * `JSON.stringify` — still sees a perfectly ordinary plain object with the value at the expected
 * property. Only stringifyOrdered (used to render the JSON panel's display/edit text) looks for
 * the marker and honors it instead of falling back to native key enumeration.
 */

const ORDER_MARKER = Symbol('explicitKeyOrder')

export function markOrdered<T extends object>(value: T, order: string[]): T {
  Object.defineProperty(value, ORDER_MARKER, {
    value: order,
    enumerable: false,
    configurable: true,
  })
  return value
}

function explicitOrder(value: object): string[] | undefined {
  return (value as Record<symbol, unknown>)[ORDER_MARKER] as string[] | undefined
}

/** Like `JSON.stringify(value, null, indent)`, except objects marked via markOrdered render
 * their keys in the order given to markOrdered instead of native key-enumeration order. */
export function stringifyOrdered(value: unknown, indent = 2): string {
  return render(value, indent, 0)
}

function render(value: unknown, indent: number, depth: number): string {
  if (value === undefined || value === null) return 'null'
  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string')
    return JSON.stringify(value)

  const pad = ' '.repeat(indent * (depth + 1))
  const closePad = ' '.repeat(indent * depth)

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.map((v) => `${pad}${render(v, indent, depth + 1)}`)
    return `[\n${items.join(',\n')}\n${closePad}]`
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const order = explicitOrder(value) ?? Object.keys(record)
    const entries = order
      .filter((key) => record[key] !== undefined)
      .map((key) => `${pad}${JSON.stringify(key)}: ${render(record[key], indent, depth + 1)}`)
    if (entries.length === 0) return '{}'
    return `{\n${entries.join(',\n')}\n${closePad}}`
  }

  return 'null'
}
