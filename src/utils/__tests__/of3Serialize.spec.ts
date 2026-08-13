// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { describe, expect, it } from 'vitest'
import { OF3_EXAMPLES } from '@/data/examples'
import { deserializeInput } from '@/utils/of3Draft'
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
})
