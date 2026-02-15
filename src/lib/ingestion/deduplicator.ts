import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Contract-to-event matching.
 *
 * v0: Manual mapping via event_source_mappings table.
 * v1: Automated matching using embedding similarity (cosine > 0.85).
 *
 * Same event, different wording across platforms:
 * - Exact resolution date match + semantic similarity > 0.85 → auto-merge
 * - Same topic, different time horizon → separate events, linked as related
 * - Ambiguous overlap → flag for human review
 */

interface ContractCandidate {
  platform: string
  platform_contract_id: string
  title: string
  resolution_date?: string
}

/**
 * Look up the canonical event ID for a source contract.
 * Returns null if no mapping exists (needs manual mapping).
 */
export async function findEventMapping(
  platform: string,
  platformContractId: string
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('event_source_mappings')
    .select('event_id')
    .eq('platform', platform)
    .eq('platform_contract_id', platformContractId)
    .single()

  return data?.event_id ?? null
}

/**
 * Suggest potential event matches for an unmapped contract.
 * Uses title similarity for v0 (upgrade to embeddings in v1).
 */
export async function suggestEventMatches(
  candidate: ContractCandidate,
  limit: number = 5
): Promise<Array<{ event_id: string; title: string; score: number }>> {
  // TODO: Implement fuzzy matching via pg_trgm or embedding similarity
  const { data } = await supabaseAdmin
    .from('events')
    .select('id, title')
    .textSearch('fts', candidate.title.split(' ').slice(0, 5).join(' & '))
    .limit(limit)

  return (data ?? []).map((e) => ({
    event_id: e.id,
    title: e.title,
    score: 0, // TODO: Calculate actual similarity score
  }))
}
