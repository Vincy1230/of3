// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { describe, expect, it } from 'vitest'
import { deserializeInput, parseOf3Input } from '@/utils/of3Draft'
import { validateInput, type Issue } from '@/utils/of3Validate'

function minimalQueryJson(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    queries: {
      query_1: {
        chains: [{ molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG' }],
      },
    },
    ...overrides,
  })
}

/** Runs the same pipeline the app uses for a pasted/edited JSON: parse -> deserialize -> validate,
 * merging the structural issues deserializeInput found with validateInput's content issues —
 * exactly what the store does. */
function importAndValidate(text: string): Issue[] {
  const parsed = parseOf3Input(text)
  const state = deserializeInput(parsed)
  return [...state.issues, ...validateInput(state)]
}

describe('parseOf3Input — only blocks on invalid JSON syntax', () => {
  it('throws on invalid JSON syntax', () => {
    expect(() => parseOf3Input('{ this is not valid json')).toThrow(/./)
  })

  it('does not throw for well-formed JSON, however semantically wrong', () => {
    expect(() => parseOf3Input('[1, 2, 3]')).not.toThrow()
    expect(() => parseOf3Input('null')).not.toThrow()
    expect(() => parseOf3Input('"just a string"')).not.toThrow()
    expect(() => parseOf3Input('{}')).not.toThrow()
  })
})

