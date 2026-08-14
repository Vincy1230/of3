// Author: Vincy SHI
// Email: vincy@vincy1230.net

import type { Chain, MoleculeType, Of3Input, Of3Query } from '@/types/of3'
import type { BuilderState, ChainDraft, QueryDraft } from '@/types/draft'

const MOLECULE_TYPES: MoleculeType[] = ['protein', 'rna', 'dna', 'ligand']

// Field whitelists mirror the upstream pydantic models in aqlaboratory/openfold-3
// (openfold3/projects/of3_all_atom/config/inference_query_format.py), not the docs, since the
// two disagree in places (e.g. the docs list a root-level "ccd_file_path" that InferenceQuerySet
// doesn't actually declare — real ccd_file_path lives in a separate runner config).
// Severity follows each model's `extra` setting: the root (InferenceQuerySet) and per-query
// (Query) objects default to `extra="ignore"`, so unknown fields there are only worth a warning;
// Chain and PocketConstraint set `extra="forbid"`, so unknown fields there make OpenFold3 reject
// the input outright.
// "seeds" is deliberately NOT whitelisted even though InferenceQuerySet declares it: the docs
// explicitly say it shouldn't be hand-authored in the input JSON (use --num-model-seeds or
// runner.yml instead), so it's flagged too — with its own message (see UnknownFieldWarning.reason)
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

/** An unrecognized field that real OpenFold3 would silently drop rather than reject. */
export interface UnknownFieldWarning {
  path: string
  key: string
  /** Set for fields that warrant their own explanation instead of the generic "unrecognized field" message. */
  reason?: 'seeds'
}

export interface ParsedOf3Input {
  input: Of3Input
  warnings: UnknownFieldWarning[]
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
    },
  }
}

function toRawList(value: string | string[] | undefined): string {
  if (value === undefined) return ''
  return Array.isArray(value) ? value.join(', ') : value
}

function chainFromSpec(chain: Chain): ChainDraft {
  const draft = createEmptyChain(chain.molecule_type)
  draft.chainIds = toRawList(chain.chain_ids)

  if (chain.molecule_type === 'protein') {
    draft.sequence = chain.sequence
    draft.description = chain.description ?? ''
    draft.mainMsaFilePaths = toRawList(chain.main_msa_file_paths)
    draft.pairedMsaFilePaths = toRawList(chain.paired_msa_file_paths)
    draft.templateAlignmentFilePath = chain.template_alignment_file_path ?? ''
    if (chain.template_cif_paths) {
      draft.templateCifRows = chain.template_cif_paths.map((path, i) => ({
        path,
        chainId: chain.template_cif_chain_ids?.[i] ?? '',
      }))
    }
    if (chain.non_canonical_residues) {
      draft.nonCanonicalResidues = Object.entries(chain.non_canonical_residues).map(([index, code]) => ({
        index,
        code,
      }))
    }
    draft.cyclic = chain.cyclic ?? false
  } else if (chain.molecule_type === 'rna') {
    draft.sequence = chain.sequence
    draft.mainMsaFilePaths = toRawList(chain.main_msa_file_paths)
    draft.cyclic = chain.cyclic ?? false
  } else if (chain.molecule_type === 'dna') {
    draft.sequence = chain.sequence
    draft.cyclic = chain.cyclic ?? false
  } else {
    if (chain.smiles) {
      draft.ligandMode = 'smiles'
      draft.smiles = chain.smiles
    } else if (chain.ccd_codes) {
      draft.ligandMode = 'ccd'
      draft.ccdCodes = toRawList(chain.ccd_codes)
    } else if (chain.sdf_file_path) {
      draft.ligandMode = 'sdf'
      draft.sdfFilePath = chain.sdf_file_path
    }
  }

  return draft
}

