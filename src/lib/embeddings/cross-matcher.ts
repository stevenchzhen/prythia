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
import { queryFast, parseResponse } from '@/lib/ai/client'
import {
  generateEmbeddings,
  buildEventEmbeddingText,
  buildContractEmbeddingText,
} from './voyage'

// All matches >= 0.70 get Haiku verification — pure embedding can't distinguish
// numbers (e.g. "$1,500-$1,600" vs "$1,900-$2,000" both score > 0.85)
const VERIFY_THRESHOLD = 0.70
const EMBED_BATCH_SIZE = 128

interface CrossMatchStats {
  eventsEmbedded: number
  contractsEmbedded: number
  aiVerified: number
  aiRejected: number
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
 * Haiku verification for gray-zone matches (0.78–0.85 similarity).
 * Quick yes/no: is this contract about the same real-world question as this event?
 */
async function verifyMatchWithAI(
  contractTitle: string,
  eventTitle: string
): Promise<boolean> {
  const response = await queryFast(
    [
      {
        role: 'user',
        content: `Are these two prediction market questions about the EXACT same real-world outcome? Not just the same topic — the same specific question with the same resolution criteria.

Contract: "${contractTitle}"
Event: "${eventTitle}"

Reply with only YES or NO.`,
      },
    ],
    { maxTokens: 3, temperature: 0 }
  )

  const { text } = await parseResponse(response)
  return text.trim().toUpperCase().startsWith('YES')
}

/**
 * Phase 2: Match unmapped contracts to existing events via embedding similarity.
 * All candidates >= 0.70 get Haiku verification. Checked contracts are stamped
 * so they're skipped within the same weekly run cycle.
 */
async function matchUnmapped(timeBudgetMs: number): Promise<{
  aiVerified: number
  aiRejected: number
  skipped: number
  errors: number
}> {
  const deadline = Date.now() + timeBudgetMs
  let aiVerified = 0
  let aiRejected = 0
  let skipped = 0
  let errors = 0

  // Fetch unmapped contracts that have embeddings and haven't been checked this run cycle.
  // The cron runs weekly, so cross_match_checked_at resets naturally — only skip
  // contracts checked within the current run (handles multi-batch within one invocation).
  const { data: unmapped } = await supabaseAdmin
    .from('source_contracts')
    .select('id, platform, platform_contract_id, contract_title, embedding')
    .is('event_id', null)
    .not('embedding', 'is', null)
    .eq('is_active', true)
    .is('cross_match_checked_at', null)
    .limit(500)

  if (!unmapped || unmapped.length === 0) {
    console.log('[CrossMatcher] No unmapped contracts with embeddings to match')
    return { aiVerified, aiRejected, skipped, errors }
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
          match_threshold: VERIFY_THRESHOLD,
          match_count: 3,
        }
      )

      if (error) {
        console.error(`[CrossMatcher] RPC error for ${contract.id}:`, error)
        errors++
        continue
      }

      // Stamp as checked regardless of outcome
      const stampChecked = () =>
        supabaseAdmin
          .from('source_contracts')
          .update({ cross_match_checked_at: new Date().toISOString() })
          .eq('id', contract.id)

      if (!matches || matches.length === 0) {
        await stampChecked()
        skipped++
        continue
      }

      const best = matches[0]

      if (best.similarity < VERIFY_THRESHOLD) {
        await stampChecked()
        skipped++
        continue
      }

      // All matches get Haiku verification — embeddings can't distinguish numbers
      let shouldAssign = false
      try {
        const verified = await verifyMatchWithAI(
          contract.contract_title ?? '',
          best.title
        )
        if (verified) {
          shouldAssign = true
          aiVerified++
          console.log(
            `[CrossMatcher] AI verified: "${contract.contract_title}" → "${best.title}" (${best.similarity.toFixed(3)})`
          )
        } else {
          await stampChecked()
          aiRejected++
          console.log(
            `[CrossMatcher] AI rejected: "${contract.contract_title}" ~ "${best.title}" (${best.similarity.toFixed(3)})`
          )
        }
      } catch (err) {
        console.warn(`[CrossMatcher] AI verify failed for ${contract.id}:`, err)
        await stampChecked()
        errors++
        continue
      }

      if (shouldAssign) {
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
            confidence: 'embedding_ai_verified',
            mapped_by: 'voyage-3-lite+haiku',
            mapped_at: new Date().toISOString(),
          },
          { onConflict: 'platform,platform_contract_id' }
        )

        console.log(
          `[CrossMatcher] Assigned: "${contract.contract_title}" → "${best.title}" (${best.similarity.toFixed(3)})`
        )
      }
    } catch (err) {
      console.error(`[CrossMatcher] Error matching ${contract.id}:`, err)
      errors++
    }
  }

  return { aiVerified, aiRejected, skipped, errors }
}

/**
 * Entry point: run both phases within a time budget.
 */
export async function runCrossMatcher(
  timeBudgetMs: number = 90_000
): Promise<CrossMatchStats> {
  console.log(`[CrossMatcher] Starting with ${timeBudgetMs}ms budget`)
  const start = Date.now()

  // Reset checked stamps so all unmapped contracts get re-evaluated
  // against any new events created since last run
  await supabaseAdmin
    .from('source_contracts')
    .update({ cross_match_checked_at: null })
    .is('event_id', null)
    .not('cross_match_checked_at', 'is', null)

  // Phase 1: embed missing (60% of budget)
  const embedBudget = Math.floor(timeBudgetMs * 0.6)
  const { eventsEmbedded, contractsEmbedded } = await embedMissing(embedBudget)

  // Phase 2: match unmapped (remaining budget)
  const remaining = timeBudgetMs - (Date.now() - start)
  const matchResult = await matchUnmapped(Math.max(remaining, 10_000))

  const stats: CrossMatchStats = {
    eventsEmbedded,
    contractsEmbedded,
    aiVerified: matchResult.aiVerified,
    aiRejected: matchResult.aiRejected,
    skipped: matchResult.skipped,
    errors: matchResult.errors,
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`[CrossMatcher] Done in ${elapsed}s:`, stats)

  return stats
}
