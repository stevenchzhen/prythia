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
  outcome_type?: 'binary' | 'price_bracket' | 'categorical'
  parent_event_id?: string
  outcome_label?: string
  outcome_index?: number
  source_contracts: Array<{
    platform: string
    platform_contract_id: string
  }>
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface HaikuResponse {
  text: string
  truncated: boolean
}

async function queryHaiku(prompt: string, retries = 3): Promise<HaikuResponse> {
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
    const truncated = data.stop_reason === 'max_tokens'
    if (truncated) {
      console.warn(`Haiku response truncated (hit max_tokens)`)
    }
    return { text: data.content?.[0]?.text ?? '', truncated }
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
    // Crypto short-term noise (keep meaningful price brackets for grouping)
    .not('contract_title', 'ilike', '%price direction%')
    .not('contract_title', 'ilike', '%Up or Down%')
    .not('contract_title', 'ilike', '%5-min%')
    .not('contract_title', 'ilike', '%1-hour%')
    .not('contract_title', 'ilike', '%daily close%')
    // Sports & esports noise
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
    .not('contract_title', 'ilike', '% vs %')
    .not('contract_title', 'ilike', '%Counter-Strike%')
    .not('contract_title', 'ilike', '%Dota 2%')
    .not('contract_title', 'ilike', '%Map Winner%')
    .not('contract_title', 'ilike', '%Map Handicap%')
    .not('contract_title', 'ilike', '%O/U %')
    .not('contract_title', 'ilike', '%Set 1 Winner%')
    .not('contract_title', 'ilike', '%temperature%')
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

MULTI-OUTCOME TOPICS:
When you see contracts that are different outcomes of the SAME question (e.g. price brackets, categorical options), group them as follows:
1. Create ONE parent event with outcome_type = "price_bracket" or "categorical"
   - Parent title should be the base question: "Bitcoin price end of 2026"
   - Parent event has NO source_contracts (it's a container)
2. Create CHILD events for each outcome, each with:
   - parent_event_id = the parent's event_id
   - outcome_label = the specific outcome (e.g. "$50k-$60k", "Cardinal Tagle")
   - outcome_index = sort order (0, 1, 2, ...)
   - source_contracts = the actual contracts for this outcome

Examples of multi-outcome topics:
- "Bitcoin price $50k-$60k", "$60k-$70k", "$70k-$80k" → parent: "Bitcoin price end of 2026", type: price_bracket
- "Next Pope: Cardinal Tagle", "Cardinal Zuppi", etc → parent: "Identity of next Pope", type: categorical
- "Fed rate 4.0-4.25%", "4.25-4.5%", "4.5-4.75%" → parent: "Fed funds rate Dec 2026", type: price_bracket

Standard binary events should have outcome_type = "binary" (or omit the field).

Rules:
- FIRST check if a contract matches an EXISTING EVENT above. If so, reuse that event_id exactly.
- Only create a NEW event if no existing event matches.
- When reusing an existing event, still include it in the output with the same event_id so the contract gets linked.
- AGGRESSIVELY group contracts across platforms — the primary goal is cross-platform deduplication.
- Skip trivial/noise contracts (short-term crypto price direction bets like "5-min" or "Up or Down today", sports matches, entertainment gossip)
- DO include meaningful crypto/asset price brackets (end-of-year price, specific date) — group them as multi-outcome
- Focus on: geopolitics, trade, economics, policy, elections, technology, science
- Generate a clear event_id like "evt_us_china_tariff_q3_2026" (lowercase, underscores)
- Generate a URL-friendly slug like "us-china-tariff-increase-q3-2026"
- Set resolution_date as ISO date string if determinable from the title, otherwise null
- Include relevant tags (3-6 per event)

Source contracts:
${contractList}

Respond with ONLY a JSON array of proposed events. No markdown, no explanation. Example format:
[
  {
    "event_id": "evt_btc_price_eoy_2026",
    "title": "Bitcoin price end of 2026",
    "slug": "bitcoin-price-end-of-2026",
    "description": "What will the price of Bitcoin be at the end of 2026?",
    "category": "technology_industry",
    "subcategory": "crypto",
    "tags": ["bitcoin", "crypto", "price"],
    "resolution_date": "2026-12-31",
    "outcome_type": "price_bracket",
    "source_contracts": []
  },
  {
    "event_id": "evt_btc_price_eoy_2026_50k_60k",
    "title": "Bitcoin price $50k-$60k end of 2026",
    "slug": "bitcoin-price-50k-60k-end-of-2026",
    "description": "Will Bitcoin be between $50,000 and $60,000 at the end of 2026?",
    "category": "technology_industry",
    "subcategory": "crypto",
    "tags": ["bitcoin", "crypto", "price"],
    "resolution_date": "2026-12-31",
    "outcome_type": "price_bracket",
    "parent_event_id": "evt_btc_price_eoy_2026",
    "outcome_label": "$50k-$60k",
    "outcome_index": 0,
    "source_contracts": [
      {"platform": "polymarket", "platform_contract_id": "0xabc..."}
    ]
  },
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

  const { text: response, truncated } = await queryHaiku(prompt)

  let jsonStr = response.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  try {
    return JSON.parse(jsonStr) as ProposedEvent[]
  } catch {
    if (!truncated) {
      console.error('Haiku returned invalid (non-truncated) JSON:', jsonStr.slice(0, 200))
      throw new Error('Could not parse Haiku response')
    }

    // Truncated response — find last complete JSON object in the array
    // Walk backwards to find a `}` that closes a complete top-level object
    const recovered = recoverTruncatedJsonArray(jsonStr)
    if (recovered) {
      console.warn(`Recovered ${recovered.length} events from truncated Haiku response`)
      return recovered
    }
    throw new Error('Could not recover truncated JSON')
  }
}

/**
 * Recover a truncated JSON array by finding the last complete object.
 * Tracks brace/bracket depth and string context to find safe cut points.
 */
function recoverTruncatedJsonArray(input: string): ProposedEvent[] | null {
  // Find the opening bracket
  const arrayStart = input.indexOf('[')
  if (arrayStart < 0) return null

  let lastCompleteObject = -1
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = arrayStart + 1; i < input.length; i++) {
    const ch = input[i]

    if (escaped) {
      escaped = false
      continue
    }

    if (ch === '\\' && inString) {
      escaped = true
      continue
    }

    if (ch === '"') {
      inString = !inString
      continue
    }

    if (inString) continue

    if (ch === '{' || ch === '[') {
      depth++
    } else if (ch === '}' || ch === ']') {
      depth--
      if (depth === 0 && ch === '}') {
        // This closes a top-level object in the array
        lastCompleteObject = i
      }
    }
  }

  if (lastCompleteObject < 0) return null

  const recovered = input.substring(arrayStart, lastCompleteObject + 1) + ']'
  try {
    return JSON.parse(recovered) as ProposedEvent[]
  } catch {
    return null
  }
}

async function insertEvents(events: ProposedEvent[]) {
  let eventsCreated = 0
  let mappingsCreated = 0

  // Sort: parent events first (no parent_event_id), then children
  const sorted = [...events].sort((a, b) => {
    const aIsParent = !a.parent_event_id ? 0 : 1
    const bIsParent = !b.parent_event_id ? 0 : 1
    return aIsParent - bIsParent
  })

  // Pre-fetch which event IDs already exist so we skip upserting them
  const eventIds = sorted.filter(e => VALID_CATEGORIES.includes(e.category)).map(e => e.event_id)
  const { data: existing } = await supabaseAdmin
    .from('events')
    .select('id')
    .in('id', eventIds)
  const existingIds = new Set((existing || []).map(e => e.id))

  for (const event of sorted) {
    if (!VALID_CATEGORIES.includes(event.category)) continue

    if (!existingIds.has(event.event_id)) {
      const eventRow = {
        id: event.event_id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        category: event.category,
        subcategory: event.subcategory || null,
        tags: event.tags,
        resolution_date: event.resolution_date || null,
        resolution_status: 'open' as const,
        is_active: true,
        parent_event_id: event.parent_event_id || null,
        outcome_type: event.outcome_type || 'binary',
        outcome_label: event.outcome_label || null,
        outcome_index: event.outcome_index ?? null,
      }

      // Try with original slug, fall back to slug-from-event-id on conflict
      const { error: eventError } = await supabaseAdmin
        .from('events')
        .upsert(eventRow, { onConflict: 'id' })

      if (eventError?.message?.includes('events_slug_key')) {
        // Slug collision with a different event — retry with event_id as slug
        eventRow.slug = event.event_id.replace(/_/g, '-')
        const { error: retryError } = await supabaseAdmin
          .from('events')
          .upsert(eventRow, { onConflict: 'id' })

        if (retryError) {
          console.error(`Event upsert error [${event.event_id}]:`, retryError.message)
          continue
        }
      } else if (eventError) {
        console.error(`Event upsert error [${event.event_id}]:`, eventError.message)
        continue
      }
      eventsCreated++
      existingIds.add(event.event_id)
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
  const BATCH_SIZE = 25

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
