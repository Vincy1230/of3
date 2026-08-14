// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { describe, expect, it } from 'vitest'
import { deserializeInput } from '@/utils/of3Draft'
import type { Of3Input } from '@/types/of3'

describe('deserializeInput — reconciliation against previous state', () => {
  it('reuses the same query and chain draft objects (and their uiIds) when only an unrelated field changed', () => {
    const first: Of3Input = {
      queries: {
        query_1: {
          chains: [{ molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG' }],
        },
      },
    }
    const before = deserializeInput(first)
    const queryBefore = before.queries[0]!
    const chainBefore = queryBefore.chains[0]!

    const second: Of3Input = {
      queries: {
        query_1: {
          chains: [{ molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFGH' }],
        },
      },
    }
    const after = deserializeInput(second, before.queries)
    const queryAfter = after.queries[0]!
    const chainAfter = queryAfter.chains[0]!

    expect(queryAfter).toBe(queryBefore)
    expect(queryAfter.uiId).toBe(queryBefore.uiId)
    expect(chainAfter).toBe(chainBefore)
    expect(chainAfter.uiId).toBe(chainBefore.uiId)
    expect(chainAfter.sequence).toBe('ACDEFGH')
  })

  it('mints a fresh identity for a genuinely new query key, and drops a removed one', () => {
    const first: Of3Input = {
      queries: {
        query_1: { chains: [{ molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG' }] },
      },
    }
    const before = deserializeInput(first)

    const second: Of3Input = {
      queries: {
        query_2: { chains: [{ molecule_type: 'protein', chain_ids: 'B', sequence: 'HIKLMN' }] },
      },
    }
    const after = deserializeInput(second, before.queries)

    expect(after.queries).toHaveLength(1)
    expect(after.queries[0]!.key).toBe('query_2')
    expect(after.queries[0]!.uiId).not.toBe(before.queries[0]!.uiId)
  })

  it('mints a fresh identity for a newly added chain within a matched query, without disturbing the existing one', () => {
    const first: Of3Input = {
      queries: {
        query_1: { chains: [{ molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG' }] },
      },
    }
    const before = deserializeInput(first)
    const chainBefore = before.queries[0]!.chains[0]!

    const second: Of3Input = {
      queries: {
        query_1: {
          chains: [
            { molecule_type: 'protein', chain_ids: 'A', sequence: 'ACDEFG' },
            { molecule_type: 'ligand', chain_ids: 'L', smiles: 'CCO' },
          ],
        },
      },
    }
    const after = deserializeInput(second, before.queries)

    expect(after.queries[0]!.chains).toHaveLength(2)
    expect(after.queries[0]!.chains[0]).toBe(chainBefore)
    expect(after.queries[0]!.chains[0]!.uiId).toBe(chainBefore.uiId)
    expect(after.queries[0]!.chains[1]!.uiId).not.toBe(chainBefore.uiId)
  })
})
