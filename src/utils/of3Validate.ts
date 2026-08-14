// Author: Vincy SHI
// Email: vincy@vincy1230.net

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
  | 'ligand-sdf-not-implemented'
  | 'ligand-multiple-ccd-not-implemented'
  | 'pocket-ligand-not-found'
  | 'pocket-ligand-id-empty'
  | 'pocket-residues-empty'
  | 'pocket-max-distance-invalid'
  | 'chain-template-conflict'
  | 'non-canonical-residue-out-of-range'
  | 'covalent-bonds-no-effect'

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
    const hasSdf = chain.ligandMode === 'sdf' && chain.sdfFilePath.trim().length > 0
    if (!hasSmiles && !hasCcd && !hasSdf) {
      issues.push({
        level: 'error',
        code: 'ligand-missing-identifier',
        queryUiId: query.uiId,
        queryKey: key,
        chainUiId: chain.uiId,
        chainLabel: label,
      })
    }
    if (hasSdf) {
      issues.push({
        level: 'error',
        code: 'ligand-sdf-not-implemented',
        queryUiId: query.uiId,
        queryKey: key,
        chainUiId: chain.uiId,
        chainLabel: label,
      })
    }
    if (hasCcd && parseList(chain.ccdCodes).length > 1) {
      issues.push({
        level: 'error',
        code: 'ligand-multiple-ccd-not-implemented',
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
    if (chain.templateAlignmentFilePath.trim() && chain.templateCifRows.some((row) => row.path.trim())) {
      issues.push({
        level: 'error',
        code: 'chain-template-conflict',
        queryUiId: query.uiId,
        queryKey: key,
        chainUiId: chain.uiId,
        chainLabel: label,
      })
    }

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

  const hasCovalentBond = query.covalentBonds.some(
    (row) => row.chain1.trim() && row.residue1.trim() && row.atom1.trim() && row.chain2.trim() && row.residue2.trim() && row.atom2.trim(),
  )
  if (hasCovalentBond) {
    issues.push({ level: 'warning', code: 'covalent-bonds-no-effect', queryUiId: query.uiId, queryKey: key })
  }

  if (query.pocketConstraintEnabled) {
    const ligandId = query.pocketConstraint.ligandChainId.trim()
    if (!ligandId) {
      issues.push({ level: 'error', code: 'pocket-ligand-id-empty', queryUiId: query.uiId, queryKey: key })
    } else if (!ligandChainIdSet.has(ligandId)) {
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

    const maxDistanceRaw = query.pocketConstraint.maxDistance.trim()
    if (maxDistanceRaw) {
      const maxDistance = Number(maxDistanceRaw)
      if (Number.isNaN(maxDistance) || maxDistance <= 0) {
        issues.push({ level: 'error', code: 'pocket-max-distance-invalid', queryUiId: query.uiId, queryKey: key })
      }
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
