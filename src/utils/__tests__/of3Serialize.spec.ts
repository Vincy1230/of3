// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { describe, expect, it } from 'vitest'
import { OF3_EXAMPLES } from '@/data/examples'
import { deserializeInput, parseOf3Input } from '@/utils/of3Draft'
import { serializeInput } from '@/utils/of3Serialize'
import type { Of3Input } from '@/types/of3'

function normalizeStrOrList<T>(value: T | T[]): T | T[] {
  return Array.isArray(value) && value.length === 1 ? (value[0] as T) : value
}

function normalizeExpected(input: Of3Input): Of3Input {
  const clone = structuredClone(input)
  for (const query of Object.values(clone.queries)) {
    for (const chain of query.chains) {
      chain.chain_ids = normalizeStrOrList(chain.chain_ids)
      if (chain.molecule_type === 'ligand' && chain.ccd_codes) {
        chain.ccd_codes = normalizeStrOrList(chain.ccd_codes)
      }
      if ((chain.molecule_type === 'protein' || chain.molecule_type === 'rna') && chain.main_msa_file_paths) {
        chain.main_msa_file_paths = normalizeStrOrList(chain.main_msa_file_paths)
      }
      if (chain.molecule_type === 'protein' && chain.paired_msa_file_paths) {
        chain.paired_msa_file_paths = normalizeStrOrList(chain.paired_msa_file_paths)
      }
    }
  }
  return clone
}

describe('serializeInput', () => {
  for (const example of OF3_EXAMPLES) {
    it(`round-trips the official "${example.id}" example`, () => {
      const draftState = deserializeInput(example.input)
      const output = serializeInput(draftState)
      expect(output).toEqual(normalizeExpected(example.input))
    })
  }

  it('omits optional fields left at their defaults', () => {
    const draftState = deserializeInput(OF3_EXAMPLES[0]!.input)
    const output = serializeInput(draftState)
    const chain = output.queries[Object.keys(output.queries)[0]!]!.chains[0]!
    expect(chain).not.toHaveProperty('use_msas')
    expect(chain).not.toHaveProperty('non_canonical_residues')
    expect(chain).not.toHaveProperty('description')
  })

  it('serializes a manually built protein + ligand query with pocket constraint', () => {
    const draftState = deserializeInput({
      queries: {
        demo: {
          chains: [
            { molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG' },
            { molecule_type: 'ligand', chain_ids: 'L', smiles: 'CCO' },
          ],
          pocket_constraint: {
            ligand_chain_id: 'L',
            pocket_residues: [
              ['A', 1],
              ['A', 3],
            ],
            max_distance: 5,
          },
        },
      },
    })
    const output = serializeInput(draftState)
    expect(output.queries.demo).toEqual({
      chains: [
        { molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG' },
        { molecule_type: 'ligand', chain_ids: 'L', smiles: 'CCO' },
      ],
      pocket_constraint: {
        ligand_chain_id: 'L',
        pocket_residues: [
          ['A', 1],
          ['A', 3],
        ],
        max_distance: 5,
      },
    })
  })

  it('round-trips cyclic chains, an SDF ligand, and query-level covalent_bonds', () => {
    const draftState = deserializeInput({
      queries: {
        demo: {
          chains: [
            { molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG', cyclic: true },
            { molecule_type: 'ligand', chain_ids: 'L', sdf_file_path: '/path/to/ligand.sdf' },
          ],
          covalent_bonds: [
            [
              ['A', 5, 1],
              ['L', 1, 3],
            ],
          ],
        },
      },
    })
    const output = serializeInput(draftState)
    expect(output.queries.demo).toEqual({
      chains: [
        { molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG', cyclic: true },
        { molecule_type: 'ligand', chain_ids: 'L', sdf_file_path: '/path/to/ligand.sdf' },
      ],
      covalent_bonds: [
        [
          ['A', 5, 1],
          ['L', 1, 3],
        ],
      ],
    })
  })

  it('preserves the original field order after editing an unrelated field', () => {
    const text = JSON.stringify({
      queries: {
        demo: {
          chains: [{ sequence: 'ACDEFG', molecule_type: 'protein', description: 'note', chain_ids: 'A' }],
        },
      },
    })
    const draftState = deserializeInput(parseOf3Input(text))

    // Simulate a UI edit that only touches "sequence" — same as ProteinChainForm's v-model would.
    draftState.queries[0]!.chains[0]!.sequence = 'ACDEFGH'

    const output = serializeInput(draftState)
    expect(Object.keys(output.queries.demo!.chains[0]!)).toEqual(['sequence', 'molecule_type', 'description', 'chain_ids'])
    expect(output.queries.demo!.chains[0]).toMatchObject({
      sequence: 'ACDEFGH',
      molecule_type: 'protein',
      description: 'note',
      chain_ids: 'A',
    })
  })

  it('preserves fields this app does not model (query_name, template_entry_chain_ids, root-level extras) untouched through an edit', () => {
    const text = JSON.stringify({
      ccd_file_path: '/some/ccd.cif',
      queries: {
        demo: {
          query_name: 'ignored-by-openfold3-anyway',
          chains: [
            {
              molecule_type: 'protein',
              chain_ids: 'A',
              sequence: 'ACDEFG',
              template_entry_chain_ids: ['1abc_A'],
            },
          ],
        },
      },
    })
    const draftState = deserializeInput(parseOf3Input(text))
    expect(draftState.rootRaw.unrecognized).toEqual(['ccd_file_path'])

    // Unrelated edit, same as above.
    draftState.queries[0]!.chains[0]!.sequence = 'ACDEFGH'

    const output = serializeInput(draftState)
    expect(output).toMatchObject({ ccd_file_path: '/some/ccd.cif' })
    expect(output.queries.demo).toMatchObject({ query_name: 'ignored-by-openfold3-anyway' })
    expect(output.queries.demo!.chains[0]).toMatchObject({
      sequence: 'ACDEFGH',
      template_entry_chain_ids: ['1abc_A'],
    })
  })
})
