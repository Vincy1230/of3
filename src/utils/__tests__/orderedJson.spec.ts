// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { describe, expect, it } from 'vitest'
import { markOrdered, stringifyOrdered } from '@/utils/orderedJson'
import { deserializeInput, parseOf3Input } from '@/utils/of3Draft'
import { serializeInput } from '@/utils/of3Serialize'

describe('stringifyOrdered', () => {
  it('matches JSON.stringify for plain values with no marker', () => {
    const value = { b: 1, a: 2, nested: { z: [1, 2, { x: 'y' }] } }
    expect(stringifyOrdered(value, 2)).toBe(JSON.stringify(value, null, 2))
  })

  it('honors markOrdered even for integer-like keys, where native object enumeration would resort them', () => {
    const dict: Record<string, number> = { '12': 1, '3': 2, '1': 3 }
    // Sanity check: this is exactly the native behavior stringifyOrdered has to work around.
    expect(Object.keys(dict)).toEqual(['1', '3', '12'])

    markOrdered(dict, ['12', '3', '1'])
    expect(stringifyOrdered(dict, 2)).toBe('{\n  "12": 1,\n  "3": 2,\n  "1": 3\n}')
  })

  it('omits undefined-valued properties, like native JSON.stringify', () => {
    const value = { a: 1, b: undefined, c: 3 }
    expect(stringifyOrdered(value, 2)).toBe(JSON.stringify(value, null, 2))
  })
})

describe('order preservation for the two dictionaries JS silently resorts (integer-like keys)', () => {
  // These fixtures are literal strings on purpose, NOT `JSON.stringify({'12': ..., '3': ..., '1': ...})`
  // — a JS object literal with integer-like keys is *itself* already reordered by the engine the
  // moment it's evaluated, before JSON.stringify ever sees it, so building the fixture that way
  // would silently test with already-"1,3,12"-ordered input and never catch a real regression.

  it('preserves non_canonical_residues order when indices are out of ascending order', () => {
    const text =
      '{"queries": {"demo": {"chains": [{"molecule_type": "protein", "chain_ids": "A", "sequence": "ACDEFGHIKLMN", ' +
      '"non_canonical_residues": {"12": "SEP", "3": "MHO", "1": "PTR"}}]}}}'
    const state = deserializeInput(parseOf3Input(text))
    const output = serializeInput(state)
    const rendered = stringifyOrdered(output, 2)
    const parsedBack = JSON.parse(rendered)
    // The parsed-back value is a plain object again (so this assertion alone wouldn't catch a
    // regression) — the real assertion is the literal text order below.
    expect(parsedBack.queries.demo.chains[0].non_canonical_residues).toEqual({ '1': 'PTR', '3': 'MHO', '12': 'SEP' })
    const residueBlock = rendered.slice(rendered.indexOf('"non_canonical_residues"'))
    expect(residueBlock.indexOf('"12"')).toBeLessThan(residueBlock.indexOf('"3"'))
    expect(residueBlock.indexOf('"3"')).toBeLessThan(residueBlock.indexOf('"1"'))
  })

  it('preserves query key order when keys look like plain integers', () => {
    const text =
      '{"queries": {"2": {"chains": [{"molecule_type": "protein", "chain_ids": "A", "sequence": "ACDEFG"}]}, ' +
      '"1": {"chains": [{"molecule_type": "protein", "chain_ids": "B", "sequence": "HIKLMN"}]}}}'
    const state = deserializeInput(parseOf3Input(text))
    const output = serializeInput(state)
    const rendered = stringifyOrdered(output, 2)
    expect(rendered.indexOf('"2"')).toBeLessThan(rendered.indexOf('"1"'))
  })
})
