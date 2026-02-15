/**
 * Auto-map source contracts to canonical Prythia events using Claude Haiku.
 *
 * Usage: npx tsx scripts/auto-map-events.ts
 *
 * This script:
 * 1. Fetches high-signal source contracts from Supabase (filtered by liquidity/forecasters)
 * 2. Sends batches to Claude Haiku to propose canonical events + taxonomy mappings
 * 3. Creates canonical events in the events table
 * 4. Links source contracts via event_source_mappings
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

const TAXONOMY = `
Categories (use these exact slugs):
- trade_tariffs (parent: geopolitics) — tariffs, trade deals, customs, import/export
- sanctions_export_controls (parent: geopolitics) — sanctions, export bans, restrictions
- military_conflict (parent: geopolitics) — wars, military action, defense
- diplomacy_treaties (parent: geopolitics) — summits, treaties, bilateral relations
- elections_political (parent: geopolitics) — elections, leadership changes, political transitions
- monetary_policy (parent: economics_policy) — central bank rates, Fed, ECB, BOJ
- fiscal_policy (parent: economics_policy) — taxes, spending, debt ceiling
- regulation (parent: economics_policy) — tech regulation, financial regulation, ESG
- economic_indicators (parent: economics_policy) — GDP, inflation, employment, CPI
- technology_industry — AI, crypto, energy, healthcare, space, supply chain
- science_environment — climate, pandemics, natural disasters, scientific milestones
`

interface SourceContract {
  platform: string
  platform_contract_id: string
  contract_title: string
  price: number
  liquidity: number
  volume_total: number
  num_traders: number
}

interface ProposedEvent {
  event_id: string
  title: string
  slug: string
  description: string
  category: string
  subcategory: string
  tags: string[]
  resolution_date: string | null
  source_contracts: Array<{
    platform: string
    platform_contract_id: string
  }>
}

async function queryHaiku(prompt: string): Promise<string> {
  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error: ${response.status} ${err}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text ?? ''
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchHighSignalContracts(): Promise<SourceContract[]> {
  // Get already-mapped contract IDs so we skip them
  const { data: mapped } = await supabase
    .from('event_source_mappings')
    .select('platform, platform_contract_id')
  const mappedSet = new Set((mapped || []).map(m => `${m.platform}:${m.platform_contract_id}`))

  // Also skip contracts already linked via event_id
  const { data: linked } = await supabase
    .from('source_contracts')
    .select('platform, platform_contract_id')
    .not('event_id', 'is', null)
  const linkedSet = new Set((linked || []).map(l => `${l.platform}:${l.platform_contract_id}`))

  const skipSet = new Set([...mappedSet, ...linkedSet])

  // Fetch Polymarket contracts with decent liquidity
  const { data: poly } = await supabase
    .from('source_contracts')
    .select('platform, platform_contract_id, contract_title, price, liquidity, volume_total, num_traders')
    .eq('platform', 'polymarket')
    .eq('is_active', true)
    .is('event_id', null)
    .gt('liquidity', 5000)
    .order('liquidity', { ascending: false })
    .limit(300)

  // Fetch Kalshi contracts not yet mapped
  const { data: kalshi } = await supabase
    .from('source_contracts')
    .select('platform, platform_contract_id, contract_title, price, liquidity, volume_total, num_traders')
    .eq('platform', 'kalshi')
    .eq('is_active', true)
    .is('event_id', null)
    .gt('liquidity', 100)
    .order('liquidity', { ascending: false })
    .limit(300)

  // Fetch Metaculus with most forecasters, not yet mapped
  const { data: metaculus } = await supabase
    .from('source_contracts')
    .select('platform, platform_contract_id, contract_title, price, liquidity, volume_total, num_traders')
    .eq('platform', 'metaculus')
    .eq('is_active', true)
    .is('event_id', null)
    .gt('num_traders', 10)
    .order('num_traders', { ascending: false })
    .limit(200)

  const all = [...(poly || []), ...(kalshi || []), ...(metaculus || [])] as SourceContract[]

  // Filter out already-mapped
  const unmapped = all.filter(c => !skipSet.has(`${c.platform}:${c.platform_contract_id}`))
  console.log(`  (${all.length - unmapped.length} already mapped, skipping)`)

  return unmapped
}

async function proposeEvents(contracts: SourceContract[]): Promise<ProposedEvent[]> {
  // Format contracts for the prompt
  const contractList = contracts.map((c, i) =>
    `${i + 1}. [${c.platform}] "${c.contract_title}" (id: ${c.platform_contract_id}, price: ${c.price}, liq: ${c.liquidity}, traders: ${c.num_traders})`
  ).join('\n')

  const prompt = `You are a prediction market analyst for Prythia, a prediction market intelligence platform.

Given these source contracts from prediction market platforms, identify CANONICAL EVENTS — unique real-world questions that may appear on multiple platforms with different wording.

${TAXONOMY}

Rules:
- Group contracts about the SAME real-world question into one canonical event (cross-platform deduplication)
- Skip trivial/noise contracts (crypto price 5-min bets, sports matches, entertainment gossip)
- Focus on: geopolitics, trade, economics, policy, elections, technology, science — the things that matter to analysts and quant funds
- Generate a clear event_id like "evt_us_china_tariff_q3_2026" (lowercase, underscores)
- Generate a URL-friendly slug like "us-china-tariff-increase-q3-2026"
- Set resolution_date as ISO date string if determinable from the title, otherwise null
- Include relevant tags (3-6 per event)

Source contracts:
${contractList}

Respond with ONLY a JSON array of proposed events. No markdown, no explanation. Example format:
[
  {
    "event_id": "evt_fed_rate_mar_2026",
    "title": "Fed cuts rates at March 2026 meeting",
    "slug": "fed-rate-cut-march-2026",
    "description": "Will the Federal Reserve cut the federal funds rate at the March 2026 FOMC meeting?",
    "category": "monetary_policy",
    "subcategory": "fed_decisions",
    "tags": ["fed", "interest-rates", "fomc"],
    "resolution_date": "2026-03-19",
    "source_contracts": [
      {"platform": "polymarket", "platform_contract_id": "0xabc..."},
      {"platform": "kalshi", "platform_contract_id": "FED-26MAR-T50"}
    ]
  }
]`

  const response = await queryHaiku(prompt)

  // Parse JSON from response (handle potential markdown wrapping)
  let jsonStr = response.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  try {
    return JSON.parse(jsonStr) as ProposedEvent[]
  } catch (err) {
    console.error('Failed to parse AI response:', jsonStr.substring(0, 500))
    throw new Error('Failed to parse AI response as JSON')
  }
}

async function insertEvents(events: ProposedEvent[]) {
  let eventsCreated = 0
  let mappingsCreated = 0

  for (const event of events) {
    // Validate category exists
    const validCategories = [
      'trade_tariffs', 'sanctions_export_controls', 'military_conflict',
      'diplomacy_treaties', 'elections_political', 'monetary_policy',
      'fiscal_policy', 'regulation', 'economic_indicators',
      'technology_industry', 'science_environment',
    ]
    if (!validCategories.includes(event.category)) {
      console.warn(`  Skipping "${event.title}" — invalid category: ${event.category}`)
      continue
    }

    // Upsert canonical event
    const { error: eventError } = await supabase
      .from('events')
      .upsert({
        id: event.event_id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        category: event.category,
        subcategory: event.subcategory || null,
        tags: event.tags,
        resolution_date: event.resolution_date || null,
        resolution_status: 'open',
        is_active: true,
      }, { onConflict: 'id' })

    if (eventError) {
      console.error(`  Event upsert error [${event.event_id}]:`, eventError.message)
      continue
    }
    eventsCreated++

    // Insert source contract mappings
    for (const sc of event.source_contracts) {
      const { error: mapError } = await supabase
        .from('event_source_mappings')
        .upsert({
          event_id: event.event_id,
          platform: sc.platform,
          platform_contract_id: sc.platform_contract_id,
          confidence: 'ai_high',
          mapped_by: 'claude-haiku',
        }, { onConflict: 'platform,platform_contract_id' })

      if (mapError) {
        console.error(`  Mapping error [${sc.platform}:${sc.platform_contract_id}]:`, mapError.message)
        continue
      }
      mappingsCreated++

      // Also link the source_contract to the event
      await supabase
        .from('source_contracts')
        .update({ event_id: event.event_id })
        .eq('platform', sc.platform)
        .eq('platform_contract_id', sc.platform_contract_id)
    }
  }

  return { eventsCreated, mappingsCreated }
}

async function main() {
  console.log('═══ Prythia Auto-Mapper ═══\n')

  // 1. Fetch high-signal contracts
  console.log('Fetching high-signal contracts...')
  const contracts = await fetchHighSignalContracts()
  console.log(`  Found ${contracts.length} contracts\n`)

  if (contracts.length === 0) {
    console.log('No contracts to map. Run ingestion first.')
    return
  }

  // 2. Process in batches of 80 (to fit in context window)
  const BATCH_SIZE = 80
  let totalEvents = 0
  let totalMappings = 0

  for (let i = 0; i < contracts.length; i += BATCH_SIZE) {
    const batch = contracts.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(contracts.length / BATCH_SIZE)

    console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} contracts)...`)

    try {
      const proposed = await proposeEvents(batch)
      console.log(`  AI proposed ${proposed.length} canonical events`)

      const result = await insertEvents(proposed)
      totalEvents += result.eventsCreated
      totalMappings += result.mappingsCreated

      console.log(`  Inserted: ${result.eventsCreated} events, ${result.mappingsCreated} mappings\n`)
    } catch (err) {
      console.error(`  Batch ${batchNum} failed:`, err instanceof Error ? err.message : err)
    }

    // Rate limit between batches
    if (i + BATCH_SIZE < contracts.length) {
      await sleep(2000)
    }
  }

  console.log('═══════════════════════════')
  console.log(`Total: ${totalEvents} events created, ${totalMappings} mappings`)
  console.log('═══════════════════════════')

  // 3. Run aggregation for newly mapped events
  console.log('\nRunning aggregation for mapped events...')
  const { aggregateAllEvents } = await import('../src/lib/ingestion/aggregator.ts')
  const aggResult = await aggregateAllEvents()
  console.log(`Aggregated: ${aggResult.eventsUpdated}/${aggResult.eventsProcessed} events`)

  console.log('\nDone! Check your Supabase dashboard to review the mapped events.')
}

main().catch(console.error)
