import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log('=== Source Contracts (using count queries to avoid 1000-row limit) ===\n')

  for (const platform of ['polymarket', 'kalshi', 'metaculus']) {
    const { count: total } = await sb.from('source_contracts').select('*', { count: 'exact', head: true }).eq('platform', platform)
    const { count: active } = await sb.from('source_contracts').select('*', { count: 'exact', head: true }).eq('platform', platform).eq('is_active', true)
    const { count: mapped } = await sb.from('source_contracts').select('*', { count: 'exact', head: true }).eq('platform', platform).not('event_id', 'is', null)
    const { count: activeMapped } = await sb.from('source_contracts').select('*', { count: 'exact', head: true }).eq('platform', platform).eq('is_active', true).not('event_id', 'is', null)
    const { count: activeOrphaned } = await sb.from('source_contracts').select('*', { count: 'exact', head: true }).eq('platform', platform).eq('is_active', true).is('event_id', null)

    console.log(`${platform}:`)
    console.log(`  Total rows:          ${total}`)
    console.log(`  Active:              ${active}`)
    console.log(`  Mapped (has event):  ${mapped}`)
    console.log(`  Active + mapped:     ${activeMapped}`)
    console.log(`  Active + orphaned:   ${activeOrphaned}`)
    console.log()
  }

  // Events
  const { count: totalEvents } = await sb.from('events').select('*', { count: 'exact', head: true })
  const { count: openActive } = await sb.from('events').select('*', { count: 'exact', head: true }).eq('resolution_status', 'open').eq('is_active', true)
  const { count: withSources } = await sb.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true).gt('source_count', 0)
  const { count: multiSource } = await sb.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true).gt('source_count', 1)
  const { count: withVol } = await sb.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true).gt('volume_24h', 0)
  const { count: withProb } = await sb.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true).not('prob_change_24h', 'is', null)
  const { count: goodQ } = await sb.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true).gt('quality_score', 0.3)

  console.log('=== Events ===\n')
  console.log(`Total:                    ${totalEvents}`)
  console.log(`Open & active:            ${openActive}`)
  console.log(`With source_count > 0:    ${withSources}`)
  console.log(`With source_count > 1:    ${multiSource}  (cross-platform)`)
  console.log(`With volume_24h > 0:      ${withVol}`)
  console.log(`With prob_change_24h:     ${withProb}`)
  console.log(`With quality_score > 0.3: ${goodQ}`)

  // What platforms are linked to events? (per-event breakdown)
  console.log('\n=== Events with Sources — Platform Breakdown ===\n')
  const { data: eventsWithSources } = await sb
    .from('events')
    .select('id, title, source_count, quality_score, volume_total, probability')
    .eq('is_active', true)
    .gt('source_count', 0)
    .order('source_count', { ascending: false })
    .limit(20)

  for (const e of eventsWithSources || []) {
    const { data: srcs } = await sb
      .from('source_contracts')
      .select('platform, price, volume_total, is_active')
      .eq('event_id', e.id)

    const platforms = (srcs || []).map(s => `${s.platform}${s.is_active ? '' : '(inactive)'}`)
    console.log(`  [${e.source_count} src, q=${e.quality_score}] ${e.title}`)
    console.log(`    platforms: ${platforms.join(', ')}`)
  }

  // Kalshi deep dive — show non-sports contracts
  console.log('\n=== Kalshi: Non-Sports Contracts (if any) ===\n')
  const { data: kalshiAll } = await sb
    .from('source_contracts')
    .select('platform_contract_id, contract_title, price, volume_total, is_active')
    .eq('platform', 'kalshi')
    .eq('is_active', true)
    .order('volume_total', { ascending: false })
    .limit(50)

  const sportsKeywords = /wins by|goals scored|Over \d|Under \d|points scored|parlay|Auger|Linette|Halys|Samsonova/i
  const nonSports = (kalshiAll || []).filter(c => !sportsKeywords.test(c.contract_title))
  const sports = (kalshiAll || []).filter(c => sportsKeywords.test(c.contract_title))

  console.log(`  Sports/parlay contracts in top 50: ${sports.length}`)
  console.log(`  Non-sports contracts in top 50: ${nonSports.length}`)

  if (nonSports.length > 0) {
    console.log('\n  Non-sports samples:')
    for (const c of nonSports.slice(0, 10)) {
      console.log(`    ${c.contract_title}`)
      console.log(`      ticker: ${c.platform_contract_id}, price: ${c.price}, vol: ${c.volume_total}`)
    }
  }

  if (sports.length > 0) {
    console.log('\n  Sports samples (first 3):')
    for (const c of sports.slice(0, 3)) {
      console.log(`    ${c.contract_title.slice(0, 120)}...`)
      console.log(`      ticker: ${c.platform_contract_id}, price: ${c.price}, vol: ${c.volume_total}`)
    }
  }

  // Check Kalshi API for what market_type and categories are coming through
  console.log('\n=== Kalshi API: Market Types & Event Tickers ===\n')
  try {
    const res = await fetch('https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=20')
    if (res.ok) {
      const data = await res.json()
      const tickers = new Set<string>()
      for (const m of data.markets || []) {
        tickers.add(m.event_ticker)
      }
      console.log(`  Sample event_tickers: ${[...tickers].slice(0, 10).join(', ')}`)
      console.log(`  Sample titles:`)
      for (const m of (data.markets || []).slice(0, 5)) {
        console.log(`    [${m.market_type}] ${m.title} (ticker: ${m.ticker}, event: ${m.event_ticker})`)
      }
    }
  } catch (err) {
    console.log(`  API error: ${err}`)
  }

  // Snapshots per source
  console.log('\n=== Snapshots by Source ===\n')
  for (const source of ['aggregated', 'polymarket', 'kalshi', 'metaculus']) {
    const { count } = await sb.from('probability_snapshots').select('*', { count: 'exact', head: true }).eq('source', source)
    console.log(`  ${source}: ${count}`)
  }
}

main().catch(console.error)
