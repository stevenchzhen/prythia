import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Contract-to-event matching.
 *
 * v0: Manual mapping via event_source_mappings table.
 * v1: Embedding similarity (cosine > 0.85) with FTS fallback.
 *
 * Same event, different wording across platforms:
 * - Semantic similarity > 0.85 → auto-merge
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
 * Uses embedding similarity via pgvector, falls back to FTS if no VOYAGE_API_KEY.
 */
export async function suggestEventMatches(
  candidate: ContractCandidate,
  limit: number = 5
): Promise<Array<{ event_id: string; title: string; score: number }>> {
  // Try embedding-based matching first
  if (process.env.VOYAGE_API_KEY) {
    try {
      const { generateEmbedding, buildContractEmbeddingText } = await import(
        '@/lib/embeddings/voyage'
      )
      const text = buildContractEmbeddingText({
        contract_title: candidate.title,
        platform: candidate.platform,
      })
      const embedding = await generateEmbedding(text, 'query')

      const { data: matches } = await supabaseAdmin.rpc(
        'match_events_by_embedding',
        {
          query_embedding: JSON.stringify(embedding),
          match_threshold: 0.7,
          match_count: limit,
        }
      )

      if (matches && matches.length > 0) {
        return matches.map((m: { event_id: string; title: string; similarity: number }) => ({
          event_id: m.event_id,
          title: m.title,
          score: m.similarity,
        }))
      }
    } catch (err) {
      console.warn('[Deduplicator] Embedding match failed, falling back to FTS:', err)
    }
  }

  // Fallback: full-text search
  const { data } = await supabaseAdmin
    .from('events')
    .select('id, title')
    .textSearch('fts', candidate.title.split(' ').slice(0, 5).join(' & '))
    .limit(limit)

  return (data ?? []).map((e) => ({
    event_id: e.id,
    title: e.title,
    score: 0,
  }))
}
