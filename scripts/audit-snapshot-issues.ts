import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log('=== Snapshot & Aggregation Audit ===\n')

  // 1. Snapshot quality_score NULL breakdown by source
  console.log('--- quality_score NULL by source ---')
  for (const source of ['aggregated', 'polymarket', 'kalshi', 'metaculus']) {
    const { count: total } = await sb.from('probability_snapshots').select('*', { count: 'exact', head: true }).eq('source', source)
    const { count: nullQs } = await sb.from('probability_snapshots').select('*', { count: 'exact', head: true }).eq('source', source).is('quality_score', null)
    const { count: hasQs } = await sb.from('probability_snapshots').select('*', { count: 'exact', head: true }).eq('source', source).not('quality_score', 'is', null)
    console.log(`  ${source}: total=${total}, quality_score=NULL: ${nullQs}, has quality_score: ${hasQs}`)
  }

  // 2. Snapshot NULL fields breakdown
  console.log('\n--- Snapshot NULL field counts (all sources) ---')
  for (const field of ['probability', 'volume', 'liquidity', 'num_traders', 'quality_score']) {
    const { count } = await sb.from('probability_snapshots').select('*', { count: 'exact', head: true }).is(field, null)
    console.log(`  ${field} IS NULL: ${count}`)
  }

  // 3. Events with Kalshi sources — check quality_score on events table
  console.log('\n--- Events with Kalshi sources ---')
  const { data: kalshiMapped } = await sb
    .from('source_contracts')
    .select('event_id')
    .eq('platform', 'kalshi')
    .eq('is_active', true)
    .not('event_id', 'is', null)
    .limit(1000)

  const kalshiEventIds = [...new Set((kalshiMapped || []).map(c => c.event_id))]
  console.log(`  Unique events with Kalshi sources: ${kalshiEventIds.length}`)

  if (kalshiEventIds.length > 0) {
    // Sample some
    const { data: kalshiEvents } = await sb
      .from('events')
      .select('id, title, probability, volume_24h, volume_total, quality_score, source_count, prob_change_24h')
      .in('id', kalshiEventIds.slice(0, 10))

    for (const e of kalshiEvents || []) {
      console.log(`  [q=${e.quality_score}] ${e.title}`)
      console.log(`    prob=${e.probability}, vol_24h=${e.volume_24h}, vol_total=${e.volume_total}, sources=${e.source_count}, prob_change=${e.prob_change_24h}`)
    }
  }

  // 4. Check for events where quality_score is NULL or 0
  console.log('\n--- Events with bad quality_score ---')
  const { count: nullQuality } = await sb.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true).is('quality_score', null)
  const { count: zeroQuality } = await sb.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('quality_score', 0)
  console.log(`  quality_score IS NULL: ${nullQuality}`)
  console.log(`  quality_score = 0: ${zeroQuality}`)

  // 5. Check for events with source_count > 0 but probability IS NULL
  const { count: noProb } = await sb.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true).gt('source_count', 0).is('probability', null)
  console.log(`  source_count > 0 but probability IS NULL: ${noProb}`)

  // 6. Per-source snapshots: check volume stored correctly for each platform
  console.log('\n--- Per-source snapshot volume samples ---')
  for (const source of ['polymarket', 'kalshi', 'metaculus']) {
    const { data: samples } = await sb
      .from('probability_snapshots')
      .select('event_id, source, probability, volume, liquidity, num_traders, captured_at')
      .eq('source', source)
      .order('captured_at', { ascending: false })
      .limit(3)

    console.log(`\n  ${source} (latest 3):`)
    for (const s of samples || []) {
      console.log(`    event=${s.event_id}, prob=${s.probability}, vol=${s.volume}, liq=${s.liquidity}, traders=${s.num_traders}`)
    }
  }

  // 7. Check if derive24hVolume has data to work with for Kalshi events
  console.log('\n--- Kalshi events: snapshot depth for volume derivation ---')
  if (kalshiEventIds.length > 0) {
    for (const eid of kalshiEventIds.slice(0, 5)) {
      const { count } = await sb
        .from('probability_snapshots')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eid)
        .eq('source', 'kalshi')
      const { data: event } = await sb.from('events').select('title, volume_24h').eq('id', eid).single()
      console.log(`  ${event?.title}: ${count} snapshots, volume_24h=${event?.volume_24h}`)
    }
  }

  // 8. Check for any events with volume_24h from Kalshi that should be nonzero
  console.log('\n--- Kalshi source_contracts: volume_24h values ---')
  const { data: kalshiWithVol } = await sb
    .from('source_contracts')
    .select('contract_title, volume_24h, volume_total, liquidity')
    .eq('platform', 'kalshi')
    .eq('is_active', true)
    .not('event_id', 'is', null)
    .gt('volume_24h', 0)
    .order('volume_24h', { ascending: false })
    .limit(5)

  console.log(`  Kalshi contracts with volume_24h > 0 (mapped):`)
  for (const c of kalshiWithVol || []) {
    console.log(`    ${c.contract_title}: vol_24h=${c.volume_24h}, vol_total=${c.volume_total}, liq=${c.liquidity}`)
  }

  const { count: kalshiZeroVol } = await sb
    .from('source_contracts')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'kalshi')
    .eq('is_active', true)
    .not('event_id', 'is', null)
    .eq('volume_24h', 0)

  console.log(`  Kalshi mapped contracts with volume_24h = 0: ${kalshiZeroVol}`)

  // 9. Check aggregated snapshots — are they being written for Kalshi events?
  console.log('\n--- Aggregated snapshots for Kalshi events ---')
  if (kalshiEventIds.length > 0) {
    const { count: aggSnaps } = await sb
      .from('probability_snapshots')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'aggregated')
      .in('event_id', kalshiEventIds.slice(0, 50))
    console.log(`  Aggregated snapshots for first 50 Kalshi events: ${aggSnaps}`)
  }

  // 10. Check for duplicate snapshots (same event+source+captured_at)
  console.log('\n--- Recent snapshot insert timing ---')
  const { data: recentSnaps } = await sb
    .from('probability_snapshots')
    .select('event_id, source, captured_at')
    .order('captured_at', { ascending: false })
    .limit(10)

  for (const s of recentSnaps || []) {
    console.log(`  ${s.source} | ${s.event_id} | ${s.captured_at}`)
  }
}

main().catch(console.error)
