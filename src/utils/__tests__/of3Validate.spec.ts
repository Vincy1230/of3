// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { describe, expect, it } from 'vitest'
import { createEmptyChain, createEmptyQuery, emptyRaw } from '@/utils/of3Draft'
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
      raw: emptyRaw(),
    }
    expect(codesOf(validateInput({ queries: [query] }))).toContain('pocket-ligand-not-found')
  })

  it('flags a pocket constraint with no residues', () => {
    const query = validProteinLigandQuery()
    query.pocketConstraintEnabled = true
    query.pocketConstraint = { ligandChainId: 'L', residues: [], maxDistance: '', raw: emptyRaw() }
    expect(codesOf(validateInput({ queries: [query] }))).toContain('pocket-residues-empty')
  })

  it('flags a pocket constraint with no ligand chain selected', () => {
    const query = validProteinLigandQuery()
    query.pocketConstraintEnabled = true
    query.pocketConstraint = {
      ligandChainId: '',
      residues: [{ chainId: 'A', residueId: '1' }],
      maxDistance: '',
      raw: emptyRaw(),
    }
    expect(codesOf(validateInput({ queries: [query] }))).toContain('pocket-ligand-id-empty')
  })

  it('flags a non-positive pocket constraint max distance', () => {
    const query = validProteinLigandQuery()
    query.pocketConstraintEnabled = true
    query.pocketConstraint = {
      ligandChainId: 'L',
      residues: [{ chainId: 'A', residueId: '1' }],
      maxDistance: '-1',
      raw: emptyRaw(),
    }
    expect(codesOf(validateInput({ queries: [query] }))).toContain('pocket-max-distance-invalid')
  })

  it('flags a protein chain with both a template alignment file and template CIF files', () => {
    const query = validProteinLigandQuery()
    query.chains[0]!.templateAlignmentFilePath = '/path/to/alignment'
    query.chains[0]!.templateCifRows = [{ path: '/path/to/template.cif', chainId: '' }]
    expect(codesOf(validateInput({ queries: [query] }))).toContain('chain-template-conflict')
  })

  it('accepts a well-formed pocket constraint', () => {
    const query = validProteinLigandQuery()
    query.pocketConstraintEnabled = true
    query.pocketConstraint = {
      ligandChainId: 'L',
      residues: [{ chainId: 'A', residueId: '1' }],
      maxDistance: '4.0',
      raw: emptyRaw(),
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

  it('flags an SDF ligand as an error — OpenFold3 raises NotImplementedError for this', () => {
    const query = validProteinLigandQuery()
    query.chains[1]!.ligandMode = 'sdf'
    query.chains[1]!.smiles = ''
    query.chains[1]!.sdfFilePath = '/path/to/ligand.sdf'
    const issues = validateInput({ queries: [query] })
    const issue = issues.find((i) => i.code === 'ligand-sdf-not-implemented')
    expect(issue?.level).toBe('error')
  })

  it('flags multiple CCD codes on one chain as an error — OpenFold3 raises NotImplementedError for this', () => {
    const query = validProteinLigandQuery()
    query.chains[1]!.ligandMode = 'ccd'
    query.chains[1]!.smiles = ''
    query.chains[1]!.ccdCodes = 'NAG, BMA'
    const issues = validateInput({ queries: [query] })
    const issue = issues.find((i) => i.code === 'ligand-multiple-ccd-not-implemented')
    expect(issue?.level).toBe('error')
  })

  it('accepts a single CCD code on one chain', () => {
    const query = validProteinLigandQuery()
    query.chains[1]!.ligandMode = 'ccd'
    query.chains[1]!.smiles = ''
    query.chains[1]!.ccdCodes = 'NAG'
    expect(codesOf(validateInput({ queries: [query] }))).not.toContain('ligand-multiple-ccd-not-implemented')
  })

  it('warns that covalent_bonds has no downstream effect in the current OpenFold3 release', () => {
    const query = validProteinLigandQuery()
    query.covalentBonds = [{ chain1: 'A', residue1: '1', atom1: '1', chain2: 'L', residue2: '1', atom2: '1' }]
    const issues = validateInput({ queries: [query] })
    const issue = issues.find((i) => i.code === 'covalent-bonds-no-effect')
    expect(issue?.level).toBe('warning')
  })
})
