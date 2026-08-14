// Author: Vincy SHI
// Email: vincy@vincy1230.net

import type { Atom, Bond, Chain, MoleculeType, Of3Input, Of3Query } from '@/types/of3'
import type { BuilderState, ChainDraft, QueryDraft, RawShape } from '@/types/draft'
import { markOrdered } from './orderedJson'

const DEFAULT_MAX_DISTANCE = 4.0

// Fallback field order used only for objects with no RawShape.order to anchor to — i.e. ones
// built from scratch in the UI ("Add chain" / "Add query"), never imported from JSON. Anything
// imported keeps its original key order instead; see reconstructOrdered.
const CHAIN_CANONICAL_ORDER: Record<MoleculeType, string[]> = {
  protein: [
    'molecule_type',
    'chain_ids',
    'sequence',
    'description',
    'non_canonical_residues',
    'main_msa_file_paths',
    'paired_msa_file_paths',
    'template_alignment_file_path',
    'template_cif_paths',
    'template_cif_chain_ids',
    'cyclic',
  ],
  rna: ['molecule_type', 'chain_ids', 'sequence', 'main_msa_file_paths', 'cyclic'],
  dna: ['molecule_type', 'chain_ids', 'sequence', 'cyclic'],
  ligand: ['molecule_type', 'chain_ids', 'smiles', 'ccd_codes', 'sdf_file_path'],
}
const QUERY_CANONICAL_ORDER = ['chains', 'use_msas', 'use_main_msas', 'use_paired_msas', 'covalent_bonds', 'pocket_constraint']
const POCKET_CONSTRAINT_CANONICAL_ORDER = ['ligand_chain_id', 'pocket_residues', 'max_distance']
const ROOT_CANONICAL_ORDER = ['queries']

// OpenFold3's own defaults for fields that are genuinely optional-with-a-meaningful-default (as
// opposed to optional-and-empty-means-absent, like a file path). Only used by reconstructOrdered
// to skip boilerplate on a field this app is introducing fresh (not present in raw.order) — a
// field the source JSON already had gets kept at its explicit value regardless of what that value
// is, default or not; see reconstructOrdered.
const CHAIN_DEFAULTS = { cyclic: false }
const QUERY_DEFAULTS = { use_msas: true, use_main_msas: true, use_paired_msas: true }
const POCKET_CONSTRAINT_DEFAULTS = { max_distance: DEFAULT_MAX_DISTANCE }

