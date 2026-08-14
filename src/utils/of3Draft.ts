// Author: Vincy SHI
// Email: vincy@vincy1230.net

import type { MoleculeType } from '@/types/of3'
import type { ChainDraft, CovalentBondRow, QueryDraft, RawShape } from '@/types/draft'
import type { Issue } from './of3Validate'

const MOLECULE_TYPES: MoleculeType[] = ['protein', 'rna', 'dna', 'ligand']

// Field whitelists mirror the upstream pydantic models in aqlaboratory/openfold-3
// (openfold3/projects/of3_all_atom/config/inference_query_format.py), not the docs, since the
// two disagree in places (e.g. the docs list a root-level "ccd_file_path" that InferenceQuerySet
// doesn't actually declare — real ccd_file_path lives in a separate runner config).
// Severity follows each model's `extra` setting: the root (InferenceQuerySet) and per-query
// (Query) objects default to `extra="ignore"`, so unknown fields there are only worth a warning;
// Chain and PocketConstraint set `extra="forbid"`, so unknown fields there make OpenFold3 reject
// the input outright. Both severities are reported as ordinary validateInput issues now, not
// parse-time exceptions — see captureRaw/RawShape.unrecognized and of3Validate.ts.
// "seeds" is deliberately NOT whitelisted even though InferenceQuerySet declares it: the docs
// explicitly say it shouldn't be hand-authored in the input JSON (use --num-model-seeds or
// runner.yml instead), so it's flagged too — with its own message ('root-seeds-field')
// rather than the generic "unrecognized field" one, since it's not that OpenFold3 doesn't
// recognize it, but that setting it here has no effect.
const ROOT_KEYS = new Set(['queries'])
const QUERY_KEYS = new Set([
  'chains',
  'pocket_constraint',
  'query_name',
  'use_msas',
  'use_main_msas',
  'use_paired_msas',
  'covalent_bonds',
])
const POCKET_CONSTRAINT_KEYS = new Set(['ligand_chain_id', 'pocket_residues', 'max_distance'])
// Chain is a single shared pydantic model — every molecule_type accepts the same field set,
// it's just semantically unused outside its intended type. Not partitioned per molecule_type.
const CHAIN_KEYS = new Set([
  'molecule_type',
  'chain_ids',
  'description',
  'sequence',
  'non_canonical_residues',
  'smiles',
  'ccd_codes',
  'paired_msa_file_paths',
  'main_msa_file_paths',
  'template_alignment_file_path',
  'template_entry_chain_ids',
  'template_cif_paths',
  'template_cif_chain_ids',
  'sdf_file_path',
  'cyclic',
])

// Subset of the whitelists above that this app actually reads/writes through the form (vs. just
// recognizing as schema-valid). Anything schema-valid but NOT in these sets — e.g. query_name
// (always overwritten by OpenFold3 from the dict key anyway), template_entry_chain_ids ("only
// populated automatically" per the docs) — is captured as a RawShape "extra" instead: preserved
// verbatim through every edit, never touched by the UI, because there's no form control for it.
const ROOT_MANAGED_FIELDS = new Set(['queries'])
const QUERY_MANAGED_FIELDS = new Set(['chains', 'pocket_constraint', 'use_msas', 'use_main_msas', 'use_paired_msas', 'covalent_bonds'])
const POCKET_CONSTRAINT_MANAGED_FIELDS = new Set(['ligand_chain_id', 'pocket_residues', 'max_distance'])
// Chain fields ARE partitioned per molecule_type here (unlike CHAIN_KEYS above), so e.g. a stray
// "smiles" that somehow ended up on an imported protein chain is preserved as an extra rather
// than silently adopted as if the form had a control for it.
const CHAIN_MANAGED_FIELDS: Record<MoleculeType, Set<string>> = {
  protein: new Set([
    'molecule_type',
    'chain_ids',
    'description',
    'sequence',
    'non_canonical_residues',
    'main_msa_file_paths',
    'paired_msa_file_paths',
    'template_alignment_file_path',
    'template_cif_paths',
    'template_cif_chain_ids',
    'cyclic',
  ]),
  rna: new Set(['molecule_type', 'chain_ids', 'sequence', 'main_msa_file_paths', 'cyclic']),
  dna: new Set(['molecule_type', 'chain_ids', 'sequence', 'cyclic']),
  ligand: new Set(['molecule_type', 'chain_ids', 'smiles', 'ccd_codes', 'sdf_file_path']),
}

