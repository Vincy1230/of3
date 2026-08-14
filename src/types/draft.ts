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
  ligandMode: 'smiles' | 'ccd' | 'sdf'
  smiles: string
  /** Comma-separated CCD component codes */
  ccdCodes: string
  sdfFilePath: string
  mainMsaFilePaths: string
  pairedMsaFilePaths: string
  templateAlignmentFilePath: string
  templateCifRows: TemplateCifRow[]
  nonCanonicalResidues: NonCanonicalResidueRow[]
  /** Protein/RNA/DNA only: marks the chain as a head-to-tail cyclic polymer. */
  cyclic: boolean
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

export interface CovalentBondRow {
  chain1: string
  /** 1-based residue index, raw string */
  residue1: string
  /** 1-based atom index within the residue's canonical atom order, raw string */
  atom1: string
  chain2: string
  residue2: string
  atom2: string
}

export interface QueryDraft {
  uiId: string
  /** Key in the queries dict, e.g. "query_1" */
  key: string
  chains: ChainDraft[]
  /** Query-wide, defaults to true; unchecking is what gets written to JSON */
  useMsas: boolean
  useMainMsas: boolean
  usePairedMsas: boolean
  covalentBonds: CovalentBondRow[]
  pocketConstraintEnabled: boolean
  pocketConstraint: PocketConstraintDraft
}

export interface BuilderState {
  queries: QueryDraft[]
  activeQueryUiId: string | null
}
