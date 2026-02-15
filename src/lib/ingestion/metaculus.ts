import { supabaseAdmin } from '@/lib/supabase/admin'

const METACULUS_API = 'https://www.metaculus.com/api2'

interface MetaculusQuestion {
  id: number
  title: string
  community_prediction: {
    full: { q2: number } // median forecast
  }
  number_of_forecasters: number
  resolve_time: string
  active_state: string
}

export async function fetchMetaculus() {
  // TODO: Implement full Metaculus ingestion
  // 1. Fetch active questions from Metaculus API
  // 2. Filter to questions matching our event mappings
  // 3. Normalize to source_contracts schema (prediction = price equivalent)
  // 4. Upsert into source_contracts table

  const response = await fetch(
    `${METACULUS_API}/questions/?status=open&type=binary&limit=100&order_by=-activity`,
    {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Token ${process.env.METACULUS_API_KEY}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Metaculus API error: ${response.status}`)
  }

  const data = await response.json()
  const questions: MetaculusQuestion[] = data.results || []

  // TODO: Map to our canonical events and upsert
  return { source: 'metaculus', count: questions.length }
}
