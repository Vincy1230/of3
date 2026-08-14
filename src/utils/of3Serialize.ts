// Author: Vincy SHI
// Email: vincy@vincy1230.net

import type {
  Atom,
  Bond,
  Chain,
  DnaChain,
  LigandChain,
  Of3Input,
  Of3Query,
  PocketConstraint,
  ProteinChain,
  RnaChain,
} from '@/types/of3'
import type { BuilderState, ChainDraft, QueryDraft } from '@/types/draft'

const DEFAULT_MAX_DISTANCE = 4.0

function parseList(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function toStrOrList(items: string[]): string | string[] | undefined {
  if (items.length === 0) return undefined
  return items.length === 1 ? items[0] : items
}

function buildNonCanonicalResidues(rows: ChainDraft['nonCanonicalResidues']): Record<string, string> | undefined {
  const dict: Record<string, string> = {}
  for (const row of rows) {
    const index = row.index.trim()
    const code = row.code.trim()
    if (index && code) dict[index] = code
  }
  return Object.keys(dict).length > 0 ? dict : undefined
}

export function serializeChain(draft: ChainDraft): Chain {
  const chainIds = toStrOrList(parseList(draft.chainIds)) ?? ''

  if (draft.moleculeType === 'protein') {
    const chain: ProteinChain = {
      molecule_type: 'protein',
      chain_ids: chainIds,
      sequence: draft.sequence.trim(),
    }
    if (draft.description.trim()) chain.description = draft.description.trim()

    const nonCanonical = buildNonCanonicalResidues(draft.nonCanonicalResidues)
    if (nonCanonical) chain.non_canonical_residues = nonCanonical

    const mainMsa = toStrOrList(parseList(draft.mainMsaFilePaths))
    if (mainMsa) chain.main_msa_file_paths = mainMsa
    const pairedMsa = toStrOrList(parseList(draft.pairedMsaFilePaths))
    if (pairedMsa) chain.paired_msa_file_paths = pairedMsa
    if (draft.templateAlignmentFilePath.trim()) {
      chain.template_alignment_file_path = draft.templateAlignmentFilePath.trim()
    }

    const cifRows = draft.templateCifRows.filter((row) => row.path.trim())
    if (cifRows.length > 0) {
      chain.template_cif_paths = cifRows.map((row) => row.path.trim())
      chain.template_cif_chain_ids = cifRows.map((row) => (row.chainId.trim() ? row.chainId.trim() : null))
    }

    if (draft.cyclic) chain.cyclic = true

    return chain
  }

  if (draft.moleculeType === 'rna') {
    const chain: RnaChain = { molecule_type: 'rna', chain_ids: chainIds, sequence: draft.sequence.trim() }
    const mainMsa = toStrOrList(parseList(draft.mainMsaFilePaths))
    if (mainMsa) chain.main_msa_file_paths = mainMsa
    if (draft.cyclic) chain.cyclic = true
    return chain
  }

  if (draft.moleculeType === 'dna') {
    const chain: DnaChain = { molecule_type: 'dna', chain_ids: chainIds, sequence: draft.sequence.trim() }
    if (draft.cyclic) chain.cyclic = true
    return chain
  }

  const chain: LigandChain = { molecule_type: 'ligand', chain_ids: chainIds }
  if (draft.ligandMode === 'smiles') {
    chain.smiles = draft.smiles.trim()
  } else if (draft.ligandMode === 'ccd') {
    const codes = toStrOrList(parseList(draft.ccdCodes))
    if (codes) chain.ccd_codes = codes
  } else {
    if (draft.sdfFilePath.trim()) chain.sdf_file_path = draft.sdfFilePath.trim()
  }
  return chain
}

export function serializeQuery(draft: QueryDraft): Of3Query {
  const query: Of3Query = { chains: draft.chains.map(serializeChain) }

  if (!draft.useMsas) query.use_msas = false
  if (!draft.useMainMsas) query.use_main_msas = false
  if (!draft.usePairedMsas) query.use_paired_msas = false

  const bonds: Bond[] = draft.covalentBonds
    .filter(
      (row) =>
        row.chain1.trim() && row.residue1.trim() && row.atom1.trim() && row.chain2.trim() && row.residue2.trim() && row.atom2.trim(),
    )
    .map((row): Bond => [
      [row.chain1.trim(), Number(row.residue1), Number(row.atom1)] satisfies Atom,
      [row.chain2.trim(), Number(row.residue2), Number(row.atom2)] satisfies Atom,
    ])
  if (bonds.length > 0) query.covalent_bonds = bonds

  if (draft.pocketConstraintEnabled) {
    const residues: [string, number][] = draft.pocketConstraint.residues
      .filter((row) => row.chainId.trim() && row.residueId.trim())
      .map((row) => [row.chainId.trim(), Number(row.residueId)])

    if (draft.pocketConstraint.ligandChainId.trim() && residues.length > 0) {
      const pocketConstraint: PocketConstraint = {
        ligand_chain_id: draft.pocketConstraint.ligandChainId.trim(),
        pocket_residues: residues,
      }
      const maxDistance = Number(draft.pocketConstraint.maxDistance)
      if (
        draft.pocketConstraint.maxDistance.trim() &&
        !Number.isNaN(maxDistance) &&
        maxDistance !== DEFAULT_MAX_DISTANCE
      ) {
        pocketConstraint.max_distance = maxDistance
      }
      query.pocket_constraint = pocketConstraint
    }
  }

  return query
}

export function serializeInput(state: Pick<BuilderState, 'queries'>): Of3Input {
  const queries: Record<string, Of3Query> = {}
  for (const query of state.queries) {
    const key = query.key.trim() || query.uiId
    queries[key] = serializeQuery(query)
  }

  return { queries }
}
