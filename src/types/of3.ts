// Author: Vincy SHI
// Email: vincy@vincy1230.net
//
// TypeScript 类型 1:1 对应 OpenFold3 官方输入格式文档：
// https://openfold-3.readthedocs.io/en/latest/input_format_reference.html
// 字段名、必填/可选、默认值均以该文档 2026-08 版本为准。

export type MoleculeType = 'protein' | 'rna' | 'dna' | 'ligand'

export interface ProteinChain {
  molecule_type: 'protein'
  chain_ids: string | string[]
  sequence: string
  description?: string
  /** 1-based 残基序号 -> 三字母非标准残基代码，例如 { "1": "MHO", "5": "SEP" } */
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
  /** 与 ccd_codes 互斥 */
  smiles?: string
  /** 与 smiles 互斥 */
  ccd_codes?: string | string[]
}

export type Chain = ProteinChain | RnaChain | DnaChain | LigandChain

export interface PocketConstraint {
  ligand_chain_id: string
  /** [chain_id, residue_id] 至少一项，residue_id 为 1-based 序列位置 */
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
