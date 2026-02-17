import { supabaseAdmin } from '@/lib/supabase/admin'

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

const VALID_CATEGORIES = [
  'trade_tariffs', 'sanctions_export_controls', 'military_conflict',
  'diplomacy_treaties', 'elections_political', 'monetary_policy',
  'fiscal_policy', 'regulation', 'economic_indicators',
  'technology_industry', 'science_environment',
]

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function queryHaiku(prompt: string, retries = 3): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
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

    if (response.status === 429 && attempt < retries) {
      const waitSec = Math.pow(2, attempt + 1) * 10 // 20s, 40s, 80s
      console.warn(`Rate limited, waiting ${waitSec}s before retry ${attempt + 1}/${retries}`)
      await sleep(waitSec * 1000)
      continue
    }

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Claude API error: ${response.status} ${err}`)
    }

    const data = await response.json()
    return data.content?.[0]?.text ?? ''
  }

  throw new Error('Exhausted retries on rate limit')
}

async function fetchUnmappedContracts(): Promise<SourceContract[]> {
  // Get already-mapped contract IDs so we skip them
  const { data: mapped } = await supabaseAdmin
    .from('event_source_mappings')
    .select('platform, platform_contract_id')
  const mappedSet = new Set((mapped || []).map(m => `${m.platform}:${m.platform_contract_id}`))

  // Also skip contracts already linked via event_id
  const { data: linked } = await supabaseAdmin
    .from('source_contracts')
    .select('platform, platform_contract_id')
    .not('event_id', 'is', null)
  const linkedSet = new Set((linked || []).map(l => `${l.platform}:${l.platform_contract_id}`))

  const skipSet = new Set([...mappedSet, ...linkedSet])

  // Fetch Polymarket contracts — exclude crypto price-bet noise and sports
  // so policy/geopolitics/macro contracts surface in the top results
  const { data: poly } = await supabaseAdmin
    .from('source_contracts')
    .select('platform, platform_contract_id, contract_title, price, liquidity, volume_total, num_traders')
    .eq('platform', 'polymarket')
    .eq('is_active', true)
    .is('event_id', null)
    .gt('liquidity', 100)
    // Crypto price-bet noise
    .not('contract_title', 'ilike', '%price above%')
    .not('contract_title', 'ilike', '%price below%')
    .not('contract_title', 'ilike', '%price direction%')
    .not('contract_title', 'ilike', '%price on %')
    .not('contract_title', 'ilike', '%reaches $%')
    // Sports noise
    .not('contract_title', 'ilike', '%Super Bowl%')
    .not('contract_title', 'ilike', '%NFL%')
    .not('contract_title', 'ilike', '%NBA%')
    .not('contract_title', 'ilike', '%MLB%')
    .not('contract_title', 'ilike', '%NHL%')
    .not('contract_title', 'ilike', '%UFC%')
    .not('contract_title', 'ilike', '%Premier League%')
    .not('contract_title', 'ilike', '%Champions League%')
    .not('contract_title', 'ilike', '%Grand Prix%')
    .not('contract_title', 'ilike', '%World Series%')
    .not('contract_title', 'ilike', '%Stanley Cup%')
    .order('liquidity', { ascending: false })
    .limit(1200)

  // Fetch Kalshi contracts (sports already excluded at ingestion)
  const { data: kalshi } = await supabaseAdmin
    .from('source_contracts')
    .select('platform, platform_contract_id, contract_title, price, liquidity, volume_total, num_traders')
    .eq('platform', 'kalshi')
    .eq('is_active', true)
    .is('event_id', null)
    .gt('liquidity', 50)
    .order('liquidity', { ascending: false })
    .limit(1200)

  // Fetch Metaculus
  const { data: metaculus } = await supabaseAdmin
    .from('source_contracts')
    .select('platform, platform_contract_id, contract_title, price, liquidity, volume_total, num_traders')
    .eq('platform', 'metaculus')
    .eq('is_active', true)
    .is('event_id', null)
    .gt('num_traders', 20)
    .order('num_traders', { ascending: false })
    .limit(500)

  // Round-robin interleave so each batch has contracts from all platforms
  const sources = [poly || [], kalshi || [], metaculus || []]
  const all: SourceContract[] = []
  const maxLen = Math.max(...sources.map(s => s.length))
  for (let i = 0; i < maxLen; i++) {
    for (const source of sources) {
      if (i < source.length) all.push(source[i] as SourceContract)
    }
  }
  return all.filter(c => !skipSet.has(`${c.platform}:${c.platform_contract_id}`))
}

async function fetchExistingEvents(): Promise<string> {
  const { data: events } = await supabaseAdmin
    .from('events')
    .select('id, title, category, resolution_date')
    .eq('is_active', true)
    .eq('resolution_status', 'open')
    .order('updated_at', { ascending: false })
    .limit(500)

  if (!events || events.length === 0) return ''

  const lines = events.map((e, i) => {
    const resolve = e.resolution_date ? `, resolves ${e.resolution_date}` : ''
    return `${i + 1}. ${e.id} — "${e.title}" (${e.category}${resolve})`
  }).join('\n')

  return `\nEXISTING EVENTS (reuse these IDs when a contract matches):\n${lines}\n`
}

async function proposeEvents(contracts: SourceContract[]): Promise<ProposedEvent[]> {
  const contractList = contracts.map((c, i) =>
    `${i + 1}. [${c.platform}] "${c.contract_title}" (id: ${c.platform_contract_id}, price: ${c.price}, liq: ${c.liquidity}, traders: ${c.num_traders})`
  ).join('\n')

  const existingEventsSection = await fetchExistingEvents()

  const prompt = `You are a prediction market analyst for Prythia, a prediction market intelligence platform.

