// Author: Vincy SHI
// Email: vincy@vincy1230.net
//
// 纯函数：对表单编辑态做 OpenFold3 schema 层面的校验，返回结构化 Issue
// 列表（不带文案），具体文案由 ValidationSummary.vue 按 code 查 i18n。

import type { BuilderState, ChainDraft, QueryDraft } from '@/types/draft'

export type IssueCode =
  | 'query-key-empty'
  | 'query-key-duplicate'
  | 'query-no-chains'
  | 'chain-ids-empty'
  | 'chain-ids-duplicate'
  | 'sequence-empty'
  | 'sequence-invalid-chars'
  | 'ligand-missing-identifier'
  | 'pocket-ligand-not-found'
  | 'pocket-residues-empty'
  | 'non-canonical-residue-out-of-range'

export interface Issue {
  level: 'error' | 'warning'
  code: IssueCode
  queryUiId: string
  queryKey: string
  chainUiId?: string
  chainLabel?: string
  params?: Record<string, string | number>
}

const PROTEIN_CHARS = /^[ACDEFGHIKLMNPQRSTVWYXU]+$/i
const RNA_CHARS = /^[ACGUN]+$/i
const DNA_CHARS = /^[ACGTN]+$/i

function parseList(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function validateChain(chain: ChainDraft, query: QueryDraft, seenChainIds: Set<string>, issues: Issue[]): string[] {
  const key = query.key.trim()
  const ids = parseList(chain.chainIds)
  const label = ids.join(',') || undefined

  if (ids.length === 0) {
    issues.push({ level: 'error', code: 'chain-ids-empty', queryUiId: query.uiId, queryKey: key, chainUiId: chain.uiId })
  }
  for (const id of ids) {
    if (seenChainIds.has(id)) {
      issues.push({
        level: 'error',
        code: 'chain-ids-duplicate',
        queryUiId: query.uiId,
        queryKey: key,
        chainUiId: chain.uiId,
        chainLabel: label,
        params: { id },
      })
    }
    seenChainIds.add(id)
  }

  if (chain.moleculeType === 'ligand') {
    const hasSmiles = chain.ligandMode === 'smiles' && chain.smiles.trim().length > 0
    const hasCcd = chain.ligandMode === 'ccd' && parseList(chain.ccdCodes).length > 0
    if (!hasSmiles && !hasCcd) {
      issues.push({
        level: 'error',
        code: 'ligand-missing-identifier',
        queryUiId: query.uiId,
        queryKey: key,
        chainUiId: chain.uiId,
        chainLabel: label,
      })
    }
    return ids
  }

  const sequence = chain.sequence.trim()
  if (!sequence) {
    issues.push({
      level: 'error',
      code: 'sequence-empty',
      queryUiId: query.uiId,
      queryKey: key,
      chainUiId: chain.uiId,
      chainLabel: label,
    })
  } else {
    const pattern = chain.moleculeType === 'protein' ? PROTEIN_CHARS : chain.moleculeType === 'rna' ? RNA_CHARS : DNA_CHARS
    if (!pattern.test(sequence)) {
      issues.push({
        level: 'error',
        code: 'sequence-invalid-chars',
        queryUiId: query.uiId,
        queryKey: key,
        chainUiId: chain.uiId,
        chainLabel: label,
      })
    }
  }

  if (chain.moleculeType === 'protein') {
    const seqLen = sequence.length
    for (const row of chain.nonCanonicalResidues) {
      if (!row.index.trim() || !row.code.trim()) continue
      const idx = Number(row.index)
      if (!Number.isInteger(idx) || idx < 1 || idx > seqLen) {
        issues.push({
          level: 'warning',
          code: 'non-canonical-residue-out-of-range',
          queryUiId: query.uiId,
          queryKey: key,
          chainUiId: chain.uiId,
          chainLabel: label,
          params: { index: row.index },
        })
      }
    }
  }

  return ids
}

function validateQuery(query: QueryDraft, issues: Issue[]): void {
  const key = query.key.trim()

  if (query.chains.length === 0) {
    issues.push({ level: 'error', code: 'query-no-chains', queryUiId: query.uiId, queryKey: key })
    return
  }

  const seenChainIds = new Set<string>()
  const ligandChainIdSet = new Set<string>()

  for (const chain of query.chains) {
    const ids = validateChain(chain, query, seenChainIds, issues)
    if (chain.moleculeType === 'ligand') {
      for (const id of ids) ligandChainIdSet.add(id)
    }
  }

  if (query.pocketConstraintEnabled) {
    const ligandId = query.pocketConstraint.ligandChainId.trim()
    if (ligandId && !ligandChainIdSet.has(ligandId)) {
      issues.push({
        level: 'error',
        code: 'pocket-ligand-not-found',
        queryUiId: query.uiId,
        queryKey: key,
        params: { ligandId },
      })
    }
    const residues = query.pocketConstraint.residues.filter((row) => row.chainId.trim() && row.residueId.trim())
    if (residues.length === 0) {
      issues.push({ level: 'error', code: 'pocket-residues-empty', queryUiId: query.uiId, queryKey: key })
    }
  }
}

export function validateInput(state: Pick<BuilderState, 'queries'>): Issue[] {
  const issues: Issue[] = []
  const usedKeys = new Set<string>()

  for (const query of state.queries) {
    const key = query.key.trim()
    if (!key) {
      issues.push({ level: 'error', code: 'query-key-empty', queryUiId: query.uiId, queryKey: query.key })
    } else if (usedKeys.has(key)) {
      issues.push({ level: 'error', code: 'query-key-duplicate', queryUiId: query.uiId, queryKey: key })
    }
    usedKeys.add(key)

    validateQuery(query, issues)
  }

  return issues
}
