// Author: Vincy SHI
// Email: vincy@vincy1230.net
//
// 纯函数：把表单编辑态（src/types/draft.ts）转换成严格符合 OpenFold3
// schema（src/types/of3.ts）的 JSON 对象。所有可选字段只在用户显式提供
// 了偏离默认值的内容时才写入，让生成的 JSON 尽量贴近官方文档示例的风格
// （而不是把每个默认值都罗列出来）。

import type {
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

    if (!draft.useMsas) chain.use_msas = false
    if (!draft.useMainMsas) chain.use_main_msas = false
    if (!draft.usePairedMsas) chain.use_paired_msas = false

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

    return chain
  }

  if (draft.moleculeType === 'rna') {
    const chain: RnaChain = { molecule_type: 'rna', chain_ids: chainIds, sequence: draft.sequence.trim() }
    if (!draft.useMsas) chain.use_msas = false
    if (!draft.useMainMsas) chain.use_main_msas = false
    const mainMsa = toStrOrList(parseList(draft.mainMsaFilePaths))
    if (mainMsa) chain.main_msa_file_paths = mainMsa
    return chain
  }

  if (draft.moleculeType === 'dna') {
    const chain: DnaChain = { molecule_type: 'dna', chain_ids: chainIds, sequence: draft.sequence.trim() }
    return chain
  }

  const chain: LigandChain = { molecule_type: 'ligand', chain_ids: chainIds }
  if (draft.ligandMode === 'smiles') {
    chain.smiles = draft.smiles.trim()
  } else {
    const codes = toStrOrList(parseList(draft.ccdCodes))
    if (codes) chain.ccd_codes = codes
  }
  return chain
}

export function serializeQuery(draft: QueryDraft): Of3Query {
  const query: Of3Query = { chains: draft.chains.map(serializeChain) }

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

export function serializeInput(state: Pick<BuilderState, 'queries' | 'ccdFilePath'>): Of3Input {
  const queries: Record<string, Of3Query> = {}
  for (const query of state.queries) {
    const key = query.key.trim() || query.uiId
    queries[key] = serializeQuery(query)
  }

  const input: Of3Input = { queries }
  if (state.ccdFilePath.trim()) input.ccd_file_path = state.ccdFilePath.trim()
  return input
}