function queryFromSpec(key: string, query: Of3Query): QueryDraft {
  const draft = createEmptyQuery(key)
  draft.chains = query.chains.map(chainFromSpec)
  draft.useMsas = query.use_msas ?? true
  draft.useMainMsas = query.use_main_msas ?? true
  draft.usePairedMsas = query.use_paired_msas ?? true
  if (query.covalent_bonds) {
    draft.covalentBonds = query.covalent_bonds.map(([atom1, atom2]) => ({
      chain1: atom1[0],
      residue1: String(atom1[1]),
      atom1: String(atom1[2]),
      chain2: atom2[0],
      residue2: String(atom2[1]),
      atom2: String(atom2[2]),
    }))
  }
  draft.pocketConstraintEnabled = !!query.pocket_constraint
  if (query.pocket_constraint) {
    draft.pocketConstraint = {
      ligandChainId: query.pocket_constraint.ligand_chain_id,
      residues: query.pocket_constraint.pocket_residues.map(([chainId, residueId]) => ({
        chainId,
        residueId: String(residueId),
      })),
      maxDistance: query.pocket_constraint.max_distance !== undefined ? String(query.pocket_constraint.max_distance) : '',
    }
  }
  return draft
}

export function deserializeInput(input: Of3Input): Pick<BuilderState, 'queries'> {
  const queries = Object.entries(input.queries).map(([key, query]) => queryFromSpec(key, query))
  return { queries }
}

/**
 * Parses and structurally validates raw JSON text pasted/typed by the user before it is
 * deserialized into form state. Unknown fields are handled the way real OpenFold3 handles them:
 * silently-ignored ones (root, query) come back as warnings and don't block the import; rejected
 * ones (chain, pocket_constraint) throw, since OpenFold3 would refuse the input outright.
 */
