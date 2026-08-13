// Author: Vincy SHI
// Email: vincy@vincy1230.net
//
// 表单编辑态类型：与 of3.ts 里的“严格 schema 类型”分开维护。
// 表单里所有列表型字段（chain_ids / main_msa_file_paths / ccd_codes 等）
// 统一用逗号或换行分隔的原始字符串承载，方便 <input>/<textarea> 双向绑定；
// 真正转换成符合 OpenFold3 schema 的数组/字符串在 utils/of3Serialize.ts
// 里统一处理，表单组件不需要关心 str|list[str] 的取舍规则。
import type { MoleculeType } from './of3'

export interface NonCanonicalResidueRow {
  /** 1-based 残基序号，原始字符串，序列化时转 number key */
  index: string
  /** 三字母非标准残基代码，例如 MHO / SEP */
  code: string
}

export interface TemplateCifRow {
  path: string
  /** 留空表示使用 null，交给解析器自动匹配最佳链 */
  chainId: string
}

export interface ChainDraft {
  uiId: string
  moleculeType: MoleculeType
  /** 逗号分隔，例如 "A, B" */
  chainIds: string
  description: string
  /** protein / rna / dna 共用 */
  sequence: string
  /** ligand 专用：本次以哪种方式提供化学结构 */
  ligandMode: 'smiles' | 'ccd'
  smiles: string
  /** 逗号分隔的 CCD 组分代码 */
  ccdCodes: string
  /** protein / rna 共用，默认 true，取消勾选才会写入 JSON */
  useMsas: boolean
  useMainMsas: boolean
  /** 仅 protein 使用 */
  usePairedMsas: boolean
  mainMsaFilePaths: string
  pairedMsaFilePaths: string
  /** 仅 protein 使用（高级/模板选项） */
  templateAlignmentFilePath: string
  templateCifRows: TemplateCifRow[]
  nonCanonicalResidues: NonCanonicalResidueRow[]
}

export interface PocketResidueRow {
  chainId: string
  /** 1-based 残基序号，原始字符串 */
  residueId: string
}

export interface PocketConstraintDraft {
  ligandChainId: string
  residues: PocketResidueRow[]
  /** 原始字符串，留空或等于默认值 4.0 时不写入 JSON */
  maxDistance: string
}

export interface QueryDraft {
  uiId: string
  /** queries 字典里的 key，例如 "query_1" */
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
