// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { describe, expect, it } from 'vitest'
import { createEmptyChain, createEmptyQuery } from '@/utils/of3Draft'
import { validateInput } from '@/utils/of3Validate'
import type { QueryDraft } from '@/types/draft'

function codesOf(issues: ReturnType<typeof validateInput>) {
  return issues.map((issue) => issue.code)
}

function validProteinLigandQuery(): QueryDraft {
  const query = createEmptyQuery('query_1')
  const protein = createEmptyChain('protein')
  protein.chainIds = 'A'
  protein.sequence = 'ACDEFGHIK'
  const ligand = createEmptyChain('ligand')
  ligand.chainIds = 'L'
  ligand.ligandMode = 'smiles'
  ligand.smiles = 'CCO'
  query.chains = [protein, ligand]
  return query
}

describe('validateInput', () => {
  it('reports no issues for a well-formed query', () => {
    const issues = validateInput({ queries: [validProteinLigandQuery()] })
    expect(issues).toEqual([])
  })

  it('flags an empty query key', () => {
    const query = validProteinLigandQuery()
    query.key = '  '
    expect(codesOf(validateInput({ queries: [query] }))).toContain('query-key-empty')
  })

  it('flags duplicate query keys', () => {
    const a = validProteinLigandQuery()
    const b = validProteinLigandQuery()
    b.key = a.key
    expect(codesOf(validateInput({ queries: [a, b] }))).toContain('query-key-duplicate')
  })

  it('flags a query with no chains', () => {
    const query = createEmptyQuery('query_1')
    expect(codesOf(validateInput({ queries: [query] }))).toContain('query-no-chains')
  })

  it('flags empty chain_ids', () => {
    const query = validProteinLigandQuery()
    query.chains[0]!.chainIds = ''
    expect(codesOf(validateInput({ queries: [query] }))).toContain('chain-ids-empty')
  })

  it('flags duplicate chain_ids within the same query', () => {
    const query = validProteinLigandQuery()
    query.chains[1]!.chainIds = 'A'
    expect(codesOf(validateInput({ queries: [query] }))).toContain('chain-ids-duplicate')
  })

  it('flags an empty protein sequence', () => {
    const query = validProteinLigandQuery()
    query.chains[0]!.sequence = ''
    expect(codesOf(validateInput({ queries: [query] }))).toContain('sequence-empty')
  })

  it('flags a protein sequence with invalid characters', () => {
    const query = validProteinLigandQuery()
    query.chains[0]!.sequence = 'ACDEFG123'
    expect(codesOf(validateInput({ queries: [query] }))).toContain('sequence-invalid-chars')
  })

  it('accepts valid RNA and DNA alphabets', () => {
    const query = createEmptyQuery('query_1')
    const rna = createEmptyChain('rna')
    rna.chainIds = 'E'
    rna.sequence = 'AGCU'
    const dna = createEmptyChain('dna')
    dna.chainIds = 'C'
    dna.sequence = 'GACCTCT'
    query.chains = [rna, dna]
    expect(validateInput({ queries: [query] })).toEqual([])
  })

  it('flags a ligand with neither smiles nor ccd_codes', () => {
    const query = validProteinLigandQuery()
    query.chains[1]!.smiles = ''
    expect(codesOf(validateInput({ queries: [query] }))).toContain('ligand-missing-identifier')
  })

  it('flags a pocket constraint whose ligand_chain_id does not match any ligand chain', () => {
    const query = validProteinLigandQuery()
    query.pocketConstraintEnabled = true
    query.pocketConstraint = {
      ligandChainId: 'Z',
      residues: [{ chainId: 'A', residueId: '1' }],
      maxDistance: '',
    }
    expect(codesOf(validateInput({ queries: [query] }))).toContain('pocket-ligand-not-found')
  })

  it('flags a pocket constraint with no residues', () => {
    const query = validProteinLigandQuery()
    query.pocketConstraintEnabled = true
    query.pocketConstraint = { ligandChainId: 'L', residues: [], maxDistance: '' }
    expect(codesOf(validateInput({ queries: [query] }))).toContain('pocket-residues-empty')
  })

  it('accepts a well-formed pocket constraint', () => {
    const query = validProteinLigandQuery()
    query.pocketConstraintEnabled = true
    query.pocketConstraint = {
      ligandChainId: 'L',
      residues: [{ chainId: 'A', residueId: '1' }],
      maxDistance: '4.0',
    }
    expect(validateInput({ queries: [query] })).toEqual([])
  })

  it('warns about a non-canonical residue index outside the sequence length', () => {
    const query = validProteinLigandQuery()
    query.chains[0]!.nonCanonicalResidues = [{ index: '999', code: 'SEP' }]
    const issues = validateInput({ queries: [query] })
    const issue = issues.find((i) => i.code === 'non-canonical-residue-out-of-range')
    expect(issue?.level).toBe('warning')
  })
})