function parseList(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function toStrOrList(items: string[]): string | string[] | undefined {
  if (items.length === 0) return undefined
  return items.length === 1 ? items[0] : items
}

function buildNonCanonicalResidues(rows: ChainDraft['nonCanonicalResidues']): Record<string, string> | undefined {
  const dict: Record<string, string> = {}
  const order: string[] = []
  for (const row of rows) {
    const index = row.index.trim()
    const code = row.code.trim()
    if (!index || !code) continue
    if (!(index in dict)) order.push(index)
    dict[index] = code
  }
  // Residue indices are always integer-looking, and plain objects (JSON.stringify included)
  // always enumerate those in ascending numeric order regardless of insertion order — mark the
  // real order explicitly so the JSON panel's display text doesn't silently resort these.
  return order.length > 0 ? markOrdered(dict, order) : undefined
}

/**
 * Reconstructs a JSON object from a RawShape (its original key order + any keys this app doesn't
 * model) and the current values for the fields this app does manage. Editing one field only ever
 * changes that field's value: every other key keeps its original position, and untouched/unknown
 * keys are re-emitted from `raw.extras` verbatim. `canonicalOrder` only matters for objects with
 * no prior shape (raw.order === []) — i.e. built from scratch in the UI — and for managed fields
 * that are newly introduced into an otherwise-imported object (appended at the end, never
 * inserted into the middle of the original order).
 *
 * `defaults` is ONLY consulted for fields being introduced fresh (not in raw.order) — it's what
 * keeps hand-built-through-the-form output from being cluttered with boilerplate like
 * `"cyclic": false`. A field the source JSON already had explicitly is always kept at its current
 * value, even if that value happens to equal the default — the user wrote it on purpose, and
 * "explicitly set to the default" and "never mentioned" are different states that shouldn't
 * collapse into the same output.
 */
function reconstructOrdered(
  raw: RawShape,
  managedValues: Record<string, unknown>,
  canonicalOrder: string[],
  defaults: Record<string, unknown> = {},
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const seen = new Set<string>()

  for (const key of raw.order) {
    if (key in raw.extras) {
      result[key] = raw.extras[key]
      seen.add(key)
    } else if (key in managedValues) {
      const value = managedValues[key]
      if (value !== undefined) result[key] = value
      seen.add(key)
    }
  }

  for (const key of canonicalOrder) {
    if (seen.has(key)) continue
    const value = managedValues[key]
    if (value === undefined) continue
    if (key in defaults && value === defaults[key]) continue
    result[key] = value
  }

  return result
}

function computeChainFields(draft: ChainDraft): Record<string, unknown> {
  const chainIds = toStrOrList(parseList(draft.chainIds)) ?? ''
  const fields: Record<string, unknown> = {
    molecule_type: draft.moleculeType,
    chain_ids: chainIds,
  }

  if (draft.moleculeType === 'protein') {
    fields.sequence = draft.sequence.trim()
    fields.description = draft.description.trim() || undefined
    fields.non_canonical_residues = buildNonCanonicalResidues(draft.nonCanonicalResidues)
    fields.main_msa_file_paths = toStrOrList(parseList(draft.mainMsaFilePaths))
    fields.paired_msa_file_paths = toStrOrList(parseList(draft.pairedMsaFilePaths))
    fields.template_alignment_file_path = draft.templateAlignmentFilePath.trim() || undefined
    const cifRows = draft.templateCifRows.filter((row) => row.path.trim())
    if (cifRows.length > 0) {
      fields.template_cif_paths = cifRows.map((row) => row.path.trim())
      fields.template_cif_chain_ids = cifRows.map((row) => (row.chainId.trim() ? row.chainId.trim() : null))
    }
    fields.cyclic = draft.cyclic
  } else if (draft.moleculeType === 'rna') {
    fields.sequence = draft.sequence.trim()
    fields.main_msa_file_paths = toStrOrList(parseList(draft.mainMsaFilePaths))
    fields.cyclic = draft.cyclic
  } else if (draft.moleculeType === 'dna') {
    fields.sequence = draft.sequence.trim()
    fields.cyclic = draft.cyclic
  } else if (draft.ligandMode === 'smiles') {
    fields.smiles = draft.smiles.trim()
  } else if (draft.ligandMode === 'ccd') {
    fields.ccd_codes = toStrOrList(parseList(draft.ccdCodes))
  } else {
    fields.sdf_file_path = draft.sdfFilePath.trim() || undefined
  }

  return fields
}

export function serializeChain(draft: ChainDraft): Chain {
  const fields = computeChainFields(draft)
  return reconstructOrdered(draft.raw, fields, CHAIN_CANONICAL_ORDER[draft.moleculeType], CHAIN_DEFAULTS) as unknown as Chain
}

function serializePocketConstraint(draft: QueryDraft): Record<string, unknown> | undefined {
  if (!draft.pocketConstraintEnabled) return undefined
  const residues: [string, number][] = draft.pocketConstraint.residues
    .filter((row) => row.chainId.trim() && row.residueId.trim())
    .map((row) => [row.chainId.trim(), Number(row.residueId)])
  if (!draft.pocketConstraint.ligandChainId.trim() || residues.length === 0) return undefined

  const fields: Record<string, unknown> = {
    ligand_chain_id: draft.pocketConstraint.ligandChainId.trim(),
    pocket_residues: residues,
  }
  const maxDistanceRaw = draft.pocketConstraint.maxDistance.trim()
  const maxDistance = Number(maxDistanceRaw)
  fields.max_distance = maxDistanceRaw && !Number.isNaN(maxDistance) ? maxDistance : undefined

  return reconstructOrdered(draft.pocketConstraint.raw, fields, POCKET_CONSTRAINT_CANONICAL_ORDER, POCKET_CONSTRAINT_DEFAULTS)
}

function computeQueryFields(draft: QueryDraft): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    chains: draft.chains.map(serializeChain),
  }
  fields.use_msas = draft.useMsas
  fields.use_main_msas = draft.useMainMsas
  fields.use_paired_msas = draft.usePairedMsas

  const bonds: Bond[] = draft.covalentBonds
    .filter(
      (row) =>
        row.chain1.trim() && row.residue1.trim() && row.atom1.trim() && row.chain2.trim() && row.residue2.trim() && row.atom2.trim(),
    )
    .map(
      (row): Bond => [
        [row.chain1.trim(), Number(row.residue1), Number(row.atom1)] satisfies Atom,
        [row.chain2.trim(), Number(row.residue2), Number(row.atom2)] satisfies Atom,
      ],
    )
  fields.covalent_bonds = bonds.length > 0 ? bonds : undefined

  fields.pocket_constraint = serializePocketConstraint(draft)

  return fields
}

export function serializeQuery(draft: QueryDraft): Of3Query {
  const fields = computeQueryFields(draft)
  return reconstructOrdered(draft.raw, fields, QUERY_CANONICAL_ORDER, QUERY_DEFAULTS) as unknown as Of3Query
}

export function serializeInput(state: Pick<BuilderState, 'queries' | 'rootRaw'>): Of3Input {
  const queries: Record<string, Of3Query> = {}
  const order: string[] = []
  for (const query of state.queries) {
    const key = query.key.trim() || query.uiId
    if (!(key in queries)) order.push(key)
    queries[key] = serializeQuery(query)
  }
  // Query keys can look like plain integers ("1", "2", ...) — mark the real insertion order
  // explicitly, same reasoning as buildNonCanonicalResidues above.
  markOrdered(queries, order)

  const fields: Record<string, unknown> = { queries }
  return reconstructOrdered(state.rootRaw, fields, ROOT_CANONICAL_ORDER) as unknown as Of3Input
}
