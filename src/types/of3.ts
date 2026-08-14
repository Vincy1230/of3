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
  main_msa_file_paths?: string | string[]
  paired_msa_file_paths?: string | string[]
  template_alignment_file_path?: string
  template_entry_chain_ids?: string[]
  template_cif_paths?: string[]
  template_cif_chain_ids?: (string | null)[]
  /** Marks the chain as a head-to-tail cyclic polymer. Not documented on the reference page, but a real Chain field in source. */
  cyclic?: boolean
}

export interface RnaChain {
  molecule_type: 'rna'
  chain_ids: string | string[]
  sequence: string
  main_msa_file_paths?: string | string[]
  cyclic?: boolean
}

export interface DnaChain {
  molecule_type: 'dna'
  chain_ids: string | string[]
  sequence: string
  cyclic?: boolean
}

export interface LigandChain {
  molecule_type: 'ligand'
  chain_ids: string | string[]
  /** Mutually exclusive with ccd_codes and sdf_file_path */
  smiles?: string
  /** Mutually exclusive with smiles and sdf_file_path */
  ccd_codes?: string | string[]
  /** Mutually exclusive with smiles and ccd_codes */
  sdf_file_path?: string
}

export type Chain = ProteinChain | RnaChain | DnaChain | LigandChain

export interface PocketConstraint {
  ligand_chain_id: string
  /** [chain_id, residue_id], at least one entry; residue_id is a 1-based sequence position */
  pocket_residues: [string, number][]
  max_distance?: number
}

/** [chain_id, residue_id, atom_id] — atom_id indexes into the residue's canonical atom order. */
export type Atom = [string, number, number]

export type Bond = [Atom, Atom]

export interface Of3Query {
  chains: Chain[]
  use_msas?: boolean
  use_main_msas?: boolean
  use_paired_msas?: boolean
  covalent_bonds?: Bond[]
  pocket_constraint?: PocketConstraint
}

export interface Of3Input {
  queries: Record<string, Of3Query>
}
