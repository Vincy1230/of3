// Author: Vincy SHI
// Email: vincy@vincy1230.net

export type MoleculeType = 'protein' | 'rna' | 'dna' | 'ligand'

export interface ProteinChain {
  molecule_type: 'protein'
  chain_ids: string | string[]
  sequence: string
  description?: string
  /** 1-based residue index -> three-letter non-canonical residue code, e.g. { "1": "MHO", "5": "SEP" } */
  non_canonical_residues?: Record<string, string>
  use_msas?: boolean
  use_main_msas?: boolean
  use_paired_msas?: boolean
  main_msa_file_paths?: string | string[]
  paired_msa_file_paths?: string | string[]
  template_alignment_file_path?: string
  template_entry_chain_ids?: string[]
  template_cif_paths?: string[]
  template_cif_chain_ids?: (string | null)[]
}

export interface RnaChain {
  molecule_type: 'rna'
  chain_ids: string | string[]
  sequence: string
  use_msas?: boolean
  use_main_msas?: boolean
  main_msa_file_paths?: string | string[]
}

export interface DnaChain {
  molecule_type: 'dna'
  chain_ids: string | string[]
  sequence: string
}

export interface LigandChain {
  molecule_type: 'ligand'
  chain_ids: string | string[]
  /** Mutually exclusive with ccd_codes */
  smiles?: string
  /** Mutually exclusive with smiles */
  ccd_codes?: string | string[]
}

export type Chain = ProteinChain | RnaChain | DnaChain | LigandChain

export interface PocketConstraint {
  ligand_chain_id: string
  /** [chain_id, residue_id], at least one entry; residue_id is a 1-based sequence position */
  pocket_residues: [string, number][]
  max_distance?: number
}

export interface Of3Query {
  chains: Chain[]
  pocket_constraint?: PocketConstraint
}

export interface Of3Input {
  queries: Record<string, Of3Query>
  ccd_file_path?: string
}