Given these source contracts from prediction market platforms, identify CANONICAL EVENTS — unique real-world questions that may appear on multiple platforms with different wording.

${TAXONOMY}
${existingEventsSection}
IMPORTANT — Cross-platform matching:
- Different platforms word the SAME question very differently. For example these are all the same event:
  - Polymarket: "Will Trump raise tariffs on China?"
  - Kalshi: "US increases tariffs on Chinese imports before Oct 2026"
  - Metaculus: "Will the United States impose additional tariffs on China by Q4 2026?"
- Match by MEANING, not by title similarity. If two contracts predict the same real-world outcome, they belong to the same event regardless of wording.
- Also match contracts that are subsets or closely related (e.g. "Fed cuts rates in March" and "FOMC March 2026 rate decision" are the same event).

Rules:
- FIRST check if a contract matches an EXISTING EVENT above. If so, reuse that event_id exactly.
- Only create a NEW event if no existing event matches.
- When reusing an existing event, still include it in the output with the same event_id so the contract gets linked.
- AGGRESSIVELY group contracts across platforms — the primary goal is cross-platform deduplication.
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

  let jsonStr = response.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  try {
    return JSON.parse(jsonStr) as ProposedEvent[]
  } catch {
    // Attempt to recover truncated JSON by finding the last complete object
    const lastBrace = jsonStr.lastIndexOf('}')
    if (lastBrace > 0) {
      const recovered = jsonStr.substring(0, lastBrace + 1) + ']'
      console.warn('Recovered truncated JSON from Haiku response')
      return JSON.parse(recovered) as ProposedEvent[]
    }
    throw new Error('Could not parse Haiku response')
  }
}

async function insertEvents(events: ProposedEvent[]) {
  let eventsCreated = 0
  let mappingsCreated = 0

  // Pre-fetch which event IDs already exist so we skip upserting them
  const eventIds = events.filter(e => VALID_CATEGORIES.includes(e.category)).map(e => e.event_id)
  const { data: existing } = await supabaseAdmin
    .from('events')
    .select('id')
    .in('id', eventIds)
  const existingIds = new Set((existing || []).map(e => e.id))

  for (const event of events) {
    if (!VALID_CATEGORIES.includes(event.category)) continue

    if (!existingIds.has(event.event_id)) {
      const { error: eventError } = await supabaseAdmin
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
        console.error(`Event upsert error [${event.event_id}]:`, eventError.message)
        continue
      }
      eventsCreated++
    }

    // Always create mappings — for both new and existing events
    for (const sc of event.source_contracts) {
      const { error: mapError } = await supabaseAdmin
        .from('event_source_mappings')
        .upsert({
          event_id: event.event_id,
          platform: sc.platform,
          platform_contract_id: sc.platform_contract_id,
          confidence: 'ai_high',
          mapped_by: 'claude-haiku',
        }, { onConflict: 'platform,platform_contract_id' })

      if (mapError) {
        console.error(`Mapping error [${sc.platform}:${sc.platform_contract_id}]:`, mapError.message)
        continue
      }
      mappingsCreated++

      await supabaseAdmin
        .from('source_contracts')
        .update({ event_id: event.event_id })
        .eq('platform', sc.platform)
        .eq('platform_contract_id', sc.platform_contract_id)
    }
  }

  return { eventsCreated, mappingsCreated }
}

/**
 * Run the auto-mapper with a time budget.
 * Processes unmapped contracts in batches until time runs out or all are done.
 *
 * @param timeBudgetMs - Max time to spend (default: 240s, safe for Vercel 300s limit)
 */
export async function runAutoMapper(timeBudgetMs = 240_000) {
  const startTime = Date.now()
  const deadline = startTime + timeBudgetMs
  const BATCH_SIZE = 50

  const contracts = await fetchUnmappedContracts()

  if (contracts.length === 0) {
    return {
      contractsFound: 0,
      batchesProcessed: 0,
      eventsCreated: 0,
      mappingsCreated: 0,
      duration_ms: Date.now() - startTime,
    }
  }

  let totalEvents = 0
  let totalMappings = 0
  let batchesProcessed = 0

  for (let i = 0; i < contracts.length; i += BATCH_SIZE) {
    // Check time budget before starting a new batch
    if (Date.now() > deadline) {
      console.log(`Time budget reached after ${batchesProcessed} batches`)
      break
    }

    const batch = contracts.slice(i, i + BATCH_SIZE)

    try {
      const proposed = await proposeEvents(batch)
      const result = await insertEvents(proposed)
      totalEvents += result.eventsCreated
      totalMappings += result.mappingsCreated
      batchesProcessed++
    } catch (err) {
      console.error(`Batch ${batchesProcessed + 1} failed:`, err instanceof Error ? err.message : err)
      batchesProcessed++
    }

    // Rate limit between batches — 7s gap to stay under 10k output tokens/min
    if (i + BATCH_SIZE < contracts.length && Date.now() < deadline) {
      await sleep(7000)
    }
  }

  return {
    contractsFound: contracts.length,
    batchesProcessed,
    eventsCreated: totalEvents,
    mappingsCreated: totalMappings,
    duration_ms: Date.now() - startTime,
  }
}
