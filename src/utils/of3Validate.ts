// Author: Vincy SHI
// Email: vincy@vincy1230.net

import type { ChainDraft, QueryDraft, RawShape } from '@/types/draft'

export type IssueCode =
  // Structural problems found while turning parsed JSON into form state (see of3Draft.ts). These
  // used to be blocking parse-time exceptions; now nothing but literal invalid JSON syntax blocks
  // the JSON panel — everything else, including these, is reported here instead.
  | 'rootNotObject'
  | 'queriesInvalid'
  | 'queriesEmpty'
  | 'queryNotObject'
  | 'queryChainsInvalid'
  | 'chainNotObject'
  | 'chainMoleculeTypeInvalid'
  // Fields OpenFold3's own schema doesn't declare at all (as opposed to ones this app just has no
  // form control for, which stay silent — see RawShape). Root/query mirror OpenFold3's
  // `extra="ignore"`, so these are warnings; chain/pocket_constraint mirror `extra="forbid"`, so
  // OpenFold3 would reject the whole file over these — errors.
  | 'rootUnrecognizedField'
  | 'rootSeedsField'
  | 'queryUnrecognizedField'
  | 'chainUnrecognizedField'
  | 'pocketConstraintUnrecognizedField'
  | 'queryKeyEmpty'
  | 'queryKeyDuplicate'
  | 'queryNoChains'
  | 'chainIdsEmpty'
  | 'chainIdsDuplicate'
  | 'sequenceEmpty'
  | 'sequenceInvalidChars'
  | 'ligandMissingIdentifier'
  | 'ligandSdfNotImplemented'
  | 'ligandMultipleCcdNotImplemented'
  | 'pocketLigandNotFound'
  | 'pocketLigandIdEmpty'
  | 'pocketResiduesEmpty'
  | 'pocketMaxDistanceInvalid'
  | 'chainTemplateConflict'
  | 'chainTemplateCifLengthMismatch'
  | 'ligandIdentifierConflict'
  | 'nonCanonicalResidueOutOfRange'
  | 'covalentBondsNoEffect'

