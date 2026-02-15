import { supabaseAdmin } from '@/lib/supabase/admin'

const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2'

interface KalshiMarket {
  ticker: string
  title: string
  yes_bid: number
  yes_ask: number
  volume: number
  open_interest: number
  close_time: string
  status: string
}

export async function fetchKalshi() {
  // TODO: Implement full Kalshi ingestion
  // 1. Fetch active markets from Kalshi API (may need auth headers)
  // 2. Filter to markets matching our event mappings
  // 3. Normalize to source_contracts schema
  // 4. Upsert into source_contracts table

  const response = await fetch(`${KALSHI_API}/markets?status=open&limit=100`, {
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${process.env.KALSHI_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Kalshi API error: ${response.status}`)
  }

  const data = await response.json()
  const markets: KalshiMarket[] = data.markets || []

  // TODO: Map to our canonical events and upsert
  return { source: 'kalshi', count: markets.length }
}
