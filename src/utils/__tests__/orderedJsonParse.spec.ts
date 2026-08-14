// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { describe, expect, it } from 'vitest'
import { JsonObject, parseOrderedJson, type JsonValue } from '@/utils/orderedJsonParse'

/** Converts a parsed tree (with JsonObject/Map nodes) into a plain-object tree, for comparing
 * against native JSON.parse's output with toEqual (which doesn't understand Map vs plain object). */
function toPlain(value: JsonValue): unknown {
  if (value instanceof JsonObject) {
    const obj: Record<string, unknown> = {}
    for (const [k, v] of value) obj[k] = toPlain(v)
    return obj
  }
  if (Array.isArray(value)) return value.map(toPlain)
  return value
}

const FIXTURES = [
  '{}',
  '[]',
  '"hello"',
  '42',
  '-3.5',
  '1.5e10',
  '1.5E-10',
  'true',
  'false',
  'null',
  '{"a": 1, "b": [1, 2, 3], "c": {"nested": true}}',
  '{"unicode": "caf\\u00e9", "escapes": "line1\\nline2\\ttab\\"quote\\"\\\\backslash"}',
  '[{"a": 1}, {"b": 2}, [1, [2, [3]]]]',
  '{"empty_obj": {}, "empty_arr": [], "null_val": null}',
  '  {  "spaced" :  1  ,  "keys" : [ 1 , 2 ]  }  ',
  '{"unicode_key_é": "value"}',
]

describe('parseOrderedJson — matches native JSON.parse for values', () => {
  for (const text of FIXTURES) {
    it(`parses ${JSON.stringify(text)} the same as JSON.parse`, () => {
      expect(toPlain(parseOrderedJson(text))).toEqual(JSON.parse(text))
    })
  }

  it('parses a realistic OpenFold3-shaped document identically to JSON.parse', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [
            {
              molecule_type: 'protein',
              chain_ids: ['A', 'B'],
              sequence: 'ACDEFG',
              non_canonical_residues: { '1': 'MHO', '5': 'SEP' },
            },
          ],
          pocket_constraint: {
            ligand_chain_id: 'L',
            pocket_residues: [['A', 1]],
            max_distance: 4.5,
          },
        },
      },
    })
    expect(toPlain(parseOrderedJson(text))).toEqual(JSON.parse(text))
  })
})

describe('parseOrderedJson — preserves true source key order, including integer-like keys', () => {
  it('preserves object key order regardless of key shape', () => {
    const parsed = parseOrderedJson('{"12": "a", "3": "b", "1": "c", "z": "d"}') as JsonObject
    expect([...parsed.keys()]).toEqual(['12', '3', '1', 'z'])
  })

  it('preserves order in nested objects independently at each level', () => {
    const parsed = parseOrderedJson('{"b": {"20": 1, "5": 2}, "a": {"z": 1, "y": 2}}') as JsonObject
    expect([...parsed.keys()]).toEqual(['b', 'a'])
    expect([...(parsed.get('b') as JsonObject).keys()]).toEqual(['20', '5'])
    expect([...(parsed.get('a') as JsonObject).keys()]).toEqual(['z', 'y'])
  })

  it('preserves order across array elements', () => {
    const parsed = parseOrderedJson('[{"9": 1, "2": 2}, {"7": 1, "1": 2}]') as JsonValue[]
    expect([...(parsed[0] as JsonObject).keys()]).toEqual(['9', '2'])
    expect([...(parsed[1] as JsonObject).keys()]).toEqual(['7', '1'])
  })
})

describe('parseOrderedJson — error handling matches expectations for malformed input', () => {
  it('throws on invalid JSON syntax', () => {
    expect(() => parseOrderedJson('{ this is not valid json')).toThrow(/./)
    expect(() => parseOrderedJson('{"a": }')).toThrow(/./)
    expect(() => parseOrderedJson('{"a": 1,}')).toThrow(/./)
    expect(() => parseOrderedJson('[1, 2,]')).toThrow(/./)
    expect(() => parseOrderedJson('"unterminated')).toThrow(/./)
    expect(() => parseOrderedJson('01')).toThrow(/./)
    expect(() => parseOrderedJson('')).toThrow(/./)
    expect(() => parseOrderedJson('{"a": 1} trailing')).toThrow(/./)
  })
})
