// Author: Vincy SHI
// Email: vincy@vincy1230.net

import type { MoleculeType } from './of3'

export interface NonCanonicalResidueRow {
  /** 1-based residue index, raw string, converted to a numeric key on serialize */
  index: string
  /** Three-letter non-canonical residue code, e.g. MHO / SEP */
  code: string
}

export interface TemplateCifRow {
  path: string
  /** Empty means null, letting the parser auto-match the best chain */
  chainId: string
}

export interface ChainDraft {
  uiId: string
  moleculeType: MoleculeType
  /** Comma-separated, e.g. "A, B" */
  chainIds: string
  description: string
  sequence: string
  /** Ligand only: which representation this draft currently uses */
  ligandMode: 'smiles' | 'ccd'
  smiles: string
  /** Comma-separated CCD component codes */
  ccdCodes: string
  /** Shared by protein/rna, defaults to true; unchecking is what gets written to JSON */
  useMsas: boolean
  useMainMsas: boolean
  usePairedMsas: boolean
  mainMsaFilePaths: string
  pairedMsaFilePaths: string
  templateAlignmentFilePath: string
  templateCifRows: TemplateCifRow[]
  nonCanonicalResidues: NonCanonicalResidueRow[]
}

export interface PocketResidueRow {
  chainId: string
  /** 1-based residue index, raw string */
  residueId: string
}

export interface PocketConstraintDraft {
  ligandChainId: string
  residues: PocketResidueRow[]
  /** Raw string; empty or equal to the 4.0 default is omitted from the JSON */
  maxDistance: string
}

export interface QueryDraft {
  uiId: string
  /** Key in the queries dict, e.g. "query_1" */
  key: string
  chains: ChainDraft[]
  pocketConstraintEnabled: boolean
  pocketConstraint: PocketConstraintDraft
}

export interface BuilderState {
  queries: QueryDraft[]
  activeQueryUiId: string | null
  ccdFilePath: string
}