export function parseOf3Input(text: string): ParsedOf3Input {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err))
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Root value must be a JSON object with a "queries" field.')
  }
  const root = parsed as Record<string, unknown>
  const warnings: UnknownFieldWarning[] = []

  for (const key of Object.keys(root)) {
    if (!ROOT_KEYS.has(key)) warnings.push({ path: 'root', key, reason: key === 'seeds' ? 'seeds' : undefined })
  }

  if (typeof root.queries !== 'object' || root.queries === null || Array.isArray(root.queries)) {
    throw new Error('"queries" must be an object mapping query keys to query objects.')
  }
  const queryEntries = Object.entries(root.queries as Record<string, unknown>)
  if (queryEntries.length === 0) {
    throw new Error('"queries" must contain at least one query.')
  }

  for (const [queryKey, query] of queryEntries) {
    if (typeof query !== 'object' || query === null || Array.isArray(query)) {
      throw new Error(`Query "${queryKey}" must be an object.`)
    }
    const queryObj = query as Record<string, unknown>
    for (const key of Object.keys(queryObj)) {
      if (!QUERY_KEYS.has(key)) warnings.push({ path: `query "${queryKey}"`, key })
    }

    const chains = queryObj.chains
    if (!Array.isArray(chains)) {
      throw new Error(`Query "${queryKey}" is missing a "chains" array.`)
    }
    chains.forEach((chain, index) => {
      if (typeof chain !== 'object' || chain === null || Array.isArray(chain)) {
        throw new Error(`Query "${queryKey}", chain #${index + 1} must be an object.`)
      }
      const chainObj = chain as Record<string, unknown>
      const moleculeType = chainObj.molecule_type
      if (!MOLECULE_TYPES.includes(moleculeType as MoleculeType)) {
        throw new Error(
          `Query "${queryKey}", chain #${index + 1} has an invalid "molecule_type" (expected one of ${MOLECULE_TYPES.join(', ')}).`,
        )
      }
      for (const key of Object.keys(chainObj)) {
        if (!CHAIN_KEYS.has(key)) {
          throw new Error(
            `Query "${queryKey}", chain #${index + 1} has an unrecognized field "${key}". OpenFold3 rejects unknown chain fields instead of ignoring them.`,
          )
        }
      }

      const chainLabel = `Query "${queryKey}", chain #${index + 1}`
      if (chainObj.template_alignment_file_path !== undefined && chainObj.template_cif_paths !== undefined) {
        throw new Error(
          `${chainLabel}: cannot specify both "template_alignment_file_path" and "template_cif_paths" — OpenFold3 rejects this.`,
        )
      }
      if (chainObj.template_cif_chain_ids !== undefined) {
        if (chainObj.template_cif_paths === undefined) {
          throw new Error(
            `${chainLabel}: "template_cif_chain_ids" can only be specified together with "template_cif_paths" — OpenFold3 rejects this.`,
          )
        }
        const cifPaths = chainObj.template_cif_paths
        const cifChainIds = chainObj.template_cif_chain_ids
        if (Array.isArray(cifPaths) && Array.isArray(cifChainIds) && cifPaths.length !== cifChainIds.length) {
          throw new Error(
            `${chainLabel}: "template_cif_paths" has ${cifPaths.length} entries but "template_cif_chain_ids" has ${cifChainIds.length} — OpenFold3 requires them to match.`,
          )
        }
      }
      const identifierFields = ['smiles', 'ccd_codes', 'sdf_file_path'].filter((field) => chainObj[field] !== undefined)
      if (identifierFields.length > 1) {
        throw new Error(
          `${chainLabel}: "smiles", "ccd_codes", and "sdf_file_path" are mutually exclusive — provide only one, not ${identifierFields.map((f) => `"${f}"`).join(' and ')}.`,
        )
      }
      if (chainObj.cyclic !== undefined && typeof chainObj.cyclic !== 'boolean') {
        throw new Error(`${chainLabel}: "cyclic" must be a boolean.`)
      }
    })

    if (queryObj.covalent_bonds !== undefined) {
      const bonds = queryObj.covalent_bonds
      if (!Array.isArray(bonds)) {
        throw new Error(`Query "${queryKey}" has an invalid "covalent_bonds" (expected an array).`)
      }
      const isAtom = (value: unknown): value is [string, number, number] =>
        Array.isArray(value) && value.length === 3 && typeof value[0] === 'string' && typeof value[1] === 'number' && typeof value[2] === 'number'
      bonds.forEach((bond, i) => {
        if (!Array.isArray(bond) || bond.length !== 2 || !isAtom(bond[0]) || !isAtom(bond[1])) {
          throw new Error(
            `Query "${queryKey}", "covalent_bonds" entry #${i + 1} must be a pair of [chain_id, residue_id, atom_id] atoms.`,
          )
        }
      })
    }

    if (queryObj.pocket_constraint !== undefined) {
      if (
        typeof queryObj.pocket_constraint !== 'object' ||
        queryObj.pocket_constraint === null ||
        Array.isArray(queryObj.pocket_constraint)
      ) {
        throw new Error(`Query "${queryKey}" has an invalid "pocket_constraint" (expected an object).`)
      }
      const pocketObj = queryObj.pocket_constraint as Record<string, unknown>
      const pocketLabel = `Query "${queryKey}", "pocket_constraint"`
      for (const key of Object.keys(pocketObj)) {
        if (!POCKET_CONSTRAINT_KEYS.has(key)) {
          throw new Error(
            `${pocketLabel} has an unrecognized field "${key}". OpenFold3 rejects unknown fields there instead of ignoring them.`,
          )
        }
      }
      if (typeof pocketObj.ligand_chain_id !== 'string' || pocketObj.ligand_chain_id.trim() === '') {
        throw new Error(`${pocketLabel} needs a non-empty "ligand_chain_id" — OpenFold3 requires this field.`)
      }
      const pocketResidues = pocketObj.pocket_residues
      if (!Array.isArray(pocketResidues) || pocketResidues.length === 0) {
        throw new Error(`${pocketLabel} needs at least one entry in "pocket_residues" — OpenFold3 rejects an empty list.`)
      }
      pocketResidues.forEach((residue, i) => {
        if (
          !Array.isArray(residue) ||
          residue.length !== 2 ||
          typeof residue[0] !== 'string' ||
          typeof residue[1] !== 'number'
        ) {
          throw new Error(
            `${pocketLabel}: "pocket_residues" entry #${i + 1} must be a [chain_id, residue_id] pair (string, number).`,
          )
        }
      })
      if (pocketObj.max_distance !== undefined && (typeof pocketObj.max_distance !== 'number' || pocketObj.max_distance <= 0)) {
        throw new Error(`${pocketLabel}: "max_distance" must be a positive number — OpenFold3 rejects this.`)
      }
    }
  }

  return { input: root as unknown as Of3Input, warnings }
}