/** Captures a RawShape from a live (possibly untyped/malformed) source object. */
function captureRaw(obj: unknown, managedFields: Set<string>, schemaFields: Set<string>): RawShape {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return emptyRaw()
  const record = obj as Record<string, unknown>
  const order = Object.keys(record)
  const extras: Record<string, unknown> = {}
  const unrecognized: string[] = []
  for (const key of order) {
    if (!managedFields.has(key)) {
      extras[key] = record[key]
      if (!schemaFields.has(key)) unrecognized.push(key)
    }
  }
  return { order, extras, unrecognized }
}

export function emptyRaw(): RawShape {
  return { order: [], extras: {}, unrecognized: [] }
}

let idCounter = 0

export function createId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyChain(moleculeType: MoleculeType): ChainDraft {
  return {
    uiId: createId('chain'),
    moleculeType,
    chainIds: '',
    description: '',
    sequence: '',
    ligandMode: 'smiles',
    smiles: '',
    ccdCodes: '',
    sdfFilePath: '',
    mainMsaFilePaths: '',
    pairedMsaFilePaths: '',
    templateAlignmentFilePath: '',
    templateCifRows: [],
    nonCanonicalResidues: [],
    cyclic: false,
    ligandIdentifierConflict: false,
    templateCifLengthMismatch: false,
    raw: emptyRaw(),
  }
}

export function createEmptyQuery(key: string): QueryDraft {
  return {
    uiId: createId('query'),
    key,
    chains: [],
    useMsas: true,
    useMainMsas: true,
    usePairedMsas: true,
    covalentBonds: [],
    pocketConstraintEnabled: false,
    pocketConstraint: {
      ligandChainId: '',
      residues: [],
      maxDistance: '',
      raw: emptyRaw(),
    },
    raw: emptyRaw(),
  }
}

