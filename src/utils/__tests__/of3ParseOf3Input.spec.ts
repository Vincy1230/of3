// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { describe, expect, it } from 'vitest'
import { deserializeInput, parseOf3Input } from '@/utils/of3Draft'
import { validateInput } from '@/utils/of3Validate'

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

/** Runs the same pipeline the app uses for a pasted/edited JSON: parse -> deserialize -> validate. */
function importAndValidate(text: string) {
  const { input } = parseOf3Input(text)
  const state = deserializeInput(input)
  return validateInput(state)
}

describe('parseOf3Input — unknown field handling', () => {
  it('warns on root-level "seeds" — InferenceQuerySet declares it, but the docs say not to hand-author it here', () => {
    const { warnings } = parseOf3Input(minimalQueryJson({ seeds: [42] }))
    expect(warnings).toEqual([{ path: 'root', key: 'seeds', reason: 'seeds' }])
  })

  it('warns (but does not throw) on ccd_file_path — the docs list it, but InferenceQuerySet does not declare it', () => {
    const { input, warnings } = parseOf3Input(minimalQueryJson({ ccd_file_path: '/tmp/ccd' }))
    expect(input.queries.query_1).toBeDefined()
    expect(warnings).toEqual([{ path: 'root', key: 'ccd_file_path' }])
  })

  it('warns (but does not throw) on an unrecognized root-level field', () => {
    const { warnings } = parseOf3Input(minimalQueryJson({ made_up_root_field: 1 }))
    expect(warnings).toEqual([{ path: 'root', key: 'made_up_root_field' }])
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
    const { warnings } = parseOf3Input(text)
    expect(warnings).toEqual([])
  })

  it('warns (but does not throw) on an unrecognized query-level field', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [{ molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG' }],
          made_up_query_field: 1,
        },
      },
    })
    const { warnings } = parseOf3Input(text)
    expect(warnings).toEqual([{ path: 'query "query_1"', key: 'made_up_query_field' }])
  })

  it('throws on an unrecognized chain-level field', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [{ molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG', made_up_field: 1 }],
        },
      },
    })
    expect(() => parseOf3Input(text)).toThrow(/unrecognized field "made_up_field"/)
  })

  it('accepts a field that belongs to the shared Chain model even outside its usual molecule_type', () => {
    // Chain is one pydantic model shared by every molecule_type — "smiles" on a protein chain
    // is unused, not rejected, since OpenFold3 doesn't partition the field set per type.
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [{ molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG', smiles: 'CCO' }],
        },
      },
    })
    expect(() => parseOf3Input(text)).not.toThrow()
  })

  it('does not block on a chain specifying both template_alignment_file_path and template_cif_paths — validateInput flags it as content, not parseOf3Input as syntax', () => {
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
    const issues = importAndValidate(text)
    expect(issues.map((i) => i.code)).toContain('chain-template-conflict')
  })

  it('throws when template_cif_chain_ids length does not match template_cif_paths length', () => {
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
    expect(() => parseOf3Input(text)).toThrow(/requires them to match/)
  })

  it('throws when a ligand chain specifies both smiles and ccd_codes', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [{ molecule_type: 'ligand', chain_ids: 'L', smiles: 'CCO', ccd_codes: 'NAG' }],
        },
      },
    })
    expect(() => parseOf3Input(text)).toThrow(/mutually exclusive/)
  })

  it('throws when a ligand chain specifies both ccd_codes and sdf_file_path', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [{ molecule_type: 'ligand', chain_ids: 'L', ccd_codes: 'NAG', sdf_file_path: '/a.sdf' }],
        },
      },
    })
    expect(() => parseOf3Input(text)).toThrow(/mutually exclusive/)
  })

  it('accepts a chain with "cyclic" and a ligand chain with "sdf_file_path" — both are real Chain fields, just undocumented', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [
            { molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG', cyclic: true },
            { molecule_type: 'ligand', chain_ids: 'L', sdf_file_path: '/a.sdf' },
          ],
        },
      },
    })
    expect(() => parseOf3Input(text)).not.toThrow()
  })

  it('throws when "cyclic" is not a boolean', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [{ molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG', cyclic: 'yes' }],
        },
      },
    })
    expect(() => parseOf3Input(text)).toThrow(/"cyclic" must be a boolean/)
  })

  it('accepts a well-formed query-level covalent_bonds entry', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [{ molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG' }],
          covalent_bonds: [
            [
              ['A', 5, 1],
              ['A', 10, 3],
            ],
          ],
        },
      },
    })
    expect(() => parseOf3Input(text)).not.toThrow()
  })

  it('throws when a covalent_bonds entry is malformed', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [{ molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG' }],
          covalent_bonds: [[['A', 5, 1]]],
        },
      },
    })
    expect(() => parseOf3Input(text)).toThrow(/pair of \[chain_id, residue_id, atom_id\] atoms/)
  })

  it('throws on an unrecognized pocket_constraint field', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [
            { molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG' },
            { molecule_type: 'ligand', chain_ids: 'L', smiles: 'CCO' },
          ],
          pocket_constraint: {
            ligand_chain_id: 'L',
            pocket_residues: [['A', 1]],
            extra_threshold: 9,
          },
        },
      },
    })
    expect(() => parseOf3Input(text)).toThrow(/unrecognized field "extra_threshold"/)
  })

  it('does not block on an empty pocket_constraint.ligand_chain_id — validateInput flags it as content', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [{ molecule_type: 'ligand', chain_ids: 'L', smiles: 'CCO' }],
          pocket_constraint: { ligand_chain_id: '', pocket_residues: [['A', 1]] },
        },
      },
    })
    expect(() => parseOf3Input(text)).not.toThrow()
    const issues = importAndValidate(text)
    expect(issues.map((i) => i.code)).toContain('pocket-ligand-id-empty')
  })

  it('does not block on an empty pocket_constraint.pocket_residues — validateInput flags it as content', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [{ molecule_type: 'ligand', chain_ids: 'L', smiles: 'CCO' }],
          pocket_constraint: { ligand_chain_id: 'L', pocket_residues: [] },
        },
      },
    })
    expect(() => parseOf3Input(text)).not.toThrow()
    const issues = importAndValidate(text)
    expect(issues.map((i) => i.code)).toContain('pocket-residues-empty')
  })

  it('does not block on a malformed pocket_residues entry — it degrades to an effectively-blank residue, which validateInput flags as content', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [{ molecule_type: 'ligand', chain_ids: 'L', smiles: 'CCO' }],
          // Missing residue_id entirely (not just a bad type) — a genuinely incomplete pair.
          pocket_constraint: { ligand_chain_id: 'L', pocket_residues: [['A']] },
        },
      },
    })
    expect(() => parseOf3Input(text)).not.toThrow()
    const issues = importAndValidate(text)
    expect(issues.map((i) => i.code)).toContain('pocket-residues-empty')
  })

  it('does not block on a non-positive pocket_constraint.max_distance — validateInput flags it as content', () => {
    const text = JSON.stringify({
      queries: {
        query_1: {
          chains: [{ molecule_type: 'ligand', chain_ids: 'L', smiles: 'CCO' }],
          pocket_constraint: { ligand_chain_id: 'L', pocket_residues: [['A', 1]], max_distance: 0 },
        },
      },
    })
    expect(() => parseOf3Input(text)).not.toThrow()
    const issues = importAndValidate(text)
    expect(issues.map((i) => i.code)).toContain('pocket-max-distance-invalid')
  })
})