export interface Issue {
  level: 'error' | 'warning'
  code: IssueCode
  /** Absent for root-level issues (e.g. a stray root field, or the JSON root not being an object at all). */
  queryUiId?: string
  queryKey?: string
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

function validateChain(
  chain: ChainDraft,
  query: QueryDraft,
  seenChainIds: Set<string>,
  issues: Issue[],
): string[] {
  const key = query.key.trim()
  const ids = parseList(chain.chainIds)
  const label = ids.join(',') || undefined

  for (const field of chain.raw.unrecognized) {
    issues.push({
      level: 'error',
      code: 'chainUnrecognizedField',
      queryUiId: query.uiId,
      queryKey: key,
      chainUiId: chain.uiId,
      chainLabel: label,
      params: { field },
    })
  }

  if (ids.length === 0) {
    issues.push({
      level: 'error',
      code: 'chainIdsEmpty',
      queryUiId: query.uiId,
      queryKey: key,
      chainUiId: chain.uiId,
    })
  }
  for (const id of ids) {
    if (seenChainIds.has(id)) {
      issues.push({
        level: 'error',
        code: 'chainIdsDuplicate',
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
    if (chain.ligandIdentifierConflict) {
      issues.push({
        level: 'error',
        code: 'ligandIdentifierConflict',
        queryUiId: query.uiId,
        queryKey: key,
        chainUiId: chain.uiId,
        chainLabel: label,
      })
    }

    const hasSmiles = chain.ligandMode === 'smiles' && chain.smiles.trim().length > 0
    const hasCcd = chain.ligandMode === 'ccd' && parseList(chain.ccdCodes).length > 0
    const hasSdf = chain.ligandMode === 'sdf' && chain.sdfFilePath.trim().length > 0
    if (!hasSmiles && !hasCcd && !hasSdf) {
      issues.push({
        level: 'error',
        code: 'ligandMissingIdentifier',
        queryUiId: query.uiId,
        queryKey: key,
        chainUiId: chain.uiId,
        chainLabel: label,
      })
    }
    if (hasSdf) {
      issues.push({
        level: 'error',
        code: 'ligandSdfNotImplemented',
        queryUiId: query.uiId,
        queryKey: key,
        chainUiId: chain.uiId,
        chainLabel: label,
      })
    }
    if (hasCcd && parseList(chain.ccdCodes).length > 1) {
      issues.push({
        level: 'error',
        code: 'ligandMultipleCcdNotImplemented',
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
      code: 'sequenceEmpty',
      queryUiId: query.uiId,
      queryKey: key,
      chainUiId: chain.uiId,
      chainLabel: label,
    })
  } else {
    const pattern =
      chain.moleculeType === 'protein'
        ? PROTEIN_CHARS
        : chain.moleculeType === 'rna'
          ? RNA_CHARS
          : DNA_CHARS
    if (!pattern.test(sequence)) {
      issues.push({
        level: 'error',
        code: 'sequenceInvalidChars',
        queryUiId: query.uiId,
        queryKey: key,
        chainUiId: chain.uiId,
        chainLabel: label,
      })
    }
  }

  if (chain.moleculeType === 'protein') {
    if (
      chain.templateAlignmentFilePath.trim() &&
      chain.templateCifRows.some((row) => row.path.trim())
    ) {
      issues.push({
        level: 'error',
        code: 'chainTemplateConflict',
        queryUiId: query.uiId,
        queryKey: key,
        chainUiId: chain.uiId,
        chainLabel: label,
      })
    }
    if (chain.templateCifLengthMismatch) {
      issues.push({
        level: 'error',
        code: 'chainTemplateCifLengthMismatch',
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
          code: 'nonCanonicalResidueOutOfRange',
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

  for (const field of query.raw.unrecognized) {
    issues.push({
      level: 'warning',
      code: 'queryUnrecognizedField',
      queryUiId: query.uiId,
      queryKey: key,
      params: { field },
    })
  }

  if (query.chains.length === 0) {
    issues.push({ level: 'error', code: 'queryNoChains', queryUiId: query.uiId, queryKey: key })
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
    (row) =>
      row.chain1.trim() &&
      row.residue1.trim() &&
      row.atom1.trim() &&
      row.chain2.trim() &&
      row.residue2.trim() &&
      row.atom2.trim(),
  )
  if (hasCovalentBond) {
    issues.push({
      level: 'warning',
      code: 'covalentBondsNoEffect',
      queryUiId: query.uiId,
      queryKey: key,
    })
  }

  if (query.pocketConstraintEnabled) {
    for (const field of query.pocketConstraint.raw.unrecognized) {
      issues.push({
        level: 'error',
        code: 'pocketConstraintUnrecognizedField',
        queryUiId: query.uiId,
        queryKey: key,
        params: { field },
      })
    }

    const ligandId = query.pocketConstraint.ligandChainId.trim()
    if (!ligandId) {
      issues.push({
        level: 'error',
        code: 'pocketLigandIdEmpty',
        queryUiId: query.uiId,
        queryKey: key,
      })
    } else if (!ligandChainIdSet.has(ligandId)) {
      issues.push({
        level: 'error',
        code: 'pocketLigandNotFound',
        queryUiId: query.uiId,
        queryKey: key,
        params: { ligandId },
      })
    }
    const residues = query.pocketConstraint.residues.filter(
      (row) => row.chainId.trim() && row.residueId.trim(),
    )
    if (residues.length === 0) {
      issues.push({
        level: 'error',
        code: 'pocketResiduesEmpty',
        queryUiId: query.uiId,
        queryKey: key,
      })
    }

    const maxDistanceRaw = query.pocketConstraint.maxDistance.trim()
    if (maxDistanceRaw) {
      const maxDistance = Number(maxDistanceRaw)
      if (Number.isNaN(maxDistance) || maxDistance <= 0) {
        issues.push({
          level: 'error',
          code: 'pocketMaxDistanceInvalid',
          queryUiId: query.uiId,
          queryKey: key,
        })
      }
    }
  }
}

export function validateInput(state: { queries: QueryDraft[]; rootRaw?: RawShape }): Issue[] {
  const issues: Issue[] = []

  for (const field of state.rootRaw?.unrecognized ?? []) {
    if (field === 'seeds') {
      issues.push({ level: 'warning', code: 'rootSeedsField' })
    } else {
      issues.push({ level: 'warning', code: 'rootUnrecognizedField', params: { field } })
    }
  }

  const usedKeys = new Set<string>()

  for (const query of state.queries) {
    const key = query.key.trim()
    if (!key) {
      issues.push({
        level: 'error',
        code: 'queryKeyEmpty',
        queryUiId: query.uiId,
        queryKey: query.key,
      })
    } else if (usedKeys.has(key)) {
      issues.push({
        level: 'error',
        code: 'queryKeyDuplicate',
        queryUiId: query.uiId,
        queryKey: key,
      })
    }
    usedKeys.add(key)

    validateQuery(query, issues)
  }

  return issues
}