// Never assumes its input actually has the declared shape — everything upstream of this file now
// hands it whatever a user typed, unchecked, so every access is a runtime check, not a cast.
function toRawList(value: unknown): string {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string').join(', ')
  return typeof value === 'string' ? value : ''
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

/**
 * Builds a chain draft from an unknown value straight out of parsed JSON. Never throws: a chain
 * that isn't an object, or whose molecule_type isn't recognized, can't be represented at all (this
 * app has no "unknown chain" UI), so it's dropped and reported as a structural Issue instead of
 * blocking the whole import the way it used to.
 */
function chainFromSpec(rawChain: unknown, index: number, queryKey: string, queryUiId: string | undefined, issues: Issue[]): ChainDraft | null {
  const chain = asRecord(rawChain)
  if (!chain) {
    issues.push({ level: 'error', code: 'chain-not-object', queryUiId, queryKey, params: { index: index + 1 } })
    return null
  }
  if (!MOLECULE_TYPES.includes(chain.molecule_type as MoleculeType)) {
    issues.push({ level: 'error', code: 'chain-molecule-type-invalid', queryUiId, queryKey, params: { index: index + 1 } })
    return null
  }
  const moleculeType = chain.molecule_type as MoleculeType

  const draft = createEmptyChain(moleculeType)
  draft.raw = captureRaw(chain, CHAIN_MANAGED_FIELDS[moleculeType], CHAIN_KEYS)
  draft.chainIds = toRawList(chain.chain_ids)

  if (moleculeType === 'protein') {
    draft.sequence = typeof chain.sequence === 'string' ? chain.sequence : ''
    draft.description = typeof chain.description === 'string' ? chain.description : ''
    draft.mainMsaFilePaths = toRawList(chain.main_msa_file_paths)
    draft.pairedMsaFilePaths = toRawList(chain.paired_msa_file_paths)
    draft.templateAlignmentFilePath = typeof chain.template_alignment_file_path === 'string' ? chain.template_alignment_file_path : ''
    if (Array.isArray(chain.template_cif_paths)) {
      const cifChainIdsRaw = chain.template_cif_chain_ids
      const cifChainIds = Array.isArray(cifChainIdsRaw) ? cifChainIdsRaw : []
      if (Array.isArray(cifChainIdsRaw) && cifChainIdsRaw.length !== chain.template_cif_paths.length) {
        draft.templateCifLengthMismatch = true
      }
      draft.templateCifRows = chain.template_cif_paths.map((path, i) => ({
        path: typeof path === 'string' ? path : '',
        chainId: typeof cifChainIds[i] === 'string' ? (cifChainIds[i] as string) : '',
      }))
    }
    const nonCanonical = asRecord(chain.non_canonical_residues)
    if (nonCanonical) {
      draft.nonCanonicalResidues = Object.entries(nonCanonical).map(([index2, code]) => ({
        index: index2,
        code: typeof code === 'string' ? code : '',
      }))
    }
    draft.cyclic = chain.cyclic === true
  } else if (moleculeType === 'rna') {
    draft.sequence = typeof chain.sequence === 'string' ? chain.sequence : ''
    draft.mainMsaFilePaths = toRawList(chain.main_msa_file_paths)
    draft.cyclic = chain.cyclic === true
  } else if (moleculeType === 'dna') {
    draft.sequence = typeof chain.sequence === 'string' ? chain.sequence : ''
    draft.cyclic = chain.cyclic === true
  } else {
    const identifierCount = [chain.smiles, chain.ccd_codes, chain.sdf_file_path].filter((v) => v !== undefined).length
    if (identifierCount > 1) draft.ligandIdentifierConflict = true

    if (typeof chain.smiles === 'string' && chain.smiles) {
      draft.ligandMode = 'smiles'
      draft.smiles = chain.smiles
    } else if (chain.ccd_codes) {
      draft.ligandMode = 'ccd'
      draft.ccdCodes = toRawList(chain.ccd_codes)
    } else if (typeof chain.sdf_file_path === 'string' && chain.sdf_file_path) {
      draft.ligandMode = 'sdf'
      draft.sdfFilePath = chain.sdf_file_path
    }
  }

  return draft
}

/** Keeps `existing`'s object identity (mutating it in place) instead of returning `fresh` as a new
 * object — this is what keeps a JSON-panel edit from silently disconnecting anything holding a
 * direct reference (ChainList.vue's `editingChain` ref, an open ChainEditorModal, ...), and what
 * lets the sidebar's current selection survive typing in the JSON textarea. */
function reconcileInto<T extends { uiId: string }>(existing: T, fresh: T): T {
  const uiId = existing.uiId
  Object.assign(existing, fresh)
  existing.uiId = uiId
  return existing
}

/**
 * Builds a query draft (and its chains) from an unknown value straight out of parsed JSON. Never
 * throws: a query that isn't an object is dropped and reported as a structural Issue, same as a
 * chain. `existingChains` lets a chain at the same index keep its identity across a re-parse — see
 * reconcileInto.
 */
function queryFromSpec(key: string, rawQuery: unknown, existingChains: ChainDraft[], issues: Issue[]): QueryDraft | null {
  const query = asRecord(rawQuery)
  if (!query) {
    issues.push({ level: 'error', code: 'query-not-object', queryKey: key })
    return null
  }

  const draft = createEmptyQuery(key)
  draft.raw = captureRaw(query, QUERY_MANAGED_FIELDS, QUERY_KEYS)

  if (!Array.isArray(query.chains)) {
    issues.push({ level: 'error', code: 'query-chains-invalid', queryUiId: draft.uiId, queryKey: key })
  } else {
    draft.chains = query.chains
      .map((rawChain, i) => {
        const fresh = chainFromSpec(rawChain, i, key, draft.uiId, issues)
        if (!fresh) return null
        const existing = existingChains[i]
        return existing ? reconcileInto(existing, fresh) : fresh
      })
      .filter((c): c is ChainDraft => c !== null)
  }

  draft.useMsas = query.use_msas !== false
  draft.useMainMsas = query.use_main_msas !== false
  draft.usePairedMsas = query.use_paired_msas !== false

  if (Array.isArray(query.covalent_bonds)) {
    const asAtom = (value: unknown): [string, unknown, unknown] | null => {
      if (!Array.isArray(value)) return null
      return [typeof value[0] === 'string' ? value[0] : '', value[1], value[2]]
    }
    draft.covalentBonds = query.covalent_bonds
      .map((bond): CovalentBondRow | null => {
        if (!Array.isArray(bond) || bond.length !== 2) return null
        const atom1 = asAtom(bond[0])
        const atom2 = asAtom(bond[1])
        if (!atom1 || !atom2) return null
        return {
          chain1: atom1[0],
          residue1: atom1[1] !== undefined && atom1[1] !== null ? String(atom1[1]) : '',
          atom1: atom1[2] !== undefined && atom1[2] !== null ? String(atom1[2]) : '',
          chain2: atom2[0],
          residue2: atom2[1] !== undefined && atom2[1] !== null ? String(atom2[1]) : '',
          atom2: atom2[2] !== undefined && atom2[2] !== null ? String(atom2[2]) : '',
        }
      })
      .filter((b): b is CovalentBondRow => b !== null)
  }

  draft.pocketConstraintEnabled = query.pocket_constraint !== undefined
  const pocket = asRecord(query.pocket_constraint)
  if (pocket) {
    // pocket_constraint's content validity (blank ligand_chain_id, empty/malformed
    // pocket_residues) is intentionally NOT checked here — validateInput catches it on the draft
    // instead, the same way it would for a hand-built pocket constraint.
    const rawResidues = Array.isArray(pocket.pocket_residues) ? pocket.pocket_residues : []
    draft.pocketConstraint = {
      raw: captureRaw(pocket, POCKET_CONSTRAINT_MANAGED_FIELDS, POCKET_CONSTRAINT_KEYS),
      ligandChainId: typeof pocket.ligand_chain_id === 'string' ? pocket.ligand_chain_id : '',
      residues: rawResidues.map((entry) => {
        const [chainId, residueId] = Array.isArray(entry) ? entry : []
        return {
          chainId: typeof chainId === 'string' ? chainId : '',
          residueId: residueId !== undefined && residueId !== null ? String(residueId) : '',
        }
      }),
      maxDistance: pocket.max_distance !== undefined ? String(pocket.max_distance) : '',
    }
  } else if (query.pocket_constraint !== undefined) {
    // Present but not an object at all — nothing more specific to say than "empty"; validateInput's
    // pocket-ligand-id-empty / pocket-residues-empty already cover that.
    draft.pocketConstraint = { raw: emptyRaw(), ligandChainId: '', residues: [], maxDistance: '' }
  }

  return draft
}

export interface DeserializeResult {
  queries: QueryDraft[]
  rootRaw: RawShape
  /** Structural problems found while building this result (invalid shapes, dropped chains/queries) — merge into the validation panel alongside validateInput's output. */
  issues: Issue[]
}

/**
 * `previousQueries`, when given, is matched against the new input by query key (then chains by
 * index within each matched query) so re-parsing the same document after a small edit reuses the
 * existing draft objects instead of replacing them wholesale — see reconcileInto.
 * Only loadFromJson uses this; loadExample/reset intentionally start clean.
 *
 * Never throws. Anything short of `parsed` not even being a JSON object, or "queries" not being
 * an object, degrades to an empty result plus a structural Issue rather than blocking the import —
 * see the module doc comment on parseOf3Input for why.
 */
export function deserializeInput(parsed: unknown, previousQueries: QueryDraft[] = []): DeserializeResult {
  const issues: Issue[] = []
  const root = asRecord(parsed)
  if (!root) {
    issues.push({ level: 'error', code: 'root-not-object' })
    return { queries: [], rootRaw: emptyRaw(), issues }
  }
  const rootRaw = captureRaw(root, ROOT_MANAGED_FIELDS, ROOT_KEYS)

  const rawQueries = asRecord(root.queries)
  if (!rawQueries) {
    issues.push({ level: 'error', code: 'queries-invalid' })
    return { queries: [], rootRaw, issues }
  }

  const previousByKey = new Map(previousQueries.map((q) => [q.key, q]))
  const queries: QueryDraft[] = []
  for (const [key, rawQuery] of Object.entries(rawQueries)) {
    const existing = previousByKey.get(key)
    const fresh = queryFromSpec(key, rawQuery, existing?.chains ?? [], issues)
    if (!fresh) continue
    queries.push(existing ? reconcileInto(existing, fresh) : fresh)
  }

  if (queries.length === 0) {
    issues.push({ level: 'error', code: 'queries-empty' })
  }

  return { queries, rootRaw, issues }
}

/**
 * Parses raw JSON text pasted/typed by the user. This is now the ONLY thing that can block the
 * JSON panel: a literal JSON.parse failure. Every other concern — wrong shapes, invalid
 * molecule_type, fields OpenFold3's schema doesn't recognize, incomplete pocket constraints, and
 * so on — is deliberately NOT checked here anymore. deserializeInput builds the best draft it can
 * from whatever this returns and reports the rest as ordinary (non-blocking) issues in the
 * validation panel, exactly the way a hand-built form mistake would be — so the JSON panel and the
 * validation panel each own exactly one thing: is this valid JSON text, and is the resulting input
 * correct.
 */
export function parseOf3Input(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err))
  }
}
