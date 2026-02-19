import { supabaseAdmin } from '@/lib/supabase/admin'

const METACULUS_API = 'https://www.metaculus.com/api2'

/**
 * Metaculus question from the /questions/ endpoint.
 * Community prediction is nested at question.aggregations.recency_weighted.latest.centers[0]
 */
interface MetaculusPost {
  id: number
  title: string
  slug: string
  status: string
  nr_forecasters: number
  forecasts_count: number
  created_at: string
  published_at: string
  scheduled_close_time: string
  scheduled_resolve_time: string
  question: {
    id: number
    type: string
    status: string
    aggregations: {
      recency_weighted: {
        latest: {
          centers: number[]
          forecast_values: number[]
          forecaster_count: number
        } | null
      }
    }
  }
  projects: {
    category?: Array<{
      id: number
      name: string
      slug: string
    }>
  }
}

interface MetaculusResponse {
  count: number
  next: string | null
  results: MetaculusPost[]
}

/**
 * Fetch binary questions from Metaculus, paginating through all results.
 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchAllQuestions(): Promise<MetaculusPost[]> {
  const allQuestions: MetaculusPost[] = []
  const PAGE_SIZE = 50  // Smaller pages to avoid rate limits
  const MAX_RETRIES = 3  // Max consecutive 429 retries per page
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const url = `${METACULUS_API}/questions/?status=open&type=binary&limit=${PAGE_SIZE}&offset=${offset}&order_by=-forecasters_count`

    let retries = 0
    let response: Response | null = null

    while (retries < MAX_RETRIES) {
      response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${process.env.METACULUS_API_KEY}`,
        },
      })

      if (response.status === 429) {
        retries++
        console.warn(`Metaculus rate limited (attempt ${retries}/${MAX_RETRIES}), waiting 5s...`)
        await sleep(5000)
        continue
      }
      break
    }

    if (!response || response.status === 429) {
      console.error(`Metaculus rate limited after ${MAX_RETRIES} retries at offset ${offset}, stopping`)
      break
    }

    if (!response.ok) {
      throw new Error(`Metaculus API error: ${response.status}`)
    }

    const data: MetaculusResponse = await response.json()
    allQuestions.push(...data.results)

    if (!data.next || data.results.length < PAGE_SIZE) {
      hasMore = false
    } else {
      offset += PAGE_SIZE
      // Respect rate limits: pause between requests
      await sleep(1000)
    }

    // Safety cap: fetch top 500 most-forecasted questions
    if (offset >= 500) break
  }

  return allQuestions
}

/**
 * Extract the community prediction probability from a Metaculus question.
 * For binary questions, this is the first center value.
 */
function extractProbability(question: MetaculusPost['question']): number | null {
  const latest = question?.aggregations?.recency_weighted?.latest
  if (!latest || !latest.centers || latest.centers.length === 0) return null

  const prob = latest.centers[0]
  if (prob < 0 || prob > 1) return null
  return Math.round(prob * 10000) / 10000
}

/**
 * Full Metaculus ingestion pipeline:
 * 1. Fetch all open binary questions
 * 2. Filter to questions with community predictions
 * 3. Normalize to source_contracts schema
 * 4. Upsert into Supabase
 */
export async function fetchMetaculus() {
  const questions = await fetchAllQuestions()

  const contracts = questions
    .map((q) => {
      const probability = extractProbability(q.question)
      if (probability === null) return null

      const forecasterCount = q.question?.aggregations?.recency_weighted?.latest?.forecaster_count || q.nr_forecasters || 0

      // Use published_at as last_trade_at baseline, but cap staleness at 48h.
      // We don't know exactly when the last forecast was placed, so this is an
      // honest approximation: recently-published questions get freshness credit,
      // long-running questions get partial credit via the 72h forecast decay window.
      const publishedAt = new Date(q.published_at || q.created_at)
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
      const lastTradeAt = publishedAt > fortyEightHoursAgo
        ? publishedAt.toISOString()
        : fortyEightHoursAgo.toISOString()

      return {
        platform: 'metaculus' as const,
        platform_contract_id: String(q.id),
        platform_url: `https://www.metaculus.com/questions/${q.id}/${q.slug}/`,
        contract_title: q.title,
        price: probability,
        volume_24h: 0,            // Metaculus has no volume — it's a forecasting platform
        volume_total: 0,
        liquidity: 0,
        num_traders: forecasterCount,
        last_trade_at: lastTradeAt,
        updated_at: new Date().toISOString(),
        is_active: true,
      }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)

  if (contracts.length === 0) {
    return { source: 'metaculus', count: 0, upserted: 0 }
  }

  // Mark all Metaculus contracts inactive first, then upsert re-activates current ones.
  // This avoids a massive NOT IN clause that can exceed URL length limits.
  const { error: deactivateError } = await supabaseAdmin
    .from('source_contracts')
    .update({ is_active: false })
    .eq('platform', 'metaculus')
    .eq('is_active', true)

  if (deactivateError) {
    console.error('Metaculus deactivation error:', deactivateError)
  }

  // Upsert in batches (re-activates current contracts via is_active: true)
  const BATCH_SIZE = 100
  let upserted = 0

  for (let i = 0; i < contracts.length; i += BATCH_SIZE) {
    const batch = contracts.slice(i, i + BATCH_SIZE)
    const { error } = await supabaseAdmin
      .from('source_contracts')
      .upsert(batch, {
        onConflict: 'platform,platform_contract_id',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`Metaculus upsert error (batch ${i}):`, error)
    } else {
      upserted += batch.length
    }
  }

  return {
    source: 'metaculus',
    count: contracts.length,
    upserted,
    questions_fetched: questions.length,
  }
}
