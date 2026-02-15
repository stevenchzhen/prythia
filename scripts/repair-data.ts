/**
 * Repair script: audit bad data, deactivate stale contracts, and re-aggregate all events.
 *
 * Usage: npx tsx scripts/repair-data.ts
 *
 * Steps:
 * 1. Audit — print counts of bad data (diagnostic only)
 * 2. Mark stale contracts inactive (last_trade_at > 7 days ago, still is_active)
 * 3. Re-aggregate all open events (recomputes quality_score, volume_24h, probability, prob_changes)
 * 4. Print verification summary
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function audit() {
  console.log('\n=== Step 1: Audit ===\n')

  // Stale active contracts (last_trade_at > 7 days ago)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: staleCount } = await supabase
    .from('source_contracts')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .lt('last_trade_at', sevenDaysAgo)

  console.log(`Stale active contracts (last_trade_at > 7d ago): ${staleCount ?? 0}`)

  // Events with NULL prob_change_24h
  const { count: nullProbChangeCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('resolution_status', 'open')
    .is('prob_change_24h', null)

  console.log(`Open events with NULL prob_change_24h: ${nullProbChangeCount ?? 0}`)

  // Events with quality_score = 0.21 (the old default)
  const { count: defaultQualityCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('quality_score', 0.21)

  console.log(`Events with quality_score = 0.21 (old default): ${defaultQualityCount ?? 0}`)

  // Events with volume_24h = 0
  const { count: zeroVolumeCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('resolution_status', 'open')
    .eq('volume_24h', 0)

  console.log(`Open events with volume_24h = 0: ${zeroVolumeCount ?? 0}`)

  // Orphaned source_contracts (is_active but no event_id)
  const { count: orphanedCount } = await supabase
    .from('source_contracts')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .is('event_id', null)

  console.log(`Orphaned active contracts (no event_id): ${orphanedCount ?? 0}`)

  // Duplicate platform sources per event
  const { data: dupes } = await supabase
    .rpc('count_duplicate_platform_sources')
    .select()
    .maybeSingle()

  // If the RPC doesn't exist, fall back to a manual check
  if (dupes === null) {
    const { data: allMapped } = await supabase
      .from('source_contracts')
      .select('event_id, platform')
      .eq('is_active', true)
      .not('event_id', 'is', null)

    if (allMapped) {
      const seen = new Set<string>()
      let dupeCount = 0
      for (const row of allMapped) {
        const key = `${row.event_id}:${row.platform}`
        if (seen.has(key)) dupeCount++
        else seen.add(key)
      }
      console.log(`Duplicate platform sources per event: ${dupeCount}`)
    }
  }
}

async function deactivateStaleContracts() {
  console.log('\n=== Step 2: Deactivate Stale Contracts ===\n')

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error, count } = await supabase
    .from('source_contracts')
    .update({ is_active: false })
    .eq('is_active', true)
    .lt('last_trade_at', sevenDaysAgo)
    .select('id', { count: 'exact' })

  if (error) {
    console.error('Error deactivating stale contracts:', error)
    return
  }

  console.log(`Deactivated ${data?.length ?? count ?? 0} stale contracts`)
}

async function reAggregateAllEvents() {
  console.log('\n=== Step 3: Re-aggregate All Open Events ===\n')

  // We import the aggregator dynamically to pick up the fixed code
  const { aggregateAllEvents } = await import('../src/lib/ingestion/aggregator')

  const result = await aggregateAllEvents()
  console.log(`Processed ${result.eventsProcessed} events, updated ${result.eventsUpdated}`)
}

async function verify() {
  console.log('\n=== Step 4: Verification ===\n')

  // Events still with quality_score = 0.21
  const { count: defaultQuality } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('quality_score', 0.21)

  console.log(`Events still with quality_score = 0.21: ${defaultQuality ?? 0}`)

  // Events with populated prob_change_24h
  const { count: withProbChange } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('resolution_status', 'open')
    .not('prob_change_24h', 'is', null)

  console.log(`Open events with prob_change_24h populated: ${withProbChange ?? 0}`)

  // Stale active contracts remaining
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: staleRemaining } = await supabase
    .from('source_contracts')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .lt('last_trade_at', sevenDaysAgo)

  console.log(`Stale active contracts remaining: ${staleRemaining ?? 0}`)

  // Events with volume_24h > 0
  const { count: withVolume } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('resolution_status', 'open')
    .gt('volume_24h', 0)

  console.log(`Open events with volume_24h > 0: ${withVolume ?? 0}`)
}

async function main() {
  console.log('=== Prythia Data Repair Script ===')
  console.log(`Started at ${new Date().toISOString()}\n`)

  await audit()
  await deactivateStaleContracts()
  await reAggregateAllEvents()
  await verify()

  console.log('\n=== Done ===')
}

main().catch((err) => {
  console.error('Repair script failed:', err)
  process.exit(1)
})