describe('deserializeInput — structural problems degrade to issues instead of throwing', () => {
  it('flags a non-object root instead of throwing', () => {
    const state = deserializeInput(parseOf3Input('[1, 2, 3]'))
    expect(state.queries).toEqual([])
    expect(state.issues.map((i) => i.code)).toContain('root-not-object')
  })

  it('flags a missing/invalid "queries" field instead of throwing', () => {
    const state = deserializeInput(parseOf3Input('{}'))
    expect(state.queries).toEqual([])
    expect(state.issues.map((i) => i.code)).toContain('queries-invalid')
  })

  it('flags an empty "queries" object instead of throwing', () => {
    const state = deserializeInput(parseOf3Input('{"queries": {}}'))
    expect(state.queries).toEqual([])
    expect(state.issues.map((i) => i.code)).toContain('queries-empty')
  })

  it('drops a non-object query and flags it, keeping the rest', () => {
    const state = deserializeInput(
      parseOf3Input(
        JSON.stringify({
          queries: {
            bad: 'not an object',
            good: { chains: [{ molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG' }] },
          },
        }),
      ),
    )
    expect(state.queries.map((q) => q.key)).toEqual(['good'])
    expect(state.issues).toContainEqual(expect.objectContaining({ code: 'query-not-object', queryKey: 'bad' }))
  })

  it('flags a query with a missing/invalid "chains" array instead of throwing', () => {
    const state = deserializeInput(parseOf3Input(JSON.stringify({ queries: { query_1: {} } })))
    expect(state.queries).toHaveLength(1)
    expect(state.queries[0]!.chains).toEqual([])
    expect(state.issues.map((i) => i.code)).toContain('query-chains-invalid')
  })

  it('drops a non-object chain and flags it, keeping the rest', () => {
    const state = deserializeInput(
      parseOf3Input(
        JSON.stringify({
          queries: {
            query_1: { chains: ['not an object', { molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG' }] },
          },
        }),
      ),
    )
    expect(state.queries[0]!.chains).toHaveLength(1)
    expect(state.issues).toContainEqual(expect.objectContaining({ code: 'chain-not-object', params: { index: 1 } }))
  })

  it('drops a chain with a missing/invalid molecule_type and flags it', () => {
    const state = deserializeInput(
      parseOf3Input(JSON.stringify({ queries: { query_1: { chains: [{ chain_ids: 'A', sequence: 'ACDEFG' }] } } })),
    )
    expect(state.queries[0]!.chains).toHaveLength(0)
    expect(state.issues).toContainEqual(expect.objectContaining({ code: 'chain-molecule-type-invalid', params: { index: 1 } }))
  })
})

describe('unrecognized fields — reported through validateInput, at OpenFold3-matching severity', () => {
  it('warns on root-level "seeds"', () => {
    const issues = importAndValidate(minimalQueryJson({ seeds: [42] }))
    expect(issues).toContainEqual(expect.objectContaining({ level: 'warning', code: 'root-seeds-field' }))
  })

  it('warns on ccd_file_path at root — the docs list it, but InferenceQuerySet does not declare it', () => {
    const issues = importAndValidate(minimalQueryJson({ ccd_file_path: '/tmp/ccd' }))
    expect(issues).toContainEqual(
      expect.objectContaining({ level: 'warning', code: 'root-unrecognized-field', params: { field: 'ccd_file_path' } }),
    )
  })

  it('accepts the source-declared query-level use_msas/use_main_msas/use_paired_msas fields without a warning', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [{ molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG' }],
          use_msas: false,
          use_main_msas: false,
          use_paired_msas: false,
        },
      },
    })
    const issues = importAndValidate(text)
    expect(issues.map((i) => i.code)).not.toContain('query-unrecognized-field')
  })

  it('warns on an unrecognized query-level field', () => {
    const text = JSON.stringify({
      queries: { query_1: { chains: [{ molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG' }], made_up: 1 } },
    })
    const issues = importAndValidate(text)
    expect(issues).toContainEqual(
      expect.objectContaining({ level: 'warning', code: 'query-unrecognized-field', params: { field: 'made_up' } }),
    )
  })

  it('does not block on an unrecognized chain-level field — errors, but through validateInput', () => {
    const text = JSON.stringify({
      queries: { query_1: { chains: [{ molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG', made_up_field: 1 }] } },
    })
    expect(() => parseOf3Input(text)).not.toThrow()
    const issues = importAndValidate(text)
    expect(issues).toContainEqual(
      expect.objectContaining({ level: 'error', code: 'chain-unrecognized-field', params: { field: 'made_up_field' } }),
    )
  })

  it('accepts a field that belongs to the shared Chain model even outside its usual molecule_type', () => {
    // Chain is one pydantic model shared by every molecule_type — "smiles" on a protein chain
    // is unused, not rejected, since OpenFold3 doesn't partition the field set per type.
    const text = JSON.stringify({
      queries: { query_1: { chains: [{ molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG', smiles: 'CCO' }] } },
    })
    const issues = importAndValidate(text)
    expect(issues.map((i) => i.code)).not.toContain('chain-unrecognized-field')
  })

  it('does not block on an unrecognized pocket_constraint field', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [
            { molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG' },
            { molecule_type: 'ligand', chain_ids: 'L', smiles: 'CCO' },
          ],
          pocket_constraint: { ligand_chain_id: 'L', pocket_residues: [['A', 1]], extra_threshold: 9 },
        },
      },
    })
    expect(() => parseOf3Input(text)).not.toThrow()
    const issues = importAndValidate(text)
    expect(issues).toContainEqual(
      expect.objectContaining({ level: 'error', code: 'pocket-constraint-unrecognized-field', params: { field: 'extra_threshold' } }),
    )
  })
})

describe('content problems that used to block are now reported through validateInput only', () => {
  it('chain-template-conflict', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [
            {
              molecule_type: 'protein',
              chain_ids: 'A',
              sequence: 'ACDEFG',
              template_alignment_file_path: '/a.msa',
              template_cif_paths: ['/a.cif'],
            },
          ],
        },
      },
    })
    expect(() => parseOf3Input(text)).not.toThrow()
    expect(importAndValidate(text).map((i) => i.code)).toContain('chain-template-conflict')
  })

  it('template_cif_chain_ids length mismatch', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [
            {
              molecule_type: 'protein',
              chain_ids: 'A',
              sequence: 'ACDEFG',
              template_cif_paths: ['/a.cif', '/b.cif'],
              template_cif_chain_ids: ['A'],
            },
          ],
        },
      },
    })
    expect(() => parseOf3Input(text)).not.toThrow()
    expect(importAndValidate(text).map((i) => i.code)).toContain('chain-template-cif-length-mismatch')
  })

  it('a ligand chain specifying both smiles and ccd_codes', () => {
    const text = JSON.stringify({
      queries: { query_1: { chains: [{ molecule_type: 'ligand', chain_ids: 'L', smiles: 'CCO', ccd_codes: 'NAG' }] } },
    })
    expect(() => parseOf3Input(text)).not.toThrow()
    expect(importAndValidate(text).map((i) => i.code)).toContain('ligand-identifier-conflict')
  })

  it('an empty pocket_constraint.ligand_chain_id', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [{ molecule_type: 'ligand', chain_ids: 'L', smiles: 'CCO' }],
          pocket_constraint: { ligand_chain_id: '', pocket_residues: [['A', 1]] },
        },
      },
    })
    expect(() => parseOf3Input(text)).not.toThrow()
    expect(importAndValidate(text).map((i) => i.code)).toContain('pocket-ligand-id-empty')
  })

  it('an empty pocket_constraint.pocket_residues', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [{ molecule_type: 'ligand', chain_ids: 'L', smiles: 'CCO' }],
          pocket_constraint: { ligand_chain_id: 'L', pocket_residues: [] },
        },
      },
    })
    expect(() => parseOf3Input(text)).not.toThrow()
    expect(importAndValidate(text).map((i) => i.code)).toContain('pocket-residues-empty')
  })

  it('a non-positive pocket_constraint.max_distance', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [{ molecule_type: 'ligand', chain_ids: 'L', smiles: 'CCO' }],
          pocket_constraint: { ligand_chain_id: 'L', pocket_residues: [['A', 1]], max_distance: 0 },
        },
      },
    })
    expect(() => parseOf3Input(text)).not.toThrow()
    expect(importAndValidate(text).map((i) => i.code)).toContain('pocket-max-distance-invalid')
  })
})
