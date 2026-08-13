// Author: Vincy SHI
// Email: vincy@vincy1230.net
//
// 表单编辑态（src/types/draft.ts）的构造与反序列化：
//   - createEmptyChain / createEmptyQuery：给 store 的“新增”操作用的默认值工厂；
//   - deserializeInput：把一份符合 OpenFold3 schema 的 JSON（例如内嵌示例）
//     还原成表单编辑态，是 of3Serialize.ts 的逆操作，供 PresetSelector 使用。

import type { Chain, MoleculeType, Of3Input, Of3Query } from '@/types/of3'
import type { BuilderState, ChainDraft, QueryDraft } from '@/types/draft'

let idCounter = 0

export function createId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyChain(moleculeType: MoleculeType): ChainDraft {
  return {
    uiId: createId('chain'),
    moleculeType,
    chainIds: '',
    description: '',
    sequence: '',
    ligandMode: 'smiles',
    smiles: '',
    ccdCodes: '',
    useMsas: true,
    useMainMsas: true,
    usePairedMsas: true,
    mainMsaFilePaths: '',
    pairedMsaFilePaths: '',
    templateAlignmentFilePath: '',
    templateCifRows: [],
    nonCanonicalResidues: [],
  }
}

export function createEmptyQuery(key: string): QueryDraft {
  return {
    uiId: createId('query'),
    key,
    chains: [],
    pocketConstraintEnabled: false,
    pocketConstraint: {
      ligandChainId: '',
      residues: [],
      maxDistance: '',
    },
  }
}

function toRawList(value: string | string[] | undefined): string {
  if (value === undefined) return ''
  return Array.isArray(value) ? value.join(', ') : value
}

function chainFromSpec(chain: Chain): ChainDraft {
  const draft = createEmptyChain(chain.molecule_type)
  draft.chainIds = toRawList(chain.chain_ids)

  if (chain.molecule_type === 'protein') {
    draft.sequence = chain.sequence
    draft.description = chain.description ?? ''
    draft.useMsas = chain.use_msas ?? true
    draft.useMainMsas = chain.use_main_msas ?? true
    draft.usePairedMsas = chain.use_paired_msas ?? true
    draft.mainMsaFilePaths = toRawList(chain.main_msa_file_paths)
    draft.pairedMsaFilePaths = toRawList(chain.paired_msa_file_paths)
    draft.templateAlignmentFilePath = chain.template_alignment_file_path ?? ''
    if (chain.template_cif_paths) {
      draft.templateCifRows = chain.template_cif_paths.map((path, i) => ({
        path,
        chainId: chain.template_cif_chain_ids?.[i] ?? '',
      }))
    }
    if (chain.non_canonical_residues) {
      draft.nonCanonicalResidues = Object.entries(chain.non_canonical_residues).map(([index, code]) => ({
        index,
        code,
      }))
    }
  } else if (chain.molecule_type === 'rna') {
    draft.sequence = chain.sequence
    draft.useMsas = chain.use_msas ?? true
    draft.useMainMsas = chain.use_main_msas ?? true
    draft.mainMsaFilePaths = toRawList(chain.main_msa_file_paths)
  } else if (chain.molecule_type === 'dna') {
    draft.sequence = chain.sequence
  } else {
    if (chain.smiles) {
      draft.ligandMode = 'smiles'
      draft.smiles = chain.smiles
    } else if (chain.ccd_codes) {
      draft.ligandMode = 'ccd'
      draft.ccdCodes = toRawList(chain.ccd_codes)
    }
  }

  return draft
}

function queryFromSpec(key: string, query: Of3Query): QueryDraft {
  const draft = createEmptyQuery(key)
  draft.chains = query.chains.map(chainFromSpec)
  draft.pocketConstraintEnabled = !!query.pocket_constraint
  if (query.pocket_constraint) {
    draft.pocketConstraint = {
      ligandChainId: query.pocket_constraint.ligand_chain_id,
      residues: query.pocket_constraint.pocket_residues.map(([chainId, residueId]) => ({
        chainId,
        residueId: String(residueId),
      })),
      maxDistance: query.pocket_constraint.max_distance !== undefined ? String(query.pocket_constraint.max_distance) : '',
    }
  }
  return draft
}

export function deserializeInput(input: Of3Input): Pick<BuilderState, 'queries' | 'ccdFilePath'> {
  const queries = Object.entries(input.queries).map(([key, query]) => queryFromSpec(key, query))
  return { queries, ccdFilePath: input.ccd_file_path ?? '' }
}
