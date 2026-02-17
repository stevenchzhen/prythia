/**
 * Cross-platform contract matcher using Voyage AI embeddings + pgvector.
 *
 * Complements the auto-mapper (which creates canonical events via Haiku)
 * by linking unmapped contracts to existing events via cosine similarity.
 *
 * Two phases:
 * 1. embedMissing() — backfill embeddings for events/contracts without them
 * 2. matchUnmapped() — find event matches for unmapped contracts
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  generateEmbeddings,
  buildEventEmbeddingText,
  buildContractEmbeddingText,
} from './voyage'

const AUTO_ASSIGN_THRESHOLD = 0.85
const LOG_THRESHOLD = 0.70
const EMBED_BATCH_SIZE = 128

interface CrossMatchStats {
  eventsEmbedded: number
  contractsEmbedded: number
  autoAssigned: number
  logged: number
  skipped: number
  errors: number
}

/**
 * Phase 1: Embed events and contracts that don't have embeddings yet.
 */
async function embedMissing(timeBudgetMs: number): Promise<{ eventsEmbedded: number; contractsEmbedded: number }> {
  const deadline = Date.now() + timeBudgetMs
  let eventsEmbedded = 0
  let contractsEmbedded = 0

  // --- Embed events ---
  const { data: events } = await supabaseAdmin
    .from('events')
    .select('id, title, description, category, tags')
    .is('embedding', null)
    .eq('is_active', true)
    .limit(500)

  if (events && events.length > 0) {
    const texts = events.map(buildEventEmbeddingText)

    for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
      if (Date.now() > deadline) break
      const batch = texts.slice(i, i + EMBED_BATCH_SIZE)
      const batchEvents = events.slice(i, i + EMBED_BATCH_SIZE)

      try {
        const embeddings = await generateEmbeddings(batch, 'document')

        for (let j = 0; j < batchEvents.length; j++) {
          const { error } = await supabaseAdmin
            .from('events')
            .update({ embedding: JSON.stringify(embeddings[j]) })
            .eq('id', batchEvents[j].id)

          if (!error) eventsEmbedded++
        }
      } catch (err) {
        console.error('[CrossMatcher] Error embedding events batch:', err)
      }
    }

    console.log(`[CrossMatcher] Embedded ${eventsEmbedded} events`)
  }

  // --- Embed contracts ---
  if (Date.now() < deadline) {
    const { data: contracts } = await supabaseAdmin
      .from('source_contracts')
      .select('id, contract_title, platform')
      .is('embedding', null)
      .eq('is_active', true)
      .not('contract_title', 'is', null)
      .limit(1000)

    if (contracts && contracts.length > 0) {
      const texts = contracts.map((c) =>
        buildContractEmbeddingText({ contract_title: c.contract_title!, platform: c.platform })
      )

      for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
        if (Date.now() > deadline) break
        const batch = texts.slice(i, i + EMBED_BATCH_SIZE)
        const batchContracts = contracts.slice(i, i + EMBED_BATCH_SIZE)

        try {
          const embeddings = await generateEmbeddings(batch, 'document')

          for (let j = 0; j < batchContracts.length; j++) {
            const { error } = await supabaseAdmin
              .from('source_contracts')
              .update({ embedding: JSON.stringify(embeddings[j]) })
              .eq('id', batchContracts[j].id)

            if (!error) contractsEmbedded++
          }
        } catch (err) {
          console.error('[CrossMatcher] Error embedding contracts batch:', err)
        }
      }

      console.log(`[CrossMatcher] Embedded ${contractsEmbedded} contracts`)
    }
  }

  return { eventsEmbedded, contractsEmbedded }
}

/**
 * Phase 2: Match unmapped contracts to existing events via embedding similarity.
 */
async function matchUnmapped(timeBudgetMs: number): Promise<{
  autoAssigned: number
  logged: number
  skipped: number
  errors: number
}> {
  const deadline = Date.now() + timeBudgetMs
  let autoAssigned = 0
  let logged = 0
  let skipped = 0
  let errors = 0

  // Fetch unmapped contracts that have embeddings
  const { data: unmapped } = await supabaseAdmin
    .from('source_contracts')
    .select('id, platform, platform_contract_id, contract_title, embedding')
    .is('event_id', null)
    .not('embedding', 'is', null)
    .eq('is_active', true)
    .limit(500)

  if (!unmapped || unmapped.length === 0) {
    console.log('[CrossMatcher] No unmapped contracts with embeddings to match')
    return { autoAssigned, logged, skipped, errors }
  }

  console.log(`[CrossMatcher] Matching ${unmapped.length} unmapped contracts`)

  for (const contract of unmapped) {
    if (Date.now() > deadline) break

    try {
      // Call the pgvector RPC to find similar events
      const { data: matches, error } = await supabaseAdmin.rpc(
        'match_events_by_embedding',
        {
          query_embedding: contract.embedding,
          match_threshold: LOG_THRESHOLD,
          match_count: 3,
        }
      )

      if (error) {
        console.error(`[CrossMatcher] RPC error for ${contract.id}:`, error)
        errors++
        continue
      }

      if (!matches || matches.length === 0) {
        skipped++
        continue
      }

      const best = matches[0]

      if (best.similarity >= AUTO_ASSIGN_THRESHOLD) {
        // High confidence — auto-assign
        const { error: linkError } = await supabaseAdmin
          .from('source_contracts')
          .update({ event_id: best.event_id })
          .eq('id', contract.id)

        if (linkError) {
          console.error(`[CrossMatcher] Link error for ${contract.id}:`, linkError)
          errors++
          continue
        }

        // Create mapping record
        await supabaseAdmin.from('event_source_mappings').upsert(
          {
            event_id: best.event_id,
            platform: contract.platform,
            platform_contract_id: contract.platform_contract_id,
            confidence: 'embedding_high',
            mapped_by: 'voyage-3-lite',
            mapped_at: new Date().toISOString(),
          },
          { onConflict: 'platform,platform_contract_id' }
        )

        console.log(
          `[CrossMatcher] Auto-assigned: "${contract.contract_title}" → "${best.title}" (${best.similarity.toFixed(3)})`
        )
        autoAssigned++
      } else {
        // Medium confidence — log for review
        console.log(
          `[CrossMatcher] Candidate: "${contract.contract_title}" ~ "${best.title}" (${best.similarity.toFixed(3)})`
        )
        logged++
      }
    } catch (err) {
      console.error(`[CrossMatcher] Error matching ${contract.id}:`, err)
      errors++
    }
  }

  return { autoAssigned, logged, skipped, errors }
}

/**
 * Entry point: run both phases within a time budget.
 */
export async function runCrossMatcher(
  timeBudgetMs: number = 90_000
): Promise<CrossMatchStats> {
  console.log(`[CrossMatcher] Starting with ${timeBudgetMs}ms budget`)
  const start = Date.now()

  // Phase 1: embed missing (60% of budget)
  const embedBudget = Math.floor(timeBudgetMs * 0.6)
  const { eventsEmbedded, contractsEmbedded } = await embedMissing(embedBudget)

  // Phase 2: match unmapped (remaining budget)
  const remaining = timeBudgetMs - (Date.now() - start)
  const matchResult = await matchUnmapped(Math.max(remaining, 10_000))

  const stats: CrossMatchStats = {
    eventsEmbedded,
    contractsEmbedded,
    ...matchResult,
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`[CrossMatcher] Done in ${elapsed}s:`, stats)

  return stats
}
