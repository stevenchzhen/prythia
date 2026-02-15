import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  // Overall source_contracts breakdown
  const { data: allContracts } = await sb.from('source_contracts').select('platform, is_active, event_id')

  const stats: Record<string, { total: number; active: number; mapped: number; orphaned: number }> = {}
  for (const c of allContracts || []) {
    if (!stats[c.platform]) stats[c.platform] = { total: 0, active: 0, mapped: 0, orphaned: 0 }
    stats[c.platform].total++
    if (c.is_active) stats[c.platform].active++
    if (c.event_id) stats[c.platform].mapped++
    if (c.is_active && !c.event_id) stats[c.platform].orphaned++
  }

  console.log('=== Source Contracts by Platform ===')
  for (const [platform, s] of Object.entries(stats)) {
    console.log(`\n${platform}:`)
    console.log(`  Total: ${s.total}`)
    console.log(`  Active: ${s.active}`)
    console.log(`  Mapped to events: ${s.mapped}`)
    console.log(`  Active but orphaned (no event): ${s.orphaned}`)
  }

  // Events breakdown
  const { count: totalEvents } = await sb.from('events').select('*', { count: 'exact', head: true })
  const { count: openEvents } = await sb.from('events').select('*', { count: 'exact', head: true }).eq('resolution_status', 'open').eq('is_active', true)
  const { count: withSources } = await sb.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true).gt('source_count', 0)
  const { count: withVolume } = await sb.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true).gt('volume_24h', 0)
  const { count: withProbChange } = await sb.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true).not('prob_change_24h', 'is', null)
  const { count: goodQuality } = await sb.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true).gt('quality_score', 0.3)

  console.log(`\n=== Events ===`)
  console.log(`Total: ${totalEvents}`)
  console.log(`Open & active: ${openEvents}`)
  console.log(`With source_count > 0: ${withSources}`)
  console.log(`With volume_24h > 0: ${withVolume}`)
  console.log(`With prob_change_24h: ${withProbChange}`)
  console.log(`With quality_score > 0.3: ${goodQuality}`)

  // Snapshots
  const { count: snapshotCount } = await sb.from('probability_snapshots').select('*', { count: 'exact', head: true })
  console.log(`\nTotal probability_snapshots: ${snapshotCount}`)

  // Sample mapped events
  const { data: sampleEvents } = await sb
    .from('events')
    .select('id, title, probability, volume_24h, volume_total, source_count, quality_score, prob_change_24h')
    .eq('is_active', true)
    .gt('source_count', 0)
    .order('quality_score', { ascending: false })
    .limit(5)

  console.log(`\n=== Top 5 Events by Quality ===`)
  for (const e of sampleEvents || []) {
    console.log(`\n  ${e.title}`)
    console.log(`    prob: ${e.probability}, sources: ${e.source_count}, quality: ${e.quality_score}`)
    console.log(`    vol_24h: ${e.volume_24h}, vol_total: ${e.volume_total}, prob_change_24h: ${e.prob_change_24h}`)
  }

  // Check what platforms are actually linked to events
  const { data: mappedContracts } = await sb
    .from('source_contracts')
    .select('platform, event_id')
    .not('event_id', 'is', null)

  const platformsLinked: Record<string, Set<string>> = {}
  for (const c of mappedContracts || []) {
    if (!platformsLinked[c.platform]) platformsLinked[c.platform] = new Set()
    platformsLinked[c.platform].add(c.event_id)
  }

  console.log(`\n=== Platforms Linked to Events ===`)
  for (const [platform, eventIds] of Object.entries(platformsLinked)) {
    console.log(`  ${platform}: ${eventIds.size} events`)
  }

  // Now investigate Kalshi specifically
  console.log(`\n=== Kalshi Investigation ===`)
  const { data: kalshiSample } = await sb
    .from('source_contracts')
    .select('platform_contract_id, contract_title, price, volume_24h, volume_total, is_active, last_trade_at, event_id')
    .eq('platform', 'kalshi')
    .order('volume_total', { ascending: false })
    .limit(10)

  if (!kalshiSample || kalshiSample.length === 0) {
    console.log('  NO KALSHI CONTRACTS IN DATABASE AT ALL')

    // Try hitting the API directly
    console.log('\n  Trying Kalshi API directly...')
    try {
      const res = await fetch('https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=3')
      console.log(`  API status: ${res.status}`)
      if (res.ok) {
        const data = await res.json()
        console.log(`  Markets returned: ${(data.markets || []).length}`)
        for (const m of (data.markets || []).slice(0, 2)) {
          console.log(`    - ${m.title} (${m.ticker}) price=${m.last_price_dollars} vol=${m.volume}`)
        }
      } else {
        const text = await res.text()
        console.log(`  API error body: ${text.slice(0, 500)}`)
      }
    } catch (err) {
      console.log(`  API fetch error: ${err}`)
    }
  } else {
    console.log(`  Found ${kalshiSample.length} Kalshi contracts (showing top by volume):`)
    for (const c of kalshiSample) {
      console.log(`    ${c.contract_title}`)
      console.log(`      active: ${c.is_active}, event_id: ${c.event_id || 'NONE'}, vol: ${c.volume_total}, price: ${c.price}`)
    }
  }
}

main().catch(console.error)
