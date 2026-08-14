// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { MoleculeType } from '@/types/of3'
import type { ChainDraft, QueryDraft } from '@/types/draft'
import { createEmptyChain, createEmptyQuery, createId, deserializeInput, emptyRaw, parseOf3Input } from '@/utils/of3Draft'
import type { UnknownFieldWarning } from '@/utils/of3Draft'
import { serializeInput } from '@/utils/of3Serialize'
import { validateInput } from '@/utils/of3Validate'
import { OF3_EXAMPLES } from '@/data/examples'

function nextQueryKey(queries: QueryDraft[]): string {
  let n = queries.length + 1
  const used = new Set(queries.map((q) => q.key))
  while (used.has(`query_${n}`)) n += 1
  return `query_${n}`
}

export const useOf3BuilderStore = defineStore('of3Builder', () => {
  const initialQuery = createEmptyQuery('query_1')
  const queries = ref<QueryDraft[]>([initialQuery])
  const activeQueryUiId = ref<string | null>(initialQuery.uiId)
  const importWarnings = ref<UnknownFieldWarning[]>([])
  const rootRaw = ref(emptyRaw())

  const activeQuery = computed<QueryDraft | null>(
    () => queries.value.find((q) => q.uiId === activeQueryUiId.value) ?? null,
  )

  const output = computed(() => serializeInput({ queries: queries.value, rootRaw: rootRaw.value }))
  const issues = computed(() => validateInput({ queries: queries.value }))

  function setActiveQuery(uiId: string) {
    if (queries.value.some((q) => q.uiId === uiId)) activeQueryUiId.value = uiId
  }

  function addQuery() {
    const query = createEmptyQuery(nextQueryKey(queries.value))
    queries.value.push(query)
    activeQueryUiId.value = query.uiId
    return query
  }

  function removeQuery(uiId: string) {
    const index = queries.value.findIndex((q) => q.uiId === uiId)
    if (index === -1) return
    queries.value.splice(index, 1)
    if (activeQueryUiId.value === uiId) {
      activeQueryUiId.value = queries.value[Math.max(0, index - 1)]?.uiId ?? null
    }
  }

  function duplicateQuery(uiId: string) {
    const source = queries.value.find((q) => q.uiId === uiId)
    if (!source) return
    const clone = deserializeInput(serializeInput({ queries: [source], rootRaw: emptyRaw() })).queries[0]
    if (!clone) return
    clone.key = nextQueryKey(queries.value)
    queries.value.splice(queries.value.indexOf(source) + 1, 0, clone)
    activeQueryUiId.value = clone.uiId
  }

  function renameQueryKey(uiId: string, key: string) {
    const query = queries.value.find((q) => q.uiId === uiId)
    if (query) query.key = key
  }

  function addChain(queryUiId: string, moleculeType: MoleculeType) {
    const query = queries.value.find((q) => q.uiId === queryUiId)
    if (!query) return null
    const chain = createEmptyChain(moleculeType)
    query.chains.push(chain)
    return chain
  }

  function removeChain(queryUiId: string, chainUiId: string) {
    const query = queries.value.find((q) => q.uiId === queryUiId)
    if (!query) return
    const index = query.chains.findIndex((c) => c.uiId === chainUiId)
    if (index !== -1) query.chains.splice(index, 1)
  }

  function updateChain(queryUiId: string, chainUiId: string, patch: Partial<ChainDraft>) {
    const query = queries.value.find((q) => q.uiId === queryUiId)
    const chain = query?.chains.find((c) => c.uiId === chainUiId)
    if (chain) Object.assign(chain, patch)
  }

  function setPocketConstraintEnabled(queryUiId: string, enabled: boolean) {
    const query = queries.value.find((q) => q.uiId === queryUiId)
    if (query) query.pocketConstraintEnabled = enabled
  }

  function setQueryMsaOptions(queryUiId: string, patch: Partial<Pick<QueryDraft, 'useMsas' | 'useMainMsas' | 'usePairedMsas'>>) {
    const query = queries.value.find((q) => q.uiId === queryUiId)
    if (query) Object.assign(query, patch)
  }

  function loadExample(exampleId: string) {
    const example = OF3_EXAMPLES.find((e) => e.id === exampleId)
    if (!example) return
    // Deliberately starts clean (no reconciliation against the current queries) — loading an
    // example is an explicit "replace everything" action, not an incremental edit.
    const state = deserializeInput(example.input)
    queries.value = state.queries
    rootRaw.value = state.rootRaw
    activeQueryUiId.value = queries.value[0]?.uiId ?? null
  }

  /**
   * Parses raw JSON text and syncs it into form state. Throws on invalid input, leaving state
   * untouched. Reconciles against the current queries (matched by query key, then chains by
   * index) so a small edit updates the existing draft objects in place rather than replacing them
   * wholesale — that's what keeps the sidebar's current selection, and anything else holding a
   * direct reference to a query/chain (e.g. an open chain editor), pointed at the right object
   * instead of a stale one after every keystroke.
   */
  function loadFromJson(text: string) {
    const { input, warnings } = parseOf3Input(text)
    const state = deserializeInput(input, queries.value)
    queries.value = state.queries
    rootRaw.value = state.rootRaw
    activeQueryUiId.value = queries.value.some((q) => q.uiId === activeQueryUiId.value)
      ? activeQueryUiId.value
      : (queries.value[0]?.uiId ?? null)
    importWarnings.value = warnings
  }

  function clearImportWarnings() {
    importWarnings.value = []
  }

  function reset() {
    const query = createEmptyQuery('query_1')
    queries.value = [query]
    rootRaw.value = emptyRaw()
    activeQueryUiId.value = query.uiId
    importWarnings.value = []
  }

  return {
    queries,
    activeQueryUiId,
    activeQuery,
    importWarnings,
    output,
    issues,
    setActiveQuery,
    addQuery,
    removeQuery,
    duplicateQuery,
    renameQueryKey,
    addChain,
    removeChain,
    updateChain,
    setPocketConstraintEnabled,
    setQueryMsaOptions,
    loadExample,
    loadFromJson,
    clearImportWarnings,
    reset,
    createId,
  }
})
